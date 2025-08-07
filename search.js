class SearchManager {
    constructor(playerInstance) {
        this.player = playerInstance;
        this.currentSearchTab = 'songs';
        this.searchTimeout = null;
        
        this.setupSearchEvents();
    }

    setupSearchEvents() {
        if (this.player.searchInput) {
            this.player.searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                
                clearTimeout(this.searchTimeout);
                
                if (query.length > 2) {
                    this.player.ui.showPage('search');
                    
                    this.searchTimeout = setTimeout(() => {
                        this.search(query);
                    }, CONFIG.SEARCH_DEBOUNCE_DELAY);
                } else if (query.length === 0) {
                    this.showSearchPlaceholder();
                }
            });
        }

        document.querySelectorAll('.search-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.currentSearchTab = e.target.dataset.tab;
                this.updateSearchTabs();
                if (this.player.searchInput.value.trim().length > 2) {
                    this.search(this.player.searchInput.value.trim());
                }
            });
        });
    }

    async search(query) {
        try {
            this.showSearchLoading();
            
            let endpoint = '/search/songs';
            if (this.currentSearchTab === 'albums') {
                endpoint = '/search/albums';
            } else if (this.currentSearchTab === 'artists') {
                endpoint = '/search/artists';
            } else if (this.currentSearchTab === 'playlists') {
                endpoint = '/search/playlists';
            }
            
            const data = await this.player.api.makeApiCall(endpoint, {
                query: query,
                limit: 24
            });
            
            const results = data.data?.results || data.results || [];
            
            if (results.length > 0) {
                this.displaySearchResults(results);
            } else {
                this.showSearchError('No results found for your search.');
            }
            
        } catch (error) {
            this.showSearchError('Search failed. Please try again or check your connection.');
        }
    }

    displaySearchResults(results) {
        let html = '<div class="search-grid-4-cols">';
        
        results.forEach(item => {
            const image = this.player.utils.getImage(item.image);
            const itemName = this.player.utils.escapeHtml(item.name || 'Unknown');
            
            let artistName = 'Unknown Artist';
            if (item.primaryArtists) {
                artistName = this.player.utils.escapeHtml(item.primaryArtists);
            } else if (item.artists && item.artists.primary) {
                artistName = this.player.utils.escapeHtml(item.artists.primary.map(a => a.name).join(', '));
            } else if (item.artist) {
                artistName = this.player.utils.escapeHtml(item.artist);
            }
            
            html += `
                <div class="search-card premium-card" data-song='${this.player.utils.escapeHtml(JSON.stringify(item))}'>
                    <div class="card-image-container">
                        <div class="image-wrapper">
                            <img src="${image}" alt="${itemName}" onload="this.style.opacity='1'" onerror="this.src='${this.player.utils.getDefaultImage()}'" style="opacity:0; transition: opacity 0.3s;">
                            <div class="image-overlay">
                                <div class="play-button-overlay">
                                    <span class="material-icons">play_arrow</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-content">
                        <div class="search-card-title">${itemName}</div>
                        <div class="search-card-artist">${artistName}</div>
                    </div>
                    <button class="add-to-library-btn" onclick="event.stopPropagation(); window.player.library.addToLibrary(JSON.parse(this.closest('.search-card').dataset.song));">
                        <span class="material-icons">add</span>
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        this.player.searchResultsContent.innerHTML = html;

        setTimeout(() => {
            document.querySelectorAll('.search-card').forEach(card => {
                card.addEventListener('click', () => {
                    try {
                        const song = JSON.parse(card.dataset.song);
                        this.player.audioPlayer.play(song);
                    } catch (error) {
                        // Silent error handling
                    }
                });
            });
        }, 100);
    }

    updateSearchTabs() {
        document.querySelectorAll('.search-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this.currentSearchTab);
        });
    }

    showSearchPlaceholder() {
        if (this.player.searchResultsContent) {
            this.player.searchResultsContent.innerHTML = `
                <div class="search-placeholder">
                    <span class="material-icons">search</span>
                    <h3>Search for music</h3>
                    <p>Find your favorite songs, artists, albums, and playlists using JioSaavn API.</p>
                </div>
            `;
        }
    }

    showSearchLoading() {
        if (this.player.searchResultsContent) {
            this.player.searchResultsContent.innerHTML = '<div class="loading-spinner">Searching...</div>';
        }
    }

    showSearchError(message) {
        if (this.player.searchResultsContent) {
            this.player.searchResultsContent.innerHTML = `
                <div class="error-state">
                    <span class="material-icons">error_outline</span>
                    <h3>Search Error</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }
}
