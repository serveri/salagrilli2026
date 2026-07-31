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

        window.Game = window.Game || {};
        Game.state = Game.state || {};
        const startingMoney = Game.state.money !== undefined ? Game.state.money : 2;
        Game.state.money = startingMoney;

        // Sample Inventory Items
        this.items = [
            { id: 'jallu', name: 'Jallu', desc: 'Some kind of strong liquor. Would taste better in a mix', canUse: true, cl: 75 },
            { id: 'key', name: 'Nappi avain', desc: 'A key found in the grass.', canUse: false },
            { id: 'map', name: 'Town Map', desc: 'A map showing Kuopio. \nI live in Neulamäki.', canUse: true },
            { id: 'energy_drink', name: 'Energy drink', desc: 'Classic MegaShopper energy drink, what a throwback!', canUse: true },
            { id: 'wallet', name: `Wallet ${startingMoney}€`, desc: 'Contains your money.', canUse: false },
            { id: 'note', name: 'Reminder Note', desc: ['"Remember to feed the cat.. "', '"Exam today at 10:00 in SN100!"', '..Can\'t forget!'], canUse: false },
            { id: 'watch', name: 'Watch', desc: 'It says 4:16 ..I think', canUse: false }
        ];

        if (Game.testingmode) {
            this.items.push({ id: 'teleport', name: 'Teleport', desc: 'A strange device that teleports you to your House.', canUse: true });
        }

        // UI Element References
        this.elements = [];
        this.bgImage = null;
        this.headerText = null;
        this.actionContainer = null;
        this.gridContainer = null;
        this._keyHandler = null;

        // Dimensions
        this.boxW = 198;
        this.boxH = 150;
    }

    /** Open the backpack overlay */
    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.selectedItem = null;

        if (window.Game && window.Game.state && window.Game.state.money !== undefined) {
            const walletItem = this.items.find(i => i.id === 'wallet');
            if (walletItem) {
                walletItem.name = `Wallet ${window.Game.state.money}€`;
            }
        }

        this._createUI();
        this.updatePosition();
        this._renderHeader();
        this._renderGrid();

        if (this._keyHandler) {
            this.scene.input.keyboard.off('keydown', this._keyHandler);
        }
        this._keyHandler = (event) => {
            if (!this.isOpen) return;
            if (event.code === 'Space') {
                if (this.selectedItem) {
                    if (this.selectedItem.canUse) {
                        this._handleUse(this.selectedItem);
                    } else {
                        this._handleInspect(this.selectedItem);
                    }
                } else if (this.items && this.items.length > 0) {
                    const startIndex = (this.currentPage || 0) * 9;
                    const item = this.items[startIndex] || this.items[0];
                    if (item) {
                        this.selectedItem = item;
                        this._renderHeader();
                        this._renderGrid();
                    }
                }
            }
        };
        this.scene.input.keyboard.on('keydown', this._keyHandler);
    }

    /** Close the backpack overlay */
    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.selectedItem = null;

        if (this._keyHandler) {
            this.scene.input.keyboard.off('keydown', this._keyHandler);
            this._keyHandler = null;
        }

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

        this.headerText.setPosition(bgX + 99, bgY + 20);
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
            this.headerText.setPosition(this.bgX + 99, this.bgY + 20);
            this.headerText.setOrigin(0.5, 0.5);
        } else {
            // Replace header text with selected item name, centered
            const item = this.selectedItem;
            this.headerText.setText(item.name);
            this.headerText.setPosition(this.bgX + 99, this.bgY + 20);
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
                    color: '#cc0000'
                }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setScale(0.22);

                dropBtn.on('pointerover', () => dropBtn.setColor('#ff3333'));
                dropBtn.on('pointerout', () => dropBtn.setColor('#cc0000'));
                dropBtn.on('pointerdown', () => this._handleDrop(item));
                this.actionContainer.add(dropBtn);
            }
        }

        // Close button (Bottom Left)
        const closeBtn = this.scene.add.text(20, 138, '[X]', {
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
            // Left arrow
            if (this.currentPage > 0) {
                const leftArrow = this.scene.add.text(10, 88, '←', {
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
                const rightArrow = this.scene.add.text(190, 88, '→', {
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
            const itemText = this.scene.add.text(Math.round(x + slotW / 2), Math.round(y + slotH / 2), this._formatItemName(item.name), {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '32px',
                color: isSelected ? '#003366' : '#222233',
                align: 'center'
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
            let pages = [];
            if (Array.isArray(item.desc)) {
                pages = item.desc.map((text, index) => index === 0 ? `${item.name}: ${text}` : text);
            } else {
                pages = [`${item.name}: ${item.desc}`];
            }

            if ((item.id === 'jallu' || item.id === 'gambina') && typeof item.cl !== 'undefined') {
                pages.push(`There is ${item.cl}cl left in the bottle.`);
            }

            this.scene.dialogue.show(pages, () => { this.open(); });
        }
    }

    _handleDrop(item) {
        this.close();
        if (item.id === 'wallet') {
            if (window.Game && window.Game.state) {
                window.Game.state.money = 0;
            }
        }
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

        if (item.id === 'energy_drink') {
            if (this.scene && typeof this.scene.energy !== 'undefined') {
                const old = this.scene.energy;
                this.scene.energy = Math.min(200, this.scene.energy + 100);
                if (this.scene.addEnergyDiff) {
                    this.scene.addEnergyDiff(this.scene.energy - old);
                }
                this.scene.speedModifier = 0.85;
                this.scene.speedModifierSteps = 35;
            }

            // Remove from backpack
            this.items = this.items.filter(i => i.id !== item.id);
            this.selectedItem = null;

            if (this.scene.dialogue) {
                this.scene.dialogue.show([
                    `You drank the ${item.name}!`,
                    `Restored 100 energy.`
                ], () => { this.open(); });
            }
        } else if (item.id === 'jallu' || item.id === 'gambina') {
            if (item.cl <= 0) {
                if (this.scene.dialogue) {
                    this.scene.dialogue.show(['The bottle is empty..'], () => { this.open(); });
                }
                this.selectedItem = null;
                return;
            }

            if (this.scene && typeof this.scene.energy !== 'undefined') {
                if (this.scene.reverseControlsSteps >= 60) {
                    if (this.scene.dialogue) {
                        this.scene.dialogue.show(['I WILL NOT TAKE THIS FOUL SUBSTANCE ANYMORE..!'], () => { this.open(); });
                    }
                    this.selectedItem = null;
                    return;
                }

                item.cl = Math.max(0, item.cl - 5);
                if (item.cl <= 0) {
                    item.canUse = false;
                }
                const old = this.scene.energy;
                const energyChange = Math.floor(Math.random() * 18) - 5; // Random between -5 and +12
                this.scene.energy = Math.max(0, Math.min(200, this.scene.energy + energyChange));
                if (this.scene.addEnergyDiff) {
                    this.scene.addEnergyDiff(this.scene.energy - old);
                }

                if (item.id === 'jallu') {
                    this.scene.reverseX = Math.random() < 0.5;
                    this.scene.reverseY = Math.random() < 0.5;
                    this.scene.reverseControlsSteps = (this.scene.reverseControlsSteps || 0) + 15;
                }

                this.scene.speedModifier = 1.15;
                this.scene.speedModifierSteps = (this.scene.speedModifierSteps || 0) + 15;
                this.scene.drunkSteps = (this.scene.drunkSteps || 0) + 15;
                this.scene.lastDrunkType = item.id;

                if (typeof this.scene.updateDrunkEffect === 'function') {
                    this.scene.updateDrunkEffect();
                }
            }

            this.selectedItem = null;

            const drinkMsg = item.id === 'gambina'
                ? 'You drink raw Gambina alone, what a disgrace!'
                : 'You take a sip of raw Jallu';

            if (this.scene.dialogue) {
                this.scene.dialogue.show([
                    drinkMsg,
                    'It makes you dizzy..'
                ], () => { this.open(); });
            }
        } else if (item.id === 'cup_of_coffee') {
            if (this.scene && typeof this.scene.energy !== 'undefined') {
                const old = this.scene.energy;
                this.scene.energy = Math.min(200, this.scene.energy + 100);
                if (this.scene.addEnergyDiff) {
                    this.scene.addEnergyDiff(this.scene.energy - old);
                }

                // 10% speed increase -> speedModifier = 0.90
                this.scene.speedModifier = 0.90;
                this.scene.speedModifierSteps = (this.scene.speedModifierSteps || 0) + 35;
            }

            // Remove from backpack (only this specific item instance)
            this.items = this.items.filter(i => i !== item);
            this.selectedItem = null;

            if (this.scene.dialogue) {
                this.scene.dialogue.show([
                    `You drank the ${item.name}!`,
                    `Restored 100 energy and gave a speed boost!`
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
        } else if (item.id === 'protein_bar') {
            if (this.scene && typeof this.scene.energy !== 'undefined') {
                const old = this.scene.energy;
                this.scene.energy = Math.min(200, this.scene.energy + 60);
                if (this.scene.addEnergyDiff) {
                    this.scene.addEnergyDiff(this.scene.energy - old);
                }
            }

            // Remove protein bar from backpack
            this.items = this.items.filter(i => i !== item);
            this.selectedItem = null;

            if (this.scene.dialogue) {
                this.scene.dialogue.show([
                    `You ate the ${item.name}!`,
                    `Restored 60 energy.`
                ], () => { this.open(); });
            }
        } else if (item.id === 'map') {
            if (this.scene) {
                this.scene.isMapOpen = true; // Block movement
                const cam = this.scene.cameras.main;
                const wv = cam.worldView;

                const mapContainer = this.scene.add.container(wv.x + wv.width / 2, wv.y + wv.height / 2);
                mapContainer.setDepth(9999);

                const mapImg = this.scene.add.image(0, 0, 'questMap');
                mapImg.setOrigin(0.5, 0.5);

                // Scale map to fit screen (100% of worldView)
                const scaleX = (wv.width * 1) / mapImg.width;
                const scaleY = (wv.height * 1) / mapImg.height;
                const scale = Math.min(scaleX, scaleY);
                mapContainer.setScale(scale);
                mapContainer.add(mapImg);

                // Add player position marker
                this._addPlayerMarkerToMap(mapContainer);

                const closeMap = () => {
                    if (!this.scene.isMapOpen) return;
                    if (keyHandler) {
                        this.scene.input.keyboard.off('keydown', keyHandler);
                    }
                    mapContainer.destroy();
                    this.scene.isMapOpen = false;
                    this.open();
                };

                const keyHandler = (evt) => {
                    if (evt.code === 'Space' || evt.code === 'Escape' || evt.code === 'KeyE' || evt.code === 'KeyI') {
                        closeMap();
                    }
                };

                mapImg.setInteractive({ useHandCursor: true });
                mapImg.on('pointerdown', closeMap);
                this.scene.input.keyboard.on('keydown', keyHandler);
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
                            this.scene.loadArea('/puzzle-8/data/Exam.csv', 28, 38).then(() => {
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

    _addPlayerMarkerToMap(mapContainer) {
        if (!this.scene || !this.scene.currentArea) return;
        const areaName = this.scene.currentArea.name;
        const tx = this.scene.tileX;
        const ty = this.scene.tileY;
        const areaW = this.scene.currentArea.width;
        const areaH = this.scene.currentArea.height;

        // Define marker positions for each submap on the quest map image.
        // - condition: a function to check if this region should be used
        // - x, y: the exact coordinates for the marker on the questMap image
        const mapRegions = {
            'serveriquest': [
                {
                    // Example: If player is past Y=50
                    condition: (x, y) => x >= 40,
                    x: -31, y: 90
                },
                {
                    // Default region for serveriquest
                    condition: (x, y) => true,
                    x: -90, y: 109
                }
            ],
            'NeulamaenSale': [
                { condition: () => true, x: -31, y: 90 }
            ],
            'savilahti': [
                {
                    // Front of microkatu
                    condition: (x, y) => y <= 59 && x > 41,
                    x: 21, y: 35
                },
                {
                    // Microkatu. x is less than 41, y is less than 48
                    condition: (x, y) => y <= 48 && x <= 41,
                    x: 11, y: 20
                },
                {
                    // Starting region for savilahti
                    condition: (x, y) => true,
                    x: -22, y: 55
                }
            ],
            'House': [
                { condition: () => true, x: -31, y: 90 }
            ],
            'Exam': [
                { condition: () => true, x: 72, y: -35 }
            ],
            'Laitos': [
                { condition: () => true, x: 11, y: 20 }
            ],
            'Prisma': [
                { condition: () => true, x: 21, y: 40 }
            ],
            'snellmania': [
                {
                    // Starting region for snellmania
                    condition: (x, y) => true,
                    x: 72, y: -35
                }
            ]
        };

        const regions = mapRegions[areaName] || mapRegions['default'];
        let region = regions.find(r => r.condition(tx, ty));
        if (!region) region = regions[regions.length - 1]; // fallback

        const markerX = region.x;
        const markerY = region.y;

        // Use 'effects' asset for the marker
        const marker = this.scene.add.image(markerX, markerY, 'effects');
        marker.setScale(0.75); // Adjust this if it doesn't match the map's pixels!
        mapContainer.add(marker);
    }

    /**
     * Formats an item name for display inside a grid slot.
     * Shows 1 more character per line before wrapping (max 7 chars),
     * and adds a dash '-' to the end of a cut word if it wraps mid-word.
     */
    _formatItemName(name, maxLen = 7) {
        if (!name || name.length <= maxLen) return name;

        const words = name.split(' ');
        const lines = [];
        let currentLine = '';

        for (let word of words) {
            if (!currentLine) {
                if (word.length <= maxLen) {
                    currentLine = word;
                } else {
                    while (word.length > maxLen) {
                        lines.push(word.slice(0, maxLen - 1) + '-');
                        word = word.slice(maxLen - 1);
                    }
                    currentLine = word;
                }
            } else {
                if ((currentLine + ' ' + word).length <= maxLen) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    if (word.length <= maxLen) {
                        currentLine = word;
                    } else {
                        while (word.length > maxLen) {
                            lines.push(word.slice(0, maxLen - 1) + '-');
                            word = word.slice(maxLen - 1);
                        }
                        currentLine = word;
                    }
                }
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.join('\n');
    }

    /** Check if backpack is currently open & blocking movement */
    get active() {
        return this.isOpen;
    }
};
