import Phaser from 'phaser';
import { GameRoom } from '../../types/GameRoom';

interface MainMenuSceneData {
  socket: SocketIOClient.Socket;
  username: string;
  room: GameRoom;
}

export default class MainMenuScene extends Phaser.Scene {
  private socket!: SocketIOClient.Socket;
  private username!: string;
  private room!: GameRoom;
  private startButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  init(data: MainMenuSceneData) {
    this.socket = data.socket;
    this.username = data.username;
    this.room = data.room;
  }

  create() {
    // Title
    this.add.text(
      this.cameras.main.width / 2,
      100,
      'ACE',
      {
        fontSize: '64px',
        color: '#f5dd42',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Subtitle
    this.add.text(
      this.cameras.main.width / 2,
      160,
      'A multiplayer card game',
      {
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    // Room code display
    this.add.text(
      this.cameras.main.width / 2,
      220,
      `ROOM CODE: ${this.room.roomCode}`,
      {
        fontSize: '32px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    // Player list title
    this.add.text(
      this.cameras.main.width / 2,
      280,
      'Players:',
      {
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    // Player list (will be updated)
    const yStart = 320;
    this.room.players.forEach((player, index) => {
      const isHost = player.username === this.room.host;
      const playerText = this.add.text(
        this.cameras.main.width / 2,
        yStart + (index * 40),
        `${player.username}${isHost ? ' (Host)' : ''}`,
        {
          fontSize: '20px',
          color: isHost ? '#f5dd42' : '#ffffff'
        }
      ).setOrigin(0.5);
    });

    // Start button (only for host)
    if (this.username === this.room.host) {
      this.startButton = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height - 100,
        'START GAME',
        {
          fontSize: '32px',
          color: '#ffffff',
          backgroundColor: '#38a169',
          padding: {
            left: 20,
            right: 20,
            top: 10,
            bottom: 10
          }
        }
      )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.sound.play('button-click');
          this.socket.emit('startGame', { roomCode: this.room.roomCode });
        })
        .on('pointerover', () => this.startButton.setStyle({ color: '#f5dd42' }))
        .on('pointerout', () => this.startButton.setStyle({ color: '#ffffff' }));
    } else {
      this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height - 100,
        'Waiting for host to start the game...',
        {
          fontSize: '24px',
          color: '#cccccc'
        }
      ).setOrigin(0.5);
    }

    // Handle game starting
    this.socket.on('gameStarted', () => {
      this.scene.start('GameScene', {
        socket: this.socket,
        username: this.username,
        room: this.room
      });
    });

    // Handle room updates (for new players joining)
    this.socket.on('roomUpdate', (updatedRoom: GameRoom) => {
      this.room = updatedRoom;
      // Update player list (would need to clear and redraw)
    });
  }
}