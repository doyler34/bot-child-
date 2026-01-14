/**
 * Watch Command
 * Unified command with interactive menu system
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config');
const messageCleanup = require('../utils/messageCleanup');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('watch')
        .setDescription('Browse movies and TV shows'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            // Show main menu
            const embed = new EmbedBuilder()
                .setColor(config.embed.colors.primary)
                .setTitle('🎬 ZipxMovies - What would you like to watch?')
                .setDescription('Browse content or check your lists')
                .setTimestamp();

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('menu_search')
                        .setLabel('Search')
                        .setEmoji('🔍')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('menu_movies')
                        .setLabel('Movies')
                        .setEmoji('🎬')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('menu_shows')
                        .setLabel('TV Shows')
                        .setEmoji('📺')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('menu_anime')
                        .setLabel('Anime')
                        .setEmoji('🍥')
                        .setStyle(ButtonStyle.Primary)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('menu_watchlist')
                        .setLabel('My Watchlist')
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('menu_continue')
                        .setLabel('Continue Watching')
                        .setEmoji('▶️')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.editReply({
                embeds: [embed],
                components: [row1, row2]
            });

            // Schedule automatic deletion after 6 hours
            await messageCleanup.scheduleInteractionDelete(interaction);

        } catch (error) {
            console.error('Watch command error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(config.embed.colors.error)
                .setTitle('❌ Error')
                .setDescription('Something went wrong. Please try again.')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
