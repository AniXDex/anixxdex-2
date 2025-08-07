class NavigationManager {
    constructor(playerInstance) {
        this.player = playerInstance;
        this.history = [];
        this.currentIndex = -1;
        this.backBtn = document.getElementById('backBtn');
        this.forwardBtn = document.getElementById('forwardBtn');
        
        this.setupNavigationEvents();
    }

    setupNavigationEvents() {
        if (this.backBtn) {
            this.backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
        }

        if (this.forwardBtn) {
            this.forwardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goForward();
            });
        }
    }

    addToHistory(song) {
        if (!song || !song.id) return;
        
        if (this.currentIndex !== this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        const lastSong = this.history[this.history.length - 1];
        if (!lastSong || lastSong.id !== song.id) {
            this.history.push(song);
            this.currentIndex = this.history.length - 1;
        }
        
        this.updateNavigationButtons();
    }

    goBack() {
        if (this.canGoBack()) {
            this.currentIndex--;
            const song = this.history[this.currentIndex];
            if (song) {
                this.player.audioPlayer.play(song);
            }
            this.updateNavigationButtons();
        }
    }

    goForward() {
        if (this.canGoForward()) {
            this.currentIndex++;
            const song = this.history[this.currentIndex];
            if (song) {
                this.player.audioPlayer.play(song);
            }
            this.updateNavigationButtons();
        }
    }

    canGoBack() {
        return this.currentIndex > 0;
    }

    canGoForward() {
        return this.currentIndex < this.history.length - 1;
    }

    updateNavigationButtons() {
        if (this.backBtn) {
            this.backBtn.disabled = !this.canGoBack();
        }
        if (this.forwardBtn) {
            this.forwardBtn.disabled = !this.canGoForward();
        }
    }
}
