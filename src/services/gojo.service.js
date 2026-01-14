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
            const results = res.data || [];
            console.log(`[Gojo] Search returned ${results.length} results`);
            // API returns array of {title, image, href} where href is the anime ID
            return results.map(item => ({
                ...item,
                id: item.href, // href is the anime ID
                animeId: item.href
            }));
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
            const episodes = res.data || [];
            console.log(`[Gojo] Episodes response:`, episodes.length > 0 ? `Found ${episodes.length} episodes` : 'No episodes');
            // API returns array of {href, number} where href is the full stream URL path
            // Example: "animeId/pahe/1/epId1/zaza/1/epId2/strix/1/epId3"
            return episodes.map(ep => ({
                ...ep,
                episode: ep.number,
                episodeNumber: ep.number,
                streamPath: ep.href // Store the href for stream URL generation
            }));
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
            console.log(`[Gojo] Fetching stream URLs for path: ${streamUrl}`);
            const res = await this.client.get('/api/stream', {
                params: { url: streamUrl }
            });
            const data = res.data || {};
            console.log(`[Gojo] Stream response:`, data.streams ? `${data.streams.length} streams` : 'No streams');
            return data;
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
                console.warn(`[Gojo] No search results for "${title}"`);
                return null;
            }

            // Use first result (best match)
            const anime = searchResults[0];
            const animeId = anime.id || anime.animeId;

            if (!animeId) {
                console.warn('[Gojo] No anime ID found in search results');
                return null;
            }

            console.log(`[Gojo] Found anime: "${anime.title}" (ID: ${animeId})`);

            // Step 2: Get episodes
            const episodes = await this.getEpisodes(animeId);
            if (!episodes || episodes.length === 0) {
                console.warn(`[Gojo] No episodes found for anime ID: ${animeId}`);
                return null;
            }

            console.log(`[Gojo] Found ${episodes.length} episodes`);

            // Find the requested episode
            const targetEpisode = episodes.find(ep => {
                const epNum = ep.episode || ep.episodeNumber || ep.number;
                return epNum === episode || parseInt(epNum) === episode;
            }) || episodes[episode - 1]; // Fallback to array index

            if (!targetEpisode || !targetEpisode.streamPath) {
                console.warn(`[Gojo] Episode ${episode} not found or missing streamPath`);
                return null;
            }

            console.log(`[Gojo] Found episode ${episode}, streamPath: ${targetEpisode.streamPath}`);

            // Step 3: Get stream URLs using the href/streamPath from the episode
            const streamData = await this.getStreamUrls(targetEpisode.streamPath);
            if (!streamData || !streamData.streams) {
                console.warn('[Gojo] No stream data returned');
                return null;
            }

            // API returns {streams: [{label, url}]}
            const streams = streamData.streams;
            if (!Array.isArray(streams) || streams.length === 0) {
                console.warn('[Gojo] No streams in response');
                return null;
            }

            // Sort by quality (extract number from label like "pahe - 1080p")
            const sorted = streams.sort((a, b) => {
                const qualityA = parseInt(a.label?.match(/(\d+)p/)?.[1] || '0');
                const qualityB = parseInt(b.label?.match(/(\d+)p/)?.[1] || '0');
                return qualityB - qualityA;
            });

            const bestStream = sorted[0];
            console.log(`[Gojo] Returning best stream: ${bestStream.label}`);
            return bestStream.url;
        } catch (error) {
            console.error('[Gojo] Failed to get episode stream URL:', error.message);
            return null;
        }
    }
}

module.exports = new GojoService();
