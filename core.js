class SimpleMusicPlayer {
    constructor() {
        this.initializeDOMElements();
        this.initializeState();
        this.initializeModules();
        this.setupEvents();
        this.init();
    }

    initializeDOMElements() {
        this.searchInput = document.getElementById('searchInput');
        this.audioElement = document.getElementById('audioPlayer');
        this.playerBar = document.getElementById('playerBar');
        this.bottomPlayBtn = document.getElementById('bottomPlayBtn');
        this.bottomSeekBar = document.getElementById('bottomSeekBar');
        this.bottomProgressFill = document.getElementById('bottomProgressFill');
        this.bottomProgressHandle = document.getElementById('bottomProgressHandle');
        this.bottomCurrentTime = document.getElementById('bottomCurrentTime');
        this.bottomTotalTime = document.getElementById('bottomTotalTime');
        this.playerImage = document.getElementById('playerImage');
        this.playerTrackName = document.getElementById('playerTrackName');
        this.playerTrackArtist = document.getElementById('playerTrackArtist');
        this.bottomVolumeInput = document.getElementById('bottomVolumeInput');
        this.bottomVolumeBtn = document.getElementById('bottomVolumeBtn');
        
        this.trendingSongs = document.getElementById('trendingSongs');
        this.topCharts = document.getElementById('topCharts');
        this.newReleases = document.getElementById('newReleases');
        this.featuredAlbums = document.getElementById('featuredAlbums');
        this.topArtists = document.getElementById('topArtists');
        this.featuredPlaylists = document.getElementById('featuredPlaylists');
        this.searchResultsContent = document.getElementById('searchResults');
        this.dynamicQuote = document.getElementById('dynamicQuote');
        this.libraryContent = document.getElementById('libraryContent');
    }

    initializeState() {
        this.allSongs = [];
        this.currentIndex = 0;
        this.currentArtistSongs = [];
        this.currentAlbumSongs = [];
        this.currentPlaylistSongs = [];
        this.isPlayingArtistPlaylist = false;
        this.isPlayingAlbum = false;
        this.isPlayingPlaylist = false;
    }

    initializeModules() {
        this.utils = new Utils();
        this.api = new APIManager();
        this.audioPlayer = new AudioPlayer(this);
        this.search = new SearchManager(this);
        this.homepage = new HomepageManager(this);
        this.library = new LibraryManager(this);
        this.recentlyPlayed = new RecentlyPlayedManager(this);
        this.ui = new UIManager(this);
        this.navigation = new NavigationManager(this);
    }

    initializeNavigation() {
        if (this.navigation) {
            this.navigation.updateNavigationButtons();
        }
    }

    setupEvents() {
        if (this.bottomPlayBtn) {
            this.bottomPlayBtn.addEventListener('click', () => {
                this.audioPlayer.togglePlay();
            });
        }

        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.audioPlayer.next();
            });
        }

        const prevBtn = document.getElementById('prevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.audioPlayer.previous();
            });
        }

        const shuffleBtn = document.getElementById('shuffleBtn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                shuffleBtn.classList.toggle('active');
            });
        }

        const repeatBtn = document.getElementById('bottomRepeatBtn');
        if (repeatBtn) {
            repeatBtn.addEventListener('click', () => {
                repeatBtn.classList.toggle('active');
            });
        }

        if (this.bottomVolumeInput) {
            this.bottomVolumeInput.addEventListener('input', () => {
                this.audioPlayer.audioElement.volume = this.bottomVolumeInput.value / 100;
                this.audioPlayer.updateVolumeIcon();
                localStorage.setItem('volume', this.bottomVolumeInput.value);
            });
        }

        if (this.bottomVolumeBtn) {
            this.bottomVolumeBtn.addEventListener('click', () => this.audioPlayer.toggleMute());
        }

        this.setupSeekBarEvents();
    }

    setupSeekBarEvents() {
        if (this.bottomSeekBar) {
            let wasPlaying = false;
            
            this.bottomSeekBar.addEventListener('mousedown', (e) => {
                this.startSeeking(e, wasPlaying);
            });
            
            this.bottomSeekBar.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startSeeking(e, wasPlaying);
            });
            
            const progressBar = document.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.addEventListener('click', (e) => {
                    this.handleProgressClick(e);
                });
                
                progressBar.addEventListener('touchend', (e) => {
                    if (e.changedTouches.length > 0) {
                        this.handleProgressTouch(e.changedTouches[0]);
                    }
                });
            }
            
            document.addEventListener('mouseup', () => this.endSeeking(wasPlaying));
            document.addEventListener('touchend', () => this.endSeeking(wasPlaying));
            
            this.bottomSeekBar.addEventListener('input', () => {
                if (this.audioPlayer.isDragging) this.audioPlayer.updateProgressVisual();
            });
        }
    }

    startSeeking(e, wasPlaying) {
        this.audioPlayer.isDragging = true;
        wasPlaying = this.audioPlayer.isPlaying;
        if (this.audioPlayer.isPlaying) this.audioPlayer.audioElement.pause();
    }

    endSeeking(wasPlaying) {
        if (this.audioPlayer.isDragging) {
            this.audioPlayer.isDragging = false;
            this.audioPlayer.seek();
            if (wasPlaying) {
                setTimeout(() => this.audioPlayer.audioElement.play(), 100);
            }
        }
    }

    handleProgressClick(e) {
        if (this.audioPlayer.audioElement.duration) {
            const progressBar = e.currentTarget;
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = (clickX / width) * 100;
            
            this.bottomSeekBar.value = Math.max(0, Math.min(100, percentage));
            this.audioPlayer.seek();
        }
    }

    handleProgressTouch(touch) {
        if (this.audioPlayer.audioElement.duration) {
            const progressBar = document.querySelector('.progress-bar');
            const rect = progressBar.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const width = rect.width;
            const percentage = (touchX / width) * 100;
            
            this.bottomSeekBar.value = Math.max(0, Math.min(100, percentage));
            this.audioPlayer.seek();
        }
    }

    async init() {
        this.ui.showPage('home');
        this.ui.hidePlayer();
        
        await this.homepage.loadEnhancedHomepage();
        this.buildSongPool();
        this.recentlyPlayed.displayRecentlyPlayed();
    }

    async buildSongPool() {
        const queries = [
            'trending bollywood 2025',
            'arijit singh hits',
            'romantic hindi songs',
            'punjabi songs 2024',
            'hindi party songs',
            'latest hindi songs',
            'top bollywood hits'
        ];

        for (const query of queries) {
            try {
                const data = await this.api.makeApiCall('/search/songs', {
                    query: query,
                    limit: 15
                });
                
                const results = data.data?.results || data.results || [];
                if (results.length > 0) {
                    this.allSongs.push(...results);
                }
            } catch (error) {
                // Silent error handling
            }
            
            await this.utils.wait(200);
        }
        
        this.allSongs = this.allSongs.filter((song, index, self) => 
            index === self.findIndex(s => s.id === song.id)
        );
    }

    showPlayer() {
        this.ui.showPlayer();
    }

    next() {
        this.audioPlayer.next();
    }

    previous() {
        this.audioPlayer.previous();
    }

    play(song) {
        this.audioPlayer.play(song);
    }

    async fetchRandomSong() {
        const song = await this.utils.fetchRandomSong();
        if (song) {
            this.audioPlayer.play(song);
        }
    }
}
