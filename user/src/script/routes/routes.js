import AllProduct from '../components/product/all-product.js';
import DetailProduct from '../components/product/detail-product.js';
import LoginPage from '../components/auth/login/login-page.js';
import RegisterPage from '../components/auth/register/register-page.js';
import MyItemsPage from '../components/item/my-items-page.js';
import Utils from '../utils/utils.js';
import MyTransactionsPage from '../components/transaction/my-transactions-page.js';
import MySellerTransactionsPage from '../components/transaction/my-seller-transactions-page.js';
import DetailTransactionPage from '../components/transaction/detail-transaction-page.js';

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
    '/items/:id': (mainContent, id) => {
        mainContent.innerHTML = `<detail-product item-id="${id}"></detail-product>`;
    },
    '/transactions/:id': (mainContent, id) => {
        if (Utils.isAuthenticated()) {
            mainContent.innerHTML = `<detail-transaction-page transaction-id="${id}"></detail-transaction-page>`;
        } else {
            Utils.redirectToLogin();
        }
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
        mc.innerHTML = '<my-transactions-page></my-transactions-page>';
    }),
    '/profile': (mainContent) => checkAuthenticated(mainContent, (mc) => {
        mc.innerHTML = '<profile-page></profile-page>';
    }),
    '/my-items': (mainContent) => checkAuthenticated(mainContent, (mc) => {
        mc.innerHTML = '<my-items-page></my-items-page>';
    }),
    '/my-transactions': (mainContent) => checkAuthenticated(mainContent, (mc) => {
        mc.innerHTML = '<my-transactions-page></my-transactions-page>';
    }),
    '/my-sales': (mainContent) => checkAuthenticated(mainContent, (mc) => {
        mc.innerHTML = '<my-seller-transactions-page></my-seller-transactions-page>';
    }),
};