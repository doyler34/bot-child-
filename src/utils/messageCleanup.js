/**
 * Message Cleanup Utility
 * Automatically deletes bot messages after a specified time
 */

class MessageCleanup {
    constructor() {
        this.deleteAfter = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
        this.scheduledDeletions = new Map();
    }

    /**
     * Schedule a message for deletion
     * @param {Message} message - Discord message object
     * @param {number} delay - Delay in milliseconds (default: 6 hours)
     */
    scheduleDelete(message, delay = this.deleteAfter) {
        if (!message || !message.deletable) {
            return;
        }

        // Cancel any existing scheduled deletion for this message
        if (this.scheduledDeletions.has(message.id)) {
            clearTimeout(this.scheduledDeletions.get(message.id));
        }

        // Schedule new deletion
        const timeoutId = setTimeout(async () => {
            try {
                await message.delete();
                console.log(`🗑️ Deleted message ${message.id} after ${delay / 1000 / 60 / 60} hours`);
                this.scheduledDeletions.delete(message.id);
            } catch (error) {
                // Message might already be deleted or bot lost permissions
                console.error(`Failed to delete message ${message.id}:`, error.message);
                this.scheduledDeletions.delete(message.id);
            }
        }, delay);

        this.scheduledDeletions.set(message.id, timeoutId);
    }

    /**
     * Schedule deletion for an interaction reply
     * @param {Interaction} interaction - Discord interaction object
     * @param {number} delay - Delay in milliseconds (default: 6 hours)
     */
    async scheduleInteractionDelete(interaction, delay = this.deleteAfter) {
        try {
            // Fetch the interaction reply message
            const message = await interaction.fetchReply();
            this.scheduleDelete(message, delay);
        } catch (error) {
            console.error('Failed to schedule interaction delete:', error.message);
        }
    }

    /**
     * Cancel scheduled deletion for a message
     * @param {string} messageId - Message ID
     */
    cancelDelete(messageId) {
        if (this.scheduledDeletions.has(messageId)) {
            clearTimeout(this.scheduledDeletions.get(messageId));
            this.scheduledDeletions.delete(messageId);
            console.log(`Cancelled deletion for message ${messageId}`);
        }
    }

    /**
     * Clear all scheduled deletions
     */
    clearAll() {
        for (const timeoutId of this.scheduledDeletions.values()) {
            clearTimeout(timeoutId);
        }
        this.scheduledDeletions.clear();
        console.log('Cleared all scheduled message deletions');
    }

    /**
     * Get count of scheduled deletions
     * @returns {number}
     */
    getScheduledCount() {
        return this.scheduledDeletions.size;
    }
}

module.exports = new MessageCleanup();
