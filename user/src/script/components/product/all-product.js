import { apiGet } from '../../utils/apiService.js';
import { fetchItemRecommendations, fetchSearchRecommendations } from '../../utils/mlApiService.js';

class AllProduct extends HTMLElement {
    constructor() {
        super();
        this.items = [];
        this.isLoading = true;
        this.error = null;
        this.searchRecommendations = [];
        this.isLoadingSearchRecommendations = false;
        this.searchRecommendationsError = null;
        this.currentSearchKeyword = '';

        this.fetchItems = this.fetchItems.bind(this);
        this.handleSearchEvent = this.handleSearchEvent.bind(this);
        this.fetchSearchRecommendations = this.fetchSearchRecommendations.bind(this);
    }

    connectedCallback() {
        this.render();
        this.fetchItems();

        document.addEventListener('search', this.handleSearchEvent);
        console.log('AllProduct component: Added search event listener on document.');
    }

    disconnectedCallback() {
        document.removeEventListener('search', this.handleSearchEvent);
        console.log('AllProduct component: Removed search event listener from document.');
    }

    handleSearchEvent(event) {
        console.log('AllProduct component: Received search event.', event.detail.params);
        const searchTerm = event.detail.params.search || '';

        this.currentSearchKeyword = searchTerm;

        this.fetchItems({ search: searchTerm });

        if (searchTerm) {
            this.fetchSearchRecommendations(searchTerm);
        } else {
            this.searchRecommendations = [];
            this.isLoadingSearchRecommendations = false;
            this.searchRecommendationsError = null;
            this.render();
        }
    }

    async fetchItems(params = {}) {
        this.isLoading = true;
        this.error = null;
        this.items = [];
        this.render();

        try {
            const queryString = Object.keys(params)
                .map(key => {
                    return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
                })
                .join('&');

            const url = queryString ? `/items?${queryString}` : '/items';

            console.log('Fetching items from URL:', url);
            const result = await apiGet(url);
            console.log('Fetched items:', result);

            if (result.status === 'success') {
                this.items = Array.isArray(result.data) ? result.data : [];
                this.isLoading = false;
                this.error = null;

            } else {
                console.error('Failed to fetch items (API error):', result.message || 'Unknown error', result);
                this.items = [];
                this.error = result.message || 'Gagal memuat item.';
                this.isLoading = false;
            }
        } catch (error) {
            console.error('Error fetching items:', error);
            this.items = [];
            this.error = error.message || 'Terjadi kesalahan saat memuat item.';
            this.isLoading = false;
        } finally {
            this.render();
        }
    }

    async fetchSearchRecommendations(keyword) {
        if (!keyword || keyword.trim() === '') {
            this.searchRecommendations = [];
            this.isLoadingSearchRecommendations = false;
            this.searchRecommendationsError = null;
            this.render();
            return;
        }

        this.isLoadingSearchRecommendations = true;
        this.searchRecommendationsError = null;
        this.render();

        const topN = 5;

        try {
            console.log(`Fetching initial Search Based recommendations for keyword: "${keyword}" from ML API.`);
            const mlResult = await fetchSearchRecommendations(keyword, topN);
            console.log('Fetched initial Search Based recommendations from ML API:', mlResult);

            if (mlResult && Array.isArray(mlResult.recommendations) && mlResult.recommendations.length > 0) {
                console.log(`Fetching full details for ${mlResult.recommendations.length} recommended items from main API.`);
                const recommendationPromises = mlResult.recommendations.map(async (rec) => {
                    try {
                        const itemDetailResponse = await apiGet(`/items/${rec.product_id}`);
                        if (itemDetailResponse.status === 'success' && itemDetailResponse.data) {
                            return {
                                ...rec,
                                ...itemDetailResponse.data
                            };
                        } else {
                            console.warn(`Failed to fetch details for recommended item ID ${rec.product_id}:`, itemDetailResponse.message || 'Unknown error');
                            return null;
                        }
                    } catch (detailError) {
                        console.error(`Error fetching details for recommended item ID ${rec.product_id}:`, detailError);
                        return null;
                    }
                });

                const results = await Promise.all(recommendationPromises);

                this.searchRecommendations = results.filter(item => item !== null);

                this.isLoadingSearchRecommendations = false;

                if (mlResult.recommendations.length > 0 && this.searchRecommendations.length === 0) {
                    this.searchRecommendationsError = 'Gagal memuat detail untuk saran pencarian.';
                } else {
                    this.searchRecommendationsError = null;
                }

            } else {
                this.searchRecommendations = [];
                this.isLoadingSearchRecommendations = false;
                this.searchRecommendationsError = mlResult.message || 'Tidak ada saran pencarian yang ditemukan dari ML API.';
                console.warn('ML API returned no search recommendations or invalid data:', mlResult);
            }
        } catch (error) {
            console.error('Error during ML API fetch or subsequent detail fetch for search recommendations:', error);
            this.searchRecommendations = [];
            this.isLoadingSearchRecommendations = false;
            this.searchRecommendationsError = error.message || 'Terjadi kesalahan saat memuat saran pencarian.';
        } finally {
            this.render();
        }
    }

    render() {
        this.innerHTML = `
        <div class="bg-white rounded-lg">
            <div class="py-6">
                <search-bar></search-bar>
            </div>
            ${this.renderSearchRecommendationsSection()}
            <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8">
                <h2 class="sr-only">Products</h2>
                ${this.renderContent()}
            </div>
        </div>
        `;
    }

    renderSearchRecommendationsSection() {
        if (!this.currentSearchKeyword || this.currentSearchKeyword.trim() === '') {
            return '';
        }

        if (this.isLoadingSearchRecommendations) {
            return `
                 <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gray-800 rounded-lg shadow-sm mb-8 text-white font-opensan">
                     <h3 class="text-lg font-montserrat font-semibold mb-3 text-white">Saran Terkait "${this.currentSearchKeyword}"</h3>
                     <p class="text-gray-300">Memuat saran...</p>
                 </div>
            `;
        }

        if (this.searchRecommendationsError) {
            return `
                  <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-red-800 rounded-lg shadow-sm mb-8 text-white font-opensan">
                     <h3 class="text-lg font-montserrat font-semibold mb-3 text-white">Saran Terkait "${this.currentSearchKeyword}"</h3>
                      <p>Error memuat saran: ${this.searchRecommendationsError}</p>
                  </div>
             `;
        }

        if (!this.searchRecommendations || this.searchRecommendations.length === 0) {
            return `
                <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gray-800 rounded-lg shadow-sm mb-8 text-white font-opensan">
                    <h3 class="text-lg font-montserrat font-semibold mb-3 text-white">Saran Terkait "${this.currentSearchKeyword}"</h3>
                    <p class="text-gray-300">Tidak ada saran yang ditemukan.</p>
                </div>
            `;
        }

        const backendBaseUrl = 'http://localhost:5000';
        const formatRupiah = (money) => {
            if (money === null || money === undefined) return '-';
            const numericMoney = typeof money === 'string' ? parseFloat(money) : money;
            if (isNaN(numericMoney)) return '-';
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(numericMoney);
        }

        const recommendationsListHtml = this.searchRecommendations.map(rec => {
            return `
                <div class="bg-gray-700 rounded-lg shadow-sm p-4 flex-shrink-0 w-64 text-white">
                     <a href="/#/items/${rec.id || rec.product_id}" class="block text-white">
                         <div class="flex items-center space-x-3 mb-3">
                             ${rec.thumbnail ? `<img src="${backendBaseUrl}${rec.thumbnail}" alt="${rec.name || 'Product image'}" class="w-16 h-16 object-cover rounded">` : '<div class="w-16 h-16 bg-gray-600 rounded flex items-center justify-center text-xs text-gray-400">No Img</div>'}
                            <div class="flex-grow">
                                <h5 class="text-base font-montserrat font-bold mb-1 truncate">${rec.name || rec.product_name || 'Unnamed Product'}</h5>
                                <div class="flex items-center space-x-1">
                                    ${rec.is_available_for_rent ? `<span class="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-md font-opensan">Sewa</span>` : ''}
                                    ${rec.is_available_for_sell ? `<span class="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-md font-opensan">Jual</span>` : ''}
                                </div>
                            </div>
                         </div>
                         <div class="space-y-1 border-t border-gray-600 pt-3">
                            ${rec.is_available_for_sell ? `<p class="text-sm font-opensan font-semibold">Jual: ${formatRupiah(rec.price_sell)}</p>` : ''}
                             ${rec.is_available_for_rent ? `<p class="text-sm font-opensan font-semibold">Sewa: ${formatRupiah(rec.price_rent)}${rec.price_rent > 0 ? ' /hari' : ''}</p>` : ''}
                         </div>
                     </a>
                 </div>
             `;
        }).join('');

        return `
            <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gray-800 rounded-lg shadow-sm mb-8 font-opensan">
                <h3 class="text-lg font-montserrat font-semibold mb-3 text-white">Saran Terkait "${this.currentSearchKeyword}"</h3>
                 <div class="flex overflow-x-auto space-x-4 pb-4 hide-scrollbar">
                     ${recommendationsListHtml}
                 </div>
            </div>
        `;
    }

    renderContent() {
        if (this.isLoading) {
            return '<p>Loading items...</p>';
        }

        if (this.error) {
            return `<p class="text-red-500">Error: ${this.error}</p>`;
        }

        if (!this.items || this.items.length === 0) {
            return '<p>No items found matching your criteria.</p>';
        }

        return `
            <div class="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-2">
                ${this.generateItemList(this.items)}
            </div>
        `;
    }

    generateItemList(items) {
        const formatRupiah = (money) => {
            if (money === null || money === undefined) return '-';
            const numericMoney = typeof money === 'string' ? parseFloat(money) : money;
            if (isNaN(numericMoney)) return '-';

            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(numericMoney);
        }

        const backendBaseUrl = 'http://localhost:5000';

        return items.map(item => `
            <div class="w-full bg-white rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 relative">
                <a href="/#/items/${item.id}">
                    <img class="p-4 rounded-t-lg object-cover aspect-square w-full" src="${item.thumbnail ? backendBaseUrl + item.thumbnail : 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${item.name || 'Item image'}" />
                </a>
                <div class="px-5 pb-5">
                    <a href="/#/items/${item.id}">
                        <h5 class="text-xl font-montserrat font-bold tracking-tight text-gray-900 dark:text-white truncate">${item.name || 'Unnamed Item'}</h5>
                    </a>
                     <div class="absolute top-2 left-2 z-10 flex space-x-1">
                        ${item.is_available_for_rent ? `<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-md">Sewa</span>` : ''}
                        ${item.is_available_for_sell ? `<span class="bg-green-500 text-white text-xs px-2 py-1 rounded-md">Jual</span>` : ''}
                    </div>
                    <div class="mt-2.5">
                        ${item.is_available_for_sell ? `<p class="text-m font-opensan font-semibold text-gray-900 dark:text-white">Jual: ${formatRupiah(item.price_sell)}</p>` : ''}
                        ${item.is_available_for_rent ? `<p class="text-m font-opensan font-semibold text-gray-900 dark:text-white">Sewa: ${formatRupiah(item.price_rent)}${item.price_rent > 0 ? ' /hari' : ''}</p>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
}

customElements.define('all-product', AllProduct);
