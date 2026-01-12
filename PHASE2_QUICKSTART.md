# Phase 2 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Get Your TMDB API Key

1. Go to https://www.themoviedb.org/signup
2. Create a free account
3. Go to Settings → API → Request an API Key
4. Choose "Developer" option
5. Fill out the form (use any website URL if you don't have one)
6. Copy your API Key (v3 auth)

### 2. Update Your .env File

Open `.env` and add your keys:

```env
DISCORD_TOKEN=your_discord_token_here
TMDB_API_KEY=your_tmdb_key_here
BOT_PREFIX=/
```

### 3. Install Dependencies (if not done)

```bash
npm install
```

### 4. Start the Bot

```bash
npm start
```

Look for this in the output:
```
✓ Successfully registered 1 slash command(s) globally
```

### 5. Test in Discord

⚠️ **Wait 5-10 minutes** for commands to appear (or up to 1 hour for global registration).

Then try these commands:

```
/test search query:Inception
/test trending type:movie timeframe:week
/test movie id:27205
/test cache
```

---

## 🎬 Quick Test Commands

### Search for Movies
```
/test search query:Interstellar
/test search query:The Matrix type:movie
```

### Search for TV Shows
```
/test search query:Breaking Bad type:tv
/test search query:Stranger Things type:tv
```

### View Trending
```
/test trending type:all timeframe:week
/test trending type:movie timeframe:day
```

### Get Movie Details
```
/test movie id:27205
```
Common Movie IDs:
- 27205 = Inception
- 157336 = Interstellar  
- 550 = Fight Club
- 13 = Forrest Gump

### Get TV Show Details
```
/test tv id:1396
```
Common TV Show IDs:
- 1396 = Breaking Bad
- 1399 = Game of Thrones
- 66732 = Stranger Things
- 60735 = The Flash

### Generate Streaming Link
```
/test stream id:27205 type:movie
/test stream id:1396 type:tv
```

### Check Cache Performance
```
/test cache
```

Run the same search twice to see cache hits increase!

---

## ✅ Success Indicators

Your bot is working if you see:

1. **Bot Status:** Green circle (online) in Discord
2. **Commands Appear:** `/test` shows up in slash command menu
3. **Search Works:** Returns movie/TV results with posters
4. **No Errors:** No red error messages in embeds
5. **Cache Works:** Stats show increasing numbers

---

## 🐛 Quick Troubleshooting

### Commands don't appear
- **Wait 1 hour** (global commands are slow)
- Or restart Discord app
- Or try in a different server

### "Invalid TMDB API key"
- Check your `.env` file
- Make sure TMDB_API_KEY is set correctly
- Restart the bot

### "Resource not found"
- Use valid TMDB IDs
- Get IDs from `/test search` first

### Bot offline
- Check Discord token in `.env`
- Run `npm start` again

---

## 📊 What Each Service Does

**Cache Service** 🗄️
- Stores API responses for 1 hour
- Makes repeat requests instant
- Reduces API calls

**TMDB Service** 🎬
- Fetches movie/TV data
- Searches content
- Gets trending/popular lists

**VidSrc Service** 📺
- Generates streaming URLs
- Creates embed links
- Formats for Discord

---

## 🎯 Next Steps

Once Phase 2 is working:

1. **Test all commands** - Make sure everything works
2. **Check cache stats** - Verify caching is working
3. **Try different searches** - Explore the API
4. **Ready for Phase 3?** - Build the UI system!

---

**Phase 2 Complete!** Your bot can now fetch and display movie/TV data. 🎉
