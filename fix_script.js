const fs = require('fs');
const file = 'frontend/tests/services/installmentProcessor.spec.js';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Update line 56
content = content.replace(
  "      expect(result[0].installments).toHaveLength(2); // IDs 1 and 4",
  "      expect(result[0].installments).toHaveLength(2); // Should have IDs 1 and 4"
);

// Fix 2: Update block at line 112
const toReplace = `      expect(laptopPlan.planName).toBe('Laptop');
      expect(laptopPlan.totalAmount).toBe(200);
      expect(laptopPlan.amountPaid).toBe(100);
      expect(laptopPlan.progress).toBe(50);
      expect(laptopPlan.installmentCount).toBe(2);
      expect(laptopPlan.categoryId).toBe(20);
      expect(laptopPlan.itemId).toBe(10);`;

const replacement = `      expect(laptopPlan).toMatchObject({
        planName: 'Laptop',
        totalAmount: 200,
        amountPaid: 100,
        progress: 50,
        installmentCount: 2,
        categoryId: 20,
        itemId: 10
      });`;

content = content.replace(toReplace, replacement);

fs.writeFileSync(file, content);
console.log("File updated");
