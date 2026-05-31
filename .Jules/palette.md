
## 2026-04-11 - Adding aria-labels to PrimeVue Button components

**Learning:** Found multiple instances where the `<Button>` component was used with just an `icon` attribute (e.g. `icon="pi pi-trash"`) with no child text. This pattern requires adding an `aria-label` attribute directly to the `<Button>` for accessibility purposes so screen readers can describe the button's action.
**Action:** Always search for `<Button icon="...` without a `label` or inner text and ensure they have a corresponding `aria-label` attribute.

## 2026-04-11 - Dynamic ARIA labels in lists

**Learning:** When adding `aria-label` attributes to elements rendered within a `v-for` loop (like edit/delete buttons for a list of items), using static labels (e.g. "Edit budget") causes screen readers to read the same vague label repeatedly. Providing dynamic context (e.g. `'Edit ' + getCategoryName(budget.categories_id) + ' budget'`) is crucial for making the action descriptive and uniquely identifiable.
**Action:** Always use dynamic bindings (`:aria-label`) for interactive elements inside lists to include item-specific context.
