import './styles/main.css';
import 'primeicons/primeicons.css'
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import DialogService from 'primevue/dialogservice';
import App from './App.vue';
import router from './router';

// Register Service Worker - Disabled for development stability
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/sw.js').then(registration => {
//             console.log('ServiceWorker registration successful with scope: ', registration.scope);
//         }, err => {
//             console.log('ServiceWorker registration failed: ', err);
//         });
//     });
// }

// Mount the Vue App
const appContainer = document.getElementById('app');
if (appContainer) {
    const app = createApp(App);
    
    // Plugins
    app.use(createPinia());
    app.use(router);
    app.use(PrimeVue, {
        theme: {
            preset: Aura,
            options: {
                darkModeSelector: '.dark',
            }
        }
    });
    app.use(ToastService);
    app.use(ConfirmationService);
    app.use(DialogService);

    app.mount('#app');
} else {
    console.error("Root element '#app' not found. Vue app could not be mounted.");
}