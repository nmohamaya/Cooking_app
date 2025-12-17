/**
 * Test script for search and filter functionality (Issue #16)
 * 
 * This script tests the core logic functions without running the full app.
 * Run with: node test-search-filter.js
 */

// Helper function to parse time strings (copied from App.js)
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const lower = timeStr.toLowerCase();
  let minutes = 0;
  
  const hourMatch = lower.match(/(\d+)\s*(hour|hr)/);
  const minMatch = lower.match(/(\d+)\s*(minute|min)/);
  
  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) minutes += parseInt(minMatch[1]);
  
  if (minutes === 0) {
    const numMatch = timeStr.match(/(\d+)/);
    if (numMatch) minutes = parseInt(numMatch[1]);
  }
  
  return minutes;
};

// Test data
const testRecipes = [
  {
    id: '1',
    title: 'Pasta Carbonara',
    category: 'Italian',
    ingredients: 'pasta, eggs, cheese, bacon',
    prepTime: '10 minutes',
    cookTime: '15 minutes'
  },
  {
    id: '2',
    title: 'Chicken Stir Fry',
    category: 'Asian',
    ingredients: 'chicken, vegetables, soy sauce',
    prepTime: '15 min',
    cookTime: '20 min'
  },
  {
    id: '3',
    title: 'Beef Tacos',
    category: 'Mexican',
    ingredients: 'beef, tortillas, cheese, salsa',
    prepTime: '5 minutes',
    cookTime: '10 minutes'
  },
  {
    id: '4',
    title: 'Slow Cooked Roast',
    category: 'American',
    ingredients: 'beef, potatoes, carrots',
    prepTime: '20 minutes',
    cookTime: '2 hours'
  },
  {
    id: '5',
    title: 'Quick Salad',
    category: 'Healthy',
    ingredients: 'lettuce, tomatoes, cucumber, dressing',
    prepTime: '5 min',
    cookTime: '0 min'
  }
];

// Search and filter function (simplified from App.js)
const getFilteredRecipes = (recipes, searchQuery, filters, sortBy) => {
  let filtered = [...recipes];

  // Apply search
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(recipe =>
      recipe.title.toLowerCase().includes(query) ||
      recipe.ingredients.toLowerCase().includes(query) ||
      recipe.category.toLowerCase().includes(query)
    );
  }

  // Apply time filters
  if (filters.prepTimeMax !== null) {
    filtered = filtered.filter(recipe => {
      const prepMinutes = parseTimeToMinutes(recipe.prepTime);
      // Include recipes with no prep time (0) or prep time within limit
      return prepMinutes <= filters.prepTimeMax;
    });
  }

  if (filters.cookTimeMax !== null) {
    filtered = filtered.filter(recipe => {
      const cookMinutes = parseTimeToMinutes(recipe.cookTime);
      // Include recipes with no cook time (0) or cook time within limit
      return cookMinutes <= filters.cookTimeMax;
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'date-new':
        return parseInt(b.id) - parseInt(a.id);
      case 'date-old':
        return parseInt(a.id) - parseInt(b.id);
      default:
        return 0;
    }
  });

  return filtered;
};

// Test cases
console.log('🧪 Testing Search and Filter Functionality\n');

// Test 1: Time parsing
console.log('Test 1: Time Parsing');
const timeTests = [
  { input: '10 minutes', expected: 10 },
  { input: '1 hour', expected: 60 },
  { input: '15 min', expected: 15 },
  { input: '2 hr', expected: 120 },
  { input: '30', expected: 30 },
  { input: '', expected: 0 },
];

let passedParsing = 0;
timeTests.forEach(test => {
  const result = parseTimeToMinutes(test.input);
  const passed = result === test.expected;
  console.log(`  ${passed ? '✅' : '❌'} "${test.input}" → ${result} (expected ${test.expected})`);
  if (passed) passedParsing++;
});
console.log(`  Passed: ${passedParsing}/${timeTests.length}\n`);

// Test 2: Search functionality
console.log('Test 2: Search Functionality');
const searchTests = [
  { query: 'pasta', expected: 1, desc: 'title match' },
  { query: 'chicken', expected: 1, desc: 'ingredient match' },
  { query: 'italian', expected: 1, desc: 'category match' },
  { query: 'cheese', expected: 2, desc: 'multiple matches' },
  { query: 'xyz', expected: 0, desc: 'no match' },
  { query: '', expected: 5, desc: 'empty query' },
];

let passedSearch = 0;
searchTests.forEach(test => {
  const result = getFilteredRecipes(testRecipes, test.query, { prepTimeMax: null, cookTimeMax: null }, 'title-asc');
  const passed = result.length === test.expected;
  console.log(`  ${passed ? '✅' : '❌'} "${test.query}" → ${result.length} results (expected ${test.expected}) - ${test.desc}`);
  if (passed) passedSearch++;
});
console.log(`  Passed: ${passedSearch}/${searchTests.length}\n`);

// Test 3: Time filters
console.log('Test 3: Time Filters');
const filterTests = [
  { filters: { prepTimeMax: 10, cookTimeMax: null }, expected: 3, desc: 'prep time ≤ 10min (includes 0)' },
  { filters: { prepTimeMax: null, cookTimeMax: 15 }, expected: 3, desc: 'cook time ≤ 15min (includes 0)' },
  { filters: { prepTimeMax: 15, cookTimeMax: 20 }, expected: 4, desc: 'both filters (includes 0)' },
  { filters: { prepTimeMax: 5, cookTimeMax: 5 }, expected: 1, desc: 'strict filters' },
];

let passedFilters = 0;
filterTests.forEach(test => {
  const result = getFilteredRecipes(testRecipes, '', test.filters, 'title-asc');
  const passed = result.length === test.expected;
  console.log(`  ${passed ? '✅' : '❌'} ${test.desc} → ${result.length} results (expected ${test.expected})`);
  if (passed) passedFilters++;
});
console.log(`  Passed: ${passedFilters}/${filterTests.length}\n`);

// Test 4: Sorting
console.log('Test 4: Sorting');
const sortTests = [
  { sortBy: 'title-asc', first: 'Beef Tacos', desc: 'A-Z' },
  { sortBy: 'title-desc', first: 'Slow Cooked Roast', desc: 'Z-A' },
  { sortBy: 'date-new', first: 'Quick Salad', desc: 'newest first' },
  { sortBy: 'date-old', first: 'Pasta Carbonara', desc: 'oldest first' },
];

let passedSort = 0;
sortTests.forEach(test => {
  const result = getFilteredRecipes(testRecipes, '', { prepTimeMax: null, cookTimeMax: null }, test.sortBy);
  const passed = result[0].title === test.first;
  console.log(`  ${passed ? '✅' : '❌'} ${test.desc} → first: "${result[0].title}" (expected "${test.first}")`);
  if (passed) passedSort++;
});
console.log(`  Passed: ${passedSort}/${sortTests.length}\n`);

// Test 5: Combined filters
console.log('Test 5: Combined Search + Filter + Sort');
const result = getFilteredRecipes(
  testRecipes,
  'beef',
  { prepTimeMax: 30, cookTimeMax: 30 },
  'title-asc'
);
const passed = result.length === 1 && result[0].title === 'Beef Tacos';
console.log(`  ${passed ? '✅' : '❌'} Search "beef" + time filters + sort → ${result.length} result: "${result[0]?.title || 'none'}"`);
console.log(`  Expected: 1 result: "Beef Tacos"\n`);

// Summary
const totalTests = timeTests.length + searchTests.length + filterTests.length + sortTests.length + 1;
const totalPassed = passedParsing + passedSearch + passedFilters + passedSort + (passed ? 1 : 0);

console.log('═══════════════════════════════════════');
console.log(`Total: ${totalPassed}/${totalTests} tests passed`);
console.log(`Success Rate: ${Math.round(totalPassed/totalTests * 100)}%`);
console.log('═══════════════════════════════════════');

if (totalPassed === totalTests) {
  console.log('\n🎉 All tests passed! Search and filter functionality is working correctly.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
  process.exit(1);
}
