import React from 'react';
import { useGameStore } from '../store/gameStore';
import { sendPlayCard } from '../socket';

export function ColorPicker() {
  const { selectedCard, setSelectedCard, setShowColorPicker, setSelectedColor } = useGameStore();
  
  const handleColorSelect = async (color: string) => {
    if (selectedCard === null) return;
    
    try {
      await sendPlayCard(selectedCard, color);
      setSelectedCard(null);
      setShowColorPicker(false);
      setSelectedColor(null);
    } catch (error) {
      console.error('Failed to play wild card:', error);
    }
  };
  
  const colors = [
    { name: 'red', bgClass: 'bg-red-600', hoverClass: 'hover:bg-red-700' },
    { name: 'blue', bgClass: 'bg-blue-600', hoverClass: 'hover:bg-blue-700' },
    { name: 'green', bgClass: 'bg-green-600', hoverClass: 'hover:bg-green-700' },
    { name: 'yellow', bgClass: 'bg-yellow-600', hoverClass: 'hover:bg-yellow-700', textClass: 'text-black' }
  ];
  
  return (
    <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-40">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold text-white mb-4 text-center">Choose a color</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => handleColorSelect(color.name)}
              className={`${color.bgClass} ${color.hoverClass} ${color.textClass || 'text-white'} font-bold py-8 px-4 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center`}
            >
              <div className="text-2xl mb-1 capitalize">{color.name}</div>
            </button>
          ))}
        </div>
        
        <button
          onClick={() => {
            setSelectedCard(null);
            setShowColorPicker(false);
          }}
          className="mt-6 w-full bg-gray-700 text-white py-2 rounded-md hover:bg-gray-600 transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}