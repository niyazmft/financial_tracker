<template>
    <div class="block md:hidden">
        <!-- Mobile Search & Filter -->
        <div class="flex gap-3 mb-4">
            <div class="relative flex-grow">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"></i>
                <input 
                    v-model="filters.global.value"
                    placeholder="Search..." 
                    class="w-full pl-10 pr-4 py-2 bg-input-bg border border-border-input rounded-lg text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
            </div>
            <button 
                @click="$emit('toggle-filters')" 
                class="p-2 bg-input-bg border border-border-input rounded-lg text-text-muted hover:text-text-main"
            >
                <i class="pi pi-filter"></i>
            </button>
        </div>

        <div v-if="loading" class="text-center py-8">
            <i class="pi pi-spin pi-spinner text-2xl"></i>
        </div>
        <div v-else-if="paginatedTransactions.length === 0" class="text-center py-8 text-text-sub">
            No transactions found.
        </div>
        <div 
            v-else
            class="space-y-3"
        >
            <div 
                v-for="transaction in paginatedTransactions" 
                :key="transaction.id" 
                class="p-4 bg-card-bg border border-border-base rounded-xl shadow-sm"
            >
                <div class="flex justify-between items-start mb-2">
                    <div class="flex flex-col">
                        <span class="text-xs text-text-sub font-medium">{{ formatDate(transaction.date) }}</span>
                        <span class="text-text-main font-medium text-base mt-0.5">{{ transaction.description }}</span>
                    </div>
                    <span 
                        class="text-lg font-bold whitespace-nowrap"
                        :class="transaction.amount < 0 ? 'text-danger' : 'text-success'"
                    >
                        {{ formatCurrency(transaction.amount) }}
                    </span>
                </div>

                <div class="flex justify-between items-center mt-3 pt-3 border-t border-border-base">
                    <div class="flex gap-2">
                        <span class="px-2 py-1 text-[10px] font-medium rounded bg-hover-bg text-text-sub border border-border-base">
                            {{ transaction.bank }}
                        </span>
                        <span class="px-2 py-1 text-[10px] font-medium rounded bg-hover-bg text-text-sub border border-border-base">
                            {{ transaction.category }}
                        </span>
                    </div>
                    
                    <div class="flex gap-3">
                        <button @click="$emit('edit', transaction)" class="text-text-muted hover:text-primary p-1">
                            <i class="pi pi-pencil text-sm"></i> 
                        </button>
                        <button @click="$emit('delete', transaction)" class="text-text-muted hover:text-danger p-1">
                            <i class="pi pi-trash text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile Pagination -->
        <div class="flex justify-between items-center mt-4 px-2" v-if="totalPages > 1">
            <button 
                @click="handlePageChange(currentPage - 1)" 
                :disabled="currentPage === 1"
                class="px-3 py-2 bg-input-bg border border-border-base text-text-main rounded-lg disabled:opacity-50 text-sm"
            >
                Previous
            </button>
            
            <span class="text-text-sub text-sm">
                Page {{ currentPage }} of {{ totalPages }}
            </span>

            <button 
                @click="handlePageChange(currentPage + 1)" 
                :disabled="currentPage === totalPages"
                class="px-3 py-2 bg-input-bg border border-border-base text-text-main rounded-lg disabled:opacity-50 text-sm"
            >
                Next
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useFinance } from '../../composables/useFinance';
import * as utils from '../../services/utils';

const props = defineProps({
    transactions: {
        type: Array,
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    },
    filters: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['toggle-filters', 'edit', 'delete', 'update:filters']);

const { formatCurrency } = useFinance();

const currentPage = ref(1);
const itemsPerPage = 10;

// Filter Logic copied from original View to ensure consistent Mobile behavior
const filteredTransactions = computed(() => {
    let result = props.transactions;
    
    // Global Filter
    const globalFilter = props.filters.global?.value;
    if (globalFilter) {
        const lowerFilter = globalFilter.toLowerCase();
        result = result.filter(t => 
            (t.description && t.description.toLowerCase().includes(lowerFilter)) ||
            (t.bank && t.bank.toLowerCase().includes(lowerFilter)) ||
            (t.category && t.category.toLowerCase().includes(lowerFilter))
        );
    }

    // Specific Filters
    const dateFilter = props.filters.date?.constraints?.[0]?.value;
    if (dateFilter) {
        const filterDateStr = utils.formatDateForInput(new Date(dateFilter));
        result = result.filter(t => utils.formatDateForInput(t.date) === filterDateStr);
    }

    const bankFilter = props.filters.bank?.value;
    if (bankFilter) {
        result = result.filter(t => t.bank === bankFilter);
    }

    const categoryFilter = props.filters.category?.value;
    if (categoryFilter) {
        result = result.filter(t => t.category === categoryFilter);
    }

    const amountFilter = props.filters.amount?.constraints?.[0]?.value;
    if (amountFilter !== null && amountFilter !== undefined) {
        result = result.filter(t => t.amount === amountFilter);
    }

    return result;
});

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage));

const paginatedTransactions = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTransactions.value.slice(start, end);
});

const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
</script>