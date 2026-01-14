const axios = require('axios');

class AniListService {
    constructor() {
        this.endpoint = 'https://graphql.anilist.co';
    }

    /**
     * Find AniList ID and MAL ID by title (fuzzy) and optional year
     * @param {string} title
     * @param {string|number} year
     * @returns {Promise<{anilistId:number|null, malId:number|null}>}
     */
    async findIds(title, year) {
        if (!title) return { anilistId: null, malId: null };
        const query = `
          query ($search: String, $year: Int) {
            Page(page: 1, perPage: 1) {
              media(search: $search, type: ANIME, seasonYear: $year) {
                id
                idMal
              }
            }
          }
        `;
        const variables = {
            search: title,
            year: year ? parseInt(year, 10) : undefined
        };

        try {
            const res = await axios.post(this.endpoint, { query, variables }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });
            const media = res.data?.data?.Page?.media;
            if (media && media.length > 0) {
                return { anilistId: media[0].id ?? null, malId: media[0].idMal ?? null };
            }
            return { anilistId: null, malId: null };
        } catch (err) {
            console.warn('AniList lookup failed:', err.message);
            return { anilistId: null, malId: null };
        }
    }
}

module.exports = new AniListService();
