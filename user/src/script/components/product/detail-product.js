import { apiGet, authenticatedRequest } from "../../utils/apiService.js"
import Utils from "../../utils/utils.js"
import { fetchItemRecommendations } from "../../utils/mlApiService.js"
import Swal from 'sweetalert2'

class DetailProduct extends HTMLElement {
  constructor() {
    super()
    this._itemId = null
    this._item = null
    this._reviews = []
    this.isLoading = true
    this.error = null
    this._isCurrentUserReviewed = false
    this._shouldShowReviewForm = window.location.hash.endsWith("#review")
    this._editingReviewId = null
    this._showRentForm = false
    this._userReviewId = null
    this.itemBasedRecommendations = []
    this.isLoadingItemBasedRecommendations = false
    this.itemBasedRecommendationsError = null
    this._currentPhotoIndex = 0
    this._itemRecScrollPosition = 0
    this._hasCompletedTransaction = false

    this.handleReviewSubmit = this.handleReviewSubmit.bind(this)
    this.handleBuy = this.handleBuy.bind(this)
    this.handleRent = this.handleRent.bind(this)
    this._handleHashChange = this.handleHashChange.bind(this)
    this.handleRentFormSubmit = this.handleRentFormSubmit.bind(this)
    this.cancelRentForm = this.cancelRentForm.bind(this)
    this.fetchItemBasedRecommendationsForCurrentItem = this.fetchItemBasedRecommendationsForCurrentItem.bind(this)
  }

  set itemId(id) {
    if (this._itemId !== id) {
      this._itemId = id
      this._shouldShowReviewForm = window.location.hash.endsWith("#review")
      this._editingReviewId = null
      this._showRentForm = false
      this._currentPhotoIndex = 0
      this._itemRecScrollPosition = 0

      this.renderContent()
      if (this._itemId) {
        this.fetchItemAndReviews(this._itemId)
      } else {
        this.error = "ID Item tidak valid."
        this.isLoading = false
        this.renderContent()
      }
    }
  }

  async connectedCallback() {
    this._shouldShowReviewForm = window.location.hash.endsWith("#review")
    this._editingReviewId = null

    if (this._itemId) {
      this.renderContent()
      this.fetchItemAndReviews(this._itemId)
    }
    window.addEventListener("hashchange", this._handleHashChange)
  }

  disconnectedCallback() {
    this.removeEventListeners()
    window.removeEventListener("hashchange", this._handleHashChange)
    this._editingReviewId = null
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "item-id") {
      const newItemId = newValue && typeof newValue === "string" && newValue !== "undefined" ? newValue : null
      this.itemId = newItemId
    }
  }

  static get observedAttributes() {
    return ["item-id"]
  }

  handleHashChange() {
    const oldShouldShow = this._shouldShowReviewForm
    this._shouldShowReviewForm = window.location.hash.endsWith("#review")
    if (oldShouldShow !== this._shouldShowReviewForm && !this.isLoading && !this.error && this._item) {
      this.renderContent()
    }
  }

  // Helper method to get standardized status display
  getStatusInfo(item) {
    const status = item.status || "available"

    switch (status) {
      case "available":
        return {
          display: "Available",
          class: "status-available",
          canTransact: true,
        }
      case "pending":
        return {
          display: "Pending",
          class: "status-pending",
          canTransact: false,
        }
      case "rented":
        return {
          display: "Rented",
          class: "status-rented",
          canTransact: false,
        }
      case "sold":
        return {
          display: "Sold",
          class: "status-sold",
          canTransact: false,
        }
      case "ongoing":
        return {
          display: "Ongoing",
          class: "status-ongoing",
          canTransact: false,
        }
      default:
        return {
          display: status,
          class: "status-default",
          canTransact: false,
        }
    }
  }

  async fetchItemAndReviews(itemId) {
    if (!itemId) {
      this.error = "ID Item tidak valid."
      this.isLoading = false
      this.renderContent()
      return
    }

    this.isLoading = true
    this.error = null
    this._item = null
    this._reviews = []
    this._isCurrentUserReviewed = false
    this._editingReviewId = null
    this._showRentForm = false
    this._userReviewId = null
    this._currentPhotoIndex = 0
    this._itemRecScrollPosition = 0
    this._hasCompletedTransaction = false

    this.itemBasedRecommendations = []
    this.isLoadingItemBasedRecommendations = false
    this.itemBasedRecommendationsError = null

    this.renderContent()

    try {
      const itemResponse = await apiGet(`/items/${itemId}`)

      if (itemResponse.status === "success" && itemResponse.data) {
        this._item = itemResponse.data
        const currentUser = Utils.getUserInfo()
        if (currentUser) {
          // Check if user has completed transaction with this item
          // Ganti bagian check transaction dengan fetch langsung
          try {
            const response = await fetch(`https://api.pinjemin.site/api/transactions/user/${currentUser.id}/item/${itemId}/completed`, {
              headers: { 'Authorization': `Bearer ${Utils.getToken()}` }
            })
            this._hasCompletedTransaction = response.ok && response.status === 200
          } catch (error) {
            this._hasCompletedTransaction = false
          }
        }
        this.fetchItemBasedRecommendationsForCurrentItem(this._item.id)

        const reviewsResponse = await apiGet(`/reviews/item/${itemId}`)

        if (reviewsResponse.status === "success" && reviewsResponse.data) {
          this._reviews = Array.isArray(reviewsResponse.data) ? reviewsResponse.data : []

          const currentUser = Utils.getUserInfo()
          if (currentUser) {
            const userReview = this._reviews.find((review) => review.user_id === currentUser.id)
            if (userReview) {
              this._isCurrentUserReviewed = true
              this._userReviewId = userReview.id
            } else {
              this._isCurrentUserReviewed = false
              this._userReviewId = null
            }
          } else {
            this._isCurrentUserReviewed = false
            this._userReviewId = null
          }
        } else {
          this._reviews = []
          this._isCurrentUserReviewed = false
          this._userReviewId = null
        }
      } else {
        this._item = null
        this._reviews = []
        this.error = itemResponse.message || "Gagal memuat detail item."
        this._isCurrentUserReviewed = false
        this._userReviewId = null
      }
    } catch (error) {
      this._item = null
      this._reviews = []
      this.error = error.message || "Terjadi kesalahan saat memuat data."
      this._isCurrentUserReviewed = false
      this._userReviewId = null
    } finally {
      this.isLoading = false
      this._editingReviewId = null
      this._showRentForm = false
      this.renderContent()

      if (this._item) {
        this.fetchItemBasedRecommendationsForCurrentItem(this._item.id)
      }
    }
  }

  getStyles() {
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        
        .detail-product-container {
          font-family: 'Poppins', sans-serif;
          color: #334155;
        }
        
        .detail-product-container h1, 
        .detail-product-container h2, 
        .detail-product-container h3, 
        .detail-product-container h4, 
        .detail-product-container h5, 
        .detail-product-container h6 {
          font-family: 'Poppins', sans-serif;
        }
        
        .detail-product-container .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .detail-product-container .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .detail-product-container .nav-button {
          background: rgba(79, 70, 229, 0.85);
          color: white;
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
        
        .detail-product-container .nav-button:hover {
          background: rgba(67, 56, 202, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
        }
        
        .detail-product-container .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .detail-product-container .nav-button:not(:disabled):active {
          transform: scale(0.95);
        }
        
        .detail-product-container .thumbnail-item {
          transition: all 0.3s ease;
          border: 2px solid transparent;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        .detail-product-container .thumbnail-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }
        
        .detail-product-container .thumbnail-item.active {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
        }
        
        .detail-product-container .recommendation-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .detail-product-container .recommendation-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
          border-color: #6366f1;
        }
        
        .detail-product-container .recommendation-card:active {
          transform: translateY(-4px);
        }
        
        .detail-product-container .recommendation-img {
          transition: all 0.5s ease;
        }
        
        .detail-product-container .recommendation-card:hover .recommendation-img {
          transform: scale(1.08);
        }
        
        .detail-product-container .slider-nav-button {
          background: rgba(79, 70, 229, 0.85);
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
        
        .detail-product-container .slider-nav-button:hover {
          background: rgba(67, 56, 202, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
        }
        
        .detail-product-container .slider-nav-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .detail-product-container .slider-nav-button:not(:disabled):active {
          transform: scale(0.9);
        }
        
        .detail-product-container .status-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
        
        .detail-product-container .status-available {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }
        
        .detail-product-container .status-pending {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }
        
        .detail-product-container .status-rented {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        
        .detail-product-container .status-sold {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }
        
        .detail-product-container .status-ongoing {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
        }
        
        .detail-product-container .status-default {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: white;
        }
        
        .detail-product-container .info-card {
          background: #f8fafc;
          color: #334155;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        
        .detail-product-container .info-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .detail-product-container .price-info-card {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: white;
          border: none;
        }
        
        .detail-product-container .price-info-card:hover {
          background: linear-gradient(135deg, #4338ca, #4f46e5);
        }
        
        .detail-product-container .action-button {
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .detail-product-container .action-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        .detail-product-container .action-button:active {
          transform: translateY(-1px);
        }
        
        .detail-product-container .btn-buy {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }
        
        .detail-product-container .btn-buy:hover {
          background: linear-gradient(135deg, #059669, #047857);
        }
        
        .detail-product-container .btn-rent {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        
        .detail-product-container .btn-rent:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }
        
        .detail-product-container .btn-cancel {
          background: #f1f5f9;
          color: #64748b;
        }
        
        .detail-product-container .btn-cancel:hover {
          background: #e2e8f0;
          color: #475569;
        }
        
        .detail-product-container .availability-tag {
          background: #3b82f6;
          color: white;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .detail-product-container .availability-tag.rent {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        
        .detail-product-container .availability-tag.sell {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        
        .detail-product-container .availability-tag:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }
        
        .detail-product-container .section-title {
          position: relative;
          font-weight: 700;
          color: #1e293b;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
        
        .detail-product-container .section-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 4px;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          border-radius: 2px;
        }
        
        .detail-product-container .product-main-image {
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .detail-product-container .product-main-image:hover {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }
        
        .detail-product-container .review-card {
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        
        .detail-product-container .review-card:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        
        .detail-product-container .review-form {
          border-radius: 12px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
        }
        
        .detail-product-container .edit-review-form {
          border-radius: 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }
        
        .detail-product-container .shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .detail-product-container .pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      </style>
    `
  }

  renderContent() {
    this.innerHTML = ""

    const styles = this.getStyles()
    const itemDetailsHtml = this.renderItemDetails()
    const itemBasedRecommendationsHtml = this.renderItemBasedRecommendations()
    const rentFormHtml = this.renderRentForm()
    const reviewsSectionHtml = this.renderReviewsSection()

    this.innerHTML = `
        ${styles}
        <div class="detail-product-container">
            <div class="container mx-auto px-4 py-8">
                ${itemDetailsHtml}
                ${rentFormHtml}
                ${itemBasedRecommendationsHtml}
                ${reviewsSectionHtml}
            </div>
        </div>
        `
    this.setupEventListeners()
  }

  renderItemDetails() {
    if (this.isLoading && !this._item) {
      return `
        <div class="bg-white shadow-xl rounded-2xl p-8 mb-8">
          <div class="shimmer h-8 w-3/4 rounded-lg mb-8"></div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="shimmer h-96 w-full rounded-2xl"></div>
            <div class="space-y-6">
              <div class="shimmer h-32 w-full rounded-xl"></div>
              <div class="shimmer h-40 w-full rounded-xl"></div>
              <div class="shimmer h-40 w-full rounded-xl"></div>
            </div>
          </div>
        </div>
      `
    }

    if (this.error && !this._item) {
      return `
        <div class="bg-red-50 border-2 border-red-200 rounded-2xl p-8 mb-8 text-center">
          <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <h3 class="text-xl font-bold text-red-700 mb-2">Error</h3>
          <p class="text-red-600">${this.error}</p>
        </div>
      `
    }

    if (!this._item) {
      return `
        <div class="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 mb-8 text-center">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 class="text-xl font-bold text-gray-700 mb-2">Detail Tidak Tersedia</h3>
          <p class="text-gray-600">Detail item tidak dapat ditemukan.</p>
        </div>
      `
    }

    const item = this._item
    const formatRupiah = (money) => {
      if (money === null || money === undefined) return "-"
      const numericMoney = typeof money === "string" ? Number.parseFloat(money) : money
      if (isNaN(numericMoney)) return "-"
      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(
        numericMoney,
      )
    }

    const statusInfo = this.getStatusInfo(item)
    const currentUser = Utils.getUserInfo()
    const isOwner = currentUser && this._item && this._item.user_id === currentUser.id
    const showBuyRentButtons = statusInfo.canTransact && !isOwner && !this._showRentForm

    return ` 
        <div class="bg-white shadow-xl rounded-2xl p-8 mb-8">
            <h2 class="text-3xl font-bold mb-8 text-indigo-900">${item.name}</h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Photo Gallery -->
                <div>
                    ${
                      item.photos && item.photos.length > 0
                        ? `
                        <!-- Main Photo Display -->
                        <div class="mb-8">
                            <div class="relative bg-gray-50 rounded-2xl overflow-hidden product-main-image" style="height: 450px;">
                                <img src="https://api.pinjemin.site${item.photos[this._currentPhotoIndex]}" 
                                     alt="${item.name}" 
                                     class="w-full h-full object-contain">
                                ${
                                  item.photos.length > 1
                                    ? `
                                    <button class="absolute left-4 top-1/2 transform -translate-y-1/2 nav-button" 
                                            id="prev-photo">
                                        <i class="fa-solid fa-angle-left text-lg"></i>
                                    </button>
                                    <button class="absolute right-4 top-1/2 transform -translate-y-1/2 nav-button" 
                                            id="next-photo">
                                        <i class="fa-solid fa-angle-right text-lg"></i>
                                    </button>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                        
                        <!-- Thumbnail Slider -->
                        ${
                          item.photos.length > 1
                            ? `
                            <div class="relative">
                                <div class="flex items-center gap-4">
                                    <div class="flex-1 overflow-hidden">
                                        <div class="flex gap-4 transition-transform duration-300 hide-scrollbar" 
                                             id="thumbnail-container" style="overflow-x: auto;">
                                            ${item.photos
                                              .map(
                                                (photo, index) => `
                                                <div class="flex-shrink-0 cursor-pointer thumbnail-item ${index === this._currentPhotoIndex ? "active" : ""}" 
                                                     data-index="${index}">
                                                    <img src="https://api.pinjemin.site${photo}" 
                                                         alt="${item.name} ${index + 1}" 
                                                         class="w-24 h-24 object-cover">
                                                </div>
                                            `,
                                              )
                                              .join("")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `
                            : ""
                        }
                    `
                        : '<div class="w-full h-96 bg-gray-100 rounded-2xl mb-6 flex items-center justify-center text-gray-500"><span class="text-lg font-medium">Tidak Ada Foto</span></div>'
                    }
                </div>

                <!-- Product Information -->
                <div class="space-y-6">
                    <!-- Description -->
                    <div class="bg-gray-50 p-6 rounded-xl">
                        <h3 class="text-xl font-semibold mb-4 text-indigo-900">Deskripsi</h3>
                        <p class="text-gray-700 leading-relaxed">${item.description || "Tidak ada deskripsi tersedia."}</p>
                    </div>

                    <!-- Product Details -->
                    <div class="info-card">
                        <h3 class="text-xl font-semibold mb-4 text-indigo-900">Detail Item</h3>
                        <div class="space-y-3">
                            <p class="flex items-center">
                                <span class="w-32 font-medium text-gray-700">Kategori:</span> 
                                <span class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-sm font-medium">${item.category_name || "-"}</span>
                            </p>
                            <p class="flex items-center">
                                <span class="w-32 font-medium text-gray-700">Status Item:</span> 
                                <span class="status-badge ${statusInfo.class}">${statusInfo.display}</span>
                            </p>
                        </div>
                    </div>

                    <!-- Pricing Information -->
                    ${
                      statusInfo.canTransact
                        ? `
                    <div class="info-card price-info-card">
                        <h3 class="text-xl font-semibold mb-4">Informasi Harga</h3>
                        <div class="space-y-3">
                            ${
                              item.is_available_for_sell
                                ? `
                                <p class="flex items-center">
                                    <span class="w-32 font-medium text-white/90">Harga Jual:</span> 
                                    <span class="text-xl font-bold">${formatRupiah(item.price_sell)}</span>
                                </p>`
                                : ""
                            }
                            ${
                              item.is_available_for_rent
                                ? `
                                <p class="flex items-center">
                                    <span class="w-32 font-medium text-white/90">Harga Sewa:</span> 
                                    <span class="text-xl font-bold">${formatRupiah(item.price_rent)}/hari</span>
                                </p>
                                <p class="flex items-center">
                                    <span class="w-32 font-medium text-white/90">Deposit Sewa:</span> 
                                    <span class="text-lg font-bold">${formatRupiah(item.deposit_amount)}</span>
                                </p>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    `
                        : ""
                    }

                    <!-- Location & Seller -->
                    <div class="info-card">
                        <h3 class="text-xl font-semibold mb-4 text-indigo-900">Lokasi & Penjual</h3>
                        <div class="space-y-3">
                            <p class="flex items-center">
                                <i class="fa-solid fa-location-dot text-indigo-600 mr-2"></i>
                                <span class="font-medium text-gray-700 mr-2">Lokasi:</span> 
                                <span>${item.city_name || "-"}, ${item.province_name || "-"}</span>
                            </p>
                            <p class="flex items-center">
                                <i class="fa-solid fa-user text-indigo-600 mr-2"></i>
                                <span class="font-medium text-gray-700 mr-2">Penjual:</span> 
                                <span>${item.owner_name || "Tidak Diketahui"}</span>
                            </p>
                            <p class="flex items-center">
                                <i class="fa-solid fa-envelope text-indigo-600 mr-2"></i>
                                <span class="font-medium text-gray-700 mr-2">Email:</span> 
                                <span>${item.owner_email || "-"}</span>
                            </p>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    ${
                      showBuyRentButtons
                        ? `
                        <div class="flex gap-4 mt-8">
                            ${item.is_available_for_sell ? `<button id="buy-button" class="action-button btn-buy flex items-center"><i class="fa-solid fa-shopping-cart mr-2"></i> Beli Sekarang</button>` : ""}
                            ${item.is_available_for_rent ? `<button id="rent-button" class="action-button btn-rent flex items-center"><i class="fa-solid fa-calendar-days mr-2"></i> Sewa</button>` : ""}
                        </div>
                    `
                        : isOwner && statusInfo.canTransact
                          ? `<div class="bg-indigo-100 text-indigo-800 px-4 py-3 rounded-xl mt-6 flex items-center"><i class="fa-solid fa-circle-info mr-2"></i> Anda adalah pemilik item ini.</div>`
                          : !statusInfo.canTransact
                            ? `<div class="bg-amber-100 text-amber-800 px-4 py-3 rounded-xl mt-6 flex items-center"><i class="fa-solid fa-circle-exclamation mr-2"></i> Item ini saat ini tidak tersedia untuk transaksi.</div>`
                            : ""
                    }
                </div>
            </div>
        </div>
        `
  }

  renderReviewsSection() {
    let reviewsHtml = ""

    if (this.isLoading && !this._item) {
      reviewsHtml = `
        <div class="space-y-4">
          ${Array(3)
            .fill()
            .map(
              () => `
            <div class="shimmer h-32 w-full rounded-xl"></div>
          `,
            )
            .join("")}
        </div>
      `
    } else if (this.error && !this._item) {
      reviewsHtml = ""
    } else if (this._reviews.length === 0) {
      reviewsHtml = `
        <div class="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
          <p class="text-gray-600">Belum ada review untuk item ini.</p>
          ${
            Utils.isAuthenticated() && !this._isCurrentUserReviewed
              ? this._hasCompletedTransaction
                ? `
                <button class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors" 
                        onclick="window.location.hash = window.location.hash + '#review'">
                  Tulis Review Pertama
                </button>
                `
                : `
                <p class="mt-4 text-amber-600">
                  <i class="fa-solid fa-circle-info mr-1"></i>
                  Selesaikan transaksi untuk dapat memberikan review
                </p>
                `
              : ""
          }
        </div>
      `
    } else {
      reviewsHtml = `
        <div class="space-y-6">
          ${this._reviews.map((review) => this.renderReview(review)).join("")}
        </div>
      `
    }

    const currentUser = Utils.getUserInfo()
    const showAddReviewForm =
      currentUser &&
      !!this._item &&
      !this._isCurrentUserReviewed &&
      this._shouldShowReviewForm &&
      this._editingReviewId === null &&
      this._hasCompletedTransaction

    return `
      <div class="bg-white shadow-xl rounded-2xl p-8 mt-8">
        <h3 class="section-title text-2xl">Review Pengguna (${this._reviews.length})</h3>

        ${showAddReviewForm ? this.renderReviewForm() : ""}

        <div id="reviews-list" class="mt-6">
          ${reviewsHtml}
        </div>
        
        ${
          !showAddReviewForm && currentUser && !this._isCurrentUserReviewed && !this._editingReviewId
            ? this._hasCompletedTransaction
              ? `
              <div class="mt-8 text-center">
                <button class="action-button bg-indigo-600 text-white hover:bg-indigo-700" 
                        onclick="window.location.hash = window.location.hash + '#review'">
                  <i class="fa-solid fa-pen-to-square mr-2"></i> Tulis Review Anda
                </button>
              </div>
              `
              : `
              <div class="mt-8 text-center">
                <div class="bg-amber-100 text-amber-800 px-4 py-3 rounded-xl inline-flex items-center">
                  <i class="fa-solid fa-circle-info mr-2"></i>
                  Anda harus menyelesaikan transaksi dengan item ini untuk dapat memberikan review
                </div>
              </div>
              `
            : ""
        }
      </div>
    `
  }

  renderReviewForm() {
    if (
      !this._item ||
      !Utils.isAuthenticated() ||
      this._isCurrentUserReviewed ||
      this._editingReviewId !== null ||
      !this._hasCompletedTransaction
    ) {
      return ""
    }

    return `
      <div id="review-form-section" class="mb-8 p-6 review-form">
        <h4 class="text-xl font-semibold mb-4 text-indigo-900 flex items-center">
          <i class="fa-solid fa-pen-to-square mr-2 text-indigo-600"></i>
          Tulis Review Anda
        </h4>
        <form id="add-review-form">
          <div class="mb-4">
            <label for="review-comment" class="block text-sm font-medium text-gray-700 mb-2">Komentar</label>
            <textarea id="review-comment" name="comment" rows="4" 
                      class="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" 
                      placeholder="Bagikan pendapat Anda tentang produk ini..." required></textarea>
          </div>
          <div class="flex justify-end">
            <button type="submit" class="action-button bg-indigo-600 text-white hover:bg-indigo-700">
              <i class="fa-solid fa-paper-plane mr-2"></i> Kirim Review
            </button>
          </div>
        </form>
      </div>
    `
  }

  renderEditReviewForm(review) {
    if (!review || !Utils.isAuthenticated()) {
      return ""
    }

    if (this._editingReviewId !== review.id) {
      return ""
    }

    return `
      <div class="mt-4 mb-6 p-6 edit-review-form">
        <h4 class="text-xl font-semibold mb-4 text-indigo-900 flex items-center">
          <i class="fa-solid fa-pen-to-square mr-2 text-indigo-600"></i>
          Edit Review Anda
        </h4>
        <form class="edit-review-form" data-review-id="${review.id}">
          <div class="mb-4">
            <label for="edit-review-comment-${review.id}" class="block text-sm font-medium text-gray-700 mb-2">Komentar</label>
            <textarea id="edit-review-comment-${review.id}" name="comment" rows="4" 
                      class="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" 
                      required>${review.comment || ""}</textarea>
          </div>
          <div class="flex justify-end gap-3">
            <button type="button" class="cancel-edit-button action-button btn-cancel">
              <i class="fa-solid fa-xmark mr-2"></i> Batal
            </button>
            <button type="submit" class="save-edit-button action-button bg-indigo-600 text-white hover:bg-indigo-700">
              <i class="fa-solid fa-check mr-2"></i> Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    `
  }

  renderReview(review) {
    if (!review) return ""

    const currentUser = Utils.getUserInfo()
    const isCurrentUserReview = currentUser && currentUser.id === review.user_id
    const reviewDate = review.created_at ? new Date(review.created_at) : null
    const formattedDate = reviewDate
      ? new Intl.DateTimeFormat("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(reviewDate)
      : "-"

    if (isCurrentUserReview && this._editingReviewId === review.id) {
      return this.renderEditReviewForm(review)
    }

    return `
      <div class="review-card p-6" data-review-id="${review.id}">
        <div class="flex items-center mb-3">
          <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg mr-3">
            ${(review.user_name || "?")[0].toUpperCase()}
          </div>
          <div>
            <p class="font-semibold text-gray-900">${review.user_name || "Pengguna Tidak Diketahui"}</p>
            <p class="text-gray-500 text-sm">${formattedDate}</p>
          </div>
        </div>
        
        <p class="text-gray-700 mt-3 mb-4" id="review-comment-${review.id}">${review.comment || "-"}</p>
        
        ${
          isCurrentUserReview && this._editingReviewId === null
            ? `
            <div class="flex justify-end gap-2">
              <button class="edit-review-button flex items-center text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors" data-review-id="${review.id}">
                <i class="fa-solid fa-pen-to-square mr-1"></i> Edit
              </button>
              <button class="delete-review-button flex items-center text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors" data-review-id="${review.id}">
                <i class="fa-solid fa-trash-can mr-1"></i> Hapus
              </button>
            </div>
            `
            : ""
        }
      </div>
    `
  }

  renderRentForm() {
    if (!this._showRentForm || !this._item || !Utils.isAuthenticated()) {
      return ""
    }

    const today = new Date().toISOString().split("T")[0]
    const item = this._item
    const formatRupiah = this.formatRupiah

    return `
      <div id="rent-form-section" class="bg-white shadow-xl rounded-2xl p-8 mt-8 mb-8">
        <h3 class="section-title text-2xl">Formulir Penyewaan</h3>
        
        <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <div class="flex flex-wrap gap-4 items-center">
            <div class="flex-shrink-0">
              <img src="${item.thumbnail ? `https://api.pinjemin.site${item.thumbnail}` : "https://via.placeholder.com/80"}" 
                   alt="${item.name}" class="w-20 h-20 object-cover rounded-lg">
            </div>
            <div class="flex-grow">
              <h4 class="font-semibold text-lg text-indigo-900">${item.name}</h4>
              <div class="flex flex-wrap gap-4 mt-2">
                <p class="text-indigo-700 font-medium">Harga Sewa: ${formatRupiah(item.price_rent)}/hari</p>
                <p class="text-indigo-700 font-medium">Deposit: ${formatRupiah(item.deposit_amount)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <form id="rent-item-form" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="rent-start-date" class="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai Sewa</label>
              <input type="date" id="rent-start-date" name="rent_start_date"
                  class="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  required min="${today}">
            </div>
            <div>
              <label for="rent-end-date" class="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai Sewa</label>
              <input type="date" id="rent-end-date" name="rent_end_date"
                  class="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  required min="${today}">
            </div>
          </div>
          
          <div class="flex flex-wrap gap-4 mt-8">
            <button type="submit" class="action-button btn-rent flex items-center">
              <i class="fa-solid fa-check mr-2"></i> Ajukan Penyewaan
            </button>
            <button type="button" id="cancel-rent-button" class="action-button btn-cancel flex items-center">
              <i class="fa-solid fa-xmark mr-2"></i> Batal
            </button>
          </div>
        </form>
      </div>
    `
  }

  renderItemBasedRecommendations() {
    if (this.isLoading || this.error || !this._item) {
      return ""
    }

    if (this.isLoadingItemBasedRecommendations) {
      return `
        <div class="bg-white shadow-xl rounded-2xl p-8 mt-8 mb-8">
          <h3 class="section-title text-2xl">Produk Serupa Lainnya</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            ${Array(8)
              .fill()
              .map(
                () => `
              <div class="shimmer h-64 w-full rounded-xl"></div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
    }

    if (this.itemBasedRecommendationsError) {
      return `
        <div class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mt-8 mb-8">
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <span class="font-medium">Error:</span>
            <span class="ml-1">${this.itemBasedRecommendationsError}</span>
          </div>
        </div>
      `
    }

    if (!this.itemBasedRecommendations || this.itemBasedRecommendations.length === 0) {
      return `
        <div class="bg-white shadow-xl rounded-2xl p-8 mt-8 mb-8">
          <h3 class="section-title text-2xl">Produk Serupa Lainnya</h3>
          <div class="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <p class="text-gray-600">Tidak ada rekomendasi serupa yang tersedia saat ini.</p>
          </div>
        </div>
      `
    }

    const backendBaseUrl = "https://api.pinjemin.site"
    const formatRupiah = this.formatRupiah

    // Ensure we have exactly 8 recommendations or as many as possible
    const recommendationsToShow = this.itemBasedRecommendations.slice(0, 8)

    // If we have less than 8, duplicate some to fill the space
    while (recommendationsToShow.length < 8 && this.itemBasedRecommendations.length > 0) {
      const itemsToAdd = Math.min(this.itemBasedRecommendations.length, 8 - recommendationsToShow.length)
      for (let i = 0; i < itemsToAdd; i++) {
        recommendationsToShow.push({ ...this.itemBasedRecommendations[i % this.itemBasedRecommendations.length] })
      }
    }

    const recommendationsListHtml = recommendationsToShow
      .map((rec) => {
        const statusInfo = this.getStatusInfo(rec)

        return `
          <div class="recommendation-card">
            <a href="/#/items/${rec.id || rec.product_id}" class="block text-gray-800" data-item-id="${rec.id || rec.product_id}">
              <div class="relative overflow-hidden">
                ${
                  rec.thumbnail
                    ? `<img src="${backendBaseUrl}${rec.thumbnail}" alt="${rec.name || "Product image"}" 
                        class="recommendation-img w-full h-48 object-cover">`
                    : '<div class="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400"><i class="fa-solid fa-image text-3xl"></i></div>'
                }
                <div class="absolute top-3 left-3">
                  <span class="status-badge ${statusInfo.class} text-xs">${statusInfo.display}</span>
                </div>
              </div>
              
              <div class="p-4">
                <h5 class="text-lg font-bold text-gray-900 line-clamp-2 mb-2 h-14">${rec.name || rec.product_name || "Unnamed Product"}</h5>
                
                ${
                  statusInfo.canTransact
                    ? `
                    <div class="flex items-center gap-2 flex-wrap mb-3">
                      ${rec.is_available_for_rent ? `<span class="availability-tag rent">Sewa</span>` : ""}
                      ${rec.is_available_for_sell ? `<span class="availability-tag sell">Jual</span>` : ""}
                    </div>
                    <div class="space-y-1 border-t border-gray-200 pt-3">
                      ${
                        rec.is_available_for_sell
                          ? `<p class="text-sm font-semibold flex items-center">
                          <i class="fa-solid fa-tag text-green-600 mr-2"></i>
                          Jual: ${formatRupiah(rec.price_sell)}
                        </p>`
                          : ""
                      }
                      ${
                        rec.is_available_for_rent
                          ? `<p class="text-sm font-semibold flex items-center">
                          <i class="fa-solid fa-calendar-days text-blue-600 mr-2"></i>
                          Sewa: ${formatRupiah(rec.price_rent)}${rec.price_rent > 0 ? " /hari" : ""}
                        </p>`
                          : ""
                      }
                    </div>
                    `
                    : ""
                }
              </div>
            </a>
          </div>
        `
      })
      .join("")

    return `
      <div class="bg-white shadow-xl rounded-2xl p-8 mt-8 mb-8">
        <h3 class="section-title text-2xl">Produk Serupa Lainnya</h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${recommendationsListHtml}
        </div>
      </div>
    `
  }

  setupEventListeners() {
    this.removeEventListeners()

    this.setupPhotoNavigation()
    this.setupRecommendationSliders()

    const addReviewForm = this.querySelector("#add-review-form")
    if (addReviewForm) {
      this._addReviewFormSubmitHandler = this.handleReviewSubmit
      addReviewForm.addEventListener("submit", this._addReviewFormSubmitHandler)

      if (window.location.hash.endsWith("#review") && this._shouldShowReviewForm) {
        const reviewFormSection = this.querySelector("#review-form-section")
        if (reviewFormSection) {
          requestAnimationFrame(() => {
            reviewFormSection.scrollIntoView({ behavior: "smooth", block: "start" })
          })
        }
      }
    }

    const reviewsList = this.querySelector("#reviews-list")
    if (reviewsList) {
      this._reviewActionsDelegate = (event) => {
        const target = event.target
        const reviewId = target.dataset.reviewId || target.closest("[data-review-id]")?.dataset.reviewId
        const isButton = target.tagName === "BUTTON"

        if (isButton && target.closest(".edit-review-form")) {
          const form = target.closest(".edit-review-form")
          const formReviewId = form ? Number.parseInt(form.dataset.reviewId, 10) : null
          if (!formReviewId) return

          if (target.classList.contains("save-edit-button")) {
            this.handleEditSubmit(event, formReviewId)
            return
          } else if (target.classList.contains("cancel-edit-button")) {
            this.cancelEditReview(event)
            return
          }
        }

        if (isButton && reviewId) {
          if (target.classList.contains("edit-review-button")) {
            this.handleEditReview(Number.parseInt(reviewId, 10))
          } else if (target.classList.contains("delete-review-button")) {
            this.handleDeleteReview(Number.parseInt(reviewId, 10))
          }
        }
      }
      reviewsList.addEventListener("click", this._reviewActionsDelegate)
    }

    const buyButton = this.querySelector("#buy-button")
    if (buyButton) {
      this._buyButtonClickHandler = this.handleBuy
      buyButton.addEventListener("click", this._buyButtonClickHandler)
    }

    const rentButton = this.querySelector("#rent-button")
    if (rentButton) {
      this._rentButtonClickHandler = this.handleRent
      rentButton.addEventListener("click", this._rentButtonClickHandler)
    }

    const rentItemForm = this.querySelector("#rent-item-form")
    if (rentItemForm) {
      this._rentFormSubmitHandler = this.handleRentFormSubmit
      rentItemForm.addEventListener("submit", this._rentFormSubmitHandler)

      const cancelRentButton = rentItemForm.querySelector("#cancel-rent-button")
      if (cancelRentButton) {
        this._cancelRentButtonClickHandler = this.cancelRentForm
        cancelRentButton.addEventListener("click", this._cancelRentButtonClickHandler)
      }

      requestAnimationFrame(() => {
        rentItemForm.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }

  setupPhotoNavigation() {
    if (!this._item || !this._item.photos || this._item.photos.length <= 1) return

    const prevButton = this.querySelector("#prev-photo")
    const nextButton = this.querySelector("#next-photo")
    const thumbPrevButton = this.querySelector("#thumb-prev")
    const thumbNextButton = this.querySelector("#thumb-next")

    if (prevButton && nextButton) {
      this._prevPhotoHandler = () => {
        this._currentPhotoIndex =
          this._currentPhotoIndex > 0 ? this._currentPhotoIndex - 1 : this._item.photos.length - 1
        this.updatePhotoDisplay()
      }
      this._nextPhotoHandler = () => {
        this._currentPhotoIndex =
          this._currentPhotoIndex < this._item.photos.length - 1 ? this._currentPhotoIndex + 1 : 0
        this.updatePhotoDisplay()
      }

      prevButton.addEventListener("click", this._prevPhotoHandler)
      nextButton.addEventListener("click", this._nextPhotoHandler)
    }

    if (thumbPrevButton && thumbNextButton) {
      this._thumbPrevHandler = () => this.scrollThumbnails(-1)
      this._thumbNextHandler = () => this.scrollThumbnails(1)

      thumbPrevButton.addEventListener("click", this._thumbPrevHandler)
      thumbNextButton.addEventListener("click", this._thumbNextHandler)
    }

    const thumbnails = this.querySelectorAll(".thumbnail-item")
    thumbnails.forEach((thumb, index) => {
      const handler = () => {
        this._currentPhotoIndex = index
        this.updatePhotoDisplay()
      }
      thumb.addEventListener("click", handler)
      thumb._clickHandler = handler
    })
  }

  setupRecommendationSliders() {
    const itemRecPrev = this.querySelector("#item-rec-prev")
    const itemRecNext = this.querySelector("#item-rec-next")

    if (itemRecPrev && itemRecNext) {
      this._itemRecPrevHandler = () => this.scrollRecommendations("item", -1)
      this._itemRecNextHandler = () => this.scrollRecommendations("item", 1)

      itemRecPrev.addEventListener("click", this._itemRecPrevHandler)
      itemRecNext.addEventListener("click", this._itemRecNextHandler)
    }

    // Add click handler for recommendation items
    const recommendationsContainer = this.querySelector("#item-recommendations-container")
    if (recommendationsContainer) {
      this._recommendationClickHandler = (event) => {
        const link = event.target.closest("a[data-item-id]")
        if (link) {
          const itemId = link.dataset.itemId
          if (itemId) {
            // Trigger ML refresh before navigation
            this.triggerMLRefresh(itemId)
          }
        }
      }
      recommendationsContainer.addEventListener("click", this._recommendationClickHandler)
    }
  }

  updatePhotoDisplay() {
    const mainImg = this.querySelector(".bg-gray-50 img")
    const thumbnails = this.querySelectorAll(".thumbnail-item")

    if (mainImg && this._item && this._item.photos) {
      mainImg.src = `https://api.pinjemin.site${this._item.photos[this._currentPhotoIndex]}`
    }

    thumbnails.forEach((thumb, index) => {
      if (index === this._currentPhotoIndex) {
        thumb.classList.add("active")
      } else {
        thumb.classList.remove("active")
      }
    })
  }

  scrollThumbnails(direction) {
    const container = this.querySelector("#thumbnail-container")
    if (!container) return

    const scrollAmount = 100
    container.scrollLeft += direction * scrollAmount
  }

  scrollRecommendations(type, direction) {
    if (type === "item") {
      const container = this.querySelector("#item-recommendations-container")
      if (container) {
        const cardWidth = 280 // Approximate width of a card + gap
        const scrollAmount = cardWidth * direction
        container.scrollBy({ left: scrollAmount, behavior: "smooth" })
        this._itemRecScrollPosition = container.scrollLeft + scrollAmount
      }
    }
  }

  removeEventListeners() {
    const addReviewForm = this.querySelector("#add-review-form")
    if (addReviewForm && this._addReviewFormSubmitHandler) {
      addReviewForm.removeEventListener("submit", this._addReviewFormSubmitHandler)
      this._addReviewFormSubmitHandler = null
    }

    const reviewsList = this.querySelector("#reviews-list")
    if (reviewsList && this._reviewActionsDelegate) {
      reviewsList.removeEventListener("click", this._reviewActionsDelegate)
      this._reviewActionsDelegate = null
    }

    const buyButton = this.querySelector("#buy-button")
    if (buyButton && this._buyButtonClickHandler) {
      buyButton.removeEventListener("click", this._buyButtonClickHandler)
      this._buyButtonClickHandler = null
    }

    const rentButton = this.querySelector("#rent-button")
    if (rentButton && this._rentButtonClickHandler) {
      rentButton.removeEventListener("click", this._rentButtonClickHandler)
      this._rentButtonClickHandler = null
    }

    const rentItemForm = this.querySelector("#rent-item-form")
    if (rentItemForm && this._rentFormSubmitHandler) {
      rentItemForm.removeEventListener("submit", this._rentFormSubmitHandler)
      this._rentFormSubmitHandler = null
    }

    const cancelRentButton = this.querySelector("#cancel-rent-button")
    if (cancelRentButton && this._cancelRentButtonClickHandler) {
      cancelRentButton.removeEventListener("click", this._cancelRentButtonClickHandler)
      this._cancelRentButtonClickHandler = null
    }

    const prevButton = this.querySelector("#prev-photo")
    const nextButton = this.querySelector("#next-photo")
    if (prevButton && this._prevPhotoHandler) {
      prevButton.removeEventListener("click", this._prevPhotoHandler)
      this._prevPhotoHandler = null
    }
    if (nextButton && this._nextPhotoHandler) {
      nextButton.removeEventListener("click", this._nextPhotoHandler)
      this._nextPhotoHandler = null
    }

    const thumbPrevButton = this.querySelector("#thumb-prev")
    const thumbNextButton = this.querySelector("#thumb-next")
    if (thumbPrevButton && this._thumbPrevHandler) {
      thumbPrevButton.removeEventListener("click", this._thumbPrevHandler)
      this._thumbPrevHandler = null
    }
    if (thumbNextButton && this._thumbNextHandler) {
      thumbNextButton.removeEventListener("click", this._thumbNextHandler)
      this._thumbNextHandler = null
    }

    const thumbnails = this.querySelectorAll(".thumbnail-item")
    thumbnails.forEach((thumb) => {
      if (thumb._clickHandler) {
        thumb.removeEventListener("click", thumb._clickHandler)
        thumb._clickHandler = null
      }
    })

    const userRecPrev = this.querySelector("#user-rec-prev")
    const userRecNext = this.querySelector("#user-rec-next")
    if (userRecPrev && this._userRecPrevHandler) {
      userRecPrev.removeEventListener("click", this._userRecPrevHandler)
      this._userRecPrevHandler = null
    }
    if (userRecNext && this._userRecNextHandler) {
      userRecNext.removeEventListener("click", this._userRecNextHandler)
      this._userRecNextHandler = null
    }

    const itemRecPrev = this.querySelector("#item-rec-prev")
    const itemRecNext = this.querySelector("#item-rec-next")
    if (itemRecPrev && this._itemRecPrevHandler) {
      itemRecPrev.removeEventListener("click", this._itemRecPrevHandler)
      this._itemRecPrevHandler = null
    }
    if (itemRecNext && this._itemRecNextHandler) {
      itemRecNext.removeEventListener("click", this._itemRecNextHandler)
      this._itemRecNextHandler = null
    }

    const recommendationsContainer = this.querySelector("#item-recommendations-container")
    if (recommendationsContainer && this._recommendationClickHandler) {
      recommendationsContainer.removeEventListener("click", this._recommendationClickHandler)
      this._recommendationClickHandler = null
    }
  }

  async handleReviewSubmit(event) {
    event.preventDefault()

    const currentUser = Utils.getUserInfo()
    if (!currentUser || !this._item || !this._item.id) {
      alert("Anda harus login dan item harus valid untuk mengirim review.")
      return
    }

    const form = event.target
    const commentTextarea = form.querySelector("#review-comment")
    const comment = commentTextarea ? commentTextarea.value.trim() : ""

    if (!comment) {
      alert("Komentar review tidak boleh kosong.")
      return
    }

    const submitButton = form.querySelector('button[type="submit"]')
    if (submitButton) submitButton.disabled = true

    try {
      const response = await authenticatedRequest(`/reviews/item/${this._item.id}`, "POST", {
        comment: comment,
      })

      if (response.status === "success") {
        alert("Review berhasil dikirim!")
        if (commentTextarea) commentTextarea.value = ""
        this._shouldShowReviewForm = false
        await this.fetchItemAndReviews(this._item.id)
      } else {
        let errorMessage = response.message || "Gagal mengirim review baru."
        if (response.errors && Array.isArray(response.errors)) {
          errorMessage += "\nValidasi error:"
          response.errors.forEach((err) => {
            if (err.param && err.msg) {
              errorMessage += `\n- ${err.param}: ${err.msg}`
            } else if (typeof err === "string") {
              errorMessage += `\n- ${err}`
            }
          })
        }
        alert(errorMessage)
      }
    } catch (error) {
      alert("Terjadi kesalahan saat mengirim review baru.")
    } finally {
      if (submitButton && this._shouldShowReviewForm) submitButton.disabled = false
    }
  }

  handleEditReview(reviewId) {
    if (this._editingReviewId === Number.parseInt(reviewId, 10)) {
      return
    }
    if (this._editingReviewId !== null) {
      this.cancelEditReview()
    }

    const reviewToEdit = this._reviews.find((review) => review.id === Number.parseInt(reviewId, 10))

    if (!reviewToEdit) {
      alert("Review tidak ditemukan.")
      return
    }

    this._editingReviewId = reviewToEdit.id
    this.renderContent()

    requestAnimationFrame(() => {
      const editForm = this.querySelector(`.edit-review-form[data-review-id="${reviewId}"]`)
      if (editForm) {
        editForm.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    })
  }

  cancelEditReview() {
    if (this._editingReviewId !== null) {
      this._editingReviewId = null
      this.renderContent()
    }
  }

  async handleEditSubmit(event, reviewId) {
    event.preventDefault()

    const currentUser = Utils.getUserInfo()
    if (!currentUser || !this._item || !this._item.id || !reviewId) {
      alert("Informasi tidak lengkap untuk memperbarui review.")
      return
    }

    const form = event.target.closest(".edit-review-form")
    if (!form) {
      alert("Form edit tidak ditemukan.")
      return
    }

    const commentTextarea = form.querySelector(`#edit-review-comment-${reviewId}`)
    const comment = commentTextarea ? commentTextarea.value.trim() : ""

    if (!comment) {
      alert("Komentar review tidak boleh kosong.")
      const saveButton = form.querySelector(".save-edit-button")
      if (saveButton) saveButton.disabled = false
      const cancelButton = form.querySelector(".cancel-edit-button")
      if (cancelButton) cancelButton.disabled = false
      return
    }

    const saveButton = form.querySelector(".save-edit-button")
    if (saveButton) saveButton.disabled = true
    const cancelButton = form.querySelector(".cancel-edit-button")
    if (cancelButton) cancelButton.disabled = true

    try {
      const response = await authenticatedRequest(`/reviews/${reviewId}`, "PATCH", {
        comment: comment,
      })

      if (response.status === "success") {
        alert("Review berhasil diperbarui!")
        this._editingReviewId = null
        await this.fetchItemAndReviews(this._item.id)
      } else {
        let errorMessage = response.message || "Gagal memperbarui review."
        if (response.errors && Array.isArray(response.errors)) {
          errorMessage += "\nValidasi error:"
          response.errors.forEach((err) => {
            if (err.param && err.msg) {
              errorMessage += `\n- ${err.param}: ${err.msg}`
            } else if (typeof err === "string") {
              errorMessage += `\n- ${err}`
            }
          })
        }
        alert(errorMessage)
      }
    } catch (error) {
      alert("Terjadi kesalahan saat memperbarui review.")
    } finally {
      if (this._editingReviewId === reviewId) {
        if (saveButton) saveButton.disabled = false
        if (cancelButton) cancelButton.disabled = false
      }
    }
  }

  async handleDeleteReview(reviewId) {
    const confirmDelete = confirm("Apakah Anda yakin ingin menghapus review ini?")
    if (!confirmDelete) {
      return
    }

    try {
      const response = await authenticatedRequest(`/reviews/${reviewId}`, "DELETE")

      if (response.status === "success") {
        alert("Review berhasil dihapus!")
        await this.fetchItemAndReviews(this._item.id)
      } else {
        alert("Gagal menghapus review: " + (response.message || "Terjadi kesalahan."))
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menghapus review.")
    }
  }

  async handleBuy() {
    const currentUser = Utils.getUserInfo()
    if (!currentUser || !this._item || !this._item.id) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Diperlukan',
        text: 'Anda harus login untuk melakukan pembelian.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }

    const result = await Swal.fire({
      title: 'Konfirmasi Pembelian',
      html: `Apakah Anda yakin ingin membeli<br><strong>"${this._item.name}"</strong><br>dengan harga <strong>${this.formatRupiah(this._item.price_sell)}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Beli Sekarang!',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      const response = await authenticatedRequest("/transactions", "POST", {
        item_id: this._item.id,
        type: "buy",
      })

      if (response.status === "success" && response.data) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Transaksi pembelian berhasil dibuat!',
          confirmButtonColor: '#4f46e5'
        })
        window.location.hash = `#/transactions/${response.data.id}`
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: "Gagal membuat transaksi pembelian: " + (response.message || "Terjadi kesalahan."),
          confirmButtonColor: '#4f46e5'
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Terjadi kesalahan saat membuat transaksi pembelian.',
        confirmButtonColor: '#4f46e5'
      })
    }
  }

  async handleRent() {
    if (!this._item || !Utils.isAuthenticated()) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Diperlukan',
        text: 'Item tidak tersedia atau Anda harus login.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }

    const statusInfo = this.getStatusInfo(this._item)
    if (!statusInfo.canTransact) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak Tersedia',
        text: 'Item ini tidak tersedia untuk disewa.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }

    this._showRentForm = true
    this.renderContent()
  }

  async handleRentFormSubmit(event) {
    event.preventDefault()

    const form = event.target
    const startDateInput = form.querySelector("#rent-start-date")
    const endDateInput = form.querySelector("#rent-end-date")

    const startDate = startDateInput ? startDateInput.value : null
    const endDate = endDateInput ? endDateInput.value : null

    if (!startDate || !endDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Tidak Lengkap',
        text: 'Tanggal mulai dan selesai sewa harus diisi.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Swal.fire({
        icon: 'error',
        title: 'Format Salah',
        text: 'Format tanggal tidak valid.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }

    if (start < today || end < today) {
      Swal.fire({
        icon: 'warning',
        title: 'Tanggal Tidak Valid',
        text: 'Tanggal sewa tidak boleh di masa lalu.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }

    if (start >= end) {
      Swal.fire({
        icon: 'warning',
        title: 'Tanggal Tidak Valid',
        text: 'Tanggal selesai sewa harus setelah tanggal mulai sewa.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }

    const currentUser = Utils.getUserInfo()
    if (!currentUser || !this._item || !this._item.id) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Diperlukan',
        text: 'Anda harus login dan item harus valid untuk mengajukan penyewaan.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }

    // Calculate rental duration and total cost
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const totalRentCost = diffDays * this._item.price_rent
    const totalCost = totalRentCost + this._item.deposit_amount

    const result = await Swal.fire({
      title: 'Konfirmasi Penyewaan',
      html: `
      <div class="text-left">
        <p><strong>Item:</strong> ${this._item.name}</p>
        <p><strong>Durasi:</strong> ${diffDays} hari</p>
        <p><strong>Biaya Sewa:</strong> ${this.formatRupiah(totalRentCost)}</p>
        <p><strong>Deposit:</strong> ${this.formatRupiah(this._item.deposit_amount)}</p>
        <hr class="my-2">
        <p><strong>Total Bayar:</strong> ${this.formatRupiah(totalCost)}</p>
      </div>
    `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Ajukan Sewa!',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) {
      return
    }

    const submitButton = form.querySelector('button[type="submit"]')
    if (submitButton) submitButton.disabled = true
    const cancelButton = form.querySelector("#cancel-rent-button")
    if (cancelButton) cancelButton.disabled = true

    try {
      const response = await authenticatedRequest("/transactions", "POST", {
        item_id: this._item.id,
        type: "rent",
        rent_start_date: startDate,
        rent_end_date: endDate,
      })

      if (response.status === "success" && response.data) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Transaksi penyewaan berhasil dibuat!',
          confirmButtonColor: '#4f46e5'
        })
        this._showRentForm = false
        window.location.hash = `#/transactions/${response.data.id}`
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: "Gagal membuat transaksi penyewaan: " + (response.message || "Terjadi kesalahan."),
          confirmButtonColor: '#4f46e5'
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Terjadi kesalahan saat membuat transaksi penyewaan.',
        confirmButtonColor: '#4f46e5'
      })
    } finally {
      this._showRentForm = false
      this.renderContent()
    }
  }

  cancelRentForm() {
    this._showRentForm = false
    this.renderContent()
  }

  formatRupiah = (money) => {
    if (money === null || money === undefined) return "-"
    const numericMoney = typeof money === "string" ? Number.parseFloat(money) : money
    if (isNaN(numericMoney)) return "-"
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(
      numericMoney,
    )
  }

  async fetchItemBasedRecommendationsForCurrentItem(basedOnItemId) {
    if (!basedOnItemId) {
      this.itemBasedRecommendations = []
      this.isLoadingItemBasedRecommendations = false
      this.itemBasedRecommendationsError = null
      this.renderContent()
      return
    }

    this.isLoadingItemBasedRecommendations = true
    this.itemBasedRecommendationsError = null
    this.renderContent()

    const topN = 8 // Changed from 5 to 8

    try {
      const mlResult = await fetchItemRecommendations(basedOnItemId, topN)

      if (mlResult && Array.isArray(mlResult.recommendations) && mlResult.recommendations.length > 0) {
        const recommendationPromises = mlResult.recommendations.map(async (rec) => {
          try {
            const itemDetailResponse = await apiGet(`/items/${rec.product_id}`)
            if (itemDetailResponse.status === "success" && itemDetailResponse.data) {
              return {
                ...rec,
                ...itemDetailResponse.data,
              }
            } else {
              return null
            }
          } catch (detailError) {
            return null
          }
        })

        const results = await Promise.all(recommendationPromises)
        this.itemBasedRecommendations = results.filter((item) => item !== null && item.id !== this._item.id)
        this.isLoadingItemBasedRecommendations = false

        if (mlResult.recommendations.length > 0 && this.itemBasedRecommendations.length === 0) {
          if (mlResult.recommendations.length > 0) {
            this.itemBasedRecommendationsError = "Tidak ada rekomendasi serupa yang ditemukan atau detail gagal dimuat."
          } else {
            this.itemBasedRecommendationsError = "Tidak ada rekomendasi serupa yang ditemukan dari ML API."
          }
        } else {
          this.itemBasedRecommendationsError = null
        }
      } else {
        this.itemBasedRecommendations = []
        this.isLoadingItemBasedRecommendations = false
        this.itemBasedRecommendationsError =
          mlResult.message || "Tidak ada rekomendasi serupa yang ditemukan dari ML API."
      }
    } catch (error) {
      this.itemBasedRecommendations = []
      this.isLoadingItemBasedRecommendations = false
      this.itemBasedRecommendationsError = error.message || "Terjadi kesalahan saat memuat rekomendasi serupa."
    } finally {
      this.renderContent()
    }
  }

  async triggerMLRefresh(itemId) {
    try {
      await fetch("https://exml.pinjemin.site/api/refresh_data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
    } catch (refreshError) {
      console.warn("Failed to trigger ML backend data refresh:", refreshError)
    }
  }
}

customElements.define("detail-product", DetailProduct)