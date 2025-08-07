class AudioPlayer {
    constructor(playerInstance) {
        this.player = playerInstance;
        this.audioElement = document.getElementById('audioPlayer');
        this.isPlaying = false;
        this.isLoading = false;
        this.currentSong = null;
        this.isDragging = false;
        this.previousVolume = 0.5;
        
        this.setupAudio();
        this.setupPlayerEvents();
    }

    setupAudio() {
        const savedVolume = localStorage.getItem('volume');
        if (savedVolume) {
            this.audioElement.volume = savedVolume / 100;
            if (this.player.bottomVolumeInput) {
                this.player.bottomVolumeInput.value = savedVolume;
            }
        } else {
            this.audioElement.volume = 0.5;
            if (this.player.bottomVolumeInput) {
                this.player.bottomVolumeInput.value = 50;
            }
        }
        
        this.updateVolumeIcon();
        this.audioElement.preload = 'metadata';
    }

    setupPlayerEvents() {
        this.audioElement.addEventListener('timeupdate', () => {
            if (!this.isDragging) this.updateProgress();
        });
        this.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audioElement.addEventListener('ended', () => this.player.next());
        this.audioElement.addEventListener('play', () => this.onPlay());
        this.audioElement.addEventListener('pause', () => this.onPause());
        this.audioElement.addEventListener('error', () => this.onError());
        this.audioElement.addEventListener('canplay', () => this.onCanPlay());
    }

    async play(song, keepArtistPlaylist = false, keepAlbum = false, keepPlaylist = false) {
        try {
            this.isLoading = true;
            this.currentSong = song;
            
            if (!keepArtistPlaylist) {
                this.player.isPlayingArtistPlaylist = false;
                this.player.currentArtistSongs = [];
            }
            
            if (!keepAlbum) {
                this.player.isPlayingAlbum = false;
                this.player.currentAlbumSongs = [];
            }
            
            if (!keepPlaylist) {
                this.player.isPlayingPlaylist = false;
                this.player.currentPlaylistSongs = [];
            }
            
            if (!keepArtistPlaylist && !keepAlbum && !keepPlaylist) {
                this.player.currentIndex = 0;
            }
            
            this.updatePlayButton();
            this.player.showPlayer();
            this.updateTrackInfo();
            this.updateImage();
            this.player.recentlyPlayed.addToRecentlyPlayed(song);
            this.player.navigation.addToHistory(song);
            
            // Sync overlay if it exists
            if (this.player.ui && this.player.ui.syncOverlay) {
                this.player.ui.syncOverlay();
            }
            
            const data = await this.player.api.makeApiCall(`/songs/${song.id}`);
            
            if (data.success !== false && (data.data || data.success)) {
                const details = data.data?.[0] || data;
                
                this.currentSong = {
                    ...this.currentSong,
                    ...details,
                    primaryArtists: details.primaryArtists || 
                                   details.artists?.primary?.map(a => a.name).join(', ') || 
                                   song.primaryArtists || 'Unknown Artist'
                };
                
                this.updateTrackInfo();
                
                // Sync overlay again with detailed song info
                if (this.player.ui && this.player.ui.syncOverlay) {
                    this.player.ui.syncOverlay();
                }
                
                if (details.downloadUrl && details.downloadUrl.length > 0) {
                    const url = this.getBestQualityUrl(details.downloadUrl);
                    
                    if (url) {
                        this.audioElement.src = url;
                        this.audioElement.load();
                        
                        const autoPlay = () => {
                            this.isLoading = false;
                            this.updatePlayButton();
                            this.audioElement.play().catch(error => {
                                console.log('Autoplay failed:', error);
                            });
                        };
                        
                        this.audioElement.addEventListener('canplay', autoPlay, { once: true });
                    } else {
                        throw new Error('No valid stream URL found');
                    }
                } else {
                    throw new Error('No download URLs found');
                }
            } else {
                throw new Error('Invalid song details response');
            }
        } catch (error) {
            console.error('Play error:', error);
            this.isLoading = false;
            this.updatePlayButton();
            
            setTimeout(() => {
                this.player.next();
            }, 2000);
        }
    }

    togglePlay() {
        if (this.isLoading || !this.audioElement.src) {
            return;
        }
        
        if (this.isPlaying) {
            this.audioElement.pause();
        } else {
            this.audioElement.play().catch(error => {
                console.log('Play failed:', error);
            });
        }
    }

    next() {
        if (this.player.isPlayingArtistPlaylist && this.player.currentArtistSongs.length > 0) {
            this.player.currentIndex = (this.player.currentIndex + 1) % this.player.currentArtistSongs.length;
            const nextSong = this.player.currentArtistSongs[this.player.currentIndex];
            if (nextSong) {
                this.play(nextSong, true);
                return;
            }
        }
        
        if (this.player.isPlayingAlbum && this.player.currentAlbumSongs.length > 0) {
            this.player.currentIndex = (this.player.currentIndex + 1) % this.player.currentAlbumSongs.length;
            const nextSong = this.player.currentAlbumSongs[this.player.currentIndex];
            if (nextSong) {
                this.play(nextSong, false, true);
                return;
            }
        }
        
        if (this.player.isPlayingPlaylist && this.player.currentPlaylistSongs.length > 0) {
            this.player.currentIndex = (this.player.currentIndex + 1) % this.player.currentPlaylistSongs.length;
            const nextSong = this.player.currentPlaylistSongs[this.player.currentIndex];
            if (nextSong) {
                this.play(nextSong, false, false, true);
                return;
            }
        }
        
        if (this.player.allSongs.length === 0) {
            this.player.fetchRandomSong();
            return;
        }

        const randomIndex = Math.floor(Math.random() * this.player.allSongs.length);
        const song = this.player.allSongs[randomIndex];
        
        if (song) {
            this.play(song);
        }
    }

    previous() {
        if (this.player.isPlayingArtistPlaylist && this.player.currentArtistSongs.length > 0) {
            this.player.currentIndex = this.player.currentIndex <= 0 ? this.player.currentArtistSongs.length - 1 : this.player.currentIndex - 1;
            const prevSong = this.player.currentArtistSongs[this.player.currentIndex];
            if (prevSong) {
                this.play(prevSong, true);
                return;
            }
        }
        
        if (this.player.isPlayingAlbum && this.player.currentAlbumSongs.length > 0) {
            this.player.currentIndex = this.player.currentIndex <= 0 ? this.player.currentAlbumSongs.length - 1 : this.player.currentIndex - 1;
            const prevSong = this.player.currentAlbumSongs[this.player.currentIndex];
            if (prevSong) {
                this.play(prevSong, false, true);
                return;
            }
        }
        
        if (this.player.isPlayingPlaylist && this.player.currentPlaylistSongs.length > 0) {
            this.player.currentIndex = this.player.currentIndex <= 0 ? this.player.currentPlaylistSongs.length - 1 : this.player.currentIndex - 1;
            const prevSong = this.player.currentPlaylistSongs[this.player.currentIndex];
            if (prevSong) {
                this.play(prevSong, false, false, true);
                return;
            }
        }
        
        this.next();
    }

    seek() {
        if (this.audioElement.duration) {
            const time = (this.player.bottomSeekBar.value / 100) * this.audioElement.duration;
            this.audioElement.currentTime = time;
            this.updateProgressVisual();
        }
    }

    toggleMute() {
        if (this.audioElement.volume > 0) {
            this.previousVolume = this.audioElement.volume;
            this.audioElement.volume = 0;
            if (this.player.bottomVolumeInput) this.player.bottomVolumeInput.value = 0;
        } else {
            this.audioElement.volume = this.previousVolume || 0.5;
            if (this.player.bottomVolumeInput) this.player.bottomVolumeInput.value = (this.previousVolume || 0.5) * 100;
        }
        this.updateVolumeIcon();
    }

    onPlay() {
        this.isPlaying = true;
        this.updatePlayButton();
        
        if (this.player.playerImage) {
            this.player.playerImage.classList.add('spinning');
        }

        // Sync overlay play button
        if (this.player.ui && this.player.ui.overlayPlayBtn) {
            const icon = this.player.ui.overlayPlayBtn.querySelector('.material-icons');
            if (icon) icon.textContent = 'pause';
        }

        
    }

    onPause() {
        this.isPlaying = false;
        this.updatePlayButton();
        
        if (this.player.playerImage) {
            this.player.playerImage.classList.remove('spinning');
        }

        // Sync overlay play button
        if (this.player.ui && this.player.ui.overlayPlayBtn) {
            const icon = this.player.ui.overlayPlayBtn.querySelector('.material-icons');
            if (icon) icon.textContent = 'play_arrow';
        }
    }

    onCanPlay() {
        this.isLoading = false;
        this.updatePlayButton();
    }

    onError() {
        console.error('Audio playback error');
        this.isLoading = false;
        this.isPlaying = false;
        this.updatePlayButton();
        
        setTimeout(() => {
            this.next();
        }, 2000);
    }

    updatePlayButton() {
        if (this.player.bottomPlayBtn) {
            const icon = this.player.bottomPlayBtn.querySelector('.material-icons');
            if (icon) {
                if (this.isLoading) {
                    icon.textContent = 'hourglass_empty';
                    icon.classList.add('rotating');
                } else {
                    icon.textContent = this.isPlaying ? 'pause' : 'play_arrow';
                    icon.classList.remove('rotating');
                }
            }
        }

        // Sync overlay play button
        if (this.player.ui && this.player.ui.overlayPlayBtn) {
            const overlayIcon = this.player.ui.overlayPlayBtn.querySelector('.material-icons');
            if (overlayIcon) {
                if (this.isLoading) {
                    overlayIcon.textContent = 'hourglass_empty';
                } else {
                    overlayIcon.textContent = this.isPlaying ? 'pause' : 'play_arrow';
                }
            }
        }
    }

    updateTrackInfo() {
        if (this.currentSong) {
            if (this.player.playerTrackName) {
                this.player.playerTrackName.textContent = this.currentSong.name || 'Unknown Track';
            }
            if (this.player.playerTrackArtist) {
                let artistText = 'Unknown Artist';
                
                if (this.currentSong.primaryArtists) {
                    artistText = this.currentSong.primaryArtists;
                } else if (this.currentSong.artists && this.currentSong.artists.primary) {
                    artistText = this.currentSong.artists.primary.map(a => a.name).join(', ');
                } else if (this.currentSong.artist) {
                    artistText = this.currentSong.artist;
                }
                
                this.player.playerTrackArtist.textContent = artistText;
            }

            // Sync overlay track info
            if (this.player.ui && this.player.ui.overlayTrackName) {
                this.player.ui.overlayTrackName.textContent = this.currentSong.name || 'Unknown Track';
            }
            if (this.player.ui && this.player.ui.overlayTrackArtist) {
                let artistText = 'Unknown Artist';
                
                if (this.currentSong.primaryArtists) {
                    artistText = this.currentSong.primaryArtists;
                } else if (this.currentSong.artists && this.currentSong.artists.primary) {
                    artistText = this.currentSong.artists.primary.map(a => a.name).join(', ');
                } else if (this.currentSong.artist) {
                    artistText = this.currentSong.artist;
                }
                
                this.player.ui.overlayTrackArtist.textContent = artistText;
            }
        }
    }

    updateImage() {
        if (this.currentSong && this.player.playerImage) {
            const imageUrl = this.player.utils.getImage(this.currentSong.image);
            this.player.playerImage.src = imageUrl;
            this.player.playerImage.classList.remove('hidden');
            this.player.playerImage.style.opacity = '1';
            
            if (this.isPlaying) {
                this.player.playerImage.classList.add('spinning');
            }
            
            this.player.playerImage.onerror = () => {
                this.player.playerImage.src = this.player.utils.getDefaultImage();
            };

            // Sync overlay image
            if (this.player.ui && this.player.ui.overlayPlayerImage) {
                this.player.ui.overlayPlayerImage.src = imageUrl;
                this.player.ui.overlayPlayerImage.onerror = () => {
                    this.player.ui.overlayPlayerImage.src = this.player.utils.getDefaultImage();
                };
            }
        }
    }

    updateProgress() {
        if (this.audioElement.duration) {
            const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
            const currentTime = this.player.utils.formatTime(this.audioElement.currentTime);
            
            if (this.player.bottomSeekBar) this.player.bottomSeekBar.value = progress;
            if (this.player.bottomProgressFill) this.player.bottomProgressFill.style.width = `${progress}%`;
            if (this.player.bottomProgressHandle) this.player.bottomProgressHandle.style.left = `${progress}%`;
            if (this.player.bottomCurrentTime) this.player.bottomCurrentTime.textContent = currentTime;

            // Sync overlay progress
            if (this.player.ui && this.player.ui.updateOverlayProgress) {
                this.player.ui.updateOverlayProgress();
            }
        }
    }

    updateProgressVisual() {
        if (this.audioElement.duration) {
            const progress = this.player.bottomSeekBar.value;
            if (this.player.bottomProgressFill) this.player.bottomProgressFill.style.width = `${progress}%`;
            if (this.player.bottomProgressHandle) this.player.bottomProgressHandle.style.left = `${progress}%`;

            // Sync overlay visual progress
            if (this.player.ui && this.player.ui.overlaySeekBar) {
                this.player.ui.overlaySeekBar.value = progress;
                if (this.player.ui.overlayProgressFill) this.player.ui.overlayProgressFill.style.width = `${progress}%`;
                if (this.player.ui.overlayProgressHandle) this.player.ui.overlayProgressHandle.style.left = `${progress}%`;
            }
        }
    }

    updateDuration() {
        if (this.audioElement.duration) {
            const duration = this.player.utils.formatTime(this.audioElement.duration);
            if (this.player.bottomTotalTime) this.player.bottomTotalTime.textContent = duration;

            // Sync overlay duration
            if (this.player.ui && this.player.ui.overlayTotalTime) {
                this.player.ui.overlayTotalTime.textContent = duration;
            }
        }
    }

    updateVolumeIcon() {
        const volume = this.audioElement.volume * 100;
        const iconText = volume === 0 ? 'volume_off' : 
                        volume < 50 ? 'volume_down' : 'volume_up';
        
        if (this.player.bottomVolumeBtn) {
            const icon = this.player.bottomVolumeBtn.querySelector('.material-icons');
            if (icon) icon.textContent = iconText;
        }
    }

    getBestQualityUrl(downloadUrls) {
        if (!Array.isArray(downloadUrls) || downloadUrls.length === 0) return null;
        
        const qualityPriority = ['320kbps', '160kbps', '96kbps', '48kbps'];
        
        for (const quality of qualityPriority) {
            const urlObj = downloadUrls.find(item => item.quality === quality);
            if (urlObj && urlObj.url) {
                return urlObj.url;
            }
        }
        
        return downloadUrls[0]?.url || null;
    }
}
