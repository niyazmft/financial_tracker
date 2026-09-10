<template>
  <div class="p-4 md:p-8 max-w-7xl mx-auto">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-text-main">
          Reports
        </h1>
        <p class="mt-1 text-sm text-text-sub">
          A plain-language look at your earnings and spending over time.
        </p>
      </div>
      <Button
        icon="pi pi-refresh"
        aria-label="Refresh data"
        severity="secondary"
        outlined
        :loading="loading"
        @click="loadAll"
      />
    </div>

    <!-- Earnings summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <template #content>
          <div class="flex items-center gap-3 mb-1">
            <i class="pi pi-arrow-up text-xl text-success" />
            <p class="text-xs font-bold uppercase tracking-wider text-text-sub">
              {{ salary.lastMonthName }}
            </p>
          </div>
          <p class="text-2xl font-bold text-success">
            {{ formatCurrency(salary.lastMonthEarnings) }}
          </p>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="flex items-center gap-3 mb-1">
            <i class="pi pi-arrow-up text-xl text-text-sub" />
            <p class="text-xs font-bold uppercase tracking-wider text-text-sub">
              {{ salary.previousMonthName }}
            </p>
          </div>
          <p class="text-2xl font-bold">
            {{ formatCurrency(salary.previousMonthEarnings) }}
          </p>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="flex items-center gap-3 mb-1">
            <i class="pi pi-chart-line text-xl text-info" />
            <p class="text-xs font-bold uppercase tracking-wider text-text-sub">
              Month-over-month
            </p>
          </div>
          <p :class="['text-2xl font-bold', salary.percentageChange >= 0 ? 'text-success' : 'text-danger']">
            {{ formatPercentage(salary.percentageChange) }}
          </p>
        </template>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Monthly spending trend -->
      <Card>
        <template #title>
          Monthly Spending
        </template>
        <template #subtitle>
          Last 12 months
        </template>
        <template #content>
          <div class="mb-4 flex items-baseline gap-2">
            <p class="text-3xl font-bold">
              {{ formatCurrency(spending.statistics?.totalSpending) }}
            </p>
            <Tag
              v-if="spending.statistics?.monthOverMonthChange !== undefined"
              :value="formatPercentage(spending.statistics.monthOverMonthChange)"
              :severity="spending.statistics.monthOverMonthChange >= 0 ? 'danger' : 'success'"
            />
          </div>
          <div class="h-64 relative">
            <AppChart
              type="SpendingLine"
              :data="spending"
              :loading="loading"
            />
          </div>
        </template>
      </Card>

      <!-- Category breakdown -->
      <Card>
        <template #title>
          Spending by Category
        </template>
        <template #subtitle>
          Where your money goes
        </template>
        <template #content>
          <div class="mb-4">
            <p class="text-3xl font-bold">
              {{ formatCurrency(categories.statistics?.totalSpending) }}
            </p>
          </div>
          <div class="h-64 relative">
            <AppChart
              type="SpendingBar"
              :data="categories"
              :loading="loading"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useApi } from '../services/apiInstance';
import { useFinance } from '../composables/useFinance';
import * as utils from '../services/utils';
import AppChart from '../components/Shared/AppChart.vue';

// PrimeVue components
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

const router = useRouter();
const authStore = useAuthStore();
const api = useApi();
const { formatCurrency } = useFinance();
const formatPercentage = utils.formatPercentage;

const loading = ref(false);
const salary = reactive({
    lastMonthEarnings: 0,
    previousMonthEarnings: 0,
    percentageChange: 0,
    lastMonthName: '',
    previousMonthName: ''
});
const spending = ref(null);
const categories = ref(null);

const loadAll = async () => {
    loading.value = true;
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        const startStr = utils.formatDateForInput(start);
        const endStr = utils.formatDateForInput(end);

        const [salaryData, spendingData, categoryData] = await Promise.all([
            api.fetchSalaryData(),
            api.fetchMonthlySpendingData(startStr, endStr),
            api.fetchCategorySpendingData(startStr, endStr)
        ]);

        Object.assign(salary, salaryData);
        spending.value = spendingData;
        categories.value = categoryData;
    } catch (err) {
        console.error('Error loading reports:', err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    if (!authStore.user) {
        router.push('/login');
        return;
    }
    loadAll();
});
</script>
