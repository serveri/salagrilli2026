// NpcManager: Handles spawning, animating, and interacting with all NPCs across game areas
window.Game = window.Game || {};

Game.NpcManager = class NpcManager {
    constructor(scene) {
        this.scene = scene;
        this.interactions = this._initInteractions();
    }

    spawnNpcsForArea(areaName) {
        this.destroyAll();

        const scene = this.scene;

        // 1. Police & Bottle Grandma in serveriquest
        if (areaName === 'serveriquest') {
            if (!Game.state || !Game.state.hasSlept) {
                const px = 25, py = 52;
                scene.police = {
                    tileX: px,
                    tileY: py,
                    facing: 'down',
                    isMoving: false,
                    hasSeenPlayer: false,
                    isStunned: false,
                    sprite: scene.add.sprite(px * Game.TILE_SIZE, py * Game.TILE_SIZE - 2, 'poliisi', 0).setOrigin(0, 0).setDepth(10)
                };
            }

            scene.bottleGrandma = {
                tileX: 44,
                tileY: 36,
                facing: 'down',
                isMoving: false,
                sprite: scene.add.sprite(44 * Game.TILE_SIZE, 36 * Game.TILE_SIZE - 4, 'pullomummo', 0).setOrigin(0, 0).setDepth(10)
            };
        }

        // 2. Assistant & Sleeping Serveri in Laitos
        if (areaName === 'Laitos') {
            scene.assistant = {
                tileX: 20,
                tileY: 9,
                facing: 'down',
                sprite: scene.add.sprite(20 * Game.TILE_SIZE, 9 * Game.TILE_SIZE - 4, 'opetusavustaja', 0).setOrigin(0, 0).setDepth(10)
            };

            Game.state = Game.state || {};
            const sy = Game.state.serveriWoken ? 8 : 7;
            const tex = Game.state.serveriWoken ? 'player' : 'playerextra';
            const frame = Game.state.serveriWoken ? 0 : 1;
            scene.sleepingServeri = {
                tileX: 28,
                tileY: sy,
                facing: 'down',
                sprite: scene.add.sprite(28 * Game.TILE_SIZE, sy * Game.TILE_SIZE - 2, tex, frame).setOrigin(0, 0).setDepth(10)
            };
        }

        // 3. Exam NPCs in Exam area
        if (areaName === 'Exam') {
            scene.examNpc = {
                tileX: 12,
                tileY: 33,
                facing: 'down',
                sprite: scene.add.sprite(12 * Game.TILE_SIZE, 33 * Game.TILE_SIZE, 'serverinpc', 0).setOrigin(0, 0).setDepth(10)
            };

            scene.examAssistant = {
                tileX: 13,
                tileY: 5,
                facing: 'down',
                sprite: scene.add.sprite(13 * Game.TILE_SIZE, 5 * Game.TILE_SIZE - 4, 'opetusavustaja', 0).setOrigin(0, 0).setDepth(10)
            };
            this.scheduleNpcTurn('examAssistant', true, 6000, 18000);

            scene.oldServeriExam = {
                tileX: 14,
                tileY: 7,
                facing: 'down',
                sprite: scene.add.sprite(14 * Game.TILE_SIZE, 7 * Game.TILE_SIZE - 4, 'oldman', 0).setOrigin(0, 0).setDepth(10)
            };

            scene.examPencilNpc = {
                tileX: 16,
                tileY: 32,
                facing: 'left',
                sprite: scene.add.sprite(16 * Game.TILE_SIZE, 32 * Game.TILE_SIZE - 2, 'serverinpc2', 8).setOrigin(0, 0).setDepth(10)
            };
            this.scheduleNpcTurn('examPencilNpc', true, 6000, 18000);

            scene.examStudent1 = {
                tileX: 9,
                tileY: 7,
                facing: 'right',
                sprite: scene.add.sprite(9 * Game.TILE_SIZE, 7 * Game.TILE_SIZE - 2, 'player', 12).setOrigin(0, 0).setDepth(10)
            };

            scene.examStudent2 = {
                tileX: 6,
                tileY: 3,
                facing: 'down',
                sprite: scene.add.sprite(6 * Game.TILE_SIZE, 3 * Game.TILE_SIZE, 'serverinpc', 0).setOrigin(0, 0).setDepth(10)
            };

            scene.examStudent3 = {
                tileX: 2,
                tileY: 4,
                facing: 'right',
                sprite: scene.add.sprite(2 * Game.TILE_SIZE, 4 * Game.TILE_SIZE - 2, 'player', 12).setOrigin(0, 0).setDepth(10)
            };

            scene.examServeriZyn = {
                tileX: 17,
                tileY: 34,
                facing: 'right',
                sprite: scene.add.sprite(17 * Game.TILE_SIZE, 34 * Game.TILE_SIZE - 2, 'player', 0).setOrigin(0, 0).setDepth(10)
            };

            scene.examSnackNpc = {
                tileX: 19,
                tileY: 40,
                facing: 'left',
                sprite: scene.add.sprite(19 * Game.TILE_SIZE, 40 * Game.TILE_SIZE - 2, 'serverinpc', 8).setOrigin(0, 0).setDepth(10)
            };

            scene.examPrismaServeri = {
                tileX: 8,
                tileY: 6,
                facing: 'right',
                sprite: scene.add.sprite(8 * Game.TILE_SIZE, 6 * Game.TILE_SIZE - 2, 'serverinpc2', 12).setOrigin(0, 0).setDepth(10)
            };
        }

        // 4. Shopkeep in NeulamaenSale
        if (areaName === 'NeulamaenSale') {
            scene.shopkeep = {
                tileX: 9,
                tileY: 4,
                facing: 'down',
                sprite: scene.add.sprite(9 * Game.TILE_SIZE, 4 * Game.TILE_SIZE - 4, 'shopkeep', 0).setOrigin(0, 0).setDepth(10)
            };
        }

        // 5. Prisma Shopkeeps & serverinpc2
        if (areaName === 'Prisma') {
            scene.prismaShopkeeps = [
                { tileX: 22, tileY: 10, facing: 'left', sprite: scene.add.sprite(22 * Game.TILE_SIZE, 10 * Game.TILE_SIZE - 4, 'shopkeep', 8).setOrigin(0, 0).setDepth(10) },
                { tileX: 27, tileY: 10, facing: 'left', sprite: scene.add.sprite(27 * Game.TILE_SIZE, 10 * Game.TILE_SIZE - 4, 'shopkeep', 8).setOrigin(0, 0).setDepth(10) },
                { tileX: 8, tileY: 18, facing: 'right', sprite: scene.add.sprite(8 * Game.TILE_SIZE, 18 * Game.TILE_SIZE - 4, 'shopkeep', 12).setOrigin(0, 0).setDepth(10) }
            ];
            scene.serverinpc2 = {
                tileX: 5,
                tileY: 3,
                facing: 'down',
                sprite: scene.add.sprite(5 * Game.TILE_SIZE, 3 * Game.TILE_SIZE, 'serverinpc2', 0).setOrigin(0, 0).setDepth(10)
            };
            scene.facing = 'up';
            scene.setIdleFrame();
        }

        // 6. Drunkard, Hacker, Old Serveri in savilahti
        if (areaName === 'savilahti') {
            scene.drunkard = {
                tileX: 51,
                tileY: 59,
                facing: 'down',
                sprite: scene.add.sprite(51 * Game.TILE_SIZE, 59 * Game.TILE_SIZE - 4, 'juoppo', 0).setOrigin(0, 0).setDepth(10)
            };
            this.scheduleNpcTurn('drunkard', true);

            scene.hacker = {
                tileX: 20,
                tileY: 14,
                facing: 'down',
                sprite: scene.add.sprite(20 * Game.TILE_SIZE, 14 * Game.TILE_SIZE - 4, 'hacker', 0).setOrigin(0, 0).setDepth(10)
            };
            this.scheduleNpcTurn('hacker', true);

            scene.oldServeriSavilahti = {
                tileX: 13,
                tileY: 41,
                facing: 'down',
                sprite: scene.add.sprite(13 * Game.TILE_SIZE, 41 * Game.TILE_SIZE - 4, 'oldman', 0).setOrigin(0, 0).setDepth(10)
            };
        }

        // 7. Hyeena in snellmania (37, 54)
        if (areaName === 'snellmania') {
            scene.hyeena = {
                tileX: 37,
                tileY: 54,
                facing: 'down',
                sprite: scene.add.sprite(37 * Game.TILE_SIZE, 54 * Game.TILE_SIZE - 2, 'hyeena', 0).setOrigin(0, 0).setDepth(10)
            };
            this.scheduleNpcTurn('hyeena', false);
        }

        // 8. Cat in House
        if (areaName === 'House') {
            scene.houseCat = {
                tileX: 18,
                tileY: 10,
                facing: 'down',
                sprite: scene.add.sprite(18 * Game.TILE_SIZE, 10 * Game.TILE_SIZE, 'housecat', 0).setOrigin(0, 0).setDepth(10)
            };
            if (scene.anims) {
                if (!scene.anims.exists('cat_tail_wag')) {
                    scene.anims.create({
                        key: 'cat_tail_wag',
                        frames: scene.anims.generateFrameNumbers('housecat', { start: 0, end: 2 }),
                        frameRate: 3,
                        repeat: -1
                    });
                }
                if (!scene.anims.exists('cat_dance')) {
                    scene.anims.create({
                        key: 'cat_dance',
                        frames: scene.anims.generateFrameNumbers('housecat', { frames: [0, 3] }),
                        frameRate: 4,
                        repeat: -1
                    });
                }
            }
        }
    }

    update(time, delta) {
        this.updateCatAnimation();
    }

    updateCatAnimation() {
        const scene = this.scene;
        const cat = scene.houseCat;
        if (!cat || !cat.sprite || !cat.sprite.active) return;

        const isMusicPlaying = (scene.isSpeakerDancing || (window.YTManager && window.YTManager.isPlaying));

        if (isMusicPlaying) {
            if (!cat.sprite.anims.isPlaying || cat.sprite.anims.currentAnim.key !== 'cat_dance') {
                cat.sprite.play('cat_dance');
            }
        } else if (Game.state && Game.state.catFeedCount > 0) {
            if (!cat.sprite.anims.isPlaying || cat.sprite.anims.currentAnim.key !== 'cat_tail_wag') {
                cat.sprite.play('cat_tail_wag');
            }
        } else {
            cat.sprite.anims.stop();
            cat.sprite.setFrame(0);
        }
    }

    scheduleNpcTurn(npcKey, allowUp = true, minDelay = 2000, maxDelay = 8000) {
        const scene = this.scene;
        const npcObj = scene[npcKey];
        if (!npcObj || !npcObj.sprite || !npcObj.sprite.active) return;

        const timerProp = npcKey + 'TurnTimer';
        if (scene[timerProp]) {
            scene[timerProp].remove();
            scene[timerProp] = null;
        }

        const delay = Phaser.Math.Between(minDelay, maxDelay);
        scene[timerProp] = scene.time.delayedCall(delay, () => {
            const currentNpc = scene[npcKey];
            if (!currentNpc || !currentNpc.sprite || !currentNpc.sprite.active) return;

            const isDancingOrInMusic = (npcKey === 'examPencilNpc') && (currentNpc.isDancing || (scene.isSpeakerDancing && typeof scene._isCharWithinSpeakerRange === 'function' && scene._isCharWithinSpeakerRange(currentNpc.tileX, currentNpc.tileY, scene.currentArea ? scene.currentArea.name : '')));

            if (!isDancingOrInMusic) {
                const directions = allowUp ? ['down', 'up', 'left', 'right'] : ['down', 'left', 'right'];
                const newFacing = Phaser.Utils.Array.GetRandom(directions);
                currentNpc.facing = newFacing;

                const isFourFrame = currentNpc === scene.hyeena || (currentNpc.sprite.texture && currentNpc.sprite.texture.frameTotal <= 5);
                if (isFourFrame) {
                    switch (newFacing) {
                        case 'down': currentNpc.sprite.setFrame(0); break;
                        case 'up': currentNpc.sprite.setFrame(1); break;
                        case 'left': currentNpc.sprite.setFrame(2); break;
                        case 'right': currentNpc.sprite.setFrame(3); break;
                    }
                } else {
                    switch (newFacing) {
                        case 'down': currentNpc.sprite.setFrame(0); break;
                        case 'up': currentNpc.sprite.setFrame(4); break;
                        case 'left': currentNpc.sprite.setFrame(8); break;
                        case 'right': currentNpc.sprite.setFrame(12); break;
                    }
                }
            }

            this.scheduleNpcTurn(npcKey, allowUp, minDelay, maxDelay);
        });
    }

    scheduleHyeenaTurn() {
        this.scheduleNpcTurn('hyeena', false);
    }

    destroyAll() {
        const scene = this.scene;
        ['hyeenaTurnTimer', 'drunkardTurnTimer', 'hackerTurnTimer', 'examAssistantTurnTimer', 'examPencilNpcTurnTimer'].forEach(prop => {
            if (scene[prop]) {
                scene[prop].remove();
                scene[prop] = null;
            }
        });
        ['police', 'assistant', 'sleepingServeri', 'examNpc', 'examAssistant', 'examPencilNpc', 'examStudent1', 'examStudent2', 'examStudent3', 'examSnackNpc', 'examPrismaServeri', 'shopkeep', 'drunkard', 'hyeena', 'serverinpc2', 'examServeriZyn', 'hacker', 'oldServeriSavilahti', 'oldServeriExam', 'houseCat', 'bottleGrandma'].forEach(key => {
            if (scene[key] && scene[key].sprite) {
                scene[key].sprite.destroy();
                scene[key] = null;
            }
        });
        if (scene.prismaShopkeeps) {
            scene.prismaShopkeeps.forEach(sk => sk.sprite && sk.sprite.destroy());
            scene.prismaShopkeeps = [];
        }
    }

    _initInteractions() {
        return [
            {
                key: 'houseCat',
                face: false,
                handler: (scene) => {
                    Game.state = Game.state || {};
                    const isFed = Game.state.catFeedCount > 0;
                    const greeting = isFed ? 'Meow! ^_^' : 'Meow!';

                    scene.dialogue.show([greeting], null, [
                        {
                            text: 'Pet',
                            color: '#006600', hoverColor: '#00cc00',
                            onClick: () => {
                                scene.dialogue.show(['*Purrr purrr...*', 'The cat purrs happily!']);
                            }
                        },
                        {
                            text: 'Give cat food',
                            onClick: () => {
                                const catFoodIndex = scene.backpack ? scene.backpack.items.findIndex(i => i.id === 'cat_food') : -1;
                                if (catFoodIndex === -1) {
                                    scene.dialogue.show(['You don\'t have any Cat food to give!']);
                                } else {
                                    const feedCount = Game.state.catFeedCount || 0;
                                    if (feedCount >= 2) {
                                        scene.dialogue.show(['The cat is full and refuses the food!']);
                                    } else {
                                        scene.backpack.items.splice(catFoodIndex, 1);
                                        Game.state.catFeedCount = feedCount + 1;
                                        this.updateCatAnimation();
                                        scene.dialogue.show(['You fed the cat some Cat food!', 'The cat happily wags its tail!']);
                                    }
                                }
                            }
                        },
                        {
                            text: 'X',
                            color: '#cc0000',
                            hoverColor: '#ff4444',
                            onClick: () => { }
                        }
                    ]);
                }
            },
            {
                key: 'sleepingServeri',
                face: false,
                handler: (scene) => {
                    if (!Game.state.serveriWoken) {
                        scene.dialogue.show(['The serveri is fast asleep']);
                    } else {
                        if (!Game.state.cheatSheetGiven) {
                            scene.dialogue.show(['Serveri: That delicous smell of coffee woke me up!', 'Serveri: Look, I got this cheat sheet..', 'Serveri: Take it, I\'m probably not gonna make it to the exam anyway..'], () => {
                                scene.backpack.items.push({
                                    id: 'cheat_sheet',
                                    name: 'Cheat sheet',
                                    desc: 'Looks useful for the exam.',
                                    canUse: false
                                });
                                Game.state.cheatSheetGiven = true;
                            });
                        } else {
                            scene.dialogue.show(['Serveri: Good luck on the exam!']);
                        }
                    }
                }
            },
            {
                key: 'examAssistant',
                handler: (scene) => {
                    if (Game.state.examScore !== undefined) {
                        scene.dialogue.show(['IT-Guy: I hope you did well!']);
                    } else {
                        scene.dialogue.show(['IT-Guy: Please take a seat.']);
                    }
                }
            },
            {
                key: 'examNpc',
                handler: (scene) => {
                    if (Game.state.examNpcTraded) {
                        scene.dialogue.show(['Serveri: Good luck on the exam!']);
                    } else {
                        scene.dialogue.show(['Ask the Serveri if he has a pencil you could borrow?'], null, [
                            {
                                text: 'Ask', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                    scene.dialogue.show(['Serveri: Perhaps I have one, but what am I gonna get in return?'], () => {
                                        scene._openExamNpcOffer();
                                    });
                                }
                            },
                            {
                                text: 'Leave', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                            }
                        ]);
                    }
                }
            },
            {
                key: 'examPencilNpc',
                handler: (scene) => {
                    if (Game.state.gavePencilToExamServeri) {
                        scene.dialogue.show(['Serveri: Thank you so much for the pencil! Good luck on the exam!']);
                    } else {
                        const pencils = scene.backpack && scene.backpack.items
                            ? scene.backpack.items.filter(i => i.id === 'pencil' || (i.name && i.name.toLowerCase().includes('pencil')))
                            : [];

                        if (pencils.length >= 2) {
                            scene.dialogue.show(['Serveri: I forgot my pencil at home! I don\'t think I will pass... Wait, do you have a spare pencil?'], null, [
                                {
                                    text: 'Give pencil', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                        const pencilIndex = scene.backpack.items.findIndex(i => i.id === 'pencil' || (i.name && i.name.toLowerCase().includes('pencil')));
                                        if (pencilIndex !== -1) {
                                            scene.backpack.items.splice(pencilIndex, 1);
                                        }
                                        Game.state.gavePencilToExamServeri = true;
                                        scene.dialogue.show([
                                            'Serveri: Wow, really? Thank you so much, you are such a kind soul!',
                                            'Serveri: Good luck on the exam!',
                                            'Helping a fellow student lifted your spirits!'
                                        ], () => {
                                            if (typeof scene.energy !== 'undefined') {
                                                const old = scene.energy;
                                                scene.energy = Math.min(200, scene.energy + 50);
                                                if (scene.addEnergyDiff) {
                                                    scene.addEnergyDiff(scene.energy - old);
                                                }
                                            }
                                        });
                                    }
                                },
                                {
                                    text: 'Leave', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                                }
                            ]);
                        } else {
                            scene.dialogue.show([
                                'Serveri: I forgot my pencil at home! I don\'t think I will pass',
                                'I wish I had a extra pencil to give you'
                            ]);
                        }
                    }
                }
            },
            {
                key: 'drunkard',
                handler: (scene) => {
                    if (Game.state.drunkardSatisfied) {
                        scene.dialogue.show(['Drunkard: *hic*... Jallu is good... *zzzz*']);
                    } else {
                        const hasJallu = scene.backpack && scene.backpack.items && scene.backpack.items.some(i => i.id === 'jallu' || i.id === 'jallukanto');
                        const hasEmptyBottle = scene.backpack && scene.backpack.items && scene.backpack.items.some(i => i.id === 'empty_bottle');

                        const buttons = [];
                        if (hasJallu) {
                            buttons.push({
                                text: 'Give Jallu', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                    scene._handleDrunkardGiveJallu(false);
                                }
                            });
                        } else if (hasEmptyBottle) {
                            buttons.push({
                                text: 'Give Empty bottle', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                    scene._handleDrunkardGiveJallu(true);
                                }
                            });
                        }

                        buttons.push({
                            text: 'Nope', color: '#880000', hoverColor: '#cc0000', onClick: () => {
                                scene.dialogue.show(['Drunkard: But its my favorite drink, a fucking free one! *hic*']);
                            }
                        });

                        scene.dialogue.show([
                            'Drunkard: *hic*... Ihahaa I ha haa.. hepo hirnahtaa *burp*...',
                            'Drunkard: Give me a bottle of Jallu!'
                        ], null, buttons);
                    }
                }
            },
            {
                key: 'hyeena',
                handler: (scene) => {
                    if (Game.state.hyeenaSatisfied) {
                        scene.dialogue.show(['Hyeena: I really respect you Serveri mice!']);
                    } else if (scene.hasItem('cup_of_coffee') || (scene.backpack && scene.backpack.items && scene.backpack.items.some(i => i.id === 'cup_of_coffee'))) {
                        scene.dialogue.show(['Hyeena: I wish I had coffee'], null, [
                            {
                                text: 'Give Coffee', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                    if (scene.backpack && scene.backpack.items) {
                                        scene.backpack.items = scene.backpack.items.filter(i => i.id !== 'cup_of_coffee');
                                    }
                                    Game.state.hyeenaSatisfied = true;
                                    scene.backpack.items.push({
                                        id: 'jallukanto',
                                        name: 'Jallukanto',
                                        desc: 'Hyeena ry\'s legendary tree stump full of Jallu. 9999cl left',
                                        canUse: true,
                                        cl: 9999
                                    });
                                    scene.dialogue.show(['Hyeena: Oh wow thanks! For your kindness, you can borrow this Jallukanto!', 'Just bring it back later.']);
                                }
                            },
                            {
                                text: 'Leave', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                            }
                        ]);
                    } else {
                        scene.dialogue.show(['Hyeena: I wish I had coffee']);
                    }
                }
            },
            {
                key: 'examStudent1',
                face: false,
                handler: () => { }
            },
            {
                key: 'examStudent2',
                handler: (scene) => {
                    scene.dialogue.show(['Serveri: Why are we even studying this? I learned it in high school']);
                }
            },
            {
                key: 'examStudent3',
                handler: (scene) => {
                    scene.dialogue.show(['Serveri: I wonder If I draw a cute mouse on the paper will I get pity points']);
                }
            },
            {
                key: 'serverinpc2',
                handler: (scene) => {
                    const hasSinglesBasket = scene.backpack && scene.backpack.items && scene.backpack.items.some(i => i.id === 'singles_basket');

                    if (Game.state.exchangedNumbersWithServeri2) {
                        scene.dialogue.show(['Serveri: Don\'t forget to text me later!']);
                    } else if (hasSinglesBasket) {
                        scene.dialogue.show([
                            'Serveri: Hi! I noticed you have a singles basket!'
                        ], () => {
                            scene.dialogue.show([
                                'Would you like to exchange phone numbers?'
                            ], null, [
                                {
                                    text: 'Yes', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                        Game.state.exchangedNumbersWithServeri2 = true;
                                        scene.dialogue.show([
                                            'Yay! Hit me up later!',
                                            'You blush and nod',
                                            'The exciting interaction lifted your spirits!'
                                        ], () => {
                                            if (typeof scene.energy !== 'undefined') {
                                                const old = scene.energy;
                                                scene.energy = Math.min(200, scene.energy + 50);
                                                if (scene.addEnergyDiff) {
                                                    scene.addEnergyDiff(scene.energy - old);
                                                }
                                            }
                                        });
                                    }
                                },
                                {
                                    text: 'No', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                                }
                            ]);
                        });
                    } else {
                        scene.dialogue.show(['Serveri: Hi, do we know each other?']);
                    }
                }
            },
            {
                key: 'examServeriZyn',
                handler: (scene) => {
                    scene.dialogue.show(['Serveri: Yo! Last night was crazy! Zyn zyn zyn is still ringing in my ears']);
                }
            },
            {
                key: 'examSnackNpc',
                handler: (scene) => {
                    scene.dialogue.show([
                        'Serveri: I need a snack so I can make it through the exam',
                        'Serveri: Vending machines are so expensive though..'
                    ]);
                }
            },
            {
                key: 'examPrismaServeri',
                handler: (scene) => {
                    if (Game.state.exchangedNumbersWithServeri2) {
                        scene.dialogue.show([
                            'Serveri: Hey a familiar face! I was hoping I\'d run into you here~',
                            'Serveri: Ace this exam, okay? Meet you outside the hall!'
                        ]);
                    } else {
                        scene.dialogue.show([
                            'Serveri: Oh hi! Are you here for the exam too?',
                            'Serveri: Wish me luck... I think I\'m gonna need it!'
                        ]);
                    }
                }
            },
            {
                key: 'hacker',
                handler: (scene) => {
                    if (Game.state.isOverclocked) {
                        scene.dialogue.show([
                            'Hacker: Your CPU is already running at max clock speed!',
                            'Hacker: Any higher and your mouse brain will melt. Maintain OPSEC!'
                        ]);
                    } else {
                        const radBullIndex = scene.backpack && scene.backpack.items
                            ? scene.backpack.items.findIndex(i => i.id === 'energy_drink' || (i.name && i.name.toLowerCase().includes('rad bull')))
                            : -1;

                        if (radBullIndex !== -1) {
                            scene.dialogue.show([
                                'Hacker: Huh? Are you talking to me? OPSEC!',
                                'Hacker: Wait... is that a Rad bull?',
                                'Hacker: Give me that and I will overclock your CPU kernel!'
                            ], null, [
                                {
                                    text: 'Give Rad bull', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                        if (scene.backpack && scene.backpack.items) {
                                            scene.backpack.items.splice(radBullIndex, 1);
                                        }
                                        Game.state.isOverclocked = true;
                                        scene.dialogue.show([
                                            'Hacker: *gulp gulp gulp* Ahhh, caffeine!',
                                            'Hacker: *clackity clack clack*',
                                            'Compiling custom kernel module...',
                                            'Overclock successful! +40 Energy and movement speed increased by 10%!'
                                        ], () => {
                                            if (typeof scene.energy !== 'undefined') {
                                                const old = scene.energy;
                                                scene.energy = Math.min(200, scene.energy + 40);
                                                if (scene.addEnergyDiff) {
                                                    scene.addEnergyDiff(scene.energy - old);
                                                }
                                            }
                                        });
                                    }
                                },
                                {
                                    text: 'No', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                                }
                            ]);
                        } else {
                            scene.dialogue.show([
                                'Hacker: Huh? Are you talking to me? OPSEC!',
                                'Hacker: Bring me a Rad bull and I\'ll overclock your CPU kernel!'
                            ]);
                        }
                    }
                }
            },
            {
                key: 'oldServeriSavilahti',
                handler: (scene) => {
                    if (Game.state.thrownOutByOldServeri) {
                        scene.dialogue.show(["Old Serveri: Don't you have an exam coming up?"]);
                    } else {
                        scene.dialogue.show(["Old Serveri: Look who's up so early"], null, [
                            {
                                text: 'Ask for a light', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                                    Game.state.oldServeriLightAskCount = (Game.state.oldServeriLightAskCount || 0) + 1;
                                    if (Game.state.oldServeriLightAskCount >= 3) {
                                        scene.dialogue.show([
                                            "Old Serveri: You could try again",
                                            "That seems to be a savonian way to refuse.."
                                        ]);
                                    } else {
                                        scene.dialogue.show(["Old Serveri: You could try again"]);
                                    }
                                }
                            },
                            {
                                text: 'Leave', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                            }
                        ]);
                    }
                }
            },
            {
                key: 'oldServeriExam',
                handler: (scene) => {
                    if (Game.state.examPassed || Game.state.examScore !== undefined) {
                        scene.dialogue.show(["Old Serveri: I always believed in you, you will go far kid"]);
                    } else {
                        scene.dialogue.show(["Old Serveri: You got this, I believe in you"]);
                    }
                }
            }
        ];
    }

    handleInteraction(targetX, targetY) {
        const scene = this.scene;
        Game.state = Game.state || {};

        for (const item of this.interactions) {
            const npc = scene[item.key];
            if (npc && targetX === npc.tileX && targetY === npc.tileY) {
                if (item.face !== false) {
                    this._faceNpc(npc);
                }
                item.handler(scene, npc);
                return true;
            }
        }

        return false;
    }

    isNpcAt(x, y) {
        const scene = this.scene;
        const keys = [
            'assistant', 'sleepingServeri', 'examNpc', 'examAssistant',
            'examPencilNpc', 'examStudent1', 'examStudent2', 'examStudent3',
            'shopkeep', 'drunkard', 'hyeena', 'police', 'examServeriZyn',
            'examSnackNpc', 'examPrismaServeri', 'hacker', 'oldServeriSavilahti',
            'oldServeriExam', 'houseCat', 'bottleGrandma'
        ];
        for (const key of keys) {
            const npc = scene[key];
            if (npc && npc.tileX === x && npc.tileY === y) return true;
        }
        if (scene.prismaShopkeeps) {
            if (scene.prismaShopkeeps.some(sk => sk.tileX === x && sk.tileY === y)) return true;
        }
        return false;
    }

    _faceNpc(npc) {
        if (!npc || !npc.sprite) return;
        npc.isDancing = false;
        const scene = this.scene;
        if (scene.facing === 'up') npc.facing = 'down';
        else if (scene.facing === 'down') npc.facing = 'up';
        else if (scene.facing === 'left') npc.facing = 'right';
        else if (scene.facing === 'right') npc.facing = 'left';

        if (npc === scene.hyeena || (npc.sprite.texture && npc.sprite.texture.frameTotal <= 5)) {
            switch (npc.facing) {
                case 'down': npc.sprite.setFrame(0); break;
                case 'up': npc.sprite.setFrame(1); break;
                case 'left': npc.sprite.setFrame(2); break;
                case 'right': npc.sprite.setFrame(3); break;
            }
        } else {
            switch (npc.facing) {
                case 'down': npc.sprite.setFrame(0); break;
                case 'up': npc.sprite.setFrame(4); break;
                case 'left': npc.sprite.setFrame(8); break;
                case 'right': npc.sprite.setFrame(12); break;
            }
        }
    }
};
