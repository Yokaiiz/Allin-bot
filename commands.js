const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");

async function ping(context) {
    return context.reply({ content: 'Pong!' });
}

async function help(context) {
    const helpButton = new ButtonBuilder()
    .setLabel('Support server')
    .setStyle(ButtonStyle.Link)
    .setURL('https://discord.gg/MsC3ATzQwn');

    const helpSelectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_select_menu')
    .setPlaceholder('Select a help topic')
    .addOptions([
        new StringSelectMenuOptionBuilder()
        .setLabel('Discord Bot')
        .setDescription('Get help with using the Discord bot.')
        .setValue('help_discord_bot'),
    ]);

    const buttonRow = new ActionRowBuilder().addComponents(
        helpButton,
    );

    const SelectMenuRow = new ActionRowBuilder().addComponents(
        helpSelectMenu,
    );

    const helpEmbed = new EmbedBuilder()
    .setTitle('Welcome to the Allin Bot Help!')
    .setColor('DarkVividPink')
    .setAuthor({
        name: 'Lin',
        iconURL: 'https://images-ext-1.discordapp.net/external/juBen4RpfkkYrU6nDL4WmS-m9lVCve4sw4Ch-VeuUyc/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/961370035555811388/aecbe932977db10c538db6d91560b2cc.png?format=webp&quality=lossless'
    })
    .addFields({
        name: 'Options',
        value: 'Discord Bot'
    })
    .setTimestamp();

    return context.reply({
        embeds: [helpEmbed],
        components: [SelectMenuRow, buttonRow]
    });
}

module.exports = {
    ping,
    help,
};