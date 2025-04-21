import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Card } from './Card';

export function GameBoard() {
  const { currentRoom } = useGameStore();
  
  if (!currentRoom || currentRoom.discardPile.length === 0) {
    return null;
  }
  
  const topCard = currentRoom.discardPile[currentRoom.discardPile.length - 1];
  const currentPlayerName = currentRoom.players[currentRoom.currentPlayer || 0]?.name || 'Unknown';
  
  // Calculate cards remaining in deck
  const deckCount = currentRoom.deck.length;
  
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
      <div className="text-center mb-4">
        <p className="text-gray-300">Current player: <span className="font-semibold text-white">{currentPlayerName}</span></p>
        <p className="text-gray-400 text-sm">Direction: {currentRoom.direction === 1 ? 'Clockwise' : 'Counter-Clockwise'}</p>
      </div>
      
      <div className="flex items-center justify-center space-x-6 sm:space-x-12 mb-6">
        {/* Draw pile */}
        <div className="text-center">
          <div className="relative">
            {/* Fake stacked cards for visual effect */}
            <div className="absolute -left-1 -top-1 w-24 h-36 bg-indigo-800 rounded-lg transform rotate-6"></div>
            <div className="absolute -left-0.5 -top-0.5 w-24 h-36 bg-indigo-700 rounded-lg transform rotate-3"></div>
            
            <div className="relative w-24 h-36 bg-indigo-600 rounded-lg shadow-lg flex items-center justify-center">
              <div className="text-white font-bold text-lg">ACE</div>
            </div>
          </div>
          <p className="text-gray-400 mt-2 text-sm">{deckCount} cards left</p>
        </div>
        
        {/* Discard pile */}
        <div className="text-center">
          <Card card={topCard} size="lg" />
          <p className="text-gray-400 mt-2 text-sm">Discard Pile</p>
          
          {topCard.color !== 'wild' && (
            <div className="mt-2">
              <span 
                className="inline-block px-2 py-1 rounded text-xs font-semibold text-white"
                style={{ backgroundColor: getColorHex(currentRoom.currentColor || '') }}
              >
                Current color: {currentRoom.currentColor}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getColorHex(color: string): string {
  switch (color) {
    case 'red': return '#e53e3e';
    case 'blue': return '#3182ce';
    case 'green': return '#38a169';
    case 'yellow': return '#d69e2e';
    default: return '#4a5568';
  }
}