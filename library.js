class LibraryManager {
    constructor(playerInstance) {
        this.player = playerInstance;
        this.userPlaylists = JSON.parse(localStorage.getItem('userPlaylists') || '[]');
    }

    addToLibrary(songData) {
        if (!songData || !songData.id) return;
        
        const exists = this.userPlaylists.some(song => song.id === songData.id);
        
        if (!exists) {
            this.userPlaylists.push({
                id: songData.id,
                name: songData.name,
                primaryArtists: songData.primaryArtists || songData.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist',
                image: this.player.utils.getImage(songData.image),
                addedAt: Date.now()
            });
            
            localStorage.setItem('userPlaylists', JSON.stringify(this.userPlaylists));
            console.log(`Added song "${songData.name}" to library`);
            
            if (!document.getElementById('libraryPage')?.classList.contains('hidden')) {
                this.loadUserLibrary();
            }
        } else {
            console.log('Song already in library');
        }
    }

    removeFromLibrary(songId) {
        const songIndex = this.userPlaylists.findIndex(song => song.id === songId);
        if (songIndex > -1) {
            const removedSong = this.userPlaylists.splice(songIndex, 1)[0];
            localStorage.setItem('userPlaylists', JSON.stringify(this.userPlaylists));
            console.log(`Removed song "${removedSong.name}" from library`);
            this.loadUserLibrary();
        }
    }

    loadUserLibrary() {
        if (!this.player.libraryContent) return;
        
        if (this.userPlaylists.length === 0) {
            this.player.libraryContent.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">library_music</span>
                    <h3>Your library is empty</h3>
                    <p>Add songs to your library from search results.</p>
                </div>
            `;
        } else {
            let html = '<div class="search-grid-4-cols">';
            
            this.userPlaylists.forEach(song => {
                const songName = this.player.utils.escapeHtml(song.name || 'Unknown');
                const artistName = this.player.utils.escapeHtml(song.primaryArtists || 'Unknown Artist');
                
                html += `
                    <div class="search-card premium-card" data-song='${this.player.utils.escapeHtml(JSON.stringify(song))}'>
                        <div class="card-image-container">
                            <div class="image-wrapper">
                                <img src="${song.image || this.player.utils.getDefaultImage()}" alt="${songName}" onload="this.style.opacity='1'" onerror="this.src='${this.player.utils.getDefaultImage()}'" style="opacity:0; transition: opacity 0.3s;">
                                <div class="image-overlay">
                                    <div class="play-button-overlay">
                                        <span class="material-icons">play_arrow</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-content">
                            <div class="search-card-title">${songName}</div>
                            <div class="search-card-artist">${artistName}</div>
                        </div>
                        <button class="add-to-library-btn remove-btn" onclick="event.stopPropagation(); window.player.library.removeFromLibrary('${song.id}');">
                            <span class="material-icons">remove</span>
                        </button>
                    </div>
                `;
            });
            
            html += '</div>';
            this.player.libraryContent.innerHTML = html;

            setTimeout(() => {
                document.querySelectorAll('#libraryContent .search-card').forEach(card => {
                    card.addEventListener('click', () => {
                        try {
                            const song = JSON.parse(card.dataset.song);
                            this.player.audioPlayer.play(song);
                        } catch (error) {
                            console.error('Error playing library song:', error);
                        }
                    });
                });
            }, 100);
        }
    }
}
