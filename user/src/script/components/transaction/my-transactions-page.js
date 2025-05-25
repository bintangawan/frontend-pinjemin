import { authenticatedRequest } from '../../utils/apiService.js';
import Utils from '../../utils/utils.js'; // Assuming Utils has isAuthenticated and redirectToLogin

class MyTransactionsPage extends HTMLElement {
    constructor() {
        super();
        // State to hold transaction data
        this.transactions = [];
        this.transactionType = null; // 'buy' or 'rent', determined from URL

        // Bind event handlers if not using arrow functions
        // this.renderTransactions = this.renderTransactions.bind(this); // If not arrow function
        // this.fetchTransactions = this.fetchTransactions.bind(this); // If not arrow function
    }

    _emptyContent() {
        this.innerHTML = "";
    }

    connectedCallback() {
        // Check login status - crucial for authenticated pages
        if (!Utils.isAuthenticated()) {
            alert('Anda harus login untuk melihat halaman ini.');
            Utils.redirectToLogin(); // Redirect if not logged in
            return; // Stop further execution
        }

        this._emptyContent(); // Clear initial content

        // Determine transaction type from URL hash
        this.transactionType = this.getTransactionTypeFromUrl();
        console.log('Fetching transactions of type:', this.transactionType);

        this.renderLayout(); // Render basic layout first
        this.fetchTransactions(this.transactionType); // Fetch transactions based on type
    }

    disconnectedCallback() {
        // Cleanup if necessary (e.g., remove event listeners, though none added yet)
    }

    // Method to determine transaction type from URL hash
    getTransactionTypeFromUrl() {
        const hash = window.location.hash;
        if (hash.includes('/my-rentals')) {
            return 'rent';
        } else if (hash.includes('/my-transactions')) {
            return 'buy';
        }
        // Default or fallback if needed, though routing should handle this
        return null;
    }


    renderLayout() {
        const pageTitle = this.transactionType === 'rent' ? 'Pinjaman Saya' : 'Transaksi Pembelian Saya';

        this.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <h1 class="text-2xl font-bold mb-6">${pageTitle}</h1>

                <!-- Transaction List Area -->
                <div id="transactions-list">
                    <p>Memuat transaksi...</p>
                </div>

                <!-- TODO: Add Pagination here if needed -->
            </div>
        `;
    }


    renderTransactions() {
        const transactionsListElement = this.querySelector('#transactions-list');
        if (!transactionsListElement) {
            console.error('Transactions list element not found!');
            return;
        }

        transactionsListElement.innerHTML = ''; // Bersihkan daftar sebelumnya

        if (this.transactions.length === 0) {
            // Added font-opensan and text-gray-700 for consistency
            transactionsListElement.innerHTML = `<p class="text-gray-700 font-opensan">Anda belum memiliki ${this.transactionType === 'rent' ? 'pinjaman' : 'transaksi pembelian'} apapun.</p>`;
            return;
        }

        // Added space-y-4 for spacing between transaction cards
        transactionsListElement.innerHTML = `
             <div class="space-y-4">
                ${this.transactions.map(transaction => `
                    <!-- Card Container for each transaction item -->
                    <!-- Added modern card styling: bg-white, p-6, rounded-lg, shadow-md, text-gray-800 for default text -->
                    <div class="p-6 bg-white rounded-lg shadow-md text-gray-800">
                        <!-- Flex container for content and actions -->
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center flex-wrap">
                            <!-- Transaction Details Area -->
                            <div class="flex-1 min-w-0 mr-0 md:mr-4 mb-4 md:mb-0">
                                <!-- Item Name: Font Montserrat Bold -->
                                <h3 class="text-lg font-montserrat font-bold mb-2">${transaction.item_name || 'Nama Item Tidak Diketahui'}</h3>
                                <!-- Transaction Details: Font Open Sans -->
                                <p class="text-sm text-gray-700 font-opensan">Tipe: <span class="capitalize">${transaction.type}</span></p>
                                <p class="text-sm text-gray-700 font-opensan">Status: <span class="capitalize">${transaction.status}</span></p>
                                <p class="text-sm font-semibold text-gray-800 font-opensan">Total Harga: Rp ${transaction.total_price ? parseFloat(transaction.total_price).toLocaleString('id-ID') : 'N/A'}</p>
                                ${transaction.type === 'rent' ? `
                                    <p class="text-sm text-gray-700 font-opensan">Tanggal Sewa: ${transaction.rent_start_date ? new Date(transaction.rent_start_date).toLocaleDateString('id-ID') : '-'} - ${transaction.rent_end_date ? new Date(transaction.rent_end_date).toLocaleDateString('id-ID') : '-'}</p>
                                    <p class="text-sm text-gray-700 font-opensan">Deposit Dibayar: Rp ${transaction.deposit_paid ? parseFloat(transaction.deposit_paid).toLocaleString('id-ID') : '0'}</p>
                                ` : ''}
                                <p class="text-sm text-gray-700 font-opensan">Tanggal Transaksi: ${transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('id-ID') : '-'}</p>
                                <!-- Add more details as needed -->
                            </div>
                            <!-- Action Buttons Area -->
                            <div class="flex flex-wrap gap-2">
                                <!-- Detail Button: Styled like primary button -->
                               <a href="/#/transactions/${transaction.id}" class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md font-semibold inline-block text-center font-opensan">Detail</a>

                               ${transaction.status === 'completed' ? `
                                    <!-- Review Button: Styled like secondary/success button -->
                                     <a href="/#/items/${transaction.item_id}#review" class="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-md font-semibold inline-block text-center font-opensan">
                                         Beri Review
                                     </a>
                                 ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
             </div>
        `;
        // Note: Ensure transaction properties like item_name, type, status, total_price, rent_start_date, etc.,
        // match the structure returned by your backend API\'s GET /transactions endpoint.
    }


    // Method to fetch transactions from the backend API
    async fetchTransactions(type) {
        try {
            // Construct query parameters if type is specified
            const queryParams = type ? `?type=${type}` : '';
            console.log(`Fetching transactions from /transactions${queryParams}`);

            // Use authenticatedRequest as this endpoint requires authentication
            const response = await authenticatedRequest(`/transactions${queryParams}`);

            if (response.status === 'success' && response.data) {
                console.log('Fetched transactions:', response.data);
                // Assuming response.data is the array of transactions
                this.transactions = Array.isArray(response.data) ? response.data : []; // Ensure it's an array
                this.renderTransactions(); // Render the list once data is fetched

            } else {
                console.error('Error fetching transactions:', response.message || 'Unknown error', response);
                // Display error message to the user
                const transactionsListElement = this.querySelector('#transactions-list');
                if (transactionsListElement) {
                    transactionsListElement.innerHTML = `<p class="text-red-500">Gagal memuat daftar transaksi: ${response.message || 'Terjadi kesalahan'}</p>`;
                }
            }
        } catch (error) {
            console.error('Error during API request:', error);
            // Display error message to the user
            const transactionsListElement = this.querySelector('#transactions-list');
            if (transactionsListElement) {
                // Check if error has a message property
                const errorMessage = error.message || 'Terjadi kesalahan tidak diketahui';
                transactionsListElement.innerHTML = `<p class="text-red-500">Terjadi kesalahan saat memuat transaksi: ${errorMessage}</p>`;
            }
        }
    }
}

customElements.define('my-transactions-page', MyTransactionsPage);
