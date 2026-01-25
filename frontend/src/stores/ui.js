import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
    state: () => ({
        sidebarOpen: false,
        globalLoading: false,
        notifications: []
    }),

    actions: {
        setSidebar(status) {
            this.sidebarOpen = status;
        },
        setLoading(status) {
            this.globalLoading = status;
        },
        addNotification(message, type = 'info') {
            const id = Date.now();
            this.notifications.push({ id, message, type });
            setTimeout(() => {
                this.removeNotification(id);
            }, 5000);
        },
        removeNotification(id) {
            this.notifications = this.notifications.filter(n => n.id !== id);
        }
    }
});
