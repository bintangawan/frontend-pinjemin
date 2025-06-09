// Define the base URL for your ML/Recommendation APIs
const ML_BASE_URL = "https://exml.pinjemin.site/api" // <-- Base URL for ML services

// Function to get the JWT token from localStorage (needed for user-based recs)
const getToken = () => {
  return localStorage.getItem("token")
}

// Function to get user ID from token or localStorage
const getUserId = () => {
  const token = getToken()
  if (token) {
    try {
      // Decode JWT token to get user_id
      const payload = JSON.parse(atob(token.split(".")[1]))
      return payload.user_id || payload.id || payload.userId
    } catch (error) {
      console.warn("Failed to decode token for user_id:", error)
    }
  }

  // Fallback: check if user_id is stored separately in localStorage
  const storedUserId = localStorage.getItem("user_id")
  if (storedUserId) {
    return Number.parseInt(storedUserId)
  }

  // If no user_id found, return null
  console.warn("No user_id found in token or localStorage")
  return null
}

/**
 * Melakukan permintaan terautentikasi (jika token ada) atau tidak terautentikasi
 * ke API ML/Rekomendasi dengan body JSON.
 * Ini mirip dengan authenticatedRequest tapi dengan base URL yang berbeda.
 * @param {string} endpoint - Endpoint API ML (misal '/recommend/user').
 * @param {string} method - Metode HTTP (misal 'POST').
 * @param {Object} [body=null] - Body permintaan dalam format JSON.
 * @returns {Promise<Object>} Respons dari API ML.
 */
const mlRequest = async (endpoint, method, body = null) => {
  const url = `${ML_BASE_URL}${endpoint}`
  const token = getToken() // Ambil token

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  }

  // Tambahkan header Authorization HANYA jika token ada
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`
  }

  if (body && method !== "GET") {
    // Rekomendasi API menggunakan POST dengan body
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)

    // Tangani response error HTTP (di luar 2xx)
    if (!response.ok) {
      // Untuk API ML, mungkin tidak perlu redirect login untuk 401/403
      // kecuali API /recommend/user secara ketat memerlukannya dan merespons 401/403.
      // Untuk saat ini, kita log error saja.
      const errorBody = await response.json().catch(() => null)
      console.error(`ML API HTTP error! Status: ${response.status}`, errorBody)
      const errorMessage = errorBody && errorBody.message ? errorBody.message : "Unknown ML API error"
      // Lempar error dengan informasi status dan pesan
      const error = new Error(`ML API Error: HTTP status ${response.status}: ${errorMessage}`)
      error.status = response.status
      error.body = errorBody
      throw error
    }

    // Response sukses (status 2xx), parse JSON
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error during ML API request:", error)
    // Re-throw error untuk ditangani pemanggil
    throw error
  }
}

/**
 * Mengambil rekomendasi berdasarkan pengguna.
 * @param {number} userId - ID pengguna.
 * @param {number} topN - Jumlah rekomendasi yang diinginkan.
 * @returns {Promise<Object>} Daftar rekomendasi.
 */
const fetchUserRecommendations = (userId, topN = 10) => {
  if (!userId) {
    throw new Error("User ID is required for user recommendations")
  }
  return mlRequest("/recommend/user", "POST", { user_id: userId, top_n: topN })
}

/**
 * Mengambil rekomendasi berdasarkan item.
 * @param {number} productId - ID item.
 * @param {number} topN - Jumlah rekomendasi yang diinginkan.
 * @param {number} [userId] - ID pengguna (optional, akan diambil otomatis jika tidak disediakan).
 * @returns {Promise<Object>} Daftar rekomendasi.
 */
const fetchItemRecommendations = (productId, topN = 10, userId = null) => {
  if (!productId) {
    throw new Error("Product ID is required for item recommendations")
  }

  // ✅ Ambil user_id otomatis jika tidak disediakan
  const finalUserId = userId || getUserId()

  if (!finalUserId) {
    throw new Error("User ID is required for item recommendations. Please login first.")
  }

  return mlRequest("/recommend/item", "POST", {
    product_id: productId,
    user_id: finalUserId,
    top_n: topN,
  })
}

/**
 * Mengambil rekomendasi berdasarkan kata kunci pencarian.
 * @param {string} keyword - Kata kunci pencarian.
 * @param {number} topN - Jumlah rekomendasi yang diinginkan.
 * @param {number} [userId] - ID pengguna (optional, akan diambil otomatis jika tidak disediakan).
 * @returns {Promise<Object>} Daftar rekomendasi.
 */
const fetchSearchRecommendations = (keyword, topN = 10, userId = null) => {
  if (!keyword || keyword.trim() === "") {
    throw new Error("Keyword is required for search recommendations")
  }

  // ✅ Ambil user_id otomatis jika tidak disediakan
  const finalUserId = userId || getUserId()

  if (!finalUserId) {
    throw new Error("User ID is required for search recommendations. Please login first.")
  }

  return mlRequest("/recommend/search", "POST", {
    keyword: keyword.trim(),
    user_id: finalUserId,
    top_n: topN,
  })
}

/**
 * Refresh data ML (untuk admin atau maintenance)
 * @returns {Promise<Object>} Status refresh.
 */
const refreshMLData = () => {
  return mlRequest("/refresh_data", "POST", {})
}

// Export semua fungsi yang tersedia
export {
  fetchUserRecommendations,
  fetchItemRecommendations,
  fetchSearchRecommendations,
  refreshMLData,
  getUserId, // Export getUserId untuk debugging
}
