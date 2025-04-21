import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play as PlayCards, Users, Plus } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { sendCreateRoom, sendJoinRoom, getRoomList, RoomListItem } from '../socket';

export function Home() {
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRoomList, setShowRoomList] = useState(false);
  
  const { setPlayerName, playerName, roomList, setRoomList } = useGameStore();
  const navigate = useNavigate();
  
  // Initialize player name from localStorage if available
  useEffect(() => {
    if (playerName) {
      setPlayerNameInput(playerName);
    }
  }, [playerName]);
  
  // Load room list when opening the list
  useEffect(() => {
    if (showRoomList) {
      loadRoomList();
    }
  }, [showRoomList]);
  
  const loadRoomList = async () => {
    try {
      const rooms = await getRoomList();
      setRoomList(rooms);
    } catch (error) {
      console.error('Failed to load room list:', error);
    }
  };
  
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!playerNameInput.trim()) {
      setError('Please enter your name');
      return;
    }
    
    try {
      setIsLoading(true);
      setPlayerName(playerNameInput);
      
      const { roomId } = await sendCreateRoom(playerNameInput);
      navigate(`/lobby/${roomId}`);
    } catch (error) {
      setError('Failed to create room');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!playerNameInput.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!joinRoomId.trim()) {
      setError('Please enter a room code');
      return;
    }
    
    try {
      setIsLoading(true);
      setPlayerName(playerNameInput);
      
      await sendJoinRoom(joinRoomId.toUpperCase(), playerNameInput);
      navigate(`/lobby/${joinRoomId.toUpperCase()}`);
    } catch (error) {
      setError('Failed to join room. Check your room code and try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleJoinExistingRoom = async (roomId: string) => {
    setError('');
    
    if (!playerNameInput.trim()) {
      setError('Please enter your name');
      return;
    }
    
    try {
      setIsLoading(true);
      setPlayerName(playerNameInput);
      
      await sendJoinRoom(roomId, playerNameInput);
      navigate(`/lobby/${roomId}`);
    } catch (error) {
      setError('Failed to join room. The room may no longer be available.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <PlayCards className="mx-auto h-20 w-20 text-red-500" />
          <h1 className="mt-6 text-4xl font-extrabold text-white">Ace</h1>
          <p className="mt-2 text-xl text-gray-300">A multiplayer card game</p>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        
        <div className="mt-8 bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-300">
              Your Name
            </label>
            <input
              id="playerName"
              name="playerName"
              type="text"
              required
              value={playerNameInput}
              onChange={(e) => setPlayerNameInput(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter your name"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Room
            </button>
            
            <button
              onClick={() => setShowRoomList(!showRoomList)}
              className="w-full flex justify-center py-3 px-4 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-300 bg-transparent hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Users className="h-5 w-5 mr-2" />
              {showRoomList ? 'Hide Rooms' : 'Browse Rooms'}
            </button>
          </div>
          
          {showRoomList && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Available Rooms</h3>
              
              {roomList.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">No active rooms available</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {roomList.map((room) => (
                    <div 
                      key={room.id}
                      className="bg-gray-700 rounded-md p-3 flex justify-between items-center cursor-pointer hover:bg-gray-600 transition"
                      onClick={() => handleJoinExistingRoom(room.id)}
                    >
                      <div>
                        <p className="text-white font-medium">{room.hostName}'s Room</p>
                        <p className="text-gray-400 text-xs">
                          {room.playerCount} {room.playerCount === 1 ? 'player' : 'players'}
                        </p>
                      </div>
                      <span className="text-gray-300 text-sm font-mono bg-gray-800 px-2 py-1 rounded">
                        {room.id}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={loadRoomList}
                className="w-full mt-3 flex justify-center py-2 px-4 border border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-transparent hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Refresh List
              </button>
            </div>
          )}
          
          {!showRoomList && (
            <div className="mt-6">
              <div className="flex items-center">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-400">or</span>
                <div className="flex-grow border-t border-gray-600"></div>
              </div>
              
              <form onSubmit={handleJoinRoom} className="mt-4">
                <label htmlFor="roomCode" className="block text-sm font-medium text-gray-300">
                  Join with Room Code
                </label>
                <div className="mt-1 flex">
                  <input
                    id="roomCode"
                    name="roomCode"
                    type="text"
                    required
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                    className="block w-full rounded-l-md bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                    placeholder="ENTER CODE"
                    maxLength={6}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    Join
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}