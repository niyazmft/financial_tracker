## 2024-06-25 - Form Labels
**Learning:** Some PrimeVue components (`InputText`, `InputNumber`, `CategoryPicker`) used throughout the app lack proper `id` attributes that correlate to `<label for="...">` elements. This breaks standard form accessibility, making it harder for screen readers to announce fields and for users to click labels to focus inputs.
**Action:** When working on Vue templates with forms, always verify that every `<label>` has a `for` attribute that points to the unique `id` of its corresponding input element.
