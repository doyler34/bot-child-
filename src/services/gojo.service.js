/**
 * Gojo Anime API Service
 * Handles search, details, episodes, and streaming for Gojo Anime API
 */

const axios = require('axios');

class GojoService {
    constructor() {
        // Default base URL - can be overridden via env
        this.baseUrl = process.env.GOJO_API_URL || 'https://gojo-api.deno.dev';
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000
        });
    }

    /**
     * Search for anime by title
     * @param {string} query - Search query
     * @returns {Promise<Array>} - Array of anime results
     */
    async searchAnime(query) {
        try {
            console.log(`[Gojo] Searching anime: "${query}"`);
            const res = await this.client.get('/api/search', {
                params: { q: query }
            });
            console.log(`[Gojo] Search returned ${res.data?.length || 0} results`);
            return res.data || [];
        } catch (error) {
            console.error('[Gojo] Search error:', error?.response?.status, error?.message);
            throw error;
        }
    }

    /**
     * Get anime details by ID
     * @param {string|number} animeId - Gojo anime ID
     * @returns {Promise<object>} - Anime details
     */
    async getAnimeDetails(animeId) {
        try {
            console.log(`[Gojo] Fetching anime details for ID: ${animeId}`);
            const res = await this.client.get('/api/details', {
                params: { id: animeId }
            });
            return res.data || null;
        } catch (error) {
            console.error('[Gojo] Get details error:', error?.response?.status, error?.message);
            throw error;
        }
    }

    /**
     * Get episodes for an anime
     * @param {string|number} animeId - Gojo anime ID
     * @returns {Promise<Array>} - Array of episodes with provider IDs
     */
    async getEpisodes(animeId) {
        try {
            console.log(`[Gojo] Fetching episodes for anime ID: ${animeId}`);
            const res = await this.client.get('/api/episodes', {
                params: { id: animeId }
            });
            return res.data || [];
        } catch (error) {
            console.error('[Gojo] Get episodes error:', error?.response?.status, error?.message);
            throw error;
        }
    }

    /**
     * Get stream URLs for an episode
     * @param {string} streamUrl - Complex URL format: animeId/provider1/epNum/epId1/provider2/epNum/epId2
     * @returns {Promise<object>} - Stream URLs with quality options
     */
    async getStreamUrls(streamUrl) {
        try {
            console.log(`[Gojo] Fetching stream URLs`);
            const res = await this.client.get('/api/stream', {
                params: { url: streamUrl }
            });
            return res.data || null;
        } catch (error) {
            console.error('[Gojo] Get stream error:', error?.response?.status, error?.message);
            throw error;
        }
    }

    /**
     * Find anime by title and get stream URL for specific episode
     * @param {string} title - Anime title
     * @param {number} episode - Episode number
     * @returns {Promise<string|null>} - Direct stream URL or null
     */
    async getEpisodeStreamUrl(title, episode) {
        try {
            // Step 1: Search for anime
            const searchResults = await this.searchAnime(title);
            if (!searchResults || searchResults.length === 0) {
                return null;
            }

            // Use first result (best match)
            const anime = searchResults[0];
            const animeId = anime.id || anime.animeId;

            if (!animeId) {
                console.warn('[Gojo] No anime ID found in search results');
                return null;
            }

            // Step 2: Get episodes
            const episodes = await this.getEpisodes(animeId);
            if (!episodes || episodes.length === 0) {
                return null;
            }

            // Find the requested episode
            const targetEpisode = episodes.find(ep => 
                ep.episode === episode || ep.episodeNumber === episode || ep.number === episode
            );

            if (!targetEpisode) {
                console.warn(`[Gojo] Episode ${episode} not found`);
                return null;
            }

            // Step 3: Build stream URL
            // Format: animeId/provider1/epNum/epId1/provider2/epNum/epId2
            const providers = ['pahe', 'zaza', 'strix'];
            const streamUrlParts = [animeId];

            for (const provider of providers) {
                const epId = targetEpisode[provider] || targetEpisode[`${provider}Id`];
                if (epId) {
                    streamUrlParts.push(provider, episode, epId);
                }
            }

            if (streamUrlParts.length === 1) {
                console.warn('[Gojo] No provider IDs found for episode');
                return null;
            }

            const streamUrl = streamUrlParts.join('/');

            // Step 4: Get stream URLs
            const streamData = await this.getStreamUrls(streamUrl);
            if (!streamData) {
                return null;
            }

            // Return the first available stream URL (prefer highest quality)
            const sources = streamData.sources || streamData.streams || [];
            if (sources.length > 0) {
                // Sort by quality (1080p > 720p > 480p, etc.)
                const sorted = sources.sort((a, b) => {
                    const qualityA = parseInt(a.quality || '0');
                    const qualityB = parseInt(b.quality || '0');
                    return qualityB - qualityA;
                });
                return sorted[0].url || sorted[0].stream || null;
            }

            return null;
        } catch (error) {
            console.error('[Gojo] Failed to get episode stream URL:', error);
            return null;
        }
    }
}

module.exports = new GojoService();
