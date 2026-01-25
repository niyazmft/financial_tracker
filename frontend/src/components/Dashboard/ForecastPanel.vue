<template>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card class="lg:col-span-2">
        <template #header>
        <div class="flex flex-wrap items-center justify-between p-4 pb-0">
            <h3 class="text-lg font-bold">Projected Balance</h3>
            <SelectButton v-model="forecastPeriodDays" :options="forecastPeriodOptions" optionLabel="label" optionValue="value" @change="loadForecastData(forecastPeriodDays)" aria-labelledby="basic" />
        </div>
        </template>
        <template #content>
        <div class="mb-4">
            <p :class="['text-3xl font-bold', getForecastAmountClass(forecast.currentProjectedBalance)]">{{ forecast.currentProjectedBalance }}</p>
            <div class="flex items-center gap-2 text-sm text-text-sub">
            <i class="pi pi-calendar text-xs"></i>
            <span>{{ forecast.forecastPeriodText }}</span>
            </div>
        </div>
        <div class="h-80 relative">
            <AppChart 
                type="CashFlowForecast" 
                :data="forecastRawData" 
                :options="{ warningThreshold: forecastRawData?.warningThreshold }"
                :loading="isLoadingForecast" 
            />
        </div>
        </template>
    </Card>

    <div class="flex flex-col gap-4">
        <Card v-for="metric in forecastMetrics" :key="metric.label">
        <template #content>
            <div class="flex items-center gap-3 mb-1">
            <i :class="[metric.icon, metric.iconClass]" class="text-xl"></i>
            <p class="text-xs font-bold uppercase tracking-wider text-text-sub">{{ metric.label }}</p>
            </div>
            <p :class="['text-2xl font-bold', metric.valueClass]">{{ metric.value }}</p>
        </template>
        </Card>
    </div>
    </div>

    <div class="mt-8">
    <h3 class="text-xl font-bold mb-4">Forecast Warnings</h3>
    <div class="flex flex-col gap-3">
        <div v-for="(warningGroup, index) in forecast.warnings" :key="index">
        <Message v-if="warningGroup.type === 'info'" severity="success" :closable="false">
            No upcoming cash flow issues detected. Your financial forecast looks clear for the next {{ forecastPeriodDays }} days.
        </Message>
        <Panel v-else :header="`${warningGroup.warnings.length} ${warningGroup.type === 'critical' ? 'Critical Warnings' : 'General Warnings'}`" toggleable :collapsed="!warningGroup.expanded">
            <template #icons>
            <i :class="warningGroup.type === 'critical' ? 'pi pi-exclamation-circle text-danger' : 'pi pi-exclamation-triangle text-warning'" class="mr-2"></i>
            </template>
            <div class="flex flex-col gap-4">
            <div v-for="(warning, wIndex) in warningGroup.warnings" :key="wIndex" class="flex items-start justify-between gap-4 p-2 border-b border-border-base last:border-0 hover:bg-hover-bg rounded-md transition-colors group">
                <div>
                <p class="font-bold" :class="warningGroup.type === 'critical' ? 'text-danger' : 'text-warning'">{{ warning.message }}</p>
                <p class="text-sm">Projected balance: <span class="font-medium">{{ formatCurrency(warning.details.balance) }}</span></p>
                </div>
                <Button 
                icon="pi pi-times" 
                text 
                rounded 
                severity="secondary" 
                size="small" 
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                v-tooltip="'Dismiss for 24 hours'"
                @click="handleDismissWarning(warning.id)"
                />
            </div>
            </div>
        </Panel>
        </div>
    </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useFinance } from '../../composables/useFinance';
import { useAnalytics } from '../../composables/useAnalytics';
import { useApi } from '../../services/apiInstance';
import { useSettingsStore } from '../../stores/settings';
import AppChart from '../Shared/AppChart.vue';
import { useToast } from 'primevue/usetoast';

// PrimeVue components auto-imported
import Card from 'primevue/card';
import SelectButton from 'primevue/selectbutton';
import Message from 'primevue/message';
import Panel from 'primevue/panel';
import Button from 'primevue/button';

const api = useApi();
const settingsStore = useSettingsStore();
const toast = useToast();
const { formatCurrency, getForecastAmountClass } = useFinance();
const { trackEvent } = useAnalytics();

const isLoadingForecast = ref(false);
const forecastRawData = ref(null);
const forecastPeriodDays = ref(30);
const forecastPeriodOptions = [
    { label: '30 Days', value: 30 },
    { label: '60 Days', value: 60 },
    { label: '90 Days', value: 90 }
];

const forecast = reactive({
    currentProjectedBalance: '0',
    forecastPeriodText: 'Next 30 Days',
    lowestProjectedBalance: 0,
    averageProjectedBalance: 0,
    totalProjectedIncome: 0,
    totalProjectedExpenses: 0,
    warnings: []
});

const forecastMetrics = computed(() => [
    { label: 'Minimum Balance', value: formatCurrency(forecast.lowestProjectedBalance), icon: 'pi pi-arrow-down-right', iconClass: 'text-danger', valueClass: getForecastAmountClass(forecast.lowestProjectedBalance) },
    { label: 'Average Balance', value: formatCurrency(forecast.averageProjectedBalance), icon: 'pi pi-info-circle', iconClass: 'text-info', valueClass: getForecastAmountClass(forecast.averageProjectedBalance) },
    { label: 'Total Income', value: formatCurrency(forecast.totalProjectedIncome), icon: 'pi pi-arrow-up', iconClass: 'text-success', valueClass: 'text-success' },
    { label: 'Total Expenses', value: formatCurrency(forecast.totalProjectedExpenses), icon: 'pi pi-arrow-down', iconClass: 'text-danger', valueClass: 'text-danger' }
]);

const loadForecastData = async (days = 30) => {
    isLoadingForecast.value = true;
    forecast.forecastPeriodText = `Next ${days} Days`;
    try {
        const data = await api.fetchCashFlowForecast(days);
        if (data.success) {
            forecast.lowestProjectedBalance = data.summaryMetrics.lowestProjectedBalance;
            forecast.averageProjectedBalance = data.summaryMetrics.averageProjectedBalance;
            forecast.totalProjectedIncome = data.summaryMetrics.totalProjectedIncome;
            forecast.totalProjectedExpenses = data.summaryMetrics.totalProjectedExpenses;
            
            if (data.dailyBalances && data.dailyBalances.length > 0) {
                forecast.currentProjectedBalance = formatCurrency(data.dailyBalances[data.dailyBalances.length - 1].balance);
            }

            forecastRawData.value = data;

            if (data.warnings && data.warnings.length > 0) {
                const warningsByType = data.warnings.reduce((acc, warning) => {
                    warning.id = btoa(warning.date + warning.message);
                    if (settingsStore.isWarningDismissed(warning.id)) return acc;

                    const type = warning.type === 'urgent' ? 'critical' : 'warning';
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(warning);
                    return acc;
                }, {});
                
                const processedWarnings = Object.keys(warningsByType).map(type => ({ type, warnings: warningsByType[type], expanded: true }));
                forecast.warnings = processedWarnings.length > 0 ? processedWarnings : [{ type: 'info' }];
            } else {
                forecast.warnings = [{ type: 'info' }];
            }
        }
    } catch (err) {
        console.error(err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load forecast', life: 3000 });
    } finally {
        isLoadingForecast.value = false;
    }
};

const handleDismissWarning = async (id) => {
    try {
        await settingsStore.dismissWarning(id);
        trackEvent('dismiss_warning', { warning_id: id });
        toast.add({ severity: 'info', summary: 'Warning Dismissed', detail: 'This warning will be hidden for 24 hours.', life: 3000 });
        loadForecastData(forecastPeriodDays.value);
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to dismiss warning', life: 3000 });
    }
};

onMounted(() => {
    loadForecastData();
});
</script>