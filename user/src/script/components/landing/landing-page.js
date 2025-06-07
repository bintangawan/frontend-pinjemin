class LandingPage extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    this.render()
    this.setupMobileMenuToggle()
    this.setupScrollAnimations()
    this.setupFAQAccordion()

    // Add body padding to compensate for fixed header
    this.addBodyPadding()
  }

  disconnectedCallback() {

    // Remove mobile menu listeners
    const mobileMenuButton = this.querySelector("#mobile-menu-button")
    if (mobileMenuButton && this._mobileMenuButtonHandler) {
      mobileMenuButton.removeEventListener("click", this._mobileMenuButtonHandler)
      this._mobileMenuButtonHandler = null
    }

    // Remove drawer overlay listener
    if (this._drawerOverlayHandler) {
      document.removeEventListener("click", this._drawerOverlayHandler)
      this._drawerOverlayHandler = null
    }

    // Remove body padding
    this.removeBodyPadding()
  }

  _emptyContent() {
    this.innerHTML = ""
  }

  addBodyPadding() {
    // Add padding-top to body to compensate for fixed header
    document.body.style.paddingTop = "80px" // Adjust based on header height
  }

  removeBodyPadding() {
    // Remove padding when component is disconnected
    document.body.style.paddingTop = ""
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in-up")
        }
      })
    }, observerOptions)

    // Observe all sections
    this.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el)
    })
  }

  setupFAQAccordion() {
    const faqItems = this.querySelectorAll(".faq-item")

    faqItems.forEach((item) => {
      const button = item.querySelector(".faq-button")
      const content = item.querySelector(".faq-content")
      const icon = item.querySelector(".faq-icon")

      button.addEventListener("click", () => {
        const isOpen = !content.classList.contains("hidden")

        // Close all other FAQ items
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.querySelector(".faq-content").classList.add("hidden")
            otherItem.querySelector(".faq-icon").style.transform = "rotate(0deg)"
          }
        })

        // Toggle current item
        if (isOpen) {
          content.classList.add("hidden")
          icon.style.transform = "rotate(0deg)"
        } else {
          content.classList.remove("hidden")
          icon.style.transform = "rotate(180deg)"
        }
      })
    })
  }

  // Mobile Menu Drawer Toggle
  setupMobileMenuToggle() {
    const mobileMenuButton = this.querySelector("#mobile-menu-button")
    const mobileDrawer = this.querySelector("#mobile-drawer")
    const drawerOverlay = this.querySelector("#drawer-overlay")
    const closeDrawerButton = this.querySelector("#close-drawer-button")

    if (mobileMenuButton && mobileDrawer && drawerOverlay) {

      // Open drawer
      this._mobileMenuButtonHandler = (event) => {
        this.openDrawer()
      }
      mobileMenuButton.addEventListener("click", this._mobileMenuButtonHandler)

      // Close drawer via close button
      if (closeDrawerButton) {
        closeDrawerButton.addEventListener("click", () => {
          this.closeDrawer()
        })
      }

      // Close drawer via overlay click
      this._drawerOverlayHandler = (event) => {
        if (event.target === drawerOverlay) {
          this.closeDrawer()
        }
      }
      drawerOverlay.addEventListener("click", this._drawerOverlayHandler)

      // Close drawer when clicking navigation links
      const drawerLinks = mobileDrawer.querySelectorAll("a")
      drawerLinks.forEach((link) => {
        link.addEventListener("click", () => {
          this.closeDrawer()
        })
      })

      // Close drawer on escape key
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !mobileDrawer.classList.contains("-translate-x-full")) {
          this.closeDrawer()
        }
      })
    } else {
      console.error("Mobile drawer elements not found:", {
        mobileMenuButton,
        mobileDrawer,
        drawerOverlay,
      })
    }
  }

  openDrawer = () => {
    const mobileDrawer = this.querySelector("#mobile-drawer")
    const drawerOverlay = this.querySelector("#drawer-overlay")

    if (mobileDrawer && drawerOverlay) {
      // Show overlay
      drawerOverlay.classList.remove("hidden")
      // Force reflow before adding transform classes for smooth animation
      drawerOverlay.offsetHeight

      // Slide in drawer
      mobileDrawer.classList.remove("-translate-x-full")

      // Prevent body scroll when drawer is open
      document.body.style.overflow = "hidden"
    }
  }

  closeDrawer = () => {
    const mobileDrawer = this.querySelector("#mobile-drawer")
    const drawerOverlay = this.querySelector("#drawer-overlay")

    if (mobileDrawer && drawerOverlay) {
      // Slide out drawer
      mobileDrawer.classList.add("-translate-x-full")

      // Hide overlay after animation completes
      setTimeout(() => {
        drawerOverlay.classList.add("hidden")
      }, 300) // Match transition duration

      // Restore body scroll
      document.body.style.overflow = ""
    }
  }

  render() {
    this._emptyContent()

    this.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
            
            * {
                font-family: 'Poppins', sans-serif;
            }

            .animate-fade-in-up {
                animation: fadeInUp 0.8s ease-out forwards;
            }
                #how-it-works {
                    scroll-margin-top: 100px;
                }

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .gradient-bg {
                background: linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%);
            }

            .feature-card:hover {
                transform: translateY(-5px);
                transition: all 0.3s ease;
            }

            .hero-pattern {
                background-image: radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0);
                background-size: 50px 50px;
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>

                <!-- Logo (Center on mobile, Left on desktop) -->
                <div class="flex items-center justify-center md:justify-start flex-1 md:flex-none">
                    <div class="text-xl font-bold text-gray-800 flex items-center">
                        <img src="./logo-pinjemin.png" class="mr-2 h-16 inline-block" alt="Pinjemin Logo">
                    </div>
                </div>

                <!-- Desktop Navigation (Hidden on mobile) -->
                <nav class="hidden md:flex items-center space-x-8 flex-1 justify-center">
                    <a href="#beranda" class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                        Beranda
                    </a>
                    <a href="/#/community" class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                        Komunitas
                    </a>
                    <a href="#how-it-works" onclick="document.getElementById('how-it-works').scrollIntoView({behavior: 'smooth'})" class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 cursor-pointer">
                        Cara Kerja
                    </a>
                </nav>

                <!-- Right Section: Auth Links -->
                <div class="flex items-center space-x-3">
                    <!-- Authentication Links -->
                    <div class="auth-links flex items-center space-x-2">
                        <a href="/#/login" class="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
                            Sign In
                        </a>
                        <a href="/#/register" class="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200">
                            Register
                        </a>
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
                    <img src="./logo-pinjemin.png" class="h-8" alt="Pinjemin Logo">
                    <span class="text-lg font-bold text-gray-800">Pinjemin</span>
                </div>
                <button id="close-drawer-button" class="text-gray-400 hover:text-gray-600 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Drawer Content -->
            <div class="flex flex-col h-full overflow-y-auto">
                <!-- Auth Links -->
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
                            <a href="/#/" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                                Beranda
                            </a>
                        </li>
                        <li>
                            <a href="/#/community" class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                Komunitas
                            </a>
                        </li>
                        <li>
                            <button onclick="document.getElementById('how-it-works').scrollIntoView({behavior: 'smooth'}); this.closest('#mobile-drawer').classList.add('-translate-x-full'); document.getElementById('drawer-overlay').classList.add('hidden');" class="flex items-center w-full px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
                                <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Cara Kerja
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>

        <!-- Hero Section -->
        <section id="beranda" class="gradient-bg hero-pattern min-h-screen flex items-center justify-center px-4 py-20">
            <div class="container mx-auto">
                <div class="grid lg:grid-cols-2 gap-12 items-center">
                    <!-- Left Content -->
                    <div class="text-white space-y-8 animate-on-scroll">
                        <div class="space-y-4">
                            <h1 class="text-4xl md:text-6xl font-bold leading-tight text-[#2E64E9]">
                                Pinjemin - 
                                <span class="text-[#2E64E9]">Making All Your Needs Easier</span>
                            </h1>
                            <p class="text-xl md:text-2xl text-gray-700 leading-relaxed">
                                Platform serbaguna yang memudahkan kamu membeli, menyewa, atau meminjam barang apapun.
                            </p>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row gap-4">
                            <a href="/#/register" class="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all duration-300 text-center shadow-lg">
                                Mulai Sekarang
                            </a>
                            <button onclick="document.getElementById('how-it-works').scrollIntoView({behavior: 'smooth'})" class="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 hover:text-white transition-all duration-300 text-center">
                                Pelajari Lebih Lanjut
                            </button>
                        </div>
                    </div>

                    <!-- Right Content - Hero Image -->
                    <div class="flex justify-center animate-on-scroll">
                        <div class="relative">
                            <img src="./dashboard-page.png?height=1080&width=1920" alt="Pinjemin Platform Illustration" class="w-full max-w-2xl rounded-2xl">
                            <div class="absolute -top-4 -right-4 bg-yellow-400 text-blue-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                                Sewa & Beli!
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Demo Section -->
        <section class="py-20 bg-white">
            <div class="container mx-auto px-4">
                <div class="grid lg:grid-cols-2 gap-12 items-center">
                    <!-- Left Content - Demo Video -->
                    <div class="flex justify-center animate-on-scroll">
                        <div class="relative w-full max-w-2xl">
                            <!-- YouTube Video Embed with fallback -->
                            <div class="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden shadow-xl">
                                <!-- Primary iframe with privacy-enhanced mode -->
                                <iframe 
                                    class="w-full h-full" 
                                    src="https://www.youtube-nocookie.com/embed/GmJqTraI9oQ?rel=0&modestbranding=1&showinfo=0"
                                    title="Pinjemin Demo Video" 
                                    frameborder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    allowfullscreen
                                    referrerpolicy="strict-origin-when-cross-origin">
                                </iframe>
                                
                                <!-- Fallback content if iframe fails -->
                                <div class="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity duration-300" style="z-index: -1;">
                                    <div class="text-center">
                                        <svg class="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                        </svg>
                                        <p class="text-lg font-semibold">Demo Video</p>
                                        <p class="text-sm opacity-75">Klik untuk menonton</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Alternative: Direct YouTube link button -->
                            <div class="mt-4 text-center">
                                <a 
                                    href="https://www.youtube.com/watch?v=GmJqTraI9oQ" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                                >
                                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                    Tonton di YouTube
                                </a>
                            </div>
                            
                            <!-- Demo Badge -->
                            <div class="absolute -top-4 -right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center space-x-2">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                                <span>Demo Video</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right Content - same as before -->
                    <div class="space-y-8 animate-on-scroll">
                        <div class="space-y-4">
                            <h2 class="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                                Lihat Pinjemin 
                                <span class="text-blue-600">Dalam Aksi</span>
                            </h2>
                            <p class="text-xl text-gray-600 leading-relaxed">
                                Tonton video demo lengkap tentang cara menggunakan Pinjemin untuk semua kebutuhan jual-beli dan sewa-menyewa kamu.
                            </p>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="flex items-center space-x-3">
                                <div class="bg-green-100 p-2 rounded-full">
                                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="text-gray-700 font-medium">Panduan lengkap dari registrasi hingga transaksi</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <div class="bg-green-100 p-2 rounded-full">
                                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="text-gray-700 font-medium">Tips dan trik untuk pengalaman terbaik</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <div class="bg-green-100 p-2 rounded-full">
                                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="text-gray-700 font-medium">Fitur-fitur unggulan yang wajib dicoba</span>
                            </div>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row gap-4">
                            <a href="/#/register" class="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all duration-300 text-center shadow-lg">
                                Coba Sekarang
                            </a>
                            <button onclick="document.getElementById('how-it-works').scrollIntoView({behavior: 'smooth'})" class="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 hover:text-white transition-all duration-300 text-center">
                                Pelajari Lebih Lanjut
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- How It Works Section -->
        <section id="how-it-works" class="py-20 bg-gray-50">
            <div class="container mx-auto px-4">
                <div class="text-center mb-16 animate-on-scroll">
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">Bagaimana Cara Kerjanya?</h2>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                        Tiga langkah mudah untuk memulai pengalaman jual-beli dan sewa-menyewa yang menyenangkan
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <!-- Step 1 -->
                    <div class="bg-white p-8 rounded-2xl shadow-lg text-center feature-card animate-on-scroll">
                        <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">Unggah Barang</h3>
                        <p class="text-gray-600 leading-relaxed">
                            Jual atau sewakan barang dengan mudah. Upload foto, tentukan harga, dan barang kamu siap dilihat ribuan pengguna.
                        </p>
                    </div>

                    <!-- Step 2 -->
                    <div class="bg-white p-8 rounded-2xl shadow-lg text-center feature-card animate-on-scroll">
                        <div class="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">Temukan & Pinjam</h3>
                        <p class="text-gray-600 leading-relaxed">
                            Cari dan checkout barang yang tersedia. Filter berdasarkan lokasi, harga, dan kategori untuk menemukan yang kamu butuhkan.
                        </p>
                    </div>

                    <!-- Step 3 -->
                    <div class="bg-white p-8 rounded-2xl shadow-lg text-center feature-card animate-on-scroll">
                        <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">Lakukan Transaksi</h3>
                        <p class="text-gray-600 leading-relaxed">
                            COD atau janjian ambil barang, semuanya tercatat! Sistem kami memastikan transaksi aman dan terpercaya.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="py-20 bg-white">
            <div class="container mx-auto px-4">
                <div class="text-center mb-16 animate-on-scroll">
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">Fitur Unggulan Pinjemin</h2>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                        Semua yang kamu butuhkan untuk pengalaman jual-beli dan sewa-menyewa yang sempurna
                    </p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <!-- Feature 1 -->
                    <div class="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 animate-on-scroll">
                        <div class="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Akun Tunggal</h3>
                        <p class="text-gray-600">Satu akun untuk semua kebutuhan - jual, beli, sewa, dan pinjam.</p>
                    </div>

                    <!-- Feature 2 -->
                    <div class="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 animate-on-scroll">
                        <div class="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Checkout Gabungan</h3>
                        <p class="text-gray-600">Beli dan sewa barang sekaligus dalam satu transaksi yang mudah.</p>
                    </div>

                    <!-- Feature 3 -->
                    <div class="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 animate-on-scroll">
                        <div class="bg-yellow-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Pembayaran COD</h3>
                        <p class="text-gray-600">Bayar langsung saat barang diterima untuk keamanan maksimal.</p>
                    </div>

                    <!-- Feature 4 -->
                    <div class="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 animate-on-scroll">
                        <div class="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Review & Chat</h3>
                        <p class="text-gray-600">Komunikasi langsung dengan penjual dan sistem review terpercaya.</p>
                    </div>

                    <!-- Feature 5 -->
                    <div class="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 animate-on-scroll">
                        <div class="bg-red-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Notifikasi & Pengingat</h3>
                        <p class="text-gray-600">Dapatkan update real-time untuk semua aktivitas transaksi kamu.</p>
                    </div>

                    <!-- Feature 6 -->
                    <div class="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 animate-on-scroll">
                        <div class="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Filter & Pencarian</h3>
                        <p class="text-gray-600">Temukan barang yang tepat dengan filter lokasi, harga, dan kategori.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- FAQ Section -->
        <section class="py-20 bg-gray-50">
            <div class="container mx-auto px-4">
                <div class="text-center mb-16 animate-on-scroll">
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">Pertanyaan yang Sering Diajukan</h2>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                        Temukan jawaban untuk pertanyaan umum tentang Pinjemin
                    </p>
                </div>

                <div class="max-w-3xl mx-auto space-y-4">
                    <!-- FAQ Item 1 -->
                    <div class="faq-item bg-white rounded-lg shadow-sm animate-on-scroll">
                        <button class="faq-button w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200">
                            <span class="text-lg font-semibold text-gray-900">Apakah saya bisa menyewa dan membeli sekaligus?</span>
                            <svg class="faq-icon w-5 h-5 text-gray-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div class="faq-content hidden px-6 pb-4">
                            <p class="text-gray-600">Ya! Pinjemin memungkinkan kamu untuk menyewa dan membeli barang dalam satu transaksi. Sistem checkout gabungan kami memudahkan kamu untuk mendapatkan semua yang dibutuhkan sekaligus.</p>
                        </div>
                    </div>

                    <!-- FAQ Item 2 -->
                    <div class="faq-item bg-white rounded-lg shadow-sm animate-on-scroll">
                        <button class="faq-button w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200">
                            <span class="text-lg font-semibold text-gray-900">Bagaimana sistem pembayaran di Pinjemin?</span>
                            <svg class="faq-icon w-5 h-5 text-gray-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div class="faq-content hidden px-6 pb-4">
                            <p class="text-gray-600">Kami menggunakan sistem COD (Cash on Delivery) untuk keamanan maksimal. Kamu bisa bayar langsung saat barang diterima, sehingga tidak perlu khawatir dengan penipuan online.</p>
                        </div>
                    </div>

                    <!-- FAQ Item 3 -->
                    <div class="faq-item bg-white rounded-lg shadow-sm animate-on-scroll">
                        <button class="faq-button w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200">
                            <span class="text-lg font-semibold text-gray-900">Apakah semua pengguna bisa jadi penyewa dan penjual?</span>
                            <svg class="faq-icon w-5 h-5 text-gray-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div class="faq-content hidden px-6 pb-4">
                            <p class="text-gray-600">Tentu saja! Dengan satu akun Pinjemin, kamu bisa menjadi pembeli, penyewa, penjual, dan yang menyewakan barang. Fleksibilitas penuh untuk semua kebutuhan transaksi kamu.</p>
                        </div>
                    </div>

                    <!-- FAQ Item 4 -->
                    <div class="faq-item bg-white rounded-lg shadow-sm animate-on-scroll">
                        <button class="faq-button w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200">
                            <span class="text-lg font-semibold text-gray-900">Bagaimana cara memastikan keamanan transaksi?</span>
                            <svg class="faq-icon w-5 h-5 text-gray-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div class="faq-content hidden px-6 pb-4">
                            <p class="text-gray-600">Pinjemin memiliki sistem review dan rating, chat langsung dengan penjual, serta semua transaksi tercatat dalam sistem. Ditambah dengan pembayaran COD, keamanan transaksi kamu terjamin.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Contact/Team Section -->
        <section class="py-20 bg-white">
            <div class="container mx-auto px-4">
                <div class="text-center mb-16 animate-on-scroll">
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">👥 Siapa di Balik Pinjemin?</h2>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                        Tim passionate yang berkomitmen menghadirkan solusi terbaik untuk kebutuhan sehari-hari kamu
                    </p>
                </div>

                <div class="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    <!-- ML Team -->
                    <div class="animate-on-scroll">
                        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
                            <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span class="text-3xl mr-3">🎯</span>
                                Machine Learning Team
                            </h3>
                            <div class="space-y-4">
                                <div class="bg-white p-4 rounded-lg shadow-sm">
                                    <p class="font-semibold text-gray-900">MC008D5X0402</p>
                                    <p class="text-lg font-medium text-blue-600">Rahma Nur Annisa</p>
                                    <p class="text-gray-600">Statistika, Universitas Gadjah Mada</p>
                                </div>
                                <div class="bg-white p-4 rounded-lg shadow-sm">
                                    <p class="font-semibold text-gray-900">MC008D5Y0259</p>
                                    <p class="text-lg font-medium text-blue-600">Yohanes De Britto Dewo Prasetyo</p>
                                    <p class="text-gray-600">Statistika, Universitas Gadjah Mada</p>
                                </div>
                                <div class="bg-white p-4 rounded-lg shadow-sm">
                                    <p class="font-semibold text-gray-900">MC008D5Y1074</p>
                                    <p class="text-lg font-medium text-blue-600">Dimaz Andhika Putra</p>
                                    <p class="text-gray-600">Statistika, Universitas Gadjah Mada</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Frontend & Backend Team -->
                    <div class="animate-on-scroll">
                        <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl">
                            <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span class="text-3xl mr-3">🖥️</span>
                                Front-End dan Back-End Team
                            </h3>
                            <div class="space-y-4">
                                <div class="bg-white p-4 rounded-lg shadow-sm">
                                    <p class="font-semibold text-gray-900">FC221D5Y1035</p>
                                    <p class="text-lg font-medium text-green-600">Bintang Kurniawan Herman</p>
                                    <p class="text-gray-600">Ilmu Komputer, UIN Sumatera Utara Medan</p>
                                </div>
                                <div class="bg-white p-4 rounded-lg shadow-sm">
                                    <p class="font-semibold text-gray-900">FC134D5X1508</p>
                                    <p class="text-lg font-medium text-green-600">Indah Sari Sitorus</p>
                                    <p class="text-gray-600">Manajemen Informatika, Politeknik Negeri Sriwijaya</p>
                                </div>
                                <div class="bg-white p-4 rounded-lg shadow-sm">
                                    <p class="font-semibold text-gray-900">FC014D5Y0292</p>
                                    <p class="text-lg font-medium text-green-600">I Putu Yogi Prasetya Dharmawan</p>
                                    <p class="text-gray-600">Teknologi Informasi, Universitas Udayana</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="gradient-bg py-20">
            <div class="container mx-auto px-4 text-center animate-on-scroll">
                <div class="max-w-3xl mx-auto text-white space-y-8">
                    <h2 class="text-4xl md:text-5xl font-bold">
                        Siap Memulai Perjalanan Pinjemin?
                    </h2>
                    <p class="text-xl text-blue-100">
                        Bergabunglah dengan ribuan pengguna yang sudah merasakan kemudahan bertransaksi di Pinjemin
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="/#/register" class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg">
                            Daftar Sekarang
                        </a>
                        <a href="/#/login" class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
                            Sudah Punya Akun?
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-white py-12">
            <div class="container mx-auto px-4">
                <div class="grid md:grid-cols-4 gap-8">
                    <!-- Logo & Description -->
                    <div class="md:col-span-2">
                        <div class="flex items-center mb-4">
                            <img src="./logo-pinjemin.png" class="h-12 mr-3" alt="Pinjemin Logo">
                            <span class="text-2xl font-bold">Pinjemin</span>
                        </div>
                        <p class="text-gray-400 mb-4 max-w-md">
                            Platform serbaguna yang memudahkan kamu membeli, menyewa, atau meminjam barang apapun. Making all your needs easier.
                        </p>
                        <div class="flex space-x-4">
                            <a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                                </svg>
                            </a>
                            <a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                                </svg>
                            </a>
                            <a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <!-- Quick Links -->
                    <div>
                        <h4 class="text-lg font-semibold mb-4">Quick Links</h4>
                        <ul class="space-y-2">
                            <li><a href="#beranda" class="text-gray-400 hover:text-white transition-colors duration-200">Beranda</a></li>
                            <li><a href="/#/community" class="text-gray-400 hover:text-white transition-colors duration-200">Komunitas</a></li>
                            <li><a href="/#/login" class="text-gray-400 hover:text-white transition-colors duration-200">Masuk</a></li>
                            <li><a href="/#/register" class="text-gray-400 hover:text-white transition-colors duration-200">Daftar</a></li>
                        </ul>
                    </div>

                    <!-- Support -->
                    <div>
                        <h4 class="text-lg font-semibold mb-4">Bantuan</h4>
                        <ul class="space-y-2">
                            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Pusat Bantuan</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Syarat & Ketentuan</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Kebijakan Privasi</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">Kontak Kami</a></li>
                        </ul>
                    </div>
                </div>

                <div class="border-t border-gray-800 mt-8 pt-8 text-left">
                    <p class="text-gray-400">
                        © 2025 Pinjemin. All rights reserved. Made with ❤️ by Pinjemin Team.
                    </p>
                </div>
            </div>
        </footer>
    `
  }
}

customElements.define("landing-page", LandingPage)
