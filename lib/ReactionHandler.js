'use strict';

const EventEmitter = require('events').EventEmitter;

/**
 * An extremely simple and pretty straight forward action row collector for Eris
 */
class ActionRowHandler extends EventEmitter {
	constructor(message, filter, permanent = false, options = {}) {
        super();

        this.client     = (message.channel.guild) ? message.channel.guild.shard.client : message.channel.client;
        this.filter     = filter;
        this.message    = message;
        this.options    = options;
        this.permanent  = permanent;
        this.ended      = false;
        this.collected  = [];
        this.listener   = (interaction) => this.checkPreConditions(interaction);

        this.client.on('interactionCreate', this.listener);

        if (options.time) {
            setTimeout(() => this.stopListening('time'), options.time);
        }
    }

    /**
     * Verify a reaction for its validity with provided filters
     * @param {object} msg The message object 
     * @param {object} emoji The emoji object containing its name and its ID 
     * @param {Eris.Member} reactor The member who reacted to this message
     */
    checkPreConditions(interaction) {
		this.client.createInteractionResponse.call(this.client, interaction.id, interaction.token, {
			type: this.options.callback || 6
		});

		const msg = interaction.message;
		const data = interaction.data;
		if (!msg  || !data) return false;
        if (this.message.id !== msg.id) {
            return false;
        }

		let userID;
		if (interaction.member) {
			userID = interaction.member.id;
		} else if (interaction.user) {
			userID = interaction.user.id;
		}

        if (this.filter(userID, data, interaction)) {
            this.collected.push({ msg, userID, data, interaction });
            this.emit('action', { msg, userID, data, interaction });



            if (this.collected.length >= this.options.maxMatches) {
                this.stopListening('maxMatches');
                return true;
            }
        }

        return false;
    }

    /**
     * Stops collecting reactions and removes the listener from the client
     * @param {string} reason The reason for stopping
     */
    stopListening (reason) {
        if (this.ended) {
            return;
        }

        this.ended = true;

        if (!this.permanent) {
            this.client.removeListener('interactionCreate', this.listener);
        }
        
        this.emit('end', this.collected, reason);
    }
}

/**
 * An extremely simple and pretty straight forward reaction collector for Eris
 */
class ReactionHandler extends EventEmitter {
    constructor(message, filter, permanent = false, options = {}) {
        super();

        this.client     = (message.channel.guild) ? message.channel.guild.shard.client : message.channel.client;
        this.filter     = filter;
        this.message    = message;
        this.options    = options;
        this.permanent  = permanent;
        this.ended      = false;
        this.collected  = [];
        this.listener   = (msg, emoji, reactor) => this.checkPreConditions(msg, emoji, reactor);

        this.client.on('messageReactionAdd', this.listener);

        if (options.time) {
            setTimeout(() => this.stopListening('time'), options.time);
        }
    }

    /**
     * Verify a reaction for its validity with provided filters
     * @param {object} msg The message object 
     * @param {object} emoji The emoji object containing its name and its ID 
     * @param {Eris.Member} reactor The member who reacted to this message
     */
    checkPreConditions(msg, emoji, reactor) {
        if (this.message.id !== msg.id) {
            return false;
        }

        if (this.filter(reactor.id, emoji)) {
            this.collected.push({ msg, emoji, userID: reactor.id || reactor, reactor: reactor.id ? reactor : { id: reactor.id } });
            this.emit('reacted', { msg, emoji, userID: reactor.id || reactor, reactor: reactor.id ? reactor : { id: reactor.id } });



            if (this.collected.length >= this.options.maxMatches) {
                this.stopListening('maxMatches');
                return true;
            }
        }

        return false;
    }

    /**
     * Stops collecting reactions and removes the listener from the client
     * @param {string} reason The reason for stopping
     */
    stopListening (reason) {
        if (this.ended) {
            return;
        }

        this.ended = true;

        if (!this.permanent) {
            this.client.removeListener('messageReactionAdd', this.listener);
        }
        
        this.emit('end', this.collected, reason);
    }
}

module.exports = {
    continuousReactionStream: ReactionHandler,
    collectReactions: (message, filter, options) => {
        const bulkCollector = new ReactionHandler(message, filter, false, options);

        return new Promise((resolve) => {
            bulkCollector.on('end', resolve);
        });
    },
	continuousActionRowStream: ActionRowHandler,
	collectActionRow: (message, filter, options) => {
		const bulkCollector = new ActionRowHandler(message, filter, false, options);

        return new Promise((resolve) => {
            bulkCollector.on('end', resolve);
        });
	}
};
