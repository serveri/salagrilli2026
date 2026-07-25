// Phaser Game Initialization
// All game logic lives in scenes/, systems/, and data/ modules
const config = {
    type: Phaser.AUTO,
    parent: 'canvas-wrapper',
    width: 896,
    height: 832,
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        pixelArt: true,
        roundPixels: true,
        antialias: false,
        mipmapFilter: 'NEAREST'
    },
    scene: [Game.BootScene, Game.MenuScene, Game.GameScene]
};

const game = new Phaser.Game(config);
