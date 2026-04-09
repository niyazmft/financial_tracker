const fs = require('fs');

const path = 'backend/tests/dateUtils.test.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`        it('should return "Invalid Date" for null and undefined', () => {
            // Note: new Date(null) is equivalent to new Date(0) which is valid
            // But if we want to check that, new Date(null) yields 1970-01-01.
            // Let's test with undefined
            const result = formatDateForDisplay(undefined);
            assert.strictEqual(result, 'Invalid Date');
        });`,
`        it('should handle null and undefined', () => {
            const resultUndefined = formatDateForDisplay(undefined);
            assert.strictEqual(resultUndefined, 'Invalid Date');

            const resultNull = formatDateForDisplay(null);
            assert.strictEqual(resultNull, 'Jan 1, 1970'); // new Date(null) is 1970-01-01
        });`
);

fs.writeFileSync(path, content, 'utf8');
