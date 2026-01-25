<template>
  <div class="p-4 md:p-8 max-w-7xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-text-main">Reports</h1>
      <p class="mt-1 text-sm text-text-sub">View detailed financial reports and analytics for your spending and earnings.</p>
    </div>

    <Card>
      <template #content>
        <div class="py-12 text-center flex flex-col items-center gap-4">
          <i class="pi pi-chart-bar text-5xl text-text-mute"></i>
          <p class="text-xl font-bold text-text-main">Reports functionality coming soon.</p>
          <p class="text-text-sub max-w-md">We are working on bringing you powerful insights and printable reports. Stay tuned!</p>
          <Button label="Back to Dashboard" icon="pi pi-arrow-left" outlined @click="router.push('/dashboard')" />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';

const router = useRouter();
</script>