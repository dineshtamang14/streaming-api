const request = require('supertest');
const app = require('../../server');

describe('authentication routes', () => {
  it('rejects signup with a short password', async () => {
    const response = await request(app).post('/auth/signup').send({
      name: 'Test User',
      email: 'test-user@example.com',
      password: 'short'
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/8 characters/);
  });

  it('requires authentication for uploads', async () => {
    const response = await request(app)
      .post('/upload/document')
      .attach('documents', Buffer.from('%PDF-1.4'), {
        filename: 'auth-test.pdf',
        contentType: 'application/pdf'
      });

    expect(response.status).toBe(401);
  });

  it('requires email and password for signin', async () => {
    const response = await request(app).post('/auth/signin').send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Email and password/);
  });
});
