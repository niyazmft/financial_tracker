<template>
  <div v-if="isVisible" id="notification-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 p-4">
    <div 
      id="notification-modal-content" 
      :class="['relative w-full m-4 md:max-w-lg transform rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl transition-all duration-150', isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100']"
    >
      <!-- Modal Header -->
      <div id="notification-modal-header" class="flex items-start justify-between p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl">
        <div class="flex items-center gap-3">
          <div :class="['flex h-10 w-10 items-center justify-center rounded-full', iconConfig.color]">
            <span v-if="type !== 'loading'" class="material-symbols-outlined text-2xl">{{ iconConfig.icon }}</span>
            <div v-else class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              {{ title }}
            </h3>
          </div>
        </div>
        <button @click="hide" type="button" class="absolute top-3 right-3 text-slate-400 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
          <span class="material-symbols-outlined">close</span>
          <span class="sr-only">Close modal</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-4 md:p-6">
        <div v-if="showWarningsList" id="notification-modal-warnings-list" class="space-y-3">
          <div v-for="(warning, index) in warnings" :key="index" class="flex items-start gap-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
            <div>
              <p class="font-semibold text-slate-800 dark:text-slate-200">{{ warning.message }}</p>
              <a v-if="warning.call_to_action_link" :href="warning.call_to_action_link" class="text-sm font-medium text-primary hover:underline">Review Now</a>
            </div>
          </div>
        </div>
        <p v-else class="text-sm font-normal text-slate-600 dark:text-slate-300" v-html="message"></p>
      </div>

      <!-- Modal Footer -->
      <div id="notification-modal-footer" class="flex items-center justify-end space-x-3 p-4 md:p-6 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
        <template v-if="type === 'confirm' || type === 'loading'">
          <button 
            @click="handleCancel" 
            :disabled="type === 'loading'"
            class="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {{ cancelText }}
          </button>
          <button 
            @click="handleConfirm" 
            :disabled="type === 'loading'"
            class="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
          >
            <div v-if="type === 'loading'" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            {{ type === 'loading' ? 'Processing...' : confirmText }}
          </button>
        </template>
        <button 
          v-else 
          @click="hide" 
          class="px-6 py-2 text-sm font-bold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

const isVisible = ref(false);
const isAnimating = ref(false);
const type = ref('info');
const title = ref('');
const message = ref('');
const confirmText = ref('Confirm');
const cancelText = ref('Cancel');
const onConfirm = ref(null);
const onCancel = ref(null);
const warnings = ref([]);
const showWarningsList = ref(false);

const iconMap = {
  success: { icon: 'check_circle', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  error: { icon: 'error', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  warning: { icon: 'warning', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
  info: { icon: 'info', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  confirm: { icon: 'help', color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  loading: { icon: '', color: '' }
};

const iconConfig = computed(() => iconMap[type.value] || iconMap.info);

const show = (options) => {
  type.value = options.type || 'info';
  title.value = options.title || '';
  message.value = options.message || '';
  confirmText.value = options.confirmText || 'Confirm';
  cancelText.value = options.cancelText || 'Cancel';
  onConfirm.value = options.onConfirm || null;
  onCancel.value = options.onCancel || null;
  warnings.value = options.warnings || [];
  showWarningsList.value = !!(options.warnings && options.warnings.length > 0);
  
  isVisible.value = true;
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 10);
};

const hide = () => {
  isAnimating.value = true;
  setTimeout(() => {
    isVisible.value = false;
    isAnimating.value = false;
  }, 150);
};

const handleConfirm = () => {
  if (typeof onConfirm.value === 'function') {
    onConfirm.value();
  }
};

const handleCancel = () => {
  if (typeof onCancel.value === 'function') {
    onCancel.value();
  }
  hide();
};

const showCashFlowWarnings = async () => {
  show({ type: 'loading', title: 'Cash Flow Warnings', message: 'Fetching warnings...' });
  try {
    const data = await window.App.api.fetchCashFlowWarnings();
    if (data && data.length > 0) {
      show({
        type: 'warning',
        title: 'Cash Flow Warnings',
        warnings: data
      });
    } else {
      show({
        type: 'info',
        title: 'Cash Flow Status',
        message: 'No cash flow warnings at the moment.'
      });
    }
  } catch (error) {
    show({ type: 'error', title: 'Error', message: 'Could not fetch cash flow warnings.' });
  }
};

// Expose methods globally for compatibility
onMounted(() => {
  window.App = window.App || {};
  window.App.notificationModal = {
    show,
    hide,
    update: (options) => show(options),
    success: (title, message) => show({ type: 'success', title, message }),
    error: (title, message) => show({ type: 'error', title, message }),
    warning: (title, message) => show({ type: 'warning', title, message }),
    info: (title, message) => show({ type: 'info', title, message }),
    confirm: (options) => show({ type: 'confirm', ...options }),
    loading: (title, message) => show({ type: 'loading', title, message }),
    showCashFlowWarnings
  };
});
</script>
