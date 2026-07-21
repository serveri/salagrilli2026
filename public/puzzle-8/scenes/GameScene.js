// GameScene: Main gameplay with grid movement, area transitions, and dialogue
window.Game = window.Game || {};

Game.GameScene = class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentArea = null;
        this.tileX = 12;
        this.tileY = 8;
        this.isMoving = false;
        this.facing = 'down';
        this.isTransitioning = false;
        this.keyHoldTimer = 0;
        this.isTurning = false;
        this.dialogue = null;
    }

    create() {
        // Walk Animations
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('player', { frames: [1, 0, 1, 2] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('player', { frames: [4, 3] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('player', { frames: [6, 5] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('player', { frames: [8, 7, 8, 9] }),
            frameRate: 10,
            repeat: -1
        });

        // Keyboard Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Auto focus canvas on click
        this.input.on('pointerdown', () => { window.focus(); });

        // Create Player Sprite
        this.player = this.add.sprite(
            this.tileX * Game.TILE_SIZE,
            this.tileY * Game.TILE_SIZE,
            'player', 1
        );
        this.player.setOrigin(0, 0);
        this.player.setDepth(10);

        // Camera
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setZoom(Game.SCALE);

        // Load starting area
        this.loadArea('overworld', 12, 8);

        // Camera fade in when game starts (after menu)
        this.cameras.main.fadeIn(900, 0, 0, 0);

        // Dialogue system
        this.dialogue = new Game.DialogueBox(this);

        // Backpack / Inventory system
        this.backpack = new Game.Backpack(this);

        // Toggle backpack with 'E' or 'I' key
        const toggleBag = () => {
            if (this.dialogue && this.dialogue.active) return;
            this.backpack.toggle();
        };
        this.input.keyboard.on('keydown-E', toggleBag);
        this.input.keyboard.on('keydown-I', toggleBag);
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.backpack && this.backpack.active) this.backpack.close();
        });

        // Show intro dialogue
        this.dialogue.show([
            'You woke up \n \n \n Press space to continue..',
            'You feel tired..\n \n \n Press E or I to open backpack'
        ]);
    }

    loadArea(areaId, startTileX, startTileY) {
        const area = Game.Areas[areaId];
        if (!area) return;

        this.currentArea = area;
        this.tileX = startTileX;
        this.tileY = startTileY;

        // Parse compact map format into tile array (cached for collision checks)
        this.tileData = Game.MapLoader.parse(area);

        // Rebuild Tilemap
        if (this.tilemap) this.tilemap.destroy();

        this.tilemap = this.make.tilemap({
            data: this.tileData,
            tileWidth: Game.TILE_SIZE,
            tileHeight: Game.TILE_SIZE
        });

        const tileset = this.tilemap.addTilesetImage('tiles', 'tiles', 16, 16, 0, 0);
        this.layer = this.tilemap.createLayer(0, tileset, 0, 0);

        this.player.setPosition(
            this.tileX * Game.TILE_SIZE,
            this.tileY * Game.TILE_SIZE
        );
        this.setIdleFrame();

        // Camera bounds — center small areas
        const areaWidthPx = area.width * Game.TILE_SIZE;
        const areaHeightPx = area.height * Game.TILE_SIZE;
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
            boundY = -(viewHeight - areaHeightPx) / 2;
        }

        this.cameras.main.setBounds(boundX, boundY, boundW, boundH);
    }

    update(time, delta) {
        // Keep UI systems positioned relative to camera
        if (this.dialogue) {
            this.dialogue.updatePosition();
        }
        if (this.backpack) {
            this.backpack.updatePosition();
        }

        if (this.isTransitioning) return;
        if (this.dialogue && this.dialogue.active) return;
        if (this.backpack && this.backpack.active) return;

        const activeDir = this.getActiveInput();

        if (this.isMoving) return;

        if (activeDir) {
            if (this.facing !== activeDir) {
                this.playTurnStep(activeDir);
            } else {
                this.keyHoldTimer += delta;
                if (!this.player.anims.isPlaying && !this.isTurning) {
                    this.player.play(`walk-${this.facing}`, true);
                }
            }

            if (this.keyHoldTimer >= Game.TAP_DELAY) {
                const [dx, dy] = this.getDeltaFromDir(activeDir);
                this.tryMove(dx, dy);
            }
        } else {
            this.keyHoldTimer = 0;
            if (!this.isTurning) {
                if (this.player.anims.isPlaying) {
                    this.player.anims.stop();
                }
                this.setIdleFrame();
            }
        }
    }

    playTurnStep(dir) {
        this.facing = dir;
        this.keyHoldTimer = 0;
        this.isTurning = true;

        if (this.player.anims.isPlaying) {
            this.player.anims.stop();
        }

        this.setSteppingFrame();

        if (this.turnTimer) this.turnTimer.remove();
        this.turnTimer = this.time.delayedCall(60, () => {
            this.isTurning = false;
            if (!this.getActiveInput() && !this.isMoving) {
                this.setIdleFrame();
            }
        });
    }

    getActiveInput() {
        if (this.cursors.left.isDown || this.wasd.left.isDown) return 'left';
        if (this.cursors.right.isDown || this.wasd.right.isDown) return 'right';
        if (this.cursors.up.isDown || this.wasd.up.isDown) return 'up';
        if (this.cursors.down.isDown || this.wasd.down.isDown) return 'down';
        return null;
    }

    getDeltaFromDir(dir) {
        switch (dir) {
            case 'left': return [-1, 0];
            case 'right': return [1, 0];
            case 'up': return [0, -1];
            case 'down': return [0, 1];
            default: return [0, 0];
        }
    }

    setIdleFrame() {
        switch (this.facing) {
            case 'down': this.player.setFrame(1); break;
            case 'right': this.player.setFrame(4); break;
            case 'left': this.player.setFrame(6); break;
            case 'up': this.player.setFrame(8); break;
        }
    }

    setSteppingFrame() {
        switch (this.facing) {
            case 'down': this.player.setFrame(0); break;
            case 'right': this.player.setFrame(3); break;
            case 'left': this.player.setFrame(5); break;
            case 'up': this.player.setFrame(7); break;
        }
    }

    tryMove(dx, dy) {
        const targetX = this.tileX + dx;
        const targetY = this.tileY + dy;

        if (targetX < 0 || targetX >= this.currentArea.width ||
            targetY < 0 || targetY >= this.currentArea.height) {
            this.player.play(`walk-${this.facing}`, true);
            return;
        }

        // Check solids against cached tile data
        const targetTileIndex = this.tileData[targetY][targetX];
        if (this.currentArea.solidTiles.includes(targetTileIndex)) {
            this.player.play(`walk-${this.facing}`, true);
            return;
        }

        this.isMoving = true;
        this.player.play(`walk-${this.facing}`, true);

        const targetPxX = targetX * Game.TILE_SIZE;
        const targetPxY = targetY * Game.TILE_SIZE;

        this.tweens.add({
            targets: this.player,
            x: targetPxX,
            y: targetPxY,
            duration: Game.TWEEN_DURATION,
            ease: 'Linear',
            onComplete: () => {
                this.tileX = targetX;
                this.tileY = targetY;
                this.isMoving = false;

                const doorTriggered = this.checkDoorTrigger();

                if (!doorTriggered) {
                    // Block continuous movement chaining if backpack or dialogue is active
                    if ((this.backpack && this.backpack.active) || (this.dialogue && this.dialogue.active)) {
                        this.player.anims.stop();
                        this.setIdleFrame();
                        return;
                    }

                    const heldInput = this.getActiveInput();
                    if (heldInput && heldInput === this.facing) {
                        const [ndx, ndy] = this.getDeltaFromDir(heldInput);
                        this.tryMove(ndx, ndy);
                    } else if (heldInput) {
                        this.facing = heldInput;
                        this.keyHoldTimer = 0;
                    } else {
                        this.player.anims.stop();
                        this.setIdleFrame();
                    }
                }
            }
        });
    }

    checkDoorTrigger() {
        const door = this.currentArea.doors.find(
            d => d.x === this.tileX && d.y === this.tileY
        );

        if (door) {
            this.isTransitioning = true;
            this.player.anims.stop();
            this.setIdleFrame();

            this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
                if (progress === 1) {
                    this.loadArea(door.targetArea, door.targetX, door.targetY);
                    this.cameras.main.fadeIn(250, 0, 0, 0, (cam, prog) => {
                        if (prog === 1) {
                            this.isTransitioning = false;
                        }
                    });
                }
            });
            return true;
        }
        return false;
    }
};
