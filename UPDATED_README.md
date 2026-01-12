# Discord Movie & TV Streaming Bot

A Netflix-like movie and TV show browser for Discord with beautiful interactive UI!

## ✨ Features

- 🎬 Search any movie or TV show
- 🔥 Browse trending content
- ⭐ Explore popular movies/shows
- 🖼️ Beautiful cards with posters
- ⭐ Star ratings (★★★★★)
- ⬅️➡️ Interactive pagination
- ▶️ One-click streaming
- 📱 Professional UI

## 🎯 Available Commands

### `/search <query>` - Search for content
```
/search query:Inception
/search query:Breaking Bad type:TV Shows Only
```
Browse results with ⬅️ ➡️ buttons, see posters and ratings!

### `/trending` - Browse trending content
```
/trending
/trending type:Movies timeframe:Today
```
Discover what's hot right now!

### `/popular` - Browse popular content
```
/popular
/popular type:TV Shows
```
Explore top-rated content!

## 🎨 What You Get

Each result shows:
- 🖼️ High-quality poster
- ⭐ Star rating (★★★★★)
- 📝 Description
- 📅 Release date
- 🎭 Genres
- ▶️ Watch Now button
- ⬅️➡️ Navigation buttons

---

## 🚀 Setup

### 1. Configure Environment

Your `.env` file should have:

```env
DISCORD_TOKEN=your_discord_bot_token_here
TMDB_API_KEY=d168cb7e62f9692894c20fdb039ae126
BOT_PREFIX=/
```

**Note:** TMDB API key is already provided above!

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Bot
```bash
npm start
```

### 4. Wait for Commands
Commands take 5-60 minutes to register globally.

### 5. Use Commands
```
/search query:Your favorite movie
/trending
/popular
```

---

## 📋 Requirements

- Node.js 16.9.0+
- Discord bot with permissions:
  - View Channels
  - Send Messages
  - Embed Links
  - Use Slash Commands

---

## 🎬 Features

- **Smart Search** - Find any movie or TV show
- **Trending Lists** - See what's hot now
- **Popular Content** - Browse consistently top-rated content
- **Instant Streaming** - Direct links to watch
- **Beautiful Embeds** - Rich Discord formatting
- **Fast Caching** - Repeat searches are instant

---

## 🔧 Tech Stack

- discord.js v14
- TMDB API (metadata)
- VidSrc (streaming)
- In-memory caching

---

## 📊 Project Structure

```
src/
├── bot.js              # Main bot
├── commands/
│   ├── search.js       # Search command
│   ├── trending.js     # Trending command
│   └── popular.js      # Popular command
├── services/
│   ├── cache.service.js    # Caching
│   ├── tmdb.service.js     # TMDB API
│   └── vidsrc.service.js   # Streaming links
└── config/
    ├── config.js       # Bot settings
    └── keys.js         # API keys
```

---

## ⚖️ Legal

This bot provides links to third-party streaming services. We do not host any content.

---

## 📄 License

ISC
