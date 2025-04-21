export interface GameRoom {
  roomCode: string;
  host: string;
  players: {
    id: string;
    username: string;
  }[];
  gameStarted: boolean;
}