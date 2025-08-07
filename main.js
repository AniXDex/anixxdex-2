document.addEventListener('DOMContentLoaded', () => {
    try {
        window.player = new SimpleMusicPlayer();
        window.player.initializeNavigation();
    } catch (error) {
        // Silent error handling
    }
});

const CONFIG = {
    API_BASE: 'https://jiosaavnapi-harsh.vercel.app/api',
    FALLBACK_API: 'https://saavn.dev/api',
    CACHE_DURATION: 300000,
    AUTO_REFRESH_INTERVAL: 900000,
    SEARCH_DEBOUNCE_DELAY: 300
};
