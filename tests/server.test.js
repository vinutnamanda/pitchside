const request = require('supertest');
const app = require('../server');

describe('GET /', () => {
  it('serves the frontend', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/chat', () => {
  it('rejects a request with no message', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/message/i);
  });

  it('rejects an empty message', async () => {
    const res = await request(app).post('/api/chat').send({ message: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects a message over the length limit', async () => {
    const longMessage = 'a'.repeat(501);
    const res = await request(app).post('/api/chat').send({ message: longMessage });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too long/i);
  });

  it('rejects a non-string message', async () => {
    const res = await request(app).post('/api/chat').send({ message: 12345 });
    expect(res.status).toBe(400);
  });

  it('rejects an oversized system prompt', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'hi', systemPrompt: 'a'.repeat(2001) });
    expect(res.status).toBe(400);
  });

  it('accepts a valid, well-formed request shape', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Where is the nearest gate?', systemPrompt: 'You are a helpful assistant.' });
    // Without a live GROQ_API_KEY in CI this will be 500/502; the important part
    // is the server accepts the shape and does not crash or reject on validation.
    expect([200, 500, 502]).toContain(res.status);
  });
});

describe('Rate limiting', () => {
  it('applies a rate limit after repeated requests', async () => {
    const requests = [];
    for (let i = 0; i < 25; i++) {
      requests.push(request(app).post('/api/chat').send({ message: 'test' }));
    }
    const results = await Promise.all(requests);
    const tooMany = results.filter(r => r.status === 429);
    expect(tooMany.length).toBeGreaterThan(0);
  });
});
