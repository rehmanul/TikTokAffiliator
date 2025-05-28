import { expect } from 'chai';
import express from 'express';
import request from 'supertest';
import { tiktokBot } from '../../server/bot/tiktokBotInstance';
import { registerRoutes } from '../../server/routes';

describe('Bot API Endpoints', () => {
  let app: express.Application;

  before(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app, tiktokBot);
  });

  afterEach(async () => {
    // Clean up after each test
    await tiktokBot.stop();
  });

  describe('POST /api/manual-login', () => {
    it('should initiate manual login process', async () => {
      const response = await request(app)
        .post('/api/manual-login')
        .expect(200);

      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('Manual login');
    });

    it('should handle errors during manual login', async () => {
      // Force an error by attempting manual login while bot is running
      await tiktokBot.start();

      const response = await request(app)
        .post('/api/manual-login')
        .expect(500);

      expect(response.body).to.have.property('error');
    });
  });

  describe('POST /api/start', () => {
    it('should start the bot when session exists', async () => {
      // First do manual login
      await request(app).post('/api/manual-login');

      const response = await request(app)
        .post('/api/start')
        .expect(200);

      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('started');
    });

    it('should fail to start without valid session', async () => {
      const response = await request(app)
        .post('/api/start')
        .expect(500);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('session');
    });

    it('should handle concurrent start requests', async () => {
      // Attempt to start bot multiple times simultaneously
      const requests = Array(3).fill(null).map(() => 
        request(app).post('/api/start')
      );

      const responses = await Promise.all(requests);
      
      // Only one should succeed, others should fail
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).to.equal(1);
    });
  });

  describe('POST /api/stop', () => {
    it('should stop running bot', async () => {
      // Start bot first
      await request(app).post('/api/start');

      const response = await request(app)
        .post('/api/stop')
        .expect(200);

      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('stopped');
    });

    it('should handle stopping already stopped bot', async () => {
      const response = await request(app)
        .post('/api/stop')
        .expect(200);

      expect(response.body).to.have.property('message');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid routes', async () => {
      await request(app)
        .post('/api/invalid-endpoint')
        .expect(404);
    });

    it('should handle malformed requests', async () => {
      await request(app)
        .post('/api/start')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle server errors gracefully', async () => {
      // Force an error by corrupting bot state
      (tiktokBot as any).browser = null;
      (tiktokBot as any).page = null;

      const response = await request(app)
        .post('/api/start')
        .expect(500);

      expect(response.body).to.have.property('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on endpoints', async () => {
      // Make multiple requests in quick succession
      const requests = Array(10).fill(null).map(() =>
        request(app).post('/api/manual-login')
      );

      const responses = await Promise.all(requests);
      
      // Some should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).to.be.true;
    });
  });

  describe('Session Handling', () => {
    it('should maintain session state across requests', async () => {
      // Start manual login
      await request(app)
        .post('/api/manual-login')
        .expect(200);

      // Try to start bot (should work with valid session)
      const startResponse = await request(app)
        .post('/api/start')
        .expect(200);

      expect(startResponse.body.message).to.include('started');

      // Stop bot
      const stopResponse = await request(app)
        .post('/api/stop')
        .expect(200);

      expect(stopResponse.body.message).to.include('stopped');
    });

    it('should handle session expiration', async () => {
      // Start with expired session
      const response = await request(app)
        .post('/api/start')
        .expect(500);

      expect(response.body.error).to.include('session');
    });
  });
});
