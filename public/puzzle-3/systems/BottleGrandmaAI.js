// BottleGrandmaAI: Pursuit and bottle collection AI for Bottle Grandma (pullomummo)
// Handles 5-tile alert pursuit (no exclamation mark), empty bottle requests,
// return pathfinding to (44, 36) or (22, 37), and destination cooldown.
window.Game = window.Game || {};

Game.BottleGrandmaAI = class BottleGrandmaAI {
    constructor(scene, npc) {
        this.scene = scene;
        this.npc = npc;
        this.alertRange = 5;
        this.yOffset = -4;
        this.animPrefix = 'pullomummo';
        this.speedPenalty = 20;

        this.isReturning = false;
        this.targetDest = null;
        this.cooldownEndTime = 0;
        this.destA = { x: 44, y: 36 };
        this.destB = { x: 22, y: 37 };

        this._createAnims();
    }

    _createAnims() {
        const scene = this.scene;
        if (!scene.anims) return;
        ['down', 'up', 'left', 'right'].forEach((dir, i) => {
            const animKey = `pullomummo-${dir}`;
            if (!scene.anims.exists(animKey)) {
                scene.anims.create({
                    key: animKey,
                    frames: scene.anims.generateFrameNumbers('pullomummo', { start: i * 4, end: i * 4 + 3 }),
                    frameRate: 6,
                    repeat: -1
                });
            }
        });
    }

    update(time, delta) {
        const npc = this.npc;
        const scene = this.scene;

        if (!npc || !npc.sprite || !npc.sprite.active) return;
        if (npc.isMoving || scene.isTransitioning) return;

        // 1. Check Cooldown at Destination
        if (time < this.cooldownEndTime) {
            this._stopAnim();
            this._setIdleFrame();
            return;
        }

        // 2. If Returning to Destination
        if (this.isReturning && this.targetDest) {
            if (npc.tileX === this.targetDest.x && npc.tileY === this.targetDest.y) {
                this.isReturning = false;
                this.cooldownEndTime = time + 12000; // 12s cooldown at destination
                this._stopAnim();
                this._setIdleFrame();
                return;
            }

            const step = this._findNextStepBFS(this.targetDest.x, this.targetDest.y);
            if (step && this._canMove(npc.tileX + step.moveX, npc.tileY + step.moveY, false)) {
                this._moveStep(step);
            } else {
                this.isReturning = false;
                this.cooldownEndTime = time + 12000;
                this._stopAnim();
                this._setIdleFrame();
            }
            return;
        }

        // 3. Normal Pursuit State
        const distToPlayer = Math.abs(npc.tileX - scene.tileX) + Math.abs(npc.tileY - scene.tileY);

        if (scene.dialogue && scene.dialogue.active && distToPlayer > 1) {
            this._stopAnim();
            return;
        }

        // Caught the player
        if (distToPlayer <= 1) {
            this._stopAnim();
            this._facePlayer();
            this._setIdleFrame();

            if (scene.player && scene.player.anims && scene.player.anims.isPlaying) {
                scene.player.anims.stop();
                scene.setIdleFrame();
            }
            if (scene.backpack && scene.backpack.isOpen) {
                scene.backpack.close();
            }

            this._handleCatch();
            return;
        }

        // Within 5 tile alert range — chase player without '!' alert
        if (distToPlayer > 1 && distToPlayer <= this.alertRange) {
            const step = this._findNextStepBFS(scene.tileX, scene.tileY);
            if (step && this._canMove(npc.tileX + step.moveX, npc.tileY + step.moveY, true)) {
                this._moveStep(step);
            } else {
                this._stopAnim();
                this._setIdleFrame();
            }
        } else {
            this._stopAnim();
            this._setIdleFrame();
        }
    }

    _handleCatch() {
        const scene = this.scene;
        scene.isTransitioning = true;

        const bottleItem = scene.backpack ? scene.backpack.items.find(i => i.id === 'empty_bottle') : null;
        const count = bottleItem ? (bottleItem.count || 1) : 0;

        const startReturn = () => {
            scene.isTransitioning = false;
            const distA = Math.abs(this.npc.tileX - this.destA.x) + Math.abs(this.npc.tileY - this.destA.y);
            const distB = Math.abs(this.npc.tileX - this.destB.x) + Math.abs(this.npc.tileY - this.destB.y);
            this.targetDest = distA <= distB ? this.destA : this.destB;
            this.isReturning = true;
        };

        if (count > 0) {
            scene.dialogue.show(['Granny: Hello dear! Do you happen to have any empty bottles for me?'], null, [
                {
                    text: 'Give bottles',
                    color: '#006600', hoverColor: '#00cc00',
                    onClick: () => {
                        scene.backpack.items = scene.backpack.items.filter(i => i !== bottleItem);
                        scene.dialogue.show(['Granny: Thank you so much, bless your heart! *clink clink*'], startReturn);
                    }
                },
                {
                    text: 'Refuse',
                    color: '#880000', hoverColor: '#cc0000',
                    onClick: () => {
                        scene.dialogue.show(['Granny: Ah, okay dear... I\'ll keep looking elsewhere.'], startReturn);
                    }
                }
            ]);
        } else {
            scene.dialogue.show([
                'Granny: Hello dear! Do you happen to have any empty bottles for me?',
                'Granny: Oh, you don\'t have any empty bottles. Never mind, dear!'
            ], startReturn);
        }
    }

    _moveStep(step) {
        const npc = this.npc;
        const scene = this.scene;
        npc.facing = step.dir;
        npc.isMoving = true;
        npc.sprite.play(`pullomummo-${npc.facing}`, true);

        const targetX = npc.tileX + step.moveX;
        const targetY = npc.tileY + step.moveY;
        const targetPxX = targetX * Game.TILE_SIZE;
        const targetPxY = targetY * Game.TILE_SIZE + this.yOffset;

        scene.tweens.add({
            targets: npc.sprite,
            x: targetPxX,
            y: targetPxY,
            duration: Game.TWEEN_DURATION + this.speedPenalty,
            ease: 'Linear',
            onComplete: () => {
                if (this.npc) {
                    this.npc.tileX = targetX;
                    this.npc.tileY = targetY;
                    this.npc.isMoving = false;
                }
            }
        });
    }

    _stopAnim() {
        const npc = this.npc;
        if (npc && npc.sprite && npc.sprite.anims && npc.sprite.anims.isPlaying) {
            npc.sprite.anims.stop();
        }
    }

    _setIdleFrame() {
        const npc = this.npc;
        if (!npc || !npc.sprite) return;
        switch (npc.facing) {
            case 'down': npc.sprite.setFrame(0); break;
            case 'up': npc.sprite.setFrame(4); break;
            case 'left': npc.sprite.setFrame(8); break;
            case 'right': npc.sprite.setFrame(12); break;
        }
    }

    _facePlayer() {
        const npc = this.npc;
        const scene = this.scene;
        if (npc.tileX > scene.tileX) npc.facing = 'left';
        else if (npc.tileX < scene.tileX) npc.facing = 'right';
        else if (npc.tileY > scene.tileY) npc.facing = 'up';
        else if (npc.tileY < scene.tileY) npc.facing = 'down';
    }

    _canMove(targetX, targetY, isChasingPlayer) {
        const scene = this.scene;
        if (!scene.currentArea) return false;
        if (targetX < 0 || targetX >= scene.currentArea.width || targetY < 0 || targetY >= scene.currentArea.height) {
            return false;
        }
        if (isChasingPlayer && targetX === scene.tileX && targetY === scene.tileY) {
            return false;
        }
        const targetTileIndex = scene.tileData[targetY][targetX];
        return Game.WALKABLE_TILES.has(targetTileIndex);
    }

    _findNextStepBFS(goalX, goalY) {
        const npc = this.npc;
        const startX = npc.tileX;
        const startY = npc.tileY;
        const maxDepth = 30;

        if (startX === goalX && startY === goalY) return null;

        const queue = [{ x: startX, y: startY, firstMoveX: 0, firstMoveY: 0, firstDir: null, dist: 0 }];
        const visited = new Set();
        visited.add(`${startX},${startY}`);

        const dirs = [
            { x: 0, y: -1, dir: 'up' },
            { x: 0, y: 1, dir: 'down' },
            { x: -1, y: 0, dir: 'left' },
            { x: 1, y: 0, dir: 'right' }
        ];

        let bestNode = null;
        let minTargetDist = Math.abs(startX - goalX) + Math.abs(startY - goalY);

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === goalX && current.y === goalY) {
                return { moveX: current.firstMoveX, moveY: current.firstMoveY, dir: current.firstDir };
            }

            if (current.dist >= maxDepth) continue;

            for (const d of dirs) {
                const nx = current.x + d.x;
                const ny = current.y + d.y;
                const key = `${nx},${ny}`;

                if (visited.has(key)) continue;

                if (nx === goalX && ny === goalY) {
                    const fmx = (current.dist === 0) ? d.x : current.firstMoveX;
                    const fmy = (current.dist === 0) ? d.y : current.firstMoveY;
                    const fd = (current.dist === 0) ? d.dir : current.firstDir;
                    return { moveX: fmx, moveY: fmy, dir: fd };
                }

                if (!this._canMove(nx, ny, true)) continue;

                visited.add(key);

                const fmx = (current.dist === 0) ? d.x : current.firstMoveX;
                const fmy = (current.dist === 0) ? d.y : current.firstMoveY;
                const fd = (current.dist === 0) ? d.dir : current.firstDir;

                const hDist = Math.abs(nx - goalX) + Math.abs(ny - goalY);
                if (hDist < minTargetDist) {
                    minTargetDist = hDist;
                    bestNode = { moveX: fmx, moveY: fmy, dir: fd };
                }

                queue.push({
                    x: nx, y: ny,
                    firstMoveX: fmx, firstMoveY: fmy, firstDir: fd,
                    dist: current.dist + 1
                });
            }
        }

        return bestNode;
    }

    destroy() {
        if (this.npc && this.npc.sprite) {
            this.npc.sprite.destroy();
        }
        this.npc = null;
    }
};
