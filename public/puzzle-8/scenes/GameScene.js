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
                'Zzzz.. \n \n \n Press space to continue..',
                '..Huh?',
                'I feel tired..\nWhere even am I??'
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
                                        canUse: true
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

                if (!interacted && targetTileIndex === 699) {
                    this.dialogue.show(['You found your home key!', 'I probably lost it last night and some kind soul brought it here'], () => {
                        this.backpack.items.push({
                            id: 'home_key',
                            name: 'Home Key',
                            desc: 'A shiny key to your house.',
                            canUse: false
                        });
                        this.tileData[targetY][targetX] = 34;
                        if (this.layer) {
                            this.layer.putTileAt(34, targetX, targetY);
                        }
                        Game.state = Game.state || {};
                        Game.state.homeKeyCollected = true;
                    });
                    interacted = true;
                }

                if (!interacted && targetTileIndex === 546) {
                    this.dialogue.show(['You found a pencil!'], () => {
                        this.backpack.items.push({
                            id: 'pencil',
                            name: 'Pencil',
                            desc: 'A trusty pencil. Needed for the exam.',
                            canUse: false
                        });
                        this.tileData[targetY][targetX] = 33;
                        if (this.layer) {
                            this.layer.putTileAt(33, targetX, targetY);
                        }
                        Game.state = Game.state || {};
                        Game.state.pencilCollected = true;
                    });
                    interacted = true;
                }

                if (!interacted && targetTileIndex === 261) {
                    Game.state = Game.state || {};
                    Game.state.collectedShoes = (Game.state.collectedShoes || 0) + 1;

                    this.tileData[targetY][targetX] = 0; // grass
                    if (this.layer) {
                        this.layer.putTileAt(0, targetX, targetY);
                    }

                    Game.state.collectedShoesLocations = Game.state.collectedShoesLocations || [];
                    Game.state.collectedShoesLocations.push({ area: this.currentArea.name, x: targetX, y: targetY });

                    if (Game.state.collectedShoes === 1) {
                        this.backpack.items.push({
                            id: 'single_shoe',
                            name: 'Single shoe',
                            desc: 'Just one shoe. Pretty useless.',
                            canUse: false
                        });
                        this.dialogue.show(['You found your shoe!', 'How the hell did I even lose this?']);
                    } else if (Game.state.collectedShoes === 2) {
                        const shoeItem = this.backpack.items.find(i => i.id === 'single_shoe');
                        if (shoeItem) {
                            shoeItem.id = 'walking_shoes';
                            shoeItem.name = 'Walking shoes';
                            shoeItem.desc = 'Comfortable walking shoes. Less energy used.';
                        } else {
                            this.backpack.items.push({
                                id: 'walking_shoes',
                                name: 'Walking shoes',
                                desc: 'Comfortable walking shoes. Less energy used.',
                                canUse: false
                            });
                        }
                        this.dialogue.show(['You found your other shoe!', 'Now I have a full pair! Walking uses less energy.']);
                    }

                    interacted = true;
                }

                if (!interacted && targetTileIndex === 262) {
                    Game.state = Game.state || {};
                    Game.state.money = (Game.state.money !== undefined ? Game.state.money : 2) + 5;

                    this.tileData[targetY][targetX] = 0; // grass / empty ground
                    if (this.layer) {
                        this.layer.putTileAt(0, targetX, targetY);
                    }

                    Game.state.collectedCashLocations = Game.state.collectedCashLocations || [];
                    Game.state.collectedCashLocations.push({ area: this.currentArea.name, x: targetX, y: targetY });

                    let walletItem = this.backpack ? this.backpack.items.find(i => i.id === 'wallet') : null;
                    if (walletItem) {
                        walletItem.name = `Wallet ${Game.state.money}€`;
                    } else if (this.backpack) {
                        this.backpack.items.push({
                            id: 'wallet',
                            name: `Wallet ${Game.state.money}€`,
                            desc: 'Contains your money.',
                            canUse: false
                        });
                    }

                    this.dialogue.show(['You found 5€!']);
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

                if (!interacted && this.examNpc && targetX === this.examNpc.tileX && targetY === this.examNpc.tileY) {
                    // Face the player
                    if (this.facing === 'up') this.examNpc.facing = 'down';
                    else if (this.facing === 'down') this.examNpc.facing = 'up';
                    else if (this.facing === 'left') this.examNpc.facing = 'right';
                    else if (this.facing === 'right') this.examNpc.facing = 'left';

                    switch (this.examNpc.facing) {
                        case 'down': this.examNpc.sprite.setFrame(0); break;
                        case 'up': this.examNpc.sprite.setFrame(4); break;
                        case 'left': this.examNpc.sprite.setFrame(8); break;
                        case 'right': this.examNpc.sprite.setFrame(12); break;
                    }

                    Game.state = Game.state || {};
                    if (Game.state.examNpcTraded) {
                        this.dialogue.show(['Good luck on the exam!']);
                    } else {
                        this.dialogue.show(['Hey, do you have a pencil I could borrow?'], null, [
                            {
                                text: 'Ask', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                    this.dialogue.show(['Perhaps, but what am I gonna get in return?'], () => {
                                        // Open backpack in "offer" mode — player picks an item to give
                                        this._openExamNpcOffer();
                                    });
                                }
                            },
                            {
                                text: 'Leave', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                            }
                        ]);
                    }
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

                    Game.state = Game.state || {};
                    Game.state.collectedBerries = Game.state.collectedBerries || [];
                    Game.state.collectedBerries.push({
                        area: this.currentArea.name,
                        x: targetX,
                        y: targetY
                    });

                    this.dialogue.show(['You found a berry!']);
                    interacted = true;
                } else if (targetTileIndex === 478 || targetTileIndex === 414) {
                    Game.state = Game.state || {};
                    if (!Game.state.hasSlept) {
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

                                this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
                                    if (progress === 1) {
                                        const old = this.energy;
                                        this.energy = 200;
                                        this.addEnergyDiff(this.energy - old);
                                        Game.state.hasSlept = true;

                                        if (this.backpack) {
                                            const watch = this.backpack.items.find(i => i.id === 'watch');
                                            if (watch) {
                                                watch.desc = 'The time is 9:05. You are late.';
                                            }
                                        }

                                        let sleepEl = document.getElementById('game-sleep-text');
                                        if (!sleepEl) {
                                            sleepEl = document.createElement('div');
                                            sleepEl.id = 'game-sleep-text';
                                            sleepEl.style.position = 'absolute';
                                            sleepEl.style.top = '50%';
                                            sleepEl.style.left = '50%';
                                            sleepEl.style.transform = 'translate(-50%, -50%)';
                                            sleepEl.style.color = '#ffffff';
                                            sleepEl.style.fontFamily = "'Pokemon Classic', 'Courier New', monospace";
                                            sleepEl.style.fontSize = '24px';
                                            sleepEl.style.textShadow = '2px 2px 0 #000';
                                            sleepEl.style.textAlign = 'center';
                                            sleepEl.style.zIndex = '9999';
                                            sleepEl.style.pointerEvents = 'none';
                                            sleepEl.style.lineHeight = '2';
                                            document.body.appendChild(sleepEl);
                                        }
                                        sleepEl.innerText = 'Zzz...\n\nThe clock advances to 9:05';
                                        sleepEl.style.display = 'block';

                                        this.time.delayedCall(4000, () => {
                                            sleepEl.style.display = 'none';
                                            this.cameras.main.fadeIn(1000, 0, 0, 0, (cam, prog) => {
                                                if (prog === 1) {
                                                    this.walkBackFromBench(this.tileX, this.tileY);
                                                }
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        this.dialogue.show(['You have already slept. You don\'t want to oversleep!']);
                    }
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
        this.updateDrunkEffect();
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

        if (Game.state && Game.state.collectedBerries) {
            Game.state.collectedBerries.forEach(berry => {
                if (berry.area === this.currentArea.name) {
                    if (this.tileData[berry.y] && (this.tileData[berry.y][berry.x] === 196 || this.tileData[berry.y][berry.x] === 68)) {
                        this.tileData[berry.y][berry.x] = 132;
                    }
                }
            });
        }

        if (Game.state && Game.state.collectedShoesLocations) {
            Game.state.collectedShoesLocations.forEach(loc => {
                if (loc.area === this.currentArea.name) {
                    if (this.tileData[loc.y] && this.tileData[loc.y][loc.x] === 261) {
                        this.tileData[loc.y][loc.x] = 0;
                    }
                }
            });
        }

        if (Game.state && Game.state.collectedCashLocations) {
            Game.state.collectedCashLocations.forEach(loc => {
                if (loc.area === this.currentArea.name) {
                    if (this.tileData[loc.y] && this.tileData[loc.y][loc.x] === 262) {
                        this.tileData[loc.y][loc.x] = 0;
                    }
                }
            });
        }

        if (Game.state && Game.state.homeKeyCollected && this.currentArea.name === 'Laitos') {
            for (let y = 0; y < this.tileData.length; y++) {
                for (let x = 0; x < this.tileData[y].length; x++) {
                    if (this.tileData[y][x] === 699) {
                        this.tileData[y][x] = 34;
                    }
                }
            }
        }

        if (Game.state && Game.state.pencilCollected && this.currentArea.name === 'House') {
            for (let y = 0; y < this.tileData.length; y++) {
                for (let x = 0; x < this.tileData[y].length; x++) {
                    if (this.tileData[y][x] === 546) {
                        this.tileData[y][x] = 33;
                    }
                }
            }
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

        // Spawn ServeriNPC if in Exam
        if (this.examNpc) {
            this.examNpc.sprite.destroy();
            this.examNpc = null;
        }

        if (this.currentArea.name === 'Exam') {
            const nx = 12;
            const ny = 33;
            this.examNpc = {
                tileX: nx,
                tileY: ny,
                facing: 'down',
                sprite: this.add.sprite(nx * Game.TILE_SIZE, ny * Game.TILE_SIZE, 'serverinpc', 0).setOrigin(0, 0).setDepth(10)
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

        let activeDir = this.getActiveInput();

        if (this.isMoving) return;

        if (this.reverseControlsSteps > 0 && this.wasWalking) {
            if (activeDir !== this.facing) {
                if (!this.dizzyHasExtraStepped) {
                    activeDir = this.facing;
                    this.dizzyHasExtraStepped = true;
                }
            } else {
                this.dizzyHasExtraStepped = false;
            }
        } else {
            this.dizzyHasExtraStepped = false;
        }

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
            this.wasWalking = false;
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
            if (this.reverseX && (dir === 'left' || dir === 'right')) {
                return dir === 'left' ? 'right' : 'left';
            }
            if (this.reverseY && (dir === 'up' || dir === 'down')) {
                return dir === 'up' ? 'down' : 'up';
            }
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
                hasEnergyItems = this.backpack.items.some(i => i.id === 'energy_drink' || i.id.startsWith('berry') || i.id === 'cup_of_coffee');
            }

            if (!hasEnergyItems) {
                this.isCollapsing = true;
                this.isTransitioning = true; // Lock all further input updates completely

                // Show sleep frame immediately
                this.player.setTexture('playerextra');
                this.player.setFrame(1);

                if (this.dialogue && !this.dialogue.active) {
                    this.dialogue.show(['You collapse from exhaustion.'], () => {
                        // Reset drunk effect in case it was active
                        if (this.sys && this.sys.game && this.sys.game.canvas) {
                            this.sys.game.canvas.style.filter = 'none';
                        }
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
                this.dialogue.show(['You are too tired to move!\n\nYou can use an item'], null, [
                    {
                        text: 'Inventory', onClick: () => {
                            this.backpack.open();
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

        if (this.examNpc && targetX === this.examNpc.tileX && targetY === this.examNpc.tileY) {
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
        this.wasWalking = true;
        this.player.play(`walk-${this.facing}`, true);

        if (this.speedModifierSteps > 0 && this.speedModifier) {
            if (this.speedModifier < 1) {
                this.player.anims.timeScale = 1.15;
            } else if (this.speedModifier > 1) {
                this.player.anims.timeScale = 0.9;
            } else {
                this.player.anims.timeScale = 1.0;
            }
        } else {
            this.player.anims.timeScale = 1.0;
        }

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

                Game.state = Game.state || {};
                Game.state.totalSteps = (Game.state.totalSteps || 0) + 1;

                let shouldDecrease = true;
                if (Game.state.examScore !== undefined) {
                    shouldDecrease = false;
                } else if (Game.state.collectedShoes >= 2 && Game.state.totalSteps % 3 === 0) {
                    shouldDecrease = false;
                }

                if (shouldDecrease) {
                    this.energy = Math.max(0, this.energy - 1);
                    this.addEnergyDiff(this.energy - old);
                }

                if ((Game.state.startedSteps || 0) < 5) {
                    Game.state.startedSteps = (Game.state.startedSteps || 0) + 1;
                    if (Game.state.startedSteps === 5) {
                        if (this.dialogue) {
                            this.dialogue.show(['And where have my keys gone..?']);
                        }
                    }
                }

                if (this.reverseControlsSteps > 0) {
                    this.reverseControlsSteps--;
                    this.updateDrunkEffect();
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

    updateDrunkEffect() {
        if (!this.sys || !this.sys.game || !this.sys.game.canvas) return;
        const canvas = this.sys.game.canvas;

        let drunkBlur = 0;
        if (this.reverseControlsSteps && this.reverseControlsSteps > 0) {
            drunkBlur = Math.min(8, this.reverseControlsSteps / 6);
        }

        let energyBlur = 0;
        if (this.energy !== undefined && this.energy <= 20) {
            energyBlur = (20 - Math.max(0, this.energy)) / 10;
        }

        const finalBlur = Math.max(drunkBlur, energyBlur);

        if (finalBlur <= 0) {
            canvas.style.filter = 'none';
        } else {
            canvas.style.filter = `blur(${finalBlur}px)`;
        }
    }

    _openExamNpcOffer() {
        // Open backpack in a special "offer to NPC" mode
        // We temporarily override the grid click behavior
        if (!this.backpack) return;

        this.backpack.open();

        // Override the grid rendering to make items clickable as offers
        const originalRenderGrid = this.backpack._renderGrid.bind(this.backpack);
        const originalRenderHeader = this.backpack._renderHeader.bind(this.backpack);
        const scene = this;

        this.backpack._renderHeader = function () {
            if (!this.actionContainer) return;
            this.actionContainer.removeAll(true);

            this.headerText.setText('Offer item');
            this.headerText.setPosition(this.bgX + 99, this.bgY + 20);
            this.headerText.setOrigin(0.5, 0.5);

            // Close button
            const closeBtn = scene.add.text(20, 138, '[X]', {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '32px',
                color: '#880000'
            }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setScale(0.22);

            closeBtn.on('pointerover', () => closeBtn.setColor('#ff0000'));
            closeBtn.on('pointerout', () => closeBtn.setColor('#880000'));
            closeBtn.on('pointerdown', () => {
                restoreBackpack();
                scene.backpack.close();
            });
            this.actionContainer.add(closeBtn);
        };

        this.backpack._renderGrid = function () {
            if (!this.gridContainer) return;
            this.gridContainer.removeAll(true);

            const cols = 3;
            const startX = 20;
            const startY = 36;
            const slotW = 50;
            const slotH = 28;
            const spacingX = 4;
            const spacingY = 4;

            if (typeof this.currentPage === 'undefined') this.currentPage = 0;
            const itemsPerPage = 9;
            const totalPages = Math.ceil(this.items.length / itemsPerPage) || 1;
            if (this.currentPage >= totalPages) this.currentPage = Math.max(0, totalPages - 1);

            const startIndex = this.currentPage * itemsPerPage;
            const pageItems = this.items.slice(startIndex, startIndex + itemsPerPage);

            if (totalPages > 1) {
                if (this.currentPage > 0) {
                    const leftArrow = scene.add.text(10, 88, '←', {
                        fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                        fontSize: '32px',
                        color: '#1a1a2e'
                    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.25);
                    leftArrow.on('pointerdown', () => { this.currentPage--; this._renderGrid(); });
                    this.gridContainer.add(leftArrow);
                }
                if (this.currentPage < totalPages - 1) {
                    const rightArrow = scene.add.text(190, 88, '→', {
                        fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                        fontSize: '32px',
                        color: '#1a1a2e'
                    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.25);
                    rightArrow.on('pointerdown', () => { this.currentPage++; this._renderGrid(); });
                    this.gridContainer.add(rightArrow);
                }
            }

            pageItems.forEach((item, index) => {
                const c = index % cols;
                const r = Math.floor(index / cols);
                const x = startX + c * (slotW + spacingX);
                const y = startY + r * (slotH + spacingY);

                const bgRect = scene.add.rectangle(
                    x, y, slotW, slotH, 0xf0f0f5
                ).setOrigin(0, 0).setInteractive({ useHandCursor: true });

                const strokeRect = scene.add.graphics();
                strokeRect.lineStyle(1, 0x888899);
                strokeRect.strokeRect(x, y, slotW, slotH);

                const itemText = scene.add.text(Math.round(x + slotW / 2), Math.round(y + slotH / 2), this._formatItemName(item.name), {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '32px',
                    color: '#222233',
                    align: 'center'
                }).setOrigin(0.5, 0.5).setScale(0.22);

                bgRect.on('pointerover', () => bgRect.setFillStyle(0xd8d0c0));
                bgRect.on('pointerout', () => bgRect.setFillStyle(0xf0f0f5));
                bgRect.on('pointerdown', () => {
                    restoreBackpack();
                    scene.backpack.close();
                    scene._handleExamNpcItemOffer(item);
                });

                this.gridContainer.add(bgRect);
                this.gridContainer.add(strokeRect);
                this.gridContainer.add(itemText);
            });
        };

        const restoreBackpack = () => {
            this.backpack._renderGrid = originalRenderGrid;
            this.backpack._renderHeader = originalRenderHeader;
        };

        // Re-render with the overridden methods
        this.backpack._renderHeader();
        this.backpack._renderGrid();
    }

    _handleExamNpcItemOffer(item) {
        if (item.id.startsWith('sign_')) {
            // Traffic sign — success!
            this.dialogue.show(
                ['A traffic sign?? Ok quite random but what the hell, you can have this pencil LOL'],
                () => {
                    // Remove the traffic sign from inventory
                    this.backpack.items = this.backpack.items.filter(i => i !== item);

                    // Add pencil to inventory
                    this.backpack.items.push({
                        id: 'pencil',
                        name: 'Pencil',
                        desc: 'A trusty pencil. Needed for the exam.',
                        canUse: false
                    });

                    Game.state = Game.state || {};
                    Game.state.examNpcTraded = true;
                    Game.state.pencilCollected = true;

                    this.dialogue.show(['You received a Pencil!']);
                }
            );
        } else if (item.id === 'jallu') {
            this.dialogue.show(['No, I only drink Gambina']);
        } else {
            this.dialogue.show(['I have no use for that']);
        }
    }
};
