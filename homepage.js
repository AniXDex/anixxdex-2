class HomepageManager {
    constructor(playerInstance) {
        this.player = playerInstance;
        
        this.musicCategories = {
            trendingHindi: { query: 'trending hindi 2025', title: '🔥 Trending Hindi Hits' },
            weeklyTop: { query: 'weekly top hindi charts', title: '📊 Weekly Top Charts' },
            latestReleases: { query: 'latest hindi songs 2025', title: '🆕 Latest Releases' },
            topBollywood: { query: 'top bollywood hits', title: '🏆 Top Bollywood' },
            romanticHits: { query: 'romantic hindi songs', title: '❤️ Romantic Hits' },
            partyMix: { query: 'party hindi songs dance', title: '🎉 Party Mix' }
        };
        
        this.setupAutoRefresh();
    }

    setupAutoRefresh() {
        setInterval(() => {
            this.loadEnhancedHomepage();
        }, CONFIG.AUTO_REFRESH_INTERVAL);
    }

    async loadEnhancedHomepage() {
        this.player.recentlyPlayed.displayRecentlyPlayed();
        
        const categoryPromises = Object.entries(this.musicCategories).map(([key, category]) => 
            this.loadCategoryContent(key, category)
        );
        
        await Promise.allSettled(categoryPromises);
    }

    async loadCategoryContent(categoryKey, category) {
        try {
            const container = this.getCategoryContainer(categoryKey);
            if (!container) return;
            
            const cacheKey = `category_${categoryKey}`;
            if (this.player.api.cache.has(cacheKey)) {
                const cachedData = this.player.api.cache.get(cacheKey);
                if (Date.now() - cachedData.timestamp < 600000) {
                    this.displayGrid(cachedData.results, container, 'song');
                    return;
                }
            }
            
            const data = await this.player.api.makeApiCall('/search/songs', {
                query: category.query,
                limit: 8
            });
            
            const results = data.data?.results || data.results || [];
            
            if (results.length > 0) {
                this.player.api.cache.set(cacheKey, {
                    results: results,
                    timestamp: Date.now()
                });
                
                this.displayGrid(results, container, 'song');
            } else {
                this.showCategoryError(container, `No ${category.title.replace(/[🔥📊🆕🏆❤️🎉]/g, '').trim()} found`);
            }
            
        } catch (error) {
            const container = this.getCategoryContainer(categoryKey);
            if (container) {
                this.showErrorState(container, `Failed to load ${category.title}`, `loadCategoryContent('${categoryKey}', ${JSON.stringify(category)})`);
            }
        }
    }

    getCategoryContainer(categoryKey) {
        const containerMap = {
            trendingHindi: this.player.trendingSongs,
            weeklyTop: this.player.topCharts,
            latestReleases: this.player.newReleases,
            topBollywood: this.player.featuredAlbums,
            romanticHits: this.player.topArtists,
            partyMix: this.player.featuredPlaylists
        };
        
        return containerMap[categoryKey];
    }

    displayGrid(items, container, type) {
        if (!container) return;
        
        let html = '';
        
        items.forEach(item => {
            const image = this.player.utils.getImage(item.image);
            const className = type === 'artist' ? 'artist-item' : 
                             type === 'album' ? 'album-item' : 
                             type === 'playlist' ? 'playlist-item' : 'trending-item';
            const itemName = this.player.utils.escapeHtml(item.name || 'Unknown');
            
            let itemSubtitle = 'Unknown';
            if (type === 'artist') {
                itemSubtitle = item.followerCount ? `${Math.floor(item.followerCount / 1000)}K followers` : 'Artist';
            } else if (type === 'album') {
                const artists = item.primaryArtists || item.artist || item.artists?.primary?.map(a => a.name).join(', ') || 'Various Artists';
                const year = item.year || item.releaseDate || '';
                itemSubtitle = year ? `${artists} • ${year}` : artists;
            } else if (type === 'playlist') {
                itemSubtitle = item.songCount ? `${item.songCount} songs` : item.type || 'Playlist';
            } else {
                if (item.primaryArtists) {
                    itemSubtitle = this.player.utils.escapeHtml(item.primaryArtists);
                } else if (item.artists && item.artists.primary) {
                    itemSubtitle = this.player.utils.escapeHtml(item.artists.primary.map(a => a.name).join(', '));
                } else if (item.artist) {
                    itemSubtitle = this.player.utils.escapeHtml(item.artist);
                }
            }
            
            const playIcon = type === 'artist' ? 'playlist_play' : 
                           type === 'album' ? 'album' :
                           type === 'playlist' ? 'playlist_play' : 'play_arrow';
            
            html += `
                <div class="${className} premium-card" data-item='${this.player.utils.escapeHtml(JSON.stringify(item))}' data-type="${type}">
                    <div class="card-image-container">
                        <div class="image-wrapper ${type === 'artist' ? 'artist-image' : ''}">
                            <img src="${image}" alt="${itemName}" onload="this.style.opacity='1'" onerror="this.src='${this.player.utils.getDefaultImage()}'" style="opacity:0; transition: opacity 0.3s;">
                            <div class="image-overlay">
                                <div class="play-button-overlay">
                                    <span class="material-icons">${playIcon}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-content">
                        <div class="${className}-title">${itemName}</div>
                        <div class="${className}-artist">${itemSubtitle}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        setTimeout(() => {
            container.querySelectorAll('.premium-card').forEach(card => {
                card.addEventListener('click', () => {
                    try {
                        const type = card.dataset.type;
                        const item = JSON.parse(card.dataset.item);
                        
                        if (type === 'artist') {
                            this.player.ui.showPage('search');
                            this.playArtist(item);
                        } else if (type === 'album') {
                            this.playAlbum(item);
                        } else if (type === 'playlist') {
                            this.playPlaylist(item);
                        } else if (type === 'song') {
                            this.player.audioPlayer.play(item);
                        }
                    } catch (error) {
                        // Silent error handling
                    }
                });
            });
        }, 100);
    }

    showCategoryError(container, message) {
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <span class="material-icons">music_off</span>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    showErrorState(container, message, retryFunction) {
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <span class="material-icons">error_outline</span>
                    <p>${message}</p>
                    <button onclick="window.player.${retryFunction}()" style="margin-top: 10px; padding: 8px 16px; background: #09f; border: none; border-radius: 4px; color: white; cursor: pointer;">Retry</button>
                </div>
            `;
        }
    }
}
