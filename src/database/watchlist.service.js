/**
 * Watchlist Service
 * Manages user watchlists with proper data layer separation
 */

const database = require('./database');

class WatchlistService {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize service
     * @private
     */
    _ensureDb() {
        if (!this.db) {
            this.db = database.getDatabase();
        }
    }

    /**
     * Add item to user's watchlist
     * @param {string} userId - Discord user ID
     * @param {object} item - Media item {id, media_type, title, poster_path, release_date, rating}
     * @returns {boolean} - Success status
     */
    addToWatchlist(userId, item) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                INSERT OR IGNORE INTO watchlist 
                (user_id, tmdb_id, media_type, title, poster_path, release_date, rating)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                userId,
                item.id,
                item.media_type,
                item.title || item.name,
                item.poster_path,
                item.release_date || item.first_air_date,
                item.vote_average
            );

            return result.changes > 0;
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            return false;
        }
    }

    /**
     * Remove item from user's watchlist
     * @param {string} userId - Discord user ID
     * @param {number} tmdbId - TMDB ID
     * @param {string} mediaType - 'movie' or 'tv'
     * @returns {boolean} - Success status
     */
    removeFromWatchlist(userId, tmdbId, mediaType) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                DELETE FROM watchlist 
                WHERE user_id = ? AND tmdb_id = ? AND media_type = ?
            `);

            const result = stmt.run(userId, tmdbId, mediaType);
            return result.changes > 0;
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            return false;
        }
    }

    /**
     * Get user's watchlist
     * @param {string} userId - Discord user ID
     * @param {number} limit - Max items to return (default: 50)
     * @param {number} offset - Offset for pagination (default: 0)
     * @returns {Array} - Array of watchlist items
     */
    getUserWatchlist(userId, limit = 50, offset = 0) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                SELECT * FROM watchlist 
                WHERE user_id = ? 
                ORDER BY added_at DESC 
                LIMIT ? OFFSET ?
            `);

            return stmt.all(userId, limit, offset);
        } catch (error) {
            console.error('Error getting watchlist:', error);
            return [];
        }
    }

    /**
     * Check if item is in user's watchlist
     * @param {string} userId - Discord user ID
     * @param {number} tmdbId - TMDB ID
     * @param {string} mediaType - 'movie' or 'tv'
     * @returns {boolean} - Whether item is in watchlist
     */
    isInWatchlist(userId, tmdbId, mediaType) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                SELECT 1 FROM watchlist 
                WHERE user_id = ? AND tmdb_id = ? AND media_type = ?
            `);

            return stmt.get(userId, tmdbId, mediaType) !== undefined;
        } catch (error) {
            console.error('Error checking watchlist:', error);
            return false;
        }
    }

    /**
     * Get watchlist count for user
     * @param {string} userId - Discord user ID
     * @returns {number} - Number of items in watchlist
     */
    getWatchlistCount(userId) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                SELECT COUNT(*) as count FROM watchlist 
                WHERE user_id = ?
            `);

            const result = stmt.get(userId);
            return result ? result.count : 0;
        } catch (error) {
            console.error('Error getting watchlist count:', error);
            return 0;
        }
    }

    /**
     * Clear user's entire watchlist
     * @param {string} userId - Discord user ID
     * @returns {boolean} - Success status
     */
    clearWatchlist(userId) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                DELETE FROM watchlist WHERE user_id = ?
            `);

            stmt.run(userId);
            return true;
        } catch (error) {
            console.error('Error clearing watchlist:', error);
            return false;
        }
    }
}

module.exports = new WatchlistService();
