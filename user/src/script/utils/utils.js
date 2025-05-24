class Utils {
    static emptyElement(element) {
        element.innerHTML = '';
    }

    static showElement(element) {
        element.style.display = 'block';
        element.hidden = false;
    }

    static hideElement(element) {
        element.style.display = 'none';
        element.hidden = true;
    }

    static isValidInteger(newValue) {
        return Number.isNaN(newValue) || Number.isFinite(newValue);
    }

    // Fungsi autentikasi
    static isAuthenticated() {
        // Cek apakah token ada di localStorage
        const token = localStorage.getItem('token');
        return token !== null && token !== undefined; // Kembalikan true jika token ada
    }

    // Metode untuk mengalihkan ke halaman login
    static redirectToLogin() {
        window.location.hash = '#/login';
    }

    // static login() { // Metode ini tidak lagi diperlukan jika status login ditentukan oleh token
    //     localStorage.setItem('isLoggedIn', 'true');
    // }

    // static logout() { // Metode ini tidak lagi diperlukan jika status login ditentukan oleh token
    //     localStorage.removeItem('isLoggedIn');
    // }

    static getUserInfo() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}

export default Utils;
