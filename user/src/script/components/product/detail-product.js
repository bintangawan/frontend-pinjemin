import { apiGet, apiPost, authenticatedRequest } from '../../utils/apiService.js';
import Utils from '../../utils/utils.js';
import { fetchUserRecommendations, fetchItemRecommendations } from '../../utils/mlApiService.js';

class DetailProduct extends HTMLElement {
    constructor() {
        super();
        this._itemId = null;
        this._item = null;
        this._reviews = [];
        this.isLoading = true;
        this.error = null;
        this._isCurrentUserReviewed = false;
        this._shouldShowReviewForm = window.location.hash.endsWith('#review');
        this._editingReviewId = null;
        this._showRentForm = false;
        this._userReviewId = null;
        this.userBasedRecommendations = [];
        this.isLoadingUserBasedRecommendations = false;
        this.userBasedRecommendationsError = null;
        this.itemBasedRecommendations = [];
        this.isLoadingItemBasedRecommendations = false;
        this.itemBasedRecommendationsError = null;

        this.handleReviewSubmit = this.handleReviewSubmit.bind(this);
        this.handleBuy = this.handleBuy.bind(this);
        this.handleRent = this.handleRent.bind(this);
        this._handleHashChange = this.handleHashChange.bind(this);
        this.handleRentFormSubmit = this.handleRentFormSubmit.bind(this);
        this.cancelRentForm = this.cancelRentForm.bind(this);
        this.fetchUserBasedRecommendations = this.fetchUserBasedRecommendations.bind(this);
        this.fetchItemBasedRecommendationsForCurrentItem = this.fetchItemBasedRecommendationsForCurrentItem.bind(this);
    }

    set itemId(id) {
        if (this._itemId !== id) {
            this._itemId = id;
            this._shouldShowReviewForm = window.location.hash.endsWith('#review');
            this._editingReviewId = null;
            this._showRentForm = false;

            this.renderContent();
            if (this._itemId) {
                this.fetchItemAndReviews(this._itemId);
                this.fetchUserBasedRecommendations();
            } else {
                this.error = 'ID Item tidak valid.';
                this.isLoading = false;
                this.renderContent();
            }
        }
    }

    async connectedCallback() {
        console.log('Detail Product Component Connected');
        this._shouldShowReviewForm = window.location.hash.endsWith('#review');
        this._editingReviewId = null;

        if (this._itemId) {
            this.renderContent();
            this.fetchItemAndReviews(this._itemId);
            this.fetchUserBasedRecommendations();
        }
        window.addEventListener('hashchange', this._handleHashChange);
    }

    disconnectedCallback() {
        console.log('Detail Product Component Disconnected');
        this.removeEventListeners();
        window.removeEventListener('hashchange', this._handleHashChange);
        this._editingReviewId = null;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'item-id') {
            console.log(`Attribute '${name}' changed from '${oldValue}' to '${newValue}' (type: ${typeof newValue})`);
            const newItemId = (newValue && typeof newValue === 'string' && newValue !== 'undefined') ? newValue : null;
            this.itemId = newItemId;
        }
    }

    static get observedAttributes() {
        return ['item-id'];
    }

    handleHashChange() {
        const oldShouldShow = this._shouldShowReviewForm;
        this._shouldShowReviewForm = window.location.hash.endsWith('#review');
        if (oldShouldShow !== this._shouldShowReviewForm && !this.isLoading && !this.error && this._item) {
            console.log("Hash changed, re-rendering review section visibility.");
            this.renderContent();
        }
    }

    async fetchItemAndReviews(itemId) {
        if (!itemId) {
            console.error("fetchItemAndReviews called without a valid itemId.");
            this.error = 'ID Item tidak valid.';
            this.isLoading = false;
            this.renderContent();
            return;
        }

        this.isLoading = true;
        this.error = null;
        this._item = null;
        this._reviews = [];
        this._isCurrentUserReviewed = false;
        this._editingReviewId = null;
        this._showRentForm = false;
        this._userReviewId = null;

        this.itemBasedRecommendations = [];
        this.isLoadingItemBasedRecommendations = false;
        this.itemBasedRecommendationsError = null;

        this.renderContent();

        try {
            const itemResponse = await apiGet(`/items/${itemId}`);

            if (itemResponse.status === 'success' && itemResponse.data) {
                this._item = itemResponse.data;
                console.log('Fetched item details:', this._item);

                this.fetchItemBasedRecommendationsForCurrentItem(this._item.id);

                const reviewsResponse = await apiGet(`/reviews/item/${itemId}`);

                if (reviewsResponse.status === 'success' && reviewsResponse.data) {
                    this._reviews = Array.isArray(reviewsResponse.data) ? reviewsResponse.data : [];
                    console.log('Fetched reviews:', this._reviews);

                    const currentUser = Utils.getUserInfo();
                    if (currentUser) {
                        const userReview = this._reviews.find(review => review.user_id === currentUser.id);
                        if (userReview) {
                            this._isCurrentUserReviewed = true;
                            this._userReviewId = userReview.id;
                            console.log("Current user has already reviewed this item. Review ID:", this._userReviewId);
                        } else {
                            this._isCurrentUserReviewed = false;
                            this._userReviewId = null;
                            console.log("Current user has not reviewed this item.");
                        }
                    } else {
                        this._isCurrentUserReviewed = false;
                        this._userReviewId = null;
                        console.log("User not logged in. Cannot determine if reviewed.");
                    }

                } else {
                    console.warn('Could not fetch reviews or no reviews found:', reviewsResponse.message, reviewsResponse);
                    this._reviews = [];
                    this._isCurrentUserReviewed = false;
                    this._userReviewId = null;
                }

            } else {
                console.error('Error fetching item details:', itemResponse.message || 'Unknown error', itemResponse);
                this._item = null;
                this._reviews = [];
                this.error = itemResponse.message || 'Gagal memuat detail item.';
                this._isCurrentUserReviewed = false;
                this._userReviewId = null;
            }

        } catch (error) {
            console.error('Error during API request for item or reviews:', error);
            this._item = null;
            this._reviews = [];
            this.error = error.message || 'Terjadi kesalahan saat memuat data.';
            this._isCurrentUserReviewed = false;
            this._userReviewId = null;
        } finally {
            this.isLoading = false;
            this._editingReviewId = null;
            this.renderContent();
        }
    }

    renderContent() {
        console.log("DetailProduct Render called. State:", {
            isLoading: this.isLoading,
            error: this.error,
            hasItem: !!this._item,
            hasReviews: this._reviews.length > 0,
            isCurrentUserReviewed: this._isCurrentUserReviewed,
            shouldShowReviewForm: this._shouldShowReviewForm,
            isLoggedIn: Utils.isAuthenticated(),
            editingReviewId: this._editingReviewId,
            showRentForm: this._showRentForm,
            userReviewId: this._userReviewId,
            hasItemBasedRecommendations: this.itemBasedRecommendations.length > 0,
            isLoadingItemBasedRecommendations: this.isLoadingItemBasedRecommendations,
            itemBasedRecommendationsError: this.itemBasedRecommendationsError
        });

        this.innerHTML = '';

        const itemDetailsHtml = this.renderItemDetails();
        const reviewsSectionHtml = this.renderReviewsSection();
        const rentFormHtml = this.renderRentForm();
        const userBasedRecommendationsHtml = this.renderUserBasedRecommendations();
        const itemBasedRecommendationsHtml = this.renderItemBasedRecommendations();

        this.innerHTML = `
        <div class="container mx-auto px-4 py-8">
            ${itemDetailsHtml}
            ${rentFormHtml}
            ${userBasedRecommendationsHtml}
            ${itemBasedRecommendationsHtml}
            ${reviewsSectionHtml}
        </div>
        `;
        this.setupEventListeners();
    }

    renderItemDetails() {
        if (this.isLoading && !this._item) {
            return '<p>Memuat detail item...</p>';
        }
        if (this.error && !this._item) {
            return `<p class="text-red-500">Error: ${this.error}</p>`;
        }
        if (!this._item) {
            return '<p>Detail item tidak tersedia.</p>';
        }

        const item = this._item;
        const formatRupiah = (money) => {
            if (money === null || money === undefined) return '-';
            const numericMoney = typeof money === 'string' ? parseFloat(money) : money;
            if (isNaN(numericMoney)) return '-';
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericMoney);
        }

        let statusDisplay = item.status || 'Unknown Status';
        let statusColorClass = 'text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold';
        switch (item.status) {
            case 'available':
                statusColorClass = 'text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs font-semibold';
                break;
            case 'rented':
                statusColorClass = 'text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full text-xs font-semibold';
                break;
            case 'sold':
                statusColorClass = 'text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs font-semibold';
                break;
            default:
                statusColorClass = 'text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold';
        }

        const currentUser = Utils.getUserInfo();
        const isOwner = currentUser && this._item && this._item.user_id === currentUser.id;

        const showBuyRentButtons = item.status === 'available' && !isOwner && !this._showRentForm;

        return ` 
        <div class="bg-white shadow-md rounded-lg p-6 mb-8 font-opensan">
            <h2 class="text-2xl font-montserrat font-bold mb-6">${item.name}</h2>
            <div class="grid grid-cols-1 gap-6">
                <!-- Foto Item -->
                <div>
                    ${item.photos && item.photos.length > 0 ? `
                        <div class="mb-6">
                            <!-- Foto Utama -->
                            <img src="http://localhost:5000${item.photos[0]}" alt="${item.name}" 
                                class="w-full h-96 object-cover rounded-md mb-4">
                            
                            <!-- Foto Lainnya -->
                            <div class="flex flex-wrap gap-4">
                                ${item.photos.slice(1).map(photo =>
            `<img src="http://localhost:5000${photo}" alt="${item.name}" 
                                        class="w-full md:w-1/3 h-64 object-cover rounded-md cursor-pointer hover:opacity-75">`
        ).join('')}
                            </div>
                            
                            <!-- Deskripsi di bawah foto -->
                            <div class="mt-6 bg-gray-100 p-4 rounded-md">
                                <h3 class="text-lg font-semibold mb-2">Deskripsi</h3>
                                <p>${item.description || '-'}</p>
                            </div>
                        </div>
                    ` : '<div class="w-full h-64 bg-gray-200 rounded-md mb-6 flex items-center justify-center text-gray-500">Tidak Ada Foto</div>'}
                    
                    ${showBuyRentButtons ? `
                        <div class="flex space-x-4 mt-6">
                            ${item.is_available_for_sell ? `<button id="buy-button" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold">Beli</button>` : ''}
                            ${item.is_available_for_rent ? `<button id="rent-button" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold">Sewa</button>` : ''}
                        </div>
                    ` : isOwner && item.status === 'available' ?
                `<p class="mt-6 text-gray-600">Anda adalah pemilik item ini.</p>`
                : item.status !== 'available' ?
                    `<p class="mt-6 text-gray-600">Item ini saat ini tidak tersedia.</p>`
                    : ''}
                </div>

                <!-- Informasi Lain -->
                <div class="space-y-6">
                    <div class="bg-gray-700 text-white p-4 rounded-md shadow-sm">
                        <h3 class="text-xl font-montserrat font-semibold mb-3">Detail Item</h3>
                        <p><strong>Kategori:</strong> ${item.category_name || '-'}</p>
                        <p><strong>Status Item:</strong> <span class="${statusColorClass}">${statusDisplay}</span></p>
                    </div>

                    <div class="bg-gray-700 text-white p-4 rounded-md shadow-sm">
                        <h3 class="text-xl font-montserrat font-semibold mb-3">Informasi Harga</h3>
                        ${item.is_available_for_sell ? `<p><strong>Harga Jual:</strong> ${formatRupiah(item.price_sell)}</p>` : ''}
                        ${item.is_available_for_rent ? `
                            <p><strong>Harga Sewa per Hari:</strong> ${formatRupiah(item.price_rent)}</p>
                            <p><strong>Deposit Sewa:</strong> ${formatRupiah(item.deposit_amount)}</p>
                        ` : ''}
                    </div>

                    <div class="bg-gray-700 text-white p-4 rounded-md shadow-sm">
                        <h3 class="text-xl font-montserrat font-semibold mb-3">Lokasi & Penjual</h3>
                        <p><strong>Lokasi:</strong> ${item.city_name || '-'}, ${item.province_name || '-'}</p>
                        <p><strong>Penjual:</strong> ${item.owner_name || 'Tidak Diketahui'} (${item.owner_email || '-'})</p>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    renderReviewsSection() {
        let reviewsHtml = '';

        if (this.isLoading && !this._item) {
            reviewsHtml = '<p>Memuat review...</p>';
        } else if (this.error && !this._item) {
            reviewsHtml = '';
        } else if (this._reviews.length === 0) {
            reviewsHtml = '<p>Belum ada review untuk item ini.</p>';
        } else {
            reviewsHtml = `
                <div class="space-y-4">
                    ${this._reviews.map(review => this.renderReview(review)).join('')}
                </div>
            `;
        }

        const currentUser = Utils.getUserInfo();
        const showAddReviewForm = currentUser && !!this._item &&
            !this._isCurrentUserReviewed &&
            this._shouldShowReviewForm &&
            this._editingReviewId === null;

        return `
            <div class="bg-white shadow-md rounded-lg p-6 mt-8">
                <h3 class="text-xl font-bold mb-4">Review Pengguna (${this._reviews.length})</h3>

                 ${showAddReviewForm ? this.renderReviewForm() : ''}

                <div id="reviews-list" class="mt-4">
                    ${reviewsHtml}
                </div>
            </div>
        `;
    }

    renderReviewForm() {
        if (!this._item || !Utils.isAuthenticated() || this._isCurrentUserReviewed || this._editingReviewId !== null) {
            return '';
        }

        return `
            <div id="review-form-section" class="mb-6 p-4 border rounded-md bg-gray-50">
                <h4 class="text-lg font-semibold mb-3">Tulis Review Anda</h4>
                <form id="add-review-form">
                    <div class="mb-3">
                        <label for="review-comment" class="block text-sm font-medium text-gray-700">Komentar</label>
                        <textarea id="review-comment" name="comment" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 sm:text-sm" required></textarea>
                    </div>
                    <button type="submit" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Kirim Review
                    </button>
                </form>
            </div>
        `;
    }

    renderEditReviewForm(review) {
        if (!review || !Utils.isAuthenticated()) {
            return '';
        }

        if (this._editingReviewId !== review.id) {
            console.warn(`renderEditReviewForm called for review ID ${review.id} but editingReviewId is ${this._editingReviewId}. Skipping.`);
            return '';
        }

        console.log(`Rendering edit form for review ID: ${review.id}`);

        return `
             <div class="mt-2 mb-4 p-4 border rounded-md bg-blue-50">
                 <h4 class="text-lg font-semibold mb-3">Edit Review Anda</h4>
                 <form class="edit-review-form" data-review-id="${review.id}">
                     <div class="mb-3">
                         <label for="edit-review-comment-${review.id}" class="block text-sm font-medium text-gray-700">Komentar</label>
                         <textarea id="edit-review-comment-${review.id}" name="comment" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 sm:text-sm" required>${review.comment || ''}</textarea>
                     </div>
                      <div class="flex space-x-2">
                          <button type="submit" class="save-edit-button inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              Simpan Perubahan
                          </button>
                           <button type="button" class="cancel-edit-button inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus-ring-offset-2 focus:ring-indigo-500">
                               Batal
                           </button>
                      </div>
                 </form>
             </div>
        `;
    }

    renderReview(review) {
        if (!review) return '';

        const currentUser = Utils.getUserInfo();
        const isCurrentUserReview = currentUser && currentUser.id === review.user_id;

        if (isCurrentUserReview && this._editingReviewId === review.id) {
            console.log(`Rendering edit form for current user's review with ID: ${review.id} within the list.`);
            return this.renderEditReviewForm(review);
        }

        return `
            <div class="border-b pb-4 mb-4" data-review-id="${review.id}">
                <p class="font-semibold">${review.user_name || 'Pengguna Tidak Diketahui'}</p>
                <p class="text-gray-700 mt-1" id="review-comment-${review.id}">${review.comment || '-'}</p>
                <p class="text-gray-500 text-sm mt-1">
                    Direview pada: ${review.created_at ? new Date(review.created_at).toLocaleDateString('id-ID') : '-'}
                </p>
                ${isCurrentUserReview && this._editingReviewId === null ? `
                     <div class="mt-2 text-sm flex items-center space-x-2">
                         <button class="edit-review-button text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full text-xs font-semibold hover:underline" data-review-id="${review.id}">Edit</button>
                         <button class="delete-review-button text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs font-semibold hover:underline" data-review-id="${review.id}">Hapus</button>
                     </div>
                 ` : ''}
            </div>
        `;
    }

    renderRentForm() {
        if (!this._showRentForm || !this._item || !Utils.isAuthenticated()) {
            return '';
        }

        const today = new Date().toISOString().split('T')[0];
        const item = this._item;
        const formatRupiah = this.formatRupiah;

        return `
            <div id="rent-form-section" class="bg-white shadow-md rounded-lg p-6 mt-8 mb-8">
                <h3 class="text-xl font-bold mb-4">Formulir Penyewaan: ${item.name}</h3>
                 <p class="mb-4">Harga Sewa per Hari: ${formatRupiah(item.price_rent)}, Deposit: ${formatRupiah(item.deposit_amount)}</p>
                <form id="rent-item-form">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="rent-start-date" class="block text-sm font-medium text-gray-700">Tanggal Mulai Sewa</label>
                            <input type="date" id="rent-start-date" name="rent_start_date"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 sm:text-sm"
                                required min="${today}">
                        </div>
                        <div>
                            <label for="rent-end-date" class="block text-sm font-medium text-gray-700">Tanggal Selesai Sewa</label>
                            <input type="date" id="rent-end-date" name="rent_end_date"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 sm:text-sm"
                                required min="${today}">
                        </div>
                    </div>
                    <div class="flex space-x-2 mt-6">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                            Ajukan Penyewaan
                        </button>
                         <button type="button" id="cancel-rent-button" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">
                             Batal
                         </button>
                    </div>
                </form>
            </div>
        `;
    }

    renderUserBasedRecommendations() {
        const currentUser = Utils.getUserInfo();
        if (!currentUser || !currentUser.id || this.isLoading || this.error || !this._item) {
            return '';
        }

        if (this.isLoadingUserBasedRecommendations) {
            return `
                <div class="bg-gray-800 text-white shadow-md rounded-lg p-6 mt-8 mb-8 font-opensan">
                    <h3 class="text-xl font-montserrat font-bold mb-4 text-white">Produk yang Anda Sukai (Rekomendasi User Based)</h3>
                    <p class="text-gray-300">Memuat rekomendasi...</p>
                </div>
            `;
        }

        if (this.userBasedRecommendationsError) {
            return `
                <div class="bg-red-800 text-white shadow-md rounded-lg p-6 mt-8 mb-8 font-opensan">
                    <h3 class="text-xl font-montserrat font-bold mb-4 text-white">Produk yang Anda Sukai (Rekomendasi User Based)</h3>
                    <p>Error memuat rekomendasi: ${this.userBasedRecommendationsError}</p>
                </div>
            `;
        }

        if (!this.userBasedRecommendations || this.userBasedRecommendations.length === 0) {
            return `
                <div class="bg-gray-800 text-white shadow-md rounded-lg p-6 mt-8 mb-8 font-opensan">
                    <h3 class="text-xl font-montserrat font-bold mb-4 text-white">Produk yang Anda Sukai (Rekomendasi User Based)</h3>
                    <p class="text-gray-300">Tidak ada rekomendasi user based yang tersedia saat ini.</p>
                </div>
            `;
        }

        const backendBaseUrl = 'http://localhost:5000';
        const formatRupiah = this.formatRupiah;

        const recommendationsListHtml = this.userBasedRecommendations.map(rec => {
            return `
                <div class="bg-gray-700 text-white p-4 rounded-md shadow-sm flex-shrink-0 w-64">
                    <a href="/#/items/${rec.id || rec.product_id}" class="block">
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
            <div class="bg-gray-800 text-white shadow-md rounded-lg p-6 mt-8 mb-8 font-opensan">
                <h3 class="text-xl font-montserrat font-bold mb-4 text-white">Produk yang Anda Sukai (Rekomendasi User Based)</h3>
                <div class="flex overflow-x-auto space-x-4 pb-4 hide-scrollbar">
                    ${recommendationsListHtml}
                </div>
            </div>
        `;
    }

    renderItemBasedRecommendations() {
        if (this.isLoading || this.error || !this._item) {
            return '';
        }

        if (this.isLoadingItemBasedRecommendations) {
            return `
                 <div class="bg-white shadow-md rounded-lg p-6 mt-8 mb-8 font-opensan">
                     <h3 class="text-xl font-montserrat font-bold mb-4 text-gray-900">Produk Serupa Lainnya (Rekomendasi Item Based)</h3>
                      <p class="text-gray-700">Memuat rekomendasi serupa...</p>
                 </div>
            `;
        }

        if (this.itemBasedRecommendationsError) {
            return `
                  <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-8 mb-8" role="alert">
                     <strong class="font-bold">Error!</strong>
                      <span class="block sm:inline">${this.itemBasedRecommendationsError}</span>
                  </div>
             `;
        }

        if (!this.itemBasedRecommendations || this.itemBasedRecommendations.length === 0) {
            return `
                <div class="bg-white shadow-md rounded-lg p-6 mt-8 mb-8 font-opensan">
                    <h3 class="text-xl font-montserrat font-bold mb-4 text-gray-900">Produk Serupa Lainnya (Rekomendasi Item Based)</h3>
                    <p class="text-gray-700">Tidak ada rekomendasi serupa yang tersedia saat ini.</p>
                </div>
            `;
        }

        const backendBaseUrl = 'http://localhost:5000';
        const formatRupiah = this.formatRupiah;

        const recommendationsListHtml = this.itemBasedRecommendations.map(rec => {
            return `
                <div class="bg-gray-100 rounded-lg shadow-sm p-4 flex-shrink-0 w-64">
                     <a href="/#/items/${rec.id || rec.product_id}" class="block text-gray-900">
                         <div class="flex items-center space-x-3 mb-3">
                             ${rec.thumbnail ? `<img src="${backendBaseUrl}${rec.thumbnail}" alt="${rec.name || 'Product image'}" class="w-16 h-16 object-cover rounded">` : '<div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">No Img</div>'}
                            <div class="flex-grow">
                                <h5 class="text-base font-montserrat font-bold mb-1 truncate">${rec.name || rec.product_name || 'Unnamed Product'}</h5>
                                <div class="flex items-center space-x-1">
                                    ${rec.is_available_for_rent ? `<span class="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-md font-opensan">Sewa</span>` : ''}
                                    ${rec.is_available_for_sell ? `<span class="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-md font-opensan">Jual</span>` : ''}
                                </div>
                            </div>
                         </div>
                         <div class="space-y-1 border-t border-gray-300 pt-3">
                            ${rec.is_available_for_sell ? `<p class="text-sm font-opensan font-semibold">Jual: ${formatRupiah(rec.price_sell)}</p>` : ''}
                             ${rec.is_available_for_rent ? `<p class="text-sm font-opensan font-semibold">Sewa: ${formatRupiah(rec.price_rent)}${rec.price_rent > 0 ? ' /hari' : ''}</p>` : ''}
                         </div>
                     </a>
                 </div>
             `;
        }).join('');

        return `
            <div class="bg-white shadow-md rounded-lg p-6 mt-8 mb-8 font-opensan">
                <h3 class="text-xl font-montserrat font-bold mb-4 text-gray-900">Produk Serupa Lainnya (Rekomendasi Item Based)</h3>
                 <div class="flex overflow-x-auto space-x-4 pb-4 hide-scrollbar">
                     ${recommendationsListHtml}
                 </div>
            </div>
        `;
    }

    setupEventListeners() {
        this.removeEventListeners();

        const addReviewForm = this.querySelector('#add-review-form');
        if (addReviewForm) {
            this._addReviewFormSubmitHandler = this.handleReviewSubmit;
            addReviewForm.addEventListener('submit', this._addReviewFormSubmitHandler);
            console.log('Add review form listener added.');

            if (window.location.hash.endsWith('#review') && this._shouldShowReviewForm) {
                const reviewFormSection = this.querySelector('#review-form-section');
                if (reviewFormSection) {
                    requestAnimationFrame(() => {
                        reviewFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                }
            }
        }

        const reviewsList = this.querySelector('#reviews-list');
        if (reviewsList) {
            this._reviewActionsDelegate = (event) => {
                const target = event.target;
                const reviewId = target.dataset.reviewId || target.closest('[data-review-id]')?.dataset.reviewId;
                const isButton = target.tagName === 'BUTTON';

                if (isButton && target.closest('.edit-review-form')) {
                    const form = target.closest('.edit-review-form');
                    const formReviewId = form ? parseInt(form.dataset.reviewId, 10) : null;
                    if (!formReviewId) return;

                    if (target.classList.contains('save-edit-button')) {
                        console.log(`Save button clicked for review ID (from form): ${formReviewId}`);
                        this.handleEditSubmit(event, formReviewId);
                        return;
                    } else if (target.classList.contains('cancel-edit-button')) {
                        console.log(`Cancel button clicked for review ID (from form): ${formReviewId}`);
                        this.cancelEditReview(event);
                        return;
                    }
                }

                if (isButton && reviewId) {
                    if (target.classList.contains('edit-review-button')) {
                        console.log(`Edit button clicked for review ID: ${reviewId}`);
                        this.handleEditReview(parseInt(reviewId, 10));
                    } else if (target.classList.contains('delete-review-button')) {
                        console.log(`Delete button clicked for review ID: ${reviewId}`);
                        this.handleDeleteReview(parseInt(reviewId, 10));
                    }
                }
            };
            reviewsList.addEventListener('click', this._reviewActionsDelegate);
            console.log('Reviews list click delegate added.');
        }

        const buyButton = this.querySelector('#buy-button');
        if (buyButton) {
            this._buyButtonClickHandler = this.handleBuy;
            buyButton.addEventListener('click', this._buyButtonClickHandler);
            console.log('Buy button listener added.');
        }

        const rentButton = this.querySelector('#rent-button');
        if (rentButton) {
            this._rentButtonClickHandler = this.handleRent;
            rentButton.addEventListener('click', this._rentButtonClickHandler);
            console.log('Rent button listener added.');
        }

        const rentItemForm = this.querySelector('#rent-item-form');
        if (rentItemForm) {
            this._rentFormSubmitHandler = this.handleRentFormSubmit;
            rentItemForm.addEventListener('submit', this._rentFormSubmitHandler);
            console.log('Rent item form submit listener added.');

            const cancelRentButton = rentItemForm.querySelector('#cancel-rent-button');
            if (cancelRentButton) {
                this._cancelRentButtonClickHandler = this.cancelRentForm;
                cancelRentButton.addEventListener('click', this._cancelRentButtonClickHandler);
                console.log('Cancel rent button listener added.');
            }

            requestAnimationFrame(() => {
                rentItemForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    removeEventListeners() {
        const addReviewForm = this.querySelector('#add-review-form');
        if (addReviewForm && this._addReviewFormSubmitHandler) {
            addReviewForm.removeEventListener('submit', this._addReviewFormSubmitHandler);
            this._addReviewFormSubmitHandler = null;
            console.log('Add review form listener removed.');
        }

        const reviewsList = this.querySelector('#reviews-list');
        if (reviewsList && this._reviewActionsDelegate) {
            reviewsList.removeEventListener('click', this._reviewActionsDelegate);
            this._reviewActionsDelegate = null;
            console.log('Reviews list click delegate removed.');
        }

        const buyButton = this.querySelector('#buy-button');
        if (buyButton && this._buyButtonClickHandler) {
            buyButton.removeEventListener('click', this._buyButtonClickHandler);
            this._buyButtonClickHandler = null;
            console.log('Buy button listener removed.');
        }

        const rentButton = this.querySelector('#rent-button');
        if (rentButton && this._rentButtonClickHandler) {
            rentButton.removeEventListener('click', this._rentButtonClickHandler);
            this._rentButtonClickHandler = null;
            console.log('Rent button listener removed.');
        }

        const rentItemForm = this.querySelector('#rent-item-form');
        if (rentItemForm && this._rentFormSubmitHandler) {
            rentItemForm.removeEventListener('submit', this._rentFormSubmitHandler);
            this._rentFormSubmitHandler = null;
            console.log('Rent item form submit listener removed.');
        }

        const cancelRentButton = this.querySelector('#cancel-rent-button');
        if (cancelRentButton && this._cancelRentButtonClickHandler) {
            cancelRentButton.removeEventListener('click', this._cancelRentButtonClickHandler);
            this._cancelRentButtonClickHandler = null;
            console.log('Cancel rent button listener removed.');
        }
    }

    async handleReviewSubmit(event) {
        event.preventDefault();

        const currentUser = Utils.getUserInfo();
        if (!currentUser || !this._item || !this._item.id) {
            alert('Anda harus login dan item harus valid untuk mengirim review.');
            return;
        }

        const form = event.target;
        const commentTextarea = form.querySelector('#review-comment');
        const comment = commentTextarea ? commentTextarea.value.trim() : '';

        if (!comment) {
            alert('Komentar review tidak boleh kosong.');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;

        try {
            console.log(`Submitting NEW review for item ID: ${this._item.id}`);
            const response = await authenticatedRequest(`/reviews/item/${this._item.id}`, 'POST', {
                comment: comment
            });

            if (response.status === 'success') {
                console.log('New review submitted successfully:', response.data);
                alert('Review berhasil dikirim!');
                if (commentTextarea) commentTextarea.value = '';
                this._shouldShowReviewForm = false;
                await this.fetchItemAndReviews(this._item.id);

            } else {
                console.error('Failed to submit new review:', response.message || 'Unknown error', response);
                let errorMessage = response.message || 'Gagal mengirim review baru.';
                if (response.errors && Array.isArray(response.errors)) {
                    errorMessage += '\nValidasi error:';
                    response.errors.forEach(err => {
                        if (err.param && err.msg) {
                            errorMessage += `\n- ${err.param}: ${err.msg}`;
                        } else if (typeof err === 'string') {
                            errorMessage += `\n- ${err}`;
                        }
                    });
                }
                alert(errorMessage);
            }

        } catch (error) {
            console.error('Error during API request for submitting new review:', error);
            alert('Terjadi kesalahan saat mengirim review baru.');
        } finally {
            if (submitButton && this._shouldShowReviewForm) submitButton.disabled = false;
        }
    }

    handleEditReview(reviewId) {
        console.log(`Handling Edit button click for review ID: ${reviewId}`);
        if (this._editingReviewId === parseInt(reviewId, 10)) {
            console.log("Already editing this review.");
            return;
        }
        if (this._editingReviewId !== null) {
            console.log(`Cancelling edit for review ID: ${this._editingReviewId} before starting new edit.`);
            this.cancelEditReview();
        }

        const reviewToEdit = this._reviews.find(review => review.id === parseInt(reviewId, 10));

        if (!reviewToEdit) {
            console.error(`Review with ID ${reviewId} not found in current data.`);
            alert('Review tidak ditemukan.');
            return;
        }

        this._editingReviewId = reviewToEdit.id;

        this.renderContent();

        requestAnimationFrame(() => {
            const editForm = this.querySelector(`.edit-review-form[data-review-id="${reviewId}"]`);
            if (editForm) {
                editForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    cancelEditReview() {
        if (this._editingReviewId !== null) {
            console.log(`Cancelling edit for review ID: ${this._editingReviewId}`);
            this._editingReviewId = null;
            this.renderContent();
        }
    }

    async handleEditSubmit(event, reviewId) {
        event.preventDefault();

        const currentUser = Utils.getUserInfo();
        if (!currentUser || !this._item || !this._item.id || !reviewId) {
            alert('Informasi tidak lengkap untuk memperbarui review.');
            return;
        }

        const form = event.target.closest('.edit-review-form');
        if (!form) {
            console.error("Edit form not found.");
            alert("Form edit tidak ditemukan.");
            return;
        }

        const commentTextarea = form.querySelector(`#edit-review-comment-${reviewId}`);
        const comment = commentTextarea ? commentTextarea.value.trim() : '';

        if (!comment) {
            alert('Komentar review tidak boleh kosong.');
            const saveButton = form.querySelector('.save-edit-button');
            if (saveButton) saveButton.disabled = false;
            const cancelButton = form.querySelector('.cancel-edit-button');
            if (cancelButton) cancelButton.disabled = false;
            return;
        }

        const saveButton = form.querySelector('.save-edit-button');
        if (saveButton) saveButton.disabled = true;
        const cancelButton = form.querySelector('.cancel-edit-button');
        if (cancelButton) cancelButton.disabled = true;

        try {
            console.log(`Submitting UPDATE for review ID: ${reviewId}`);
            const response = await authenticatedRequest(`/reviews/${reviewId}`, 'PATCH', {
                comment: comment
            });

            if (response.status === 'success') {
                console.log('Review updated successfully:', response.data);
                alert('Review berhasil diperbarui!');
                this._editingReviewId = null;
                await this.fetchItemAndReviews(this._item.id);

            } else {
                console.error('Failed to update review:', response.message || 'Unknown error', response);
                let errorMessage = response.message || 'Gagal memperbarui review.';
                if (response.errors && Array.isArray(response.errors)) {
                    errorMessage += '\nValidasi error:';
                    response.errors.forEach(err => {
                        if (err.param && err.msg) {
                            errorMessage += `\n- ${err.param}: ${err.msg}`;
                        } else if (typeof err === 'string') {
                            errorMessage += `\n- ${err}`;
                        }
                    });
                }
                alert(errorMessage);
            }

        } catch (error) {
            console.error('Error during API request for updating review:', error);
            alert('Terjadi kesalahan saat memperbarui review.');
        } finally {
            if (this._editingReviewId === reviewId) {
                if (saveButton) saveButton.disabled = false;
                if (cancelButton) cancelButton.disabled = false;
            }
        }
    }

    async handleDeleteReview(reviewId) {
        console.log(`Attempting to delete review ID: ${reviewId}`);

        const confirmDelete = confirm('Apakah Anda yakin ingin menghapus review ini?');
        if (!confirmDelete) {
            console.log('Delete cancelled by user.');
            return;
        }

        try {
            const response = await authenticatedRequest(`/reviews/${reviewId}`, 'DELETE');

            if (response.status === 'success') {
                console.log('Review deleted successfully:', response.message);
                alert('Review berhasil dihapus!');
                await this.fetchItemAndReviews(this._item.id);

            } else {
                console.error('Failed to delete review:', response.message || 'Unknown error', response);
                alert('Gagal menghapus review: ' + (response.message || 'Terjadi kesalahan.'));
            }

        } catch (error) {
            console.error('Error during API request for deleting review:', error);
            alert('Terjadi kesalahan saat menghapus review.');
        }
    }

    async handleBuy() {
        console.log('Buy button clicked');
        const currentUser = Utils.getUserInfo();
        if (!currentUser || !this._item || !this._item.id) {
            alert('Anda harus login untuk melakukan pembelian.');
            return;
        }

        const confirmBuy = confirm(`Apakah Anda yakin ingin membeli "${this._item.name}" dengan harga ${this.formatRupiah(this._item.price_sell)}?`);
        if (!confirmBuy) {
            return;
        }

        try {
            console.log(`Attempting to create BUY transaction for item ID: ${this._item.id}`);
            const response = await authenticatedRequest('/transactions', 'POST', {
                item_id: this._item.id,
                type: 'buy',
            });

            if (response.status === 'success' && response.data) {
                console.log('Buy transaction created successfully:', response.data);
                alert('Transaksi pembelian berhasil dibuat!');
                window.location.hash = `#/transactions/${response.data.id}`;
            } else {
                console.error('Failed to create buy transaction:', response.message || 'Unknown error');
                alert('Gagal membuat transaksi pembelian: ' + (response.message || 'Terjadi kesalahan.'));
            }
        } catch (error) {
            console.error('Error during API request for buy transaction:', error);
            alert('Terjadi kesalahan saat membuat transaksi pembelian.');
        }
    }

    async handleRent() {
        console.log('Rent button clicked. Showing rent form.');
        if (!this._item || !Utils.isAuthenticated() || this._item.status !== 'available') {
            console.warn('Cannot show rent form: Missing item, not logged in, or item not available.');
            alert('Item tidak tersedia atau Anda harus login.');
            return;
        }

        this._showRentForm = true;
        this.renderContent();
    }

    async handleRentFormSubmit(event) {
        event.preventDefault();
        console.log('Rent form submitted.');

        const form = event.target;
        const startDateInput = form.querySelector('#rent-start-date');
        const endDateInput = form.querySelector('#rent-end-date');

        const startDate = startDateInput ? startDateInput.value : null;
        const endDate = endDateInput ? endDateInput.value : null;

        if (!startDate || !endDate) {
            alert('Tanggal mulai dan selesai sewa harus diisi.');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            alert("Format tanggal tidak valid.");
            return;
        }

        if (start < today || end < today) {
            alert("Tanggal sewa tidak boleh di masa lalu.");
            return;
        }

        if (start >= end) {
            alert("Tanggal selesai sewa harus setelah tanggal mulai sewa.");
            return;
        }

        const currentUser = Utils.getUserInfo();
        if (!currentUser || !this._item || !this._item.id) {
            alert('Anda harus login dan item harus valid untuk mengajukan penyewaan.');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        const cancelButton = form.querySelector('#cancel-rent-button');
        if (cancelButton) cancelButton.disabled = true;

        try {
            console.log(`Attempting to create RENT transaction for item ID: ${this._item.id} from ${startDate} to ${endDate}`);
            const response = await authenticatedRequest('/transactions', 'POST', {
                item_id: this._item.id,
                type: 'rent',
                rent_start_date: startDate,
                rent_end_date: endDate,
            });

            if (response.status === 'success' && response.data) {
                console.log('Rent transaction created successfully:', response.data);
                alert('Transaksi penyewaan berhasil dibuat!');
                this._showRentForm = false;
                window.location.hash = `#/transactions/${response.data.id}`;
            } else {
                console.error('Failed to create rent transaction:', response.message || 'Unknown error');
                alert('Gagal membuat transaksi penyewaan: ' + (response.message || 'Terjadi kesalahan.'));
            }
        } catch (error) {
            console.error('Error during API request for rent transaction:', error);
            alert('Terjadi kesalahan saat membuat transaksi penyewaan.');
        } finally {
            this._showRentForm = false;
            this.renderContent();
        }
    }

    cancelRentForm() {
        console.log('Cancel rent form button clicked.');
        this._showRentForm = false;
        this.renderContent();
    }

    formatRupiah = (money) => {
        if (money === null || money === undefined) return '-';
        const numericMoney = typeof money === 'string' ? parseFloat(money) : money;
        if (isNaN(numericMoney)) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericMoney);
    }

    async fetchUserBasedRecommendations() {
        const currentUser = Utils.getUserInfo();
        if (!currentUser || !currentUser.id || this.isLoading || this.error || !this._item) {
            console.log("Skipping User Based Recommendations fetch: User not logged in, or item not loaded, or loading/error state.");
            this.userBasedRecommendations = [];
            this.isLoadingUserBasedRecommendations = false;
            this.userBasedRecommendationsError = null;
            return;
        }

        this.isLoadingUserBasedRecommendations = true;
        this.userBasedRecommendationsError = null;
        this.renderContent();

        const topN = 5;

        try {
            console.log(`Fetching initial User Based recommendations for user ID: ${currentUser.id} from ML API.`);
            const mlResult = await fetchUserRecommendations(currentUser.id, topN);
            console.log('Fetched initial User Based recommendations from ML API:', mlResult);

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

                this.userBasedRecommendations = results.filter(item => item !== null);

                this.isLoadingUserBasedRecommendations = false;

                if (mlResult.recommendations.length > 0 && this.userBasedRecommendations.length === 0) {
                    this.userBasedRecommendationsError = 'Gagal memuat detail untuk rekomendasi.';
                } else {
                    this.userBasedRecommendationsError = null;
                }

            } else {
                this.userBasedRecommendations = [];
                this.isLoadingUserBasedRecommendations = false;
                this.userBasedRecommendationsError = mlResult.message || 'Tidak ada rekomendasi yang ditemukan dari ML API.';
                console.warn('ML API returned no recommendations or invalid data:', mlResult);
            }

        } catch (error) {
            console.error('Error during ML API fetch or subsequent detail fetch:', error);
            this.userBasedRecommendations = [];
            this.isLoadingUserBasedRecommendations = false;
            this.userBasedRecommendationsError = error.message || 'Terjadi kesalahan saat memuat rekomendasi.';
        } finally {
            this.renderContent();
        }
    }

    async fetchItemBasedRecommendationsForCurrentItem(basedOnItemId) {
        if (!basedOnItemId) {
            console.log('No item ID provided to base Item Based recommendations on in DetailProduct.');
            this.itemBasedRecommendations = [];
            this.isLoadingItemBasedRecommendations = false;
            this.itemBasedRecommendationsError = null;
            this.renderContent();
            return;
        }

        this.isLoadingItemBasedRecommendations = true;
        this.itemBasedRecommendationsError = null;
        this.renderContent();

        const topN = 5;

        try {
            console.log(`Fetching Item Based recommendations for product ID: ${basedOnItemId} from ML API in DetailProduct.`);
            const mlResult = await fetchItemRecommendations(basedOnItemId, topN);
            console.log('Fetched Item Based recommendations from ML API in DetailProduct:', mlResult);

            if (mlResult && Array.isArray(mlResult.recommendations) && mlResult.recommendations.length > 0) {
                console.log(`Fetching full details for ${mlResult.recommendations.length} recommended items from main API in DetailProduct.`);
                const recommendationPromises = mlResult.recommendations.map(async (rec) => {
                    try {
                        const itemDetailResponse = await apiGet(`/items/${rec.product_id}`);
                        if (itemDetailResponse.status === 'success' && itemDetailResponse.data) {
                            return {
                                ...rec,
                                ...itemDetailResponse.data
                            };
                        } else {
                            console.warn(`Failed to fetch details for recommended item ID ${rec.product_id} in DetailProduct:`, itemDetailResponse.message || 'Unknown error');
                            return null;
                        }
                    } catch (detailError) {
                        console.error(`Error fetching details for recommended item ID ${rec.product_id} in DetailProduct:`, detailError);
                        return null;
                    }
                });

                const results = await Promise.all(recommendationPromises);

                this.itemBasedRecommendations = results.filter(item => item !== null && item.id !== this._item.id);

                this.isLoadingItemBasedRecommendations = false;

                if (mlResult.recommendations.length > 0 && this.itemBasedRecommendations.length === 0) {
                    if (mlResult.recommendations.length > 0) {
                        this.itemBasedRecommendationsError = 'Tidak ada rekomendasi serupa yang ditemukan atau detail gagal dimuat.';
                    } else {
                        this.itemBasedRecommendationsError = 'Tidak ada rekomendasi serupa yang ditemukan dari ML API.';
                    }
                } else {
                    this.itemBasedRecommendationsError = null;
                }

            } else {
                this.itemBasedRecommendations = [];
                this.isLoadingItemBasedRecommendations = false;
                this.itemBasedRecommendationsError = mlResult.message || 'Tidak ada rekomendasi serupa yang ditemukan dari ML API.';
                console.warn('ML API returned no recommendations or invalid data in DetailProduct:', mlResult);
            }

        } catch (error) {
            console.error('Error during ML API fetch or subsequent detail fetch for item-based recommendations in DetailProduct:', error);
            this.itemBasedRecommendations = [];
            this.isLoadingItemBasedRecommendations = false;
            this.itemBasedRecommendationsError = error.message || 'Terjadi kesalahan saat memuat rekomendasi serupa.';
        } finally {
            this.renderContent();
        }
    }
}

customElements.define('detail-product', DetailProduct);
