import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Card } from './Card';
import { sendPlayCard, sendDrawCard } from '../socket';

export function PlayerHand() {
  const { 
    currentRoom, 
    getMyPlayer, 
    isMyTurn,
    selectedCard,
    setSelectedCard,
    setShowColorPicker,
    selectedColor,
    setSelectedColor
  } = useGameStore();
  
  const myPlayer = getMyPlayer();
  const myTurn = isMyTurn();
  
  if (!currentRoom || !myPlayer) {
    return null;
  }
  
  const { hand } = myPlayer;
  
  const handlePlayCard = async (index: number) => {
    if (!myTurn) return;
    
    const card = hand[index];
    
    // If it's a wild card, we need to show the color picker
    if (card.color === 'wild') {
      setSelectedCard(index);
      setShowColorPicker(true);
      return;
    }
    
    try {
      await sendPlayCard(index);
      setSelectedCard(null);
    } catch (error) {
      console.error('Failed to play card:', error);
    }
  };
  
  const handleDrawCard = async () => {
    if (!myTurn) return;
    
    try {
      await sendDrawCard();
    } catch (error) {
      console.error('Failed to draw card:', error);
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex items-center justify-between w-full">
        <h2 className="text-lg font-semibold text-white">Your Hand</h2>
        
        <div className="flex items-center">
          {myTurn ? (
            <div className="flex items-center">
              <span className="bg-green-600 h-3 w-3 rounded-full animate-pulse mr-2"></span>
              <span className="text-green-400 font-medium">Your Turn</span>
            </div>
          ) : (
            <span className="text-gray-400">Waiting for your turn...</span>
          )}
          
          <button
            onClick={handleDrawCard}
            disabled={!myTurn}
            className={`ml-4 px-3 py-1 rounded text-sm font-medium ${
              myTurn
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Draw Card
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {hand.map((card, index) => (
          <div 
            key={card.id} 
            className={`transform transition-transform ${myTurn ? 'hover:-translate-y-4 cursor-pointer' : ''} ${selectedCard === index ? '-translate-y-4' : ''}`}
            onClick={() => myTurn && handlePlayCard(index)}
          >
            <Card 
              card={card} 
              size="lg" 
              interactive={myTurn}
            />
          </div>
        ))}
      </div>
    </div>
  );
}