import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { socket, sendJoinRoom, sendLeaveRoom, sendMessage } from '../socket';
import { PlayerHand } from '../components/PlayerHand';
import { GameBoard } from '../components/GameBoard';
import { ChatWindow } from '../components/ChatWindow';
import { ColorPicker } from '../components/ColorPicker';
import { OtherPlayers } from '../components/OtherPlayers';

export function Game() {
  const { roomId } = useParams<{ roomId: string }>();
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();
  
  const { 
    playerName, 
    currentRoom, 
    setCurrentRoom, 
    winner,
    setWinner,
    showColorPicker,
    addMessage
  } = useGameStore();
  
  // Join/rejoin room on initial load
  useEffect(() => {
    const joinRoom = async () => {
      if (!roomId || !playerName) return;
      
      try {
        const { room } = await sendJoinRoom(roomId, playerName);
        setCurrentRoom(room);
        
        // If the game hasn't started, redirect to lobby
        if (room.gameState === 'lobby') {
          navigate(`/lobby/${roomId}`);
        }
      } catch (error) {
        console.error('Failed to join game:', error);
        navigate('/');
      }
    };
    
    if (!currentRoom || currentRoom.id !== roomId) {
      joinRoom();
    }
    
    // Listen for game updates
    socket.on('game-updated', (room) => {
      setCurrentRoom(room);
    });
    
    // Listen for game end
    socket.on('game-ended', (data) => {
      setWinner(data);
    });
    
    // Listen for new messages
    socket.on('new-message', (message) => {
      addMessage(message);
    });
    
    return () => {
      socket.off('game-updated');
      socket.off('game-ended');
      socket.off('new-message');
    };
  }, [roomId, playerName, navigate, setCurrentRoom, currentRoom, setWinner, addMessage]);
  
  // Handle leaving the game
  const handleLeaveGame = async () => {
    try {
      await sendLeaveRoom();
      setCurrentRoom(null);
      navigate('/');
    } catch (error) {
      console.error('Failed to leave game:', error);
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
  
  // Handle game restart
  const handleRestartGame = () => {
    // Redirect back to lobby
    navigate(`/lobby/${roomId}`);
  };
  
  if (!currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">Loading game...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={handleLeaveGame}
            className="text-gray-300 hover:text-white mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Ace</h1>
            <div className="text-gray-400 text-sm">
              Room: <span className="font-mono">{roomId}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowChat(!showChat)}
          className="text-gray-300 hover:text-white flex items-center"
        >
          <MessageCircle className="w-5 h-5 mr-1" />
          <span className="hidden sm:inline">Chat</span>
        </button>
      </div>
      
      {/* Game Area */}
      <div className="flex-grow flex overflow-hidden">
        <div className={`flex-grow flex flex-col ${showChat ? 'sm:w-3/4' : 'w-full'}`}>
          {/* Game board */}
          <div className="flex-grow p-4 relative">
            {/* Other players */}
            <OtherPlayers />
            
            {/* Game board */}
            <GameBoard />
            
            {/* Winner overlay */}
            {winner && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {winner.id === socket.id
                      ? '🎉 You Win! 🎉'
                      : `${winner.name} Wins!`}
                  </h2>
                  <p className="text-gray-300 mb-6">
                    {winner.id === socket.id
                      ? 'Congratulations! You were the first to play all your cards.'
                      : `${winner.name} was the first to play all their cards.`}
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={handleRestartGame}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                      Return to Lobby
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Color picker overlay */}
            {showColorPicker && <ColorPicker />}
          </div>
          
          {/* Player hand */}
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <PlayerHand />
          </div>
        </div>
        
        {/* Chat sidebar - hidden on small screens unless toggled */}
        {showChat && (
          <div className="w-full sm:w-1/4 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
            <div className="p-4 border-b border-gray-700 flex items-center">
              <MessageCircle className="w-5 h-5 text-indigo-400 mr-2" />
              <h2 className="text-lg font-semibold text-white">Chat</h2>
              <button 
                onClick={() => setShowChat(false)}
                className="ml-auto text-gray-400 hover:text-white sm:hidden"
              >
                &times;
              </button>
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
        )}
      </div>
    </div>
  );
}