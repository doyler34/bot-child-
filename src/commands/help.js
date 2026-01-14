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
                    '**🎬 Commands**',
                    '• `/watch` → Browse movies, TV shows, and anime with interactive menus',
                    '• `/search` → Quick search with autocomplete (type to see suggestions)',
                    '• `/help` → Show this help message',
                    '',
                    '**📺 How to Watch**',
                    '1. Use `/watch` or `/search` to find content',
                    '2. Click number buttons (1️⃣ 2️⃣) to select a title',
                    '3. For TV/Anime: Choose season → Choose episode',
                    '4. Click a provider button to start streaming',
                    '',
                    '**🍥 Anime (BETA)**',
                    '• Browse Popular/Trending anime or Search by title',
                    '• All seasons automatically detected and grouped',
                    '• Supports multiple providers (Cinetaro, Gojo, VidSrc)',
                    '• Add to watchlist and track progress',
                    '',
                    '**⭐ Watchlist & History**',
                    '• Click "Add to Watchlist" on any title to save it',
                    '• View your watchlist via `/watch` → My Watchlist',
                    '• Continue Watching auto-tracks what you\'ve watched',
                    '',
                    '**🛡️ Proxy & Ad Prevention**',
                    '• Links route through our proxy to strip iframe ads',
                    '• Most ads removed (only "play button" ads may remain)',
                    '• **Still use ad blockers** (uBlock Origin recommended)',
                    '• If a provider fails, try another provider button',
                    '',
                    '**🔐 Privacy**',
                    '• All interactions are private (only you see them)',
                    '• Auto-cleanup: messages deleted after 3 min of inactivity',
                    '• Click "Dismiss" to manually close at any time',
                    '',
                    '**💡 Tips**',
                    '• Use autocomplete search (`/search`) for faster results',
                    '• Navigate with Back buttons to return to previous menus',
                    '• Open stream links in browser (not in-app) for fewer ads',
                    '• If menu expires, just run `/watch` again'
                ].join('\n'))
                .setFooter({ text: 'ZipxMovies • Powered by TMDB & Jikan' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            console.error('Help command error:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: '❌ Failed to load help. Please try again.', flags: 64 });
            } else {
                await interaction.reply({ content: '❌ Failed to load help. Please try again.', flags: 64 });
            }
        }
    }
};
