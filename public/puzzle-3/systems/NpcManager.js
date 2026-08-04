// NpcManager: Handles spawning, animating, and interacting with all NPCs across game areas
window.Game = window.Game || {};

Game.NpcManager = class NpcManager {
    constructor(scene) {
        this.scene = scene;
    }

    spawnNpcsForArea(areaName) {
        this.destroyAll();

        const scene = this.scene;

        // 1. Police in serveriquest
        if (areaName === 'serveriquest' && (!Game.state || !Game.state.hasSlept)) {
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
            // Serveri NPC (pencil trade) at (12, 33)
            scene.examNpc = {
                tileX: 12,
                tileY: 33,
                facing: 'down',
                sprite: scene.add.sprite(12 * Game.TILE_SIZE, 33 * Game.TILE_SIZE, 'serverinpc', 0).setOrigin(0, 0).setDepth(10)
            };

            // Exam Assistant at (13, 5)
            scene.examAssistant = {
                tileX: 13,
                tileY: 5,
                facing: 'down',
                sprite: scene.add.sprite(13 * Game.TILE_SIZE, 5 * Game.TILE_SIZE - 4, 'opetusavustaja', 0).setOrigin(0, 0).setDepth(10)
            };

            // Exam Serveri Mouse NPC (with no pencil) at (16, 32)
            scene.examPencilNpc = {
                tileX: 16,
                tileY: 32,
                facing: 'left',
                sprite: scene.add.sprite(16 * Game.TILE_SIZE, 32 * Game.TILE_SIZE - 2, 'serverinpc2', 0).setOrigin(0, 0).setDepth(10)
            };

            // Exam Student 1 at (9, 7) - facing right (frame 12), player texture, no dialogue
            scene.examStudent1 = {
                tileX: 9,
                tileY: 7,
                facing: 'right',
                sprite: scene.add.sprite(9 * Game.TILE_SIZE, 7 * Game.TILE_SIZE - 2, 'player', 12).setOrigin(0, 0).setDepth(10)
            };

            // Exam Student 2 at (6, 3) - serverinpc texture
            scene.examStudent2 = {
                tileX: 6,
                tileY: 3,
                facing: 'down',
                sprite: scene.add.sprite(6 * Game.TILE_SIZE, 3 * Game.TILE_SIZE, 'serverinpc', 0).setOrigin(0, 0).setDepth(10)
            };

            // Exam Student 3 at (2, 4) - facing right (frame 12), player texture
            scene.examStudent3 = {
                tileX: 2,
                tileY: 4,
                facing: 'right',
                sprite: scene.add.sprite(2 * Game.TILE_SIZE, 4 * Game.TILE_SIZE - 2, 'player', 12).setOrigin(0, 0).setDepth(10)
            };

            // Exam Serveri Zyn at (17, 34) - player texture
            scene.examServeriZyn = {
                tileX: 17,
                tileY: 34,
                facing: 'right',
                sprite: scene.add.sprite(17 * Game.TILE_SIZE, 34 * Game.TILE_SIZE - 2, 'player', 0).setOrigin(0, 0).setDepth(10)
            };

            // Exam Snack NPC at (19, 40) - facing left (frame 8), serverinpc texture
            scene.examSnackNpc = {
                tileX: 19,
                tileY: 40,
                facing: 'left',
                sprite: scene.add.sprite(19 * Game.TILE_SIZE, 40 * Game.TILE_SIZE - 2, 'serverinpc', 8).setOrigin(0, 0).setDepth(10)
            };

            // Exam Serveri (from Prisma) at (8, 6) - facing right (frame 12), serverinpc2 texture
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

        // 6. Drunkard & Hacker in savilahti
        if (areaName === 'savilahti') {
            scene.drunkard = {
                tileX: 51,
                tileY: 59,
                facing: 'down',
                sprite: scene.add.sprite(51 * Game.TILE_SIZE, 59 * Game.TILE_SIZE - 4, 'juoppo', 0).setOrigin(0, 0).setDepth(10)
            };
            scene.hacker = {
                tileX: 12,
                tileY: 37,
                facing: 'down',
                sprite: scene.add.sprite(12 * Game.TILE_SIZE, 37 * Game.TILE_SIZE - 4, 'hacker', 0).setOrigin(0, 0).setDepth(10)
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
            this.scheduleHyeenaTurn();
        }
    }

    scheduleHyeenaTurn() {
        const scene = this.scene;
        if (!scene.hyeena || !scene.hyeena.sprite || !scene.hyeena.sprite.active) return;

        if (scene.hyeenaTurnTimer) {
            scene.hyeenaTurnTimer.remove();
            scene.hyeenaTurnTimer = null;
        }

        const delay = Phaser.Math.Between(4000, 14000);
        scene.hyeenaTurnTimer = scene.time.delayedCall(delay, () => {
            if (!scene.hyeena || !scene.hyeena.sprite || !scene.hyeena.sprite.active) return;

            if (!scene.hyeena.isDancing) {
                const rand = Math.random();
                let newFacing = 'down';
                if (rand < 0.20) {
                    newFacing = 'left';
                } else if (rand < 0.40) {
                    newFacing = 'right';
                } else {
                    newFacing = 'down';
                }

                scene.hyeena.facing = newFacing;
                switch (newFacing) {
                    case 'down': scene.hyeena.sprite.setFrame(0); break;
                    case 'left': scene.hyeena.sprite.setFrame(8); break;
                    case 'right': scene.hyeena.sprite.setFrame(12); break;
                }
            }

            this.scheduleHyeenaTurn();
        });
    }

    destroyAll() {
        const scene = this.scene;
        if (scene.hyeenaTurnTimer) {
            scene.hyeenaTurnTimer.remove();
            scene.hyeenaTurnTimer = null;
        }
        ['police', 'assistant', 'sleepingServeri', 'examNpc', 'examAssistant', 'examPencilNpc', 'examStudent1', 'examStudent2', 'examStudent3', 'examSnackNpc', 'examPrismaServeri', 'shopkeep', 'drunkard', 'hyeena', 'serverinpc2', 'examServeriZyn', 'hacker'].forEach(key => {
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

    handleInteraction(targetX, targetY) {
        const scene = this.scene;

        // 1. Sleeping / Woken Serveri in Laitos
        if (scene.sleepingServeri && targetX === scene.sleepingServeri.tileX && targetY === scene.sleepingServeri.tileY) {
            Game.state = Game.state || {};
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
            return true;
        }

        // 2. Exam Assistant
        if (scene.examAssistant && targetX === scene.examAssistant.tileX && targetY === scene.examAssistant.tileY) {
            this._faceNpc(scene.examAssistant);
            Game.state = Game.state || {};
            if (Game.state.examScore !== undefined) {
                scene.dialogue.show(['IT-Guy: I hope you did well!']);
            } else {
                scene.dialogue.show(['IT-Guy: Please take a seat.']);
            }
            return true;
        }

        // 3. Exam Pencil Trade NPC (12, 33)
        if (scene.examNpc && targetX === scene.examNpc.tileX && targetY === scene.examNpc.tileY) {
            this._faceNpc(scene.examNpc);
            Game.state = Game.state || {};
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
            return true;
        }

        // 4. Serveri Mouse NPC in Exam (16, 32)
        if (scene.examPencilNpc && targetX === scene.examPencilNpc.tileX && targetY === scene.examPencilNpc.tileY) {
            this._faceNpc(scene.examPencilNpc);
            Game.state = Game.state || {};

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
                            text: 'Keep pencil', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                        }
                    ]);
                } else {
                    scene.dialogue.show([
                        'Serveri: I forgot my pencil at home! I don\'t think I will pass',
                        'I wish I had a extra pencil to give you'
                    ]);
                }
            }
            return true;
        }

        // 5. Drunkard NPC in savilahti
        if (scene.drunkard && targetX === scene.drunkard.tileX && targetY === scene.drunkard.tileY) {
            this._faceNpc(scene.drunkard);
            Game.state = Game.state || {};
            if (Game.state.drunkardSatisfied) {
                scene.dialogue.show(['Drunkard: *hic*... Jallu is good... *zzzz*']);
            } else {
                scene.dialogue.show([
                    'Drunkard: *hic*... Ihahaa I ha haa.. hepo hirnahtaa *burp*...',
                    'Drunkard: Give me a bottle of Jallu!'
                ], null, [
                    {
                        text: 'Sure', color: '#006600', hoverColor: '#00cc00', onClick: () => {
                            scene._handleDrunkardGiveJallu();
                        }
                    },
                    {
                        text: 'Nope', color: '#880000', hoverColor: '#cc0000', onClick: () => {
                            scene.dialogue.show(['Drunkard: But its my favorite drink, a fucking free one! *hic*']);
                        }
                    }
                ]);
            }
            return true;
        }

        // 6. Hyeena NPC in snellmania (37, 54)
        if (scene.hyeena && targetX === scene.hyeena.tileX && targetY === scene.hyeena.tileY) {
            this._faceNpc(scene.hyeena);
            Game.state = Game.state || {};
            if (Game.state.hyeenaSatisfied) {
                scene.dialogue.show(['Hyeena: Enjoy the Jallukanto!']);
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
                            scene.dialogue.show(['Hyeena: Oh wow thanks! For your kindness, you can borrow this Jallukanto!']);
                        }
                    },
                    {
                        text: 'Leave', color: '#880000', hoverColor: '#cc0000', onClick: () => { }
                    }
                ]);
            } else {
                scene.dialogue.show(['Hyeena: I wish I had coffee']);
            }
            return true;
        }

        // 7. Exam Student 1 (9, 7) - silent/no dialogue
        if (scene.examStudent1 && targetX === scene.examStudent1.tileX && targetY === scene.examStudent1.tileY) {
            return true;
        }

        // 8. Exam Student 2 (6, 3) - serverinpc
        if (scene.examStudent2 && targetX === scene.examStudent2.tileX && targetY === scene.examStudent2.tileY) {
            this._faceNpc(scene.examStudent2);
            scene.dialogue.show(['Serveri: Why are we even studying this? I learned it in high school']);
            return true;
        }

        // 9. Exam Student 3 (2, 4) - player texture facing right
        if (scene.examStudent3 && targetX === scene.examStudent3.tileX && targetY === scene.examStudent3.tileY) {
            this._faceNpc(scene.examStudent3);
            scene.dialogue.show(['Serveri: I wonder If I draw a cute mouse on the paper will I get pity points']);
            return true;
        }

        // 10. ServeriNPC 2 in Prisma at (5, 3)
        if (scene.serverinpc2 && targetX === scene.serverinpc2.tileX && targetY === scene.serverinpc2.tileY) {
            this._faceNpc(scene.serverinpc2);
            Game.state = Game.state || {};
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
                scene.dialogue.show(['Hi, do we know each other?']);
            }
            return true;
        }

        // 11. Exam Serveri Zyn at (17, 34)
        if (scene.examServeriZyn && targetX === scene.examServeriZyn.tileX && targetY === scene.examServeriZyn.tileY) {
            this._faceNpc(scene.examServeriZyn);
            scene.dialogue.show(['Yo! Last night was crazy! Zyn zyn zyn is still ringing in my ears']);
            return true;
        }

        // 12. Exam Snack NPC at (19, 40)
        if (scene.examSnackNpc && targetX === scene.examSnackNpc.tileX && targetY === scene.examSnackNpc.tileY) {
            this._faceNpc(scene.examSnackNpc);
            scene.dialogue.show([
                'Serveri: I need a snack so I can make it through the exam',
                'Serveri: Vending machines are so expensive though..'
            ]);
            return true;
        }

        // 13. Exam Serveri (from Prisma) at (8, 6)
        if (scene.examPrismaServeri && targetX === scene.examPrismaServeri.tileX && targetY === scene.examPrismaServeri.tileY) {
            this._faceNpc(scene.examPrismaServeri);
            Game.state = Game.state || {};
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
            return true;
        }

        // 12. Hacker in savilahti at (12, 37)
        if (scene.hacker && targetX === scene.hacker.tileX && targetY === scene.hacker.tileY) {
            this._faceNpc(scene.hacker);
            Game.state = Game.state || {};

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
                        'Huh? Are you talking to me? OPSEC!',
                        'Wait... is that a Rad bull? Give me that and I will overclock your CPU kernel!'
                    ], null, [
                        {
                            text: 'Yes', color: '#006600', hoverColor: '#00cc00', onClick: () => {
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
                        'Huh? Are you talking to me? OPSEC!',
                        'You look sluggish... Bring me a Rad bull and I\'ll overclock your CPU kernel!'
                    ]);
                }
            }
            return true;
        }

        return false;
    }

    isNpcAt(x, y) {
        const scene = this.scene;
        const npcs = [
            scene.assistant,
            scene.sleepingServeri,
            scene.examNpc,
            scene.examAssistant,
            scene.examPencilNpc,
            scene.examStudent1,
            scene.examStudent2,
            scene.examStudent3,
            scene.shopkeep,
            ...(scene.prismaShopkeeps || []),
            scene.drunkard,
            scene.hyeena,
            scene.police,
            scene.examServeriZyn,
            scene.examSnackNpc,
            scene.examPrismaServeri,
            scene.hacker
        ];
        return npcs.some(npc => npc && npc.tileX === x && npc.tileY === y);
    }

    _faceNpc(npc) {
        if (!npc || !npc.sprite) return;
        npc.isDancing = false;
        const scene = this.scene;
        if (scene.facing === 'up') npc.facing = 'down';
        else if (scene.facing === 'down') npc.facing = 'up';
        else if (scene.facing === 'left') npc.facing = 'right';
        else if (scene.facing === 'right') npc.facing = 'left';

        switch (npc.facing) {
            case 'down': npc.sprite.setFrame(0); break;
            case 'up': npc.sprite.setFrame(4); break;
            case 'left': npc.sprite.setFrame(8); break;
            case 'right': npc.sprite.setFrame(12); break;
        }
    }
};
