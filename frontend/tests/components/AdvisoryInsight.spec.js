import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdvisoryInsight from '@/components/Dashboard/AdvisoryInsight.vue';
import PrimeVue from 'primevue/config';

// Mock the apiInstance composable
const fetchAdvisory = vi.fn();
vi.mock('@/services/apiInstance', () => ({
    useApi: () => ({ fetchAdvisory })
}));

vi.mock('primevue/message', () => ({
    default: { template: '<div class="p-message"><slot /></div>' }
}));
vi.mock('primevue/card', () => ({
    default: { template: '<div class="p-card"><slot name="header" /><slot name="content" /></div>' }
}));

const mountOptions = {
    global: {
        plugins: [PrimeVue]
    }
};

describe('AdvisoryInsight.vue', () => {
    beforeEach(() => {
        fetchAdvisory.mockReset();
    });

    it('renders a teaching message when there is no transaction history', async () => {
        fetchAdvisory.mockResolvedValue({
            success: true,
            advisoryStatement: 'Your financial outlook for the next 30 days looks healthy.',
            dataFreshness: { latestRecordDate: null, staleDays: null, isStale: false }
        });

        const wrapper = mount(AdvisoryInsight, mountOptions);
        await flushPromises();

        expect(wrapper.text()).toContain('Welcome! Your money story starts with your data.');
        expect(wrapper.text()).toContain('Transactions');
    });

    it('renders the advisory statement when data exists', async () => {
        fetchAdvisory.mockResolvedValue({
            success: true,
            advisoryStatement: 'Your balance is projected to dip to 500. Your trajectory remains within normal range.',
            dataFreshness: { latestRecordDate: '2026-09-09', staleDays: 0, isStale: false }
        });

        const wrapper = mount(AdvisoryInsight, mountOptions);
        await flushPromises();

        expect(wrapper.text()).toContain('Money at a glance');
        expect(wrapper.text()).toContain('Your balance is projected to dip to 500');
    });

    it('shows a stale-data warning when the latest transaction is old', async () => {
        fetchAdvisory.mockResolvedValue({
            success: true,
            advisoryStatement: 'Some statement.',
            dataFreshness: { latestRecordDate: '2026-08-01', staleDays: 39, isStale: true }
        });

        const wrapper = mount(AdvisoryInsight, mountOptions);
        await flushPromises();

        expect(wrapper.text()).toMatch(/is 39 days old/i);
        expect(wrapper.text()).toContain('Money at a glance');
    });

    it('keeps the surface quiet when the advisory fetch fails', async () => {
        fetchAdvisory.mockRejectedValue(new Error('network'));

        const wrapper = mount(AdvisoryInsight, mountOptions);
        await flushPromises();

        expect(wrapper.text()).not.toContain('Money at a glance');
        expect(wrapper.text()).not.toContain('Welcome!');
    });
});
