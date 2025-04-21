export function setupSocketEvents(io, gameManager) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    let currentRoomId = null;
    
    // Create a new room
    socket.on('create-room', ({ playerName }, callback) => {
      const roomId = gameManager.createRoom(socket.id, playerName);
      
      // Join socket room
      socket.join(roomId);
      currentRoomId = roomId;
      
      // Send room data back to client
      const roomData = gameManager.getRoomState(roomId);
      callback({ success: true, roomId, room: roomData });
      
      // Notify all clients that room list has updated
      io.emit('room-list-updated', gameManager.getRoomList());
    });
    
    // Join an existing room
    socket.on('join-room', ({ roomId, playerName }, callback) => {
      const room = gameManager.joinRoom(roomId, socket.id, playerName);
      
      if (!room) {
        return callback({ success: false, error: 'Room not found or full' });
      }
      
      // Join socket room
      socket.join(roomId);
      currentRoomId = roomId;
      
      // Send room data back to client
      callback({ success: true, room });
      
      // Notify all players in room of the new player
      io.to(roomId).emit('room-updated', room);
      
      // Notify all clients that room list has updated
      io.emit('room-list-updated', gameManager.getRoomList());
    });
    
    // Leave room
    socket.on('leave-room', (callback) => {
      if (!currentRoomId) {
        return callback?.({ success: false, error: 'Not in a room' });
      }
      
      const room = gameManager.leaveRoom(currentRoomId, socket.id);
      
      // Leave socket room
      socket.leave(currentRoomId);
      
      // Send response to client
      callback?.({ success: true });
      
      // If room still exists, notify remaining players
      if (room) {
        io.to(currentRoomId).emit('room-updated', room);
      }
      
      // Notify all clients that room list has updated
      io.emit('room-list-updated', gameManager.getRoomList());
      
      currentRoomId = null;
    });
    
    // Toggle ready status
    socket.on('toggle-ready', ({ isReady }, callback) => {
      if (!currentRoomId) {
        return callback?.({ success: false, error: 'Not in a room' });
      }
      
      const room = gameManager.setPlayerReady(currentRoomId, socket.id, isReady);
      
      // Send response to client
      callback?.({ success: true });
      
      // Notify all players in room
      io.to(currentRoomId).emit('room-updated', room);
    });
    
    // Start game
    socket.on('start-game', (callback) => {
      if (!currentRoomId) {
        return callback?.({ success: false, error: 'Not in a room' });
      }
      
      const room = gameManager.getRoomState(currentRoomId);
      
      // Check if player is host
      if (room.hostId !== socket.id) {
        return callback?.({ success: false, error: 'Only host can start game' });
      }
      
      const updatedRoom = gameManager.startGame(currentRoomId);
      
      // Send response to client
      callback?.({ success: true });
      
      // Notify all players in room
      io.to(currentRoomId).emit('game-started', updatedRoom);
      
      // Notify all clients that room list has updated
      io.emit('room-list-updated', gameManager.getRoomList());
    });
    
    // Play card
    socket.on('play-card', ({ cardIndex, chosenColor }, callback) => {
      if (!currentRoomId) {
        return callback?.({ success: false, error: 'Not in a room' });
      }
      
      const room = gameManager.playCard(currentRoomId, socket.id, cardIndex, chosenColor);
      
      // Send response to client
      callback?.({ success: true });
      
      // Notify all players in room
      io.to(currentRoomId).emit('game-updated', room);
      
      // Check if game ended
      if (room.gameState === 'ended') {
        io.to(currentRoomId).emit('game-ended', {
          winnerId: socket.id,
          winnerName: room.players.find(p => p.id === socket.id).name
        });
      }
    });
    
    // Draw card
    socket.on('draw-card', (callback) => {
      if (!currentRoomId) {
        return callback?.({ success: false, error: 'Not in a room' });
      }
      
      const room = gameManager.drawCard(currentRoomId, socket.id);
      
      // Send response to client
      callback?.({ success: true });
      
      // Notify all players in room
      io.to(currentRoomId).emit('game-updated', room);
    });
    
    // Send chat message
    socket.on('send-message', ({ message }, callback) => {
      if (!currentRoomId) {
        return callback?.({ success: false, error: 'Not in a room' });
      }
      
      const room = gameManager.addMessage(currentRoomId, socket.id, message);
      
      // Send response to client
      callback?.({ success: true });
      
      // Notify all players in room
      io.to(currentRoomId).emit('new-message', room.messages[room.messages.length - 1]);
    });
    
    // Get room list
    socket.on('get-room-list', (callback) => {
      const roomList = gameManager.getRoomList();
      callback(roomList);
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      if (currentRoomId) {
        const room = gameManager.leaveRoom(currentRoomId, socket.id);
        
        // If room still exists, notify remaining players
        if (room) {
          io.to(currentRoomId).emit('room-updated', room);
        }
        
        // Notify all clients that room list has updated
        io.emit('room-list-updated', gameManager.getRoomList());
      }
    });
  });
}