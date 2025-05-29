import { apiGet } from '../../utils/apiService.js';
import { fetchItemRecommendations, fetchSearchRecommendations } from '../../utils/mlApiService.js';

class AllProduct extends HTMLElement {
    constructor() {
        super();
        this.items = [];
        this.isLoading = true;
        this.error = null;
        this.itemBasedRecommendations = [];
        this.isLoadingItemBasedRecommendations = false;
        this.itemBasedRecommendationsError = null;
        this.searchRecommendations = [];
        this.isLoadingSearchRecommendations = false;
        this.searchRecommendationsError = null;
        this.currentSearchKeyword = '';

        this.fetchItems = this.fetchItems.bind(this);
        this.handleSearchEvent = this.handleSearchEvent.bind(this);
        this.fetchItemBasedRecommendations = this.fetchItemBasedRecommendations.bind(this);
        this.fetchSearchRecommendations = this.fetchSearchRecommendations.bind(this);
    }

    connectedCallback() {
        this.render();
        this.fetchItems();
        this.fetchItemBasedRecommendations();

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
                this.items = [];
                this.error = result.message || 'Failed to fetch items.';
                this.isLoading = false;
                console.error('API error fetching items:', result);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
            this.items = [];
            this.error = 'An error occurred while fetching items.';
            this.isLoading = false;
        } finally {
            this.render();
        }
    }

    async fetchItemBasedRecommendations() {
        this.isLoadingItemBasedRecommendations = true;
        this.itemBasedRecommendationsError = null;
        this.render();

        const placeholderProductId = 1;
        const topN = 5;

        try {
            console.log(`Fetching Item Based recommendations for product ID: ${placeholderProductId} using ML API.`);
            const result = await fetchItemRecommendations(placeholderProductId, topN);
            console.log('Fetched Item Based recommendations:', result);

            if (result && Array.isArray(result.recommendations)) {
                this.itemBasedRecommendations = result.recommendations;
                this.isLoadingItemBasedRecommendations = false;
            } else {
                this.itemBasedRecommendations = [];
                this.itemBasedRecommendationsError = 'Failed to fetch Item Based recommendations.';
                this.isLoadingItemBasedRecommendations = false;
                console.error('ML API error fetching Item Based recommendations:', result);
            }
        } catch (error) {
            console.error('Error fetching Item Based recommendations from ML API:', error);
            this.itemBasedRecommendations = [];
            this.itemBasedRecommendationsError = error.message || 'An error occurred while fetching Item Based recommendations.';
            this.isLoadingItemBasedRecommendations = false;
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
            console.log(`Fetching Search Based recommendations for keyword: "${keyword}" using ML API.`);
            const result = await fetchSearchRecommendations(keyword, topN);
            console.log('Fetched Search Based recommendations:', result);

            if (result && Array.isArray(result.recommendations)) {
                this.searchRecommendations = result.recommendations;
                this.isLoadingSearchRecommendations = false;
            } else {
                this.searchRecommendations = [];
                this.searchRecommendationsError = 'Failed to fetch Search Based recommendations.';
                this.isLoadingSearchRecommendations = false;
                console.error('ML API error fetching Search Based recommendations:', result);
            }
        } catch (error) {
            console.error('Error fetching Search Based recommendations from ML API:', error);
            this.searchRecommendations = [];
            this.searchRecommendationsError = error.message || 'An error occurred while fetching Search Based recommendations.';
            this.isLoadingSearchRecommendations = false;
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
            ${this.renderRecommendationSection()}
            ${this.renderSearchRecommendationsSection()}
            <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8">
                <h2 class="sr-only">Products</h2>
                ${this.renderContent()}
            </div>
        </div>
        `;
    }

    renderRecommendationSection() {
        if (this.isLoadingItemBasedRecommendations) {
            return `
                 <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gray-100 rounded-lg shadow-sm mb-8">
                     <h3 class="text-xl font-montserrat font-bold mb-4 text-gray-900">Produk yang Mungkin Anda Cari (Rekomendasi Item Based)</h3>
                     <p class="text-gray-700">Memuat rekomendasi...</p>
                 </div>
            `;
        }

        if (this.itemBasedRecommendationsError) {
            return `
                  <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-red-100 rounded-lg shadow-sm mb-8 text-red-800">
                     <h3 class="text-xl font-montserrat font-bold mb-4">Produk yang Mungkin Anda Cari (Rekomendasi Item Based)</h3>
                      <p>Error memuat rekomendasi: ${this.itemBasedRecommendationsError}</p>
                  </div>
             `;
        }

        if (!this.itemBasedRecommendations || this.itemBasedRecommendations.length === 0) {
            return '';
        }

        const recommendationsListHtml = this.itemBasedRecommendations.map(rec => {
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
            return `
                <li>
                     <a href="/#/items/${rec.product_id}" class="text-blue-600 hover:underline">
                         ${rec.product_name || 'Unnamed Product'} - ${formatRupiah(rec.product_price)} (Rating: ${rec.product_rating || '-'})
                     </a>
                </li>
            `;
        }).join('');

        return `
            <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gray-100 rounded-lg shadow-sm mb-8">
                <h3 class="text-xl font-montserrat font-bold mb-4 text-gray-900">Produk yang Mungkin Anda Cari (Rekomendasi Item Based)</h3>
                 <ul class="list-disc list-inside space-y-2">
                     ${recommendationsListHtml}
                 </ul>
            </div>
        `;
    }

    renderSearchRecommendationsSection() {
        if (!this.currentSearchKeyword || this.currentSearchKeyword.trim() === '') {
            return '';
        }

        if (this.isLoadingSearchRecommendations) {
            return `
                 <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-blue-50 rounded-lg shadow-sm mb-8">
                     <h3 class="text-lg font-montserrat font-semibold mb-3 text-blue-800">Saran Terkait "${this.currentSearchKeyword}"</h3>
                     <p class="text-blue-700">Memuat saran...</p>
                 </div>
            `;
        }

        if (this.searchRecommendationsError) {
            return `
                  <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-red-100 rounded-lg shadow-sm mb-8 text-red-800">
                     <h3 class="text-lg font-montserrat font-semibold mb-3">Saran Terkait "${this.currentSearchKeyword}"</h3>
                      <p>Error memuat saran: ${this.searchRecommendationsError}</p>
                  </div>
             `;
        }

        if (!this.searchRecommendations || this.searchRecommendations.length === 0) {
            return '';
        }

        const recommendationsListHtml = this.searchRecommendations.map(rec => {
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
            return `
                <li>
                     <a href="/#/items/${rec.product_id}" class="text-blue-600 hover:underline">
                         ${rec.product_name || 'Unnamed Product'} - ${formatRupiah(rec.product_price)} (Rating: ${rec.product_rating || '-'})
                     </a>
                </li>
            `;
        }).join('');

        return `
            <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-blue-50 rounded-lg shadow-sm mb-8">
                <h3 class="text-lg font-montserrat font-semibold mb-3 text-blue-800">Saran Terkait "${this.currentSearchKeyword}"</h3>
                 <ul class="list-disc list-inside space-y-2 text-blue-700">
                     ${recommendationsListHtml}
                 </ul>
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
