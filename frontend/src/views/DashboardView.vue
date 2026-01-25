<template>
  <div class="p-4 md:p-8 max-w-7xl mx-auto">
    <div class="flex flex-col gap-1 mb-6">
      <h1 class="text-3xl font-bold text-text-main">Dashboard</h1>
      <p class="text-sm text-text-sub">Overview of Your Financial Activity</p>
    </div>

    <AnomalyAlerts />

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="forecast">
          <i class="pi pi-chart-line mr-2"></i>
          <span>Cash Flow Forecast</span>
        </Tab>
        <Tab value="history">
          <i class="pi pi-history mr-2"></i>
          <span>Cash Flow History</span>
        </Tab>
        <Tab value="savings">
          <i class="pi pi-save mr-2"></i>
          <span>Savings Goals</span>
        </Tab>
      </TabList>
      <TabPanels class="bg-transparent px-0 py-4">
        <TabPanel value="forecast">
            <ForecastPanel />
        </TabPanel>

        <TabPanel value="history">
            <HistoryPanel />
        </TabPanel>

        <TabPanel value="savings">
            <SavingsGoalsPanel />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AnomalyAlerts from '../components/AnomalyAlerts/AnomalyAlerts.vue';
import ForecastPanel from '../components/Dashboard/ForecastPanel.vue';
import HistoryPanel from '../components/Dashboard/HistoryPanel.vue';
import SavingsGoalsPanel from '../components/Dashboard/SavingsGoalsPanel.vue';

// PrimeVue components
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

const activeTab = ref('forecast');
</script>
