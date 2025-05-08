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
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    static login() {
        localStorage.setItem('isLoggedIn', 'true');
    }

    static logout() {
        localStorage.removeItem('isLoggedIn');
    }
}

export default Utils;
