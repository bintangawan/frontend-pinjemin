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
        console.log('AppBar Component Connected'); // Log to check if connectedCallback runs
        this.render();
        this._setupCategoryDropdownToggle(); // Corrected method name for clarity
        this.setupProfileDropdownToggle(); // Setup profile dropdown
        this.setupLogoutListener(); // Setup logout listener using delegation
        this.setupMobileMenuToggle(); // Setup mobile menu toggle

        // Tambahkan event listener untuk login dan logout
        window.addEventListener('userLoggedIn', this.handleLoginStatusChange);
        window.addEventListener('userLoggedOut', this.handleLoginStatusChange); // Listen for logout event too
        // Periksa status login saat komponen pertama kali dimuat (INI PENTING AGAR TAMPILAN BENAR SAAT HALAMAN PERTAMA KALI DIBUKA SETELAH LOGIN)
        this.updateNavbarBasedOnLoginStatus();
    }

    disconnectedCallback() {
        console.log('AppBar Component Disconnected'); // Log to check if disconnectedCallback runs
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

        // Hapus event listeners untuk mobile menu toggle
        const mobileMenuButton = this.querySelector('#mobile-menu-button');
        if (mobileMenuButton && this._mobileMenuButtonHandler) { // Check if reference exists
            mobileMenuButton.removeEventListener('click', this._mobileMenuButtonHandler);
            this._mobileMenuButtonHandler = null; // Clear the reference
        }
        if (this._hideMobileMenuOutsideHandler) { // Check if reference exists
            document.removeEventListener('click', this._hideMobileMenuOutsideHandler);
            this._hideMobileMenuOutsideHandler = null; // Clear the reference
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

        this.innerHTML += `
            <div class="bg-white shadow-sm py-4">
                <!-- Main container with justify-between and flex-wrap for responsiveness -->
                <!-- Using relative positioning on the main container to allow the mobile menu (positioned absolute) to drop down from it -->
                <div class="container mx-auto px-4 flex flex-wrap items-center justify-between relative">

                    <!-- Left Group: Logo -->
                    <div class="text-xl font-bold text-gray-800 flex items-center"> <!-- Added flex items-center for vertical alignment -->
                        <img src="./logo.png" class=" mr-1 h-10 inline-block">Pinjemin
                    </div>

                    <!-- Right Group: Auth/User Info + Hamburger -->
                    <!-- Use md:order-2 to push this group to the right on medium screens and above -->
                    <!-- Use flex items-center to align items vertically -->
                    <div class="flex items-center space-x-2 md:order-2"> <!-- Adjusted space-x-2 for spacing between Auth/User and Hamburger -->

                         <!-- Authentication Links (Show when NOT logged in) -->
                         <!-- Visible on Mobile AND Desktop here -->
                         <div class="auth-links flex items-center space-x-2"> <!-- Added flex items-center and space-x-2 -->
                             <a href="/#/login" class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                               Sign In
                            </a>
                             <a href="/#/register" class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                Register
                            </a>
                         </div>

                        <!-- User Info Area (Visible when logged in) -->
                        <!-- Visible on Mobile AND Desktop here. self-center for vertical alignment within its direct flex parent. -->
                        <!-- Added hidden initially, managed by JS. space-x-2 for spacing inside profile area. -->
                        <div class="user-info-area relative flex items-center space-x-2 self-center hidden">
                             <div class="profile-area flex items-center space-x-2 cursor-pointer text-gray-700 hover:text-gray-900">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 0 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                                <span class="font-medium" id="navbar-user-name"></span>
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                             </div>
                             <!-- Profile Dropdown Menu (Visibility toggled by JS click) -->
                             <div id="profileDropdownMenu" class="absolute right-0 top-full w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 hidden z-10">
                                 <a href="/#/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                     Profil Saya
                                 </a>
                                 <a href="/#/my-items" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                     Item Saya (Toko Saya)
                                 </a>
                                  <a href="/#/my-transactions" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                     Transaksi Pembelian Saya
                                 </a>
                                  <a href="/#/my-sales" class="block px-4 py-2 text-sm text-sm text-gray-700 hover:bg-gray-100">
                                     Transaksi Item Saya (Penjual)
                                 </a>
                                 <hr class="my-1">
                                 <button id="logout-button" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                     Logout
                                 </button>
                             </div>
                         </div>

                        <!-- Hamburger menu button (Visible on Mobile ONLY). self-center for vertical alignment. -->
                        <!-- Use md:hidden to hide on medium screens and above -->
                        <div class="flex items-center md:hidden self-center">
                             <button id="mobile-menu-button" type="button" class="text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="main-navigation-menu" aria-expanded="false">
                                 <span class="sr-only">Open main menu</span>
                                 <!-- Hamburger icon -->
                                 <svg id="hamburger-icon" class="w-6 h-6 block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                                 <!-- Close icon (initially hidden) -->
                                  <svg id="close-icon" class="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                             </button>
                         </div>
                    </div>


                    <!-- Main Navigation Menu / Links (Hidden on Mobile by default, visible on Desktop) -->
                    <!-- This block is toggled by the hamburger button on mobile -->
                    <!-- Use md:order-1 to place it correctly in the flex order on desktop -->
                     <div class="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="main-navigation-menu">
                         <ul class="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white"> <!-- Adjusted styling slightly -->
                             <li>
                                 <a href="/#/home" class="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0"> <!-- Adjusted link styling -->
                                     Home
                                 </a>
                             </li>
                             <li>
                                 <a href="/#/community" class="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0"> <!-- Adjusted link styling -->
                                     Komunitas
                                 </a>
                             </li>
                             <!-- Only 'Pinjaman Saya' for authenticated users. Initially hidden, shown by JS. -->
                              <li>
                                  <a href="/#/my-rentals" class="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 user-authenticated-nav-link hidden">
                                     Pinjaman Saya
                                 </a>
                              </li>
                              <!-- Removing other authenticated links from here to keep mobile menu simple -->
                              <!-- If you need other links in desktop nav, keep them in a separate structure or manage their visibility carefully -->
                              <!-- For now, matching previous mobile menu request -->
                         </ul>
                     </div>

                </div>
            </div>
        `;

        // setupProfileDropdownToggle, setupLogoutListener, and setupMobileMenuToggle
        // are called in connectedCallback after render
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

        // Elements in the header bar (visible on desktop/mobile)
        const authLinksElement = this.querySelector('.auth-links');
        const userInfoAreaElement = this.querySelector('.user-info-area');
        const userNameElement = this.querySelector('#navbar-user-name');

        // Elements inside the main navigation menu (#main-navigation-menu)
        // These links are visible in desktop nav and toggled in mobile nav by hamburger
        const authenticatedNavLinks = this.querySelectorAll('#main-navigation-menu .user-authenticated-nav-link');


        if (user && token) { // Jika ada user data dan token di localStorage (pengguna login)
            const userData = JSON.parse(user);

            // --- Header Bar (Auth/User Info Section) ---
            // Sembunyikan link Login/Register di header bar
            if (authLinksElement) {
                authLinksElement.classList.add('hidden');
                authLinksElement.setAttribute('aria-hidden', 'true');
            }

            // Tampilkan area info pengguna dan profile dropdown di header bar
            if (userInfoAreaElement) {
                userInfoAreaElement.classList.remove('hidden');
                userInfoAreaElement.removeAttribute('aria-hidden');
                if (userNameElement) {
                    userNameElement.textContent = userData.name;
                }
                // TODO: Handle profile picture update here if needed
            }


            // --- Main Navigation Menu (#main-navigation-menu) ---
            // Tampilkan link navigasi terautentikasi di menu utama (untuk desktop dan mobile menu)
            authenticatedNavLinks.forEach(link => {
                link.classList.remove('hidden'); // Remove hidden class
                link.removeAttribute('aria-hidden');
            });


        } else { // Jika tidak ada user data atau token (pengguna belum login)

            // --- Header Bar (Auth/User Info Section) ---
            // Tampilkan link Login/Register di header bar
            if (authLinksElement) {
                authLinksElement.classList.remove('hidden');
                authLinksElement.removeAttribute('aria-hidden');
            }

            // Sembunyikan area info pengguna dan profile dropdown di header bar
            if (userInfoAreaElement) {
                userInfoAreaElement.classList.add('hidden');
                userInfoAreaElement.setAttribute('aria-hidden', 'true');
                // Pastikan profile dropdown juga hidden saat user-info-area disembunyikan
                const profileDropdownMenu = userInfoAreaElement.querySelector('#profileDropdownMenu');
                if (profileDropdownMenu) {
                    profileDropdownMenu.classList.add('hidden');
                }
            }

            // Bersihkan nama pengguna
            if (userNameElement) {
                userNameElement.textContent = '';
            }
            // TODO: Reset profile icon back to default SVG if it was an image


            // --- Main Navigation Menu (#main-navigation-menu) ---
            // Sembunyikan link navigasi terautentikasi di menu utama
            authenticatedNavLinks.forEach(link => {
                link.classList.add('hidden');
                link.setAttribute('aria-hidden', 'true');
            });
        }
    }

    // ================================================================
    // Mobile Menu Toggle (Added)
    // ================================================================
    setupMobileMenuToggle() {
        console.log('Attempting to setup mobile menu toggle...'); // Log start of method
        const mobileMenuButton = this.querySelector('#mobile-menu-button');
        const mainNavigationMenu = this.querySelector('#main-navigation-menu');
        const hamburgerIcon = this.querySelector('#hamburger-icon');
        const closeIcon = this.querySelector('#close-icon');

        if (mobileMenuButton && mainNavigationMenu && hamburgerIcon && closeIcon) {
            console.log('Mobile menu elements found. Setting up listeners.'); // Log if elements found
            // Store the bound function reference for removal in disconnectedCallback
            this._mobileMenuButtonHandler = (event) => {
                console.log('Mobile menu button clicked.'); // Log when button is clicked
                mainNavigationMenu.classList.toggle('hidden');
                console.log('mainNavigationMenu classList after toggle:', mainNavigationMenu.classList); // Log classList

                // Toggle icons
                hamburgerIcon.classList.toggle('hidden');
                closeIcon.classList.toggle('hidden');
            };
            mobileMenuButton.addEventListener('click', this._mobileMenuButtonHandler);
            console.log('Mobile menu toggle listener added.');

            // Close mobile menu when a link is clicked inside it
            mainNavigationMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    console.log('Mobile menu link clicked, hiding menu.');
                    mainNavigationMenu.classList.add('hidden');
                    // Reset icons when a link is clicked
                    hamburgerIcon.classList.remove('hidden');
                    closeIcon.classList.add('hidden');
                });
            });

            // Close mobile menu when clicking outside of it
            this._hideMobileMenuOutsideHandler = (event) => {
                // Check if the click is outside the button and the menu itself
                if (!mobileMenuButton.contains(event.target) && !mainNavigationMenu.contains(event.target) && !mainNavigationMenu.classList.contains('hidden')) {
                    console.log('Click outside mobile menu, hiding.');
                    mainNavigationMenu.classList.add('hidden');
                    // Reset icons
                    hamburgerIcon.classList.remove('hidden');
                    closeIcon.classList.add('hidden');
                }
            };
            // Add a small delay to the document listener to prevent it from firing
            // immediately after the button click toggles the menu visible.
            requestAnimationFrame(() => { // Wait until next repaint
                document.addEventListener('click', this._hideMobileMenuOutsideHandler);
                console.log('Document click listener for mobile menu added.'); // Log listener added
            });
        } else {
            console.error("Mobile menu button or navigation menu not found after render. mobileMenuButton:", mobileMenuButton, "mainNavigationMenu:", mainNavigationMenu, "hamburgerIcon:", hamburgerIcon, "closeIcon:", closeIcon); // Log if elements not found and show which ones are missing
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