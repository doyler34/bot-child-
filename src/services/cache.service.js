/**
 * Cache Service
 * In-memory caching system with TTL (Time To Live)
 * Reduces API calls and improves performance
 */

class CacheService {
    constructor() {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0
        };

        // Cleanup expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 300000);
    }

    /**
     * Store a value in cache with TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (default: 1 hour)
     */
    set(key, value, ttl = 3600000) {
        const expiresAt = Date.now() + ttl;
        
        this.cache.set(key, {
            value,
            expiresAt
        });

        this.stats.sets++;
    }

    /**
     * Retrieve a value from cache
     * @param {string} key - Cache key
     * @returns {any|null} - Cached value or null if not found/expired
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check if entry has expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return entry.value;
    }

    /**
     * Check if a key exists and is not expired
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return false;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Delete a specific cache entry
     * @param {string} key - Cache key
     * @returns {boolean} - True if deleted, false if not found
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0
        };
        console.log('✓ Cache cleared');
    }

    /**
     * Remove expired entries from cache
     */
    cleanup() {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`🗑️  Cache cleanup: removed ${removed} expired entries`);
        }
    }

    /**
     * Get cache statistics
     * @returns {object} - Cache stats including hit rate
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;

        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: `${hitRate}%`
        };
    }

    /**
     * Generate a cache key from components
     * @param {string} prefix - Key prefix (e.g., 'tmdb')
     * @param {string} endpoint - API endpoint
     * @param {object} params - Query parameters
     * @returns {string} - Formatted cache key
     */
    static generateKey(prefix, endpoint, params = {}) {
        const paramStr = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        
        return `${prefix}:${endpoint}${paramStr ? ':' + paramStr : ''}`;
    }

    /**
     * Destroy the cache service and cleanup intervals
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

// Export singleton instance
module.exports = new CacheService();
