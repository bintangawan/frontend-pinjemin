// Define your backend base URL
const BASE_URL = 'http://31.97.67.212:5000/api'; // <-- Pastikan URL ini benar

// Function to get the JWT token from localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

/**
 * Menghapus data autentikasi dari localStorage dan melakukan redirect ke halaman login.
 */
const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Dispatch event untuk memberi tahu komponen lain (misalnya navbar) bahwa pengguna telah logout
    const logoutEvent = new CustomEvent('userLoggedOut');
    window.dispatchEvent(logoutEvent);
    // Redirect ke halaman login
    window.location.hash = '#/login';
    alert('Sesi Anda telah berakhir. Silakan login kembali.'); // Beri tahu pengguna
};

const setAuthData = (token, user) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
  
    // Dispatch login event
    console.log("Dispatching userLoggedIn event...")
    window.dispatchEvent(new CustomEvent("userLoggedIn"))
  }

/**
 * Melakukan permintaan terautentikasi ke API backend (dengan JSON body).
 * @param {string} endpoint - Endpoint API (misal '/auth/me').
 * @param {string} method - Metode HTTP (misal 'GET', 'POST', 'PATCH', 'DELETE').
 * @param {Object} [body=null] - Body permintaan dalam format JSON (untuk metode selain GET).
 * @returns {Promise<Object>} Respons dari API.
 */
const authenticatedRequest = async (endpoint, method, body = null) => {
    const url = `${BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);

        // Tangani response error HTTP (di luar 2xx)
        if (!response.ok) {
            // Jika status 401 atau 403, arahkan ke halaman login
            if (response.status === 401 || response.status === 403) {
                // Clear data autentikasi lama
                clearAuthData();
                // Redirect ke halaman login
                // window.location.hash = '#/login'; // Sudah di dalam clearAuthData
                // Lempar error atau return indikator agar pemanggil tahu request gagal
                throw new Error('Authentication failed or expired.'); // Melempar error akan menghentikan eksekusi lebih lanjut
            }
            // Untuk error HTTP lainnya, coba baca response body untuk detail error dari API
            const errorBody = await response.json(); // Coba parse JSON error body
            console.error(`HTTP error! Status: ${response.status}`, errorBody);
            // Lempar error dengan informasi yang lebih detail jika tersedia
            throw new Error(`HTTP error! Status: ${response.status}: ${errorBody.message || 'Unknown error'}`);

        }

        // Response sukses (status 2xx), parse JSON
        const result = await response.json();
        return result;

    } catch (error) {
        console.error('Error during API request:', error);
        // Jika error bukan dari response.ok (misal network error, type error, etc.)
        // dan belum ditangani redirect 401/403, re-throw error
        throw error;
    }
};

/**
 * Wrapper untuk permintaan GET terautentikasi (juga bisa digunakan untuk endpoint tanpa auth).
 * @param {string} endpoint - Endpoint API.
 * @returns {Promise<Object>} Respons dari API.
 */
const apiGet = (endpoint) => authenticatedRequest(endpoint, 'GET');


/**
 * Wrapper untuk permintaan POST terautentikasi (JSON body).
 * @param {string} endpoint - Endpoint API.
 * @param {Object} body - Body permintaan.
 * @returns {Promise<Object>} Respons dari API.
 */
const apiPost = (endpoint, body) => authenticatedRequest(endpoint, 'POST', body);

/**
 * Wrapper untuk permintaan PATCH terautentikasi (JSON body).
 * Saat ini endpoint PATCH item butuh FormData, jadi wrapper ini mungkin hanya untuk endpoint PATCH lain.
 * Jika backend memungkinkan PATCH item dengan JSON tanpa file, ini bisa digunakan.
 * @param {string} endpoint - Endpoint API.
 * @param {Object} body - Body permintaan.
 * @returns {Promise<Object>} Respons dari API.
 */
const apiPatch = (endpoint, body) => authenticatedRequest(endpoint, 'PATCH', body);

/**
 * Wrapper untuk permintaan DELETE terautentikasi.
 * @param {string} endpoint - Endpoint API.
 * @returns {Promise<Object>} Respons dari API.
 */
const apiDelete = (endpoint) => authenticatedRequest(endpoint, 'DELETE');


/**
 * Melakukan permintaan POST atau PATCH yang memerlukan autentikasi dengan Content-Type multipart/form-data (untuk file upload).
 * @param {string} method - Metode HTTP ('POST' atau 'PATCH').
 * @param {string} endpoint - Endpoint API (misal '/items' atau '/items/:id').
 * @param {FormData} formData - Objek FormData yang berisi data form dan file.
 * @returns {Promise<Object>} Respons dari API.
 */
const apiFormDataRequest = async (method, endpoint, formData) => {
    const url = `${BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');

    const options = {
        method, // Menggunakan parameter method
        body: formData, // Gunakan objek FormData sebagai body
        headers: {
            // JANGAN set 'Content-Type': 'multipart/form-data' di sini.
            // Browser akan menanganinya secara otomatis saat menggunakan FormData,
            // termasuk boundary yang benar.
        },
    };

    // Tambahkan header Authorization jika token ada
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, options);

        // Tangani response error HTTP (di luar 2xx)
        if (!response.ok) {
            // Jika status 401 atau 403, arahkan ke halaman login
            if (response.status === 401 || response.status === 403) {
                // Clear data autentikasi lama
                clearAuthData();
                // Redirect ke halaman login
                // window.location.hash = '#/login'; // Sudah di dalam clearAuthData
                // Lempar error atau return indikator agar pemanggil tahu request gagal
                throw new Error('Authentication failed or expired.'); // Melempar error akan menghentikan eksekusi lebih lanjut
            }
            // Untuk error HTTP lainnya, coba baca response body untuk detail error dari API
            const errorBody = await response.json(); // Coba parse JSON error body
            console.error(`HTTP error! Status: ${response.status}`, errorBody);
            // Lempar error dengan informasi yang lebih detail jika tersedia
            throw new Error(`HTTP error! Status: ${response.status}: ${errorBody.message || 'Unknown error'}`);

        }

        // Response sukses (status 2xx), parse JSON
        const result = await response.json();
        return result;

    } catch (error) {
        console.error('Error during API request:', error);
        // Jika error bukan dari response.ok (misal network error, type error, etc.)
        // dan belum ditangani redirect 401/403, re-throw error
        throw error;
    }
};

/**
 * Subscribe to push notifications
 * @param {Object} subscription - Push subscription object
 * @returns {Promise<Object>} - Response from API
 */
export const subscribeNotification = (subscription) => {
    return apiPost('/notifications/subscribe', subscription);
  };
  
  /**
   * Unsubscribe from push notifications
   * @param {string} endpoint - Subscription endpoint
   * @returns {Promise<Object>} - Response from API
   */
  export const unsubscribeNotification = (endpoint) => {
    return apiPost('/notifications/unsubscribe', { endpoint });
  };
  
  /**
   * Get unread notification count
   * @returns {Promise<Object>} - Response from API with unread count
   */
  export const getUnreadNotificationCount = () => {
    return apiGet('/notifications/unread-count');
  };
  
  /**
   * Get user notifications
   * @param {number} page - Page number
   * @param {number} limit - Number of notifications per page
   * @returns {Promise<Object>} - Response from API with notifications
   */
  export const getNotifications = (page = 1, limit = 10) => {
    return apiGet(`/notifications?page=${page}&limit=${limit}`);
  };
  
  /**
   * Mark notification as read
   * @param {number} id - Notification ID
   * @returns {Promise<Object>} - Response from API
   */
  export const markNotificationAsRead = (id) => {
    return apiPatch(`/notifications/${id}/read`);
  };
  
  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} - Response from API
   */
  export const markAllNotificationsAsRead = () => {
    return apiPatch('/notifications/read-all');
  };

// Export semua fungsi yang tersedia dalam satu statement kolektif di akhir file
export { apiGet, apiPost, apiPatch, apiDelete, clearAuthData, apiFormDataRequest, setAuthData, authenticatedRequest };
