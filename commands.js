const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, ComponentType } = require("discord.js");

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
    .setThumbnail(context.user.displayAvatarURL({ Dynamic: true }))
    .setAuthor({
        name: 'Lin',
        iconURL: 'https://images-ext-1.discordapp.net/external/juBen4RpfkkYrU6nDL4WmS-m9lVCve4sw4Ch-VeuUyc/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/961370035555811388/aecbe932977db10c538db6d91560b2cc.png?format=webp&quality=lossless'
    })
    .addFields({
        name: 'Options',
        value: 'Discord Bot'
    })
    .setTimestamp();

    await context.reply({
        embeds: [helpEmbed],
        components: [SelectMenuRow, buttonRow]
    });

    // fetch the reply message and attach the collector to it (safer than using channel)
    const replyMessage = await context.interaction.fetchReply();

    const collector = replyMessage.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
        filter: (i) => i.user.id === context.user.id
    });

    collector.on('collect', async (interaction) => {
        if (interaction.values[0] === 'help_discord_bot') {
            const discordBotHelpEmbed = new EmbedBuilder()
            .setTitle('Discord Bot Help')
            .setColor('DarkVividPink')
            .setDescription('Here is some information to help you use the Discord bot effectively...')
            .setTimestamp();

            await interaction.update({
                embeds: [discordBotHelpEmbed],
                components: [buttonRow]
            });
        }
    });

    collector.on('end', async () => {
        helpSelectMenu.setDisabled(true);
        const disabledRow = new ActionRowBuilder().addComponents(
            helpSelectMenu,
        );
        await context.editReply({
            components: [disabledRow, buttonRow]
        });

    });
}

module.exports = {
    ping,
    help,
};