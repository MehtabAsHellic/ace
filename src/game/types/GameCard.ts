export interface GameCard {
  id: string;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild';
  value: string; // number as string, or 'skip', 'reverse', 'draw2', 'wild', 'wild4'
}