<template>
    <div>
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h2 class="text-xl font-bold">Cash Flow History</h2>
            <DateRangePicker 
                :startDate="currentRange.start" 
                :endDate="currentRange.end" 
                @update:range="handleDateRangeUpdate" 
            />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card>
                <template #content>
                    <p class="text-sm font-medium text-text-sub">Last Month Earnings</p>
                    <p class="text-3xl font-bold mt-1">{{ history.salaryAmount }}</p>
                    <p :class="['text-sm font-medium mt-1', getAmountClass(history.salaryChange)]">{{ history.salaryChange }}</p>
                </template>
            </Card>
            <Card>
                <template #content>
                    <p class="text-sm font-medium text-text-sub">Cash Flow Overview</p>
                    <div class="flex items-baseline gap-2 mt-1">
                        <p class="text-3xl font-bold">{{ history.customRangeAmount }}</p>
                        <p class="text-sm text-text-sub">{{ history.customRangeInfo }}</p>
                    </div>
                </template>
            </Card>
        </div>

        <h2 class="text-xl font-bold mb-6">Spending Analysis</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <template #title>Monthly Spending</template>
                <template #content>
                    <div class="mb-4">
                        <p class="text-3xl font-bold">{{ history.monthlySpendingAmount }}</p>
                        <div class="flex items-center gap-2 text-sm">
                            <span class="text-text-sub">This Month</span>
                            <span :class="getExpenseTrendClass(history.monthlySpendingChange)">{{ history.monthlySpendingChange }}</span>
                        </div>
                    </div>
                    <div class="h-80">
                        <AppChart type="SpendingLine" :data="monthlySpendingRawData" :loading="isLoadingHistory" />
                    </div>
                </template>
            </Card>
            <Card>
                <template #title>Spending by Category</template>
                <template #content>
                    <div class="mb-4">
                        <p class="text-3xl font-bold">{{ history.categoryTotalAmount }}</p>
                        <p class="text-sm text-text-sub">{{ history.categoryTotalInfo }}</p>
                    </div>
                    <div class="h-80">
                        <AppChart type="SpendingBar" :data="categorySpendingRawData" :loading="isLoadingHistory" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useFinance } from '../../composables/useFinance';
import { useApi } from '../../services/apiInstance';
import AppChart from '../Shared/AppChart.vue';
import * as utils from '../../services/utils';
import DateRangePicker from '../Shared/DateRangePicker.vue';

// PrimeVue components auto-imported
import Card from 'primevue/card';

const api = useApi();
const { formatCurrency, getAmountClass, getExpenseTrendClass } = useFinance();

const isLoadingHistory = ref(false);
const monthlySpendingRawData = ref(null);
const categorySpendingRawData = ref(null);

const history = reactive({
    salaryAmount: '0',
    salaryChange: '0%',
    customRangeAmount: '0',
    customRangeInfo: '',
    monthlySpendingAmount: '0',
    monthlySpendingChange: '0%',
    categoryTotalAmount: '0',
    categoryTotalInfo: ''
});

const currentRange = reactive({
    start: null,
    end: null
});

const fetchHistoryData = async (startDate, endDate) => {
    isLoadingHistory.value = true;
    try {
        const [salaryData, customSalaryData, spendingData, categoryData] = await Promise.all([
            api.fetchSalaryData(),
            api.fetchCustomRangeSalaryData(startDate, endDate),
            api.fetchMonthlySpendingDataWithRange(startDate, endDate),
            api.fetchCategorySpendingData(startDate, endDate)
        ]);

        history.salaryAmount = formatCurrency(salaryData.lastMonthEarnings);
        history.salaryChange = (salaryData.percentageChange >= 0 ? '+' : '') + salaryData.percentageChange.toFixed(1) + '%';
        
        history.customRangeAmount = formatCurrency(customSalaryData.totalEarnings || customSalaryData.totalSalary);
        history.customRangeInfo = `Avg ${formatCurrency(customSalaryData.averagePerMonth)}/month`;

        if (spendingData && spendingData.monthlyData && spendingData.monthlyData.length > 0) {
            const current = spendingData.monthlyData[spendingData.monthlyData.length - 1].totalAmount;
            const previous = spendingData.monthlyData[spendingData.monthlyData.length - 2]?.totalAmount || 0;
            
            let change = 'N/A';
            if (previous > 0) {
                const pct = ((current - previous) / previous) * 100;
                change = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
            }
            
            history.monthlySpendingAmount = formatCurrency(current);
            history.monthlySpendingChange = change;
            monthlySpendingRawData.value = spendingData;
        }

        history.categoryTotalAmount = formatCurrency(categoryData.statistics.totalSpending);
        history.categoryTotalInfo = `${categoryData.categoryData.length} categories`;
        categorySpendingRawData.value = categoryData;

    } catch (err) {
        console.error(err);
    } finally {
        isLoadingHistory.value = false;
    }
};

const handleDateRangeUpdate = ({ start, end }) => {
    // start/end might be Strings or Date objects depending on picker. 
    // Utils format functions handle dates.
    // Ensure we store them in state
    currentRange.start = start;
    currentRange.end = end;
    
    fetchHistoryData(utils.formatDateForInput(start), utils.formatDateForInput(end));
};

const initDefaultRange = () => {
    const today = new Date();
    const start = new Date(today);
    start.setMonth(today.getMonth() - 12);
    
    currentRange.start = start;
    currentRange.end = today;
    
    fetchHistoryData(utils.formatDateForInput(start), utils.formatDateForInput(today));
};

onMounted(() => {
    initDefaultRange();
});
</script>