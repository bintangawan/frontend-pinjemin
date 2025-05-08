import Products from '../../data/local/product.js';

class AllProduct extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
        <div class="bg-white">
            <div class="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                <h2 class="sr-only">Products</h2>
                <div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                    ${this.generateProductList()}
                </div>
            </div>
        </div>
        `;
    }

    generateProductList() {
        const productData = Products.getAll();
        const formatRupiah = (money) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(money);
        }

        return productData.map(product => `
            <a href="/#/product/${product.id}" class="group relative">
                <img src="${product.imageUrl}" alt="${product.description}" class="aspect-square w-full rounded-lg bg-gray-200 object-cover group-hover:opacity-75 xl:aspect-7/8">
                ${product.type === 'rent' ? `<div class="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">Disewakan</div>` : ''}
                ${product.type === 'buy' ? `<div class="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md">Dijual</div>` : ''}
                <h3 class="mt-4 text-sm text-gray-700">${product.name}</h3>
                <p class="mt-1 text-lg font-medium text-gray-900">${formatRupiah(product.price)}</p>
            </a>
        `).join('');
    }
}

customElements.define('all-product', AllProduct);
