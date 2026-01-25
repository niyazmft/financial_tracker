<template>
  <div class="p-4 md:p-8 max-w-7xl mx-auto">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-3xl font-bold text-text-main">Installment Plans</h1>
      <Button label="Add New Plan" icon="pi pi-plus" @click="openAddModal" />
    </div>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="upcoming">Upcoming Payments</Tab>
        <Tab value="all">All Plans</Tab>
      </TabList>
      <TabPanels class="bg-transparent px-0 py-6">
        <!-- Upcoming Payments -->
        <TabPanel value="upcoming">
          <div v-if="loading" class="text-center py-12">
            <ProgressSpinner style="width: 40px; height: 40px" />
          </div>
          <div v-else-if="upcomingPayments.length === 0" class="py-12 text-center border-2 border-dashed border-border-base rounded-xl bg-hover-bg/50">
            <p class="text-text-sub">No upcoming payments found.</p>
          </div>
          <div v-else class="flex flex-col gap-12">
            <div v-for="group in upcomingPayments" :key="group.groupKey">
              <h3 class="text-xl font-bold mb-6 sticky top-[120px] bg-app-bg/80 backdrop-blur-sm py-2 z-10 border-b border-border-base">{{ group.monthName }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card v-for="payment in group.installments" :key="payment.Id" class="hover:shadow-md transition-all">
                  <template #title>
                    <div class="flex justify-between items-start">
                      <span class="font-bold truncate max-w-[70%]" v-tooltip="payment.planName">{{ payment.planName }}</span>
                      <Tag :value="formatCurrency(payment.amount)" severity="info" />
                    </div>
                  </template>
                  <template #content>
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2 text-sm text-text-sub">
                            <div class="flex justify-between">
                                <span>Due Date:</span>
                                <span class="font-bold text-text-main">{{ formatDateDisplay(payment.dueDate) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Category:</span>
                                <span class="capitalize">{{ payment.categoryName }}</span>
                            </div>
                        </div>
                        <Button label="Mark as Paid" icon="pi pi-check" severity="secondary" outlined @click="markAsPaid(payment.Id)" class="w-full" />
                    </div>
                  </template>
                </Card>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- All Plans -->
        <TabPanel value="all">
          <div v-if="loading" class="text-center py-12">
            <ProgressSpinner style="width: 40px; height: 40px" />
          </div>
          <div v-else-if="allPlans.length === 0" class="py-12 text-center border-2 border-dashed border-border-base rounded-xl bg-hover-bg/50">
            <p class="text-text-sub">No installment plans found.</p>
          </div>
          <div v-else class="flex flex-col gap-6">
            <Card v-for="plan in allPlans" :key="plan.itemId" class="overflow-hidden">
              <template #content>
                <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div class="flex-1 min-w-[200px]">
                        <div class="flex items-center gap-3 mb-1">
                            <h3 class="text-xl font-bold">{{ plan.planName }}</h3>
                            <Tag :value="plan.categoryName" severity="secondary" class="capitalize" />
                        </div>
                        <p class="text-sm text-text-sub">Total: <b>{{ formatCurrency(plan.totalAmount) }}</b> • {{ plan.installmentCount }} Installments</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-right">
                            <p class="text-xs font-bold uppercase tracking-widest text-text-mute">Progress</p>
                            <p class="text-lg font-bold">{{ Math.round(plan.progress) }}%</p>
                        </div>
                        <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditModal(plan)" />
                        <Button :icon="expandedPlans[plan.itemId] ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" severity="secondary" text rounded @click="togglePlan(plan.itemId)" />
                    </div>
                </div>
                <ProgressBar :value="plan.progress" :showValue="false" style="height: 6px" />
                
                <div v-if="expandedPlans[plan.itemId]" class="mt-6 border-t border-border-base pt-4 overflow-x-auto">
                    <DataTable :value="plan.installments" class="p-datatable-sm">
                        <Column header="#">
                            <template #body="slotProps">{{ slotProps.index + 1 }}</template>
                        </Column>
                        <Column field="start_date" header="Due Date">
                            <template #body="{ data }">{{ formatDateDisplay(data.start_date) }}</template>
                        </Column>
                        <Column field="installment_payment" header="Amount">
                            <template #body="{ data }">{{ formatCurrency(data.installment_payment) }}</template>
                        </Column>
                        <Column field="paid" header="Status">
                            <template #body="{ data }">
                                <Tag :value="data.paid ? 'Paid' : 'Pending'" :severity="data.paid ? 'success' : 'warn'" />
                            </template>
                        </Column>
                        <Column header="Action" style="text-align: right">
                            <template #body="{ data }">
                                <Button v-if="!data.paid" label="Pay" icon="pi pi-check" severity="secondary" text size="small" @click="markAsPaid(data.Id)" />
                                <span v-else class="text-xs text-text-mute italic">Completed</span>
                            </template>
                        </Column>
                    </DataTable>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Add Plan Dialog -->
    <Dialog v-model:visible="showAddModal" header="Add New Installment Plan" modal :style="{ width: '50rem' }">
        <div class="flex flex-col gap-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label for="add-item">Item Name</label>
                    <InputText id="add-item" v-model="addForm.item_name" placeholder="e.g. MacBook Pro" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="add-cat">Category</label>
                    <CategoryPicker id="add-cat" v-model="addForm.category_id" placeholder="Select Category" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="add-total">Total Amount</label>
                    <InputNumber id="add-total" v-model="addForm.total_amount" mode="currency" currency="TRY" locale="tr-TR" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="add-start">Start Date</label>
                    <DatePicker id="add-start" v-model="addForm.start_date" dateFormat="yy-mm-dd" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="add-count">Installments</label>
                    <InputNumber id="add-count" v-model="addForm.installments_count" :min="1" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="add-freq">Frequency</label>
                    <Select id="add-freq" v-model="addForm.frequency" :options="FREQUENCIES" optionLabel="label" optionValue="value" />
                </div>
            </div>

            <div v-if="schedulePreview.length > 0" class="border-t border-border-base pt-4">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold">Schedule Preview</h4>
                    <Button label="Regenerate" icon="pi pi-refresh" text size="small" @click="generateSchedule" />
                </div>
                <DataTable :value="schedulePreview" scrollable scrollHeight="200px" class="p-datatable-xs">
                    <Column field="number" header="#"></Column>
                    <Column field="dueDate" header="Due Date">
                        <template #body="{ data }">
                            <input v-model="data.dueDate" type="date" class="bg-transparent border-none p-0 text-sm focus:ring-0">
                        </template>
                    </Column>
                    <Column field="amount" header="Amount">
                        <template #body="{ data }">
                            <input v-model.number="data.amount" type="number" step="0.01" class="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 w-24 text-right">
                        </template>
                    </Column>
                </DataTable>
                <div class="text-right mt-2 font-bold">Total: {{ formatCurrency(scheduleTotal) }}</div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" text severity="secondary" @click="showAddModal = false" />
            <Button label="Create Plan" :loading="isSaving" @click="saveNewPlan" />
        </template>
    </Dialog>

    <!-- Edit Plan Dialog -->
    <Dialog v-model:visible="showEditModal" header="Edit Installment Plan" modal :style="{ width: '50rem' }">
        <div class="flex flex-col gap-4 py-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label>Plan Name</label>
                    <InputText v-model="editForm.planName" />
                </div>
                <div class="flex flex-col gap-2">
                    <label>Category</label>
                    <CategoryPicker v-model="editForm.categoryId" />
                </div>
            </div>
            
            <DataTable :value="editForm.installments" scrollable scrollHeight="300px" class="p-datatable-sm">
                <Column field="start_date" header="Due Date">
                    <template #body="{ data }">
                        <input v-model="data.start_date" type="date" class="bg-transparent border-none p-0 text-sm focus:ring-0">
                    </template>
                </Column>
                <Column field="installment_payment" header="Amount">
                    <template #body="{ data }">
                        <input v-model.number="data.installment_payment" type="number" step="0.01" class="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 w-24">
                    </template>
                </Column>
                <Column field="paid" header="Paid">
                    <template #body="{ data }">
                        <Checkbox v-model="data.paid" :binary="true" />
                    </template>
                </Column>
                <Column header="Action">
                    <template #body="{ data }">
                        <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDeleteInstallment(data.Id)" />
                    </template>
                </Column>
            </DataTable>
        </div>
        <template #footer>
            <div class="flex justify-between w-full">
                <Button label="Delete Plan" severity="danger" text @click="confirmDeletePlan" />
                <div class="flex gap-2">
                    <Button label="Cancel" text severity="secondary" @click="showEditModal = false" />
                    <Button label="Save Changes" :loading="isSaving" @click="applyChanges" />
                </div>
            </div>
        </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useFinanceStore } from '../stores/finance';
import { useApi } from '../services/apiInstance';
import { useFinance } from '../composables/useFinance';
import * as utils from '../services/utils';
import * as calculator from '../services/installmentCalculator';
import * as processor from '../services/installmentProcessor';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import CategoryPicker from '../components/Shared/CategoryPicker.vue';

// PrimeVue components
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import ProgressBar from 'primevue/progressbar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Checkbox from 'primevue/checkbox';
import DatePicker from 'primevue/datepicker';
import ProgressSpinner from 'primevue/progressspinner';

const router = useRouter();
const authStore = useAuthStore();
const financeStore = useFinanceStore();
const api = useApi();
const { formatCurrency } = useFinance();
const confirm = useConfirm();
const toast = useToast();

const activeTab = ref('upcoming');
const loading = ref(false);
const isSaving = ref(false);
const categories = ref([]);
const rawInstallments = ref([]);
const expandedPlans = reactive({});

const showAddModal = ref(false);
const showEditModal = ref(false);

const FREQUENCIES = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Bi-Weekly', value: 'bi-weekly' },
    { label: 'Weekly', value: 'weekly' }
];

const addForm = reactive({
  item_name: '',
  category_id: null,
  total_amount: 0,
  start_date: new Date(),
  installments_count: 12,
  frequency: 'monthly'
});

const schedulePreview = ref([]);

const editForm = reactive({
  planName: '',
  categoryId: null,
  installments: []
});
let editingPlanId = null;

const upcomingPayments = computed(() => processor.processUpcomingPayments(rawInstallments.value));
const allPlans = computed(() => processor.processAllPlans(rawInstallments.value));
const scheduleTotal = computed(() => schedulePreview.value.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0));

watch(() => [addForm.total_amount, addForm.start_date, addForm.installments_count, addForm.frequency], () => {
  if (showAddModal.value && addForm.total_amount > 0 && addForm.installments_count > 0) {
    generateSchedule();
  }
}, { deep: true });

const fetchData = async () => {
  loading.value = true;
  try {
    const data = await api.fetchInstallments();
    if (data.success) {
      rawInstallments.value = data.installments;
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data', life: 3000 });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
    if (!authStore.user) {
        router.push('/login');
        return;
    }
    await financeStore.fetchCategories();
    categories.value = financeStore.categories;
    fetchData();
});

const markAsPaid = (id) => {
    confirm.require({
        message: 'Mark this payment as paid?',
        header: 'Confirmation',
        accept: async () => {
            try {
                await api.markInstallmentAsPaid(id, true);
                fetchData();
                toast.add({ severity: 'success', summary: 'Success', detail: 'Payment updated', life: 3000 });
            } catch (err) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update', life: 3000 });
            }
        }
    });
};

const togglePlan = (id) => expandedPlans[id] = !expandedPlans[id];

const openAddModal = () => {
    Object.assign(addForm, { item_name: '', category_id: null, total_amount: 0, start_date: new Date(), installments_count: 12, frequency: 'monthly' });
    schedulePreview.value = [];
    showAddModal.value = true;
};

const generateSchedule = () => {
    schedulePreview.value = calculator.generateSchedule({
        totalAmount: addForm.total_amount,
        startDate: utils.formatDateForInput(addForm.start_date),
        installmentCount: addForm.installments_count,
        frequency: addForm.frequency
    });
};

const saveNewPlan = async () => {
    isSaving.value = true;
    try {
        const payload = {
            itemName: addForm.item_name,
            categoryId: addForm.category_id,
            totalAmount: addForm.total_amount,
            installments: schedulePreview.value.map(i => ({ dueDate: i.dueDate, amount: i.amount }))
        };
        await api.createInstallmentPlan(payload);
        showAddModal.value = false;
        fetchData();
        toast.add({ severity: 'success', summary: 'Success', detail: 'Plan created', life: 3000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create plan', life: 3000 });
    } finally {
        isSaving.value = false;
    }
};

const openEditModal = (plan) => {
    editingPlanId = plan.itemId;
    editForm.planName = plan.planName;
    editForm.categoryId = plan.categoryId;
    editForm.installments = plan.installments.map(i => ({ ...i, start_date: i.start_date.split('T')[0] }));
    showEditModal.value = true;
};

const applyChanges = async () => {
    isSaving.value = true;
    try {
        await api.updateItem(editingPlanId, editForm.planName);
        const updates = editForm.installments.map(i => ({
            id: i.Id,
            installment_payment: i.installment_payment,
            start_date: i.start_date,
            paid: i.paid,
            categories_id: editForm.categoryId
        }));
        await api.updateInstallmentsBatch(updates);
        showEditModal.value = false;
        fetchData();
        toast.add({ severity: 'success', summary: 'Success', detail: 'Plan updated', life: 3000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update', life: 3000 });
    } finally {
        isSaving.value = false;
    }
};

const confirmDeletePlan = () => {
    confirm.require({
        message: 'Delete entire plan and all payments?',
        header: 'DANGER',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await api.deleteInstallmentPlan(editingPlanId);
                showEditModal.value = false;
                fetchData();
                toast.add({ severity: 'success', summary: 'Success', detail: 'Plan deleted', life: 3000 });
            } catch (err) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
            }
        }
    });
};

const confirmDeleteInstallment = (id) => {
    confirm.require({
        message: 'Delete this installment?',
        header: 'Delete Payment',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await api.deleteInstallment(id);
                editForm.installments = editForm.installments.filter(i => i.Id !== id);
                toast.add({ severity: 'success', summary: 'Success', detail: 'Payment deleted', life: 3000 });
            } catch (err) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
            }
        }
    });
};

const formatDateDisplay = (d) => utils.formatDateDisplay(d);
</script>
