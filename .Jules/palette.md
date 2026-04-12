
## 2026-04-11 - Adding aria-labels to PrimeVue Button components
**Learning:** Found multiple instances where the `<Button>` component was used with just an `icon` attribute (e.g. `icon="pi pi-trash"`) with no child text. This pattern requires adding an `aria-label` attribute directly to the `<Button>` for accessibility purposes so screen readers can describe the button's action.
**Action:** Always search for `<Button icon="...` without a `label` or inner text and ensure they have a corresponding `aria-label` attribute.
## 2026-04-12 - Added aria-labels to icon-only buttons\n**Learning:** Icon-only buttons using PrimeVue's <Button> component with only an 'icon' property lack inherent screen-reader accessibility.\n**Action:** Ensure all such buttons are explicitly provided with a descriptive 'aria-label' attribute to improve accessibility and maintain compliance.
