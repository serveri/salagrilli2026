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
        this.isMapOpen = false;
        this.isExamOpen = false;
    }

    create() {
        // Walk Animations
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('player', { frames: [0, 1, 2, 3] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('player', { frames: [4, 5, 6, 7] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('player', { frames: [8, 9, 10, 11] }),
            frameRate: 9,
            repeat: -1
        });
        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('player', { frames: [12, 13, 14, 15] }),
            frameRate: 9,
            repeat: -1
        });

        // Pencil spin animation (6 frames)
        this.anims.create({
            key: 'pencil-spin',
            frames: this.anims.generateFrameNumbers('pencil', { frames: [0, 1, 2, 3, 4, 5] }),
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
            'playerextra', 0
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
            this.player.setTexture('playerextra', 1);
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
        this.pendingBackpackOpen = false;

        // Exam system
        this.exam = new Game.Exam(this);

        this.openBackpackSafely = () => {
            if (this.player.anims.isPlaying) {
                this.player.anims.stop();
                this.setIdleFrame();
            }
            this.backpack.open();
        };

        // Toggle backpack with 'E' or 'I' key
        const toggleBag = () => {
            if (this.dialogue && this.dialogue.active) return;
            if (this.isMapOpen || this.isExamOpen) return;

            if (this.backpack && this.backpack.active) {
                this.backpack.close();
                this.pendingBackpackOpen = false;
                return;
            }

            if (this.isMoving || this.isTransitioning) {
                this.pendingBackpackOpen = true;
                return;
            }

            this.openBackpackSafely();
        };
        this.input.keyboard.on('keydown-E', toggleBag);
        this.input.keyboard.on('keydown-I', toggleBag);
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.backpack && this.backpack.active) this.backpack.close();
            this.pendingBackpackOpen = false;
        });

        // Inspect interaction
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.isTransitioning || this.isMoving || this.isMapOpen || this.isExamOpen) return;
            if (this.dialogue && this.dialogue.active) return;
            if (this.backpack && this.backpack.active) return;

            const [dx, dy] = this.getDeltaFromDir(this.facing);
            const targetX = this.tileX + dx;
            const targetY = this.tileY + dy;

            if (targetX >= 0 && targetX < this.currentArea.width &&
                targetY >= 0 && targetY < this.currentArea.height) {

                const targetTileIndex = this.tileData[targetY][targetX];

                let interacted = false;

                if (this.sleepingServeri && targetX === this.sleepingServeri.tileX && targetY === this.sleepingServeri.tileY) {
                    Game.state = Game.state || {};
                    if (!Game.state.serveriWoken) {
                        this.dialogue.show(['The serveri is fast asleep']);
                    } else {
                        if (!Game.state.cheatSheetGiven) {
                            this.dialogue.show(['That delicous smell of coffee woke me up!', 'Look, I got this cheat sheet..', 'Take it, I\'m probably not gonna make it to the exam anyway..'], () => {
                                this.backpack.items.push({
                                    id: 'cheat_sheet',
                                    name: 'Cheat sheet',
                                    desc: 'Looks useful for the exam.',
                                    canUse: false
                                });
                                Game.state.cheatSheetGiven = true;
                            });
                        } else {
                            this.dialogue.show(['Good luck on the exam!']);
                        }
                    }
                    interacted = true;
                }

                if (!interacted && targetTileIndex === 700) {
                    Game.state = Game.state || {};
                    if (!Game.state.serveriWoken) {
                        this.dialogue.show(['Make coffee?'], null, [
                            {
                                text: 'Yes', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                    this.backpack.items.push({
                                        id: 'cup_of_coffee',
                                        name: 'Cup of coffee',
                                        desc: 'Freshly made coffee.',
                                        canUse: false
                                    });
                                    Game.state.serveriWoken = true;

                                    this.dialogue.show(['You made a cup of coffee. The smell fills the room.'], () => {
                                        if (this.currentArea.name === 'Laitos' && this.sleepingServeri) {
                                            this.sleepingServeri.tileY = 8;
                                            this.sleepingServeri.sprite.setTexture('player');
                                            this.sleepingServeri.sprite.play('walk-down', true);
                                            this.tweens.add({
                                                targets: this.sleepingServeri.sprite,
                                                y: 8 * Game.TILE_SIZE - 2,
                                                duration: Game.TWEEN_DURATION * 2,
                                                ease: 'Linear',
                                                onComplete: () => {
                                                    this.sleepingServeri.sprite.anims.stop();
                                                    this.sleepingServeri.sprite.setFrame(0);
                                                }
                                            });
                                        }
                                    });
                                }
                            },
                            { text: 'No', onClick: () => { } }
                        ]);
                    } else {
                        this.dialogue.show(['The coffee pot is empty.']);
                    }
                    interacted = true;
                }

                if (!interacted && this.assistant && targetX === this.assistant.tileX && targetY === this.assistant.tileY) {
                    if (this.facing === 'up') this.assistant.facing = 'down';
                    else if (this.facing === 'down') this.assistant.facing = 'up';
                    else if (this.facing === 'left') this.assistant.facing = 'right';
                    else if (this.facing === 'right') this.assistant.facing = 'left';

                    switch (this.assistant.facing) {
                        case 'down': this.assistant.sprite.setFrame(0); break;
                        case 'up': this.assistant.sprite.setFrame(4); break;
                        case 'left': this.assistant.sprite.setFrame(8); break;
                        case 'right': this.assistant.sprite.setFrame(12); break;
                    }

                    const stories = [
                        [
                            'Do you know what happened to Niilo22?',
                            'He bought a new bike, and immediately lost the keys...',
                            'Then he complained about it on video for 20 minutes.',
                            'Classic Niilo!'
                        ],
                        [
                            'Have you heard? Niilo22 tried to make coffee..',
                            'He broke a hole in the bottom of his coffee pot!',
                            'Then he blamed the coffee maker manufacturer.',
                            'Never change, Niilo!'
                        ],
                        [
                            'Did you see the latest Niilo22 video?',
                            'He reviewed a frozen pizza...',
                            'But forgot to take the plastic off before putting it in the oven!',
                            'What a legend!'
                        ]
                    ];
                    const story = stories[Math.floor(Math.random() * stories.length)];

                    this.dialogue.show(story, () => {
                        if (!this.assistantEnergyGiven) {
                            this.dialogue.show(['The funny story lifts your spirits!'], () => {
                                const old = this.energy;
                                this.energy = Math.min(200, this.energy + 50);
                                this.addEnergyDiff(this.energy - old);
                                this.assistantEnergyGiven = true;
                            });
                        } else {
                            this.dialogue.show(['Niilo22 stories don\'t entertain you anymore.']);
                        }
                    });

                    interacted = true;
                }

                if (!interacted && this.isDoorLocked(targetX, targetY)) {
                    this.handleLockedDoor(targetX, targetY);
                    interacted = true;
                }

                if (!interacted && targetTileIndex === 3138) {
                    this.dialogue.show(['Take the traffic sign?'], null, [
                        {
                            text: 'Yes', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                this.backpack.items.push({
                                    id: 'sign_' + targetX + '_' + targetY,
                                    name: 'Traffic Sign',
                                    desc: 'Might be related to triangle man.',
                                    canUse: false
                                });

                                this.tileData[targetY][targetX] = 3008;
                                if (this.layer) {
                                    this.layer.putTileAt(3008, targetX, targetY);
                                }

                                Game.state = Game.state || {};
                                Game.state.takenSigns = Game.state.takenSigns || [];
                                Game.state.takenSigns.push({
                                    area: this.currentArea.name,
                                    x: targetX,
                                    y: targetY
                                });
                            }
                        },
                        {
                            text: 'No', color: '#880000', hoverColor: '#cc0000', onClick: () => {
                            }
                        }
                    ]);
                    interacted = true;
                }
                
                if (!interacted && targetTileIndex === 1055) {
                    this.dialogue.show(['Sit down for the exam?'], null, [
                        {
                            text: 'Yes', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                this.exam.open();
                            }
                        },
                        {
                            text: 'No', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                        }
                    ]);
                    interacted = true;
                }

                if (!interacted && Game.INSPECT_MESSAGES[targetTileIndex]) {
                    this.dialogue.show(Game.INSPECT_MESSAGES[targetTileIndex]);
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
                            this.player.setTexture('playerextra', 1);
                            if (this.energy < 50) {
                                const old = this.energy;
                                this.energy = 50;
                                this.addEnergyDiff(this.energy - old);
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
                } else if (targetTileIndex === 4 || targetTileIndex === 2756) {
                    const signKey = `${this.currentArea.name}_${targetX}_${targetY}`;
                    const msg = Game.SIGN_MESSAGES[signKey] || [`[Sign at ${targetX}, ${targetY}]`, 'Edit config.js to add text here!'];
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

    addEnergyDiff(diff) {
        if (diff === 0) return;

        if (this.energyDiffStack > 0 && diff < 0) {
            this.energyDiffStack = diff;
        } else if (this.energyDiffStack < 0 && diff > 0) {
            this.energyDiffStack = diff;
        } else {
            this.energyDiffStack = (this.energyDiffStack || 0) + diff;
        }

        this.cancelEnergyLostReset();
        this.updateEnergyUI();
    }

    updateEnergyUI() {
        const fill = document.getElementById('energy-bar-fill');
        const num = document.getElementById('energy-number');
        if (fill) {
            const percent = Math.max(0, (this.energy / 200) * 100);
            fill.style.width = `${percent}%`;
            if (this.energy <= 25) {
                fill.style.backgroundColor = '#ff4444'; // Red
            } else {
                fill.style.backgroundColor = '#FFD700'; // Yellow
            }
        }
        if (num) {
            const valEl = document.getElementById('energy-val');
            if (valEl) {
                valEl.innerText = Math.floor(Math.max(0, this.energy));
            } else {
                num.innerText = Math.floor(Math.max(0, this.energy));
            }

            const lostEl = document.getElementById('energy-lost');
            if (lostEl) {
                if (this.energyDiffStack < 0) {
                    lostEl.style.display = 'inline-block';
                    lostEl.innerText = `${this.energyDiffStack}`;
                    lostEl.style.color = '#cc0000';
                } else if (this.energyDiffStack > 0) {
                    lostEl.style.display = 'inline-block';
                    lostEl.innerText = `+${this.energyDiffStack}`;
                    lostEl.style.color = '#00cc00';
                } else {
                    lostEl.style.display = 'none';
                }
            }
        }
    }

    cancelEnergyLostReset() {
        if (this.resetEnergyTimer) {
            this.resetEnergyTimer.remove();
            this.resetEnergyTimer = null;
        }
        if (this.fadeEnergyTimer) {
            this.fadeEnergyTimer.remove();
            this.fadeEnergyTimer = null;
        }
        const lostEl = document.getElementById('energy-lost');
        if (lostEl) {
            lostEl.style.transition = '';
            lostEl.style.opacity = '1';
        }
    }

    resetEnergyLostStack() {
        if (this.energyDiffStack !== 0 && this.energyDiffStack !== undefined && !this.resetEnergyTimer) {
            this.resetEnergyTimer = this.time.delayedCall(800, () => {
                const lostEl = document.getElementById('energy-lost');
                if (lostEl) {
                    lostEl.style.transition = 'opacity 0.5s ease-out';
                    lostEl.style.opacity = '0';

                    this.fadeEnergyTimer = this.time.delayedCall(500, () => {
                        lostEl.style.display = 'none';
                        lostEl.style.transition = '';
                        lostEl.style.opacity = '1';
                        this.energyDiffStack = 0;
                        this.resetEnergyTimer = null;
                        this.fadeEnergyTimer = null;
                    });
                }
            });
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

        const rawData = rows.map(r => r.split(',').map(Number));

        // Tiled stores flip/rotation flags in the top 3 bits, which makes numbers huge or negative
        // We mask with 0x1FFFFFFF to get the real tile ID for our game logic (collisions, interactions)
        this.tileData = rawData.map(row => row.map(val => val & 0x1FFFFFFF));

        this.currentArea = {
            name: csvPath.split('/').pop().replace('.csv', ''),
            width: this.tileData[0].length,
            height: this.tileData.length
        };

        this.tileX = startTileX;
        this.tileY = startTileY;
        this.activeDoorEffect = null;

        if (Game.state && Game.state.takenSigns) {
            Game.state.takenSigns.forEach(sign => {
                if (sign.area === this.currentArea.name) {
                    if (this.tileData[sign.y] && this.tileData[sign.y][sign.x] === 3138) {
                        this.tileData[sign.y][sign.x] = 3008;
                    }
                }
            });
        }

        // Rebuild Tilemap
        if (this.tilemap) this.tilemap.destroy();

        this.tilemap = this.make.tilemap({
            data: this.tileData,
            tileWidth: Game.TILE_SIZE,
            tileHeight: Game.TILE_SIZE
        });

        const tileset = this.tilemap.addTilesetImage('tiles', 'tiles', 16, 16, 0, 0);
        this.layer = this.tilemap.createLayer(0, tileset, 0, 0);
        this.layer.setDepth(0);

        // Apply visual flips and rotations to the Phaser layer
        this.layer.forEachTile(tile => {
            const rawVal = rawData[tile.y][tile.x];
            // If any of the top 3 bits are set
            if (rawVal < 0 || rawVal > 0x1FFFFFFF) {
                const flipH = (rawVal & 0x80000000) !== 0;
                const flipV = (rawVal & 0x40000000) !== 0;
                const flipD = (rawVal & 0x20000000) !== 0;

                if (flipD) {
                    tile.rotation = Math.PI / 2;
                    tile.flipX = flipV;
                    tile.flipY = !flipH;
                } else {
                    tile.flipX = flipH;
                    tile.flipY = flipV;
                }
            }
        });

        this.overlayLayer = this.tilemap.createBlankLayer(
            'overlay',
            tileset,
            0,
            0,
            this.currentArea.width,
            this.currentArea.height,
            Game.TILE_SIZE,
            Game.TILE_SIZE
        );
        this.overlayLayer.setDepth(15);

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

        // Spawn Assistant if in Laitos
        if (this.assistant) {
            this.assistant.sprite.destroy();
            this.assistant = null;
        }
        if (this.sleepingServeri) {
            this.sleepingServeri.sprite.destroy();
            this.sleepingServeri = null;
        }

        if (this.currentArea.name === 'Laitos') {
            const ax = 20;
            const ay = 9;
            this.assistant = {
                tileX: ax,
                tileY: ay,
                facing: 'down',
                sprite: this.add.sprite(ax * Game.TILE_SIZE, ay * Game.TILE_SIZE - 4, 'opetusavustaja', 0).setOrigin(0, 0).setDepth(10)
            };

            Game.state = Game.state || {};
            const sy = Game.state.serveriWoken ? 8 : 7;
            const tex = Game.state.serveriWoken ? 'player' : 'playerextra';
            const frame = Game.state.serveriWoken ? 0 : 1;
            this.sleepingServeri = {
                tileX: 28,
                tileY: sy,
                facing: 'down',
                sprite: this.add.sprite(28 * Game.TILE_SIZE, sy * Game.TILE_SIZE - 2, tex, frame).setOrigin(0, 0).setDepth(10)
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

        if (this.exam && this.exam.isOpen) {
            this.exam.update(time, delta);
        }

        if (this.isTransitioning || (this.dialogue && this.dialogue.active) || (this.backpack && this.backpack.active) || this.isMapOpen || this.isExamOpen || this.pendingBackpackOpen) {
            this.resetEnergyLostStack();
            return;
        }

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
            this.resetEnergyLostStack();
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
        let dir = null;
        if (this.cursors.left.isDown || this.wasd.left.isDown) dir = 'left';
        else if (this.cursors.right.isDown || this.wasd.right.isDown) dir = 'right';
        else if (this.cursors.up.isDown || this.wasd.up.isDown) dir = 'up';
        else if (this.cursors.down.isDown || this.wasd.down.isDown) dir = 'down';

        if (dir && this.reverseControlsSteps > 0) {
            const reversed = { 'left': 'right', 'right': 'left', 'up': 'down', 'down': 'up' };
            return reversed[dir];
        }
        return dir;
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
        if (this.player.texture.key !== 'player') {
            this.player.setTexture('player');
        }
        switch (this.facing) {
            case 'down': this.player.setFrame(0); break;
            case 'up': this.player.setFrame(4); break;
            case 'left': this.player.setFrame(8); break;
            case 'right': this.player.setFrame(12); break;
        }
    }

    setSteppingFrame() {
        switch (this.facing) {
            case 'down': this.player.setFrame(1); break;
            case 'up': this.player.setFrame(5); break;
            case 'left': this.player.setFrame(9); break;
            case 'right': this.player.setFrame(13); break;
        }
    }

    tryMove(dx, dy) {
        if (this.isCollapsing) return;

        if (this.energy <= 0) {
            this.player.anims.stop();
            this.setIdleFrame();
            
            let hasEnergyItems = false;
            if (this.backpack && this.backpack.items) {
                hasEnergyItems = this.backpack.items.some(i => i.id === 'energy_drink' || i.id.startsWith('berry') || i.id === 'coffee');
            }

            if (!hasEnergyItems) {
                this.isCollapsing = true;
                this.isTransitioning = true; // Lock all further input updates completely
                
                // Show sleep frame immediately
                this.player.setTexture('playerextra');
                this.player.setFrame(1);
                
                if (this.dialogue && !this.dialogue.active) {
                    this.dialogue.show(['You collapse from exhaustion.'], () => {
                        // Brief delay to ensure input events finish propagating before scene shutdown
                        this.time.delayedCall(50, () => {
                            const finalScore = (Game.state && Game.state.examScore) ? Game.state.examScore : 0;
                            this.scene.start('GameOverScene', { passed: false, score: finalScore });
                        });
                    });
                }
                return;
            }

            if (this.dialogue && !this.dialogue.active) {
                this.dialogue.show(['You are too tired to move.'], null, [
                    {
                        text: 'Inventory', onClick: () => {
                            this.backpack.open();
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

        if (this.assistant && targetX === this.assistant.tileX && targetY === this.assistant.tileY) {
            this.player.play(`walk-${this.facing}`, true);
            return;
        }

        if (this.sleepingServeri && targetX === this.sleepingServeri.tileX && targetY === this.sleepingServeri.tileY) {
            this.player.play(`walk-${this.facing}`, true);
            return;
        }

        // Check solids against cached tile data
        const targetTileIndex = this.tileData[targetY][targetX];

        if (this.isDoorLocked(targetX, targetY)) {
            this.player.play(`walk-${this.facing}`, true);
            this.handleLockedDoor(targetX, targetY);
            return;
        }

        const isWalkable = Game.WALKABLE_TILES.has(targetTileIndex);


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
            const landingWalkable = Game.WALKABLE_TILES.has(landingTile) || landingTile > 2816;

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

        if (this.activeDoorEffect && (this.activeDoorEffect.x !== finalTargetX || this.activeDoorEffect.y !== finalTargetY)) {
            this.restoreActiveDoorEffect();
        }

        if (Game.DOOR_FRAMES && Game.DOOR_FRAMES[targetTileIndex]) {
            const frameTile = Game.DOOR_FRAMES[targetTileIndex];
            const blackTile = (Game.DOOR_BLACK_TILES && Game.DOOR_BLACK_TILES[targetTileIndex]) || Game.DOOR_BLACK_TILE || 780;

            this.activeDoorEffect = {
                x: finalTargetX,
                y: finalTargetY,
                origTile: targetTileIndex
            };

            if (this.layer) {
                this.layer.putTileAt(blackTile, finalTargetX, finalTargetY);
            }
            if (this.overlayLayer) {
                this.overlayLayer.putTileAt(frameTile, finalTargetX, finalTargetY);
            }
        }

        const targetPxX = finalTargetX * Game.TILE_SIZE;
        const targetPxY = finalTargetY * Game.TILE_SIZE;

        let totalMoveDuration = Game.TWEEN_DURATION;
        if (this.speedModifierSteps > 0 && this.speedModifier) {
            totalMoveDuration *= this.speedModifier;
        }

        if (isJumping) {
            totalMoveDuration = jumpDistance === 2
                ? (totalMoveDuration * 0.9 * jumpDistance)
                : (totalMoveDuration * 1.1 * jumpDistance);
        }

        if (isJumping) {
            this.shadow.setPosition(this.player.x, this.player.y);
            this.shadow.setVisible(true);

            this.tweens.add({
                targets: this.shadow,
                x: targetPxX,
                y: targetPxY,
                duration: totalMoveDuration,
                ease: 'Linear'
            });

            if (jumpDistance === 2) {
                // Exactly match original single cliff jump
                this.tweens.add({
                    targets: this.player,
                    displayOriginY: 10,
                    duration: (Game.TWEEN_DURATION * jumpDistance) / 2,
                    yoyo: true,
                    ease: 'Sine.easeInOut'
                });
            } else {
                const bounces = jumpDistance - 1;
                this.tweens.add({
                    targets: this.player,
                    displayOriginY: 8,
                    duration: (totalMoveDuration / bounces) / 2,
                    yoyo: true,
                    repeat: bounces - 1,
                    ease: 'Sine.easeInOut'
                });
            }
        }

        this.tweens.add({
            targets: this.player,
            x: targetPxX,
            y: targetPxY,
            duration: totalMoveDuration,
            ease: 'Linear',
            onComplete: () => {
                this.tileX = finalTargetX;
                this.tileY = finalTargetY;
                console.log('Player at tile:', this.tileX, this.tileY);
                this.isMoving = false;
                this.player.displayOriginY = 0;
                this.shadow.setVisible(false);

                if (this.pendingBackpackOpen) {
                    this.pendingBackpackOpen = false;
                    this.openBackpackSafely();
                }

                // Decrease energy for each tile moved
                const old = this.energy;
                this.energy = Math.max(0, this.energy - 1);
                this.addEnergyDiff(this.energy - old);

                if (this.reverseControlsSteps > 0) {
                    this.reverseControlsSteps--;
                }

                if (this.speedModifierSteps > 0) {
                    this.speedModifierSteps--;
                }

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

    teleportSameMap(x, y, exitDir) {
        this.isTransitioning = true;
        this.player.anims.stop();
        this.setIdleFrame();

        this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
            if (progress === 1) {
                this.restoreActiveDoorEffect();
                this.tileX = x;
                this.tileY = y;
                this.player.setPosition(x * Game.TILE_SIZE, y * Game.TILE_SIZE);
                if (exitDir) this.facing = exitDir;
                this.cameras.main.fadeIn(250, 0, 0, 0, (cam, prog) => {
                    if (prog === 1) {
                        this.isTransitioning = false;
                        const [dx, dy] = this.getDeltaFromDir(this.facing);
                        this.tryMove(dx, dy);
                    }
                });
            }
        });
    }

    hasItem(itemName) {
        if (!this.backpack || !this.backpack.items) return false;
        return this.backpack.items.some(
            item => item.id === itemName || item.name === itemName || (item.name && item.name.toLowerCase() === itemName.toLowerCase())
        );
    }

    restoreActiveDoorEffect() {
        if (this.activeDoorEffect) {
            const { x, y, origTile } = this.activeDoorEffect;
            if (this.layer) {
                this.layer.putTileAt(origTile, x, y);
            }
            if (this.overlayLayer) {
                this.overlayLayer.removeTileAt(x, y);
            }
            this.activeDoorEffect = null;
        }
    }

    isDoorLocked(targetX, targetY) {
        if (!this.currentArea) return false;
        const areaName = this.currentArea.name;

        const lockedDoors = Game.LOCKED_DOORS[areaName];
        if (lockedDoors) {
            const door = lockedDoors.find(d => d.x === targetX && d.y === targetY);
            if (door) {
                if (door.requiredItem) {
                    return !this.hasItem(door.requiredItem);
                }
                return true; // locked without an item to open it
            }
        }
        return false;
    }

    handleLockedDoor(targetX, targetY) {
        if (!this.currentArea) return false;
        const areaName = this.currentArea.name;

        const lockedDoors = Game.LOCKED_DOORS[areaName];
        if (lockedDoors) {
            const door = lockedDoors.find(d => d.x === targetX && d.y === targetY);
            if (door) {
                if ((door.requiredItem && this.hasItem(door.requiredItem)) || (door.failedItem && this.hasItem(door.failedItem))) {
                    if (door.msgHasItem) this.dialogue.show(door.msgHasItem);
                } else {
                    if (door.msgMissing) this.dialogue.show(door.msgMissing);
                }
                return true;
            }
        }
        return false;
    }

    triggerMapTransition(targetMap, targetX, targetY) {
        this.isTransitioning = true;
        this.player.anims.stop();
        this.setIdleFrame();

        this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
            if (progress === 1) {
                this.loadArea(targetMap, targetX, targetY).then(() => {
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
    }

    checkDoorTrigger() {
        const currentTile = this.tileData[this.tileY][this.tileX];

        // Gameover door trigger: tile 2695 in Exam area
        if (this.currentArea && this.currentArea.name === 'Exam' && currentTile === 2695) {
            Game.state = Game.state || {};
            this.isTransitioning = true;
            this.player.anims.stop();
            this.setIdleFrame();
            this.cameras.main.fadeOut(500, 0, 0, 0, (camera, progress) => {
                if (progress === 1) {
                    this.scene.start('GameOverScene', {
                        passed: !!Game.state.examPassed,
                        score: Game.state.examScore || 0
                    });
                }
            });
            return true;
        }

        const areaName = this.currentArea ? this.currentArea.name : '';
        const sameMapTeleports = Game.SAME_MAP_TELEPORTS[areaName];
        if (sameMapTeleports) {
            const coordKey = `${this.tileX},${this.tileY}`;
            const tp = sameMapTeleports[coordKey];
            if (tp) {
                this.teleportSameMap(tp.targetX, tp.targetY, tp.exitDir);
                return true;
            }
        }

        const areaTransitions = Game.MAP_TRANSITIONS[areaName] || {};

        // 1. Check by coordinate
        if (areaTransitions.byCoord) {
            const coordKey = `${this.tileX},${this.tileY}`;
            const transition = areaTransitions.byCoord[coordKey];
            if (transition) {
                if (!transition.requiredItem || this.hasItem(transition.requiredItem)) {
                    this.triggerMapTransition(transition.targetMap, transition.targetX, transition.targetY);
                    return true;
                }
            }
        }

        // 2. Check by edge transitions (like Laitos top edge)
        if (areaTransitions.edgeTransitions) {
            if (this.tileY === 0 && areaTransitions.edgeTransitions.top) {
                const transition = areaTransitions.edgeTransitions.top;
                this.triggerMapTransition(transition.targetMap, transition.targetX, transition.targetY);
                return true;
            }
        }

        // 3. Check by tile ID
        if (areaTransitions.byTile) {
            const transition = areaTransitions.byTile[currentTile];
            if (transition) {
                this.triggerMapTransition(transition.targetMap, transition.targetX, transition.targetY);
                return true;
            }
        }

        return false;
    }

    updatePolice(time, delta) {
        if (!this.police) return;
        if (this.police.isMoving) return;
        if (this.isTransitioning) return;

        // Calculate Manhattan distance to player
        const dist = Math.abs(this.police.tileX - this.tileX) + Math.abs(this.police.tileY - this.tileY);

        if (this.dialogue && this.dialogue.active && dist > 1) {
            if (this.police.sprite.anims.isPlaying) {
                this.police.sprite.anims.stop();
                this.setPoliceIdleFrame();
            }
            return;
        }

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

            // Close backpack if open
            if (this.backpack && this.backpack.isOpen) {
                this.backpack.close();
            }

            this.isTransitioning = true; // lock player out

            this.dialogue.show(['You are under arrest'], () => {
                this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
                    if (progress === 1) {
                        this.loadArea('/puzzle-8/data/savilahti.csv', 4, 20).then(() => {
                            const old = this.energy;
                            this.energy = Math.min(200, this.energy + 15);
                            this.addEnergyDiff(this.energy - old);
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
        return Game.WALKABLE_TILES.has(targetTileIndex);
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
