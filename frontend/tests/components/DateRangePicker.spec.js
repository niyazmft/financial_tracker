import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import DateRangePicker from '@/components/Shared/DateRangePicker.vue';
import PrimeVue from 'primevue/config';
import * as utils from '@/services/utils';

describe('DateRangePicker.vue', () => {
    const mountComponent = (props = {}) => {
        return mount(DateRangePicker, {
            global: {
                plugins: [PrimeVue],
                stubs: {
                    Popover: {
                        name: 'Popover',
                        template: '<div v-show="visible" class="p-popover"><slot /></div>',
                        data() { return { visible: false } },
                        methods: {
                            toggle() { this.visible = !this.visible },
                            hide() { this.visible = false }
                        }
                    },
                    DatePicker: {
                        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', new Date($event.target.value))" />',
                        props: ['modelValue']
                    }
                }
            },
            props
        });
    };

    it('renders the trigger button with default label', () => {
        const wrapper = mountComponent();
        expect(wrapper.find('button').text()).toContain('Select Date Range');
    });

    it('emits formatted Date strings when manual input is used', async () => {
        const wrapper = mountComponent();
        await wrapper.find('button').trigger('click');
        
        const inputs = wrapper.findAll('input');
        await inputs[0].setValue('2026-01-01');
        await inputs[1].setValue('2026-01-31');
        
        const applyBtn = wrapper.findAll('button').filter(b => b.text() === 'Apply')[0];
        await applyBtn.trigger('click');
        
        const emitted = wrapper.emitted('update:range');
        expect(emitted).toBeTruthy();
        const { start, end } = emitted[0][0];

        // Component now ensures Date objects are emitted
        expect(start).toBeInstanceOf(Date);
        expect(end).toBeInstanceOf(Date);

        // The real utility should be able to format these without throwing
        expect(() => utils.formatDateForInput(start)).not.toThrow();
        expect(() => utils.formatDateForInput(end)).not.toThrow();
        
        // Verify formatted values match our inputs
        expect(utils.formatDateForInput(start)).toBe('2026-01-01');
        expect(utils.formatDateForInput(end)).toBe('2026-01-31');
    });

    it('emits valid Date objects for all presets that can be formatted by utils', async () => {
        const wrapper = mountComponent();
        const presetLabels = ['Last 30 Days', 'Last 90 Days', 'This Month', 'Last Month', 'This Year'];

        for (const label of presetLabels) {
            await wrapper.find('button').trigger('click');
            const presetBtn = wrapper.findAll('button').filter(b => b.text() === label)[0];
            await presetBtn.trigger('click');

            const applyBtn = wrapper.findAll('button').filter(b => b.text() === 'Apply')[0];
            await applyBtn.trigger('click');

            const emitted = wrapper.emitted('update:range');
            const { start, end } = emitted[emitted.length - 1][0];

            // This is the critical check: Can the utility process the emitted object?
            // If the bug reported (n.toISOString is not a function) is present, this will fail.
            expect(typeof start.toISOString).toBe('function');
            expect(() => utils.formatDateForInput(start)).not.toThrow();
            expect(utils.formatDateForInput(start)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
    });
});
