import AllProduct from '../components/product/all-product.js';
import DetailProduct from '../components/product/detail-product.js';
import LoginPage from '../components/auth/login/login-page.js';
import RegisterPage from '../components/auth/register/register-page.js';
import Utils from '../utils/utils.js';

const checkAuthenticated = (mainContent, renderFn, ...args) => {
    if (Utils.isAuthenticated()) {
        renderFn(mainContent, ...args);
    } else {
        window.location.hash = '#/login';
    }
};

const checkUnauthenticated = (mainContent, renderFn, ...args) => {
    if (!Utils.isAuthenticated()) {
        renderFn(mainContent, ...args);
    } else {
        window.location.hash = '#/';
    }
};

export const routes = {
    '/': (mainContent) => {
        mainContent.innerHTML = '<all-product></all-product>';
    },
    '/product/:id': (mainContent, id) => {
        mainContent.innerHTML = `<detail-product product-id="${id}"></detail-product>`;
    },

    '/login': (mainContent) => checkUnauthenticated(mainContent, (mc) => {
        mc.innerHTML = '<login-page></login-page>';
    }),
    '/register': (mainContent) => checkUnauthenticated(mainContent, (mc) => {
        mc.innerHTML = '<register-page></register-page>';
    }),

    '/cart': (mainContent) => checkAuthenticated(mainContent, (mc) => {
        mc.innerHTML = '<h1>Cart Page (Requires Login)</h1>';
    }),
    '/my-rentals': (mainContent) => checkAuthenticated(mainContent, (mc) => {
        mc.innerHTML = '<h1>My Rentals Page (Requires Login)</h1>';
    }),
};