import Phaser from 'phaser';
import cardSheet from '../assets/cards.png';
import uiSheet from '../assets/ui.png';
import buttonClickSound from '../assets/sounds/button-click.mp3';
import cardPlaceSound from '../assets/sounds/card-place.mp3';
import cardDealSound from '../assets/sounds/card-deal.mp3';
import winSound from '../assets/sounds/win.mp3';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show loading progress
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(
      this.cameras.main.width / 2 - 160,
      this.cameras.main.height / 2 - 25,
      320,
      50
    );

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(parseInt(String(value * 100)) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        this.cameras.main.width / 2 - 150,
        this.cameras.main.height / 2 - 15,
        300 * value,
        30
      );
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load assets
    this.load.spritesheet('cards', cardSheet, {
      frameWidth: 140,
      frameHeight: 190
    });
    this.load.spritesheet('ui', uiSheet, {
      frameWidth: 200,
      frameHeight: 200
    });

    // Load audio
    this.load.audio('button-click', buttonClickSound);
    this.load.audio('card-place', cardPlaceSound);
    this.load.audio('card-deal', cardDealSound);
    this.load.audio('win', winSound);

    // Load the back of the card
    const cardBack = this.textures.createCanvas('cardBack', 140, 190);
    const context = cardBack.getContext();
    context.fillStyle = '#222222';
    context.fillRect(0, 0, 140, 190);
    context.fillStyle = '#f5dd42';
    context.font = 'bold 60px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('ACE', 70, 95);
    cardBack.refresh();
  }

  create() {
    this.scene.start('MainMenuScene');
  }
}