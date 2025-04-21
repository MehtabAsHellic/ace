import { io } from 'socket.io-client';

// Get server URL from environment or use default
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// Create socket instance
export const socket = io(URL, {
  autoConnect: false
});

// Socket event types
export interface ServerToClientEvents {
  'room-updated': (room: Room) => void;
  'room-list-updated': (rooms: RoomListItem[]) => void;
  'game-started': (room: Room) => void;
  'game-updated': (room: Room) => void;
  'game-ended': (data: { winnerId: string; winnerName: string }) => void;
  'new-message': (message: Message) => void;
}

export interface ClientToServerEvents {
  'create-room': (data: { playerName: string }, callback: (response: { success: boolean; roomId?: string; room?: Room; error?: string }) => void) => void;
  'join-room': (data: { roomId: string; playerName: string }, callback: (response: { success: boolean; room?: Room; error?: string }) => void) => void;
  'leave-room': (callback?: (response: { success: boolean; error?: string }) => void) => void;
  'toggle-ready': (data: { isReady: boolean }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'start-game': (callback?: (response: { success: boolean; error?: string }) => void) => void;
  'play-card': (data: { cardIndex: number; chosenColor?: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'draw-card': (callback?: (response: { success: boolean; error?: string }) => void) => void;
  'send-message': (data: { message: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'get-room-list': (callback: (rooms: RoomListItem[]) => void) => void;
}

// Game types
export interface Card {
  id: string;
  color: string;
  value: string;
}

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  hand: Card[];
}

export interface Message {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

export interface Room {
  id: string;
  hostId: string;
  players: Player[];
  gameState: 'lobby' | 'playing' | 'ended';
  deck: Card[];
  discardPile: Card[];
  currentPlayer: number | null;
  direction: number;
  currentColor: string | null;
  currentValue: string | null;
  messages: Message[];
  createdAt: number;
}

export interface RoomListItem {
  id: string;
  hostName: string;
  playerCount: number;
  createdAt: number;
}

// Helper functions
export function sendCreateRoom(playerName: string): Promise<{ roomId: string; room: Room }> {
  return new Promise((resolve, reject) => {
    socket.emit('create-room', { playerName }, (response) => {
      if (response.success && response.roomId && response.room) {
        resolve({ roomId: response.roomId, room: response.room });
      } else {
        reject(new Error(response.error || 'Failed to create room'));
      }
    });
  });
}

export function sendJoinRoom(roomId: string, playerName: string): Promise<{ room: Room }> {
  return new Promise((resolve, reject) => {
    socket.emit('join-room', { roomId, playerName }, (response) => {
      if (response.success && response.room) {
        resolve({ room: response.room });
      } else {
        reject(new Error(response.error || 'Failed to join room'));
      }
    });
  });
}

export function sendLeaveRoom(): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.emit('leave-room', (response) => {
      if (response?.success) {
        resolve();
      } else {
        reject(new Error(response?.error || 'Failed to leave room'));
      }
    });
  });
}

export function sendToggleReady(isReady: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.emit('toggle-ready', { isReady }, (response) => {
      if (response?.success) {
        resolve();
      } else {
        reject(new Error(response?.error || 'Failed to toggle ready state'));
      }
    });
  });
}

export function sendStartGame(): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.emit('start-game', (response) => {
      if (response?.success) {
        resolve();
      } else {
        reject(new Error(response?.error || 'Failed to start game'));
      }
    });
  });
}

export function sendPlayCard(cardIndex: number, chosenColor?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.emit('play-card', { cardIndex, chosenColor }, (response) => {
      if (response?.success) {
        resolve();
      } else {
        reject(new Error(response?.error || 'Failed to play card'));
      }
    });
  });
}

export function sendDrawCard(): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.emit('draw-card', (response) => {
      if (response?.success) {
        resolve();
      } else {
        reject(new Error(response?.error || 'Failed to draw card'));
      }
    });
  });
}

export function sendMessage(message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.emit('send-message', { message }, (response) => {
      if (response?.success) {
        resolve();
      } else {
        reject(new Error(response?.error || 'Failed to send message'));
      }
    });
  });
}

export function getRoomList(): Promise<RoomListItem[]> {
  return new Promise((resolve) => {
    socket.emit('get-room-list', (rooms) => {
      resolve(rooms);
    });
  });
}