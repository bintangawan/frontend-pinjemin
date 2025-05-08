import './script/components/index.js';
import './styles/style.css';

// Import routing logic
import { getActiveRoute, parseActivePathname } from './script/routes/url-parser.js';
import { routes } from './script/routes/routes.js';

const mainContent = document.querySelector('main');
const searchBarElement = document.querySelector('search-bar');

const router = () => {
    const activeRoute = getActiveRoute();
    const routeHandler = routes[activeRoute];

    const hideSearchBar = activeRoute === '/login' || activeRoute === '/register';

    if (searchBarElement) {
        if (hideSearchBar) {
            searchBarElement.classList.add('hidden');
        } else {
            searchBarElement.classList.remove('hidden');
        }
    }

    if (routeHandler) {
        const { id } = parseActivePathname();

        if (activeRoute === '/product/:id') {
            routeHandler(mainContent, id);
        } else {
            routeHandler(mainContent);
        }
    } else {
        window.location.hash = '#/';
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
