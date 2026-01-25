<template>
  <div v-if="anomalies.length > 0" class="mb-6">
    <Message severity="warn" icon="pi pi-exclamation-triangle">
        <div class="flex flex-col gap-2">
            <p class="font-bold">Unusual spending activity detected:</p>
            <ul class="list-disc pl-5 space-y-2">
                <li v-for="anomaly in anomalies" :key="anomaly.id">
                    <span class="font-semibold">{{ anomaly.description }}</span> on {{ anomaly.date }} for {{ formatCurrency(anomaly.amount) }} in category '{{ anomaly.categoryName }}'.
                    <p class="text-xs opacity-80">{{ anomaly.reason }}</p>
                </li>
            </ul>
        </div>
    </Message>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFinance } from '@/composables/useFinance';
import { useApi } from '@/services/apiInstance';
import Message from 'primevue/message';

const api = useApi();
const anomalies = ref([]);
const { formatCurrency } = useFinance();

onMounted(async () => {
  try {
    const response = await api.fetchAnomalies();
    if (response.success) {
      anomalies.value = response.anomalies;
    }
  } catch (error) {
    console.error('Error fetching anomalies:', error);
  }
});
</script>