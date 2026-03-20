<template>
  <div class="p-4 md:p-8 max-w-7xl mx-auto">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-text-main">Spending Analysis</h1>
        <p class="mt-1 text-sm text-text-sub">Analyze your expenses across different categories to understand your spending patterns.</p>
      </div>
      <div class="flex items-center gap-4">
        <DateRangePicker 
            :startDate="currentRange.startDate" 
            :endDate="currentRange.endDate" 
            @update:range="handleDateRangeUpdate" 
        />
        <Button icon="pi pi-refresh" severity="secondary" outlined @click="refreshData" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Spending Breakdown Card -->
      <Card>
        <template #title>Spending Breakdown</template>
        <template #subtitle>{{ breakdownDateRange }}</template>
        <template #content>
          <div class="mb-4">
            <p class="text-3xl font-bold">{{ breakdownTotalAmount }}</p>
          </div>
          <div class="h-64 relative">
            <AppChart type="SpendingBar" :data="breakdownData" :loading="loading" />
          </div>
        </template>
      </Card>

      <!-- Spending Trend Card -->
      <Card>
        <template #title>Spending Trend</template>
        <template #subtitle>Last 12 Months</template>
        <template #content>
          <div class="mb-4 flex items-baseline gap-2">
            <p class="text-3xl font-bold">{{ trendTotalAmount }}</p>
            <Tag :value="trendPercentageChange" :severity="trendPercentageChangeSeverity" />
          </div>
          <div class="h-64 relative">
            <AppChart type="SpendingLine" :data="trendData" :loading="loading" />
          </div>
        </template>
      </Card>
    </div>

    <!-- Category Table -->
    <Card>
        <template #content>
            <DataTable :value="categoryData" :loading="loading" class="p-datatable-sm">
                <Column field="categoryName" header="Category">
                    <template #body="{ data }">
                        <span class="capitalize">{{ data.categoryName }}</span>
                    </template>
                </Column>
                <Column field="totalAmount" header="Amount">
                    <template #body="{ data }">
                        <span class="font-bold">{{ formatCurrency(data.totalAmount) }}</span>
                    </template>
                </Column>
                <Column header="Percentage">
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <ProgressBar :value="calculatePercentage(data.totalAmount)" :showValue="false" style="height: 6px; flex-grow: 1" />
                            <span class="text-xs text-text-sub w-12 text-right">{{ calculatePercentage(data.totalAmount).toFixed(1) }}%</span>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useApi } from '../services/apiInstance';
import { useFinance } from '../composables/useFinance';
import * as utils from '../services/utils';
import AppChart from '../components/Shared/AppChart.vue';
import DateRangePicker from '../components/Shared/DateRangePicker.vue';

// PrimeVue components
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';

const router = useRouter();
const authStore = useAuthStore();
const api = useApi();
const { formatCurrency } = useFinance();

const loading = ref(false);
const categoryData = ref([]);
const breakdownData = ref(null);
const trendData = ref(null);

const currentRange = reactive({
    startDate: '',
    endDate: ''
});

const breakdownTotalAmount = computed(() => breakdownData.value ? formatCurrency(breakdownData.value.statistics.totalSpending) : '...');
const breakdownDateRange = computed(() => utils.formatDateRange(currentRange.startDate, currentRange.endDate));
const trendTotalAmount = computed(() => trendData.value ? formatCurrency(trendData.value.statistics.totalSpending) : '...');
const trendPercentageChange = computed(() => {
    if (!trendData.value) return '...';
    const val = trendData.value.statistics.yoyChange || 0;
    return (val >= 0 ? '+' : '') + val.toFixed(1) + '%';
});
const trendPercentageChangeSeverity = computed(() => {
    const val = trendData.value?.statistics?.yoyChange || 0;
    return val > 0 ? 'danger' : 'success';
});

const calculatePercentage = (amount) => {
    const total = breakdownData.value?.statistics?.totalSpending || 0;
    return total > 0 ? (amount / total) * 100 : 0;
};

const handleDateRangeUpdate = ({ start, end }) => {
    fetchData(utils.formatDateForInput(start), utils.formatDateForInput(end));
};

const fetchData = async (start, end) => {
    loading.value = true;
    currentRange.startDate = start;
    currentRange.endDate = end;
    try {
        const breakdownPromise = api.fetchCategorySpendingData(start, end);
        
        const trendEndDate = new Date(end);
        const trendStartDate = new Date(trendEndDate.getFullYear() - 1, trendEndDate.getMonth() + 1, 1);
        const trendPromise = api.fetchMonthlySpendingDataWithRange(utils.formatDateForInput(trendStartDate), end);
        
        const prevTrendEndDate = new Date(trendStartDate.getFullYear(), trendStartDate.getMonth(), 0);
        const prevTrendStartDate = new Date(prevTrendEndDate.getFullYear() - 1, prevTrendEndDate.getMonth() + 1, 1);
        const prevTrendPromise = api.fetchMonthlySpendingDataWithRange(utils.formatDateForInput(prevTrendStartDate), utils.formatDateForInput(prevTrendEndDate));

        const [bData, tData, prevTData] = await Promise.all([breakdownPromise, trendPromise, prevTrendPromise]);

        const currentTotal = tData.statistics.totalSpending;
        const previousTotal = prevTData.statistics.totalSpending;
        tData.statistics.yoyChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

        breakdownData.value = bData;
        trendData.value = tData;
        categoryData.value = bData.categoryData || [];
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const refreshData = () => fetchData(currentRange.startDate, currentRange.endDate);

onMounted(() => {
    if (!authStore.user) {
        router.push('/login');
        return;
    }
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    fetchData(utils.formatDateForInput(start), utils.formatDateForInput(end));
});
</script>