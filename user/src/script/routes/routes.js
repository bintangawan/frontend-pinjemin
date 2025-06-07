import Utils from "../utils/utils.js"
import PushNotificationHelper from "../utils/push-notification-helper.js"

// Function to manage app bar visibility
const manageAppBar = (show = true) => {
  const appBarContainer = document.getElementById("app-bar-container")

  if (show) {
    if (appBarContainer && !appBarContainer.querySelector("app-bar")) {
      appBarContainer.innerHTML = "<app-bar></app-bar>"
    }
  } else {
    if (appBarContainer) {
      appBarContainer.innerHTML = ""
    }
  }
}

// Function to manage footer visibility
const manageFooter = (show = true) => {
  const footer = document.querySelector("footer")
  if (footer) {
    footer.style.display = show ? "block" : "none"
  }
}

// Check if user needs to enable notifications
const checkNotificationRequirement = async () => {
  const token = localStorage.getItem("token")

  // If not authenticated, no need to check notifications
  if (!token) {
    return { canProceed: true, needsSetup: false }
  }

  try {
    const helper = new PushNotificationHelper()
    const notificationStatus = await helper.needsNotificationSetup()

    console.log("Notification requirement check:", notificationStatus)
    return notificationStatus
  } catch (error) {
    console.error("Error checking notification requirement:", error)
    // On error, allow access but log the issue
    return { canProceed: true, needsSetup: false, reason: "error" }
  }
}

// Show notification permission popup
const showNotificationPopup = (reason) => {
  const notificationPopup = document.querySelector("notification-permission-popup")
  if (notificationPopup) {
    notificationPopup.triggerPopup(reason)
  }
}

// Enhanced authentication check that also verifies notification requirement
const checkAuthenticatedWithNotification = async (mainContent, renderFn, ...args) => {
  if (!Utils.isAuthenticated()) {
    window.location.hash = "#/login"
    return
  }

  // Show loading screen while checking notification status
  mainContent.innerHTML = `
    <div class="flex items-center justify-center min-h-screen bg-gray-50">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Memeriksa Status Aplikasi</h2>
        <p class="text-gray-600">Mohon tunggu sebentar...</p>
      </div>
    </div>
  `

  try {
    // Check notification requirement
    const notificationStatus = await checkNotificationRequirement()

    if (!notificationStatus.canProceed) {
      // Show appropriate message based on reason
      let message = "Mohon aktifkan notifikasi untuk melanjutkan..."
      let showPopup = true

      switch (notificationStatus.reason) {
        case "permission_denied":
          message = "Notifikasi diblokir. Mohon aktifkan di pengaturan browser..."
          showPopup = false
          break
        case "missing_server_subscription":
          message = "Mohon daftarkan ulang notifikasi..."
          break
        case "permission_not_requested":
          message = "Mohon aktifkan notifikasi untuk melanjutkan..."
          break
        case "resubscribe":
          message = "Kami mendeteksi notifikasi Anda nonaktif. Klik di bawah untuk mengaktifkannya kembali."
          break
        default:
          message = "Mohon aktifkan notifikasi untuk melanjutkan..."
      }

      mainContent.innerHTML = `
        <div class="flex items-center justify-center min-h-screen bg-gray-50">
          <div class="text-center max-w-md mx-auto p-6">
            <div class="bg-yellow-100 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Notifikasi Diperlukan</h2>
            <p class="text-gray-600 mb-4">${message}</p>
            ${
              notificationStatus.reason === "permission_denied"
                ? `
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p class="text-sm text-red-700">
                  Untuk mengaktifkan notifikasi yang diblokir:
                  <br>1. Klik ikon gembok di address bar
                  <br>2. Pilih "Izinkan" untuk notifikasi
                  <br>3. Refresh halaman ini
                </p>
              </div>
              <button onclick="window.location.reload()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Refresh Halaman
              </button>
            `
                : ""
            }
          </div>
        </div>
      `

      if (showPopup) {
        setTimeout(() => {
          showNotificationPopup(notificationStatus.reason)
        }, 500)
      }

      return
    }

    // If all checks pass, render the component
    renderFn(mainContent, ...args)
  } catch (error) {
    console.error("Error in authentication check:", error)
    // On error, show error message but allow access
    mainContent.innerHTML = `
      <div class="flex items-center justify-center min-h-screen bg-gray-50">
        <div class="text-center max-w-md mx-auto p-6">
          <div class="bg-red-100 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Terjadi Kesalahan</h2>
          <p class="text-gray-600 mb-4">Tidak dapat memeriksa status notifikasi. Melanjutkan ke aplikasi...</p>
        </div>
      </div>
    `

    setTimeout(() => {
      renderFn(mainContent, ...args)
    }, 2000)
  }
}

const checkAuthenticated = (mainContent, renderFn, ...args) => {
  if (Utils.isAuthenticated()) {
    renderFn(mainContent, ...args)
  } else {
    window.location.hash = "#/login"
  }
}

const checkUnauthenticated = (mainContent, renderFn, ...args) => {
  if (!Utils.isAuthenticated()) {
    renderFn(mainContent, ...args)
  } else {
    window.location.hash = "#/home" // Changed from "#/" to "#/home"
  }
}

export const routes = {
  // Main route - requires authentication AND notification setup
  "/": (mainContent) => {
    manageAppBar(false) // Hide app bar for landing page
    manageFooter(false) // Hide default footer for landing page
    mainContent.innerHTML = "<landing-page></landing-page>"
  },
  "/home": (mainContent) => {
    manageAppBar(true)
    manageFooter(true)
    checkAuthenticatedWithNotification(mainContent, (mc) => {
      mc.innerHTML = "<all-product></all-product>"
    })
  },

  // Product detail - requires authentication AND notification setup
  "/items/:id": (mainContent, id) => {
    manageAppBar(true)
    manageFooter(true)
    checkAuthenticatedWithNotification(
      mainContent,
      (mc, itemId) => {
        mc.innerHTML = `<detail-product item-id="${itemId}"></detail-product>`
      },
      id,
    )
  },

  // Transaction detail - requires authentication AND notification setup
  "/transactions/:id": (mainContent, id) => {
    manageAppBar(true)
    manageFooter(true)
    checkAuthenticatedWithNotification(
      mainContent,
      (mc, transactionId) => {
        mc.innerHTML = `<detail-transaction-page transaction-id="${transactionId}"></detail-transaction-page>`
      },
      id,
    )
  },

  // Notifications page - requires authentication AND notification setup
  "/notifications": (mainContent) => {
    manageAppBar(true)
    manageFooter(true)
    checkAuthenticatedWithNotification(mainContent, (mc) => {
      mc.innerHTML = "<notifications-page></notifications-page>"
    })
  },

  // Auth routes - don't require notification setup, hide app bar and footer
  "/login": (mainContent) => {
    manageAppBar(false) // Hide app bar for login page
    manageFooter(false) // Hide footer for login page
    checkUnauthenticated(mainContent, (mc) => {
      mc.innerHTML = "<login-page></login-page>"
    })
  },
  "/register": (mainContent) => {
    manageAppBar(false) // Hide app bar for register page
    manageFooter(false) // Hide footer for register page
    checkUnauthenticated(mainContent, (mc) => {
      mc.innerHTML = "<register-page></register-page>"
    })
  },

  // Protected routes - require authentication AND notification setup
  "/cart": (mainContent) => {
    checkAuthenticatedWithNotification(mainContent, (mc) => {
      mc.innerHTML = "<h1>Cart Page (Requires Login)</h1>"
    })
  },
  "/my-rentals": (mainContent) => {
    manageAppBar(true)
    manageFooter(true)
    checkAuthenticatedWithNotification(mainContent, (mc) => {
      mc.innerHTML = "<my-transactions-page></my-transactions-page>"
    })
  },
  "/profile": (mainContent) => {
    manageAppBar(true)
    manageFooter(true)
    checkAuthenticatedWithNotification(mainContent, (mc) => {
      mc.innerHTML = "<profile-page></profile-page>"
    })
  },
  "/my-items": (mainContent) => {
    manageAppBar(true)
    manageFooter(true)
    checkAuthenticatedWithNotification(mainContent, (mc) => {
      mc.innerHTML = "<my-items-page></my-items-page>"
    })
  },
  "/my-transactions": (mainContent) => {
    manageAppBar(true)
    manageFooter(true)
    checkAuthenticatedWithNotification(mainContent, (mc) => {
      mc.innerHTML = "<my-transactions-page></my-transactions-page>"
    })
  },
  "/my-sales": (mainContent) => {
    manageAppBar(true)
    manageFooter(true)
    checkAuthenticatedWithNotification(mainContent, (mc) => {
      mc.innerHTML = "<my-seller-transactions-page></my-seller-transactions-page>"
    })
  },

  // Community page - public access (no authentication required)
  "/community": (mainContent) => {
    manageAppBar(true)
    manageFooter(true)
    mainContent.innerHTML = "<community-page></community-page>"
  },
  // Community page - public access (no authentication required)
  "/hobby": (mainContent) => {
    manageAppBar(true)
    manageFooter(true)
    mainContent.innerHTML = "<hobby-page></hobby-page>"
  },
}
