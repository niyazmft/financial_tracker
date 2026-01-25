<template>
    <div class="flex flex-col gap-1">
        <Select 
            v-model="selectedId" 
            :options="options" 
            optionLabel="category_name" 
            optionValue="Id" 
            :placeholder="placeholder"
            class="w-full"
            filter
            @change="handleChange"
        >
            <template #option="slotProps">
                <div v-if="slotProps.option.isAction" class="flex items-center gap-2 text-primary font-bold py-1 border-t border-border-base mt-1">
                    <i :class="slotProps.option.icon"></i>
                    <span>{{ slotProps.option.category_name }}</span>
                </div>
                <div v-else class="flex items-center justify-between w-full">
                    <span class="capitalize">{{ slotProps.option.category_name }}</span>
                    <Tag :value="slotProps.option.type" :severity="getTypeSeverity(slotProps.option.type)" class="scale-75 origin-right" />
                </div>
            </template>
        </Select>

        <!-- The actual management dialog -->
        <CategoryManagerDialog v-model="showManager" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useFinanceStore } from '../../stores/finance';
import CategoryManagerDialog from './CategoryManagerDialog.vue';

// PrimeVue components
import Select from 'primevue/select';
import Tag from 'primevue/tag';

const props = defineProps({
    modelValue: [Number, String], // Can be ID (Number) or Name (String) for legacy support
    placeholder: {
        type: String,
        default: 'Select Category'
    },
    useName: {
        type: Boolean,
        default: false // Set to true if the parent expects the Name instead of ID
    }
});

const emit = defineEmits(['update:modelValue', 'change']);

const financeStore = useFinanceStore();
const showManager = ref(false);

const selectedId = computed({
    get: () => {
        if (!props.modelValue) return null;
        if (typeof props.modelValue === 'string') {
            const found = financeStore.categories.find(c => c.category_name.toLowerCase() === props.modelValue.toLowerCase());
            return found ? found.Id : null;
        }
        return props.modelValue;
    },
    set: (val) => {
        if (val === 'MANAGE_ACTION') return; // Handled by handleChange
        if (props.useName) {
            const found = financeStore.categories.find(c => c.Id === val);
            emit('update:modelValue', found ? found.category_name : null);
        } else {
            emit('update:modelValue', val);
        }
    }
});

const options = computed(() => {
    return [
        ...financeStore.categories,
        { Id: 'MANAGE_ACTION', category_name: 'Manage Categories...', isAction: true, icon: 'pi pi-cog' }
    ];
});

const handleChange = (e) => {
    if (e.value === 'MANAGE_ACTION') {
        // Reset selection so the action isn't "picked"
        const oldVal = props.modelValue;
        selectedId.value = oldVal;
        showManager.value = true;
    } else {
        emit('change', e.value);
    }
};

const getTypeSeverity = (type) => {
    switch (type) {
        case 'earning': return 'success';
        case 'spending': return 'danger';
        case 'saving': return 'info';
        default: return 'secondary';
    }
};

onMounted(async () => {
    if (financeStore.categories.length === 0) {
        await financeStore.fetchCategories();
    }
});
</script>