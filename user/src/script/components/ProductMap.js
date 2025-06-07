// ProductMap.js
import { GeocodingUtils } from "../utils/geocodingUtils.js"
import L from "leaflet" // Import Leaflet library

export class ProductMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId
    this.options = {
      height: "400px",
      defaultZoom: 10,
      useMarkerClustering: false, // Disable clustering for now to avoid dependency issues
      ...options,
    }
    this.map = null
    this.markers = []
    this.markersGroup = null
    this.isInitialized = false
    this.userProvince = null
    this.userCity = null
    this.initialCenter = null
    this.initialZoom = null
    this.isInitializing = false
    this.initializationPromise = null // Track initialization promise
  }

  /**
   * Menunggu elemen kontainer peta tersedia di DOM dan memiliki dimensi.
   */
  async waitForContainer(maxAttempts = 50) {
    let attempts = 0

    while (attempts < maxAttempts) {
      const container = document.getElementById(this.containerId)
      if (container) {
        // Pastikan kontainer terlihat dan memiliki dimensi
        container.style.width = "100%"
        container.style.height = this.options.height
        container.style.display = "block"
        container.style.visibility = "visible"
        container.style.position = "relative"

        // Paksa reflow browser
        const currentWidth = container.offsetWidth
        const currentHeight = container.offsetHeight

        if (currentWidth > 0 && currentHeight > 0) {
          return container
        } else {
          console.log(
            `Container ${this.containerId} found but not yet sized (${currentWidth}x${currentHeight}), retrying...`,
          )
        }
      } else {
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    throw new Error(`Container ${this.containerId} not found or not visible/sized after ${maxAttempts} attempts`)
  }

  /**
   * Menginisialisasi instance peta Leaflet.
   */
  async initializeMap(provinceName = null, cityName = null) {
    // Jika sudah ada promise initialization yang berjalan, tunggu itu selesai
    if (this.initializationPromise) {
      return await this.initializationPromise
    }

    // Jika sudah diinisialisasi, return true
    if (this.isInitialized && this.map) {
      return true
    }

    // Buat promise untuk initialization
    this.initializationPromise = this._performInitialization(provinceName, cityName)

    try {
      const result = await this.initializationPromise
      return result
    } finally {
      this.initializationPromise = null // Reset promise setelah selesai
    }
  }

  async _performInitialization(provinceName = null, cityName = null) {
    if (this.isInitializing) {
      return false
    }

    this.isInitializing = true

    try {
      if (typeof L === "undefined") {
        throw new Error("Leaflet is not loaded. Please include Leaflet CSS and JS files.")
      }

      // Bersihkan peta yang mungkin ada sebelumnya
      await this.destroy()

      // Tunggu kontainer tersedia dan memiliki dimensi yang valid
      const container = await this.waitForContainer()

      // Simpan informasi user untuk pemfilteran nanti
      this.userProvince = provinceName
      this.userCity = cityName

      // Pastikan kontainer benar-benar bersih
      container.innerHTML = ""

      // Hapus referensi Leaflet internal
      if (container._leaflet_id) {
        delete container._leaflet_id
      }
      container._leaflet_id = null

      // Dapatkan koordinat berdasarkan lokasi user
      let center = [-2.5489, 118.0149] // Default Indonesia
      let zoom = 5

      if (provinceName) {
        try {
          const coords = await GeocodingUtils.geocodeLocation(provinceName, cityName)
          if (coords) {
            center = [coords.lat, coords.lng]
            zoom = cityName ? this.options.defaultZoom : 8 // Zoom lebih dekat jika ada kota
          }
        } catch (error) {
          console.error("Error geocoding user location:", error)
          // Gunakan fallback coordinates
          const fallbackCoords = await GeocodingUtils.getUserLocationCoords({
            province_name: provinceName,
            city_name: cityName,
          })
          center = [fallbackCoords.lat, fallbackCoords.lng]
          zoom = cityName ? this.options.defaultZoom : 8
        }
      }

      // Simpan posisi awal
      this.initialCenter = center
      this.initialZoom = zoom

      // Inisialisasi peta dengan kontainer dan opsi yang benar
      this.map = L.map(this.containerId, {
        center: center,
        zoom: zoom,
        attributionControl: true,
        zoomControl: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
        boxZoom: true,
        keyboard: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        preferCanvas: false, // Use SVG for better quality
      })

      // Tambahkan tile OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
        minZoom: 3,
      }).addTo(this.map)

      // Inisialisasi grup marker
      this.markersGroup = L.layerGroup().addTo(this.map)

      // Set flags
      this.isInitialized = true
      this.isInitializing = false

      // Paksa resize setelah inisialisasi
      setTimeout(() => {
        // --- FIXED --- Add a guard to ensure map exists after timeout
        if (this.map) {
          this.map.invalidateSize(true)
        }
      }, 500)

      return true
    } catch (error) {
      console.error("Error initializing ProductMap:", error)
      this.isInitialized = false
      this.isInitializing = false
      this.map = null
      throw error
    }
  }

  /**
   * Menghapus semua marker dari peta.
   */
  clearMarkers() {
    if (this.markersGroup) {
      this.markersGroup.clearLayers()
    }
    this.markers = []
  }

  /**
   * Menambahkan marker item ke peta.
   */
  addItemMarkers(items, focusProvince = null) {
    if (!this.isMapReady()) {
      console.error("Cannot add markers: map is not ready")
      return
    }
    this.clearMarkers()

    const validItems = items.filter(
      (item) =>
        item.latitude &&
        item.longitude &&
        !isNaN(Number.parseFloat(item.latitude)) &&
        !isNaN(Number.parseFloat(item.longitude)),
    )

    if (validItems.length === 0) {
      // Reset ke posisi awal user jika tidak ada marker
      if (this.initialCenter && this.initialZoom) {
        this.map.setView(this.initialCenter, this.initialZoom)
      }
      return
    }

    // Filter item berdasarkan provinsi user jika ditentukan
    let itemsToShow = validItems
    let provinceItemsOnly = []

    if (focusProvince) {
      provinceItemsOnly = validItems.filter(
        (item) => item.province_name && item.province_name.toLowerCase().includes(focusProvince.toLowerCase()),
      )

      if (provinceItemsOnly.length > 0) {
        itemsToShow = provinceItemsOnly
      } else {
      }
    }

    // Buat markers
    const newMarkers = []
    itemsToShow.forEach((item, index) => {
      const lat = Number.parseFloat(item.latitude)
      const lng = Number.parseFloat(item.longitude)

      // Buat ikon kustom berdasarkan ketersediaan item
      let iconColor = "#6b7280" // abu-abu default
      let iconClass = "fa-box"

      if (item.is_available_for_sell && item.is_available_for_rent) {
        iconColor = "#8b5cf6" // ungu untuk keduanya
        iconClass = "fa-tags"
      } else if (item.is_available_for_sell) {
        iconColor = "#10b981" // hijau untuk jual
        iconClass = "fa-tag"
      } else if (item.is_available_for_rent) {
        iconColor = "#3b82f6" // biru untuk sewa
        iconClass = "fa-calendar-days"
      }

      // Tambahkan sedikit offset untuk marker yang terlalu dekat
      let adjustedLat = lat
      let adjustedLng = lng

      const proximityThreshold = 0.001
      const hasCloseMarker = newMarkers.some((m) => {
        const pos = m.getLatLng()
        return Math.abs(pos.lat - lat) < proximityThreshold && Math.abs(pos.lng - lng) < proximityThreshold
      })

      if (hasCloseMarker) {
        const offset = 0.002
        adjustedLat = lat + (Math.random() * offset - offset / 2)
        adjustedLng = lng + (Math.random() * offset - offset / 2)
      }

      // Buat marker kustom
      const customIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${iconColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            <i class="fa-solid ${iconClass}" style="color: white; font-size: 14px;"></i>
          </div>
        `,
        className: "custom-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      // Format harga untuk popup
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

      // Buat konten popup
      const backendBaseUrl = "http://31.97.67.212:5000"
      const popupContent = `
        <div style="min-width: 220px; font-family: 'Poppins', sans-serif;">
          <div style="margin-bottom: 10px;">
            ${
              item.thumbnail
                ? `<img src="${backendBaseUrl}${item.thumbnail}" alt="${item.name}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`
                : `<div style="width: 100%; height: 130px; background: linear-gradient(135deg, #f3f4f6, #e5e7eb); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
                <i class="fa-solid fa-image" style="font-size: 28px;"></i>
              </div>`
            }
          </div>
          <h4 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #1f2937; line-height: 1.4;">${item.name}</h4>
          <div style="margin-bottom: 10px;">
            ${
              item.is_available_for_sell
                ? `<div style="color: #059669; font-size: 13px; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center;">
                <i class="fa-solid fa-tag" style="margin-right: 6px; color: #10b981;"></i>Jual: ${formatRupiah(item.price_sell)}
              </div>`
                : ""
            }
            ${
              item.is_available_for_rent
                ? `<div style="color: #2563eb; font-size: 13px; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center;">
                <i class="fa-solid fa-calendar-days" style="margin-right: 6px; color: #3b82f6;"></i>Sewa: ${formatRupiah(item.price_rent)}/hari
              </div>`
                : ""
            }
          </div>
          <div style="margin-bottom: 12px; font-size: 12px; color: #6b7280; display: flex; align-items: center;">
            <i class="fa-solid fa-location-dot" style="margin-right: 6px; color: #ef4444;"></i>${item.city_name || "Unknown"}, ${item.province_name || "Unknown"}
          </div>
          <a href="/#/items/${item.id}" style="
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
          ">
            <i class="fa-solid fa-eye" style="margin-right: 6px;"></i>Lihat Detail
          </a>
        </div>
      `

      const marker = L.marker([adjustedLat, adjustedLng], { icon: customIcon }).bindPopup(popupContent, {
        maxWidth: 280,
        className: "custom-popup",
        closeButton: true,
        autoClose: false,
        closeOnEscapeKey: true,
      })

      this.markersGroup.addLayer(marker)
      newMarkers.push(marker)
    })

    this.markers = newMarkers

    // Atur tampilan peta berdasarkan marker
    if (this.markers.length > 0) {
      setTimeout(() => {
        // --- FIXED --- Add a guard to ensure the entire block is safe
        if (!this.map) {
          console.warn("Adjusting map bounds skipped because map was destroyed during timeout.")
          return
        }
        try {
          if (focusProvince && provinceItemsOnly.length > 0) {
            // Jika ada filter provinsi dan ada item di provinsi tersebut, fit bounds ke marker provinsi
            const group = new L.featureGroup(this.markers)
            const bounds = group.getBounds()

            if (bounds.isValid()) {
              this.map.fitBounds(bounds.pad(0.1), {
                maxZoom: this.options.defaultZoom,
                animate: true,
                duration: 1,
              })
            }
          } else if (!focusProvince && this.markers.length > 1) {
            // Jika tidak ada filter provinsi dan ada banyak marker, fit bounds ke semua marker
            const group = new L.featureGroup(this.markers)
            const bounds = group.getBounds()

            if (bounds.isValid()) {
              this.map.fitBounds(bounds.pad(0.1), {
                maxZoom: 8,
                animate: true,
                duration: 1,
              })
            }
          } else {
            // Jika hanya satu marker atau ada filter provinsi tapi tidak ada item, kembali ke posisi user
            if (this.initialCenter && this.initialZoom) {
              this.map.setView(this.initialCenter, this.initialZoom, {
                animate: true,
                duration: 1,
              })
            }
          }
        } catch (error) {
          console.error("Error adjusting map bounds:", error)
        }
      }, 500)
    }
  }

  /**
   * Memperbarui lokasi pusat peta berdasarkan user.
   */
  async updateUserLocation(provinceName, cityName) {
    if (!this.isMapReady()) {
      console.error("Cannot update location: map is not ready")
      return
    }

    if (!provinceName) return

    try {
      const coords = await GeocodingUtils.geocodeLocation(provinceName, cityName)
      if (coords) {
        const zoom = cityName ? this.options.defaultZoom : 8
        this.map.setView([coords.lat, coords.lng], zoom, {
          animate: true,
          duration: 1,
        })

        // Update posisi awal
        this.initialCenter = [coords.lat, coords.lng]
        this.initialZoom = zoom
        this.userProvince = provinceName
        this.userCity = cityName
      }
    } catch (error) {
      console.error("Error updating map location:", error)
    }
  }

  /**
   * Menghancurkan instance peta Leaflet dan membersihkan elemen DOM.
   */
  async destroy() {
    if (this.map) {
      try {
        this.clearMarkers()

        if (this.markersGroup) {
          this.map.removeLayer(this.markersGroup)
          this.markersGroup = null
        }

        this.map.remove()
      } catch (error) {
        console.error("Error destroying ProductMap:", error)
      }
    }

    // Bersihkan kontainer
    const container = document.getElementById(this.containerId)
    if (container) {
      container.innerHTML = ""
      if (container._leaflet_id) {
        delete container._leaflet_id
      }
      container._leaflet_id = null
      container.className = container.className.replace(/leaflet-[^\s]*/g, "")
    }

    // Reset semua state
    this.map = null
    this.markers = []
    this.markersGroup = null
    this.isInitialized = false
    this.isInitializing = false
    this.userProvince = null
    this.userCity = null
    this.initialCenter = null
    this.initialZoom = null
    this.initializationPromise = null
  }

  /**
   * Memeriksa apakah peta sudah siap digunakan.
   */
  isMapReady() {
    return this.isInitialized && this.map !== null && !this.isInitializing
  }

  /**
   * Memperbarui marker pada peta.
   */
  refreshMarkers(items, focusProvince = null) {
    if (this.isMapReady()) {
      this.addItemMarkers(items, focusProvince)
    } else {
      console.warn("Map not ready to refresh markers. Please ensure map is initialized.")
    }
  }

  /**
   * Memaksa peta untuk menyesuaikan ukurannya.
   */
  resizeMap() {
    if (this.isMapReady()) {
      setTimeout(() => {
        // --- FIXED --- Add a guard to ensure map exists after timeout
        if (this.map) {
          this.map.invalidateSize(true)
        } else {
          console.warn("resizeMap was skipped because the map was destroyed during the timeout.")
        }
      }, 500)
    }
  }

  /**
   * Mengatur ulang tampilan peta ke posisi awal user.
   */
  resetToUserPosition() {
    if (this.isMapReady() && this.initialCenter && this.initialZoom) {
      this.map.setView(this.initialCenter, this.initialZoom, {
        animate: true,
        duration: 1,
      })
    }
  }

  /**
   * Mendapatkan informasi lokasi user yang tersimpan.
   */
  getUserLocation() {
    return {
      province: this.userProvince,
      city: this.userCity,
      center: this.initialCenter,
      zoom: this.initialZoom,
    }
  }
}