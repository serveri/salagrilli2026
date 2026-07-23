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
        this.energy = 150;
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

        // Police Animations (16x18, 4 columns)
        this.anims.create({
            key: 'poliisi-walk-down',
            frames: this.anims.generateFrameNumbers('poliisi', { frames: [0, 1, 2, 3] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'poliisi-walk-up',
            frames: this.anims.generateFrameNumbers('poliisi', { frames: [4, 5, 6, 7] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'poliisi-walk-left',
            frames: this.anims.generateFrameNumbers('poliisi', { frames: [8, 9, 10, 11] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'poliisi-walk-right',
            frames: this.anims.generateFrameNumbers('poliisi', { frames: [12, 13, 14, 15] }),
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
        this.loadArea('/puzzle-8/data/serveriquest.csv', 89, 30).then(() => {
            // Camera fade in when game starts (after menu)
            this.cameras.main.setVisible(true);
            this.cameras.main.fadeIn(900, 0, 0, 0);

            // Show intro dialogue
            this.player.setFrame(11);
            this.dialogue.show([
                'You woke up \n \n \n Press space to continue..',
                'You feel tired..\n \n \n Press E or I to open backpack'
            ], () => {
                this.setIdleFrame();
            });
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

                const inspectMessages = {
                    192: ['Its a rock...'], 193: ['Its a rock...'], 194: ['Its a rock...'],
                    260: ['Every Serveri loves grilling!'],
                    3269: ['Rubbish old Skoda'], 3270: ['Rubbish old Skoda'], 3208: ['Rubbish old Skoda'], 3272: ['Rubbish old Skoda'],
                    3141: ['Audi 50 '], 3142: ['Audi 50 '], 3143: ['Audi 50 '], 3079: ['Audi 50 '],
                    3077: ['Wolksvagen golf GTI'], 3078: ['Wolksvagen golf GTI'], 3144: ['Wolksvagen golf GTI'], 3080: ['Wolksvagen golf GTI'],
                    3205: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3206: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3271: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3207: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'],
                    3138: ['Might be related to triangle man'], 3074: ['Its good thing there is not much traffic'], 195: ['Its a barrel, or a pipe maybe?'], 132: ['Just a bush'], 2762: ['Some old tires'], 2757: ['Damn construction!'], 2758: ['Damn construction!'],
                    2759: ['Damn construction!']
                };

                let interacted = false;

                if (inspectMessages[targetTileIndex]) {
                    this.dialogue.show(inspectMessages[targetTileIndex]);
                    interacted = true;
                } else if (targetTileIndex === 196 || targetTileIndex === 68) {
                    this.backpack.items.push({
                        id: 'berry_' + Date.now(), // unique ID to allow multiple berries
                        name: 'Berry',
                        desc: 'A fresh berry picked from a bush.',
                        canUse: true
                    });

                    // Update tile logically and visually
                    this.tileData[targetY][targetX] = 132;
                    if (this.layer) {
                        this.layer.putTileAt(132, targetX, targetY);
                    }

                    this.dialogue.show(['You found a berry!']);
                    interacted = true;
                } else if ([2, 3, 133, 197, 134, 198].includes(targetTileIndex)) {
                    this.isTransitioning = true;
                    this.player.play(`walk-${this.facing}`, true);
                    this.tweens.add({
                        targets: this.player,
                        x: targetX * Game.TILE_SIZE,
                        y: targetY * Game.TILE_SIZE,
                        duration: Game.TWEEN_DURATION,
                        ease: 'Linear',
                        onComplete: () => {
                            this.player.anims.stop();
                            this.player.setFrame(11);
                            if (this.energy < 50) {
                                this.energy = 50;
                                this.updateEnergyUI();
                                this.dialogue.show(['You rested on the bench.', 'You feel a bit better.'], () => {
                                    this.walkBackFromBench(this.tileX, this.tileY);
                                });
                            } else {
                                this.dialogue.show(['You are not tired enough to rest.'], () => {
                                    this.walkBackFromBench(this.tileX, this.tileY);
                                });
                            }
                        }
                    });
                    interacted = true;
                } else if (targetTileIndex === 4) {
                    const signKey = `${this.currentArea.name}_${targetX}_${targetY}`;
                    const signMessages = {
                        'serveriquest_66_24': ['Neulamäki karting', 'Open 10-19'],
                        'serveriquest_54_21': ['Road to Neulamäki'],
                        'serveriquest_54_4': ['Road to Savilahti'],
                        'House_3_8': ['Home sweet home.'],
                        // Add more signs here as needed
                    };

                    const msg = signMessages[signKey] || [`[Sign at ${targetX}, ${targetY}]`, 'Edit GameScene.js to add text here!'];
                    this.dialogue.show(msg);
                    interacted = true;
                }

                if (interacted && this.player.anims.isPlaying) {
                    this.player.anims.stop();
                    this.setIdleFrame();
                }
            }
        });

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
        let loadingEl = document.getElementById('game-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'game-loading';
            loadingEl.style.position = 'absolute';
            loadingEl.style.top = '50%';
            loadingEl.style.left = '50%';
            loadingEl.style.transform = 'translate(-50%, -50%)';
            loadingEl.style.color = '#ffffff';
            loadingEl.style.fontFamily = "'Pokemon Classic', 'Courier New', monospace";
            loadingEl.style.fontSize = '24px';
            loadingEl.style.zIndex = '9999';
            loadingEl.style.textShadow = '2px 2px 0 #000';
            loadingEl.style.pointerEvents = 'none';
            loadingEl.innerText = 'LOADING...';
            document.body.appendChild(loadingEl);
        }
        loadingEl.style.display = 'block';

        const response = await fetch(csvPath);
        const text = await response.text();
        const rows = text.trim().split('\n');

        this.tileData = rows.map(r => r.split(',').map(Number));

        this.currentArea = {
            name: csvPath.split('/').pop().replace('.csv', ''),
            width: this.tileData[0].length,
            height: this.tileData.length
        };

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

        // Spawn Police if in serveriquest
        if (this.police) {
            this.police.sprite.destroy();
            this.police = null;
        }

        if (this.currentArea.name === 'serveriquest') {
            const px = 37;
            const py = 42;
            this.police = {
                tileX: px,
                tileY: py,
                facing: 'down',
                isMoving: false,
                hasSeenPlayer: false,
                isStunned: false,
                sprite: this.add.sprite(px * Game.TILE_SIZE, py * Game.TILE_SIZE - 2, 'poliisi', 0).setOrigin(0, 0).setDepth(10)
            };
        }

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

        const endLoadingEl = document.getElementById('game-loading');
        if (endLoadingEl) {
            endLoadingEl.style.display = 'none';
        }
    }

    update(time, delta) {
        // Keep UI systems positioned relative to camera
        if (this.dialogue) {
            this.dialogue.updatePosition();
        }
        if (this.backpack) {
            this.backpack.updatePosition();
        }

        this.updatePolice(time, delta);

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
                this.dialogue.show(['You are too tired to move.'], null, [
                    {
                        text: 'Inventory', onClick: () => {
                            this.backpack.open();
                            // Optional: since they open inventory, we close dialogue natively but they might heal
                        }
                    },
                    {
                        text: 'Restart', color: '#880000', hoverColor: '#ff0000', onClick: () => {
                            window.location.reload();
                        }
                    }
                ]);
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
        const walkthroughTiles = [0, 1, 199, 200, 288, 517, 518, 581, 582, 645, 682, 683, 273, 2816, 2817, 2818, 2819, 2820, 2821, 2822, 2823, 2824, 2825, 2826, 2827, 2828, 2829,
            2830, 2831, 2832, 2833, 2880, 2881, 2882, 2883, 2884, 2885, 2886, 2887, 2888, 2889, 2890, 2891, 2892, 2893, 2894, 2895, 2896,
            2944, 2945, 2946, 2947, 3008, 3009, 3010, 3011, 2631, 436, 1370, 451, 2633, 2631, 320, 384, 448, 69, 70, 5, 6, 1829, 1831, 2021, 2023
        ];
        const isWalkable = walkthroughTiles.includes(targetTileIndex);


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

    teleportSameMap(x, y) {
        this.isTransitioning = true;
        this.player.anims.stop();
        this.setIdleFrame();

        this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
            if (progress === 1) {
                this.tileX = x;
                this.tileY = y;
                this.player.setPosition(x * Game.TILE_SIZE, y * Game.TILE_SIZE);
                this.cameras.main.fadeIn(250, 0, 0, 0, (cam, prog) => {
                    if (prog === 1) {
                        this.isTransitioning = false;
                        const [dx, dy] = this.getDeltaFromDir(this.facing);
                        this.tryMove(dx, dy);
                    }
                });
            }
        });
    } checkDoorTrigger() {
        const currentTile = this.tileData[this.tileY][this.tileX];

        if (currentTile === 199) {
            this.teleportSameMap(this.tileX + 3, this.tileY);
            return true;
        } else if (currentTile === 200) {
            this.teleportSameMap(this.tileX - 3, this.tileY);
            return true;
        }

        const mapTransitions = {
            'serveriquest': {
                2631: { targetMap: '/puzzle-8/data/NeulamaenSale.csv', targetX: 1, targetY: 2 },
                2633: { targetMap: '/puzzle-8/data/savilahti.csv', targetX: 4, targetY: 6 },
                1370: { targetMap: '/puzzle-8/data/House.csv', targetX: 2, targetY: 11 }
            },
            'NeulamaenSale': {
                2021: { targetMap: '/puzzle-8/data/serveriquest.csv', targetX: 13, targetY: 48 },
                2023: { targetMap: '/puzzle-8/data/serveriquest.csv', targetX: 13, targetY: 48 }
            },
            'savilahti': {
                2631: { targetMap: '/puzzle-8/data/serveriquest.csv', targetX: 57, targetY: 0 }
            },
            'House': {
                1829: { targetMap: '/puzzle-8/data/serveriquest.csv', targetX: 38, targetY: 52 },
                1831: { targetMap: '/puzzle-8/data/serveriquest.csv', targetX: 38, targetY: 52 }
            }
        };

        const areaTransitions = mapTransitions[this.currentArea.name] || {};
        const transition = areaTransitions[currentTile];

        if (transition) {
            this.isTransitioning = true;
            this.player.anims.stop();
            this.setIdleFrame();

            this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
                if (progress === 1) {
                    this.loadArea(transition.targetMap, transition.targetX, transition.targetY).then(() => {
                        this.cameras.main.fadeIn(250, 0, 0, 0, (cam, prog) => {
                            if (prog === 1) {
                                this.isTransitioning = false;
                                const [dx, dy] = this.getDeltaFromDir(this.facing);
                                this.tryMove(dx, dy);
                            }
                        });
                    });
                }
            });
            return true;
        }

        return false;
    }

    updatePolice(time, delta) {
        if (!this.police) return;
        if (this.police.isMoving) return;
        if (this.isTransitioning) return;
        if (this.dialogue && this.dialogue.active) {
            if (this.police.sprite.anims.isPlaying) {
                this.police.sprite.anims.stop();
                this.setPoliceIdleFrame();
            }
            return;
        }

        // Calculate Manhattan distance to player
        const dist = Math.abs(this.police.tileX - this.tileX) + Math.abs(this.police.tileY - this.tileY);

        // If player is caught
        if (dist === 1) {
            if (this.police.sprite.anims.isPlaying) {
                this.police.sprite.anims.stop();
            }
            // Face the player
            if (this.police.tileX > this.tileX) this.police.facing = 'left';
            else if (this.police.tileX < this.tileX) this.police.facing = 'right';
            else if (this.police.tileY > this.tileY) this.police.facing = 'up';
            else if (this.police.tileY < this.tileY) this.police.facing = 'down';
            this.setPoliceIdleFrame();

            // Stop player and dialogue
            if (this.player.anims.isPlaying) {
                this.player.anims.stop();
                this.setIdleFrame();
            }
            this.isTransitioning = true; // lock player out

            this.dialogue.show(['You are under arrest'], () => {
                this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
                    if (progress === 1) {
                        this.loadArea('/puzzle-8/data/savilahti.csv', 4, 6).then(() => {
                            this.cameras.main.fadeIn(250, 0, 0, 0, (cam, prog) => {
                                if (prog === 1) {
                                    this.isTransitioning = false;
                                }
                            });
                        });
                    }
                });
            });
            return;
        }

        // If in range (<= 5), chase!
        if (dist > 1 && dist <= 5) {
            if (!this.police.hasSeenPlayer) {
                this.police.hasSeenPlayer = true;
                this.police.isStunned = true;

                // Stop any previous animation
                if (this.police.sprite.anims.isPlaying) {
                    this.police.sprite.anims.stop();
                    this.setPoliceIdleFrame();
                }

                // Show ! above police
                const alertText = this.add.text(this.police.sprite.x + 8, this.police.sprite.y - 8, '!', {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '8px',
                    color: '#ff0000',
                    stroke: '#000000',
                    strokeThickness: 1
                }).setOrigin(0.5).setDepth(20).setResolution(2);

                this.tweens.add({
                    targets: alertText,
                    y: alertText.y - 4,
                    duration: 300,
                    yoyo: true,
                    onComplete: () => {
                        alertText.destroy();
                        this.police.isStunned = false;
                    }
                });
                return;
            }

            if (this.police.isStunned) return;

            // Find direction to move
            const dx = this.tileX - this.police.tileX;
            const dy = this.tileY - this.police.tileY;

            let moveX = 0, moveY = 0;
            let tryDir = null;

            if (Math.abs(dx) > Math.abs(dy)) {
                // Try X first
                moveX = Math.sign(dx);
                tryDir = moveX > 0 ? 'right' : 'left';
            } else {
                // Try Y first
                moveY = Math.sign(dy);
                tryDir = moveY > 0 ? 'down' : 'up';
            }

            // Fallback if blocked
            if (!this.canPoliceMove(this.police.tileX + moveX, this.police.tileY + moveY)) {
                if (moveX !== 0) {
                    moveX = 0;
                    moveY = Math.sign(dy) || 1; // Try Y if X is blocked
                    tryDir = moveY > 0 ? 'down' : 'up';
                } else {
                    moveY = 0;
                    moveX = Math.sign(dx) || 1; // Try X if Y is blocked
                    tryDir = moveX > 0 ? 'right' : 'left';
                }
            }

            if (this.canPoliceMove(this.police.tileX + moveX, this.police.tileY + moveY)) {
                this.police.facing = tryDir;
                this.police.isMoving = true;
                this.police.sprite.play(`poliisi-walk-${this.police.facing}`, true);

                const targetX = this.police.tileX + moveX;
                const targetY = this.police.tileY + moveY;
                const targetPxX = targetX * Game.TILE_SIZE;
                const targetPxY = targetY * Game.TILE_SIZE - 2;

                this.tweens.add({
                    targets: this.police.sprite,
                    x: targetPxX,
                    y: targetPxY,
                    duration: Game.TWEEN_DURATION + 10, // Same speed as player
                    ease: 'Linear',
                    onComplete: () => {
                        this.police.tileX = targetX;
                        this.police.tileY = targetY;
                        this.police.isMoving = false;
                    }
                });
            } else {
                // Blocked entirely
                if (this.police.sprite.anims.isPlaying) {
                    this.police.sprite.anims.stop();
                    this.setPoliceIdleFrame();
                }
            }
        } else {
            // Not in range, just stand still
            this.police.hasSeenPlayer = false; // Reset alert so it triggers again if re-entered
            if (this.police.sprite.anims.isPlaying) {
                this.police.sprite.anims.stop();
                this.setPoliceIdleFrame();
            }
        }
    }

    setPoliceIdleFrame() {
        if (!this.police) return;
        switch (this.police.facing) {
            case 'down': this.police.sprite.setFrame(0); break;
            case 'up': this.police.sprite.setFrame(4); break;
            case 'left': this.police.sprite.setFrame(8); break;
            case 'right': this.police.sprite.setFrame(12); break;
        }
    }

    canPoliceMove(targetX, targetY) {
        if (targetX < 0 || targetX >= this.currentArea.width || targetY < 0 || targetY >= this.currentArea.height) {
            return false;
        }

        // Prevent walking on player tile
        if (targetX === this.tileX && targetY === this.tileY) {
            return false;
        }

        const targetTileIndex = this.tileData[targetY][targetX];
        const walkthroughTiles = [0, 1, 199, 200, 288, 517, 518, 581, 582, 645, 682, 683, 273, 2816, 2817, 2818, 2819, 2820, 2821, 2822, 2823, 2824, 2825, 2826, 2827, 2828, 2829,
            2830, 2831, 2832, 2833, 2880, 2881, 2882, 2883, 2884, 2885, 2886, 2887, 2888, 2889, 2890, 2891, 2892, 2893, 2894, 2895, 2896,
            2944, 2945, 2946, 2947, 3008, 3009, 3010, 3011, 2631, 436, 1370, 451, 2633, 320, 384, 448, 69, 70, 5, 6, 1829, 1831, 2021, 2023
        ];

        return walkthroughTiles.includes(targetTileIndex);
    }

    walkBackFromBench(origX, origY) {
        const oppFacing = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        }[this.facing];

        this.player.play(`walk-${oppFacing}`, true);
        this.tweens.add({
            targets: this.player,
            x: origX * Game.TILE_SIZE,
            y: origY * Game.TILE_SIZE,
            duration: Game.TWEEN_DURATION,
            ease: 'Linear',
            onComplete: () => {
                this.player.anims.stop();
                this.setIdleFrame();
                this.isTransitioning = false;
            }
        });
    }
};
