<template>
  <div class="p-4 md:p-8 max-w-7xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-text-main">Budget Management</h1>
      <p class="mt-1 text-sm text-text-sub">Create and manage your budgets to stay on track.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Create Budget Form -->
      <Card>
        <template #title>Create a New Budget</template>
        <template #content>
          <div class="flex flex-col gap-6">
            <template v-if="categories.length > 0">
              <div class="flex flex-col gap-2">
                <label for="budget-category">Category</label>
                <CategoryPicker v-model="createForm.categories_id" placeholder="Select a category" />
              </div>
            </template>
            <div v-else class="flex flex-col gap-2">
              <span class="text-sm font-medium text-text-sub">Category</span>
              <Skeleton height="3rem"></Skeleton>
            </div>
            
            <div class="flex flex-col gap-2">
              <label for="budget-amount">Target Amount</label>
              <InputNumber inputId="budget-amount" v-model="createForm.target_amount" mode="currency" :currency="currency" locale="tr-TR" class="w-full" />
            </div>

            <div class="flex flex-col gap-2">
              <label for="budget-start-date">Period</label>
              <div class="grid grid-cols-2 gap-2">
                <DatePicker inputId="budget-start-date" v-model="createForm.start_date" placeholder="Start Date" dateFormat="yy-mm-dd" />
                <DatePicker inputId="budget-end-date" v-model="createForm.end_date" placeholder="End Date" dateFormat="yy-mm-dd" aria-label="End Date" />
              </div>
            </div>

            <Button label="Create Budget" icon="pi pi-plus" :loading="isCreating" @click="handleCreateBudget" class="w-full mt-2" />
          </div>
        </template>
      </Card>

      <!-- Active Budgets List -->
      <Card>
        <template #title>Your Current Budgets</template>
        <template #content>
          <div class="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
            <div v-if="loadingBudgets" class="text-center py-8">
              <ProgressSpinner style="width: 40px; height: 40px" />
            </div>
            <div v-else-if="budgets.length === 0" class="text-center py-8 text-text-sub">
              No active budgets found.
            </div>
            <div v-else v-for="budget in budgets" :key="budget.Id" class="p-4 bg-hover-bg rounded-lg border border-border-base">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <p class="font-bold text-lg capitalize">{{ getCategoryName(budget.categories_id) }}</p>
                  <p class="text-xs text-text-sub">{{ formatDateRange(budget.start_date, budget.end_date) }}</p>
                </div>
                <div class="flex gap-1">
                  <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditModal(budget)" />
                  <Button icon="pi pi-trash" severity="danger" text rounded @click="handleDeleteBudget(budget.Id)" />
                </div>
              </div>
              
              <div class="flex justify-between text-sm mb-2">
                <span class="font-medium">{{ formatCurrency(budget.spent_amount) }} Spent</span>
                <span class="text-text-sub">Target: {{ formatCurrency(budget.target_amount) }}</span>
              </div>
              <ProgressBar :value="calculatePercentage(budget)" :showValue="false" :severity="getProgressSeverity(budget)" style="height: 10px" />
              <p class="text-right text-[10px] mt-1 text-text-mute">{{ Math.round(calculatePercentage(budget)) }}% used</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Edit Budget Dialog -->
    <Dialog v-model:visible="showEditModal" header="Edit Budget" modal :style="{ width: '400px' }">
        <div class="flex flex-col gap-4 py-2">
            <template v-if="categories.length > 0">
                <div class="flex flex-col gap-2">
                    <label for="edit-category">Category</label>
                    <CategoryPicker v-model="editForm.categories_id" />
                </div>
            </template>
            <div class="flex flex-col gap-2">
                <label for="edit-amount">Target Amount</label>
                <InputNumber inputId="edit-amount" v-model="editForm.target_amount" mode="currency" :currency="currency" locale="tr-TR" class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
                <label for="edit-start-date">Period</label>
                <div class="grid grid-cols-2 gap-2">
                    <DatePicker inputId="edit-start-date" v-model="editForm.start_date" dateFormat="yy-mm-dd" />
                    <DatePicker inputId="edit-end-date" v-model="editForm.end_date" dateFormat="yy-mm-dd" aria-label="End Date" />
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" text severity="secondary" @click="showEditModal = false" />
            <Button label="Save Changes" :loading="isUpdating" @click="handleUpdateBudget" />
        </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useSettingsStore } from '../stores/settings';
import { useFinanceStore } from '../stores/finance';
import { useApi } from '../services/apiInstance';
import { useFinance } from '../composables/useFinance';
import * as utils from '../services/utils';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import CategoryPicker from '../components/Shared/CategoryPicker.vue';

const router = useRouter();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const financeStore = useFinanceStore();
const api = useApi();
const { formatCurrency } = useFinance();
const confirm = useConfirm();
const toast = useToast();

const budgets = ref([]);
const categories = ref([]);
const loadingBudgets = ref(false);
const isCreating = ref(false);
const isUpdating = ref(false);
const showEditModal = ref(false);

const currency = computed(() => settingsStore.currency);

const createForm = reactive({
  categories_id: null,
  target_amount: 0,
  start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
});

const editForm = reactive({
  Id: null,
  categories_id: null,
  target_amount: 0,
  start_date: null,
  end_date: null
});

const fetchBudgets = async () => {
    loadingBudgets.value = true;
    try {
        const data = await api.fetchActiveBudgets();
        if (data.success) {
            budgets.value = data.budgets;
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load budgets', life: 3000 });
    } finally {
        loadingBudgets.value = false;
    }
};

const loadCategories = async () => {
    await financeStore.fetchCategories();
    categories.value = financeStore.categories;
};

onMounted(() => {
    if (!authStore.user) {
        router.push('/login');
        return;
    }
    fetchBudgets();
    loadCategories();
});

const getCategoryName = (id) => {
    if (!categories.value || categories.value.length === 0) return 'Loading...';
    const cat = categories.value.find(c => c.Id === id);
    return cat ? cat.category_name : 'Unknown';
};

const formatDateRange = (start, end) => utils.formatDateRange(start, end);

const calculatePercentage = (budget) => {
    if (!budget.target_amount) return 0;
    return (budget.spent_amount / budget.target_amount) * 100;
};

const getProgressSeverity = (budget) => {
    const pct = calculatePercentage(budget);
    if (pct >= 100) return 'danger';
    if (pct >= 80) return 'warn';
    return 'success';
};

const handleCreateBudget = async () => {
    if (!createForm.categories_id || !createForm.target_amount) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill all fields', life: 3000 });
        return;
    }

    isCreating.value = true;
    try {
        const data = {
            ...createForm,
            start_date: utils.formatDateForInput(createForm.start_date),
            end_date: utils.formatDateForInput(createForm.end_date)
        };
        await api.createBudget(data);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Budget created', life: 3000 });
        fetchBudgets();
        createForm.categories_id = null;
        createForm.target_amount = 0;
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create budget', life: 3000 });
    } finally {
        isCreating.value = false;
    }
};

const openEditModal = (budget) => {
    editForm.Id = budget.Id;
    editForm.categories_id = budget.categories_id;
    editForm.target_amount = budget.target_amount;
    editForm.start_date = new Date(budget.start_date);
    editForm.end_date = new Date(budget.end_date);
    showEditModal.value = true;
};

const handleUpdateBudget = async () => {
    isUpdating.value = true;
    try {
        const data = {
            ...editForm,
            start_date: utils.formatDateForInput(editForm.start_date),
            end_date: utils.formatDateForInput(editForm.end_date)
        };
        await api.updateBudget(editForm.Id, data);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Budget updated', life: 3000 });
        showEditModal.value = false;
        fetchBudgets();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update budget', life: 3000 });
    } finally {
        isUpdating.value = false;
    }
};

const handleDeleteBudget = (id) => {
    confirm.require({
        message: 'Are you sure you want to delete this budget?',
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await api.deleteBudget(id);
                fetchBudgets();
                toast.add({ severity: 'success', summary: 'Success', detail: 'Budget deleted', life: 3000 });
            } catch (err) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
            }
        }
    });
};
</script>