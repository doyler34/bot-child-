/**
 * API Keys Management
 * Centralized module for handling all API keys and tokens
 */

require('dotenv').config();

module.exports = {
    // Discord Bot Token
    discord: {
        token: process.env.DISCORD_TOKEN || ''
    },

    // TMDB API Configuration
    tmdb: {
        apiKey: process.env.TMDB_API_KEY || '',
        baseUrl: 'https://api.themoviedb.org/3',
        imageBaseUrl: 'https://image.tmdb.org/t/p'
    },

    // VidSrc Configuration
    vidsrc: {
        baseUrl: 'https://vidsrc.to/embed'
    },

    // Optional lightweight proxy to unwrap provider iframes
    proxy: {
        enabled: process.env.PROXY_ENABLED === 'true',
        // Prefer platform-provided PORT (e.g., Railway) when PROXY_PORT not set
        port: parseInt(process.env.PROXY_PORT || process.env.PORT || '3001', 10),
        publicBaseUrl: process.env.PROXY_PUBLIC_URL || ''
    }
};
