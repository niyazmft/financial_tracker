<template>
    <div>
        <Card>
            <template #header>
            <div class="flex justify-between items-center px-4 pt-4">
                <div>
                <h3 class="text-lg font-bold">Tagging Rules</h3>
                <p class="text-sm text-text-sub">Automatically categorize transactions based on keywords. (Max 3 rules)</p>
                </div>
                <Button label="Add Rule" icon="pi pi-plus" size="small" :disabled="rules.length >= 3" @click="openAddRuleModal" />
            </div>
            </template>
            <template #content>
            <div class="flex flex-col gap-3">
                <div v-if="loadingRules" class="text-center py-4">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>
                <div v-else-if="rules.length === 0" class="text-center py-4 text-text-sub">No tagging rules found.</div>
                <div v-for="rule in rules" :key="rule.Id" class="flex items-center justify-between p-3 bg-hover-bg rounded-lg border border-border-base">
                    <div class="flex items-center gap-3">
                        <span class="text-sm font-medium">"{{ rule.keyword }}"</span>
                        <i class="pi pi-arrow-right text-text-mute text-xs"></i>
                        <Tag :value="rule.categories?.category_name || 'Unknown'" severity="info" />
                    </div>
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEditRuleModal(rule)" />
                        <Button icon="pi pi-trash" severity="danger" text rounded @click="deleteRule(rule.Id)" />
                    </div>
                </div>
            </div>
            </template>
        </Card>

        <!-- Tagging Rule Modal -->
        <Dialog v-model:visible="showRuleModal" :header="editingRuleId ? 'Edit Tagging Rule' : 'Add New Tagging Rule'" modal :style="{ width: '450px' }">
            <div class="flex flex-col gap-4 py-2">
                <div class="flex flex-col gap-2">
                    <label for="rule-keyword">Keyword</label>
                    <InputText id="rule-keyword" v-model="ruleForm.keyword" placeholder="e.g. Netflix" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="rule-category">Category</label>
                    <Select id="rule-category" v-model="ruleForm.categories_id" :options="availableCategories" optionLabel="category_name" optionValue="Id" placeholder="Select Category" />
                </div>
                <small v-if="ruleError" class="p-error">{{ ruleError }}</small>
            </div>
            <template #footer>
                <Button label="Cancel" text @click="closeRuleModal" />
                <Button label="Save Rule" @click="saveRule" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useFinanceStore } from '../../stores/finance';
import { useAnalytics } from '../../composables/useAnalytics';
import { useApi } from '../../services/apiInstance';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

// PrimeVue components auto-imported
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';

const financeStore = useFinanceStore();
const { trackEvent } = useAnalytics();
const api = useApi();
const confirm = useConfirm();
const toast = useToast();

const rules = ref([]);
const loadingRules = ref(false);
const showRuleModal = ref(false);
const editingRuleId = ref(null);
const ruleForm = reactive({ keyword: '', categories_id: null });
const ruleError = ref('');
const availableCategories = ref([]);

const fetchTaggingRules = async () => {
    loadingRules.value = true;
    try {
        const response = await api.fetchTaggingRules();
        rules.value = response.data.rules || [];
    } catch (err) {
        console.error(err);
    } finally {
        loadingRules.value = false;
    }
};

const openAddRuleModal = () => {
    editingRuleId.value = null;
    ruleForm.keyword = '';
    ruleForm.categories_id = null;
    ruleError.value = '';
    showRuleModal.value = true;
};

const openEditRuleModal = (rule) => {
    editingRuleId.value = rule.Id;
    ruleForm.keyword = rule.keyword;
    ruleForm.categories_id = rule.categories_id;
    ruleError.value = '';
    showRuleModal.value = true;
};

const closeRuleModal = () => {
    showRuleModal.value = false;
};

const saveRule = async () => {
    if (!ruleForm.keyword || !ruleForm.categories_id) {
        ruleError.value = 'Please fill all fields';
        return;
    }

    try {
        if (editingRuleId.value) {
            await api.updateTaggingRule(editingRuleId.value, ruleForm);
        } else {
            await api.createTaggingRule(ruleForm);
            trackEvent('create_tagging_rule');
        }
        await fetchTaggingRules();
        showRuleModal.value = false;
        toast.add({ severity: 'success', summary: 'Success', detail: 'Rule saved', life: 3000 });
    } catch (err) {
        ruleError.value = err.message;
    }
};

const deleteRule = (id) => {
    confirm.require({
        message: 'Are you sure you want to delete this rule?',
        header: 'Delete Rule',
        severity: 'danger',
        accept: async () => {
            await api.deleteTaggingRule(id);
            trackEvent('delete_tagging_rule');
            await fetchTaggingRules();
            toast.add({ severity: 'success', summary: 'Success', detail: 'Rule deleted', life: 3000 });
        }
    });
};

onMounted(async () => {
    await fetchTaggingRules();
    await financeStore.fetchCategories();
    availableCategories.value = financeStore.categories;
});
</script>