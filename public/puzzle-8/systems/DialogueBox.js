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
        this.isTyping = false;
        this.typeTimer = null;
        this.fullText = '';

        // UI elements (created once, reused)
        this.bgImage = null;
        this.textObj = null;
        this.inputLocked = false;
        this._keyHandler = null;
        this._pointerHandler = null;

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
    show(messages, onComplete, buttons = [], typeDelay = 20) {
        if (!messages || messages.length === 0) return;

        this.messages = messages;
        this.currentIndex = 0;
        this.onComplete = onComplete || null;
        this.buttonsData = buttons;
        this.typeDelay = typeDelay;
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

        // Text over the box with padding (wordWrap 138 to leave space for arrow)
        this.textObj = this.scene.add.text(0, 0, '', {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '8px',
            color: '#1a1a2e',
            wordWrap: { width: 138 },
            lineSpacing: 2,
            maxLines: 5
        });
        this.textObj.setOrigin(0, 0);
        this.textObj.setDepth(2001);
        this.textObj.setResolution(2);

        // Red arrow at the end of text
        this.arrowImage = this.scene.add.sprite(0, 0, 'effects', 1);
        this.arrowImage.setOrigin(0, 0.5); // Center vertically with the text line
        this.arrowImage.setDepth(2001);
        this.arrowImage.setVisible(false);
        this.arrowImage.setScale(1.2); // Slightly larger to match text

        if (!this.scene.anims.exists('dialogue-arrow')) {
            this.scene.anims.create({
                key: 'dialogue-arrow',
                frames: this.scene.anims.generateFrameNumbers('effects', { frames: [1, 2, 3, 2] }),
                frameRate: 4,
                repeat: -1
            });
        }
        this.arrowImage.play('dialogue-arrow');
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

        if (this.arrowImage && this.arrowImage.visible) {
            // Find the last line of the text to place the arrow on the same line
            let lines = [];
            if (typeof this.textObj.getWrappedText === 'function') {
                lines = this.textObj.getWrappedText(this.textObj.text);
            } else if (this.textObj._lines) {
                lines = this.textObj._lines;
            } else {
                lines = this.textObj.text.split('\n');
            }

            // Flatten if it returned an array of arrays (some Phaser versions)
            if (lines.length > 0 && Array.isArray(lines[0])) {
                lines = lines.flat();
            }

            const lastLine = lines.length > 0 ? lines[lines.length - 1] : '';

            // Measure its width using the same canvas context
            const ctx = this.textObj.canvas.getContext('2d');
            ctx.font = this.textObj.style._font;
            const lastLineWidth = ctx.measureText(lastLine).width;

            const lineHeight = 10; // fontSize(8) + lineSpacing(2)
            const arrowX = boxX + 6 + lastLineWidth + 1; // Pulled slightly more to the left
            const arrowY = boxY + 10 + (lines.length - 1) * lineHeight + 6; // +5 to center on the 10px line

            this.arrowImage.setPosition(arrowX, arrowY);
        }

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

        this._stopTyping();
        this.currentIndex = index;
        this.fullText = this.messages[index];
        this.textObj.setText('');

        // Hide arrow while typing
        if (this.arrowImage) {
            this.arrowImage.setVisible(false);
            this.arrowImage.setAlpha(0);
            if (this.arrowTween) {
                this.arrowTween.stop();
                this.arrowTween = null;
            }
        }

        if (index === this.messages.length - 1 && this.buttonsData && this.buttonsData.length > 0) {
            this._renderButtons();
        } else {
            this._clearButtons();
        }

        // Lock input briefly then start typing
        this.inputLocked = true;
        this.isTyping = true;
        let charIndex = 0;

        this.typeTimer = this.scene.time.addEvent({
            delay: this.typeDelay || 20,
            repeat: this.fullText.length - 1,
            callback: () => {
                charIndex++;
                this.textObj.setText(this.fullText.substring(0, charIndex));

                if (charIndex >= this.fullText.length) {
                    this._completeTyping();
                }
            }
        });

        // Unlock input after a brief moment so player can skip typing
        this.scene.time.delayedCall(250, () => {
            this.inputLocked = false;
        });
    }

    /** Instantly finish the typewriter and show the arrow */
    _completeTyping() {
        this._stopTyping();
        this.textObj.setText(this.fullText);
        this._updatePosition();

        let lines = [];
        if (typeof this.textObj.getWrappedText === 'function') {
            lines = this.textObj.getWrappedText(this.textObj.text);
        } else if (this.textObj._lines) {
            lines = this.textObj._lines;
        } else {
            lines = this.textObj.text.split('\n');
        }
        if (lines.length > 0 && Array.isArray(lines[0])) {
            lines = lines.flat();
        }

        const hasButtons = this.currentIndex === this.messages.length - 1 && this.buttonsData && this.buttonsData.length > 0;

        // Fade in the arrow to indicate the player can advance, unless there are buttons to click
        if (this.arrowImage && !hasButtons) {
            this.arrowImage.setVisible(true);
            this.arrowImage.setAlpha(0);

            if (this.arrowTween) {
                this.arrowTween.stop();
            }

            this.arrowTween = this.scene.tweens.add({
                targets: this.arrowImage,
                alpha: 1,
                delay: 420,
                duration: 200,
                ease: 'Linear'
            });
        } else if (this.arrowImage) {
            this.arrowImage.setVisible(false);
        }
    }

    /** Stop the typewriter timer if running */
    _stopTyping() {
        this.isTyping = false;
        if (this.typeTimer) {
            this.typeTimer.remove(false);
            this.typeTimer = null;
        }
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
                this._close();
                btn.onClick();
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
        if (this._pointerHandler) {
            this.scene.input.off('pointerdown', this._pointerHandler);
        }

        this._keyHandler = (event) => {
            if (event.code !== 'Space' && event.code !== 'KeyE' && event.key !== 'e' && event.key !== 'E') return;
            if (!this.isActive || this.inputLocked) return;
            // If still typing, skip to end of current message
            if (this.isTyping) {
                this._completeTyping();
                return;
            }
            if (this.currentIndex === this.messages.length - 1 && this.buttonsData && this.buttonsData.length > 0) {
                return; // Require button click to proceed
            }
            this._showMessage(this.currentIndex + 1);
        };

        this._pointerHandler = (pointer) => {
            if (pointer.button !== 0) return;
            if (!this.isActive || this.inputLocked) return;
            // If still typing, skip to end of current message
            if (this.isTyping) {
                this._completeTyping();
                return;
            }
            if (this.currentIndex === this.messages.length - 1 && this.buttonsData && this.buttonsData.length > 0) {
                return; // Require button click to proceed
            }
            this._showMessage(this.currentIndex + 1);
        };

        this.scene.input.keyboard.on('keydown', this._keyHandler);
        this.scene.input.on('pointerdown', this._pointerHandler);
    }

    _close() {
        this._stopTyping();
        this.isActive = false;
        this._clearButtons();

        if (this.bgImage) {
            this.bgImage.setVisible(false);
            this.textObj.setVisible(false);
            if (this.arrowImage) this.arrowImage.setVisible(false);
        }

        if (this._keyHandler) {
            this.scene.input.keyboard.off('keydown', this._keyHandler);
            this._keyHandler = null;
        }

        if (this._pointerHandler) {
            this.scene.input.off('pointerdown', this._pointerHandler);
            this._pointerHandler = null;
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
