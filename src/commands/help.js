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
                    '• `/watch` → Main menu for movies, TV, and anime',
                    '• `/search` → Quick search with autocomplete',
                    '• `/share` → Send a movie/TV title to another user',
                    '• `/help` → This help message',
                    '',
                    '**📺 How to Watch**',
                    '1) Run `/watch` → pick Search/Movies/TV/Anime',
                    '2) Select a title; for TV/Anime choose season/episode',
                    '3) Click a provider button to start streaming',
                    '',
                    '**⭐ Watchlist & History**',
                    '• Use ⭐ Add to Watchlist on any title; open via `/watch` → My Watchlist',
                    '• Continue Watching tracks your latest movie/episode',
                    '',
                    '**🛡️ Proxy & Ads**',
                    '• Links route through our proxy to strip iframe ads',
                    '• Still use an ad blocker; try another provider if one fails',
                    '',
                    '**💡 Tips**',
                    '• Menus expire after a while—just run `/watch` again',
                    '• Use `/share` to recommend a title to a friend'
                ].join('\n'))
                .setFooter({ text: 'ZipxMovies • Powered by TMDB & Jikan' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Help command error:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: '❌ Failed to load help. Please try again.' });
            } else {
                await interaction.reply({ content: '❌ Failed to load help. Please try again.' });
            }
        }
    }
};
