<template>
    <div>
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold">Savings Goals</h2>
            <Button label="Add New Goal" icon="pi pi-plus" @click="showAddGoalModal = true" />
        </div>

        <Card class="mb-8">
            <template #content>
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-lg font-bold">Total Savings Progress</h3>
                    <span class="text-2xl font-bold text-success">{{ formatCurrency(savings.totalAllocated) }}</span>
                </div>
                <ProgressBar :value="Math.round(savings.totalProgress)" :showValue="false" style="height: 1rem" />
                <p class="text-sm text-text-sub text-right mt-2">{{ Math.round(savings.totalProgress) }}% of total target ({{ formatCurrency(savings.totalTarget) }})</p>
            </template>
        </Card>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-if="savings.goals.length === 0 && !isLoadingSavings" class="col-span-full text-center py-12 text-text-sub">
                No savings goals yet. Add one to get started!
            </div>
            <Card v-for="goal in savings.goals" :key="goal.Id" class="relative group">
                <template #title>
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold">{{ goal.goal_name }}</h4>
                            <Tag :value="'Priority: ' + goal.priority" severity="secondary" class="text-[10px]" />
                        </div>
                        <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="handleDeleteGoal(goal.Id)" />
                    </div>
                </template>
                <template #content>
                    <ProgressBar :value="Math.min(goal.progress_percentage, 100)" :showValue="false" :severity="goal.is_fully_funded ? 'success' : 'primary'" class="mb-3" style="height: 8px" />
                    <div class="flex justify-between text-sm">
                        <span class="font-bold text-text-main">{{ formatCurrency(goal.current_amount) }}</span>
                        <span class="text-text-sub">of {{ formatCurrency(goal.target_amount) }}</span>
                    </div>
                    <p v-if="goal.target_date" class="text-xs text-text-mute text-right mt-2">Target: {{ goal.target_date }}</p>
                </template>
            </Card>
        </div>

        <!-- Add Goal Dialog -->
        <Dialog v-model:visible="showAddGoalModal" header="Add New Savings Goal" modal :style="{ width: '450px' }">
            <div class="flex flex-col gap-4 py-2">
                <div class="flex flex-col gap-2">
                    <label for="goal-name">Goal Name</label>
                    <InputText id="goal-name" v-model="addGoalForm.goal_name" placeholder="e.g. New Car" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="goal-target">Target Amount</label>
                    <InputNumber id="goal-target" v-model="addGoalForm.target_amount" mode="currency" currency="TRY" locale="tr-TR" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="goal-priority">Priority (1 = Highest)</label>
                    <InputNumber id="goal-priority" v-model="addGoalForm.priority" :min="1" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="goal-date">Target Date</label>
                    <DatePicker id="goal-date" v-model="addGoalForm.target_date" dateFormat="yy-mm-dd" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text severity="secondary" @click="showAddGoalModal = false" />
                <Button label="Create Goal" @click="handleAddGoalSubmit" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useFinance } from '../../composables/useFinance';
import { useApi } from '../../services/apiInstance';
import * as utils from '../../services/utils';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

// PrimeVue components auto-imported
import Card from 'primevue/card';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';

const api = useApi();
const confirm = useConfirm();
const toast = useToast();
const { formatCurrency } = useFinance();

const isLoadingSavings = ref(false);
const showAddGoalModal = ref(false);

const savings = reactive({
    goals: [],
    totalTarget: 0,
    totalAllocated: 0,
    totalProgress: 0
});

const addGoalForm = reactive({
    goal_name: '',
    target_amount: 0,
    priority: 1,
    target_date: null
});

const loadSavingsData = async () => {
    isLoadingSavings.value = true;
    try {
        const response = await api.fetchSavingsGoals();
        if (response.success || response.status === 'success') {
            const data = response.data || response;
            const { goals } = data;
            savings.goals = goals || [];
            savings.totalTarget = (goals || []).reduce((sum, g) => sum + parseFloat(g.target_amount), 0);
            savings.totalAllocated = (goals || []).reduce((sum, g) => sum + parseFloat(g.current_amount), 0);
            savings.totalProgress = savings.totalTarget > 0 ? (savings.totalAllocated / savings.totalTarget) * 100 : 0;
        }
    } catch (err) {
        console.error(err);
    } finally {
        isLoadingSavings.value = false;
    }
};

const handleAddGoalSubmit = async () => {
    try {
        const data = {
            ...addGoalForm,
            target_date: utils.formatDateForInput(addGoalForm.target_date)
        };
        await api.createSavingsGoal(data);
        showAddGoalModal.value = false;
        loadSavingsData();
        toast.add({ severity: 'success', summary: 'Success', detail: 'Goal created', life: 3000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create goal', life: 3000 });
    }
};

const handleDeleteGoal = (id) => {
    confirm.require({
        message: 'Are you sure you want to delete this goal?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                await api.deleteSavingsGoal(id);
                loadSavingsData();
                toast.add({ severity: 'success', summary: 'Success', detail: 'Goal deleted', life: 3000 });
            } catch (err) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete goal', life: 3000 });
            }
        }
    });
};

onMounted(() => {
    loadSavingsData();
});
</script>