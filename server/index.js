import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { GameManager } from './gameManager.js';

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

// Set up CORS for Socket.io with more specific configuration
const io = new Server(server, {
  cors: {
    origin: true, // This allows the server to accept requests from any origin
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'], // Enable both WebSocket and polling
  allowEIO3: true, // Enable Engine.IO v3 transport
  pingTimeout: 60000, // Increase ping timeout
  pingInterval: 25000 // Increase ping interval
});

// Create game manager instance
const gameManager = new GameManager();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Set username
  socket.on('setUsername', (username) => {
    gameManager.setPlayerUsername(socket.id, username);
  });
  
  // Create a new room
  socket.on('createRoom', ({ username }) => {
    try {
      const room = gameManager.createRoom(socket.id, username);
      socket.join(room.roomCode);
      socket.emit('roomUpdate', room);
      console.log(`Room created: ${room.roomCode} by ${username}`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
  
  // Join an existing room
  socket.on('joinRoom', ({ roomCode, username }) => {
    try {
      const room = gameManager.joinRoom(roomCode, socket.id, username);
      socket.join(roomCode);
      io.to(roomCode).emit('roomUpdate', room);
      console.log(`${username} joined room: ${roomCode}`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
  
  // Leave room
  socket.on('leaveRoom', ({ roomCode }) => {
    try {
      const room = gameManager.leaveRoom(roomCode, socket.id);
      socket.leave(roomCode);
      
      if (room) {
        // Room still exists, update other players
        io.to(roomCode).emit('roomUpdate', room);
      }
      console.log(`Player left room: ${roomCode}`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
  
  // Start game
  socket.on('startGame', ({ roomCode }) => {
    try {
      const room = gameManager.getRoomByCode(roomCode);
      
      if (!room) {
        throw new Error('Room not found');
      }
      
      if (room.host !== socket.id) {
        throw new Error('Only the host can start the game');
      }
      
      if (room.players.length < 2) {
        throw new Error('Need at least 2 players to start');
      }
      
      // Initialize game
      gameManager.initializeGame(roomCode);
      
      // Notify all players in the room that the game started
      io.to(roomCode).emit('gameStarted');
      console.log(`Game started in room: ${roomCode}`);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
  
  // Get game state
  socket.on('getGameState', ({ roomCode }) => {
    try {
      const gameState = gameManager.getGameState(roomCode, socket.id);
      socket.emit('gameState', gameState);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
  
  // Play a card
  socket.on('playCard', ({ roomCode, cardIndex }) => {
    try {
      const result = gameManager.playCard(roomCode, socket.id, cardIndex);
      
      // If the card is wild, player needs to select a color
      if (result.needColor) {
        socket.emit('selectColor');
      }
      
      // Send updated game state to all players
      const gameState = gameManager.getGameState(roomCode);
      io.to(roomCode).emit('gameState', gameState);
      
      // Check for game over
      if (result.gameOver) {
        io.to(roomCode).emit('gameOver', { winner: result.winner });
      }
    } catch (error) {
      socket.emit('invalidMove', { message: error.message });
    }
  });
  
  // Select color for wild card
  socket.on('selectColor', ({ roomCode, color }) => {
    try {
      gameManager.setWildColor(roomCode, socket.id, color);
      
      // Send updated game state
      const gameState = gameManager.getGameState(roomCode);
      io.to(roomCode).emit('gameState', gameState);
      
      // Move to next player
      const result = gameManager.nextTurn(roomCode);
      
      // Check for game over
      if (result.gameOver) {
        io.to(roomCode).emit('gameOver', { winner: result.winner });
      }
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
  
  // Draw a card
  socket.on('drawCard', ({ roomCode }) => {
    try {
      const card = gameManager.drawCard(roomCode, socket.id);
      
      // Send the new card to the player
      socket.emit('cardDrawn', card);
      
      // Update all players' game state
      const gameState = gameManager.getGameState(roomCode);
      io.to(roomCode).emit('gameState', gameState);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
  
  // Chat message
  socket.on('sendMessage', ({ roomCode, message, username }) => {
    try {
      const chatMessage = {
        username,
        text: message,
        timestamp: Date.now()
      };
      
      io.to(roomCode).emit('chatMessage', chatMessage);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Handle player disconnection from any active rooms
    const affectedRooms = gameManager.handleDisconnect(socket.id);
    
    // Update game state for affected rooms
    affectedRooms.forEach(roomCode => {
      const room = gameManager.getRoomByCode(roomCode);
      if (room) {
        io.to(roomCode).emit('roomUpdate', room);
        
        // If game is in progress, update game state
        if (room.gameStarted) {
          const gameState = gameManager.getGameState(roomCode);
          io.to(roomCode).emit('gameState', gameState);
        }
      }
    });
  });
});

// Serve static files if needed
app.use(express.static('public'));

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});