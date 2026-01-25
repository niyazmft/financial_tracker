import { defineStore } from 'pinia';
import { useApi } from '../services/apiInstance';

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        currency: 'TRY',
        theme: localStorage.getItem('themePreference') || 'system',
        hasCompletedOnboarding: localStorage.getItem('hasCompletedOnboarding') === 'true',
        userSettings: null,
        dismissedWarnings: {},
        loading: false,
        error: null
    }),

    getters: {
        isWarningDismissed: (state) => (warningId) => {
            if (!state.dismissedWarnings || !state.dismissedWarnings[warningId]) return false;
            const expiration = state.dismissedWarnings[warningId];
            return new Date(expiration) > new Date();
        }
    },

    actions: {
        async completeOnboarding() {
            this.hasCompletedOnboarding = true;
            localStorage.setItem('hasCompletedOnboarding', 'true');
            try {
                await this.updateSettings({ onboarding_completed: true });
            } catch (err) {
                console.error('Failed to sync onboarding status:', err);
            }
        },
        async fetchSettings() {
            this.loading = true;
            try {
                const api = useApi();
                const settings = await api.getUserSettings();
                if (settings) {
                    this.userSettings = settings;
                    if (settings.currency) {
                        this.currency = settings.currency;
                    }
                    if (settings.onboarding_completed !== undefined) {
                        this.hasCompletedOnboarding = !!settings.onboarding_completed;
                        localStorage.setItem('hasCompletedOnboarding', this.hasCompletedOnboarding.toString());
                    }
                    if (settings.dismissed_warnings) {
                        try {
                            this.dismissedWarnings = typeof settings.dismissed_warnings === 'string' 
                                ? JSON.parse(settings.dismissed_warnings) 
                                : settings.dismissed_warnings;
                        } catch (e) {
                            console.error('Failed to parse dismissed_warnings:', e);
                            this.dismissedWarnings = {};
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch user settings:', err);
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },

        async dismissWarning(warningId, durationHours = 24) {
            const expirationDate = new Date();
            expirationDate.setHours(expirationDate.getHours() + durationHours);
            
            // Update local state immediately for responsiveness
            this.dismissedWarnings = {
                ...this.dismissedWarnings,
                [warningId]: expirationDate.toISOString()
            };

            // Sync with backend
            try {
                await this.updateSettings({ dismissed_warnings: this.dismissedWarnings });
            } catch (err) {
                console.error('Failed to sync dismissed warnings:', err);
                // Optionally revert local state if sync fails, but for UI warnings strictly strict consistency isn't critical
            }
        },

        async updateSettings(updates) {
            this.loading = true;
            try {
                const api = useApi();
                await api.updateUserSettings(updates);
                await this.fetchSettings();
            } catch (err) {
                this.error = err.message;
                throw err;
            } finally {
                this.loading = false;
            }
        },

        setTheme(mode) {
            this.theme = mode;
            localStorage.setItem('themePreference', mode);
            this.applyTheme();
        },

        applyTheme() {
            const root = document.documentElement;
            if (this.theme === 'dark') {
                root.classList.add('dark');
            } else if (this.theme === 'light') {
                root.classList.remove('dark');
            } else {
                const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (systemIsDark) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        },

        initTheme() {
            this.applyTheme();
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.theme === 'system') {
                    this.applyTheme();
                }
            });
        }
    }
});
