import { authenticatedRequest } from '../../utils/apiService.js';
import Utils from '../../utils/utils.js'; // Assuming Utils has isAuthenticated and redirectToLogin

class MySellerTransactionsPage extends HTMLElement {
    constructor() {
        super();
        // State to hold seller transaction data
        this.sellerTransactions = [];
        this.isLoading = true;
        this.error = null;
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
        this.renderLayout(); // Render basic layout
        this.fetchSellerTransactions(); // Fetch seller transactions
    }

    disconnectedCallback() {
        // Cleanup if necessary
    }

    renderLayout() {
        this.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <h1 class="text-2xl font-bold mb-6">Transaksi Item Saya (Sebagai Penjual)</h1>

                <!-- Seller Transaction List Area -->
                <div id="seller-transactions-list">
                    ${this.isLoading ? '<p>Memuat transaksi item Anda...</p>' : ''}
                    ${this.error ? `<p class="text-red-500">${this.error}</p>` : ''}
                </div>

                <!-- TODO: Add Pagination here if needed -->
            </div>
        `;
    }

    renderSellerTransactions() {
        const listElement = this.querySelector('#seller-transactions-list');
        if (!listElement) {
            console.error('Seller transactions list element not found!');
            return;
        }

        listElement.innerHTML = ''; // Clear loading message or previous content

        if (this.sellerTransactions.length === 0) {
            listElement.innerHTML = '<p>Anda belum memiliki item yang terjual atau disewa.</p>';
            return;
        }

        // Generate HTML for the list of seller transactions
        // Adapt styling with Tailwind CSS as needed
        listElement.innerHTML = `
             <div class="space-y-4">
                ${this.sellerTransactions.map(transaction => {
            // Determine status display and color class
            let statusDisplay = transaction.status || 'Status Tidak Diketahui';
            let statusColorClass = 'text-gray-800 bg-gray-100'; // Default gray

            switch (transaction.status) {
                case 'pending':
                    statusColorClass = 'text-yellow-800 bg-yellow-100'; // Yellow for pending
                    break;
                case 'approved':
                    statusColorClass = 'text-blue-800 bg-blue-100'; // Blue for approved
                    break;
                case 'rejected':
                case 'cancelled':
                    statusColorClass = 'text-red-800 bg-red-100'; // Red for rejected/cancelled
                    break;
                case 'completed':
                    statusColorClass = 'text-green-800 bg-green-100'; // Green for completed
                    break;
                case 'rented': // Status ini mungkin muncul jika transaksi sewa masih berjalan
                    statusColorClass = 'text-purple-800 bg-purple-100'; // Purple for rented
                    break;
                // Tambahkan case lain jika ada status transaksi lain di backend
                default:
                    // Gunakan default gray jika status tidak dikenali
                    break;
            }

            // Combine base badge classes with status-specific color classes
            const badgeClasses = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColorClass}`;


            return `
                    <div class="border p-4 rounded-md shadow-sm bg-white flex justify-between items-center flex-wrap">
                         <div class="flex-1 min-w-0 mr-4">
                            <h3 class="text-lg font-semibold">Item: ${transaction.item_name || 'Nama Item Tidak Diketahui'}</h3>
                            <p>Tipe Transaksi: <span class="capitalize">${transaction.type}</span></p>
                            <p>Status: <span class="${badgeClasses}">${statusDisplay}</span></p>
                            <p>Pembeli/Penyewa: ${transaction.buyer_name || 'Tidak Diketahui'}</p>
                            <p>Total Harga: Rp ${transaction.total_price ? parseFloat(transaction.total_price).toLocaleString('id-ID') : 'N/A'}</p>
                            ${transaction.type === 'rent' ? `
                                <p>Tanggal Sewa: ${transaction.rent_start_date ? new Date(transaction.rent_start_date).toLocaleDateString('id-ID') : '-'} - ${transaction.rent_end_date ? new Date(transaction.rent_end_date).toLocaleDateString('id-ID') : '-'}</p>
                                <p>Deposit Dibayar: Rp ${transaction.deposit_paid ? parseFloat(transaction.deposit_paid).toLocaleString('id-ID') : '0'}</p>
                            ` : ''}
                            <p>Tanggal Transaksi: ${transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('id-ID') : '-'}</p>
                            <!-- Add more details as needed -->
                         </div>
                        <div class="mt-4 md:mt-0">
                           <a href="/#/transactions/${transaction.id}" class="bg-blue-500 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded inline-block">Detail</a>
                            <!-- TODO: Add status update buttons based on current status and type -->
                        </div>
                    </div>
                `;
        }).join('')}
             </div>
        `;
        // TODO: Setup event delegation for Detail/Status Update buttons
        // this.setupEventListeners();
    }


    async fetchSellerTransactions() {
        this.isLoading = true;
        this.error = null;
        this.renderLayout(); // Show loading state

        try {
            // Use authenticatedRequest to call the seller transactions endpoint
            const response = await authenticatedRequest(`/transactions/seller`, 'GET');

            if (response.status === 'success' && response.data) {
                console.log('Fetched seller transactions:', response.data);
                this.sellerTransactions = response.data; // Assuming response.data is the array
                this.error = null; // Clear any previous errors
            } else {
                console.error('Error fetching seller transactions:', response.message || 'Unknown error');
                this.sellerTransactions = []; // Clear data on error
                this.error = response.message || 'Gagal memuat transaksi penjual.';
            }
        } catch (error) {
            console.error('Error during API request for seller transactions:', error);
            this.sellerTransactions = []; // Clear data on error
            // apiService handles 401/403 redirect
            this.error = 'Terjadi kesalahan saat memuat transaksi penjual.';
        } finally {
            this.isLoading = false; // Hide loading state
            this.renderSellerTransactions(); // Render the list (either with data or error/empty message)
        }
    }

    // TODO: Add setupEventListeners and handle status update button clicks later
}

customElements.define('my-seller-transactions-page', MySellerTransactionsPage);
