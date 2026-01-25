<template>
  <Card class="lg:col-span-2">
    <template #header>
      <div class="flex flex-wrap items-center justify-between p-4 pb-0">
        <h3 class="text-lg font-bold">Projected Balance</h3>
        <SelectButton 
          :modelValue="period" 
          :options="periodOptions" 
          optionLabel="label" 
          optionValue="value" 
          @update:modelValue="onPeriodChange" 
          aria-labelledby="basic" 
        />
      </div>
    </template>
    <template #content>
      <div class="mb-4">
        <p :class="['text-3xl font-bold', getForecastAmountClass(currentBalance)]">{{ currentBalance }}</p>
        <div class="flex items-center gap-2 text-sm text-text-sub">
          <i class="pi pi-calendar text-xs"></i>
          <span>{{ periodText }}</span>
        </div>
      </div>
      <div class="h-80 relative">
        <canvas :id="chartId"></canvas>
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-card-bg/80 backdrop-blur-sm z-10">
          <ProgressSpinner style="width: 50px; height: 50px" />
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { onMounted, watch, nextTick } from 'vue';
import Card from 'primevue/card';
import SelectButton from 'primevue/selectbutton';
import ProgressSpinner from 'primevue/progressspinner';
import * as charts from '../../services/charts';
import { useFinance } from '../../composables/useFinance';

const props = defineProps({
  period: {
    type: Number,
    required: true
  },
  currentBalance: {
    type: String,
    default: '0'
  },
  periodText: {
    type: String,
    default: ''
  },
  chartId: {
    type: String,
    default: 'projected-balance-chart'
  },
  chartData: {
    type: Object,
    default: () => ({})
  },
  warningThreshold: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:period', 'period-change']);

const { getForecastAmountClass } = useFinance();

const periodOptions = [
    { label: '30 Days', value: 30 },
    { label: '60 Days', value: 60 },
    { label: '90 Days', value: 90 }
];

const onPeriodChange = (newValue) => {
    emit('update:period', newValue);
    emit('period-change', newValue);
};

const renderChart = () => {
    if (props.chartData && props.chartData.dailyBalances) {
        charts.createCashFlowForecastChart(props.chartId, props.chartData, props.warningThreshold);
    }
};

watch(() => props.chartData, () => {
    nextTick(renderChart);
}, { deep: true });

onMounted(() => {
    renderChart();
});
</script>
