/**
 * Database Service
 * SQLite database management with best practices
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseService {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Initialize database connection and schema
     */
    initialize() {
        if (this.isInitialized) return;

        try {
            // Create data directory if it doesn't exist
            const dataDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Create database connection
            const dbPath = path.join(dataDir, 'bot.db');
            this.db = new Database(dbPath);
            
            // Enable foreign keys
            this.db.pragma('foreign_keys = ON');
            
            // Set journal mode for better performance
            this.db.pragma('journal_mode = WAL');

            // Run migrations
            this.runMigrations();

            this.isInitialized = true;
            console.log('✓ Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Run database migrations
     */
    runMigrations() {
        // Create migrations table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER UNIQUE NOT NULL,
                name TEXT NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const migrations = [
            {
                version: 1,
                name: 'create_watchlist_tables',
                sql: `
                    CREATE TABLE IF NOT EXISTS watchlist (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        tmdb_id INTEGER NOT NULL,
                        media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
                        title TEXT NOT NULL,
                        poster_path TEXT,
                        release_date TEXT,
                        rating REAL,
                        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, tmdb_id, media_type)
                    );
                    CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
                    CREATE INDEX IF NOT EXISTS idx_watchlist_added ON watchlist(added_at DESC);
                `
            },
            {
                version: 2,
                name: 'create_continue_watching_tables',
                sql: `
                    CREATE TABLE IF NOT EXISTS continue_watching (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        tmdb_id INTEGER NOT NULL,
                        media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
                        title TEXT NOT NULL,
                        poster_path TEXT,
                        season INTEGER,
                        episode INTEGER,
                        last_watched DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, tmdb_id, media_type)
                    );
                    CREATE INDEX IF NOT EXISTS idx_continue_user ON continue_watching(user_id);
                    CREATE INDEX IF NOT EXISTS idx_continue_watched ON continue_watching(last_watched DESC);
                `
            },
            {
                version: 3,
                name: 'add_anime_support',
                sql: `
                    -- Add mal_id column to watchlist (for anime)
                    ALTER TABLE watchlist ADD COLUMN mal_id INTEGER;
                    
                    -- Drop old constraint and create new watchlist table with anime support
                    CREATE TABLE watchlist_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        tmdb_id INTEGER,
                        mal_id INTEGER,
                        media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv', 'anime')),
                        title TEXT NOT NULL,
                        poster_path TEXT,
                        release_date TEXT,
                        rating REAL,
                        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, tmdb_id, media_type),
                        UNIQUE(user_id, mal_id, media_type)
                    );
                    
                    -- Copy existing data
                    INSERT INTO watchlist_new (id, user_id, tmdb_id, media_type, title, poster_path, release_date, rating, added_at)
                    SELECT id, user_id, tmdb_id, media_type, title, poster_path, release_date, rating, added_at
                    FROM watchlist;
                    
                    -- Drop old table and rename new one
                    DROP TABLE watchlist;
                    ALTER TABLE watchlist_new RENAME TO watchlist;
                    
                    -- Recreate indexes
                    CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
                    CREATE INDEX IF NOT EXISTS idx_watchlist_added ON watchlist(added_at DESC);
                    CREATE INDEX IF NOT EXISTS idx_watchlist_mal ON watchlist(mal_id);
                    
                    -- Same for continue_watching
                    ALTER TABLE continue_watching ADD COLUMN mal_id INTEGER;
                    
                    CREATE TABLE continue_watching_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        tmdb_id INTEGER,
                        mal_id INTEGER,
                        media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv', 'anime')),
                        title TEXT NOT NULL,
                        poster_path TEXT,
                        season INTEGER,
                        episode INTEGER,
                        last_watched DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, tmdb_id, media_type),
                        UNIQUE(user_id, mal_id, media_type)
                    );
                    
                    INSERT INTO continue_watching_new (id, user_id, tmdb_id, media_type, title, poster_path, season, episode, last_watched)
                    SELECT id, user_id, tmdb_id, media_type, title, poster_path, season, episode, last_watched
                    FROM continue_watching;
                    
                    DROP TABLE continue_watching;
                    ALTER TABLE continue_watching_new RENAME TO continue_watching;
                    
                    CREATE INDEX IF NOT EXISTS idx_continue_user ON continue_watching(user_id);
                    CREATE INDEX IF NOT EXISTS idx_continue_watched ON continue_watching(last_watched DESC);
                    CREATE INDEX IF NOT EXISTS idx_continue_mal ON continue_watching(mal_id);
                `
            }
        ];

        // Check and run each migration
        for (const migration of migrations) {
            const existing = this.db.prepare(
                'SELECT version FROM migrations WHERE version = ?'
            ).get(migration.version);

            if (!existing) {
                console.log(`Running migration ${migration.version}: ${migration.name}`);
                
                // Run migration in transaction
                const runMigration = this.db.transaction(() => {
                    this.db.exec(migration.sql);
                    this.db.prepare(
                        'INSERT INTO migrations (version, name) VALUES (?, ?)'
                    ).run(migration.version, migration.name);
                });

                runMigration();
                console.log(`✓ Migration ${migration.version} completed`);
            }
        }
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.isInitialized = false;
            console.log('Database connection closed');
        }
    }

    /**
     * Get database instance
     */
    getDatabase() {
        if (!this.isInitialized) {
            this.initialize();
        }
        return this.db;
    }

    /**
     * Backup database
     */
    async backup() {
        if (!this.db) return;

        try {
            const dataDir = path.join(process.cwd(), 'data');
            const backupDir = path.join(dataDir, 'backups');
            
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `bot_backup_${timestamp}.db`);
            
            await this.db.backup(backupPath);
            console.log(`✓ Database backed up to: ${backupPath}`);
            
            return backupPath;
        } catch (error) {
            console.error('Database backup failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new DatabaseService();
