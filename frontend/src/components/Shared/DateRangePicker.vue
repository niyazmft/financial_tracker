<template>
  <div>
    <Button 
      icon="pi pi-calendar" 
      :label="displayLabel" 
      severity="secondary" 
      outlined 
      aria-haspopup="true" 
      aria-controls="date_range_overlay" 
      @click="togglePicker"
    />

    <Popover
      id="date_range_overlay"
      ref="op"
      class="w-[450px]"
    >
      <div class="flex flex-col gap-4 p-2">
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">From</label>
            <DatePicker
              v-model="tempRange.start"
              date-format="yy-mm-dd"
              show-icon
              fluid
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">To</label>
            <DatePicker
              v-model="tempRange.end"
              date-format="yy-mm-dd"
              show-icon
              fluid
            />
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button 
            v-for="preset in presets" 
            :key="preset.label" 
            :label="preset.label" 
            severity="secondary" 
            text 
            size="small"
            @click="applyPreset(preset)" 
          />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-surface-200 dark:border-surface-700">
          <Button
            label="Cancel"
            severity="secondary"
            text
            @click="closePicker"
          />
          <Button
            label="Apply"
            :disabled="!isValidRange"
            @click="applyRange"
          />
        </div>
      </div>
    </Popover>
  </div>
</template>

<script setup>
import { ref, computed, } from 'vue';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import Popover from 'primevue/popover';

const props = defineProps({
    startDate: { type: [Date, String], default: null },
    endDate: { type: [Date, String], default: null }
});

const emit = defineEmits(['update:range']);

const op = ref(null);
const tempRange = ref({ start: null, end: null });

const presets = [
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'This Month', type: 'thisMonth' },
    { label: 'Last Month', type: 'lastMonth' },
    { label: 'This Year', type: 'thisYear' }
];

const displayLabel = computed(() => {
    if (!props.startDate || !props.endDate) return 'Select Date Range';
    const start = new Date(props.startDate).toLocaleDateString();
    const end = new Date(props.endDate).toLocaleDateString();
    return `${start} - ${end}`;
});

const isValidRange = computed(() => {
    return tempRange.value.start && tempRange.value.end;
});

const togglePicker = (event) => {
    tempRange.value.start = props.startDate ? new Date(props.startDate) : null;
    tempRange.value.end = props.endDate ? new Date(props.endDate) : null;
    op.value.toggle(event);
};

const closePicker = () => {
    op.value.hide();
};

const applyPreset = (preset) => {
    const end = new Date();
    const start = new Date();

    if (preset.days) {
        start.setDate(end.getDate() - preset.days);
    } else if (preset.type === 'thisMonth') {
        start.setDate(1);
    } else if (preset.type === 'lastMonth') {
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        end.setDate(0); 
    } else if (preset.type === 'thisYear') {
        start.setMonth(0, 1);
    }

    tempRange.value.start = start;
    tempRange.value.end = end;
};

const applyRange = () => {
    if (isValidRange.value) {
        // Ensure we always emit Date objects even if input gave us strings
        const start = tempRange.value.start instanceof Date ? tempRange.value.start : new Date(tempRange.value.start);
        const end = tempRange.value.end instanceof Date ? tempRange.value.end : new Date(tempRange.value.end);

        emit('update:range', { start, end });
        closePicker();
    }
};
</script>
