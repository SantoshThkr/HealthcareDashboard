import request from 'supertest';

import app from '../src/app';

describe('GET /api/health', () => {
  it('responds with ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
