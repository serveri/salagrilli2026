// Exam Minigame System
// Duolingo-style sentence builder with flying pencil catch mechanic
window.Game = window.Game || {};

Game.EXAM_QUESTIONS = [
    {
        question: 'Please, for the love of sanity, how do we start a Java program?',
        words: ['public', 'static', 'void', 'main', 'private', 'please'],
        answer: ['public', 'static', 'void', 'main']
    },
    {
        question: 'If the autograder fails your code, what is your highly sophisticated debugging strategy?',
        words: ['print', 'stuff', 'until', 'it', 'works', 'cry'],
        answer: ['print', 'stuff', 'until', 'it', 'works']
    },
    {
        question: 'The code crashes on my computer but not yours. What is your legally binding defense?',
        words: ['it', 'works', 'on', 'my', 'machine', 'Java'],
        answer: ['it', 'works', 'on', 'my', 'machine']
    },
    {
        question: 'What is the universally accepted name for your absolute final submission file?',
        words: ['untitled', 'version', 'three', 'real', 'done', 'Submission'],
        answer: ['Submission', 'version', 'three', 'real', 'done']
    },
    {
        question: 'Translate to Java: "Start the program"',
        words: ['public', 'static', 'void', 'main', 'private', 'class', 'begin', 'now'],
        answer: ['public', 'static', 'void', 'main']
    },
    {
        question: 'How do you politely ask Java to output text to the screen?',
        words: ['System', 'out', 'print', 'line', 'please', 'say', 'hello', 'console', 'log'],
        answer: ['System', 'out', 'print', 'line']
    },
    {
        question: 'What is the fastest way to exit the Vim text editor?',
        words: ['hold', 'down', 'the', 'power', 'button', 'colon', 'quit', 'escape', 'save'],
        answer: ['hold', 'down', 'the', 'power', 'button']
    },
    {
        question: 'The true purpose of a catch block is to:',
        words: ['ignore', 'the', 'error', 'and', 'keep', 'going', 'handle', 'exception'],
        answer: ['ignore', 'the', 'error', 'and', 'keep', 'going']
    },
    {
        question: 'If your algorithm runs in O(n!) time, how fast is it?',
        words: ['slower', 'than', 'a', 'physical', 'snail', 'fast'],
        answer: ['slower', 'than', 'a', 'physical', 'snail']
    },
    {
        question: 'To be or not to be, that is the...',
        words: ['standard', 'boolean', 'logic', 'expression', 'Shakespeare', 'false'],
        answer: ['standard', 'boolean', 'logic', 'expression']
    },
    {
        question: 'Why should we never use floating-point variables to calculate real money?',
        words: ['Hackers', 'precise', 'math', 'becomes', 'impossible', 'integers'],
        answer: ['precise', 'math', 'becomes', 'impossible']
    },
    {
        question: 'What data structure is the answer to almost every technical interview question?',
        words: ['just', 'use', 'a', 'hash', 'map', 'array'],
        answer: ['just', 'use', 'a', 'hash', 'map']
    },
    {
        question: 'When is it actually appropriate to use Bubble Sort in the real world?',
        words: ['literally', 'never', 'do', 'that', 'ever', 'sometimes'],
        answer: ['literally', 'never', 'do', 'that', 'ever']
    },
    {
        question: 'Explain the Last-In-First-Out concept of a Stack using real-world chores.',
        words: ['washing', 'a', 'coffeepan', 'pile', 'of', 'plates'],
        answer: ['washing', 'a', 'pile', 'of', 'plates']
    },
    {
        question: 'How does Binary Search find a specific number so quickly?',
        words: ['chopping', 'the', 'array', 'in', 'half', 'sorting'],
        answer: ['chopping', 'the', 'array', 'in', 'half']
    },
    {
        question: "Complete the sentence: Java code runs on the...",
        words: ["Java", "CPU", "browser", "printer", "Virtual", "Machine"],
        answer: ["Virtual", "Machine"]
    },
    {
        question: "if (true && false) equals to: ",
        words: ["false", "true", "maybe", "error", "always", "null"],
        answer: ["false"]
    },
    {
        question: "Complete the sentence: A bug is an...",
        words: ["error", "in", "code", "feature", "computer", "keyboard"],
        answer: ["error", "in", "code"]
    },
    {
        question: "An algorithm is...",
        words: ["step", "by", "step", "instructions", "wizardry", "vibes"],
        answer: ["step", "by", "step", "instructions"]
    },
    {
        question: "A variable stores...",
        words: ["a", "value", "sandwich", "regret", "hamsters", "wifi"],
        answer: ["a", "value"]
    },
    {
        question: "A binary tree node has...",
        words: ["at", "most", "two", "children", "help!", "javaste"],
        answer: ["at", "most", "two", "children"]
    },
    {
        question: "Objects are created with keyword...",
        words: ["new", "please", "summon", "duct", "tape", "hope"],
        answer: ["new"]
    }
];

Game.Exam = class Exam {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.container = null;
        this._keyHandler = null;

        // Game state
        this.currentQuestion = 0;
        this.timeRemaining = 300; // 5 minutes in seconds
        this.timerEvent = null;
        this.isFinished = false;

        // Active questions for current exam
        this.activeQuestions = [];

        // Track state per question
        this.questionStates = [];

        // Typing animation state
        this.isTypingWord = false;
        this.isErasing = false;
        this.typeTimer = null;

        // Pencil state
        this.pencilSprite = null;
        this.pencilActive = false;
        this.pencilTimer = null;
        this.nextPencilTime = 0;

        // UI references
        this.questionText = null;
        this.answerText = null;
        this.wordButtons = [];
        this.navButtons = [];
        this.timerText = null;
        this.progressText = null;
        this.bgImg = null;

        // Layout constants (in exam-local coordinates, centered at 0,0)
        // The white paper area is roughly centered in the background
        this.paperLeft = -62;
        this.paperRight = 109; // Increased to fit new paper space
        this.paperTop = -72;
        this.paperBottom = 80;
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.scene.isExamOpen = true;

        // Reset state
        this.currentQuestion = 0;
        this.timeRemaining = 300;
        this.isFinished = false;
        this.isTypingWord = false;
        this.isErasing = false;
        this.pencilActive = false;
        this.pencilSpeed = 1.0;
        this.nextPencilTime = 0;

        // Input buffering
        this.inputQueue = [];

        // Pick 10 random questions and shuffle their words
        const shuffled = [...Game.EXAM_QUESTIONS].map(q => {
            return {
                question: q.question,
                words: [...q.words].sort(() => Math.random() - 0.5),
                answer: q.answer
            };
        }).sort(() => Math.random() - 0.5);
        this.activeQuestions = shuffled.slice(0, 10);

        this.questionStates = this.activeQuestions.map(() => ({
            selectedWords: []
        }));

        // Dynamic timer based on player energy
        const playerEnergy = Math.min(200, Math.max(0, this.scene.energy || 0));
        this.timeRemaining = Math.floor(150 + (playerEnergy / 200) * 150);

        Game.state = Game.state || {};
        if (!Game.state.hasSlept) {
            this._scheduleBlur();
        }

        const cam = this.scene.cameras.main;
        const wv = cam.worldView;

        this.container = this.scene.add.container(wv.x + wv.width / 2, wv.y + wv.height / 2);
        this.container.setDepth(9999);

        this.bgImg = this.scene.add.image(0, 0, 'exambackground');
        this.bgImg.setOrigin(0.5, 0.5);

        const scaleX = wv.width / this.bgImg.width;
        const scaleY = wv.height / this.bgImg.height;
        this.examScale = Math.min(scaleX, scaleY);
        this.container.setScale(this.examScale);
        this.container.add(this.bgImg);

        // Timer display (top-right of paper)
        const mins = Math.floor(this.timeRemaining / 60);
        const secs = this.timeRemaining % 60;
        this.timerText = this.scene.add.text(this.paperRight - 5, this.paperTop + 5, `${mins}:${secs.toString().padStart(2, '0')}`, {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '7px',
            color: '#1a1a2e',
            align: 'right'
        }).setOrigin(1, 0).setResolution(10);
        this.container.add(this.timerText);

        // Progress display (top-left of paper)
        this.progressText = this.scene.add.text(this.paperLeft + 5, this.paperTop + 5, 'Q 1/10', {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '6px',
            color: '#555566'
        }).setOrigin(0, 0).setResolution(10);
        this.container.add(this.progressText);

        // Question text
        this.questionText = this.scene.add.text((this.paperLeft + this.paperRight) / 2, this.paperTop + 16, '', {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '6px',
            color: '#1a1a2e',
            wordWrap: { width: (this.paperRight - this.paperLeft) - 10 },
            align: 'center',
            lineSpacing: 2
        }).setOrigin(0.5, 0).setResolution(10);
        this.container.add(this.questionText);

        // Answer line
        this.answerText = this.scene.add.text((this.paperLeft + this.paperRight) / 2, this.paperTop + 46, '', {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '7px',
            color: '#003366',
            wordWrap: { width: (this.paperRight - this.paperLeft) - 10 },
            align: 'center'
        }).setOrigin(0.5, 0).setResolution(10);
        this.container.add(this.answerText);

        // Erase button
        this.eraseBtn = this.scene.add.text(this.paperRight - 25, this.paperTop + 46, '←', {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '7px',
            color: '#cc0000'
        }).setOrigin(0.5, 0).setResolution(10).setInteractive({ useHandCursor: true });
        this.eraseBtn.on('pointerdown', () => {
            this._queueInput({ type: 'erase' });
        });
        this.eraseBtn.on('pointerover', () => {
            this.eraseBtn.setColor('#ff3333');
        });
        this.eraseBtn.on('pointerout', () => {
            this.eraseBtn.setColor('#cc0000');
        });
        this.eraseBtn.setVisible(false);
        this.container.add(this.eraseBtn);

        // Thought bubble container (initially hidden)
        this.thoughtBubbleContainer = this.scene.add.container(0, 0);
        this.thoughtBubbleContainer.setVisible(false);
        this.container.add(this.thoughtBubbleContainer);

        // Add thought bubble image
        this.thoughtBubbleImg = this.scene.add.image(this.paperLeft - 50, this.paperBottom + 18, 'thoughtbubble');
        this.thoughtBubbleImg.setOrigin(0, 1);
        this.thoughtBubbleContainer.add(this.thoughtBubbleImg);

        // Add thought bubble text
        this.thoughtText = this.scene.add.text(this.paperLeft - 40, this.paperBottom - 16, '', {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '6px',
            color: '#1a1a2e',
            wordWrap: { width: 45 },
            align: 'left',
            lineSpacing: 1
        }).setOrigin(0, 0.5).setResolution(10);
        this.thoughtBubbleContainer.add(this.thoughtText);

        // Bind input
        this._keyHandler = (evt) => {
            if (this.isFinished) {
                if (evt.code === 'Space') this.close();
                return;
            }

            // Block ESC during exam
            if (evt.code === 'Escape') {
                evt.preventDefault();
                return;
            }

            // Backspace to erase
            if (evt.code === 'Backspace') {
                evt.preventDefault();
                this._queueInput({ type: 'erase' });
                return;
            }

            // Next / Prev navigation
            if (evt.code === 'Space' || evt.code === 'KeyD' || evt.code === 'ArrowRight' || evt.code === 'Enter') {
                evt.preventDefault();
                if (!this.isTypingWord && !this.isErasing) {
                    this._goNext();
                }
                return;
            }
            if (evt.code === 'KeyA' || evt.code === 'ArrowLeft') {
                evt.preventDefault();
                if (!this.isTypingWord && !this.isErasing) {
                    this._goPrev();
                }
                return;
            }

            // Number keys 1-6 for word selection
            const keyMap = { 'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3, 'Digit5': 4, 'Digit6': 5 };
            if (keyMap[evt.code] !== undefined) {
                evt.preventDefault();
                if (this.pencilActive) {
                    this._flashNoPencil();
                    return;
                }
                this._queueInput({ type: 'select', index: keyMap[evt.code] });
            }
        };
        this.scene.input.keyboard.on('keydown', this._keyHandler);

        // Start timer
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            repeat: -1,
            callback: () => {
                if (this.isFinished) return;
                this.timeRemaining--;
                this._updateTimer();
                if (this.timeRemaining <= 0) {
                    this._finishExam();
                }
            }
        });

        // Schedule first pencil
        this._schedulePencil();

        // Show first question
        this._showQuestion();

        if (!Game.state.hasSlept) {
            this.scene.time.delayedCall(1000, () => {
                if (this.isOpen && !this.isFinished) {
                    this._showThought("I really should have slept...", 3000);
                }
            });
        }
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.scene.isExamOpen = false;

        if (this._keyHandler) {
            this.scene.input.keyboard.off('keydown', this._keyHandler);
            this._keyHandler = null;
        }

        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = null;
        }

        if (this.typeTimer) {
            this.typeTimer.remove();
            this.typeTimer = null;
        }

        if (this.thoughtTimer) {
            this.thoughtTimer.remove();
            this.thoughtTimer = null;
        }

        if (this.thoughtHideTimer) {
            this.thoughtHideTimer.remove();
            this.thoughtHideTimer = null;
        }

        this._destroyPencil();

        if (this.pencilTimer) {
            this.pencilTimer.remove();
            this.pencilTimer = null;
        }

        if (this.container) {
            this.container.destroy();
            this.container = null;
        }

        this.wordButtons = [];
        this.navButtons = [];
        this.questionText = null;
        this.answerText = null;
        this.timerText = null;
        this.progressText = null;
        this.bgImg = null;

        if (this.thoughtBubbleContainer) {
            this.thoughtBubbleContainer.destroy();
            this.thoughtBubbleContainer = null;
        }
        this.thoughtBubbleImg = null;
        this.thoughtText = null;

        if (this.eraseBtn) {
            this.eraseBtn.destroy();
            this.eraseBtn = null;
        }

        this._clearBlur();
    }

    _showThought(phrase, hideAfter = 0) {
        if (!this.thoughtBubbleContainer || !this.thoughtText) return;

        this.container.bringToTop(this.thoughtBubbleContainer);
        this.thoughtBubbleContainer.setVisible(true);
        this.thoughtText.setText('');

        if (this.thoughtTimer) this.thoughtTimer.remove();
        if (this.thoughtHideTimer) this.thoughtHideTimer.remove();

        let charIdx = 0;
        this.thoughtTimer = this.scene.time.addEvent({
            delay: 30,
            repeat: phrase.length - 1,
            callback: () => {
                charIdx++;
                if (this.thoughtText) {
                    this.thoughtText.setText(phrase.substring(0, charIdx));
                }
                if (charIdx === phrase.length && hideAfter > 0) {
                    this.thoughtHideTimer = this.scene.time.delayedCall(hideAfter, () => {
                        if (this.thoughtBubbleContainer) {
                            this.thoughtBubbleContainer.setVisible(false);
                        }
                    });
                }
            }
        });
    }

    _scheduleBlur() {
        if (this.isFinished || !this.isOpen) return;
        const delay = 5000 + Math.random() * 10000; // 5-15 seconds
        this.blurTimer = this.scene.time.addEvent({
            delay: delay,
            callback: () => {
                if (this.isFinished || !this.isOpen) return;

                // First, less intense blur
                if (this.scene.sys && this.scene.sys.game && this.scene.sys.game.canvas) {
                    this.scene.sys.game.canvas.style.transition = 'filter 3s ease-in-out';
                    this.scene.sys.game.canvas.style.filter = 'blur(1px) brightness(0.8)';
                }

                // Second, more intense blur
                this.blurIntenseTimer = this.scene.time.delayedCall(3000, () => {
                    if (this.isFinished || !this.isOpen) return;
                    if (this.scene.sys && this.scene.sys.game && this.scene.sys.game.canvas) {
                        this.scene.sys.game.canvas.style.transition = 'filter 1.5s ease-in';
                        this.scene.sys.game.canvas.style.filter = 'blur(5px) brightness(0.3)';
                    }
                });

                // Remove blur after shorter time
                this.blurEndTimer = this.scene.time.delayedCall(3600 + Math.random() * 1000, () => {
                    this._clearBlur();
                    if (!this.isFinished && this.isOpen) {
                        this._scheduleBlur();
                    }
                });
            }
        });
    }

    _clearBlur(fast = false) {
        if (this.blurTimer) {
            this.blurTimer.remove();
            this.blurTimer = null;
        }
        if (this.blurIntenseTimer) {
            this.blurIntenseTimer.remove();
            this.blurIntenseTimer = null;
        }
        if (this.blurEndTimer) {
            this.blurEndTimer.remove();
            this.blurEndTimer = null;
        }
        if (this.scene.sys && this.scene.sys.game && this.scene.sys.game.canvas) {
            const canvas = this.scene.sys.game.canvas;
            if (fast) {
                canvas.style.transition = 'filter 0.3s ease';
            }
            canvas.style.filter = 'none';
            // Re-apply game scene's drunk effect if it exists
            if (this.scene.updateDrunkEffect) {
                this.scene.updateDrunkEffect();
            }

            // Remove transition after it finishes
            setTimeout(() => {
                if (this.scene.sys && this.scene.sys.game && this.scene.sys.game.canvas) {
                    this.scene.sys.game.canvas.style.transition = '';
                }
            }, fast ? 300 : 2000);
        }
    }

    update(time, delta) {
        if (!this.isOpen || this.isFinished) return;

        // Handle pencil spawning via elapsed time
        if (!this.pencilActive && this.nextPencilTime > 0 && time >= this.nextPencilTime) {
            this._spawnPencil();
        }
        if (this.pencilActive && this.pencilSprite) {
            this.pencilSprite.y -= this.pencilSpeed * (delta / 16.67); // Faster upward movement with variance
            this.pencilSprite.x += this.pencilDriftX * (delta / 16.67);

            // Sideways bounce oscillation
            this.pencilBouncePhase = (this.pencilBouncePhase || 0) + delta * (this.pencilBounceSpeed || 0.003);
            this.pencilSprite.x += Math.sin(this.pencilBouncePhase) * (this.pencilBounceAmp || 0.15);

            // Check if off screen (top)
            if (this.pencilSprite.y < this.paperTop - 20) {
                // Missed! -15 seconds
                this.timeRemaining -= 15;
                if (this.timeRemaining < 0) this.timeRemaining = 0;
                this._updateTimer();

                // Flash timer text red briefly for feedback
                if (this.timerText) {
                    this.timerText.setColor('#cc0000');
                    this.scene.time.delayedCall(400, () => {
                        if (this.timerText && this.timeRemaining > 30) this.timerText.setColor('#1a1a2e');
                    });
                }

                this._destroyPencil();
                this._schedulePencil();
            }
        }
    }

    _formatAnswerLine(q, state) {
        const parts = [];
        for (let i = 0; i < q.answer.length; i++) {
            if (i < state.selectedWords.length) {
                parts.push(q.words[state.selectedWords[i]]);
            } else {
                parts.push('___');
            }
        }
        return parts.join(' ');
    }

    _updateEraseButtonPosition() {
        if (!this.eraseBtn || !this.answerText) return;
        const centerX = (this.paperLeft + this.paperRight) / 2;
        // The text width might have trailing spaces depending on '___', but width gives the bounding box
        this.eraseBtn.x = centerX + (this.answerText.width / 2) + 6; // 6px padding to the right
        this.eraseBtn.y = this.answerText.y;
    }

    _showQuestion() {
        if (this.currentQuestion >= this.activeQuestions.length) {
            this._finishExam();
            return;
        }

        const q = this.activeQuestions[this.currentQuestion];
        const state = this.questionStates[this.currentQuestion];

        if (this.questionText) {
            this.questionText.setText(q.question);
        }

        if (this.answerText) {
            if (this.questionText) {
                this.answerText.y = this.questionText.y + this.questionText.height + 10;
            }
            this.answerText.setText(this._formatAnswerLine(q, state));
            this.answerText.setColor('#003366');
            this._updateEraseButtonPosition();
        }

        if (this.progressText) {
            this.progressText.setText(`Q ${this.currentQuestion + 1}/10`);
        }

        this._renderWordButtons();
        this._renderNavButtons();

        // Ensure pencil and thought bubble stay on top of the newly rendered buttons
        if (this.pencilActive && this.pencilSprite) {
            this.container.bringToTop(this.pencilSprite);
        }
        if (this.thoughtBubbleContainer) {
            this.container.bringToTop(this.thoughtBubbleContainer);
        }
    }

    _renderNavButtons() {
        this.navButtons.forEach(b => {
            if (b.bg) b.bg.destroy();
            if (b.label) b.label.destroy();
        });
        this.navButtons = [];

        const btnW = 40;
        const btnH = 12;
        const y = this.paperBottom - 10;

        // Prev Button
        if (this.currentQuestion > 0) {
            const x = this.paperLeft + 25;
            const bg = this.scene.add.rectangle(x, y, btnW, btnH, 0xe8e0d0).setOrigin(0.5, 0.5).setStrokeStyle(1, 0x886644);
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => this._goPrev());
            bg.on('pointerover', () => bg.setFillStyle(0xd8d0c0));
            bg.on('pointerout', () => bg.setFillStyle(0xe8e0d0));

            const label = this.scene.add.text(x, y, '< Prev', {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '5px',
                color: '#1a1a2e'
            }).setOrigin(0.5, 0.5).setResolution(10);

            this.container.add(bg);
            this.container.add(label);
            this.navButtons.push({ bg, label });
        }

        // Next / Finish Button
        const x = this.paperRight - 25;
        const isLast = this.currentQuestion === this.activeQuestions.length - 1;
        const text = isLast ? 'Finish' : 'Next >';
        const color = isLast ? 0xccffcc : 0xe8e0d0;
        const hoverColor = isLast ? 0x99ee99 : 0xd8d0c0;
        const strokeColor = isLast ? 0x008800 : 0x886644;

        const bg = this.scene.add.rectangle(x, y, btnW, btnH, color).setOrigin(0.5, 0.5).setStrokeStyle(1, strokeColor);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this._goNext());
        bg.on('pointerover', () => bg.setFillStyle(hoverColor));
        bg.on('pointerout', () => bg.setFillStyle(color));

        const label = this.scene.add.text(x, y, text, {
            fontFamily: "'Pokemon Classic', 'Courier New', monospace",
            fontSize: '5px',
            color: '#1a1a2e'
        }).setOrigin(0.5, 0.5).setResolution(10);

        this.container.add(bg);
        this.container.add(label);
        this.navButtons.push({ bg, label });
    }

    _goPrev() {
        if (this.isTypingWord || this.isErasing) return;
        this.inputQueue = [];
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this._showQuestion();
        }
    }

    _goNext() {
        if (this.isTypingWord || this.isErasing) return;
        this.inputQueue = [];
        if (this.currentQuestion < this.activeQuestions.length - 1) {
            this.currentQuestion++;
            this._showQuestion();
        } else {
            this._finishExam();
        }
    }

    _renderWordButtons() {
        // Destroy old buttons
        this.wordButtons.forEach(b => {
            if (b.bg) b.bg.destroy();
            if (b.label) b.label.destroy();
            if (b.numLabel) b.numLabel.destroy();
        });
        this.wordButtons = [];

        const q = this.activeQuestions[this.currentQuestion];
        if (!q) return;

        const state = this.questionStates[this.currentQuestion];

        if (this.eraseBtn) {
            this.eraseBtn.setVisible(state.selectedWords.length > 0);
        }

        const cols = 3;
        const btnW = 50;
        const btnH = 14;
        const spacingX = 4;
        const spacingY = 5;
        const startX = (this.paperLeft + this.paperRight) / 2 - ((cols * (btnW + spacingX) - spacingX) / 2);
        const startY = this.answerText ? this.answerText.y + 24 : this.paperTop + 76;

        q.words.forEach((word, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (btnW + spacingX);
            const y = startY + row * (btnH + spacingY);

            const isUsed = state.selectedWords.includes(i);

            const bg = this.scene.add.rectangle(x + btnW / 2, y + btnH / 2, btnW, btnH,
                isUsed ? 0xcccccc : 0xe8e0d0
            ).setOrigin(0.5, 0.5).setStrokeStyle(1, isUsed ? 0x999999 : 0x886644);

            if (!isUsed) {
                bg.setInteractive({ useHandCursor: true });
                bg.on('pointerdown', () => {
                    if (this.pencilActive) {
                        this._flashNoPencil();
                        return;
                    }
                    this._queueInput({ type: 'select', index: i });
                });
                bg.on('pointerover', () => {
                    if (!isUsed) bg.setFillStyle(0xd8d0c0);
                });
                bg.on('pointerout', () => {
                    if (!isUsed) bg.setFillStyle(0xe8e0d0);
                });
            }

            const numLabel = this.scene.add.text(x + 3, y + btnH / 2, `${i + 1}`, {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '5px',
                color: isUsed ? '#999999' : '#886644'
            }).setOrigin(0, 0.5).setResolution(10);

            const label = this.scene.add.text(x + btnW / 2 + 4, y + btnH / 2, word, {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '5px',
                color: isUsed ? '#999999' : '#1a1a2e'
            }).setOrigin(0.5, 0.5).setResolution(10);

            this.container.add(bg);
            this.container.add(numLabel);
            this.container.add(label);
            this.wordButtons.push({ bg, label, numLabel, index: i });
        });

        // Ensure pencil and thought bubble stay on top of the newly rendered buttons
        if (this.pencilActive && this.pencilSprite) {
            this.container.bringToTop(this.pencilSprite);
        }
        if (this.thoughtBubbleContainer) {
            this.container.bringToTop(this.thoughtBubbleContainer);
        }
    }

    _flashNoPencil() {
        // Flash all word button borders and backgrounds red to indicate missing pencil
        this.wordButtons.forEach(b => {
            if (b.bg) {
                b.bg.setStrokeStyle(1, 0xcc0000);
                b.bg.setFillStyle(0xffcccc);
            }
        });

        // Return to normal color after a short delay
        this.scene.time.delayedCall(550, () => {
            const state = this.questionStates[this.currentQuestion];
            this.wordButtons.forEach(b => {
                if (b.bg) {
                    const isUsed = state.selectedWords.includes(b.index);
                    b.bg.setStrokeStyle(1, isUsed ? 0x999999 : 0x886644);
                    b.bg.setFillStyle(isUsed ? 0xcccccc : 0xe8e0d0);
                }
            });
        });
    }

    _queueInput(action) {
        if (this.isTypingWord || this.isErasing) {
            // Buffer inputs if already animating
            this.inputQueue.push(action);
        } else {
            this._processInput(action);
        }
    }

    _processInput(action) {
        if (action.type === 'select') {
            this._selectWord(action.index);
        } else if (action.type === 'erase') {
            this._eraseLastWord();
        }
    }

    _processQueue() {
        if (this.inputQueue.length > 0 && !this.isTypingWord && !this.isErasing) {
            const nextAction = this.inputQueue[0];
            if (nextAction.type === 'erase' || !this.pencilActive) {
                const action = this.inputQueue.shift();
                this._processInput(action);
            }
        }
    }

    _selectWord(wordIndex) {
        const q = this.activeQuestions[this.currentQuestion];
        const state = this.questionStates[this.currentQuestion];

        if (!q || wordIndex >= q.words.length) {
            this._processQueue();
            return;
        }

        // Count how many times this word is already queued so we don't over-select
        const queuedSelects = this.inputQueue.filter(a => a.type === 'select').length;
        const queuedErases = this.inputQueue.filter(a => a.type === 'erase').length;
        const netQueued = queuedSelects - queuedErases;

        if (state.selectedWords.includes(wordIndex)) {
            this._processQueue();
            return; // Already used
        }
        if (state.selectedWords.length >= q.answer.length) {
            this._processQueue();
            return; // Answer is full
        }

        state.selectedWords.push(wordIndex);
        this._renderWordButtons();

        // Type the word with animation
        const word = q.words[wordIndex];
        const currentAnswerState = this._formatAnswerLine(q, { selectedWords: state.selectedWords.slice(0, -1) });
        // The word will replace the first "___"
        const replaceIdx = currentAnswerState.indexOf('___');
        const prefixText = currentAnswerState.substring(0, replaceIdx);
        const suffixText = currentAnswerState.substring(replaceIdx + 3);

        this.isTypingWord = true;
        let charIndex = 0;

        this.typeTimer = this.scene.time.addEvent({
            delay: 35,
            repeat: word.length - 1,
            callback: () => {
                charIndex++;
                const partialWord = word.substring(0, charIndex) + '_'.repeat(Math.max(0, 3 - charIndex));
                this.answerText.setText(prefixText + partialWord + suffixText);
                this._updateEraseButtonPosition();

                if (charIndex >= word.length) {
                    this.answerText.setText(this._formatAnswerLine(q, state));
                    this._updateEraseButtonPosition();
                    this.isTypingWord = false;
                    this._processQueue();
                }
            }
        });
    }

    _eraseLastWord() {
        const state = this.questionStates[this.currentQuestion];
        if (state.selectedWords.length === 0) {
            this._processQueue();
            return;
        }

        const q = this.activeQuestions[this.currentQuestion];
        const removedIdx = state.selectedWords.pop();
        const wordToErase = q.words[removedIdx];

        this._renderWordButtons();

        // Animate erasing character by character (slower)
        this.isErasing = true;

        const answerTextWithWord = this._formatAnswerLine(q, { selectedWords: [...state.selectedWords, removedIdx] });
        const targetText = this._formatAnswerLine(q, state);

        // Find where the word is located to erase it
        let currentString = answerTextWithWord;
        let charsToRemove = wordToErase.length;

        this.typeTimer = this.scene.time.addEvent({
            delay: 55, // Slower than typing
            repeat: charsToRemove - 1,
            callback: () => {
                // To simulate erase, we find the word and chop it back character by character
                // and replace the chopped part with underscores to eventually form "___"
                charsToRemove--;
                const choppedWord = wordToErase.substring(0, charsToRemove) + '_'.repeat(Math.max(0, 3 - charsToRemove));

                // Construct the string with the partially erased word
                const parts = [];
                for (let i = 0; i < q.answer.length; i++) {
                    if (i < state.selectedWords.length) {
                        parts.push(q.words[state.selectedWords[i]]);
                    } else if (i === state.selectedWords.length) {
                        parts.push(choppedWord);
                    } else {
                        parts.push('___');
                    }
                }

                this.answerText.setText(parts.join(' '));
                this._updateEraseButtonPosition();

                if (charsToRemove <= 0) {
                    this.answerText.setText(targetText);
                    this._updateEraseButtonPosition();
                    this.isErasing = false;
                    this._processQueue();
                }
            }
        });
    }

    _updateTimer() {
        if (!this.timerText) return;
        const mins = Math.floor(Math.max(0, this.timeRemaining) / 60);
        const secs = Math.max(0, this.timeRemaining) % 60;
        this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

        // Flash red when low on time
        if (this.timeRemaining <= 30) {
            this.timerText.setColor('#cc0000');
        }
    }

    _schedulePencil() {
        // Schedule next pencil spawn 8-12 seconds from now
        const delay = 8000 + Math.random() * 4000;
        this.nextPencilTime = this.scene.time.now + delay;
    }

    _spawnPencil() {
        if (this.pencilActive || this.isFinished) return;

        this.pencilActive = true;
        this.pencilSpeed = 0.8 + Math.random() * 1.5; // Variance in speed
        this.nextPencilTime = 0;

        // Spawn at bottom of paper area with random X
        const spawnX = this.paperLeft + 20 + Math.random() * (this.paperRight - this.paperLeft - 65);
        const spawnY = this.paperBottom + 5;

        // If the vision is currently blurred, the pencil spawning clears it quickly!
        if (this.blurEndTimer) {
            this._clearBlur(true);
            if (!this.isFinished && this.isOpen) {
                this._scheduleBlur();
            }
        }

        this.pencilSprite = this.scene.add.sprite(spawnX, spawnY, 'pencil');
        this.pencilSprite.setOrigin(0.5, 0.5);
        this.pencilSprite.play('pencil-spin');
        this.pencilSprite.setInteractive({ useHandCursor: true });

        // Random drift: wider range for more deviation
        this.pencilDriftX = (Math.random() * 0.8) - 0.4;

        // Random bounce characteristics
        this.pencilBouncePhase = Math.random() * Math.PI * 2;
        this.pencilBounceSpeed = 0.002 + Math.random() * 0.005; // Different speeds
        this.pencilBounceAmp = 0.2 + Math.random() * 0.6; // Different amplitudes

        this.pencilSprite.on('pointerdown', () => {
            this._catchPencil();
        });

        this.container.add(this.pencilSprite);

        const phrases = ["My pencil!", "Oh shit!", "My hands are shaking!"];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        this._showThought(phrase);
    }

    _catchPencil() {
        if (!this.pencilActive || !this.pencilSprite) return;

        // Small pop effect
        this.scene.tweens.add({
            targets: this.pencilSprite,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this._destroyPencil();
                this._schedulePencil();
            }
        });

        this.pencilActive = false; // Re-enable typing immediately
    }

    _destroyPencil() {
        this.pencilActive = false;
        if (this.pencilSprite) {
            this.pencilSprite.destroy();
            this.pencilSprite = null;
        }

        if (this.thoughtBubbleContainer) {
            this.thoughtBubbleContainer.setVisible(false);
        }
        if (this.thoughtTimer) {
            this.thoughtTimer.remove();
            this.thoughtTimer = null;
        }
        if (this.thoughtHideTimer) {
            this.thoughtHideTimer.remove();
            this.thoughtHideTimer = null;
        }
    }

    _finishExam() {
        this.isFinished = true;

        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = null;
        }

        this._destroyPencil();
        this._clearBlur();

        // Clear question UI
        if (this.questionText) this.questionText.setText('');
        if (this.answerText) this.answerText.setText('');
        if (this.eraseBtn) this.eraseBtn.setVisible(false);
        this.wordButtons.forEach(b => {
            if (b.bg) b.bg.destroy();
            if (b.label) b.label.destroy();
            if (b.numLabel) b.numLabel.destroy();
        });
        this.wordButtons = [];
        this.navButtons.forEach(b => {
            if (b.bg) b.bg.destroy();
            if (b.label) b.label.destroy();
        });
        this.navButtons = [];

        // Calculate final score
        let finalScore = 0;
        this.questionStates.forEach((state, idx) => {
            const q = this.activeQuestions[idx];
            if (state.selectedWords.length === q.answer.length) {
                const selectedWordTexts = state.selectedWords.map(i => q.words[i]);
                const isCorrect = q.answer.every((word, i) => selectedWordTexts[i] === word);
                if (isCorrect) finalScore += 10;
            }
        });

        const passed = finalScore >= 50;

        // Result text
        const resultText = this.scene.add.text(
            (this.paperLeft + this.paperRight) / 2,
            (this.paperTop + this.paperBottom) / 2 - 15,
            passed ? 'PASSED!' : 'FAILED',
            {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '10px',
                color: passed ? '#006600' : '#cc0000',
                align: 'center'
            }
        ).setOrigin(0.5, 0.5).setResolution(10);
        this.container.add(resultText);

        const scoreResult = this.scene.add.text(
            (this.paperLeft + this.paperRight) / 2,
            (this.paperTop + this.paperBottom) / 2 + 5,
            `Score: ${finalScore}/100`,
            {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '7px',
                color: '#1a1a2e',
                align: 'center'
            }
        ).setOrigin(0.5, 0.5).setResolution(10);
        this.container.add(scoreResult);

        const continueText = this.scene.add.text(
            (this.paperLeft + this.paperRight) / 2,
            (this.paperTop + this.paperBottom) / 2 + 22,
            'Press SPACE to continue',
            {
                fontFamily: "'Pokemon Classic', 'Courier New', monospace",
                fontSize: '5px',
                color: '#555566',
                align: 'center'
            }
        ).setOrigin(0.5, 0.5).setResolution(10);
        this.container.add(continueText);

        // Store result in game state
        Game.state = Game.state || {};
        Game.state.examScore = finalScore;
        Game.state.examPassed = passed;

        // Open exit door at tile 1,7
        if (this.scene.tileData && this.scene.tileData[7]) {
            this.scene.tileData[7][1] = 2695;
            if (this.scene.layer) {
                this.scene.layer.putTileAt(2695, 1, 7);
            }
        }
    }
};
