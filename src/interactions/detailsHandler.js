/**
 * Details Handler
 * Manages detailed movie/TV show views, season/episode selection
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const embedBuilder = require('../ui/embedBuilder');
const tmdbService = require('../services/tmdb.service');
const vidsrcService = require('../services/vidsrc.service');
const jikanService = require('../services/jikan.service');
const aniListService = require('../services/anilist.service');
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

            const cancelButton = new ButtonBuilder()
                .setCustomId('back_main')
                .setLabel('Main Menu')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🏠');

            // Record that user viewed this movie
            const movie = await tmdbService.getMovieDetails(movieId);
            continueWatchingService.recordMovie(interaction.user.id, movie);

            // Arrange buttons in rows (max 5 per row)
            const rows = [];
            const streamRow = new ActionRowBuilder().addComponents(...streamButtons);
            const actionRow = new ActionRowBuilder().addComponents(watchlistButton, backButton, cancelButton);
            
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

            // Add back and home buttons
            const backButton = new ButtonBuilder()
                .setCustomId('back_to_results')
                .setLabel('Back')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            const homeButton = new ButtonBuilder()
                .setCustomId('back_main')
                .setLabel('Main Menu')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🏠');

            const backRow = new ActionRowBuilder().addComponents(backButton, homeButton);

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

    /**
     * Show anime episode selector (similar to season selector for TV shows)
     */
    async showAnimeEpisodeSelector(interaction, malId, title) {
        try {
            // Don't defer if already deferred/replied (e.g., from paginator)
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate();
            }

            if (!malId || isNaN(malId)) {
                console.error(`Invalid MAL ID: ${malId}`);
                throw new Error('Missing or invalid MAL id');
            }

            // Ensure malId is a number
            malId = parseInt(malId, 10);

            // Fetch full anime details from Jikan
            let anime = null;
            try {
                anime = await jikanService.getAnimeById(malId);
            } catch (error) {
                console.error('Failed to fetch anime details from Jikan:', error);
                throw new Error('Failed to load anime details');
            }

            // Create detailed embed
            const embed = embedBuilder.createDetailedAnimeCard(anime);

            // Get episode count (default to 1 if unknown)
            const episodeCount = anime.episodes || 1;
            
            // Check for sequels/prequels (separate seasons) and fetch their episode counts
            const relations = anime.relations || [];
            const allSeasons = [];
            
            // Add the current season first (prefer English title)
            const mainTitle = anime.title_english || anime.title;
            if (episodeCount > 24) {
                // Split into parts
                const episodesPerPart = 24;
                const numParts = Math.ceil(episodeCount / episodesPerPart);
                
                for (let p = 1; p <= numParts; p++) {
                    const startEp = (p - 1) * episodesPerPart + 1;
                    const endEp = Math.min(p * episodesPerPart, episodeCount);
                    allSeasons.push({
                        label: `${mainTitle} - Episodes ${startEp}-${endEp}`,
                        description: `Part ${p} (${endEp - startEp + 1} episodes)`,
                        value: `anime_season_${malId}_${p}`,
                        emoji: '📺',
                        malId: malId,
                        partNum: p
                    });
                }
            } else {
                // Add as single season
                allSeasons.push({
                    label: mainTitle,
                    description: `${episodeCount} episode${episodeCount > 1 ? 's' : ''}`,
                    value: `anime_season_${malId}_1`,
                    emoji: '📺',
                    malId: malId,
                    partNum: 1
                });
            }
            
            // Fetch ALL related anime RECURSIVELY (sequels of sequels, etc.)
            const allRelated = [];
            const seenIds = new Set([malId]); // Track IDs to avoid duplicates
            const toFetch = []; // Queue of anime to fetch
            
            console.log(`[Anime] ===== Fetching ALL related anime for ${anime.title} (MAL ${malId}) =====`);
            
            // Recursive function to collect ALL related anime IDs
            const collectRelatedIds = (animeData, depth = 0) => {
                if (depth > 3) return; // Limit recursion depth to avoid infinite loops
                
                const relations = animeData.relations || [];
                console.log(`[Anime] ${'  '.repeat(depth)}Checking relations at depth ${depth}`);
                
                // Filter out non-essential relation types to reduce API calls
                const essentialRelations = ['Sequel', 'Prequel', 'Alternative Version', 'Side Story'];
                
                relations.forEach(rel => {
                    // Skip summaries, character collabs, and other non-essential content
                    if (!essentialRelations.includes(rel.relation)) {
                        return;
                    }
                    
                    const entries = rel.entry || [];
                    entries.forEach(entry => {
                        if (entry.type === 'anime' && entry.mal_id && !seenIds.has(entry.mal_id)) {
                            console.log(`[Anime] ${'  '.repeat(depth)}- ${entry.name} (${rel.relation}, MAL ${entry.mal_id})`);
                            seenIds.add(entry.mal_id);
                            toFetch.push({
                                malId: entry.mal_id,
                                name: entry.name,
                                relationType: rel.relation,
                                depth: depth
                            });
                        }
                    });
                });
            };
            
            // Start collecting from the main anime
            collectRelatedIds(anime, 0);
            
            console.log(`[Anime] Found ${toFetch.length} related anime to fetch`);
            
            // Fetch sequentially with proper rate limiting (Jikan limit: 1 req/sec)
            for (let i = 0; i < toFetch.length; i++) {
                const entry = toFetch[i];
                console.log(`[Anime] Fetching ${i + 1}/${toFetch.length}: ${entry.name}...`);
                
                try {
                    const relatedAnime = await jikanService.getAnimeById(entry.malId);
                    if (relatedAnime) {
                        // Collect more related anime from this one
                        collectRelatedIds(relatedAnime, entry.depth + 1);
                        
                        const displayName = relatedAnime.title_english || relatedAnime.title;
                        console.log(`[Anime]   ✓ ${displayName}: ${relatedAnime.episodes || '?'} eps`);
                        allRelated.push({
                            malId: relatedAnime.mal_id,
                            name: displayName,
                            episodes: relatedAnime.episodes || 1,
                            aired: relatedAnime.aired?.from,
                            relationType: entry.relationType
                        });
                    }
                } catch (err) {
                    console.warn(`[Anime]   ✗ Failed ${entry.name}:`, err.message);
                }
                
                // Wait 1.5 seconds between requests to respect Jikan rate limit
                if (i < toFetch.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }
            
            console.log(`[Anime] ===== Successfully fetched ${allRelated.length} related anime =====`);
            
            // Sort related anime by air date (chronological order)
            allRelated.sort((a, b) => {
                if (!a.aired) return 1;
                if (!b.aired) return -1;
                return new Date(a.aired) - new Date(b.aired);
            });
            
            // Add all related anime with their part breakdowns
            if (allRelated.length > 0) {
                allRelated.forEach((related, idx) => {
                    const seasonLabel = related.relationType === 'Sequel' ? `Season ${idx + 2}` : related.name;
                    
                    if (related.episodes > 24) {
                        const episodesPerPart = 24;
                        const numParts = Math.ceil(related.episodes / episodesPerPart);
                        
                        for (let p = 1; p <= numParts; p++) {
                            const startEp = (p - 1) * episodesPerPart + 1;
                            const endEp = Math.min(p * episodesPerPart, related.episodes);
                            allSeasons.push({
                                label: `${related.name} (${startEp}-${endEp})`,
                                description: `${related.episodes} eps total`,
                                value: `anime_season_${related.malId}_${p}`,
                                emoji: '📺',
                                malId: related.malId,
                                partNum: p
                            });
                        }
                    } else {
                        allSeasons.push({
                            label: related.name,
                            description: `${related.episodes} episode${related.episodes > 1 ? 's' : ''}`,
                            value: `anime_season_${related.malId}_1`,
                            emoji: '📺',
                            malId: related.malId,
                            partNum: 1
                        });
                    }
                });
            }
            
            console.log(`[Anime] ${anime.title}: Total ${allSeasons.length} season/part options`);
            
            // If we have multiple seasons/parts, show selector
            if (allSeasons.length > 1) {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`select_anime_season_${malId}`)
                    .setPlaceholder('Choose a season/part')
                    .addOptions(allSeasons.slice(0, 25).map(s => ({
                        label: s.label,
                        description: s.description,
                        value: s.value,
                        emoji: s.emoji
                    })));

                const menuRow = new ActionRowBuilder().addComponents(selectMenu);

                // Add back and home buttons
                const backButton = new ButtonBuilder()
                    .setCustomId('back_to_results')
                    .setLabel('Back')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬅️');

                const homeButton = new ButtonBuilder()
                    .setCustomId('back_main')
                    .setLabel('Main Menu')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🏠');

                const backRow = new ActionRowBuilder().addComponents(backButton, homeButton);

                const message = await interaction.editReply({
                    embeds: [embed],
                    components: [menuRow, backRow]
                });

                messageCleanup.scheduleDelete(message);
                return;
            }

            // If only one season with ≤24 episodes, show direct episode selector
            const episodes = [];
            for (let i = 1; i <= episodeCount; i++) {
                episodes.push({
                    label: `Episode ${i}`,
                    description: `Watch episode ${i}`,
                    value: `anime_ep_${malId}_${i}`,
                    emoji: '🎬'
                });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`select_anime_ep_${malId}`)
                .setPlaceholder('Choose an episode to watch')
                .addOptions(episodes);

            const menuRow = new ActionRowBuilder().addComponents(selectMenu);

            // Add back and home buttons
            const backButton = new ButtonBuilder()
                .setCustomId('back_to_results')
                .setLabel('Back')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            const homeButton = new ButtonBuilder()
                .setCustomId('back_main')
                .setLabel('Main Menu')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🏠');

            const backRow = new ActionRowBuilder().addComponents(backButton, homeButton);

            const message = await interaction.editReply({
                embeds: [embed],
                components: [menuRow, backRow]
            });

            messageCleanup.scheduleDelete(message);
        } catch (error) {
            console.error('Error showing anime episode selector:', error);
            const payload = {
                embeds: [embedBuilder.createErrorEmbed('Error', 'Failed to load anime details.')],
                components: []
            };
            try {
                if (interaction.replied || interaction.deferred) {
                    const errorMsg = await interaction.editReply(payload);
                    messageCleanup.scheduleDelete(errorMsg);
                } else {
                    await interaction.reply({ ...payload, ephemeral: true });
                }
            } catch (replyError) {
                console.error('Failed to send error message:', replyError);
            }
        }
    }

    /**
     * Show episodes for a specific season/part
     */
    async showAnimeSeasonEpisodes(interaction, malId, seasonNum) {
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate();
            }

            if (!malId || isNaN(malId) || !seasonNum || isNaN(seasonNum)) {
                throw new Error('Missing or invalid parameters');
            }

            malId = parseInt(malId, 10);
            seasonNum = parseInt(seasonNum, 10);

            // Fetch anime details
            let anime = null;
            try {
                anime = await jikanService.getAnimeById(malId);
            } catch (error) {
                console.error('Failed to fetch anime details:', error);
                throw new Error('Failed to load anime details');
            }

            const episodeCount = anime.episodes || 1;
            const episodesPerSeason = 24;
            const startEp = (seasonNum - 1) * episodesPerSeason + 1;
            const endEp = Math.min(seasonNum * episodesPerSeason, episodeCount);

            // Create embed
            const embed = embedBuilder.createDetailedAnimeCard(anime);
            embed.setTitle(`🍥 ${anime.title} - Part ${seasonNum}`);
            embed.setDescription(`Episodes ${startEp}-${endEp}`);

            // Create episode options
            const episodes = [];
            for (let i = startEp; i <= endEp; i++) {
                episodes.push({
                    label: `Episode ${i}`,
                    description: `Watch episode ${i}`,
                    value: `anime_ep_${malId}_${i}`,
                    emoji: '🎬'
                });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`select_anime_ep_${malId}`)
                .setPlaceholder(`Choose an episode (${startEp}-${endEp})`)
                .addOptions(episodes);

            const menuRow = new ActionRowBuilder().addComponents(selectMenu);

            // Add back button
            const backButton = new ButtonBuilder()
                .setCustomId(`back_to_anime_seasons_${malId}`)
                .setLabel('Back to Parts')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            const backRow = new ActionRowBuilder().addComponents(backButton);

            const message = await interaction.editReply({
                embeds: [embed],
                components: [menuRow, backRow]
            });

            messageCleanup.scheduleDelete(message);
        } catch (error) {
            console.error('Error showing anime season episodes:', error);
            const payload = {
                embeds: [embedBuilder.createErrorEmbed('Error', 'Failed to load episodes.')],
                components: []
            };
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply(payload);
                } else {
                    await interaction.reply({ ...payload, ephemeral: true });
                }
            } catch (replyError) {
                console.error('Failed to send error message:', replyError);
            }
        }
    }

    /**
     * Show anime episode details with streaming links
     */
    async showAnimeEpisodeDetails(interaction, malId, episode) {
        try {
            // Don't defer if already deferred/replied
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate();
            }

            if (!malId || isNaN(malId) || !episode || isNaN(episode)) {
                console.error(`Invalid parameters - malId: ${malId}, episode: ${episode}`);
                throw new Error('Missing or invalid MAL id or episode number');
            }

            // Ensure both are numbers
            malId = parseInt(malId, 10);
            episode = parseInt(episode, 10);

            // Fetch anime details
            let anime = null;
            try {
                anime = await jikanService.getAnimeById(malId);
            } catch (error) {
                console.error('Failed to fetch anime details:', error);
            }

            // Create embed
            const embed = anime 
                ? embedBuilder.createDetailedAnimeCard(anime)
                : embedBuilder.createInfoEmbed(
                    `🍥 Episode ${episode}`,
                    'Select a provider to watch.'
                );

            // Update title for specific episode
            if (anime) {
                embed.setTitle(`🍥 ${anime.title} - Episode ${episode}`);
            }

            // Get AniList ID for Cinetaro
            let anilistId = null;
            if (anime?.title) {
                try {
                    const year = anime?.aired?.from ? new Date(anime.aired.from).getFullYear() : undefined;
                    const ids = await aniListService.findIds(anime.title, year);
                    anilistId = ids.anilistId;
                } catch (error) {
                    console.warn('Failed to fetch AniList ID:', error);
                }
            }

            // Get streaming links for this episode
            const streamLinks = await vidsrcService.getAllTVLinksWithAnime(null, 1, episode, { 
                malId,
                anilistId,
                title: anime?.title,
                year: anime?.aired?.from ? new Date(anime.aired.from).getFullYear() : undefined
            });

            // Filter out any null/failed links and create buttons
            const streamButtons = streamLinks
                .filter(link => link && link.url)
                .map(link =>
                    new ButtonBuilder()
                        .setLabel(link.name)
                        .setStyle(ButtonStyle.Link)
                        .setURL(link.url)
                        .setEmoji(link.emoji)
                );

            // Add back button to episode selector
            const backButton = new ButtonBuilder()
                .setCustomId(`back_to_anime_eps_${malId}`)
                .setLabel('Back to Episodes')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            // Build rows: max 5 buttons per row
            const rows = [];
            if (streamButtons.length > 0) {
                // Split stream buttons into chunks of 5
                for (let i = 0; i < streamButtons.length; i += 5) {
                    const chunk = streamButtons.slice(i, i + 5);
                    if (chunk.length > 0) {
                        rows.push(new ActionRowBuilder().addComponents(...chunk));
                    }
                }
            }
            
            // Add back button in its own row (or with last stream buttons if there's space)
            if (rows.length > 0 && rows[rows.length - 1].components.length < 5) {
                // Add to last row if it has space
                rows[rows.length - 1].addComponents(backButton);
            } else {
                // Create new row for back button
                rows.push(new ActionRowBuilder().addComponents(backButton));
            }

            const message = await interaction.editReply({
                embeds: [embed],
                components: rows
            });

            messageCleanup.scheduleDelete(message);
        } catch (error) {
            console.error('Error showing anime episode details:', error);
            const payload = {
                embeds: [embedBuilder.createErrorEmbed('Error', 'Failed to load episode links.')],
                components: []
            };
            try {
                if (interaction.replied || interaction.deferred) {
                    const errorMsg = await interaction.editReply(payload);
                    messageCleanup.scheduleDelete(errorMsg);
                } else {
                    await interaction.reply({ ...payload, ephemeral: true });
                }
            } catch (replyError) {
                console.error('Failed to send error message:', replyError);
            }
        }
    }

    /**
     * Show anime links directly via MAL id (fallback when no TMDB id)
     * @deprecated Use showAnimeEpisodeSelector instead
     */
    async showAnimeDirect(interaction, malId, title) {
        // Redirect to episode selector
        await this.showAnimeEpisodeSelector(interaction, malId, title);
    }
}

module.exports = new DetailsHandler();
