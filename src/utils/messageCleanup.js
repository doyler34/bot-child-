/**
 * Message Cleanup Utility
 * - Deletes user conversations after 3 minutes of inactivity
 * - Global cleanup every 40 minutes for orphaned messages
 * - Tracks active interactions to avoid deleting during use
 */

class MessageCleanup {
    constructor() {
        this.inactivityTimeout = 3 * 60 * 1000; // 3 minutes
        this.globalCleanupInterval = 40 * 60 * 1000; // 40 minutes
        
        // Track user sessions: userId -> { messages: Set, lastActivity: timestamp, timeout: timeoutId }
        this.userSessions = new Map();
        
        // Track all bot messages: messageId -> { timestamp, userId }
        this.allMessages = new Map();
        
        // Global cleanup interval
        this.globalCleanupTimer = null;
    }

    /**
     * Initialize global cleanup interval
     * @param {Client} client - Discord client
     */
    startGlobalCleanup(client) {
        if (this.globalCleanupTimer) {
            clearInterval(this.globalCleanupTimer);
        }

        this.globalCleanupTimer = setInterval(async () => {
            console.log('🧹 Running global message cleanup...');
            await this.cleanupOldMessages(client);
        }, this.globalCleanupInterval);

        console.log(`✓ Global cleanup scheduled every ${this.globalCleanupInterval / 1000 / 60} minutes`);
    }

    /**
     * Track a message and associate it with a user
     * @param {Message} message - Discord message object
     * @param {string} userId - User ID who triggered this message
     */
    trackMessage(message, userId) {
        if (!message || !message.id) return;

        // Add to global message tracker
        this.allMessages.set(message.id, {
            timestamp: Date.now(),
            userId: userId,
            message: message
        });

        // Update user session
        if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, {
                messages: new Set(),
                lastActivity: Date.now(),
                timeout: null
            });
        }

        const session = this.userSessions.get(userId);
        session.messages.add(message.id);
        this.updateUserActivity(userId);
    }

    /**
     * Update user's last activity and reset their inactivity timer
     * @param {string} userId - User ID
     */
    updateUserActivity(userId) {
        const session = this.userSessions.get(userId);
        if (!session) return;

        session.lastActivity = Date.now();

        // Clear existing timeout
        if (session.timeout) {
            clearTimeout(session.timeout);
        }

        // Set new timeout for inactivity cleanup
        session.timeout = setTimeout(async () => {
            console.log(`⏱️ User ${userId} inactive for 3 minutes, cleaning up messages...`);
            await this.cleanupUserSession(userId);
        }, this.inactivityTimeout);
    }

    /**
     * Clean up all messages for a specific user
     * @param {string} userId - User ID
     */
    async cleanupUserSession(userId) {
        const session = this.userSessions.get(userId);
        if (!session) return;

        console.log(`🗑️ Cleaning up ${session.messages.size} messages for user ${userId}`);

        const deletionPromises = [];
        for (const messageId of session.messages) {
            const messageData = this.allMessages.get(messageId);
            if (messageData && messageData.message) {
                deletionPromises.push(
                    messageData.message.delete().catch(err => {
                        console.error(`Failed to delete message ${messageId}:`, err.message);
                    })
                );
                this.allMessages.delete(messageId);
            }
        }

        await Promise.all(deletionPromises);

        // Clear timeout and remove session
        if (session.timeout) {
            clearTimeout(session.timeout);
        }
        this.userSessions.delete(userId);

        console.log(`✓ Cleaned up user session for ${userId}`);
    }

    /**
     * Global cleanup of all messages older than 40 minutes
     * @param {Client} client - Discord client
     */
    async cleanupOldMessages(client) {
        const now = Date.now();
        const messagesToDelete = [];

        for (const [messageId, data] of this.allMessages.entries()) {
            const age = now - data.timestamp;
            
            // Check if message is older than 40 minutes AND user is not active
            const userSession = this.userSessions.get(data.userId);
            const userInactive = !userSession || (now - userSession.lastActivity > this.inactivityTimeout);

            if (age > this.globalCleanupInterval && userInactive) {
                messagesToDelete.push({ messageId, data });
            }
        }

        if (messagesToDelete.length === 0) {
            console.log('No old messages to clean up');
            return;
        }

        console.log(`Found ${messagesToDelete.length} old messages to delete`);

        for (const { messageId, data } of messagesToDelete) {
            try {
                if (data.message && data.message.deletable) {
                    await data.message.delete();
                }
                this.allMessages.delete(messageId);
            } catch (err) {
                console.error(`Failed to delete old message ${messageId}:`, err.message);
                this.allMessages.delete(messageId);
            }
        }

        console.log(`✓ Deleted ${messagesToDelete.length} old messages`);
    }

    /**
     * Legacy method for backwards compatibility
     * @param {Message} message - Discord message object
     */
    scheduleDelete(message) {
        // Extract userId from interaction or use a default
        const userId = message.interaction?.user?.id || 'unknown';
        this.trackMessage(message, userId);
    }

    /**
     * Get statistics
     * @returns {object}
     */
    getStats() {
        return {
            activeSessions: this.userSessions.size,
            trackedMessages: this.allMessages.size
        };
    }

    /**
     * Clear all timers and data
     */
    clearAll() {
        // Clear user session timers
        for (const session of this.userSessions.values()) {
            if (session.timeout) {
                clearTimeout(session.timeout);
            }
        }
        this.userSessions.clear();

        // Clear global cleanup timer
        if (this.globalCleanupTimer) {
            clearInterval(this.globalCleanupTimer);
            this.globalCleanupTimer = null;
        }

        this.allMessages.clear();
        console.log('Cleared all message cleanup data');
    }
}

module.exports = new MessageCleanup();
