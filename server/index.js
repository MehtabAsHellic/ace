import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { setupSocketEvents } from './socketEvents.js';
import { GameManager } from './gameManager.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? "https://ace-card-game.netlify.app" 
      : "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Initialize game manager
const gameManager = new GameManager();

// Setup socket events
setupSocketEvents(io, gameManager);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down');
  io.close();
  server.close();
  process.exit(0);
});