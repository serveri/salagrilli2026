// Reusable Shop System
// Renders shopinterface.png (198x150) with an interactive item grid and buy/inspect actions
window.Game = window.Game || {};

Game.Shop = class Shop {
    /**
     * @param {Phaser.Scene} scene - The active game scene
     */
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.selectedItem = null;

        // Items available in the shop
        this.items = [
            {
                id: 'energy_drink',
                name: 'Energy drink 5€',
                price: 5,
                desc: 'Classic ES energy drink, what a throwback!',
                itemData: {
                    id: 'energy_drink',
                    name: 'Energy drink',
                    desc: 'Classic ES energy drink, what a throwback!',
                    canUse: true
                }
            },
            {
                id: 'protein_bar',
                name: 'Protein bar 3€',
                price: 3,
                desc: 'Restores 60 energy. High protein snack!',
                itemData: {
                    id: 'protein_bar',
                    name: 'Protein bar',
                    desc: 'Restores 60 energy.',
                    canUse: true
                }
            }
        ];

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

    /** Open the shop interface overlay */
    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.selectedItem = null;

        this._createUI();
        this.updatePosition();
        this._renderHeader();
        this._renderGrid();

        if (this._keyHandler) {
            this.scene.input.keyboard.off('keydown', this._keyHandler);
        }
        this._keyHandler = (event) => {
            if (!this.isOpen) return;
            if (event.code === 'KeyE' || event.code === 'KeyI' || event.code === 'Escape') {
                this.close();
            }
        };
        this.scene.input.keyboard.on('keydown', this._keyHandler);

        if (this.scene.events) {
            this.scene.events.on('update', this.updatePosition, this);
        }
    }

    /** Close the shop interface */
    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.selectedItem = null;

        if (this._keyHandler) {
            this.scene.input.keyboard.off('keydown', this._keyHandler);
            this._keyHandler = null;
        }

        if (this.scene.events) {
            this.scene.events.off('update', this.updatePosition, this);
        }

        this.elements.forEach(el => el.destroy());
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

    _createUI() {
        this.elements = [];

        this.bgImage = this.scene.add.image(0, 0, 'shopinterface').setOrigin(0, 0).setDepth(900);
        this.elements.push(this.bgImage);

        this.headerText = this.scene.add.text(0, 0, 'Shop', {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '32px',
            color: '#1a1a2e',
            align: 'center'
        }).setScale(0.25).setDepth(901);
        this.elements.push(this.headerText);

        this.actionContainer = this.scene.add.container(0, 0).setDepth(902);
        this.elements.push(this.actionContainer);

        this.gridContainer = this.scene.add.container(0, 0).setDepth(902);
        this.elements.push(this.gridContainer);
    }

    _renderHeader() {
        if (!this.actionContainer) return;
        this.actionContainer.removeAll(true);

        if (!this.selectedItem) {
            this.headerText.setText('Shop');
            this.headerText.setPosition(this.bgX + 99, this.bgY + 20);
            this.headerText.setOrigin(0.5, 0.5);
        } else {
            const item = this.selectedItem;
            this.headerText.setText(item.name);
            this.headerText.setPosition(this.bgX + 99, this.bgY + 20);
            this.headerText.setOrigin(0.5, 0.5);

            // Action: Inspect button
            const inspectBtn = this.scene.add.text(134, 138, '[Inspect]', {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '32px',
                color: '#004488'
            }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setScale(0.22);

            inspectBtn.on('pointerover', () => inspectBtn.setColor('#0088ff'));
            inspectBtn.on('pointerout', () => inspectBtn.setColor('#004488'));
            inspectBtn.on('pointerdown', () => this._handleInspect(item));
            this.actionContainer.add(inspectBtn);

            // Action: Buy button
            const buyBtn = this.scene.add.text(178, 138, '[Buy]', {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '32px',
                color: '#006600'
            }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setScale(0.22);

            buyBtn.on('pointerover', () => buyBtn.setColor('#00cc00'));
            buyBtn.on('pointerout', () => buyBtn.setColor('#006600'));
            buyBtn.on('pointerdown', () => this._handleBuy(item));
            this.actionContainer.add(buyBtn);
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

        this.items.forEach((item, index) => {
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

            // Item Name text inside slot
            const itemText = this.scene.add.text(Math.round(x + slotW / 2), Math.round(y + slotH / 2), this._formatItemName(item.name), {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '32px',
                color: isSelected ? '#003366' : '#222233',
                align: 'center'
            }).setOrigin(0.5, 0.5).setScale(0.22);

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

    _formatItemName(name) {
        if (name.length > 12) {
            const words = name.split(' ');
            if (words.length > 1) {
                return words.join('\n');
            }
        }
        return name;
    }

    _handleInspect(item) {
        this.close();
        if (this.scene.dialogue) {
            this.scene.dialogue.show([
                `${item.name}`,
                `${item.desc}`
            ], () => { this.open(); });
        }
    }

    _handleBuy(item) {
        window.Game = window.Game || {};
        Game.state = Game.state || {};
        const playerMoney = Game.state.money !== undefined ? Game.state.money : 2;

        if (playerMoney < item.price) {
            this.close();
            if (this.scene.dialogue) {
                this.scene.dialogue.show([
                    `You don't have enough money!`,
                    `Item costs ${item.price}€, but you only have ${playerMoney}€.`
                ], () => { this.open(); });
            }
            return;
        }

        // Deduct money
        Game.state.money = playerMoney - item.price;

        // Update Wallet in inventory if present
        if (this.scene.backpack && this.scene.backpack.items) {
            const walletItem = this.scene.backpack.items.find(i => i.id === 'wallet');
            if (walletItem) {
                walletItem.name = `Wallet ${Game.state.money}€`;
            }

            // Add purchased item to player backpack
            this.scene.backpack.items.push({ ...item.itemData });
        }

        this.close();
        if (this.scene.dialogue) {
            this.scene.dialogue.show([
                `You bought ${item.itemData.name} for ${item.price}€!`
            ]);
        }
    }
};
