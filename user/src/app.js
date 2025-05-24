import './script/components/index.js';
import './styles/style.css';

// Import routing logic
import { getActiveRoute, parseActivePathname } from './script/routes/url-parser.js';
import { routes } from './script/routes/routes.js';

const mainContent = document.querySelector('main');
const searchBarElement = document.querySelector('search-bar');

const router = () => {
    const activeRoute = getActiveRoute(); // Example: '/transactions/:id'
    const routeHandler = routes[activeRoute]; // The function from routes.js

    const hideSearchBar = activeRoute === '/login' || activeRoute === '/register';

    if (searchBarElement) {
        if (hideSearchBar) {
            searchBarElement.classList.add('hidden');
        } else {
            searchBarElement.classList.remove('hidden');
        }
    }

    if (routeHandler) {
        const params = parseActivePathname(); // Example for '/transactions/123': { id: '123' }

        // Call the route handler with the correct arguments based on the route
        if (activeRoute === '/items/:id') {
            // Handler for /items/:id expects (mainContent, id)
            routeHandler(mainContent, params ? params.id : undefined); // Pass mainContent and the item ID string
        } else if (activeRoute === '/transactions/:id') {
            // Handler for /transactions/:id expects (mainContent, id) - based on your routes.js definition
            // Pass mainContent and the transaction ID string from params
            routeHandler(mainContent, params ? params.id : undefined); // Pass mainContent and the transaction ID string
        }
        else {
            // For all other routes that don't have dynamic parameters like :id
            // These handlers only expect (mainContent)
            routeHandler(mainContent);
        }
    } else {
        // Handle route not found - redirect to home or show 404
        window.location.hash = '#/'; // Redirect to home for now
    }
};

// Initial route load
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = '#/';
    } else {
        router();
    }
});

// Handle hash changes
window.addEventListener('hashchange', () => {
    router();
});
