import { apiGet, apiPatch, apiDelete, clearAuthData } from '../../utils/apiService.js';

class ProfilePage extends HTMLElement {
    constructor() {
        super();
        // Bind methods
        this.fetchUserProfile = this.fetchUserProfile.bind(this);
        this.handleUpdateProfile = this.handleUpdateProfile.bind(this);
        this.handleUpdatePassword = this.handleUpdatePassword.bind(this);

        // State internal komponen
        this.user = null;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.fetchUserProfile();
    }

    disconnectedCallback() {
        this.removeEventListeners();
    }

    render() {
        this.innerHTML = `
            <div class="container mx-auto px-4 py-8 font-opensan">
                <h2 class="text-3xl font-montserrat font-bold mb-8 text-gray-800">Profil Pengguna</h2>

                <!-- Main Card Container -->
                <div class="bg-white p-8 rounded-2xl shadow-xl mb-8 border border-gray-100">
                    <!-- Informasi Akun Container (Gradient) -->
                    <div class="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-6 rounded-xl shadow-lg mb-8">
                        <h3 class="text-2xl font-montserrat font-bold mb-4 flex items-center">
                            <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            Informasi Akun
                        </h3>
                        <div id="profile-info" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <p class="text-sm opacity-80 mb-1">Nama</p>
                                <p class="font-semibold text-lg" id="user-name">Loading...</p>
                            </div>
                            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <p class="text-sm opacity-80 mb-1">Email</p>
                                <p class="font-semibold text-lg" id="user-email">Loading...</p>
                            </div>
                            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <p class="text-sm opacity-80 mb-1">Provinsi</p>
                                <p class="font-semibold text-lg" id="user-province">Loading...</p>
                            </div>
                            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <p class="text-sm opacity-80 mb-1">Kota</p>
                                <p class="font-semibold text-lg" id="user-city">Loading...</p>
                            </div>
                            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:col-span-2">
                                <p class="text-sm opacity-80 mb-1">Hobby</p>
                                <p class="font-semibold text-lg" id="user-hobby">Loading...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Perbarui Profil Section -->
                    <div>
                        <h3 class="text-2xl font-montserrat font-bold mb-6 text-gray-800 flex items-center">
                            <svg class="w-6 h-6 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Perbarui Profil
                        </h3>
                        <form id="update-profile-form" class="space-y-6">
                            <div>
                                <label for="update-name" class="block mb-2 text-sm font-semibold text-gray-700">Nama Lengkap</label>
                                <input type="text" id="update-name" name="name" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 transition-all duration-200" placeholder="Masukkan nama lengkap" />
                            </div>

                            <div>
                          <label for="update-hobby" class="block text-sm font-medium text-gray-700 mb-1">Hobby</label>
                          <select 
                              id="update-hobby" 
                              name="hobby" 
                              required 
                              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                          >
                              <option value="">Select Hobby</option>
                              <option value="MASAK">Masak</option>
                              <option value="MEMBACA">Membaca</option>
                              <option value="FOTOGRAFI">Fotografi</option>
                          </select>
                        </div>
                            
                            <!-- Tooltip Container -->
                            <div class="tooltip-container relative">
                                <div>
                                    <label for="update-province" class="block mb-2 text-sm font-semibold text-gray-700">Provinsi</label>
                                    <div class="relative">
                                        <input type="text" id="update-province" name="province_name" readonly class="bg-gray-100 border border-gray-300 text-gray-500 text-sm rounded-xl block w-full p-3 cursor-not-allowed opacity-60" placeholder="Provinsi tidak dapat diubah" />
                                        <div class="absolute inset-0 cursor-help" title="Anda tidak dapat mengedit provinsi sesuai dengan kebijakan kami demi keamanan"></div>
                                    </div>
                                </div>
                                
                                <div class="mt-4">
                                    <label for="update-city" class="block mb-2 text-sm font-semibold text-gray-700">Kota/Kabupaten</label>
                                    <div class="relative">
                                        <input type="text" id="update-city" name="city_name" readonly class="bg-gray-100 border border-gray-300 text-gray-500 text-sm rounded-xl block w-full p-3 cursor-not-allowed opacity-60" placeholder="Kota tidak dapat diubah" />
                                        <div class="absolute inset-0 cursor-help" title="Anda tidak dapat mengedit kota sesuai dengan kebijakan kami demi keamanan"></div>
                                    </div>
                                </div>
                                
                                <!-- Tooltip -->
                                <div class="tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible transition-all duration-200 whitespace-nowrap z-10">
                                    Anda tidak dapat mengedit provinsi atau kota sesuai dengan kebijakan kami demi keamanan
                                    <div class="tooltip-arrow absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                </div>
                            </div>

                            <button type="submit" class="w-full flex justify-center py-3 px-6 border border-transparent shadow-lg text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                </svg>
                                Perbarui Profil
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Password Card Container -->
                <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <div>
                        <h3 class="text-2xl font-montserrat font-bold mb-6 text-gray-800 flex items-center">
                            <svg class="w-6 h-6 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                            Ubah Kata Sandi
                        </h3>
                        <form id="update-password-form" class="space-y-6">
                            <div>
                                <label for="current-password" class="block mb-2 text-sm font-semibold text-gray-700">Kata Sandi Saat Ini</label>
                                <input type="password" id="current-password" name="currentPassword" required class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 block w-full p-3 transition-all duration-200" placeholder="Masukkan kata sandi saat ini">
                            </div>
                            <div>
                                <label for="new-password" class="block mb-2 text-sm font-semibold text-gray-700">Kata Sandi Baru</label>
                                <input type="password" id="new-password" name="newPassword" required class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 block w-full p-3 transition-all duration-200" placeholder="Masukkan kata sandi baru">
                            </div>
                            <button type="submit" class="w-full flex justify-center py-3 px-6 border border-transparent shadow-lg text-sm font-bold rounded-xl text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                </svg>
                                Ubah Kata Sandi
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Success Modal -->
                <div id="success-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                    <div class="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
                        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Password Berhasil Diubah!</h3>
                        <p class="text-gray-600 mb-6">Password Anda telah berhasil diganti. Silakan login ulang untuk keamanan.</p>
                        <button id="login-redirect-btn" class="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200">
                            Login Ulang
                        </button>
                    </div>
                </div>
            </div>

            <style>
                .tooltip-container:hover .tooltip {
                    opacity: 1;
                    visibility: visible;
                }
                
                .tooltip-arrow {
                    filter: drop-shadow(0 -1px 1px rgba(0, 0, 0, 0.1));
                }
                
                /* Custom scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                
                ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
                }

                /* Modal animation */
                #success-modal.show {
                    animation: fadeIn 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            </style>
        `;
    }

    async fetchUserProfile() {
        try {
            const result = await apiGet('/auth/me');
            if (result.status === 'success') {
                this.user = result.data.user;
                this.updateUIWithUserProfile();
            } else {
                console.error('Failed to fetch user profile:', result.message);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }

    async handleUpdateProfile(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const profileData = Object.fromEntries(formData.entries());

        // Remove province and city from update data since they're readonly
        delete profileData.province_name;
        delete profileData.city_name;

        try {
            const result = await apiPatch('/users/update-profile', profileData);
            if (result.status === 'success') {
                alert('Profile berhasil diperbarui!');
                this.user = result.data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                this.updateUIWithUserProfile();
                
                const profileUpdatedEvent = new CustomEvent('userProfileUpdated', { 
                    detail: { user: this.user } 
                });
                window.dispatchEvent(profileUpdatedEvent);
            } else {
                console.error('Failed to update profile:', result.message, result.errors);
                alert('Gagal memperbarui profil: ' + result.message + 
                      (result.errors ? '\n' + result.errors.map(e => e.msg).join('\n') : ''));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Terjadi kesalahan saat memperbarui profil.');
        }
    }

    async handleUpdatePassword(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const passwordData = Object.fromEntries(formData.entries());

        try {
            const result = await apiPatch('/users/update-password', passwordData);
            if (result.status === 'success') {
                // Show success modal
                this.showSuccessModal();
                form.reset(); // Clear the form
            } else {
                console.error('Failed to update password:', result.message);
                alert('Gagal mengubah kata sandi: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating password:', error);
            alert('Terjadi kesalahan saat mengubah kata sandi.');
        }
    }

    showSuccessModal() {
        const modal = this.querySelector('#success-modal');
        const loginBtn = this.querySelector('#login-redirect-btn');
        
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('show');
            
            // Setup login redirect button
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    // Clear auth data and redirect to login
                    clearAuthData();
                    window.location.href = '/#/login';
                });
            }
        }
    }

    updateUIWithUserProfile() {
        if (this.user) {
            const userNameSpan = this.querySelector('#user-name');
            const userEmailSpan = this.querySelector('#user-email');
            const userProvinceSpan = this.querySelector('#user-province');
            const userCitySpan = this.querySelector('#user-city');
            const userHobbySpan = this.querySelector('#user-hobby');
            const updateNameInput = this.querySelector('#update-name');
            const updateHobbyInput = this.querySelector('#update-hobby');
            const updateProvinceInput = this.querySelector('#update-province');
            const updateCityInput = this.querySelector('#update-city');

            if (userNameSpan) userNameSpan.textContent = this.user.name;
            if (userEmailSpan) userEmailSpan.textContent = this.user.email;
            if (userProvinceSpan) userProvinceSpan.textContent = this.user.province_name || '-';
            if (userCitySpan) userCitySpan.textContent = this.user.city_name || '-';
            if (userHobbySpan) userHobbySpan.textContent = this.user.hobby || '-';

            if (updateNameInput) updateNameInput.value = this.user.name || '';
            if (updateHobbyInput) updateHobbyInput.value = this.user.hobby || '';
            if (updateProvinceInput) updateProvinceInput.value = this.user.province_name || '';
            if (updateCityInput) updateCityInput.value = this.user.city_name || '';
        } else {
            const profileInfoDiv = this.querySelector('#profile-info');
            if (profileInfoDiv) profileInfoDiv.innerHTML = '<p>Loading profile...</p>';
        }
    }

    setupEventListeners() {
        const updateProfileForm = this.querySelector('#update-profile-form');
        if (updateProfileForm) {
            updateProfileForm.addEventListener('submit', this.handleUpdateProfile);
        }

        const updatePasswordForm = this.querySelector('#update-password-form');
        if (updatePasswordForm) {
            updatePasswordForm.addEventListener('submit', this.handleUpdatePassword);
        }
    }

    removeEventListeners() {
        const updateProfileForm = this.querySelector('#update-profile-form');
        if (updateProfileForm) {
            updateProfileForm.removeEventListener('submit', this.handleUpdateProfile);
        }

        const updatePasswordForm = this.querySelector('#update-password-form');
        if (updatePasswordForm) {
            updatePasswordForm.removeEventListener('submit', this.handleUpdatePassword);
        }
    }
}

customElements.define('profile-page', ProfilePage);