class LoginPage extends HTMLElement {
  constructor() {
    super()
    this.isLoading = false
  }

  connectedCallback() {
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    if (token) {
      // User is already logged in, redirect to home
      window.location.href = "/#/home"
      return
    }

    this.render()
    this.setupMobileMenuToggle()
    this.setupFormSubmission()
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
  }

  setupMobileMenuToggle() {
    console.log("Setting up mobile drawer toggle...")
    const mobileMenuButton = this.querySelector("#mobile-menu-button")
    const mobileDrawer = this.querySelector("#mobile-drawer")
    const drawerOverlay = this.querySelector("#drawer-overlay")
    const closeDrawerButton = this.querySelector("#close-drawer-button")

    if (mobileMenuButton && mobileDrawer && drawerOverlay) {
      console.log("Mobile drawer elements found. Setting up listeners.")

      // Open drawer
      this._mobileMenuButtonHandler = (event) => {
        console.log("Mobile menu button clicked.")
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
          console.log("Drawer link clicked, closing drawer.")
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

      console.log("Drawer opened")
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

      console.log("Drawer closed")
    }
  }

  render() {
    this.innerHTML = `
            <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
            
            * {
                font-family: 'Poppins', sans-serif;
            }
                .toast-slide-in {
                    animation: slideIn 0.3s ease-out;
                }
                
                .toast-slide-out {
                    animation: slideOut 0.3s ease-in;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
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
                        <img src="./pinjemin.png" class="mr-2 h-16 inline-block" alt="Pinjemin Logo">
                    </div>
                </div>

                <!-- Desktop Navigation (Hidden on mobile) -->
                <nav class="hidden md:flex items-center space-x-8 flex-1 justify-center">
                    <a href="/#/" class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                        Beranda
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
                    <img src="./pinjemin.png" class="h-8" alt="Pinjemin Logo">
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
                    </ul>
                </nav>
            </div>
        </div>
            
            <div class="min-h-screen flex items-center justify-center p-4 py-8 mt-8">
                <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                    <!-- Logo -->
                    <div class="text-center mb-6">
                        <img class="mx-auto h-16 w-16 rounded-xl object-cover shadow-lg" src="./pinjemin.png" alt="Pinjemin">
                        <h2 class="mt-4 text-2xl font-bold text-gray-900">Welcome Back</h2>
                        <p class="mt-1 text-sm text-gray-600">Sign in to your account</p>
                    </div>

                    <!-- Form -->
                    <form id="login-form" class="space-y-4">
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input 
                                id="email" 
                                name="email" 
                                type="email" 
                                autocomplete="email" 
                                required 
                                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                placeholder="Enter your email"
                            >
                        </div>

                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                id="password" 
                                name="password" 
                                type="password" 
                                autocomplete="current-password" 
                                required 
                                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                placeholder="Enter your password"
                            >
                        </div>

                        <button 
                            type="submit" 
                            id="submit-btn"
                            class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-h-[44px]"
                        >
                            <span id="btn-content">Sign In</span>
                        </button>
                    </form>

                    <!-- Register Link -->
                    <p class="mt-6 text-center text-sm text-gray-600">
                        Don't have an account?
                        <a href="/#/register" class="font-semibold text-purple-600 hover:text-purple-500 transition-colors duration-200">Create one here</a>
                    </p>
                </div>
            </div>
            
            <!-- Toast Container -->
            <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2"></div>
        `
  }

  showToast(title, message, type = "success") {
    const toastContainer = this.querySelector("#toast-container")
    const toast = document.createElement("div")

    const bgColor = type === "success" ? "bg-green-500" : "bg-red-500"
    const icon = type === "success" ? "✓" : "✕"

    toast.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center min-w-[320px] toast-slide-in`

    toast.innerHTML = `
            <div class="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white bg-opacity-20 rounded-full mr-3">
                <span class="text-sm font-bold">${icon}</span>
            </div>
            <div class="flex-1">
                <div class="font-semibold text-sm">${title}</div>
                <div class="text-xs opacity-90 mt-1">${message}</div>
            </div>
        `

    toastContainer.appendChild(toast)

    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.classList.remove("toast-slide-in")
      toast.classList.add("toast-slide-out")
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 4000)
  }

  setLoading(loading) {
    this.isLoading = loading
    const submitBtn = this.querySelector("#submit-btn")
    const btnContent = this.querySelector("#btn-content")

    if (loading) {
      submitBtn.disabled = true
      btnContent.textContent = "Signing In..."
    } else {
      submitBtn.disabled = false
      btnContent.textContent = "Sign In"
    }
  }

  setupFormSubmission() {
    const form = this.querySelector("#login-form")
    form.addEventListener("submit", async (event) => {
      event.preventDefault()

      // Check if user is already logged in
      const token = localStorage.getItem("token")
      if (token) {
        window.location.href = "/#/home"
        return
      }

      if (this.isLoading) return

      const formData = new FormData(form)
      const data = Object.fromEntries(formData.entries())

      console.log("Sending login data to API:", data)

      this.setLoading(true)

      try {
        const response = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (response.ok) {
          if (result.status === "success") {
            console.log("Login successful:", result)

            // Store token and user data in localStorage
            localStorage.setItem("token", result.token)
            localStorage.setItem("user", JSON.stringify(result.data.user))

            // Dispatch a custom event to notify other components
            const loginEvent = new CustomEvent("userLoggedIn", {
              detail: { user: result.data.user },
            })
            window.dispatchEvent(loginEvent)

            // Show success toast
            this.showToast("Login Successful!", "Welcome back! Redirecting to dashboard...", "success")

            // Redirect after a short delay to show the toast
            setTimeout(() => {
              window.location.href = "/#/home"
            }, 1500)
          } else {
            console.error("Login failed (API error):", result.message)
            this.showToast("Login Failed", result.message || "Invalid credentials", "error")
          }
        } else {
          console.error("Login failed (HTTP error):", response.status, result.message)
          this.showToast("Login Failed", result.message || "Please check your credentials", "error")
        }
      } catch (error) {
        console.error("Error during login API call:", error)
        this.showToast("Connection Error", "Unable to connect to server. Please try again.", "error")
      } finally {
        this.setLoading(false)
      }
    })
  }
}

customElements.define("login-page", LoginPage)
