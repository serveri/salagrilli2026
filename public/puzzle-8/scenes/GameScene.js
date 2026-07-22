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
        this.energy = 200;
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

        // Create Shadow Sprite (for jumping)
        this.shadow = this.add.sprite(
            this.tileX * Game.TILE_SIZE,
            this.tileY * Game.TILE_SIZE,
            'player', 10
        );
        this.shadow.setOrigin(0, 0);
        this.shadow.setDepth(9); // Below player
        this.shadow.setVisible(false);

        // Camera
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setZoom(Game.SCALE);
        this.cameras.main.setVisible(false);

        // Load starting area
        this.loadArea('/puzzle-8/data/serveriquest.csv', 1, 1).then(() => {
            // Camera fade in when game starts (after menu)
            this.cameras.main.setVisible(true);
            this.cameras.main.fadeIn(900, 0, 0, 0);
        });

        // Dialogue system
        this.dialogue = new Game.DialogueBox(this);

        // Backpack / Inventory system
        this.backpack = new Game.Backpack(this);

        // Toggle backpack with 'E' or 'I' key
        const toggleBag = () => {
            if (this.dialogue && this.dialogue.active) return;
            if (this.player.anims.isPlaying) {
                this.player.anims.stop();
                this.setIdleFrame();
            }
            this.backpack.toggle();
        };
        this.input.keyboard.on('keydown-E', toggleBag);
        this.input.keyboard.on('keydown-I', toggleBag);
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.backpack && this.backpack.active) this.backpack.close();
        });

        // Inspect interaction
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.isTransitioning || this.isMoving) return;
            if (this.dialogue && this.dialogue.active) return;
            if (this.backpack && this.backpack.active) return;

            const [dx, dy] = this.getDeltaFromDir(this.facing);
            const targetX = this.tileX + dx;
            const targetY = this.tileY + dy;

            if (targetX >= 0 && targetX < this.currentArea.width &&
                targetY >= 0 && targetY < this.currentArea.height) {
                
                const targetTileIndex = this.tileData[targetY][targetX];

                if (targetTileIndex === 192) {
                    if (this.player.anims.isPlaying) {
                        this.player.anims.stop();
                        this.setIdleFrame();
                    }
                    this.dialogue.show(['Its a rock...']);
                }
            }
        });

        // Show intro dialogue
        this.dialogue.show([
            'You woke up \n \n \n Press space to continue..',
            'You feel tired..\n \n \n Press E or I to open backpack'
        ]);

        this.updateEnergyUI();
    }

    updateEnergyUI() {
        const fill = document.getElementById('energy-bar-fill');
        const num = document.getElementById('energy-number');
        if (fill) {
            const percent = Math.max(0, (this.energy / 200) * 100);
            fill.style.width = `${percent}%`;
        }
        if (num) {
            num.innerText = Math.floor(Math.max(0, this.energy));
        }
    }

    async loadArea(csvPath, startTileX, startTileY) {
        const response = await fetch(csvPath);
        const text = await response.text();
        const rows = text.trim().split('\n');
        
        this.tileData = rows.map(r => r.split(',').map(Number));

        this.currentArea = {
            width: this.tileData[0].length,
            height: this.tileData.length,
            doors: []
        };

        if (csvPath.includes('serveriquest.csv')) {
            this.currentArea.doors.push({ x: 8, y: 1, targetArea: '/puzzle-8/data/House.csv', targetX: 2, targetY: 11 });
        } else if (csvPath.includes('House.csv')) {
            this.currentArea.doors.push({ x: 2, y: 11, targetArea: '/puzzle-8/data/serveriquest.csv', targetX: 8, targetY: 1 });
        }

        this.tileX = startTileX;
        this.tileY = startTileY;

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
        const areaWidthPx = this.currentArea.width * Game.TILE_SIZE;
        const areaHeightPx = this.currentArea.height * Game.TILE_SIZE;
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
        if (this.energy <= 0) {
            this.player.anims.stop();
            this.setIdleFrame();
            if (this.dialogue && !this.dialogue.active) {
                this.dialogue.show(['You are too tired to move']);
            }
            return;
        }

        const targetX = this.tileX + dx;
        const targetY = this.tileY + dy;

        if (targetX < 0 || targetX >= this.currentArea.width ||
            targetY < 0 || targetY >= this.currentArea.height) {
            this.player.play(`walk-${this.facing}`, true);
            return;
        }

        // Check solids against cached tile data
        const targetTileIndex = this.tileData[targetY][targetX];
        const walkthroughTiles = [0, 1, 288, 682, 683, 273];
        const isWalkable = walkthroughTiles.includes(targetTileIndex) || targetTileIndex > 2816;

        const cliffs = {
            'up': 13,
            'down': 141,
            'right': 78,
            'left': 76
        };

        let finalTargetX = targetX;
        let finalTargetY = targetY;
        let isJumping = false;
        let jumpDistance = 1;

        if (targetTileIndex === cliffs[this.facing]) {
            isJumping = true;
            let testX = targetX;
            let testY = targetY;
            
            while (
                testX >= 0 && testX < this.currentArea.width &&
                testY >= 0 && testY < this.currentArea.height &&
                this.tileData[testY][testX] === cliffs[this.facing]
            ) {
                testX += dx;
                testY += dy;
                jumpDistance++;
            }
            
            if (testX < 0 || testX >= this.currentArea.width || testY < 0 || testY >= this.currentArea.height) {
                this.player.play(`walk-${this.facing}`, true);
                return;
            }
            
            const landingTile = this.tileData[testY][testX];
            const landingWalkable = walkthroughTiles.includes(landingTile) || landingTile > 2816;
            
            if (!landingWalkable) {
                this.player.play(`walk-${this.facing}`, true);
                return;
            }
            
            finalTargetX = testX;
            finalTargetY = testY;
        } else if (!isWalkable) {
            this.player.play(`walk-${this.facing}`, true);
            return;
        }

        this.isMoving = true;
        this.player.play(`walk-${this.facing}`, true);

        const targetPxX = finalTargetX * Game.TILE_SIZE;
        const targetPxY = finalTargetY * Game.TILE_SIZE;

        if (isJumping) {
            this.shadow.setPosition(this.player.x, this.player.y);
            this.shadow.setVisible(true);

            this.tweens.add({
                targets: this.shadow,
                x: targetPxX,
                y: targetPxY,
                duration: (Game.TWEEN_DURATION * 0.8 * jumpDistance),
                ease: 'Linear'
            });

            this.tweens.add({
                targets: this.player,
                displayOriginY: 10,
                duration: (Game.TWEEN_DURATION * jumpDistance) / 2,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }

        this.tweens.add({
            targets: this.player,
            x: targetPxX,
            y: targetPxY,
            duration: isJumping ? (Game.TWEEN_DURATION * 0.8 * jumpDistance) : Game.TWEEN_DURATION,
            ease: 'Linear',
            onComplete: () => {
                this.tileX = finalTargetX;
                this.tileY = finalTargetY;
                this.isMoving = false;
                this.player.displayOriginY = 0;
                this.shadow.setVisible(false);

                // Decrease energy for each tile moved
                this.energy = Math.max(0, this.energy - 1);
                this.updateEnergyUI();

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
                    this.loadArea(door.targetArea, door.targetX, door.targetY).then(() => {
                        this.cameras.main.fadeIn(250, 0, 0, 0, (cam, prog) => {
                            if (prog === 1) {
                                this.isTransitioning = false;
                            }
                        });
                    });
                }
            });
            return true;
        }
        return false;
    }
};
