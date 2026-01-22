/**
 * One-shot announcement poster & pinner.
 * Usage:
 *   node scripts/postAnnouncement.js <channelId> "<message text>"
 *
 * If channelId or message are omitted, it will use defaults below.
 */

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const DEFAULT_CHANNEL_ID = '1377465202693378048'; // provided by user
const DEFAULT_MESSAGE = [
    '🎬 Welcome to ZipxMovies!',
    '',
    'What this bot does:',
    '- Browse & stream movies, TV shows, and anime.',
    '- Commands: /watch (main menu), /search (quick lookup), /share (send a title to someone).',
    '',
    'How to use:',
    '1) Run /watch -> pick Search/Movies/TV/Anime.',
    '2) Select a title; for TV/anime choose season/episode.',
    '3) Click a provider button to start streaming.',
    '',
    'Tips:',
    '- Add titles to your watchlist via the ⭐ button; open it from /watch -> My Watchlist.',
    '- Continue Watching shows your recent progress.',
    '- If a menu expires, just run /watch again.',
    '- Try another provider button if one fails.',
    '- Use an ad blocker for the best experience.',
    '',
    'Enjoy the show! 🍿'
].join('\n');

const token = process.env.DISCORD_TOKEN;
const channelId = process.argv[2] || DEFAULT_CHANNEL_ID;
const messageText = process.argv.slice(3).join(' ') || DEFAULT_MESSAGE;

if (!token) {
    console.error('DISCORD_TOKEN is required.');
    process.exit(1);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            throw new Error('Channel not found or text-capable');
        }

        // Unpin all existing pinned messages from this bot
        console.log('Checking for existing pinned messages...');
        const pinnedMessages = await channel.messages.fetchPinned();
        const botPins = pinnedMessages.filter(msg => msg.author.id === client.user.id);
        
        for (const [, msg] of botPins) {
            console.log(`Unpinning old announcement: ${msg.id}`);
            await msg.unpin();
        }
        
        if (botPins.size > 0) {
            console.log(`Unpinned ${botPins.size} old announcement(s)`);
        }

        // Post and pin new announcement
        console.log('Posting new announcement...');
        const sent = await channel.send(messageText);
        await sent.pin();
        console.log(`✓ Posted and pinned new announcement in channel ${channelId}`);
    } catch (err) {
        console.error('Failed to post announcement:', err.message);
        process.exitCode = 1;
    } finally {
        client.destroy();
    }
});

client.on('error', (err) => console.error('Client error:', err));
client.on('shardError', (err) => console.error('Shard error:', err));

client.login(token).catch((err) => {
    console.error('Login failed:', err.message);
    process.exit(1);
});
