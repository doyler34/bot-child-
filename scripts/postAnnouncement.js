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
    '**Update – 2026-01-14**',
    '- Added `/help` with usage tips and proxy disclaimer.',
    '- Navigation improved: no-result searches now have a Back to Menu button.',
    '- Proxy unwrap is more resilient; if a provider will not resolve, we fall back to a direct embed link.',
    '',
    '**How to use**',
    '- Run `/help` for guidance and disclaimers.',
    '- Use Back buttons to return to menus; if a menu expires, rerun `/watch`.',
    '- Try `VidSrc` or `VidSrc Me` first; if a provider fails, choose another.',
    '',
    '**Notes**',
    '- Links may route through a lightweight proxy to unwrap embeds; if resolution fails, we serve the direct embed link.'
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
            throw new Error('Channel not found or not text-capable');
        }

        const sent = await channel.send(messageText);
        await sent.pin();
        console.log(`Posted and pinned announcement in channel ${channelId}`);
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
