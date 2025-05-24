class LoginPage extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.setupFormSubmission();
    }

    render() {
        this.innerHTML = `
            <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
                <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img class="mx-auto h-20 w-auto" src="./logo.png" alt="Pinjemin">
                    <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">Sign in to your account</h2>
                </div>

                <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form id="login-form" class="space-y-6" action="#" method="POST">
                        <div>
                            <label for="email" class="block text-sm/6 font-medium text-gray-900">Email address</label>
                            <div class="mt-2">
                                <input id="email" name="email" type="email" autocomplete="email" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                            </div>
                        </div>

                        <div>
                            <div class="flex items-center justify-between">
                                <label for="password" class="block text-sm/6 font-medium text-gray-900">Password</label>
                                <!-- <div class="text-sm">
                                    <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500">Forgot password?</a>
                                </div> -->
                            </div>
                            <div class="mt-2">
                                <input id="password" name="password" type="password" autocomplete="current-password" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                            </div>
                        </div>

                        <div>
                            <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign in</button>
                        </div>
                    </form>

                    <p class="mt-10 text-center text-sm/6 text-gray-500">
                        Not a member?
                        <a href="/#/register" class="font-semibold text-indigo-600 hover:text-indigo-500">Create an account</a>
                    </p>
                </div>
            </div>
        `;
    }

    setupFormSubmission() {
        const form = this.querySelector('#login-form');
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            console.log('Sending login data to API:', data);

            try {
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (response.ok) { // Check for successful HTTP status codes (2xx)
                    if (result.status === 'success') {
                        console.log('Login successful:', result);
                        // Store token and user data in localStorage
                        localStorage.setItem('token', result.token);
                        localStorage.setItem('user', JSON.stringify(result.data.user));

                        // Dispatch a custom event to notify other components
                        const loginEvent = new CustomEvent('userLoggedIn', {
                            detail: { user: result.data.user } // Opsional: kirim data user bersama event
                        });
                        window.dispatchEvent(loginEvent); // Dispatch event dari window

                        alert('Login successful!'); // Add a success message
                        window.location.href = '/#/'; // TODO: Change to your home page route
                    } else {
                        // Handle API status 'error' even with success HTTP status (less common but possible)
                        console.error('Login failed (API error):', result.message);
                        alert('Login failed: ' + result.message);
                    }
                } else { // Handle HTTP error status codes (4xx, 5xx)
                    console.error('Login failed (HTTP error):', response.status, result.message);
                    alert('Login failed: ' + result.message);
                }

            } catch (error) {
                console.error('Error during login API call:', error);
                // Display generic error message
                alert('An error occurred during login. Please try again.');
            }
        });
    }
}

customElements.define('login-page', LoginPage);
