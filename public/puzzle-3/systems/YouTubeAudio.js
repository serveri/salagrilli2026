// YouTubeAudio: Manages background music playback via YouTube IFrame API (ECWwpmP3spY)
window.Game = window.Game || {};

window.YTManager = {
    player: null,
    isReady: false,
    isPlaying: false,
    isPendingPlay: false,
    checkInterval: null,
    volume: 80,
    startTime: 5,
    endTime: 175,
    onEndCallback: null,

    init() {
        if (this._inited) return;

        if (!document.body) {
            if (!this._domListenerAdded) {
                this._domListenerAdded = true;
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => this.init());
                } else {
                    window.addEventListener('load', () => this.init());
                }
            }
            return;
        }

        this._inited = true;

        if (!document.getElementById('yt-player-container')) {
            const container = document.createElement('div');
            container.id = 'yt-player-container';
            container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:320px;height:180px;overflow:hidden;pointer-events:none;opacity:0.001;z-index:-9999;';
            const playerDiv = document.createElement('div');
            playerDiv.id = 'yt-player';
            container.appendChild(playerDiv);
            document.body.appendChild(container);
        }

        const createPlayer = () => {
            if (window.YTManager.player) return;
            const originStr = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : undefined;
            window.YTManager.player = new YT.Player('yt-player', {
                height: '180',
                width: '320',
                videoId: 'ECWwpmP3spY',
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    rel: 0,
                    modestbranding: 1,
                    enablejsapi: 1,
                    origin: originStr,
                    start: 5
                },
                events: {
                    onReady: (event) => {
                        window.YTManager.isReady = true;
                        try {
                            event.target.unMute();
                            if (window.YTManager.volume !== undefined) {
                                event.target.setVolume(window.YTManager.volume);
                            }
                        } catch (e) {}
                        if (window.YTManager.isPendingPlay) {
                            window.YTManager.play(window.YTManager.volume);
                        }
                    },
                    onStateChange: (event) => {
                        if (event.data === YT.PlayerState.PLAYING) {
                            window.YTManager.isPlaying = true;
                            window.YTManager.isPendingPlay = false;
                            window.YTManager._startCheckInterval();
                        } else if (event.data === YT.PlayerState.PAUSED) {
                            if (!window.YTManager.isPendingPlay) {
                                window.YTManager.isPlaying = false;
                                window.YTManager._stopCheckInterval();
                            }
                        } else if (event.data === YT.PlayerState.ENDED) {
                            window.YTManager.isPlaying = false;
                            window.YTManager.isPendingPlay = false;
                            window.YTManager._stopCheckInterval();
                            if (window.YTManager.onEndCallback) {
                                window.YTManager.onEndCallback();
                            }
                        }
                    }
                }
            });
        };

        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
            window.onYouTubeIframeAPIReady = () => {
                createPlayer();
            };
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                const firstScriptTag = document.getElementsByTagName('script')[0];
                if (firstScriptTag && firstScriptTag.parentNode) {
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                } else {
                    document.head.appendChild(tag);
                }
            }
        }
    },

    _startCheckInterval() {
        this._stopCheckInterval();
        this.checkInterval = setInterval(() => {
            if (this.player && typeof this.player.getCurrentTime === 'function') {
                const currentTime = this.player.getCurrentTime();
                if (currentTime >= this.endTime) {
                    this.player.seekTo(this.startTime, true);
                }
            }
        }, 200);
    },

    _stopCheckInterval() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    },

    play(volPercent) {
        this.init();
        this.isPendingPlay = true;
        this.isPlaying = true;
        if (volPercent !== undefined) {
            this.volume = volPercent;
        }

        if (this.player && typeof this.player.playVideo === 'function') {
            try {
                if (typeof this.player.unMute === 'function') {
                    this.player.unMute();
                }
                if (typeof this.player.setVolume === 'function' && this.volume !== undefined) {
                    this.player.setVolume(this.volume);
                }
                const cur = (typeof this.player.getCurrentTime === 'function') ? this.player.getCurrentTime() : 0;
                if (cur < this.startTime || cur >= this.endTime) {
                    this.player.seekTo(this.startTime, true);
                }
                this.player.playVideo();
            } catch (e) {
                console.warn('YouTube playVideo error:', e);
            }
        }
    },

    pause() {
        this.isPendingPlay = false;
        this.isPlaying = false;
        if (this.player && typeof this.player.pauseVideo === 'function') {
            try { this.player.pauseVideo(); } catch (e) {}
        }
        this._stopCheckInterval();
    },

    stop() {
        this.isPendingPlay = false;
        this.isPlaying = false;
        if (this.player && typeof this.player.pauseVideo === 'function') {
            try {
                this.player.pauseVideo();
                if (typeof this.player.seekTo === 'function') {
                    this.player.seekTo(this.startTime, true);
                }
            } catch (e) {}
        }
        this._stopCheckInterval();
    },

    setVolume(volPercent) {
        this.volume = volPercent;
        if (this.player && typeof this.player.setVolume === 'function') {
            try { this.player.setVolume(volPercent); } catch (e) {}
        }
    }
};

window.YTManager.init();
