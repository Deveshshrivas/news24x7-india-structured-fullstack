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
      if ((client as any).flush) (client as any).flush();
    } catch (err) {
      clients.delete(client);
    }
  }
}

// Heartbeat to keep connections alive
setInterval(() => {
  for (const client of clients) {
    try {
      client.write(': heartbeat\n\n');
      if ((client as any).flush) (client as any).flush();
    } catch (err) {
      clients.delete(client);
    }
  }
}, 15000);

notificationsRouter.get('/stream', authenticate, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  
  clients.add(res);
  
  req.on('close', () => {
    clients.delete(res);
  });
});
