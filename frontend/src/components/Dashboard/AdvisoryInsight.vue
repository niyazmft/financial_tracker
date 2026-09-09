<template>
  <div class="mb-6">
    <!-- Empty data: teach, don't reassure -->
    <Message
      v-if="hasData === false"
      severity="info"
      icon="pi pi-info-circle"
      :closable="false"
    >
      <div class="flex flex-col gap-1">
        <p class="font-bold">
          Welcome! Your money story starts with your data.
        </p>
        <p>
          Add your first transactions (or upload a bank CSV) to unlock your cash-flow forecast, risk warnings, and personal insights.
          Head to the <span class="font-semibold">Transactions</span> page to get started.
        </p>
      </div>
    </Message>

    <!-- Loading -->
    <Message
      v-else-if="isLoading"
      severity="secondary"
      :closable="false"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-spin pi-spinner" />
        <span>Reading your financial health…</span>
      </div>
    </Message>

    <!-- Data present: stale-data hint (optional) then the advisory statement -->
    <template v-else>
      <Message
        v-if="staleDays !== null && staleDays > 3"
        severity="warn"
        icon="pi pi-exclamation-triangle"
        :closable="false"
        class="mb-3"
      >
        Your latest recorded transaction is {{ staleDays }} day{{ staleDays === 1 ? '' : 's' }} old. Insights are most useful with fresh data.
      </Message>

      <Card
        v-if="advisoryStatement"
        class="advisory-card"
      >
        <template #header>
          <div class="flex items-center gap-2 px-4 pt-4">
            <i class="pi pi-comment text-info" />
            <h3 class="text-lg font-bold text-text-main">
              Money at a glance
            </h3>
          </div>
        </template>
        <template #content>
          <p class="text-text-main leading-relaxed">
            {{ advisoryStatement }}
          </p>
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '../../services/apiInstance';
import Message from 'primevue/message';
import Card from 'primevue/card';

const api = useApi();

const isLoading = ref(true);
const hasData = ref(null);
const staleDays = ref(null);
const advisoryStatement = ref('');

const loadAdvisory = async () => {
  isLoading.value = true;
  try {
    const response = await api.fetchAdvisory();
    if (response.success) {
      advisoryStatement.value = response.advisoryStatement || '';
      staleDays.value = response.dataFreshness?.staleDays ?? null;
      // No history when the latest recorded date is absent
      hasData.value = Boolean(response.dataFreshness?.latestRecordDate);
    }
  } catch (error) {
    // On failure, keep the surface quiet rather than alarming the user
    console.error('Error fetching advisory:', error);
    hasData.value = true;
  } finally {
    isLoading.value = false;
  }
};

loadAdvisory();
</script>

<style scoped>
.advisory-card :deep(.p-card-header) {
  border-bottom: 1px solid var(--p-content-border-color, #e5e7eb);
}
</style>
