import { apiGet } from '../../utils/apiService.js';

class AllProduct extends HTMLElement {
    constructor() {
        super();
        this.items = [];
        this.isLoading = true;
        this.error = null;
        this.fetchItems = this.fetchItems.bind(this);
        this.handleSearchEvent = this.handleSearchEvent.bind(this);
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
        this.fetchItems(event.detail.params);
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

    render() {
        this.innerHTML = `
        <div class="bg-white">
            <div class="py-4">
                <search-bar></search-bar>
            </div>
            <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8">
                <h2 class="sr-only">Products</h2>
                ${this.renderContent()}
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
            <div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
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
            <a href="/#/items/${item.id}" class="group relative">
                <div class="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 group-hover:opacity-75 xl:aspect-w-7 xl:aspect-h-8">
                    <img src="${item.thumbnail ? backendBaseUrl + item.thumbnail : 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${item.name || 'Item image'}" class="h-full w-full object-cover object-center">
                </div>
                <div class="absolute top-2 left-2 z-10 flex space-x-1">
                    ${item.is_available_for_rent ? `<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-md">Sewa</span>` : ''}
                    ${item.is_available_for_sell ? `<span class="bg-green-500 text-white text-xs px-2 py-1 rounded-md">Jual</span>` : ''}
                </div>
                <h3 class="mt-4 text-sm text-gray-700">${item.name || 'Unnamed Item'}</h3>
                ${item.is_available_for_sell ? `<p class="mt-1 text-lg font-medium text-gray-900">Jual: ${formatRupiah(item.price_sell)}</p>` : ''}
                ${item.is_available_for_rent ? `<p class="${item.is_available_for_sell ? 'mt-0' : 'mt-1'} text-lg font-medium text-gray-900">Sewa: ${formatRupiah(item.price_rent)}${item.price_rent > 0 ? ' /hari' : ''}</p>` : ''}
            </a>
        `).join('');
    }
}

customElements.define('all-product', AllProduct);
