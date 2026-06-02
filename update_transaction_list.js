const fs = require('fs');

const path = 'frontend/src/components/Transactions/TransactionList.vue';
let content = fs.readFileSync(path, 'utf8');

const target = `<input
          :value="filters.global.value"
          placeholder="Search..."
          class="w-full pl-10 pr-4 py-2 bg-input-bg border border-border-input rounded-lg text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          @input="$emit('update:filters', { ...filters, global: { ...filters.global, value: $event.target.value } })"
        >`;

const replacement = `<input
          :value="filters.global.value"
          placeholder="Search..."
          aria-label="Search transactions"
          class="w-full pl-10 pr-4 py-2 bg-input-bg border border-border-input rounded-lg text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          @input="$emit('update:filters', { ...filters, global: { ...filters.global, value: $event.target.value } })"
        >`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log("Successfully updated TransactionList.vue");
} else {
    console.log("Could not find the target string in TransactionList.vue");
}
