<template>
  <div class="p-4 md:p-8 max-w-7xl mx-auto">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-text-main">Subscription Tracker</h1>
        <p class="mt-1 text-sm text-text-sub">Identify and manage your recurring payments.</p>
      </div>
      <Button label="Add Subscription" icon="pi pi-plus" @click="openModal()" />
    </div>

    <!-- Active Subscriptions Section -->
    <div class="mb-12">
      <h2 class="text-xl font-bold text-text-main mb-4">Active Subscriptions</h2>
      
      <div v-if="loading" class="text-center py-8">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>
      
      <div v-else-if="activeSubscriptions.length === 0" class="py-12 text-center border-2 border-dashed border-border-base rounded-xl bg-hover-bg/50">
        <i class="pi pi-sync text-4xl text-text-mute mb-2"></i>
        <p class="text-text-sub">No active subscriptions being tracked.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card v-for="sub in activeSubscriptions" :key="sub.Id" class="relative group h-full">
          <template #title>
            <div class="flex justify-between items-start">
              <span class="font-bold truncate" v-tooltip="sub.name">{{ sub.name }}</span>
              <span class="text-lg font-bold text-primary">{{ formatCurrency(sub.amount, sub.currency) }}</span>
            </div>
          </template>
          <template #subtitle>
            <div class="flex items-center gap-2 mt-1">
                <Tag :value="sub.billing_cycle" severity="info" class="capitalize text-[10px]" />
                <Tag v-if="sub.auto_renewal" icon="pi pi-refresh" severity="secondary" v-tooltip="'Auto-renewal enabled'" />
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-4 mt-2">
                <div class="flex items-center gap-2 text-sm text-text-sub">
                    <i class="pi pi-calendar text-xs"></i>
                    <span>Next: <b>{{ formatDateDisplay(sub.next_payment_date) }}</b></span>
                </div>
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openModal(sub)" />
                    <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(sub.Id)" />
                </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Suggestions Section -->
    <div v-if="suggestedSubscriptions.length > 0">
      <h2 class="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
        <i class="pi pi-lightbulb text-warning"></i>
        Suggested from Transactions
      </h2>
      
      <div class="flex flex-col gap-4">
        <Card v-for="(sub, index) in suggestedSubscriptions" :key="index">
          <template #content>
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <Avatar icon="pi pi-lightbulb" severity="warn" shape="circle" size="large" />
                    <div>
                        <p class="font-bold text-lg">{{ sub.description }}</p>
                        <p class="text-sm text-text-sub">
                            Appears to occur <b>{{ sub.recurrence }}</b> • Est. {{ formatCurrency(sub.amount) }}
                        </p>
                    </div>
                </div>
                <Button label="Track This" severity="secondary" outlined size="small" @click="openModal(sub, true)" />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Subscription Dialog -->
    <Dialog v-model:visible="showModal" :header="modalTitle" modal :style="{ width: '450px' }">
        <div class="flex flex-col gap-4 py-2">
            <div class="flex flex-col gap-2">
                <label for="sub-name">Name</label>
                <InputText id="sub-name" v-model="form.name" required />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label for="sub-amount">Amount</label>
                    <InputNumber id="sub-amount" v-model="form.amount" mode="currency" :currency="form.currency" locale="tr-TR" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="sub-currency">Currency</label>
                    <Select id="sub-currency" v-model="form.currency" :options="CURRENCIES" optionLabel="label" optionValue="value" />
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <label for="sub-category">Category</label>
                <CategoryPicker id="sub-category" v-model="form.category_id" placeholder="Select Category" />
            </div>
            <div class="flex flex-col gap-2">
                <label for="sub-cycle">Billing Cycle</label>
                <Select id="sub-cycle" v-model="form.billing_cycle" :options="CYCLES" optionLabel="label" optionValue="value" />
            </div>
            <div class="flex flex-col gap-2">
                <label for="sub-date">Next Payment Date</label>
                <DatePicker id="sub-date" v-model="form.next_payment_date" dateFormat="yy-mm-dd" />
            </div>
            <div class="flex items-center gap-2 mt-2">
                <Checkbox v-model="form.auto_renewal" :binary="true" inputId="auto-renewal" />
                <label for="auto-renewal">Auto Renewal</label>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" text severity="secondary" @click="closeModal" />
            <Button label="Save" :loading="saving" @click="handleFormSubmit" :disabled="!form.category_id" />
        </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useFinanceStore } from '../stores/finance';
import { useApi } from '../services/apiInstance';
import { useFinance } from '../composables/useFinance';
import * as utils from '../services/utils';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import CategoryPicker from '../components/Shared/CategoryPicker.vue';

// PrimeVue components
import Card from 'primevue/card';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Checkbox from 'primevue/checkbox';
import DatePicker from 'primevue/datepicker';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import ProgressSpinner from 'primevue/progressspinner';

const router = useRouter();
const authStore = useAuthStore();
const financeStore = useFinanceStore();
const api = useApi();
const { formatCurrency } = useFinance();
const confirm = useConfirm();
const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const activeSubscriptions = ref([]);
const suggestedSubscriptions = ref([]);
const categories = ref([]);
const showModal = ref(false);
const modalTitle = ref('Add Subscription');
const suggestionBeingTracked = ref(null);

const CURRENCIES = [
    { label: 'TRY', value: 'TRY' },
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' }
];

const CYCLES = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-Weekly', value: 'bi-weekly' }
];

const form = reactive({
  id: '',
  name: '',
  amount: 0,
  currency: 'TRY',
  billing_cycle: 'monthly',
  next_payment_date: new Date(),
  category_id: null,
  auto_renewal: true
});

const normalizeSubscription = (sub) => {
  return {
    Id: sub.Id,
    name: sub.name,
    amount: sub.amount,
    currency: sub.currency,
    billing_cycle: sub.billing_cycle,
    next_payment_date: sub.next_payment_date,
    categories_id: sub.categories_id, // Corrected from category_id
    auto_renewal: sub.auto_renewal,
  };
};

const fetchSubscriptions = async () => {
  loading.value = true;
  try {
    const response = await api.fetchSubscriptions();
    activeSubscriptions.value = (response.data.subscriptions || []).map(normalizeSubscription);
    suggestedSubscriptions.value = response.data.suggestions || [];
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load subscriptions', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
    await financeStore.fetchCategories();
    categories.value = financeStore.categories;
};

onMounted(() => {
    if (!authStore.user) {
        router.push('/login');
        return;
    }
    fetchSubscriptions();
    loadCategories();
});

const openModal = (subscription = null, isTracking = false) => {
  suggestionBeingTracked.value = isTracking ? subscription : null;
  if (subscription) {
    modalTitle.value = isTracking ? 'Track Subscription' : 'Edit Subscription';
    form.id = isTracking ? '' : (subscription.Id || '');
    form.name = subscription.name || subscription.description || '';
    form.amount = subscription.amount || 0;
    form.currency = subscription.currency || 'TRY';
    
    let cycle = 'monthly';
    if (subscription.billing_cycle) cycle = subscription.billing_cycle.toLowerCase();
    else if (subscription.recurrence) {
        const r = subscription.recurrence.toLowerCase();
        if (r.includes('weekly')) cycle = 'weekly';
        else if (r.includes('yearly')) cycle = 'yearly';
    }
    form.billing_cycle = cycle;
    
    let date = new Date();
    if (subscription.next_payment_date) date = new Date(subscription.next_payment_date);
    else if (subscription.nextPossiblePaymentDate) date = new Date(subscription.nextPossiblePaymentDate);
    form.next_payment_date = date;
    
    form.category_id = subscription.categories_id || null;
    form.auto_renewal = subscription.auto_renewal !== false;
  } else {
    modalTitle.value = 'Add Subscription';
    Object.assign(form, { id: '', name: '', amount: 0, currency: 'TRY', billing_cycle: 'monthly', next_payment_date: new Date(), category_id: null, auto_renewal: true });
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const handleFormSubmit = async () => {
  saving.value = true;
  const data = {
    ...form,
    next_payment_date: utils.formatDateForInput(form.next_payment_date),
    status: 'Active'
  };
  
  try {
    if (form.id) {
      const updatedSubResponse = await api.updateSubscription(form.id, data);
      const updatedSub = normalizeSubscription(updatedSubResponse.data.subscription);
      const index = activeSubscriptions.value.findIndex(s => s.Id === form.id);
      if (index !== -1) {
        activeSubscriptions.value[index] = updatedSub;
      }
    } else {
      const newSubResponse = await api.createSubscription(data);
      const newSub = normalizeSubscription(newSubResponse.data.subscription);
      activeSubscriptions.value.push(newSub);
      
      if (suggestionBeingTracked.value) {
        suggestedSubscriptions.value = suggestedSubscriptions.value.filter(
          s => s.description !== suggestionBeingTracked.value.description
        );
        suggestionBeingTracked.value = null;
      }
    }
    
    closeModal();
    toast.add({ severity: 'success', summary: 'Success', detail: 'Subscription saved', life: 3000 });
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save subscription', life: 3000 });
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (id) => {
    confirm.require({
        message: 'Are you sure you want to stop tracking this subscription?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await api.deleteSubscription(id);
                fetchSubscriptions();
                toast.add({ severity: 'success', summary: 'Success', detail: 'Removed', life: 3000 });
            } catch (err) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
            }
        }
    });
};

const formatDateDisplay = (d) => utils.formatDateDisplay(d);
</script>