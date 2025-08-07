class UIManager {
    constructor(playerInstance) {
        this.player = playerInstance;
        
        this.quotes = [
            "Music speaks where words fail.",
            "Welcome to AniXDex - Your Musical Universe.",
            "Discover music that moves your soul.",
            "Every song has a story to tell.",
            "Find your rhythm with AniXDex.",
            "Powered by JioSaavn API 🎵"
        ];
        this.quoteIndex = 0;

        // Player refs
        this.playerOverlay = document.getElementById('playerOverlay');
        this.overlayPlayerImage = document.getElementById('overlayPlayerImage');
        this.overlayTrackName = document.getElementById('overlayTrackName');
        this.overlayTrackArtist = document.getElementById('overlayTrackArtist');
        this.overlayPlayBtn = document.getElementById('overlayPlayBtn');
        this.overlayPrevBtn = document.getElementById('overlayPrevBtn');
        this.overlayNextBtn = document.getElementById('overlayNextBtn');
        this.overlaySeekBar = document.getElementById('overlaySeekBar');
        this.overlayProgressFill = document.getElementById('overlayProgressFill');
        this.overlayProgressHandle = document.getElementById('overlayProgressHandle');
        this.overlayCurrentTime = document.getElementById('overlayCurrentTime');
        this.overlayTotalTime = document.getElementById('overlayTotalTime');
        this.closeOverlayBtn = document.getElementById('closeOverlayBtn');
        this.visualizerContainer = document.getElementById('visualizerContainer');

        this.setupUIEvents();
        this.startQuotes();
    }

    setupUIEvents() {
        // Sidebar navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                this.showPage(e.target.closest('.nav-link').dataset.page);
            });
        });

        // Bottom bar click to toggle overlay
        if (this.player.playerBar) {
            this.player.playerBar.addEventListener('click', e => {
                if (e.target.closest('.control-btn') || 
                    e.target.closest('.volume-controls') || 
                    e.target.closest('input')) return;
                this.togglePlayerOverlay();
            });
        }

        // Overlay controls
        if (this.closeOverlayBtn) {
            this.closeOverlayBtn.addEventListener('click', () => this.hidePlayerOverlay());
        }
        if (this.overlayPlayBtn) {
            this.overlayPlayBtn.addEventListener('click', () => this.player.audioPlayer.togglePlay());
        }
        if (this.overlayPrevBtn) {
            this.overlayPrevBtn.addEventListener('click', () => this.player.audioPlayer.previous());
        }
        if (this.overlayNextBtn) {
            this.overlayNextBtn.addEventListener('click', () => this.player.audioPlayer.next());
        }

        // Overlay seek bar
        if (this.overlaySeekBar) {
            this.overlaySeekBar.addEventListener('input', () => {
                const audio = this.player.audioPlayer.audioElement;
                if (audio.duration) {
                    audio.currentTime = (this.overlaySeekBar.value / 100) * audio.duration;
                }
            });
        }

        // Responsive
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => 
            setTimeout(() => this.handleResize(), 200)
        );
    }

    showPage(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        document.querySelectorAll('.page').forEach(pageEl => {
            pageEl.classList.toggle('hidden', pageEl.id !== `${page}Page`);
        });

        if (page === 'search') this.player.search.showSearchPlaceholder();
        else if (page === 'library') this.player.library.loadUserLibrary();
    }

    showPlayer() {
        if (!this.player.playerBar) return;
        this.player.playerBar.classList.remove('hidden');
        this.player.playerBar.classList.add('show-mobile');
        document.querySelector('.app-grid')?.classList.remove('no-player');

        if (window.innerWidth <= 768) {
            this.player.playerBar.style.display = 'grid';
            this.player.playerBar.style.transform = 'translateY(0)';
            this.player.playerBar.style.opacity = '1';
        }
    }

    hidePlayer() {
        if (!this.player.playerBar) return;
        this.player.playerBar.classList.add('hidden');
        this.player.playerBar.classList.remove('show-mobile');
        document.querySelector('.app-grid')?.classList.add('no-player');
    }

    handleResize() {
        if (this.player.audioPlayer.currentSong && this.player.playerBar) {
            setTimeout(() => this.showPlayer(), 100);
        }
    }

    startQuotes() {
        if (!this.player.dynamicQuote) return;

        setInterval(() => {
            this.player.dynamicQuote.style.opacity = '0';
            setTimeout(() => {
                this.quoteIndex = (this.quoteIndex + 1) % this.quotes.length;
                this.player.dynamicQuote.textContent = this.quotes[this.quoteIndex];
                this.player.dynamicQuote.style.opacity = '1';
            }, 300);
        }, 5000);
    }

    // Overlay methods
    togglePlayerOverlay() {
        if (this.playerOverlay.classList.contains('active')) {
            this.hidePlayerOverlay();
        } else {
            this.showPlayerOverlay();
        }
    }

    showPlayerOverlay() {
        this.syncOverlay();
        this.playerOverlay.classList.add('active');
        
        if (this.player.playerBar) {
            this.player.playerBar.classList.add('overlay-hidden');
        }
    }

    hidePlayerOverlay() {
        this.playerOverlay.classList.remove('active');
        
        if (this.player.playerBar) {
            this.player.playerBar.classList.remove('overlay-hidden');
        }
    }

    syncOverlay() {
        const song = this.player.audioPlayer.currentSong;
        if (!song) return;

        // Update track info
        if (this.overlayPlayerImage) {
            this.overlayPlayerImage.src = this.player.utils.getImage(song.image);
            this.overlayPlayerImage.onerror = () => {
                this.overlayPlayerImage.src = this.player.utils.getDefaultImage();
            };
        }
        
        if (this.overlayTrackName) {
            this.overlayTrackName.textContent = song.name || 'Unknown Track';
        }

        let artistText = 'Unknown Artist';
        if (song.primaryArtists) {
            artistText = song.primaryArtists;
        } else if (song.artists && song.artists.primary) {
            artistText = song.artists.primary.map(a => a.name).join(', ');
        } else if (song.artist) {
            artistText = song.artist;
        }
        
        if (this.overlayTrackArtist) {
            this.overlayTrackArtist.textContent = artistText;
        }

        // Update play button
        if (this.overlayPlayBtn) {
            const icon = this.overlayPlayBtn.querySelector('.material-icons');
            if (icon) icon.textContent = this.player.audioPlayer.isPlaying ? 'pause' : 'play_arrow';
        }

        this.updateOverlayProgress();
        this.showSimpleVisualizer();
    }

    updateOverlayProgress() {
        const audio = this.player.audioPlayer.audioElement;
        if (!audio.duration) return;

        const progress = (audio.currentTime / audio.duration) * 100;
        
        if (this.overlaySeekBar) this.overlaySeekBar.value = progress;
        if (this.overlayProgressFill) this.overlayProgressFill.style.width = `${progress}%`;
        if (this.overlayProgressHandle) this.overlayProgressHandle.style.left = `${progress}%`;
        if (this.overlayCurrentTime) this.overlayCurrentTime.textContent = this.player.utils.formatTime(audio.currentTime);
        if (this.overlayTotalTime) this.overlayTotalTime.textContent = this.player.utils.formatTime(audio.duration);
    }

    showSimpleVisualizer() {
        if (!this.visualizerContainer) return;

        const song = this.player.audioPlayer.currentSong;
        if (!song) return;

        // Simple, clean display
        this.visualizerContainer.innerHTML = `
            <div class="simple-player-display">
                <div class="player-info-card">
                    <div class="song-info">
                        <h2 class="display-song-title">${this.player.utils.escapeHtml(song.name || 'Unknown Track')}</h2>
                        <p class="display-artist-name">${this.player.utils.escapeHtml(song.primaryArtists || song.artist || 'Unknown Artist')}</p>
                        ${song.album ? `<p class="display-album-name">${this.player.utils.escapeHtml(song.album)}</p>` : ''}
                    </div>
                    
                    <div class="music-badges">
                        <div class="badge">
                            <span class="material-icons">music_note</span>
                            <span>High Quality</span>
                        </div>
                        ${song.year ? `
                        <div class="badge">
                            <span class="material-icons">calendar_today</span>
                            <span>${song.year}</span>
                        </div>` : ''}
                    </div>
                    
                    <div class="status-display">
                        <div class="play-status ${this.player.audioPlayer.isPlaying ? 'playing' : 'paused'}">
                            <span class="status-text">${this.player.audioPlayer.isPlaying ? ' 🎸 AniXDex' : 'Paused'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateVisualizerState() {
        const playStatus = document.querySelector('.play-status');
        const statusIcon = document.querySelector('.play-status .material-icons');
        const statusText = document.querySelector('.status-text');

        if (this.player.audioPlayer.isPlaying) {
            playStatus?.classList.remove('paused');
            playStatus?.classList.add('playing');
            if (statusText) statusText.textContent = 'AniXDex';
        } else {
            playStatus?.classList.remove('playing');
            playStatus?.classList.add('paused');
            if (statusIcon) statusIcon.textContent = 'pause_circle';
            if (statusText) statusText.textContent = 'Paused';
        }
    }
}
