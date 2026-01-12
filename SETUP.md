# Setup Guide - Discord Streaming Bot

## Prerequisites

Before you can run the bot, you need to install Node.js:

1. **Download Node.js**
   - Visit https://nodejs.org/
   - Download the LTS version (recommended)
   - Run the installer and follow the prompts
   - Verify installation by opening a new terminal and running:
     ```
     node --version
     npm --version
     ```

## Installation Steps

### 1. Install Dependencies

Once Node.js is installed, run:

```bash
npm install
```

This will install:
- `discord.js` - Discord API library
- `dotenv` - Environment variable management
- `axios` - HTTP client for API requests

### 2. Configure Environment Variables

You need to add your actual credentials to the `.env` file:

1. **Get Discord Bot Token:**
   - Go to https://discord.com/developers/applications
   - Create a new application (or select existing one)
   - Go to the "Bot" section
   - Click "Reset Token" to reveal your token
   - Copy the token

2. **Get TMDB API Key:**
   - Go to https://www.themoviedb.org/
   - Create a free account
   - Go to Settings > API
   - Request an API key (it's free)
   - Copy the API key

3. **Update .env file:**

Create a `.env` file in the root directory with:

```env
DISCORD_TOKEN=your_actual_discord_token_here
TMDB_API_KEY=your_actual_tmdb_key_here
BOT_PREFIX=/
```

⚠️ **Important:** Never share or commit your `.env` file!

### 3. Invite Bot to Your Server

1. Go to your Discord Application page
2. Navigate to OAuth2 > URL Generator
3. Select these scopes:
   - `bot`
   - `applications.commands`
4. Select these bot permissions:
   - View Channels
   - Send Messages
   - Embed Links
   - Add Reactions
   - Read Message History
   - Use Slash Commands
5. Copy the generated URL and open it in your browser
6. Select your server and authorize the bot

### 4. Run the Bot

Start the bot with:

```bash
npm start
```

You should see output like:

```
┌─────────────────────────────────────────┐
│     Discord Streaming Bot - Ready!     │
└─────────────────────────────────────────┘

✓ Logged in as: YourBotName#1234
✓ Bot ID: 123456789012345678
✓ Servers: 1
✓ Users: 10
✓ Version: 1.0.0

─────────────────────────────────────────
Bot is now online and ready to receive commands!
─────────────────────────────────────────
```

### 5. Verify Bot is Online

1. Check your Discord server
2. The bot should appear in the member list with an online (green) status
3. The bot's activity should show "Watching movies & TV shows"

## Troubleshooting

### Bot Won't Start

- **"Discord token not found"** - Check your `.env` file has `DISCORD_TOKEN` set
- **"Failed to login"** - Your Discord token is invalid or expired, regenerate it
- **"npm not recognized"** - Node.js is not installed or not in your PATH

### Bot is Offline

- Check the bot token is correct
- Verify the bot wasn't removed from the server
- Check your internet connection

### Permission Errors

- Make sure the bot has the required permissions in your Discord server
- Check the bot's role position (should be high enough to see channels)

## Next Steps

✅ **Phase 1 Complete!** Your bot foundation is set up.

**Coming in Phase 2:**
- TMDB API integration for movie/TV data
- Search functionality
- Trending and popular content browsing

To proceed with Phase 2, you'll need to:
1. Test the current bot connection
2. Verify all permissions are working
3. Implement the TMDB service layer
