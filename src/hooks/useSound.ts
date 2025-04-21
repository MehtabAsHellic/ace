import { Howl } from 'howler';
import { useCallback, useEffect, useMemo } from 'react';

// Sound sprite definitions
const SOUNDS = {
  cardPlace: [0, 300],   // 300ms duration
  cardFlip: [400, 200],  // 200ms duration
  buttonClick: [700, 100], // 100ms duration
  drawCard: [900, 250],  // 250ms duration
  special: [1200, 500],  // 500ms duration
  win: [1800, 1500],     // 1.5s duration
  lose: [3400, 1500],    // 1.5s duration
};

// Create a single Howl instance with all sounds as sprites
const soundSprites = new Howl({
  src: ['https://assets.codepen.io/123/game-sounds.mp3'], // Replace with actual sound sprite URL
  sprite: SOUNDS,
  volume: 0.5,
});

// Background music
const bgMusic = new Howl({
  src: ['https://assets.codepen.io/123/game-music.mp3'], // Replace with actual music URL
  loop: true,
  volume: 0.2,
});

export function useSound() {
  // Memoize the play function
  const play = useCallback((soundName: keyof typeof SOUNDS) => {
    soundSprites.play(soundName);
  }, []);

  // Start/stop background music
  const toggleMusic = useCallback((shouldPlay: boolean) => {
    if (shouldPlay) {
      bgMusic.play();
    } else {
      bgMusic.stop();
    }
  }, []);

  // Set volume levels
  const setVolume = useCallback((volume: number) => {
    soundSprites.volume(volume);
    bgMusic.volume(volume * 0.4); // Keep music slightly quieter
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      bgMusic.stop();
    };
  }, []);

  return {
    play,
    toggleMusic,
    setVolume,
  };
}