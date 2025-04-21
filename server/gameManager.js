import { v4 as uuidv4 } from 'uuid';

// Card colors
const COLORS = ['red', 'blue', 'green', 'yellow'];
// Card values
const VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2', 'wild', 'wild_draw4'];

export class GameManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(hostId, hostName) {
    const roomId = this.generateRoomId();
    const newRoom = {
      id: roomId,
      hostId,
      players: [{
        id: hostId,
        name: hostName,
        isReady: false,
        isHost: true,
        hand: []
      }],
      gameState: 'lobby', // lobby, playing, ended
      deck: [],
      discardPile: [],
      currentPlayer: null,
      direction: 1, // 1 for clockwise, -1 for counter-clockwise
      currentColor: null,
      currentValue: null,
      messages: [],
      createdAt: Date.now()
    };
    
    this.rooms.set(roomId, newRoom);
    return roomId;
  }

  joinRoom(roomId, playerId, playerName) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    // Check if player is already in the room
    const playerExists = room.players.find(p => p.id === playerId);
    if (playerExists) return room;
    
    // Check if room is full (max 10 players)
    if (room.players.length >= 10) return null;
    
    // Add player to room
    room.players.push({
      id: playerId,
      name: playerName,
      isReady: false,
      isHost: false,
      hand: []
    });
    
    return room;
  }

  leaveRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    // Remove player from room
    room.players = room.players.filter(p => p.id !== playerId);
    
    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }
    
    // If host left, assign new host
    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }
    
    return room;
  }

  startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    // Check if all players are ready
    const allReady = room.players.every(p => p.isReady);
    if (!allReady) return room;
    
    // Create and shuffle deck
    room.deck = this.createDeck();
    this.shuffleDeck(room.deck);
    
    // Deal cards to players
    room.players.forEach(player => {
      player.hand = [];
      for (let i = 0; i < 7; i++) {
        player.hand.push(room.deck.pop());
      }
    });
    
    // Set initial discard pile
    let initialCard = room.deck.pop();
    // Make sure initial card is not a wild or special card
    while (initialCard.value === 'wild' || initialCard.value === 'wild_draw4') {
      room.deck.unshift(initialCard);
      initialCard = room.deck.pop();
    }
    
    room.discardPile = [initialCard];
    room.currentColor = initialCard.color;
    room.currentValue = initialCard.value;
    
    // Set first player
    room.currentPlayer = 0;
    
    // Set game state to playing
    room.gameState = 'playing';
    
    return room;
  }

  playCard(roomId, playerId, cardIndex, chosenColor = null) {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState !== 'playing') return null;
    
    // Find player index
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return room;
    
    // Check if it's player's turn
    if (playerIndex !== room.currentPlayer) return room;
    
    const player = room.players[playerIndex];
    const card = player.hand[cardIndex];
    
    // Validate move
    if (!this.isValidMove(card, room.currentColor, room.currentValue)) {
      return room;
    }
    
    // Remove card from player's hand
    player.hand.splice(cardIndex, 1);
    
    // Add card to discard pile
    room.discardPile.push(card);
    
    // Update current color and value
    room.currentColor = card.color === 'wild' ? chosenColor : card.color;
    room.currentValue = card.value;
    
    // Check if player has won
    if (player.hand.length === 0) {
      room.gameState = 'ended';
      return room;
    }
    
    // Handle special cards
    this.handleSpecialCard(room, card, playerIndex);
    
    return room;
  }

  drawCard(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState !== 'playing') return null;
    
    // Find player index
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return room;
    
    // Check if it's player's turn
    if (playerIndex !== room.currentPlayer) return room;
    
    // Check if deck is empty
    if (room.deck.length === 0) {
      this.reshuffleDeck(room);
    }
    
    // Draw card from deck
    const card = room.deck.pop();
    room.players[playerIndex].hand.push(card);
    
    // Move to next player
    this.nextPlayer(room);
    
    return room;
  }

  setPlayerReady(roomId, playerId, isReady) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    // Find player
    const player = room.players.find(p => p.id === playerId);
    if (!player) return room;
    
    // Update player ready status
    player.isReady = isReady;
    
    return room;
  }

  addMessage(roomId, playerId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    // Find player
    const player = room.players.find(p => p.id === playerId);
    if (!player) return room;
    
    // Add message to room
    room.messages.push({
      id: uuidv4(),
      playerId,
      playerName: player.name,
      text: message,
      timestamp: Date.now()
    });
    
    return room;
  }

  // Helper methods
  generateRoomId() {
    // Generate 6-character alphanumeric room code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  createDeck() {
    const deck = [];
    
    // Add number cards (0-9) for each color
    COLORS.forEach(color => {
      // Add one 0 card for each color
      deck.push({ id: `${color}_0`, color, value: '0' });
      
      // Add two of each number card (1-9) for each color
      for (let i = 1; i <= 9; i++) {
        deck.push({ id: `${color}_${i}_1`, color, value: i.toString() });
        deck.push({ id: `${color}_${i}_2`, color, value: i.toString() });
      }
      
      // Add special cards (skip, reverse, draw2) for each color
      ['skip', 'reverse', 'draw2'].forEach(value => {
        deck.push({ id: `${color}_${value}_1`, color, value });
        deck.push({ id: `${color}_${value}_2`, color, value });
      });
    });
    
    // Add wild cards
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `wild_${i}`, color: 'wild', value: 'wild' });
      deck.push({ id: `wild_draw4_${i}`, color: 'wild', value: 'wild_draw4' });
    }
    
    return deck;
  }

  shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  reshuffleDeck(room) {
    // Take all cards from discard pile except the top card
    const topCard = room.discardPile.pop();
    room.deck = [...room.discardPile];
    room.discardPile = [topCard];
    
    // Shuffle deck
    this.shuffleDeck(room.deck);
  }

  isValidMove(card, currentColor, currentValue) {
    // Wild cards can always be played
    if (card.color === 'wild') return true;
    
    // Cards that match color can be played
    if (card.color === currentColor) return true;
    
    // Cards that match value can be played
    if (card.value === currentValue) return true;
    
    return false;
  }

  handleSpecialCard(room, card, playerIndex) {
    const numPlayers = room.players.length;
    
    switch (card.value) {
      case 'skip':
        // Skip next player
        this.nextPlayer(room);
        this.nextPlayer(room);
        break;
      case 'reverse':
        // Reverse direction
        room.direction *= -1;
        
        // If only 2 players, reverse acts like skip
        if (numPlayers === 2) {
          this.nextPlayer(room);
        } else {
          this.nextPlayer(room);
        }
        break;
      case 'draw2':
        // Next player draws 2 cards and skips turn
        const nextPlayerIndex = this.getNextPlayerIndex(room);
        this.drawCards(room, nextPlayerIndex, 2);
        this.nextPlayer(room);
        this.nextPlayer(room);
        break;
      case 'wild_draw4':
        // Next player draws 4 cards and skips turn
        const nextPlayerIndex2 = this.getNextPlayerIndex(room);
        this.drawCards(room, nextPlayerIndex2, 4);
        this.nextPlayer(room);
        this.nextPlayer(room);
        break;
      default:
        // For normal cards, just move to next player
        this.nextPlayer(room);
    }
  }

  nextPlayer(room) {
    room.currentPlayer = this.getNextPlayerIndex(room);
  }

  getNextPlayerIndex(room) {
    return (room.currentPlayer + room.direction + room.players.length) % room.players.length;
  }

  drawCards(room, playerIndex, numCards) {
    for (let i = 0; i < numCards; i++) {
      // Check if deck is empty
      if (room.deck.length === 0) {
        this.reshuffleDeck(room);
      }
      
      // Draw card from deck
      const card = room.deck.pop();
      room.players[playerIndex].hand.push(card);
    }
  }

  getRoomState(roomId) {
    return this.rooms.get(roomId) || null;
  }

  getRoomList() {
    return Array.from(this.rooms.values())
      .filter(room => room.gameState === 'lobby')
      .map(room => ({
        id: room.id,
        hostName: room.players.find(p => p.isHost)?.name || 'Unknown',
        playerCount: room.players.length,
        createdAt: room.createdAt
      }));
  }
}