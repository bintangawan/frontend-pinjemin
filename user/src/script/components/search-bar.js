import Products from '../data/local/product.js';

class SearchBar extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadow.innerHTML = `
            <div class="relative w-full">
                <input type="text" class="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-e-lg border-s-gray-50 border-s-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-s-gray-700  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500" placeholder="Search Mockups, Logos, Design Templates...">
                <select class="p-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm" id="categorySelect">
                    <option value="">Semua Kategori</option>
                    <!-- Opsi kategori akan ditambahkan di sini -->
                </select>
                <select class="p-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm" id="priceSelect">
                    <option value="">Semua Harga</option>
                    <option value="asc">Termurah</option>
                    <option value="desc">Termahal</option>
                </select>
                <select class="p-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm" id="typeSelect">
                    <option value="">Semua Jenis</option>
                    <option value="beli">Beli</option>
                    <option value="sewa">Sewa</option>
                </select>
                <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded-md text-sm">Cari</button>
            </div>
        `;

        this.setupEventListeners();
        this.populateCategories();
        this.populateTypes();
    }

    setupEventListeners() {
        const searchInput = this.shadow.querySelector('.flex-grow');
        const categorySelect = this.shadow.querySelector('#categorySelect');
        const priceSelect = this.shadow.querySelector('#priceSelect');
        const typeSelect = this.shadow.querySelector('#typeSelect');
        const searchButton = this.shadow.querySelector('.bg-blue-500');

        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value;
            const category = categorySelect.value;
            const price = priceSelect.value;
            const type = typeSelect.value;

            this.dispatchEvent(new CustomEvent('search', {
                bubbles: true,
                composed: true,
                detail: {
                    searchTerm,
                    category,
                    price,
                    type
                }
            }));
        });
    }

    populateCategories() {
        const categorySelect = this.shadow.querySelector('#categorySelect');
        const categories = [...new Set(Products.getAll().map(product => product.category))];

        categories.forEach(category => {
            const option = this.shadow.ownerDocument.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    populateTypes() {
        const typeSelect = this.shadow.querySelector('#typeSelect');
        const types = [...new Set(Products.getAll().map(product => product.type))];

        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
    }
}

customElements.define('search-bar', SearchBar);
