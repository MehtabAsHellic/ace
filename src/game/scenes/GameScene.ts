import Phaser from 'phaser';
import { GameCard } from '../types/GameCard';
import { Player } from '../types/Player';

interface GameSceneData {
  socket: SocketIOClient.Socket;
  username: string;
  room: any;
}

export default class GameScene extends Phaser.Scene {
  private socket!: SocketIOClient.Socket;
  private username!: string;
  private room!: any;
  private players: Player[] = [];
  private myHand: GameCard[] = [];
  private currentPlayer: string = '';
  private topCard: GameCard | null = null;
  private direction: 'clockwise' | 'counterclockwise' = 'clockwise';
  private cardImages: Phaser.GameObjects.Image[] = [];
  private discardPile!: Phaser.GameObjects.Image;
  private drawPile!: Phaser.GameObjects.Image;
  private directionIndicator!: Phaser.GameObjects.Image;
  private turnText!: Phaser.GameObjects.Text;
  private playerInfoTexts: { [key: string]: Phaser.GameObjects.Text } = {};
  private colorSelector!: Phaser.GameObjects.Container;
  private chatMessages: Phaser.GameObjects.Text[] = [];
  private chatInput!: HTMLInputElement;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData) {
    this.socket = data.socket;
    this.username = data.username;
    this.room = data.room;
    
    // Clear arrays and objects from previous games
    this.players = [];
    this.myHand = [];
    this.cardImages = [];
    this.playerInfoTexts = {};
    this.chatMessages = [];
  }

  create() {
    this.createBackground();
    this.createPiles();
    this.createUI();
    this.setupSocketListeners();
    this.createChat();

    // Request initial game state
    this.socket.emit('getGameState', { roomCode: this.room.roomCode });
  }

  createBackground() {
    // Create a background
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x1f2937)
      .setOrigin(0);
    
    // Table felt
    this.add.ellipse(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width - 100,
      this.cameras.main.height - 100,
      0x234876
    );
  }

  createPiles() {
    // Create discard pile area (placeholder until we get the first card)
    this.discardPile = this.add.image(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 2,
      'cardBack'
    );
    this.discardPile.setVisible(false);

    // Create draw pile
    this.drawPile = this.add.image(
      this.cameras.main.width / 2 - 160, 
      this.cameras.main.height / 2,
      'cardBack'
    ).setInteractive({ useHandCursor: true });

    this.drawPile.on('pointerdown', () => {
      this.socket.emit('drawCard', { roomCode: this.room.roomCode });
      this.sound.play('card-deal');
    });
  }

  createUI() {
    // Direction indicator
    this.directionIndicator = this.add.image(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 2 - 120, 
      'ui', 
      0 // Frame for clockwise direction
    );
    this.directionIndicator.setScale(0.5);

    // Turn indicator text
    this.turnText = this.add.text(
      this.cameras.main.width / 2, 
      80, 
      "Waiting for server...", 
      {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#2d3748',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }
    ).setOrigin(0.5);

    // Create wild card color selector (hidden initially)
    this.createColorSelector();
  }

  createColorSelector() {
    this.colorSelector = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2);
    
    const background = this.add.rectangle(0, 0, 300, 200, 0x000000, 0.8);
    const title = this.add.text(0, -80, 'Select a color', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const redBtn = this.createColorButton(0xdc2626, -75, 0, 'red');
    const blueBtn = this.createColorButton(0x2563eb, 75, 0, 'blue');
    const greenBtn = this.createColorButton(0x16a34a, -75, 60, 'green');
    const yellowBtn = this.createColorButton(0xfacc15, 75, 60, 'yellow');

    this.colorSelector.add([background, title, redBtn, blueBtn, greenBtn, yellowBtn]);
    this.colorSelector.setVisible(false);
  }

  createColorButton(color: number, x: number, y: number, colorName: string) {
    const button = this.add.rectangle(x, y, 80, 50, color)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.socket.emit('selectColor', { 
          roomCode: this.room.roomCode, 
          color: colorName 
        });
        this.colorSelector.setVisible(false);
        this.sound.play('button-click');
      });
    
    return button;
  }

  createChat() {
    // Create a chat area in the bottom left
    const chatBackground = this.add.rectangle(
      120, 
      this.cameras.main.height - 150, 
      220, 
      280, 
      0x1a202c, 
      0.8
    ).setOrigin(0, 0);
    
    // Chat title
    this.add.text(
      chatBackground.x + 10,
      chatBackground.y + 10,
      'CHAT',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );

    // Create input field using DOM
    const inputElement = document.createElement('input');
    inputElement.style.position = 'absolute';
    inputElement.style.width = '180px';
    inputElement.style.padding = '5px';
    inputElement.style.border = 'none';
    inputElement.style.borderRadius = '3px';
    inputElement.style.backgroundColor = '#4b5563';
    inputElement.style.color = '#ffffff';
    inputElement.placeholder = 'Type message...';
    
    document.body.appendChild(inputElement);
    this.chatInput = inputElement;
    
    // Position the input
    const inputX = chatBackground.x + 10;
    const inputY = chatBackground.y + chatBackground.height - 30;
    
    this.chatInput.style.left = inputX + 'px';
    this.chatInput.style.top = inputY + 'px';
    
    // Send message on Enter
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.chatInput.value.trim() !== '') {
        this.socket.emit('sendMessage', {
          roomCode: this.room.roomCode,
          message: this.chatInput.value,
          username: this.username
        });
        this.chatInput.value = '';
      }
    });
    
    // Listen for chat messages
    this.socket.on('chatMessage', (message: any) => {
      this.addChatMessage(message.username, message.text);
    });
  }

  addChatMessage(username: string, text: string) {
    // Limit messages to last 8
    if (this.chatMessages.length >= 8) {
      this.chatMessages[0].destroy();
      this.chatMessages.shift();
      
      // Move all messages up
      for (let i = 0; i < this.chatMessages.length; i++) {
        this.chatMessages[i].y -= 30;
      }
    }
    
    const messageY = 200 + (this.chatMessages.length * 30);
    const isMe = username === this.username;
    const messageText = this.add.text(
      130,
      this.cameras.main.height - messageY,
      `${isMe ? 'You' : username}: ${text}`,
      {
        fontSize: '12px',
        color: isMe ? '#a5f3fc' : '#ffffff',
        wordWrap: { width: 200 }
      }
    );
    
    this.chatMessages.push(messageText);
  }

  setupSocketListeners() {
    // Listen for game state updates
    this.socket.on('gameState', (gameState: any) => {
      this.updateGameState(gameState);
    });

    // Listen for new card addition to hand
    this.socket.on('cardDrawn', (card: GameCard) => {
      this.addCardToHand(card);
    });

    // Listen for move validation
    this.socket.on('invalidMove', (data: any) => {
      // Show error message
      const errorText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height - 80,
        data.message,
        {
          fontSize: '20px',
          color: '#ef4444',
          backgroundColor: '#7f1d1d',
          padding: { left: 10, right: 10, top: 5, bottom: 5 }
        }
      ).setOrigin(0.5);

      // Remove error message after 2 seconds
      this.time.delayedCall(2000, () => {
        errorText.destroy();
      });
    });

    // Listen for when a player needs to select a color for a wild card
    this.socket.on('selectColor', () => {
      this.colorSelector.setVisible(true);
    });

    // Listen for game over
    this.socket.on('gameOver', (data: any) => {
      this.showGameOver(data.winner);
    });
  }

  updateGameState(gameState: any) {
    // Update players
    this.players = gameState.players;
    
    // Update current player
    this.currentPlayer = gameState.currentPlayer;
    
    // Update direction
    this.direction = gameState.direction;
    this.directionIndicator.setFrame(this.direction === 'clockwise' ? 0 : 1);
    
    // Update top card in discard pile
    if (gameState.topCard) {
      this.topCard = gameState.topCard;
      this.updateDiscardPile();
    }

    // Update my hand
    this.myHand = gameState.hands[this.socket.id] || [];
    this.renderHand();
    
    // Update turn text
    const isMyTurn = this.currentPlayer === this.socket.id;
    this.turnText.setText(isMyTurn ? "YOUR TURN" : `${this.getPlayerName(this.currentPlayer)}'s Turn`);
    this.turnText.setBackgroundColor(isMyTurn ? '#16a34a' : '#2d3748');
    
    // Update player info displays
    this.updatePlayerInfo();
  }

  updateDiscardPile() {
    if (!this.topCard) return;
    
    this.discardPile.setVisible(true);
    this.discardPile.setTexture('cards', this.getCardFrame(this.topCard));
  }

  updatePlayerInfo() {
    // Clear any existing info texts
    Object.values(this.playerInfoTexts).forEach(text => text.destroy());
    this.playerInfoTexts = {};
    
    // Calculate positions around the table
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const radius = 300;
    
    this.players.forEach((player, index) => {
      const angle = (index / this.players.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const isCurrentPlayer = player.id === this.currentPlayer;
      const cardCount = player.cardCount;
      
      const text = this.add.text(
        x,
        y,
        `${player.username}\n${cardCount} cards`,
        {
          fontSize: '16px',
          color: isCurrentPlayer ? '#f5dd42' : '#ffffff',
          align: 'center',
          backgroundColor: isCurrentPlayer ? '#422006' : '#374151',
          padding: { left: 8, right: 8, top: 4, bottom: 4 }
        }
      ).setOrigin(0.5);
      
      this.playerInfoTexts[player.id] = text;
    });
  }

  renderHand() {
    // Clear existing card images
    this.cardImages.forEach(image => image.destroy());
    this.cardImages = [];
    
    // Calculate card positioning
    const handWidth = Math.min(this.cameras.main.width - 200, this.myHand.length * 70);
    const cardSpacing = handWidth / Math.max(1, this.myHand.length - 1);
    const startX = (this.cameras.main.width - handWidth) / 2;
    const y = this.cameras.main.height - 100;
    
    // Create card images
    this.myHand.forEach((card, index) => {
      const x = this.myHand.length > 1 
        ? startX + (cardSpacing * index) 
        : this.cameras.main.width / 2;
      
      const cardImage = this.add.image(x, y, 'cards', this.getCardFrame(card))
        .setInteractive({ useHandCursor: true })
        .setData('cardIndex', index);
      
      // Hover effect
      cardImage.on('pointerover', () => {
        cardImage.y = y - 20;
      });
      
      cardImage.on('pointerout', () => {
        cardImage.y = y;
      });
      
      // Play card on click
      cardImage.on('pointerdown', () => {
        this.playCard(index);
      });
      
      this.cardImages.push(cardImage);
    });
  }

  playCard(index: number) {
    const card = this.myHand[index];
    
    // Send play card event to server
    this.socket.emit('playCard', {
      roomCode: this.room.roomCode,
      cardIndex: index
    });
    
    // Play sound
    this.sound.play('card-place');
  }

  getCardFrame(card: GameCard): number {
    // Calculate the frame index based on card properties
    // This depends on how your spritesheet is organized
    
    let colorOffset = 0;
    switch (card.color) {
      case 'red': colorOffset = 0; break;
      case 'blue': colorOffset = 13; break;
      case 'green': colorOffset = 26; break;
      case 'yellow': colorOffset = 39; break;
      case 'wild': colorOffset = 52; break;
    }
    
    let valueOffset = 0;
    if (card.value === 'skip') valueOffset = 10;
    else if (card.value === 'reverse') valueOffset = 11;
    else if (card.value === 'draw2') valueOffset = 12;
    else if (card.value === 'wild') valueOffset = 0;
    else if (card.value === 'wild4') valueOffset = 1;
    else valueOffset = parseInt(card.value, 10);
    
    return colorOffset + valueOffset;
  }

  getPlayerName(playerId: string): string {
    const player = this.players.find(p => p.id === playerId);
    return player ? player.username : 'Unknown Player';
  }

  showGameOver(winnerId: string) {
    // Darken background
    const overlay = this.add.rectangle(
      0, 0, 
      this.cameras.main.width, 
      this.cameras.main.height, 
      0x000000, 0.7
    ).setOrigin(0);
    
    // Create win message
    const winnerName = this.getPlayerName(winnerId);
    const isYou = winnerId === this.socket.id;
    
    const messageText = isYou ? 'YOU WIN!' : `${winnerName} WINS!`;
    const message = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      messageText,
      {
        fontSize: '48px',
        color: '#f5dd42',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Return to lobby button
    const button = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 50,
      'RETURN TO LOBBY',
      {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#3b82f6',
        padding: { left: 20, right: 20, top: 10, bottom: 10 }
      }
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // Remove the chat input
        if (this.chatInput) {
          this.chatInput.remove();
        }
        
        // Return to lobby scene
        this.scene.start('MainMenuScene', {
          socket: this.socket,
          username: this.username,
          room: this.room
        });
      });
    
    // Play win sound
    this.sound.play('win');
  }

  shutdown() {
    // Remove DOM elements
    if (this.chatInput) {
      this.chatInput.remove();
    }
  }
}