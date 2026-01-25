<template>
    <Card>
        <template #title>Change Password</template>
        <template #content>
            <form @submit.prevent="handleChangePassword" class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label for="current-password">Current Password</label>
                    <Password inputId="current-password" name="current-password" v-model="passwordForm.currentPassword" autocomplete="current-password" toggleMask :feedback="false" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="new-password">New Password</label>
                    <Password inputId="new-password" name="new-password" v-model="passwordForm.newPassword" autocomplete="new-password" toggleMask />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="confirm-password">Confirm New Password</label>
                    <Password inputId="confirm-password" name="confirm-password" v-model="passwordForm.confirmPassword" autocomplete="new-password" toggleMask :feedback="false" />
                </div>
                <div class="flex justify-end mt-2">
                    <Button type="submit" label="Change Password" :loading="isChangingPassword" />
                </div>
            </form>
        </template>
    </Card>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useAnalytics } from '../../composables/useAnalytics';
import { useToast } from 'primevue/usetoast';

// PrimeVue components
import Card from 'primevue/card';
import Password from 'primevue/password';
import Button from 'primevue/button';

const authStore = useAuthStore();
const { trackEvent } = useAnalytics();
const toast = useToast();

const isChangingPassword = ref(false);
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Passwords do not match', life: 3000 });
        return;
    }
    
    isChangingPassword.value = true;
    try {
        await authStore.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
        trackEvent('change_password');
        toast.add({ severity: 'success', summary: 'Success', detail: 'Password changed', life: 3000 });
        passwordForm.currentPassword = '';
        passwordForm.newPassword = '';
        passwordForm.confirmPassword = '';
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 3000 });
    } finally {
        isChangingPassword.value = false;
    }
};
</script>

<style scoped>
:deep(.p-password input) {
    width: 100%;
}
</style>