import PushNotificationHelper from "../utils/push-notification-helper.js"

class NotificationPermissionPopup extends HTMLElement {
  constructor() {
    super()
    this.isShown = false
    this.currentReason = null
  }

  connectedCallback() {
    console.log("NotificationPermissionPopup connected")

    // Listen for login events
    window.addEventListener("userLoggedIn", this.handleUserLoggedIn.bind(this))

    // Listen for notifications activated event to refresh the page
    window.addEventListener("notificationsActivated", this.handleNotificationsActivated.bind(this))
  }

  disconnectedCallback() {
    window.removeEventListener("userLoggedIn", this.handleUserLoggedIn)
    window.removeEventListener("notificationsActivated", this.handleNotificationsActivated)
  }

  handleUserLoggedIn() {
    console.log("NotificationPermissionPopup: User logged in event received")

    // Wait a bit for the login process to complete
    setTimeout(() => {
      this.checkAndShowPopup()
    }, 1000)
  }

  handleNotificationsActivated() {
    console.log("NotificationPermissionPopup: Notifications activated, refreshing route")

    // Refresh the current route to show the actual content
    setTimeout(() => {
      const currentHash = window.location.hash
      if (currentHash && currentHash !== "#/login" && currentHash !== "#/register") {
        // Trigger router to re-evaluate the current route
        window.dispatchEvent(new HashChangeEvent("hashchange"))
      } else {
        // Default to home page
        window.location.hash = "#/"
      }
    }, 500)
  }

  async checkAndShowPopup() {
    const token = localStorage.getItem("token")

    if (!token) {
      console.log("No token found, skipping notification check")
      return
    }

    try {
      const helper = new PushNotificationHelper()
      const notificationStatus = await helper.needsNotificationSetup()

      console.log("Checking popup conditions:", notificationStatus)

      if (notificationStatus.needsSetup && !notificationStatus.canProceed) {
        console.log("Conditions met, showing notification popup")
        this.triggerPopup(notificationStatus.reason)
      } else {
        console.log("Conditions not met for showing popup:", notificationStatus.reason)
      }
    } catch (error) {
      console.error("Error checking notification status:", error)
    }
  }

  // Method to manually trigger popup with reason
  triggerPopup(reason = null) {
    if (this.isShown) {
      console.log("Popup already shown, skipping")
      return
    }

    this.currentReason = reason
    console.log("Showing notification permission popup for reason:", reason)
    this.showPopup()
  }

  showPopup() {
    if (this.isShown) return
    this.isShown = true

    console.log("Rendering notification permission popup")

    // Customize content based on reason
    let title = "Aktifkan Notifikasi"
    let description =
      "Untuk menggunakan <strong>Pinjemin</strong>, Anda <strong>wajib</strong> mengaktifkan notifikasi."
    let buttonText = "Aktifkan Notifikasi (Wajib)"
    let showRetryInfo = false

    switch (this.currentReason) {
      case "permission_denied":
        title = "Notifikasi Diblokir"
        description = "Notifikasi telah diblokir. Mohon aktifkan melalui pengaturan browser Anda."
        buttonText = "Coba Aktifkan Lagi"
        showRetryInfo = true
        break
      case "missing_server_subscription":
        title = "Perlu Daftar Ulang Notifikasi"
        description = "Notifikasi perlu didaftarkan ulang ke server. Ini hanya memerlukan satu klik."
        buttonText = "Daftar Ulang Notifikasi"
        break
      case "permission_not_requested":
        title = "Aktifkan Notifikasi"
        description =
          "Untuk menggunakan <strong>Pinjemin</strong>, Anda <strong>wajib</strong> mengaktifkan notifikasi."
        buttonText = "Aktifkan Notifikasi (Wajib)"
        break
      case "resubscribe":
        title = "Aktifkan Notifikasi"
        description =
          "Kami mendeteksi notifikasi Anda nonaktif. Klik di bawah untuk mengaktifkannya kembali."
        buttonText = "Aktifkan Notifikasi (Wajib)"
        break
    }

    this.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
          <div class="flex items-center mb-4">
            <div class="bg-blue-100 rounded-full p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900">${title}</h3>
          </div>
          
          <div class="mb-6">
            <p class="text-gray-700 mb-4 leading-relaxed">
              ${description}
            </p>
            
            ${
              showRetryInfo
                ? `
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p class="text-sm font-medium text-yellow-800 mb-2">
                  Cara mengaktifkan notifikasi yang diblokir:
                </p>
                <ol class="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Klik ikon gembok/info di address bar browser</li>
                  <li>Pilih "Izinkan" atau "Allow" untuk notifikasi</li>
                  <li>Klik tombol di bawah untuk mencoba lagi</li>
                </ol>
              </div>
            `
                : `
              <div class="bg-blue-50 rounded-lg p-4 mb-4">
                <p class="text-sm font-medium text-blue-800 mb-2">
                  Anda akan mendapat notifikasi untuk:
                </p>
                <ul class="text-sm text-blue-700 space-y-1">
                  <li class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    Status transaksi pembelian dan penjualan
                  </li>
                  <li class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    Pengingat jatuh tempo sewa
                  </li>
                  <li class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    Pesan baru dari pengguna lain
                  </li>
                </ul>
              </div>
            `
            }
            
            <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p class="text-sm text-red-700 font-medium">
                ⚠️ Wajib: Anda tidak dapat menggunakan aplikasi tanpa mengaktifkan notifikasi.
              </p>
            </div>
          </div>
          
          <div class="flex flex-col gap-3">
            <button id="notification-allow-btn" class="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              ${buttonText}
            </button>
          </div>
          
          <div id="error-message" class="hidden mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-600 text-sm"></p>
          </div>
        </div>
      </div>
    `

    // Add event listeners
    this.querySelector("#notification-allow-btn").addEventListener("click", () => {
      this.initializeNotifications()
    })

    // Prevent closing by clicking outside (since it's mandatory)
    this.querySelector(".fixed").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.showImportanceMessage()
      }
    })
  }

  showImportanceMessage() {
    const popup = this.querySelector(".bg-white")
    if (popup) {
      popup.classList.add("animate-bounce")

      // Show additional warning
      const existingWarning = this.querySelector("#mandatory-warning")
      if (!existingWarning) {
        const warningDiv = document.createElement("div")
        warningDiv.id = "mandatory-warning"
        warningDiv.className = "mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        warningDiv.innerHTML = `
          <p class="text-yellow-800 text-sm font-medium">
            🚨 Notifikasi wajib diaktifkan untuk melanjutkan menggunakan aplikasi!
          </p>
        `

        const buttonContainer = this.querySelector(".flex.flex-col.gap-3")
        buttonContainer.parentNode.insertBefore(warningDiv, buttonContainer)
      }

      setTimeout(() => {
        popup.classList.remove("animate-bounce")
      }, 1000)
    }
  }

  hidePopup() {
    this.isShown = false
    this.currentReason = null
    this.innerHTML = ""
  }

  showError(message) {
    const errorDiv = this.querySelector("#error-message")
    if (!errorDiv) {
      console.error("Error message element not found. Popup may not be rendered.")
      return
    }

    const errorText = errorDiv.querySelector("p")
    if (errorDiv && errorText) {
      errorText.textContent = message
      errorDiv.classList.remove("hidden")
    }
  }

  async initializeNotifications() {
    try {
      console.log("Initializing push notifications...")

      const allowBtn = this.querySelector("#notification-allow-btn")
      if (allowBtn) {
        allowBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Mengaktifkan...
        `
        allowBtn.disabled = true
      }

      const helper = new PushNotificationHelper()
      const success = await helper.initializePushNotifications()

      if (success) {
        console.log("Push notifications initialized successfully")

        // Verify subscription was created on server
        const serverStatus = await helper.checkServerSubscription()
        if (serverStatus.hasSubscription && serverStatus.isActive) {
          this.hidePopup()
          this.showSuccessMessage()

          // Mark as completed so popup won't show again until token expires
          localStorage.setItem("notification_permission_completed", "true")

          // Dispatch event to notify app that notifications are ready
          window.dispatchEvent(new CustomEvent("notificationsActivated"))
        } else {
          throw new Error("Subscription not found on server after initialization")
        }
      } else {
        console.error("Failed to initialize push notifications")
        this.showError("Gagal mengaktifkan notifikasi. Silakan coba lagi atau periksa pengaturan browser Anda.")

        if (allowBtn) {
          allowBtn.innerHTML = "Coba Lagi (Wajib)"
          allowBtn.disabled = false
        }
      }
    } catch (error) {
      console.error("Error initializing notifications:", error)
      this.showError("Terjadi kesalahan saat mengaktifkan notifikasi. Silakan coba lagi.")

      const allowBtn = this.querySelector("#notification-allow-btn")
      if (allowBtn) {
        allowBtn.innerHTML = "Coba Lagi (Wajib)"
        allowBtn.disabled = false
      }
    }
  }

  showSuccessMessage() {
    const successDiv = document.createElement("div")
    successDiv.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[10000] transform transition-all duration-300"
    successDiv.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
        Notifikasi berhasil diaktifkan! Selamat menggunakan Pinjemin.
      </div>
    `

    document.body.appendChild(successDiv)

    setTimeout(() => {
      successDiv.style.transform = "translateX(100%)"
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv)
        }
      }, 300)
    }, 4000)
  }
}

customElements.define("notification-permission-popup", NotificationPermissionPopup)

export default NotificationPermissionPopup
