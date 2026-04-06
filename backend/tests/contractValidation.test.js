/**
 * Contract Schema Validation Tests
 *
 * Validates that API response shapes match the JSON Schema contracts
 * in contracts/. Catches contract drift between backend and frontend.
 */

const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

const CONTRACTS_DIR = path.join(__dirname, '..', '..', 'contracts');

function loadSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, name), 'utf8'));
}

function createValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  // Load all schemas so $ref works
  ajv.addSchema(loadSchema('recipe.schema.json'));
  ajv.addSchema(loadSchema('extraction-job.schema.json'));
  return ajv;
}

describe('Recipe schema validation', () => {
  let validate;

  beforeAll(() => {
    const ajv = createValidator();
    validate = ajv.getSchema('recipe.schema.json');
  });

  test('accepts a complete recipe', () => {
    const recipe = {
      title: 'Potato Croquettes',
      category: 'Dinner',
      ingredients: '500g potatoes\n100g cheese\n2 eggs',
      instructions: '1. Boil potatoes\n2. Mash and mix\n3. Fry until golden',
      prepTime: '15 minutes',
      cookTime: '30 minutes',
      servings: '4 servings',
    };
    expect(validate(recipe)).toBe(true);
  });

  test('accepts a minimal recipe (required fields only)', () => {
    const recipe = {
      title: 'Simple Salad',
      category: 'Lunch',
      ingredients: 'lettuce\ntomatoes',
      instructions: '1. Wash and chop\n2. Toss together',
    };
    expect(validate(recipe)).toBe(true);
  });

  test('rejects recipe without title', () => {
    const recipe = {
      category: 'Dinner',
      ingredients: 'some ingredients',
      instructions: '1. Do something',
    };
    expect(validate(recipe)).toBe(false);
    expect(validate.errors.some(e => e.instancePath === '' && e.params.missingProperty === 'title')).toBe(true);
  });

  test('rejects recipe without ingredients', () => {
    const recipe = {
      title: 'Bad Recipe',
      category: 'Dinner',
      instructions: '1. Do something',
    };
    expect(validate(recipe)).toBe(false);
  });

  test('rejects recipe without instructions', () => {
    const recipe = {
      title: 'Bad Recipe',
      category: 'Dinner',
      ingredients: 'some ingredients',
    };
    expect(validate(recipe)).toBe(false);
  });

  test('rejects recipe with invalid category', () => {
    const recipe = {
      title: 'Bad Recipe',
      category: 'InvalidCategory',
      ingredients: 'some',
      instructions: '1. Do',
    };
    expect(validate(recipe)).toBe(false);
  });

  test('rejects recipe with empty title', () => {
    const recipe = {
      title: '',
      category: 'Dinner',
      ingredients: 'some',
      instructions: '1. Do',
    };
    expect(validate(recipe)).toBe(false);
  });

  test('rejects additional properties', () => {
    const recipe = {
      title: 'Test',
      category: 'Dinner',
      ingredients: 'some',
      instructions: '1. Do',
      unknownField: 'should fail',
    };
    expect(validate(recipe)).toBe(false);
  });

  test('accepts all valid categories', () => {
    const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Appetizers', 'Asian', 'Vegan', 'Vegetarian'];
    for (const category of categories) {
      const recipe = {
        title: 'Test',
        category,
        ingredients: 'some',
        instructions: '1. Do',
      };
      expect(validate(recipe)).toBe(true);
    }
  });
});

describe('Extraction job schema validation', () => {
  let validate;

  beforeAll(() => {
    const ajv = createValidator();
    validate = ajv.getSchema('extraction-job.schema.json');
  });

  test('accepts a processing job', () => {
    const job = {
      status: 'processing',
      steps: [
        { name: 'Fetching video info', status: 'completed' },
        { name: 'Checking description', status: 'in-progress' },
        { name: 'Extracting captions', status: 'pending' },
      ],
    };
    expect(validate(job)).toBe(true);
  });

  test('accepts a completed job with recipe', () => {
    const job = {
      status: 'completed',
      steps: [
        { name: 'Fetching video info', status: 'completed', timestamp: '2026-04-06T10:00:00Z' },
        { name: 'Checking description', status: 'completed' },
      ],
      result: {
        recipe: {
          title: 'Potato Croquettes',
          category: 'Dinner',
          ingredients: '500g potatoes\n100g cheese',
          instructions: '1. Boil\n2. Fry',
          servings: '4 servings',
        },
        source: 'linked-url:json-ld',
        completeness: 10,
        metadata: {
          title: 'How to make Potato Croquettes',
          uploader: 'Chef John',
          duration: 600,
        },
        attempts: [
          { source: 'linked-url', status: 'success', url: 'https://example.com/recipe' },
          { source: 'description', status: 'skipped', reason: 'better source found' },
        ],
        timestamp: '2026-04-06T10:01:00Z',
      },
    };
    expect(validate(job)).toBe(true);
  });

  test('accepts a failed job with error', () => {
    const job = {
      status: 'failed',
      steps: [
        { name: 'Fetching video info', status: 'completed' },
        { name: 'Checking description', status: 'failed' },
      ],
      error: 'Could not extract a recipe from this video',
    };
    expect(validate(job)).toBe(true);
  });

  test('rejects job without status', () => {
    const job = {
      steps: [{ name: 'test', status: 'pending' }],
    };
    expect(validate(job)).toBe(false);
  });

  test('rejects job without steps', () => {
    const job = {
      status: 'processing',
    };
    expect(validate(job)).toBe(false);
  });

  test('rejects invalid job status', () => {
    const job = {
      status: 'unknown',
      steps: [],
    };
    expect(validate(job)).toBe(false);
  });

  test('rejects invalid step status', () => {
    const job = {
      status: 'processing',
      steps: [{ name: 'test', status: 'invalid-status' }],
    };
    expect(validate(job)).toBe(false);
  });

  test('completeness must be 0-12', () => {
    const makeJob = (completeness) => ({
      status: 'completed',
      steps: [{ name: 'test', status: 'completed' }],
      result: { completeness },
    });

    expect(validate(makeJob(0))).toBe(true);
    expect(validate(makeJob(12))).toBe(true);
    expect(validate(makeJob(null))).toBe(true);
    expect(validate(makeJob(13))).toBe(false);
    expect(validate(makeJob(-1))).toBe(false);
  });
});
