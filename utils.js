class Utils {
    constructor() {}

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getImage(imageData) {
        if (!imageData) return this.getDefaultImage();
        
        if (Array.isArray(imageData)) {
            const high = imageData.find(img => img.quality === '500x500');
            if (high && high.url) return high.url;
            
            const medium = imageData.find(img => img.quality === '150x150');
            if (medium && medium.url) return medium.url;
            
            const low = imageData.find(img => img.quality === '50x50');
            if (low && low.url) return low.url;
        }
        
        if (typeof imageData === 'string' && imageData.includes('http')) return imageData;
        
        return this.getDefaultImage();
    }

    getDefaultImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiIHJ4PSI4Ii8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIzMCIgc3Ryb2tlPSIjMDlmIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJtODUgODUgMzAgMTUtMzAgMTVWODVaIiBmaWxsPSIjMDlmIi8+PHRleHQgeD0iMTAwIiB5PSIxNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzA5ZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QW5pWERleDwvdGV4dD48L3N2Zz4=';
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async fetchRandomSong() {
        const queries = ['hindi songs 2024', 'bollywood hits', 'popular music'];
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];
        
        try {
            const data = await this.makeApiCall('/search/songs', {
                query: randomQuery,
                limit: 10
            });
            
            const results = data.data?.results || data.results || [];
            if (results.length > 0) {
                const randomSong = results[Math.floor(Math.random() * results.length)];
                return randomSong;
            }
        } catch (error) {
            console.error('Error fetching random song:', error);
        }
        return null;
    }
}
