
## 2026-04-11 - Adding aria-labels to PrimeVue Button components

**Learning:** Found multiple instances where the `<Button>` component was used with just an `icon` attribute (e.g. `icon="pi pi-trash"`) with no child text. This pattern requires adding an `aria-label` attribute directly to the `<Button>` for accessibility purposes so screen readers can describe the button's action.
**Action:** Always search for `<Button icon="...` without a `label` or inner text and ensure they have a corresponding `aria-label` attribute.

## 2026-04-11 - Dynamic ARIA labels in lists

**Learning:** When adding `aria-label` attributes to elements rendered within a `v-for` loop (like edit/delete buttons for a list of items), using static labels (e.g. "Edit budget") causes screen readers to read the same vague label repeatedly. Providing dynamic context (e.g. `'Edit ' + getCategoryName(budget.categories_id) + ' budget'`) is crucial for making the action descriptive and uniquely identifiable.
**Action:** Always use dynamic bindings (`:aria-label`) for interactive elements inside lists to include item-specific context.

## 2024-05-24 - Wrapping interactive Avatars in native buttons

**Learning:** When using components like PrimeVue's `<Avatar>` as clickable triggers for menus, simply adding a `@click` handler and a `cursor-pointer` class leaves the element inaccessible to keyboard users (no tab-focus) and screen readers (no semantic meaning or role). The avatar lacks native button properties like `focus-visible`, `aria-label`, and `aria-haspopup`.
**Action:** Always wrap interactive Avatars in a native `<button>` element with appropriate `aria-label`, `aria-haspopup`, and focus styles (`focus:outline-none focus-visible:ring-2`) to ensure full accessibility for screen readers and keyboard navigation.
