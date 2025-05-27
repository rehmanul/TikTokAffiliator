import { expect } from 'chai';
import express from 'express';
import request from 'supertest';
import { tiktokBot } from '../../server/bot/tiktokBotInstance';
import botRoutes from '../../server/routes/botRoutes';

describe('Bot API Endpoints', () => {
  let app: express.Application;

  before(() => {
    app = express();
    app.use(express.json());
    app.use('/api/bot', botRoutes);
  });

  afterEach(async () => {
    // Clean up after each test
    await tiktokBot.stop();
  });

  describe('POST /api/bot/manual-login', () => {
    it('should initiate manual login process', async () => {
      const response = await request(app)
        .post('/api/bot/manual-login')
        .expect(200);

      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('Manual login');
    });

    it('should handle errors during manual login', async () => {
      // Force an error by attempting manual login while bot is running
      await tiktokBot.start();

      const response = await request(app)
        .post('/api/bot/manual-login')
        .expect(500);

      expect(response.body).to.have.property('error');
    });
  });

  describe('POST /api/bot/start', () => {
    it('should start the bot when session exists', async () => {
      // First do manual login
      await request(app).post('/api/bot/manual-login');

      const response = await request(app)
        .post('/api/bot/start')
        .expect(200);

      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('started');
    });

    it('should fail to start without valid session', async () => {
      const response = await request(app)
        .post('/api/bot/start')
        .expect(500);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('session');
    });

    it('should handle concurrent start requests', async () => {
      // Attempt to start bot multiple times simultaneously
      const requests = Array(3).fill(null).map(() => 
        request(app).post('/api/bot/start')
      );

      const responses = await Promise.all(requests);
      
      // Only one should succeed, others should fail
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).to.equal(1);
    });
  });

  describe('POST /api/bot/stop', () => {
    it('should stop running bot', async () => {
      // Start bot first
      await request(app).post('/api/bot/start');

      const response = await request(app)
        .post('/api/bot/stop')
        .expect(200);

      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('stopped');
    });

    it('should handle stopping already stopped bot', async () => {
      const response = await request(app)
        .post('/api/bot/stop')
        .expect(200);

      expect(response.body).to.have.property('message');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid routes', async () => {
      await request(app)
        .post('/api/bot/invalid-endpoint')
        .expect(404);
    });

    it('should handle malformed requests', async () => {
      await request(app)
        .post('/api/bot/start')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle server errors gracefully', async () => {
      // Force an error by corrupting bot state
      (tiktokBot as any).browser = null;
      (tiktokBot as any).page = null;

      const response = await request(app)
        .post('/api/bot/start')
        .expect(500);

      expect(response.body).to.have.property('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on endpoints', async () => {
      // Make multiple requests in quick succession
      const requests = Array(10).fill(null).map(() => 
        request(app).post('/api/bot/manual-login')
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
        .post('/api/bot/manual-login')
        .expect(200);

      // Try to start bot (should work with valid session)
      const startResponse = await request(app)
        .post('/api/bot/start')
        .expect(200);

      expect(startResponse.body.message).to.include('started');

      // Stop bot
      const stopResponse = await request(app)
        .post('/api/bot/stop')
        .expect(200);

      expect(stopResponse.body.message).to.include('stopped');
    });

    it('should handle session expiration', async () => {
      // Start with expired session
      const response = await request(app)
        .post('/api/bot/start')
        .expect(500);

      expect(response.body.error).to.include('session');
    });
  });
});
