// Utility functions for geocoding and map operations
import L from "leaflet"

export class GeocodingUtils {
  // Static cache untuk menyimpan hasil geocoding
  static geocodeCache = {}

  // Fallback coordinates untuk provinsi-provinsi di Indonesia
  static fallbackCoords = {
    // Sumatera
    ACEH: { lat: 4.695135, lng: 96.749397, display_name: "Aceh, Indonesia" },
    "SUMATERA UTARA": { lat: 3.597031, lng: 98.678513, display_name: "North Sumatra, Indonesia" },
    "SUMATERA BARAT": { lat: -0.789275, lng: 100.650863, display_name: "West Sumatra, Indonesia" },
    RIAU: { lat: 0.533333, lng: 101.447777, display_name: "Riau, Indonesia" },
    "KEPULAUAN RIAU": { lat: 0.916667, lng: 104.45, display_name: "Riau Islands, Indonesia" },
    JAMBI: { lat: -1.4851, lng: 102.4381, display_name: "Jambi, Indonesia" },
    "SUMATERA SELATAN": { lat: -3.3194, lng: 103.9144, display_name: "South Sumatra, Indonesia" },
    "BANGKA BELITUNG": { lat: -2.741, lng: 106.4405, display_name: "Bangka Belitung, Indonesia" },
    BENGKULU: { lat: -3.8004, lng: 102.2655, display_name: "Bengkulu, Indonesia" },
    LAMPUNG: { lat: -4.5585, lng: 105.4068, display_name: "Lampung, Indonesia" },

    // Jawa
    "DKI JAKARTA": { lat: -6.208763, lng: 106.845599, display_name: "Jakarta, Indonesia" },
    "JAWA BARAT": { lat: -6.914744, lng: 107.60981, display_name: "West Java, Indonesia" },
    "JAWA TENGAH": { lat: -7.150975, lng: 110.140259, display_name: "Central Java, Indonesia" },
    "DI YOGYAKARTA": { lat: -7.797068, lng: 110.370529, display_name: "Yogyakarta, Indonesia" },
    "JAWA TIMUR": { lat: -7.250445, lng: 112.768845, display_name: "East Java, Indonesia" },
    BANTEN: { lat: -6.4058, lng: 106.064, display_name: "Banten, Indonesia" },

    // Kalimantan
    "KALIMANTAN BARAT": { lat: -0.2787, lng: 111.4752, display_name: "West Kalimantan, Indonesia" },
    "KALIMANTAN TENGAH": { lat: -1.6814, lng: 113.3823, display_name: "Central Kalimantan, Indonesia" },
    "KALIMANTAN SELATAN": { lat: -3.0926, lng: 115.2838, display_name: "South Kalimantan, Indonesia" },
    "KALIMANTAN TIMUR": { lat: 1.5709, lng: 116.0187, display_name: "East Kalimantan, Indonesia" },
    "KALIMANTAN UTARA": { lat: 3.073, lng: 116.0413, display_name: "North Kalimantan, Indonesia" },

    // Sulawesi
    "SULAWESI UTARA": { lat: 0.6246, lng: 123.975, display_name: "North Sulawesi, Indonesia" },
    "SULAWESI TENGAH": { lat: -1.43, lng: 121.4456, display_name: "Central Sulawesi, Indonesia" },
    "SULAWESI SELATAN": { lat: -3.6687, lng: 119.974, display_name: "South Sulawesi, Indonesia" },
    "SULAWESI TENGGARA": { lat: -4.14491, lng: 122.174605, display_name: "Southeast Sulawesi, Indonesia" },
    GORONTALO: { lat: 0.6999, lng: 122.4467, display_name: "Gorontalo, Indonesia" },
    "SULAWESI BARAT": { lat: -2.8441, lng: 119.232, display_name: "West Sulawesi, Indonesia" },

    // Bali & Nusa Tenggara
    BALI: { lat: -8.4095, lng: 115.1889, display_name: "Bali, Indonesia" },
    "NUSA TENGGARA BARAT": { lat: -8.6529, lng: 117.3616, display_name: "West Nusa Tenggara, Indonesia" },
    "NUSA TENGGARA TIMUR": { lat: -8.6574, lng: 121.0794, display_name: "East Nusa Tenggara, Indonesia" },

    // Maluku & Papua
    MALUKU: { lat: -3.2385, lng: 130.1453, display_name: "Maluku, Indonesia" },
    "MALUKU UTARA": { lat: 1.5709, lng: 127.8089, display_name: "North Maluku, Indonesia" },
    "PAPUA BARAT": { lat: -1.3361, lng: 133.1747, display_name: "West Papua, Indonesia" },
    PAPUA: { lat: -4.269928, lng: 138.080353, display_name: "Papua, Indonesia" },

    // Kota-kota besar
    MEDAN: { lat: 3.5952, lng: 98.6722, display_name: "Medan, North Sumatra, Indonesia" },
    "KOTA MEDAN": { lat: 3.5952, lng: 98.6722, display_name: "Medan, North Sumatra, Indonesia" },
    JAKARTA: { lat: -6.208763, lng: 106.845599, display_name: "Jakarta, Indonesia" },
    BANDUNG: { lat: -6.917464, lng: 107.619123, display_name: "Bandung, West Java, Indonesia" },
    SURABAYA: { lat: -7.257472, lng: 112.752088, display_name: "Surabaya, East Java, Indonesia" },
    YOGYAKARTA: { lat: -7.797068, lng: 110.370529, display_name: "Yogyakarta, Indonesia" },
    SEMARANG: { lat: -6.966667, lng: 110.416664, display_name: "Semarang, Central Java, Indonesia" },
    MAKASSAR: { lat: -5.147665, lng: 119.432732, display_name: "Makassar, South Sulawesi, Indonesia" },
    PALEMBANG: { lat: -2.998169, lng: 104.756554, display_name: "Palembang, South Sumatra, Indonesia" },
    DENPASAR: { lat: -8.670458, lng: 115.212629, display_name: "Denpasar, Bali, Indonesia" },
  }

  static async geocodeLocation(provinceName, cityName = null) {
    if (!provinceName) {
      console.warn("No province name provided for geocoding")
      return { lat: -2.5489, lng: 118.0149, display_name: "Indonesia" } // Default Indonesia center
    }

    // Buat cache key berdasarkan provinsi dan kota
    const cacheKey = cityName ? `${provinceName.toUpperCase()}:${cityName.toUpperCase()}` : provinceName.toUpperCase()

    // Cek cache terlebih dahulu
    if (this.geocodeCache[cacheKey]) {
      console.log(`Using cached geocode for ${cacheKey}`)
      return this.geocodeCache[cacheKey]
    }

    // Cek fallback coordinates terlebih dahulu sebelum API call
    const normalizedProvince = provinceName.toUpperCase()
    const normalizedCity = cityName ? cityName.toUpperCase() : null

    // Prioritas: Kota dulu, baru provinsi
    if (normalizedCity && this.fallbackCoords[normalizedCity]) {
      console.log(`Using fallback coordinates for city: ${normalizedCity}`)
      const result = this.fallbackCoords[normalizedCity]
      this.geocodeCache[cacheKey] = result
      return result
    }

    if (this.fallbackCoords[normalizedProvince]) {
      console.log(`Using fallback coordinates for province: ${normalizedProvince}`)
      const result = this.fallbackCoords[normalizedProvince]
      this.geocodeCache[cacheKey] = result
      return result
    }

    // Jika tidak ada di fallback, coba API Nominatim
    try {
      const query = cityName ? `${cityName}, ${provinceName}, Indonesia` : `${provinceName}, Indonesia`

      console.log(`Geocoding: ${query}`)

      // Tambahkan timeout untuk fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn(`Geocoding timeout for: ${query}`)
        controller.abort()
      }, 8000) // 8 detik timeout

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=id`,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "ProductMapApp/1.0",
          },
        },
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.length > 0) {
        const result = {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
          display_name: data[0].display_name,
        }

        // Cache hasil yang berhasil
        this.geocodeCache[cacheKey] = result
        console.log(`Successfully geocoded: ${query}`)
        return result
      } else {
        console.warn(`No geocoding results for: ${query}`)
      }
    } catch (error) {
      console.error("Geocoding API error:", error.message)

      // Jika API gagal, gunakan fallback lagi sebagai last resort
      if (normalizedCity && this.fallbackCoords[normalizedCity]) {
        console.log(`Using fallback after API error for city: ${normalizedCity}`)
        const result = this.fallbackCoords[normalizedCity]
        this.geocodeCache[cacheKey] = result
        return result
      }

      if (this.fallbackCoords[normalizedProvince]) {
        console.log(`Using fallback after API error for province: ${normalizedProvince}`)
        const result = this.fallbackCoords[normalizedProvince]
        this.geocodeCache[cacheKey] = result
        return result
      }
    }

    // Jika semua gagal, return koordinat default Indonesia
    console.warn(`Fallback to Indonesia center for: ${provinceName}, ${cityName || "no city"}`)
    const defaultResult = { lat: -2.5489, lng: 118.0149, display_name: "Indonesia" }
    this.geocodeCache[cacheKey] = defaultResult
    return defaultResult
  }

  static async reverseGeocode(lat, lng) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "ProductMapApp/1.0",
          },
        },
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.address) {
        return {
          province: data.address.state || data.address.province,
          city: data.address.city || data.address.town || data.address.village,
          display_name: data.display_name,
        }
      }
      return null
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      return null
    }
  }

  static getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000,
        },
      )
    })
  }

  static createMapIcon(isAvailable = true) {
    // Check if L is available
    if (typeof L === "undefined") {
      console.error("Leaflet is not loaded")
      return null
    }

    const color = isAvailable ? "#10b981" : "#ef4444"
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
      className: "custom-marker",
    })
  }

  // Method untuk clear cache jika diperlukan
  static clearCache() {
    this.geocodeCache = {}
    console.log("Geocoding cache cleared")
  }

  // Method untuk mendapatkan koordinat berdasarkan user location
  static async getUserLocationCoords(user) {
    if (!user) {
      return { lat: -2.5489, lng: 118.0149, display_name: "Indonesia" }
    }

    const provinceName = user.province_name
    const cityName = user.city_name

    if (provinceName) {
      return await this.geocodeLocation(provinceName, cityName)
    }

    return { lat: -2.5489, lng: 118.0149, display_name: "Indonesia" }
  }
}
