<template>
    <div>
        <Button 
            icon="pi pi-calendar" 
            :label="displayLabel" 
            severity="secondary" 
            outlined 
            @click="togglePicker" 
            aria-haspopup="true" 
            aria-controls="date_range_overlay"
        />

        <Popover ref="op" id="date_range_overlay" class="w-[450px]">
            <div class="flex flex-col gap-4 p-2">
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">From</label>
                        <DatePicker v-model="tempRange.start" dateFormat="yy-mm-dd" showIcon fluid />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">To</label>
                        <DatePicker v-model="tempRange.end" dateFormat="yy-mm-dd" showIcon fluid />
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
                    <Button label="Cancel" severity="secondary" text @click="closePicker" />
                    <Button label="Apply" @click="applyRange" :disabled="!isValidRange" />
                </div>
            </div>
        </Popover>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
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
    tempRange.value.start = props.startDate;
    tempRange.value.end = props.endDate;
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

    tempRange.value.start = start.toISOString().split('T')[0];
    tempRange.value.end = end.toISOString().split('T')[0];
};

const applyRange = () => {
    if (isValidRange.value) {
        emit('update:range', {
            start: tempRange.value.start,
            end: tempRange.value.end
        });
        closePicker();
    }
};
</script>
