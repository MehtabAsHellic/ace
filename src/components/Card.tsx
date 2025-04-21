import React from 'react';
import { Card as CardType } from '../socket';

interface CardProps {
  card: CardType;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export function Card({ card, size = 'md', interactive = false }: CardProps) {
  const { color, value } = card;
  
  const cardClass = `
    rounded-lg shadow-lg overflow-hidden
    ${interactive ? 'cursor-pointer hover:shadow-xl' : ''}
    ${size === 'sm' ? 'w-12 h-18' : size === 'md' ? 'w-16 h-24' : 'w-24 h-36'}
  `;
  
  const bgColor = getBgColor(color);
  const textColor = getTextColor(color);
  
  // Special styling for wild cards
  if (color === 'wild') {
    return (
      <div className={`${cardClass} bg-gray-800 flex flex-col`}>
        <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-px">
          <div className="bg-red-600 flex items-center justify-center"></div>
          <div className="bg-blue-600 flex items-center justify-center"></div>
          <div className="bg-yellow-600 flex items-center justify-center"></div>
          <div className="bg-green-600 flex items-center justify-center"></div>
        </div>
        <div className="bg-white p-1 text-center">
          <span className="font-bold text-black">
            {value === 'wild' ? 'WILD' : '+4'}
          </span>
        </div>
      </div>
    );
  }
  
  const displayValue = getDisplayValue(value);
  
  return (
    <div 
      className={`${cardClass} ${bgColor} ${textColor} flex flex-col`} 
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      <div className="p-1 flex justify-between items-start">
        <span className="text-lg font-bold">{displayValue}</span>
        <span className="text-lg font-bold hidden sm:block">{displayValue}</span>
      </div>
      
      <div className="flex-grow flex items-center justify-center">
        {isSpecialCard(value) ? (
          <div className="text-center p-1">
            <span className="font-bold text-xl">{getSpecialSymbol(value)}</span>
            <div className="text-xs mt-1">{getSpecialName(value)}</div>
          </div>
        ) : (
          <span className="text-3xl sm:text-5xl font-bold">{displayValue}</span>
        )}
      </div>
      
      <div className="p-1 flex justify-between items-end rotate-180">
        <span className="text-lg font-bold">{displayValue}</span>
        <span className="text-lg font-bold hidden sm:block">{displayValue}</span>
      </div>
    </div>
  );
}

function getBgColor(color: string): string {
  switch (color) {
    case 'red': return 'bg-red-600';
    case 'blue': return 'bg-blue-600';
    case 'green': return 'bg-green-600';
    case 'yellow': return 'bg-yellow-600';
    default: return 'bg-gray-800';
  }
}

function getTextColor(color: string): string {
  switch (color) {
    case 'yellow': return 'text-black';
    default: return 'text-white';
  }
}

function getDisplayValue(value: string): string {
  if (isSpecialCard(value)) {
    return '';
  }
  return value;
}

function isSpecialCard(value: string): boolean {
  return ['skip', 'reverse', 'draw2', 'wild', 'wild_draw4'].includes(value);
}

function getSpecialSymbol(value: string): string {
  switch (value) {
    case 'skip': return '⊘';
    case 'reverse': return '⟲';
    case 'draw2': return '+2';
    default: return '';
  }
}

function getSpecialName(value: string): string {
  switch (value) {
    case 'skip': return 'SKIP';
    case 'reverse': return 'REVERSE';
    case 'draw2': return 'DRAW TWO';
    default: return '';
  }
}