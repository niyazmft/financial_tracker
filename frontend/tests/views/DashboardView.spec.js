import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import DashboardView from '@/views/DashboardView.vue';
import PrimeVue from 'primevue/config';

describe('DashboardView.vue', () => {
    const mountOptions = {
        global: {
            plugins: [PrimeVue],
            stubs: {
                AnomalyAlerts: { template: '<div class="stub-anomaly"></div>' },
                ForecastPanel: { template: '<div class="stub-forecast"></div>' },
                HistoryPanel: { template: '<div class="stub-history"></div>' },
                SavingsGoalsPanel: { template: '<div class="stub-savings"></div>' },
                // Use actual slot rendering for Tabs components
                Tabs: { template: '<div><slot /></div>' },
                TabList: { template: '<div><slot /></div>' },
                Tab: { template: '<div><slot /></div>' },
                TabPanels: { template: '<div><slot /></div>' },
                TabPanel: { template: '<div><slot /></div>' }
            }
        }
    };

    it('renders dashboard title and sub-components', () => {
        const wrapper = mount(DashboardView, mountOptions);
        
        expect(wrapper.find('h1').text()).toBe('Dashboard');
        expect(wrapper.find('.stub-anomaly').exists()).toBe(true);
        // By default activeTab is 'forecast', so ForecastPanel should be there
        expect(wrapper.find('.stub-forecast').exists()).toBe(true);
    });

    it('contains navigation tabs', () => {
        const wrapper = mount(DashboardView, mountOptions);
        const text = wrapper.text();
        expect(text).toContain('Cash Flow Forecast');
        expect(text).toContain('Cash Flow History');
        expect(text).toContain('Savings Goals');
    });
});
