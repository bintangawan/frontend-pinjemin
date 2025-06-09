import { authenticatedRequest } from '../../utils/apiService.js';
import Utils from '../../utils/utils.js';
import { io } from 'socket.io-client';

class HobbyPage extends HTMLElement {
  constructor() {
    super();
    this._messages = [];
    this._socket = null;
    this._isSocketConnected = false;
    this._isLoading = false;
    this._hasMoreMessages = true;
    this._currentPage = 1;
    this._messagesPerPage = 20;

    // Bind methods
    this.fetchMessageHistory = this.fetchMessageHistory.bind(this);
    this.loadMoreMessages = this.loadMoreMessages.bind(this);
    this._connectSocket = this._connectSocket.bind(this);
    this._handleNewMessage = this._handleNewMessage.bind(this);
    this._handleScroll = this._handleScroll.bind(this);
  }

  async connectedCallback() {
    if (!Utils.isAuthenticated()) {
      Utils.redirectToLogin();
      return;
    }
  
    await this.fetchMessageHistory(); // page 1
    this._connectSocket();
    this.render();
    this._setupScrollListener();
  
    // ✅ Auto-scroll to bottom on first load
    setTimeout(() => {
      const container = this.querySelector('.messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }
  

  async fetchMessageHistory(page = 1) {
    try {
      this._isLoading = true;
      const response = await authenticatedRequest(`/hobby-messages?page=${page}&limit=${this._messagesPerPage}`, 'GET');
      if (response.status === 'success') {
        const newMessages = response.data || [];
        
        if (page === 1) {
          this._messages = newMessages;
        } else {
          // Prepend older messages at the beginning
          this._messages = [...newMessages, ...this._messages];
        }
        
        this._hasMoreMessages = newMessages.length === this._messagesPerPage;
        this._currentPage = page;
      }
    } catch (error) {
      console.error('Error fetching message history:', error);
    } finally {
      this._isLoading = false;
    }
  }

  async loadMoreMessages() {
    if (this._isLoading || !this._hasMoreMessages) return;
    
    const container = this.querySelector('.messages-container');
    const previousScrollHeight = container.scrollHeight;
    
    await this.fetchMessageHistory(this._currentPage + 1);
    this.render();
    
    // Maintain scroll position after loading older messages
    setTimeout(() => {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - previousScrollHeight;
    }, 0);
  }

  _setupScrollListener() {
    const container = this.querySelector('.messages-container');
    if (container) {
      container.addEventListener('scroll', this._handleScroll);
    }
  }

  _handleScroll(e) {
    const container = e.target;
    // Load more when scrolled to top
    if (container.scrollTop <= 100 && this._hasMoreMessages && !this._isLoading) {
      this.loadMoreMessages();
    }
  }

  _connectSocket() {
    const token = localStorage.getItem('token');
    this._socket = io('https://api.pinjemin.site', {
      auth: { token }
    });

    this._socket.on('connect', () => {
      this._isSocketConnected = true;
      this._socket.emit('joinHobby');
      this._setupInputListeners();
    });

    this._socket.on('newHobbyMessage', this._handleNewMessage);
    
    this._socket.on('hobbyError', (error) => {
      console.error('Hobby error:', error);
      alert('Error: ' + error.error);
    });

    this._socket.on('hobbyMessageError', (error) => {
      console.error('Hobby message error:', error);
      alert('Error: ' + error.error);
    });
  }

  _setupInputListeners() {
    const sendBtn = this.querySelector('.send-button');
    const input = this.querySelector('.message-input-field');

    const sendMessage = () => {
      const message = input?.value.trim();
      if (message && this._isSocketConnected) {
        this._socket.emit('sendHobbyMessage', {
          content: message
        });
        input.value = '';
        input.style.height = 'auto';
      }
    };

    // Remove existing listeners to prevent duplicates
    sendBtn?.removeEventListener('click', this._sendMessage);
    input?.removeEventListener('keypress', this._handleKeypress);
    input?.removeEventListener('input', this._handleInput);

    // Store bound functions
    this._sendMessage = sendMessage;
    this._handleKeypress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };
    this._handleInput = (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    // Add new listeners
    sendBtn?.addEventListener('click', this._sendMessage);
    input?.addEventListener('keypress', this._handleKeypress);
    input?.addEventListener('input', this._handleInput);
  }

  _handleNewMessage(message) {
    const container = this.querySelector('.messages-container');
    const currentUserId = localStorage.getItem('userId');
    const isOwn = message.sender_id == currentUserId;
  
    const wasAtBottom = container && (container.scrollTop + container.clientHeight >= container.scrollHeight - 50);
  
    // Tambahkan ke internal array
    this._messages.push(message);
  
    // ✅ Tambahkan langsung ke DOM, bukan render ulang
    if (container) {
      const msgEl = document.createElement('div');
      msgEl.className = `message ${isOwn ? 'own' : ''}`;
      const initials = (message.sender_name || 'U').charAt(0).toUpperCase();
  
      msgEl.innerHTML = `
        <div class="message-avatar">${initials}</div>
        <div class="message-content">
          <div class="message-bubble">${message.content}</div>
          <div class="message-meta">
            ${!isOwn ? `<span class="message-sender">${message.sender_name || 'User'}</span>` : ''}
            <span class="message-time">${this._formatTime(message.created_at)}</span>
          </div>
        </div>
      `;
  
      container.appendChild(msgEl);
  
      // ✅ Scroll ke bawah hanya jika:
      // - kamu sendiri yang kirim
      // - atau sebelumnya user memang scroll di bawah
      if (isOwn || wasAtBottom) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 0);
      }
    }
  }
  

  _formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  render() {
    const hobbyName = this._messages[0]?.sender_hobby || '';
    const currentUserId = localStorage.getItem('userId');

    this.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
        }
        
        .hobby-container {
          max-width: 800px;
          margin: 0 auto;
          height: 80vh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .chat-header {
          background: #ffffff;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chat-header-info h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }
        
        .chat-header-info p {
          margin: 0;
          font-size: 14px;
          color: #718096;
        }
        
        .online-indicator {
          width: 12px;
          height: 12px;
          background: #48bb78;
          border-radius: 50%;
          border: 2px solid #ffffff;
        }
        
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #ffffff;
          scroll-behavior: smooth;
        }
        
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .messages-container::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        
        .loading-indicator {
          text-align: center;
          padding: 12px;
          color: #718096;
          font-size: 14px;
        }
        
        .message {
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .message.own {
          flex-direction: row-reverse;
        }
        
        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .message-content {
          max-width: 70%;
          min-width: 120px;
        }
        
        .message-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          word-wrap: break-word;
          line-height: 1.4;
        }
        
        .message.own .message-bubble {
          background: #ed8936;
          color: white;
          border-color: #ed8936;
        }
        
        .message-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          font-size: 12px;
          color: #718096;
        }
        
        .message.own .message-meta {
          justify-content: flex-end;
        }
        
        .message-sender {
          font-weight: 500;
        }
        
        .message-time {
          color: #a0aec0;
        }
        
        .message-input-container {
          padding: 16px 20px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: flex-end;
          gap: 12px;
        }
        
        .message-input-field {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: #f7fafc;
          resize: none;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.4;
          max-height: 120px;
          min-height: 44px;
          transition: all 0.2s ease;
        }
        
        .message-input-field:focus {
          border-color: #ed8936;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(237, 137, 54, 0.1);
        }
        
        .message-input-field::placeholder {
          color: #a0aec0;
        }
        
        .send-button {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 50%;
          background: #ed8936;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        
        .send-button:hover {
          background: #dd6b20;
          transform: scale(1.05);
        }
        
        .send-button:active {
          transform: scale(0.95);
        }
        
        .empty-state {
          text-align: center;
          color: #718096;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .empty-state-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #f7fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        @media (max-width: 768px) {
          .hobby-container {
            height: 100dvh;
            border-radius: 0;
            border: none;
            min-height: 0;
          }
          
          .message-content {
            max-width: 85%;
          }
          
          .chat-header {
            padding: 12px 16px;
          }
          
          .messages-container {
            padding: 12px;
          }
          
          .message-input-container {
            padding: 12px 16px;
          }
        }
      </style>
      <div class="hobby-container">
        <div class="chat-header">
          <div class="online-indicator"></div>
          <div class="chat-header-info">
            <h3>Hobby ${hobbyName}</h3>
            <p>${this._isSocketConnected ? 'Online' : 'Connecting...'}</p>
          </div>
        </div>
        
        <div class="messages-container">
          ${this._isLoading && this._currentPage > 1 ? 
            '<div class="loading-indicator">Memuat pesan lama...</div>' : ''
          }
          
          ${this._messages.length === 0 ? 
            `<div class="empty-state">
              <div class="empty-state-icon">🎯</div>
              <p>Belum ada pesan dalam grup hobby ini</p>
              <p>Mulai percakapan dengan sesama penggemar hobby!</p>
            </div>` :
            this._messages.map(msg => {
              const isOwn = currentUserId && msg.sender_id == currentUserId;
              const initials = (msg.sender_name || 'U').charAt(0).toUpperCase();
              
              return `
                <div class="message ${isOwn ? 'own' : ''}">
                  <div class="message-avatar">${initials}</div>
                  <div class="message-content">
                    <div class="message-bubble">${msg.content}</div>
                    <div class="message-meta">
                      ${!isOwn ? `<span class="message-sender">${msg.sender_name || 'User'}</span>` : ''}
                      <span class="message-time">${this._formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')
          }
        </div>
        
        <div class="message-input-container">
          <textarea class="message-input-field" placeholder="Bagikan tentang hobby Anda..." rows="1"></textarea>
          <button class="send-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Re-setup listeners after render
    setTimeout(() => {
      this._setupScrollListener();
      if (this._isSocketConnected) {
        this._setupInputListeners();
      }
    }, 0);
  }
}

customElements.define('hobby-page', HobbyPage);