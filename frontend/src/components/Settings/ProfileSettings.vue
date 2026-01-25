<template>
    <Card>
        <template #title>Account Information</template>
        <template #content>
            <div class="flex flex-col gap-6">
                <!-- Profile Picture -->
                <div class="flex flex-col items-center sm:items-start gap-2">
                    <label class="text-sm font-medium text-text-sub">Profile Picture</label>
                    <div class="flex items-center gap-4">
                        <Avatar :image="profilePhotoUrl" size="xlarge" shape="circle" class="border border-border-base" />
                        <div class="flex flex-col gap-2">
                            <FileUpload mode="basic" accept="image/*" :auto="true" customUpload @uploader="onPhotoUpload" chooseLabel="Upload New Photo" class="p-button-sm p-button-text" />
                            <Button label="Remove Photo" severity="danger" text size="small" @click="removePhoto" />
                        </div>
                    </div>
                </div>

                <!-- Name & Email -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="name" class="text-sm font-medium text-text-sub">Name</label>
                        <InputText id="name" name="name" v-model="form.name" autocomplete="name" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="email" class="text-sm font-medium text-text-sub">Email</label>
                        <InputText id="email" name="email" v-model="form.email" autocomplete="email" />
                    </div>
                </div>

                <!-- Currency & Timezone -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="currency" class="text-sm font-medium text-text-sub">Currency</label>
                        <Select id="currency" v-model="form.currency" :options="SUPPORTED_CURRENCIES" optionLabel="label" optionValue="code" placeholder="Select Currency" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="timezone" class="text-sm font-medium text-text-sub">Timezone</label>
                        <Select id="timezone" v-model="form.timezone" :options="timezones" optionLabel="text" optionValue="value" filter placeholder="Select Timezone" />
                    </div>
                </div>

                <!-- Income Estimate -->
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-text-sub">Monthly Income Estimate</label>
                    <div class="flex items-center gap-2">
                        <InputNumber v-model="form.monthly_income_estimate" mode="currency" :currency="form.currency" locale="en-US" :disabled="!isEditingIncome" class="flex-grow" />
                        <Button v-if="!isEditingIncome" icon="pi pi-refresh" severity="secondary" text @click="recalculateIncome" v-tooltip="'Recalculate from Transactions'" />
                        <Button v-if="!isEditingIncome" icon="pi pi-pencil" severity="secondary" text @click="isEditingIncome = true" v-tooltip="'Edit Manually'" />
                        <div v-if="isEditingIncome" class="flex gap-2">
                            <Button icon="pi pi-check" severity="success" @click="saveIncomeManually" />
                            <Button icon="pi pi-times" severity="danger" text @click="cancelIncomeEdit" />
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useSettingsStore } from '../../stores/settings';
import { useApi } from '../../services/apiInstance';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

// PrimeVue components
import Card from 'primevue/card';
import Avatar from 'primevue/avatar';
import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';

const props = defineProps({
    modelValue: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['update:modelValue']);

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const api = useApi();
const confirm = useConfirm();
const toast = useToast();

const form = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const profilePhotoUrl = ref('https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y');
const isEditingIncome = ref(false);
const originalIncomeEstimate = ref(0);

const SUPPORTED_CURRENCIES = [
    { code: 'TRY', label: 'TRY (₺) - Turkish Lira' },
    { code: 'USD', label: 'USD ($) - US Dollar' },
    { code: 'EUR', label: 'EUR (€) - Euro' },
    { code: 'GBP', label: 'GBP (£) - British Pound' }
];

const timezones = [
  { value: 'Europe/Istanbul', text: 'Istanbul (GMT+03:00)' },
  { value: 'Europe/London', text: 'London (GMT+00:00)' },
  { value: 'America/New_York', text: 'New York (GMT-05:00)' },
  { value: 'UTC', text: 'UTC (GMT+00:00)' }
];

watch(() => authStore.user, (user) => {
    if (user && user.photoURL) {
        profilePhotoUrl.value = user.photoURL;
    }
}, { immediate: true });

// Sync original estimate when form loads
watch(() => form.value.monthly_income_estimate, (newVal) => {
    if (!isEditingIncome.value) {
        originalIncomeEstimate.value = newVal;
    }
}, { immediate: true });

const onPhotoUpload = async (event) => {
    const file = event.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        const dataUrl = e.target.result;
        try {
            await authStore.updateProfile({ photoURL: dataUrl });
            profilePhotoUrl.value = dataUrl;
            toast.add({ severity: 'success', summary: 'Success', detail: 'Profile photo updated', life: 3000 });
        } catch (err) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update photo', life: 3000 });
        }
    };
    reader.readAsDataURL(file);
};

const removePhoto = () => {
    confirm.require({
        message: 'Are you sure you want to remove your profile photo?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                await authStore.updateProfile({ photoURL: '' });
                profilePhotoUrl.value = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                toast.add({ severity: 'info', summary: 'Info', detail: 'Photo removed', life: 3000 });
            } catch (err) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove photo', life: 3000 });
            }
        }
    });
};

const recalculateIncome = async () => {
    try {
        const result = await api.recalculateMonthlyIncomeEstimate();
        const newEstimate = result.newEstimate;
        
        confirm.require({
            message: `Our calculation suggests a new monthly income estimate of ${newEstimate}. Would you like to accept it?`,
            header: 'Income Recalculation',
            accept: async () => {
                form.value.monthly_income_estimate = newEstimate;
                await saveIncomeManually();
            }
        });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to recalculate income', life: 3000 });
    }
};

const saveIncomeManually = async () => {
    try {
        await settingsStore.updateSettings({ monthly_income_estimate: form.value.monthly_income_estimate });
        originalIncomeEstimate.value = form.value.monthly_income_estimate;
        isEditingIncome.value = false;
        toast.add({ severity: 'success', summary: 'Success', detail: 'Income updated', life: 3000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update income', life: 3000 });
    }
};

const cancelIncomeEdit = () => {
    form.value.monthly_income_estimate = originalIncomeEstimate.value;
    isEditingIncome.value = false;
};
</script>