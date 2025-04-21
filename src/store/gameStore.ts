import { create } from 'zustand';
import { Room, Player, Card, Message, RoomListItem } from '../socket';

interface GameState {
  // Socket connection
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
  
  // Player
  playerName: string;
  setPlayerName: (name: string) => void;
  
  // Room
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;
  
  // Room list
  roomList: RoomListItem[];
  setRoomList: (rooms: RoomListItem[]) => void;
  
  // Game
  selectedCard: number | null;
  setSelectedCard: (index: number | null) => void;
  
  // Game state helpers
  getMyPlayer: () => Player | undefined;
  isMyTurn: () => boolean;
  getWinner: () => Player | undefined;
  
  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  
  // Game end
  winner: { id: string; name: string } | null;
  setWinner: (winner: { id: string; name: string } | null) => void;
  
  // UI state
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Socket connection
  isConnected: false,
  setIsConnected: (isConnected) => set({ isConnected }),
  
  // Player
  playerName: '',
  setPlayerName: (name) => {
    localStorage.setItem('playerName', name);
    set({ playerName: name });
  },
  
  // Room
  currentRoom: null,
  setCurrentRoom: (room) => set({ currentRoom: room }),
  
  // Room list
  roomList: [],
  setRoomList: (rooms) => set({ roomList: rooms }),
  
  // Game
  selectedCard: null,
  setSelectedCard: (index) => set({ selectedCard: index }),
  
  // Game state helpers
  getMyPlayer: () => {
    const state = get();
    if (!state.currentRoom) return undefined;
    
    return state.currentRoom.players.find(
      (player) => player.name === state.playerName
    );
  },
  
  isMyTurn: () => {
    const state = get();
    const myPlayer = state.getMyPlayer();
    const room = state.currentRoom;
    
    if (!myPlayer || !room || room.currentPlayer === null) return false;
    
    const currentPlayerObj = room.players[room.currentPlayer];
    return currentPlayerObj?.id === myPlayer.id;
  },
  
  getWinner: () => {
    const state = get();
    if (!state.currentRoom) return undefined;
    
    return state.currentRoom.players.find(
      (player) => player.hand.length === 0
    );
  },
  
  // Messages
  messages: [],
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  // Game end
  winner: null,
  setWinner: (winner) => set({ winner }),
  
  // UI state
  showColorPicker: false,
  setShowColorPicker: (show) => set({ showColorPicker: show }),
  selectedColor: null,
  setSelectedColor: (color) => set({ selectedColor: color }),
}));