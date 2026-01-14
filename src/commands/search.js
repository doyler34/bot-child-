/**
 * Search Command with Autocomplete
 * Alternative to modal search with real-time suggestions
 */

const { SlashCommandBuilder } = require('discord.js');
const tmdbService = require('../services/tmdb.service');
const jikanService = require('../services/jikan.service');
const detailsHandler = require('../interactions/detailsHandler');
const paginator = require('../utils/paginator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for movies, TV shows, or anime with autocomplete')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('What to search for')
                .setRequired(true)
                .addChoices(
                    { name: 'Movie', value: 'movie' },
                    { name: 'TV Show', value: 'tv' },
                    { name: 'Anime', value: 'anime' }
                ))
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Search query')
                .setRequired(true)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        try {
            const focusedOption = interaction.options.getFocused(true);
            const type = interaction.options.getString('type');
            
            if (focusedOption.name === 'query') {
                const query = focusedOption.value;
                
                // Need at least 2 characters to search
                if (!query || query.length < 2) {
                    await interaction.respond([]);
                    return;
                }

                let results = [];

                if (type === 'anime') {
                    // Search anime using Jikan
                    try {
                        const animeResults = await jikanService.searchAnime(query);
                        results = animeResults.slice(0, 25).map(anime => ({
                            name: `${anime.title} (${anime.year || 'N/A'}) ⭐${anime.score || 'N/A'}`,
                            value: `anime_${anime.mal_id}`
                        }));
                    } catch (error) {
                        console.error('Autocomplete anime search error:', error);
                    }
                } else {
                    // Search movies/TV using TMDB
                    try {
                        const tmdbResults = type === 'movie'
                            ? await tmdbService.searchMovies(query)
                            : await tmdbService.searchTVShows(query);
                        
                        results = tmdbResults.slice(0, 25).map(item => {
                            const title = item.title || item.name;
                            const year = (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A';
                            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                            return {
                                name: `${title} (${year}) ⭐${rating}`,
                                value: `${type}_${item.id}`
                            };
                        });
                    } catch (error) {
                        console.error('Autocomplete TMDB search error:', error);
                    }
                }

                await interaction.respond(results);
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
            try {
                await interaction.respond([]);
            } catch (err) {
                // Interaction might have expired
            }
        }
    },

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const type = interaction.options.getString('type');
            const selection = interaction.options.getString('query');
            
            // Parse the selection (format: "type_id")
            const [selectedType, id] = selection.split('_');
            const itemId = parseInt(id);

            if (selectedType === 'anime') {
                // Show anime details
                await detailsHandler.showAnimeEpisodeSelector(interaction, itemId);
            } else if (selectedType === 'movie') {
                // Show movie details
                await detailsHandler.showMovieDetails(interaction, itemId);
            } else if (selectedType === 'tv') {
                // Show TV show season selector
                await detailsHandler.showSeasonSelector(interaction, itemId);
            }
        } catch (error) {
            console.error('Search command error:', error);
            
            const errorMessage = {
                content: '❌ Failed to load search results. Please try again.',
                ephemeral: true
            };

            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};
