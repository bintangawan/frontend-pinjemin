class SearchBar extends HTMLElement {
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: "open" })
    this.setupEventListeners = this.setupEventListeners.bind(this)
  }

  connectedCallback() {
    this.render()
  }

  render() {
    this.shadow.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
                @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
                
                :host {
                    display: block;
                    width: 100%;
                    font-family: 'Poppins', sans-serif;
                }
                
                .search-container {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 0 1rem;
                    position: relative;
                }

                .search-input-wrapper {
                    flex-grow: 1;
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .search-input {
                    width: 100%;
                    padding: 14px 20px 14px 50px;
                    font-size: 16px;
                    font-weight: 400;
                    color: #334155;
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border: 2px solid #e2e8f0;
                    border-radius: 16px;
                    outline: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    font-family: 'Poppins', sans-serif;
                }

                .search-input::placeholder {
                    color: #94a3b8;
                    font-weight: 400;
                }

                .search-input:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), 0 8px 24px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                    background: #ffffff;
                }

                .search-input:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
                }

                .search-icon {
                    position: absolute;
                    left: 18px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
                    font-size: 18px;
                    pointer-events: none;
                    transition: all 0.3s ease;
                    z-index: 1;
                }

                .search-input:focus + .search-icon {
                    color: #6366f1;
                    transform: translateY(-50%) scale(1.1);
                }

                .search-button {
                    background: linear-gradient(135deg, #6366f1, #4f46e5);
                    color: white;
                    font-weight: 600;
                    padding: 14px 20px;
                    border-radius: 16px;
                    font-size: 18px;
                    cursor: pointer;
                    border: none;
                    outline: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                    font-family: 'Poppins', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 56px;
                    height: 56px;
                }

                .search-button:hover {
                    background: linear-gradient(135deg, #4f46e5, #4338ca);
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
                }

                .search-button:active {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }

                .search-button:focus {
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2), 0 8px 20px rgba(99, 102, 241, 0.4);
                }

                .search-button-icon {
                    font-size: 18px;
                    transition: transform 0.3s ease;
                }

                .search-button:hover .search-button-icon {
                    transform: scale(1.2);
                }

                /* Responsive Design */
                @media (max-width: 640px) {
                    .search-container {
                        gap: 8px;
                        padding: 0 0.5rem;
                    }

                    .search-input {
                        padding: 12px 16px 12px 44px;
                        font-size: 14px;
                        border-radius: 12px;
                    }

                    .search-icon {
                        left: 14px;
                        font-size: 16px;
                    }

                    .search-button {
                        padding: 12px 16px;
                        font-size: 16px;
                        border-radius: 12px;
                        min-width: 48px;
                        height: 48px;
                    }

                    .search-button-icon {
                        font-size: 16px;
                    }
                }

                @media (max-width: 480px) {
                    .search-container {
                        max-width: 100%;
                        padding: 0 0.25rem;
                        gap: 6px;
                    }

                    .search-input {
                        padding: 10px 14px 10px 40px;
                        font-size: 14px;
                    }

                    .search-icon {
                        left: 12px;
                        font-size: 14px;
                    }

                    .search-button {
                        padding: 10px 14px;
                        font-size: 14px;
                        min-width: 44px;
                        height: 44px;
                    }

                    .search-button-icon {
                        font-size: 14px;
                    }
                }

                /* Animation for loading state */
                .search-button.loading {
                    pointer-events: none;
                    opacity: 0.8;
                }

                .search-button.loading .search-button-icon {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Focus visible for accessibility */
                .search-input:focus-visible,
                .search-button:focus-visible {
                    outline: 2px solid #6366f1;
                    outline-offset: 2px;
                }

                /* Tooltip for button */
                .search-button {
                    position: relative;
                }

                .search-button::after {
                    content: 'Cari';
                    position: absolute;
                    bottom: -35px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                    z-index: 1000;
                }

                .search-button:hover::after {
                    opacity: 1;
                }

                @media (max-width: 640px) {
                    .search-button::after {
                        display: none;
                    }
                }
            </style>
            <div class="search-container">
                <div class="search-input-wrapper">
                    <input 
                        type="text" 
                        class="search-input" 
                        placeholder="Cari produk yang Anda inginkan..."
                        autocomplete="off"
                        spellcheck="false"
                    >
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                </div>
                <button class="search-button" type="button" aria-label="Cari produk" title="Cari">
                    <i class="fa-solid fa-magnifying-glass search-button-icon"></i>
                </button>
            </div>
        `

    this.setupEventListeners()
  }

  setupEventListeners() {
    const searchInput = this.shadow.querySelector(".search-input")
    const searchButton = this.shadow.querySelector(".search-button")

    // Check if elements exist
    if (!searchInput || !searchButton) {
      console.error("Search elements not found")
      return
    }

    const performSearch = () => {
      try {
        const searchTerm = searchInput.value ? searchInput.value.trim() : ""
        const searchParams = {}

        // Hanya tambahkan parameter 'search' jika searchTerm tidak kosong
        if (searchTerm) {
          searchParams.search = searchTerm
        }


        // Add loading state
        searchButton.classList.add("loading")

        // Remove loading state after a short delay
        setTimeout(() => {
          searchButton.classList.remove("loading")
        }, 1000)

        this.dispatchEvent(
          new CustomEvent("search", {
            bubbles: true,
            composed: true,
            detail: {
              params: searchParams,
            },
          }),
        )
      } catch (error) {
        console.error("Error in performSearch:", error)
        searchButton.classList.remove("loading")
      }
    }

    searchButton.addEventListener("click", performSearch)

    searchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
        performSearch()
      }
    })

    // Focus functionality
    searchInput.addEventListener("focus", () => {
      try {
        searchInput.select()
      } catch (error) {
        console.error("Error in focus event:", error)
      }
    })
  }

  // Method to clear search
  clearSearch() {
    try {
      const searchInput = this.shadow.querySelector(".search-input")
      if (searchInput) {
        searchInput.value = ""
        searchInput.focus()
      }
    } catch (error) {
      console.error("Error in clearSearch:", error)
    }
  }

  // Method to set search value
  setSearchValue(value) {
    try {
      const searchInput = this.shadow.querySelector(".search-input")
      if (searchInput && typeof value === "string") {
        searchInput.value = value
      }
    } catch (error) {
      console.error("Error in setSearchValue:", error)
    }
  }

  // Method to get current search value
  getSearchValue() {
    try {
      const searchInput = this.shadow.querySelector(".search-input")
      return searchInput && searchInput.value ? searchInput.value.trim() : ""
    } catch (error) {
      console.error("Error in getSearchValue:", error)
      return ""
    }
  }
}

customElements.define("search-bar", SearchBar)
