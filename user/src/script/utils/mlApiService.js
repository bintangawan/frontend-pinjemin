// Define the base URL for your ML/Recommendation APIs
const ML_BASE_URL = 'http://localhost:5001/api'; // <-- Base URL for ML services

// Function to get the JWT token from localStorage (needed for user-based recs)
const getToken = () => {
    return localStorage.getItem('token');
};

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
    const url = `${ML_BASE_URL}${endpoint}`;
    const token = getToken(); // Ambil token

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Tambahkan header Authorization HANYA jika token ada
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body && method !== 'GET') { // Rekomendasi API menggunakan POST dengan body
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);

        // Tangani response error HTTP (di luar 2xx)
        if (!response.ok) {
            // Untuk API ML, mungkin tidak perlu redirect login untuk 401/403
            // kecuali API /recommend/user secara ketat memerlukannya dan merespons 401/403.
            // Untuk saat ini, kita log error saja.
            const errorBody = await response.json().catch(() => null);
            console.error(`ML API HTTP error! Status: ${response.status}`, errorBody);
            const errorMessage = errorBody && errorBody.message ? errorBody.message : 'Unknown ML API error';
            // Lempar error dengan informasi status dan pesan
            const error = new Error(`ML API Error: HTTP status ${response.status}: ${errorMessage}`);
            error.status = response.status;
            error.body = errorBody;
            throw error;
        }

        // Response sukses (status 2xx), parse JSON
        const result = await response.json();
        return result;

    } catch (error) {
        console.error('Error during ML API request:', error);
        // Re-throw error untuk ditangani pemanggil
        throw error;
    }
};

/**
 * Mengambil rekomendasi berdasarkan pengguna.
 * @param {number} userId - ID pengguna.
 * @param {number} topN - Jumlah rekomendasi yang diinginkan.
 * @returns {Promise<Object>} Daftar rekomendasi.
 */
const fetchUserRecommendations = (userId, topN) => {
    return mlRequest('/recommend/user', 'POST', { user_id: userId, top_n: topN });
};

/**
 * Mengambil rekomendasi berdasarkan item.
 * @param {number} productId - ID item.
 * @param {number} topN - Jumlah rekomendasi yang diinginkan.
 * @returns {Promise<Object>} Daftar rekomendasi.
 */
const fetchItemRecommendations = (productId, topN) => {
    return mlRequest('/recommend/item', 'POST', { product_id: productId, top_n: topN });
};

/**
 * Mengambil rekomendasi berdasarkan kata kunci pencarian.
 * @param {string} keyword - Kata kunci pencarian.
 * @param {number} topN - Jumlah rekomendasi yang diinginkan.
 * @returns {Promise<Object>} Daftar rekomendasi.
 */
const fetchSearchRecommendations = (keyword, topN) => {
    return mlRequest('/recommend/search', 'POST', { keyword: keyword, top_n: topN });
};


// Export semua fungsi yang tersedia
export { fetchUserRecommendations, fetchItemRecommendations, fetchSearchRecommendations };
