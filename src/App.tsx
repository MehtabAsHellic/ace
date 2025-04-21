import React, { useEffect, useState } from 'react';
import { GameLoader } from './components/GameLoader';
import LobbyScreen from './components/LobbyScreen';
import { Socket, io } from 'socket.io-client';
import { User } from './types/User';
import { GameRoom } from './types/GameRoom';
import { MessageType } from './types/Message';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([]);

  useEffect(() => {
    const newSocket = io({
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocket(newSocket);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('roomUpdate', (room: GameRoom) => {
      setCurrentRoom(room);
    });

    newSocket.on('gameStarted', () => {
      setGameStarted(true);
    });
    
    newSocket.on('error', (message: string) => {
      setErrorMessage(message);
      // Clear error after 3 seconds
      setTimeout(() => setErrorMessage(''), 3000);
    });
    
    newSocket.on('chatMessage', (message: MessageType) => {
      setMessages(prev => [...prev, message]);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleUsernameSubmit = (name: string) => {
    if (name.trim().length === 0) {
      setErrorMessage('Username cannot be empty');
      return;
    }
    
    setUsername(name);
    setIsUsernameSet(true);
    if (socket) {
      socket.emit('setUsername', name);
    }
  };

  const createRoom = () => {
    if (socket) {
      socket.emit('createRoom', { username });
    }
  };

  const joinRoom = (roomCode: string) => {
    if (socket) {
      socket.emit('joinRoom', { roomCode, username });
    }
  };

  const leaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit('leaveRoom', { roomCode: currentRoom.roomCode });
      setCurrentRoom(null);
    }
  };

  const startGame = () => {
    if (socket && currentRoom) {
      socket.emit('startGame', { roomCode: currentRoom.roomCode });
    }
  };

  const sendMessage = (message: string) => {
    if (socket && currentRoom && message.trim().length > 0) {
      socket.emit('sendMessage', { 
        roomCode: currentRoom.roomCode, 
        message, 
        username 
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {!isConnected ? (
        <div className="flex-1 flex items-center justify-center">
          <GameLoader message="Connecting to server..." />
        </div>
      ) : !isUsernameSet ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
            <h1 className="text-3xl font-bold text-center mb-6 text-yellow-400">Welcome to Ace</h1>
            <p className="mb-4 text-center text-gray-300">Enter your username to get started</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUsernameSubmit(username);
            }} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                maxLength={15}
              />
              <button 
                type="submit" 
                className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 rounded font-medium transition duration-200"
              >
                Continue
              </button>
            </form>
            
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-300">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      ) : !gameStarted ? (
        <LobbyScreen 
          username={username}
          currentRoom={currentRoom}
          createRoom={createRoom}
          joinRoom={joinRoom}
          leaveRoom={leaveRoom}
          startGame={startGame}
          errorMessage={errorMessage}
          messages={messages}
          sendMessage={sendMessage}
        />
      ) : (
        <div id="game-container" className="flex-1 flex items-center justify-center">
          <GameLoader message="Loading game..." />
        </div>
      )}
    </div>
  );
}