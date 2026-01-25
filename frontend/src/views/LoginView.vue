<template>
  <div class="flex min-h-screen items-center justify-center bg-app-bg px-4">
    <Card class="w-full max-w-md shadow-lg">
      <template #header>
        <div class="flex flex-col items-center gap-4 pt-8 pb-4">
          <i class="pi pi-chart-line text-primary text-5xl"></i>
          <h1 class="text-3xl font-black tracking-tighter text-text-main">Welcome Back</h1>
          <p class="text-text-sub text-base text-center px-4">Log in to your FinTrack account</p>
        </div>
      </template>
      <template #content>
        <form @submit.prevent="handleEmailSignIn" class="flex flex-col gap-4">
          <Message v-if="errorMessage" severity="error" class="mb-2">{{ errorMessage }}</Message>
          
          <div class="flex flex-col gap-2">
            <label for="email" class="text-sm font-medium text-text-sub">Email Address</label>
            <InputText id="email" name="email" v-model="email" type="email" placeholder="you@example.com" autocomplete="email" required class="w-full" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-medium text-text-sub">Password</label>
            <Password inputId="password" name="password" v-model="password" :feedback="false" toggleMask placeholder="Enter your password" autocomplete="current-password" required class="w-full" />
          </div>

          <div class="flex justify-end">
            <router-link to="/forgot-password" class="text-primary text-sm font-medium hover:underline">Forgot your password?</router-link>
          </div>

          <div class="flex flex-col gap-3 mt-4">
            <Button type="submit" label="Login" :loading="loading" class="w-full" />
            <Button type="button" label="Sign in with Google" icon="pi pi-google" severity="secondary" @click="handleGoogleSignIn" class="w-full" />
          </div>

          <p class="text-text-mute text-sm text-center mt-6">
            Don't have an account? 
            <a @click.prevent="handleSignUp" href="#" class="text-primary font-medium underline hover:opacity-80">Sign Up</a>
          </p>

          <div class="mt-8 pt-4 border-t border-border-base flex justify-center gap-4 text-xs text-text-mute">
            <router-link to="/terms" class="hover:underline">Terms of Service</router-link>
            <span>•</span>
            <router-link to="/privacy" class="hover:underline">Privacy Policy</router-link>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useAnalytics } from '../composables/useAnalytics';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';

const router = useRouter();
const authStore = useAuthStore();
const { trackEvent } = useAnalytics();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);

const handleEmailSignIn = async () => {
  errorMessage.value = '';
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    trackEvent('login', { method: 'email' });
    router.push('/dashboard');
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const handleSignUp = async () => {
  errorMessage.value = '';
  loading.value = true;
  try {
    await authStore.register(email.value, password.value);
    trackEvent('sign_up', { method: 'email' });
    router.push('/dashboard');
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const handleGoogleSignIn = async () => {
  errorMessage.value = '';
  try {
    await authStore.loginWithGoogle();
    trackEvent('login', { method: 'google' });
    router.push('/dashboard');
  } catch (error) {
    errorMessage.value = error.message;
  }
};
</script>

<style scoped>
:deep(.p-password input) {
    width: 100%;
}
</style>