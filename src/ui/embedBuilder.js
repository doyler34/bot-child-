/**
 * Embed Builder
 * Creates beautiful Discord embeds for movies and TV shows
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config');
const tmdbService = require('../services/tmdb.service');
const vidsrcService = require('../services/vidsrc.service');

class EmbedBuilderService {
    /**
     * Create a movie card embed
     */
    createMovieCard(movie, includeDescription = true) {
        const embed = new EmbedBuilder()
            .setColor(config.embed.colors.primary)
            .setTitle(`🎬 ${movie.title}`)
            .setTimestamp();

        // Add poster
        if (movie.poster_path) {
            embed.setThumbnail(tmdbService.buildImageUrl(movie.poster_path, 'w342'));
        }

        // Add description
        if (includeDescription && movie.overview) {
            const description = movie.overview.length > 300 
                ? movie.overview.substring(0, 300) + '...'
                : movie.overview;
            embed.setDescription(description);
        }

        // Add metadata fields
        const fields = [];

        if (movie.release_date) {
            fields.push({
                name: '📅 Release Date',
                value: movie.release_date,
                inline: true
            });
        }

        if (movie.vote_average) {
            const rating = movie.vote_average.toFixed(1);
            const stars = this._getStarRating(movie.vote_average);
            fields.push({
                name: '⭐ Rating',
                value: `${stars} ${rating}/10`,
                inline: true
            });
        }

        if (movie.runtime) {
            fields.push({
                name: '⏱️ Runtime',
                value: `${movie.runtime} min`,
                inline: true
            });
        }

        if (movie.genres && movie.genres.length > 0) {
            fields.push({
                name: '🎭 Genres',
                value: movie.genres.map(g => g.name).join(', '),
                inline: false
            });
        }

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        return embed;
    }

    /**
     * Create a TV show card embed
     */
    createTVCard(show, includeDescription = true) {
        const embed = new EmbedBuilder()
            .setColor(config.embed.colors.primary)
            .setTitle(`📺 ${show.name}`)
            .setTimestamp();

        // Add poster
        if (show.poster_path) {
            embed.setThumbnail(tmdbService.buildImageUrl(show.poster_path, 'w342'));
        }

        // Add description
        if (includeDescription && show.overview) {
            const description = show.overview.length > 300 
                ? show.overview.substring(0, 300) + '...'
                : show.overview;
            embed.setDescription(description);
        }

        // Add metadata fields
        const fields = [];

        if (show.first_air_date) {
            fields.push({
                name: '📅 First Aired',
                value: show.first_air_date,
                inline: true
            });
        }

        if (show.vote_average) {
            const rating = show.vote_average.toFixed(1);
            const stars = this._getStarRating(show.vote_average);
            fields.push({
                name: '⭐ Rating',
                value: `${stars} ${rating}/10`,
                inline: true
            });
        }

        if (show.number_of_seasons) {
            fields.push({
                name: '📚 Seasons',
                value: String(show.number_of_seasons),
                inline: true
            });
        }

        if (show.number_of_episodes) {
            fields.push({
                name: '📼 Episodes',
                value: String(show.number_of_episodes),
                inline: true
            });
        }

        if (show.status) {
            fields.push({
                name: '📡 Status',
                value: show.status,
                inline: true
            });
        }

        if (show.genres && show.genres.length > 0) {
            fields.push({
                name: '🎭 Genres',
                value: show.genres.map(g => g.name).join(', '),
                inline: false
            });
        }

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        return embed;
    }

    /**
     * Create a simple result card (for search/browse lists)
     */
    createResultCard(item, index) {
        const isMovie = item.media_type === 'movie' || item.title;
        const title = item.title || item.name;
        const year = (item.release_date || item.first_air_date || '').split('-')[0];
        const typeEmoji = isMovie ? '🎬' : '📺';

        const embed = new EmbedBuilder()
            .setColor(config.embed.colors.primary)
            .setTitle(`${typeEmoji} ${title} (${year || 'N/A'})`)
            .setTimestamp();

        // Poster-style card: big image + title (minimal layout)
        // Prefer poster; fall back to backdrop if present.
        const imagePath = item.poster_path || item.backdrop_path;
        if (imagePath) {
            embed.setImage(tmdbService.buildImageUrl(imagePath, 'w500'));
        }

        return embed;
    }

    /**
     * Create "Watch Now" button
     */
    createWatchButton(item) {
        const isMovie = item.media_type === 'movie' || item.title;
        let streamUrl;

        try {
            if (isMovie) {
                streamUrl = vidsrcService.generateMovieLink(item.id);
            } else {
                streamUrl = vidsrcService.generateTVLink(item.id, 1, 1);
            }
        } catch (err) {
            return null;
        }

        const button = new ButtonBuilder()
            .setLabel('Watch Now')
            .setStyle(ButtonStyle.Link)
            .setURL(streamUrl)
            .setEmoji('▶️');

        return button;
    }

    /**
     * Create error embed
     */
    createErrorEmbed(title, description) {
        return new EmbedBuilder()
            .setColor(config.embed.colors.error)
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setTimestamp();
    }

    /**
     * Create info embed
     */
    createInfoEmbed(title, description) {
        return new EmbedBuilder()
            .setColor(config.embed.colors.info)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();
    }

    /**
     * Create success embed
     */
    createSuccessEmbed(title, description) {
        return new EmbedBuilder()
            .setColor(config.embed.colors.success)
            .setTitle(`✅ ${title}`)
            .setDescription(description)
            .setTimestamp();
    }

    /**
     * Get star rating representation
     * @private
     */
    _getStarRating(rating) {
        if (!rating || rating === 0) return '☆☆☆☆☆';
        
        const stars = Math.round(rating / 2); // Convert 10-point to 5-star
        const fullStars = '★'.repeat(stars);
        const emptyStars = '☆'.repeat(5 - stars);
        
        return fullStars + emptyStars;
    }

    /**
     * Create pagination footer
     */
    addPaginationFooter(embed, currentPage, totalPages) {
        const footerText = `Page ${currentPage} of ${totalPages} • ${config.embed.footer.text}`;
        embed.setFooter({ text: footerText });
        return embed;
    }

    /**
     * Create detailed Netflix-style movie card
     */
    async createDetailedMovieCard(movieId) {
        const movie = await tmdbService.getMovieDetails(movieId);
        
        const embed = new EmbedBuilder()
            .setColor(config.embed.colors.primary)
            .setTitle(`🎬 ${movie.title}`)
            .setTimestamp();

        // Add large poster
        if (movie.poster_path) {
            embed.setImage(tmdbService.buildImageUrl(movie.poster_path, 'w780'));
        }

        // Add description
        if (movie.overview) {
            embed.setDescription(movie.overview);
        }

        const fields = [];

        // Rating
        if (movie.vote_average) {
            const rating = movie.vote_average.toFixed(1);
            const stars = this._getStarRating(movie.vote_average);
            fields.push({
                name: '⭐ Rating',
                value: `${stars} ${rating}/10\n(${movie.vote_count?.toLocaleString()} votes)`,
                inline: true
            });
        }

        // Release date
        if (movie.release_date) {
            fields.push({
                name: '📅 Release Date',
                value: movie.release_date,
                inline: true
            });
        }

        // Runtime
        if (movie.runtime) {
            const hours = Math.floor(movie.runtime / 60);
            const mins = movie.runtime % 60;
            fields.push({
                name: '⏱️ Runtime',
                value: `${hours}h ${mins}m`,
                inline: true
            });
        }

        // Genres
        if (movie.genres && movie.genres.length > 0) {
            fields.push({
                name: '🎭 Genres',
                value: movie.genres.map(g => g.name).join(', '),
                inline: false
            });
        }

        // Cast
        if (movie.credits && movie.credits.cast && movie.credits.cast.length > 0) {
            const cast = movie.credits.cast.slice(0, 6).map(c => c.name).join(', ');
            fields.push({
                name: '👥 Cast',
                value: cast,
                inline: false
            });
        }

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        return embed;
    }

    /**
     * Create detailed Netflix-style TV show card
     */
    async createDetailedTVCard(tvId) {
        const show = await tmdbService.getTVShowDetails(tvId);
        
        const embed = new EmbedBuilder()
            .setColor(config.embed.colors.primary)
            .setTitle(`📺 ${show.name}`)
            .setTimestamp();

        // Add large poster
        if (show.poster_path) {
            embed.setImage(tmdbService.buildImageUrl(show.poster_path, 'w780'));
        }

        // Add description
        if (show.overview) {
            embed.setDescription(show.overview);
        }

        const fields = [];

        // Rating
        if (show.vote_average) {
            const rating = show.vote_average.toFixed(1);
            const stars = this._getStarRating(show.vote_average);
            fields.push({
                name: '⭐ Rating',
                value: `${stars} ${rating}/10\n(${show.vote_count?.toLocaleString()} votes)`,
                inline: true
            });
        }

        // First air date
        if (show.first_air_date) {
            fields.push({
                name: '📅 First Aired',
                value: show.first_air_date,
                inline: true
            });
        }

        // Status
        if (show.status) {
            fields.push({
                name: '📡 Status',
                value: show.status,
                inline: true
            });
        }

        // Seasons
        if (show.number_of_seasons) {
            fields.push({
                name: '📚 Seasons',
                value: String(show.number_of_seasons),
                inline: true
            });
        }

        // Episodes
        if (show.number_of_episodes) {
            fields.push({
                name: '📼 Episodes',
                value: String(show.number_of_episodes),
                inline: true
            });
        }

        // Genres
        if (show.genres && show.genres.length > 0) {
            fields.push({
                name: '🎭 Genres',
                value: show.genres.map(g => g.name).join(', '),
                inline: false
            });
        }

        // Cast
        if (show.credits && show.credits.cast && show.credits.cast.length > 0) {
            const cast = show.credits.cast.slice(0, 6).map(c => c.name).join(', ');
            fields.push({
                name: '👥 Cast',
                value: cast,
                inline: false
            });
        }

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        return embed;
    }

    /**
     * Create detailed anime card from Jikan data
     */
    createDetailedAnimeCard(anime) {
        // Match TV show/movie layout: clean title without rating
        const embed = new EmbedBuilder()
            .setColor(config.embed.colors.primary)
            .setTitle(`🍥 ${anime.title || 'Anime'}`)
            .setTimestamp();

        // Add poster as thumbnail (same as TV shows/movies)
        if (anime.images?.jpg?.large_image_url) {
            embed.setThumbnail(anime.images.jpg.large_image_url);
        } else if (anime.images?.jpg?.image_url) {
            embed.setThumbnail(anime.images.jpg.image_url);
        }

        // Add description/synopsis (match TV show 300 char limit)
        if (anime.synopsis) {
            const synopsis = anime.synopsis.length > 300 
                ? anime.synopsis.substring(0, 300) + '...'
                : anime.synopsis;
            embed.setDescription(synopsis);
        }

        const fields = [];

        // Aired date (same as "First Aired" for TV shows)
        if (anime.aired?.from) {
            const year = new Date(anime.aired.from).getFullYear();
            fields.push({
                name: '📅 First Aired',
                value: year.toString(),
                inline: true
            });
        }

        // Rating (match TV show format - simple, no user count)
        if (anime.score) {
            const stars = this._getStarRating(anime.score);
            fields.push({
                name: '⭐ Rating',
                value: `${stars} ${anime.score.toFixed(1)}/10`,
                inline: true
            });
        }

        // Episodes (same as TV shows)
        if (anime.episodes) {
            fields.push({
                name: '📚 Episodes',
                value: anime.episodes.toString(),
                inline: true
            });
        }

        // Status (match TV show field name)
        if (anime.status) {
            fields.push({
                name: '📡 Status',
                value: anime.status,
                inline: true
            });
        }

        // Genres (same as TV shows/movies)
        if (anime.genres && anime.genres.length > 0) {
            const genreNames = anime.genres.map(g => g.name).join(', ');
            fields.push({
                name: '🎭 Genres',
                value: genreNames,
                inline: false
            });
        }

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        // Add MAL link in footer
        if (anime.mal_id) {
            embed.setFooter({ 
                text: `MyAnimeList ID: ${anime.mal_id} • ${config.embed.footer.text}` 
            });
        }

        return embed;
    }
}

// Export singleton instance
module.exports = new EmbedBuilderService();
