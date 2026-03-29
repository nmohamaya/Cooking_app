const request = require('supertest');
const express = require('express');

// Mock the recipeExtractionService
jest.mock('../services/recipeExtractionService', () => ({
  extractRecipe: jest.fn().mockResolvedValue({
    success: true,
    recipe: {
      title: 'Chocolate Chip Cookies',
      ingredients: [
        { name: 'flour', quantity: 2, unit: 'cups', confidence: 0.95 },
        { name: 'butter', quantity: 1, unit: 'cup', confidence: 0.9 }
      ],
      instructions: [
        { text: 'Preheat oven to 375F', confidence: 0.92 },
        { text: 'Mix flour and butter', confidence: 0.88 }
      ],
      metadata: { prepTime: '15 minutes', cookTime: '12 minutes' }
    },
    confidence: 0.85,
    processingTime: 50,
    error: null
  })
}));

const recipesRouter = require('../routes/recipes');

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/recipes', recipesRouter);
  return app;
}

describe('Recipe Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('POST /api/recipes', () => {
    test('returns 202 with jobId for valid request', async () => {
      const res = await request(app)
        .post('/api/recipes')
        .send({ transcribedText: 'Mix flour and butter together' })
        .expect(202);

      expect(res.body.jobId).toBeDefined();
      expect(res.body.status).toBe('queued');
      expect(res.body.message).toContain('queued');
    });

    test('returns 400 when transcribedText is missing', async () => {
      const res = await request(app)
        .post('/api/recipes')
        .send({})
        .expect(400);

      expect(res.body.error).toBe('MISSING_TEXT');
    });

    test('returns 400 when transcribedText is empty', async () => {
      const res = await request(app)
        .post('/api/recipes')
        .send({ transcribedText: '' })
        .expect(400);

      expect(res.body.error).toBe('MISSING_TEXT');
    });

    test('returns 400 when transcribedText is not a string', async () => {
      const res = await request(app)
        .post('/api/recipes')
        .send({ transcribedText: 123 })
        .expect(400);

      expect(res.body.error).toBe('MISSING_TEXT');
    });

    test('accepts optional options parameter', async () => {
      const res = await request(app)
        .post('/api/recipes')
        .send({
          transcribedText: 'Mix flour and butter',
          options: { includeConfidence: true, minConfidence: 0.7 }
        })
        .expect(202);

      expect(res.body.jobId).toBeDefined();
    });
  });

  describe('GET /api/recipes/:id', () => {
    test('returns job status for valid jobId', async () => {
      // Create a job first
      const createRes = await request(app)
        .post('/api/recipes')
        .send({ transcribedText: 'Mix flour and butter' });

      const { jobId } = createRes.body;

      // Wait briefly for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await request(app)
        .get(`/api/recipes/${jobId}`)
        .expect(200);

      expect(res.body.jobId).toBe(jobId);
      expect(['queued', 'processing', 'completed']).toContain(res.body.status);
      expect(res.body.steps).toBeDefined();
    });

    test('returns 404 for unknown jobId', async () => {
      const res = await request(app)
        .get('/api/recipes/nonexistent-id')
        .expect(404);

      expect(res.body.error).toBe('JOB_NOT_FOUND');
    });

    test('returns result when job is completed', async () => {
      const createRes = await request(app)
        .post('/api/recipes')
        .send({ transcribedText: 'Mix flour and butter for chocolate chip cookies' });

      const { jobId } = createRes.body;

      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      const res = await request(app)
        .get(`/api/recipes/${jobId}`)
        .expect(200);

      expect(res.body.status).toBe('completed');
      expect(res.body.result).toBeDefined();
      expect(res.body.result.recipe).toBeDefined();
      expect(res.body.result.recipe.title).toBe('Chocolate Chip Cookies');
    });
  });

  describe('PUT /api/recipes/:id', () => {
    test('updates a completed recipe', async () => {
      // Create and wait for completion
      const createRes = await request(app)
        .post('/api/recipes')
        .send({ transcribedText: 'Mix flour and butter' });

      const { jobId } = createRes.body;
      await new Promise(resolve => setTimeout(resolve, 200));

      const res = await request(app)
        .put(`/api/recipes/${jobId}`)
        .send({ title: 'Updated Cookie Recipe', servings: 24 })
        .expect(200);

      expect(res.body.message).toContain('updated');

      // Verify the update persisted
      const getRes = await request(app)
        .get(`/api/recipes/${jobId}`)
        .expect(200);

      expect(getRes.body.result.recipe.title).toBe('Updated Cookie Recipe');
    });

    test('returns 404 for unknown jobId', async () => {
      await request(app)
        .put('/api/recipes/nonexistent-id')
        .send({ title: 'Updated' })
        .expect(404);
    });

    test('returns 400 when job is not completed', async () => {
      // Mock extractRecipe to be slow so job stays in processing state
      const { extractRecipe } = require('../services/recipeExtractionService');
      extractRecipe.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 5000)));

      const createRes = await request(app)
        .post('/api/recipes')
        .send({ transcribedText: 'Mix flour and butter' });

      const { jobId } = createRes.body;

      // Immediately try to update while job is still processing
      const res = await request(app)
        .put(`/api/recipes/${jobId}`)
        .send({ title: 'Updated' })
        .expect(400);

      expect(res.body.error).toBe('JOB_NOT_COMPLETED');
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    test('removes a completed job', async () => {
      const createRes = await request(app)
        .post('/api/recipes')
        .send({ transcribedText: 'Mix flour and butter' });

      const { jobId } = createRes.body;
      await new Promise(resolve => setTimeout(resolve, 200));

      const res = await request(app)
        .delete(`/api/recipes/${jobId}`)
        .expect(200);

      // Completed jobs return 'deleted', in-flight jobs return 'cancelled'
      expect(['deleted', 'cancelled']).toContain(res.body.status);

      // Verify it's gone
      await request(app)
        .get(`/api/recipes/${jobId}`)
        .expect(404);
    });

    test('returns 404 for unknown jobId', async () => {
      await request(app)
        .delete('/api/recipes/nonexistent-id')
        .expect(404);
    });
  });
});
