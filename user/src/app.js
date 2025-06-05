import "./script/components/index.js"
import "./styles/style.css"

// Import notification components dan helper
import "./script/components/notification-permission-popup.js"
import "./script/components/notification-badge.js"
import "./script/components/notification-list.js"
import "./script/components/notifications-page.js"
import PushNotificationHelper from "./script/utils/push-notification-helper.js"

// Import routing logic
import { getActiveRoute, parseActivePathname } from "./script/routes/url-parser.js"
import { routes } from "./script/routes/routes.js"

const mainContent = document.querySelector("main")
const searchBarElement = document.querySelector("search-bar")

// ✅ Global helper instance untuk mencegah multiple instances
let globalNotificationHelper = null

const router = () => {
  const activeRoute = getActiveRoute()
  const routeHandler = routes[activeRoute]

  const hideSearchBar = activeRoute === "/login" || activeRoute === "/register"

  if (searchBarElement) {
    if (hideSearchBar) {
      searchBarElement.classList.add("hidden")
    } else {
      searchBarElement.classList.remove("hidden")
    }
  }

  if (routeHandler) {
    const params = parseActivePathname()

    if (activeRoute === "/items/:id") {
      routeHandler(mainContent, params ? params.id : undefined)
    } else if (activeRoute === "/transactions/:id") {
      routeHandler(mainContent, params ? params.id : undefined)
    } else {
      routeHandler(mainContent)
    }
  } else {
    window.location.hash = "#/"
  }
}

// ✅ PERBAIKAN: Strict Notification System - WAJIB PUNYA SUBSCRIPTION
const initializeNotificationSystem = async () => {
  console.log("Initializing notification system...")

  // Add notification permission popup to the DOM
  const existingPopup = document.querySelector("notification-permission-popup")
  if (!existingPopup) {
    const notificationPopup = document.createElement("notification-permission-popup")
    document.body.appendChild(notificationPopup)
  }

  // ✅ Buat global helper instance
  if (!globalNotificationHelper) {
    globalNotificationHelper = new PushNotificationHelper()
  }

  const token = localStorage.getItem("token")
  if (!token) {
    console.log("No token found, skipping notification initialization")
    return
  }

  // ✅ STRICT: Cek apakah perlu setup notifications
  try {
    const setupStatus = await globalNotificationHelper.needsNotificationSetup()
    console.log("Notification setup status:", setupStatus)

    // ✅ Jika sudah ada subscription yang valid, ALLOW
    if (!setupStatus.needsSetup && setupStatus.canProceed) {
      console.log("Notifications already set up properly - user can proceed")
      localStorage.setItem("notification_permission_completed", "true")
      return
    }

    // ✅ Jika TIDAK BISA PROCEED, BLOCK aplikasi dan show popup
    if (!setupStatus.canProceed) {
      console.warn("User cannot proceed without notifications:", setupStatus.reason)
      localStorage.removeItem("notification_permission_completed")

      // ✅ Show popup berdasarkan reason
      const popup = document.querySelector("notification-permission-popup")
      if (popup && typeof popup.triggerPopup === "function") {
        if (setupStatus.reason === "permission_denied") {
          popup.triggerPopup("permission_denied")
        } else if (setupStatus.reason === "missing_server_subscription") {
          popup.triggerPopup("resubscribe")
        } else if (setupStatus.reason === "permission_not_requested") {
          popup.triggerPopup("initial")
        } else {
          popup.triggerPopup("error")
        }
      }
      return
    }

    // ✅ Jika bisa proceed dan permission granted, coba auto-initialize
    if (setupStatus.canProceed && Notification.permission === "granted") {
      console.log("Permission granted but subscription missing, auto-initializing...")

      const success = await globalNotificationHelper.initializePushNotifications()
      if (success) {
        console.log("Auto-initialization successful")
        localStorage.setItem("notification_permission_completed", "true")
        window.dispatchEvent(new CustomEvent("notificationsActivated"))
      } else {
        console.warn("Auto-initialization failed, showing popup")
        localStorage.removeItem("notification_permission_completed")

        const popup = document.querySelector("notification-permission-popup")
        if (popup && typeof popup.triggerPopup === "function") {
          popup.triggerPopup("resubscribe")
        }
      }
    }
  } catch (error) {
    console.error("Error during notification system initialization:", error)
    localStorage.removeItem("notification_permission_completed")

    // ✅ Show error popup
    const popup = document.querySelector("notification-permission-popup")
    if (popup && typeof popup.triggerPopup === "function") {
      popup.triggerPopup("error")
    }
  }
}

// ✅ PERBAIKAN: Strict recheck - WAJIB SHOW POPUP jika subscription hilang
const recheckNotificationSubscription = async () => {
  const token = localStorage.getItem("token")
  if (!token) return

  // ✅ Gunakan global helper instance
  if (!globalNotificationHelper) {
    globalNotificationHelper = new PushNotificationHelper()
  }

  try {
    console.log("Rechecking notification subscription...")

    const setupStatus = await globalNotificationHelper.needsNotificationSetup()

    // ✅ STRICT: Jika perlu setup dan TIDAK BISA PROCEED, BLOCK dan show popup
    if (setupStatus.needsSetup && !setupStatus.canProceed) {
      console.warn("Subscription missing and user cannot proceed:", setupStatus.reason)
      localStorage.removeItem("notification_permission_completed")

      const popup = document.querySelector("notification-permission-popup")
      if (popup && typeof popup.triggerPopup === "function") {
        if (setupStatus.reason === "missing_server_subscription") {
          popup.triggerPopup("resubscribe")
        } else if (setupStatus.reason === "permission_denied") {
          popup.triggerPopup("permission_denied")
        } else {
          popup.triggerPopup("error")
        }
      }
      return
    }

    // ✅ Jika perlu setup tapi bisa proceed dan permission granted, coba auto-fix
    if (setupStatus.needsSetup && setupStatus.canProceed && Notification.permission === "granted") {
      console.log("Attempting auto-reinitialization...")

      const success = await globalNotificationHelper.initializePushNotifications()
      if (success) {
        console.log("Auto-reinitialization successful")
        localStorage.setItem("notification_permission_completed", "true")
        window.dispatchEvent(new CustomEvent("notificationsActivated"))
      } else {
        console.warn("Auto-reinitialization failed, showing popup")
        localStorage.removeItem("notification_permission_completed")

        const popup = document.querySelector("notification-permission-popup")
        if (popup && typeof popup.triggerPopup === "function") {
          popup.triggerPopup("resubscribe")
        }
      }
    }
  } catch (error) {
    console.error("Error during notification subscription recheck:", error)
    localStorage.removeItem("notification_permission_completed")

    // ✅ Show error popup
    const popup = document.querySelector("notification-permission-popup")
    if (popup && typeof popup.triggerPopup === "function") {
      popup.triggerPopup("error")
    }
  }
}

// Function to check if JWT token is valid/not expired
const checkTokenValidity = () => {
  const token = localStorage.getItem("token")
  if (!token) return false

  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split(".")[1]))
    const currentTime = Math.floor(Date.now() / 1000)

    if (payload.exp && payload.exp < currentTime) {
      console.log("Token expired, cleaning up...")

      // ✅ Clean up notification data on token expiry
      localStorage.removeItem("notification_permission_completed")
      localStorage.removeItem("notification_initialized")

      // Dispatch token expired event
      window.dispatchEvent(new CustomEvent("tokenExpired"))
      return false
    }

    return true
  } catch (error) {
    console.error("Error checking token validity:", error)
    return false
  }
}

// ✅ Service Worker Registration - biarkan helper yang handle
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()

      if (registration) {
        console.log("Service Worker found, setting up event listeners")

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("New service worker available")
              }
            })
          }
        })
      }
    } catch (error) {
      console.error("Error setting up service worker event listeners:", error)
    }
  })
}

// Listen for service worker messages
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    const { type, notificationData } = event.data

    switch (type) {
      case "NOTIFICATION_CLICKED":
        console.log("Notification clicked:", notificationData)
        break

      case "NOTIFICATION_DISMISSED":
        console.log("Notification dismissed:", notificationData)
        break

      case "NAVIGATE_TO":
        console.log("Navigate to:", event.data.url)
        window.location.hash = event.data.url
        break

      default:
        console.log("Unknown service worker message:", type)
    }
  })
}

// ✅ Handle user logout
window.addEventListener("userLoggedOut", () => {
  console.log("User logged out, cleaning up notifications...")

  localStorage.removeItem("notification_permission_completed")
  localStorage.removeItem("notification_initialized")
  globalNotificationHelper = null
})

// ✅ Handle user login
window.addEventListener("userLoggedIn", async () => {
  console.log("User logged in, initializing notifications...")

  setTimeout(async () => {
    await initializeNotificationSystem()
  }, 1000)
})

// Check token validity periodically
setInterval(() => {
  checkTokenValidity()
}, 60000)

// ✅ PERBAIKAN: Strict DOM content loaded handler
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM Content Loaded - Initializing app...")

  const isValidToken = checkTokenValidity()

  // ✅ STRICT: Initialize notification system dan BLOCK jika perlu
  if (isValidToken) {
    try {
      await initializeNotificationSystem()

      // ✅ Recheck subscription setelah initialization
      setTimeout(async () => {
        await recheckNotificationSubscription()
      }, 2000)
    } catch (error) {
      console.error("Error during notification initialization:", error)
    }
  }

  if (!window.location.hash || window.location.hash === "#") {
    window.location.hash = "#/"
  } else {
    router()
  }
})

// Handle hash changes
window.addEventListener("hashchange", () => {
  checkTokenValidity()
  router()
})

// ✅ Export global helper
window.getNotificationHelper = () => {
  if (!globalNotificationHelper) {
    globalNotificationHelper = new PushNotificationHelper()
  }
  return globalNotificationHelper
}

// ✅ Handle page visibility change untuk strict recheck
document.addEventListener("visibilitychange", async () => {
  if (!document.hidden && localStorage.getItem("token")) {
    setTimeout(async () => {
      await recheckNotificationSubscription()
    }, 1000)
  }
})
