import Products from '../../data/local/product';
import { clearAuthData } from '../../utils/apiService.js';

class AppBar extends HTMLElement {
    constructor() {
        super();
        // Methods defined with arrow functions are automatically bound
    }

    _emptyContent() {
        this.innerHTML = "";
    }

    connectedCallback() {
        console.log('AppBar Component Connected');
        this.render();
        this._setupCategoryDropdownToggle();
        this.setupProfileDropdownToggle();
        this.setupLogoutListener();
        this.setupMobileMenuToggle();

        // Add event listeners for login/logout
        window.addEventListener('userLoggedIn', this.handleLoginStatusChange);
        window.addEventListener('userLoggedOut', this.handleLoginStatusChange);
        
        // Check login status on first load
        this.updateNavbarBasedOnLoginStatus();
        
        // Add body padding to compensate for fixed header
        this.addBodyPadding();
    }

    disconnectedCallback() {
        console.log('AppBar Component Disconnected');
        
        // Remove event listeners
        window.removeEventListener('userLoggedIn', this.handleLoginStatusChange);
        window.removeEventListener('userLoggedOut', this.handleLoginStatusChange);

        // Remove profile dropdown listeners
        const profileArea = this.querySelector('.profile-area');
        if (profileArea) {
            profileArea.removeEventListener('click', this.toggleProfileDropdown);
        }
        document.removeEventListener('click', this.hideProfileDropdown);

        // Remove logout listener
        const profileDropdownMenu = this.querySelector('#profileDropdownMenu');
        if (profileDropdownMenu && this.handleLogoutClickDelegate) {
            profileDropdownMenu.removeEventListener('click', this.handleLogoutClickDelegate);
        }

        // Remove mobile menu listeners
        const mobileMenuButton = this.querySelector('#mobile-menu-button');
        if (mobileMenuButton && this._mobileMenuButtonHandler) {
            mobileMenuButton.removeEventListener('click', this._mobileMenuButtonHandler);
            this._mobileMenuButtonHandler = null;
        }

        // Remove drawer overlay listener
        if (this._drawerOverlayHandler) {
            document.removeEventListener('click', this._drawerOverlayHandler);
            this._drawerOverlayHandler = null;
        }

        // Remove body padding
        this.removeBodyPadding();
    }

    addBodyPadding() {
        // Add padding-top to body to compensate for fixed header
        document.body.style.paddingTop = '100px'; // Adjust based on header height
    }

    removeBodyPadding() {
        // Remove padding when component is disconnected
        document.body.style.paddingTop = '';
    }

    render() {
        this._emptyContent();

        const categories = typeof Products !== 'undefined' && Products.getAll ? [...new Set(Products.getAll().map(product => product.category))] : [];

        this.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
            
            * {
                font-family: 'Poppins', sans-serif;
            }
        </style>
            <!-- Fixed Header -->
            <div class="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
                <div class="container mx-auto px-4 py-4 flex items-center justify-between">
                    
                    <!-- Mobile Menu Button (Left) -->
                    <div class="flex items-center md:hidden">
                        <button id="mobile-menu-button" type="button" class="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <span class="sr-only">Open main menu</span>
                            <!-- Hamburger icon -->
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Logo (Center on mobile, Left on desktop) -->
                    <div class="flex items-center justify-center md:justify-start flex-1 md:flex-none">
                        <div class="text-xl font-bold text-gray-800 flex items-center">
                            <img src="./pinjemin.png" class="mr-2 h-16 inline-block" alt="Pinjemin Logo">
                        </div>
                    </div>

                    <!-- Desktop Navigation (Hidden on mobile) -->
                    <nav class="hidden md:flex items-center space-x-8 flex-1 justify-center">
                        <a href="/#/home" class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                            Home
                        </a>
                        <a href="/#/community" class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                            Komunitas
                        </a>
                        <a href="/#/my-rentals" class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 user-authenticated-nav-link hidden">
                            Pinjaman Saya
                        </a>
                    </nav>

                    <!-- Right Section: Auth/Profile -->
                    <div class="flex items-center space-x-3">
                        <notification-badge class="user-authenticated-nav-link hidden"></notification-badge>
                        <!-- Authentication Links (Show when NOT logged in) -->
                        <!-- Authentication Links (Show when NOT logged in) -->
                        <div class="auth-links flex items-center space-x-2">
                            <a href="/#/login" class="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
                                Sign In
                            </a>
                            <a href="/#/register" class="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200">
                                Register
                            </a>
                        </div>

                        <!-- User Info Area (Visible when logged in) -->
                        <div class="user-info-area relative hidden">
                            <div class="profile-area flex items-center space-x-2 cursor-pointer text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-600">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 0 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                </div>
                                <span class="font-medium text-sm hidden sm:inline" id="navbar-user-name"></span>
                                <svg class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                            
                            <!-- Profile Dropdown Menu -->
                            <div id="profileDropdownMenu" class="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 hidden z-20">
                                <div class="px-4 py-3 border-b border-gray-100">
                                    <p class="text-sm font-medium text-gray-900" id="dropdown-user-name"></p>
                                    <p class="text-xs text-gray-500">Selamat datang kembali!</p>
                                </div>
                                <a href="/#/profile" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                                    <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                    Profil Saya
                                </a>
                                <a href="/#/my-items" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                                    <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                    </svg>
                                    Item Saya
                                </a>
                                <a href="/#/my-transactions" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                                    <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                                    </svg>
                                    Transaksi Pembelian
                                </a>
                                <a href="/#/my-sales" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                                    <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"></path>
                                    </svg>
                                    Penjualan Saya
                                </a>
                                <hr class="my-2">
                                <button id="logout-button" class="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200">
                                    <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile Drawer Overlay -->
            <div id="drawer-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden md:hidden transition-opacity duration-300"></div>

            <!-- Mobile Drawer Menu -->
            <div id="mobile-drawer" class="fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform -translate-x-full transition-transform duration-300 ease-in-out md:hidden">
                <!-- Drawer Header -->
                <div class="flex items-center justify-between p-4 border-b border-gray-200">
                    <div class="flex items-center space-x-3">
                        <img src="./pinjemin.png" class="h-8" alt="Pinjemin Logo">
                        <span class="text-lg font-bold text-gray-800">Pinjemin</span>
                    </div>
                    <button id="close-drawer-button" class="text-gray-400 hover:text-gray-600 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Drawer Content -->
                <div class="flex flex-col h-full overflow-y-auto">
                    <!-- User Info Section (When logged in) -->
                    <div class="drawer-user-info hidden border-b border-gray-200 p-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-blue-600">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 0 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                            </div>
                            <div>
                                <p class="font-medium text-gray-900" id="drawer-user-name"></p>
                                <p class="text-sm text-gray-500">Selamat datang!</p>
                            </div>
                        </div>
                    </div>

                    <!-- Auth Links (When not logged in) -->
                    <div class="drawer-auth-links border-b border-gray-200 p-4">
                        <div class="space-y-3">
                            <a href="/#/login" class="flex items-center justify-center w-full py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium">
                                Sign In
                            </a>
                            <a href="/#/register" class="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                                Register
                            </a>
                        </div>
                    </div>

                    <!-- Navigation Links -->
                    <nav class="flex-1 px-4 py-4">
                        <ul class="space-y-2">
                            <li>
                                <a href="/#/home" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                    <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                    </svg>
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="/#/community" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                    <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                    </svg>
                                    Komunitas
                                </a>
                            </li>
                            
                            <!-- Authenticated Links -->
                            <li class="drawer-authenticated-nav-link hidden">
                                <a href="/#/my-rentals" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                    <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                    </svg>
                                    Pinjaman Saya
                                </a>
                            </li>
                            <li class="drawer-authenticated-nav-link hidden">
                                <a href="/#/my-items" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                    <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                    </svg>
                                    Item Saya
                                </a>
                            </li>
                            <li class="drawer-authenticated-nav-link hidden">
                                <a href="/#/my-transactions" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                    <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                                    </svg>
                                    Transaksi Pembelian
                                </a>
                            </li>
                            <li class="drawer-authenticated-nav-link hidden">
                                <a href="/#/my-sales" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                    <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"></path>
                                    </svg>
                                    Penjualan Saya
                                </a>
                            </li>
                        </ul>
                    </nav>

                    <!-- Logout Button (When logged in) -->
                    <div class="drawer-logout-section hidden border-t border-gray-200 p-4">
                        <button id="drawer-logout-button" class="flex items-center w-full px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200">
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Setup event listener for the profile dropdown toggle
    setupProfileDropdownToggle() {
        const profileArea = this.querySelector('.profile-area');
        const profileDropdownMenu = this.querySelector('#profileDropdownMenu');

        if (profileArea && profileDropdownMenu) {
            profileArea.addEventListener('click', this.toggleProfileDropdown);
            document.addEventListener('click', this.hideProfileDropdown);
        }
    }

    // Toggle profile dropdown visibility
    toggleProfileDropdown = (event) => {
        event.stopPropagation();
        const profileDropdownMenu = this.querySelector('#profileDropdownMenu');
        if (profileDropdownMenu) {
            profileDropdownMenu.classList.toggle('hidden');
        }
    }

    // Hide profile dropdown when clicking outside
    hideProfileDropdown = (event) => {
        const profileArea = this.querySelector('.profile-area');
        const profileDropdownMenu = this.querySelector('#profileDropdownMenu');

        if (profileArea && profileDropdownMenu && event.target && 
            !profileArea.contains(event.target) && !profileDropdownMenu.contains(event.target)) {
            profileDropdownMenu.classList.add('hidden');
        }
    }

    // Setup logout listener using event delegation
    setupLogoutListener() {
        const profileDropdownMenu = this.querySelector('#profileDropdownMenu');
        if (profileDropdownMenu) {
            if (this.handleLogoutClickDelegate) {
                profileDropdownMenu.removeEventListener('click', this.handleLogoutClickDelegate);
            }

            this.handleLogoutClickDelegate = (event) => {
                if (event.target && event.target.id === 'logout-button') {
                    event.preventDefault();
                    this.handleLogout();
                }
            };
            profileDropdownMenu.addEventListener('click', this.handleLogoutClickDelegate);
        }

        // Setup drawer logout button
        const drawerLogoutButton = this.querySelector('#drawer-logout-button');
        if (drawerLogoutButton) {
            drawerLogoutButton.addEventListener('click', this.handleLogout);
        }
    }

    handleLogout = () => {
        clearAuthData();
        this.closeDrawer(); // Close drawer after logout
    }

    handleLoginStatusChange = () => {
        console.log('Login/Logout status change detected.');
        this.updateNavbarBasedOnLoginStatus();
        this.setupProfileDropdownToggle();
        this.setupLogoutListener();
    }

    updateNavbarBasedOnLoginStatus() {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        // Header elements
        const authLinksElement = this.querySelector('.auth-links');
        const userInfoAreaElement = this.querySelector('.user-info-area');
        const userNameElement = this.querySelector('#navbar-user-name');
        const dropdownUserNameElement = this.querySelector('#dropdown-user-name');

        // Desktop navigation
        const authenticatedNavLinks = this.querySelectorAll('.user-authenticated-nav-link');

        // Drawer elements
        const drawerAuthLinks = this.querySelector('.drawer-auth-links');
        const drawerUserInfo = this.querySelector('.drawer-user-info');
        const drawerUserNameElement = this.querySelector('#drawer-user-name');
        const drawerAuthenticatedLinks = this.querySelectorAll('.drawer-authenticated-nav-link');
        const drawerLogoutSection = this.querySelector('.drawer-logout-section');

        if (user && token) {
            const userData = JSON.parse(user);

            // Header Bar
            if (authLinksElement) {
                authLinksElement.classList.add('hidden');
            }
            if (userInfoAreaElement) {
                userInfoAreaElement.classList.remove('hidden');
                if (userNameElement) {
                    userNameElement.textContent = userData.name;
                }
                if (dropdownUserNameElement) {
                    dropdownUserNameElement.textContent = userData.name;
                }
            }

            // Desktop Navigation
            authenticatedNavLinks.forEach(link => {
                link.classList.remove('hidden');
            });

            // Drawer
            if (drawerAuthLinks) {
                drawerAuthLinks.classList.add('hidden');
            }
            if (drawerUserInfo) {
                drawerUserInfo.classList.remove('hidden');
                if (drawerUserNameElement) {
                    drawerUserNameElement.textContent = userData.name;
                }
            }
            drawerAuthenticatedLinks.forEach(link => {
                link.classList.remove('hidden');
            });
            if (drawerLogoutSection) {
                drawerLogoutSection.classList.remove('hidden');
            }

        } else {
            // Header Bar
            if (authLinksElement) {
                authLinksElement.classList.remove('hidden');
            }
            if (userInfoAreaElement) {
                userInfoAreaElement.classList.add('hidden');
                const profileDropdownMenu = userInfoAreaElement.querySelector('#profileDropdownMenu');
                if (profileDropdownMenu) {
                    profileDropdownMenu.classList.add('hidden');
                }
            }
            if (userNameElement) {
                userNameElement.textContent = '';
            }
            if (dropdownUserNameElement) {
                dropdownUserNameElement.textContent = '';
            }

            // Desktop Navigation
            authenticatedNavLinks.forEach(link => {
                link.classList.add('hidden');
            });

            // Drawer
            if (drawerAuthLinks) {
                drawerAuthLinks.classList.remove('hidden');
            }
            if (drawerUserInfo) {
                drawerUserInfo.classList.add('hidden');
            }
            if (drawerUserNameElement) {
                drawerUserNameElement.textContent = '';
            }
            drawerAuthenticatedLinks.forEach(link => {
                link.classList.add('hidden');
            });
            if (drawerLogoutSection) {
                drawerLogoutSection.classList.add('hidden');
            }
        }
    }

    // Mobile Menu Drawer Toggle
    setupMobileMenuToggle() {
        console.log('Setting up mobile drawer toggle...');
        const mobileMenuButton = this.querySelector('#mobile-menu-button');
        const mobileDrawer = this.querySelector('#mobile-drawer');
        const drawerOverlay = this.querySelector('#drawer-overlay');
        const closeDrawerButton = this.querySelector('#close-drawer-button');

        if (mobileMenuButton && mobileDrawer && drawerOverlay) {
            console.log('Mobile drawer elements found. Setting up listeners.');
            
            // Open drawer
            this._mobileMenuButtonHandler = (event) => {
                console.log('Mobile menu button clicked.');
                this.openDrawer();
            };
            mobileMenuButton.addEventListener('click', this._mobileMenuButtonHandler);

            // Close drawer via close button
            if (closeDrawerButton) {
                closeDrawerButton.addEventListener('click', () => {
                    this.closeDrawer();
                });
            }

            // Close drawer via overlay click
            this._drawerOverlayHandler = (event) => {
                if (event.target === drawerOverlay) {
                    this.closeDrawer();
                }
            };
            drawerOverlay.addEventListener('click', this._drawerOverlayHandler);

            // Close drawer when clicking navigation links
            const drawerLinks = mobileDrawer.querySelectorAll('a');
            drawerLinks.forEach(link => {
                link.addEventListener('click', () => {
                    console.log('Drawer link clicked, closing drawer.');
                    this.closeDrawer();
                });
            });

            // Close drawer on escape key
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && !mobileDrawer.classList.contains('-translate-x-full')) {
                    this.closeDrawer();
                }
            });

        } else {
            console.error("Mobile drawer elements not found:", {
                mobileMenuButton,
                mobileDrawer,
                drawerOverlay
            });
        }
    }

    openDrawer = () => {
        const mobileDrawer = this.querySelector('#mobile-drawer');
        const drawerOverlay = this.querySelector('#drawer-overlay');
        
        if (mobileDrawer && drawerOverlay) {
            // Show overlay
            drawerOverlay.classList.remove('hidden');
            // Force reflow before adding transform classes for smooth animation
            drawerOverlay.offsetHeight;
            
            // Slide in drawer
            mobileDrawer.classList.remove('-translate-x-full');
            
            // Prevent body scroll when drawer is open
            document.body.style.overflow = 'hidden';
            
            console.log('Drawer opened');
        }
    }

    closeDrawer = () => {
        const mobileDrawer = this.querySelector('#mobile-drawer');
        const drawerOverlay = this.querySelector('#drawer-overlay');
        
        if (mobileDrawer && drawerOverlay) {
            // Slide out drawer
            mobileDrawer.classList.add('-translate-x-full');
            
            // Hide overlay after animation completes
            setTimeout(() => {
                drawerOverlay.classList.add('hidden');
            }, 300); // Match transition duration
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            console.log('Drawer closed');
        }
    }

    // Category Dropdown (kept as is, adjusted slightly)
    _setupCategoryDropdownToggle() {
        const categoryButton = this.querySelector('#categoryDropdownButton');
        const categoryMenu = this.querySelector('#categoryDropdownMenu');

        if (categoryButton && categoryMenu) {
            const toggleDropdown = (event) => {
                event.stopPropagation();
                categoryMenu.classList.toggle('hidden');
            };

            categoryButton.addEventListener('click', toggleDropdown);

            const hideDropdown = (event) => {
                if (event.target && !categoryButton.contains(event.target) && 
                    !categoryMenu.contains(event.target) && !categoryMenu.classList.contains('hidden')) {
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
        }
    }
}

customElements.define("app-bar", AppBar);