const request = require('supertest');
const express = require('express');

// Mock server setup
let app;
beforeAll(() => {
  app = require('./server');
});

describe('POST /api/ask-ai', () => {
  it('should return 400 for missing history', async () => {
    const res = await request(app).post('/api/ask-ai').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 500 for failed AI call (mocked)', async () => {
    const res = await request(app).post('/api/ask-ai').send({ history: [] });
    // Since no real Azure key, expect 500
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});
