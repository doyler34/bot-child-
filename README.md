# 🎬 ZipxMovies - Discord Streaming Bot

A fully-featured Discord bot for browsing movies and TV shows with a Netflix-like experience, complete with watchlists, continue watching, and multiple streaming providers.

---

## ✨ Features

### 🎯 Core Features
- ✅ **Single `/watch` Command** - All features in one menu
- ✅ **Search** - Find any movie or TV show
- ✅ **Browse by Category** - Popular, Trending
- ✅ **Netflix-Style Details** - Full cast, ratings, genres, descriptions
- ✅ **Multiple Streaming Providers** - 3 different streaming links per item
- ✅ **TV Show Navigation** - Season/Episode selection with progress tracking

### 📚 Personal Features
- ✅ **My Watchlist** - Save movies/shows to watch later
- ✅ **Continue Watching** - Auto-tracks your viewing history
- ✅ **Persistent Database** - SQLite with proper migrations
- ✅ **Auto-Delete Messages** - Cleans up after 6 hours

### 🎨 User Experience
- ✅ **Interactive Menus** - Button-based navigation
- ✅ **Pagination** - Browse results 2 at a time
- ✅ **High-Quality Posters** - Full TMDB images
- ✅ **Smart Caching** - Fast responses, reduced API calls

---

## 🚀 Quick Deploy to Railway

### Option 1: Deploy Button (Easiest)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### Option 2: Manual Deploy
See **[RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)** for complete guide

**Quick Steps:**
1. Push to GitHub
2. Connect to Railway
3. Add environment variables:
   - `DISCORD_TOKEN`
   - `TMDB_API_KEY`
4. Deploy! 🎉

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- Discord Bot Token
- TMDB API Key

### Installation
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your tokens

# Start bot
npm start
```

### Get API Keys

**Discord Bot Token:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create application → Bot → Copy token
3. Enable these intents: Guilds, Guild Messages, Message Content

**TMDB API Key:**
1. Sign up at [TMDB](https://www.themoviedb.org/)
2. Go to Settings → API → Request API Key
3. Choose "Developer" → Fill form → Get key

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/watch` | Main menu - Access all features |

### Navigation Flow
```
/watch
├── 🔍 Search → Search anything
├── 🎬 Movies → Popular / Trending / Search
├── 📺 TV Shows → Popular / Trending / Search
├── ⭐ My Watchlist → Your saved items
└── ▶️ Continue Watching → Resume where you left off
```

---

## 🏗️ Project Structure

```
├── src/
│   ├── bot.js                    # Main bot entry
│   ├── commands/
│   │   └── watch.js              # Single command with menu
│   ├── interactions/
│   │   ├── menuHandler.js        # Menu navigation
│   │   └── detailsHandler.js     # Movie/TV details
│   ├── database/
│   │   ├── database.js           # SQLite setup
│   │   ├── watchlist.service.js  # Watchlist management
│   │   └── continueWatching.service.js
│   ├── services/
│   │   ├── tmdb.service.js       # TMDB API
│   │   ├── vidsrc.service.js     # Streaming links
│   │   └── cache.service.js      # In-memory cache
│   ├── ui/
│   │   └── embedBuilder.js       # Discord embeds
│   ├── utils/
│   │   ├── paginator.js          # Pagination system
│   │   └── messageCleanup.js     # Auto-delete
│   └── config/
│       ├── config.js             # Bot configuration
│       └── keys.js               # Environment variables
├── data/                         # SQLite database (auto-created)
├── railway.toml                  # Railway config
├── RAILWAY_DEPLOY.md            # Deployment guide
└── package.json
```

---

## 🛠️ Tech Stack

- **Discord.js v14** - Discord bot framework
- **SQLite3** (better-sqlite3) - Persistent storage
- **TMDB API** - Movie/TV metadata
- **VidSrc** - Streaming links
- **Node.js 18+** - Runtime
- **Railway** - Hosting (recommended)

---

## 📊 Database Schema

### Watchlist Table
```sql
- user_id (TEXT)
- tmdb_id (INTEGER)
- media_type (TEXT: 'movie' or 'tv')
- title, poster_path, release_date, rating
- added_at (TIMESTAMP)
```

### Continue Watching Table
```sql
- user_id (TEXT)
- tmdb_id (INTEGER)
- media_type (TEXT)
- season, episode (INTEGER, nullable)
- last_watched (TIMESTAMP)
```

---

## 🎯 Features in Detail

### Watchlist
- Click ⭐ on any movie/show details page
- Persists across restarts
- View from main `/watch` menu
- One-click removal

### Continue Watching
- **Auto-tracks** when you view any content
- **Movies:** Records last viewed
- **TV Shows:** Tracks S##E## progress
- Resume from main menu

### Streaming Providers
1. 🎬 **VidSrc** - Main provider
2. ⭐ **VidSrc Pro** - Alternative
3. 🎥 **VidSrc Me** - Backup

### Message Auto-Delete
- All bot messages delete after **6 hours**
- Keeps Discord clean
- Configurable in code

---

## 🐛 Troubleshooting

### Bot Offline
- Check `DISCORD_TOKEN` in environment variables
- Verify bot has proper permissions
- Check Railway logs

### Commands Not Working
- Wait 1 hour after deployment for command registration
- Restart bot from Railway dashboard
- Check bot has "Use Application Commands" permission

### Database Issues
- Railway creates `/data` directory automatically
- Database is persistent across restarts
- Check Railway logs for errors

### Interaction Expired Errors
- Use fresh `/watch` commands after bot restarts
- Don't click buttons from old messages (15min+ old)

---

## 📈 Roadmap

- ✅ Phase 1-6: Core Features (Complete)
- ✅ Watchlist & Continue Watching
- ✅ Database Integration
- ✅ Railway Deployment Ready
- 🔜 Genre Browsing
- 🔜 Advanced Search Filters
- 🔜 User Preferences
- 🔜 Recommendations

---

## ⚖️ Legal Disclaimer

This bot provides links to third-party streaming services. We do not host any content. All content is provided by external sources. Use at your own risk.

- **TMDB:** Used for metadata (not affiliated)
- **VidSrc:** Third-party streaming provider
- **Discord:** Platform provider

---

## 📄 License

ISC License - See LICENSE file

---

## 🤝 Support

- 📖 [Railway Deployment Guide](./RAILWAY_DEPLOY.md)
- 🐛 Report issues on GitHub
- 💬 Join our Discord server

---

**Status:** ✅ Production Ready | Railway Deployment Configured
**Version:** 1.0.0
**Last Updated:** January 2026

