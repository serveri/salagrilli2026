// MenuScene: Main menu with Start, Settings, and About views
window.Game = window.Game || {};

Game.MenuScene = class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Apply CRT settings immediately when scene creates
        if (Game.applyCRTSettings) Game.applyCRTSettings();

        // Flat black background
        this.cameras.main.setBackgroundColor('#000000');

        const menuGroup = this.add.group();
        const settingsGroup = this.add.group();
        const aboutGroup = this.add.group();

        // --- Main Menu Elements ---
        const title = this.add.text(width / 2, height / 3 - 30, 'ServeriQuest', {
            fontFamily: 'Pokemon Classic',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
        menuGroup.add(title);

        // START Button
        const startBtn = this.add.image(width / 2, height / 2 - 20, 'btn');
        startBtn.setScale(Game.SCALE);
        startBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, startBtn.width, startBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        startBtn.input.cursor = 'pointer';
        menuGroup.add(startBtn);

        const startBtnLabel = this.add.text(width / 2, height / 2 - 20, 'START', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5).setScale(Game.SCALE);
        menuGroup.add(startBtnLabel);

        // ABOUT Button
        const aboutBtn = this.add.image(width / 2, height / 2 + 35, 'btn');
        aboutBtn.setScale(Game.SCALE);
        aboutBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, aboutBtn.width, aboutBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        aboutBtn.input.cursor = 'pointer';
        menuGroup.add(aboutBtn);

        const aboutBtnLabel = this.add.text(width / 2, height / 2 + 35, 'ABOUT', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5).setScale(Game.SCALE);
        menuGroup.add(aboutBtnLabel);

        // SETTINGS Button
        const settingsBtn = this.add.image(width / 2, height / 2 + 90, 'btn');
        settingsBtn.setScale(Game.SCALE);
        settingsBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, settingsBtn.width, settingsBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        settingsBtn.input.cursor = 'pointer';
        menuGroup.add(settingsBtn);

        const settingsBtnLabel = this.add.text(width / 2, height / 2 + 90, 'SETTINGS', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5).setScale(Game.SCALE);
        menuGroup.add(settingsBtnLabel);

        // --- Settings View Elements ---
        const settingsTitle = this.add.text(width / 2, height / 4, 'SETTINGS', {
            fontFamily: 'Pokemon Classic',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        settingsGroup.add(settingsTitle);

        // CRT Filter Option
        const crtLabel = this.add.text(width / 2 - 120, height / 2 - 35, 'CRT Filter:', {
            fontFamily: 'Pokemon Classic',
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0, 0.5);
        settingsGroup.add(crtLabel);

        const getCrtText = () => Game.settings.crtEnabled ? '[ ON ]' : '[ OFF ]';
        const getCrtColor = () => Game.settings.crtEnabled ? '#00ff66' : '#ff4444';

        const crtToggleBtn = this.add.text(width / 2 + 50, height / 2 - 35, getCrtText(), {
            fontFamily: 'Pokemon Classic',
            fontSize: '14px',
            color: getCrtColor()
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        settingsGroup.add(crtToggleBtn);

        crtToggleBtn.on('pointerover', () => crtToggleBtn.setAlpha(0.8));
        crtToggleBtn.on('pointerout', () => crtToggleBtn.setAlpha(1.0));
        crtToggleBtn.on('pointerdown', () => {
            Game.settings.crtEnabled = !Game.settings.crtEnabled;
            Game.saveSettings();
            Game.applyCRTSettings();
            crtToggleBtn.setText(getCrtText());
            crtToggleBtn.setColor(getCrtColor());
        });

        // Volume Option
        const volLabel = this.add.text(width / 2 - 120, height / 2 + 15, 'Volume:', {
            fontFamily: 'Pokemon Classic',
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0, 0.5);
        settingsGroup.add(volLabel);

        const volMinusBtn = this.add.text(width / 2 + 35, height / 2 + 15, '[-]', {
            fontFamily: 'Pokemon Classic',
            fontSize: '14px',
            color: '#ffd700'
        }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
        settingsGroup.add(volMinusBtn);

        const volValueText = this.add.text(width / 2 + 95, height / 2 + 15, `${Game.settings.volume}%`, {
            fontFamily: 'Pokemon Classic',
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5);
        settingsGroup.add(volValueText);

        const volPlusBtn = this.add.text(width / 2 + 155, height / 2 + 15, '[+]', {
            fontFamily: 'Pokemon Classic',
            fontSize: '14px',
            color: '#ffd700'
        }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
        settingsGroup.add(volPlusBtn);

        volMinusBtn.on('pointerover', () => volMinusBtn.setColor('#ffffff'));
        volMinusBtn.on('pointerout', () => volMinusBtn.setColor('#ffd700'));
        volMinusBtn.on('pointerdown', () => {
            Game.settings.volume = Math.max(0, Game.settings.volume - 10);
            Game.saveSettings();
            volValueText.setText(`${Game.settings.volume}%`);
        });

        volPlusBtn.on('pointerover', () => volPlusBtn.setColor('#ffffff'));
        volPlusBtn.on('pointerout', () => volPlusBtn.setColor('#ffd700'));
        volPlusBtn.on('pointerdown', () => {
            Game.settings.volume = Math.min(100, Game.settings.volume + 10);
            Game.saveSettings();
            volValueText.setText(`${Game.settings.volume}%`);
        });

        // Settings Back Button
        const settingsBackBtn = this.add.image(width / 2, height / 2 + 90, 'btn');
        settingsBackBtn.setScale(Game.SCALE);
        settingsBackBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, settingsBackBtn.width, settingsBackBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        settingsBackBtn.input.cursor = 'pointer';
        settingsGroup.add(settingsBackBtn);

        const settingsBackBtnLabel = this.add.text(width / 2, height / 2 + 90, 'BACK', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5).setScale(Game.SCALE);
        settingsGroup.add(settingsBackBtnLabel);

        // --- About View Elements ---
        const aboutText = this.add.text(width / 2, height / 3, 'About ServeriQuest\n\nThis is an adventure following the life of Serveri mouse. Excercise and socialising is kinda tiring. Beat the game and you get the flag! There might be other secrets.\n You may need to restart couple of times... \n \n \n Credit\n Pokemon Classic font by TheLouster115 \n isaiah658\'s Pixel Pack #2\n Everything else by https://github.com/RemesTop', {
            fontFamily: 'Pokemon Classic',
            fontSize: '12px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 40 }
        }).setOrigin(0.5);
        aboutGroup.add(aboutText);

        const aboutBackBtn = this.add.image(width / 2, height / 2 + 90, 'btn');
        aboutBackBtn.setScale(Game.SCALE);
        aboutBackBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, aboutBackBtn.width, aboutBackBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        aboutBackBtn.input.cursor = 'pointer';
        aboutGroup.add(aboutBackBtn);

        const aboutBackBtnLabel = this.add.text(width / 2, height / 2 + 90, 'BACK', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5).setScale(Game.SCALE);
        aboutGroup.add(aboutBackBtnLabel);

        // Initially hide settings and about groups
        settingsGroup.setVisible(false);
        aboutGroup.setVisible(false);

        let starting = false;
        const startGame = () => {
            if (starting || !menuGroup.getChildren()[0].visible) return;
            starting = true;

            startBtn.removeInteractive();
            settingsBtn.removeInteractive();
            aboutBtn.removeInteractive();
            this.input.setDefaultCursor('default');

            startBtn.setTexture('btn_pressed');

            this.time.delayedCall(480, () => {
                this.scene.start('GameScene');
            });
        };

        // Mouse click handlers
        startBtn.on('pointerdown', () => startGame());

        settingsBtn.on('pointerdown', () => {
            if (starting) return;
            settingsBtn.setTexture('btn_pressed');
            this.time.delayedCall(150, () => {
                settingsBtn.setTexture('btn');
                menuGroup.setVisible(false);
                settingsGroup.setVisible(true);
            });
        });

        aboutBtn.on('pointerdown', () => {
            if (starting) return;
            aboutBtn.setTexture('btn_pressed');
            this.time.delayedCall(150, () => {
                aboutBtn.setTexture('btn');
                menuGroup.setVisible(false);
                aboutGroup.setVisible(true);
            });
        });

        settingsBackBtn.on('pointerdown', () => {
            settingsBackBtn.setTexture('btn_pressed');
            this.time.delayedCall(150, () => {
                settingsBackBtn.setTexture('btn');
                settingsGroup.setVisible(false);
                menuGroup.setVisible(true);
            });
        });

        aboutBackBtn.on('pointerdown', () => {
            aboutBackBtn.setTexture('btn_pressed');
            this.time.delayedCall(150, () => {
                aboutBackBtn.setTexture('btn');
                aboutGroup.setVisible(false);
                menuGroup.setVisible(true);
            });
        });

        // Keyboard navigation
        this.input.keyboard.on('keydown-ENTER', () => {
            if (menuGroup.getChildren()[0].visible) startGame();
        });
        this.input.keyboard.on('keydown-SPACE', () => {
            if (menuGroup.getChildren()[0].visible) startGame();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            if (settingsGroup.getChildren()[0].visible) {
                settingsGroup.setVisible(false);
                menuGroup.setVisible(true);
            } else if (aboutGroup.getChildren()[0].visible) {
                aboutGroup.setVisible(false);
                menuGroup.setVisible(true);
            }
        });
    }
};
