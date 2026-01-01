class CommandContext {
    constructor(interaction) {
        this.interaction = interaction;
        this.commandName = interaction.commandName;
        this.user = interaction.user;
        this.channel = interaction.channel;
        this.guild = interaction.guild;
        this.options = interaction.options;
    }

    reply(options) {
        return this.interaction.reply(options);
    }

    deferReply(options) {
        return this.interaction.deferReply(options);
    }

    followUp(options) {
        return this.interaction.followUp(options);
    }

    formatName(name) {
        return `***${this.user.username}***`;
    }
}

module.exports = { CommandContext };