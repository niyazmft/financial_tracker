<template>
  <div class="range-slider-container w-full">
    <div class="flex justify-between items-center mb-2">
      <label v-if="label" class="text-sm font-medium text-slate-700 dark:text-slate-300">
        {{ label }}
      </label>
      <span class="text-sm font-bold text-primary">{{ modelValue }}x</span>
    </div>
    <div class="relative w-full h-6 flex items-center">
      <input
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        @input="$emit('update:modelValue', parseFloat($event.target.value))"
        class="w-full absolute z-20 opacity-0 cursor-pointer h-full"
      />
      <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden absolute z-10">
        <div 
          class="h-full bg-primary transition-all duration-75 ease-out" 
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
      <div 
        class="absolute w-4 h-4 bg-white border-2 border-primary rounded-full z-10 shadow-md transition-all duration-75 ease-out pointer-events-none"
        :style="{ left: `calc(${progressPercentage}% - 8px)` }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  step: {
    type: Number,
    default: 1
  },
  label: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const progressPercentage = computed(() => {
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100;
});
</script>

<style scoped>
/* Ensure custom styles don't conflict with Tailwind */
</style>
