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
        const titleScale = Game.SCALE * 2;
        const titleImg = this.add.image(0, 0, 'title').setScale(titleScale);
        const titleText = this.add.text(0, 0, 'Serveri\nQuest', {
            fontFamily: 'Pokemon Classic',
            fontSize: '48px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0, 0.5);

        const gap = 24;
        const totalWidth = titleImg.displayWidth + gap + titleText.displayWidth;
        const titleX = (width - totalWidth) / 2;
        const titleY = height / 3 - 35;

        titleImg.setPosition(titleX + titleImg.displayWidth / 2, titleY);
        titleText.setPosition(titleX + titleImg.displayWidth + gap, titleY);

        menuGroup.add(titleImg);
        menuGroup.add(titleText);

        // START Button
        const startBtn = this.add.image(width / 2, height / 2 + 14, 'btn');
        startBtn.setScale(Game.SCALE);
        startBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, startBtn.width, startBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        startBtn.input.cursor = 'pointer';
        menuGroup.add(startBtn);

        const startBtnLabel = this.add.text(width / 2, height / 2 + 14, 'START', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5).setScale(Game.SCALE);
        menuGroup.add(startBtnLabel);

        // ABOUT Button
        const aboutBtn = this.add.image(width / 2, height / 2 + 92, 'btn');
        aboutBtn.setScale(Game.SCALE);
        aboutBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, aboutBtn.width, aboutBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        aboutBtn.input.cursor = 'pointer';
        menuGroup.add(aboutBtn);

        const aboutBtnLabel = this.add.text(width / 2, height / 2 + 92, 'ABOUT', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5).setScale(Game.SCALE);
        menuGroup.add(aboutBtnLabel);

        // SETTINGS Button
        const settingsBtn = this.add.image(width / 2, height / 2 + 170, 'btn');
        settingsBtn.setScale(Game.SCALE);
        settingsBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, settingsBtn.width, settingsBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        settingsBtn.input.cursor = 'pointer';
        menuGroup.add(settingsBtn);

        const settingsBtnLabel = this.add.text(width / 2, height / 2 + 170, 'SETTINGS', {
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
        const settingsBackBtn = this.add.image(width / 2, height / 2 + 170, 'btn');
        settingsBackBtn.setScale(Game.SCALE);
        settingsBackBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, settingsBackBtn.width, settingsBackBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        settingsBackBtn.input.cursor = 'pointer';
        settingsGroup.add(settingsBackBtn);

        const settingsBackBtnLabel = this.add.text(width / 2, height / 2 + 170, 'BACK', {
            fontFamily: 'Pokemon Classic',
            fontSize: '8px',
            color: '#1a1a2e'
        }).setOrigin(0.5).setScale(Game.SCALE);
        settingsGroup.add(settingsBackBtnLabel);

        // --- About View Elements ---
        const headerText = this.add.text(width / 2, height / 2 - 310, 'About ServeriQuest', {
            fontFamily: 'Pokemon Classic',
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5, 0).setResolution(2);

        const storyText = this.add.text(width / 2, headerText.y + headerText.height + 32, 'This is an adventure following the life of Serveri mouse, in the fictional world of Kuopio.\nMoving tiny mouse legs is hard work, so walking around will tire you out.\n\nYou may need to restart a couple of times. It builds character.\n\nBeat the game and get the flag!', {
            fontFamily: 'Pokemon Classic',
            fontSize: '18px',
            color: '#ffff00',
            align: 'center',
            wordWrap: { width: width - 60 },
            lineSpacing: 4
        }).setOrigin(0.5, 0).setResolution(2);

        const restText = this.add.text(width / 2, storyText.y + storyText.height + 42, 'Controls\nMove: WASD / Arrows\nInteract: Space\nBackpack: E / I\n\nCredit\nPokemon Classic font by TheLouster115\nisaiah658\'s Pixel Pack #2\nMusic: Zhonti feat. NN-Beka - ЗЫН ЗЫН\nEverything else by https://github.com/RemesTop', {
            fontFamily: 'Pokemon Classic',
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 60 },
            lineSpacing: 4
        }).setOrigin(0.5, 0).setResolution(2);

        aboutGroup.add(headerText);
        aboutGroup.add(storyText);
        aboutGroup.add(restText);

        const aboutBackBtn = this.add.image(width / 2, height / 2 + 270, 'btn');
        aboutBackBtn.setScale(Game.SCALE);
        aboutBackBtn.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, aboutBackBtn.width, aboutBackBtn.height),
            Phaser.Geom.Rectangle.Contains
        );
        aboutBackBtn.input.cursor = 'pointer';
        aboutGroup.add(aboutBackBtn);

        const aboutBackBtnLabel = this.add.text(width / 2, height / 2 + 270, 'BACK', {
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
