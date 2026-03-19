import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import SpendingAnalysisView from '@/views/SpendingAnalysisView.vue';
import PrimeVue from 'primevue/config';
import { useApi } from '@/services/apiInstance';
import { useAuthStore } from '@/stores/auth';

// Mock PrimeVue components
const stubs = {
    Card: { template: '<div><slot name="title" /><slot name="subtitle" /><slot name="content" /></div>' },
    Button: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
    DataTable: { template: '<table><slot /></table>' },
    Column: { template: '<td><slot /></td>' },
    ProgressBar: { template: '<div><slot /></div>' },
    Tag: { template: '<span><slot /></span>' },
    ProgressSpinner: { template: '<div></div>' },
    AppChart: { template: '<div>Chart</div>' },
    DateRangePicker: {
        name: 'DateRangePicker',
        template: '<div @click="$emit(\'update:range\', { start: \'2023-01-01\', end: \'2023-01-31\' })">Picker</div>',
        props: ['startDate', 'endDate']
    }
};

vi.mock('@/services/apiInstance', () => ({
    useApi: vi.fn()
}));

vi.mock('@/stores/auth', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('vue-router', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn()
    }))
}));

describe('SpendingAnalysisView.vue', () => {
    let mockApi;
    let authStore;

    beforeEach(() => {
        setActivePinia(createPinia());

        mockApi = {
            fetchCategorySpendingData: vi.fn().mockResolvedValue({
                statistics: { totalSpending: 1000 },
                categoryData: []
            }),
            fetchMonthlySpendingDataWithRange: vi.fn().mockResolvedValue({
                statistics: { totalSpending: 5000, yoyChange: 10 }
            })
        };
        useApi.mockReturnValue(mockApi);

        authStore = {
            user: { name: 'Test User' },
            getToken: vi.fn().mockResolvedValue('token')
        };
        useAuthStore.mockReturnValue(authStore);

        vi.clearAllMocks();
    });

    it('refreshes data when DateRangePicker emits string dates', async () => {
        const wrapper = mount(SpendingAnalysisView, {
            global: {
                plugins: [PrimeVue],
                stubs
            }
        });

        // Trigger date range update with strings
        const picker = wrapper.findComponent({ name: 'DateRangePicker' });
        await picker.vm.$emit('update:range', { start: '2023-10-01', end: '2023-10-31' });

        // If it doesn't crash, it should call fetchCategorySpendingData
        expect(mockApi.fetchCategorySpendingData).toHaveBeenCalledWith('2023-10-01', '2023-10-31');
    });

    it('refreshes data when DateRangePicker emits Date objects', async () => {
        const wrapper = mount(SpendingAnalysisView, {
            global: {
                plugins: [PrimeVue],
                stubs
            }
        });

        const startDate = new Date(2023, 9, 1);
        const endDate = new Date(2023, 9, 31);

        const picker = wrapper.findComponent({ name: 'DateRangePicker' });
        await picker.vm.$emit('update:range', { start: startDate, end: endDate });

        // Should be formatted as YYYY-MM-DD
        expect(mockApi.fetchCategorySpendingData).toHaveBeenCalledWith('2023-10-01', '2023-10-31');
    });
});
