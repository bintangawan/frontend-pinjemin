import { apiGet, apiDelete, apiFormDataRequest } from "../../utils/apiService.js"
import Swal from 'sweetalert2'
import { SmallMap } from "../../components/SmallMap.js"
import { GeocodingUtils } from "../../utils/geocodingUtils.js"

const WILAYAH_BASE_URL = "https://kanglerian.my.id/api-wilayah-indonesia/api"

class MyItemsPage extends HTMLElement {
  constructor() {
    super()

    this.fetchUserItems = this.fetchUserItems.bind(this)
    this.renderUserItems = this.renderUserItems.bind(this)
    this.handleItemActions = this.handleItemActions.bind(this)
    this.handleEditItem = this.handleEditItem.bind(this)
    this.handleDeleteItem = this.handleDeleteItem.bind(this)
    this.handleUpdateItem = this.handleUpdateItem.bind(this)
    this.handlePaginationClick = this.handlePaginationClick.bind(this)

    this.editingItemId = null
    this.editingItemData = null
    this.user = null

    // Pagination state
    this.pagination = {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    }
    this.items = []
    this.isLoading = false
    this.error = null

    // Map instances
    this.addItemMap = null
    this.editItemMap = null
    this.selectedLocation = null
    this.editSelectedLocation = null
  }

  connectedCallback() {
    this.loadUserData()
    this.render()
    this.fetchUserItems()
  }

  disconnectedCallback() {
    this.removeEventListeners()

    // Cleanup maps
    if (this.addItemMap) {
      this.addItemMap.destroy()
      this.addItemMap = null
    }
    if (this.editItemMap) {
      this.editItemMap.destroy()
      this.editItemMap = null
    }
  }

  loadUserData() {
    const userData = localStorage.getItem("user")
    if (userData) {
      this.user = JSON.parse(userData)
    }
  }

  handlePaginationClick(event) {
    // Only handle clicks on pagination buttons
    const target = event.target.closest("[data-page]")
    if (!target) return
  
    // Prevent default behavior
    event.preventDefault()
    event.stopPropagation()
  
    const page = Number.parseInt(target.dataset.page)
    if (page && page !== this.pagination.page && page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.page = page
      this.fetchUserItems()
    }
  }

  // Helper function untuk mendapatkan status yang konsisten
  getItemStatus(item) {
    // Normalisasi status dari berbagai kemungkinan format
    if (!item.status) {
      return "available" // default status
    }

    const status = item.status.toLowerCase().trim()

    // Mapping status yang mungkin berbeda ke format standar
    switch (status) {
      case "available":
      case "tersedia":
      case "aktif":
        return "available"
      case "pending":
      case "menunggu":
      case "proses":
        return "pending"
      case "sold":
      case "terjual":
      case "dijual":
        return "sold"
      case "rented":
      case "disewa":
      case "tersewa":
        return "rented"
      case "completed":
      case "selesai":
        return "completed"
      default:
        return "available"
    }
  }

  // Helper function untuk mendapatkan display status dan styling
  getStatusDisplay(status) {
    const normalizedStatus = this.getItemStatus({ status })

    switch (normalizedStatus) {
      case "available":
        return {
          display: "Available",
          class: "text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs font-semibold font-poppins",
        }
      case "pending":
        return {
          display: "Pending",
          class: "text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full text-xs font-semibold font-poppins",
        }
      case "sold":
        return {
          display: "Sold",
          class: "text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs font-semibold font-poppins",
        }
      case "rented":
        return {
          display: "Rented",
          class: "text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full text-xs font-semibold font-poppins",
        }
      case "completed":
        return {
          display: "Completed",
          class: "text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full text-xs font-semibold font-poppins",
        }
      default:
        return {
          display: "Unknown",
          class: "text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold font-poppins",
        }
    }
  }

  // Helper function untuk mengecek apakah item bisa diedit/dihapus
  canEditOrDelete(item) {
    const status = this.getItemStatus(item)
    // Item bisa diedit/dihapus jika statusnya available, pending, atau completed
    return status === "available" || status === "pending" || status === "completed"
  }

  // Helper function untuk mengecek apakah item bisa dijual
  canBeSold(item) {
    const status = this.getItemStatus(item)
    // Item bisa dijual jika tidak sedang rented
    return status !== "rented"
  }

  // Helper function untuk validasi availability berdasarkan status
  validateAvailability(item, isAvailableForSell, isAvailableForRent) {
    const status = this.getItemStatus(item)
    
    // Jika item sedang rented, tidak bisa dijual
    if (status === "rented" && isAvailableForSell) {
      return {
        valid: false,
        message: "Item yang sedang disewa tidak dapat dijual sampai statusnya menjadi completed."
      }
    }

    // Jika item sudah sold, tidak bisa disewa
    if (status === "sold" && isAvailableForRent) {
      return {
        valid: false,
        message: "Item yang sudah terjual tidak dapat disewa."
      }
    }

    return { valid: true }
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
          Menampilkan <span class="font-medium">${startItem}</span> sampai <span class="font-medium">${endItem}</span> dari <span class="font-medium">${this.pagination.total}</span> item
        </div>
        
        <!-- Pagination controls -->
        <div class="flex items-center gap-2">
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
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
            
            * {
                font-family: 'Poppins', sans-serif;
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

                /* Leaflet styles */
                #map { height: 180px; }
            </style>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <div class="container mx-auto px-4 py-8 font-poppins">
                <h2 class="text-2xl font-bold mb-4">Item Saya (Toko Saya)</h2>

                <div id="add-item-section" class="mt-8 p-6 bg-white rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Tambah Item Baru</h3>
                    <form id="add-item-form" class="space-y-4">
                        <div>
                            <label for="item-name" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Nama Item <span class="text-red-500">*</span></label>
                            <input type="text" id="item-name" name="name" required class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        </div>
                        
                        <div>
                            <label for="item-category" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Kategori</label>
                            <select id="item-category" name="category_id" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                <option value="">Pilih Kategori</option>
                                <option value="1">Masak</option>
                                <option value="2">Fotografi</option>
                                <option value="3">Membaca</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="item-description" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Deskripsi</label>
                            <textarea id="item-description" name="description" rows="3" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"></textarea>
                        </div>

                        <div class="flex items-center space-x-4 mb-4">
                            <div class="flex items-center">
                                <input id="item-available-sell" name="is_available_for_sell" type="checkbox" value="true" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                                <label for="item-available-sell" class="ml-2 block text-sm text-gray-900 font-poppins">Tersedia untuk Dijual</label>
                            </div>
                            <div class="flex items-center">
                                <input id="item-available-rent" name="is_available_for_rent" type="checkbox" value="true" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                                <label for="item-available-rent" class="ml-2 block text-sm text-gray-900 font-poppins">Tersedia untuk Disewa</label>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="item-price-sell" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Harga Jual</label>
                                <input type="number" id="item-price-sell" name="price_sell" step="0.01" disabled class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50">
                            </div>
                            <div>
                                <label for="item-price-rent" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Harga Sewa</label>
                                <input type="number" id="item-price-rent" name="price_rent" step="0.01" disabled class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50">
                            </div>
                        </div>

                        <div id="deposit-field" class="hidden">
                            <label for="item-deposit" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Jumlah Deposit</label>
                            <input type="number" id="item-deposit" name="deposit_amount" step="0.01" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Provinsi</label>
                                <input type="text" value="${this.user?.province_name || "Tidak diset"}" disabled class="bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded-lg block w-full p-2.5 disabled:opacity-75">
                                <input type="hidden" name="province_id" value="${this.user?.province_id || ""}">
                                <input type="hidden" name="province_name" value="${this.user?.province_name || ""}">
                            </div>
                            <div>
                                <label class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Kota/Kabupaten</label>
                                <input type="text" value="${this.user?.city_name || "Tidak diset"}" disabled class="bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded-lg block w-full p-2.5 disabled:opacity-75">
                                <input type="hidden" name="city_id" value="${this.user?.city_id || ""}">
                                <input type="hidden" name="city_name" value="${this.user?.city_name || ""}">
                            </div>
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Lokasi pada Peta</label>
                            <div class="space-y-2">
                                <button type="button" id="get-current-location-add" class="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    Gunakan Lokasi Saat Ini
                                </button>
                                <div id="add-item-map" class="border border-gray-300 rounded-lg"></div>
                                <p class="text-xs text-gray-500">Klik pada peta untuk memilih lokasi yang lebih spesifik</p>
                            </div>
                            <input type="hidden" name="latitude" id="add-latitude">
                            <input type="hidden" name="longitude" id="add-longitude">
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold" for="item-photos">Foto Item (Multiple)</label>
                            <input class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" id="item-photos" name="photos" multiple accept="image/*" type="file">
                        </div>

                        <!-- Hidden field untuk status default -->
                        <input type="hidden" name="status" value="available">

                        <div>
                            <button type="submit" class="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                                Tambah Item
                            </button>
                        </div>
                    </form>
                </div>

                <div id="edit-item-section" class="mt-8 p-6 bg-white rounded-lg shadow-md hidden"> 
                    <h3 class="text-xl font-semibold mb-4">Edit Item <span id="editing-item-name" class="font-normal italic text-gray-600"></span></h3>
                    <form id="edit-item-form" class="space-y-4">
                        <div>
                            <label for="edit-item-name" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Nama Item <span class="text-red-500">*</span></label>
                            <input type="text" id="edit-item-name" name="name" required class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        </div>
                        
                        <div>
                            <label for="edit-item-category" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Kategori</label>
                            <select id="edit-item-category" name="category_id" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                <option value="">Pilih Kategori</option>
                                <option value="1">Masak</option>
                                <option value="2">Fotografi</option>
                                <option value="3">Membaca</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="edit-item-description" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Deskripsi</label>
                            <textarea id="edit-item-description" name="description" rows="3" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"></textarea>
                        </div>

                        <!-- Status selector untuk edit -->
                        <div>
                            <label for="edit-item-status" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Status Item</label>
                            <select id="edit-item-status" name="status" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                <option value="available">Available</option>
                                <option value="pending">Pending</option>
                                <option value="sold">Sold</option>
                                <option value="rented">Rented</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div class="flex items-center space-x-4 mb-4">
                            <div class="flex items-center">
                                <input id="edit-item-available-sell" name="is_available_for_sell" type="checkbox" value="true" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                                <label for="edit-item-available-sell" class="ml-2 block text-sm text-gray-900 font-poppins">Tersedia untuk Dijual</label>
                            </div>
                            <div class="flex items-center">
                                <input id="edit-item-available-rent" name="is_available_for_rent" type="checkbox" value="true" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                                <label for="edit-item-available-rent" class="ml-2 block text-sm text-gray-900 font-poppins">Tersedia untuk Disewa</label>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="edit-item-price-sell" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Harga Jual</label>
                                <input type="number" id="edit-item-price-sell" name="price_sell" step="0.01" disabled class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50">
                            </div>
                            <div>
                                <label for="edit-item-price-rent" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Harga Sewa</label>
                                <input type="number" id="edit-item-price-rent" name="price_rent" step="0.01" disabled class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50">
                            </div>
                        </div>

                        <div id="edit-deposit-field" class="hidden"> 
                            <label for="edit-item-deposit" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Jumlah Deposit</label>
                            <input type="number" id="edit-item-deposit" name="deposit_amount" step="0.01" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Provinsi</label>
                                <input type="text" value="${this.user?.province_name || "Tidak diset"}" disabled class="bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded-lg block w-full p-2.5 disabled:opacity-75">
                                <input type="hidden" name="province_id" value="${this.user?.province_id || ""}">
                                <input type="hidden" name="province_name" value="${this.user?.province_name || ""}">
                            </div>
                            <div>
                                <label class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Kota/Kabupaten</label>
                                <input type="text" value="${this.user?.city_name || "Tidak diset"}" disabled class="bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded-lg block w-full p-2.5 disabled:opacity-75">
                                <input type="hidden" name="city_id" value="${this.user?.city_id || ""}">
                                <input type="hidden" name="city_name" value="${this.user?.city_name || ""}">
                            </div>
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Lokasi pada Peta</label>
                            <div class="space-y-2">
                                <button type="button" id="get-current-location-edit" class="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    Gunakan Lokasi Saat Ini
                                </button>
                                <div id="edit-item-map" class="border border-gray-300 rounded-lg"></div>
                                <p class="text-xs text-gray-500">Klik pada peta untuk memilih lokasi yang lebih spesifik</p>
                            </div>
                            <input type="hidden" name="latitude" id="edit-latitude">
                            <input type="hidden" name="longitude" id="edit-longitude">
                        </div>

                        <div>
                            <label for="edit-item-photos" class="block mb-2 text-sm font-medium text-gray-900 font-poppins font-bold">Foto Item Baru (Multiple)</label>
                            <input type="file" id="edit-item-photos" name="photos" multiple accept="image/*" class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none">
                        </div>

                        <div class="flex space-x-4">
                            <button type="submit" class="flex-1 justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                                Simpan Perubahan
                            </button>
                            <button type="button" id="cancel-edit-button" class="flex-1 justify-center rounded-md bg-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-400">
                                Batal
                            </button>
                        </div>
                    </form>
                </div>

                <hr class="my-8">

                <div class="mt-8">
                    <h3 class="text-xl font-semibold mb-4">Daftar Item Anda</h3>
                    <div id="user-items-list">
                        ${this.renderItemsList()}
                    </div>
                    ${this.renderPagination()}
                </div>
            </div>
        `
    
    // Setup event listeners setelah render
    this.setupEventListeners()

    // Initialize edit map with item location or user's city
    setTimeout(async () => {
        if (this.editItemMap && this.user?.province_name) {
            try {
                await this.editItemMap.initializeMap(this.user.province_name, this.user.city_name)
                
                // If item has coordinates, set marker
                if (this.editingItemData?.latitude && this.editingItemData?.longitude) {
                    this.editItemMap.setMarker(this.editingItemData.latitude, this.editingItemData.longitude)
                }
            } catch (error) {
                console.error('Error initializing edit map:', error)
            }
        }
    }, 100)
  }

  renderItemsList() {
    if (this.isLoading) {
      return `
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-600">Loading items...</span>
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
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada item</h3>
            <p class="mt-1 text-sm text-gray-500">Mulai dengan menambahkan item pertama Anda.</p>
          </div>
        </div>
      `
    }

    return this.items.map((item) => this.renderSingleItem(item)).join("")
  }

  renderSingleItem(item) {
    const statusInfo = this.getStatusDisplay(item.status)
    const canEdit = this.canEditOrDelete(item)
    const canSell = this.canBeSold(item)

    const getCategoryName = (categoryId) => {
      switch (categoryId) {
        case 1:
          return "Masak"
        case 2:
          return "Fotografi"
        case 3:
          return "Membaca"
        default:
          return "Tidak dikategorikan"
      }
    }

    // Tambahkan informasi tambahan untuk status
    let statusNote = ""
    const status = this.getItemStatus(item)
    if (status === "rented") {
      statusNote = '<span class="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full ml-2">🚫 Tidak dapat dijual saat disewa</span>'
    } else if (status === "completed") {
      statusNote = '<span class="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full ml-2">✅ Dapat dijual/disewa lagi</span>'
    }

    return `
      <div class="mb-6 p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300 ${!canEdit ? "opacity-75 border-gray-400" : ""}">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="flex items-start gap-4 flex-1">
            ${
              item.thumbnail
                ? `<img src="http://31.97.67.212:5000${item.thumbnail}" alt="Thumbnail ${item.name}" class="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 flex-shrink-0">`
                : `<div class="w-20 h-20 bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    <span class="text-gray-500 text-xs">No Image</span>
                  </div>`
            }
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <h4 class="text-lg font-poppins font-bold text-gray-800 truncate">${item.name}</h4>
                <span class="${statusInfo.class}">${statusInfo.display}</span>
                ${statusNote}
                ${!canEdit ? '<span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">🔒 Tidak dapat diedit</span>' : ""}
              </div>
              <p class="text-sm text-gray-600 font-poppins mb-1 line-clamp-2">${item.description || "Tidak ada deskripsi"}</p>
              <div class="flex flex-wrap gap-4 text-sm text-gray-500 font-poppins">
                <span><strong>Kategori:</strong> ${getCategoryName(item.category_id)}</span>
                <span><strong>Lokasi:</strong> ${item.city_name || "-"}, ${item.province_name || "-"}</span>
              </div>
            </div>
          </div>
          
          <div class="flex flex-col lg:flex-row lg:items-center gap-4">
            <div class="flex flex-col sm:flex-row gap-2 text-sm font-poppins">
              ${
                item.price_sell
                  ? `<div class="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <span class="text-green-700 font-semibold">Jual: Rp ${Number.parseFloat(item.price_sell).toLocaleString("id-ID")}</span>
                    </div>`
                  : ""
              }
              ${
                item.price_rent
                  ? `<div class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <span class="text-blue-700 font-semibold">Sewa: Rp ${Number.parseFloat(item.price_rent).toLocaleString("id-ID")}/hari</span>
                    </div>`
                  : ""
              }
              ${
                item.is_available_for_rent && item.deposit_amount
                  ? `<div class="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <span class="text-yellow-700 font-semibold">Deposit: Rp ${Number.parseFloat(item.deposit_amount).toLocaleString("id-ID")}</span>
                    </div>`
                  : ""
              }
            </div>
            
            <div class="flex gap-2">
              <button class="edit-item-button ${canEdit ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-400 cursor-not-allowed"} text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-1" 
                      data-item-id="${item.id}" 
                      ${!canEdit ? 'disabled title="Item tidak dapat diedit karena sudah sold/rented"' : ""}>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Edit
              </button>
              <button class="delete-item-button ${canEdit ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 cursor-not-allowed"} text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-1" 
                      data-item-id="${item.id}"
                      ${!canEdit ? 'disabled title="Item tidak dapat dihapus karena sudah sold/rented"' : ""}>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  setupEventListeners() {
    const addItemForm = this.querySelector("#add-item-form")
    if (addItemForm) {
      addItemForm.addEventListener("submit", this.handleAddItem)
    }

    // Setup checkbox listeners untuk form tambah item
    this.setupAvailabilityListeners("add")

    const itemListDiv = this.querySelector("#user-items-list")
    if (itemListDiv) {
      itemListDiv.addEventListener("click", this.handleItemActions)
    }

    const editItemForm = this.querySelector("#edit-item-form")
    if (editItemForm) {
      editItemForm.addEventListener("submit", this.handleUpdateItem)
    }

    // Setup checkbox listeners untuk form edit item
    this.setupAvailabilityListeners("edit")

    const cancelEditButton = this.querySelector("#cancel-edit-button")
    if (cancelEditButton) {
      cancelEditButton.addEventListener("click", this.hideEditForm.bind(this))
    }
    
    this.addEventListener("click", this.handlePaginationClick)

    // Initialize maps and setup location buttons
    this.initializeMaps()
    this.setupLocationButtons()
  }

  async initializeMaps() {
    // Wait a bit for DOM to be ready
    setTimeout(async () => {
        try {
            // Initialize add item map
            this.addItemMap = new SmallMap('add-item-map', {
                height: '300px',
                defaultZoom: 12,
                onLocationSelect: (lat, lng) => {
                    this.selectedLocation = { lat, lng }
                    document.getElementById('add-latitude').value = lat
                    document.getElementById('add-longitude').value = lng
                }
            })

            // Initialize edit item map
            this.editItemMap = new SmallMap('edit-item-map', {
                height: '300px',
                defaultZoom: 12,
                onLocationSelect: (lat, lng) => {
                    this.editSelectedLocation = { lat, lng }
                    document.getElementById('edit-latitude').value = lat
                    document.getElementById('edit-longitude').value = lng
                }
            })

            // Initialize add map with user's city
            if (this.user?.province_name) {
                await this.addItemMap.initializeMap(this.user.province_name, this.user.city_name)
            }

        } catch (error) {
            console.error('Error initializing maps:', error)
        }
    }, 500)
}

setupLocationButtons() {
    // Add item current location button
    const addLocationBtn = this.querySelector('#get-current-location-add')
    if (addLocationBtn) {
        addLocationBtn.addEventListener('click', async () => {
            try {
                addLocationBtn.disabled = true
                addLocationBtn.innerHTML = `
                    <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Mengambil Lokasi...
                `
                
                if (this.addItemMap && this.addItemMap.isMapReady()) {
                    await this.addItemMap.getCurrentLocation()
                } else {
                    throw new Error('Map belum siap')
                }
            } catch (error) {
                console.error('Error getting current location:', error)
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Mengambil Lokasi',
                    text: 'Tidak dapat mengambil lokasi saat ini. Pastikan GPS aktif dan izin lokasi diberikan.',
                    confirmButtonColor: '#ef4444'
                })
            } finally {
                addLocationBtn.disabled = false
                addLocationBtn.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Gunakan Lokasi Saat Ini
                `
            }
        })
    }

    // Edit item current location button
    const editLocationBtn = this.querySelector('#get-current-location-edit')
    if (editLocationBtn) {
        editLocationBtn.addEventListener('click', async () => {
            try {
                editLocationBtn.disabled = true
                editLocationBtn.innerHTML = `
                    <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Mengambil Lokasi...
                `
                
                if (this.editItemMap && this.editItemMap.isMapReady()) {
                    await this.editItemMap.getCurrentLocation()
                } else {
                    throw new Error('Map belum siap')
                }
            } catch (error) {
                console.error('Error getting current location:', error)
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Mengambil Lokasi',
                    text: 'Tidak dapat mengambil lokasi saat ini. Pastikan GPS aktif dan izin lokasi diberikan.',
                    confirmButtonColor: '#ef4444'
                })
            } finally {
                editLocationBtn.disabled = false
                editLocationBtn.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Gunakan Lokasi Saat Ini
                `
            }
        })
    }
}

  // Helper method untuk setup availability listeners
  setupAvailabilityListeners(formType) {
    const prefix = formType === "add" ? "item" : "edit-item"
    
    const availableSellCheckbox = this.querySelector(`#${prefix}-available-sell`)
    const availableRentCheckbox = this.querySelector(`#${prefix}-available-rent`)
    const priceSellInput = this.querySelector(`#${prefix}-price-sell`)
    const priceRentInput = this.querySelector(`#${prefix}-price-rent`)
    const depositFieldDiv = this.querySelector(`#${formType === "add" ? "deposit" : "edit-deposit"}-field`)
    const depositInput = this.querySelector(`#${prefix}-deposit`)

    if (availableSellCheckbox && priceSellInput) {
      availableSellCheckbox.addEventListener("change", (event) => {
        priceSellInput.disabled = !event.target.checked
        if (!event.target.checked) {
          priceSellInput.value = ""
        } else {
          setTimeout(() => priceSellInput.focus(), 100)
        }
      })
    }

    if (availableRentCheckbox && priceRentInput && depositFieldDiv && depositInput) {
      availableRentCheckbox.addEventListener("change", (event) => {
        priceRentInput.disabled = !event.target.checked
        if (event.target.checked) {
          depositFieldDiv.classList.remove("hidden")
          setTimeout(() => priceRentInput.focus(), 100)
        } else {
          depositFieldDiv.classList.add("hidden")
          priceRentInput.value = ""
          depositInput.value = ""
        }
      })
    }
  }

  removeEventListeners() {
    const addItemForm = this.querySelector("#add-item-form")
    if (addItemForm) {
      addItemForm.removeEventListener("submit", this.handleAddItem)
    }

    const itemListDiv = this.querySelector("#user-items-list")
    if (itemListDiv) {
      itemListDiv.removeEventListener("click", this.handleItemActions)
    }

    const editItemForm = this.querySelector("#edit-item-form")
    if (editItemForm) {
      editItemForm.removeEventListener("submit", this.handleUpdateItem)
    }

    const cancelEditButton = this.querySelector("#cancel-edit-button")
    if (cancelEditButton) {
      cancelEditButton.removeEventListener("click", this.hideEditForm.bind(this))
    }
    
    this.removeEventListener("click", this.handlePaginationClick)
  }

  showAddForm() {
    this.querySelector("#add-item-section").classList.remove("hidden")
    this.querySelector("#edit-item-section").classList.add("hidden")
    const addItemForm = this.querySelector("#add-item-form")
    if (addItemForm) addItemForm.reset()

    // Reset form state
    const priceSellInput = this.querySelector("#item-price-sell")
    const priceRentInput = this.querySelector("#item-price-rent")
    const depositField = this.querySelector("#deposit-field")

    if (priceSellInput) priceSellInput.disabled = true
    if (priceRentInput) priceRentInput.disabled = true
    if (depositField) depositField.classList.add("hidden")

    this.editingItemId = null
  }

  showEditForm() {
  this.querySelector("#add-item-section").classList.add("hidden")
  const editSection = this.querySelector("#edit-item-section")
  editSection.classList.remove("hidden")

  // Tunggu DOM berubah dan terlihat
  setTimeout(async () => {
    const mapContainer = document.getElementById('edit-item-map')
    if (mapContainer && mapContainer.offsetParent !== null) {
      if (this.editItemMap && this.user?.province_name) {
        try {
          await this.editItemMap.initializeMap(this.user.province_name, this.user.city_name)
          console.log("Apakah #edit-item-map visible?", document.getElementById("edit-item-map")?.offsetParent !== null);


          if (this.editingItemData?.latitude && this.editingItemData?.longitude) {
            this.editItemMap.setMarker(this.editingItemData.latitude, this.editingItemData.longitude)
          }
        } catch (error) {
          console.error('Error initializing edit map:', error)
        }
      }
    }
  }, 1000) // beri delay cukup agar DOM benar-benar updated
}


  hideEditForm() {
    this.showAddForm()
  }

  handleAddItem = async (event) => {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // --- Validasi Form (Tidak ada perubahan) ---
    const availableSell = form.querySelector("#item-available-sell").checked;
    const availableRent = form.querySelector("#item-available-rent").checked;

    if (!availableSell && !availableRent) {
        Swal.fire({
            icon: 'warning',
            title: 'Validasi Error',
            text: 'Item harus tersedia untuk dijual atau disewa (minimal salah satu).',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }

    if (availableSell && !form.querySelector("#item-price-sell").value) {
        Swal.fire({
            icon: 'warning',
            title: 'Harga Jual Kosong',
            text: 'Harga jual harus diisi jika item tersedia untuk dijual.',
            confirmButtonColor: '#3b82f6'
        }).then(() => {
            form.querySelector("#item-price-sell").focus();
        });
        return;
    }

    if (availableRent && !form.querySelector("#item-price-rent").value) {
        Swal.fire({
            icon: 'warning',
            title: 'Harga Sewa Kosong',
            text: 'Harga sewa harus diisi jika item tersedia untuk disewa.',
            confirmButtonColor: '#3b82f6'
        }).then(() => {
            form.querySelector("#item-price-rent").focus();
        });
        return;
    }

    // --- Persiapan FormData (Tidak ada perubahan) ---
    const categoryInput = this.querySelector("#item-category");
    if (!categoryInput || !categoryInput.value) {
        formData.delete("category_id");
    }

    const priceSellInput = form.querySelector("#item-price-sell");
    if (!priceSellInput || !priceSellInput.value || priceSellInput.disabled) {
        formData.delete("price_sell");
    }

    const priceRentInput = form.querySelector("#item-price-rent");
    if (!priceRentInput || !priceRentInput.value || priceRentInput.disabled) {
        formData.delete("price_rent");
    }

    const availableRentCheckbox = form.querySelector("#item-available-rent");
    const depositInput = form.querySelector("#item-deposit");
    if (!availableRentCheckbox || !availableRentCheckbox.checked || !depositInput || !depositInput.value) {
        formData.delete("deposit_amount");
    }

    const availableSellCheckbox = form.querySelector("#item-available-sell");
    formData.set("is_available_for_sell", availableSellCheckbox && availableSellCheckbox.checked ? "true" : "false");
    formData.set("is_available_for_rent", availableRentCheckbox && availableRentCheckbox.checked ? "true" : "false");

    formData.set("status", "available");
    for (const pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
    }

    try {
        const result = await apiFormDataRequest("POST", "/items", formData);

        if (result.status === "success") {
            fetch("http://localhost:5001/api/refresh_data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            }).then(() => {
            }).catch(refreshError => {
                console.warn("Failed to trigger ML backend data refresh:", refreshError);
            });
            await Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Item berhasil ditambahkan. Anda akan dialihkan ke halaman utama.',
                confirmButtonColor: '#10b981',
                confirmButtonText: 'OK'
            });
            window.location.href = "/#/home";
            
        } else {
            console.error("Failed to add item (API error):", result.message, result.errors);
            let errorMessage = "Gagal menambahkan item: " + result.message;
            if (result.errors && Array.isArray(result.errors)) {
                errorMessage += "\nValidasi error:";
                result.errors.forEach((err) => {
                    errorMessage += `\n- ${err.param}: ${err.msg}`;
                });
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Gagal Menambahkan Item',
                text: errorMessage,
                confirmButtonColor: '#ef4444'
            });
        }
    } catch (error) {
        console.error("Error adding item:", error);
        Swal.fire({
            icon: 'error',
            title: 'Terjadi Kesalahan',
            text: 'Terjadi kesalahan saat menambahkan item. Silakan coba lagi.',
            confirmButtonColor: '#ef4444'
        });
    }
}

  async fetchUserItems() {
    this.isLoading = true
    this.error = null
    this.render()

    try {
      const user = localStorage.getItem("user")
      if (!user) {
        console.error("User not found in localStorage. Cannot fetch items.")
        this.items = []
        this.isLoading = false
        this.render()
        return
      }
      const userId = JSON.parse(user).id

      // Add pagination parameters
      const queryParams = {
        user_id: userId,
        limit: this.pagination.limit,
        page: this.pagination.page,
      }

      const queryString = Object.keys(queryParams)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join("&")

      const result = await apiGet(`/items?${queryString}`)

      if (result.status === "success") {
        this.items = Array.isArray(result.data) ? result.data : []

        // Update pagination info from API response
        if (result.pagination) {
          this.pagination = {
            total: result.pagination.total || 0,
            page: result.pagination.page || 1,
            limit: result.pagination.limit || 10,
            totalPages: result.pagination.totalPages || 1,
          }
        }
        this.isLoading = false
        this.error = null
      } else {
        console.error("Failed to fetch user items:", result.message)
        this.items = []
        this.error = result.message || "Gagal memuat item."
        this.isLoading = false
      }
    } catch (error) {
      console.error("Error fetching user items:", error)
      this.items = []
      this.error = error.message || "Terjadi kesalahan saat memuat item."
      this.isLoading = false
    } finally {
      this.render()
    }
  }

  renderUserItems(items) {
    // This method is now replaced by renderItemsList() which is called in render()
    // Keeping for backward compatibility but it's no longer used
    console.warn("renderUserItems is deprecated, use renderItemsList instead")
  }

  handleItemActions(event) {
    const target = event.target.closest("button")
    if (!target) return

    // Cek apakah button disabled
    if (target.disabled) {
      return
    }

    if (target.classList.contains("edit-item-button")) {
      const itemId = target.dataset.itemId
      if (itemId) {
        this.handleEditItem(itemId)
      }
    }

    if (target.classList.contains("delete-item-button")) {
      const itemId = target.dataset.itemId
      if (itemId) {
        this.handleDeleteItem(itemId)
      }
    }
  }

  async handleEditItem(itemId) {
  
    this.editingItemId = itemId
  
    try {
      const apiResult = await apiGet(`/items/${itemId}`)
  
      if (apiResult.status === "success") {
        this.editingItemData = apiResult.data
  
        // Cek apakah item bisa diedit
        if (!this.canEditOrDelete(this.editingItemData)) {
          Swal.fire({
            icon: 'warning',
            title: 'Tidak Dapat Diedit',
            text: 'Item ini tidak dapat diedit karena sudah sold atau rented.',
            confirmButtonColor: '#f59e0b'
          })
          this.editingItemId = null
          this.editingItemData = null
          return
        }
  
        // Konfirmasi edit dengan SweetAlert
        const confirmation = await Swal.fire({
          title: 'Edit Item',
          text: `Apakah Anda yakin ingin mengedit item "${this.editingItemData.name}"?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3b82f6',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Ya, Edit',
          cancelButtonText: 'Batal'
        })
  
        if (confirmation.isConfirmed) {
          this.showEditForm()
          this.populateEditForm(this.editingItemData)
        } else {
          this.editingItemId = null
          this.editingItemData = null
        }
      } else {
        console.error("Failed to fetch item details for editing:", apiResult.message)
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mengambil Data',
          text: "Gagal mengambil detail item untuk diedit: " + apiResult.message,
          confirmButtonColor: '#ef4444'
        })
        this.editingItemId = null
        this.editingItemData = null
      }
    } catch (error) {
      console.error("Error fetching item details for editing:", error)
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: 'Terjadi kesalahan saat mengambil detail item.',
        confirmButtonColor: '#ef4444'
      })
      this.editingItemId = null
      this.editingItemData = null
    }
  }
  

  async populateEditForm(item) {
    const form = this.querySelector("#edit-item-form")
    if (!form || !item) return

    form.querySelector("#edit-item-name").value = item.name || ""
    const editingItemNameSpan = this.querySelector("#editing-item-name")
    if (editingItemNameSpan) {
      editingItemNameSpan.textContent = item.name || ""
    }

    form.querySelector("#edit-item-category").value = item.category_id || ""
    form.querySelector("#edit-item-description").value = item.description || ""
    form.querySelector("#edit-item-price-sell").value = item.price_sell || ""
    form.querySelector("#edit-item-price-rent").value = item.price_rent || ""

    // Set status
    const statusSelect = form.querySelector("#edit-item-status")
    if (statusSelect) {
      const normalizedStatus = this.getItemStatus(item)
      statusSelect.value = normalizedStatus
    }

    const availableSellCheckbox = form.querySelector("#edit-item-available-sell")
    const availableRentCheckbox = form.querySelector("#edit-item-available-rent")
    const priceSellInput = this.querySelector("#edit-item-price-sell")
    const priceRentInput = this.querySelector("#edit-item-price-rent")

    availableSellCheckbox.checked = item.is_available_for_sell === 1 || item.is_available_for_sell === true
    availableRentCheckbox.checked = item.is_available_for_rent === 1 || item.is_available_for_rent === true

    priceSellInput.disabled = !availableSellCheckbox.checked
    priceRentInput.disabled = !availableRentCheckbox.checked

    const depositFieldDiv = this.querySelector("#edit-deposit-field")
    const depositInput = form.querySelector("#edit-item-deposit")
    if (item.is_available_for_rent === 1 || item.is_available_for_rent === true) {
      if (depositFieldDiv) depositFieldDiv.classList.remove("hidden")
      if (depositInput) depositInput.value = item.deposit_amount || ""
    } else {
      if (depositFieldDiv) depositFieldDiv.classList.add("hidden")
      if (depositInput) depositInput.value = ""
    }

    // Set coordinates if available
    if (item.latitude && item.longitude) {
        const editLatInput = form.querySelector("#edit-latitude")
        const editLngInput = form.querySelector("#edit-longitude")
        if (editLatInput) editLatInput.value = item.latitude
        if (editLngInput) editLngInput.value = item.longitude
        this.editSelectedLocation = { lat: item.latitude, lng: item.longitude }
    }

    // Setup status change listener untuk validasi availability
    if (statusSelect) {
      statusSelect.addEventListener("change", (event) => {
        const newStatus = event.target.value
        
        // Jika status berubah ke rented, disable checkbox jual
        if (newStatus === "rented") {
          availableSellCheckbox.disabled = true
          availableSellCheckbox.checked = false
          priceSellInput.disabled = true
          priceSellInput.value = ""
        } else {
          availableSellCheckbox.disabled = false
        }
      })
    }
  }

  handleUpdateItem = async (event) => {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // --- Validasi Form (Tidak ada perubahan) ---
    if (!this.editingItemId) {
        console.error("No item ID set for editing.");
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Terjadi kesalahan: ID item yang diedit tidak ditemukan.',
            confirmButtonColor: '#ef4444'
        });
        return;
    }

    if (!this.canEditOrDelete(this.editingItemData)) {
        Swal.fire({
            icon: 'warning',
            title: 'Tidak Dapat Diedit',
            text: 'Item ini tidak dapat diedit karena sudah sold atau rented.',
            confirmButtonColor: '#f59e0b'
        });
        return;
    }

    const availableSellCheckbox = form.querySelector("#edit-item-available-sell");
    const availableRentCheckbox = form.querySelector("#edit-item-available-rent");
    const statusSelect = form.querySelector("#edit-item-status");

    const validation = this.validateAvailability({ status: statusSelect.value }, availableSellCheckbox.checked, availableRentCheckbox.checked);

    if (!validation.valid) {
        Swal.fire({
            icon: 'warning',
            title: 'Validasi Error',
            text: validation.message,
            confirmButtonColor: '#f59e0b'
        });
        return;
    }

    if (!availableSellCheckbox.checked && !availableRentCheckbox.checked) {
        Swal.fire({
            icon: 'warning',
            title: 'Validasi Error',
            text: 'Item harus tersedia untuk dijual atau disewa (minimal salah satu).',
            confirmButtonColor: '#f59e0b'
        });
        return;
    }

    if (availableSellCheckbox.checked && !form.querySelector("#edit-item-price-sell").value) {
        Swal.fire({
            icon: 'warning',
            title: 'Harga Jual Kosong',
            text: 'Harga jual harus diisi jika item tersedia untuk dijual.',
            confirmButtonColor: '#f59e0b'
        }).then(() => {
            form.querySelector("#edit-item-price-sell").focus();
        });
        return;
    }

    if (availableRentCheckbox.checked && !form.querySelector("#edit-item-price-rent").value) {
        Swal.fire({
            icon: 'warning',
            title: 'Harga Sewa Kosong',
            text: 'Harga sewa harus diisi jika item tersedia untuk disewa.',
            confirmButtonColor: '#f59e0b'
        }).then(() => {
            form.querySelector("#edit-item-price-rent").focus();
        });
        return;
    }

    // --- Persiapan FormData (Tidak ada perubahan) ---
    formData.delete("is_available_for_sell");
    formData.delete("is_available_for_rent");
    formData.append("is_available_for_sell", availableSellCheckbox.checked ? "true" : "false");
    formData.append("is_available_for_rent", availableRentCheckbox.checked ? "true" : "false");

    const depositInput = form.querySelector("#edit-item-deposit");
    if (!availableRentCheckbox.checked || !depositInput.value) {
        formData.delete("deposit_amount");
    }

    const priceSellInput = this.querySelector("#edit-item-price-sell");
    const priceRentInput = this.querySelector("#edit-item-price-rent");

    if (!priceSellInput.value || priceSellInput.disabled) formData.delete("price_sell");
    if (!priceRentInput.value || priceRentInput.disabled) formData.delete("price_rent");

    formData.append("id", this.editingItemId);
    for (const pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
    }

    try {
        const result = await apiFormDataRequest("PATCH", `/items/${this.editingItemId}`, formData);

        if (result.status === "success") {
            fetch("http://localhost:5001/api/refresh_data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            }).then(() => {
            }).catch(refreshError => {
                console.warn("Failed to trigger ML backend data refresh:", refreshError);
            });
            await Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Item berhasil diupdate. Anda akan dialihkan ke halaman utama.',
                confirmButtonColor: '#10b981',
                confirmButtonText: 'OK'
            });
            window.location.href = "/#/home";
        } else {
            console.error("Failed to update item (API error):", result.message, result.errors);
            let errorMessage = "Gagal mengupdate item: " + result.message;
            if (result.errors && Array.isArray(result.errors)) {
                errorMessage += "\nValidasi error:";
                result.errors.forEach((err) => {
                    errorMessage += `\n- ${err.param}: ${err.msg}`;
                });
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Gagal Mengupdate Item',
                text: errorMessage,
                confirmButtonColor: '#ef4444'
            });
        }
    } catch (error) {
        console.error("Error updating item:", error);
        Swal.fire({
            icon: 'error',
            title: 'Terjadi Kesalahan',
            text: 'Terjadi kesalahan saat mengupdate item. Silakan coba lagi.',
            confirmButtonColor: '#ef4444'
        });
    }
}

  async handleDeleteItem(itemId) {

    try {
      // Konfirmasi delete dengan SweetAlert
      const result = await Swal.fire({
        title: 'Hapus Item',
        text: "Apakah Anda yakin ingin menghapus item ini?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
      })

      if (result.isConfirmed) {
        const deleteResult = await apiDelete(`/items/${itemId}`)

        if (deleteResult.status === "success") {
          
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Item berhasil dihapus!',
            confirmButtonColor: '#10b981'
          })
          try {
            await fetch("http://localhost:5001/api/refresh_data", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            })
            await new Promise((resolve) => setTimeout(resolve, 2000))
          } catch (refreshError) {
            console.warn("Failed to trigger ML backend data refresh:", refreshError)
          }

          this.fetchUserItems()
        } else {
          console.error("Failed to delete item:", deleteResult.message)
          Swal.fire({
            icon: 'error',
            title: 'Gagal Menghapus Item',
            text: "Gagal menghapus item: " + deleteResult.message,
            confirmButtonColor: '#ef4444'
          })
        }
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: 'Terjadi kesalahan saat menghapus item. Silakan coba lagi.',
        confirmButtonColor: '#ef4444'
      })
    }
  }
}

customElements.define("my-items-page", MyItemsPage)