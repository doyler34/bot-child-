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
    '**🎉 Update – January 14, 2026**',
    '',
    '**✨ What\'s New**',
    '- 🍥 **Anime Support (BETA)** – Browse popular/trending anime, search by title, and stream episodes!',
    '- 📖 **`/help` Command** – Get detailed usage instructions and disclaimers.',
    '- 🛡️ **Proxy for Ad Prevention** – Links route through our proxy to strip iframe ads (most ads removed, some may remain).',
    '- 🔄 **Improved Navigation** – Better back buttons, season selectors, and menu flow.',
    '',
    '**🎬 How to Use**',
    '- Run `/watch` to browse Movies, TV Shows, or Anime.',
    '- Run `/help` for detailed guidance and disclaimers.',
    '- Use navigation buttons to browse; if a menu expires, just run `/watch` again.',
    '- For anime: Select from Popular/Trending or Search, pick your season/episode, then choose a provider.',
    '',
    '**⚠️ Important Notes**',
    '- **Anime is in BETA** – Some features may not work perfectly. Report issues if you find them!',
    '- **Use Ad Blockers** – While our proxy helps, ad blockers (uBlock Origin, etc.) are still recommended.',
    '- **Proxy Info** – Links route through a lightweight proxy to unwrap provider iframes and reduce ads.',
    '- **Provider Tips** – Try `VidSrc` or `Cinetaro` first; if one fails, try another provider.',
    '',
    '**💬 Feedback & Support**',
    '- Report bugs or request features in this channel.',
    '- Enjoy streaming! 🍿'
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
