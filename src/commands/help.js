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
                    '• Multiple providers are offered; if one fails, try another.',
                    '• Links may be routed through a lightweight proxy to unwrap embeds. If a provider cannot be resolved, the bot falls back to a direct embed link.',
                    '',
                    '**Tips**',
                    '• If a menu expires, run `/watch` again.',
                    '• Use the Back buttons to return to menus at any time.',
                    '• Make sure Discord link buttons open in your browser if in-app blocks occur.'
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
