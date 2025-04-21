import { v4 as uuidv4 } from 'uuid';

export class GameManager {
  constructor() {
    this.rooms = new Map();
    this.games = new Map();
    this.players = new Map(); // Map of socket ID to username
  }
  
  generateRoomCode() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar-looking characters
    let code = '';
    
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
    
    // Make sure code is unique
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    
    return code;
  }
  
  setPlayerUsername(playerId, username) {
    this.players.set(playerId, username);
  }
  
  createRoom(hostId, username) {
    const roomCode = this.generateRoomCode();
    
    const room = {
      roomCode,
      host: hostId,
      players: [{ id: hostId, username }],
      gameStarted: false,
      createdAt: Date.now()
    };
    
    this.rooms.set(roomCode, room);
    return room;
  }
  
  joinRoom(roomCode, playerId, username) {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (room.gameStarted) {
      throw new Error('Cannot join a game that has already started');
    }
    
    if (room.players.find(p => p.id === playerId)) {
      throw new Error('You are already in this room');
    }
    
    // Add player to room
    room.players.push({ id: playerId, username });
    
    return room;
  }
  
  leaveRoom(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Remove player from room
    room.players = room.players.filter(p => p.id !== playerId);
    
    // If the room is now empty, remove it
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      
      // If there's a game for this room, remove it too
      if (this.games.has(roomCode)) {
        this.games.delete(roomCode);
      }
      
      return null;
    }
    
    // If the host left, assign a new host
    if (room.host === playerId && room.players.length > 0) {
      room.host = room.players[0].id;
    }
    
    return room;
  }
  
  getRoomByCode(roomCode) {
    return this.rooms.get(roomCode);
  }
  
  initializeGame(roomCode) {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Create a new deck
    const deck = this.createDeck();
    
    // Shuffle the deck
    this.shuffleDeck(deck);
    
    // Deal 7 cards to each player
    const hands = {};
    room.players.forEach(player => {
      hands[player.id] = [];
      for (let i = 0; i < 7; i++) {
        hands[player.id].push(deck.pop());
      }
    });
    
    // Set the top card (make sure it's not a wild card)
    let topCard;
    do {
      topCard = deck.pop();
    } while (topCard.color === 'wild');
    
    // Create game state
    const game = {
      deck,
      hands,
      discardPile: [topCard],
      currentPlayerIndex: 0,
      direction: 'clockwise',
      players: room.players.map(p => ({...p, cardCount: 7})),
      waitingForColor: false,
      lastPlayerId: null
    };
    
    // Store game state
    this.games.set(roomCode, game);
    
    // Mark room as game started
    room.gameStarted = true;
    
    return game;
  }
  
  createDeck() {
    const deck = [];
    const colors = ['red', 'blue', 'green', 'yellow'];
    
    // Add numbered cards
    colors.forEach(color => {
      // One 0 per color
      deck.push({ id: uuidv4(), color, value: '0' });
      
      // Two of each 1-9 per color
      for (let i = 1; i <= 9; i++) {
        deck.push({ id: uuidv4(), color, value: i.toString() });
        deck.push({ id: uuidv4(), color, value: i.toString() });
      }
      
      // Two of each special card per color
      const specials = ['skip', 'reverse', 'draw2'];
      specials.forEach(value => {
        deck.push({ id: uuidv4(), color, value });
        deck.push({ id: uuidv4(), color, value });
      });
    });
    
    // Add wild cards
    for (let i = 0; i < 4; i++) {
      deck.push({ id: uuidv4(), color: 'wild', value: 'wild' });
      deck.push({ id: uuidv4(), color: 'wild', value: 'wild4' });
    }
    
    return deck;
  }
  
  shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  
  getGameState(roomCode, playerId = null) {
    const room = this.rooms.get(roomCode);
    const game = this.games.get(roomCode);
    
    if (!room || !game) {
      throw new Error('Game not found');
    }
    
    // Current player's ID
    const currentPlayerId = game.players[game.currentPlayerIndex].id;
    
    // If a specific player is requesting the state
    const filteredState = {
      players: game.players,
      currentPlayer: currentPlayerId,
      direction: game.direction,
      topCard: game.discardPile[game.discardPile.length - 1],
      hands: {}
    };
    
    // Only include the requesting player's hand if a player ID is provided
    if (playerId) {
      filteredState.hands[playerId] = game.hands[playerId];
    } else {
      // Include all hands (for server-side operations)
      filteredState.hands = game.hands;
    }
    
    return filteredState;
  }
  
  playCard(roomCode, playerId, cardIndex) {
    const game = this.games.get(roomCode);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    // Check if it's the player's turn
    const currentPlayerId = game.players[game.currentPlayerIndex].id;
    if (playerId !== currentPlayerId) {
      throw new Error('Not your turn');
    }
    
    // Get the player's hand
    const hand = game.hands[playerId];
    
    // Validate card index
    if (cardIndex < 0 || cardIndex >= hand.length) {
      throw new Error('Invalid card index');
    }
    
    const card = hand[cardIndex];
    const topCard = game.discardPile[game.discardPile.length - 1];
    
    // Validate card can be played
    if (!this.isValidPlay(card, topCard)) {
      throw new Error('Invalid move: Card does not match color or value');
    }
    
    // Remove card from hand
    hand.splice(cardIndex, 1);
    
    // Add card to discard pile
    game.discardPile.push(card);
    
    // Update card counts
    const playerIndex = game.players.findIndex(p => p.id === playerId);
    game.players[playerIndex].cardCount = hand.length;
    
    // Check for win condition
    if (hand.length === 0) {
      return {
        gameOver: true,
        winner: playerId
      };
    }
    
    // Special card effects
    let needColor = false;
    
    if (card.color === 'wild') {
      // For wild cards, wait for color selection
      game.waitingForColor = true;
      game.lastPlayerId = playerId;
      needColor = true;
      return { needColor, gameOver: false };
    }
    
    // Apply card effects and move to next player
    this.applyCardEffect(game, card);
    
    return { needColor: false, gameOver: false };
  }
  
  setWildColor(roomCode, playerId, color) {
    const game = this.games.get(roomCode);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    if (!game.waitingForColor || game.lastPlayerId !== playerId) {
      throw new Error('Not waiting for color selection from you');
    }
    
    // Validate color
    const validColors = ['red', 'blue', 'green', 'yellow'];
    if (!validColors.includes(color)) {
      throw new Error('Invalid color selection');
    }
    
    // Update the top card's color
    const topCard = game.discardPile[game.discardPile.length - 1];
    topCard.color = color;
    
    // Mark that we're not waiting for color anymore
    game.waitingForColor = false;
    
    // Apply effects for the wild card
    if (topCard.value === 'wild4') {
      // Next player draws 4 cards
      this.nextPlayerDraws(game, 4);
      
      // Skip to the next player
      this.nextPlayerIndex(game);
    }
    
    return this.nextTurn(roomCode);
  }
  
  nextTurn(roomCode) {
    const game = this.games.get(roomCode);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    // Check if the game is already over
    const playerWithNoCards = game.players.find(p => p.cardCount === 0);
    if (playerWithNoCards) {
      return {
        gameOver: true,
        winner: playerWithNoCards.id
      };
    }
    
    // Move to next player
    this.nextPlayerIndex(game);
    
    return { gameOver: false };
  }
  
  isValidPlay(card, topCard) {
    // Wild cards can always be played
    if (card.color === 'wild') {
      return true;
    }
    
    // Match color or value
    return card.color === topCard.color || card.value === topCard.value;
  }
  
  applyCardEffect(game, card) {
    switch (card.value) {
      case 'skip':
        // Skip next player
        this.nextPlayerIndex(game);
        break;
        
      case 'reverse':
        // Reverse direction
        game.direction = game.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
        
        // If only 2 players, reverse acts like skip
        if (game.players.length === 2) {
          this.nextPlayerIndex(game);
        }
        break;
        
      case 'draw2':
        // Next player draws 2 cards
        this.nextPlayerDraws(game, 2);
        
        // Skip to the next player
        this.nextPlayerIndex(game);
        break;
    }
  }
  
  nextPlayerIndex(game) {
    const playerCount = game.players.length;
    
    if (game.direction === 'clockwise') {
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % playerCount;
    } else {
      game.currentPlayerIndex = (game.currentPlayerIndex - 1 + playerCount) % playerCount;
    }
  }
  
  nextPlayerDraws(game, cardCount) {
    const playerCount = game.players.length;
    const nextPlayerIndex = game.direction === 'clockwise'
      ? (game.currentPlayerIndex + 1) % playerCount
      : (game.currentPlayerIndex - 1 + playerCount) % playerCount;
    
    const nextPlayerId = game.players[nextPlayerIndex].id;
    
    // Draw cards for the next player
    for (let i = 0; i < cardCount; i++) {
      this.drawCardForPlayer(game, nextPlayerId);
    }
    
    // Update card count
    game.players[nextPlayerIndex].cardCount = game.hands[nextPlayerId].length;
  }
  
  drawCard(roomCode, playerId) {
    const game = this.games.get(roomCode);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    // Check if it's the player's turn
    const currentPlayerId = game.players[game.currentPlayerIndex].id;
    if (playerId !== currentPlayerId) {
      throw new Error('Not your turn');
    }
    
    // Draw a card
    const card = this.drawCardForPlayer(game, playerId);
    
    // Update card count
    const playerIndex = game.players.findIndex(p => p.id === playerId);
    game.players[playerIndex].cardCount = game.hands[playerId].length;
    
    // Move to next player (player automatically passes after drawing)
    this.nextPlayerIndex(game);
    
    return card;
  }
  
  drawCardForPlayer(game, playerId) {
    // Check if deck is empty and needs to be reshuffled
    if (game.deck.length === 0) {
      const topCard = game.discardPile.pop();
      game.deck = game.discardPile;
      game.discardPile = [topCard];
      this.shuffleDeck(game.deck);
    }
    
    // Draw a card
    const card = game.deck.pop();
    
    // Add to player's hand
    game.hands[playerId].push(card);
    
    return card;
  }
  
  handleDisconnect(playerId) {
    const affectedRooms = [];
    
    // Find all rooms the player is in
    for (const [roomCode, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === playerId);
      
      if (playerIndex !== -1) {
        // Remove player from room
        room.players.splice(playerIndex, 1);
        affectedRooms.push(roomCode);
        
        // If the room is now empty, remove it
        if (room.players.length === 0) {
          this.rooms.delete(roomCode);
          
          if (this.games.has(roomCode)) {
            this.games.delete(roomCode);
          }
          
          continue;
        }
        
        // If the host left, assign a new host
        if (room.host === playerId) {
          room.host = room.players[0].id;
        }
        
        // If there's an active game, handle player leaving
        if (this.games.has(roomCode)) {
          const game = this.games.get(roomCode);
          
          // Remove player from game
          const gamePlayerIndex = game.players.findIndex(p => p.id === playerId);
          if (gamePlayerIndex !== -1) {
            game.players.splice(gamePlayerIndex, 1);
          }
          
          // If it was the player's turn, move to next player
          if (game.currentPlayerIndex === gamePlayerIndex) {
            if (game.currentPlayerIndex >= game.players.length) {
              game.currentPlayerIndex = 0;
            }
          } else if (game.currentPlayerIndex > gamePlayerIndex) {
            // Adjust current player index if the removed player was before the current player
            game.currentPlayerIndex--;
          }
          
          // Delete player's hand
          delete game.hands[playerId];
          
          // If not enough players, end the game
          if (game.players.length < 2) {
            this.games.delete(roomCode);
            room.gameStarted = false;
          }
        }
      }
    }
    
    // Clean up player data
    this.players.delete(playerId);
    
    return affectedRooms;
  }
}