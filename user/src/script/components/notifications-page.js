class NotificationsPage extends HTMLElement {
    connectedCallback() {
      this.render()
    }
  
    render() {
      this.innerHTML = `
        <div class="container mx-auto px-4 py-8 max-w-4xl">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Notifikasi</h1>
            <p class="text-gray-600">Kelola semua notifikasi Anda di sini</p>
          </div>
  
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <notification-list></notification-list>
          </div>
        </div>
      `
    }
  }
  
  customElements.define("notifications-page", NotificationsPage)
  
  export default NotificationsPage
  