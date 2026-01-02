class CommandContext {
    constructor(interactionOrMessage, args = null) {
        if (interactionOrMessage.isChatInputCommand && interactionOrMessage.isChatInputCommand()) {
            // interaction, comes from buttons, slash, etc
            this.interaction = interactionOrMessage;
            this.commandName = interactionOrMessage.commandName;
            this.user = interactionOrMessage.user;
            this.channel = interactionOrMessage.channel;
            this.guild = interactionOrMessage.guild;
            this.options = interactionOrMessage.options;
            this.args = null;
        } else {
            // It's a message (prefix)
            this.message = interactionOrMessage;
            this.user = interactionOrMessage.author;
            this.channel = interactionOrMessage.channel;
            this.guild = interactionOrMessage.guild;
            this.args = args || [];
            this.interaction = null;
            this.options = null;
        }
    }


    // cba to cache the reply messages so we just .send on the channels, can be fixed in the future if you cache the mid BEFORE any command/reply is sent for prefixes
    /*
    example of how to cache the reply message:
        const replyMessage = await this.channel.send(options.content || options);
        this.replyMessage = replyMessage.id;

        (can be handled later on automatically with ctx funcs but who wanna do that :joy:)
    */

    reply(options) {
        if (this.interaction) {
            return this.interaction.reply(options);
        } else {
            return this.channel.send(options.content || options);
        }
    }

    deferReply(options) {
        if (this.interaction) {
            return this.interaction.deferReply(options);
        } else {
            return Promise.resolve();
        }
    }

    followUp(options) {
        if (this.interaction) {
            return this.interaction.followUp(options);
        } else {
            return this.channel.send(options.content || options);
        }
    }

    editReply(options) {
        if (this.interaction) {
            return this.interaction.editReply(options);
        } else {
            return Promise.resolve();
        }
    }

    formatName(name) {
        return `***${this.user.username}***`;
    }
}

module.exports = { CommandContext };