class RegisterPage extends HTMLElement {
    constructor() {
        super();
        // Bind methods to the class instance
        this.fetchProvinces = this.fetchProvinces.bind(this);
        this.populateProvincesDropdown = this.populateProvincesDropdown.bind(this);
        this.handleProvinceChange = this.handleProvinceChange.bind(this);
        this.fetchCitiesByProvinceId = this.fetchCitiesByProvinceId.bind(this);
        this.populateCitiesDropdown = this.populateCitiesDropdown.bind(this);
        this.setupFormSubmission = this.setupFormSubmission.bind(this); // Ensure this is also bound
    }

    _emptyContent() {
        this.innerHTML = "";
    }

    connectedCallback() {
        this.render();
        this.setupFormSubmission();
        this.fetchProvinces(); // Fetch provinces when component is connected
        this.setupProvinceChangeListener(); // Setup listener for province change
    }

    // Add disconnectedCallback to clean up event listeners
    disconnectedCallback() {
        const provinceSelect = this.querySelector('#province');
        if (provinceSelect) {
            provinceSelect.removeEventListener('change', this.handleProvinceChange);
        }
    }

    render() {
        this._emptyContent(); // Clear previous content

        this.innerHTML = `
            <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
                <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img class="mx-auto h-20 w-auto" src="./logo.png" alt="Pinjemin">
                    <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">Create a New Account</h2>
                </div>

                <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form id="register-form" class="space-y-6" action="#" method="POST">
                        <div>
                            <label for="name" class="block text-sm/6 font-medium text-gray-900">Name</label>
                            <div class="mt-2">
                                <input type="text" name="name" id="name" autocomplete="name" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                            </div>
                        </div>

                        <div>
                            <label for="email" class="block text-sm/6 font-medium text-gray-900">Email address</label>
                            <div class="mt-2">
                                <input type="email" name="email" id="email" autocomplete="email" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                            </div>
                        </div>

                         <div>
                            <label for="province" class="block text-sm/6 font-medium text-gray-900">Province</label>
                            <div class="mt-2">
                                <select id="province" name="province_name" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                                    <option value="">Select Province</option>
                                </select>
                            </div>
                        </div>

                         <div>
                            <label for="city" class="block text-sm/6 font-medium text-gray-900">City</label>
                            <div class="mt-2">
                                <select id="city" name="city_name" required disabled class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                                    <option value="">Select City</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <div class="flex items-center justify-between">
                                <label for="password" class="block text-sm/6 font-medium text-gray-900">Password</label>
                            </div>
                            <div class="mt-2">
                                <input type="password" name="password" id="password" autocomplete="new-password" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                            </div>
                        </div>

                         <div>
                            <div class="flex items-center justify-between">
                                <label for="retype-password" class="block text-sm/6 font-medium text-gray-900">Retype Password</label>
                            </div>
                            <div class="mt-2">
                                <input type="password" name="retype-password" id="retype-password" autocomplete="new-password" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                            </div>
                        </div>


                        <div>
                            <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Register</button>
                        </div>
                    </form>

                    <p class="mt-10 text-center text-sm/6 text-gray-500">
                        Already have an account?
                        <a href="/#/login" class="font-semibold text-indigo-600 hover:text-indigo-500">Sign In now</a>
                    </p>
                </div>
            </div>
        `;
    }

    // Method to fetch provinces from external API
    async fetchProvinces() {
        const provinceSelect = this.querySelector('#province');
        // Clear existing options except the first one
        provinceSelect.innerHTML = '<option value="">Select Province</option>';

        try {
            const response = await fetch('https://kanglerian.my.id/api-wilayah-indonesia/api/provinces.json');
            const provinces = await response.json();
            this.populateProvincesDropdown(provinces);
        } catch (error) {
            console.error('Error fetching provinces:', error);
            alert('Failed to load provinces. Please try again later.');
        }
    }

    // Method to populate the province dropdown
    populateProvincesDropdown(provinces) {
        const provinceSelect = this.querySelector('#province');
        if (provinceSelect) {
            provinces.forEach(province => {
                const option = document.createElement('option');
                option.value = province.id; // Use province ID as value
                option.textContent = province.name; // Display province name
                provinceSelect.appendChild(option);
            });
        }
    }

    // Setup event listener for province select change
    setupProvinceChangeListener() {
        const provinceSelect = this.querySelector('#province');
        if (provinceSelect) {
            provinceSelect.addEventListener('change', this.handleProvinceChange);
        }
    }

    // Handler for province select change
    handleProvinceChange(event) {
        const provinceId = event.target.value;
        const citySelect = this.querySelector('#city');

        // Reset city dropdown
        citySelect.innerHTML = '<option value="">Select City</option>';
        citySelect.disabled = true;

        if (provinceId) {
            this.fetchCitiesByProvinceId(provinceId);
        }
    }

    // Method to fetch cities by province ID from external API
    async fetchCitiesByProvinceId(provinceId) {
        const citySelect = this.querySelector('#city');
        // Disable city select while fetching
        citySelect.disabled = true;

        try {
            const response = await fetch(`https://kanglerian.my.id/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
            const cities = await response.json();
            this.populateCitiesDropdown(cities);
            citySelect.disabled = false; // Enable city select after fetching
        } catch (error) {
            console.error(`Error fetching cities for province ${provinceId}:`, error);
            alert('Failed to load cities. Please try again later.');
            citySelect.disabled = true; // Keep disabled on error
        }
    }

    // Method to populate the city dropdown
    populateCitiesDropdown(cities) {
        const citySelect = this.querySelector('#city');
        if (citySelect) {
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.id; // Use city ID as value
                option.textContent = city.name; // Display city name
                citySelect.appendChild(option);
            });
        }
    }

    setupFormSubmission() {
        const form = this.querySelector('#register-form');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(form);
            // Convert FormData to a plain object
            const data = Object.fromEntries(formData.entries());

            if (data.password !== data['retype-password']) {
                alert('Passwords do not match!');
                return;
            }

            delete data['retype-password'];

            // --- IMPORTANT: Get the text content (name) from selected options ---
            const provinceSelect = this.querySelector('#province');
            const citySelect = this.querySelector('#city');

            // Ensure that the value sent to your backend API is the NAME, not the ID from the external API
            // The 'name' attributes on the select elements are already 'province_name' and 'city_name'
            // When accessing formData.entries(), for a select element, the value will be the VALUE of the selected option.
            // We need the textContent of the selected option.

            // Get selected province and city names from the dropdowns
            const selectedProvinceOption = provinceSelect.options[provinceSelect.selectedIndex];
            const selectedCityOption = citySelect.options[citySelect.selectedIndex];

            const provinceName = selectedProvinceOption ? selectedProvinceOption.textContent : '';
            const cityName = selectedCityOption ? selectedCityOption.textContent : '';

            // Use these names in the data object sent to your backend
            // Note: If the backend API *really* needs the ID from the external API,
            // you would use option.value instead of option.textContent here.
            // But based on your API docs showing "province_name": "Jawa Barat", it expects names.
            data.province_name = provinceName;
            data.city_name = cityName;
            // --- End of IMPORTANT section ---


            console.log('Sending data to API:', data);

            try {
                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (response.ok) {
                    if (result.status === 'success') {
                        console.log('Registration successful:', result);
                        localStorage.setItem('token', result.token);
                        localStorage.setItem('user', JSON.stringify(result.data.user));

                        // Dispatch a custom event to notify other components like navbar
                        const loginEvent = new CustomEvent('userLoggedIn', {
                            detail: { user: result.data.user }
                        });
                        window.dispatchEvent(loginEvent);

                        alert('Registration successful!');
                        window.location.href = '/#/login'; // Often redirect to login after register
                    } else {
                        console.error('Registration failed (API error):', result.message, result.errors);
                        alert('Registration failed: ' + result.message + (result.errors ? '\n' + result.errors.map(e => e.msg).join('\n') : ''));
                    }
                } else {
                    console.error('Registration failed (HTTP error):', response.status, result.message, result.errors);
                    alert('Registration failed: ' + result.message + (result.errors ? '\n' + result.errors.map(e => e.msg).join('\n') : 'An unexpected error occurred.'));
                }

            } catch (error) {
                console.error('Error during registration API call:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }
}

customElements.define('register-page', RegisterPage);
