import Products from '../../data/local/product';
import { clearAuthData } from '../../utils/apiService.js';

class AppBar extends HTMLElement {
    constructor() {
        super();
        // Remove the explicit .bind(this) calls for methods defined as arrow functions using class field syntax
        // this.handleLoginStatusChange = this.handleLoginStatusChange.bind(this); // Removed
        // this.handleLogout = this.handleLogout.bind(this); // Removed
        // this.toggleProfileDropdown = this.toggleProfileDropdown.bind(this); // Removed
        // this.hideProfileDropdown = this.hideProfileDropdown.bind(this); // Removed
        // this.handleLogoutClickDelegate = this.handleLogoutClickDelegate.bind(this); // Removed - This was the problematic one at line 13

        // Methods defined with arrow functions (using class field syntax) are automatically bound.
        // No need to bind them again in the constructor.

        // State internal jika diperlukan (opsional)
        // this.user = null; // Bisa disimpan di sini atau selalu ambil dari localStorage
    }

    _emptyContent() {
        this.innerHTML = "";
    }

    connectedCallback() {
        this.render();
        this._setupCategoryDropdownToggle(); // Corrected method name for clarity
        this.setupProfileDropdownToggle(); // Setup profile dropdown
        this.setupLogoutListener(); // Setup logout listener using delegation

        // Tambahkan event listener untuk login dan logout
        window.addEventListener('userLoggedIn', this.handleLoginStatusChange);
        window.addEventListener('userLoggedOut', this.handleLoginStatusChange); // Listen for logout event too
        // Periksa status login saat komponen pertama kali dimuat (INI PENTING AGAR TAMPILAN BENAR SAAT HALAMAN PERTAMA KALI DIBUKA SETELAH LOGIN)
        this.updateNavbarBasedOnLoginStatus();
    }

    disconnectedCallback() {
        // Hapus event listener saat komponen dihapus dari DOM
        window.removeEventListener('userLoggedIn', this.handleLoginStatusChange);
        window.removeEventListener('userLoggedOut', this.handleLoginStatusChange);

        // Hapus event listeners untuk profile dropdown
        const profileArea = this.querySelector('.profile-area');
        if (profileArea) {
            // Need to store reference to the bound function if not using arrow function directly in listener
            // If toggleProfileDropdown and hideProfileDropdown are arrow functions, no need to store reference.
            profileArea.removeEventListener('click', this.toggleProfileDropdown);
        }
        document.removeEventListener('click', this.hideProfileDropdown);

        // Hapus event listener delegasi logout
        const profileDropdownMenu = this.querySelector('#profileDropdownMenu');
        if (profileDropdownMenu && this.handleLogoutClickDelegate) {
            profileDropdownMenu.removeEventListener('click', this.handleLogoutClickDelegate);
        }

        // Optional: cleanup for category dropdown event listeners if not using arrow functions directly
        const categoryButton = this.querySelector('#categoryDropdownButton');
        const categoryMenu = this.querySelector('#categoryDropdownMenu');
        if (categoryButton && categoryMenu) {
            // Need to store references to the bound functions used in _setupCategoryDropdownToggle
            // For now, leaving as is, but ideally should clean up.
        }
    }


    render() {
        this._emptyContent();

        // Note: Using Products.getAll() here might be problematic if categories should come from backend API
        // For now, keeping it as is, but consider fetching categories from backend if API exists.
        const categories = typeof Products !== 'undefined' && Products.getAll ? [...new Set(Products.getAll().map(product => product.category))] : [];

        // Kita bisa coba menata string HTML agar lebih terbaca dengan indentasi
        this.innerHTML += `
            <div class="bg-white shadow-sm py-4">
                <div class="container mx-auto px-4 flex justify-between items-center">

                    <!-- Left: Logo -->
                    <div class="text-xl font-bold text-gray-800">
                        <img src="./logo.png" class=" mr-1 h-10 inline-block">Pinjemin
                    </div>

                    <!-- Center: Navigation Links -->
                    <nav class="hidden md:flex space-x-6">
                        <a href="/#/home" class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                            Home
                        </a>
                        <a href="/#/community" class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                            Komunitas
                        </a>
                        <a href="/#/my-rentals" class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 user-authenticated-nav-link hidden">
                            Pinjaman Saya
                        </a>
                    </nav>

                     <!-- Right section: Cart, Auth Links / User Info / Profile Dropdown -->
                    <div class="flex items-center space-x-4">
                         <!-- Authentication Links (Show when NOT logged in) -->
                         <div class="auth-links">
                         <a href="/#/login" class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                            Sign In
                        </a>
                             <a href="/#/register" class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                Register
                            </a>
                         </div>

                         <div class="user-info-area hidden relative">

                             <div class="profile-area flex items-center space-x-2 cursor-pointer text-gray-700 hover:text-gray-900">

                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 0 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                                <span class="font-medium" id="navbar-user-name"></span>
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                             </div>

                             <div id="profileDropdownMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 hidden z-10">
                                 <a href="/#/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                     Profil Saya
                                 </a>
                                 <a href="/#/my-items" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                     Item Saya (Toko Saya)
                                 </a>
                                  <a href="/#/my-transactions" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                     Transaksi Pembelian Saya
                                 </a>
                                  <a href="/#/my-sales" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                     Transaksi Item Saya (Penjual)
                                 </a>
                                 <hr class="my-1">
                                 <button id="logout-button" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                     Logout
                                 </button>
                             </div>


                         </div>

                    </div>

                     <!-- Hamburger menu placeholder untuk layar kecil -->
                    <div class="md:hidden">
                        <button class="text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                    </div>

                </div>
            </div>
        `;

        // setupProfileDropdownToggle and setupLogoutListener are now called in connectedCallback after render
    }

    // Setup event listener for the profile dropdown toggle
    setupProfileDropdownToggle() {
        const profileArea = this.querySelector('.profile-area');
        const profileDropdownMenu = this.querySelector('#profileDropdownMenu');

        if (profileArea && profileDropdownMenu) {
            // Use arrow functions directly or bind them if not using class field syntax
            profileArea.addEventListener('click', this.toggleProfileDropdown);

            // Close dropdown when clicking outside
            document.addEventListener('click', this.hideProfileDropdown);

            // Optional: Close dropdown on scroll if needed
            // window.addEventListener('scroll', this.hideProfileDropdown); // Might be aggressive
        } else {
            // Log if elements are not found (helpful for debugging render issues)
            console.error("Profile area or dropdown menu not found after render.");
        }
    }

    // Toggle profile dropdown visibility
    toggleProfileDropdown = (event) => { // Defined as arrow function - 'this' is bound
        event.stopPropagation(); // Prevent this click from immediately closing the dropdown via document listener
        const profileDropdownMenu = this.querySelector('#profileDropdownMenu');
        if (profileDropdownMenu) {
            profileDropdownMenu.classList.toggle('hidden');
        }
    }

    // Hide profile dropdown when clicking outside
    hideProfileDropdown = (event) => { // Defined as arrow function - 'this' is bound
        const profileArea = this.querySelector('.profile-area');
        const profileDropdownMenu = this.querySelector('#profileDropdownMenu');

        // Check if the click is outside the profile area AND outside the dropdown menu
        if (profileArea && profileDropdownMenu && event.target && !profileArea.contains(event.target) && !profileDropdownMenu.contains(event.target)) {
            profileDropdownMenu.classList.add('hidden');
        }
        // Also hide if clicking inside the dropdown menu but not on a link/button (e.g., padding area)
        // or if clicking on a link/button inside the dropdown (navigation will handle page change)
    }


    // Use event delegation for the logout button listener
    setupLogoutListener() {
        const profileDropdownMenu = this.querySelector('#profileDropdownMenu');
        if (profileDropdownMenu) {
            // Remove previous listener if it exists to avoid duplicates
            if (this.handleLogoutClickDelegate) {
                profileDropdownMenu.removeEventListener('click', this.handleLogoutClickDelegate);
            }

            // Define the delegated handler as an arrow function here
            this.handleLogoutClickDelegate = (event) => {
                // Check if the clicked element is the logout button by its ID
                if (event.target && event.target.id === 'logout-button') {
                    // Prevent default button behavior if it were a submit button etc.
                    event.preventDefault();
                    this.handleLogout(); // Call the logout handler
                    // Optional: Hide the dropdown immediately after clicking logout
                    // profileDropdownMenu.classList.add('hidden'); // Redundant if clearAuthData redirects
                }
                // Optional: If clicking on any other link in the dropdown, hide the dropdown
                // This happens naturally when navigating, but explicit hide is faster visually
                // else if (event.target.tagName === 'A') {
                //    profileDropdownMenu.classList.add('hidden');
                // }
            };
            profileDropdownMenu.addEventListener('click', this.handleLogoutClickDelegate); // Attach the event listener
        } else {
            console.error("Profile dropdown menu not found for logout listener setup.");
        }
    }

    handleLogout = () => { // Defined as arrow function - 'this' is bound
        // clearAuthData() from apiService already handles removing token, user data, dispatching event, and redirecting
        // Ensure apiService.js is imported and clearAuthData is available
        clearAuthData(); // Call the centralized logout function
        // Redirection and alert are handled within clearAuthData now.
    }


    handleLoginStatusChange = () => { // Defined as arrow function - 'this' is bound
        console.log('Login/Logout status change detected.');
        this.updateNavbarBasedOnLoginStatus(); // Panggil fungsi update tampilan navbar
        // Re-setup listeners that depend on elements being in the DOM if render() might recreate them
        // Although updateNavbarBasedOnLoginStatus doesn't re-render, calling these again is safe if they check element existence
        this.setupProfileDropdownToggle();
        this.setupLogoutListener(); // Ensure logout listener is attached to the new dropdown element
    }

    updateNavbarBasedOnLoginStatus() {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        const authLinksElement = this.querySelector('.auth-links');
        const userInfoAreaElement = this.querySelector('.user-info-area');
        const userNameElement = this.querySelector('#navbar-user-name');
        // Select only nav links that should be authenticated
        const authenticatedNavLinks = this.querySelectorAll('nav .user-authenticated-nav-link');


        if (user && token) { // Jika ada user data dan token di localStorage (pengguna login)
            const userData = JSON.parse(user);

            // Sembunyikan link Login/Register
            if (authLinksElement) {
                authLinksElement.classList.add('hidden');
                authLinksElement.setAttribute('aria-hidden', 'true'); // Accessibility
            }

            // Tampilkan area info pengguna dan profile dropdown
            if (userInfoAreaElement) {
                userInfoAreaElement.classList.remove('hidden');
                userInfoAreaElement.removeAttribute('aria-hidden'); // Accessibility
                // Update nama pengguna
                const nameSpan = userInfoAreaElement.querySelector('#navbar-user-name');
                if (nameSpan) {
                    nameSpan.textContent = userData.name;
                }
                // TODO: Update profile icon/image if user has photo
                // const profileIcon = userInfoAreaElement.querySelector('.profile-area svg, .profile-area img'); // Select SVG or IMG
                // if (profileIcon && userData.photo) {
                //     // Replace SVG with IMG or update IMG src
                //     if (profileIcon.tagName === 'svg') {
                //         const img = document.createElement('img');
                //         img.src = userData.photo;
                //         img.alt = `Profile picture of ${userData.name}`; // Alt text for accessibility
                //         img.classList.add('size-6', 'rounded-full', 'object-cover'); // Add your styling classes
                //         profileIcon.replaceWith(img); // Replace the SVG placeholder
                //     } else { // It's already an img
                //         profileIcon.src = userData.photo;
                //         profileIcon.alt = `Profile picture of ${userData.name}`;
                //     }
                // } else if (profileIcon && profileIcon.tagName === 'IMG' && !userData.photo) {
                //      // If user logs out or profile photo is removed, maybe replace img back with default SVG
                //      // This requires storing the original SVG or recreating it. Complex for this example.
                //      // For simplicity, maybe just keep the placeholder SVG if no photo is available.
                // }
            }


            // Tampilkan link navigasi di tengah navbar yang hanya untuk pengguna terautentikasi
            authenticatedNavLinks.forEach(link => {
                link.classList.remove('hidden');
                link.removeAttribute('aria-hidden'); // Accessibility
            });

        } else { // Jika tidak ada user data atau token (pengguna belum login)
            // Tampilkan link Login/Register
            if (authLinksElement) {
                authLinksElement.classList.remove('hidden');
                authLinksElement.removeAttribute('aria-hidden'); // Accessibility
            }

            // Sembunyikan area info pengguna dan profile dropdown
            if (userInfoAreaElement) {
                userInfoAreaElement.classList.add('hidden');
                userInfoAreaElement.setAttribute('aria-hidden', 'true'); // Accessibility
                // Pastikan profile dropdown juga hidden saat user-info-area disembunyikan
                const profileDropdownMenu = userInfoAreaElement.querySelector('#profileDropdownMenu');
                if (profileDropdownMenu) {
                    profileDropdownMenu.classList.add('hidden');
                }
            }

            // Bersihkan nama pengguna
            const nameSpan = this.querySelector('#navbar-user-name');
            if (nameSpan) {
                nameSpan.textContent = '';
            }
            // TODO: Reset profile icon back to default SVG if it was an image


            // Sembunyikan link navigasi di tengah navbar yang hanya untuk pengguna terautentikasi
            authenticatedNavLinks.forEach(link => {
                link.classList.add('hidden');
                link.setAttribute('aria-hidden', 'true'); // Accessibility
            });
        }
    }

    // ================================================================
    // Category Dropdown (kept as is, adjusted slightly)
    // ================================================================
    _setupCategoryDropdownToggle() { // Renamed method for clarity
        const categoryButton = this.querySelector('#categoryDropdownButton');
        const categoryMenu = this.querySelector('#categoryDropdownMenu');

        if (categoryButton && categoryMenu) {
            const toggleDropdown = (event) => {
                event.stopPropagation();
                categoryMenu.classList.toggle('hidden');
            };

            categoryButton.addEventListener('click', toggleDropdown);


            const hideDropdown = (event) => {
                // Hide if clicking outside the button and the menu, and the menu is not hidden
                // Make sure event.target exists
                if (event.target && !categoryButton.contains(event.target) && !categoryMenu.contains(event.target) && !categoryMenu.classList.contains('hidden')) {
                    categoryMenu.classList.add('hidden');
                }
            };

            document.addEventListener('click', hideDropdown);


            const hideDropdownOnScroll = () => {
                if (categoryMenu && !categoryMenu.classList.contains('hidden')) {
                    categoryMenu.classList.add('hidden');
                }
            };

            window.addEventListener('scroll', hideDropdownOnScroll);

            // Cleanup event listeners when component is disconnected (optional but good practice for complex scenarios)
            // For robust cleanup, store the references to the anonymous toggleDropdown, hideDropdown, and hideDropdownOnScroll functions
            // and use removeEventListener with those references in disconnectedCallback.
        }
    }
}

customElements.define("app-bar", AppBar);