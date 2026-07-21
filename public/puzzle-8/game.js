// Phaser Game Initialization
// All game logic lives in scenes/, systems/, and data/ modules
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 640,
    height: 576,
    scale: {
        mode: Phaser.Scale.FIT
    },
    render: {
        pixelArt: true,
        antialias: false
    },
    scene: [Game.BootScene, Game.MenuScene, Game.GameScene]
};

const game = new Phaser.Game(config);
