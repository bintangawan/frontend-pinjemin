import { apiGet, apiPatch } from "../utils/apiService.js"

class NotificationList extends HTMLElement {
  constructor() {
    super()
    this.notifications = []
    this.isLoading = false
    this.page = 1
    this.hasMore = true
  }

  connectedCallback() {
    this.render()
    this.loadNotifications()
    this.setupEventListeners()
  }

  disconnectedCallback() {
    // Clean up event listeners
    window.removeEventListener("notification-received", this.handleNewNotification)
  }

  setupEventListeners() {
    // Listen for new notifications
    window.addEventListener("notification-received", this.handleNewNotification.bind(this))

    // Setup click handlers
    this.addEventListener("click", this.handleClick.bind(this))
  }

  handleClick(event) {
    const notificationItem = event.target.closest(".notification-item")
    if (notificationItem) {
      const notificationId = notificationItem.dataset.notificationId
      const notificationType = notificationItem.dataset.notificationType
      const targetUrl = notificationItem.dataset.targetUrl

      this.markAsRead(notificationId)

      if (targetUrl) {
        window.location.hash = targetUrl
      }
    }

    // Mark all as read button
    if (event.target.closest("#mark-all-read-btn")) {
      this.markAllAsRead()
    }

    // Load more button
    if (event.target.closest("#load-more-btn")) {
      this.loadNotifications()
    }
  }

  async loadNotifications() {
    if (this.isLoading || !this.hasMore) return

    this.isLoading = true
    this.updateLoadingState()

    try {
      const response = await apiGet(`/notifications?page=${this.page}&limit=10`)

      if (response && response.status === "success" && response.data) {
        const newNotifications = response.data.notifications || []

        if (this.page === 1) {
          this.notifications = newNotifications
        } else {
          this.notifications = [...this.notifications, ...newNotifications]
        }

        this.hasMore = newNotifications.length === 10
        this.page++

        this.renderNotifications()
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
      this.showError("Gagal memuat notifikasi")
    } finally {
      this.isLoading = false
      this.updateLoadingState()
    }
  }

  async markAsRead(notificationId) {
    try {
      await apiPatch(`/notifications/${notificationId}/read`)

      // Update local state
      const notification = this.notifications.find((n) => n.id === Number.parseInt(notificationId))
      if (notification) {
        notification.is_read = true
      }

      this.renderNotifications()

      // Dispatch event to update badge
      window.dispatchEvent(
        new CustomEvent("notification-read", {
          detail: { notificationId },
        }),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  async markAllAsRead() {
    try {
      await apiPatch("/notifications/read-all")

      // Update local state
      this.notifications.forEach((notification) => {
        notification.is_read = true
      })

      this.renderNotifications()

      // Dispatch event to update badge
      window.dispatchEvent(
        new CustomEvent("notification-read", {
          detail: { all: true },
        }),
      )
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  handleNewNotification(event) {
    const newNotification = event.detail
    this.notifications.unshift(newNotification)
    this.renderNotifications()
  }

  // ✅ Perbaikan di method getNotificationIcon dan getTargetUrl
getNotificationIcon(type) {
  // ✅ Tambahkan fallback untuk type yang undefined
  const notificationType = type || 'general';
  
  switch (notificationType) {
    case "transaction":
      return `
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
        </svg>
      `
    case "message":
      return `
        <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.524A11.956 11.956 0 012.944 18.5c-.666-.806-.944-1.743-.944-2.75 0-1.257.5-2.5 1.5-3.5L4 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
        </svg>
      `
    case "rent_reminder":
      return `
        <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      `
    default:
      return `
        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
      `
  }
}

getTargetUrl(notification) {
  // ✅ Perbaiki akses ke data notifikasi
  const notificationType = notification.type || 'general';
  
  switch (notificationType) {
    case "transaction":
      // ✅ Cek multiple possible data structures
      return `#/transactions/${notification.transaction_id || notification.data?.transactionId || ""}`;
    case "message":
      return `#/messages/${notification.related_user_id || notification.data?.senderId || ""}`;
    case "rent_reminder":
      return "#/my-rentals";
    default:
      return "#/notifications";
  }
}


  formatTimeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) {
      return "Baru saja"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} menit yang lalu`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} jam yang lalu`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} hari yang lalu`
    }
  }

  // ✅ Perbaikan di renderNotifications untuk debugging
renderNotifications() {
  const container = this.querySelector("#notifications-container")
  if (!container) return

  if (this.notifications.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        <p class="text-gray-500">Belum ada notifikasi</p>
      </div>
    `
    return
  }

  const notificationsHtml = this.notifications
    .map((notification) => {
      
      // ✅ Pastikan type tersedia
      const notificationType = notification.type || 'general';
      
      return `
        <div class="notification-item p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${!notification.is_read ? "bg-blue-50" : ""}"
             data-notification-id="${notification.id}"
             data-notification-type="${notificationType}"
             data-target-url="${this.getTargetUrl(notification)}">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0 mt-1">
              ${this.getNotificationIcon(notificationType)}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-gray-900 truncate">
                  ${notification.title || 'Notifikasi'}
                </p>
                ${!notification.is_read ? '<div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>' : ""}
              </div>
              <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                ${notification.message}
              </p>
              <!-- ✅ Tambahkan badge untuk rent reminder -->
              ${notificationType === 'rent_reminder' ? 
                '<span class="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full mt-2">Pengingat Sewa</span>' : 
                ''}
              <p class="text-xs text-gray-400 mt-2">
                ${this.formatTimeAgo(notification.created_at)}
              </p>
            </div>
          </div>
        </div>
      `;
    })
    .join("")

  container.innerHTML = notificationsHtml


    // Update load more button
    const loadMoreBtn = this.querySelector("#load-more-btn")
    if (loadMoreBtn) {
      if (this.hasMore) {
        loadMoreBtn.classList.remove("hidden")
      } else {
        loadMoreBtn.classList.add("hidden")
      }
    }
  }

  updateLoadingState() {
    const loadMoreBtn = this.querySelector("#load-more-btn")
    if (loadMoreBtn) {
      if (this.isLoading) {
        loadMoreBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-600 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Memuat...
        `
        loadMoreBtn.disabled = true
      } else {
        loadMoreBtn.innerHTML = "Muat Lebih Banyak"
        loadMoreBtn.disabled = false
      }
    }
  }

  showError(message) {
    const container = this.querySelector("#notifications-container")
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8">
          <svg class="w-16 h-16 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-red-500">${message}</p>
          <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onclick="this.closest('notification-list').loadNotifications()">
            Coba Lagi
          </button>
        </div>
      `
    }
  }

  render() {
    this.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg border border-gray-200 max-w-md w-full max-h-96 flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Notifikasi</h3>
          <button id="mark-all-read-btn" class="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Tandai Semua Dibaca
          </button>
        </div>

        <!-- Notifications Container -->
        <div id="notifications-container" class="flex-1 overflow-y-auto">
          <!-- Notifications will be rendered here -->
        </div>

        <!-- Load More Button -->
        <div class="p-4 border-t border-gray-200">
          <button id="load-more-btn" class="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 hidden">
            Muat Lebih Banyak
          </button>
        </div>
      </div>
    `
  }
}

customElements.define("notification-list", NotificationList)

export default NotificationList
