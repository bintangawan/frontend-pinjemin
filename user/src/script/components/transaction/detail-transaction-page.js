import { authenticatedRequest } from "../../utils/apiService.js"
import Utils from "../../utils/utils.js"
import { io } from "socket.io-client"
import Swal from "sweetalert2"

class DetailTransactionPage extends HTMLElement {
  constructor() {
    super()
    this.transactionId = null
    this.transactionDetails = null
    this.isLoading = true
    this.error = null

    // State for messages
    this._messages = []
    this._messagesLoading = false
    this._messagesError = null

    // Socket.io related properties
    this._socket = null
    this._isSocketConnected = false

    // Bind methods
    this.fetchTransactionDetails = this.fetchTransactionDetails.bind(this)
    this.handleStatusUpdate = this.handleStatusUpdate.bind(this)
    // Bind methods for messages
    this.fetchMessages = this.fetchMessages.bind(this)
    this._handleSendMessageSocket = this._handleSendMessageSocket.bind(this)
    // Bind Socket.io methods
    this._connectSocket = this._connectSocket.bind(this)
    this._disconnectSocket = this._disconnectSocket.bind(this)
    this._handleNewMessage = this._handleNewMessage.bind(this)
    this._handleSocketError = this._handleSocketError.bind(this)
  }

  _emptyContent() {
    this.innerHTML = ""
  }

  // Observe the 'transaction-id' attribute passed from the router
  static get observedAttributes() {
    return ["transaction-id"]
  }

  connectedCallback() {
    this.render()
    if (Utils.isAuthenticated()) {
      this._ensureNotificationPermission()
    }
  }

  disconnectedCallback() {
    this.removeEventListeners()
    this._disconnectSocket()

    this.transactionId = null
    this.transactionDetails = null
    this.isLoading = true
    this.error = null
    this._messages = []
    this._messagesLoading = false
    this._messagesError = null
    this._isSocketConnected = false
  }

  attributeChangedCallback(name, oldValue, newValue) {

    const newTransactionId =
      newValue &&
      typeof newValue === "string" &&
      newValue !== "undefined" &&
      newValue !== "null" &&
      newValue.trim() !== ""
        ? newValue.trim()
        : null

    if (newTransactionId !== this.transactionId) {
      this._disconnectSocket()

      this.transactionId = newTransactionId
      this.transactionDetails = null
      this.isLoading = true
      this.error = null
      this._messages = []
      this._messagesLoading = false
      this._messagesError = null

      if (this.transactionId) {

        if (!Utils.isAuthenticated()) {
          Swal.fire({
            icon: "warning",
            title: "Login Diperlukan",
            text: "Anda harus login untuk melihat detail transaksi.",
            confirmButtonColor: "#4f46e5",
          })
          Utils.redirectToLogin()
          this.error = "Anda harus login untuk melihat detail ini."
          this.isLoading = false
          this.render()
          return
        }

        this.render() // Show loading
        this.fetchTransactionDetails(this.transactionId)
      } else {
        console.warn("Invalid transaction ID")
        this.error = "ID Transaksi tidak valid."
        this.isLoading = false
        this.render()
      }
    }
  }

  async fetchTransactionDetails(transactionId) {
    if (!transactionId) {
      console.error("fetchTransactionDetails called without a valid transactionId.")
      this.error = "ID Transaksi tidak ditemukan."
      this.isLoading = false
      this.render()
      return
    }

    this.isLoading = true
    this.error = null
    this.transactionDetails = null

    try {
      const response = await authenticatedRequest(`/transactions/${transactionId}`, "GET")

      if (response.status === "success" && response.data) {
        this.transactionDetails = response.data
        this.error = null

        this.fetchMessages(transactionId)
        this._connectSocket(transactionId)
      } else {
        console.error("Error fetching transaction details:", response.message || "Unknown error", response)
        this.transactionDetails = null
        this.error = response.message || "Gagal memuat detail transaksi."
        this.isLoading = false
        this._disconnectSocket()
        this.render()
      }
    } catch (error) {
      console.error("Error during API request for transaction details:", error)
      this.transactionDetails = null
      this.error = "Terjadi kesalahan saat memuat detail transaksi."
      this.isLoading = false
      this._disconnectSocket()
      this.render()
    }
  }

  async fetchMessages(transactionId) {
    if (!transactionId) {
      console.error("fetchMessages called without a valid transactionId.")
      this._messagesError = "ID Transaksi tidak ditemukan untuk memuat pesan."
      this._messagesLoading = false
      this.render()
      return
    }

    this._messagesLoading = true
    this._messagesError = null
    this._messages = []

    try {
      const response = await authenticatedRequest(`/messages/transaction/${transactionId}`, "GET")

      if (response.status === "success" && response.data) {
        this._messages = Array.isArray(response.data) ? response.data : []
        this._messagesError = null
        this._messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      } else {
        console.error("Error fetching messages:", response.message || "Unknown error", response)
        this._messages = []
        this._messagesError = response.message || "Gagal memuat pesan."
      }
    } catch (error) {
      console.error("Error during API request for messages:", error)
      this._messages = []
      this._messagesError = "Terjadi kesalahan saat memuat pesan."
    } finally {
      this._messagesLoading = false
      if (this.transactionDetails) {
        this.isLoading = false
      }
      console.log("fetchMessages finally block reached. Current state after fetch:", {
        transactionDetails: !!this.transactionDetails,
        isLoading: this.isLoading,
        error: this.error,
        messagesCount: this._messages.length,
        messagesLoading: this._messagesLoading,
        messagesError: this._messagesError,
        isSocketConnected: this._isSocketConnected,
      })
      this.render()
    }
  }

  _connectSocket(transactionId) {
    if (this._isSocketConnected || !transactionId) {
      if (!transactionId) {
        console.warn("Cannot connect Socket.io: No valid transaction ID.")
      } else if (this._isSocketConnected) {
      }
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      console.warn("No JWT token found. Cannot connect Socket.io for authenticated user.")
      this._messagesError = "Anda harus login untuk menggunakan chat."
      this.render()
      return
    }

    this._socket = io("http://31.97.67.212:5000", {
      query: { transactionId: transactionId },
      auth: { token: token },
    })

    this._socket.on("connect", () => {
      this._isSocketConnected = true
      console.log("Socket.io connected:", this._socket.id)

      if (this._socket && this.transactionId) {
        console.log(`Emitting 'joinTransaction' for ID: ${this.transactionId}`)
        this._socket.emit("joinTransaction", Number.parseInt(this.transactionId, 10))
      } else {
        console.warn("Cannot emit joinTransaction: missing transactionId or socket")
      }
    })

    this._socket.on("disconnect", (reason) => {
      this._isSocketConnected = false
      console.log("Socket.io disconnected:", reason)
    })

    this._socket.on("connect_error", (error) => {
      console.error("Socket.io connect_error:", error)
      this._isSocketConnected = false
    })

    this._socket.on("error", (error) => {
      console.error("Socket.io error:", error)
      this._isSocketConnected = false
    })

    this._socket.on("newMessage", (newMessage) => {

      if (!newMessage || !this.transactionId) {
        console.warn("Invalid message or missing transaction ID")
        return
      }

      if (
        newMessage.transaction_id &&
        Number.parseInt(newMessage.transaction_id, 10) === Number.parseInt(this.transactionId, 10)
      ) {
        if (!this._messages.find((msg) => msg.id === newMessage.id)) {
          this._messages.push(newMessage)
          this._messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          this.render()

          requestAnimationFrame(() => {
            const messagesListElement = this.querySelector("#messages-list")
            if (messagesListElement) {
              messagesListElement.scrollTop = messagesListElement.scrollHeight
            }
          })
        }
      } else {
        console.warn("Message not for this transaction:", {
          expected: this.transactionId,
          received: newMessage.transaction_id,
        })
      }
    })

    this._socket.on("messageError", (errorData) => {
      console.error("Server reported message error:", errorData.error)
      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim Pesan",
        text: "Gagal mengirim pesan: " + (errorData.error || "Terjadi kesalahan server."),
        confirmButtonColor: "#4f46e5",
      })
    })
  }

  _disconnectSocket() {
    if (this._socket) {
      this._socket.off("connect")
      this._socket.off("disconnect")
      this._socket.off("connect_error", this._handleSocketError)
      this._socket.off("error", this._handleSocketError)
      this._socket.off("newMessage", this._handleNewMessage)
      this._socket.off("messageError")

      this._socket.disconnect()
      this._socket = null
      this._isSocketConnected = false
    }
  }

  _handleSocketError(error) {
    console.error("Socket.io error handler:", error)
    this._isSocketConnected = false
  }

  _handleNewMessage(newMessage) {
    if (
      newMessage &&
      newMessage.transaction_id &&
      this.transactionId &&
      Number.parseInt(newMessage.transaction_id, 10) === Number.parseInt(this.transactionId, 10)
    ) {
      if (!this._messages.find((msg) => msg.id === newMessage.id)) {
        this._messages.push(newMessage)
        this._messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        this.render()

        requestAnimationFrame(() => {
          const messagesListElement = this.querySelector("#messages-list")
          if (messagesListElement) {
            messagesListElement.scrollTop = messagesListElement.scrollHeight
          } else {
            console.warn("Messages list element not found for scrolling after new message.")
          }
        })
      } else {
      }
    } else {
      console.warn("Received new message not for this transaction or invalid format, ignoring:", newMessage)
      console.log(
        "Expected transaction ID:",
        this.transactionId,
        "Received transaction ID:",
        newMessage ? newMessage.transaction_id : "N/A",
      )
    }
  }

  setupEventListeners() {
    this.removeEventListeners()

    const transactionActionsDiv = this.querySelector("#transaction-actions")
    if (transactionActionsDiv) {
      this.handleStatusUpdateDelegate = (event) => {
        const target = event.target
        if (target.classList.contains("status-update-button")) {
          const newStatus = target.dataset.status
          if (newStatus && this.transactionDetails && this.transactionDetails.id) {
            this.handleStatusUpdate(this.transactionDetails.id, newStatus)
          }
        }
      }
      transactionActionsDiv.addEventListener("click", this.handleStatusUpdateDelegate)
    }

    const sendMessageForm = this.querySelector("#send-message-form")
    if (sendMessageForm) {
      this._sendMessageSubmitHandler = this._handleSendMessageSocket
      sendMessageForm.addEventListener("submit", this._sendMessageSubmitHandler)
    }
  }

  removeEventListeners() {
    const transactionActionsDiv = this.querySelector("#transaction-actions")
    if (transactionActionsDiv && this.handleStatusUpdateDelegate) {
      transactionActionsDiv.removeEventListener("click", this.handleStatusUpdateDelegate)
      this.handleStatusUpdateDelegate = null
    }

    const sendMessageForm = this.querySelector("#send-message-form")
    if (sendMessageForm && this._sendMessageSubmitHandler) {
      sendMessageForm.removeEventListener("submit", this._sendMessageSubmitHandler)
      this._sendMessageSubmitHandler = null
    }
  }

  _handleSendMessageSocket(event) {
    event.preventDefault()

    if (!this._socket || !this._isSocketConnected) {
      console.warn("Socket not connected")
      Swal.fire({
        icon: "error",
        title: "Koneksi Terputus",
        text: "Koneksi chat tidak aktif. Silakan refresh halaman.",
        confirmButtonColor: "#4f46e5",
      })
      return
    }

    if (!this.transactionDetails || !this.transactionDetails.id) {
      console.warn("Transaction details missing")
      Swal.fire({
        icon: "error",
        title: "Data Tidak Lengkap",
        text: "Informasi transaksi tidak lengkap.",
        confirmButtonColor: "#4f46e5",
      })
      return
    }

    const form = event.target
    const messageInput = form.querySelector("#message-input")
    const content = messageInput ? messageInput.value.trim() : ""

    if (!content) {
      Swal.fire({
        icon: "warning",
        title: "Pesan Kosong",
        text: "Pesan tidak boleh kosong.",
        confirmButtonColor: "#4f46e5",
      })
      return
    }

    const sendButton = form.querySelector('button[type="submit"]')
    if (sendButton) sendButton.disabled = true

    try {
      console.log(`Emitting 'sendMessage' for transaction ID: ${this.transactionDetails.id}`)

      const messageData = {
        transaction_id: Number.parseInt(this.transactionDetails.id, 10),
        content: content,
      }

      this._socket.emit("sendMessage", messageData)
      console.log("sendMessage event emitted with data:", messageData)

      if (messageInput) messageInput.value = ""
    } catch (error) {
      console.error("Error emitting sendMessage event:", error)
      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim",
        text: "Terjadi kesalahan saat mengirim pesan.",
        confirmButtonColor: "#4f46e5",
      })
    } finally {
      if (sendButton) sendButton.disabled = false
    }
  }

  // ✅ PERBAIKAN: HANYA minta permission - TIDAK register service worker
  async _ensureNotificationPermission() {
    try {
      // Cek apakah browser mendukung notifications
      if (!("Notification" in window)) {
        console.log("Browser tidak mendukung push notifications")
        return
      }

      // Jika permission sudah granted, tidak perlu lakukan apa-apa
      if (Notification.permission === "granted") {
        console.log("Notification permission sudah granted")
        return
      }

      // Jika permission default, tidak minta permission di sini
      // Biarkan PushNotificationHelper yang handle
      if (Notification.permission === "default") {
        console.log("Notification permission belum diminta, akan dihandle oleh sistem utama")
        return
      }

      // Jika permission denied, log saja
      if (Notification.permission === "denied") {
        console.log("Notification permission denied")
        return
      }
    } catch (error) {
      console.error("Error checking notification permission:", error)
    }
  }

  render() {
    console.log("DetailTransaction Render method called. Current state:", {
      isLoading: this.isLoading,
      error: this.error,
      hasData: !!this.transactionDetails,
      messagesLoading: this._messagesLoading,
      messagesError: this._messagesError,
      hasMessages: this._messages.length > 0,
      isSocketConnected: this._isSocketConnected,
    })
    this._emptyContent()
    console.log("Render method: Content cleared.")

    try {
      const contentHtml = this.renderContentContent(
        this.isLoading,
        this.error,
        this.transactionDetails,
        Utils.getUserInfo(),
      )

      const messagesSectionHtml = this.renderMessagesSection(
        this._messagesLoading,
        this._messagesError,
        this._messages,
        Utils.getUserInfo(),
      )
      if (!contentHtml) {
        console.warn("renderContentContent returned an empty string or null.")
      }
      this.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <h1 class="text-2xl font-bold mb-6">Detail Transaksi</h1>

                <!-- Transaction Detail Area -->
                <div id="transaction-detail-content">
                        ${contentHtml}
                    </div>

                    <!-- Messages Section -->
                     <div class="mt-8 border-t pt-8">
                        <h2 class="text-2xl font-bold mb-6">Pesan Transaksi</h2>
                        ${messagesSectionHtml}
                </div>
            </div>
        `
      console.log("Render method: innerHTML set.")
    } catch (renderError) {
      console.error("Error inside render method:", renderError)
      this.innerHTML = '<p class="text-red-500">Terjadi kesalahan saat menampilkan detail.</p>'
    }

    if (!this.isLoading && !this._messagesLoading && !this.error && !this._messagesError) {
      this.setupEventListeners()
    }
  }

  renderContentContent(isLoading, error, transaction, currentUser) {
    console.log("renderContentContent called with state:", {
      isLoading,
      error,
      hasTransaction: !!transaction,
      hasCurrentUser: !!currentUser,
    })

    if (isLoading) {
      console.log("renderContentContent: Showing loading.")
      return "<p>Memuat detail transaksi...</p>"
    }

    if (error) {
      console.log("renderContentContent: Showing error:", error)
      return `<p class="text-red-500">Error: ${error}</p>`
    }

    if (!transaction) {
      console.log("renderContentContent: Showing no data message.")
      return "<p>Detail transaksi tidak tersedia.</p>"
    }

    const isSeller = currentUser && transaction.seller_id === currentUser.id
    const isBuyer = currentUser && transaction.buyer_id === currentUser.id
    console.log("renderContentContent: Transaction data available. isSeller:", isSeller, "isBuyer:", isBuyer)

    const formatRupiah = (money) => {
      if (money === null || money === undefined) return "-"
      const numericMoney = typeof money === "string" ? Number.parseFloat(money) : money
      if (isNaN(numericMoney)) return "-"
      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(
        numericMoney,
      )
    }

    const statusDisplay = transaction.status || "Unknown Status"
    let statusColorClass = "text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold"

    switch (transaction.status) {
      case "pending":
        statusColorClass = "text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full text-xs font-semibold"
        break
      case "ongoing":
        statusColorClass = "text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full text-xs font-semibold"
        break
      case "completed":
        statusColorClass = "text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs font-semibold"
        break
      case "cancelled":
        statusColorClass = "text-red-600 bg-red-500 px-2 py-0.5 rounded-full text-xs font-semibold"
        break
      case "returned":
        statusColorClass = "text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full text-xs font-semibold"
        break
      case "late":
        statusColorClass = "text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full text-xs font-semibold"
        break
    }

    let availableSellerStatusTransitions = []
    if (isSeller) {
      switch (transaction.status) {
        case "pending":
          availableSellerStatusTransitions = [
            { status: "ongoing", text: "Konfirmasi & Proses" },
            { status: "cancelled", text: "Batalkan Transaksi" },
          ]
          break
        case "ongoing":
          if (transaction.type === "rent") {
            availableSellerStatusTransitions = [
              { status: "returned", text: "Item Telah Dikembalikan" },
              { status: "completed", text: "Selesaikan Transaksi Sewa" },
            ]
          } else {
            availableSellerStatusTransitions = [{ status: "completed", text: "Selesaikan Transaksi Penjualan" }]
          }
          break
        case "returned":
          if (transaction.type === "rent") {
            availableSellerStatusTransitions = [{ status: "completed", text: "Selesaikan Transaksi Sewa" }]
          }
          break
        case "late":
          if (transaction.type === "rent") {
            availableSellerStatusTransitions = [
              { status: "returned", text: "Item Dikembalikan (Terlambat)" },
              { status: "completed", text: "Selesaikan Transaksi Sewa" },
            ]
          }
          break
        default:
          availableSellerStatusTransitions = []
      }
    }

    let availableBuyerStatusTransitions = []
    if (isBuyer) {
      switch (transaction.status) {
        case "pending":
          availableBuyerStatusTransitions = [{ status: "cancelled", text: "Batalkan Pesanan" }]
          break
        default:
          availableBuyerStatusTransitions = []
      }
    }

    return `
            <div class="bg-white shadow-md rounded-lg p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="text-xl font-semibold mb-4">Informasi Transaksi</h3>
                        <p><strong>ID Transaksi:</strong> ${transaction.id}</p>
                        <p><strong>Tanggal Dibuat:</strong> ${transaction.created_at ? new Date(transaction.created_at).toLocaleDateString("id-ID") : "-"} ${transaction.created_at ? new Date(transaction.created_at).toLocaleTimeString("id-ID") : "-"}</p>
                        ${transaction.updated_at ? `<p><strong>Terakhir Diperbarui:</strong> ${new Date(transaction.updated_at).toLocaleDateString("id-ID")} ${new Date(transaction.updated_at).toLocaleTimeString("id-ID")}</p>` : ""}
                        <p><strong>Tipe:</strong> <span class="capitalize">${transaction.type || "-"}</span></p>
                        <p><strong>Status:</strong> <span class="${statusColorClass}">${statusDisplay}</span></p>
                        <p><strong>Metode Pembayaran:</strong> ${transaction.payment_method || "-"}</p>
                        <p><strong>Total Harga:</strong> ${formatRupiah(transaction.total_price)}</p>
                         ${
                           transaction.type === "rent"
                             ? `
                             <p><strong>Periode Sewa:</strong> ${transaction.rent_start_date ? new Date(transaction.rent_start_date).toLocaleDateString("id-ID") : "-"} - ${transaction.rent_end_date ? new Date(transaction.rent_end_date).toLocaleDateString("id-ID") : "-"}</p>
                             <p><strong>Deposit Dibayar:</strong> ${formatRupiah(transaction.deposit_paid)}</p>
                         `
                             : ""
                         }
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold mb-4">Informasi Item</h3>
                         <p><strong>Nama Item:</strong> ${transaction.item_name || "Tidak Diketahui"}</p>
                         ${
                           transaction.item_photo
                             ? `
                             <img src="http://31.97.67.212:5000${transaction.item_photo}" alt="Item Photo" class="w-32 h-32 object-cover rounded mt-2">
                         `
                             : ""
                         }
                         <div class="mt-2">
                             <a href="/#/items/${transaction.item_id}" class="text-blue-600 hover:underline">Lihat Detail Item</a>
                         </div>
                    </div>
                     <div>
                         <h3 class="text-xl font-semibold mb-4">Informasi Pihak Terlibat</h3>
                         <p><strong>Pembeli/Penyewa:</strong> ${transaction.buyer_name || "Tidak Diketahui"} (${transaction.buyer_email || "-"})</p>
                         <p><strong>Penjual/Pemilik:</strong> ${transaction.seller_name || "Tidak Diketahui"} (${transaction.seller_email || "-"})</p>
                     </div>
                </div>

                 <div class="mt-6 border-t pt-6">
                     <h3 class="text-xl font-semibold mb-4">Aksi Transaksi</h3>
                     <div id="transaction-actions">
                          ${
                            isSeller && availableSellerStatusTransitions.length > 0
                              ? availableSellerStatusTransitions
                                  .map(
                                    (transition) => `
                                <button class="status-update-button bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-3 py-1 rounded mr-2"
                                        data-status="${transition.status}">
                                    ${transition.text}
                                </button>
                            `,
                                  )
                                  .join("")
                              : isBuyer && availableBuyerStatusTransitions.length > 0
                                ? availableBuyerStatusTransitions
                                    .map(
                                      (transition) => `
                                <button class="status-update-button bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-3 py-1 rounded mr-2"
                                        data-status="${transition.status}">
                                    ${transition.text}
                                </button>
                            `,
                                    )
                                    .join("")
                                : isSeller
                                  ? "<p>Tidak ada aksi status yang tersedia untuk Anda sebagai Penjual saat ini.</p>"
                                  : isBuyer
                                    ? "<p>Tidak ada aksi yang tersedia untuk Anda sebagai Pembeli saat ini.</p>"
                                    : "<p>Anda tidak memiliki izin untuk mengambil tindakan pada transaksi ini.</p>"
                          }
                     </div>
                 </div>
            </div>
        `
  }

  renderMessagesSection(isLoading, error, messages, currentUser) {
    console.log("renderMessagesSection called with state:", {
      isLoading,
      error,
      hasMessages: messages.length > 0,
      hasCurrentUser: !!currentUser,
    })

    if (isLoading) {
      return "<p>Memuat pesan...</p>"
    }

    if (error) {
      return `<p class="text-red-500">Error memuat pesan: ${error}</p>`
    }

    if (!currentUser) {
      return '<p class="text-gray-600">Login untuk melihat pesan.</p>'
    }

    const messagesListHtml =
      messages.length === 0
        ? "<p>Belum ada pesan dalam transaksi ini.</p>"
        : messages.map((message) => this.renderMessage(message, currentUser.id)).join("")

    return `
            <div class="bg-gray-100 p-4 rounded-lg shadow-inner">
                <div id="messages-list" class="h-64 overflow-y-auto mb-4 p-2 border rounded bg-white">
                    ${messagesListHtml}
                </div>
                <form id="send-message-form">
                    <div class="flex">
                        <input type="text" id="message-input" placeholder="Ketik pesan..."
                               class="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 sm:text-sm"
                               required>
                        <button type="submit"
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Kirim
                        </button>
                    </div>
                </form>
            </div>
         `
  }

  renderMessage(message, currentUserId) {
    if (!message) return ""

    const isSender = message.sender_id === currentUserId
    const alignmentClass = isSender ? "items-end" : "items-start"
    const bubbleColorClass = isSender ? "bg-indigo-500 text-white" : "bg-gray-300 text-gray-800"
    const senderName = isSender ? "Anda" : message.sender_name || "Pengguna"

    return `
             <div class="flex flex-col ${alignmentClass} mb-2">
                 <div class="text-xs text-gray-600 mb-0.5">${senderName}</div>
                 <div class="${bubbleColorClass} p-2 rounded-lg max-w-xs break-words">
                     ${message.content || ""}
                 </div>
                  <div class="text-xs text-gray-500 mt-0.5">
                     ${message.created_at ? new Date(message.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                 </div>
             </div>
         `
  }

  formatRupiah = (money) => {
    if (money === null || money === undefined) return "-"
    const numericMoney = typeof money === "string" ? Number.parseFloat(money) : money
    if (isNaN(numericMoney)) return "-"
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(
      numericMoney,
    )
  }

  async handleStatusUpdate(transactionId, newStatus) {
    if (!transactionId || !newStatus) {
      console.error("Missing transaction ID or new status for update.")
      alert("Gagal memperbarui status: Informasi tidak lengkap.")
      return
    }

    const result = await Swal.fire({
      title: "Konfirmasi Perubahan Status",
      html: `Apakah Anda yakin ingin mengubah status transaksi ini menjadi <strong>"${newStatus}"</strong>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Ubah Status",
      cancelButtonText: "Batal",
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      console.log(`Attempting to update transaction ${transactionId} status to: ${newStatus}`)
      const response = await authenticatedRequest(`/transactions/${transactionId}/status`, "PATCH", {
        status: newStatus,
      })

      if (response.status === "success") {
        console.log("Transaction status updated successfully:", response.data)
        await Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Status transaksi berhasil diperbarui!",
          confirmButtonColor: "#4f46e5",
        })
        this.fetchTransactionDetails(transactionId)
      } else {
        console.error("Failed to update transaction status:", response.message || "Unknown error", response)
        let errorMessage = "Gagal memperbarui status transaksi: " + (response.message || "Terjadi kesalahan")
        if (response.errors && Array.isArray(response.errors)) {
          errorMessage += "\nValidasi error:"
          response.errors.forEach((err) => {
            if (err && err.param && err.msg) {
              errorMessage += `\n- ${err.param}: ${err.msg}`
            } else if (typeof err === "string") {
              errorMessage += `\n- ${err}`
            }
          })
        }
        Swal.fire({
          icon: "error",
          title: "Gagal Memperbarui Status",
          html: errorMessage.replace(/\n/g, "<br>"),
          confirmButtonColor: "#4f46e5",
        })
      }
    } catch (error) {
      console.error("Error during API request for status update:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Terjadi kesalahan saat memperbarui status transaksi.",
        confirmButtonColor: "#4f46e5",
      })
    }
  }
}

customElements.define("detail-transaction-page", DetailTransactionPage)
