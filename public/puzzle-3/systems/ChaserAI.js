// ChaserAI: Shared pursuit AI for Police and Old Serveri Guard
// Handles alert detection, BFS pathfinding, movement tweening, and catch callbacks
window.Game = window.Game || {};

Game.ChaserAI = class ChaserAI {
    /**
     * @param {Phaser.Scene} scene - The active game scene
     * @param {object} npc - The NPC object with tileX, tileY, facing, isMoving, hasSeenPlayer, isStunned, sprite
     * @param {object} config - Configuration for this chaser
     * @param {number} config.alertRange - Manhattan distance at which the chaser starts pursuing
     * @param {string} config.animPrefix - Animation key prefix (e.g. 'poliisi-walk' or 'oldman-walk')
     * @param {number} config.yOffset - Pixel Y offset for sprite positioning (e.g. -2 for police, -4 for oldman)
     * @param {number} [config.bfsDepth=25] - Max BFS search depth
     * @param {number} [config.speedPenalty=15] - Extra ms added to tween duration (makes chaser slower than player)
     * @param {Function} config.onCatch - Called when chaser catches the player: onCatch(chaser, scene)
     * @param {Function} [config.shouldRemove] - Optional check to remove chaser (e.g. police after sleeping)
     */
    constructor(scene, npc, config) {
        this.scene = scene;
        this.npc = npc;
        this.config = Object.assign({
            bfsDepth: 25,
            speedPenalty: 15
        }, config);
    }

    update(time, delta) {
        const npc = this.npc;
        const scene = this.scene;

        if (!npc || !npc.sprite || !npc.sprite.active) return;

        // Optional removal check (e.g. police disappears after player sleeps)
        if (this.config.shouldRemove && this.config.shouldRemove(npc, scene)) {
            if (npc.sprite) npc.sprite.destroy();
            this.npc = null;
            return;
        }

        if (npc.isMoving || scene.isTransitioning) return;

        const dist = Math.abs(npc.tileX - scene.tileX) + Math.abs(npc.tileY - scene.tileY);

        // Pause chase during dialogue (unless adjacent)
        if (scene.dialogue && scene.dialogue.active && dist > 1) {
            this._stopAnim();
            return;
        }

        // Caught the player
        if (dist <= 1) {
            if (npc.isStunned) return;
            this._stopAnim();
            this._facePlayer();
            this._setIdleFrame();

            // Stop player movement
            if (scene.player && scene.player.anims && scene.player.anims.isPlaying) {
                scene.player.anims.stop();
                scene.setIdleFrame();
            }

            // Close backpack if open
            if (scene.backpack && scene.backpack.isOpen) {
                scene.backpack.close();
            }

            scene.isTransitioning = true;
            this.config.onCatch(this, scene);
            return;
        }

        // In alert range — chase!
        if (dist > 1 && dist <= this.config.alertRange) {
            // First sight: show "!" alert
            if (!npc.hasSeenPlayer) {
                npc.hasSeenPlayer = true;
                npc.isStunned = true;
                this._stopAnim();
                this._setIdleFrame();
                this._showAlert();
                return;
            }

            if (npc.isStunned) return;

            // BFS pathfinding step
            const step = this._findNextStepBFS();

            if (step && this._canMove(npc.tileX + step.moveX, npc.tileY + step.moveY)) {
                npc.facing = step.dir;
                npc.isMoving = true;
                npc.sprite.play(`${this.config.animPrefix}-${npc.facing}`, true);

                const targetX = npc.tileX + step.moveX;
                const targetY = npc.tileY + step.moveY;
                const targetPxX = targetX * Game.TILE_SIZE;
                const targetPxY = targetY * Game.TILE_SIZE + this.config.yOffset;

                scene.tweens.add({
                    targets: npc.sprite,
                    x: targetPxX,
                    y: targetPxY,
                    duration: Game.TWEEN_DURATION + this.config.speedPenalty,
                    ease: 'Linear',
                    onComplete: () => {
                        if (this.npc) {
                            this.npc.tileX = targetX;
                            this.npc.tileY = targetY;
                            this.npc.isMoving = false;
                        }
                    }
                });
            } else {
                // Blocked entirely
                this._stopAnim();
                this._setIdleFrame();
            }
        } else {
            // Out of range — reset
            npc.hasSeenPlayer = false;
            this._stopAnim();
            this._setIdleFrame();
        }
    }

    // --- Private helpers ---

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

    _showAlert() {
        const npc = this.npc;
        const scene = this.scene;

        const alertText = scene.add.text(npc.sprite.x + 8, npc.sprite.y - 8, '!', {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '8px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5).setDepth(20).setResolution(2);

        scene.tweens.add({
            targets: alertText,
            y: alertText.y - 4,
            duration: 300,
            yoyo: true,
            onComplete: () => {
                alertText.destroy();
                if (this.npc) this.npc.isStunned = false;
            }
        });
    }

    _canMove(targetX, targetY) {
        const scene = this.scene;
        if (!scene.currentArea) return false;
        if (targetX < 0 || targetX >= scene.currentArea.width || targetY < 0 || targetY >= scene.currentArea.height) {
            return false;
        }
        // Don't walk onto the player tile
        if (targetX === scene.tileX && targetY === scene.tileY) {
            return false;
        }
        const targetTileIndex = scene.tileData[targetY][targetX];
        return Game.WALKABLE_TILES.has(targetTileIndex);
    }

    _findNextStepBFS() {
        const npc = this.npc;
        const scene = this.scene;
        const startX = npc.tileX;
        const startY = npc.tileY;
        const goalX = scene.tileX;
        const goalY = scene.tileY;
        const maxDepth = this.config.bfsDepth;

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

                // Allow stepping onto player tile as a goal check
                if (nx === goalX && ny === goalY) {
                    const fmx = (current.dist === 0) ? d.x : current.firstMoveX;
                    const fmy = (current.dist === 0) ? d.y : current.firstMoveY;
                    const fd = (current.dist === 0) ? d.dir : current.firstDir;
                    return { moveX: fmx, moveY: fmy, dir: fd };
                }

                if (!this._canMove(nx, ny)) continue;

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
