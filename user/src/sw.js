import { precacheAndRoute } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { CacheFirst, NetworkOnly } from "workbox-strategies"
import { CacheableResponsePlugin } from "workbox-cacheable-response"
import { ExpirationPlugin } from "workbox-expiration"

// Disable Workbox logging
self.__WB_DISABLE_DEV_LOGS = true

// Precache essential static assets only
precacheAndRoute(self.__WB_MANIFEST || [])

// Minimal caching - only fonts
registerRoute(
  ({ request }) => request.destination === "font",
  new CacheFirst({
    cacheName: "fonts-cache",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 365 * 24 * 60 * 60,
      }),
    ],
  }),
)

// Use NetworkOnly for everything else - no caching
registerRoute(
  ({ request }) =>
    request.destination === "style" || request.destination === "script" || request.destination === "image",
  new NetworkOnly(),
)

registerRoute(({ url }) => url.pathname.startsWith("/api/"), new NetworkOnly())

registerRoute(({ request }) => request.mode === "navigate", new NetworkOnly())

// Constants for notification handling
const BASE_URL = "http://31.97.67.212:5000/api"
const NOTIFICATION_CACHE = "notifications-cache"
const APP_NAME = "Pinjemin"
const DEFAULT_ICON = "./logo-pinjemin.png"
const DEFAULT_BADGE = "./logo-pinjemin.png"

// Store notifications in IndexedDB for offline access
async function storeNotification(notification) {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE)
    const response = new Response(JSON.stringify(notification))
    await cache.put(`notification-${notification.id || Date.now()}`, response)
  } catch (error) {
    // Silent error handling - no console.log
  }
}

// Get stored notifications from cache
async function getStoredNotifications() {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE)
    const keys = await cache.keys()
    const notifications = []

    for (const key of keys) {
      if (key.url.includes("notification-")) {
        const response = await cache.match(key)
        const notification = await response.json()
        notifications.push(notification)
      }
    }

    return notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (error) {
    return []
  }
}

// Generate notification URL based on type
function generateNotificationUrl(data) {
  const baseUrl = self.location.origin

  switch (data.type) {
    case "transaction":
      return `${baseUrl}/#/transactions/${data.transactionId}`
    case "message":
      return `${baseUrl}/#/messages/${data.senderId}`
    case "rent_reminder":
      return `${baseUrl}/#/my-rentals`
    default:
      return `${baseUrl}/#/notifications`
  }
}

// Handle push events - FIXED VERSION
self.addEventListener("push", (event) => {
  if (!event.data) {
    return
  }

  // Call waitUntil immediately with the entire async operation
  event.waitUntil(
    (async () => {
      try {
        const data = event.data.json()

        // Store notification for offline access
        await storeNotification(data)

        // Generate appropriate URL based on notification type
        const notificationUrl = generateNotificationUrl(data.data || {})

        // Create notification options with custom styling
        const options = {
          body: data.body || "Anda memiliki notifikasi baru",
          icon: data.icon || DEFAULT_ICON,
          badge: data.badge || DEFAULT_BADGE,
          image: data.image || null,
          tag: data.data?.type
            ? `${data.data.type}-${data.data.transactionId || data.data.messageId || Date.now()}`
            : `notification-${Date.now()}`,
          renotify: true,
          requireInteraction: data.data?.type === "rent_reminder" || false,
          silent: false,
          vibrate: [200, 100, 200],
          timestamp: Date.now(),
          data: {
            url: notificationUrl,
            type: data.data?.type || "general",
            transactionId: data.data?.transactionId,
            messageId: data.data?.messageId,
            senderId: data.data?.senderId,
            userId: data.data?.userId,
            reminderDay: data.data?.reminderDay,
            created_at: new Date().toISOString(),
            ...data.data,
          },
          actions: [
            {
              action: "view",
              title: "Lihat",
              icon: "/icons/view.png",
            },
            {
              action: "dismiss",
              title: "Tutup",
              icon: "/icons/close.png",
            },
          ],
        }

        // Customize notification based on type
        let title = data.title || `${APP_NAME} - Notifikasi Baru`

        if (data.data?.type === "transaction") {
          options.actions = [
            {
              action: "view_transaction",
              title: "Lihat Transaksi",
              icon: "/icons/transaction.png",
            },
            {
              action: "dismiss",
              title: "Tutup",
              icon: "/icons/close.png",
            },
          ]
        } else if (data.data?.type === "message") {
          options.actions = [
            {
              action: "reply",
              title: "Balas",
              icon: "/icons/reply.png",
            },
            {
              action: "view_message",
              title: "Lihat Pesan",
              icon: "/icons/message.png",
            },
            {
              action: "dismiss",
              title: "Tutup",
              icon: "/icons/close.png",
            },
          ]
        } else if (data.data?.type === "rent_reminder") {
          title = `${APP_NAME} - Pengingat Sewa`
          options.requireInteraction = true
          options.actions = [
            {
              action: "view_rental",
              title: "Lihat Pinjaman",
              icon: "/icons/rental.png",
            },
            {
              action: "extend_rental",
              title: "Perpanjang",
              icon: "/icons/extend.png",
            },
            {
              action: "dismiss",
              title: "Tutup",
              icon: "/icons/close.png",
            },
          ]
        }

        // Show notification
        return self.registration.showNotification(title, options)
      } catch (error) {
        // Fallback notification
        return self.registration.showNotification(`${APP_NAME} - Notifikasi Baru`, {
          body: "Anda memiliki notifikasi baru",
          icon: DEFAULT_ICON,
          badge: DEFAULT_BADGE,
          tag: "fallback-notification",
          data: {
            url: "/#/notifications",
            type: "general",
          },
        })
      }
    })(),
  )
})

// Handle notification click events - FIXED VERSION
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const action = event.action
  const notificationData = event.notification.data

  // Handle different actions
  let urlToOpen = notificationData?.url || "/#/notifications"

  switch (action) {
    case "dismiss":
      return

    case "view_transaction":
      urlToOpen = `/#/transactions/${notificationData?.transactionId}`
      break

    case "view_message":
      urlToOpen = `/#/messages/${notificationData?.senderId}`
      break

    case "reply":
      urlToOpen = `/#/messages/${notificationData?.senderId}?reply=true`
      break

    case "view_rental":
      urlToOpen = "/#/my-rentals"
      break

    case "extend_rental":
      urlToOpen = `/#/transactions/${notificationData?.transactionId}?action=extend`
      break

    case "view":
    default:
      break
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url.includes(urlToOpen.replace("/#", "")) && "focus" in client) {
            // Focus existing window and navigate if needed
            client.postMessage({
              type: "NAVIGATE_TO",
              url: urlToOpen,
              notificationData: notificationData,
            })
            return client.focus()
          }
        }

        // If no existing window/tab, open a new one
        if (clients.openWindow) {
          const fullUrl = self.location.origin + urlToOpen
          return clients.openWindow(fullUrl)
        }
      })
      .then((client) => {
        // Send message to mark notification as read
        if (client && notificationData) {
          client.postMessage({
            type: "NOTIFICATION_CLICKED",
            notificationData: notificationData,
            action: action,
          })
        }
      }),
  )
})

// Handle notification close events
self.addEventListener("notificationclose", (event) => {
  const notificationData = event.notification.data

  // Send analytics or tracking data
  if (notificationData?.type) {
    // Send message to main thread for analytics
    clients.matchAll({ type: "window" }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: "NOTIFICATION_DISMISSED",
          notificationData: notificationData,
        })
      })
    })
  }
})

// Handle messages from main thread
self.addEventListener("message", (event) => {
  const { type, payload } = event.data

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting()
      break

    case "GET_STORED_NOTIFICATIONS":
      event.waitUntil(
        getStoredNotifications().then((notifications) => {
          event.ports[0].postMessage({
            type: "STORED_NOTIFICATIONS",
            notifications,
          })
        }),
      )
      break

    case "CLEAR_NOTIFICATION_CACHE":
      event.waitUntil(
        caches.delete(NOTIFICATION_CACHE).then(() => {
          event.ports[0].postMessage({
            type: "NOTIFICATION_CACHE_CLEARED",
          })
        }),
      )
      break

    case "MARK_NOTIFICATION_READ":
      // Handle marking notification as read
      break

    case "UPDATE_NOTIFICATION_SETTINGS":
      // Handle notification settings update
      break

    default:
      break
  }
})

// Handle service worker installation
self.addEventListener("install", (event) => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Handle service worker activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    // Clean up old caches
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old cache versions and any image or page caches
            if (
              cacheName.includes("old-") ||
              cacheName.includes("v1-") ||
              cacheName.includes("images-cache") ||
              cacheName.includes("pages-cache") ||
              cacheName.includes("api-cache")
            ) {
              return caches.delete(cacheName)
            }
          }),
        ),
      )
      .then(() => {
        // Take control of all pages
        return self.clients.claim()
      }),
  )
})

// Handle background sync (for offline notification actions)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync-notifications") {
    event.waitUntil(syncPendingNotifications())
  } else if (event.tag === "background-sync-mark-read") {
    event.waitUntil(syncPendingMarkAsRead())
  }
})

// Function to sync pending notifications
async function syncPendingNotifications() {
  try {
    const storedNotifications = await getStoredNotifications()
    // Process any pending notification actions when back online
  } catch (error) {
    // Silent error handling
  }
}

// Function to sync pending mark-as-read actions
async function syncPendingMarkAsRead() {
  try {
    // Get pending mark-as-read actions from IndexedDB
    // Send them to the server when back online
  } catch (error) {
    // Silent error handling
  }
}
// Error handling
self.addEventListener("error", (event) => {
  console.error("Service worker error:", event.error)
})

self.addEventListener("unhandledrejection", (event) => {
  console.error("Service worker unhandled rejection:", event.reason)
})

console.log("Pinjemin Service Worker loaded successfully with minimal caching")