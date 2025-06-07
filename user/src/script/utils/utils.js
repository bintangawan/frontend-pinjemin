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
    // --- Fungsi slugify BARU ---
  static slugify(text) {
    if (!text) return "";
    return text
      .toString()
      .normalize("NFD") // Pisahkan diakritik dari huruf
      .replace(/[\u0300-\u036f]/g, "") // Hapus diakritik
      .toLowerCase() // Ubah ke huruf kecil
      .trim() // Hapus spasi di awal/akhir
      .replace(/\s+/g, "-") // Ganti spasi dengan tanda hubung
      .replace(/[^\w-]+/g, "") // Hapus semua karakter non-kata (kecuali tanda hubung)
      .replace(/--+/g, "-"); // Ganti tanda hubung ganda dengan satu tanda hubung
  }
}

export default Utils;
