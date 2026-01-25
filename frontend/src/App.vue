<template>
  <div>
    <!-- The new Vue Navigation Component -->
    <Navigation v-if="!route.meta.hideNavbar" />
    
    <main class="main-content pt-16">
      <!-- Router View for page components like Dashboard, Transactions, etc. -->
      <router-view></router-view>
    </main>

    <!-- PrimeVue Global Components -->
    <Toast />
    <ConfirmDialog />
    <DynamicDialog />
    
    <!-- Global Notification Modal (Legacy) -->
    <NotificationModal />
    <OnboardingWalkthrough v-if="authStore.user" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useSettingsStore } from './stores/settings';
import Navigation from './components/Navigation.vue';
import NotificationModal from './components/NotificationModal.vue';
import OnboardingWalkthrough from './components/Onboarding/OnboardingWalkthrough.vue';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import DynamicDialog from 'primevue/dynamicdialog';

const route = useRoute();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

onMounted(async () => {
  settingsStore.initTheme();
  await authStore.init();
  if (authStore.user) {
    await settingsStore.fetchSettings();
  }
});
</script>

<style>
/* Global styles can go here */
</style>

<style scoped>
/* No specific layout styles needed here anymore, handled by Tailwind classes */
</style>
