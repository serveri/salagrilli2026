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

        if (!this.anims.exists('speaker_playing')) {
            this.anims.create({
                key: 'speaker_playing',
                frames: this.anims.generateFrameNumbers('items', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

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

        // Oldman Animations (16x20, 4 columns)
        this.anims.create({
            key: 'oldman-walk-down',
            frames: this.anims.generateFrameNumbers('oldman', { frames: [0, 1, 2, 3] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'oldman-walk-up',
            frames: this.anims.generateFrameNumbers('oldman', { frames: [4, 5, 6, 7] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'oldman-walk-left',
            frames: this.anims.generateFrameNumbers('oldman', { frames: [8, 9, 10, 11] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'oldman-walk-right',
            frames: this.anims.generateFrameNumbers('oldman', { frames: [12, 13, 14, 15] }),
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

        // Check intro sleeping state
        this.isIntroSleeping = (!Game.state || !Game.state.hasSlept);

        // Create Player Sprite (start with sleeping frame if intro)
        const initialTex = this.isIntroSleeping ? 'playerextra' : 'player';
        const initialFrame = this.isIntroSleeping ? 1 : 0;
        this.player = this.add.sprite(
            this.tileX * Game.TILE_SIZE,
            this.tileY * Game.TILE_SIZE,
            initialTex, initialFrame
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
        this.loadArea('data/serveriquest.csv', 89, 30, true).then(() => {
            // Camera fade in when game starts (after menu)
            this.cameras.main.setVisible(true);
            this.cameras.main.fadeIn(900, 0, 0, 0);



            // Darken world for intro sleeping sequence
            const darkOverlay = this.add.rectangle(0, 0, this.currentArea.width * Game.TILE_SIZE, this.currentArea.height * Game.TILE_SIZE, 0x000000, 0.45)
                .setOrigin(0, 0)
                .setDepth(1900);

            this.player.setTexture('playerextra', 1);

            // Delay start dialogue box until location text has faded (2800ms to match +1s black screen duration)
            this.time.delayedCall(2800, () => {
                this.player.setTexture('playerextra', 1);
                // Show intro dialogue with slower typing speed (50ms per character)
                this.dialogue.show([
                    'Zzzz.. \n \n \n Press space to continue..',
                    '..Huh?',
                    'I feel tired..\nWhere even am I??'
                ], () => {
                    this.tweens.add({
                        targets: darkOverlay,
                        alpha: 0,
                        duration: 800,
                        onComplete: () => {
                            darkOverlay.destroy();
                        }
                    });
                    this.isIntroSleeping = false;
                    this.isSleeping = false;
                    this.player.setTexture('player');
                    this.setIdleFrame();
                }, [], 50);
            });
        });

        // Dialogue system
        this.dialogue = new Game.DialogueBox(this);

        // Backpack / Inventory system
        this.backpack = new Game.Backpack(this);
        this.pendingBackpackOpen = false;

        // Exam system
        this.exam = new Game.Exam(this);

        // Shop system
        this.shop = new Game.Shop(this);

        // NPC Manager system
        this.npcManager = new Game.NpcManager(this);

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
            if (this.isMapOpen || this.isExamOpen || (this.shop && this.shop.isOpen) || this.isIntroSleeping || this.isSleeping) return;

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
            if (this.isTransitioning || this.isMoving || this.isMapOpen || this.isExamOpen || (this.shop && this.shop.isOpen) || this.isIntroSleeping || this.isSleeping) return;
            if (this.dialogue && this.dialogue.active) return;
            if (this.backpack && this.backpack.active) return;

            const [dx, dy] = this.getDeltaFromDir(this.facing);
            const targetX = this.tileX + dx;
            const targetY = this.tileY + dy;

            if (targetX >= 0 && targetX < this.currentArea.width &&
                targetY >= 0 && targetY < this.currentArea.height) {

                const targetTileIndex = this.tileData[targetY][targetX];

                let interacted = this.npcManager ? this.npcManager.handleInteraction(targetX, targetY) : false;

                const isFacingSpeaker = this.placedSpeaker && this.placedSpeaker.area === this.currentArea.name &&
                    targetX === this.placedSpeaker.tileX && targetY === this.placedSpeaker.tileY;
                const isStandingOnSpeaker = this.placedSpeaker && this.placedSpeaker.area === this.currentArea.name &&
                    this.tileX === this.placedSpeaker.tileX && this.tileY === this.placedSpeaker.tileY;

                if (!interacted && (isFacingSpeaker || isStandingOnSpeaker)) {
                    this._showSpeakerMenu();
                    interacted = true;
                }

                if (!interacted && targetTileIndex === 764) {
                    const lasagnaItem = this.backpack && this.backpack.items
                        ? this.backpack.items.find(i => i.id === 'xtra_lasagna')
                        : null;

                    if (lasagnaItem) {
                        this.dialogue.show(['Oven. Can heat food.', 'Would you like to heat up your Xtra Lasagna?'], null, [
                            {
                                text: 'Heat it', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                    const usesLeft = lasagnaItem.uses !== undefined ? lasagnaItem.uses : 2;
                                    lasagnaItem.id = 'heated_lasagna';
                                    lasagnaItem.name = usesLeft === 1 ? 'Heated lasagna 1/2' : 'Heated lasagna';
                                    lasagnaItem.desc = 'Warm delicious lasagna. Restores 80 energy per bite.';
                                    this.dialogue.show(['BZZZZ... MMMM! The lasagna is now piping hot! (+80 energy per bite)']);
                                }
                            },
                            {
                                text: 'Leave', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                            }
                        ]);
                    } else {
                        this.dialogue.show(['Oven. Can heat food']);
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
                                        desc: 'Freshly made coffee. Restores 100 energy.',
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

                if (!interacted && targetTileIndex === 697) {
                    if (this.backpack && !this.backpack.items.some(i => i.id === 'cat_food')) {
                        this.backpack.items.push({
                            id: 'cat_food',
                            name: 'Cat food',
                            desc: 'Delicious food for a cat.',
                            canUse: false
                        });
                        this.dialogue.show(['You found some Cat food!']);
                    } else {
                        this.dialogue.show(['You already have Cat food in your backpack.']);
                    }
                    interacted = true;
                }

                if (!interacted && targetTileIndex === 698) {
                    Game.state = Game.state || {};
                    if (!Game.state.secondCoffeeMakerUsed) {
                        this.dialogue.show(['Make coffee?'], null, [
                            {
                                text: 'Yes', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                    this.backpack.items.push({
                                        id: 'cup_of_coffee',
                                        name: 'Cup of coffee',
                                        desc: 'Freshly made coffee. Restores 100 energy.',
                                        canUse: true
                                    });
                                    Game.state.secondCoffeeMakerUsed = true;
                                    this.dialogue.show(['You made a cup of coffee.']);
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

                if (!interacted && targetTileIndex === 324) {
                    this.tileData[targetY][targetX] = 0;
                    if (this.layer) {
                        this.layer.putTileAt(0, targetX, targetY);
                    }
                    Game.state = Game.state || {};
                    Game.state.collectedSpeakerLocations = Game.state.collectedSpeakerLocations || [];
                    Game.state.collectedSpeakerLocations.push({ area: this.currentArea.name, x: targetX, y: targetY });

                    if (this.backpack && !this.backpack.items.some(i => i.id === 'speaker')) {
                        this.backpack.items.push({
                            id: 'speaker',
                            name: 'Partybox',
                            desc: 'Plays your favorite song: Zyn Zyn Zyn.',
                            canUse: true
                        });
                    }

                    if (this.dialogue) {
                        this.dialogue.show(['You found a Partybox!']);
                    }
                    interacted = true;
                }

                if (!interacted && (targetTileIndex === 262 || targetTileIndex === 502)) {
                    const replacementTile = targetTileIndex === 502 ? 436 : 0;
                    Game.state = Game.state || {};
                    Game.state.money = (Game.state.money !== undefined ? Game.state.money : 2) + 5;

                    this.tileData[targetY][targetX] = replacementTile;
                    if (this.layer) {
                        this.layer.putTileAt(replacementTile, targetX, targetY);
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

                if (!interacted && (targetTileIndex === 503 || targetTileIndex === 504)) {
                    const isSingles = targetTileIndex === 503;
                    const itemObj = isSingles ? {
                        id: 'singles_basket',
                        name: 'Singles basket',
                        desc: 'A pink singles basket from Prisma.',
                        canUse: false
                    } : {
                        id: 'shopping_basket',
                        name: 'Shopping basket',
                        desc: 'A standard shopping basket from Prisma.',
                        canUse: false
                    };

                    this.tileData[targetY][targetX] = 439;
                    if (this.layer) {
                        this.layer.putTileAt(439, targetX, targetY);
                    }

                    if (this.backpack) {
                        this.backpack.items.push(itemObj);
                    }

                    const basketName = isSingles ? 'Singles basket' : 'Shopping basket';
                    this.dialogue.show([`You took a ${basketName}.`]);
                    interacted = true;
                }

                if (!interacted && this.currentArea && this.currentArea.name === 'NeulamaenSale' && targetX === 9 && (targetY === 5 || targetY === 4)) {
                    if (this.shopkeep) {
                        if (this.facing === 'up') this.shopkeep.facing = 'down';
                        else if (this.facing === 'down') this.shopkeep.facing = 'up';
                        else if (this.facing === 'left') this.shopkeep.facing = 'right';
                        else if (this.facing === 'right') this.shopkeep.facing = 'left';

                        switch (this.shopkeep.facing) {
                            case 'down': this.shopkeep.sprite.setFrame(0); break;
                            case 'up': this.shopkeep.sprite.setFrame(4); break;
                            case 'left': this.shopkeep.sprite.setFrame(8); break;
                            case 'right': this.shopkeep.sprite.setFrame(12); break;
                        }
                    }

                    this.dialogue.show(['Cashier: Welcome! Want to buy something?'], null, [
                        {
                            text: 'Yes', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                if (this.shop) {
                                    this.shop.open();
                                }
                            }
                        },
                        {
                            text: 'No', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                        }
                    ]);
                    interacted = true;
                }

                if (!interacted && (targetTileIndex === 246 || targetTileIndex === 310)) {
                    this.dialogue.show(['Buy something from the vending machine?'], null, [
                        {
                            text: 'Yes', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                if (this.shop) {
                                    this.shop.open([
                                        {
                                            id: 'energy_drink',
                                            name: 'Rad bull 7€',
                                            price: 7,
                                            desc: 'Rad bull energy drink. Restores 80 energy.',
                                            itemData: {
                                                id: 'energy_drink',
                                                name: 'Rad bull',
                                                desc: 'Rad bull energy drink. Restores 80 energy.',
                                                canUse: true
                                            }
                                        },
                                        {
                                            id: 'square_sandwich',
                                            name: 'Triangle sandwich 5€',
                                            price: 5,
                                            desc: 'Smoked salmon -like sandwich. Restores 60 energy.',
                                            itemData: {
                                                id: 'square_sandwich',
                                                name: 'Triangle sandwich',
                                                desc: 'Smoked salmon -like sandwich. Restores 60 energy.',
                                                canUse: true
                                            }
                                        }
                                    ]);
                                }
                            }
                        },
                        {
                            text: 'No', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                        }
                    ]);
                    interacted = true;
                }

                if (!interacted && (targetTileIndex === 3086 || targetTileIndex === 3150 || targetTileIndex === 3214)) {
                    const currentHour = (Game.state && Game.state.timeHour !== undefined) ? Game.state.timeHour : 4;
                    if (currentHour >= 8) {
                        this.dialogue.show(['The bus is no longer running today.']);
                    } else {
                        this.dialogue.show(['Ride bus to Neulamäki? (2€)'], null, [
                            {
                                text: 'Yes', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                    Game.state = Game.state || {};
                                    const currentMoney = Game.state.money !== undefined ? Game.state.money : 2;
                                    if (currentMoney < 2) {
                                        this.dialogue.show(['You don\'t have enough money! (Costs 2€)']);
                                    } else {
                                        Game.state.money = currentMoney - 2;
                                        let walletItem = this.backpack && this.backpack.items ? this.backpack.items.find(i => i.id === 'wallet') : null;
                                        if (walletItem) {
                                            walletItem.name = `Wallet ${Game.state.money}€`;
                                        }

                                        this.isTransitioning = true;
                                        this.player.anims.stop();
                                        this.setIdleFrame();

                                        this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
                                            if (progress === 1) {
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
                                                sleepEl.innerText = 'You arrive at neulamäki';
                                                sleepEl.style.display = 'block';

                                                this.time.delayedCall(2500, () => {
                                                    sleepEl.style.display = 'none';
                                                    this.loadArea('data/serveriquest.csv', 38, 31).then(() => {
                                                        this.setIdleFrame();
                                                        this.cameras.main.fadeIn(1000, 0, 0, 0, (cam, prog) => {
                                                            if (prog === 1) {
                                                                this.isTransitioning = false;
                                                            }
                                                        });
                                                    });
                                                });
                                            }
                                        });
                                    }
                                }
                            },
                            {
                                text: 'No', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                            }
                        ]);
                    }
                    interacted = true;
                }

                const isPrismaMainShop = this.currentArea && this.currentArea.name === 'Prisma' && (
                    (targetX === 21 && targetY === 10) || (targetX === 22 && targetY === 10) ||
                    (targetX === 26 && targetY === 10) || (targetX === 27 && targetY === 10)
                );

                const isPrismaAlcoholShop = this.currentArea && this.currentArea.name === 'Prisma' && (
                    (targetX === 8 && targetY === 18) || (targetX === 9 && targetY === 18)
                );

                if (!interacted && (isPrismaMainShop || isPrismaAlcoholShop)) {
                    if (this.prismaShopkeeps) {
                        this.prismaShopkeeps.forEach(sk => {
                            if (Math.abs(sk.tileX - targetX) <= 1 && Math.abs(sk.tileY - targetY) <= 1) {
                                if (this.facing === 'up') sk.facing = 'down';
                                else if (this.facing === 'down') sk.facing = 'up';
                                else if (this.facing === 'left') sk.facing = 'right';
                                else if (this.facing === 'right') sk.facing = 'left';

                                switch (sk.facing) {
                                    case 'down': sk.sprite.setFrame(0); break;
                                    case 'up': sk.sprite.setFrame(4); break;
                                    case 'left': sk.sprite.setFrame(8); break;
                                    case 'right': sk.sprite.setFrame(12); break;
                                }
                            }
                        });
                    }

                    this.dialogue.show(['Cashier: Welcome! Want to buy something?'], null, [
                        {
                            text: 'Yes', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                if (this.shop) {
                                    if (isPrismaAlcoholShop) {
                                        this.shop.open([
                                            {
                                                id: 'jallu',
                                                name: 'Jallu 17€',
                                                price: 17,
                                                desc: 'Some kind of strong liquor. Would taste better in a mix',
                                                itemData: {
                                                    id: 'jallu',
                                                    name: 'Jallu',
                                                    desc: 'Some kind of strong liquor. Would taste better in a mix',
                                                    canUse: true,
                                                    cl: 50
                                                }
                                            },
                                            {
                                                id: 'gambina',
                                                name: 'Gambina 12€',
                                                price: 12,
                                                desc: 'Ruby colored substance, best for having a Gambina meeting',
                                                itemData: {
                                                    id: 'gambina',
                                                    name: 'Gambina',
                                                    desc: 'Ruby colored substance, best for having a Gambina meeting',
                                                    canUse: true,
                                                    cl: 75
                                                }
                                            }
                                        ]);
                                    } else {
                                        this.shop.open();
                                    }
                                }
                            }
                        },
                        {
                            text: 'No', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                        }
                    ]);
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
                            'IT-Guy: Do you know what happened to Niilo22?',
                            'IT-Guy: He bought a new bike, and immediately lost the keys...',
                            'IT-Guy: Then he complained about it on video for 20 minutes.',
                            'IT-Guy: Classic Niilo!'
                        ],
                        [
                            'IT-Guy: Have you heard? Niilo22 tried to make coffee..',
                            'IT-Guy: He broke a hole in the bottom of his coffee pot!',
                            'IT-Guy: Then he blamed the coffee maker manufacturer.',
                            'IT-Guy: Never change, Niilo!'
                        ],
                        [
                            'IT-Guy: Did you see the latest Niilo22 video?',
                            'IT-Guy: He reviewed a frozen pizza...',
                            'IT-Guy: But forgot to take the plastic off before putting it in the oven!',
                            'IT-Guy: What a legend!'
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
                    Game.state = Game.state || {};
                    if (Game.state.examScore !== undefined) {
                        this.dialogue.show(['You have already completed the exam!']);
                    } else {
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
                    }
                    interacted = true;
                }

                if (!interacted && Game.INSPECT_MESSAGES[targetTileIndex]) {
                    this.dialogue.show(Game.INSPECT_MESSAGES[targetTileIndex]);
                    interacted = true;
                } else if (targetTileIndex === 196 || targetTileIndex === 68) {
                    const old = this.energy;
                    this.energy = Math.min(200, this.energy + 40);
                    if (this.addEnergyDiff) {
                        this.addEnergyDiff(this.energy - old);
                    }

                    // Update tile logically and visually to cleared bush
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

                    this.dialogue.show(['You snack on berries from the bush.\n +40 energy']);
                    interacted = true;
                } else if (targetTileIndex === 478 || targetTileIndex === 414) {
                    Game.state = Game.state || {};
                    const currentHour = Game.state.timeHour !== undefined ? Game.state.timeHour : 4;
                    if (Game.state.hasSlept) {
                        this.dialogue.show(['You have already slept. You don\'t want to oversleep!']);
                    } else if (currentHour >= 9) {
                        this.dialogue.show(['It is already past 9:00! It\'s too late to sleep!']);
                    } else {
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
                                        Game.state = Game.state || {};
                                        Game.state.hasSlept = true;
                                        Game.state.sleptInBed = true;
                                        if (Game.state.timeHour === undefined || Game.state.timeHour < 9 || (Game.state.timeHour === 9 && Game.state.timeMinute < 5)) {
                                            Game.state.timeHour = 9;
                                            Game.state.timeMinute = 5;
                                        }

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
                                                    this.updateNightLighting();
                                                    this.walkBackFromBench(this.tileX, this.tileY);
                                                }
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    }
                    interacted = true;
                } else if ([2, 3, 133, 197, 134, 198, 1179, 1180, 475, 539, 1245, 1309, 1181].includes(targetTileIndex)) {
                    const isSofa = [1179, 1180, 475, 539, 1245, 1309, 1181].includes(targetTileIndex);
                    const objectName = isSofa ? 'sofa' : 'bench';
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
                            this.isSleeping = true;
                            if (this.energy < 50) {
                                const old = this.energy;
                                this.energy = 50;
                                const energyRestored = Math.max(1, Math.min(50, 50 - old));
                                this.addEnergyDiff(this.energy - old);

                                // Flat minutes proportion: 5 minutes at 1 energy restored, 30 minutes at 50 energy restored
                                const minutesPassed = Math.round(5 + (energyRestored - 1) * (25 / 49));

                                Game.state = Game.state || {};
                                const currentHour = Game.state.timeHour !== undefined ? Game.state.timeHour : 4;
                                const currentMinute = Game.state.timeMinute !== undefined ? Game.state.timeMinute : 16;

                                const totalMinutes = currentHour * 60 + currentMinute + minutesPassed;
                                const newHour = Math.floor(totalMinutes / 60);
                                const newMinute = totalMinutes % 60;

                                // Monotonically update time
                                if (newHour > currentHour || (newHour === currentHour && newMinute > currentMinute)) {
                                    Game.state.timeHour = newHour;
                                    Game.state.timeMinute = newMinute;
                                }

                                const finalHour = Game.state.timeHour;
                                const finalMinute = Game.state.timeMinute;

                                // Update watch item description in backpack if present
                                if (this.backpack && this.backpack.items) {
                                    const watch = this.backpack.items.find(i => i.id === 'watch');
                                    if (watch) {
                                        const minStr = finalMinute < 10 ? `0${finalMinute}` : `${finalMinute}`;
                                        watch.desc = `The time is ${finalHour}:${minStr}.`;
                                    }
                                }

                                // Update night lighting if time advanced past 6:00
                                this.updateNightLighting();

                                if (totalMinutes >= 600) {
                                    this.dialogue.show([`You rested on the ${objectName} for too long and missed the exam!`], () => {
                                        if (this.sys && this.sys.game && this.sys.game.canvas) {
                                            this.sys.game.canvas.style.filter = 'none';
                                        }
                                        this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
                                            if (progress === 1) {
                                                const finalScore = (Game.state && Game.state.examScore) ? Game.state.examScore : 0;
                                                this.scene.start('GameOverScene', { passed: false, score: finalScore });
                                            }
                                        });
                                    });
                                    return;
                                }

                                const restDialogue = [`You rested on the ${objectName}.`, 'You feel a bit better.'];
                                if (finalHour === 9 && finalMinute >= 30) {
                                    const minsLeft = 600 - (finalHour * 60 + finalMinute);
                                    restDialogue.push(`I need to hurry to the exam! ${minsLeft} minutes left`);
                                } else if (finalHour >= 6) {
                                    restDialogue.push('I wonder what time it is');
                                }

                                this.dialogue.show(restDialogue, () => {
                                    this.walkBackFromBench(this.tileX, this.tileY);
                                });
                            } else {
                                this.dialogue.show([`You are not tired enough to rest on the ${objectName}.`], () => {
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

    async loadArea(csvPath, startTileX, startTileY, isInitialStart = false) {
        let loadingEl = document.getElementById('game-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'game-loading';
            loadingEl.style.position = 'absolute';
            loadingEl.style.top = '38%';
            loadingEl.style.left = '50%';
            loadingEl.style.transform = 'translate(-50%, -50%)';
            loadingEl.style.color = '#ffffff';
            loadingEl.style.fontFamily = "'Pokemon Classic', 'Courier New', monospace";
            loadingEl.style.fontSize = '24px';
            loadingEl.style.zIndex = '9999';
            loadingEl.style.textShadow = '2px 2px 0 #000';
            loadingEl.style.pointerEvents = 'none';
            document.body.appendChild(loadingEl);
        }
        loadingEl.innerText = isInitialStart ? 'Somewhere in Neulamäki' : 'LOADING...';
        loadingEl.style.display = 'block';
        loadingEl.style.opacity = '1';
        loadingEl.style.transition = '';

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

        if (this.currentArea.name !== 'Prisma' && this.backpack && this.backpack.items) {
            this.backpack.items = this.backpack.items.filter(i => i.id !== 'singles_basket' && i.id !== 'shopping_basket');
        }

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
                    } else if (this.tileData[loc.y] && this.tileData[loc.y][loc.x] === 502) {
                        this.tileData[loc.y][loc.x] = 436;
                    }
                }
            });
        }

        if (Game.state && Game.state.collectedSpeakerLocations) {
            Game.state.collectedSpeakerLocations.forEach(loc => {
                if (loc.area === this.currentArea.name) {
                    if (this.tileData[loc.y] && this.tileData[loc.y][loc.x] === 324) {
                        this.tileData[loc.y][loc.x] = 0;
                    }
                }
            });
        }

        if (Game.state && Game.state.placedSpeakerData) {
            const data = Game.state.placedSpeakerData;
            if (data.area === this.currentArea.name) {
                if (!this.placedSpeaker || !this.placedSpeaker.sprite || !this.placedSpeaker.sprite.active) {
                    const sprite = this.add.sprite(
                        data.tileX * Game.TILE_SIZE,
                        data.tileY * Game.TILE_SIZE,
                        'items',
                        this.isSpeakerDancing ? 1 : 0
                    ).setOrigin(0, 0).setDepth(10);

                    if (this.isSpeakerDancing) {
                        sprite.play('speaker_playing');
                    }

                    this.placedSpeaker = {
                        tileX: data.tileX,
                        tileY: data.tileY,
                        area: data.area,
                        sprite,
                        isPlaying: this.isSpeakerDancing
                    };
                }
            }
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

        this.updateBusTiles();

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

        // Spawn NPCs for this area
        if (this.npcManager) {
            this.npcManager.spawnNpcsForArea(this.currentArea.name);
        }

        // Create police chaser AI if police was spawned
        if (this.police) {
            this._createPoliceChaser();
        }

        // Clean up guard chaser when changing areas
        if (this.guardChaserAI) {
            this.guardChaserAI.destroy();
            this.guardChaserAI = null;
            this.oldServeriGuard = null;
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

        this.updateNightLighting();

        const endLoadingEl = document.getElementById('game-loading');
        if (endLoadingEl) {
            const holdDelay = isInitialStart ? 2300 : 300;

            endLoadingEl.style.transition = 'opacity 0.35s ease-out';
            setTimeout(() => {
                endLoadingEl.style.opacity = '0';
                setTimeout(() => {
                    endLoadingEl.style.display = 'none';
                    endLoadingEl.style.opacity = '1';
                    endLoadingEl.style.transition = '';
                }, 350);
            }, holdDelay);
        }
    }

    update(time, delta) {
        this._updateSpeakerVolume();

        // Keep UI systems positioned relative to camera
        if (this.dialogue) {
            this.dialogue.updatePosition();
        }
        if (this.backpack) {
            this.backpack.updatePosition();
        }

        this.updatePolice(time, delta);
        this.updateOldServeriGuard(time, delta);
        if (this.npcManager && this.npcManager.update) {
            this.npcManager.update(time, delta);
        }

        if (this.exam && this.exam.isOpen) {
            this.exam.update(time, delta);
        }

        if ((this.drunkSteps && this.drunkSteps > 0) || (this.reverseControlsSteps && this.reverseControlsSteps > 0)) {
            this.updateDrunkEffect();
        }

        if (this.isIntroSleeping || this.isSleeping || this.isTransitioning || (this.dialogue && this.dialogue.active) || (this.backpack && this.backpack.active) || (this.shop && this.shop.isOpen) || this.isMapOpen || this.isExamOpen || this.pendingBackpackOpen) {
            this.resetEnergyLostStack();
            return;
        }

        let activeDir = this.getActiveInput();

        if (this.isMoving) return;

        const isDizzy = (this.reverseControlsSteps > 0 || (this.drunkSteps && this.drunkSteps > 0)) && this.wasWalking;
        if (isDizzy) {
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

    _isCharWithinSpeakerRange(charTileX, charTileY, charAreaName) {
        if (!this.placedSpeaker || !this.placedSpeaker.sprite || !this.placedSpeaker.sprite.active) {
            if (this.currentArea && charAreaName && charAreaName !== this.currentArea.name) return false;
            const dist = Math.hypot(charTileX - this.tileX, charTileY - this.tileY);
            return dist <= 30;
        }

        if (this.placedSpeaker.area !== charAreaName) return false;

        const dist = Math.hypot(charTileX - this.placedSpeaker.tileX, charTileY - this.placedSpeaker.tileY);
        return dist <= 30;
    }

    setIdleFrame() {
        if (this.isIntroSleeping || this.isSleeping) {
            if (this.player && this.player.texture && this.player.texture.key !== 'playerextra') {
                this.player.setTexture('playerextra', 1);
            } else if (this.player && this.player.texture) {
                this.player.setFrame(1);
            }
            return;
        }
        if (this.player && this.player.texture && this.player.texture.key !== 'player') {
            this.player.setTexture('player');
        }
        const currentAreaName = this.currentArea ? this.currentArea.name : '';
        const inAudioRange = this.isSpeakerDancing && this._isCharWithinSpeakerRange(this.tileX, this.tileY, currentAreaName);
        if (inAudioRange && !this.isMoving && this.facing === 'down' && this.danceStep === 1) {
            this.player.setFrame(16);
            return;
        }
        switch (this.facing) {
            case 'down': this.player.setFrame(0); break;
            case 'up': this.player.setFrame(4); break;
            case 'left': this.player.setFrame(8); break;
            case 'right': this.player.setFrame(12); break;
        }
    }

    _updateSpeakerVolume() {
        if (!this.isSpeakerDancing || !window.YTManager || !window.YTManager.isPlaying) return;

        const baseVolume = (window.Game && window.Game.settings && window.Game.settings.volume !== undefined)
            ? window.Game.settings.volume
            : 80;

        let effectiveVol = baseVolume;

        if (this.placedSpeaker && this.placedSpeaker.sprite && this.placedSpeaker.sprite.active) {
            if (this.placedSpeaker.area === this.currentArea.name) {
                const playerX = this.player ? this.player.x : (this.tileX * Game.TILE_SIZE);
                const playerY = this.player ? this.player.y : (this.tileY * Game.TILE_SIZE);
                const speakerX = this.placedSpeaker.sprite.x;
                const speakerY = this.placedSpeaker.sprite.y;

                const distPx = Phaser.Math.Distance.Between(playerX, playerY, speakerX, speakerY);
                const tileDist = distPx / Game.TILE_SIZE;

                const minVol = Math.max(1, Math.round(baseVolume * 0.03));
                const fadeRange = 27;

                if (tileDist <= fadeRange) {
                    const factor = 1 - (tileDist / fadeRange);
                    effectiveVol = Math.round(minVol + (baseVolume - minVol) * factor);
                } else if (tileDist <= 30) {
                    effectiveVol = minVol;
                } else {
                    effectiveVol = 0;
                }
            } else {
                effectiveVol = 0;
            }
        }

        if (this._lastAppliedVol !== effectiveVol) {
            this._lastAppliedVol = effectiveVol;
            window.YTManager.setVolume(effectiveVol);
        }
    }

    startSpeakerMusic(volume) {
        if (!window.YTManager) return;
        this._lastAppliedVol = null;
        const volumePercent = (volume > 1) ? Math.min(100, Math.round(volume)) : Math.round(volume * 100);

        window.YTManager.onEndCallback = () => {
            this.stopSpeakerDance();
        };

        window.YTManager.play(volumePercent);
        this.startSpeakerDance();
    }

    pauseSpeakerMusic() {
        if (window.YTManager) {
            window.YTManager.pause();
        }
        this.stopSpeakerDance();
    }

    startSpeakerDance() {
        this.isSpeakerDancing = true;
        this.danceStep = 0;

        if (!this.isMoving) {
            this.facing = 'down';
            this.setIdleFrame();
        }

        this.dancingNpcs = [];
        const npcs = this._getAllServeriNpcs();
        npcs.forEach(npc => {
            if (!npc || !npc.sprite || !npc.sprite.active) return;
            npc.facing = 'down';
            npc.isDancing = true;
            npc.sprite.setFrame(0);
            this.dancingNpcs.push(npc);
        });

        if (this.placedSpeaker && this.placedSpeaker.sprite && this.placedSpeaker.sprite.active) {
            this.placedSpeaker.sprite.play('speaker_playing');
            this.placedSpeaker.isPlaying = true;
        }

        if (this.danceTimer) {
            this.danceTimer.remove();
        }
        this.danceTimer = this.time.addEvent({
            delay: 300,
            loop: true,
            callback: () => this._updateDanceStep()
        });
    }

    stopSpeakerDance() {
        this.isSpeakerDancing = false;
        if (this.danceTimer) {
            this.danceTimer.remove();
            this.danceTimer = null;
        }
        if (this.speakerDurationTimer) {
            this.speakerDurationTimer.remove();
            this.speakerDurationTimer = null;
        }
        if (window.YTManager) {
            window.YTManager.pause();
        }

        if (!this.isMoving && this.facing === 'down') {
            this.setIdleFrame();
        }

        if (this.placedSpeaker && this.placedSpeaker.sprite && this.placedSpeaker.sprite.active) {
            this.placedSpeaker.sprite.anims.stop();
            this.placedSpeaker.sprite.setFrame(0);
            this.placedSpeaker.isPlaying = false;
        }

        const npcs = this._getAllServeriNpcs();
        npcs.forEach(npc => {
            if (npc && npc.sprite && npc.sprite.active) {
                npc.isDancing = false;
                if (npc.facing === 'down') {
                    npc.sprite.setFrame(0);
                }
            }
        });
        this.dancingNpcs = [];
    }

    placeSpeakerOnGround(tileX, tileY) {
        this.stopSpeakerDance();

        if (this.placedSpeaker && this.placedSpeaker.sprite) {
            this.placedSpeaker.sprite.destroy();
        }

        const sprite = this.add.sprite(
            tileX * Game.TILE_SIZE,
            tileY * Game.TILE_SIZE,
            'items',
            0
        ).setOrigin(0, 0).setDepth(10);

        this.placedSpeaker = {
            tileX,
            tileY,
            area: this.currentArea.name,
            sprite,
            isPlaying: false
        };

        Game.state = Game.state || {};
        Game.state.placedSpeakerData = {
            area: this.currentArea.name,
            tileX,
            tileY
        };

        if (this.dialogue) {
            this.dialogue.show(['Placed Partybox on the ground.']);
        }
    }

    showSpeakerVolumeMenu() {
        const curVol = (window.Game && window.Game.settings && window.Game.settings.volume !== undefined)
            ? window.Game.settings.volume
            : 80;

        this.dialogue.show([`Partybox Volume: ${curVol}%`], null, [
            {
                text: '-10%',
                color: '#cc0000',
                hoverColor: '#ff3333',
                onClick: () => {
                    const newVol = Math.max(0, curVol - 10);
                    if (window.Game && window.Game.settings) {
                        window.Game.settings.volume = newVol;
                    }
                    if (window.Game && typeof window.Game.saveSettings === 'function') {
                        window.Game.saveSettings();
                    }
                    if (window.Game && typeof window.Game.playClickSound === 'function') {
                        window.Game.playClickSound();
                    }
                    this._lastAppliedVol = null;
                    if (window.YTManager) {
                        window.YTManager.setVolume(newVol);
                    }
                    this.showSpeakerVolumeMenu();
                }
            },
            {
                text: '+10%',
                color: '#006600',
                hoverColor: '#00cc00',
                onClick: () => {
                    const newVol = Math.min(100, curVol + 10);
                    if (window.Game && window.Game.settings) {
                        window.Game.settings.volume = newVol;
                    }
                    if (window.Game && typeof window.Game.saveSettings === 'function') {
                        window.Game.saveSettings();
                    }
                    if (window.Game && typeof window.Game.playClickSound === 'function') {
                        window.Game.playClickSound();
                    }
                    this._lastAppliedVol = null;
                    if (window.YTManager) {
                        window.YTManager.setVolume(newVol);
                    }
                    this.showSpeakerVolumeMenu();
                }
            },
            {
                text: 'Back',
                color: '#666666',
                hoverColor: '#aaaaaa',
                onClick: () => {
                    this._showSpeakerMenu();
                }
            }
        ]);
    }

    _showSpeakerMenu() {
        const volumePercent = (window.Game && window.Game.settings && window.Game.settings.volume !== undefined)
            ? window.Game.settings.volume
            : 80;
        const vol = volumePercent / 100;

        const isPlaying = this.isSpeakerDancing || (window.YTManager && window.YTManager.isPlaying);
        const actionBtn = isPlaying
            ? {
                text: 'Pause',
                color: '#884400',
                hoverColor: '#cc6600',
                onClick: () => {
                    this.pauseSpeakerMusic();
                }
            }
            : {
                text: 'Play',
                color: '#006600',
                hoverColor: '#00cc00',
                onClick: () => {
                    this.playPlacedSpeaker(vol);
                }
            };

        const volBtn = {
            text: 'Vol',
            color: '#004488',
            hoverColor: '#0088ff',
            onClick: () => {
                this.showSpeakerVolumeMenu();
            }
        };

        this.dialogue.show(['Partybox: Plays your favorite song: Zyn Zyn Zyn.'], null, [
            actionBtn,
            volBtn,
            {
                text: 'Take',
                color: '#cc0000',
                hoverColor: '#ff3333',
                onClick: () => {
                    this.takePlacedSpeaker();
                }
            }
        ]);
    }

    playPlacedSpeaker(volume) {
        if (this.placedSpeaker && this.placedSpeaker.sprite && this.placedSpeaker.sprite.active) {
            this.placedSpeaker.sprite.play('speaker_playing');
            this.placedSpeaker.isPlaying = true;
        }

        const volumePercent = (volume > 1) ? Math.min(100, Math.round(volume)) : Math.round(volume * 100);
        this.startSpeakerMusic(volume);

        if (this.dialogue) {
            this.dialogue.show([
                `Zyn zyn zyn\n\nVolume: ${volumePercent}%`
            ]);
        }
    }

    takePlacedSpeaker() {
        this.stopSpeakerDance();

        if (this.placedSpeaker && this.placedSpeaker.sprite) {
            this.placedSpeaker.sprite.destroy();
        }
        this.placedSpeaker = null;
        if (Game.state) {
            delete Game.state.placedSpeakerData;
        }

        if (this.backpack && !this.backpack.items.some(i => i.id === 'speaker')) {
            this.backpack.items.push({
                id: 'speaker',
                name: 'Partybox',
                desc: 'Plays your favorite song: Zyn Zyn Zyn.',
                canUse: true
            });
        }

        if (this.dialogue) {
            this.dialogue.show(['Picked up Partybox.']);
        }
    }

    _getAllServeriNpcs() {
        const list = [];
        const possibleNpcKeys = [
            'sleepingServeri',
            'examNpc',
            'examPencilNpc',
            'examStudent1',
            'examStudent2',
            'examStudent3',
            'examServeriZyn',
            'serverinpc2',
            'oldServeriSavilahti',
            'oldServeriExam',
            'oldServeriGuard'
        ];

        possibleNpcKeys.forEach(key => {
            const npc = this[key];
            if (npc && npc.sprite && npc.sprite.active) {
                const texKey = npc.sprite.texture ? npc.sprite.texture.key : '';
                if (texKey === 'serverinpc' || texKey === 'serverinpc2' || texKey === 'player' || texKey === 'oldman') {
                    if (key === 'sleepingServeri' && (!window.Game || !window.Game.state || !window.Game.state.serveriWoken)) {
                        return;
                    }
                    if (npc.isMoving || npc.isSleeping) return;
                    list.push(npc);
                }
            }
        });

        return list;
    }

    _updateDanceStep() {
        if (!this.isSpeakerDancing) return;

        this.danceStep = (this.danceStep === 0) ? 1 : 0;

        if (!this.isMoving && this.facing === 'down' && !this.isSleeping && !this.isIntroSleeping && (this.player && this.player.texture && this.player.texture.key === 'player')) {
            this.setIdleFrame();
        }

        const currentAreaName = this.currentArea ? this.currentArea.name : '';
        const npcs = this._getAllServeriNpcs();

        npcs.forEach(npc => {
            if (!npc || !npc.sprite || !npc.sprite.active) return;
            if (npc.isMoving) return;

            const inRange = this._isCharWithinSpeakerRange(npc.tileX, npc.tileY, currentAreaName);

            if (inRange) {
                npc.facing = 'down';
                npc.isDancing = true;
                if (this.danceStep === 1) {
                    npc.sprite.setFrame(16);
                } else {
                    npc.sprite.setFrame(0);
                }
            } else {
                if (npc.isDancing) {
                    npc.isDancing = false;
                    if (npc.facing === 'down') {
                        npc.sprite.setFrame(0);
                    }
                }
            }
        });
    }

    setSteppingFrame() {
        switch (this.facing) {
            case 'down': this.player.setFrame(1); break;
            case 'up': this.player.setFrame(5); break;
            case 'left': this.player.setFrame(9); break;
            case 'right': this.player.setFrame(13); break;
        }
    }

    isTileWalkable(x, y) {
        if (!this.currentArea || !this.tileData) return false;
        if (x < 0 || x >= this.currentArea.width || y < 0 || y >= this.currentArea.height) {
            return false;
        }
        if (this.isNpcAt && this.isNpcAt(x, y)) {
            return false;
        }
        if (this.placedSpeaker && this.placedSpeaker.area === this.currentArea.name &&
            this.placedSpeaker.tileX === x && this.placedSpeaker.tileY === y) {
            return false;
        }
        if (this.isDoorLocked && this.isDoorLocked(x, y)) {
            return false;
        }
        const targetTileIndex = this.tileData[y][x];
        if (!Game.WALKABLE_TILES.has(targetTileIndex)) {
            return false;
        }
        if (targetTileIndex === 199 && this.facing !== 'right') return false;
        if (targetTileIndex === 200 && this.facing !== 'left') return false;

        return true;
    }

    tryMove(dx, dy) {
        if (this.isCollapsing) return;

        if (this.player && this.player.texture && this.player.texture.key !== 'player' && !this.isIntroSleeping) {
            this.player.setTexture('player');
        }

        if (this.energy <= 0) {
            this.player.anims.stop();
            this.setIdleFrame();

            let hasEnergyItems = false;
            if (this.backpack && this.backpack.items) {
                hasEnergyItems = this.backpack.items.some(i => i.id === 'energy_drink' || i.id === 'protein_bar' || i.id === 'cup_of_coffee' || i.id === 'square_sandwich' || i.id === 'sandwich' || (i.id && i.id.startsWith('berry')));
            }

            if (!hasEnergyItems) {
                this.isCollapsing = true;
                this.isTransitioning = true; // Lock all further input updates completely

                Game.state = Game.state || {};
                const currentHour = Game.state.timeHour !== undefined ? Game.state.timeHour : 4;
                const canGroundSleep = !Game.state.sleptInBed && !Game.state.hasCollapsedBefore && currentHour < 8;

                if (!canGroundSleep) {
                    // Player loses: collapsed after sleeping in bed, collapsed twice, or time >= 8
                    this.stopSpeakerDance();
                    if (window.YTManager) window.YTManager.pause();
                    this.player.setTexture('playerextra');
                    this.player.setFrame(1);

                    if (this.dialogue && !this.dialogue.active) {
                        this.dialogue.show(['You collapse from exhaustion.'], () => {
                            if (this.sys && this.sys.game && this.sys.game.canvas) {
                                this.sys.game.canvas.style.filter = 'none';
                            }
                            this.time.delayedCall(50, () => {
                                const finalScore = (Game.state && Game.state.examScore) ? Game.state.examScore : 0;
                                this.scene.start('GameOverScene', { passed: false, score: finalScore });
                            });
                        });
                    }
                    return;
                }

                // First collapse when time < 8: Ground sleep sequence
                Game.state.hasCollapsedBefore = true;

                if (Game.state.timeHour === undefined || Game.state.timeHour < 8 || (Game.state.timeHour === 8 && Game.state.timeMinute < 15)) {
                    Game.state.timeHour = 8;
                    Game.state.timeMinute = 15;
                }

                if (this.backpack) {
                    const watch = this.backpack.items.find(i => i.id === 'watch');
                    if (watch) {
                        watch.desc = 'The time is 8:15.';
                    }
                }

                const old = this.energy;
                this.energy = Math.min(200, 60);
                if (this.addEnergyDiff) {
                    this.addEnergyDiff(this.energy - old);
                }

                this.player.setTexture('playerextra', 1);

                this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
                    if (progress === 1) {
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
                        sleepEl.innerText = 'Zzz...\n\nThe clock advances to 8:15\n\nYou sleep on the ground';
                        sleepEl.style.display = 'block';

                        this.time.delayedCall(4000, () => {
                            sleepEl.style.display = 'none';
                            this.cameras.main.fadeIn(1000, 0, 0, 0, (cam, prog) => {
                                if (prog === 1) {
                                    this.setIdleFrame();
                                    if (this.sys && this.sys.game && this.sys.game.canvas) {
                                        this.sys.game.canvas.style.filter = 'none';
                                    }
                                    this.updateNightLighting();
                                    this.isCollapsing = false;
                                    this.isTransitioning = false;
                                }
                            });
                        });
                    }
                });
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

        if (this.isNpcAt(targetX, targetY)) {
            this.player.play(`walk-${this.facing}`, true);
            return;
        }

        if (this.placedSpeaker && this.placedSpeaker.area === this.currentArea.name &&
            this.placedSpeaker.tileX === targetX && this.placedSpeaker.tileY === targetY) {
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

        let isWalkable = Game.WALKABLE_TILES.has(targetTileIndex);

        //Allow for one way tiles such as sideways doors
        if (targetTileIndex === 199 && this.facing !== 'right') {
            isWalkable = false;
        } else if (targetTileIndex === 200 && this.facing !== 'left') {
            isWalkable = false;
        }


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

        if (this.activeStepTileEffect && (this.activeStepTileEffect.x !== finalTargetX || this.activeStepTileEffect.y !== finalTargetY)) {
            this.restoreActiveStepTileEffect();
        }

        if (targetTileIndex === 627 || targetTileIndex === 628) {
            this.activeStepTileEffect = {
                x: finalTargetX,
                y: finalTargetY,
                origTile: targetTileIndex
            };
            if (this.layer) {
                this.layer.putTileAt(436, finalTargetX, finalTargetY);
            }
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
        if (Game.state && Game.state.isOverclocked) {
            totalMoveDuration *= 0.90;
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

                const landingTileIndex = this.tileData[finalTargetY][finalTargetX];
                const isSpiky = (landingTileIndex === 325); //Spiky tile id 325
                const hasShoes = (Game.state.collectedShoes >= 2);

                if (isSpiky && !Game.state.spikyTileStepped) {
                    Game.state.spikyTileStepped = true;
                    if (this.dialogue) {
                        this.dialogue.show(['Ouch, you walk on sharp stones!']);
                    }
                }

                if (isSpiky && !hasShoes) {
                    // Spiky tile without shoes: Always consumes 2 energy, ignoring morning/passive effects
                    this.energy = Math.max(0, this.energy - 2);
                    this.addEnergyDiff(this.energy - old);
                } else {
                    let shouldDecrease = true;
                    if (Game.state.examScore !== undefined) {
                        shouldDecrease = false;
                    } else if (hasShoes && Game.state.totalSteps % 3 === 0) {
                        shouldDecrease = false;
                    } else if (Game.state.timeHour >= 8 && Game.state.totalSteps % 5 === 0) {
                        shouldDecrease = false;
                    }

                    if (shouldDecrease) {
                        this.energy = Math.max(0, this.energy - 1);
                        this.addEnergyDiff(this.energy - old);
                    }
                }

                if ((Game.state.startedSteps || 0) < 5) {
                    Game.state.startedSteps = (Game.state.startedSteps || 0) + 1;
                    if (Game.state.startedSteps === 5) {
                        if (this.dialogue) {
                            this.dialogue.show(['I should probably go home to sleep.. but I seem to have lost my keys?!']);
                        }
                    }
                }

                if (this.reverseControlsSteps > 0) {
                    this.reverseControlsSteps--;
                    this.updateDrunkEffect();
                }

                if (this.drunkSteps > 0) {
                    this.drunkSteps--;
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
                        this.setIdleFrame();
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

    restoreActiveStepTileEffect() {
        if (this.activeStepTileEffect) {
            const { x, y, origTile } = this.activeStepTileEffect;
            if (this.layer) {
                this.layer.putTileAt(origTile, x, y);
            }
            this.activeStepTileEffect = null;
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

    triggerMapTransition(targetMap, targetX, targetY, exitDir) {
        this.isTransitioning = true;
        this.player.anims.stop();
        this.setIdleFrame();

        this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
            if (progress === 1) {
                this.loadArea(targetMap, targetX, targetY).then(() => {
                    if (exitDir) this.facing = exitDir;
                    this.setIdleFrame();
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
                    this.triggerMapTransition(transition.targetMap, transition.targetX, transition.targetY, transition.exitDir);
                    return true;
                }
            }
        }

        // 2. Check by edge transitions (like Laitos top edge)
        if (areaTransitions.edgeTransitions) {
            if (this.tileY === 0 && areaTransitions.edgeTransitions.top) {
                const transition = areaTransitions.edgeTransitions.top;
                this.triggerMapTransition(transition.targetMap, transition.targetX, transition.targetY, transition.exitDir);
                return true;
            }
        }

        // 3. Check by tile ID
        if (areaTransitions.byTile) {
            const transition = areaTransitions.byTile[currentTile];
            if (transition) {
                if (!transition.requiredItem || this.hasItem(transition.requiredItem)) {
                    this.triggerMapTransition(transition.targetMap, transition.targetX, transition.targetY, transition.exitDir);
                    return true;
                } else {
                    if (this.dialogue) {
                        this.dialogue.show(['The door to my house is locked!', 'I need my Home Key to get inside.', 'Maybe somebody brought my home key to the CS department']);
                    }
                    return true;
                }
            }
        }

        return false;
    }

    updatePolice(time, delta) {
        if (this.policeChaserAI) {
            this.policeChaserAI.update(time, delta);
        }
    }

    _createPoliceChaser() {
        if (!this.police) return;
        this.policeChaserAI = new Game.ChaserAI(this, this.police, {
            alertRange: 5,
            animPrefix: 'poliisi-walk',
            yOffset: -2,
            speedPenalty: 15,
            shouldRemove: (npc, scene) => {
                return Game.state && Game.state.hasSlept;
            },
            onCatch: (chaserAI, scene) => {
                const npc = chaserAI.npc;
                if (!npc.hasRanOnce) {
                    scene.dialogue.show(["Cop: You don't look well, how about we go sleep in the police station?"], null, [
                        {
                            text: 'Accept', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                scene._sendPlayerToJail();
                            }
                        },
                        {
                            text: 'Run', color: '#880000', hoverColor: '#cc0000', onClick: () => {
                                if (npc) {
                                    npc.hasRanOnce = true;
                                    npc.hasSeenPlayer = false;
                                    npc.isStunned = true;
                                    scene.time.delayedCall(4000, () => {
                                        if (npc) npc.isStunned = false;
                                    });
                                }
                                scene.isTransitioning = false;
                            }
                        }
                    ]);
                } else {
                    scene.dialogue.show(["Cop: And where are you planning to go then?"], () => {
                        scene._sendPlayerToJail();
                    });
                }
            }
        });
    }

    onPlayerDrankAlcohol(itemId) {
        if (!this.currentArea) return;
        const areaName = this.currentArea.name;

        if (areaName === 'Laitos') {
            if (!this.guardChaserAI || !this.guardChaserAI.npc) {
                const npc = {
                    tileX: 2,
                    tileY: 13,
                    facing: 'down',
                    isMoving: false,
                    hasSeenPlayer: false,
                    isStunned: false,
                    sprite: this.add.sprite(2 * Game.TILE_SIZE, 13 * Game.TILE_SIZE - 4, 'oldman', 0).setOrigin(0, 0).setDepth(10)
                };
                this.oldServeriGuard = npc;
                this.guardChaserAI = new Game.ChaserAI(this, npc, {
                    alertRange: 15,
                    animPrefix: 'oldman-walk',
                    yOffset: -4,
                    speedPenalty: 15,
                    onCatch: (chaserAI, scene) => {
                        scene.dialogue.show(["Old Serveri: No drinking at the department! You know perfectly well"], () => {
                            Game.state = Game.state || {};
                            Game.state.thrownOutByOldServeri = true;
                            scene.cameras.main.fadeOut(300, 0, 0, 0, (camera, progress) => {
                                if (progress === 1) {
                                    chaserAI.destroy();
                                    scene.guardChaserAI = null;
                                    scene.oldServeriGuard = null;
                                    scene.loadArea('data/savilahti.csv', 15, 42).then(() => {
                                        scene.cameras.main.fadeIn(300, 0, 0, 0, (cam, prog) => {
                                            if (prog === 1) {
                                                scene.isTransitioning = false;
                                                scene.dialogue.show(["The old man throws you out"]);
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            }
        } else if (areaName === 'Exam') {
            if (!this.guardChaserAI || !this.guardChaserAI.npc) {
                const npc = {
                    tileX: 22,
                    tileY: 35,
                    facing: 'down',
                    isMoving: false,
                    hasSeenPlayer: false,
                    isStunned: false,
                    sprite: this.add.sprite(22 * Game.TILE_SIZE, 35 * Game.TILE_SIZE - 4, 'oldman', 0).setOrigin(0, 0).setDepth(10)
                };
                this.oldServeriGuard = npc;
                this.guardChaserAI = new Game.ChaserAI(this, npc, {
                    alertRange: 15,
                    animPrefix: 'oldman-walk',
                    yOffset: -4,
                    speedPenalty: 15,
                    onCatch: (chaserAI, scene) => {
                        scene.dialogue.show(["Old Serveri: No drinking at school! You know perfectly well"], () => {
                            scene.cameras.main.fadeOut(300, 0, 0, 0, (camera, progress) => {
                                if (progress === 1) {
                                    chaserAI.destroy();
                                    scene.guardChaserAI = null;
                                    scene.oldServeriGuard = null;
                                    scene.loadArea('data/snellmania.csv', 41, 20).then(() => {
                                        scene.cameras.main.fadeIn(300, 0, 0, 0, (cam, prog) => {
                                            if (prog === 1) {
                                                scene.isTransitioning = false;
                                                scene.dialogue.show(["The old man throws you out"]);
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            }
        }
    }

    updateOldServeriGuard(time, delta) {
        if (this.guardChaserAI) {
            this.guardChaserAI.update(time, delta);
        }
    }

    _sendPlayerToJail() {
        this.isTransitioning = true;
        this.cameras.main.fadeOut(300, 0, 0, 0, (camera, progress) => {
            if (progress === 1) {
                // Step 1: Teleport to jail in snellmania.csv at (5, 3)
                this.loadArea('data/snellmania.csv', 5, 3).then(() => {
                    this.player.setTexture('playerextra', 1); // sleeping frame

                    // Advance time
                    Game.state = Game.state || {};
                    Game.state.hasSlept = true;
                    Game.state.sleptInJail = true;
                    if (Game.state.timeHour === undefined || Game.state.timeHour < 9 || (Game.state.timeHour === 9 && Game.state.timeMinute < 5)) {
                        Game.state.timeHour = 9;
                        Game.state.timeMinute = 5;
                    }
                    if (this.backpack) {
                        const watch = this.backpack.items.find(i => i.id === 'watch');
                        if (watch) {
                            watch.desc = 'The time is 9:05. You are late.';
                        }
                    }

                    // Dark sleeping overlay
                    const darkOverlay = this.add.rectangle(0, 0, this.currentArea.width * Game.TILE_SIZE, this.currentArea.height * Game.TILE_SIZE, 0x000000, 0.5)
                        .setOrigin(0, 0)
                        .setDepth(1900);

                    this.cameras.main.fadeIn(400, 0, 0, 0, (cam, prog) => {
                        if (prog === 1) {
                            // Show jail sleep message (restores NO energy!)
                            this.dialogue.show(['You spend the night in jail.'], () => {
                                // Step 2: Fade out and drop off player at serveriquest.csv (42, 1)
                                this.cameras.main.fadeOut(400, 0, 0, 0, (cam2, prog2) => {
                                    if (prog2 === 1) {
                                        darkOverlay.destroy();
                                        this.loadArea('data/snellmania.csv', 42, 1).then(() => {
                                            this.setIdleFrame();
                                            this.cameras.main.fadeIn(400, 0, 0, 0, (cam3, prog3) => {
                                                if (prog3 === 1) {
                                                    this.dialogue.show([
                                                        'The police drop you off at Snellmania',
                                                        'The clock is 9! I have an exam!'
                                                    ], () => {
                                                        this.isTransitioning = false;
                                                    });
                                                }
                                            });
                                        });
                                    }
                                });
                            });
                        }
                    });
                });
            }
        });
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

    isNpcAt(x, y) {
        if (this.npcManager && this.npcManager.isNpcAt) {
            return this.npcManager.isNpcAt(x, y);
        }
        const npcs = [
            this.assistant,
            this.sleepingServeri,
            this.examNpc,
            this.examAssistant,
            this.examPencilNpc,
            this.shopkeep,
            ...(this.prismaShopkeeps || []),
            this.drunkard,
            this.police
        ];
        return npcs.some(npc => npc && npc.tileX === x && npc.tileY === y);
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
                this.isSleeping = false;
                this.player.anims.stop();
                this.setIdleFrame();
                this.isTransitioning = false;
            }
        });
    }

    updateDrunkEffect() {
        if (!this.sys || !this.sys.game || !this.sys.game.canvas) return;
        const canvas = this.sys.game.canvas;

        if (this.currentArea && this.currentArea.name === 'Exam') {
            Game.state = Game.state || {};
            Game.state.hasEnteredExam = true;
        }

        let drunkBlur = 0;
        if (this.drunkSteps && this.drunkSteps > 0) {
            if (this.lastDrunkType === 'gambina') {
                drunkBlur = Math.min(3.0, 1.0 + (this.drunkSteps / 10));
            } else {
                drunkBlur = Math.min(3.0, this.drunkSteps / 10.0);
            }
        } else if (this.reverseControlsSteps && this.reverseControlsSteps > 0) {
            drunkBlur = Math.min(3.0, this.reverseControlsSteps / 10.0);
        }

        if (Game.state && Game.state.hasEnteredExam) {
            // One sip produces ~2.3px blur in exam
            const maxOneJalluSipBlur = 2.3;
            drunkBlur = Math.min(maxOneJalluSipBlur, drunkBlur);
        } else if (this.drunkSteps && this.drunkSteps >= 40) {
            // High drunkenness (40+ steps out of 70 max for both Jallu and Gambina):
            // Smoothly transfer/oscillate between 3.0px and 7.0px
            const sinePulse = (Math.sin(Date.now() / 950) + 1) / 2; // Smooth wave
            drunkBlur = 3.0 + (sinePulse * 4.0); // Ranges smoothly 3.0px -> 7.0px -> 3.0px
        }

        let energyBlur = 0;
        if (this.energy !== undefined && this.energy <= 20) {
            energyBlur = (20 - Math.max(0, this.energy)) / 10;
        }

        const finalBlur = Math.max(drunkBlur, energyBlur);

        if (finalBlur <= 0) {
            canvas.style.filter = 'none';
        } else {
            canvas.style.filter = `blur(${finalBlur.toFixed(2)}px)`;
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
        } else if (item.id === 'jallukanto') {
            this.dialogue.show(['How did you even get that?? ..well unfortunately I only drink Gambina']);
        } else if (item.id === 'jallu') {
            this.dialogue.show(['No, I only drink Gambina']);
        } else if (item.id === 'gambina') {
            this.backpack.items = this.backpack.items.filter(i => i.id !== item.id);
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
        } else if (item.id === 'speaker') {
            this.dialogue.show(['Serveri: A Partybox? Nah, I don\'t want to take it from you! But play it!']);
        } else {
            this.dialogue.show(['I have no use for that']);
        }
    }

    _handleDrunkardGiveJallu() {
        if (!this.backpack || !this.backpack.items) return;
        const jalluItem = this.backpack.items.find(i => i.id === 'jallu' || i.id === 'jallukanto');

        if (!jalluItem) {
            this.dialogue.show(['Drunkard: Hey! You don\'t even have any Jallu! *hic*']);
            return;
        }

        if (typeof jalluItem.cl !== 'undefined' && jalluItem.cl <= 0) {
            // Bottle is empty! Drunkard throws a weak punch with -10 energy
            const old = this.energy;
            this.energy = Math.max(0, this.energy - 10);
            if (this.addEnergyDiff) {
                this.addEnergyDiff(this.energy - old);
            }
            this.dialogue.show([
                'Drunkard: This bottle is empty! *WHACK*',
                'The drunkard throws a weak punch at you! (-10 Energy)'
            ]);
        } else {
            Game.state = Game.state || {};
            const isKanto = jalluItem.id === 'jallukanto';
            const rewardMoney = isKanto ? 5 : 3;

            if (isKanto) {
                jalluItem.cl = Math.max(0, jalluItem.cl - 75);
                jalluItem.desc = `Hyeena ry's legendary tree stump full of Jallu. ${jalluItem.cl}cl left`;
            } else {
                this.backpack.items = this.backpack.items.filter(i => i !== jalluItem);
            }

            Game.state.money = (Game.state.money !== undefined ? Game.state.money : 2) + rewardMoney;
            Game.state.drunkardSatisfied = true;

            let walletItem = this.backpack.items.find(i => i.id === 'wallet');
            if (walletItem) {
                walletItem.name = `Wallet ${Game.state.money}€`;
            } else {
                this.backpack.items.push({
                    id: 'wallet',
                    name: `Wallet ${Game.state.money}€`,
                    desc: 'Contains your money.',
                    canUse: false
                });
            }

            if (isKanto) {
                this.dialogue.show([
                    'Drunkard: Thanks buddy! Here\'s 5€ for your troubles!',
                    'Hyeena is probably not gonna get that back..'
                ]);
            } else {
                this.dialogue.show([
                    'Drunkard: Thanks buddy! Here\'s 3€ for your troubles!',
                    'Whatever...'
                ]);
            }
        }
    }

    updateBusTiles() {
        if (!this.currentArea || !this.tileData) return;
        const currentHour = (Game.state && Game.state.timeHour !== undefined) ? Game.state.timeHour : 4;
        if (currentHour >= 8) {
            if (this.currentArea.name === 'snellmania') {
                if (this.tileData[16]) this.tileData[16][51] = 3212;
                if (this.tileData[17]) this.tileData[17][51] = 3276;
                if (this.tileData[18]) this.tileData[18][51] = 2833;
                if (this.layer) {
                    this.layer.putTileAt(3212, 51, 16);
                    this.layer.putTileAt(3276, 51, 17);
                    this.layer.putTileAt(2833, 51, 18);
                }
            } else if (this.currentArea.name === 'savilahti') {
                if (this.tileData[8]) this.tileData[8][55] = 2767;
                if (this.tileData[9]) this.tileData[9][55] = 2767;
                if (this.tileData[10]) this.tileData[10][55] = 2767;
                if (this.layer) {
                    this.layer.putTileAt(2767, 55, 8);
                    this.layer.putTileAt(2767, 55, 9);
                    this.layer.putTileAt(2767, 55, 10);
                }
            }
        }
    }

    updateNightLighting() {
        this.updateBusTiles();

        const indoorAreas = ['NeulamaenSale', 'House', 'Laitos', 'Prisma', 'Exam'];
        const currentAreaName = this.currentArea ? this.currentArea.name : '';
        const isIndoor = indoorAreas.includes(currentAreaName);

        const isNight = !isIndoor && (Game.state && Game.state.timeHour !== undefined ? Game.state.timeHour : 4) < 6;

        // Cleanup existing streetlight glow objects
        if (this.streetlightGlows) {
            this.streetlightGlows.forEach(g => g && g.destroy && g.destroy());
            this.streetlightGlows = [];
        }

        if (!isNight) {
            if (this.nightOverlay) {
                this.nightOverlay.setVisible(false);
            }
            return;
        }

        const areaWidthPx = (this.currentArea ? this.currentArea.width : 50) * Game.TILE_SIZE;
        const areaHeightPx = (this.currentArea ? this.currentArea.height : 50) * Game.TILE_SIZE;

        if (!this.nightOverlay) {
            this.nightOverlay = this.add.rectangle(
                0, 0,
                Math.max(areaWidthPx, 2500),
                Math.max(areaHeightPx, 2500),
                0x0c1033, // Soft midnight blue tint
                0.12      // Soft darkness opacity
            ).setOrigin(0, 0).setDepth(1800);
        } else {
            this.nightOverlay.setSize(Math.max(areaWidthPx, 2500), Math.max(areaHeightPx, 2500));
            this.nightOverlay.setVisible(true);
        }

        // Add 3-tile diameter warm glow circles over all streetlight tiles (ID 3136)
        this.streetlightGlows = [];
        const radiusPx = (3 * Game.TILE_SIZE) / 2; // 3 tiles diameter = 48px -> 24px radius

        if (this.tileData) {
            for (let y = 0; y < this.tileData.length; y++) {
                for (let x = 0; x < this.tileData[y].length; x++) {
                    if (this.tileData[y][x] === 3136) {
                        const centerX = x * Game.TILE_SIZE + Game.TILE_SIZE / 2;
                        const centerY = y * Game.TILE_SIZE + Game.TILE_SIZE / 2;

                        const glow = this.add.circle(
                            centerX,
                            centerY,
                            radiusPx,
                            0xe6a832, // Soft warm amber streetlight glow
                            0.16     // Soft glow intensity
                        ).setOrigin(0.5, 0.5)
                            .setDepth(1801)
                            .setBlendMode(Phaser.BlendModes.ADD);

                        this.streetlightGlows.push(glow);
                    }
                }
            }
        }
    }
};
