/**
 * Bot Configuration
 * Main configuration file for bot settings, embed styling, and behavior
 */

require('dotenv').config();

module.exports = {
    // Bot Settings
    bot: {
        prefix: process.env.BOT_PREFIX || '/',
        name: 'StreamBot',
        description: 'Browse and stream movies & TV shows',
        version: '1.0.0'
    },

    // Discord Embed Styling
    embed: {
        colors: {
            primary: 0xE50914,    // Netflix red
            success: 0x00FF00,
            error: 0xFF0000,
            info: 0x00BFFF,
            warning: 0xFFA500
        },
        footer: {
            text: 'StreamBot • Powered by TMDB',
            iconUrl: null
        },
        thumbnail: {
            enabled: true
        }
    },

    // Pagination Settings
    pagination: {
        itemsPerPage: 5,
        timeout: 300000,  // 5 minutes
        emojis: {
            previous: '⬅️',
            next: '➡️',
            close: '❌',
            select: '✅'
        }
    },

    // Category Emojis
    categories: {
        trending: '🔥',
        popular: '⭐',
        new: '🆕',
        movies: '🎬',
        tvShows: '📺',
        search: '🔍'
    },

    // API Settings
    api: {
        cacheTimeout: 3600000,  // 1 hour in milliseconds
        requestTimeout: 5000,   // 5 seconds
        maxRetries: 3
    },

    // Permissions
    permissions: {
        requiredPermissions: [
            'ViewChannel',
            'SendMessages',
            'EmbedLinks',
            'AddReactions',
            'ReadMessageHistory'
        ]
    }
};
