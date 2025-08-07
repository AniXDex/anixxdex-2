class APIManager {
    constructor() {
        this.API_BASE = CONFIG.API_BASE;
        this.FALLBACK_API = CONFIG.FALLBACK_API;
        this.currentApiBase = this.API_BASE;
        this.cache = new Map();
    }

    async makeApiCall(endpoint, params = {}) {
        const apis = [this.API_BASE, this.FALLBACK_API];
        
        const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
        
        if (this.cache.has(cacheKey)) {
            const cachedData = this.cache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < CONFIG.CACHE_DURATION) {
                return cachedData.data;
            }
        }
        
        for (const apiBase of apis) {
            try {
                const url = new URL(`${apiBase}${endpoint}`);
                Object.keys(params).forEach(key => {
                    if (params[key] !== undefined && params[key] !== null) {
                        url.searchParams.append(key, params[key]);
                    }
                });
                
                const response = await fetch(url.toString(), {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    timeout: 15000
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.success !== false && (data.data || data.results || data.success)) {
                    this.currentApiBase = apiBase;
                    
                    this.cache.set(cacheKey, {
                        data: data,
                        timestamp: Date.now()
                    });
                    
                    return data;
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                if (apiBase === apis[apis.length - 1]) {
                    throw error;
                }
                continue;
            }
        }
    }

    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > CONFIG.CACHE_DURATION * 2) {
                this.cache.delete(key);
            }
        }
    }
}
