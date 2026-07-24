// Reusable Inventory / Backpack System
// Renders backpack.png (198x150) with an interactive item grid and header bar
window.Game = window.Game || {};

Game.Backpack = class Backpack {
    /**
     * @param {Phaser.Scene} scene - The active game scene
     */
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.selectedItem = null;

        // Sample Inventory Items
        this.items = [
            { id: 'jallu', name: 'Jallu', desc: 'Restores HP to full health.', canUse: true },
            { id: 'key', name: 'Nappiavain', desc: 'A key found in the grass.', canUse: false },
            { id: 'map', name: 'Town Map', desc: 'A map showing Kuopio. \nI live in Neulamäki.', canUse: true },
            { id: 'coffee', name: 'Hot Coffee', desc: 'Warm roasted coffee. Cures fatigue.', canUse: true },
            { id: 'badge', name: 'Puzzle Badge', desc: 'A shiny badge from solving Puzzle 8.', canUse: false },
            { id: 'note', name: 'Reminder Note', desc: '"Remember to feed the cat.. \n Exam today at 10:00!" ..Can\'t forget!', canUse: false },
            { id: 'watch', name: 'Watch', desc: 'It says 4:16 ..I think', canUse: false },
            { id: 'teleport', name: 'Teleport', desc: 'A strange device that teleports you to your House.', canUse: true }
        ];

        // UI Element References
        this.elements = [];
        this.bgImage = null;
        this.headerText = null;
        this.actionContainer = null;
        this.gridContainer = null;

        // Dimensions
        this.boxW = 198;
        this.boxH = 150;
    }

    /** Open the backpack overlay */
    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.selectedItem = null;

        this._createUI();
        this.updatePosition();
        this._renderHeader();
        this._renderGrid();
    }

    /** Close the backpack overlay */
    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.selectedItem = null;

        this._destroyUI();
    }

    /** Toggle backpack open / closed */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    _createUI() {
        this._destroyUI();

        // 1. Background image
        this.bgImage = this.scene.add.image(0, 0, 'backpack');
        this.bgImage.setOrigin(0, 0);
        this.bgImage.setDepth(3000);
        this.elements.push(this.bgImage);

        // 2. Header Text ("Inventory" by default)
        this.headerText = this.scene.add.text(0, 0, 'Inventory', {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '32px',
            color: '#1a1a2e'
        });
        this.headerText.setOrigin(0.5, 0.5);
        this.headerText.setDepth(3002);
        this.headerText.setScale(0.22);
        this.elements.push(this.headerText);

        // 3. Container for Action Buttons (Inspect, Use, Back) in Header
        this.actionContainer = this.scene.add.container(0, 0);
        this.actionContainer.setDepth(3002);
        this.elements.push(this.actionContainer);

        // 4. Container for Item Grid
        this.gridContainer = this.scene.add.container(0, 0);
        this.gridContainer.setDepth(3001);
        this.elements.push(this.gridContainer);
    }

    _destroyUI() {
        this.elements.forEach(el => {
            if (el && el.destroy) el.destroy();
        });
        this.elements = [];
        this.bgImage = null;
        this.headerText = null;
        this.actionContainer = null;
        this.gridContainer = null;
    }

    /** Positions UI elements in camera worldView center */
    updatePosition() {
        if (!this.isOpen || !this.bgImage) return;

        const cam = this.scene.cameras.main;
        const wv = cam.worldView;

        const bgX = Math.round(wv.x + (wv.width - this.boxW) / 2);
        const bgY = Math.round(wv.y + (wv.height - this.boxH) / 2);

        this.bgX = bgX;
        this.bgY = bgY;

        this.bgImage.setPosition(bgX, bgY);

        this.headerText.setPosition(bgX + 99, bgY + 22);
        this.headerText.setOrigin(0.5, 0.5);

        if (this.actionContainer) {
            this.actionContainer.setPosition(bgX, bgY);
        }
        if (this.gridContainer) {
            this.gridContainer.setPosition(bgX, bgY);
        }
    }

    _renderHeader() {
        if (!this.actionContainer) return;
        this.actionContainer.removeAll(true);

        if (!this.selectedItem) {
            // Show default "Inventory" title
            this.headerText.setText('Inventory');
            this.headerText.setPosition(this.bgX + 99, this.bgY + 22);
            this.headerText.setOrigin(0.5, 0.5);
        } else {
            // Replace header text with selected item name, centered
            const item = this.selectedItem;
            this.headerText.setText(item.name);
            this.headerText.setPosition(this.bgX + 99, this.bgY + 22);
            this.headerText.setOrigin(0.5, 0.5);

            // Action: Inspect button
            const inspectBtn = this.scene.add.text(178, 138, '[Inspect]', {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '32px',
                color: '#004488'
            }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setScale(0.22);

            inspectBtn.on('pointerover', () => inspectBtn.setColor('#0088ff'));
            inspectBtn.on('pointerout', () => inspectBtn.setColor('#004488'));
            inspectBtn.on('pointerdown', () => this._handleInspect(item));
            this.actionContainer.add(inspectBtn);

            // Action: Use button (if item is usable) or Drop button
            inspectBtn.setPosition(134, 138);

            if (item.canUse) {
                const useBtn = this.scene.add.text(178, 138, '[Use]', {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '32px',
                    color: '#006600'
                }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setScale(0.22);

                useBtn.on('pointerover', () => useBtn.setColor('#00cc00'));
                useBtn.on('pointerout', () => useBtn.setColor('#006600'));
                useBtn.on('pointerdown', () => this._handleUse(item));
                this.actionContainer.add(useBtn);
            } else {
                const dropBtn = this.scene.add.text(178, 138, '[Drop]', {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '32px',
                    color: '#666666'
                }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setScale(0.22);

                dropBtn.on('pointerover', () => dropBtn.setColor('#aaaaaa'));
                dropBtn.on('pointerout', () => dropBtn.setColor('#666666'));
                dropBtn.on('pointerdown', () => this._handleDrop(item));
                this.actionContainer.add(dropBtn);
            }
        }

        // Close button (Bottom Left)
        const closeBtn = this.scene.add.text(20, 138, '[Close]', {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '32px',
            color: '#880000'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setScale(0.22);

        closeBtn.on('pointerover', () => closeBtn.setColor('#ff0000'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#880000'));
        closeBtn.on('pointerdown', () => this.close());
        this.actionContainer.add(closeBtn);
    }

    _renderGrid() {
        if (!this.gridContainer) return;
        this.gridContainer.removeAll(true);

        const cols = 3;
        const startX = 20;
        const startY = 38;
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
            // Left arrow
            if (this.currentPage > 0) {
                const leftArrow = this.scene.add.text(8, 94, '<\n<', {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '32px',
                    color: '#1a1a2e'
                }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.25);

                leftArrow.on('pointerover', () => leftArrow.setColor('#004488'));
                leftArrow.on('pointerout', () => leftArrow.setColor('#1a1a2e'));
                leftArrow.on('pointerdown', () => {
                    this.currentPage--;
                    this._renderGrid();
                });
                this.gridContainer.add(leftArrow);
            }

            // Right arrow
            if (this.currentPage < totalPages - 1) {
                const rightArrow = this.scene.add.text(190, 94, '>\n>', {
                    fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                    fontSize: '32px',
                    color: '#1a1a2e'
                }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScale(0.25);

                rightArrow.on('pointerover', () => rightArrow.setColor('#004488'));
                rightArrow.on('pointerout', () => rightArrow.setColor('#1a1a2e'));
                rightArrow.on('pointerdown', () => {
                    this.currentPage++;
                    this._renderGrid();
                });
                this.gridContainer.add(rightArrow);
            }
        }

        pageItems.forEach((item, index) => {
            const c = index % cols;
            const r = Math.floor(index / cols);

            const x = startX + c * (slotW + spacingX);
            const y = startY + r * (slotH + spacingY);

            const isSelected = this.selectedItem && this.selectedItem.id === item.id;

            // Slot Background box
            const bgRect = this.scene.add.rectangle(
                x, y, slotW, slotH,
                isSelected ? 0xd0e0f0 : 0xf0f0f5
            ).setOrigin(0, 0).setInteractive({ useHandCursor: true });

            // Border line around slot
            const strokeColor = isSelected ? 0x004488 : 0x888899;
            const strokeRect = this.scene.add.graphics();
            strokeRect.lineStyle(isSelected ? 2 : 1, strokeColor);
            strokeRect.strokeRect(x, y, slotW, slotH);

            // Item Name text inside slot (rounded integer coordinates for crisp pixel rendering)
            const itemText = this.scene.add.text(Math.round(x + slotW / 2), Math.round(y + slotH / 2), item.name, {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '32px',
                color: isSelected ? '#003366' : '#222233',
                align: 'center',
                wordWrap: { width: (slotW) * 4, useAdvancedWrap: true }
            }).setOrigin(0.5, 0.5).setScale(0.22);

            // Slot click interaction: clicking an item selects it, clicking it again deselects it!
            bgRect.on('pointerdown', () => {
                if (this.selectedItem && this.selectedItem.id === item.id) {
                    this.selectedItem = null;
                } else {
                    this.selectedItem = item;
                }
                this._renderHeader();
                this._renderGrid();
            });

            this.gridContainer.add(bgRect);
            this.gridContainer.add(strokeRect);
            this.gridContainer.add(itemText);
        });
    }

    _handleInspect(item) {
        this.close();
        if (this.scene.dialogue) {
            // Displays in a single dialogue box page
            this.scene.dialogue.show([
                `${item.name}: ${item.desc}`
            ], () => { this.open(); });
        }
    }

    _handleDrop(item) {
        this.close();
        this.items = this.items.filter(i => i.id !== item.id);
        this.selectedItem = null;
        if (this.scene && this.scene.dialogue) {
            this.scene.dialogue.show([
                `You threw ${item.name} away`
            ], () => { this.open(); });
        }
    }

    _handleUse(item) {
        this.close();

        if (item.id === 'coffee') {
            if (this.scene && typeof this.scene.energy !== 'undefined') {
                const old = this.scene.energy;
                this.scene.energy = 200;
                if (this.scene.addEnergyDiff) {
                    this.scene.addEnergyDiff(this.scene.energy - old);
                }
            }
            if (this.scene.dialogue) {
                this.scene.dialogue.show([
                    `You drank the ${item.name}!`,
                    `Your energy was restored to 200.`
                ], () => { this.open(); });
            }
        } else if (item.id.startsWith('berry')) {
            if (this.scene && typeof this.scene.energy !== 'undefined') {
                const old = this.scene.energy;
                this.scene.energy = Math.min(200, this.scene.energy + 50);
                if (this.scene.addEnergyDiff) {
                    this.scene.addEnergyDiff(this.scene.energy - old);
                }
            }

            // Remove berry from backpack
            this.items = this.items.filter(i => i.id !== item.id);
            this.selectedItem = null;

            if (this.scene.dialogue) {
                this.scene.dialogue.show([
                    `You ate the ${item.name}!`,
                    `Restored 50 energy.`
                ], () => { this.open(); });
            }
        } else if (item.id === 'map') {
            if (this.scene) {
                const cam = this.scene.cameras.main;
                const wv = cam.worldView;

                const mapImg = this.scene.add.image(wv.x + wv.width / 2, wv.y + wv.height / 2, 'questMap');
                mapImg.setOrigin(0.5, 0.5);
                mapImg.setDepth(9999);

                // Scale map to fit screen (95% of worldView)
                const scaleX = (wv.width * 1) / mapImg.width;
                const scaleY = (wv.height * 1) / mapImg.height;
                const scale = Math.min(scaleX, scaleY);
                mapImg.setScale(scale);

                mapImg.setInteractive({ useHandCursor: true });
                mapImg.on('pointerdown', () => {
                    mapImg.destroy();
                    this.open();
                });
            }
        } else if (item.id === 'teleport') {
            if (this.scene && this.scene.dialogue) {
                this.scene.isTransitioning = true;
                this.scene.dialogue.show([
                    `You used the ${item.name}!`,
                    `Teleporting to House...`
                ], () => {
                    this.scene.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
                        if (progress === 1) {
                            this.scene.loadArea('/puzzle-8/data/House.csv', 7, 8).then(() => {
                                this.scene.cameras.main.fadeIn(250, 0, 0, 0, (cam, prog) => {
                                    if (prog === 1) {
                                        this.scene.isTransitioning = false;
                                    }
                                });
                            });
                        }
                    });
                });
            }
        } else {
            if (this.scene.dialogue) {
                // Displays in a single dialogue box page
                this.scene.dialogue.show([
                    `Used ${item.name}! ${item.desc}`
                ], () => { this.open(); });
            }
        }
    }



    /** Check if backpack is currently open & blocking movement */
    get active() {
        return this.isOpen;
    }
};
