/**
 * TMDB Service
 * The Movie Database API integration
 * Handles all movie and TV show data fetching
 */

const axios = require('axios');
const keys = require('../config/keys');
const config = require('../config/config');
const cache = require('./cache.service');

class TMDBService {
    constructor() {
        this.baseUrl = keys.tmdb.baseUrl;
        this.apiKey = keys.tmdb.apiKey;
        this.imageBaseUrl = keys.tmdb.imageBaseUrl;
        this.cache = cache;
        
        // Create axios instance with default config
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: config.api.requestTimeout,
            params: {
                api_key: this.apiKey
            }
        });
    }

    /**
     * Make API request with caching and retry logic
     * @private
     */
    async _request(endpoint, params = {}, useCache = true) {
        // Generate cache key
        const cacheKey = cache.constructor.generateKey('tmdb', endpoint, params);

        // Check cache first
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            console.log(`📦 Cache hit: ${endpoint}`);
            return cached;
        }

        // Make API request with retry logic
        let lastError;
        for (let attempt = 1; attempt <= config.api.maxRetries; attempt++) {
            try {
                const response = await this.client.get(endpoint, { params });
                
                // Cache successful response
                if (useCache) {
                    this.cache.set(cacheKey, response.data, config.api.cacheTimeout);
                }

                return response.data;
            } catch (error) {
                lastError = error;
                
                if (error.response?.status === 401) {
                    throw new Error('Invalid TMDB API key');
                }
                
                if (error.response?.status === 404) {
                    throw new Error('Resource not found');
                }

                if (attempt < config.api.maxRetries) {
                    console.warn(`⚠️  TMDB request failed, retrying... (${attempt}/${config.api.maxRetries})`);
                    await this._delay(1000 * attempt);
                }
            }
        }

        throw new Error(`TMDB API request failed: ${lastError.message}`);
    }

    /**
     * Delay helper for retry logic
     * @private
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Search for movies
     * @param {string} query - Search query
     * @param {number} page - Page number (default: 1)
     * @returns {Promise<object>} - Search results
     */
    async searchMovies(query, page = 1) {
        if (!query || query.trim() === '') {
            throw new Error('Search query is required');
        }

        return await this._request('/search/movie', {
            query: query.trim(),
            page,
            include_adult: false
        });
    }

    /**
     * Search for TV shows
     * @param {string} query - Search query
     * @param {number} page - Page number (default: 1)
     * @returns {Promise<object>} - Search results
     */
    async searchTVShows(query, page = 1) {
        if (!query || query.trim() === '') {
            throw new Error('Search query is required');
        }

        return await this._request('/search/tv', {
            query: query.trim(),
            page,
            include_adult: false
        });
    }

    /**
     * Multi-search (movies and TV shows)
     * @param {string} query - Search query
     * @param {number} page - Page number (default: 1)
     * @returns {Promise<object>} - Search results
     */
    async searchMulti(query, page = 1) {
        if (!query || query.trim() === '') {
            throw new Error('Search query is required');
        }

        return await this._request('/search/multi', {
            query: query.trim(),
            page,
            include_adult: false
        });
    }

    /**
     * Get trending content
     * @param {string} mediaType - 'movie', 'tv', or 'all'
     * @param {string} timeWindow - 'day' or 'week'
     * @returns {Promise<object>} - Trending results
     */
    async getTrending(mediaType = 'all', timeWindow = 'week') {
        const validMediaTypes = ['movie', 'tv', 'all'];
        const validTimeWindows = ['day', 'week'];

        if (!validMediaTypes.includes(mediaType)) {
            throw new Error('Invalid media type. Use: movie, tv, or all');
        }

        if (!validTimeWindows.includes(timeWindow)) {
            throw new Error('Invalid time window. Use: day or week');
        }

        return await this._request(`/trending/${mediaType}/${timeWindow}`);
    }

    /**
     * Get popular content
     * @param {string} mediaType - 'movie' or 'tv'
     * @param {number} page - Page number (default: 1)
     * @returns {Promise<object>} - Popular results
     */
    async getPopular(mediaType = 'movie', page = 1) {
        const validMediaTypes = ['movie', 'tv'];

        if (!validMediaTypes.includes(mediaType)) {
            throw new Error('Invalid media type. Use: movie or tv');
        }

        return await this._request(`/${mediaType}/popular`, { page });
    }

    /**
     * Get detailed movie information
     * @param {number} movieId - TMDB movie ID
     * @returns {Promise<object>} - Movie details
     */
    async getMovieDetails(movieId) {
        if (!movieId) {
            throw new Error('Movie ID is required');
        }

        return await this._request(`/movie/${movieId}`, {
            append_to_response: 'credits,videos,recommendations'
        });
    }

    /**
     * Get detailed TV show information
     * @param {number} tvId - TMDB TV show ID
     * @returns {Promise<object>} - TV show details
     */
    async getTVShowDetails(tvId) {
        if (!tvId) {
            throw new Error('TV show ID is required');
        }

        return await this._request(`/tv/${tvId}`, {
            append_to_response: 'credits,videos,recommendations'
        });
    }

    /**
     * Get movie credits (cast and crew)
     * @param {number} movieId - TMDB movie ID
     * @returns {Promise<object>} - Credits information
     */
    async getMovieCredits(movieId) {
        if (!movieId) {
            throw new Error('Movie ID is required');
        }

        return await this._request(`/movie/${movieId}/credits`);
    }

    /**
     * Get TV show credits (cast and crew)
     * @param {number} tvId - TMDB TV show ID
     * @returns {Promise<object>} - Credits information
     */
    async getTVShowCredits(tvId) {
        if (!tvId) {
            throw new Error('TV show ID is required');
        }

        return await this._request(`/tv/${tvId}/credits`);
    }

    /**
     * Get TV show season details
     * @param {number} tvId - TMDB TV show ID
     * @param {number} seasonNumber - Season number
     * @returns {Promise<object>} - Season details with episodes
     */
    async getTVShowSeason(tvId, seasonNumber) {
        if (!tvId) {
            throw new Error('TV show ID is required');
        }
        if (seasonNumber === undefined || seasonNumber === null) {
            throw new Error('Season number is required');
        }

        return await this._request(`/tv/${tvId}/season/${seasonNumber}`);
    }

    /**
     * Get now playing movies
     * @param {number} page - Page number (default: 1)
     * @returns {Promise<object>} - Now playing movies
     */
    async getNowPlaying(page = 1) {
        return await this._request('/movie/now_playing', { page });
    }

    /**
     * Get upcoming movies
     * @param {number} page - Page number (default: 1)
     * @returns {Promise<object>} - Upcoming movies
     */
    async getUpcoming(page = 1) {
        return await this._request('/movie/upcoming', { page });
    }

    /**
     * Get top rated content
     * @param {string} mediaType - 'movie' or 'tv'
     * @param {number} page - Page number (default: 1)
     * @returns {Promise<object>} - Top rated results
     */
    async getTopRated(mediaType = 'movie', page = 1) {
        const validMediaTypes = ['movie', 'tv'];

        if (!validMediaTypes.includes(mediaType)) {
            throw new Error('Invalid media type. Use: movie or tv');
        }

        return await this._request(`/${mediaType}/top_rated`, { page });
    }

    /**
     * Discover anime TV (JP origin, animation genre)
     * @param {string} sortBy - TMDB sort_by value (e.g., popularity.desc)
     * @param {number} page - Page number (default: 1)
     */
    async discoverAnime(sortBy = 'popularity.desc', page = 1) {
        return await this._request('/discover/tv', {
            with_origin_country: 'JP',
            with_genres: '16',
            sort_by: sortBy,
            page
        });
    }

    /**
     * Build complete image URL
     * @param {string} path - Image path from TMDB
     * @param {string} size - Image size (w92, w154, w185, w342, w500, w780, original)
     * @returns {string} - Complete image URL
     */
    buildImageUrl(path, size = 'w500') {
        if (!path) {
            return null;
        }

        const validSizes = ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'];
        
        if (!validSizes.includes(size)) {
            size = 'w500';
        }

        return `${this.imageBaseUrl}/${size}${path}`;
    }

    /**
     * Validate TMDB API key
     * @returns {Promise<boolean>} - True if valid
     */
    async validateApiKey() {
        try {
            await this._request('/configuration', {}, false);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
module.exports = new TMDBService();
