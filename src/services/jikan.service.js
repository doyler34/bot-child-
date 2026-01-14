const axios = require('axios');

class JikanService {
    constructor() {
        this.baseUrl = 'https://api.jikan.moe/v4';
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 5000
        });
    }

    async topAnime(page = 1) {
        const res = await this.client.get('/top/anime', {
            params: {
                page,
                filter: 'bypopularity',
                limit: 25
            }
        });
        return res.data?.data || [];
    }

    async trendingAnime(page = 1) {
        // Jikan does not have a dedicated "trending"; use score/rank proxy
        const res = await this.client.get('/top/anime', {
            params: {
                page,
                limit: 25
            }
        });
        return res.data?.data || [];
    }

    async searchAnime(query, page = 1) {
        const res = await this.client.get('/anime', {
            params: {
                q: query,
                page,
                limit: 25,
                order_by: 'title'
            }
        });
        return res.data?.data || [];
    }
}

module.exports = new JikanService();
