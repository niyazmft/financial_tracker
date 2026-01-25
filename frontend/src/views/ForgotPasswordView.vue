<template>
  <div class="flex min-h-screen items-center justify-center bg-app-bg px-4">
    <Card class="w-full max-w-md shadow-lg">
      <template #header>
        <div class="flex flex-col items-center gap-4 pt-8 pb-4">
          <i class="pi pi-lock-open text-primary text-5xl"></i>
          <h1 class="text-3xl font-black tracking-tighter text-text-main">Reset Password</h1>
          <p class="text-text-sub text-base text-center px-4">Enter your email to receive instructions on how to reset your password.</p>
        </div>
      </template>
      <template #content>
        <form @submit.prevent="handleForgotPassword" class="flex flex-col gap-4">
          <Message v-if="message" :severity="messageType" class="mb-2">{{ message }}</Message>
          
          <div class="flex flex-col gap-2">
            <label for="email" class="text-sm font-medium text-text-sub">Email Address</label>
            <InputText id="email" name="email" v-model="email" type="email" placeholder="you@example.com" autocomplete="email" required class="w-full" />
          </div>

          <div class="flex flex-col gap-3 mt-4">
            <Button type="submit" label="Send Reset Link" :loading="isLoading" class="w-full" />
          </div>

          <p class="text-text-mute text-sm text-center mt-6">
            Remember your password? 
            <router-link to="/login" class="text-primary font-medium underline hover:opacity-80">Back to Login</router-link>
          </p>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '../services/apiInstance';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';

const api = useApi();
const email = ref('');
const message = ref('');
const messageType = ref('info'); // 'success', 'error', 'info'
const isLoading = ref(false);

const handleForgotPassword = async () => {
  if (!email.value) {
    message.value = 'Please enter your email address.';
    messageType.value = 'error';
    return;
  }
  
  isLoading.value = true;
  message.value = '';
  
  try {
    await api.requestPasswordReset(email.value);
    message.value = `If an account exists for ${email.value}, an email has been sent. Please check your inbox and spam folder.`;
    messageType.value = 'success';
  } catch (error) {
    message.value = error.message || 'Failed to send reset link.';
    messageType.value = 'error';
  } finally {
    isLoading.value = false;
  }
};
</script>