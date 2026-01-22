/**
 * Continue Watching Service
 * Tracks what users are currently watching with proper data persistence
 */

const database = require('./database');

class ContinueWatchingService {
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
     * Record that user watched a movie
     * @param {string} userId - Discord user ID
     * @param {object} movie - Movie item {id, title, poster_path}
     * @returns {boolean} - Success status
     */
    recordMovie(userId, movie) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                INSERT INTO continue_watching 
                (user_id, tmdb_id, media_type, title, poster_path, last_watched)
                VALUES (?, ?, 'movie', ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, tmdb_id, media_type) 
                DO UPDATE SET last_watched = CURRENT_TIMESTAMP
            `);

            stmt.run(
                userId,
                movie.id,
                movie.title || movie.name,
                movie.poster_path
            );

            return true;
        } catch (error) {
            console.error('Error recording movie:', error);
            return false;
        }
    }

    /**
     * Record that user watched a TV episode
     * @param {string} userId - Discord user ID
     * @param {object} show - TV show item {id, title, poster_path}
     * @param {number} season - Season number
     * @param {number} episode - Episode number
     * @returns {boolean} - Success status
     */
    recordEpisode(userId, show, season, episode) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                INSERT INTO continue_watching 
                (user_id, tmdb_id, media_type, title, poster_path, season, episode, last_watched)
                VALUES (?, ?, 'tv', ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, tmdb_id, media_type) 
                DO UPDATE SET 
                    season = excluded.season,
                    episode = excluded.episode,
                    last_watched = CURRENT_TIMESTAMP
            `);

            stmt.run(
                userId,
                show.id,
                show.name || show.title,
                show.poster_path,
                season,
                episode
            );

            return true;
        } catch (error) {
            console.error('Error recording episode:', error);
            return false;
        }
    }

    /**
     * Get user's continue watching list
     * @param {string} userId - Discord user ID
     * @param {number} limit - Max items to return (default: 20)
     * @returns {Array} - Array of continue watching items
     */
    getUserContinueWatching(userId, limit = 20) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                SELECT * FROM continue_watching 
                WHERE user_id = ? 
                ORDER BY last_watched DESC 
                LIMIT ?
            `);

            return stmt.all(userId, limit);
        } catch (error) {
            console.error('Error getting continue watching:', error);
            return [];
        }
    }

    /**
     * Get what user is watching for a specific show
     * @param {string} userId - Discord user ID
     * @param {number} tmdbId - TMDB show ID
     * @returns {object|null} - Continue watching item or null
     */
    getShowProgress(userId, tmdbId) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                SELECT * FROM continue_watching 
                WHERE user_id = ? AND tmdb_id = ? AND media_type = 'tv'
            `);

            return stmt.get(userId, tmdbId);
        } catch (error) {
            console.error('Error getting show progress:', error);
            return null;
        }
    }

    /**
     * Remove item from continue watching
     * @param {string} userId - Discord user ID
     * @param {number} tmdbId - TMDB ID
     * @param {string} mediaType - 'movie' or 'tv'
     * @returns {boolean} - Success status
     */
    removeFromContinueWatching(userId, tmdbId, mediaType) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                DELETE FROM continue_watching 
                WHERE user_id = ? AND tmdb_id = ? AND media_type = ?
            `);

            const result = stmt.run(userId, tmdbId, mediaType);
            return result.changes > 0;
        } catch (error) {
            console.error('Error removing from continue watching:', error);
            return false;
        }
    }

    /**
     * Clear user's entire continue watching history
     * @param {string} userId - Discord user ID
     * @returns {boolean} - Success status
     */
    clearContinueWatching(userId) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                DELETE FROM continue_watching WHERE user_id = ?
            `);

            stmt.run(userId);
            return true;
        } catch (error) {
            console.error('Error clearing continue watching:', error);
            return false;
        }
    }

    /**
     * Clean up old continue watching entries (older than 90 days)
     * @returns {number} - Number of entries removed
     */
    cleanupOldEntries(daysOld = 90) {
        this._ensureDb();

        try {
            const stmt = this.db.prepare(`
                DELETE FROM continue_watching 
                WHERE last_watched < datetime('now', '-' || ? || ' days')
            `);

            const result = stmt.run(daysOld);
            return result.changes;
        } catch (error) {
            console.error('Error cleaning up old entries:', error);
            return 0;
        }
    }
}

module.exports = new ContinueWatchingService();
