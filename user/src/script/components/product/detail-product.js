import Products from '../../data/local/product';

class DetailProduct extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.productId = this.getAttribute('product-id');
        console.log('Detail Product ID:', this.productId);
        this.render();
    }

    render() {
        const product = Products.getAll().find(p => p.id === this.productId);
        console.log('Product:', product);

        if (!product) {
            this.innerHTML = '<p>Product not found</p>';
            return;
        }

        this.innerHTML = `
        <div class="bg-white">
            <div class="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-16 px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:grid-cols-2 lg:px-8">
                <div>
                    <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">${product.name}</h2>
                    <p class="mt-4 text-gray-500">${product.description}</p>

                    <dl class="mt-16 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-y-16 lg:gap-x-8">
                        <div class="border-t border-gray-200 pt-4">
                            <dt class="font-medium text-gray-900">Price</dt>
                            <dd class="mt-2 text-sm text-gray-500">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price)}</dd>
                        </div>
                        <div class="border-t border-gray-200 pt-4">
                            <dt class="font-medium text-gray-900">Category</dt>
                            <dd class="mt-2 text-sm text-gray-500">${product.category}</dd>
                        </div>
                        <div class="border-t border-gray-200 pt-4">
                            <dt class="font-medium text-gray-900">Type</dt>
                            <dd class="mt-2 text-sm text-gray-500">${product.type}</dd>
                        </div>
                        ${product.rentDuration ? `
                        <div class="border-t border-gray-200 pt-4">
                            <dt class="font-medium text-gray-900">Rent Duration</dt>
                            <dd class="mt-2 text-sm text-gray-500">${product.rentDuration}</dd>
                        </div>
                        ` : ''}
                    </dl>
                </div>
                <div class="grid grid-cols-2 grid-rows-2 gap-4 sm:gap-6 lg:gap-8">
                    <img src="${product.imageUrl}" alt="${product.description}" class="rounded-lg bg-gray-100">
                    <img src="${product.imageUrl}" alt="${product.description}" class="rounded-lg bg-gray-100">
                    <img src="${product.imageUrl}" alt="${product.description}" class="rounded-lg bg-gray-100">
                    <img src="${product.imageUrl}" alt="${product.description}" class="rounded-lg bg-gray-100">
                </div>
            </div>
        </div>
        `;
    }
}

customElements.define('detail-product', DetailProduct);
