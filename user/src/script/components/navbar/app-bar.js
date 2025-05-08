import Products from '../../data/local/product';

class AppBar extends HTMLElement {
    constructor() {
        super();
    }

    _emptyContent() {
        this.innerHTML = "";
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this._emptyContent();

        const categories = [...new Set(Products.getAll().map(product => product.category))];

        this.innerHTML += `
            <div class="bg-white shadow-sm py-4">
                <div class="container mx-auto px-4 flex justify-between items-center">

                    <!-- Left: Logo -->
                    <div class="text-xl font-bold text-gray-800"><img src="./logo.png" class=" mr-1 h-10 inline-block">Pinjemin</div>

                    <!-- Center: Navigation Links -->
                    <nav class="hidden md:flex space-x-6">
                        <a href="/#/home" class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                            Home
                        </a>
                        <div class="relative">
                            <button class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900" id="categoryDropdownButton">
                                Kategori
                            </button>
                            <div id="categoryDropdownMenu" class="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 hidden z-10">
                                ${categories.map(category => `
                                    <a href="/#/explore?category=${category}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">${category}</a>
                                `).join('')}
                            </div>
                        </div>
                        <a href="/#/community" class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                            Komunitas
                        </a>
                        <a href="/#/my-rentals" class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                            Pinjaman Saya
                        </a>
                    </nav>

                     <!-- Right: Sign In Button -->
                    <div class="flex items-center space-x-4">
                        <!-- Cart Icon Placeholder -->
                        <a href="/#/cart" class="text-gray-600 hover:text-gray-900" aria-label="Shopping Cart">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                            </svg>
                        </a>
                         <a href="/#/login" class="font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                            Sign In
                        </a>
                    </div>

                     <!-- Hamburger menu placeholder untuk layar kecil -->
                    <div class="md:hidden">
                        <button class="text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                    </div>

                </div>
            </div>
        `;

        this._setupDropdownToggle();
    }

    _setupDropdownToggle() {
        const categoryButton = this.querySelector('#categoryDropdownButton');
        const categoryMenu = this.querySelector('#categoryDropdownMenu');

        if (categoryButton && categoryMenu) {
            categoryButton.addEventListener('click', (event) => {
                event.stopPropagation();
                categoryMenu.classList.toggle('hidden');
            });
        }

        document.addEventListener('click', (event) => {
            if (this.contains(categoryButton) && this.contains(categoryMenu)) {
                if (!categoryButton.contains(event.target) && !categoryMenu.contains(event.target)) {
                    categoryMenu.classList.add('hidden');
                }
            }
        });

        window.addEventListener('scroll', () => {
            if (categoryMenu && !categoryMenu.classList.contains('hidden')) {
                categoryMenu.classList.add('hidden');
            }
        });
    }
}

customElements.define("app-bar", AppBar);