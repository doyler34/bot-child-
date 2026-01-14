/**
 * Menu Handler
 * Handles interactive menu navigation for /watch command
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('../config/config');
const tmdbService = require('../services/tmdb.service');
const paginator = require('../utils/paginator');
const messageCleanup = require('../utils/messageCleanup');
const watchlistService = require('../database/watchlist.service');
const continueWatchingService = require('../database/continueWatching.service');
const jikanService = require('../services/jikan.service');

class MenuHandler {
    async handle(interaction) {
        const { customId } = interaction;
        console.log(`[MenuHandler] ============ HANDLE CALLED ============`);
        console.log(`[MenuHandler] customId: ${customId}`);
        console.log(`[MenuHandler] user: ${interaction.user?.tag || 'unknown'}`);

        try {
            if (customId === 'menu_search') {
                await this.showSearchModal(interaction);
            } else if (customId === 'menu_movies') {
                await this.showMoviesMenu(interaction);
            } else if (customId === 'menu_shows') {
                await this.showShowsMenu(interaction);
            } else if (customId === 'menu_anime') {
                await this.showAnimeMenu(interaction);
            } else if (customId === 'movies_popular') {
                await this.showPopularMovies(interaction);
            } else if (customId === 'movies_trending') {
                await this.showTrendingMovies(interaction);
            } else if (customId === 'movies_search') {
                await this.showSearchModal(interaction, 'movie');
            } else if (customId === 'shows_popular') {
                await this.showPopularShows(interaction);
            } else if (customId === 'shows_trending') {
                await this.showTrendingShows(interaction);
            } else if (customId === 'shows_search') {
                await this.showSearchModal(interaction, 'tv');
            } else if (customId === 'anime_popular') {
                await this.showPopularAnime(interaction);
            } else if (customId === 'anime_trending') {
                await this.showTrendingAnime(interaction);
            } else if (customId === 'anime_search') {
                await this.showSearchModal(interaction, 'anime');
            } else if (customId === 'menu_watchlist') {
                await this.showWatchlist(interaction);
            } else if (customId === 'menu_continue') {
                await this.showContinueWatching(interaction);
            } else if (customId === 'back_main') {
                await this.showMainMenu(interaction);
            }
        } catch (error) {
            console.error('Menu handler error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(config.embed.colors.error)
                .setTitle('❌ Error')
                .setDescription('Something went wrong. Please try again.')
                .setTimestamp();

            // Check if interaction has been acknowledged
            try {
                if (interaction.deferred || interaction.replied) {
                    const errorMsg = await interaction.editReply({ embeds: [errorEmbed], components: [] });
                    messageCleanup.scheduleDelete(errorMsg);
                } else {
                    await interaction.update({ embeds: [errorEmbed], components: [] });
                }
            } catch (err) {
                console.error('Error sending error message:', err);
            }
        }
    }

    async showMainMenu(interaction) {
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

        await interaction.update({
            embeds: [embed],
            components: [row1, row2]
        });
    }

    async showSearchModal(interaction, type = null) {
        const modal = new ModalBuilder()
            .setCustomId(`search_modal_${type || 'all'}`)
            .setTitle(type === 'movie' ? '🔍 Search Movies' : type === 'tv' ? '🔍 Search TV Shows' : '🔍 Search');

        const searchInput = new TextInputBuilder()
            .setCustomId('search_query')
            .setLabel('What are you looking for?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., Inception, Breaking Bad')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(100);

        const row = new ActionRowBuilder().addComponents(searchInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    async showMoviesMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.embed.colors.primary)
            .setTitle('🎬 Movies')
            .setDescription('Choose a category to browse movies')
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('movies_popular')
                    .setLabel('Popular')
                    .setEmoji('⭐')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('movies_trending')
                    .setLabel('Trending')
                    .setEmoji('🔥')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('movies_search')
                    .setLabel('Search Movies')
                    .setEmoji('🔍')
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back_main')
                    .setLabel('Back to Main Menu')
                    .setEmoji('🏠')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({
            embeds: [embed],
            components: [row1, row2]
        });
    }

    async showShowsMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.embed.colors.primary)
            .setTitle('📺 TV Shows')
            .setDescription('Choose a category to browse TV shows')
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('shows_popular')
                    .setLabel('Popular')
                    .setEmoji('⭐')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('shows_trending')
                    .setLabel('Trending')
                    .setEmoji('🔥')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('shows_search')
                    .setLabel('Search Shows')
                    .setEmoji('🔍')
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back_main')
                    .setLabel('Back to Main Menu')
                    .setEmoji('🏠')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({
            embeds: [embed],
            components: [row1, row2]
        });
    }

    async showPopularMovies(interaction) {
        // Defer the update immediately to prevent timeout
        await interaction.deferUpdate();
        
        const results = await tmdbService.getPopular('movie');
        
        // Add media_type to each item (API doesn't include it for category endpoints)
        const items = results.results.slice(0, 20).map(item => ({
            ...item,
            media_type: 'movie'
        }));
        
        // Create a reply interaction wrapper
        const replyInteraction = {
            ...interaction,
            deferred: true,
            editReply: interaction.editReply.bind(interaction)
        };
        
        await paginator.paginateWithSelection(
            replyInteraction,
            items,
            {
                itemsPerPage: 2,
                customId: 'popular_movie',
                title: '⭐ Popular Movies'
            }
        );
    }

    async showTrendingMovies(interaction) {
        // Defer the update immediately to prevent timeout
        await interaction.deferUpdate();
        
        const results = await tmdbService.getTrending('movie', 'week');
        
        // Add media_type to each item
        const items = results.results.slice(0, 20).map(item => ({
            ...item,
            media_type: 'movie'
        }));
        
        const replyInteraction = {
            ...interaction,
            deferred: true,
            editReply: interaction.editReply.bind(interaction)
        };
        
        await paginator.paginateWithSelection(
            replyInteraction,
            items,
            {
                itemsPerPage: 2,
                customId: 'trending_movie',
                title: '🔥 Trending Movies'
            }
        );
    }

    async showPopularShows(interaction) {
        // Defer the update immediately to prevent timeout
        await interaction.deferUpdate();
        
        const results = await tmdbService.getPopular('tv');
        
        // Add media_type to each item
        const items = results.results.slice(0, 20).map(item => ({
            ...item,
            media_type: 'tv'
        }));
        
        const replyInteraction = {
            ...interaction,
            deferred: true,
            editReply: interaction.editReply.bind(interaction)
        };
        
        await paginator.paginateWithSelection(
            replyInteraction,
            items,
            {
                itemsPerPage: 2,
                customId: 'popular_tv',
                title: '⭐ Popular TV Shows'
            }
        );
    }

    async showTrendingShows(interaction) {
        // Defer the update immediately to prevent timeout
        await interaction.deferUpdate();
        
        const results = await tmdbService.getTrending('tv', 'week');
        
        // Add media_type to each item
        const items = results.results.slice(0, 20).map(item => ({
            ...item,
            media_type: 'tv'
        }));
        
        const replyInteraction = {
            ...interaction,
            deferred: true,
            editReply: interaction.editReply.bind(interaction)
        };

        await paginator.paginateWithSelection(
            replyInteraction,
            items,
            {
                itemsPerPage: 2,
                customId: 'trending_tv',
                title: '🔥 Trending TV Shows'
            }
        );
    }

    async showAnimeMenu(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.embed.colors.primary)
            .setTitle('🍥 Anime')
            .setDescription('Choose a category to browse anime')
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('anime_popular')
                    .setLabel('Popular')
                    .setEmoji('⭐')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('anime_trending')
                    .setLabel('Trending')
                    .setEmoji('🔥')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('anime_search')
                    .setLabel('Search Anime')
                    .setEmoji('🔍')
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back_main')
                    .setLabel('Back to Main Menu')
                    .setEmoji('🏠')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({
            embeds: [embed],
            components: [row1, row2]
        });
    }

    async showPopularAnime(interaction) {
        console.log('[MenuHandler] showPopularAnime called');
        try {
            console.log('[MenuHandler] Deferring update...');
            await interaction.deferUpdate();
            
            console.log('[MenuHandler] Fetching from Jikan...');
            const results = await jikanService.topAnime(1);
            console.log(`[MenuHandler] Jikan returned ${results?.length || 0} results`);
            
            // For anime we intentionally do NOT set a TMDB id so paginator
            // can detect MAL-only items and route to showAnimeDirect
            const items = results.slice(0, 20).map(item => ({
                mal_id: item.mal_id,
                title: item.title,
                name: item.title,
                // Full image URL from Jikan; paginator will use it directly
                poster_path: item.images?.jpg?.large_image_url || null,
                media_type: 'tv'
            }));

            console.log(`[MenuHandler] Mapped to ${items.length} items`);

            if (!items.length) {
                console.log('[MenuHandler] No items, showing empty message');
                const embed = new EmbedBuilder()
                    .setColor(config.embed.colors.warning)
                    .setTitle('🍥 No Anime Found')
                    .setDescription('Could not load popular anime right now. Try again later.')
                    .setTimestamp();
                const backRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('back_main').setLabel('Back').setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
                );
                const msg = await interaction.editReply({ embeds: [embed], components: [backRow] });
                messageCleanup.scheduleDelete(msg);
                return;
            }

            const replyInteraction = {
                ...interaction,
                deferred: true,
                editReply: interaction.editReply.bind(interaction)
            };

            console.log('[MenuHandler] Calling paginator...');
            await paginator.paginateWithSelection(
                replyInteraction,
                items,
                {
                    itemsPerPage: 2,
                    customId: 'popular_anime',
                    title: '⭐ Popular Anime'
                }
            );
            console.log('[MenuHandler] Paginator completed');
        } catch (error) {
            console.error('[MenuHandler] ========== POPULAR ANIME ERROR ==========');
            console.error('[MenuHandler] Error message:', error?.message);
            console.error('[MenuHandler] Error stack:', error?.stack);
            console.error('[MenuHandler] Full error:', error);
            console.error('[MenuHandler] ==========================================');
            
            try {
                const embed = new EmbedBuilder()
                    .setColor(config.embed.colors.error)
                    .setTitle('❌ Error')
                    .setDescription('Failed to load popular anime. Please try again.')
                    .setTimestamp();
                
                const backRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('back_main').setLabel('Back').setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
                );
                
                await interaction.editReply({ embeds: [embed], components: [backRow] });
            } catch (replyError) {
                console.error('[MenuHandler] Failed to send error message:', replyError);
            }
        }
    }

    async showTrendingAnime(interaction) {
        console.log('[MenuHandler] showTrendingAnime called');
        try {
            console.log('[MenuHandler] Deferring update...');
            await interaction.deferUpdate();
            
            console.log('[MenuHandler] Fetching from Jikan...');
            const results = await jikanService.trendingAnime(1);
            console.log(`[MenuHandler] Jikan returned ${results?.length || 0} results`);
            
            const items = results.slice(0, 20).map(item => ({
                mal_id: item.mal_id,
                title: item.title,
                name: item.title,
                poster_path: item.images?.jpg?.large_image_url || null,
                media_type: 'tv'
            }));

            console.log(`[MenuHandler] Mapped to ${items.length} items`);

            if (!items.length) {
                console.log('[MenuHandler] No items, showing empty message');
                const embed = new EmbedBuilder()
                    .setColor(config.embed.colors.warning)
                    .setTitle('🍥 No Anime Found')
                    .setDescription('Could not load trending anime right now. Try again later.')
                    .setTimestamp();
                const backRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('back_main').setLabel('Back').setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
                );
                const msg = await interaction.editReply({ embeds: [embed], components: [backRow] });
                messageCleanup.scheduleDelete(msg);
                return;
            }

            const replyInteraction = {
                ...interaction,
                deferred: true,
                editReply: interaction.editReply.bind(interaction)
            };

            console.log('[MenuHandler] Calling paginator...');
            await paginator.paginateWithSelection(
                replyInteraction,
                items,
                {
                    itemsPerPage: 2,
                    customId: 'trending_anime',
                    title: '🔥 Trending Anime'
                }
            );
            console.log('[MenuHandler] Paginator completed');
        } catch (error) {
            console.error('[MenuHandler] ========== TRENDING ANIME ERROR ==========');
            console.error('[MenuHandler] Error message:', error?.message);
            console.error('[MenuHandler] Error stack:', error?.stack);
            console.error('[MenuHandler] Full error:', error);
            console.error('[MenuHandler] ==========================================');
            
            try {
                const embed = new EmbedBuilder()
                    .setColor(config.embed.colors.error)
                    .setTitle('❌ Error')
                    .setDescription('Failed to load trending anime. Please try again.')
                    .setTimestamp();
                
                const backRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('back_main').setLabel('Back').setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
                );
                
                await interaction.editReply({ embeds: [embed], components: [backRow] });
            } catch (replyError) {
                console.error('[MenuHandler] Failed to send error message:', replyError);
            }
        }
    }

    async handleSearchSubmit(interaction) {
        try {
            await interaction.deferReply();
            
            const query = interaction.fields.getTextInputValue('search_query');
            const type = interaction.customId.replace('search_modal_', '');

            let results;
            let items;
            
            if (type === 'movie') {
                results = await tmdbService.searchMovies(query);
                // Add media_type for movie-only searches
                items = (results?.results || []).slice(0, 20).map(item => ({
                    ...item,
                    media_type: 'movie'
                }));
            } else if (type === 'tv') {
                results = await tmdbService.searchTVShows(query);
                // Add media_type for TV-only searches
                items = (results?.results || []).slice(0, 20).map(item => ({
                    ...item,
                    media_type: 'tv'
                }));
            } else if (type === 'anime') {
                console.log(`[MenuHandler] Anime search for "${query}"`);
                const jikanResults = await jikanService.searchAnime(query);
                console.log(`[MenuHandler] Jikan search returned ${jikanResults?.length || 0} results`);
                items = jikanResults.slice(0, 20).map(item => ({
                    mal_id: item.mal_id,
                    title: item.title,
                    name: item.title,
                    poster_path: item.images?.jpg?.large_image_url || null,
                    media_type: 'tv'
                }));
                console.log(`[MenuHandler] Mapped to ${items.length} items`);
            } else {
                results = await tmdbService.searchMulti(query);
                // Multi search already includes media_type, but filter out non-movie/tv results
                items = (results?.results || [])
                    .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
                    .slice(0, 20);
            }

            if (!items || items.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.embed.colors.warning)
                    .setTitle('🔍 No Results')
                    .setDescription(`No results found for "${query}". Try a different search term.`)
                    .setTimestamp();

                const backRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('back_main')
                            .setLabel('Back to Menu')
                            .setEmoji('⬅️')
                            .setStyle(ButtonStyle.Secondary)
                    );

                const noResultsMsg = await interaction.editReply({ embeds: [embed], components: [backRow] });
                messageCleanup.scheduleDelete(noResultsMsg);
                return;
            }

            await paginator.paginateWithSelection(
                interaction,
                items,
                {
                    itemsPerPage: 2,
                    customId: 'search',
                    title: `🔍 Search: "${query}"`
                }
            );
        } catch (error) {
            console.error('[MenuHandler] ========== SEARCH ERROR ==========');
            console.error('[MenuHandler] Error message:', error?.message);
            console.error('[MenuHandler] Error stack:', error?.stack);
            console.error('[MenuHandler] Full error:', error);
            console.error('[MenuHandler] ==========================================');
            
            try {
                const embed = new EmbedBuilder()
                    .setColor(config.embed.colors.error)
                    .setTitle('❌ Error')
                    .setDescription('Failed to load search results. Please try again.')
                    .setTimestamp();
                
                const backRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('back_main').setLabel('Back').setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
                );
                
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ embeds: [embed], components: [backRow] });
                } else {
                    await interaction.reply({ embeds: [embed], components: [backRow], ephemeral: true });
                }
            } catch (replyError) {
                console.error('[MenuHandler] Failed to send error message:', replyError);
            }
        }
    }

    async showWatchlist(interaction) {
        await interaction.deferUpdate();

        const userId = interaction.user.id;
        const watchlist = watchlistService.getUserWatchlist(userId, 20, 0);

        if (watchlist.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.embed.colors.info)
                .setTitle('⭐ Your Watchlist')
                .setDescription('Your watchlist is empty!\n\nAdd movies and TV shows by clicking the ⭐ button on any details page.')
                .setTimestamp();

            const backRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back_main')
                        .setLabel('Back to Menu')
                        .setEmoji('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                );

            const message = await interaction.editReply({
                embeds: [embed],
                components: [backRow]
            });
            messageCleanup.scheduleDelete(message);
            return;
        }

        // Convert watchlist items to match paginator format
        const items = watchlist.map(item => ({
            id: item.tmdb_id,
            media_type: item.media_type,
            title: item.title,
            name: item.title,
            poster_path: item.poster_path,
            release_date: item.release_date,
            first_air_date: item.release_date,
            vote_average: item.rating
        }));

        const replyInteraction = {
            ...interaction,
            deferred: true,
            editReply: interaction.editReply.bind(interaction)
        };

        await paginator.paginateWithSelection(
            replyInteraction,
            items,
            {
                itemsPerPage: 2,
                customId: 'watchlist',
                title: `⭐ Your Watchlist (${watchlist.length} items)`
            }
        );
    }

    async showContinueWatching(interaction) {
        await interaction.deferUpdate();

        const userId = interaction.user.id;
        const continueWatching = continueWatchingService.getUserContinueWatching(userId, 20);

        if (continueWatching.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.embed.colors.info)
                .setTitle('▶️ Continue Watching')
                .setDescription('Nothing to continue!\n\nStart watching something and it will appear here.')
                .setTimestamp();

            const backRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back_main')
                        .setLabel('Back to Menu')
                        .setEmoji('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                );

            const message = await interaction.editReply({
                embeds: [embed],
                components: [backRow]
            });
            messageCleanup.scheduleDelete(message);
            return;
        }

        // Convert continue watching items to match paginator format
        const items = continueWatching.map(item => ({
            id: item.tmdb_id,
            media_type: item.media_type,
            title: item.title,
            name: item.title,
            poster_path: item.poster_path,
            season: item.season,
            episode: item.episode
        }));

        const replyInteraction = {
            ...interaction,
            deferred: true,
            editReply: interaction.editReply.bind(interaction)
        };

        await paginator.paginateWithSelection(
            replyInteraction,
            items,
            {
                itemsPerPage: 2,
                customId: 'continue',
                title: `▶️ Continue Watching (${continueWatching.length} items)`
            }
        );
    }

    /**
     * Basic anime filter: origin JP or animation genre
     * @private
     */
    _filterAnime(items = []) {
        return (items || []).filter(item => {
            const origin = item.origin_country || item.originCountry;
            const genres = item.genre_ids || item.genres;
            const hasJP = Array.isArray(origin) && origin.includes('JP');
            const hasAnimationId = Array.isArray(genres) && genres.includes(16);
            const hasAnimationName = Array.isArray(genres) && genres.some(g => (g.name || '').toLowerCase() === 'animation');
            return hasJP || hasAnimationId || hasAnimationName;
        });
    }

    /**
     * Send a generic error message
     * @private
     */
    async _sendError(interaction, message) {
        const embed = new EmbedBuilder()
            .setColor(config.embed.colors.error)
            .setTitle('❌ Error')
            .setDescription(message || 'Something went wrong.')
            .setTimestamp();

        try {
            if (interaction.deferred || interaction.replied) {
                const msg = await interaction.editReply({ embeds: [embed], components: [] });
                messageCleanup.scheduleDelete(msg);
            } else {
                await interaction.reply({ embeds: [embed], components: [], ephemeral: true });
            }
        } catch (err) {
            console.error('Error sending error embed:', err);
        }
    }
}

module.exports = new MenuHandler();
