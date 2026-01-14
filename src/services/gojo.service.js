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
            const animeId = anime.id || anime.animeId || anime._id;

            if (!animeId) {
                console.warn('[Gojo] No anime ID found in search results');
                console.warn('[Gojo] First result:', JSON.stringify(anime));
                return null;
            }

            console.log(`[Gojo] Found anime ID: ${animeId} for "${title}"`);

            // Step 2: Get episodes
            const episodes = await this.getEpisodes(animeId);
            if (!episodes || episodes.length === 0) {
                console.warn(`[Gojo] No episodes found for anime ID: ${animeId}`);
                return null;
            }

            console.log(`[Gojo] Found ${episodes.length} episodes for anime ID: ${animeId}`);

            // Find the requested episode
            // Try multiple field names and also try index-based (episodes are usually 1-indexed)
            const targetEpisode = episodes.find(ep => {
                const epNum = ep.episode || ep.episodeNumber || ep.number || ep.ep || ep.epNum;
                return epNum === episode || epNum === episode.toString() || parseInt(epNum) === episode;
            }) || episodes[episode - 1]; // Fallback to array index (0-indexed, so episode-1)

            if (!targetEpisode) {
                console.warn(`[Gojo] Episode ${episode} not found. Available episodes: ${episodes.length}`);
                if (episodes.length > 0) {
                    console.warn(`[Gojo] First episode sample:`, JSON.stringify(episodes[0]));
                }
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
                console.warn('[Gojo] No stream data returned');
                return null;
            }

            // Handle different response formats
            let sources = [];
            if (Array.isArray(streamData)) {
                sources = streamData;
            } else if (streamData.sources) {
                sources = Array.isArray(streamData.sources) ? streamData.sources : [];
            } else if (streamData.streams) {
                sources = Array.isArray(streamData.streams) ? streamData.streams : [];
            } else if (streamData.url || streamData.stream) {
                // Single stream URL
                return streamData.url || streamData.stream;
            }

            if (sources.length > 0) {
                // Sort by quality (1080p > 720p > 480p, etc.)
                const sorted = sources.sort((a, b) => {
                    const qualityA = parseInt(a.quality || a.resolution || '0');
                    const qualityB = parseInt(b.quality || b.resolution || '0');
                    return qualityB - qualityA;
                });
                const bestStream = sorted[0];
                return bestStream.url || bestStream.stream || bestStream.src || bestStream.link || null;
            }

            console.warn('[Gojo] No stream sources found in response');
            return null;
        } catch (error) {
            console.error('[Gojo] Failed to get episode stream URL:', error);
            return null;
        }
    }
}

module.exports = new GojoService();
