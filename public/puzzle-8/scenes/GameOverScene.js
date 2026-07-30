// GameOverScene: End screen after completing or failing the exam
window.Game = window.Game || {};

Game.GameOverScene = class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.passed = data.passed || false;
        this.score = data.score || 0;
    }

    preload() {
        // Victory map CSV will be loaded at runtime if won
    }

    async create() {
        const { width, height } = this.scale;
        
        if (this.sys && this.sys.game && this.sys.game.canvas) {
            this.sys.game.canvas.style.filter = 'none';
        }

        if (!this.passed) {
            // === LOSE SCREEN ===
            this.cameras.main.setBackgroundColor('#000000');

            const gameOverText = this.add.text(width / 2, height / 2 - 60, 'Game Over', {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '32px',
                color: '#cc0000',
                align: 'center'
            }).setOrigin(0.5).setResolution(2);

            const scoreText = this.add.text(width / 2, height / 2, `Score: ${this.score}/100`, {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '16px',
                color: '#888888',
                align: 'center'
            }).setOrigin(0.5).setResolution(2);

            this._createButtons(width, height);
        } else {
            // === WIN SCREEN ===
            // Load and render Victory.csv
            await this._loadVictoryMap();

            // Place player at tile 2, 6
            this.player = this.add.sprite(
                2 * Game.TILE_SIZE,
                6 * Game.TILE_SIZE,
                'player', 0
            );
            this.player.setOrigin(0, 0);
            this.player.setDepth(10);

            // Camera setup for the small victory map
            this.cameras.main.setZoom(Game.SCALE);
            const areaWidthPx = this.victoryWidth * Game.TILE_SIZE;
            const areaHeightPx = this.victoryHeight * Game.TILE_SIZE;
            const viewWidth = this.cameras.main.width / Game.SCALE;
            const viewHeight = this.cameras.main.height / Game.SCALE;

            let boundX = 0;
            let boundY = 0;
            let boundW = Math.max(areaWidthPx, viewWidth);
            let boundH = Math.max(areaHeightPx, viewHeight);

            if (areaWidthPx < viewWidth) {
                boundX = -(viewWidth - areaWidthPx) / 2;
            }
            if (areaHeightPx < viewHeight) {
                boundY = 0; // Align map to the top
            }

            this.cameras.main.setBounds(boundX, boundY, boundW, boundH);
            this.cameras.main.centerOn(areaWidthPx / 2, Math.max(areaHeightPx / 2, viewHeight / 2));

            // Overlay text container (on top of everything, in screen space)
            const overlay = this.add.container(0, 0).setDepth(9999);

            // Dark semi-transparent backdrop for text readability
            // The camera is centered on areaWidthPx / 2, and the top is at 0.
            const centerX = areaWidthPx / 2;

            // Place UI vertically centered in the empty space below the map
            // If the map is large, it'll just be at the bottom of the map.
            const emptySpace = Math.max(0, viewHeight - areaHeightPx);
            const uiCenterY = areaHeightPx + emptySpace / 2;

            const backdrop = this.add.rectangle(
                centerX,
                uiCenterY,
                160, 70, 0x000000, 0.7
            ).setOrigin(0.5);
            overlay.add(backdrop);

            const thanksText = this.add.text(
                centerX,
                uiCenterY - 15,
                'Thanks for playing!',
                {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '7px',
                    color: '#FFD700',
                    align: 'center'
                }
            ).setOrigin(0.5).setResolution(10);
            overlay.add(thanksText);

            const scoreText = this.add.text(
                centerX,
                uiCenterY - 4,
                `Score: ${this.score}/100`,
                {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '5px',
                    color: '#cccccc',
                    align: 'center'
                }
            ).setOrigin(0.5).setResolution(10);
            overlay.add(scoreText);

            // Hardcoded flag for now
            let flagValue = 'SALA{kurssisuoritettu5op}';

            const flagText = this.add.text(
                centerX - 5,
                uiCenterY + 8,
                `Your flag: ${flagValue}`,
                {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '5px',
                    color: '#00ff88',
                    align: 'center'
                }
            ).setOrigin(0.5, 0.5).setResolution(10);
            overlay.add(flagText);

            // Copy button
            const copyBtn = this.add.text(
                flagText.x + flagText.width / 2 + 8,
                uiCenterY + 8,
                '[Copy]',
                {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '4px',
                    color: '#aaaaaa',
                    align: 'center'
                }
            ).setOrigin(0, 0.5).setResolution(10).setInteractive({ useHandCursor: true }).setDepth(9999);
            copyBtn.on('pointerover', () => copyBtn.setColor('#ffffff'));
            copyBtn.on('pointerout', () => copyBtn.setColor('#aaaaaa'));
            copyBtn.on('pointerdown', () => {
                navigator.clipboard.writeText(flagValue).then(() => {
                    copyBtn.setText('Copied!');
                    copyBtn.setColor('#00ff88');
                    this.time.delayedCall(1500, () => {
                        copyBtn.setText('[Copy]');
                        copyBtn.setColor('#aaaaaa');
                    });
                }).catch(() => {
                    copyBtn.setText('Failed');
                    copyBtn.setColor('#cc0000');
                });
            });
            overlay.add(copyBtn);

            // Buttons below the map area (in screen space using fixed resolution)
            this._createWinButtons(wv);
        }

        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    _createButtons(width, height) {
        const btnY = height / 2 + 60;
        const btnStyle = {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '14px',
            color: '#ffffff',
            align: 'center',
            padding: { x: 20, y: 10 },
            backgroundColor: '#333333'
        };

        // Retry button (Centered, reloads page)
        const retryBtn = this.add.text(width / 2, btnY, 'Retry', btnStyle)
            .setOrigin(0.5).setResolution(2).setInteractive({ useHandCursor: true });
        retryBtn.on('pointerover', () => retryBtn.setStyle({ backgroundColor: '#555555' }));
        retryBtn.on('pointerout', () => retryBtn.setStyle({ backgroundColor: '#333333' }));
        retryBtn.on('pointerdown', () => {
            window.location.reload();
        });
    }

    _createWinButtons(wv) {
        // No buttons on win screen per user request
    }

    async _loadVictoryMap() {
        const response = await fetch('/puzzle-8/data/Victory.csv');
        const text = await response.text();
        const rows = text.trim().split('\n');
        const tileData = rows.map(r => r.split(',').map(Number));

        this.victoryWidth = tileData[0].length;
        this.victoryHeight = tileData.length;

        const tilemap = this.make.tilemap({
            data: tileData,
            tileWidth: Game.TILE_SIZE,
            tileHeight: Game.TILE_SIZE
        });

        const tileset = tilemap.addTilesetImage('tiles', 'tiles', 16, 16, 0, 0);
        const layer = tilemap.createLayer(0, tileset, 0, 0);
        layer.setDepth(0);
    }
};
