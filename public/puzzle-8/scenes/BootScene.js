// BootScene: Preloads all game assets then transitions to MenuScene
window.Game = window.Game || {};

Game.BootScene = class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.setPath('/puzzle-8/assets/');

        // Player spritesheet (16x16 frames, 3 cols x 4 rows)
        this.load.spritesheet('player', 'ServeriHiiri.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // Tileset (1024x1024, 64 tiles per row)
        this.load.image('tiles', 'Tileset.png');

        // Menu button assets
        this.load.image('btn', 'menubutton.png');
        this.load.image('btn_pressed', 'menubutton-pressed.png');

        // Dialogue textbox (158x80)
        this.load.image('textbox', 'textbox.png');

        // Backpack asset (198x150)
        this.load.image('backpack', 'backpack.png');
    }

    create() {
        // Load custom font via FontFace API, then proceed to menu
        const font = new FontFace('Pokemon Classic', "url('/puzzle-8/assets/Pokemon Classic.ttf')");
        font.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
            this.scene.start('MenuScene');
        }).catch(() => {
            // Proceed even if font fails (fallback to monospace)
            console.warn('Pokemon Classic font failed to load, using fallback');
            this.scene.start('MenuScene');
        });
    }
};
