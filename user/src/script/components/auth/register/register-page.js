class RegisterPage extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
            <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
                <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img class="mx-auto h-20 w-auto" src="./logo.png" alt="Pinjemin">
                    <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">Create a New Account</h2>
                </div>

                <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form class="space-y-6" action="#" method="POST">
                        <div>
                            <label for="username" class="block text-sm/6 font-medium text-gray-900">Username</label>
                            <div class="mt-2">
                                <input type="text" name="username" id="username" autocomplete="username" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                            </div>
                        </div>

                        <div>
                            <label for="email" class="block text-sm/6 font-medium text-gray-900">Email address</label>
                            <div class="mt-2">
                                <input type="email" name="email" id="email" autocomplete="email" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                            </div>
                        </div>

                        <div>
                            <label for="phone" class="block text-sm/6 font-medium text-gray-900">Phone Number</label>
                            <div class="mt-2">
                                <input type="tel" name="phone" id="phone" autocomplete="tel" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                            </div>
                        </div>

                         <div>
                            <label for="province" class="block text-sm/6 font-medium text-gray-900">Province</label>
                            <div class="mt-2">
                                <select id="province" name="province" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                                    <option value="">Select Province</option>
                                    <option value="dummy-province-1">Dummy Province 1</option>
                                    <option value="dummy-province-2">Dummy Province 2</option>
                                    <!-- Add more provinces here -->
                                </select>
                            </div>
                        </div>

                         <div>
                            <label for="city" class="block text-sm/6 font-medium text-gray-900">City</label>
                            <div class="mt-2">
                                <select id="city" name="city" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                                    <option value="">Select City</option>
                                     <option value="dummy-city-1">Dummy City 1</option>
                                    <option value="dummy-city-2">Dummy City 2</option>
                                    <!-- Add more cities here -->
                                </select>
                            </div>
                        </div>

                         <div>
                            <label for="liked-categories" class="block text-sm/6 font-medium text-gray-900">Liked Categories (Tags)</label>
                            <div class="mt-2">
                                <!-- Placeholder for tag input component -->
                                <input type="text" id="liked-categories" name="liked-categories" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" placeholder="e.g., Photography, Gaming">
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
                        Not a member?
                        <a href="/#/login" class="font-semibold text-indigo-600 hover:text-indigo-500">Sign In now</a>
                    </p>
                </div>
            </div>
        `;
    }
}

customElements.define('register-page', RegisterPage);
