import React, { useState } from 'react';
import { GameRoom } from '../types/GameRoom';
import { MessageType } from '../types/Message';
import { ChatBox } from './ChatBox';
import { MessageCircle, ShieldAlert, Users } from 'lucide-react';

interface LobbyScreenProps {
  username: string;
  currentRoom: GameRoom | null;
  createRoom: () => void;
  joinRoom: (roomCode: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  errorMessage: string;
  messages: MessageType[];
  sendMessage: (message: string) => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({
  username,
  currentRoom,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  errorMessage,
  messages,
  sendMessage
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [activeTab, setActiveTab] = useState<'players' | 'chat'>('players');

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-yellow-400">Ace</h1>
        <p className="text-gray-300 mt-2">A multiplayer card game</p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded flex items-center">
          <ShieldAlert className="mr-2 text-red-400" size={20} />
          <span className="text-red-300">{errorMessage}</span>
        </div>
      )}

      {!currentRoom ? (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome, {username}!</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 p-5 rounded-lg">
              <h3 className="text-xl font-medium mb-3 text-yellow-400">Create a Room</h3>
              <p className="text-gray-300 mb-4">Start a new game and invite your friends to join.</p>
              <button
                onClick={createRoom}
                className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 rounded font-medium transition duration-200"
              >
                Create Room
              </button>
            </div>
            <div className="bg-gray-700 p-5 rounded-lg">
              <h3 className="text-xl font-medium mb-3 text-blue-400">Join a Room</h3>
              <p className="text-gray-300 mb-4">Enter a room code to join an existing game.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  joinRoom(roomCode);
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit room code"
                  className="w-full p-3 rounded bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                />
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 rounded font-medium transition duration-200"
                >
                  Join Room
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Room: <span className="text-yellow-400">{currentRoom.roomCode}</span></h2>
              <p className="text-gray-300">Share this code with friends to join</p>
            </div>
            <button
              onClick={leaveRoom}
              className="py-2 px-4 bg-red-500 hover:bg-red-600 rounded font-medium transition duration-200"
            >
              Leave Room
            </button>
          </div>

          <div className="mb-4 border-b border-gray-700">
            <div className="flex space-x-4">
              <button
                className={`pb-3 px-4 font-medium flex items-center ${activeTab === 'players'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-gray-200'
                  }`}
                onClick={() => setActiveTab('players')}
              >
                <Users size={18} className="mr-2" />
                Players ({currentRoom.players.length})
              </button>
              <button
                className={`pb-3 px-4 font-medium flex items-center ${activeTab === 'chat'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-gray-200'
                  }`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageCircle size={18} className="mr-2" />
                Chat
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {activeTab === 'players' ? (
              <>
                <div className="mb-4 flex-1">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">Players in Room</h3>
                    <ul className="space-y-2">
                      {currentRoom.players.map((player, index) => (
                        <li key={index} className="flex items-center p-2 bg-gray-600 rounded">
                          <div className={`h-3 w-3 rounded-full mr-3 ${player.username === currentRoom.host ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                          <span className="flex-1">{player.username}</span>
                          {player.username === currentRoom.host && (
                            <span className="text-xs font-medium text-yellow-400 px-2 py-1 bg-yellow-400 bg-opacity-10 rounded">Host</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-auto">
                  {currentRoom.host === username ? (
                    <button
                      onClick={startGame}
                      disabled={currentRoom.players.length < 2}
                      className={`w-full py-3 px-4 rounded font-medium transition duration-200 ${currentRoom.players.length >= 2
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-gray-600 cursor-not-allowed'
                        }`}
                    >
                      {currentRoom.players.length >= 2 ? 'Start Game' : 'Need at least 2 players to start'}
                    </button>
                  ) : (
                    <div className="text-center p-3 bg-gray-700 rounded">
                      Waiting for host to start the game...
                    </div>
                  )}
                </div>
              </>
            ) : (
              <ChatBox
                messages={messages}
                sendMessage={sendMessage}
                username={username}
              />
            )}
          </div>
        </div>
      )}

      <div className="text-center text-gray-500 text-sm mt-4">
        © 2025 Ace Card Game. All rights reserved.
      </div>
    </div>
  );
};

export default LobbyScreen;