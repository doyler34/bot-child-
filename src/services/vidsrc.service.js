/**
 * VidSrc Service
 * Generates streaming links for movies and TV shows
 * Uses VidSrc embed-based streaming provider
 */

const keys = require('../config/keys');

class VidSrcService {
    constructor() {
        this.baseUrl = keys.vidsrc.baseUrl;
        
        // Multiple streaming providers
        this.providers = [
            {
                name: 'VidSrc',
                baseUrl: 'https://vidsrc.to/embed',
                emoji: '🎬'
            },
            {
                name: 'VidSrc Pro',
                baseUrl: 'https://vidsrc.pro/embed',
                emoji: '⭐'
            },
            {
                name: 'VidSrc Me',
                baseUrl: 'https://vidsrc.me/embed',
                emoji: '🎥'
            }
        ];
    }

    /**
     * Generate streaming link for a movie
     * @param {number} tmdbId - TMDB movie ID
     * @param {string} title - Movie title (optional, for logging)
     * @returns {string} - Streaming URL
     */
    generateMovieLink(tmdbId, title = '') {
        if (!tmdbId) {
            throw new Error('TMDB ID is required');
        }

        const url = `${this.baseUrl}/movie/${tmdbId}`;
        
        if (title) {
            console.log(`🎬 Generated movie link: ${title} (${tmdbId})`);
        }

        return url;
    }

    /**
     * Generate streaming link for a TV show episode
     * @param {number} tmdbId - TMDB TV show ID
     * @param {number} season - Season number
     * @param {number} episode - Episode number
     * @param {string} title - TV show title (optional, for logging)
     * @returns {string} - Streaming URL
     */
    generateTVLink(tmdbId, season, episode, title = '') {
        if (!tmdbId || !season || !episode) {
            throw new Error('TMDB ID, season, and episode are required');
        }

        if (season < 1 || episode < 1) {
            throw new Error('Season and episode must be positive numbers');
        }

        const url = `${this.baseUrl}/tv/${tmdbId}/${season}/${episode}`;
        
        if (title) {
            console.log(`📺 Generated TV link: ${title} S${season}E${episode} (${tmdbId})`);
        }

        return url;
    }

    /**
     * Generate streaming link with auto-detection of type
     * @param {object} media - Media object with id, media_type, and optional season/episode
     * @returns {string} - Streaming URL
     */
    generateLink(media) {
        if (!media || !media.id) {
            throw new Error('Media object with id is required');
        }

        const mediaType = media.media_type || media.type;

        if (mediaType === 'movie') {
            return this.generateMovieLink(media.id, media.title || media.name);
        } else if (mediaType === 'tv') {
            const season = media.season || 1;
            const episode = media.episode || 1;
            return this.generateTVLink(media.id, season, episode, media.title || media.name);
        } else {
            throw new Error('Invalid media type. Must be "movie" or "tv"');
        }
    }

    /**
     * Validate if a streaming link can be generated
     * @param {number} tmdbId - TMDB ID
     * @param {string} type - Media type ('movie' or 'tv')
     * @returns {boolean} - True if valid parameters
     */
    validateAvailability(tmdbId, type) {
        if (!tmdbId) {
            return false;
        }

        if (!['movie', 'tv'].includes(type)) {
            return false;
        }

        return true;
    }

    /**
     * Build a web player URL (for future web dashboard)
     * @param {string} streamUrl - VidSrc embed URL
     * @returns {string} - Player page URL
     */
    buildPlayerUrl(streamUrl) {
        // This will be used when implementing the web dashboard in Phase 9
        // For now, just return the embed URL
        return streamUrl;
    }

    /**
     * Get supported quality options (informational)
     * @returns {string[]} - Available quality options
     */
    getSupportedQualities() {
        return ['Auto', '1080p', '720p', '480p', '360p'];
    }

    /**
     * Get supported subtitle languages (informational)
     * @returns {string[]} - Available subtitle languages
     */
    getSupportedSubtitles() {
        return [
            'English',
            'Spanish',
            'French',
            'German',
            'Italian',
            'Portuguese',
            'Russian',
            'Japanese',
            'Korean',
            'Chinese'
        ];
    }

    /**
     * Format streaming link for Discord embed
     * @param {string} url - Streaming URL
     * @param {string} label - Button label
     * @returns {object} - Discord button component data
     */
    formatForEmbed(url, label = 'Watch Now') {
        return {
            type: 2, // Button type
            style: 5, // Link button style
            label: label,
            url: url,
            emoji: {
                name: '▶️'
            }
        };
    }

    /**
     * Sanitize URL parameters to prevent injection
     * @private
     * @param {string} param - URL parameter
     * @returns {string} - Sanitized parameter
     */
    _sanitizeParam(param) {
        if (typeof param !== 'string') {
            return String(param);
        }

        // Remove potentially dangerous characters
        return param
            .replace(/[<>'"]/g, '')
            .trim();
    }

    /**
     * Get disclaimer text for streaming content
     * @returns {string} - Legal disclaimer
     */
    getDisclaimer() {
        return 'This bot provides links to third-party streaming services. ' +
               'We do not host any content. All content is provided by external sources.';
    }

    /**
     * Generate movie links for all providers
     * @param {number} tmdbId - TMDB movie ID
     * @returns {Array} - Array of {name, url, emoji} objects
     */
    getAllMovieLinks(tmdbId) {
        if (!tmdbId) {
            throw new Error('TMDB ID is required');
        }

        return this.providers.map(provider => ({
            name: provider.name,
            url: `${provider.baseUrl}/movie/${tmdbId}`,
            emoji: provider.emoji
        }));
    }

    /**
     * Generate TV show episode links for all providers
     * @param {number} tmdbId - TMDB TV show ID
     * @param {number} season - Season number
     * @param {number} episode - Episode number
     * @returns {Array} - Array of {name, url, emoji} objects
     */
    getAllTVLinks(tmdbId, season, episode) {
        if (!tmdbId || !season || !episode) {
            throw new Error('TMDB ID, season, and episode are required');
        }

        return this.providers.map(provider => ({
            name: provider.name,
            url: `${provider.baseUrl}/tv/${tmdbId}/${season}/${episode}`,
            emoji: provider.emoji
        }));
    }
}

// Export singleton instance
module.exports = new VidSrcService();
