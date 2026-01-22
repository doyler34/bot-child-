const axios = require('axios');

class JikanService {
    constructor() {
        this.baseUrl = 'https://api.jikan.moe/v4';
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000 // Increased timeout to 10 seconds
        });
    }

    async topAnime(page = 1) {
        try {
            console.log(`[Jikan] Fetching top anime page ${page}...`);
            const res = await this.client.get('/top/anime', {
                params: {
                    page,
                    filter: 'bypopularity',
                    limit: 25
                }
            });
            console.log(`[Jikan] Top anime fetched: ${res.data?.data?.length || 0} items`);
            return res.data?.data || [];
        } catch (error) {
            console.error('[Jikan] Top anime error:', error?.response?.status, error?.response?.data || error?.message);
            throw error;
        }
    }

    async trendingAnime(page = 1) {
        try {
            console.log(`[Jikan] Fetching trending anime page ${page}...`);
            // Jikan does not have a dedicated "trending"; use score/rank proxy
            const res = await this.client.get('/top/anime', {
                params: {
                    page,
                    limit: 25
                }
            });
            console.log(`[Jikan] Trending anime fetched: ${res.data?.data?.length || 0} items`);
            return res.data?.data || [];
        } catch (error) {
            console.error('[Jikan] Trending anime error:', error?.response?.status, error?.response?.data || error?.message);
            throw error;
        }
    }

    async searchAnime(query, page = 1) {
        try {
            console.log(`[Jikan] Searching anime: "${query}" page ${page}...`);
            const res = await this.client.get('/anime', {
                params: {
                    q: query,
                    page,
                    limit: 25,
                    order_by: 'title'
                }
            });
            console.log(`[Jikan] Search results: ${res.data?.data?.length || 0} items`);
            return res.data?.data || [];
        } catch (error) {
            console.error('[Jikan] Search anime error:', error?.response?.status, error?.response?.data || error?.message);
            throw error;
        }
    }

    async getAnimeById(malId) {
        try {
            console.log(`[Jikan] Fetching anime details for MAL ID: ${malId}...`);
            const res = await this.client.get(`/anime/${malId}/full`);
            console.log(`[Jikan] Anime details fetched for: ${res.data?.data?.title || 'unknown'}`);
            return res.data?.data || null;
        } catch (error) {
            console.error('[Jikan] Get anime by ID error:', error?.response?.status, error?.response?.data || error?.message);
            throw error;
        }
    }
}

module.exports = new JikanService();
