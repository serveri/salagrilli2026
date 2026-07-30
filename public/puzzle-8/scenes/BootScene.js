// BootScene: Preloads all game assets then transitions to MenuScene
window.Game = window.Game || {};

Game.BootScene = class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.setPath('/puzzle-8/assets/');

        // Player spritesheet (16x16 frames, 4 cols x 4 rows)
        this.load.spritesheet('player', 'ServeriHiiri.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // Player extra animations (sleeping, shadows etc.)
        this.load.spritesheet('playerextra', 'PlayerExtra.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // Police spritesheet (16x18 frames, 4 cols x 4 rows)
        this.load.spritesheet('poliisi', 'Poliisi.png', {
            frameWidth: 16,
            frameHeight: 18
        });

        // Assistant spritesheet (16x20 frames, 4 cols x 4 rows)
        this.load.spritesheet('opetusavustaja', 'Opetusavustaja.png', {
            frameWidth: 16,
            frameHeight: 20
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

        // Effects asset (16x16 frames)
        this.load.spritesheet('effects', 'Effects.png', { frameWidth: 16, frameHeight: 16 });

        // Quest Map asset
        this.load.image('questMap', 'ServeriQuestMap.png');

        // Exam Background
        this.load.image('exambackground', 'examBackground.png');

        this.load.spritesheet('pencil', 'Pencil.png', {
            frameWidth: 32,
            frameHeight: 16
        });
        
        // Thought bubble for exam
        this.load.image('thoughtbubble', 'thoughtbubble.png');
    }

    create() {
        // Load custom font via FontFace API, then proceed to menu
        const font = new FontFace('Pokemon Classic', "url('/puzzle-8/assets/Pokemon%20Classic.ttf')");
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
