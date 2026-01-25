<template>
  <div class="w-full h-full relative">
    <canvas ref="canvasRef"></canvas>
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-card-bg/80 backdrop-blur-sm z-10">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as charts from '../../services/charts';
import ProgressSpinner from 'primevue/progressspinner';

const props = defineProps({
  // The type of chart to render (matches the export name in charts.js minus 'create')
  // e.g., 'SpendingBar', 'SpendingLine', 'CashFlowForecast'
  type: {
    type: String,
    required: true
  },
  data: {
    type: [Object, Array],
    default: () => ({})
  },
  // Optional extra parameters (like warningThreshold)
  options: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const canvasRef = ref(null);
let chartId = `chart-${Math.random().toString(36).substr(2, 9)}`;

const renderChart = () => {
  if (!canvasRef.value || !props.data) return;

  // Map the string type to the actual service function
  const functionName = `create${props.type}Chart`;
  const renderFn = charts[functionName];

  if (typeof renderFn === 'function') {
    // We pass the actual element instead of an ID to be safer with Vue's DOM recycling
    renderFn(canvasRef.value, props.data, props.options.warningThreshold);
  } else {
    console.warn(`AppChart: Chart type "${props.type}" (function ${functionName}) not found in charts.js`);
  }
};

// Re-render when data changes
watch(() => props.data, () => {
  nextTick(renderChart);
}, { deep: true });

onMounted(() => {
  // Ensure the canvas has an ID for our map-based tracking in charts.js
  if (canvasRef.value) {
    canvasRef.value.id = chartId;
  }
  renderChart();
});

onUnmounted(() => {
  charts.destroyChart(chartId);
});
</script>
