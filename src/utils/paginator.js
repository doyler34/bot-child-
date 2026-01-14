/**
 * Paginator
 * Handles pagination with interactive buttons
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const embedBuilder = require('../ui/embedBuilder');
const messageCleanup = require('./messageCleanup');

class Paginator {
    /**
     * Create pagination buttons
     */
    createPaginationButtons(currentPage, totalPages, customId = 'page') {
        const row = new ActionRowBuilder();

        // Previous button
        const previousButton = new ButtonBuilder()
            .setCustomId(`${customId}_prev`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⬅️')
            .setDisabled(currentPage === 1);

        // Page indicator button (disabled, just shows info)
        const pageButton = new ButtonBuilder()
            .setCustomId(`${customId}_info`)
            .setLabel(`Page ${currentPage}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        // Next button
        const nextButton = new ButtonBuilder()
            .setCustomId(`${customId}_next`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('➡️')
            .setDisabled(currentPage === totalPages);

        // Close button
        const closeButton = new ButtonBuilder()
            .setCustomId(`${customId}_close`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');

        row.addComponents(previousButton, pageButton, nextButton, closeButton);
        return row;
    }

    /**
     * Create watch button row
     */
    createWatchButtonRow(item) {
        const watchButton = embedBuilder.createWatchButton(item);
        
        if (!watchButton) {
            return null;
        }

        const row = new ActionRowBuilder()
            .addComponents(watchButton);

        return row;
    }

    /**
     * Paginate through items with button controls
     */
    async paginate(interaction, items, createEmbedFunc, options = {}) {
        const {
            itemsPerPage = 1,
            timeout = config.pagination.timeout,
            customId = 'page',
            title = 'Results'
        } = options;

        if (!items || items.length === 0) {
            await interaction.editReply({
                embeds: [embedBuilder.createInfoEmbed('No Results', 'No items to display.')]
            });
            return;
        }

        const totalPages = Math.ceil(items.length / itemsPerPage);
        let currentPage = 1;

        // Function to get current page data
        const getCurrentPage = () => {
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = items.slice(start, end);
            
            return pageItems;
        };

        // Function to create message for current page
        const createPageMessage = () => {
            const pageItems = getCurrentPage();
            const embeds = [];
            const components = [];

            // Create embeds for this page
            for (let i = 0; i < pageItems.length; i++) {
                const item = pageItems[i];
                const embed = createEmbedFunc(item, (currentPage - 1) * itemsPerPage + i);
                
                // Add pagination footer to first embed
                if (i === 0) {
                    embedBuilder.addPaginationFooter(embed, currentPage, totalPages);
                }
                
                embeds.push(embed);
            }

            // Add pagination buttons
            if (totalPages > 1) {
                components.push(this.createPaginationButtons(currentPage, totalPages, customId));
            }

            // Add watch button for single item pages
            if (pageItems.length === 1) {
                const watchRow = this.createWatchButtonRow(pageItems[0]);
                if (watchRow) {
                    components.push(watchRow);
                }
            }

            return { embeds, components };
        };

        // Send initial message
        const message = await interaction.editReply(createPageMessage());

        // Schedule automatic deletion after 6 hours
        messageCleanup.scheduleDelete(message);

        // If only one page, no need for collector
        if (totalPages <= 1) {
            return;
        }

        // Create button collector
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: timeout,
            filter: i => i.user.id === interaction.user.id
        });

        collector.on('collect', async i => {
            // Check if user clicked their own buttons
            if (i.user.id !== interaction.user.id) {
                await i.reply({
                    content: 'These buttons are not for you!',
                    ephemeral: true
                });
                return;
            }

            // Handle button clicks
            if (i.customId === `${customId}_prev`) {
                currentPage = Math.max(1, currentPage - 1);
            } else if (i.customId === `${customId}_next`) {
                currentPage = Math.min(totalPages, currentPage + 1);
            } else if (i.customId === `${customId}_close`) {
                collector.stop('user_closed');
                try {
                    await i.update({
                        embeds: [embedBuilder.createInfoEmbed('Closed', 'Pagination closed.')],
                        components: []
                    });
                } catch (err) {
                    console.log('Interaction expired - pagination closed');
                }
                return;
            }

            // Update message with new page
            try {
                await i.update(createPageMessage());
            } catch (err) {
                if (err.code === 10062) {
                    console.log('Interaction expired - please use a fresh /watch command');
                    collector.stop('expired');
                } else {
                    console.error('Error updating page:', err);
                }
            }
        });

        collector.on('end', async (collected, reason) => {
            // Clean up buttons when collector ends
            if (reason !== 'user_closed') {
                try {
                    await message.edit({
                        components: []
                    });
                } catch (err) {
                    // Message might be deleted
                    console.log('Could not remove buttons:', err.message);
                }
            }
        });
    }

    /**
     * List pagination with selectable items (2 per page with number buttons)
     */
    async paginateWithSelection(interaction, items, options = {}) {
        const {
            itemsPerPage = 2,
            timeout = config.pagination.timeout,
            customId = 'select',
            title = 'Results'
        } = options;

        if (!items || items.length === 0) {
            await interaction.editReply({
                embeds: [embedBuilder.createInfoEmbed('No Results', 'No items to display.')]
            });
            return;
        }

        const totalPages = Math.ceil(items.length / itemsPerPage);
        let currentPage = 1;
        let showingDetail = false;
        let selectedItem = null;

        // Function to create 2 embeds with posters
        const createPosterEmbeds = () => {
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = items.slice(start, end);
            const tmdbService = require('../services/tmdb.service');
            const embeds = [];

            pageItems.forEach((item, index) => {
                const numberEmoji = ['1️⃣', '2️⃣'][index];
                const itemTitle = item.title || item.name;
                const year = (item.release_date || item.first_air_date || item.year || '').toString().split('-')[0];
                // Handle both TMDB (vote_average) and Jikan/MAL (score) ratings
                const rating = item.score ? `${item.score.toFixed(1)}` : (item.vote_average ? `${item.vote_average.toFixed(1)}` : 'N/A');
                const typeEmoji = item.mal_id ? '🍥' : ((item.media_type === 'movie' || item.title) ? '🎬' : '📺');

                // Create minimal embed
                const embed = new EmbedBuilder()
                    .setColor(config.embed.colors.primary)
                    .setDescription(`${numberEmoji} ${typeEmoji} **${itemTitle}**\n${year || 'N/A'} • ⭐ ${rating}`);

                // Add poster image
                if (item.poster_path) {
                    // For TMDB items, poster_path is a relative path; for anime (Jikan)
                    // it's already a full URL. Detect and handle both.
                    if (typeof item.poster_path === 'string' && item.poster_path.startsWith('http')) {
                        embed.setImage(item.poster_path);
                    } else {
                        embed.setImage(tmdbService.buildImageUrl(item.poster_path, 'w342'));
                    }
                }

                embeds.push(embed);
            });

            // Add footer to last embed
            if (embeds.length > 0) {
                embedBuilder.addPaginationFooter(embeds[embeds.length - 1], currentPage, totalPages);
            }

            return embeds;
        };

        // Function to create number selection buttons (2 buttons in one row)
        const createNumberButtons = () => {
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = items.slice(start, end);

            const row = new ActionRowBuilder();
            const numberEmojis = ['1️⃣', '2️⃣'];

            pageItems.forEach((item, index) => {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${customId}_num_${index}`)
                        .setEmoji(numberEmojis[index])
                        .setStyle(ButtonStyle.Primary)
                );
            });

            return [row];
        };

        // Send initial message
        const components = [
            ...createNumberButtons(),
            this.createPaginationButtons(currentPage, totalPages, customId)
        ];

        const message = await interaction.editReply({
            embeds: createPosterEmbeds(),
            components
        });

        // Schedule automatic deletion after 6 hours
        messageCleanup.scheduleDelete(message);

        // Create button collector
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: timeout,
            filter: i => i.user.id === interaction.user.id
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({
                    content: 'These buttons are not for you!',
                    ephemeral: true
                });
                return;
            }

            // Handle number selection
            if (i.customId.startsWith(`${customId}_num_`)) {
                // Defer the interaction immediately to prevent timeout
                try {
                    await i.deferUpdate();
                } catch (err) {
                    console.log('Failed to defer interaction:', err.message);
                    return;
                }
                
                // Parse the index from the customId
                // Format is: {customId}_num_{index}
                // Example: "popular_movie_num_1" -> split gives ["popular", "movie", "num", "1"]
                const parts = i.customId.split('_');
                const index = parseInt(parts[parts.length - 1]); // Get the last part
                const start = (currentPage - 1) * itemsPerPage;
                selectedItem = items[start + index];
                
                if (!selectedItem) {
                    console.error('ERROR: selectedItem is undefined!');
                    console.error('Button:', i.customId, 'Index:', index, 'Position:', start + index, 'Total:', items.length);
                    try {
                        await i.editReply({
                            embeds: [embedBuilder.createErrorEmbed('Error', 'Could not find the selected item. Please try again.')],
                            components: []
                        });
                    } catch (err) {
                        console.log('Could not send error message - interaction expired');
                    }
                    return;
                }
                
                showingDetail = true;

                const detailsHandler = require('../interactions/detailsHandler');

                try {
                    if (selectedItem.mal_id && !selectedItem.id) {
                        await detailsHandler.showAnimeDirect(i, selectedItem.mal_id, selectedItem.title || selectedItem.name);
                    } else {
                        // Determine if movie or TV show
                        const isMovie = selectedItem.media_type === 'movie' || selectedItem.title;
                        if (isMovie) {
                            await detailsHandler.showMovieDetails(i, selectedItem.id);
                        } else {
                            await detailsHandler.showSeasonSelector(i, selectedItem.id);
                        }
                    }
                } catch (err) {
                    if (err.code === 10062) {
                        console.log('Interaction expired - please use a fresh /watch command');
                        collector.stop('expired');
                    } else {
                        console.error('Error showing details:', err?.stack || err?.message || err);
                    }
                }
                return;
            }

            // Handle back button
            if (i.customId === `${customId}_back`) {
                showingDetail = false;
                selectedItem = null;
                try {
                    await i.update({
                        embeds: createPosterEmbeds(),
                        components: [
                            ...createNumberButtons(),
                            this.createPaginationButtons(currentPage, totalPages, customId)
                        ]
                    });
                } catch (err) {
                    if (err.code === 10062) {
                        console.log('Interaction expired - please use a fresh /watch command');
                        collector.stop('expired');
                    } else {
                        console.error('Error going back:', err);
                    }
                }
                return;
            }

            // Handle pagination
            if (i.customId === `${customId}_prev`) {
                currentPage = Math.max(1, currentPage - 1);
            } else if (i.customId === `${customId}_next`) {
                currentPage = Math.min(totalPages, currentPage + 1);
            } else if (i.customId === `${customId}_close`) {
                collector.stop('user_closed');
                try {
                    await i.update({
                        embeds: [embedBuilder.createSuccessEmbed('Thanks for using ZipxMovies!', '🍿 Hope you enjoyed your movie or show!')],
                        components: []
                    });
                } catch (err) {
                    console.log('Interaction expired - user closed pagination');
                }
                return;
            }

            try {
                await i.update({
                    embeds: createPosterEmbeds(),
                    components: [
                        ...createNumberButtons(),
                        this.createPaginationButtons(currentPage, totalPages, customId)
                    ]
                });
            } catch (err) {
                if (err.code === 10062) {
                    console.log('Interaction expired - please use a fresh /watch command');
                    collector.stop('expired');
                } else {
                    console.error('Error updating pagination:', err);
                }
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason !== 'user_closed') {
                try {
                    await message.edit({ components: [] });
                } catch (err) {
                    console.log('Could not remove buttons:', err.message);
                }
            }
        });
    }
}

// Export singleton instance
module.exports = new Paginator();
