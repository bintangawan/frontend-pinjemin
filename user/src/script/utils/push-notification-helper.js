import { subscribeNotification, unsubscribeNotification, apiGet } from "./apiService.js"

class PushNotificationHelper {
  constructor() {
    this.vapidPublicKey = null // Jangan hardcode, ambil dari server
    this.isInitializing = false // Prevent multiple initialization
  }

  // ===== VAPID Key Management =====
  async getVapidPublicKey() {
    try {
      const response = await apiGet("/notifications/vapid-public-key")
      if (response && response.status === "success" && response.data && response.data.publicKey) {
        this.vapidPublicKey = response.data.publicKey
        console.log("VAPID public key retrieved from server:", this.vapidPublicKey)
        return this.vapidPublicKey
      }
      console.error("Failed to get VAPID public key from server")
      return null
    } catch (error) {
      console.error("Error getting VAPID public key:", error)
      return null
    }
  }

  // ===== Service Worker Management =====
  async registerServiceWorker() {
    try {
      if (!("serviceWorker" in navigator)) {
        console.error("Service workers are not supported.")
        return null
      }

      // ✅ Cek apakah service worker sudah terdaftar
      const registrations = await navigator.serviceWorker.getRegistrations()

      for (const registration of registrations) {
        if (registration.active && registration.active.scriptURL.includes("sw.bundle.js")) {
          console.log("Service Worker sudah terdaftar:", registration)
          return registration
        }
      }

      // ✅ Jika belum ada, baru register
      console.log("No existing service worker found, registering new one...")
      const registration = await navigator.serviceWorker.register("/sw.bundle.js")

      // ✅ Tunggu sampai service worker active
      if (registration.installing) {
        await new Promise((resolve) => {
          registration.installing.addEventListener("statechange", (e) => {
            if (e.target.state === "activated") {
              console.log("Service worker activated")
              resolve()
            }
          })
        })
      }

      console.log("Service Worker registered successfully:", registration)
      return registration
    } catch (error) {
      console.error("Service Worker registration failed:", error)
      return null
    }
  }

  // ===== Notification Permission =====
  async requestPermission() {
    if (!("Notification" in window)) {
      console.log("Notifications are not supported in this browser")
      return false
    }

    const result = await Notification.requestPermission()
    console.log("Notification permission result:", result)

    if (result === "denied") {
      console.log("Notification permission denied")
      return false
    }

    if (result === "default") {
      console.log("Notification permission request was dismissed")
      return false
    }

    return result === "granted"
  }

  // ===== Support Checks =====
  isNotificationSupported() {
    if (!("Notification" in window)) {
      console.log("Notifications are not supported in this browser")
      return false
    }

    if (!("serviceWorker" in navigator)) {
      console.log("Service workers are not supported in this browser")
      return false
    }

    if (!("PushManager" in window)) {
      console.log("Push messaging is not supported in this browser")
      return false
    }

    return true
  }

  // ===== Server Subscription Status =====
  async checkServerSubscription() {
    try {
      const response = await apiGet("/notifications/subscription-status")
      console.log("Server subscription status:", response)

      if (response && response.status === "success") {
        return {
          hasSubscription: response.data.hasSubscription,
          isActive: response.data.isActive,
          subscription: response.data.subscription,
        }
      }

      return {
        hasSubscription: false,
        isActive: false,
        subscription: null,
      }
    } catch (error) {
      console.error("Error checking server subscription:", error)
      return {
        hasSubscription: false,
        isActive: false,
        subscription: null,
      }
    }
  }

  // ===== Subscription Management =====
  async subscribe(registration) {
    try {
      // ✅ Cek subscription yang sudah ada (sederhana)
      const existingSubscription = await this._getSubscription(registration)
      if (existingSubscription) {
        console.log("Already subscribed locally")

        // ✅ Verifikasi dengan server tanpa unsubscribe otomatis
        const serverStatus = await this.checkServerSubscription()
        if (serverStatus.hasSubscription && serverStatus.isActive) {
          console.log("Subscription also exists on server")
          return existingSubscription
        } else {
          console.log("Local subscription exists but not on server, sending to server...")
          // ✅ Coba kirim subscription yang ada ke server dulu
          try {
            await this._sendSubscriptionToServer(existingSubscription)
            return existingSubscription
          } catch (error) {
            console.log("Failed to send existing subscription to server, creating new one...")
            await existingSubscription.unsubscribe()
          }
        }
      }

      // ✅ Pastikan VAPID key sudah ada
      if (!this.vapidPublicKey) {
        console.error("VAPID public key not available")
        throw new Error("VAPID public key not available")
      }

      // ✅ Buat subscription baru
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlBase64ToUint8Array(this.vapidPublicKey),
      })

      console.log("Successfully subscribed to push notifications:", newSubscription)
      await this._sendSubscriptionToServer(newSubscription)

      return newSubscription
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error)
      throw error
    }
  }

  async unsubscribe(registration) {
    try {
      const subscription = await this._getSubscription(registration)
      if (!subscription) {
        console.log("No subscription found")
        return { error: false, message: "No subscription found" }
      }

      // ✅ Hapus dari server dulu
      try {
        await unsubscribeNotification(subscription.endpoint)
      } catch (error) {
        console.warn("Failed to unsubscribe from server:", error)
        // Lanjutkan untuk unsubscribe dari browser
      }

      // ✅ Hapus dari browser
      await subscription.unsubscribe()
      console.log("Successfully unsubscribed from push notifications")

      // ✅ Clear initialization flag
      this.markAsUninitialized()

      return { error: false, message: "Successfully unsubscribed" }
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error)
      throw error
    }
  }

  async _getSubscription(registration) {
    return await registration.pushManager.getSubscription()
  }

  // ===== Utility Functions =====
  _urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // ===== Server Communication =====
  async _sendSubscriptionToServer(subscription) {
    try {
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey("p256dh")))),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey("auth")))),
        },
      }

      const response = await subscribeNotification(subscriptionData)
      console.log("Subscription successfully sent to server:", response)
      return response
    } catch (error) {
      console.error("Failed to send subscription to server:", error)
      throw error
    }
  }

  // ===== Initialization Status =====
  isInitialized() {
    return localStorage.getItem("notification_initialized") === "true"
  }

  markAsInitialized() {
    localStorage.setItem("notification_initialized", "true")
  }

  markAsUninitialized() {
    localStorage.removeItem("notification_initialized")
  }

  // ===== Main Initialization Method =====
  async initializePushNotifications() {
    try {
      // ✅ Prevent multiple initialization
      if (this.isInitializing) {
        console.log("Push notification initialization already in progress")
        return false
      }

      this.isInitializing = true
      console.log("Starting push notification initialization...")

      // ✅ Check if notifications are supported
      if (!this.isNotificationSupported()) {
        console.log("Notifications not supported, skipping initialization")
        this.isInitializing = false
        return false
      }

      // ✅ PENTING: Ambil VAPID key dari server terlebih dahulu
      const vapidKey = await this.getVapidPublicKey()
      if (!vapidKey) {
        console.error("Failed to get VAPID public key from server")
        this.isInitializing = false
        return false
      }

      // ✅ Register service worker dengan pengecekan yang lebih baik
      const registration = await this.registerServiceWorker()
      if (!registration) {
        console.error("Failed to register service worker")
        this.isInitializing = false
        return false
      }

      // ✅ Request permission
      const permissionGranted = await this.requestPermission()
      if (!permissionGranted) {
        console.error("Notification permission not granted")
        this.isInitializing = false
        return false
      }

      // ✅ Subscribe to push notifications
      const subscription = await this.subscribe(registration)
      if (!subscription) {
        console.error("Failed to subscribe to push notifications")
        this.isInitializing = false
        return false
      }

      // ✅ Verify subscription was saved on server
      const serverStatus = await this.checkServerSubscription()
      if (!serverStatus.hasSubscription) {
        console.error("Subscription not found on server after initialization")
        this.isInitializing = false
        return false
      }

      // ✅ Mark as initialized
      this.markAsInitialized()
      this.isInitializing = false
      console.log("Push notifications initialized successfully")
      return true
    } catch (error) {
      console.error("Error initializing push notifications:", error)
      this.isInitializing = false
      return false
    }
  }

  // ===== ✅ PERBAIKAN: Strict Setup Check - WAJIB PUNYA SUBSCRIPTION =====
  async needsNotificationSetup() {
    try {
      // ✅ Jika tidak support, BLOCK aplikasi
      if (!this.isNotificationSupported()) {
        return {
          needsSetup: true,
          reason: "not_supported",
          canProceed: false, // ❌ BLOCK - tidak bisa pakai aplikasi
        }
      }

      const permission = Notification.permission
      const serverStatus = await this.checkServerSubscription()

      // ✅ Jika permission denied, BLOCK aplikasi
      if (permission === "denied") {
        console.log("Notification permission denied by user")
        return {
          needsSetup: true,
          reason: "permission_denied",
          canProceed: false, // ❌ BLOCK - tidak bisa pakai aplikasi
        }
      }

      // ✅ Jika ada subscription aktif, ALLOW aplikasi
      if (permission === "granted" && serverStatus.hasSubscription && serverStatus.isActive) {
        console.log("User has active subscription on server")
        return {
          needsSetup: false,
          reason: "already_subscribed",
          canProceed: true, // ✅ ALLOW - bisa pakai aplikasi
        }
      }

      // ✅ Jika permission granted tapi tidak ada subscription, BLOCK dan minta resubscribe
      if (permission === "granted" && !serverStatus.hasSubscription) {
        console.log("Permission granted but no server subscription, need to resubscribe")
        return {
          needsSetup: true,
          reason: "missing_server_subscription",
          canProceed: false, // ❌ BLOCK - harus resubscribe dulu
        }
      }

      // ✅ Jika permission belum diminta, BLOCK dan minta permission
      if (permission === "default") {
        console.log("Notification permission not requested yet")
        return {
          needsSetup: true,
          reason: "permission_not_requested",
          canProceed: false, // ❌ BLOCK - harus request permission dulu
        }
      }

      // ✅ Default: BLOCK jika kondisi tidak dikenali
      return {
        needsSetup: true,
        reason: "unknown",
        canProceed: false, // ❌ BLOCK - kondisi tidak dikenali
      }
    } catch (error) {
      console.error("Error checking notification setup needs:", error)
      return {
        needsSetup: true,
        reason: "error",
        canProceed: false, // ❌ BLOCK - ada error
      }
    }
  }
}

export default PushNotificationHelper
