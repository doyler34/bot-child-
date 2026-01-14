/**
 * Help Command
 * Provides usage guidance, feature list, and proxy disclaimers.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('How to use the bot, features, and disclaimers'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor(config.embed.colors.info)
                .setTitle('ℹ️ How to use ZipxMovies')
                .setDescription([
                    '**Quick start**',
                    '• `/watch` → pick Search, Movies, or TV Shows.',
                    '• Use number buttons to select a title, then choose a season/episode.',
                    '• Stream buttons open provider links; you can always go back via the Back buttons.',
                    '',
                    '**Lists & history**',
                    '• ⭐ Watchlist: add/remove on detail pages; view in `/watch` → My Watchlist.',
                    '• ▶️ Continue Watching: auto-tracks viewed items; clear via the Continue menu.',
                    '',
                    '**Providers & proxy**',
                    '• Providers: VidSrc and VidSrc Me (kept for lowest ads).',
                    '• If a provider fails, try the other provider.',
                    '• Links may be routed through a lightweight proxy to unwrap embeds. If a provider cannot be resolved, the bot falls back to a direct embed link.',
                    '',
                    '**Tips**',
                    '• If a menu expires, run `/watch` again.',
                    '• Use the Back buttons to return to menus at any time.',
                    '• For fewer ads, open links in your browser with an ad blocker; avoid the in-app browser if possible.'
                ].join('\n'))
                .setFooter({ text: 'ZipxMovies • Powered by TMDB' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Help command error:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: '❌ Failed to load help. Please try again.', ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Failed to load help. Please try again.', ephemeral: true });
            }
        }
    }
};
