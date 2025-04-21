import React from 'react';
import { useGameStore } from '../store/gameStore';

export function OtherPlayers() {
  const { currentRoom, getMyPlayer } = useGameStore();
  
  if (!currentRoom) return null;
  
  const myPlayer = getMyPlayer();
  if (!myPlayer) return null;
  
  // Filter out the current player
  const otherPlayers = currentRoom.players.filter(player => player.id !== myPlayer.id);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
      {otherPlayers.map((player, index) => {
        const isCurrentPlayer = currentRoom.currentPlayer !== null && 
                               currentRoom.players[currentRoom.currentPlayer].id === player.id;
        
        return (
          <div 
            key={player.id}
            className={`bg-gray-800 rounded-lg p-3 flex items-center ${
              isCurrentPlayer ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {player.name.substring(0, 1).toUpperCase()}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-white font-medium truncate">{player.name}</p>
              <p className="text-xs text-gray-400">{player.hand.length} cards</p>
            </div>
            {isCurrentPlayer && (
              <span className="ml-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            )}
          </div>
        );
      })}
    </div>
  );
}