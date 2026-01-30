<template>
  <div class="flex min-h-screen items-center justify-center bg-app-bg px-4">
    <Card class="w-full max-w-md shadow-lg">
      <template #header>
        <div class="flex flex-col items-center gap-4 pt-8 pb-4">
          <i class="pi pi-key text-primary text-5xl"></i>
          <h1 class="text-3xl font-black tracking-tighter text-text-main">Set New Password</h1>
          <p v-if="email" class="text-text-sub text-base text-center px-4">
            Resetting password for <span class="font-medium text-text-main">{{ email }}</span>
          </p>
        </div>
      </template>
      <template #content>
        <!-- Loading State -->
        <div v-if="isVerifying" class="flex flex-col items-center justify-center p-8 gap-4">
            <i class="pi pi-spinner pi-spin text-primary text-4xl"></i>
            <span class="text-text-sub">Verifying security link...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="!isValidCode" class="flex flex-col items-center gap-4">
            <Message severity="error" :closable="false" class="w-full">
                <div class="flex flex-col gap-1">
                    <span class="font-bold">Invalid Link</span>
                    <span class="text-sm">{{ errorMessage }}</span>
                </div>
            </Message>
            <router-link to="/forgot-password" class="w-full">
                <Button label="Request New Link" class="w-full" outlined />
            </router-link>
        </div>

        <!-- Success Form State -->
        <form v-else @submit.prevent="handleResetPassword" class="flex flex-col gap-4">
          <Message v-if="message" :severity="messageType" class="mb-2">{{ message }}</Message>
          
          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-medium text-text-sub">New Password</label>
            <Password id="password" v-model="password" :feedback="true" toggleMask class="w-full" inputClass="w-full" required />
          </div>

          <div class="flex flex-col gap-2">
            <label for="confirmPassword" class="text-sm font-medium text-text-sub">Confirm Password</label>
            <Password id="confirmPassword" v-model="confirmPassword" :feedback="false" toggleMask class="w-full" inputClass="w-full" required />
          </div>

          <div class="flex flex-col gap-3 mt-4">
            <Button type="submit" label="Reset Password" :loading="isLoading" class="w-full" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Password from 'primevue/password';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const password = ref('');
const confirmPassword = ref('');
const message = ref('');
const messageType = ref('info');
const isLoading = ref(false);
const isVerifying = ref(true);
const isValidCode = ref(false);
const errorMessage = ref('');
const email = ref('');
const oobCode = route.query.oobCode;

onMounted(async () => {
    // 1. Ensure Auth Initialized
    if (!authStore.authReady) {
        try {
            await authStore.init();
        } catch (e) {
            console.error('Auth init error:', e);
        }
    }

    // 2. Check for Code
    if (!oobCode) {
        errorMessage.value = 'No reset code provided in URL.';
        isVerifying.value = false;
        isValidCode.value = false;
        return;
    }

    // 3. Verify Code
    try {
        email.value = await authStore.verifyResetCode(oobCode);
        isValidCode.value = true;
    } catch (error) {
        console.error('Verification failed:', error);
        isValidCode.value = false;
        // detailed error mapping
        if (error.code === 'auth/invalid-action-code') {
            errorMessage.value = 'This link has already been used or is malformed.';
        } else if (error.code === 'auth/expired-action-code') {
            errorMessage.value = 'This link has expired.';
        } else {
            errorMessage.value = error.message || 'Unknown verification error.';
        }
    } finally {
        isVerifying.value = false;
    }
});

const handleResetPassword = async () => {
    if (password.value !== confirmPassword.value) {
        message.value = 'Passwords do not match.';
        messageType.value = 'error';
        return;
    }

    if (password.value.length < 6) {
        message.value = 'Password must be at least 6 characters.';
        messageType.value = 'error';
        return;
    }

    isLoading.value = true;
    message.value = '';

    try {
        await authStore.confirmReset(oobCode, password.value);
        message.value = 'Password reset successfully! Redirecting to login...';
        messageType.value = 'success';
        
        setTimeout(() => {
            router.push('/login');
        }, 3000);
    } catch (error) {
        console.error('Reset failed:', error);
        message.value = error.message || 'Failed to reset password.';
        messageType.value = 'error';
        isLoading.value = false;
    }
};
</script>
