import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

let app;
let auth;
let analytics;

export async function getFirebaseApp(config) {
    if (!app) {
        app = initializeApp(config);
    }
    return app;
}

export async function getFirebaseAuth(config) {
    if (!auth) {
        const firebaseApp = await getFirebaseApp(config);
        auth = getAuth(firebaseApp);
    }
    return auth;
}

export async function getFirebaseAnalytics(config) {
    if (!analytics) {
        const firebaseApp = await getFirebaseApp(config);
        analytics = getAnalytics(firebaseApp);
    }
    return analytics;
}
