💡 What:
- Wrapped the interactive User Avatar in `Navigation.vue` inside a native `<button>` element with `aria-label`, `aria-haspopup`, and focus styles.
- Added an `aria-label` attribute to the mobile search input in `TransactionList.vue`.

🎯 Why:
- The user profile avatar acted as a dropdown menu trigger but couldn't be navigated to via keyboard (no tab-focus) and had no semantic meaning for screen readers.
- The mobile search input had a placeholder but lacked an `aria-label`, making it harder for screen readers to identify its purpose.

📸 Before/After:
- Navigation: Avatar now has proper `focus-visible:ring-2` styling when tabbed to via keyboard.
- Transactions: Mobile search input now has `aria-label="Search transactions"`.

♿ Accessibility:
- Restored native keyboard support (tabbing and Enter/Space activation) for the user profile menu.
- Provided clear context to screen readers for both the navigation menu trigger and the search input.
