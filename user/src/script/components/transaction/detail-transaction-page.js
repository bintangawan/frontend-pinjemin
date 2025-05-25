import { authenticatedRequest } from '../../utils/apiService.js';
import Utils from '../../utils/utils.js';
import { io } from 'socket.io-client';

class DetailTransactionPage extends HTMLElement {
    constructor() {
        super();
        this.transactionId = null;
        this.transactionDetails = null;
        this.isLoading = true;
        this.error = null;

        // State for messages
        this._messages = [];
        this._messagesLoading = false;
        this._messagesError = null;

        // Socket.io related properties
        this._socket = null;
        this._isSocketConnected = false;

        // Bind methods
        this.fetchTransactionDetails = this.fetchTransactionDetails.bind(this);
        this.handleStatusUpdate = this.handleStatusUpdate.bind(this);
        // Bind methods for messages
        this.fetchMessages = this.fetchMessages.bind(this);
        this._handleSendMessageSocket = this._handleSendMessageSocket.bind(this); // <-- Add binding for the new socket handler
        // Bind Socket.io methods
        this._connectSocket = this._connectSocket.bind(this);
        this._disconnectSocket = this._disconnectSocket.bind(this);
        this._handleNewMessage = this._handleNewMessage.bind(this); // Handler for new message event received via socket
        this._handleSocketError = this._handleSocketError.bind(this); // Handler for socket errors
    }

    _emptyContent() {
        this.innerHTML = "";
    }

    // Observe the 'transaction-id' attribute passed from the router
    static get observedAttributes() {
        return ['transaction-id'];
    }

    connectedCallback() {
        console.log('Detail Transaction Component Connected');
        // Initial render. This will show loading state while attributeChangedCallback sets the ID and triggers fetch.
        this.render();
        // attributeChangedCallback will be called automatically if the attribute is set.
    }

    disconnectedCallback() {
        console.log('Detail Transaction Component Disconnected');
        // Remove event listeners when the component is removed from the DOM
        this.removeEventListeners();
        // Disconnect Socket.io client when the component is removed
        this._disconnectSocket();

        // Reset state properties when disconnected to clean up for potential reuse
        this.transactionId = null;
        this.transactionDetails = null;
        this.isLoading = true;
        this.error = null;
        this._messages = [];
        this._messagesLoading = false;
        this._messagesError = null;
        this._isSocketConnected = false;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute '${name}' changed from '${oldValue}' to '${newValue}' (type: ${typeof newValue})`);
        // Process the new attribute value, ensure it's a valid string ID
        const newTransactionId = (newValue && typeof newValue === 'string' && newValue !== 'undefined') ? newValue : null;

        // Only update state and fetch if the ID has actually changed
        if (newTransactionId !== this.transactionId) {
            this.transactionId = newTransactionId;

            // Reset states when transaction ID changes
            this.transactionDetails = null;
            this.isLoading = true;
            this.error = null;
            this._messages = [];
            this._messagesLoading = false;
            this._messagesError = null;
            this._disconnectSocket(); // Disconnect socket for the old ID if connected

            if (this.transactionId) {
                console.log('Detail Transaction ID (updated and valid):', this.transactionId);
                // Check login status before attempting to fetch data
                if (!Utils.isAuthenticated()) {
                    alert('Anda harus login untuk melihat detail transaksi.');
                    Utils.redirectToLogin(); // Redirect if not logged in
                    // Set error state and render if not authenticated
                    this.error = 'Anda harus login untuk melihat detail ini.';
                    this.isLoading = false;
                    this.render();
                    return; // Stop execution here
                }
                // If authenticated and have a valid ID, start fetching
                this.render(); // Show loading state
                this.fetchTransactionDetails(this.transactionId); // This will also trigger fetchMessages
                // Attempt to connect Socket.io for the new transaction ID
                this._connectSocket(this.transactionId);

            } else {
                // Handle case where the ID is invalid (e.g., removed or set to undefined)
                console.warn(`Attribute '${name}' became invalid or removed. Resetting state.`);
                this.error = 'ID Transaksi tidak ditemukan atau tidak valid.';
                this.isLoading = false; // No data to load
                this.render(); // Render with error state
            }
        } else {
            console.log(`Attribute '${name}' value is unchanged or remains invalid.`);
            // If the ID is unchanged but was invalid, and is set again (even to the same invalid value),
            // we might want to re-render the error state.
            if (!this.transactionId && newValue) {
                console.warn(`Attribute '${name}' remains invalid, but was set. Re-rendering with error.`);
                this.transactionDetails = null;
                this.error = 'ID Transaksi tidak ditemukan atau tidak valid.';
                this.isLoading = false;
                this.render(); // Re-render with invalid ID error
            }
        }
    }

    async fetchTransactionDetails(transactionId) {
        if (!transactionId) {
            console.error("fetchTransactionDetails called without a valid transactionId.");
            this.error = 'ID Transaksi tidak ditemukan.';
            this.isLoading = false;
            this.render(); // Render with error
            return;
        }

        // Set loading state before fetch
        this.isLoading = true;
        this.error = null;
        this.transactionDetails = null;
        // Initial render with loading state is already done in attributeChangedCallback or connectedCallback

        try {
            console.log(`Fetching transaction details for ID: ${transactionId}`);
            // Use authenticatedRequest as this endpoint requires authentication
            const response = await authenticatedRequest(`/transactions/${transactionId}`, 'GET');

            if (response.status === 'success' && response.data) {
                console.log('Fetched transaction details successfully:', response.data);
                this.transactionDetails = response.data;
                this.error = null; // Clear any previous errors

                // Fetch messages after successfully getting transaction details
                // Do NOT render here. Rendering will happen after fetchMessages completes.
                this.fetchMessages(transactionId);

                // Attempt to connect Socket.io after we have transaction details and ID
                this._connectSocket(transactionId);

            } else {
                // Handle API error response
                console.error('Error fetching transaction details:', response.message || 'Unknown error', response);
                this.transactionDetails = null; // Clear data on error
                this.error = response.message || 'Gagal memuat detail transaksi.';
                // Clear loading state and render with error if transaction details fetch fails
                this.isLoading = false;
                this._disconnectSocket(); // Disconnect socket on transaction details fetch error
                this.render();
            }
        } catch (error) {
            // Handle network or other unexpected errors
            console.error('Error during API request for transaction details:', error);
            this.transactionDetails = null; // Clear data on error
            // apiService should handle 401/403 redirect
            this.error = 'Terjadi kesalahan saat memuat detail transaksi.';
            // Clear loading state and render with error if transaction details fetch fails
            this.isLoading = false;
            this._disconnectSocket(); // Disconnect socket on fetch error
            this.render();
        }
        // Note: Removed finally block from here. The final render after *both* fetches is in fetchMessages' finally.
    }

    async fetchMessages(transactionId) {
        if (!transactionId) {
            console.error("fetchMessages called without a valid transactionId.");
            this._messagesError = 'ID Transaksi tidak ditemukan untuk memuat pesan.';
            this._messagesLoading = false;
            this.render(); // Render with message error
            return;
        }

        // Set loading state for messages
        this._messagesLoading = true;
        this._messagesError = null;
        // Clear existing messages before fetching new ones
        this._messages = [];
        // Do NOT render here just to show message loading. A single render after all data is better.


        try {
            console.log(`Fetching messages for transaction ID: ${transactionId}`);
            // Use authenticatedRequest as this endpoint requires authentication
            const response = await authenticatedRequest(`/messages/transaction/${transactionId}`, 'GET');

            if (response.status === 'success' && response.data) {
                console.log('Fetched messages successfully:', response.data);
                // Assuming data is an array of message objects
                this._messages = Array.isArray(response.data) ? response.data : [];
                this._messagesError = null; // Clear any previous errors
                // Sort messages by created_at to ensure correct display order (chronological)
                this._messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            } else {
                // Handle API error response
                console.error('Error fetching messages:', response.message || 'Unknown error', response);
                this._messages = []; // Clear data on error
                this._messagesError = response.message || 'Gagal memuat pesan.';
            }
        } catch (error) {
            // Handle network or other unexpected errors
            console.error('Error during API request for messages:', error);
            this._messages = []; // Clear data on error
            // apiService should handle 401/403 redirect
            this._messagesError = 'Terjadi kesalahan saat memuat pesan.';
        } finally {
            // Hide message loading state
            this._messagesLoading = false;
            // Hide main loading state only after messages are fetched (and transaction details were successful)
            if (this.transactionDetails) { // Only set main loading to false if main details were fetched
                this.isLoading = false;
            }
            console.log("fetchMessages finally block reached. Current state after fetch:", {
                transactionDetails: !!this.transactionDetails,
                isLoading: this.isLoading,
                error: this.error,
                messagesCount: this._messages.length,
                messagesLoading: this._messagesLoading,
                messagesError: this._messagesError,
                isSocketConnected: this._isSocketConnected // Include socket state
            });
            // Trigger a render after messages are fetched/processed, or if there was a message error
            this.render();
        }
    }

    _connectSocket(transactionId) {
        // Only attempt to connect if not already connected AND we have a valid transaction ID
        if (this._isSocketConnected || !transactionId) {
            if (!transactionId) {
                console.warn('Cannot connect Socket.io: No valid transaction ID.');
            } else if (this._isSocketConnected) {
                console.log('Socket already connected.');
            }
            return;
        }

        console.log(`Attempting to connect Socket.io for transaction ID: ${transactionId}`);

        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No JWT token found. Cannot connect Socket.io for authenticated user.');
            // Optionally redirect or show error
            this._messagesError = 'Anda harus login untuk menggunakan chat.';
            this.render();
            return;
        }

        // Connect to the Socket.io server URL (adjust if your backend uses a different URL/port for Socket.io)
        // Pass transactionId and token for authentication and joining the correct room
        // URL ini harus sama dengan alamat backend Anda yang me-listen() server HTTP yang terikat dengan Socket.io
        this._socket = io('http://localhost:5000', { // PAastikan URL ini BENAR
            query: { transactionId: transactionId }, // Ini mungkin TIDAK digunakan oleh backend untuk join room,
            // tapi bisa digunakan di middleware untuk mendapatkan ID
            // Backend Anda di server.js menggunakan socket.handshake.auth.token
            // dan event 'joinTransaction'.
            auth: { token: token } // Pass token in the auth object (recommended by socket.io)
        });

        // Set up Socket.io event listeners
        this._socket.on('connect', () => {
            this._isSocketConnected = true;
            console.log('Socket.io connected:', this._socket.id);
            // *** PENTING: Pancarkan event 'joinTransaction' setelah berhasil terhubung ***
            if (this._socket && this.transactionId) {
                console.log(`Emitting 'joinTransaction' for ID: ${this.transactionId}`);
                this._socket.emit('joinTransaction', parseInt(this.transactionId, 10)); // Kirim ID transaksi
            }
        });

        this._socket.on('disconnect', (reason) => {
            this._isSocketConnected = false;
            console.log('Socket.io disconnected:', reason);
            // Implement reconnection logic here if needed
        });

        // Gunakan handler error terpusat
        this._socket.on('connect_error', this._handleSocketError);
        this._socket.on('error', this._handleSocketError); // Socket.io error events

        // Listen for the 'newMessage' event from the server
        this._socket.on('newMessage', this._handleNewMessage);

        // Optional: Listen for server-side errors when sending messages
        // This matches the 'messageError' event emitted by your backend on error
        this._socket.on('messageError', (errorData) => {
            console.error('Server reported message error:', errorData.error);
            alert('Gagal mengirim pesan: ' + (errorData.error || 'Terjadi kesalahan server.'));
        });


        console.log('Socket.io event listeners for messages added.');
    }

    _disconnectSocket() {
        if (this._socket) {
            console.log('Disconnecting Socket.io...');
            // Remove all specific listeners added
            this._socket.off('connect');
            this._socket.off('disconnect');
            this._socket.off('connect_error', this._handleSocketError);
            this._socket.off('error', this._handleSocketError);
            this._socket.off('newMessage', this._handleNewMessage);
            this._socket.off('messageError'); // Remove messageError listener

            // If you emitted joinTransaction, you might need to emit leaveTransaction
            // this._socket.emit('leaveTransactionRoom', this.transactionId); // If backend handles this

            this._socket.disconnect();
            this._socket = null;
            this._isSocketConnected = false;
            console.log('Socket.io disconnected.');
        }
    }

    _handleSocketError(error) {
        console.error('Socket.io error handler:', error);
        this._isSocketConnected = false; // Ensure status is updated on error
        // You might want to update UI to show connection error
        // this._messagesError = 'Socket connection error: ' + (error.message || 'Unknown error');
        // this.render(); // Re-render to show error
    }

    _handleNewMessage(newMessage) {
        console.log('Received new message via Socket.io:', newMessage);

        // Validate the received message and check if it belongs to the current transaction
        // Check transaction_id in received message data
        if (newMessage && newMessage.transaction_id && this.transactionId &&
            parseInt(newMessage.transaction_id, 10) === parseInt(this.transactionId, 10)) {

            // Check if this message is not already in our list (e.g., if REST fetch and Socket.io overlap)
            if (!this._messages.find(msg => msg.id === newMessage.id)) {
                console.log("Adding new message to state:", newMessage);
                // Add the new message to the messages list state
                // Add to the end for chronological display
                this._messages.push(newMessage);

                // Re-sort the messages array to ensure correct order (optional but safe)
                this._messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                // Trigger a render to update the UI with the new message
                // This will also re-apply event listeners via render -> setupEventListeners
                this.render();

                // Scroll the messages list to the bottom to show the latest message
                requestAnimationFrame(() => {
                    const messagesListElement = this.querySelector('#messages-list');
                    if (messagesListElement) {
                        messagesListElement.scrollTop = messagesListElement.scrollHeight;
                        console.log("Scrolled messages list to bottom.");
                    } else {
                        console.warn("Messages list element not found for scrolling after new message.");
                    }
                });
            } else {
                console.log('Received duplicate message via Socket.io, ignoring.', newMessage);
            }
        } else {
            console.warn('Received new message not for this transaction or invalid format, ignoring:', newMessage);
            console.log('Expected transaction ID:', this.transactionId, 'Received transaction ID:', newMessage ? newMessage.transaction_id : 'N/A');
        }
    }

    setupEventListeners() {
        console.log("Setting up event listeners...");
        // Remove listeners before adding them again (important for Custom Elements)
        this.removeEventListeners();

        // Setup listeners for status update buttons (using event delegation on their container)
        const transactionActionsDiv = this.querySelector('#transaction-actions');
        if (transactionActionsDiv) {
            // Define the delegated event handler
            this.handleStatusUpdateDelegate = (event) => {
                const target = event.target;
                // Check if the clicked element is one of the status update buttons
                if (target.classList.contains('status-update-button')) {
                    const newStatus = target.dataset.status; // Get the status from the data attribute
                    // Ensure we have a status and transaction details before calling the handler
                    if (newStatus && this.transactionDetails && this.transactionDetails.id) {
                        this.handleStatusUpdate(this.transactionDetails.id, newStatus);
                    }
                }
            };
            // Add the single delegated listener to the container
            transactionActionsDiv.addEventListener('click', this.handleStatusUpdateDelegate);
            console.log('Transaction actions delegate listener added.');
        }

        // Setup listener for the send message form submit event
        const sendMessageForm = this.querySelector('#send-message-form');
        if (sendMessageForm) {
            // *** UBAH: Gunakan handler pengiriman via Socket.io ***
            // this._sendMessageSubmitHandler = this.handleSendMessage; // <-- REMOVE or COMMENT OUT this line
            this._sendMessageSubmitHandler = this._handleSendMessageSocket; // <-- USE the socket handler
            // Add the event listener
            sendMessageForm.addEventListener('submit', this._sendMessageSubmitHandler);
            console.log('Send message form submit listener added.');
        }

        // ... Add other event listeners here if any (e.g., delete message button delegates on #messages-list)
        console.log("Finished setting up event listeners.");
    }

    removeEventListeners() {
        console.log("Removing event listeners...");
        // Remove delegated listener for transaction actions
        const transactionActionsDiv = this.querySelector('#transaction-actions');
        if (transactionActionsDiv && this.handleStatusUpdateDelegate) {
            transactionActionsDiv.removeEventListener('click', this.handleStatusUpdateDelegate);
            this.handleStatusUpdateDelegate = null; // Clear the reference
            console.log('Transaction actions delegate listener removed.');
        }

        // Remove listener for the send message form
        const sendMessageForm = this.querySelector('#send-message-form');
        if (sendMessageForm && this._sendMessageSubmitHandler) {
            sendMessageForm.removeEventListener('submit', this._sendMessageSubmitHandler);
            this._sendMessageSubmitHandler = null; // Clear the reference
            console.log('Send message form submit listener removed.');
        }

        // ... Remove other event listeners here if any
        console.log("Finished removing event listeners.");
    }

    // --- ADD the new Socket.io message sending method ---
    _handleSendMessageSocket(event) {
        event.preventDefault(); // Prevent default form submission
        console.log('Send message form submitted (Socket.io).');

        // Ensure socket is connected and we have transaction details/ID
        if (!this._socket || !this._isSocketConnected || !this.transactionDetails || !this.transactionDetails.id) {
            console.warn('Socket not connected or transaction details missing. Cannot send message via Socket.io.');
            alert('Tidak dapat mengirim pesan: Koneksi chat tidak aktif atau informasi transaksi tidak lengkap.');
            // Fallback to REST API send if needed? Or just inform user?
            // For now, just inform the user.
            return;
        }

        const form = event.target;
        const messageInput = form.querySelector('#message-input');
        const content = messageInput ? messageInput.value.trim() : '';

        if (!content) {
            alert('Pesan tidak boleh kosong.');
            return;
        }

        const sendButton = form.querySelector('button[type="submit"]');
        if (sendButton) sendButton.disabled = true;

        try {
            console.log(`Attempting to emit 'sendMessage' event for transaction ID: ${this.transactionDetails.id}`);
            // Emit the 'sendMessage' event to the backend via Socket.io
            this._socket.emit('sendMessage', {
                transaction_id: parseInt(this.transactionDetails.id, 10), // Ensure ID is number if backend expects it
                content: content,
            });

            console.log('\'sendMessage\' event emitted.');
            // Clear the input field immediately after emitting
            if (messageInput) messageInput.value = '';

        } catch (error) {
            // This catch block is less likely to be hit for emit unless socket object is null/undefined
            console.error('Error emitting sendMessage event:', error);
            alert('Terjadi kesalahan saat mengirim pesan melalui Socket.io.');
        } finally {
            // Re-enable button, possibly after a short delay or confirmation via socket event?
            // For now, re-enable immediately. Server will handle save/broadcast.
            if (sendButton) sendButton.disabled = false;
        }
    }

    render() {
        console.log("DetailTransaction Render method called. Current state:", {
            isLoading: this.isLoading, // Overall loading (transaction details)
            error: this.error, // Overall error (transaction details)
            hasData: !!this.transactionDetails,
            messagesLoading: this._messagesLoading, // Messages loading state
            messagesError: this._messagesError, // Messages error state
            hasMessages: this._messages.length > 0, // Check if messages are loaded
            isSocketConnected: this._isSocketConnected // Socket connection status
        });
        this._emptyContent(); // Clear previous content
        console.log("Render method: Content cleared.");

        try {
            const contentHtml = this.renderContentContent(
                this.isLoading,
                this.error,
                this.transactionDetails,
                Utils.getUserInfo() // Pass currentUser for seller/buyer check
            );

            const messagesSectionHtml = this.renderMessagesSection(
                this._messagesLoading,
                this._messagesError,
                this._messages,
                Utils.getUserInfo() // Pass currentUser to render individual messages
            );

            console.log("Render method: renderContentContent returned HTML string.");
            if (!contentHtml) {
                console.warn("renderContentContent returned an empty string or null.");
            }
            this.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <h1 class="text-2xl font-bold mb-6">Detail Transaksi</h1>

                <!-- Transaction Detail Area -->
                <div id="transaction-detail-content">
                        ${contentHtml}
                    </div>

                    <!-- Messages Section -->
                     <div class="mt-8 border-t pt-8">
                        <h2 class="text-2xl font-bold mb-6">Pesan Transaksi</h2>
                        ${messagesSectionHtml}
                </div>
            </div>
        `;
            console.log("Render method: innerHTML set.");

        } catch (renderError) {
            console.error("Error inside render method:", renderError);
            this.innerHTML = '<p class="text-red-500">Terjadi kesalahan saat menampilkan detail.</p>';
        }

        // Setup event listeners after rendering content
        // This is called after ALL rendering (transaction and messages)
        if (!this.isLoading && !this._messagesLoading && !this.error && !this._messagesError) { // Only setup listeners if main content is loaded successfully
            this.setupEventListeners();
        }
    }

    renderContentContent(isLoading, error, transaction, currentUser) {
        console.log("renderContentContent called with state:", {
            isLoading,
            error,
            hasTransaction: !!transaction,
            hasCurrentUser: !!currentUser
        });

        // This part only renders the main transaction details
        // Loading/Error for messages are handled in renderMessagesSection

        if (isLoading) {
            console.log("renderContentContent: Showing loading.");
            return '<p>Memuat detail transaksi...</p>';
        }

        if (error) {
            console.log("renderContentContent: Showing error:", error);
            return `<p class="text-red-500">Error: ${error}</p>`;
        }

        if (!transaction) {
            console.log("renderContentContent: Showing no data message.");
            return '<p>Detail transaksi tidak tersedia.</p>';
        }

        // Calculate isSeller/isBuyer here as we have transaction and currentUser
        const isSeller = currentUser && transaction.seller_id === currentUser.id;
        const isBuyer = currentUser && transaction.buyer_id === currentUser.id;
        console.log("renderContentContent: Transaction data available. isSeller:", isSeller, "isBuyer:", isBuyer);

        const formatRupiah = (money) => {
            if (money === null || money === undefined) return '-';
            const numericMoney = typeof money === 'string' ? parseFloat(money) : money;
            if (isNaN(numericMoney)) return '-';
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericMoney);
        }

        // Determine status display
        let statusDisplay = transaction.status || 'Unknown Status';
        let statusColorClass = 'text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold'; // Default

        switch (transaction.status) {
            case 'pending':
                statusColorClass = 'text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full text-xs font-semibold';
                break;
            case 'ongoing':
                statusColorClass = 'text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full text-xs font-semibold';
                break;
            case 'completed':
                statusColorClass = 'text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs font-semibold';
                break;
            case 'cancelled':
                statusColorClass = 'text-red-600 bg-red-500 px-2 py-0.5 rounded-full text-xs font-semibold';
                break;
            case 'returned':
                statusColorClass = 'text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full text-xs font-semibold';
                break;
            case 'late':
                statusColorClass = 'text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full text-xs font-semibold';
                break;
        }

        // Determine available status transitions for the seller
        let availableSellerStatusTransitions = [];
        if (isSeller) {
            switch (transaction.status) {
                case 'pending':
                    availableSellerStatusTransitions = [
                        { status: 'ongoing', text: 'Konfirmasi & Proses' },
                        { status: 'cancelled', text: 'Batalkan Transaksi' }
                    ];
                    break;
                case 'ongoing':
                    if (transaction.type === 'rent') {
                        availableSellerStatusTransitions = [
                            { status: 'returned', text: 'Item Telah Dikembalikan' },
                            // Seller can complete rental after item is returned (logic handled in handler based on current status)
                            { status: 'completed', text: 'Selesaikan Transaksi Sewa' }
                        ];
                    } else { // buy
                        availableSellerStatusTransitions = [
                            { status: 'completed', text: 'Selesaikan Transaksi Penjualan' }
                        ];
                    }
                    break;
                case 'returned':
                    if (transaction.type === 'rent') {
                        availableSellerStatusTransitions = [{ status: 'completed', text: 'Selesaikan Transaksi Sewa' }];
                    }
                    break;
                case 'late':
                    if (transaction.type === 'rent') {
                        // Seller can mark returned even if late
                        availableSellerStatusTransitions = [
                            { status: 'returned', text: 'Item Dikembalikan (Terlambat)' },
                            // Seller can complete rental after item is returned (logic handled in handler based on current status)
                            { status: 'completed', text: 'Selesaikan Transaksi Sewa' }
                        ];
                    }
                    break;
                default:
                    availableSellerStatusTransitions = [];
            }
        }

        // Determine available status transitions for the buyer
        let availableBuyerStatusTransitions = [];
        if (isBuyer) {
            switch (transaction.status) {
                case 'pending':
                    // Buyer can cancel a pending transaction
                    availableBuyerStatusTransitions = [
                        { status: 'cancelled', text: 'Batalkan Pesanan' }
                    ];
                    break;
                // Buyer cannot mark returned/completed as per previous decision
                default:
                    availableBuyerStatusTransitions = [];
            }
        }

        return `
            <div class="bg-white shadow-md rounded-lg p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="text-xl font-semibold mb-4">Informasi Transaksi</h3>
                        <p><strong>ID Transaksi:</strong> ${transaction.id}</p>
                        <p><strong>Tanggal Dibuat:</strong> ${transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('id-ID') : '-'} ${transaction.created_at ? new Date(transaction.created_at).toLocaleTimeString('id-ID') : '-'}</p>
                        ${transaction.updated_at ? `<p><strong>Terakhir Diperbarui:</strong> ${new Date(transaction.updated_at).toLocaleDateString('id-ID')} ${new Date(transaction.updated_at).toLocaleTimeString('id-ID')}</p>` : ''}
                        <p><strong>Tipe:</strong> <span class="capitalize">${transaction.type || '-'}</span></p>
                        <p><strong>Status:</strong> <span class="${statusColorClass}">${statusDisplay}</span></p>
                        <p><strong>Metode Pembayaran:</strong> ${transaction.payment_method || '-'}</p>
                        <p><strong>Total Harga:</strong> ${formatRupiah(transaction.total_price)}</p>
                         ${transaction.type === 'rent' ? `
                             <p><strong>Periode Sewa:</strong> ${transaction.rent_start_date ? new Date(transaction.rent_start_date).toLocaleDateString('id-ID') : '-'} - ${transaction.rent_end_date ? new Date(transaction.rent_end_date).toLocaleDateString('id-ID') : '-'}</p>
                             <p><strong>Deposit Dibayar:</strong> ${formatRupiah(transaction.deposit_paid)}</p>
                         ` : ''}
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold mb-4">Informasi Item</h3>
                         <p><strong>Nama Item:</strong> ${transaction.item_name || 'Tidak Diketahui'}</p>
                         ${transaction.item_photo ? `
                             <img src="http://localhost:5000${transaction.item_photo}" alt="Item Photo" class="w-32 h-32 object-cover rounded mt-2">
                         ` : ''}
                        <!-- Link to item detail page? -->
                         <div class="mt-2">
                             <a href="/#/items/${transaction.item_id}" class="text-blue-600 hover:underline">Lihat Detail Item</a>
                         </div>
                    </div>
                     <div>
                         <h3 class="text-xl font-semibold mb-4">Informasi Pihak Terlibat</h3>
                         <p><strong>Pembeli/Penyewa:</strong> ${transaction.buyer_name || 'Tidak Diketahui'} (${transaction.buyer_email || '-'})</p>
                         <p><strong>Penjual/Pemilik:</strong> ${transaction.seller_name || 'Tidak Diketahui'} (${transaction.seller_email || '-'})</p>
                         <!-- TODO: Add links to user profiles? -->
                     </div>
                     <!-- Add shipping/delivery info if applicable -->
                </div>

                 <!-- Status Update/Action Buttons section -->
                 <div class="mt-6 border-t pt-6">
                     <h3 class="text-xl font-semibold mb-4">Aksi Transaksi</h3>
                     <div id="transaction-actions">
                          ${isSeller && availableSellerStatusTransitions.length > 0 ?
                availableSellerStatusTransitions.map(transition => `
                                <button class="status-update-button bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-3 py-1 rounded mr-2"
                                        data-status="${transition.status}">
                                    ${transition.text}
                                </button>
                            `).join('')
                : isBuyer && availableBuyerStatusTransitions.length > 0 ? // Check if buyer and has actions
                    availableBuyerStatusTransitions.map(transition => `
                                <button class="status-update-button bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-3 py-1 rounded mr-2"
                                        data-status="${transition.status}">
                                    ${transition.text}
                                </button>
                            `).join('')
                    : isSeller ? // Message if seller but no actions available
                        '<p>Tidak ada aksi status yang tersedia untuk Anda sebagai Penjual saat ini.</p>'
                        : isBuyer ? // Message if buyer but no actions available
                            '<p>Tidak ada aksi yang tersedia untuk Anda sebagai Pembeli saat ini.</p>'
                            : '<p>Anda tidak memiliki izin untuk mengambil tindakan pada transaksi ini.</p>' // Default message if not buyer or seller
            }
                     </div>
                 </div>
            </div>
        `;
    }

    renderMessagesSection(isLoading, error, messages, currentUser) {
        console.log("renderMessagesSection called with state:", {
            isLoading,
            error,
            hasMessages: messages.length > 0,
            hasCurrentUser: !!currentUser
        });

        if (isLoading) {
            return '<p>Memuat pesan...</p>';
        }

        if (error) {
            return `<p class="text-red-500">Error memuat pesan: ${error}</p>`;
        }

        if (!currentUser) {
            return '<p class="text-gray-600">Login untuk melihat pesan.</p>';
        }

        const messagesListHtml = messages.length === 0
            ? '<p>Belum ada pesan dalam transaksi ini.</p>'
            : messages.map(message => this.renderMessage(message, currentUser.id)).join('');


        return `
            <div class="bg-gray-100 p-4 rounded-lg shadow-inner">
                <div id="messages-list" class="h-64 overflow-y-auto mb-4 p-2 border rounded bg-white">
                    ${messagesListHtml}
                </div>
                <form id="send-message-form">
                    <div class="flex">
                        <input type="text" id="message-input" placeholder="Ketik pesan..."
                               class="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 sm:text-sm"
                               required>
                        <button type="submit"
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Kirim
                        </button>
                    </div>
                </form>
            </div>
         `;
    }

    renderMessage(message, currentUserId) {
        if (!message) return '';

        const isSender = message.sender_id === currentUserId;
        const alignmentClass = isSender ? 'items-end' : 'items-start';
        const bubbleColorClass = isSender ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-gray-800';
        const senderName = isSender ? 'Anda' : message.sender_name || 'Pengguna'; // Display 'Anda' for current user's message

        return `
             <div class="flex flex-col ${alignmentClass} mb-2">
                 <div class="text-xs text-gray-600 mb-0.5">${senderName}</div>
                 <div class="${bubbleColorClass} p-2 rounded-lg max-w-xs break-words">
                     ${message.content || ''}
                 </div>
                  <div class="text-xs text-gray-500 mt-0.5">
                     ${message.created_at ? new Date(message.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                 </div>
             </div>
         `;
    }


    // Helper function to format Rupiah (can also be in Utils)
    formatRupiah = (money) => {
        if (money === null || money === undefined) return '-';
        const numericMoney = typeof money === 'string' ? parseFloat(money) : money;
        if (isNaN(numericMoney)) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericMoney);
    }

    // Handler for status update API call
    async handleStatusUpdate(transactionId, newStatus) {
        // Ensure transactionId and newStatus are valid before proceeding
        if (!transactionId || !newStatus) {
            console.error('Missing transaction ID or new status for update.');
            alert('Gagal memperbarui status: Informasi tidak lengkap.');
            return;
        }

        // Optional: Confirmation dialog
        const confirmUpdate = confirm(`Apakah Anda yakin ingin mengubah status transaksi ini menjadi "${newStatus}"?`);
        if (!confirmUpdate) {
            return; // User cancelled the action
        }

        try {
            console.log(`Attempting to update transaction ${transactionId} status to: ${newStatus}`);
            // Use authenticatedRequest for PATCH /transactions/:id/status
            const response = await authenticatedRequest(`/transactions/${transactionId}/status`, 'PATCH', {
                status: newStatus,
            });

            if (response.status === 'success') {
                console.log('Transaction status updated successfully:', response.data);
                alert('Status transaksi berhasil diperbarui!');
                // Refresh transaction details after successful update to reflect the new status
                this.fetchTransactionDetails(transactionId); // This will also refetch messages and trigger render

            } else {
                // Handle API error response (e.g., validation errors, unauthorized)
                console.error('Failed to update transaction status:', response.message || 'Unknown error', response);
                let errorMessage = 'Gagal memperbarui status transaksi: ' + (response.message || 'Terjadi kesalahan');
                // Append validation errors if provided by the backend
                if (response.errors && Array.isArray(response.errors)) {
                    errorMessage += '\nValidasi error:';
                    response.errors.forEach(err => {
                        // Check if err object has param and msg properties
                        if (err && err.param && err.msg) {
                            errorMessage += `\n- ${err.param}: ${err.msg}`;
                        } else if (typeof err === 'string') {
                            errorMessage += `\n- ${err}`; // Handle cases where error is just a string
                        }
                    });
                }
                alert(errorMessage);
            }

        } catch (error) {
            // Handle network or other unexpected errors during the API call
            console.error('Error during API request for status update:', error);
            // apiService should ideally handle 401/403 redirection
            alert('Terjadi kesalahan saat memperbarui status transaksi.');
        }
        // No finally block needed here, as fetchTransactionDetails in the success block
        // or the alert in error/catch handles subsequent actions/rendering.
    }
}

// Make sure getUserInfo exists in Utils.js or is defined here if needed.
// If defining here, it should be static.
// Example of adding to Utils.js:
// class Utils { ... static getUserInfo() { ... } ... }

customElements.define('detail-transaction-page', DetailTransactionPage);
