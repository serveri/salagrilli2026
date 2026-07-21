// MenuScene: Simple main menu with flat black background and start button
window.Game = window.Game || {};

Game.MenuScene = class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Flat black background
        this.cameras.main.setBackgroundColor('#000000');

        // Title text using Pokemon Classic font
        this.add.text(width / 2, height / 3, 'PUZZLE 8', {
            fontFamily: 'Pokemon Classic',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Start button using the button asset, scaled to match pixel-art aesthetic
        const btn = this.add.image(width / 2, height / 2 + 40, 'btn');
        btn.setScale(Game.SCALE);
        btn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, btn.width, btn.height),
            Phaser.Geom.Rectangle.Contains
        );
        btn.input.cursor = 'pointer';

        // "START" label over the button
        const btnLabel = this.add.text(width / 2, height / 2 + 40, 'START', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5);
        btnLabel.setScale(Game.SCALE);

        let starting = false;
        const startGame = () => {
            if (starting) return;
            starting = true;

            // Remove interactivity and reset cursor to default arrow pointer
            btn.removeInteractive();
            this.input.setDefaultCursor('default');

            // Show pressed button state
            btn.setTexture('btn_pressed');

            // Doubled delay (480ms) to clearly show pressed button asset, then transition to GameScene
            this.time.delayedCall(480, () => {
                this.scene.start('GameScene');
            });
        };

        // Mouse click to start (no hover texture changes)
        btn.on('pointerdown', () => {
            startGame();
        });

        // Keyboard: Enter or Space to start
        this.input.keyboard.on('keydown-ENTER', startGame);
        this.input.keyboard.on('keydown-SPACE', startGame);
    }
};
