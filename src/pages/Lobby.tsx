import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, PlayCircle, Check, X, MessageCircle, Send } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { socket, sendJoinRoom, sendLeaveRoom, sendToggleReady, sendStartGame, sendMessage, Room } from '../socket';
import { ChatWindow } from '../components/ChatWindow';

export function Lobby() {
  const { roomId } = useParams<{ roomId: string }>();
  const [chatInput, setChatInput] = useState('');
  const navigate = useNavigate();
  
  const { 
    playerName, 
    currentRoom, 
    setCurrentRoom, 
    getMyPlayer,
    messages,
    addMessage
  } = useGameStore();
  
  const myPlayer = getMyPlayer();
  
  // Join room on initial load
  useEffect(() => {
    const joinRoom = async () => {
      if (!roomId || !playerName) return;
      
      try {
        const { room } = await sendJoinRoom(roomId, playerName);
        setCurrentRoom(room);
      } catch (error) {
        console.error('Failed to join room:', error);
        navigate('/');
      }
    };
    
    if (!currentRoom || currentRoom.id !== roomId) {
      joinRoom();
    }
    
    // Listen for room updates
    socket.on('room-updated', (room: Room) => {
      setCurrentRoom(room);
    });
    
    // Listen for game start
    socket.on('game-started', (room: Room) => {
      setCurrentRoom(room);
      navigate(`/game/${roomId}`);
    });
    
    // Listen for new messages
    socket.on('new-message', (message) => {
      addMessage(message);
    });
    
    return () => {
      socket.off('room-updated');
      socket.off('game-started');
      socket.off('new-message');
    };
  }, [roomId, playerName, navigate, setCurrentRoom, currentRoom, addMessage]);
  
  // Handle leaving the room
  const handleLeaveRoom = async () => {
    try {
      await sendLeaveRoom();
      setCurrentRoom(null);
      navigate('/');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };
  
  // Toggle ready status
  const handleToggleReady = async () => {
    if (!myPlayer) return;
    
    try {
      await sendToggleReady(!myPlayer.isReady);
    } catch (error) {
      console.error('Failed to toggle ready status:', error);
    }
  };
  
  // Start the game
  const handleStartGame = async () => {
    try {
      await sendStartGame();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };
  
  // Send a chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatInput.trim()) return;
    
    try {
      await sendMessage(chatInput);
      setChatInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  if (!currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">Loading lobby...</h2>
        </div>
      </div>
    );
  }
  
  const allPlayersReady = currentRoom.players.length >= 2 && 
                         currentRoom.players.every(player => player.isReady);
  const isHost = myPlayer?.isHost;
  const canStartGame = isHost && allPlayersReady;
  
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Header with room info */}
        <div className="md:col-span-3 bg-gray-800 rounded-lg p-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={handleLeaveRoom}
              className="text-gray-300 hover:text-white mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Game Lobby</h1>
              <div className="flex items-center text-gray-400 text-sm">
                <span className="font-mono bg-gray-700 px-2 py-1 rounded mr-2">{roomId}</span>
                <button className="underline hover:text-white" onClick={() => navigator.clipboard.writeText(roomId || '')}>
                  Copy
                </button>
              </div>
            </div>
          </div>
          
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className={`flex items-center px-4 py-2 rounded-md text-white ${
                canStartGame
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Start Game
            </button>
          )}
        </div>
        
        {/* Players list */}
        <div className="md:col-span-2 bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-indigo-400 mr-2" />
            <h2 className="text-lg font-semibold text-white">Players</h2>
            <span className="ml-2 text-gray-400 text-sm">
              ({currentRoom.players.length}/10)
            </span>
          </div>
          
          <div className="space-y-3">
            {currentRoom.players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-md ${
                  player.id === myPlayer?.id ? 'bg-indigo-900/30' : 'bg-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {player.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <p className="text-white font-medium">{player.name}</p>
                      {player.isHost && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-600 text-white text-xs">
                          Host
                        </span>
                      )}
                    </div>
                    {player.id === myPlayer?.id && (
                      <p className="text-gray-400 text-xs">You</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  {player.isReady ? (
                    <span className="flex items-center text-green-400 text-sm">
                      <Check className="w-4 h-4 mr-1" />
                      Ready
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-400 text-sm">
                      <X className="w-4 h-4 mr-1" />
                      Not Ready
                    </span>
                  )}
                  
                  {player.id === myPlayer?.id && (
                    <button
                      onClick={handleToggleReady}
                      className={`ml-3 px-3 py-1 rounded text-sm font-medium ${
                        player.isReady
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {player.isReady ? 'Cancel' : 'Ready Up'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {currentRoom.players.length < 2 && (
            <div className="mt-4 border border-dashed border-gray-600 rounded-md p-4 text-center">
              <p className="text-gray-300">
                Waiting for more players to join. Share your room code:
                <span className="font-mono block mt-2 text-lg text-white">{roomId}</span>
              </p>
            </div>
          )}
          
          {isHost && !allPlayersReady && currentRoom.players.length >= 2 && (
            <div className="mt-4 border border-dashed border-gray-600 rounded-md p-4 text-center">
              <p className="text-gray-300">
                Waiting for all players to ready up before starting the game.
              </p>
            </div>
          )}
        </div>
        
        {/* Chat */}
        <div className="bg-gray-800 rounded-lg flex flex-col h-full">
          <div className="p-4 border-b border-gray-700 flex items-center">
            <MessageCircle className="w-5 h-5 text-indigo-400 mr-2" />
            <h2 className="text-lg font-semibold text-white">Chat</h2>
          </div>
          
          <ChatWindow messages={currentRoom.messages} />
          
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 mt-auto">
            <div className="flex">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow rounded-l-md bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
        
        {/* Game rules */}
        <div className="md:col-span-3 bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Game Rules</h2>
          <div className="text-gray-300 space-y-2 text-sm">
            <p>• Each player starts with 7 cards.</p>
            <p>• Match cards by the same color or number.</p>
            <p>• Special cards: Skip (skip next player), Reverse (change direction), Draw 2 (next player draws 2 cards and skips turn).</p>
            <p>• Wild cards can be played anytime, and you choose the color.</p>
            <p>• Wild Draw 4 - next player draws 4 cards and loses their turn.</p>
            <p>• First player to get rid of all their cards wins!</p>
          </div>
        </div>
      </div>
    </div>
  );
}