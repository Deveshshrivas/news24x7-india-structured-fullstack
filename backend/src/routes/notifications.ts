import { Router, type Response } from 'express';
import { authenticate } from '../security.js';

export const notificationsRouter = Router();

// Store active SSE connections
const clients = new Set<Response>();

/**
 * Broadcast a message to all connected admins.
 * This can be imported and called from any other route.
 */
export function broadcastNotification(message: string, actionUrl?: string) {
  const payload = JSON.stringify({ message, actionUrl, timestamp: new Date().toISOString() });
  for (const client of clients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      clients.delete(client);
    }
  }
}

notificationsRouter.get('/stream', authenticate, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  
  clients.add(res);
  
  req.on('close', () => {
    clients.delete(res);
  });
});
