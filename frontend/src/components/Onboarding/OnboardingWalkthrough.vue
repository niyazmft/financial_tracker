<template>
  <Dialog v-model:visible="visible" modal header="Welcome to FinTrack!" :style="{ width: '50rem' }" :breakpoints="{ '960px': '75vw', '641px': '100vw' }" :closable="false" :draggable="false">
    <div class="stepper">
      <div class="step" v-for="(step, index) in steps" :key="index" :class="{ 'active': currentStep === index, 'completed': currentStep > index }">
        <div class="step-icon">{{ index + 1 }}</div>
        <div class="step-label">{{ step.title }}</div>
      </div>
    </div>
    <div class="step-content mt-8">
      <div v-if="currentStep === 0">
        <h2 class="text-xl font-bold mb-4">Secure Sign-In & Authentication</h2>
        <p>Your financial data is protected. We use secure, token-based authentication for every request. Your information is only accessible to you.</p>
      </div>
      <div v-if="currentStep === 1">
        <h2 class="text-xl font-bold mb-4">CSV Upload Process</h2>
        <p>To get started, upload a CSV file of your bank statements. Navigate to the 'Transactions' page and click 'Add Transactions' to begin.</p>
        <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="font-bold">Required Columns:</p>
          <ul class="list-disc list-inside mt-2">
            <li><code class="bg-gray-200 px-1 rounded">date</code> (YYYY-MM-DD)</li>
            <li><code class="bg-gray-200 px-1 rounded">amount</code></li>
            <li><code class="bg-gray-200 px-1 rounded">bank</code></li>
            <li><code class="bg-gray-200 px-1 rounded">category</code></li>
            <li><code class="bg-gray-200 px-1 rounded">description</code></li>
          </ul>
        </div>
      </div>
       <div v-if="currentStep === 2">
        <h2 class="text-xl font-bold mb-4">You're All Set!</h2>
        <p>You can always find more information in our documentation. Enjoy tracking your finances!</p>
      </div>
    </div>
    <template #footer>
      <Button v-if="currentStep > 0" label="Back" text @click="prevStep" />
      <Button v-if="currentStep < steps.length - 1" label="Next" @click="nextStep" />
      <Button v-else label="Finish" severity="success" @click="finishOnboarding" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useSettingsStore } from '../../stores/settings';

const settingsStore = useSettingsStore();
const visible = computed({
  get: () => !settingsStore.hasCompletedOnboarding,
  set: (value) => {
    if (!value) {
      settingsStore.completeOnboarding();
    }
  }
});

const steps = ref([
  { title: 'Security' },
  { title: 'CSV Upload' },
  { title: 'Complete' }
]);
const currentStep = ref(0);

const nextStep = () => {
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const finishOnboarding = () => {
  settingsStore.completeOnboarding();
};
</script>

<style scoped>
.stepper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  border-bottom: 1px solid var(--border-base);
  padding-bottom: 1rem;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-muted);
  transition: color 0.3s;
}
.step-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid var(--text-muted);
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  transition: background-color 0.3s, border-color 0.3s;
}
.step-label {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}
.step.active .step-icon {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
  color: white;
}
.step.active .step-label {
  color: var(--color-primary);
}
.step.completed .step-icon {
  border-color: var(--color-success);
  background-color: var(--color-success);
  color: white;
}
.step.completed .step-label {
  color: var(--color-success);
}
</style>
