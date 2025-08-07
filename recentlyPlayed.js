class RecentlyPlayedManager {
    constructor(playerInstance) {
        this.player = playerInstance;
        this.recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
    }

    addToRecentlyPlayed(song) {
        if (!song || !song.id) return;
        
        this.recentlyPlayed = this.recentlyPlayed.filter(s => s.id !== song.id);
        
        this.recentlyPlayed.unshift({
            id: song.id,
            name: song.name,
            primaryArtists: song.primaryArtists || song.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist',
            image: this.player.utils.getImage(song.image),
            playedAt: Date.now(),
            duration: song.duration || 0
        });
        
        this.recentlyPlayed = this.recentlyPlayed.slice(0, 10);
        localStorage.setItem('recentlyPlayed', JSON.stringify(this.recentlyPlayed));
        this.displayRecentlyPlayed();
    }

    displayRecentlyPlayed() {
        if (this.recentlyPlayed.length === 0) return;
        
        let recentSection = document.getElementById('recentlyPlayedSection');
        if (!recentSection) {
            recentSection = document.createElement('div');
            recentSection.id = 'recentlyPlayedSection';
            recentSection.className = 'home-section';
            
            const homePage = document.getElementById('homePage');
            if (homePage) {
                const firstSection = homePage.querySelector('.home-section');
                if (firstSection) {
                    homePage.insertBefore(recentSection, firstSection);
                } else {
                    homePage.appendChild(recentSection);
                }
            }
        }
        
        let html = `
            <h3>Recently Played</h3>
            <div class="section-grid">
        `;
        
        this.recentlyPlayed.slice(0, 8).forEach(song => {
            const image = this.player.utils.getImage(song.image);
            const songName = this.player.utils.escapeHtml(song.name || 'Unknown Song');
            const artistName = this.player.utils.escapeHtml(song.primaryArtists || 'Unknown Artist');
            const isCurrentSong = this.player.audioPlayer.currentSong && this.player.audioPlayer.currentSong.id === song.id;
            
            html += `
                <div class="recent-song-card premium-card ${isCurrentSong ? 'playing' : ''}" 
                     data-song='${this.player.utils.escapeHtml(JSON.stringify(song))}'>
                    <div class="card-image-container">
                        <div class="image-wrapper">
                            <img src="${image}" alt="${songName}" onload="this.style.opacity='1'" 
                                 onerror="this.src='${this.player.utils.getDefaultImage()}'" style="opacity:0; transition: opacity 0.3s;">
                            <div class="image-overlay">
                                <div class="play-button-overlay">
                                    <span class="material-icons">${isCurrentSong && this.player.audioPlayer.isPlaying ? 'pause' : 'play_arrow'}</span>
                                </div>
                            </div>
                        </div>
                        ${isCurrentSong ? '<div class="now-playing-indicator">♪</div>' : ''}
                    </div>
                    <div class="card-content">
                        <div class="trending-item-title">${songName}</div>
                        <div class="trending-item-artist">${artistName}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        recentSection.innerHTML = html;
        
        setTimeout(() => {
            recentSection.querySelectorAll('.recent-song-card').forEach(card => {
                card.addEventListener('click', async () => {
                    try {
                        const song = JSON.parse(card.dataset.song);
                        await this.player.audioPlayer.play(song);
                    } catch (error) {
                        console.error('Error playing recent song:', error);
                    }
                });
            });
        }, 100);
    }
}
