<template>
    <DataTable 
        v-model:filters="filters" 
        :value="transactions" 
        :loading="loading" 
        paginator :rows="10" :rowsPerPageOptions="[10, 20, 50, 100]"
        sortField="date" :sortOrder="-1"
        removableSort 
        filterDisplay="menu"
        :globalFilterFields="['description', 'bank', 'category']"
        class="p-datatable-sm"
    >
        <template #header>
            <div class="flex justify-end items-center gap-4">
                <IconField iconPosition="left">
                    <InputIcon class="pi pi-search" />
                    <InputText v-model="filters['global'].value" placeholder="Search..." id="transaction-search" name="transaction-search" />
                </IconField>
            </div>
        </template>

        <template #empty> No transactions found. </template>
        <template #loading> Loading transactions data. Please wait. </template>

        <Column field="date" header="Date" sortable style="min-width: 10rem">
            <template #body="{ data }">
                {{ formatDate(data.date) }}
            </template>
            <template #filter="{ filterModel }">
                <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" placeholder="yyyy-mm-dd" />
            </template>
        </Column>

        <Column field="bank" header="Bank" sortable filter style="min-width: 10rem" :showFilterMatchModes="false">
            <template #body="{ data }">
                <Tag :value="data.bank" :style="getBankBadgeStyle(data.bank)" />
            </template>
            <template #filter="{ filterModel }">
                <Select v-model="filterModel.value" :options="uniqueBanks" placeholder="Select Bank" showClear class="p-column-filter" />
            </template>
        </Column>

        <Column field="category" header="Category" sortable filter style="min-width: 10rem" :showFilterMatchModes="false">
            <template #body="{ data }">
                <span class="capitalize">{{ data.category }}</span>
            </template>
            <template #filter="{ filterModel }">
                <Select v-model="filterModel.value" :options="categories" optionLabel="category_name" optionValue="category_name" placeholder="Select Category" showClear class="p-column-filter" />
            </template>
        </Column>

        <Column field="amount" header="Amount" sortable filter style="min-width: 8rem">
            <template #body="{ data }">
                <span :class="['font-bold', data.amount >= 0 ? 'text-success' : 'text-danger']">
                    {{ formatCurrency(data.amount) }}
                </span>
            </template>
            <template #filter="{ filterModel }">
                <InputNumber v-model="filterModel.value" mode="currency" :currency="currency" locale="tr-TR" placeholder="Amount" class="p-column-filter" />
            </template>
        </Column>

        <Column field="description" header="Description" style="min-width: 15rem">
            <template #body="{ data }">
                <span class="text-text-sub truncate block max-w-xs" v-tooltip="data.description">{{ data.description || '-' }}</span>
            </template>
        </Column>

        <Column header="Actions" :exportable="false" style="min-width: 8rem">
            <template #body="slotProps">
                <div class="flex gap-2">
                    <Button icon="pi pi-pencil" text class="text-gray-400 hover:text-blue-500 transition-colors" @click="$emit('edit', slotProps.data)" />
                    <Button icon="pi pi-trash" text class="text-gray-400 hover:text-red-500 transition-colors" @click="$emit('delete', slotProps.data)" />
                </div>
            </template>
        </Column>
    </DataTable>
</template>

<script setup>
import { computed } from 'vue';
import { useFinance } from '../../composables/useFinance';
import { useSettingsStore } from '../../stores/settings';
import * as utils from '../../services/utils';

// Components are auto-imported by PrimeVue resolver usually, 
// but we assume environment is set up.

const props = defineProps({
    transactions: {
        type: Array,
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    },
    categories: {
        type: Array,
        default: () => []
    },
    uniqueBanks: {
        type: Array,
        default: () => []
    },
    filters: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['update:filters', 'edit', 'delete']);

const settingsStore = useSettingsStore();
const { formatCurrency } = useFinance();

const currency = computed(() => settingsStore.currency);

// Two-way binding for filters manually if defineModel is not used (Vue < 3.4)
// However, since filters is an object, mutation inside DataTable usually propagates.
// Ideally we emit update:filters.
const filters = computed({
    get: () => props.filters,
    set: (value) => emit('update:filters', value)
});

const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getBankColor = (bank) => {
    const bankMap = {
        'Akbank': '--bank-akbank',
        'Garanti': '--bank-garanti',
        'Isbank': '--bank-isbank',
        'Denizbank': '--bank-denizbank',
        'Vakifbank': '--bank-vakifbank',
        'Ziraat': '--bank-ziraat'
    };
    
    const variableName = bankMap[bank];
    if (variableName) {
        return utils.getCssVariableValue(variableName);
    }
    return utils.getCssVariableValue('--color-text-mute');
};

const getBankBadgeStyle = (bank) => {
    const color = getBankColor(bank);
    return { 
        backgroundColor: `color-mix(in srgb, ${color}, transparent 85%)`, 
        color: color, 
        border: `1px solid color-mix(in srgb, ${color}, transparent 70%)` 
    };
};
</script>