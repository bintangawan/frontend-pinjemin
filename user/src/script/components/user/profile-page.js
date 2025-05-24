import { apiGet, apiPatch, apiDelete, clearAuthData } from '../../utils/apiService.js'; // Import fungsi dari apiService
// Tidak perlu import wilayahService lagi
// import { fetchProvinces, fetchCitiesByProvinceId } from '../../utils/wilayahService.js';

class ProfilePage extends HTMLElement {
    constructor() {
        super();
        // Bind methods jika diperlukan, terutama untuk event handlers
        this.fetchUserProfile = this.fetchUserProfile.bind(this);
        this.handleUpdateProfile = this.handleUpdateProfile.bind(this); // Contoh handler submit form
        // Jika ada form update password
        // this.handleUpdatePassword = this.handleUpdatePassword.bind(this);
        this.handleProvinceChangeForUpdateForm = this.handleProvinceChangeForUpdateForm.bind(this); // Bind handler perubahan provinsi

        // Bind metode wilayah yang disalin
        this.fetchProvinces = this.fetchProvinces.bind(this);
        this.populateProvincesDropdown = this.populateProvincesDropdown.bind(this);
        this.fetchCitiesByProvinceId = this.fetchCitiesByProvinceId.bind(this);
        this.populateCitiesDropdown = this.populateCitiesDropdown.bind(this);
        this.setupProvinceChangeListener = this.setupProvinceChangeListener.bind(this); // Bind setup listener
        this.setWilayahDropdowns = this.setWilayahDropdowns.bind(this); // Bind method untuk set nilai dropdown awal


        // State internal komponen jika ada
        this.user = null;
        // Tidak perlu menyimpan daftar provinsi/kota di state jika langsung mengisi dropdown
        // this.provinces = []; // Untuk menyimpan daftar provinsi
        // this.cities = [];     // Untuk menyimpan daftar kota
    }

    connectedCallback() {
        // Render struktur HTML awal
        this.render();
        // Setup event listeners untuk form atau tombol update SEBELUM fetch data agar elemennya ada
        this.setupEventListeners(); // Pindah ke sini
        // Ambil data profil saat komponen terhubung ke DOM
        this.fetchUserProfile();
        // Fetch data wilayah (provinsi) saat komponen terhubung
        this.fetchProvinces(); // Panggil metode fetch provinces yang disalin
        this.setupProvinceChangeListener(); // Panggil setup listener yang disalin
    }

    disconnectedCallback() {
        // Hapus event listeners jika diperlukan untuk cleanup
        this.removeEventListeners();
        // Hapus event listener untuk province change di form update
        const updateProvinceSelect = this.querySelector('#update-province');
        if (updateProvinceSelect) {
            updateProvinceSelect.removeEventListener('change', this.handleProvinceChangeForUpdateForm);
        }
    }

    render() {
        // Definisikan struktur HTML untuk halaman profil di sini
        // HTML ini akan menampilkan info pengguna, form update profil, form update password, dll.
        this.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <h2 class="text-2xl font-bold mb-6 text-gray-800">Profil Pengguna</h2>

                <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                    <div id="profile-info" class="mb-6 pb-4 border-b border-gray-200">
                        <h3 class="text-xl font-semibold mb-4 text-gray-700">Informasi Akun</h3>
                        <p class="mb-2 text-gray-600"><strong>Nama:</strong> <span id="user-name">Loading...</span></p>
                        <p class="mb-2 text-gray-600"><strong>Email:</strong> <span id="user-email">Loading...</span></p>
                        <p class="mb-2 text-gray-600"><strong>Provinsi:</strong> <span id="user-province">Loading...</span></p>
                        <p class="mb-2 text-gray-600"><strong>Kota:</strong> <span id="user-city">Loading...</span></p>
                    </div>

                    <div>
                        <h3 class="text-xl font-semibold mb-4 text-gray-700">Perbarui Profil</h3>
                        <form id="update-profile-form" class="space-y-4">
                            <div>
                                <label for="update-name" class="block text-sm font-medium text-gray-700">Nama</label>
                                <input type="text" id="update-name" name="name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-2">
                            </div>
                            
                             <div>
                                <label for="update-province" class="block text-sm font-medium text-gray-700">Provinsi</label>
                                <select id="update-province" name="province_id" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-2">
                                     <option value="">Pilih Provinsi</option>

                                 </select>
                            </div>
                             <div>
                                <label for="update-city" class="block text-sm font-medium text-gray-700">Kota/Kabupaten</label>
                                <select id="update-city" name="city_id" disabled class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <option value="">Pilih Kota</option>

                                 </select>
                            </div>
                            <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                               Perbarui
                            </button>
                        </form>
                    </div>
                </div>


                <div class="bg-white p-6 rounded-lg shadow-md">
                     <h3 class="text-xl font-semibold mb-4 text-gray-700">Ubah Kata Sandi</h3>
                     <form id="update-password-form" class="space-y-4">
                         <div>
                             <label for="current-password" class="block text-sm font-medium text-gray-700">Kata Sandi Saat Ini</label>
                             <input type="password" id="current-password" name="currentPassword" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-2">
                         </div>
                          <div>
                             <label for="new-password" class="block text-sm font-medium text-gray-700">Kata Sandi Baru</label>
                             <input type="password" id="new-password" name="newPassword" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-2">
                         </div>
                         <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Ubah Kata Sandi
                         </button>
                     </form>
                 </div>

            </div>
        `;
    }

    // ================================================================
    // Metode-metode yang menggunakan apiService
    // Kode fetchUserProfile dan updateUserProfile dari contoh Anda dipindahkan ke sini
    // ================================================================

    async fetchUserProfile() {
        try {
            // Gunakan apiGet dari apiService
            const result = await apiGet('/auth/me');
            if (result.status === 'success') {
                this.user = result.data.user; // Simpan data user di state komponen
                console.log('User Profile:', this.user);
                this.updateUIWithUserProfile(); // Panggil metode untuk menampilkan data
                // Setelah data user didapat dan UI awal diupdate, set nilai dropdown wilayah
                this.setWilayahDropdowns(); // Panggil metode untuk set nilai dropdown awal
            } else {
                console.error('Failed to fetch user profile:', result.message);
                // Tampilkan pesan error di UI
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // apiService sudah menangani 401/403 (redirect ke login)
            // Tangani error lain jika perlu, misalnya tampilkan pesan error generik
        }
    }

    async handleUpdateProfile(event) {
        event.preventDefault(); // Cegah refresh halaman

        const form = event.target;
        const formData = new FormData(form);
        const profileData = Object.fromEntries(formData.entries());

        // Dapatkan ID dan Nama provinsi serta kota dari dropdown yang dipilih
        const provinceSelect = this.querySelector('#update-province');
        const citySelect = this.querySelector('#update-city');
        const selectedProvinceOption = provinceSelect.options[provinceSelect.selectedIndex];
        const selectedCityOption = citySelect.options[citySelect.selectedIndex];

        // Ambil value (ID) dan text (Name) dari opsi terpilih
        // Sesuaikan dengan kebutuhan backend Anda - jika backend butuh ID dari API wilayah, gunakan value.
        // Jika backend butuh nama, gunakan textContent.
        // Berdasarkan diskusi sebelumnya, backend Anda menerima province_id dan city_id.
        profileData.province_id = selectedProvinceOption ? selectedProvinceOption.value : null;
        profileData.province_name = selectedProvinceOption ? selectedProvinceOption.textContent : ''; // Tetap kirim nama juga jika backend butuh
        profileData.city_id = selectedCityOption ? selectedCityOption.value : null;
        profileData.city_name = selectedCityOption ? selectedCityOption.textContent : ''; // Tetap kirim nama juga jika backend butuh

        // Hapus entri form data lama yang mungkin hanya string nama jika ada
        // delete profileData['province_name']; // Hapus yang dari form entries default
        // delete profileData['city_name'];     // Hapus yang dari form entries default


        try {
            // Gunakan apiPatch dari apiService
            const result = await apiPatch('/users/update-profile', profileData);
            if (result.status === 'success') {
                console.log('Profile updated:', result.data.user);
                alert('Profile updated successfully!');
                // Update data user di localStorage dan state komponen
                this.user = result.data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                // Perbarui tampilan UI profil
                this.updateUIWithUserProfile();
                // Dispatch event agar komponen lain tahu profil berubah (misal navbar)
                const profileUpdatedEvent = new CustomEvent('userProfileUpdated', { detail: { user: this.user } });
                window.dispatchEvent(profileUpdatedEvent);
            } else {
                console.error('Failed to update profile:', result.message, result.errors);
                alert('Failed to update profile: ' + result.message + (result.errors ? '\n' + result.errors.map(e => e.msg).join('\n') : ''));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            // apiService sudah menangani 401/403
            alert('An error occurred while updating profile.');
        }
    }

    // TODO: Metode untuk handle form update password
    // async handleUpdatePassword(event) { ... gunakan apiPatch('/users/update-password', { currentPassword, newPassword }) }


    // ================================================================
    // Metode untuk update UI
    // ================================================================
    updateUIWithUserProfile() {
        if (this.user) {
            // Isi elemen HTML dengan data profil pengguna
            const userNameSpan = this.querySelector('#user-name');
            const userEmailSpan = this.querySelector('#user-email');
            const userProvinceSpan = this.querySelector('#user-province');
            const userCitySpan = this.querySelector('#user-city');
            const updateNameInput = this.querySelector('#update-name');
            // Dropdown province dan city akan diisi secara terpisah oleh logika wilayah
            // const updateProvinceSelect = this.querySelector('#update-province'); // Tidak perlu di sini
            // const updateCitySelect = this.querySelector('#update-city');     // Tidak perlu di sini


            if (userNameSpan) userNameSpan.textContent = this.user.name;
            if (userEmailSpan) userEmailSpan.textContent = this.user.email;
            if (userProvinceSpan) userProvinceSpan.textContent = this.user.province_name || '-'; // Tampilkan '-' jika kosong
            if (userCitySpan) userCitySpan.textContent = this.user.city_name || '-';     // Tampilkan '-' jika kosong

            // Isi form update profil dengan data user saat ini (kecuali wilayah)
            if (updateNameInput) updateNameInput.value = this.user.name || '';

            // Set nilai dropdown wilayah setelah dropdown terisi dan user data didapat
            // Logika pemanggilan setWilayahDropdowns() dipindahkan ke fetchUserProfile()
        } else {
            // Tampilkan loading atau pesan jika data user belum ada
            const profileInfoDiv = this.querySelector('#profile-info');
            if (profileInfoDiv) profileInfoDiv.innerHTML = '<p>Loading profile...</p>';
        }
    }


    // ================================================================
    // Metode untuk setup/remove Event Listeners
    // ================================================================
    setupEventListeners() {
        // Tambahkan event listener untuk form update profil
        const updateProfileForm = this.querySelector('#update-profile-form');
        if (updateProfileForm) {
            updateProfileForm.addEventListener('submit', this.handleUpdateProfile);
        }

        // TODO: Tambahkan event listener untuk form update password jika ada
        // const updatePasswordForm = this.querySelector('#update-password-form');
        // if (updatePasswordForm) {
        //     updatePasswordForm.addEventListener('submit', this.handleUpdatePassword);
        // }

        // Event listener untuk dropdown provinsi di form update (setup dipindah ke setupProvinceChangeListener)
    }

    removeEventListeners() {
        // Hapus event listener saat disconnectedCallback
        const updateProfileForm = this.querySelector('#update-profile-form');
        if (updateProfileForm) {
            updateProfileForm.removeEventListener('submit', this.handleUpdateProfile);
        }
        // TODO: Hapus event listener update password

        // Event listener untuk province change di form update (penghapusan dipindah ke disconnectedCallback)
    }

    // ================================================================
    // Metode untuk mengelola dropdown wilayah (Disalin dari register-page)
    // ================================================================

    // Method to fetch provinces from external API
    async fetchProvinces() {
        const provinceSelect = this.querySelector('#update-province'); // Gunakan ID yang benar
        if (!provinceSelect) return; // Pastikan elemen ada

        // Clear existing options except the first one
        provinceSelect.innerHTML = '<option value="">Select Province</option>';

        try {
            const response = await fetch('https://kanglerian.my.id/api-wilayah-indonesia/api/provinces.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const provinces = await response.json();
            this.populateProvincesDropdown(provinces);
        } catch (error) {
            console.error('Error fetching provinces:', error);
            // alert('Failed to load provinces. Please try again later.'); // Mungkin terlalu mengganggu di halaman profil
        }
    }

    // Method to populate the province dropdown
    populateProvincesDropdown(provinces) {
        const provinceSelect = this.querySelector('#update-province'); // Gunakan ID yang benar
        if (provinceSelect) {
            provinces.forEach(province => {
                const option = document.createElement('option');
                option.value = province.id; // Use province ID as value (penting untuk fetch cities dan kirim ke backend)
                option.textContent = province.name; // Display province name
                provinceSelect.appendChild(option);
            });
            // Setelah mengisi dropdown provinsi, panggil setWilayahDropdowns untuk set nilai awal jika user data sudah ada
            // Ini akan dipanggil setelah fetchUserProfile selesai
        }
    }

    // Setup event listener for province select change
    setupProvinceChangeListener() {
        const provinceSelect = this.querySelector('#update-province'); // Gunakan ID yang benar
        if (provinceSelect) {
            // Hapus listener lama jika ada untuk menghindari duplikasi
            provinceSelect.removeEventListener('change', this.handleProvinceChangeForUpdateForm);
            provinceSelect.addEventListener('change', this.handleProvinceChangeForUpdateForm); // Gunakan handler yang dibind
        }
    }

    // Handler for province select change (diubah namanya sedikit agar jelas untuk update form)
    async handleProvinceChangeForUpdateForm(event) {
        const provinceId = event.target.value;
        const citySelect = this.querySelector('#update-city'); // Gunakan ID yang benar
        if (!citySelect) return; // Pastikan elemen ada

        // Reset city dropdown
        citySelect.innerHTML = '<option value="">Select City</option>';
        citySelect.disabled = true;

        if (provinceId) {
            // Tunggu hasil fetchCitiesByProvinceId sebelum mengaktifkan dropdown
            await this.fetchCitiesByProvinceId(provinceId);
            citySelect.disabled = false; // Aktifkan city select setelah fetching
        }
        // Mengembalikan cities data untuk digunakan di setWilayahDropdowns
        // Jika Anda tidak menggunakan cities di setWilayahDropdowns, baris ini bisa dihapus
        // For simplicity, let's just return it for now, might be useful later
        // This requires fetchCitiesByProvinceId to return the cities array
        // Let's update fetchCitiesByProvinceId to return the array
        // Or just let setWilayahDropdowns call fetchCitiesByProvinceId directly
        // Let's stick to the original plan of setWilayahDropdowns calling fetchCities
        // So no need to return anything here.
    }

    // Method to fetch cities by province ID from external API
    async fetchCitiesByProvinceId(provinceId) {
        const citySelect = this.querySelector('#update-city'); // Gunakan ID yang benar
        if (!citySelect) return []; // Pastikan elemen ada, kembalikan array kosong jika tidak

        // Disable city select while fetching
        citySelect.disabled = true;

        try {
            const response = await fetch(`https://kanglerian.my.id/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`No cities found for province ID: ${provinceId}`);
                    this.populateCitiesDropdown([]); // Populate with empty array
                    citySelect.disabled = true; // Keep disabled
                    return []; // Return empty array on 404
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const cities = await response.json();
            this.populateCitiesDropdown(cities);
            // citySelect.disabled = false; // Diaktifkan di handleProvinceChangeForUpdateForm setelah await
            return cities; // Return the fetched cities array
        } catch (error) {
            console.error(`Error fetching cities for province ${provinceId}:`, error);
            // alert('Failed to load cities. Please try again later.');
            this.populateCitiesDropdown([]); // Clear cities on error
            citySelect.disabled = true; // Keep disabled on error
            return []; // Return empty array on error
        }
    }

    // Method to populate the city dropdown
    populateCitiesDropdown(cities) {
        const citySelect = this.querySelector('#update-city'); // Gunakan ID yang benar
        if (citySelect) {
            citySelect.innerHTML = '<option value="">Select City</option>'; // Reset options
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.id; // Use city ID as value (penting untuk kirim ke backend)
                option.textContent = city.name; // Display city name
                citySelect.appendChild(option);
            });
        }
    }

    // Metode untuk mengatur nilai dropdown wilayah berdasarkan data user
    async setWilayahDropdowns() {
        const provinceSelect = this.querySelector('#update-province');
        const citySelect = this.querySelector('#update-city');

        if (this.user && provinceSelect && citySelect) {
            // Atur provinsi jika user memiliki province_id
            if (this.user.province_id) {
                provinceSelect.value = this.user.province_id;

                // Setelah provinsi diatur, fetch dan atur kota berdasarkan city_id user
                // Panggil fetchCitiesByProvinceId langsung dengan province_id user
                const cities = await this.fetchCitiesByProvinceId(this.user.province_id);

                // Setelah cities terisi, atur kota jika user memiliki city_id
                if (this.user.city_id && citySelect) {
                    citySelect.value = this.user.city_id;
                }
                // Pastikan dropdown kota aktif jika provinsi user ada
                citySelect.disabled = false;

            } else {
                // Jika user tidak punya province_id, pastikan dropdown kota nonaktif
                citySelect.disabled = true;
            }
        }
    }


}

// Definisikan Custom Element
customElements.define('profile-page', ProfilePage);