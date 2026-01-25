<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-text-main">Settings</h1>
      <p class="mt-2 text-text-sub">Manage your account settings and preferences.</p>
    </div>

    <div class="flex flex-col gap-8">
      <!-- Modular Components -->
      <ProfileSettings v-model="userForm" />
      
      <Card>
        <template #title>Category Management</template>
        <template #subtitle>Organize how you track your income and expenses</template>
        <template #content>
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm">Manage, rename, or merge your transaction categories.</p>
                </div>
                <Button label="Manage Categories" icon="pi pi-tags" outlined @click="showCategoryManager = true" />
            </div>
            <CategoryManagerDialog v-model="showCategoryManager" />
        </template>
      </Card>

      <TaggingRulesManager />

      <!-- Preferences (Kept inline as it's small) -->
      <Card>
        <template #title>Preferences</template>
        <template #content>
            <div class="flex flex-col gap-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-sm font-bold">Anomaly Detection</h4>
                        <p class="text-sm text-text-sub">Get notified about unusual spending activity</p>
                    </div>
                    <ToggleButton v-model="anomalyDetection.enabled" onIcon="pi pi-check" offIcon="pi pi-times" class="w-20" />
                </div>
                
                <div v-if="anomalyDetection.enabled" class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Sensitivity Threshold: {{ anomalyDetection.sensitivity }}</label>
                    <Slider v-model="anomalyDetection.sensitivity" :min="2" :max="10" :step="0.5" class="w-full mt-2" />
                    <p class="text-xs text-text-mute">Lower values are more sensitive.</p>
                </div>

                <Divider />

                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-sm font-bold">Theme</h4>
                        <p class="text-sm text-text-sub">Choose your preferred appearance</p>
                    </div>
                    <Select v-model="selectedTheme" :options="themeOptions" optionLabel="label" optionValue="value" @change="handleThemeChange" class="w-32" />
                </div>
            </div>
        </template>
      </Card>

      <SecuritySettings />

      <!-- Global Save Button -->
      <div class="flex justify-end pt-4 mb-20">
        <Button label="Save All Changes" icon="pi pi-save" size="large" :loading="saving" @click="saveAllSettings" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useSettingsStore } from '../stores/settings';
import { useAnalytics } from '../composables/useAnalytics';
import { useToast } from 'primevue/usetoast';

// Modular Components
import ProfileSettings from '../components/Settings/ProfileSettings.vue';
import TaggingRulesManager from '../components/Settings/TaggingRulesManager.vue';
import SecuritySettings from '../components/Settings/SecuritySettings.vue';
import CategoryManagerDialog from '../components/Shared/CategoryManagerDialog.vue';

// PrimeVue components
import Card from 'primevue/card';
import Button from 'primevue/button';
import ToggleButton from 'primevue/togglebutton';
import Slider from 'primevue/slider';
import Select from 'primevue/select';
import Divider from 'primevue/divider';

const router = useRouter();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const { trackEvent } = useAnalytics();
const toast = useToast();

const saving = ref(false);
const showCategoryManager = ref(false);

const userForm = reactive({
  name: '',
  email: '',
  currency: 'TRY',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  monthly_income_estimate: 0
});

const anomalyDetection = reactive({
  enabled: false,
  sensitivity: 3
});

const selectedTheme = ref('system');

const themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' }
];

onMounted(async () => {
    if (!authStore.user) {
        await authStore.init();
    }
    
    if (!authStore.user) {
        router.push('/login');
        return;
    }

    // Populate user form
    userForm.name = authStore.user.displayName || '';
    userForm.email = authStore.user.email || '';

    // Load settings from store
    await settingsStore.fetchSettings();
    const settings = settingsStore.userSettings;
    if (settings) {
        userForm.currency = settings.currency || 'TRY';
        userForm.timezone = settings.time_zone || userForm.timezone;
        userForm.monthly_income_estimate = settings.monthly_income_estimate || 0;
        anomalyDetection.enabled = settings.anomaly_detection_enabled || false;
        anomalyDetection.sensitivity = settings.anomaly_detection_sensitivity || 3;
    }

    selectedTheme.value = settingsStore.theme;
});

const handleThemeChange = () => {
    settingsStore.setTheme(selectedTheme.value);
    trackEvent('change_theme', { theme: selectedTheme.value });
};

const saveAllSettings = async () => {
    saving.value = true;
    try {
        // Update profile
        if (userForm.name !== authStore.user.displayName) {
            await authStore.updateProfile({ displayName: userForm.name });
        }
        
        // Update backend settings
        await settingsStore.updateSettings({
            currency: userForm.currency,
            time_zone: userForm.timezone,
            anomaly_detection_enabled: anomalyDetection.enabled,
            anomaly_detection_sensitivity: anomalyDetection.sensitivity
        });
        
        toast.add({ severity: 'success', summary: 'Success', detail: 'All settings saved', life: 3000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save settings', life: 3000 });
    } finally {
        saving.value = false;
    }
};
</script>