import { apiGet } from "../../utils/apiService.js"
import { fetchSearchRecommendations, fetchUserRecommendations } from "../../utils/mlApiService.js"
import { ProductMap } from "../../components/ProductMap.js"

class AllProduct extends HTMLElement {
  constructor() {
    super()
    this.items = []
    this.isLoading = true
    this.error = null
    this.searchRecommendations = []
    this.isLoadingSearchRecommendations = false
    this.searchRecommendationsError = null
    this.currentSearchKeyword = ""

    // User recommendations state
    this.userRecommendations = []
    this.isLoadingUserRecommendations = true
    this.userRecommendationsError = null

    // Pagination state
    this.pagination = {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    }

    // Map instance
    this.productMap = null
    this.user = null
    this.mapInitialized = false
    this.isFetchingItems = false

    // Binding methods to 'this'
    this.fetchItems = this.fetchItems.bind(this)
    this.handleSearchEvent = this.handleSearchEvent.bind(this)
    this.fetchSearchRecommendations = this.fetchSearchRecommendations.bind(this)
    this.fetchUserRecommendations = this.fetchUserRecommendations.bind(this)
    this.handlePaginationClick = this.handlePaginationClick.bind(this)
    this.initializeMap = this.initializeMap.bind(this)
    this.updateMapMarkers = this.updateMapMarkers.bind(this)
  }

  async connectedCallback() {
    this.loadUserData()
    this.innerHTML = this.renderStructure()

    document.addEventListener("search", this.handleSearchEvent)
    const startupPromises = [
      this.initializeMap(),
      this.fetchItems(),
      this.fetchUserRecommendations(),
    ]

    try {
      await Promise.all(startupPromises)
      this.updateMapMarkers() // Panggilan terakhir sebagai pengaman (safeguard).
    } catch (error) {
      console.error("An error occurred during the component's initial loading sequence:", error)
    }
  }

  disconnectedCallback() {
    document.removeEventListener("search", this.handleSearchEvent)
    if (this.productMap) {
      this.productMap.destroy()
      this.productMap = null
      this.mapInitialized = false
    }
  }

  loadUserData() {
    const userData = localStorage.getItem("user")
    if (userData) {
      this.user = JSON.parse(userData)
    }
  }

  getUserIdFromToken() {
    const token = localStorage.getItem("token")
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      return payload.userId || payload.id || payload.user_id
    } catch (error) {
      console.error("Error parsing token:", error)
      return null
    }
  }

  /**
   * Metode baru untuk membuat kerangka HTML statis dari komponen.
   */
  renderStructure() {
    return `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { margin: 0; padding: 0; }
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Poppins', sans-serif; }
        #product-map { height: 400px !important; width: 100% !important; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); border: 2px solid #e5e7eb; position: relative !important; z-index: 1 !important; display: block !important; visibility: visible !important; }
        #product-map-container { position: relative; z-index: 1; width: 100%; height: auto; margin-bottom: 2rem; }
        .leaflet-container { cursor: grab !important; touch-action: pan-x pan-y !important; }
        .map-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); position: relative; z-index: 1; }
        .map-header { color: white; font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem; }
        .map-description { color: rgba(255, 255, 255, 0.9); font-size: 0.875rem; margin-bottom: 1.5rem; }
        .section-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 700; font-size: 1.875rem; margin-bottom: 1.5rem; }
        .section-divider { height: 4px; background: linear-gradient(90deg, #3b82f6, #10b981); border-radius: 2px; margin: 2rem 0; }
        .shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 2s infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .pagination-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; transition: all 0.2s; }
        .pagination-btn-enabled { background-color: white; border: 1px solid #d1d5db; color: #374151; }
        .pagination-btn-enabled:hover { background-color: #f9fafb; border-color: #9ca3af; }
        .pagination-btn-disabled { background-color: #f9fafb; border: 1px solid #e5e7eb; color: #9ca3af; cursor: not-allowed; }
        .pagination-number { min-width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; transition: all 0.2s; background-color: white; border: 1px solid #d1d5db; color: #374151; }
        .pagination-number:hover { background-color: #f3f4f6; border-color: #9ca3af; }
        .pagination-number-active { background-color: #3b82f6; border-color: #3b82f6; color: white; }
        .product-recommendation-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: #ffffff; border: 2px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border-radius: 0.75rem; overflow: hidden; }
        .product-recommendation-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15); border-color: #3b82f6; }
        .product-recommendation-img { transition: all 0.3s ease; }
        .product-recommendation-card:hover .product-recommendation-img { transform: scale(1.05); }
        .product-status-badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08); }
        .product-availability-tag { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; }
        .product-availability-tag.rent { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .product-availability-tag.sell { background: linear-gradient(135deg, #10b981, #059669); }
        .recommendation-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: #ffffff; border: 2px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .recommendation-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15); border-color: #3b82f6; }
        .recommendation-img { transition: all 0.3s ease; }
        .recommendation-card:hover .recommendation-img { transform: scale(1.05); }
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(90deg, #3b82f6, #10b981); border-radius: 4px; }
      </style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div class="bg-white rounded-lg">
        <div class="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:max-w-7xl lg:px-8">
          <div class="map-section" id="product-map-container">
            <h2 class="map-header">
              <i class="fa-solid fa-map-location-dot"></i>
              Peta Lokasi Produk${this.user?.province_name ? ` - ${this.user.province_name}` : ""}
            </h2>
            <p class="map-description">
              Temukan produk di sekitar Anda dengan mudah. Klik pada marker untuk melihat detail.
            </p>
            <div id="product-map"></div>
          </div>
        </div>

        <div class="py-6">
          <search-bar></search-bar>
        </div>
        
        <div id="user-recs-container"></div>
        <div id="search-recs-container"></div>
        
        <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8">
          <div class="section-divider"></div>
          <h2 class="section-header text-center">Semua Produk</h2>
          <div id="product-list-container">
             ${this.renderContent()}
          </div>
          <div id="pagination-container"></div>
        </div>
      </div>
    `;
  }

  /**
   * metode untuk mengatasi dinamis rendering
   */
  updateDynamicContent() {
    const userRecsContainer = this.querySelector('#user-recs-container');
    if (userRecsContainer) userRecsContainer.innerHTML = this.renderUserRecommendationsSection();

    const searchRecsContainer = this.querySelector('#search-recs-container');
    if (searchRecsContainer) searchRecsContainer.innerHTML = this.renderSearchRecommendationsSection();

    const productListContainer = this.querySelector('#product-list-container');
    if (productListContainer) productListContainer.innerHTML = this.renderContent();

    const paginationContainer = this.querySelector('#pagination-container');
    if (paginationContainer) paginationContainer.innerHTML = this.renderPagination();
    
    this.attachDynamicListeners();
  }

  /**
   * Metode untuk memasang listener pada konten yang baru dirender.
   */
  attachDynamicListeners() {
    const paginationControls = this.querySelector("#pagination-controls");
    if (paginationControls) {
      paginationControls.removeEventListener("click", this.handlePaginationClick);
      paginationControls.addEventListener("click", this.handlePaginationClick);
    }
    
    setTimeout(() => {
        const wrappers = this.querySelectorAll(".recommendations-wrapper");
        const leftButtons = this.querySelectorAll(".scroll-left");
        const rightButtons = this.querySelectorAll(".scroll-right");

        leftButtons.forEach((btn, index) => {
            const oldHandler = btn.__scrollHandlerLeft;
            if (oldHandler) btn.removeEventListener("click", oldHandler);
            const newHandler = () => wrappers[index]?.scrollBy({ left: -300, behavior: "smooth" });
            btn.addEventListener("click", newHandler);
            btn.__scrollHandlerLeft = newHandler;
        });

        rightButtons.forEach((btn, index) => {
            const oldHandler = btn.__scrollHandlerRight;
            if (oldHandler) btn.removeEventListener("click", oldHandler);
            const newHandler = () => wrappers[index]?.scrollBy({ left: 300, behavior: "smooth" });
            btn.addEventListener("click", newHandler);
            btn.__scrollHandlerRight = newHandler;
        });
    }, 0);
  }

  async initializeMap() {
    if (this.mapInitialized) return true;
    try {
      this.productMap = new ProductMap("product-map", { height: "400px", defaultZoom: 10 });
      const success = await this.productMap.initializeMap(this.user?.province_name, this.user?.city_name);
      if (success) {
        this.mapInitialized = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Critical error during ProductMap initialization:", error);
      this.mapInitialized = false;
      return false;
    }
  }

  updateMapMarkers() {
    if (this.productMap && this.mapInitialized && this.productMap.isMapReady()) {
      this.productMap.refreshMarkers(this.items, this.user?.province_name);
      this.productMap.resizeMap();
    } else {
      console.warn("Map not ready to update markers yet. Skipping for now.");
    }
  }

  async fetchItems(params = {}) {
    if (this.isFetchingItems) return;
    this.isFetchingItems = true;
    this.isLoading = true;
    this.error = null;
    this.updateDynamicContent();

    try {
      const queryParams = { limit: this.pagination.limit, page: params.page || this.pagination.page, ...params };
      const queryString = Object.keys(queryParams).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`).join("&");
      const url = `/items?${queryString}`;
      const result = await apiGet(url);

      if (result.status === "success") {
        this.items = Array.isArray(result.data) ? result.data : [];
        if (result.pagination) this.pagination = result.pagination;
        this.isLoading = false;
        this.error = null;
        this.updateMapMarkers();
      } else {
        throw new Error(result.message || "Gagal memuat item.");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      this.items = [];
      this.error = error.message;
      this.isLoading = false;
    } finally {
      this.isFetchingItems = false;
      this.updateDynamicContent();
    }
  }

  async fetchUserRecommendations() {
    this.isLoadingUserRecommendations = true;
    this.userRecommendationsError = null;
    this.updateDynamicContent();
    try {
      const userId = this.getUserIdFromToken();
      if (!userId) {
        this.userRecommendations = [];
        return;
      }
      const mlResult = await fetchUserRecommendations(userId, 8);
      if (mlResult && mlResult.recommendations?.length > 0) {
        const promises = mlResult.recommendations.map(async (rec) => {
            try {
                const itemDetailResponse = await apiGet(`/items/${rec.product_id}`);
                return itemDetailResponse.status === "success" && itemDetailResponse.data ? { ...rec, ...itemDetailResponse.data } : null;
            } catch { return null; }
        });
        this.userRecommendations = (await Promise.all(promises)).filter(Boolean);
      } else {
        this.userRecommendations = [];
      }
    } catch (error) {
      this.userRecommendationsError = error.message;
    } finally {
      this.isLoadingUserRecommendations = false;
      this.updateDynamicContent();
    }
  }
  
  async fetchSearchRecommendations(keyword) {
    this.isLoadingSearchRecommendations = true;
    this.searchRecommendationsError = null;
    this.updateDynamicContent();
    try {
      if (!keyword) {
        this.searchRecommendations = [];
        return;
      }
      const mlResult = await fetchSearchRecommendations(keyword, 5);
      if (mlResult && mlResult.recommendations?.length > 0) {
        const promises = mlResult.recommendations.map(async (rec) => {
            try {
                const itemDetailResponse = await apiGet(`/items/${rec.product_id}`);
                return itemDetailResponse.status === "success" && itemDetailResponse.data ? { ...rec, ...itemDetailResponse.data } : null;
            } catch { return null; }
        });
        this.searchRecommendations = (await Promise.all(promises)).filter(Boolean);
      } else {
        this.searchRecommendations = [];
      }
    } catch(error) {
      this.searchRecommendationsError = error.message;
    } finally {
      this.isLoadingSearchRecommendations = false;
      this.updateDynamicContent();
    }
  }

  handleSearchEvent(event) {
    const searchTerm = event.detail.params.search || "";
    this.currentSearchKeyword = searchTerm;
    this.pagination.page = 1;
    this.fetchItems({ search: searchTerm, page: 1 });
    if (searchTerm) {
      this.fetchSearchRecommendations(searchTerm);
    } else {
      this.searchRecommendations = [];
      this.updateDynamicContent();
    }
  }

  handlePaginationClick(event) {
    const target = event.target.closest("[data-page]");
    if (!target) return;
    const page = Number.parseInt(target.dataset.page, 10);
    if (page && page !== this.pagination.page && page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.page = page;
      this.fetchItems({ search: this.currentSearchKeyword, page });
    }
  }

  getStatusInfo(item) {
    const status = item.status || "available";
    switch (status) {
      case "available": return { display: "Available", class: "bg-green-100 text-green-800", showAvailabilityBadges: true };
      case "pending": return { display: "Pending", class: "bg-yellow-100 text-yellow-800", showAvailabilityBadges: false };
      case "rented": return { display: "Rented", class: "bg-blue-100 text-blue-800", showAvailabilityBadges: false };
      case "sold": return { display: "Sold", class: "bg-red-100 text-red-800", showAvailabilityBadges: false };
      case "ongoing": return { display: "Ongoing", class: "bg-purple-100 text-purple-800", showAvailabilityBadges: false };
      default: return { display: status, class: "bg-gray-100 text-gray-800", showAvailabilityBadges: true };
    }
  }

  renderPagination() {
    if (this.pagination.totalPages <= 1) return "";
    const { page, totalPages, limit, total } = this.pagination;
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);
    let startPage = Math.max(1, page - 2), endPage = Math.min(totalPages, page + 2);
    if (page <= 3) endPage = Math.min(5, totalPages);
    if (page >= totalPages - 2) startPage = Math.max(1, totalPages - 4);
    const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    return `
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-4">
        <div class="text-sm text-gray-700 font-poppins">
          Menampilkan <span class="font-medium">${startItem}</span> sampai <span class="font-medium">${endItem}</span> dari <span class="font-medium">${total}</span> hasil
        </div>
        <div class="flex items-center gap-2" id="pagination-controls">
          <button data-page="${page - 1}" class="pagination-btn ${page === 1 ? 'pagination-btn-disabled' : 'pagination-btn-enabled'}" ${page === 1 ? 'disabled' : ''}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            <span class="hidden sm:inline">Previous</span>
          </button>
          <div class="flex items-center gap-1">
            ${startPage > 1 ? `<button data-page="1" class="pagination-number">1</button>${startPage > 2 ? '<span class="px-2 text-gray-500">...</span>' : ''}` : ''}
            ${pageNumbers.map(p => `<button data-page="${p}" class="pagination-number ${p === page ? 'pagination-number-active' : ''}">${p}</button>`).join('')}
            ${endPage < totalPages ? `${endPage < totalPages - 1 ? '<span class="px-2 text-gray-500">...</span>' : ''}<button data-page="${totalPages}" class="pagination-number">${totalPages}</button>` : ''}
          </div>
          <button data-page="${page + 1}" class="pagination-btn ${page === totalPages ? 'pagination-btn-disabled' : 'pagination-btn-enabled'}" ${page === totalPages ? 'disabled' : ''}>
            <span class="hidden sm:inline">Next</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>`;
  }

  renderUserRecommendationsSection() {
    if (!this.getUserIdFromToken()) return "";
    if (this.isLoadingUserRecommendations) return `<div>Loading recommendations...</div>`;
    if (this.userRecommendationsError) return `<div>Error: ${this.userRecommendationsError}</div>`;
    if (!this.userRecommendations || this.userRecommendations.length === 0) return `<div>No recommendations available.</div>`;

    const backendBaseUrl = "https://api.pinjemin.site";
    const formatRupiah = (money) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(money);
    
    return `
      <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gradient-to-r from-indigo-800 to-purple-900 rounded-xl shadow-lg mb-8 border border-indigo-600">
        <h3 class="text-2xl font-bold mb-6 text-white flex items-center"><i class="fa-solid fa-sparkles mr-3"></i>Rekomendasi untuk Anda</h3>
        <div class="relative">
          <button class="scroll-left absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-white/30 text-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300"><i class="fa-solid fa-angle-left text-lg"></i></button>
          <div class="flex overflow-x-auto space-x-6 pb-4 custom-scrollbar recommendations-wrapper">
            ${this.userRecommendations.map(rec => this.renderRecommendationCard(rec, backendBaseUrl, formatRupiah)).join('')}
          </div>
          <button class="scroll-right absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-white/30 text-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300"><i class="fa-solid fa-angle-right text-lg"></i></button>
        </div>
      </div>`;
  }

  renderSearchRecommendationsSection() {
    if (!this.currentSearchKeyword) return "";
    if (this.isLoadingSearchRecommendations) return `<div>Loading search suggestions...</div>`;
    if (this.searchRecommendationsError) return `<div>Error: ${this.searchRecommendationsError}</div>`;
    if (!this.searchRecommendations || this.searchRecommendations.length === 0) return `<div>No suggestions found.</div>`;

    const backendBaseUrl = "https://api.pinjemin.site";
    const formatRupiah = (money) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(money);

    return `
      <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg mb-8 text-white border border-gray-700">
        <h3 class="text-lg font-semibold mb-4 text-white flex items-center"><i class="fa-solid fa-wand-magic-sparkles mr-2"></i>Saran Terkait "${this.currentSearchKeyword}"</h3>
        <div class="relative">
          <button class="scroll-left absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow"><i class="fa-solid fa-angle-left"></i></button>
          <div class="flex overflow-x-auto space-x-6 pb-4 custom-scrollbar recommendations-wrapper">
            ${this.searchRecommendations.map(rec => this.renderRecommendationCard(rec, backendBaseUrl, formatRupiah)).join('')}
          </div>
          <button class="scroll-right absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow"><i class="fa-solid fa-angle-right"></i></button>
        </div>
      </div>`;
  }

  renderRecommendationCard(rec, backendBaseUrl, formatRupiah) {
    const statusInfo = this.getStatusInfo(rec);
    return `
      <div class="recommendation-card bg-white rounded-xl shadow-lg p-4 flex-shrink-0 w-64 relative overflow-hidden border-2 border-gray-200">
        <a href="/#/items/${rec.id || rec.product_id}" class="block">
          <div class="relative mb-3">
            ${rec.thumbnail ? `<img src="${backendBaseUrl}${rec.thumbnail}" alt="${rec.name}" class="recommendation-img w-full h-32 object-cover rounded-lg">` : `<div class="w-full h-32 bg-gray-200 rounded-lg"></div>`}
            <div class="absolute top-2 left-2"><span class="px-2 py-1 rounded-md text-xs font-medium ${statusInfo.class}">${statusInfo.display}</span></div>
          </div>
          <h5 class="text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-2">${rec.name || rec.product_name}</h5>
          ${statusInfo.showAvailabilityBadges ? `<div>${rec.is_available_for_sell ? `<p class="text-sm font-semibold">Jual: ${formatRupiah(rec.price_sell)}</p>` : ''}${rec.is_available_for_rent ? `<p class="text-sm font-semibold">Sewa: ${formatRupiah(rec.price_rent)}/hari</p>` : ''}</div>` : ''}
        </a>
      </div>`;
  }

  renderContent() {
    if (this.isLoading) {
      return `
        <div class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6">
          ${Array(8).fill(0).map(() => `
            <div class="w-full bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
              <div class="shimmer h-64 w-full"></div>
              <div class="p-5">
                <div class="shimmer h-6 w-3/4 mb-2 rounded"></div>
                <div class="shimmer h-4 w-1/2 rounded"></div>
              </div>
            </div>`).join("")}
        </div>`;
    }
    if (this.error) {
      return `<div class="text-center py-12"><div class="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto text-red-600 font-semibold">Error: ${this.error}</div></div>`;
    }
    if (!this.items || this.items.length === 0) {
      return `<div class="text-center py-16"><div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 max-w-md mx-auto"><p class="text-gray-600 font-medium text-lg">No items found.</p></div></div>`;
    }
    return `<div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">${this.generateItemList(this.items)}</div>`;
  }

  generateItemList(items) {
    const backendBaseUrl = "https://api.pinjemin.site";
    const formatRupiah = (money) => money != null ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(money) : "-";
    return items.map(item => {
      const statusInfo = this.getStatusInfo(item);
      return `
        <div class="product-recommendation-card">
          <a href="/#/items/${item.id}" class="block text-gray-800" data-item-id="${item.id}">
            <div class="relative overflow-hidden">
              ${item.thumbnail ? `<img src="${backendBaseUrl}${item.thumbnail}" alt="${item.name || 'Product image'}" class="product-recommendation-img w-full h-48 object-cover">` : '<div class="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400"><i class="fa-solid fa-image text-3xl"></i></div>'}
              <div class="absolute top-3 left-3"><span class="product-status-badge ${statusInfo.class} text-xs">${statusInfo.display}</span></div>
            </div>
            <div class="p-4">
              <h5 class="text-lg font-bold text-gray-900 line-clamp-2 mb-2 h-14">${item.name || "Unnamed Product"}</h5>
              ${statusInfo.showAvailabilityBadges ? `
                <div class="flex items-center gap-2 flex-wrap mb-3">
                  ${item.is_available_for_rent ? `<span class="product-availability-tag rent">Sewa</span>` : ""}
                  ${item.is_available_for_sell ? `<span class="product-availability-tag sell">Jual</span>` : ""}
                </div>
                <div class="space-y-1 border-t border-gray-200 pt-3">
                  ${item.is_available_for_sell ? `<p class="text-sm font-semibold flex items-center"><i class="fa-solid fa-tag text-green-600 mr-2"></i>Jual: ${formatRupiah(item.price_sell)}</p>` : ""}
                  ${item.is_available_for_rent ? `<p class="text-sm font-semibold flex items-center"><i class="fa-solid fa-calendar-days text-blue-600 mr-2"></i>Sewa: ${formatRupiah(item.price_rent)}${item.price_rent > 0 ? " /hari" : ""}</p>` : ""}
                </div>` : ""}
            </div>
          </a>
        </div>`;
    }).join("");
  }
}

customElements.define("all-product", AllProduct);