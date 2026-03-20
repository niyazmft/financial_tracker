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
        template: '<div @click="$emit(\'update:range\', { start: new Date(), end: new Date() })">Picker</div>',
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

    it('refreshes data when DateRangePicker emits Date objects', async () => {
        const wrapper = mount(SpendingAnalysisView, {
            global: {
                plugins: [PrimeVue],
                stubs
            }
        });

        // Use UTC to avoid timezone fragility
        const startDate = new Date(Date.UTC(2023, 9, 1)); // Oct 1, 2023
        const endDate = new Date(Date.UTC(2023, 9, 31)); // Oct 31, 2023

        const picker = wrapper.findComponent({ name: 'DateRangePicker' });
        await picker.vm.$emit('update:range', { start: startDate, end: endDate });

        // Should be formatted as YYYY-MM-DD
        expect(mockApi.fetchCategorySpendingData).toHaveBeenCalledWith('2023-10-01', '2023-10-31');
    });

    it('correctly handles the initial data load on mount', async () => {
        mount(SpendingAnalysisView, {
            global: {
                plugins: [PrimeVue],
                stubs
            }
        });

        // fetchData is called in onMounted
        expect(mockApi.fetchCategorySpendingData).toHaveBeenCalled();
        expect(mockApi.fetchMonthlySpendingDataWithRange).toHaveBeenCalled();
    });
});
