/**
 * Share Command
 * Share movies or TV shows with other users
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const tmdbService = require('../services/tmdb.service');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('share')
        .setDescription('Share a movie or TV show with another user')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Search for a movie or TV show')
                .setRequired(true)
                .setAutocomplete(true))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to share with')
                .setRequired(true)),

    async autocomplete(interaction) {
        try {
            const focusedOption = interaction.options.getFocused(true);
            
            if (focusedOption.name === 'query') {
                const query = focusedOption.value;
                
                // Need at least 2 characters to search
                if (!query || query.length < 2) {
                    await interaction.respond([]);
                    return;
                }

                let results = [];

                try {
                    // Search both movies and TV shows
                    const [movieResults, tvResults] = await Promise.all([
                        tmdbService.searchMovies(query),
                        tmdbService.searchTVShows(query)
                    ]);

                    // Ensure we have arrays (results might be in .results property)
                    const movieArray = Array.isArray(movieResults) ? movieResults : (movieResults?.results || []);
                    const tvArray = Array.isArray(tvResults) ? tvResults : (tvResults?.results || []);

                    // Combine and format results
                    const movies = movieArray.slice(0, 12).map(item => {
                        const title = item.title;
                        const year = (item.release_date || '').split('-')[0] || 'N/A';
                        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                        return {
                            name: `🎬 ${title} (${year}) ⭐${rating}`,
                            value: `movie_${item.id}`
                        };
                    });

                    const tvShows = tvArray.slice(0, 13).map(item => {
                        const title = item.name;
                        const year = (item.first_air_date || '').split('-')[0] || 'N/A';
                        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                        return {
                            name: `📺 ${title} (${year}) ⭐${rating}`,
                            value: `tv_${item.id}`
                        };
                    });

                    results = [...movies, ...tvShows].slice(0, 25);
                } catch (error) {
                    console.error('Autocomplete search error:', error);
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
            await interaction.deferReply();

            const selection = interaction.options.getString('query');
            const targetUser = interaction.options.getUser('user');
            const sharer = interaction.user;
            
            // Parse the selection (format: "type_id")
            const [type, id] = selection.split('_');
            const itemId = parseInt(id);

            // Validate selection
            if (!type || !itemId || (type !== 'movie' && type !== 'tv')) {
                throw new Error('Invalid selection');
            }

            // Fetch details from TMDB
            let details;
            let embed = null;

            if (type === 'movie') {
                details = await tmdbService.getMovieDetails(itemId);
                
                embed = new EmbedBuilder()
                    .setColor(config.embed.colors.primary)
                    .setTitle(`🎬 ${details.title}`)
                    .setDescription(
                        `${sharer} wants to share this movie with you!\n\n` +
                        `${details.overview || 'No description available.'}`
                    )
                    .setTimestamp();

                if (details.poster_path) {
                    embed.setThumbnail(tmdbService.buildImageUrl(details.poster_path, 'w342'));
                }

                const fields = [];

                if (details.release_date) {
                    fields.push({
                        name: '📅 Release Date',
                        value: details.release_date,
                        inline: true
                    });
                }

                if (details.vote_average) {
                    const rating = details.vote_average.toFixed(1);
                    fields.push({
                        name: '⭐ Rating',
                        value: `${rating}/10`,
                        inline: true
                    });
                }

                if (details.runtime) {
                    const hours = Math.floor(details.runtime / 60);
                    const minutes = details.runtime % 60;
                    fields.push({
                        name: '⏱️ Runtime',
                        value: `${hours}h ${minutes}m`,
                        inline: true
                    });
                }

                if (details.genres && details.genres.length > 0) {
                    fields.push({
                        name: '🎭 Genres',
                        value: details.genres.map(g => g.name).join(', '),
                        inline: false
                    });
                }

                embed.addFields(fields);

            } else if (type === 'tv') {
                details = await tmdbService.getTVShowDetails(itemId);
                
                embed = new EmbedBuilder()
                    .setColor(config.embed.colors.primary)
                    .setTitle(`📺 ${details.name}`)
                    .setDescription(
                        `${sharer} wants to share this show with you!\n\n` +
                        `${details.overview || 'No description available.'}`
                    )
                    .setTimestamp();

                if (details.poster_path) {
                    embed.setThumbnail(tmdbService.buildImageUrl(details.poster_path, 'w342'));
                }

                const fields = [];

                if (details.first_air_date) {
                    fields.push({
                        name: '📅 First Aired',
                        value: details.first_air_date,
                        inline: true
                    });
                }

                if (details.vote_average) {
                    const rating = details.vote_average.toFixed(1);
                    fields.push({
                        name: '⭐ Rating',
                        value: `${rating}/10`,
                        inline: true
                    });
                }

                if (details.number_of_seasons) {
                    fields.push({
                        name: '📚 Seasons',
                        value: String(details.number_of_seasons),
                        inline: true
                    });
                }

                if (details.number_of_episodes) {
                    fields.push({
                        name: '📼 Episodes',
                        value: String(details.number_of_episodes),
                        inline: true
                    });
                }

                if (details.status) {
                    fields.push({
                        name: '📡 Status',
                        value: details.status,
                        inline: true
                    });
                }

                if (details.genres && details.genres.length > 0) {
                    fields.push({
                        name: '🎭 Genres',
                        value: details.genres.map(g => g.name).join(', '),
                        inline: false
                    });
                }

                embed.addFields(fields);
            }

            // Ensure embed was created
            if (!embed) {
                throw new Error('Failed to create embed');
            }

            embed.setFooter({ 
                text: `Use /watch or /search to find and watch this ${type === 'movie' ? 'movie' : 'show'}!` 
            });

            // Send the share message
            await interaction.editReply({
                content: `📤 ${targetUser}, ${sharer} shared this with you!`,
                embeds: [embed]
            });

        } catch (error) {
            console.error('Share command error:', error);
            
            const errorMessage = {
                content: '❌ Failed to share. Please try again.',
                flags: 64 // ephemeral
            };

            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};
