import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import DateRangePicker from '@/components/Shared/DateRangePicker.vue';
import PrimeVue from 'primevue/config';

// Mock PrimeVue components if necessary, but mount usually handles them if registered
// We will register PrimeVue global plugin

describe('DateRangePicker.vue', () => {
    const mountComponent = (props = {}) => {
        return mount(DateRangePicker, {
            global: {
                plugins: [PrimeVue],
                stubs: {
                    // Stub complex PrimeVue components to focus on logic
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
                        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
                        props: ['modelValue']
                    }
                }
            },
            props
        });
    };

    it('renders the trigger button with default label', () => {
        const wrapper = mountComponent();
        const button = wrapper.find('button');
        expect(button.exists()).toBe(true);
        expect(button.text()).toContain('Select Date Range');
    });

    it('opens the popover when button is clicked', async () => {
        const wrapper = mountComponent();
        const button = wrapper.find('button');
        
        await button.trigger('click');
        
        const popover = wrapper.findComponent({ name: 'Popover' });
        expect(popover.vm.visible).toBe(true);
    });

    it('emits update:range event with selected dates when Apply is clicked', async () => {
        const wrapper = mountComponent();
        
        // Open picker
        await wrapper.find('button').trigger('click');
        
        // Set dates (using our stubbed input)
        const inputs = wrapper.findAll('input');
        await inputs[0].setValue('2026-01-01'); // Start
        await inputs[1].setValue('2026-01-31'); // End
        
        // Click Apply (assuming it's the second button in the popover, or find by text)
        const applyBtn = wrapper.findAll('button').filter(b => b.text() === 'Apply')[0];
        expect(applyBtn.exists()).toBe(true);
        await applyBtn.trigger('click');
        
        // Check emitted event
        const emitted = wrapper.emitted('update:range');
        expect(emitted).toBeTruthy();
        expect(emitted[0][0]).toEqual({
            start: '2026-01-01',
            end: '2026-01-31'
        });
    });
});
