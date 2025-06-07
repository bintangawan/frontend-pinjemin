import { getUnreadNotificationCount } from "../utils/apiService.js"

class NotificationBadge extends HTMLElement {
  constructor() {
    super()
    this.count = 0
    this.interval = null
    this.isDropdownOpen = false
  }

  connectedCallback() {
    this.render()

    // Only fetch count if user is authenticated
    const token = localStorage.getItem("token")
    if (token) {
      this.fetchUnreadCount()

      // Update unread count every minute
      this.interval = setInterval(() => {
        const currentToken = localStorage.getItem("token")
        if (currentToken) {
          this.fetchUnreadCount()
        }
      }, 60000)
    }

    // Listen for notification events
    window.addEventListener("notification-received", this.handleNotificationReceived.bind(this))
    window.addEventListener("notification-read", this.handleNotificationRead.bind(this))
    window.addEventListener("userLoggedIn", this.handleUserLoggedIn.bind(this))
    window.addEventListener("userLoggedOut", this.handleUserLoggedOut.bind(this))

    // Setup click handler
    this.addEventListener("click", this.handleClick.bind(this))

    // Close dropdown when clicking outside
    document.addEventListener("click", this.handleOutsideClick.bind(this))
  }

  disconnectedCallback() {
    if (this.interval) {
      clearInterval(this.interval)
    }

    window.removeEventListener("notification-received", this.handleNotificationReceived)
    window.removeEventListener("notification-read", this.handleNotificationRead)
    window.removeEventListener("userLoggedIn", this.handleUserLoggedIn)
    window.removeEventListener("userLoggedOut", this.handleUserLoggedOut)
    document.removeEventListener("click", this.handleOutsideClick)
  }

  handleUserLoggedIn() {
    // Reset count and fetch new data for the logged in user
    this.count = 0
    this.updateBadge()

    // Fetch unread count after a short delay to ensure user is fully logged in
    setTimeout(() => {
      this.fetchUnreadCount()

      // Start interval for periodic updates
      if (this.interval) {
        clearInterval(this.interval)
      }
      this.interval = setInterval(() => {
        const token = localStorage.getItem("token")
        if (token) {
          this.fetchUnreadCount()
        }
      }, 60000)
    }, 1000)
  }

  handleUserLoggedOut() {
    // Clear count and stop interval
    this.count = 0
    this.updateBadge()
    this.closeDropdown()

    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  handleClick(event) {
    event.preventDefault()
    event.stopPropagation()

    const bellButton = event.target.closest(".notification-bell-button")
    if (bellButton) {
      this.toggleDropdown()
    }
  }

  handleOutsideClick(event) {
    if (!this.contains(event.target)) {
      this.closeDropdown()
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen
    this.renderDropdown()
  }

  closeDropdown() {
    this.isDropdownOpen = false
    this.renderDropdown()
  }

  renderDropdown() {
    const existingDropdown = document.querySelector("#notification-dropdown")
    if (existingDropdown) {
      existingDropdown.remove()
    }

    if (this.isDropdownOpen) {
      const dropdown = document.createElement("div")
      dropdown.id = "notification-dropdown"
      dropdown.className = "absolute top-full right-0 mt-2 z-50"
      dropdown.innerHTML = "<notification-list></notification-list>"

      this.appendChild(dropdown)
    }
  }

  async fetchUnreadCount() {
    try {
      const response = await getUnreadNotificationCount()
      if (response && response.status === "success" && response.data) {
        this.updateCount(response.data.unread_count || 0)
      }
    } catch (error) {
      console.error("Error fetching unread notification count:", error)
      // If there's an auth error, reset count
      if (error.message.includes("Authentication failed")) {
        this.count = 0
        this.updateBadge()
      }
    }
  }

  updateCount(count) {
    this.count = count
    this.updateBadge()
  }

  handleNotificationReceived() {
    this.updateCount(this.count + 1)
  }

  handleNotificationRead(event) {
    const { all } = event.detail || {}
    if (all) {
      this.updateCount(0)
    } else {
      this.updateCount(Math.max(0, this.count - 1))
    }
  }

  updateBadge() {
    const badge = this.querySelector(".notification-badge")
    if (badge) {
      if (this.count > 0) {
        badge.textContent = this.count > 99 ? "99+" : this.count
        badge.classList.remove("hidden")
      } else {
        badge.classList.add("hidden")
      }
    }
  }

  render() {
    this.innerHTML = `
      <div class="relative">
        <button class="notification-bell-button relative inline-flex items-center p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="notification-badge absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform bg-red-600 rounded-full min-w-[1.25rem] h-5 hidden">
            0
          </span>
        </button>
      </div>
    `

    this.updateBadge()
  }
}

customElements.define("notification-badge", NotificationBadge)

export default NotificationBadge
