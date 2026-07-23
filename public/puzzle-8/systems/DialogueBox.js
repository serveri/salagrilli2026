// Reusable in-game dialogue box system
// Uses textbox.png (158x80) as background, renders text with Pokemon Classic font
// Supports message queues with any-key advance
window.Game = window.Game || {};

Game.DialogueBox = class DialogueBox {
    /**
     * @param {Phaser.Scene} scene - The active game scene
     */
    constructor(scene) {
        this.scene = scene;
        this.messages = [];
        this.currentIndex = 0;
        this.isActive = false;
        this.onComplete = null;
        this.buttonsData = [];
        this.buttonElements = [];

        // UI elements (created once, reused)
        this.bgImage = null;
        this.textObj = null;
        this.inputLocked = false;
        this._keyHandler = null;

        // Textbox native dimensions
        this.boxW = 158;
        this.boxH = 80;
    }

    /**
     * Show a sequence of dialogue messages in the game window.
     * Blocks player input while active.
     * @param {string[]} messages - Array of message strings to display sequentially
     * @param {Function} [onComplete] - Called when all messages are dismissed
     */
    show(messages, onComplete, buttons = []) {
        if (!messages || messages.length === 0) return;

        this.messages = messages;
        this.currentIndex = 0;
        this.onComplete = onComplete || null;
        this.buttonsData = buttons;
        this.isActive = true;

        this._createUI();
        this._updatePosition();

        // Lock input for 450ms on open to prevent leftover menu clicks/keypresses from skipping dialogue
        this.inputLocked = true;
        this.scene.time.delayedCall(450, () => {
            this.inputLocked = false;
        });

        this._showMessage(0);
        this._bindInput();
    }

    _createUI() {
        if (this.bgImage) {
            this.bgImage.setVisible(true);
            this.textObj.setVisible(true);
            return;
        }

        // Background textbox image (positioned in world space, follows camera each frame)
        this.bgImage = this.scene.add.image(0, 0, 'textbox');
        this.bgImage.setOrigin(0, 0);
        this.bgImage.setDepth(2000);

        // Text over the box with padding (allows lines to extend longer, max 4 lines)
        this.textObj = this.scene.add.text(0, 0, '', {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '8px',
            color: '#1a1a2e',
            wordWrap: { width: 160 },
            lineSpacing: 2,
            maxLines: 5
        });
        this.textObj.setOrigin(0, 0);
        this.textObj.setDepth(2001);
        this.textObj.setResolution(2);
    }

    /**
     * Update textbox position to stay fixed at bottom-center of camera viewport.
     * Call this from the scene's update() loop while dialogue is active.
     */
    updatePosition() {
        if (!this.isActive || !this.bgImage) return;
        this._updatePosition();
    }

    _updatePosition() {
        const cam = this.scene.cameras.main;
        const wv = cam.worldView;

        // Position textbox lower at the bottom edge of camera's visible world bounds
        const boxX = Math.round(wv.x + (wv.width - this.boxW) / 2 - 4);
        const boxY = Math.floor(wv.y + wv.height - this.boxH + 8);

        this.bgImage.setPosition(boxX, boxY);
        this.textObj.setPosition(boxX + 6, boxY + 10);

        if (this.buttonElements && this.buttonElements.length > 0) {
            const btnY = boxY + this.boxH - 26; // Raised higher
            let btnX = boxX + (this.boxW - (this.buttonElements.length * 75 - 5)) / 2 + 35;
            this.buttonElements.forEach(b => {
                b.text.setPosition(btnX, btnY);
                btnX += 75;
            });
        }
    }

    _showMessage(index) {
        if (index >= this.messages.length) {
            this._close();
            return;
        }

        this.currentIndex = index;
        this.textObj.setText(this.messages[index]);

        if (index === this.messages.length - 1 && this.buttonsData && this.buttonsData.length > 0) {
            this._renderButtons();
        } else {
            this._clearButtons();
        }

        // Brief delay between message advances
        this.inputLocked = true;
        this.scene.time.delayedCall(250, () => {
            this.inputLocked = false;
        });
    }

    _renderButtons() {
        this._clearButtons();
        this.buttonElements = [];

        this.buttonsData.forEach((btn, i) => {
            const defaultColor = btn.color || '#004488';
            const hoverColor = btn.hoverColor || '#0077cc';

            const btnText = this.scene.add.text(0, 0, `[${btn.text}]`, {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '8px',
                color: defaultColor
            }).setOrigin(0.5, 0.5).setDepth(2003).setResolution(2).setInteractive({ useHandCursor: true });

            btnText.on('pointerdown', () => {
                if (this.inputLocked) return;
                btn.onClick();
                this._close();
            });
            btnText.on('pointerover', () => btnText.setColor(hoverColor));
            btnText.on('pointerout', () => btnText.setColor(defaultColor));

            this.buttonElements.push({ text: btnText });
        });
        this._updatePosition();
    }

    _clearButtons() {
        if (this.buttonElements) {
            this.buttonElements.forEach(b => {
                b.text.destroy();
            });
            this.buttonElements = [];
        }
    }

    _bindInput() {
        if (this._keyHandler) {
            this.scene.input.keyboard.off('keydown', this._keyHandler);
        }

        this._keyHandler = (event) => {
            if (event.code !== 'Space') return;
            if (!this.isActive || this.inputLocked) return;
            if (this.currentIndex === this.messages.length - 1 && this.buttonsData && this.buttonsData.length > 0) {
                return; // Require button click to proceed
            }
            this._showMessage(this.currentIndex + 1);
        };

        this.scene.input.keyboard.on('keydown', this._keyHandler);
    }

    _close() {
        this.isActive = false;
        this._clearButtons();

        if (this.bgImage) {
            this.bgImage.setVisible(false);
            this.textObj.setVisible(false);
        }

        if (this._keyHandler) {
            this.scene.input.keyboard.off('keydown', this._keyHandler);
            this._keyHandler = null;
        }

        if (this.onComplete) {
            this.onComplete();
        }
    }

    /** Check if dialogue is currently blocking input */
    get active() {
        return this.isActive;
    }
};
