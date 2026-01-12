# Available Commands

## User Commands

### `/search <query> [type]`
Search for movies and TV shows

**Options:**
- `query` (required) - What to search for
- `type` (optional) - Movies & TV Shows / Movies Only / TV Shows Only

**Examples:**
```
/search query:Inception
/search query:Breaking Bad type:TV Shows Only
/search query:Marvel type:Movies Only
```

**Returns:**
- Up to 10 search results
- Title, year, rating
- Description preview
- Direct streaming link for each result
- Poster thumbnail

---

### `/trending [type] [timeframe]`
Browse trending movies and TV shows

**Options:**
- `type` (optional) - All / Movies / TV Shows (default: All)
- `timeframe` (optional) - This Week / Today (default: This Week)

**Examples:**
```
/trending
/trending type:Movies timeframe:Today
/trending type:TV Shows timeframe:This Week
```

**Returns:**
- Top 10 trending items
- Title, year, rating
- Description preview
- Direct streaming link for each
- Poster thumbnail

---

### `/popular [type]`
Browse popular movies and TV shows

**Options:**
- `type` (optional) - Movies / TV Shows (default: Movies)

**Examples:**
```
/popular
/popular type:Movies
/popular type:TV Shows
```

**Returns:**
- Top 10 popular items
- Title, year, rating
- Description preview
- Direct streaming link for each
- Poster thumbnail

---

## Command Features

All commands include:
- 🎬 Movie indicator
- 📺 TV show indicator
- ⭐ Rating (1-10 scale)
- 🖼️ Poster thumbnails
- 🔗 Direct streaming links
- 📝 Description previews

---

## Streaming Links

All results include direct streaming links in the format:
- **Movies:** `https://vidsrc.to/embed/movie/{id}`
- **TV Shows:** `https://vidsrc.to/embed/tv/{id}/1/1` (starts at Season 1, Episode 1)

Just click the link to start watching!

---

## Tips

1. **Search is smart** - Try partial titles, misspellings, or keywords
2. **Trending updates** - Daily and weekly trending lists refresh regularly
3. **Popular is stable** - Popular lists show consistently high-rated content
4. **TV shows** - Start at S01E01, you can change season/episode in the player

---

## Response Time

- First request: ~500ms (API call)
- Repeated requests: ~50ms (cached)
- Cache duration: 1 hour

---

## Limits

- Results limited to top 10 items per command
- Commands may take 1-3 seconds to respond
- Streaming links provided by VidSrc.to
