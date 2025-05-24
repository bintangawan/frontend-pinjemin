// import Products from '../data/local/product.js'; // Hapus import dummy data
// import { apiGet } from '../../utils/apiService.js'; // Hapus import apiGet karena tidak fetch kategori lagi

class SearchBar extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        // this.categories = []; // Hapus state categories
        // this.fetchCategories = this.fetchCategories.bind(this); // Hapus bind fetchCategories
        // this.populateCategories = this.populateCategories.bind(this); // Hapus bind populateCategories
        // this.populateTypes = this.populateTypes.bind(this); // Tidak perlu populateTypes lagi
        this.setupEventListeners = this.setupEventListeners.bind(this); // Tetap bind setupEventListeners
    }

    connectedCallback() {
        this.render();
        // this.fetchCategories(); // Hapus panggilan fetchCategories
    }

    render() {
        this.shadow.innerHTML = `
            <style>
                /* Styling tetap sama, sesuaikan jika Anda menggunakan framework CSS */
                :host {
                    display: block;
                    width: 100%; /* Pastikan komponen mengambil lebar penuh containernya */
                }
                .search-container {
                     display: flex; /* Menggunakan flexbox untuk mensejajarkan input dan button */
                     gap: 8px; /* Jarak antar elemen */
                     align-items: center; /* Tengahkan elemen secara vertikal */
                     max-width: 50em; /* Mengambil lebar penuh dari parent */
                     margin: 0 auto; /* Pusatkan container search bar */
                     padding: 0 1rem; /* Tambahkan padding horizontal agar konten tidak menempel tepi */
                 }

                 .search-input {
                     flex-grow: 1; /* Input mengambil ruang kosong yang tersedia */
                      padding: 0.5rem; /* p-2.5 */
                      font-size: 0.875rem; /* text-sm */
                      color: #1f2937; /* text-gray-900 */
                      background-color: #f9fafb; /* bg-gray-50 */
                      border: 1px solid #d1d5db; /* border border-gray-300 */
                      border-radius: 0.375rem; /* rounded-md */
                      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                      outline: none;
                 }
                 .search-input:focus {
                      border-color: #6366f1; /* focus:border-blue-500 */
                      box-shadow: 0 0 0 1px #6366f1; /* focus:ring focus:ring-blue-500 (simulasi ring) */
                 }

                /* Hapus styling untuk select karena sudah dihapus */
                /* .search-select { ... } */
                /* .search-select:focus { ... } */

                .search-button {
                    background-color: #3b82f6; /* bg-blue-500 */
                    color: white; /* text-white */
                    font-weight: 700; /* font-bold */
                    padding: 0.5rem 1rem; /* Sesuaikan padding agar terlihat seimbang dengan input */
                    border-radius: 0.375rem; /* rounded-md */
                    font-size: 0.875rem; /* text-sm */
                    cursor: pointer;
                    border: none;
                    outline: none;
                    transition: background-color 0.2s ease-in-out;
                     box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .search-button:hover {
                    background-color: #2563eb; /* hover:bg-blue-700 */
                }
                .search-button:focus {
                     box-shadow: 0 0 0 2px #bfdbfe, 0 0 0 4px #93c5fd; /* focus:ring focus:ring-blue-500 (simulasi) */
                }

                /* Dark mode styles jika diperlukan */
                /* @media (prefers-color-scheme: dark) { ... } */

            </style>
            <div class="search-container">
                <input type="text" class="search-input" placeholder="Cari item berdasarkan nama...">
                <!-- Hapus select kategori -->
                <!-- Hapus select tipe -->
                 <!-- Hapus select harga -->
                <button class="search-button">Cari</button>
            </div>
        `;

        this.setupEventListeners();
        // populateCategories tidak lagi dipanggil di sini
        // this.populateTypes(); // Populate static types immediately
    }

    // Hapus method fetchCategories
    // async fetchCategories() { ... }

    // Hapus method populateCategories
    // populateCategories() { ... }

    // Hapus method populateTypes
    // populateTypes() { ... }

    setupEventListeners() {
        const searchInput = this.shadow.querySelector('.search-input');
        // Hapus variabel untuk select yang sudah dihapus
        // const categorySelect = this.shadow.querySelector('#categorySelect');
        // const priceSelect = this.shadow.querySelector('#priceSelect');
        // const typeSelect = this.shadow.querySelector('#typeSelect');
        const searchButton = this.shadow.querySelector('.search-button');


        const performSearch = () => {
            const searchTerm = searchInput.value.trim();
            // Hapus variabel untuk nilai select yang sudah dihapus
            // const categoryId = categorySelect ? categorySelect.value : '';
            // const priceSortOrder = priceSelect.value;
            // const itemType = typeSelect.value;

            const searchParams = {};

            // Hanya tambahkan parameter 'search' jika searchTerm tidak kosong
            if (searchTerm) {
                searchParams.search = searchTerm;
            }
            // Hapus logika penambahan parameter untuk kategori, tipe, dan sorting
            // if (categoryId) { ... }
            // if (itemType === 'beli') { ... } else if (itemType === 'sewa') { ... }
            // if (priceSortOrder) { ... }


            console.log('Dispatching search event with params:', searchParams);

            this.dispatchEvent(new CustomEvent('search', {
                bubbles: true,
                composed: true,
                detail: {
                    params: searchParams
                }
            }));
        };

        searchButton.addEventListener('click', performSearch);

        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                performSearch();
            }
        });
    }
}

customElements.define('search-bar', SearchBar);
