<template>
    <Dialog v-model:visible="visible" header="Manage Categories" modal :style="{ width: '35rem' }" @hide="resetForm">
        <div class="flex flex-col gap-6 py-2">
            <!-- List & Edit Section -->
            <div class="flex flex-col gap-3">
                <h3 class="text-lg font-semibold">Existing Categories</h3>
                <div class="max-h-60 overflow-y-auto border border-border-base rounded-lg">
                    <DataTable :value="financeStore.categories" class="p-datatable-sm">
                        <Column field="category_name" header="Name">
                            <template #body="{ data }">
                                <span class="capitalize">{{ data.category_name }}</span>
                            </template>
                        </Column>
                        <Column field="type" header="Type">
                            <template #body="{ data }">
                                <Tag :value="data.type" :severity="getTypeSeverity(data.type)" />
                            </template>
                        </Column>
                        <Column header="Actions" class="w-24">
                            <template #body="{ data }">
                                <div class="flex gap-1">
                                    <Button icon="pi pi-pencil" text rounded severity="secondary" @click="startEdit(data)" />
                                    <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <Divider />

            <!-- Add / Edit Form -->
            <div class="flex flex-col gap-4">
                <h3 class="text-lg font-semibold">{{ editingId ? 'Edit Category' : 'Add New Category' }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="cat-name" class="text-sm">Category Name</label>
                        <InputText id="cat-name" v-model="form.name" placeholder="e.g. Shopping" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="cat-type" class="text-sm">Type</label>
                        <Select id="cat-type" v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Select Type" />
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-2">
                    <Button v-if="editingId" label="Cancel Edit" text severity="secondary" @click="resetForm" />
                    <Button :label="editingId ? 'Update Category' : 'Add Category'" :icon="editingId ? 'pi pi-save' : 'pi pi-plus'" :loading="loading" @click="saveCategory" />
                </div>
            </div>
        </div>

        <!-- Merge Confirmation Dialog (Nested) -->
        <Dialog v-model:visible="showDeleteConfirm" header="Delete & Merge" modal :style="{ width: '25rem' }">
            <div class="py-2">
                <p class="mb-4 text-sm">Deleting <b>{{ catToDelete?.category_name }}</b> will orphan its transactions. Please select a category to merge them into:</p>
                <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold">Merge into:</label>
                    <Select v-model="targetCategoryId" :options="otherCategories" optionLabel="category_name" optionValue="Id" placeholder="Select Target Category" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text severity="secondary" @click="showDeleteConfirm = false" />
                <Button label="Confirm Delete" severity="danger" :loading="loading" :disabled="!targetCategoryId" @click="handleDelete" />
            </template>
        </Dialog>
    </Dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useFinanceStore } from '../../stores/finance';
import { useToast } from 'primevue/usetoast';

// PrimeVue components auto-imported
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['update:modelValue']);

const financeStore = useFinanceStore();
const toast = useToast();

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const loading = ref(false);
const editingId = ref(null);
const form = reactive({
    name: '',
    type: 'spending'
});

const showDeleteConfirm = ref(false);
const catToDelete = ref(null);
const targetCategoryId = ref(null);

const typeOptions = [
    { label: 'Spending', value: 'spending' },
    { label: 'Earning', value: 'earning' },
    { label: 'Saving', value: 'saving' }
];

const otherCategories = computed(() => {
    if (!catToDelete.value) return [];
    return financeStore.categories.filter(c => c.Id !== catToDelete.value.Id);
});

const getTypeSeverity = (type) => {
    switch (type) {
        case 'earning': return 'success';
        case 'spending': return 'danger';
        case 'saving': return 'info';
        default: return 'secondary';
    }
};

const startEdit = (cat) => {
    editingId.value = cat.Id;
    form.name = cat.category_name;
    form.type = cat.type;
};

const resetForm = () => {
    editingId.value = null;
    form.name = '';
    form.type = 'spending';
};

const saveCategory = async () => {
    if (!form.name || !form.type) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill all fields', life: 3000 });
        return;
    }

    loading.value = true;
    try {
        if (editingId.value) {
            await financeStore.updateCategory(editingId.value, { category_name: form.name, type: form.type });
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Category updated successfully', life: 3000 });
        } else {
            await financeStore.createCategory(form.name, form.type);
            toast.add({ severity: 'success', summary: 'Created', detail: 'New category added', life: 3000 });
        }
        resetForm();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 3000 });
    } finally {
        loading.value = false;
    }
};

const confirmDelete = (cat) => {
    catToDelete.value = cat;
    targetCategoryId.value = null;
    showDeleteConfirm.value = true;
};

const handleDelete = async () => {
    if (!targetCategoryId.value) return;
    
    loading.value = true;
    try {
        await financeStore.deleteCategory(catToDelete.value.Id, targetCategoryId.value);
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Category removed and records merged', life: 3000 });
        showDeleteConfirm.value = false;
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    if (financeStore.categories.length === 0) {
        await financeStore.fetchCategories();
    }
});
</script>