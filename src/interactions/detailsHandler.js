/**
 * Details Handler
 * Manages detailed movie/TV show views, season/episode selection
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const embedBuilder = require('../ui/embedBuilder');
const tmdbService = require('../services/tmdb.service');
const vidsrcService = require('../services/vidsrc.service');
const messageCleanup = require('../utils/messageCleanup');
const watchlistService = require('../database/watchlist.service');
const continueWatchingService = require('../database/continueWatching.service');

class DetailsHandler {
    /**
     * Show detailed movie view with streaming options
     */
    async showMovieDetails(interaction, movieId) {
        try {
            // Defer immediately to prevent timeout
            await interaction.deferUpdate();
            
            // Create detailed movie card
            const embed = await embedBuilder.createDetailedMovieCard(movieId);
            
            // Get all streaming links
            const streamLinks = vidsrcService.getAllMovieLinks(movieId);
            
            // Create buttons for each provider
            const streamButtons = streamLinks.map(link => 
                new ButtonBuilder()
                    .setLabel(link.name)
                    .setStyle(ButtonStyle.Link)
                    .setURL(link.url)
                    .setEmoji(link.emoji)
            );

            // Check if in watchlist
            const inWatchlist = watchlistService.isInWatchlist(interaction.user.id, movieId, 'movie');

            // Add action buttons (watchlist, back)
            const watchlistButton = new ButtonBuilder()
                .setCustomId(`watchlist_toggle_movie_${movieId}`)
                .setLabel(inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist')
                .setEmoji(inWatchlist ? '✅' : '⭐')
                .setStyle(inWatchlist ? ButtonStyle.Success : ButtonStyle.Secondary);

            const backButton = new ButtonBuilder()
                .setCustomId('back_to_results')
                .setLabel('Back')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            // Record that user viewed this movie
            const movie = await tmdbService.getMovieDetails(movieId);
            continueWatchingService.recordMovie(interaction.user.id, movie);

            // Arrange buttons in rows (max 5 per row)
            const rows = [];
            const streamRow = new ActionRowBuilder().addComponents(...streamButtons);
            const actionRow = new ActionRowBuilder().addComponents(watchlistButton, backButton);
            
            rows.push(streamRow, actionRow);

            const message = await interaction.editReply({
                embeds: [embed],
                components: rows
            });
            
            // Schedule automatic deletion after 6 hours
            messageCleanup.scheduleDelete(message);
        } catch (error) {
            console.error('Error showing movie details:', error);
            const errorMsg = await interaction.editReply({
                embeds: [embedBuilder.createErrorEmbed('Error', 'Failed to load movie details.')],
                components: []
            });
            messageCleanup.scheduleDelete(errorMsg);
        }
    }

    /**
     * Show season selector for TV show
     */
    async showSeasonSelector(interaction, tvId) {
        try {
            // Defer immediately to prevent timeout
            await interaction.deferUpdate();
            
            // Get TV show details to know how many seasons
            const show = await tmdbService.getTVShowDetails(tvId);
            
            // Create embed with show info
            const embed = embedBuilder.createInfoEmbed(
                `📺 ${show.name}`,
                `Select a season to browse episodes\n\n**Total Seasons:** ${show.number_of_seasons}\n**Total Episodes:** ${show.number_of_episodes}`
            );

            if (show.poster_path) {
                embed.setThumbnail(tmdbService.buildImageUrl(show.poster_path, 'w342'));
            }

            // Create season selection buttons
            const seasons = [];
            for (let i = 1; i <= Math.min(show.number_of_seasons, 25); i++) {
                seasons.push({
                    label: `Season ${i}`,
                    description: `Browse episodes from Season ${i}`,
                    value: `season_${tvId}_${i}`,
                    emoji: '📚'
                });
            }

            // If more than 25 seasons (unlikely), show a note
            if (show.number_of_seasons > 25) {
                seasons.push({
                    label: 'More seasons available...',
                    description: 'This show has many seasons',
                    value: `season_${tvId}_more`,
                    emoji: '➕'
                });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`select_season_${tvId}`)
                .setPlaceholder('Choose a season')
                .addOptions(seasons);

            const menuRow = new ActionRowBuilder().addComponents(selectMenu);

            // Add back button
            const backButton = new ButtonBuilder()
                .setCustomId('back_to_results')
                .setLabel('Back')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            const backRow = new ActionRowBuilder().addComponents(backButton);

            const message = await interaction.editReply({
                embeds: [embed],
                components: [menuRow, backRow]
            });
            
            // Schedule automatic deletion after 6 hours
            messageCleanup.scheduleDelete(message);
        } catch (error) {
            console.error('Error showing season selector:', error);
            const errorMsg = await interaction.editReply({
                embeds: [embedBuilder.createErrorEmbed('Error', 'Failed to load TV show details.')],
                components: []
            });
            messageCleanup.scheduleDelete(errorMsg);
        }
    }

    /**
     * Show episode selector for a specific season
     */
    async showEpisodeSelector(interaction, tvId, seasonNumber) {
        try {
            // Defer immediately to prevent timeout
            await interaction.deferUpdate();
            
            // Get season details
            const season = await tmdbService.getTVShowSeason(tvId, seasonNumber);
            const show = await tmdbService.getTVShowDetails(tvId);
            
            // Create embed
            const embed = embedBuilder.createInfoEmbed(
                `📺 ${show.name} - Season ${seasonNumber}`,
                `Select an episode to watch\n\n**Episodes:** ${season.episodes.length}`
            );

            if (season.poster_path) {
                embed.setThumbnail(tmdbService.buildImageUrl(season.poster_path, 'w342'));
            }

            // Create episode selection buttons
            const episodes = season.episodes.map(ep => ({
                label: `Episode ${ep.episode_number}: ${ep.name}`,
                description: ep.air_date ? `Aired: ${ep.air_date}` : 'Air date unknown',
                value: `episode_${tvId}_${seasonNumber}_${ep.episode_number}`,
                emoji: '🎬'
            })).slice(0, 25); // Discord limit

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`select_episode_${tvId}_${seasonNumber}`)
                .setPlaceholder('Choose an episode')
                .addOptions(episodes);

            const menuRow = new ActionRowBuilder().addComponents(selectMenu);

            // Add back button
            const backButton = new ButtonBuilder()
                .setCustomId(`back_to_seasons_${tvId}`)
                .setLabel('Back to Seasons')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            const backRow = new ActionRowBuilder().addComponents(backButton);

            const message = await interaction.editReply({
                embeds: [embed],
                components: [menuRow, backRow]
            });
            
            // Schedule automatic deletion after 6 hours
            messageCleanup.scheduleDelete(message);
        } catch (error) {
            console.error('Error showing episode selector:', error);
            const errorMsg = await interaction.editReply({
                embeds: [embedBuilder.createErrorEmbed('Error', 'Failed to load season details.')],
                components: []
            });
            messageCleanup.scheduleDelete(errorMsg);
        }
    }

    /**
     * Show detailed episode view with streaming options
     */
    async showEpisodeDetails(interaction, tvId, season, episode) {
        try {
            // Defer immediately to prevent timeout
            await interaction.deferUpdate();
            
            // Get show and episode details
            const show = await tmdbService.getTVShowDetails(tvId);
            const seasonData = await tmdbService.getTVShowSeason(tvId, season);
            const episodeData = seasonData.episodes.find(ep => ep.episode_number === episode);

            // Create detailed embed
            const embed = await embedBuilder.createDetailedTVCard(tvId);
            
            // Update title and description for specific episode
            if (episodeData) {
                embed.setTitle(`📺 ${show.name} - S${season}E${episode}`);
                embed.setDescription(
                    `**${episodeData.name}**\n\n${episodeData.overview || 'No description available.'}`
                );
                
                if (episodeData.still_path) {
                    embed.setImage(tmdbService.buildImageUrl(episodeData.still_path, 'w780'));
                }
            }
            
            // Get all streaming links for this episode (including anime providers)
            const streamLinks = await vidsrcService.getAllTVLinksWithAnime(tvId, season, episode, {
                malId: episodeData?.mal_id || show?.mal_id
            });
            
            // Create buttons for each provider
            const streamButtons = streamLinks.map(link => 
                new ButtonBuilder()
                    .setLabel(link.name)
                    .setStyle(ButtonStyle.Link)
                    .setURL(link.url)
                    .setEmoji(link.emoji)
            );

            // Check if in watchlist
            const inWatchlist = watchlistService.isInWatchlist(interaction.user.id, tvId, 'tv');

            // Add action buttons
            const watchlistButton = new ButtonBuilder()
                .setCustomId(`watchlist_toggle_tv_${tvId}`)
                .setLabel(inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist')
                .setEmoji(inWatchlist ? '✅' : '⭐')
                .setStyle(inWatchlist ? ButtonStyle.Success : ButtonStyle.Secondary);

            const backButton = new ButtonBuilder()
                .setCustomId(`back_to_episodes_${tvId}_${season}`)
                .setLabel('Back to Episodes')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            // Record that user is watching this episode
            continueWatchingService.recordEpisode(interaction.user.id, show, season, episode);

            // Arrange buttons in rows
            const rows = [];
            const streamRow = new ActionRowBuilder().addComponents(...streamButtons);
            const actionRow = new ActionRowBuilder().addComponents(watchlistButton, backButton);
            
            rows.push(streamRow, actionRow);

            const message = await interaction.editReply({
                embeds: [embed],
                components: rows
            });
            
            // Schedule automatic deletion after 6 hours
            messageCleanup.scheduleDelete(message);
        } catch (error) {
            console.error('Error showing episode details:', error);
            const errorMsg = await interaction.editReply({
                embeds: [embedBuilder.createErrorEmbed('Error', 'Failed to load episode details.')],
                components: []
            });
            messageCleanup.scheduleDelete(errorMsg);
        }
    }
}

module.exports = new DetailsHandler();
