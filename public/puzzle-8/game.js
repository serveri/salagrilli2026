// Pokémon-style Retro Engine with Grid Movement and Area Transitions
const TILE_SIZE = 16;
const SCALE = 3; // Camera Zoom factor
const TWEEN_DURATION = 160; // Step speed per tile (ms)
const TAP_DELAY = 100; // Time in ms key must be held before starting tile step (allows turning in place)

// Map Area Definitions
// Tileset width = 1024px (64 tiles per row)
// Tile 0 = Grass (x=1, y=1)
// Tile 1 = Path (x=2, y=1)
// Pine Tree Top = 66 (x=3, y=2 -> 1*64 + 2)
// Tree Trunk / Stump = 130 (x=3, y=3 -> 2*64 + 0)
// Rock = 192 (x=1, y=4 -> 3*64 + 0) - saved for later
// Stairs = 288 (x=33, y=5 -> 4*64 + 32)

const TT = 66;  // Tree Top
const TB = 130; // Tree Trunk / Stump
const ROCK = 192; // Rock (saved for future use)
const S = 288; // Stairs (Door placeholder)
const G = 0;   // Grass
const P = 1;   // Dirt Path

const AREAS = {
    overworld: {
        id: 'overworld',
        name: 'Pallet Town Outskirts',
        width: 24,
        height: 18,
        tiles: [
            [TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT],
            [TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB],
            [TT, G, G, G, G, G, G, G, G, G, G, G, S, G, G, G, G, G, G, G, G, G, G, TT],
            [TB, G, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, G, TB],
            [TT, G, P, G, G, G, G, G, P, G, G, G, G, G, P, G, G, G, G, G, P, G, G, TT],
            [TB, G, P, G, TT, G, G, G, P, G, TT, G, G, G, P, G, TT, G, G, G, P, G, G, TB],
            [TT, G, P, G, TB, G, G, G, P, G, TB, G, G, G, P, G, TB, G, G, G, P, G, G, TT],
            [TB, G, P, G, G, G, G, G, P, G, G, G, G, G, P, G, G, G, G, G, P, G, G, TB],
            [TT, G, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, G, G, TT],
            [TB, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, TB],
            [TT, G, G, G, TT, G, G, G, G, G, G, G, G, G, G, G, G, G, TT, G, G, G, G, TT],
            [TB, G, G, G, TB, G, G, G, G, G, G, G, G, G, G, G, G, G, TB, G, G, G, G, TB],
            [TT, G, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, G, G, TT],
            [TB, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, TB],
            [TT, G, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, G, G, TT],
            [TB, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, TB],
            [TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT],
            [TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB]
        ],
        solidTiles: [TT, TB, ROCK],
        doors: [
            { x: 12, y: 2, targetArea: 'house', targetX: 5, targetY: 6 }
        ]
    },
    house: {
        id: 'house',
        name: 'Research Lab',
        width: 11,
        height: 8,
        tiles: [
            [TT, TT, TT, TT, TT, TT, TT, TT, TT, TT, TT],
            [TB, TB, TB, TB, TB, TB, TB, TB, TB, TB, TB],
            [TT, P, P, P, P, P, P, P, P, P, TT],
            [TB, P, G, G, G, G, G, G, G, P, TB],
            [TT, P, G, P, P, P, P, G, P, P, TT],
            [TB, P, G, P, G, G, P, G, P, G, TB],
            [TT, P, P, P, P, S, P, P, P, P, TT],
            [TB, TT, TT, TT, TT, TT, TT, TT, TT, TT, TB]
        ],
        solidTiles: [TT, TB, ROCK],
        doors: [
            { x: 5, y: 6, targetArea: 'overworld', targetX: 12, targetY: 2 }
        ]
    }
};

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.currentArea = null;
        this.tileX = 12;
        this.tileY = 8;
        this.isMoving = false;
        this.facing = 'down';
        this.isTransitioning = false;
        this.keyHoldTimer = 0;
    }

    preload() {
        this.load.setPath('/puzzle-8/assets/');
        this.load.spritesheet('player', 'ServeriHiiri.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.image('tiles', 'Tileset.png');
    }
    create() {
        // Setup Player Walk Animations matching standing idle frames (1, 4, 6, 8)
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('player', { frames: [1, 0, 1, 2] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('player', { frames: [4, 3] }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('player', { frames: [6, 5] }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('player', { frames: [8, 7, 8, 9] }),
            frameRate: 8,
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
        this.input.on('pointerdown', () => {
            window.focus();
        });

        // Create Player Sprite
        this.player = this.add.sprite(
            this.tileX * TILE_SIZE,
            this.tileY * TILE_SIZE,
            'player',
            1 // Standing facing down
        );
        this.player.setOrigin(0, 0);
        this.player.setDepth(10);

        // Configure Camera
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setZoom(SCALE);

        // Load Initial Area
        this.loadArea('overworld', 12, 8);
    }

    loadArea(areaId, startTileX, startTileY) {
        const area = AREAS[areaId];
        if (!area) return;

        this.currentArea = area;
        this.tileX = startTileX;
        this.tileY = startTileY;

        // Rebuild Tilemap
        if (this.tilemap) this.tilemap.destroy();

        this.tilemap = this.make.tilemap({
            data: area.tiles,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE
        });

        const tileset = this.tilemap.addTilesetImage('tiles', 'tiles', 16, 16, 0, 0);
        this.layer = this.tilemap.createLayer(0, tileset, 0, 0);

        this.player.setPosition(
            this.tileX * TILE_SIZE,
            this.tileY * TILE_SIZE
        );
        this.setIdleFrame();

        // Calculate Camera Bounds to center smaller areas (like house/lab)
        const areaWidthPx = area.width * TILE_SIZE;
        const areaHeightPx = area.height * TILE_SIZE;

        const viewWidth = this.cameras.main.width / SCALE;
        const viewHeight = this.cameras.main.height / SCALE;

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
        if (this.isTransitioning) return;

        const activeDir = this.getActiveInput();

        if (this.isMoving) {
            return;
        }

        if (activeDir) {
            if (this.facing !== activeDir) {
                // Direction changed! Start complete turn animation cycle
                this.facing = activeDir;
                this.keyHoldTimer = 0;
                this.playTurnAnimation(activeDir);
            } else {
                this.keyHoldTimer += delta;
                if (!this.player.anims.isPlaying && !this.isTurning) {
                    this.player.play(`walk-${this.facing}`, true);
                }
            }

            // Move to target tile once held past tap threshold (TAP_DELAY)
            if (this.keyHoldTimer >= TAP_DELAY) {
                const [dx, dy] = this.getDeltaFromDir(activeDir);
                this.tryMove(dx, dy);
            }
        } else {
            // Released key: if not currently completing a turn loop, set idle standing frame
            this.keyHoldTimer = 0;
            if (!this.isTurning) {
                if (this.player.anims.isPlaying) {
                    this.player.anims.stop();
                }
                this.setIdleFrame();
            }
        }
    }

    playTurnAnimation(dir) {
        this.facing = dir;
        this.isTurning = true;
        const animKey = `walk-${this.facing}`;

        this.player.play(animKey, true);
        this.player.off(Phaser.Animations.Events.ANIMATION_REPEAT);

        // Listen for when 1 full animation cycle completes naturally
        this.player.once(Phaser.Animations.Events.ANIMATION_REPEAT, () => {
            this.isTurning = false;
            if (!this.getActiveInput() && !this.isMoving) {
                this.player.anims.stop();
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

    tryMove(dx, dy) {
        const targetX = this.tileX + dx;
        const targetY = this.tileY + dy;

        // Check area boundaries
        if (targetX < 0 || targetX >= this.currentArea.width ||
            targetY < 0 || targetY >= this.currentArea.height) {
            this.player.play(`walk-${this.facing}`, true);
            return;
        }

        // Check solid tiles
        const targetTileIndex = this.currentArea.tiles[targetY][targetX];
        if (this.currentArea.solidTiles.includes(targetTileIndex)) {
            // Blocked: play walk animation briefly to indicate wall bump
            this.player.play(`walk-${this.facing}`, true);
            return;
        }

        // Move to target tile
        this.isMoving = true;
        this.player.play(`walk-${this.facing}`, true);

        const targetPxX = targetX * TILE_SIZE;
        const targetPxY = targetY * TILE_SIZE;

        this.tweens.add({
            targets: this.player,
            x: targetPxX,
            y: targetPxY,
            duration: TWEEN_DURATION,
            ease: 'Linear',
            onComplete: () => {
                this.tileX = targetX;
                this.tileY = targetY;
                this.isMoving = false;

                const doorTriggered = this.checkDoorTrigger();

                if (!doorTriggered) {
                    const heldInput = this.getActiveInput();
                    if (heldInput && heldInput === this.facing) {
                        // Continue moving seamlessly if same direction key is still held
                        const [ndx, ndy] = this.getDeltaFromDir(heldInput);
                        this.tryMove(ndx, ndy);
                    } else if (heldInput) {
                        // Turned to new direction
                        this.facing = heldInput;
                        this.keyHoldTimer = 0;
                        this.turnAnimTimer = 140;
                    } else {
                        // Key released, stop animation and stand facing direction
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

            // Camera Fade Transition
            this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
                if (progress === 1) {
                    this.loadArea(door.targetArea, door.targetX, door.targetY);
                    this.cameras.main.fadeIn(250, 0, 0, 0, (cam, prog) => {
                        if (prog === 1) {
                            this.isTransitioning = false;
                        }
                    });
                }
            });
            return true;
        }
        return false;
    }
}

// Initialize Phaser Game
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 640,
    height: 576,
    scale: {
        mode: Phaser.Scale.FIT
    },
    render: {
        pixelArt: true,
        antialias: false
    },
    scene: MainScene
};

const game = new Phaser.Game(config);





