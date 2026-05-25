// tests/routes/api.test.js

const request = require('supertest');
const express = require('express');
const apiRouter = require('../../routes/api');

// Build a minimal Express app that mounts only the API router
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/', apiRouter);
  return app;
}

describe('GET /example', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('returns 200 with the example message', async () => {
    const res = await request(app).get('/example');
    expect(res.status).toBe(200);
    expect(res.text).toBe('This is an example method!');
  });

  it('responds with text/html content-type', async () => {
    const res = await request(app).get('/example');
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
  });
});
