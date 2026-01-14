/**
 * VidSrc Service
 * Generates streaming links for movies and TV shows
 * Uses VidSrc embed-based streaming provider
 */

const axios = require('axios');
const keys = require('../config/keys');
const tmdbService = require('./tmdb.service');
const aniListService = require('./anilist.service');

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
            }
        ];

        // Load optional extra providers from env (e.g., anime-focused)
        this.providers.push(...this._loadExtraProviders());
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

        const provider = this._getPrimaryProviderFor('movie');
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

        const provider = this._getPrimaryProviderFor('tv');
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

        return this.providers
            .filter(p => this._supportsType(p, 'movie'))
            .map(provider => ({
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

        return this.providers
            .filter(p => this._supportsType(p, 'tv'))
            .map(provider => ({
                name: provider.name,
                url: this._buildProviderUrl(provider, `/tv/${tmdbId}/${season}/${episode}`),
                emoji: provider.emoji
            }));
    }

    /**
     * Generate TV links plus anime providers (uses AniList->MAL mapping)
     * @param {number} tmdbId
     * @param {number} season
     * @param {number} episode
     * @returns {Promise<Array>}
     */
    async getAllTVLinksWithAnime(tmdbId, season, episode, opts = {}) {
        const baseLinks = this.getAllTVLinks(tmdbId, season, episode);
        const malId = opts.malId;

        // Find anime-capable providers
        const animeProviders = this.providers.filter(p => p.types && p.types.includes('tv') && p.mode);
        if (animeProviders.length === 0) {
            return baseLinks;
        }

        try {
            let resolvedMalId = malId;

            // If no MAL from upstream, try resolving from TMDB -> AniList
            if (!resolvedMalId && tmdbId) {
                const show = await tmdbService.getTVShowDetails(tmdbId);
                const title = show?.name;
                const year = show?.first_air_date ? show.first_air_date.split('-')[0] : undefined;
                const ids = await aniListService.findIds(title, year);
                resolvedMalId = ids.malId;
            }

            const animeLinks = animeProviders
                .map(provider => {
                    if (provider.mode === 'mal') {
                        if (!resolvedMalId) return null;
                        return {
                            name: provider.name,
                            url: `${provider.baseUrl.replace(/\/$/, '')}/${resolvedMalId}/${episode}`,
                            emoji: provider.emoji
                        };
                    }
                    return null;
                })
                .filter(Boolean);

            return [...baseLinks, ...animeLinks];
        } catch (err) {
            console.warn('Failed to load anime provider links:', err.message);
            return baseLinks;
        }
    }

    /**
     * Slugify a title for title-based anime providers
     * @private
     */
    _slugifyTitle(title, year) {
        if (!title) return null;
        const base = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/--+/g, '-');
        if (!base) return null;
        return year ? `${base}-${year}` : base;
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
     * Get a primary provider that supports the given type
     * @private
     */
    _getPrimaryProviderFor(type) {
        return this.providers.find(p => this._supportsType(p, type)) || this.providers[0];
    }

    /**
     * Check if provider supports type
     * @private
     */
    _supportsType(provider, type) {
        if (!provider.types || provider.types.length === 0) return true;
        return provider.types.includes(type);
    }

    /**
     * Load extra providers from env ANIME_PROVIDERS (JSON array)
     * @private
     */
    _loadExtraProviders() {
        const raw = keys.animeProviders;
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            return parsed
                .filter(p => p && p.name && p.slug && p.baseUrl)
                .map(p => ({
                    name: p.name,
                    slug: p.slug,
                    baseUrl: p.baseUrl,
                    emoji: p.emoji || '🍥',
                    types: Array.isArray(p.types) ? p.types : [],
                    mode: p.mode || undefined
                }));
        } catch (err) {
            console.warn('Failed to parse ANIME_PROVIDERS:', err.message);
            return [];
        }
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
