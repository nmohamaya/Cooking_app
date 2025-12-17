/**
 * Test script for shopping list functionality (Issue #15)
 * 
 * This script tests the ingredient parsing and aggregation logic.
 * Run with: node test-shopping-list.js
 */

// Helper functions (copied from App.js)
const normalizeUnit = (unit) => {
  if (!unit) return '';
  const lower = unit.toLowerCase();
  const unitMap = {
    'cups': 'cup', 'tablespoons': 'tablespoon', 'tbsp': 'tablespoon',
    'teaspoons': 'teaspoon', 'tsp': 'teaspoon',
    'ounces': 'ounce', 'oz': 'ounce',
    'pounds': 'pound', 'lbs': 'pound', 'lb': 'pound',
    'grams': 'gram', 'g': 'gram',
    'kilograms': 'kilogram', 'kg': 'kilogram',
    'milliliters': 'milliliter', 'ml': 'milliliter',
    'liters': 'liter', 'l': 'liter',
    'cloves': 'clove', 'pieces': 'piece', 'slices': 'slice'
  };
  return unitMap[lower] || lower;
};

const parseIngredient = (ingredientLine) => {
  const line = ingredientLine.trim();
  if (!line) return null;

  const units = ['cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp', 
                 'ounce', 'ounces', 'oz', 'pound', 'pounds', 'lb', 'lbs', 'gram', 'grams', 'g', 
                 'kilogram', 'kilograms', 'kg', 'milliliter', 'milliliters', 'ml', 'liter', 'liters', 'l',
                 'clove', 'cloves', 'piece', 'pieces', 'slice', 'slices', 'pinch', 'dash',
                 'large', 'medium', 'small'];
  
  const numberPattern = /^(\d+)?\s*(\d+\/\d+)?\s+(.+)$/;
  const match = line.match(numberPattern);
  
  if (match) {
    const [, whole, fraction, remainder] = match;
    let quantity = 0;
    
    if (whole) quantity += parseFloat(whole);
    if (fraction) {
      const [num, den] = fraction.split('/').map(Number);
      if (num && den) quantity += num / den;
    }
    
    if (!whole && !fraction) quantity = 1;
    
    const remainderParts = remainder.trim().split(/\s+/);
    const firstWord = remainderParts[0];
    const isUnit = firstWord && units.some(u => u.toLowerCase() === firstWord.toLowerCase());
    
    if (isUnit) {
      const unit = normalizeUnit(firstWord);
      const ingredient = remainderParts.slice(1).join(' ');
      return {
        ingredient: ingredient || firstWord,
        quantity: quantity,
        unit: unit,
      };
    } else {
      return {
        ingredient: remainder.trim(),
        quantity: quantity,
        unit: '',
      };
    }
  }
  
  return {
    ingredient: line,
    quantity: 1,
    unit: '',
  };
};

// Aggregation function (simulates adding to shopping list)
const aggregateIngredients = (ingredientLines) => {
  const shoppingList = [];
  
  ingredientLines.forEach(line => {
    const parsed = parseIngredient(line);
    if (!parsed) return;

    const existingIndex = shoppingList.findIndex(item => 
      item.ingredient.toLowerCase() === parsed.ingredient.toLowerCase() &&
      item.unit.toLowerCase() === parsed.unit.toLowerCase()
    );

    if (existingIndex >= 0) {
      shoppingList[existingIndex].quantity += parsed.quantity;
    } else {
      shoppingList.push({
        ingredient: parsed.ingredient,
        quantity: parsed.quantity,
        unit: parsed.unit,
      });
    }
  });

  return shoppingList;
};

// Test cases
console.log('🧪 Testing Shopping List Functionality\n');

// Test 1: Ingredient Parsing
console.log('Test 1: Ingredient Parsing');
const parseTests = [
  { input: '2 cups flour', expected: { ingredient: 'flour', quantity: 2, unit: 'cup' } },
  { input: '1/2 cup sugar', expected: { ingredient: 'sugar', quantity: 0.5, unit: 'cup' } },
  { input: '3 tablespoons butter', expected: { ingredient: 'butter', quantity: 3, unit: 'tablespoon' } },
  { input: '1 1/2 tsp vanilla', expected: { ingredient: 'vanilla', quantity: 1.5, unit: 'teaspoon' } },
  { input: '4 cloves garlic, minced', expected: { ingredient: 'garlic, minced', quantity: 4, unit: 'clove' } },
  { input: 'Salt to taste', expected: { ingredient: 'Salt to taste', quantity: 1, unit: '' } },
  { input: '2 large eggs', expected: { ingredient: 'eggs', quantity: 2, unit: 'large' } },
  { input: '1 lb ground beef', expected: { ingredient: 'ground beef', quantity: 1, unit: 'pound' } },
];

let passedParsing = 0;
parseTests.forEach(test => {
  const result = parseIngredient(test.input);
  const passed = 
    result.ingredient === test.expected.ingredient &&
    Math.abs(result.quantity - test.expected.quantity) < 0.01 &&
    result.unit === test.expected.unit;
  
  console.log(`  ${passed ? '✅' : '❌'} "${test.input}"`);
  console.log(`     → ${result.quantity} ${result.unit} ${result.ingredient}`);
  console.log(`     Expected: ${test.expected.quantity} ${test.expected.unit} ${test.expected.ingredient}`);
  if (passed) passedParsing++;
});
console.log(`  Passed: ${passedParsing}/${parseTests.length}\n`);

// Test 2: Ingredient Aggregation
console.log('Test 2: Ingredient Aggregation');
const aggregationTests = [
  {
    name: 'Combine same ingredient with same unit',
    ingredients: ['2 cups flour', '1 cup flour'],
    expected: [{ ingredient: 'flour', quantity: 3, unit: 'cup' }]
  },
  {
    name: 'Keep different ingredients separate',
    ingredients: ['2 cups flour', '1 cup sugar'],
    expected: [
      { ingredient: 'flour', quantity: 2, unit: 'cup' },
      { ingredient: 'sugar', quantity: 1, unit: 'cup' }
    ]
  },
  {
    name: 'Combine fractions',
    ingredients: ['1/2 cup butter', '1/4 cup butter'],
    expected: [{ ingredient: 'butter', quantity: 0.75, unit: 'cup' }]
  },
  {
    name: 'Handle mixed measurements',
    ingredients: ['2 tablespoons oil', '1 tablespoon oil', '1 tsp salt'],
    expected: [
      { ingredient: 'oil', quantity: 3, unit: 'tablespoon' },
      { ingredient: 'salt', quantity: 1, unit: 'teaspoon' }
    ]
  },
];

let passedAggregation = 0;
aggregationTests.forEach(test => {
  const result = aggregateIngredients(test.ingredients);
  const passed = result.length === test.expected.length &&
    test.expected.every((exp, i) => {
      const res = result.find(r => r.ingredient === exp.ingredient && r.unit === exp.unit);
      return res && Math.abs(res.quantity - exp.quantity) < 0.01;
    });
  
  console.log(`  ${passed ? '✅' : '❌'} ${test.name}`);
  console.log(`     Input: ${test.ingredients.join(', ')}`);
  console.log(`     Result: ${result.map(r => `${r.quantity} ${r.unit} ${r.ingredient}`).join(', ')}`);
  if (passed) passedAggregation++;
});
console.log(`  Passed: ${passedAggregation}/${aggregationTests.length}\n`);

// Test 3: Multiple Recipes Aggregation
console.log('Test 3: Multiple Recipes Aggregation');
const recipe1 = ['2 cups flour', '1 cup sugar', '2 eggs'];
const recipe2 = ['1 cup flour', '1/2 cup sugar', '3 eggs'];
const combined = aggregateIngredients([...recipe1, ...recipe2]);

console.log('  Recipe 1:', recipe1.join(', '));
console.log('  Recipe 2:', recipe2.join(', '));
console.log('  Combined Shopping List:');
combined.forEach(item => {
  console.log(`     - ${item.quantity} ${item.unit} ${item.ingredient}`);
});

const expectedCombined = {
  flour: 3,
  sugar: 1.5,
  eggs: 5
};

const passedCombined = 
  Math.abs(combined.find(i => i.ingredient === 'flour')?.quantity - expectedCombined.flour) < 0.01 &&
  Math.abs(combined.find(i => i.ingredient === 'sugar')?.quantity - expectedCombined.sugar) < 0.01 &&
  Math.abs(combined.find(i => i.ingredient === 'eggs')?.quantity - expectedCombined.eggs) < 0.01;

console.log(`  ${passedCombined ? '✅' : '❌'} Aggregation correct\n`);

// Test 4: Edge Cases
console.log('Test 4: Edge Cases');
const edgeCases = [
  { input: '', shouldBeNull: true, desc: 'empty string' },
  { input: '   ', shouldBeNull: true, desc: 'whitespace only' },
  { input: 'Pinch of salt', expected: { ingredient: 'Pinch of salt', quantity: 1, unit: '' }, desc: 'pinch without number' },
  { input: '0 cups nothing', expected: { ingredient: 'nothing', quantity: 0, unit: 'cup' }, desc: 'zero quantity' },
];

let passedEdge = 0;
edgeCases.forEach(test => {
  const result = parseIngredient(test.input);
  const passed = test.shouldBeNull ? result === null : 
    (result.ingredient === test.expected.ingredient &&
     Math.abs(result.quantity - test.expected.quantity) < 0.01 &&
     result.unit === test.expected.unit);
  
  console.log(`  ${passed ? '✅' : '❌'} ${test.desc}: "${test.input}"`);
  if (passed) passedEdge++;
});
console.log(`  Passed: ${passedEdge}/${edgeCases.length}\n`);

// Summary
const totalTests = parseTests.length + aggregationTests.length + edgeCases.length + 1;
const totalPassed = passedParsing + passedAggregation + passedEdge + (passedCombined ? 1 : 0);

console.log('═══════════════════════════════════════');
console.log(`Total: ${totalPassed}/${totalTests} tests passed`);
console.log(`Success Rate: ${Math.round(totalPassed/totalTests * 100)}%`);
console.log('═══════════════════════════════════════');

if (totalPassed === totalTests) {
  console.log('\n🎉 All tests passed! Shopping list functionality is working correctly.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
  process.exit(1);
}
