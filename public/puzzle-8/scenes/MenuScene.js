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

        const menuGroup = this.add.group();
        const aboutGroup = this.add.group();

        // Title text using Pokemon Classic font
        const title = this.add.text(width / 2, height / 3, 'ServeriQuest', {
            fontFamily: 'Pokemon Classic',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
        menuGroup.add(title);

        // Start button using the button asset, scaled to match pixel-art aesthetic
        const startBtn = this.add.image(width / 2, height / 2 + 20, 'btn');
        startBtn.setScale(Game.SCALE);
        startBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, startBtn.width, startBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        startBtn.input.cursor = 'pointer';
        menuGroup.add(startBtn);

        // "START" label over the button
        const startBtnLabel = this.add.text(width / 2, height / 2 + 20, 'START', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5);
        startBtnLabel.setScale(Game.SCALE);
        menuGroup.add(startBtnLabel);

        // About button
        const aboutBtn = this.add.image(width / 2, height / 2 + 80, 'btn');
        aboutBtn.setScale(Game.SCALE);
        aboutBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, aboutBtn.width, aboutBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        aboutBtn.input.cursor = 'pointer';
        menuGroup.add(aboutBtn);

        // "ABOUT" label over the button
        const aboutBtnLabel = this.add.text(width / 2, height / 2 + 80, 'ABOUT', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5);
        aboutBtnLabel.setScale(Game.SCALE);
        menuGroup.add(aboutBtnLabel);

        // --- About View Elements ---
        const aboutText = this.add.text(width / 2, height / 3, 'About ServeriQuest\n\nThis is an adventure following the life of Serveri mouse. Excercise and socialising is kinda tiring. Beat the game and you get the flag! There might be other secrets. \n \n \n Credit\n Pokemon Classic font by TheLouster115 \n isaiah658\'s Pixel Pack #2\n Everything else by https://github.com/RemesTop', {
            fontFamily: 'Pokemon Classic',
            fontSize: '12px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 40 }
        }).setOrigin(0.5);
        aboutGroup.add(aboutText);

        const backBtn = this.add.image(width / 2, height / 2 + 80, 'btn');
        backBtn.setScale(Game.SCALE);
        backBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, backBtn.width, backBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        backBtn.input.cursor = 'pointer';
        aboutGroup.add(backBtn);

        const backBtnLabel = this.add.text(width / 2, height / 2 + 80, 'BACK', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5);
        backBtnLabel.setScale(Game.SCALE);
        aboutGroup.add(backBtnLabel);

        // Initially hide the about group
        aboutGroup.setVisible(false);

        let starting = false;
        const startGame = () => {
            if (starting || !menuGroup.getChildren()[0].visible) return;
            starting = true;

            // Remove interactivity and reset cursor to default arrow pointer
            startBtn.removeInteractive();
            aboutBtn.removeInteractive();
            this.input.setDefaultCursor('default');

            // Show pressed button state
            startBtn.setTexture('btn_pressed');

            // Doubled delay (480ms) to clearly show pressed button asset, then transition to GameScene
            this.time.delayedCall(480, () => {
                this.scene.start('GameScene');
            });
        };

        // Mouse click to start
        startBtn.on('pointerdown', () => {
            startGame();
        });

        // Mouse click to show about
        aboutBtn.on('pointerdown', () => {
            if (starting) return;
            aboutBtn.setTexture('btn_pressed');
            this.time.delayedCall(150, () => {
                aboutBtn.setTexture('btn');
                menuGroup.setVisible(false);
                aboutGroup.setVisible(true);
            });
        });

        // Mouse click to go back
        backBtn.on('pointerdown', () => {
            backBtn.setTexture('btn_pressed');
            this.time.delayedCall(150, () => {
                backBtn.setTexture('btn');
                aboutGroup.setVisible(false);
                menuGroup.setVisible(true);
            });
        });

        // Keyboard: Enter or Space to start
        this.input.keyboard.on('keydown-ENTER', () => {
            if (menuGroup.getChildren()[0].visible) startGame();
        });
        this.input.keyboard.on('keydown-SPACE', () => {
            if (menuGroup.getChildren()[0].visible) startGame();
        });

        // Keyboard: ESC to go back from about screen
        this.input.keyboard.on('keydown-ESC', () => {
            if (aboutGroup.getChildren()[0].visible) {
                aboutGroup.setVisible(false);
                menuGroup.setVisible(true);
            }
        });
    }
};
