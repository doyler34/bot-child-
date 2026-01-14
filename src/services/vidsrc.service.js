/**
 * VidSrc Service
 * Generates streaming links for movies and TV shows
 * Uses VidSrc embed-based streaming provider
 */

const axios = require('axios');
const keys = require('../config/keys');

class VidSrcService {
    constructor() {
        this.baseUrl = keys.vidsrc.baseUrl;
        
        // Multiple streaming providers
        this.providers = [
            // Prefer domains that resolve from our host first
            {
                name: 'VidSrc',
                slug: 'vidsrc',
                baseUrl: 'https://vidsrc.to/embed',
                emoji: '🎬'
            },
            {
                name: 'VidSrc Me',
                slug: 'vidsrcme',
                baseUrl: 'https://vidsrc.me/embed',
                emoji: '🎥'
            },
            // Keep Pro last; it may resolve to embed.su which can fail on some hosts
            {
                name: 'VidSrc Pro',
                slug: 'vidsrcpro',
                baseUrl: 'https://vidsrc.pro/embed',
                emoji: '⭐'
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

        const provider = this.providers[0];
        const url = this._buildProviderUrl(provider, `/movie/${tmdbId}`);
        
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

        const provider = this.providers[0];
        const url = this._buildProviderUrl(provider, `/tv/${tmdbId}/${season}/${episode}`);
        
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
     * Resolve a provider embed URL to the innermost iframe target (proxy use)
     * @param {string} providerSlug - Provider identifier
     * @param {string} type - 'movie' or 'tv'
     * @param {object} params - { tmdbId, season?, episode? }
     * @returns {Promise<string>}
     */
    async resolveStream(providerSlug, type, params) {
        const provider = this._getProviderBySlug(providerSlug);
        if (!provider) {
            throw new Error('Unsupported provider');
        }

        let path;
        if (type === 'movie') {
            if (!params?.tmdbId) throw new Error('TMDB ID is required');
            path = `/movie/${params.tmdbId}`;
        } else if (type === 'tv') {
            if (!params?.tmdbId || !params?.season || !params?.episode) {
                throw new Error('TMDB ID, season, and episode are required');
            }
            path = `/tv/${params.tmdbId}/${params.season}/${params.episode}`;
        } else {
            throw new Error('Invalid media type');
        }

        const targetUrl = `${provider.baseUrl}${path}`;
        return await this._extractIframeSrc(targetUrl);
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
            url: this._buildProviderUrl(provider, `/movie/${tmdbId}`),
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
            url: this._buildProviderUrl(provider, `/tv/${tmdbId}/${season}/${episode}`),
            emoji: provider.emoji
        }));
    }

    /**
     * Build provider URL; if proxy enabled, wrap through proxy
     * @private
     */
    _buildProviderUrl(provider, path) {
        const proxyEnabled = keys.proxy?.enabled;
        const proxyBase = keys.proxy?.publicBaseUrl || `http://localhost:${keys.proxy?.port || 3001}`;

        if (proxyEnabled) {
            const normalizedPath = path.startsWith('/') ? path : `/${path}`;
            return `${proxyBase.replace(/\/$/, '')}/proxy/${provider.slug}${normalizedPath}`;
        }

        return `${provider.baseUrl}${path}`;
    }

    /**
     * Find provider by slug
     * @private
     */
    _getProviderBySlug(slug) {
        return this.providers.find(p => p.slug === slug);
    }

    /**
     * Extract deepest iframe src from an embed page (up to depth 3)
     * @private
     */
    async _extractIframeSrc(targetUrl, depth = 0) {
        if (depth > 3) {
            // Too deep; fall back to last known URL
            return targetUrl;
        }

        try {
            const response = await axios.get(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; StreamBot/1.0)'
                },
                timeout: 8000
            });

            const iframeMatch = response.data.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (!iframeMatch) {
                return targetUrl;
            }

            const iframeSrc = iframeMatch[1];
            const resolved = new URL(iframeSrc, targetUrl).toString();

            return this._extractIframeSrc(resolved, depth + 1);
        } catch (err) {
            // If DNS/egress blocked, fall back to the original embed URL
            console.warn(`Proxy iframe unwrap failed (${err.code || err.message}); returning original URL`);
            return targetUrl;
        }
    }
}

// Export singleton instance
module.exports = new VidSrcService();
