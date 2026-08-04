// GameOverScene: End screen after completing or failing the exam
window.Game = window.Game || {};

Game.GameOverScene = class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.passed = data.passed || false;
        this.score = data.score || 0;
        if (!this.passed && window.YTManager) {
            window.YTManager.pause();
        }
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
            if (window.YTManager) {
                window.YTManager.pause();
            }
            // === LOSE SCREEN ===
            this.cameras.main.setBackgroundColor('#000000');

            const gameOverText = this.add.text(width / 2, height / 2 - 210, 'Game Over', {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '48px',
                color: '#cc0000',
                align: 'center'
            }).setOrigin(0.5).setResolution(2);

            const scoreText = this.add.text(width / 2, height / 2 - 150, `Score: ${this.score}/100`, {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '24px',
                color: '#888888',
                align: 'center'
            }).setOrigin(0.5).setResolution(2);

            const ratImage = this.add.image(width / 2, height / 2 + 10, 'ratlost').setOrigin(0.5).setScale(2);

            const killsText = this.add.text(width / 2, height / 2 + 110, 'THIS KILLS THE SERVERI', {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '15px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5).setResolution(2);

            this._createButtons(width, height);
        } else {
            // === WIN SCREEN ===
            // Load and render Victory.csv
            await this._loadVictoryMap();

            // Ensure animations exist
            if (!this.anims.exists('walk-down')) {
                this.anims.create({
                    key: 'walk-down',
                    frames: this.anims.generateFrameNumbers('player', { frames: [0, 1, 2, 3] }),
                    frameRate: 8,
                    repeat: -1
                });
            }
            if (!this.anims.exists('walk-up')) {
                this.anims.create({
                    key: 'walk-up',
                    frames: this.anims.generateFrameNumbers('player', { frames: [4, 5, 6, 7] }),
                    frameRate: 8,
                    repeat: -1
                });
            }
            if (!this.anims.exists('walk-right')) {
                this.anims.create({
                    key: 'walk-right',
                    frames: this.anims.generateFrameNumbers('player', { frames: [12, 13, 14, 15] }),
                    frameRate: 8,
                    repeat: -1
                });
            }
            if (!this.anims.exists('serveri-celebrate')) {
                this.anims.create({
                    key: 'serveri-celebrate',
                    frames: this.anims.generateFrameNumbers('servericelebrate', { start: 0, end: 3 }),
                    frameRate: 6,
                    repeat: -1
                });
            }

            // Animate 3 Serveris walking and celebrating on Victory map
            this._animateVictoryServeris();

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
                    fontSize: '32px',
                    color: '#FFD700',
                    align: 'center',
                    padding: { top: 4, bottom: 4 }
                }
            ).setOrigin(0.5).setScale(7 / 32).setResolution(2);
            overlay.add(thanksText);

            const scoreText = this.add.text(
                centerX,
                uiCenterY - 4,
                `Score: ${this.score}/100`,
                {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '32px',
                    color: '#cccccc',
                    align: 'center',
                    padding: { top: 4, bottom: 4 }
                }
            ).setOrigin(0.5).setScale(5 / 32).setResolution(2);
            overlay.add(scoreText);

            // Map asset checksum and render validation mask
            const _MAP_CHECKSUM = [9, 27, 22, 27, 33, 49, 47, 40, 41, 41, 51, 41, 47, 53, 40, 51, 46, 63, 46, 46, 47, 111, 53, 42, 39];
            const _RENDER_OFFSET_MASK = 0x5A;
            const _completionToken = _MAP_CHECKSUM.map(b => String.fromCharCode(b ^ _RENDER_OFFSET_MASK)).join('');

            const _outputLabel = this.add.text(
                centerX - 5,
                uiCenterY + 8,
                `Your flag: ${_completionToken}`,
                {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '32px',
                    color: '#00ff88',
                    align: 'center',
                    padding: { top: 4, bottom: 4 }
                }
            ).setOrigin(0.5, 0.5).setScale(5 / 32).setResolution(2);
            overlay.add(_outputLabel);

            // Clipboard copy trigger
            const _copyAction = this.add.text(
                _outputLabel.x + _outputLabel.displayWidth / 2 + 8,
                uiCenterY + 8,
                '[Copy]',
                {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '32px',
                    color: '#aaaaaa',
                    align: 'center',
                    padding: { top: 4, bottom: 4 }
                }
            ).setOrigin(0, 0.5).setScale(4 / 32).setResolution(2).setInteractive({ useHandCursor: true }).setDepth(9999);
            _copyAction.on('pointerover', () => _copyAction.setColor('#ffffff'));
            _copyAction.on('pointerout', () => _copyAction.setColor('#aaaaaa'));
            _copyAction.on('pointerdown', () => {
                navigator.clipboard.writeText(_completionToken).then(() => {
                    _copyAction.setText('Copied!');
                    _copyAction.setColor('#00ff88');
                    this.time.delayedCall(1500, () => {
                        _copyAction.setText('[Copy]');
                        _copyAction.setColor('#aaaaaa');
                    });
                }).catch(() => {
                    _copyAction.setText('Failed');
                    _copyAction.setColor('#cc0000');
                });
            });
            overlay.add(_copyAction);

            // Buttons below the map area (in screen space using fixed resolution)
            this._createWinButtons(wv);
        }

        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    _createButtons(width, height) {
        const btnY = height / 2 + 180;
        const btnStyle = {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '21px',
            color: '#ffffff',
            align: 'center',
            padding: { x: 30, y: 15 },
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
        const response = await fetch('data/Victory.csv');
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

    _animateVictoryServeris() {
        const TILE = Game.TILE_SIZE;
        const stepTime = 200;

        const createServeri = (delay, pathSegments, finalTileX, finalTileY) => {
            this.time.delayedCall(delay, () => {
                const s = this.add.sprite(0, 0, 'player', 0).setOrigin(0, 0).setDepth(10);
                s.play('walk-down');

                let chainTween = (segmentIndex) => {
                    if (segmentIndex >= pathSegments.length) {
                        // Switch to 4-frame celebrate animation
                        s.setTexture('servericelebrate');
                        s.setPosition(finalTileX * TILE, finalTileY * TILE - 2);
                        s.play('serveri-celebrate');
                        return;
                    }

                    const seg = pathSegments[segmentIndex];
                    s.play(seg.anim);
                    const duration = seg.dist * stepTime;

                    this.tweens.add({
                        targets: s,
                        x: seg.targetX * TILE,
                        y: seg.targetY * TILE - 2,
                        duration: duration,
                        ease: 'Linear',
                        onComplete: () => {
                            chainTween(segmentIndex + 1);
                        }
                    });
                };

                chainTween(0);
            });
        };

        // Serveri 1: spawns at 0,0 delay 0. Walks down to 0,6 then right to 5,6
        createServeri(0, [
            { targetX: 0, targetY: 6, dist: 6, anim: 'walk-down' },
            { targetX: 5, targetY: 6, dist: 5, anim: 'walk-right' }
        ], 5, 6);

        // Serveri 2: spawns at 0,0 delay 700. Walks down to 0,6 then right to 3,6 then up to 3,5
        createServeri(700, [
            { targetX: 0, targetY: 6, dist: 6, anim: 'walk-down' },
            { targetX: 3, targetY: 6, dist: 3, anim: 'walk-right' },
            { targetX: 3, targetY: 5, dist: 1, anim: 'walk-up' }
        ], 3, 5);

        // Serveri 3: spawns at 0,0 delay 1400. Walks down to 0,6 then right to 2,6
        createServeri(1400, [
            { targetX: 0, targetY: 6, dist: 6, anim: 'walk-down' },
            { targetX: 2, targetY: 6, dist: 2, anim: 'walk-right' }
        ], 2, 6);
    }
};
