<template>
  <div class="mb-4">
    <Tabs v-model:value="activeTab" @update:value="onTabChange">
        <TabList>
            <Tab v-for="tab in tabs" :key="tab.id" :value="tab.id">
                <i :class="tab.icon" class="mr-2"></i>
                <span>{{ tab.label }}</span>
            </Tab>
        </TabList>
    </Tabs>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';

const props = defineProps({
  initialTab: {
    type: String,
    default: 'forecast'
  }
});

const emit = defineEmits(['tab-change']);

const activeTab = ref(props.initialTab);

const tabs = [
  { id: 'forecast', label: 'Cash Flow Forecast', icon: 'pi pi-chart-line' },
  { id: 'history', label: 'Cash Flow History', icon: 'pi pi-history' },
  { id: 'savings', label: 'Savings Goals', icon: 'pi pi-save' }
];

const onTabChange = (tabId) => {
    emit('tab-change', tabId);
};

watch(() => props.initialTab, (newVal) => {
  activeTab.value = newVal;
});
</script>