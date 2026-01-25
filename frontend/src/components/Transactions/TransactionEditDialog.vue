<template>
    <Dialog v-model:visible="visible" header="Edit Transaction" modal :style="{ width: '30rem' }">
        <div class="flex flex-col gap-4 py-2">
            <div class="flex flex-col gap-2">
                <label for="edit-date">Date</label>
                <DatePicker id="edit-date" v-model="form.date" dateFormat="yy-mm-dd" />
            </div>
            <div class="flex flex-col gap-2">
                <label for="edit-amount">Amount</label>
                <InputNumber id="edit-amount" v-model="form.amount" mode="currency" :currency="currency" locale="tr-TR" />
            </div>
            <div class="flex flex-col gap-2">
                <label for="edit-bank">Bank</label>
                <InputText id="edit-bank" v-model="form.bank" />
            </div>
            <div class="flex flex-col gap-2">
                <label for="edit-category">Category *</label>
                <CategoryPicker v-model="form.categories_id" />
            </div>
            <div class="flex flex-col gap-2">
                <label for="edit-desc">Description</label>
                <InputText id="edit-desc" v-model="form.description" />
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" text severity="secondary" @click="closeModal" />
            <Button label="Save Changes" :loading="loading" @click="save" />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { useFinanceStore } from '../../stores/finance';
import * as utils from '../../services/utils';
import { useToast } from 'primevue/usetoast';
import CategoryPicker from '../Shared/CategoryPicker.vue';

// PrimeVue components auto-imported
import Dialog from 'primevue/dialog';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    transaction: {
        type: Object,
        default: () => null
    },
    categories: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const settingsStore = useSettingsStore();
const financeStore = useFinanceStore();
const toast = useToast();

const currency = computed(() => settingsStore.currency);
const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const loading = ref(false);
const form = reactive({
    id: null,
    date: new Date(),
    amount: 0,
    bank: '',
    categories_id: null,
    description: ''
});

watch(() => props.transaction, (newVal) => {
    if (newVal) {
        form.id = newVal.id;
        form.date = newVal.date ? new Date(newVal.date) : new Date();
        form.amount = newVal.amount;
        form.bank = newVal.bank;
        form.categories_id = newVal.categoryId;
        form.description = newVal.description;
    }
}, { immediate: true });

const closeModal = () => {
    visible.value = false;
};

const save = async () => {
    loading.value = true;
    try {
        const data = {
            ...form,
            date: utils.formatDateForInput(form.date)
        };
        await financeStore.updateTransaction(form.id, data);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Transaction updated', life: 3000 });
        emit('saved');
        closeModal();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update', life: 3000 });
    } finally {
        loading.value = false;
    }
};
</script>