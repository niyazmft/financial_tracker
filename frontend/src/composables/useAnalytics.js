import { getFirebaseAnalytics } from '../services/firebase';
import { logEvent } from 'firebase/analytics';
import { useApi } from '../services/apiInstance';

let analyticsInstance = null;

export function useAnalytics() {
    
    const initAnalytics = async () => {
        if (analyticsInstance) return analyticsInstance;
        try {
            const api = useApi();
            // Assuming api.getFirebaseConfig() exists and is cached/fast
            const config = await api.getFirebaseConfig();
            analyticsInstance = await getFirebaseAnalytics(config);
            return analyticsInstance;
        } catch (error) {
            console.warn('Analytics initialization failed:', error);
            return null;
        }
    };

    const trackEvent = async (eventName, params = {}) => {
        const analytics = await initAnalytics();
        if (analytics) {
            try {
                logEvent(analytics, eventName, params);
            } catch (e) {
                console.warn(`Failed to log event ${eventName}:`, e);
            }
        }
    };

    const trackPageView = async (pageName) => {
        await trackEvent('page_view', { page_title: pageName });
    };

    return {
        trackEvent,
        trackPageView
    };
}
