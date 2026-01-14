/**
 * Discord Movie & TV Streaming Bot
 * Main bot entry point
 * Phase 2: API Integration - Command System & Services
 */

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const keys = require('./config/keys');
const database = require('./database/database');
const proxyServer = require('./proxy/server');

// Initialize Discord client with required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ]
});

// Collections for storing commands and interactions
client.commands = new Collection();
client.interactions = new Collection();

/**
 * Load Commands
 * Dynamically loads all command files from the commands directory
 */
function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    
    // Check if commands directory exists
    if (!fs.existsSync(commandsPath)) {
        console.warn('⚠️  Commands directory not found');
        return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    console.log('\n📂 Loading commands...');
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`  ✓ Loaded: ${command.data.name}`);
            } else {
                console.warn(`  ⚠️  Skipped ${file}: missing 'data' or 'execute' property`);
            }
        } catch (error) {
            console.error(`  ❌ Error loading ${file}:`, error.message);
        }
    }

    console.log(`\n✓ Loaded ${client.commands.size} command(s)\n`);
}

/**
 * Register Slash Commands with Discord
 * Registers all loaded commands as slash commands
 */
async function registerCommands() {
    const commands = [];
    
    for (const command of client.commands.values()) {
        commands.push(command.data.toJSON());
    }

    if (commands.length === 0) {
        console.log('⚠️  No commands to register');
        return;
    }

    const rest = new REST({ version: '10' }).setToken(keys.discord.token);

    try {
        console.log(`🔄 Registering ${commands.length} slash command(s)...`);

        // Register commands globally (takes up to 1 hour to propagate)
        // For faster testing, you can register to a specific guild instead
        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log(`✓ Successfully registered ${data.length} slash command(s) globally\n`);
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
}

// Load commands on startup
loadCommands();

// Start proxy server if enabled
proxyServer.start();

/**
 * Ready Event Handler
 * Fires when the bot successfully connects to Discord
 */
client.once('ready', async () => {
    console.log('┌─────────────────────────────────────────┐');
    console.log('│     Discord Streaming Bot - Ready!     │');
    console.log('└─────────────────────────────────────────┘');
    console.log(`🕐 CODE TIMESTAMP: ${new Date().toISOString()} [ANIME_LOGGING_ENABLED]`);
    console.log(`\n✓ Logged in as: ${client.user.tag}`);
    console.log(`✓ Bot ID: ${client.user.id}`);
    console.log(`✓ Servers: ${client.guilds.cache.size}`);
    console.log(`✓ Users: ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`);
    console.log(`✓ Version: ${config.bot.version}`);
    console.log(`✓ Commands: ${client.commands.size}`);
    
    // Initialize database
    try {
        database.initialize();
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
    
    // Register slash commands with Discord
    await registerCommands();
    
    console.log('─────────────────────────────────────────');
    console.log('Bot is now online and ready to receive commands!');
    console.log('─────────────────────────────────────────\n');

    // Set bot activity/status
    client.user.setActivity('movies & TV shows', { type: 'WATCHING' });
});

/**
 * Interaction Create Event Handler
 * Handles slash commands, buttons, and other interactions
 * (Will be expanded in Phase 2+)
 */
client.on('interactionCreate', async (interaction) => {
    // Slash command handler
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        
        if (!command) {
            console.warn(`⚠ Command not found: ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`❌ Error executing command ${interaction.commandName}:`, error);
            
            const errorMessage = {
                content: 'There was an error executing this command!',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }

    // Button interaction handler
    if (interaction.isButton()) {
        const { customId } = interaction;
        
        // Handle all menu-related buttons
        if (customId.startsWith('menu_') || customId.startsWith('movies_') || customId.startsWith('shows_') || customId.startsWith('anime_') || customId === 'back_main') {
            const menuHandler = require('./interactions/menuHandler');
            await menuHandler.handle(interaction);
            return;
        }

        // Handle back_to_results button
        if (customId === 'back_to_results') {
            const menuHandler = require('./interactions/menuHandler');
            await menuHandler.showMainMenu(interaction);
            return;
        }

        // Handle back_to_seasons button
        if (customId.startsWith('back_to_seasons_')) {
            const tvId = parseInt(customId.split('_')[3]);
            const detailsHandler = require('./interactions/detailsHandler');
            await detailsHandler.showSeasonSelector(interaction, tvId);
            return;
        }

        // Handle back_to_episodes button
        if (customId.startsWith('back_to_episodes_')) {
            const parts = customId.split('_');
            const tvId = parseInt(parts[3]);
            const season = parseInt(parts[4]);
            const detailsHandler = require('./interactions/detailsHandler');
            await detailsHandler.showEpisodeSelector(interaction, tvId, season);
            return;
        }

        // Handle back_to_anime_eps button (back to episode list)
        if (customId.startsWith('back_to_anime_eps_')) {
            // Extract MAL ID: "back_to_anime_eps_{malId}"
            const parts = customId.split('_');
            const malId = parseInt(parts[parts.length - 1]);
            
            if (isNaN(malId)) {
                console.error(`Failed to parse MAL ID from customId: ${customId}`);
                await interaction.reply({
                    content: '❌ Error: Invalid anime ID. Please try again.',
                    ephemeral: true
                });
                return;
            }
            
            const detailsHandler = require('./interactions/detailsHandler');
            const jikanService = require('./services/jikan.service');
            try {
                const anime = await jikanService.getAnimeById(malId);
                await detailsHandler.showAnimeEpisodeSelector(interaction, malId, anime?.title);
            } catch (error) {
                console.error('Error fetching anime for back button:', error);
                await detailsHandler.showAnimeEpisodeSelector(interaction, malId, null);
            }
            return;
        }

        // Handle back_to_anime_seasons button (back to season/part selector)
        if (customId.startsWith('back_to_anime_seasons_')) {
            const parts = customId.split('_');
            const malId = parseInt(parts[parts.length - 1]);
            
            if (isNaN(malId)) {
                console.error(`Failed to parse MAL ID from customId: ${customId}`);
                await interaction.reply({
                    content: '❌ Error: Invalid anime ID. Please try again.',
                    ephemeral: true
                });
                return;
            }
            
            const detailsHandler = require('./interactions/detailsHandler');
            const jikanService = require('./services/jikan.service');
            try {
                const anime = await jikanService.getAnimeById(malId);
                await detailsHandler.showAnimeEpisodeSelector(interaction, malId, anime?.title);
            } catch (error) {
                console.error('Error fetching anime for back button:', error);
                await detailsHandler.showAnimeEpisodeSelector(interaction, malId, null);
            }
            return;
        }

        // Handle watchlist toggle buttons
        if (customId.startsWith('watchlist_toggle_')) {
            const parts = customId.split('_');
            const mediaType = parts[2]; // 'movie' or 'tv'
            const tmdbId = parseInt(parts[3]);
            
            const watchlistService = require('./database/watchlist.service');
            const tmdbService = require('./services/tmdb.service');
            const userId = interaction.user.id;

            try {
                const isInWatchlist = watchlistService.isInWatchlist(userId, tmdbId, mediaType);
                
                if (isInWatchlist) {
                    // Remove from watchlist
                    watchlistService.removeFromWatchlist(userId, tmdbId, mediaType);
                    await interaction.reply({
                        content: '✅ Removed from your watchlist!',
                        flags: 64 // Ephemeral flag
                    });
                } else {
                    // Add to watchlist
                    const item = mediaType === 'movie' 
                        ? await tmdbService.getMovieDetails(tmdbId)
                        : await tmdbService.getTVShowDetails(tmdbId);
                    
                    item.media_type = mediaType;
                    watchlistService.addToWatchlist(userId, item);
                    
                    await interaction.reply({
                        content: '⭐ Added to your watchlist!',
                        flags: 64 // Ephemeral flag
                    });
                }
            } catch (error) {
                console.error('Watchlist toggle error:', error);
                await interaction.reply({
                    content: '❌ Failed to update watchlist. Please try again.',
                    flags: 64 // Ephemeral flag
                });
            }
            return;
        }

        // Handle watchlist command buttons
        if (customId === 'watchlist_clear') {
            const watchlistService = require('./database/watchlist.service');
            watchlistService.clearWatchlist(interaction.user.id);
            await interaction.update({
                embeds: [require('./ui/embedBuilder').createSuccessEmbed('Watchlist Cleared', 'Your watchlist has been cleared.')],
                components: []
            });
            return;
        }

        // Handle continue watching buttons
        if (customId === 'continue_clear') {
            const continueWatchingService = require('./database/continueWatching.service');
            continueWatchingService.clearContinueWatching(interaction.user.id);
            await interaction.update({
                embeds: [require('./ui/embedBuilder').createSuccessEmbed('History Cleared', 'Your continue watching history has been cleared.')],
                components: []
            });
            return;
        }
        
        console.log(`Button interaction: ${customId}`);
    }

    // Select menu handler
    if (interaction.isStringSelectMenu()) {
        const { customId, values } = interaction;
        const detailsHandler = require('./interactions/detailsHandler');

        // Handle season selection
        if (customId.startsWith('select_season_')) {
            const tvId = parseInt(customId.split('_')[2]);
            const selectedValue = values[0];
            const season = parseInt(selectedValue.split('_')[2]);
            
            await detailsHandler.showEpisodeSelector(interaction, tvId, season);
            return;
        }

        // Handle episode selection
        if (customId.startsWith('select_episode_')) {
            const parts = customId.split('_');
            const tvId = parseInt(parts[2]);
            const season = parseInt(parts[3]);
            
            const selectedValue = values[0];
            const episode = parseInt(selectedValue.split('_')[3]);
            
            await detailsHandler.showEpisodeDetails(interaction, tvId, season, episode);
            return;
        }

        // Handle anime season/part selection
        if (customId.startsWith('select_anime_season_')) {
            const parts = customId.split('_');
            const malId = parseInt(parts[3]);
            
            if (isNaN(malId)) {
                console.error(`Failed to parse MAL ID from customId: ${customId}`);
                await interaction.reply({
                    content: '❌ Error: Invalid anime ID. Please try again.',
                    ephemeral: true
                });
                return;
            }
            
            const selectedValue = values[0];
            
            // Check if it's a related anime (sequel/prequel/side story)
            if (selectedValue.startsWith('anime_related_') || selectedValue.startsWith('anime_series_')) {
                const relatedParts = selectedValue.split('_');
                const relatedMalId = parseInt(relatedParts[relatedParts.length - 1]);
                if (!isNaN(relatedMalId)) {
                    console.log(`[Bot] User selected related anime series, MAL ID: ${relatedMalId}`);
                    // Show episode selector for the related anime
                    await detailsHandler.showAnimeEpisodeSelector(interaction, relatedMalId, null);
                }
                return;
            }
            
            // It's a season/part - extract season number
            const seasonParts = selectedValue.split('_');
            const seasonNum = parseInt(seasonParts[seasonParts.length - 1]);
            
            if (isNaN(seasonNum)) {
                console.error(`Failed to parse season from value: ${selectedValue}`);
                await interaction.reply({
                    content: '❌ Error: Invalid season number. Please try again.',
                    ephemeral: true
                });
                return;
            }
            
            // Show episodes for this season/part
            await detailsHandler.showAnimeSeasonEpisodes(interaction, malId, seasonNum);
            return;
        }

        // Handle anime episode selection
        if (customId.startsWith('select_anime_ep_')) {
            // Extract MAL ID from customId: "select_anime_ep_{malId}"
            const parts = customId.split('_');
            const malId = parseInt(parts[3]);
            
            if (isNaN(malId)) {
                console.error(`Failed to parse MAL ID from customId: ${customId}`);
                await interaction.reply({
                    content: '❌ Error: Invalid anime ID. Please try again.',
                    ephemeral: true
                });
                return;
            }
            
            const selectedValue = values[0];
            
            if (selectedValue.includes('_more')) {
                // User selected "more episodes" - show message
                await interaction.reply({
                    content: '⚠️ This anime has many episodes. Please use the search feature to find specific episodes.',
                    ephemeral: true
                });
                return;
            }
            
            // Extract episode from value: "anime_ep_{malId}_{episode}"
            const valueParts = selectedValue.split('_');
            const episode = parseInt(valueParts[valueParts.length - 1]); // Last part is episode number
            
            if (isNaN(episode)) {
                console.error(`Failed to parse episode from value: ${selectedValue}`);
                await interaction.reply({
                    content: '❌ Error: Invalid episode number. Please try again.',
                    ephemeral: true
                });
                return;
            }
            
            await detailsHandler.showAnimeEpisodeDetails(interaction, malId, episode);
            return;
        }

        console.log(`Select menu interaction: ${customId}`);
    }

    // Modal submit handler
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('search_modal_')) {
            const menuHandler = require('./interactions/menuHandler');
            await menuHandler.handleSearchSubmit(interaction);
            return;
        }
    }
});

/**
 * Error Event Handler
 * Global error handling for the Discord client
 */
client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
});

/**
 * Warning Event Handler
 * Logs warnings from the Discord client
 */
client.on('warn', (warning) => {
    console.warn('⚠ Discord client warning:', warning);
});

/**
 * Process Error Handlers
 * Prevents the bot from crashing on unhandled errors
 */
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

/**
 * Graceful Shutdown Handler
 * Properly closes the bot connection when process is terminated
 */
process.on('SIGINT', async () => {
    console.log('\n\n⏹ Shutting down bot gracefully...');
    database.close();
    client.destroy();
    process.exit(0);
});

// Validate Discord token before attempting to login
if (!keys.discord.token) {
    console.error('❌ ERROR: Discord token not found!');
    console.error('Please set DISCORD_TOKEN in your .env file');
    process.exit(1);
}

// Connect to Discord
console.log('🔄 Connecting to Discord...\n');
client.login(keys.discord.token)
    .catch((error) => {
        console.error('❌ Failed to login to Discord:', error.message);
        console.error('\nPlease check your Discord token in the .env file');
        process.exit(1);
    });
