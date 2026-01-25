import { api } from './api';
import { useAuthStore } from '../stores/auth';

let apiInstance = null;

export const useApi = () => {
    if (!apiInstance) {
        const authStore = useAuthStore();
        apiInstance = api(() => authStore.getToken());
    }
    return apiInstance;
};
