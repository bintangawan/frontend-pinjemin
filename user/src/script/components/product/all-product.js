import { apiGet } from "../../utils/apiService.js"
import { fetchSearchRecommendations, fetchUserRecommendations } from "../../utils/mlApiService.js"

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

    this.fetchItems = this.fetchItems.bind(this)
    this.handleSearchEvent = this.handleSearchEvent.bind(this)
    this.fetchSearchRecommendations = this.fetchSearchRecommendations.bind(this)
    this.fetchUserRecommendations = this.fetchUserRecommendations.bind(this)
    this.handlePaginationClick = this.handlePaginationClick.bind(this)
  }

  connectedCallback() {
    this.render()
    this.fetchUserRecommendations()
    this.fetchItems()

    document.addEventListener("search", this.handleSearchEvent)
    console.log("AllProduct component: Added search event listener on document.")
  }

  disconnectedCallback() {
    document.removeEventListener("search", this.handleSearchEvent)
    console.log("AllProduct component: Removed search event listener from document.")
  }

  // Get user ID from token
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

  async fetchUserRecommendations() {
    const userId = this.getUserIdFromToken()

    if (!userId) {
      console.log("No user ID found, skipping user recommendations")
      this.userRecommendations = []
      this.isLoadingUserRecommendations = false
      this.userRecommendationsError = null
      this.render()
      return
    }

    this.isLoadingUserRecommendations = true
    this.userRecommendationsError = null
    this.render()

    const topN = 8 // Number of recommendations to fetch

    try {
      console.log(`Fetching user-based recommendations for user ID: ${userId}`)
      const mlResult = await fetchUserRecommendations(userId, topN)
      console.log("Fetched user-based recommendations from ML API:", mlResult)

      if (mlResult && Array.isArray(mlResult.recommendations) && mlResult.recommendations.length > 0) {
        console.log(`Fetching full details for ${mlResult.recommendations.length} recommended items from main API.`)
        const recommendationPromises = mlResult.recommendations.map(async (rec) => {
          try {
            const itemDetailResponse = await apiGet(`/items/${rec.product_id}`)
            if (itemDetailResponse.status === "success" && itemDetailResponse.data) {
              return {
                ...rec,
                ...itemDetailResponse.data,
              }
            } else {
              console.warn(
                `Failed to fetch details for recommended item ID ${rec.product_id}:`,
                itemDetailResponse.message || "Unknown error",
              )
              return null
            }
          } catch (detailError) {
            console.error(`Error fetching details for recommended item ID ${rec.product_id}:`, detailError)
            return null
          }
        })

        const results = await Promise.all(recommendationPromises)
        this.userRecommendations = results.filter((item) => item !== null)
        this.isLoadingUserRecommendations = false

        if (mlResult.recommendations.length > 0 && this.userRecommendations.length === 0) {
          this.userRecommendationsError = "Gagal memuat detail untuk rekomendasi produk."
        } else {
          this.userRecommendationsError = null
        }
      } else {
        this.userRecommendations = []
        this.isLoadingUserRecommendations = false
        this.userRecommendationsError = mlResult.message || "Tidak ada rekomendasi produk yang ditemukan."
        console.warn("ML API returned no user recommendations or invalid data:", mlResult)
      }
    } catch (error) {
      console.error("Error during ML API fetch or subsequent detail fetch for user recommendations:", error)
      this.userRecommendations = []
      this.isLoadingUserRecommendations = false
      this.userRecommendationsError = error.message || "Terjadi kesalahan saat memuat rekomendasi produk."
    } finally {
      this.render()
    }
  }

  handleSearchEvent(event) {
    console.log("AllProduct component: Received search event.", event.detail.params)
    const searchTerm = event.detail.params.search || ""

    this.currentSearchKeyword = searchTerm
    // Reset to first page when searching
    this.pagination.page = 1

    this.fetchItems({ search: searchTerm, page: 1 })

    if (searchTerm) {
      this.fetchSearchRecommendations(searchTerm)
    } else {
      this.searchRecommendations = []
      this.isLoadingSearchRecommendations = false
      this.searchRecommendationsError = null
      this.render()
    }
  }

  handlePaginationClick(event) {
    const target = event.target.closest("[data-page]")
    if (!target) return

    const page = Number.parseInt(target.dataset.page)
    if (page && page !== this.pagination.page && page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.page = page
      const searchParams = this.currentSearchKeyword ? { search: this.currentSearchKeyword, page } : { page }
      this.fetchItems(searchParams)
    }
  }

  async fetchItems(params = {}) {
    this.isLoading = true
    this.error = null
    this.items = []
    this.render()

    try {
      // Add pagination parameters
      const queryParams = {
        limit: this.pagination.limit,
        page: params.page || this.pagination.page,
        ...params,
      }

      const queryString = Object.keys(queryParams)
        .map((key) => {
          return `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`
        })
        .join("&")

      const url = `/items?${queryString}`

      console.log("Fetching items from URL:", url)
      const result = await apiGet(url)
      console.log("Fetched items:", result)

      if (result.status === "success") {
        this.items = Array.isArray(result.data) ? result.data : []

        // Update pagination info from API response
        if (result.pagination) {
          this.pagination = {
            total: result.pagination.total || 0,
            page: result.pagination.page || 1,
            limit: result.pagination.limit || 20,
            totalPages: result.pagination.totalPages || 1,
          }
        }

        this.isLoading = false
        this.error = null
      } else {
        console.error("Failed to fetch items (API error):", result.message || "Unknown error", result)
        this.items = []
        this.error = result.message || "Gagal memuat item."
        this.isLoading = false
      }
    } catch (error) {
      console.error("Error fetching items:", error)
      this.items = []
      this.error = error.message || "Terjadi kesalahan saat memuat item."
      this.isLoading = false
    } finally {
      this.render()
    }
  }

  async fetchSearchRecommendations(keyword) {
    if (!keyword || keyword.trim() === "") {
      this.searchRecommendations = []
      this.isLoadingSearchRecommendations = false
      this.searchRecommendationsError = null
      this.render()
      return
    }

    this.isLoadingSearchRecommendations = true
    this.searchRecommendationsError = null
    this.render()

    const topN = 5

    try {
      console.log(`Fetching initial Search Based recommendations for keyword: "${keyword}" from ML API.`)
      const mlResult = await fetchSearchRecommendations(keyword, topN)
      console.log("Fetched initial Search Based recommendations from ML API:", mlResult)

      if (mlResult && Array.isArray(mlResult.recommendations) && mlResult.recommendations.length > 0) {
        console.log(`Fetching full details for ${mlResult.recommendations.length} recommended items from main API.`)
        const recommendationPromises = mlResult.recommendations.map(async (rec) => {
          try {
            const itemDetailResponse = await apiGet(`/items/${rec.product_id}`)
            if (itemDetailResponse.status === "success" && itemDetailResponse.data) {
              return {
                ...rec,
                ...itemDetailResponse.data,
              }
            } else {
              console.warn(
                `Failed to fetch details for recommended item ID ${rec.product_id}:`,
                itemDetailResponse.message || "Unknown error",
              )
              return null
            }
          } catch (detailError) {
            console.error(`Error fetching details for recommended item ID ${rec.product_id}:`, detailError)
            return null
          }
        })

        const results = await Promise.all(recommendationPromises)

        this.searchRecommendations = results.filter((item) => item !== null)

        this.isLoadingSearchRecommendations = false

        if (mlResult.recommendations.length > 0 && this.searchRecommendations.length === 0) {
          this.searchRecommendationsError = "Gagal memuat detail untuk saran pencarian."
        } else {
          this.searchRecommendationsError = null
        }
      } else {
        this.searchRecommendations = []
        this.isLoadingSearchRecommendations = false
        this.searchRecommendationsError = mlResult.message || "Tidak ada saran pencarian yang ditemukan dari ML API."
        console.warn("ML API returned no search recommendations or invalid data:", mlResult)
      }
    } catch (error) {
      console.error("Error during ML API fetch or subsequent detail fetch for search recommendations:", error)
      this.searchRecommendations = []
      this.isLoadingSearchRecommendations = false
      this.searchRecommendationsError = error.message || "Terjadi kesalahan saat memuat saran pencarian."
    } finally {
      this.render()
    }
  }

  // Helper method to get standardized status display
  getStatusInfo(item) {
    const status = item.status || "available"

    switch (status) {
      case "available":
        return {
          display: "Available",
          class: "bg-green-100 text-green-800",
          showAvailabilityBadges: true,
        }
      case "pending":
        return {
          display: "Pending",
          class: "bg-yellow-100 text-yellow-800",
          showAvailabilityBadges: false,
        }
      case "rented":
        return {
          display: "Rented",
          class: "bg-blue-100 text-blue-800",
          showAvailabilityBadges: false,
        }
      case "sold":
        return {
          display: "Sold",
          class: "bg-red-100 text-red-800",
          showAvailabilityBadges: false,
        }
      case "ongoing":
        return {
          display: "Ongoing",
          class: "bg-purple-100 text-purple-800",
          showAvailabilityBadges: false,
        }
      default:
        return {
          display: status,
          class: "bg-gray-100 text-gray-800",
          showAvailabilityBadges: true,
        }
    }
  }

  renderPagination() {
    if (this.pagination.totalPages <= 1) {
      return ""
    }

    const currentPage = this.pagination.page
    const totalPages = this.pagination.totalPages
    const startItem = (currentPage - 1) * this.pagination.limit + 1
    const endItem = Math.min(currentPage * this.pagination.limit, this.pagination.total)

    // Calculate page numbers to show
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, currentPage + 2)

    // Adjust if we're near the beginning or end
    if (currentPage <= 3) {
      endPage = Math.min(5, totalPages)
    }
    if (currentPage >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4)
    }

    const pageNumbers = []
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    return `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-4">
      <!-- Results info -->
      <div class="text-sm text-gray-700 font-poppins">
        Menampilkan <span class="font-medium">${startItem}</span> sampai <span class="font-medium">${endItem}</span> dari <span class="font-medium">${this.pagination.total}</span> hasil
      </div>
      
      <!-- Pagination controls -->
      <div class="flex items-center gap-2" id="pagination-controls">
        <!-- Previous button -->
        <button 
          data-page="${currentPage - 1}" 
          class="pagination-btn ${currentPage === 1 ? "pagination-btn-disabled" : "pagination-btn-enabled"}"
          ${currentPage === 1 ? "disabled" : ""}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          <span class="hidden sm:inline">Previous</span>
        </button>

        <!-- Page numbers -->
        <div class="flex items-center gap-1">
          ${
            startPage > 1
              ? `
            <button data-page="1" class="pagination-number">1</button>
            ${startPage > 2 ? '<span class="px-2 text-gray-500">...</span>' : ""}
          `
              : ""
          }
          
          ${pageNumbers
            .map(
              (page) => `
            <button 
              data-page="${page}" 
              class="pagination-number ${page === currentPage ? "pagination-number-active" : ""}"
            >
              ${page}
            </button>
          `,
            )
            .join("")}
          
          ${
            endPage < totalPages
              ? `
            ${endPage < totalPages - 1 ? '<span class="px-2 text-gray-500">...</span>' : ""}
            <button data-page="${totalPages}" class="pagination-number">${totalPages}</button>
          `
              : ""
          }
        </div>

        <!-- Next button -->
        <button 
          data-page="${currentPage + 1}" 
          class="pagination-btn ${currentPage === totalPages ? "pagination-btn-disabled" : "pagination-btn-enabled"}"
          ${currentPage === totalPages ? "disabled" : ""}
        >
          <span class="hidden sm:inline">Next</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>
  `

  }

  render() {
    this.innerHTML = `
        <style>
          * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
          }

          html, body {
              margin: 0;
              padding: 0;
          }
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
            
            * {
                font-family: 'Poppins', sans-serif;
            }

            /* Custom scrollbar styles */
            .custom-scrollbar::-webkit-scrollbar {
                height: 8px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: linear-gradient(90deg, #3b82f6, #10b981);
                border-radius: 4px;
                transition: all 0.3s ease;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(90deg, #2563eb, #059669);
            }

            /* Pagination styles */
            .pagination-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 0.75rem;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                font-weight: 500;
                transition: all 0.2s;
            }

            .pagination-btn-enabled {
                background-color: white;
                border: 1px solid #d1d5db;
                color: #374151;
            }

            .pagination-btn-enabled:hover {
                background-color: #f9fafb;
                border-color: #9ca3af;
            }

            .pagination-btn-disabled {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                color: #9ca3af;
                cursor: not-allowed;
            }

            .pagination-number {
                min-width: 2.5rem;
                height: 2.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                font-weight: 500;
                transition: all 0.2s;
                background-color: white;
                border: 1px solid #d1d5db;
                color: #374151;
            }

            .pagination-number:hover {
                background-color: #f3f4f6;
                border-color: #9ca3af;
            }

            .pagination-number-active {
                background-color: #3b82f6;
                border-color: #3b82f6;
                color: white;
            }

            .pagination-number-active:hover {
                background-color: #2563eb;
                border-color: #2563eb;
            }

            /* Recommendation card styles */
            .recommendation-card {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                background: #ffffff;
                border: 2px solid #e5e7eb;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }

            .recommendation-card:hover {
                transform: translateY(-6px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                border-color: #3b82f6;
            }

            .recommendation-img {
                transition: all 0.3s ease;
            }

            .recommendation-card:hover .recommendation-img {
                transform: scale(1.05);
            }
            
            /* product card */
            .product-recommendation-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  border: 2px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 0.75rem; /* Tambahkan ini untuk rounded corners */
  overflow: hidden; /* Tambahkan ini untuk memastikan gambar tidak keluar dari border */
}

.product-recommendation-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.product-recommendation-img {
  transition: all 0.3s ease;
}

.product-recommendation-card:hover .product-recommendation-img {
  transform: scale(1.05);
}

.product-status-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.product-availability-tag {
  background: #3b82f6;
  color: white;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.product-availability-tag.rent {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.product-availability-tag.sell {
  background: linear-gradient(135deg, #10b981, #059669);
}

            /* Main product card styles */
            .product-card {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 2px solid #e5e7eb;
                background: #ffffff;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }

            .product-card:hover {
                transform: translateY(-12px);
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                border-color: #3b82f6;
            }

            .product-image-container {
                position: relative;
                overflow: hidden;
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            }

            .product-card img {
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .product-card:hover img {
                transform: scale(1.08);
            }

            .product-name {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                min-height: 3em;
                transition: color 0.3s ease;
            }

            .product-card:hover .product-name {
                color: #3b82f6;
            }

            .price-tag {
                transition: all 0.3s ease;
                font-weight: 600;
                background: linear-gradient(135deg, #374151, #1f2937);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .product-card:hover .price-tag {
                background: linear-gradient(135deg, #3b82f6, #10b981);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                transform: scale(1.05);
            }

            .status-badge {
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }

            .status-badge.rent {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            }

            .status-badge.sell {
                background: linear-gradient(135deg, #10b981, #047857);
            }

            .product-card:hover .status-badge {
                transform: scale(1.1);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            }

            /* Loading shimmer effect */
            .shimmer {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            /* Pulse animation for loading states */
            .pulse-loading {
                animation: pulse 1.5s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            /* Section headers */
            .section-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 700;
                font-size: 1.875rem;
                margin-bottom: 1.5rem;
            }

            .section-divider {
                height: 4px;
                background: linear-gradient(90deg, #3b82f6, #10b981);
                border-radius: 2px;
                margin: 2rem 0;
            }
        </style>
        
        <div class="bg-white rounded-lg">
            <div class="py-6">
                <search-bar></search-bar>
            </div>
            ${this.renderSearchRecommendationsSection()}
            ${this.renderUserRecommendationsSection()}
            <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8">
                <div class="section-divider"></div>
                <h2 class="section-header text-center">Semua Produk</h2>
                ${this.renderContent()}
                ${this.renderPagination()}
            </div>
        </div>
        `

    // Add scroll functionality for recommendations
    setTimeout(() => {
      const wrappers = this.querySelectorAll(".recommendations-wrapper")
      const leftButtons = this.querySelectorAll(".scroll-left")
      const rightButtons = this.querySelectorAll(".scroll-right")

      leftButtons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
          wrappers[index]?.scrollBy({ left: -300, behavior: "smooth" })
        })
      })

      rightButtons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
          wrappers[index]?.scrollBy({ left: 300, behavior: "smooth" })
        })
      })
    }, 0)

    // Add event listener for pagination
    const paginationContainer = this.querySelector("#pagination-controls")
    if (paginationContainer) {
      paginationContainer.addEventListener("click", this.handlePaginationClick)
    }
  }

  renderUserRecommendationsSection() {
    const userId = this.getUserIdFromToken()

    // Don't show section if user is not logged in
    if (!userId) {
      return ""
    }

    if (this.isLoadingUserRecommendations) {
      return `
        <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gradient-to-r from-indigo-800 to-purple-900 rounded-xl shadow-lg mb-8 text-white border border-indigo-600">
          <h3 class="text-2xl font-bold mb-6 text-white flex items-center">
            <svg class="w-6 h-6 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Rekomendasi Produk untuk Anda
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${Array(4)
              .fill(0)
              .map(
                () => `
              <div class="bg-white/10 rounded-xl p-4 pulse-loading">
                <div class="shimmer h-32 w-full rounded-lg mb-3"></div>
                <div class="shimmer h-4 w-3/4 rounded mb-2"></div>
                <div class="shimmer h-3 w-1/2 rounded"></div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
    }

    if (this.userRecommendationsError) {
      return `
        <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gradient-to-r from-red-800 to-red-900 rounded-xl shadow-lg mb-8 text-white border border-red-600">
          <h3 class="text-2xl font-bold mb-4 text-white flex items-center">
            <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            Rekomendasi Produk untuk Anda
          </h3>
          <p class="text-red-200">Error memuat rekomendasi: ${this.userRecommendationsError}</p>
        </div>
      `
    }

    if (!this.userRecommendations || this.userRecommendations.length === 0) {
      return `
        <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg mb-8 text-white border border-gray-700">
          <h3 class="text-2xl font-bold mb-4 text-white flex items-center">
            <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Rekomendasi Produk untuk Anda
          </h3>
          <p class="text-gray-300">Belum ada rekomendasi yang tersedia. Mulai jelajahi produk untuk mendapatkan rekomendasi personal!</p>
        </div>
      `
    }

    const backendBaseUrl = "http://localhost:5000"
    const formatRupiah = (money) => {
      if (money === null || money === undefined) return "-"
      const numericMoney = typeof money === "string" ? Number.parseFloat(money) : money
      if (isNaN(numericMoney)) return "-"
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(numericMoney)
    }

    const recommendationsListHtml = this.userRecommendations
      .map((rec) => {
        const statusInfo = this.getStatusInfo(rec)

        return `
          <div class="recommendation-card bg-white rounded-xl shadow-lg p-4 flex-shrink-0 w-64 relative overflow-hidden border-2 border-gray-200">
            <a href="/#/items/${rec.id || rec.product_id}" class="block">
              <div class="relative mb-3">
                ${rec.thumbnail ? `<img src="${backendBaseUrl}${rec.thumbnail}" alt="${rec.name || "Product image"}" class="recommendation-img w-full h-32 object-cover rounded-lg">` : '<div class="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-500 font-medium">No Image</div>'}
                <div class="absolute top-2 left-2">
                  <span class="px-2 py-1 rounded-md text-xs font-medium ${statusInfo.class}">${statusInfo.display}</span>
                </div>
                ${
                  statusInfo.showAvailabilityBadges
                    ? `
                <div class="absolute top-2 right-2 flex flex-col space-y-1">
                  ${rec.is_available_for_rent ? `<span class="status-badge rent text-white text-xs px-2 py-1 rounded-md font-medium shadow-md">Sewa</span>` : ""}
                  ${rec.is_available_for_sell ? `<span class="status-badge sell text-white text-xs px-2 py-1 rounded-md font-medium shadow-md">Jual</span>` : ""}
                </div>
                `
                    : ""
                }
              </div>
              <div class="space-y-2">
                <h5 class="text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-2">${rec.name || rec.product_name || "Unnamed Product"}</h5>
                ${
                  statusInfo.showAvailabilityBadges
                    ? `
                <div class="space-y-1">
                  ${rec.is_available_for_sell ? `<p class="text-sm font-semibold text-gray-800">Jual: ${formatRupiah(rec.price_sell)}</p>` : ""}
                  ${rec.is_available_for_rent ? `<p class="text-sm font-semibold text-gray-800">Sewa: ${formatRupiah(rec.price_rent)}${rec.price_rent > 0 ? " /hari" : ""}</p>` : ""}
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
      <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gradient-to-r from-indigo-800 to-purple-900 rounded-xl shadow-lg mb-8 border border-indigo-600">
        <h3 class="text-2xl font-bold mb-6 text-white flex items-center">
          <i class="fa-solid fa-sparkles mr-3"></i>
          Rekomendasi Produk untuk Anda
        </h3>
        <div class="relative">
          <!-- Tombol kiri -->
          <button class="scroll-left absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-white/30 text-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300">
            <i class="fa-solid fa-angle-left text-lg"></i>
          </button>

          <!-- Daftar rekomendasi -->
          <div class="flex overflow-x-auto space-x-6 pb-4 custom-scrollbar recommendations-wrapper">
            ${recommendationsListHtml}
          </div>

          <!-- Tombol kanan -->
          <button class="scroll-right absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-white/30 text-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300">
            <i class="fa-solid fa-angle-right text-lg"></i>
          </button>
        </div>
      </div>
    `
  }

  renderSearchRecommendationsSection() {
    if (!this.currentSearchKeyword || this.currentSearchKeyword.trim() === "") {
      return ""
    }

    if (this.isLoadingSearchRecommendations) {
      return `
        <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg mb-8 text-white border border-gray-700">
          <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
            <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Saran Terkait "${this.currentSearchKeyword}"
          </h3>
          <p class="text-gray-300 pulse-loading">Memuat saran...</p>
        </div>
      `
    }

    if (this.searchRecommendationsError) {
      return `
        <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gradient-to-r from-red-800 to-red-900 rounded-xl shadow-lg mb-8 text-white border border-red-600">
          <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            Saran Terkait "${this.currentSearchKeyword}"
          </h3>
          <p>Error memuat saran: ${this.searchRecommendationsError}</p>
        </div>
      `
    }

    if (!this.searchRecommendations || this.searchRecommendations.length === 0) {
      return `
        <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg mb-8 text-white border border-gray-700">
          <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Saran Terkait "${this.currentSearchKeyword}"
          </h3>
          <p class="text-gray-300">Tidak ada saran yang ditemukan.</p>
        </div>
      `
    }

    const backendBaseUrl = "http://localhost:5000"
    const formatRupiah = (money) => {
      if (money === null || money === undefined) return "-"
      const numericMoney = typeof money === "string" ? Number.parseFloat(money) : money
      if (isNaN(numericMoney)) return "-"
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(numericMoney)
    }

    const recommendationsListHtml = this.searchRecommendations
      .map((rec) => {
        const statusInfo = this.getStatusInfo(rec)

        return `
          <div class="recommendation-card bg-white rounded-xl shadow-lg p-4 flex-shrink-0 w-64 relative overflow-hidden border-2 border-gray-200">
            <a href="/#/items/${rec.id || rec.product_id}" class="block">
              <div class="relative mb-3">
                ${rec.thumbnail ? `<img src="${backendBaseUrl}${rec.thumbnail}" alt="${rec.name || "Product image"}" class="recommendation-img w-full h-32 object-cover rounded-lg">` : '<div class="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-500 font-medium">No Image</div>'}
                <div class="absolute top-2 left-2">
                  <span class="px-2 py-1 rounded-md text-xs font-medium ${statusInfo.class}">${statusInfo.display}</span>
                </div>
                ${
                  statusInfo.showAvailabilityBadges
                    ? `
                <div class="absolute top-2 right-2 flex flex-col space-y-1">
                  ${rec.is_available_for_rent ? `<span class="status-badge rent text-white text-xs px-2 py-1 rounded-md font-medium shadow-md">Sewa</span>` : ""}
                  ${rec.is_available_for_sell ? `<span class="status-badge sell text-white text-xs px-2 py-1 rounded-md font-medium shadow-md">Jual</span>` : ""}
                </div>
                `
                    : ""
                }
              </div>
              <div class="space-y-2">
                <h5 class="text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-2">${rec.name || rec.product_name || "Unnamed Product"}</h5>
                ${
                  statusInfo.showAvailabilityBadges
                    ? `
                <div class="space-y-1">
                  ${rec.is_available_for_sell ? `<p class="text-sm font-semibold text-gray-800">Jual: ${formatRupiah(rec.price_sell)}</p>` : ""}
                  ${rec.is_available_for_rent ? `<p class="text-sm font-semibold text-gray-800">Sewa: ${formatRupiah(rec.price_rent)}${rec.price_rent > 0 ? " /hari" : ""}</p>` : ""}
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
      <div class="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg mb-8 border border-gray-700">
        <h3 class="text-lg font-semibold mb-4 text-white flex items-center">
          <i class="fa-solid fa-wand-magic-sparkles mr-2"></i>
          Saran Terkait "${this.currentSearchKeyword}"
        </h3>
        <div class="relative">
          <!-- Tombol kiri -->
          <button class="scroll-left absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow">
            <i class="fa-solid fa-angle-left"></i>
          </button>

          <!-- Daftar saran -->
          <div class="flex overflow-x-auto space-x-6 pb-4 custom-scrollbar recommendations-wrapper">
            ${recommendationsListHtml}
          </div>

          <!-- Tombol kanan -->
          <button class="scroll-right absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow">
            <i class="fa-solid fa-angle-right"></i>
          </button>
        </div>
      </div>
    `
  }

  renderContent() {
    if (this.isLoading) {
      return `
        <div class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6">
          ${Array(8)
            .fill(0)
            .map(
              () => `
              <div class="w-full bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                <div class="shimmer h-64 w-full"></div>
                <div class="p-5">
                  <div class="shimmer h-6 w-3/4 mb-2 rounded"></div>
                  <div class="shimmer h-4 w-1/2 rounded"></div>
                </div>
              </div>
            `,
            )
            .join("")}
        </div>
      `
    }

    if (this.error) {
      return `
        <div class="text-center py-12">
          <div class="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
            <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <p class="text-red-600 font-semibold">Error: ${this.error}</p>
          </div>
        </div>
      `
    }

    if (!this.items || this.items.length === 0) {
      return `
        <div class="text-center py-16">
          <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 max-w-md mx-auto">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8v2m0 6v2"></path>
            </svg>
            <p class="text-gray-600 font-medium text-lg">No items found matching your criteria.</p>
            <p class="text-gray-500 mt-2">Try adjusting your search terms or browse all products.</p>
          </div>
        </div>
      `
    }

    return `
      <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        ${this.generateItemList(this.items)}
      </div>
    `
  }

  generateItemList(items) {
  const formatRupiah = (money) => {
    if (money === null || money === undefined) return "-"
    const numericMoney = typeof money === "string" ? Number.parseFloat(money) : money
    if (isNaN(numericMoney)) return "-"

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numericMoney)
  }

  const backendBaseUrl = "http://localhost:5000"

  return items
    .map((item) => {
      const statusInfo = this.getStatusInfo(item)

      // UBAH BAGIAN INI - Ganti dengan desain card dari detail-product.js
      return `
        <div class="product-recommendation-card">
          <a href="/#/items/${item.id}" class="block text-gray-800" data-item-id="${item.id}">
            <div class="relative overflow-hidden">
              ${
                item.thumbnail
                  ? `<img src="${backendBaseUrl}${item.thumbnail}" alt="${item.name || "Product image"}" 
                      class="product-recommendation-img w-full h-48 object-cover">`
                  : '<div class="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400"><i class="fa-solid fa-image text-3xl"></i></div>'
              }
              <div class="absolute top-3 left-3">
                <span class="product-status-badge ${statusInfo.class} text-xs">${statusInfo.display}</span>
              </div>
            </div>
            
            <div class="p-4">
              <h5 class="text-lg font-bold text-gray-900 line-clamp-2 mb-2 h-14">${item.name || "Unnamed Product"}</h5>
              
              ${
                statusInfo.showAvailabilityBadges
                  ? `
                  <div class="flex items-center gap-2 flex-wrap mb-3">
                    ${item.is_available_for_rent ? `<span class="product-availability-tag rent">Sewa</span>` : ""}
                    ${item.is_available_for_sell ? `<span class="product-availability-tag sell">Jual</span>` : ""}
                  </div>
                  <div class="space-y-1 border-t border-gray-200 pt-3">
                    ${
                      item.is_available_for_sell
                        ? `<p class="text-sm font-semibold flex items-center">
                        <i class="fa-solid fa-tag text-green-600 mr-2"></i>
                        Jual: ${formatRupiah(item.price_sell)}
                      </p>`
                        : ""
                    }
                    ${
                      item.is_available_for_rent
                        ? `<p class="text-sm font-semibold flex items-center">
                        <i class="fa-solid fa-calendar-days text-blue-600 mr-2"></i>
                        Sewa: ${formatRupiah(item.price_rent)}${item.price_rent > 0 ? " /hari" : ""}
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
  }
}

customElements.define("all-product", AllProduct)