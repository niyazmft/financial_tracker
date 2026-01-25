<template>
  <div class="p-4 md:p-8 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold text-text-main">Transactions</h1>
        <p class="text-sm text-text-sub">Track and analyze your financial transactions</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="hidden lg:flex items-center gap-6 mr-4">
          <div class="text-right">
            <p class="text-xs font-bold uppercase tracking-wider text-text-sub">Total Count</p>
            <p class="text-lg font-bold">{{ totalTransactions }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs font-bold uppercase tracking-wider text-text-sub">Total Net</p>
            <p :class="['text-lg font-bold', totalAmount >= 0 ? 'text-success' : 'text-danger']">{{ formatCurrency(totalAmount) }}</p>
          </div>
        </div>
        <DateRangePicker 
            :startDate="currentRange.start" 
            :endDate="currentRange.end" 
            @update:range="handleDateRangeUpdate" 
        />
        <Button label="Add Transactions" icon="pi pi-plus" @click="showImportModal = true" />
      </div>
    </div>

    <!-- Main Table Card -->
    <Card>
      <template #content>
        <!-- Desktop View -->
        <div class="hidden md:block">
            <TransactionTable 
                v-model:filters="filters"
                :transactions="transactions"
                :loading="loading"
                :categories="categories"
                :unique-banks="uniqueBanks"
                @edit="openEditModal"
                @delete="confirmDeleteTransaction"
            />
        </div>

        <!-- Mobile View -->
        <TransactionList 
            :transactions="transactions"
            :loading="loading"
            :filters="filters"
            @toggle-filters="showMobileFilters = true"
            @edit="openEditModal"
            @delete="confirmDeleteTransaction"
        />
      </template>
    </Card>

    <!-- Modals -->
    <TransactionImportDialog 
        v-model="showImportModal"
        :categories="categories"
    />

    <TransactionEditDialog
        v-model="showEditModal"
        :transaction="selectedTransaction"
        :categories="categories"
    />

    <!-- Mobile Filter Sidebar -->
    <Sidebar v-model:visible="showMobileFilters" position="right" class="!w-full md:!w-80" header="Filter Transactions">
        <div class="flex flex-col gap-4 py-2 h-full">
            <!-- Removed redundant date filter as we have the global picker -->
            <div class="flex flex-col gap-2">
                <label class="font-medium text-sm text-text-sub">Bank</label>
                <Select v-model="filters.bank.value" :options="uniqueBanks" placeholder="All Banks" showClear fluid />
            </div>

            <div class="flex flex-col gap-2">
                <label class="font-medium text-sm text-text-sub">Category</label>
                <Select v-model="filters.category.value" :options="categories" optionLabel="category_name" optionValue="category_name" placeholder="All Categories" showClear fluid />
            </div>

            <div class="flex flex-col gap-2">
                <label class="font-medium text-sm text-text-sub">Amount</label>
                <InputNumber v-model="filters.amount.constraints[0].value" mode="currency" :currency="currency" locale="tr-TR" placeholder="Exact Amount" fluid />
            </div>

            <div class="flex flex-col gap-3 mt-auto pb-8">
                <Button label="Show Results" class="w-full" @click="showMobileFilters = false" />
                <Button label="Clear All" severity="secondary" text class="w-full" @click="clearFilters" />
            </div>
        </div>
    </Sidebar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useFinance } from '../composables/useFinance';
import { useSettingsStore } from '../stores/settings';
import { useFinanceStore } from '../stores/finance';
import { storeToRefs } from 'pinia';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import * as utils from '../services/utils';

// Components
import TransactionTable from '../components/Transactions/TransactionTable.vue';
import TransactionList from '../components/Transactions/TransactionList.vue';
import TransactionImportDialog from '../components/Transactions/TransactionImportDialog.vue';
import TransactionEditDialog from '../components/Transactions/TransactionEditDialog.vue';
import DateRangePicker from '../components/Shared/DateRangePicker.vue';

const settingsStore = useSettingsStore();
const financeStore = useFinanceStore();
const confirm = useConfirm();
const toast = useToast();
const { formatCurrency } = useFinance();

// Store State
const { transactions, categories, loading, uniqueBanks, totalTransactionCount, totalTransactionAmount } = storeToRefs(financeStore);

// Local UI State
const showImportModal = ref(false);
const showEditModal = ref(false);
const showMobileFilters = ref(false);
const selectedTransaction = ref(null);

const currency = computed(() => settingsStore.currency);
const totalTransactions = totalTransactionCount; 
const totalAmount = totalTransactionAmount;

const currentRange = reactive({
    start: null,
    end: null
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    date: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    bank: { value: null, matchMode: FilterMatchMode.EQUALS },
    category: { value: null, matchMode: FilterMatchMode.EQUALS },
    amount: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

const clearFilters = () => {
    filters.value.date.constraints[0].value = null;
    filters.value.bank.value = null;
    filters.value.category.value = null;
    filters.value.amount.constraints[0].value = null;
    filters.value.global.value = null;
    showMobileFilters.value = false;
};

const handleDateRangeUpdate = ({ start, end }) => {
    currentRange.start = start;
    currentRange.end = end;
    financeStore.fetchTransactions(utils.formatDateForInput(start), utils.formatDateForInput(end));
};

const openEditModal = (transaction) => {
    selectedTransaction.value = transaction;
    showEditModal.value = true;
};

const confirmDeleteTransaction = (data) => {
    confirm.require({
        message: 'Are you sure you want to delete this transaction?',
        header: 'Delete Confirmation',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Cancel',
        acceptLabel: 'Delete',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await financeStore.deleteTransaction(data.id);
                toast.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted', life: 3000 });
            } catch (err) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
            }
        }
    });
};

onMounted(() => {
    // Default to last 12 months for consistency with History tab
    const today = new Date();
    const start = new Date(today);
    start.setMonth(today.getMonth() - 12);
    
    currentRange.start = start;
    currentRange.end = today;

    financeStore.fetchTransactions(utils.formatDateForInput(start), utils.formatDateForInput(today));
    financeStore.fetchCategories();
});
</script>