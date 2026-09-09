<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Welcome to FinTrack!"
    :style="{ width: '50rem' }"
    :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
    :closable="false"
    :draggable="false"
  >
    <div class="stepper">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="step"
        :class="{ 'active': currentStep === index, 'completed': currentStep > index }"
      >
        <div class="step-icon">
          {{ index + 1 }}
        </div>
        <div class="step-label">
          {{ step.title }}
        </div>
      </div>
    </div>
    <div class="step-content mt-8">
      <div v-if="currentStep === 0">
        <h2 class="text-xl font-bold mb-4">
          Understand your money, not just track it
        </h2>
        <p class="mb-3">
          FinTrack turns your transactions into plain-language answers, so you can:
        </p>
        <ul class="list-disc list-inside space-y-1">
          <li>See cash-flow warnings before they surprise you</li>
          <li>Spot unusual spending compared to your own history</li>
          <li>Plan budgets, subscriptions, and savings goals</li>
          <li>Read a plain-English outlook of your financial health</li>
        </ul>
      </div>
      <div v-if="currentStep === 1">
        <h2 class="text-xl font-bold mb-4">
          Add your transactions
        </h2>
        <p class="mb-3">
          A CSV is just a simple spreadsheet of your bank statements — the kind most banks let you download. We'll turn it into your insights.
        </p>
        <p class="mb-4">
          Need a hand? We'll open the import window for you with a ready-made template.
        </p>
        <Button
          label="Add my transactions"
          icon="pi pi-arrow-right"
          @click="goToImport"
        />
      </div>
      <div v-if="currentStep === 2">
        <h2 class="text-xl font-bold mb-4">
          Your data is protected
        </h2>
        <p class="mb-3">
          Everything you add is private and only accessible to you. We use secure sign-in on every request, and you stay in control of your information.
        </p>
        <p>You can also explore on your own and import later — no pressure.</p>
      </div>
    </div>
    <template #footer>
      <Button
        v-if="currentStep > 0"
        label="Back"
        text
        @click="prevStep"
      />
      <Button
        v-if="currentStep < steps.length - 1"
        label="Next"
        @click="nextStep"
      />
      <Button
        v-else
        label="Start exploring"
        severity="success"
        @click="finishOnboarding"
      />
      <Button
        label="Skip for now"
        text
        severity="secondary"
        @click="finishOnboarding"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useSettingsStore } from '../../stores/settings';

const settingsStore = useSettingsStore();
const router = useRouter();
const visible = computed({
  get: () => !settingsStore.hasCompletedOnboarding,
  set: (value) => {
    if (!value) {
      settingsStore.completeOnboarding();
    }
  }
});

const steps = ref([
  { title: 'Why FinTrack' },
  { title: 'Get Started' },
  { title: 'Privacy' }
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

const goToImport = () => {
  // Mark onboarding complete, then deep-link into the import flow
  settingsStore.completeOnboarding();
  router.push({ path: '/transactions', query: { import: '1' } });
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
