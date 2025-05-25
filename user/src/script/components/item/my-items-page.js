import { apiPost, apiGet, apiPostFormData, apiDelete, apiPatch, apiFormDataRequest } from '../../utils/apiService.js';
// Anda mungkin perlu mengimpor wilayahService jika ingin menggunakan dropdown wilayah di form tambah item
// import { fetchProvinces, fetchCitiesByProvinceId } from '../../utils/wilayahService.js';

// Import fungsi wilayah (disalin dari profile-page/register-page)
// Anda bisa memilih untuk membuat wilayahService.js terpisah jika lebih rapi
const WILAYAH_BASE_URL = 'https://kanglerian.my.id/api-wilayah-indonesia/api';

class MyItemsPage extends HTMLElement {
    constructor() {
        super();
        // Bind methods here if needed
        // this.handleAddItem = this.handleAddItem.bind(this); // Hapus atau komentari ini
        // this.fetchUserItems = this.fetchUserItems.bind(this); // Hapus atau komentari ini
        // Metode sekarang didefinisikan sebagai arrow function menggunakan class field syntax di bawah
        // yang secara otomatis mengikat 'this'.

        // Bind metode wilayah
        this.fetchProvinces = this.fetchProvinces.bind(this);
        this.populateProvincesDropdown = this.populateProvincesDropdown.bind(this);
        this.handleProvinceChange = this.handleProvinceChange.bind(this); // Handle perubahan provinsi
        this.fetchCitiesByProvinceId = this.fetchCitiesByProvinceId.bind(this);
        this.populateCitiesDropdown = this.populateCitiesDropdown.bind(this);

        // Bind metode untuk item pengguna
        this.fetchUserItems = this.fetchUserItems.bind(this);
        this.renderUserItems = this.renderUserItems.bind(this);
        // Bind handler untuk tombol edit/hapus (delegasi)
        this.handleItemActions = this.handleItemActions.bind(this); // Handler delegasi
        this.handleEditItem = this.handleEditItem.bind(this); // Handler edit spesifik (mengambil data & tampilkan form)
        this.handleDeleteItem = this.handleDeleteItem.bind(this); // Handler delete spesifik

        // Bind handler untuk submit form edit
        this.handleUpdateItem = this.handleUpdateItem.bind(this);

        // State untuk menyimpan ID item yang sedang diedit
        this.editingItemId = null;
        // State untuk menyimpan data item yang sedang diedit (opsional, bisa langsung mengisi form)
        this.editingItemData = null;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        // Fetch provinces for the form (baik untuk add maupun edit)
        this.fetchProvinces();
        // Panggil metode untuk menampilkan item pengguna saat ini
        this.fetchUserItems();
    }

    disconnectedCallback() {
        this.removeEventListeners();
        // Hapus event listener untuk province change
        const provinceSelect = this.querySelector('#item-province'); // Bisa jadi #edit-item-province juga jika form edit terpisah
        if (provinceSelect) {
            provinceSelect.removeEventListener('change', this.handleProvinceChange);
        }
        // Hapus event listener delegasi untuk item actions
        const itemListDiv = this.querySelector('#user-items-list');
        if (itemListDiv) {
            itemListDiv.removeEventListener('click', this.handleItemActions);
        }
        // Hapus event listener untuk available rent checkbox
        const availableRentCheckbox = this.querySelector('#item-available-rent'); // Bisa jadi #edit-item-available-rent
        const depositFieldDiv = this.querySelector('#deposit-field'); // Bisa jadi #edit-deposit-field
        if (availableRentCheckbox && depositFieldDiv) {
            // Need reference to remove anonymous function listener
            // Consider refactoring to a named method if cleanup is critical.
        }
        // Hapus event listener untuk submit form edit
        const editItemForm = this.querySelector('#edit-item-form');
        if (editItemForm) {
            editItemForm.removeEventListener('submit', this.handleUpdateItem);
        }
        // Hapus listener untuk tombol cancel edit form jika ada
        const cancelEditButton = this.querySelector('#cancel-edit-button');
        if (cancelEditButton) {
            cancelEditButton.removeEventListener('click', this.hideEditForm); // Assuming hideEditForm method exists/will be created
        }
    }

    render() {
        // Struktur HTML untuk halaman Item Saya
        this.innerHTML = `
            <div class="container mx-auto px-4 py-8 font-opensan">
                <h2 class="text-2xl font-bold mb-4">Item Saya (Toko Saya)</h2>

                <!-- Form untuk Menambah Item Baru -->
                <div id="add-item-section" class="mt-8 p-6 bg-white rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Tambah Item Baru</h3>
                    <form id="add-item-form" class="space-y-4">
                        <div>
                            <label for="item-name" class="block mb-2 text-sm font-medium text-gray-900 font-montserrat font-bold">Nama Item <span class="text-red-500">*</span></label>
                            <input type="text" id="item-name" name="name" required class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        </div>
                         <div>
                            <label for="item-category" class="block mb-2 text-sm font-medium text-gray-900 font-montserrat font-bold">Kategori (Opsional)</label>
                        
                            <input type="number" id="item-category" name="category_id" placeholder="Masukkan ID Kategori" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        </div>
                        <div>
                            <label for="item-description" class="block mb-2 text-sm font-medium text-gray-900 font-montserrat font-bold">Deskripsi (Opsional)</label>
                            <textarea id="item-description" name="description" rows="3" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"></textarea>
                        </div>

                         <!-- Harga Jual dan Sewa -->
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label for="item-price-sell" class="block mb-2 text-sm font-medium text-gray-900 font-montserrat font-bold">Harga Jual (Opsional)</label>
                                 <input type="number" id="item-price-sell" name="price_sell" step="0.01" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                             </div>
                             <div>
                                 <label for="item-price-rent" class="block mb-2 text-sm font-medium text-gray-900 font-montserrat font-bold">Harga Sewa (Opsional)</label>
                                 <input type="number" id="item-price-rent" name="price_rent" step="0.01" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                             </div>
                         </div>

                         <!-- Ketersediaan -->
                         <div class="flex items-center space-x-4">
                             <div class="flex items-center">
                                 <input id="item-available-sell" name="is_available_for_sell" type="checkbox" value="true" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                                 <label for="item-available-sell" class="ml-2 block text-sm text-gray-900 font-opensan">Tersedia untuk Dijual</label>
                             </div>
                             <div class="flex items-center">
                                 <input id="item-available-rent" name="is_available_for_rent" type="checkbox" value="true" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                                 <label for="item-available-rent" class="ml-2 block text-sm text-gray-900 font-opensan">Tersedia untuk Disewa</label>
                             </div>
                         </div>

                          <!-- Deposit Amount (hanya jika bisa disewa) -->
                         <div id="deposit-field" class="hidden">
                             <label for="item-deposit" class="block mb-2 text-sm font-medium text-gray-900 font-montserrat font-bold">Jumlah Deposit (Opsional)</label>
                              <input type="number" id="item-deposit" name="deposit_amount" step="0.01" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                         </div>


                        <!-- Wilayah -->
                           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <!-- Added font-montserrat font-bold for label -->
                                  <label for="item-province" class="block mb-2 text-sm font-medium text-gray-900 font-montserrat font-bold">Provinsi (Opsional)</label>
                                   <!-- Added styling classes for select -->
                                  <select id="edit-item-province" name="province_id" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                       <option value="">Select Province</option>

                                   </select>
                              </div>
                              <div>
                                   <!-- Added font-montserrat font-bold for label -->
                                  <label for="item-city" class="block mb-2 text-sm font-medium text-gray-900 font-montserrat font-bold">Kota/Kabupaten (Opsional)</label>
                                   <!-- Added styling classes for select -->
                                  <select id="edit-item-city" name="city_id" disabled class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                      <option value="">Select City</option>

                                   </select>
                              </div>
                          </div>

                          <!-- Upload Foto Baru -->
                           <div>
                                <!-- Updated label styling -->
                               <label class="block mb-2 text-sm font-medium text-gray-900 font-montserrat font-bold" for="edit-item-photos">Foto Item Baru (Opsional, Multiple)</label>
                               <!-- Updated input file styling -->
                               <input class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" id="edit-item-photos" name="photos" multiple accept="image/*" type="file">
                           </div>


                        <div>
                            <button type="submit" class="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                            Tambah Item
                        </button>
                        </div>
                    </form>
                </div>

                 <!-- Form untuk Edit Item -->
                 <div id="edit-item-section" class="mt-8 p-6 bg-white rounded-lg shadow-md hidden"> 
                     <h3 class="text-xl font-semibold mb-4">Edit Item <span id="editing-item-name" class="font-normal italic text-gray-600"></span></h3>
                     <form id="edit-item-form" class="space-y-4">
                         <!-- Form fields will be similar to add item form, but with different IDs/names if needed -->
                        
                          <div>
                             <label for="item-name" class="block text-sm font-medium text-gray-700">Nama Item <span class="text-red-500">*</span></label>
                             <input type="text" id="edit-item-name" name="name" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                         </div>
                          <div>
                             <label for="item-category" class="block text-sm font-medium text-gray-700">Kategori (Opsional)</label>
                             
                             <input type="number" id="edit-item-category" name="category_id" placeholder="Masukkan ID Kategori" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                         </div>
                         <div>
                             <label for="item-description" class="block text-sm font-medium text-gray-700">Deskripsi (Opsional)</label>
                             <textarea id="edit-item-description" name="description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                         </div>

                          <!-- Harga Jual dan Sewa -->
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label for="item-price-sell" class="block text-sm font-medium text-gray-700">Harga Jual (Opsional)</label>
                                  <input type="number" id="edit-item-price-sell" name="price_sell" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                              </div>
                              <div>
                                  <label for="item-price-rent" class="block text-sm font-medium text-gray-700">Harga Sewa (Opsional)</label>
                                  <input type="number" id="edit-item-price-rent" name="price_rent" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                              </div>
                          </div>

                          <!-- Ketersediaan -->
                          <div class="flex items-center space-x-4">
                              <div class="flex items-center">
                                  <input id="edit-item-available-sell" name="is_available_for_sell" type="checkbox" value="true" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                                  <label for="edit-item-available-sell" class="ml-2 block text-sm text-gray-900">Tersedia untuk Dijual</label>
                              </div>
                              <div class="flex items-center">
                                  <input id="edit-item-available-rent" name="is_available_for_rent" type="checkbox" value="true" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                                  <label for="edit-item-available-rent" class="ml-2 block text-sm text-gray-900">Tersedia untuk Disewa</label>
                              </div>
                          </div>

                           <!-- Deposit Amount (hanya jika bisa disewa) -->
                          <div id="edit-deposit-field" class="hidden"> 
                              <label for="item-deposit" class="block text-sm font-medium text-gray-700">Jumlah Deposit (Opsional)</label>
                               <input type="number" id="edit-item-deposit" name="deposit_amount" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                          </div>


                          <!-- Wilayah -->
                           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label for="item-province" class="block text-sm font-medium text-gray-700">Provinsi (Opsional)</label>
                                  <select id="edit-item-province" name="province_id" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                       <option value="">Select Province</option>
                                     
                                   </select>
                              </div>
                              <div>
                                  <label for="item-city" class="block text-sm font-medium text-gray-700">Kota/Kabupaten (Opsional)</label>
                                  <select id="edit-item-city" name="city_id" disabled class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                      <option value="">Select City</option>
                                     
                                   </select>
                              </div>
                          </div>

                          <!-- Upload Foto Baru -->
                           <div>
                               <label for="item-photos" class="block text-sm font-medium text-gray-700">Foto Item Baru (Opsional, Multiple)</label>
                              <input type="file" id="edit-item-photos" name="photos" multiple accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
                           </div>
                          


                         <div class="flex space-x-4">
                             <button type="submit" class="flex-1 justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                                 Simpan Perubahan
                             </button>
                              <button type="button" id="cancel-edit-button" class="flex-1 justify-center rounded-md bg-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-400">
                                 Batal
                             </button>
                         </div>
                     </form>
                 </div>


                <hr class="my-8">

                <!-- Daftar Item Pengguna -->
                <div class="mt-8">
                    <h3 class="text-xl font-semibold mb-2">Daftar Item Anda</h3>
                    <div id="user-items-list">
                      
                         <p>Loading items...</p>
                         
                    </div>
                </div>

            </div>
        `;
    }

    setupEventListeners() {
        const addItemForm = this.querySelector('#add-item-form');
        if (addItemForm) {
            addItemForm.addEventListener('submit', this.handleAddItem);
        }

        // Setup listener for province select change (Add form)
        const provinceSelectAdd = this.querySelector('#item-province');
        if (provinceSelectAdd) {
            provinceSelectAdd.addEventListener('change', this.handleProvinceChange);
        }

        // Setup listener for available rent checkbox (Add form)
        const availableRentCheckboxAdd = this.querySelector('#item-available-rent');
        const depositFieldDivAdd = this.querySelector('#deposit-field');
        if (availableRentCheckboxAdd && depositFieldDivAdd) {
            availableRentCheckboxAdd.addEventListener('change', (event) => {
                if (event.target.checked) {
                    depositFieldDivAdd.classList.remove('hidden');
                } else {
                    depositFieldDivAdd.classList.add('hidden');
                }
            });
        }


        // Setup event delegation for item actions (Edit/Delete buttons)
        const itemListDiv = this.querySelector('#user-items-list');
        if (itemListDiv) {
            itemListDiv.addEventListener('click', this.handleItemActions); // Menggunakan handler delegasi
        }

        // Setup event listener for Edit form submission
        const editItemForm = this.querySelector('#edit-item-form');
        if (editItemForm) {
            editItemForm.addEventListener('submit', this.handleUpdateItem); // Menggunakan handler update
        }

        // Setup listener for province select change (Edit form)
        const provinceSelectEdit = this.querySelector('#edit-item-province');
        if (provinceSelectEdit) {
            provinceSelectEdit.addEventListener('change', this.handleProvinceChangeForEditForm.bind(this)); // Bind handler khusus edit form
        }

        // Setup listener for available rent checkbox (Edit form)
        const availableRentCheckboxEdit = this.querySelector('#edit-item-available-rent');
        const depositFieldDivEdit = this.querySelector('#edit-deposit-field');
        if (availableRentCheckboxEdit && depositFieldDivEdit) {
            availableRentCheckboxEdit.addEventListener('change', (event) => {
                if (event.target.checked) {
                    depositFieldDivEdit.classList.remove('hidden');
                } else {
                    depositFieldDivEdit.classList.add('hidden');
                }
            });
        }

        // Setup listener for Cancel button on Edit form
        const cancelEditButton = this.querySelector('#cancel-edit-button');
        if (cancelEditButton) {
            cancelEditButton.addEventListener('click', this.hideEditForm.bind(this));
        }
    }

    removeEventListeners() {
        const addItemForm = this.querySelector('#add-item-form');
        if (addItemForm) {
            addItemForm.removeEventListener('submit', this.handleAddItem);
        }

        // Hapus event listener untuk province change (Add form)
        const provinceSelectAdd = this.querySelector('#item-province');
        if (provinceSelectAdd) {
            provinceSelectAdd.removeEventListener('change', this.handleProvinceChange);
        }

        // Hapus event listener untuk available rent checkbox (Add form)
        const availableRentCheckboxAdd = this.querySelector('#item-available-rent');
        // ... cleanup logic ...

        // Hapus event listener delegasi untuk item actions
        const itemListDiv = this.querySelector('#user-items-list');
        if (itemListDiv) {
            itemListDiv.removeEventListener('click', this.handleItemActions);
        }

        // Hapus event listener untuk submit form edit
        const editItemForm = this.querySelector('#edit-item-form');
        if (editItemForm) {
            editItemForm.removeEventListener('submit', this.handleUpdateItem);
        }

        // Hapus event listener untuk province change (Edit form)
        const provinceSelectEdit = this.querySelector('#edit-item-province');
        if (provinceSelectEdit) {
            provinceSelectEdit.removeEventListener('change', this.handleProvinceChangeForEditForm.bind(this));
        }

        // Hapus event listener untuk available rent checkbox (Edit form)
        const availableRentCheckboxEdit = this.querySelector('#edit-item-available-rent');
        // ... cleanup logic ...

        // Hapus listener untuk tombol cancel edit form
        const cancelEditButton = this.querySelector('#cancel-edit-button');
        if (cancelEditButton) {
            cancelEditButton.removeEventListener('click', this.hideEditForm.bind(this));
        }

    }

    // Metode untuk menampilkan form tambah item dan menyembunyikan form edit
    showAddForm() {
        this.querySelector('#add-item-section').classList.remove('hidden');
        this.querySelector('#edit-item-section').classList.add('hidden');
        // Reset form tambah
        const addItemForm = this.querySelector('#add-item-form');
        if (addItemForm) addItemForm.reset();
        // Reset dropdown wilayah form tambah
        const provinceSelectAdd = this.querySelector('#item-province');
        const citySelectAdd = this.querySelector('#item-city');
        if (provinceSelectAdd) provinceSelectAdd.value = '';
        if (citySelectAdd) { citySelectAdd.innerHTML = '<option value="">Select City</option>'; citySelectAdd.disabled = true; }
        // Sembunyikan deposit field form tambah
        const depositFieldDivAdd = this.querySelector('#deposit-field');
        if (depositFieldDivAdd) depositFieldDivAdd.classList.add('hidden');

        this.editingItemId = null; // Clear editing state
    }

    // Metode untuk menampilkan form edit item dan menyembunyikan form tambah
    showEditForm() {
        this.querySelector('#add-item-section').classList.add('hidden');
        this.querySelector('#edit-item-section').classList.remove('hidden');
    }

    // Metode untuk menyembunyikan form edit dan menampilkan form tambah
    hideEditForm() {
        this.showAddForm(); // Simply show add form which also hides edit form
    }


    // Ubah definisi metode ini menjadi arrow function (class field syntax)
    handleAddItem = async (event) => {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // Handle boolean values for checkboxes explicitly
        const availableSellCheckbox = form.querySelector('#item-available-sell');
        const availableRentCheckbox = form.querySelector('#item-available-rent');

        formData.delete('is_available_for_sell');
        formData.delete('is_available_for_rent');
        formData.append('is_available_for_sell', availableSellCheckbox.checked ? 'true' : 'false');
        formData.append('is_available_for_rent', availableRentCheckbox.checked ? 'true' : 'false');

        // Handle deposit_amount visibility based on is_available_for_rent checkbox
        const depositInput = form.querySelector('#item-deposit');
        if (!availableRentCheckbox.checked || !depositInput.value) {
            formData.delete('deposit_amount'); // Hapus jika tidak disewa atau input deposit kosong
        } else {
            // Ensure deposit is a valid number string if available for rent and value exists
            // No need to append if already there, but conversion might be needed by backend
            // FormData sends string, backend should parse.
        }


        // Pastikan price_sell, price_rent, dikirim sebagai angka atau null/undefined jika kosong
        const priceSellInput = form.querySelector('#item-price-sell');
        const priceRentInput = form.querySelector('#item-price-rent');

        if (!priceSellInput.value) formData.delete('price_sell');
        if (!priceRentInput.value) formData.delete('price_rent');


        // --- Handle category_id ---
        const categoryInput = form.querySelector('#item-category');
        if (!categoryInput.value) {
            formData.delete('category_id'); // Hapus category_id jika input kosong
        }
        // --- End Tambahan Category ---


        // --- Handle province_id, province_name, city_id, city_name ---
        const provinceSelect = this.querySelector('#item-province');
        const citySelect = this.querySelector('#item-city');

        const selectedProvinceOption = provinceSelect.options[provinceSelect.selectedIndex];
        const selectedCityOption = citySelect.options[citySelect.selectedIndex];

        formData.delete('province_id');
        formData.delete('province_name');
        formData.delete('city_id');
        formData.delete('city_name');

        if (selectedProvinceOption && selectedProvinceOption.value) {
            formData.append('province_id', selectedProvinceOption.value);
            formData.append('province_name', selectedProvinceOption.textContent);
        }

        if (selectedCityOption && selectedCityOption.value) {
            formData.append('city_id', selectedCityOption.value);
            formData.append('city_name', selectedCityOption.textContent);
        }
        // --- End Handle Wilayah ---

        console.log('Sending new item FormData:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }

        try {
            // Gunakan apiFormDataRequest dengan method 'POST'
            const result = await apiFormDataRequest('POST', '/items', formData); // <<< Use apiFormDataRequest

            if (result.status === 'success') {
                console.log('Item added successfully:', result.data.item);
                alert('Item berhasil ditambahkan!');
                // Setelah berhasil menambah, kembali ke form tambah dan refresh list
                this.showAddForm(); // Reset form tambah dan sembunyikan form edit
                this.fetchUserItems(); // Refresh daftar item pengguna
            } else {
                console.error('Failed to add item (API error):', result.message, result.errors);
                // Coba tampilkan error validasi spesifik jika ada
                let errorMessage = 'Gagal menambahkan item: ' + result.message;
                if (result.errors && Array.isArray(result.errors)) {
                    errorMessage += '\nValidasi error:';
                    result.errors.forEach(err => {
                        errorMessage += `\n- ${err.param}: ${err.msg}`;
                    });
                }
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Terjadi kesalahan saat menambahkan item. Silakan coba lagi.');
        }
    }

    // ================================================================
    // Metode untuk mengelola dropdown wilayah (Disalin dari profile-page/register-page)
    // Digunakan untuk form tambah dan form edit
    // ================================================================

    // Method to fetch provinces from external API
    async fetchProvinces() {
        // Fetches provinces once and populates both dropdowns
        const provinceSelectAdd = this.querySelector('#item-province');
        const provinceSelectEdit = this.querySelector('#edit-item-province');

        // Clear existing options except the first one for both dropdowns
        if (provinceSelectAdd) provinceSelectAdd.innerHTML = '<option value="">Select Province</option>';
        if (provinceSelectEdit) provinceSelectEdit.innerHTML = '<option value="">Select Province</option>';


        try {
            const response = await fetch(`${WILAYAH_BASE_URL}/provinces.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const provinces = await response.json();
            // Populate both dropdowns with the fetched provinces
            this.populateProvincesDropdown(provinces, provinceSelectAdd);
            this.populateProvincesDropdown(provinces, provinceSelectEdit);
        } catch (error) {
            console.error('Error fetching provinces for item forms:', error);
            // alert('Failed to load provinces. Please try again later.');
        }
    }

    // Method to populate a given province dropdown element
    populateProvincesDropdown(provinces, selectElement) {
        if (selectElement) {
            provinces.forEach(province => {
                const option = document.createElement('option');
                option.value = province.id; // Use province ID as value
                option.textContent = province.name; // Display province name
                selectElement.appendChild(option);
            });
        }
    }

    // Handler for province select change (used for ADD form)
    async handleProvinceChange(event) {
        const provinceId = event.target.value;
        const citySelect = this.querySelector('#item-city'); // Target city dropdown in ADD form
        if (!citySelect) return;

        // Reset city dropdown
        citySelect.innerHTML = '<option value="">Select City</option>';
        citySelect.disabled = true;

        if (provinceId) {
            await this.fetchCitiesByProvinceId(provinceId, citySelect); // Pass citySelect element
            // citySelect.disabled = false; // Enabled in fetchCitiesByProvinceId
        }
    }

    // Handler for province select change (used for EDIT form)
    async handleProvinceChangeForEditForm(event) {
        const provinceId = event.target.value;
        const citySelect = this.querySelector('#edit-item-city'); // Target city dropdown in EDIT form
        if (!citySelect) return;

        // Reset city dropdown
        citySelect.innerHTML = '<option value="">Select City</option>';
        citySelect.disabled = true;

        if (provinceId) {
            await this.fetchCitiesByProvinceId(provinceId, citySelect); // Pass citySelect element
            // citySelect.disabled = false; // Enabled in fetchCitiesByProvinceId
        }
    }


    // Method to fetch cities by province ID from external API and populate a given city dropdown
    async fetchCitiesByProvinceId(provinceId, citySelectElement) {
        if (!citySelectElement) return [];

        citySelectElement.disabled = true; // Disable while fetching
        citySelectElement.innerHTML = '<option value="">Loading Cities...</option>'; // Loading message

        try {
            const response = await fetch(`${WILAYAH_BASE_URL}/regencies/${provinceId}.json`);
            if (!response.ok) {
                citySelectElement.innerHTML = '<option value="">Error loading cities</option>'; // Error message
                if (response.status === 404) {
                    console.warn(`No cities found for province ID: ${provinceId}`);
                } else {
                    console.error(`HTTP error! status: ${response.status} fetching cities for province ${provinceId}`);
                }
                citySelectElement.disabled = true; // Keep disabled on error
                return []; // Return empty array on error

            }
            const cities = await response.json();
            this.populateCitiesDropdown(cities, citySelectElement); // Populate the specific city dropdown
            citySelectElement.disabled = false; // Enable city select after fetching
            return cities; // Return the fetched cities array
        } catch (error) {
            console.error(`Error fetching cities for province ${provinceId}:`, error);
            citySelectElement.innerHTML = '<option value="">Error loading cities</option>'; // Error message
            citySelectElement.disabled = true; // Keep disabled on error
            return []; // Return empty array on error
        }
    }

    // Method to populate a given city dropdown element
    populateCitiesDropdown(cities, selectElement) {
        if (selectElement) {
            selectElement.innerHTML = '<option value="">Select City</option>'; // Reset options
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.id; // Use city ID as value
                option.textContent = city.name; // Display city name
                selectElement.appendChild(option);
            });
        }
    }


    // ================================================================
    // Metode untuk mengambil dan menampilkan item pengguna
    // ================================================================

    async fetchUserItems() {
        const itemListDiv = this.querySelector('#user-items-list');
        if (itemListDiv) {
            itemListDiv.innerHTML = '<p>Loading items...</p>'; // Tampilkan pesan loading
        }

        try {
            // Dapatkan ID pengguna yang login dari localStorage user data
            const user = localStorage.getItem('user');
            if (!user) {
                console.error("User not found in localStorage. Cannot fetch items.");
                this.renderUserItems([]); // Render list kosong
                return;
            }
            const userId = JSON.parse(user).id; // Ambil ID dari localStorage

            // Gunakan apiGet untuk mengambil data item pengguna
            // Gunakan GET /items dengan query parameter user_id
            const result = await apiGet(`/items?user_id=${userId}`); // <<< Endpoint ini sudah benar

            if (result.status === 'success') {
                const items = result.data; // RESPONS GET /items MENGEMBALIKAN ARRAY LANGSUNG DI data
                console.log('User Items:', items);
                this.renderUserItems(items); // Panggil metode untuk menampilkan item
            } else {
                console.error('Failed to fetch user items:', result.message);
                this.renderUserItems([]); // Render list kosong atau pesan error
            }
        } catch (error) {
            console.error('Error fetching user items:', error);
            this.renderUserItems([]); // Render list kosong atau pesan error
        }
    }

    renderUserItems(items) {
        const itemListDiv = this.querySelector('#user-items-list');
        if (itemListDiv) {
            itemListDiv.innerHTML = ''; // Bersihkan daftar sebelumnya

            if (items && Array.isArray(items) && items.length > 0) {
                items.forEach(item => {
                    // Determine status display based on item.status
                    let statusDisplay = '';
                    let statusColorClass = ''; // Tailwind color class for status badge/text

                    switch (item.status) {
                        case 'available':
                            statusDisplay = 'Available';
                            statusColorClass = 'text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs font-semibold font-opensan'; // Green badge, added font-opensan
                            break;
                        case 'rented':
                            statusDisplay = 'Rented';
                            statusColorClass = 'text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full text-xs font-semibold font-opensan'; // Yellow badge, added font-opensan
                            break;
                        case 'sold':
                            statusDisplay = 'Sold';
                            statusColorClass = 'text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs font-semibold font-opensan'; // Red badge, added font-opensan
                            break;
                        default:
                            statusDisplay = item.status || 'Unknown Status';
                            statusColorClass = 'text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold font-opensan'; // Default gray badge, added font-opensan
                    }


                    // Buat elemen HTML untuk setiap item
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('mt-4', 'p-6', 'bg-gray-800', 'rounded-lg', 'shadow-md', 'text-white');
                    // Tambahkan data-item-id ke itemElement juga untuk memudahkan akses ID dari handler delegasi jika diperlukan
                    // itemElement.dataset.itemId = item.id; // Not strictly needed here, buttons have it

                    // Buat div inner untuk konten item yang akan diflex
                    const itemContentDiv = document.createElement('div');
                    itemContentDiv.classList.add('flex', 'justify-between', 'items-center', 'flex-wrap'); // Add flex properties here

                    itemContentDiv.innerHTML = `
                         <div class="flex items-center mb-2 md:mb-0 w-full md:w-auto">
                             ${item.thumbnail ? `<img src="http://localhost:5000${item.thumbnail}" alt="Thumbnail ${item.name}" class="w-16 h-16 object-cover rounded mr-4">` : ''}
                            <div>
                                <h4 class="text-lg font-montserrat font-bold">${item.name} <span class="${statusColorClass}">${statusDisplay}</span></h4>
                                <p class="text-sm text-white font-opensan">${item.description || 'Tidak ada deskripsi'}</p>
                                <p class="text-sm text-white font-opensan">Kategori: ${item.category_name || '-'}</p>
                                <p class="text-sm text-white font-opensan">Lokasi: ${item.city_name || '-'}, ${item.province_name || '-'}</p>
                            </div>
                         </div>
                         <div class="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-2 md:mt-0 font-opensan">
                             <p class="text-sm font-semibold text-white">${item.price_sell ? 'Jual: Rp ' + parseFloat(item.price_sell).toLocaleString('id-ID') : '-'}</p>
                              <p class="text-sm font-semibold text-white">${item.price_rent ? 'Sewa: Rp ' + parseFloat(item.price_rent).toLocaleString('id-ID') + '/hari' : '-'}</p>
                               ${item.is_available_for_rent ? `<p class="text-sm font-semibold text-white">${item.deposit_amount ? 'Deposit: Rp ' + parseFloat(item.deposit_amount).toLocaleString('id-ID') : '-'}</p>` : ''}
                         </div>
                        <div class="flex space-x-2 mt-4 md:mt-0">

                            <button class="edit-item-button bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-1 rounded" data-item-id="${item.id}">Edit</button>
                            <button class="delete-item-button bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded" data-item-id="${item.id}">Hapus</button>
                        </div>
                    `;

                    // Masukkan konten item ke dalam container
                    itemElement.appendChild(itemContentDiv);

                    itemListDiv.appendChild(itemElement);
                });
            } else {
                itemListDiv.innerHTML = '<p class="text-gray-700 font-opensan">Anda belum memiliki item yang diposting.</p>'; // Adjusted message styling
            }
        }
    }

    // ================================================================
    // Handler untuk event delegasi pada daftar item
    // ================================================================
    handleItemActions(event) {
        const target = event.target;

        // Periksa apakah yang diklik adalah tombol Edit
        if (target.classList.contains('edit-item-button')) {
            const itemId = target.dataset.itemId;
            if (itemId) {
                this.handleEditItem(itemId); // Panggil handler edit spesifik
            }
        }

        // Periksa apakah yang diklik adalah tombol Hapus
        if (target.classList.contains('delete-item-button')) {
            const itemId = target.dataset.itemId;
            if (itemId) {
                this.handleDeleteItem(itemId); // Panggil handler delete spesifik
            }
        }
    }


    // ================================================================
    // Implementasi handler untuk tombol Edit dan Hapus
    // ================================================================

    // Implementasi handler untuk tombol Edit (Mengambil data dan menampilkan form)
    async handleEditItem(itemId) {
        console.log('Attempting to edit item with ID:', itemId);

        // Simpan ID item yang sedang diedit
        this.editingItemId = itemId;

        try {
            // Ambil detail item dari backend menggunakan GET /items/:id
            // Endpoint ini TIDAK memerlukan autentikasi berdasarkan dokumentasi Anda
            const result = await apiGet(`/items/${itemId}`); // Menggunakan apiGet

            if (result.status === 'success') {
                this.editingItemData = result.data; // Simpan data item untuk diisi ke form
                console.log('Fetched item details for editing:', this.editingItemData);

                // Tampilkan form edit dan sembunyikan form tambah
                this.showEditForm();
                // Isi form edit dengan data item yang diambil
                this.populateEditForm(this.editingItemData);

            } else {
                console.error('Failed to fetch item details for editing:', result.message);
                alert('Gagal mengambil detail item untuk diedit: ' + result.message);
                // Reset editing state jika gagal
                this.editingItemId = null;
                this.editingItemData = null;
            }
        } catch (error) {
            console.error('Error fetching item details for editing:', error);
            // apiService sudah menangani 401/403 jika endpoint GET /items/:id diubah butuh auth
            // Tangani error lain jika perlu
            alert('Terjadi kesalahan saat mengambil detail item.');
            // Reset editing state jika error
            this.editingItemId = null;
            this.editingItemData = null;
        }
    }

    // Metode untuk mengisi form edit dengan data item
    async populateEditForm(item) {
        const form = this.querySelector('#edit-item-form');
        if (!form || !item) return;

        // Isi input teks/angka/textarea
        form.querySelector('#edit-item-name').value = item.name || '';
        // Perbaikan: Ambil elemen judul dari root komponen (this), bukan dari form
        const editingItemNameSpan = this.querySelector('#editing-item-name');
        if (editingItemNameSpan) {
            editingItemNameSpan.textContent = item.name || ''; // Update judul form
        }

        form.querySelector('#edit-item-category').value = item.category_id || '';
        form.querySelector('#edit-item-description').value = item.description || '';
        form.querySelector('#edit-item-price-sell').value = item.price_sell || '';
        form.querySelector('#edit-item-price-rent').value = item.price_rent || '';

        // Isi checkbox ketersediaan
        form.querySelector('#edit-item-available-sell').checked = item.is_available_for_sell === 1 || item.is_available_for_sell === true;
        form.querySelector('#edit-item-available-rent').checked = item.is_available_for_rent === 1 || item.is_available_for_rent === true;

        // Tampilkan/sembunyikan field deposit dan isi nilainya
        const depositFieldDiv = this.querySelector('#edit-deposit-field');
        const depositInput = form.querySelector('#edit-item-deposit');
        if (item.is_available_for_rent === 1 || item.is_available_for_rent === true) {
            if (depositFieldDiv) depositFieldDiv.classList.remove('hidden'); // Tambahkan cek elemen
            if (depositInput) depositInput.value = item.deposit_amount || ''; // Tambahkan cek elemen
        } else {
            if (depositFieldDiv) depositFieldDiv.classList.add('hidden'); // Tambahkan cek elemen
            if (depositInput) depositInput.value = ''; // Tambahkan cek elemen
        }

        // Isi dropdown wilayah
        const provinceSelect = form.querySelector('#edit-item-province');
        const citySelect = form.querySelector('#edit-item-city');

        // Set nilai provinsi
        if (item.province_id && provinceSelect) {
            provinceSelect.value = item.province_id;

            // Karena pilihan provinsi berubah, kita perlu memuat daftar kota untuk provinsi itu
            // dan kemudian memilih kota yang sesuai dengan item.city_id
            // Kita bisa memicu event 'change' pada dropdown provinsi atau langsung panggil fetchCitiesByProvinceId
            // Memanggil langsung fetchCitiesByProvinceId lebih reliable daripada memicu event
            // Pastikan citySelect ada sebelum memanggil fetchCitiesByProvinceId
            if (citySelect) {
                const cities = await this.fetchCitiesByProvinceId(item.province_id, citySelect); // Panggil fetchCitiesByProvinceId dengan elemen citySelect form edit
                // Setelah cities terisi, atur nilai kota jika item memiliki city_id
                if (item.city_id) { // citySelect check already done above
                    citySelect.value = item.city_id;
                }
                citySelect.disabled = false; // Pastikan dropdown kota aktif setelah provinsi dipilih
            }


        } else {
            // Jika item tidak punya province_id, pastikan dropdown wilayah kosong dan kota nonaktif
            if (provinceSelect) provinceSelect.value = '';
            if (citySelect) { citySelect.innerHTML = '<option value="">Select City</option>'; citySelect.disabled = true; }
        }

        // TODO: Tampilkan foto item yang sudah ada dan opsi untuk menghapusnya
        // Ini memerlukan logika tambahan untuk menampilkan gambar, mungkin di samping form.
    }


    // Handler untuk submit form edit
    handleUpdateItem = async (event) => {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // Pastikan kita memiliki ID item yang sedang diedit
        if (!this.editingItemId) {
            console.error("No item ID set for editing.");
            alert("Terjadi kesalahan: ID item yang diedit tidak ditemukan.");
            return;
        }

        // Handle boolean values for checkboxes explicitly
        const availableSellCheckbox = form.querySelector('#edit-item-available-sell');
        const availableRentCheckbox = form.querySelector('#edit-item-available-rent');

        formData.delete('is_available_for_sell');
        formData.delete('is_available_for_rent');
        formData.append('is_available_for_sell', availableSellCheckbox.checked ? 'true' : 'false');
        formData.append('is_available_for_rent', availableRentCheckbox.checked ? 'true' : 'false');

        // Handle deposit_amount visibility based on is_available_for_rent checkbox
        const depositInput = form.querySelector('#edit-item-deposit');
        if (!availableRentCheckbox.checked || !depositInput.value) {
            formData.delete('deposit_amount'); // Hapus jika tidak disewa atau input deposit kosong
        } else {
            // Ensure deposit is a valid number string if available for rent and value exists
            // No need to append if already there, but conversion might be needed by backend
            // FormData sends string, backend should parse.
        }


        // Pastikan price_sell, price_rent, dikirim sebagai angka atau null/undefined jika kosong
        const priceSellInput = form.querySelector('#edit-item-price-sell');
        const priceRentInput = form.querySelector('#edit-item-price-rent');

        if (!priceSellInput.value) formData.delete('price_sell');
        if (!priceRentInput.value) formData.delete('price_rent');


        // --- Handle category_id ---
        const categoryInput = form.querySelector('#edit-item-category');
        if (!categoryInput.value) {
            formData.delete('category_id'); // Hapus category_id jika input kosong
        }
        // --- End Tambahan Category ---


        // --- Handle province_id, province_name, city_id, city_name ---
        const provinceSelect = this.querySelector('#edit-item-province');
        const citySelect = this.querySelector('#edit-item-city');

        const selectedProvinceOption = provinceSelect.options[provinceSelect.selectedIndex];
        const selectedCityOption = citySelect.options[citySelect.selectedIndex];

        formData.delete('province_id');
        formData.delete('province_name');
        formData.delete('city_id');
        formData.delete('city_name');

        if (selectedProvinceOption && selectedProvinceOption.value) {
            formData.append('province_id', selectedProvinceOption.value);
            formData.append('province_name', selectedProvinceOption.textContent);
        }

        if (selectedCityOption && selectedCityOption.value) {
            formData.append('city_id', selectedCityOption.value);
            formData.append('city_name', selectedCityOption.textContent);
        }
        // --- End Handle Wilayah ---

        console.log(`Sending updated item data for ID ${this.editingItemId}:`, formData);
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }

        try {
            // Gunakan apiFormDataRequest dengan method 'PATCH' dan endpoint yang menyertakan ID item
            const result = await apiFormDataRequest('PATCH', `/items/${this.editingItemId}`, formData); // <<< Use apiFormDataRequest with PATCH

            if (result.status === 'success') {
                console.log('Item updated successfully:', result.data);
                alert('Item berhasil diperbarui!');
                // Setelah berhasil update, kembali ke form tambah dan refresh list
                this.hideEditForm(); // Sembunyikan form edit dan tampilkan form tambah
                this.fetchUserItems(); // Refresh daftar item pengguna
            } else {
                console.error('Failed to update item (API error):', result.message, result.errors);
                let errorMessage = 'Gagal memperbarui item: ' + result.message;
                if (result.errors && Array.isArray(result.errors)) {
                    errorMessage += '\nValidasi error:';
                    result.errors.forEach(err => {
                        errorMessage += `\n- ${err.param}: ${err.msg}`;
                    });
                }
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error updating item:', error);
            // apiService sudah menangani 401/403 jika endpoint PATCH butuh auth
            alert('Terjadi kesalahan saat memperbarui item. Silakan coba lagi.');
        }
    }


    async handleDeleteItem(itemId) {
        console.log('Delete item:', itemId);
        if (confirm(`Apakah Anda yakin ingin menghapus item ini (ID: ${itemId})?`)) {
            try {
                // Gunakan apiDelete dari apiService
                const result = await apiDelete(`/items/${itemId}`); // Sesuaikan endpoint DELETE jika berbeda

                if (result.status === 'success') {
                    console.log('Item deleted successfully:', result);
                    alert('Item berhasil dihapus!');
                    // Refresh daftar item setelah sukses menghapus
                    this.fetchUserItems(); // <<< REFRESH LIST SETELAH DELETE
                } else {
                    console.error('Failed to delete item:', result.message);
                    alert('Gagal menghapus item: ' + result.message);
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('Terjadi kesalahan saat menghapus item. Silakan coba lagi.');
            }
        }
    }


}

customElements.define('my-items-page', MyItemsPage);
