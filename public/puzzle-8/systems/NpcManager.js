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

            // Serveri Mouse NPC (serverihiiri) at (16, 32)
            scene.examPencilNpc = {
                tileX: 16,
                tileY: 32,
                facing: 'down',
                sprite: scene.add.sprite(16 * Game.TILE_SIZE, 32 * Game.TILE_SIZE - 2, 'player', 0).setOrigin(0, 0).setDepth(10)
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

        // 5. Prisma Shopkeeps
        if (areaName === 'Prisma') {
            scene.prismaShopkeeps = [
                { tileX: 22, tileY: 10, facing: 'left', sprite: scene.add.sprite(22 * Game.TILE_SIZE, 10 * Game.TILE_SIZE - 4, 'shopkeep', 8).setOrigin(0, 0).setDepth(10) },
                { tileX: 27, tileY: 10, facing: 'left', sprite: scene.add.sprite(27 * Game.TILE_SIZE, 10 * Game.TILE_SIZE - 4, 'shopkeep', 8).setOrigin(0, 0).setDepth(10) },
                { tileX: 8, tileY: 18, facing: 'right', sprite: scene.add.sprite(8 * Game.TILE_SIZE, 18 * Game.TILE_SIZE - 4, 'shopkeep', 12).setOrigin(0, 0).setDepth(10) }
            ];
            scene.facing = 'up';
            scene.setIdleFrame();
        }

        // 6. Drunkard in savilahti
        if (areaName === 'savilahti') {
            scene.drunkard = {
                tileX: 51,
                tileY: 59,
                facing: 'down',
                sprite: scene.add.sprite(51 * Game.TILE_SIZE, 59 * Game.TILE_SIZE - 4, 'juoppo', 0).setOrigin(0, 0).setDepth(10)
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
        }
    }

    destroyAll() {
        const scene = this.scene;
        ['police', 'assistant', 'sleepingServeri', 'examNpc', 'examAssistant', 'examPencilNpc', 'examStudent1', 'examStudent2', 'examStudent3', 'shopkeep', 'drunkard', 'hyeena'].forEach(key => {
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
            scene.dialogue.show(['Serveri: I forgot my pencil at home! I don\'t think I will pass']);
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
            scene.police
        ];
        return npcs.some(npc => npc && npc.tileX === x && npc.tileY === y);
    }

    _faceNpc(npc) {
        if (!npc || !npc.sprite) return;
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
