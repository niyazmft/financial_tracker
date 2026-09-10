<template>
  <Dialog 
    v-model:visible="visible" 
    header="Add Transactions" 
    modal 
    :style="{ width: '50rem' }" 
    :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
  >
    <Tabs value="0">
      <TabList>
        <Tab value="0">
          Single Transaction
        </Tab>
        <Tab value="1">
          CSV Import
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0">
          <div class="flex flex-col gap-4 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label for="date">Date</label>
                <DatePicker
                  id="date"
                  v-model="singleForm.date"
                  date-format="yy-mm-dd"
                  show-icon
                />
              </div>
              <div class="flex flex-col gap-2">
                <label for="amount">Amount</label>
                <InputNumber
                  id="amount"
                  v-model="singleForm.amount"
                  mode="currency"
                  :currency="currency"
                  :locale="currencyLocale"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label for="bank">Bank</label>
                <InputText
                  id="bank"
                  v-model="singleForm.bank"
                  placeholder="e.g. My Bank"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label for="category">Category</label>
                <CategoryPicker
                  v-model="singleForm.categories_id"
                  placeholder="Select Category"
                />
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label for="desc">Description</label>
              <InputText
                id="desc"
                v-model="singleForm.description"
              />
            </div>
            <div class="flex justify-end gap-2 mt-4">
              <Button
                label="Cancel"
                text
                severity="secondary"
                @click="closeModal"
              />
              <Button
                label="Save Transaction"
                :loading="singleLoading"
                @click="saveSingleTransaction"
              />
            </div>
          </div>
        </TabPanel>
        <TabPanel value="1">
          <div class="flex flex-col gap-4 py-4">
            <div
              v-if="!importResult && csvPreviewData.length === 0"
              class="flex justify-between items-center mb-2"
            >
              <span class="text-sm text-gray-500 italic">Need the template? Click the button to download.</span>
              <Button
                label="Download Template"
                icon="pi pi-download"
                text
                severity="info"
                class="p-button-sm"
                @click="downloadTemplate"
              />
            </div>
                        
            <FileUpload
              v-if="!importResult && csvPreviewData.length === 0"
              mode="advanced"
              name="demo[]"
              accept=".csv"
              :max-file-size="1000000"
              custom-upload
              choose-label="Select CSV File"
              class="w-full"
              @uploader="onCsvUpload"
            >
              <template #empty>
                <p>Drag and drop CSV files here to upload.</p>
              </template>
            </FileUpload>

            <Message
              v-if="csvParseError"
              severity="error"
              icon="pi pi-exclamation-triangle"
              :closable="false"
              class="mt-2"
            >
              {{ csvParseError }}
            </Message>
                        
            <div
              v-if="importResult"
              class="mt-4 p-4 border rounded-lg bg-gray-50"
            >
              <h3 class="font-bold mb-2 flex items-center gap-2">
                <i :class="importResult.failed === 0 ? 'pi pi-check-circle text-green-500' : 'pi pi-exclamation-triangle text-orange-500'" />
                Import Summary
              </h3>
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="p-2 bg-white rounded border flex flex-col items-center">
                  <span class="text-2xl font-bold text-green-600">{{ importResult.successful }}</span>
                  <span class="text-xs uppercase text-gray-500">Successful</span>
                </div>
                <div class="p-2 bg-white rounded border flex flex-col items-center">
                  <span class="text-2xl font-bold text-red-600">{{ importResult.failed }}</span>
                  <span class="text-xs uppercase text-gray-500">Failed</span>
                </div>
              </div>
                            
              <div
                v-if="importResult.errors && importResult.errors.length > 0"
                class="mt-2"
              >
                <p class="text-sm font-bold text-red-600 mb-1">
                  Errors Details:
                </p>
                <div class="max-h-40 overflow-y-auto border rounded p-2 bg-red-50 text-xs font-mono">
                  <div
                    v-for="(err, idx) in importResult.errors"
                    :key="idx"
                    class="mb-1 pb-1 border-b last:border-0 border-red-100 text-red-800"
                  >
                    Row {{ err.row }}: {{ err.error || err.message }}
                  </div>
                </div>
              </div>
                            
              <div class="flex justify-end mt-4">
                <Button
                  label="Close"
                  text
                  @click="clearImportResult"
                />
              </div>
            </div>

            <div
              v-else-if="csvPreviewData.length > 0"
              class="mt-4"
            >
              <h3 class="font-bold mb-2">
                Preview ({{ csvPreviewData.length }} rows)
              </h3>
              <DataTable
                :value="csvPreviewData"
                scrollable
                scroll-height="300px"
                class="p-datatable-xs"
              >
                <Column
                  field="date"
                  header="Date"
                />
                <Column
                  field="amount"
                  header="Amount"
                />
                <Column
                  field="bank"
                  header="Bank"
                />
                <Column
                  field="category"
                  header="Category"
                />
              </DataTable>
              <div class="flex justify-end mt-4">
                <Button
                  label="Import All"
                  icon="pi pi-upload"
                  :loading="importLoading"
                  @click="submitCsvImport"
                />
              </div>
            </div>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { useFinanceStore } from '../../stores/finance';
import { useAnalytics } from '../../composables/useAnalytics';
import * as utils from '../../services/utils';
import { useToast } from 'primevue/usetoast';
import CategoryPicker from '../Shared/CategoryPicker.vue';

// PrimeVue components auto-imported
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import FileUpload from 'primevue/fileupload';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    categories: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const settingsStore = useSettingsStore();
const financeStore = useFinanceStore();
const { trackEvent } = useAnalytics();
const toast = useToast();

const currency = computed(() => settingsStore.currency);
const currencyLocale = computed(() => utils.getCurrencyLocale(currency.value));
const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const singleLoading = ref(false);
const importLoading = ref(false);
const csvPreviewData = ref([]);
const csvParseError = ref('');
const importResult = ref(null);

const singleForm = reactive({
    date: new Date(),
    amount: 0,
    bank: '',
    categories_id: null,
    description: ''
});

const closeModal = () => {
    visible.value = false;
    // Reset states on close
    csvPreviewData.value = [];
    importResult.value = null;
};

const clearImportResult = () => {
    importResult.value = null;
    csvPreviewData.value = [];
};

const saveSingleTransaction = async () => {
    singleLoading.value = true;
    try {
        const data = {
            ...singleForm,
            date: utils.formatDateForInput(singleForm.date)
        };
        await financeStore.addTransaction(data);
        trackEvent('add_transaction', { type: 'single' });
        toast.add({ severity: 'success', summary: 'Success', detail: 'Transaction added', life: 3000 });
        
        // Reset form
        singleForm.amount = 0;
        singleForm.description = '';
        
        emit('saved');
        closeModal();
    } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to add transaction', life: 3000 });
    } finally {
        singleLoading.value = false;
    }
};

const onCsvUpload = (event) => {
    const file = event.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const parsed = utils.parseCsv(text);
        if (parsed === null) {
            csvParseError.value = 'This file has unbalanced quotes and could not be read. Please check the file and try again.';
            csvPreviewData.value = [];
            return;
        }
        csvParseError.value = '';

        const lines = parsed.filter(l => l.some(cell => cell.trim() !== ''));
        if (lines.length < 2) return;
        
        const headers = lines[0].map(h => h.trim().toLowerCase());
        
        csvPreviewData.value = lines.slice(1).map(line => {
            const get = (name) => {
                const idx = headers.indexOf(name);
                return idx >= 0 ? (line[idx] || '').trim() : '';
            };
            return {
                date: get('date'),
                amount: parseFloat(get('amount')),
                bank: get('bank'),
                category: get('category'),
                description: get('description')
            };
        });
    };
    reader.readAsText(file);
};

const submitCsvImport = async () => {
    importLoading.value = true;
    try {
        const summary = await financeStore.importTransactions(csvPreviewData.value);
        trackEvent('add_transaction', { type: 'csv', count: csvPreviewData.value.length });
        
        importResult.value = summary;

        if (summary.failed === 0) {
            toast.add({ 
                severity: 'success', 
                summary: 'Import Successful', 
                detail: `All ${summary.successful} transactions imported correctly.`, 
                life: 5000 
            });
            // Auto-close only on perfect success
            setTimeout(() => {
                if (importResult.value === summary) {
                    closeModal();
                }
            }, 2000);
        } else {
            toast.add({ 
                severity: 'warn', 
                summary: 'Import Completed with Issues', 
                detail: `${summary.successful} successful, ${summary.failed} failed.`, 
                life: 5000 
            });
            // Keep modal open to show the summary/errors
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to import transactions: ' + error.message, life: 5000 });
    } finally {
        importLoading.value = false;
    }
};

const downloadTemplate = () => {
    const headers = ['date', 'amount', 'bank', 'category', 'description', 'ref_no'];
    const exampleRow = ['2026-03-18', '-150.00', 'My Bank', 'Dining', 'Lunch at Cafe', 'TXN123456'];

    const content = utils.generateCsvTemplate(headers, exampleRow);
    utils.downloadFile(content, 'fintrack_template.csv');

    trackEvent('download_csv_template', { format: 'csv' });
    };
    </script>