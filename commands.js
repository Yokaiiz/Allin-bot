const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require("discord.js");

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
            .setAuthor({
                name: 'Lin',
                iconURL: 'https://images-ext-1.discordapp.net/external/juBen4RpfkkYrU6nDL4WmS-m9lVCve4sw4Ch-VeuUyc/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/961370035555811388/aecbe932977db10c538db6d91560b2cc.png?format=webp&quality=lossless'
            })
            .setDescription('Here is some information to help you use the Discord bot effectively...')
            .addFields(
                {
                    name: 'Miscellaneous Commands',
                    value: '`/ping` - Replies with Pong!\n`/help` - Provides helpful information about the bot.'
                },
                {
                    name: 'Moderation Commands',
                    value: '`/addrole` - Adds a role to a user.\n`/removerole` - Removes a role from a user.'
                }
            )
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

async function addrole(context) {
    const targetUser = context.options.getUser('target');
    const roleToAdd = context.options.getRole('role');
    const executorMember = context.guild.members.cache.get(context.user.id);

    if (!executorMember.permissions.has(
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.Administrator,
    )) {
        return context.reply({ content: 'You do not have permission to manage roles or do not have admin.', ephemeral: true });
    }

    if (!context.guild.members.me.permissions.has(
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.Administrator,
    )) {
        return context.reply({ content: 'I do not have permission to manage roles or do not have admin.', ephemeral: true });
    }

    if (roleToAdd.position >= executorMember.roles.highest.position) {
        return context.reply({ content: 'You cannot assign a role that is equal to or higher than your highest role.', ephemeral: true });
    }

    if (roleToAdd.position >= context.guild.members.me.roles.highest.position) {
        return context.reply({ content: 'I cannot assign a role that is equal to or higher than my highest role.', ephemeral: true });
    }

    try {
        const memberToModify = await context.guild.members.fetch(targetUser.id);
        await memberToModify.roles.add(roleToAdd);
        return context.reply({ content: `Successfully added the role ${roleToAdd.name} to user ${targetUser.tag}.` });
    } catch (error) {
        console.error('Error adding role:', error);
        return context.reply({ content: 'There was an error adding the role. Please ensure I have the correct permissions and the user is valid.', ephemeral: true });
    }
}

async function removerole(context) {
    const targetUser = context.options.getUser('target');
    const roleToRemove = context.options.getRole('role');
    const executorMember = context.guild.members.cache.get(context.user.id);

    if (!executorMember.permissions.has(
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.Administrator,
    )) {
        return context.reply({ content: 'You do not have permission to manage roles or do not have admin.', ephemeral: true });
    }

    if (!context.guild.members.me.permissions.has(
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.Administrator,
    )) {
        return context.reply({ content: 'I do not have permission to manage roles or do not have admin.', ephemeral: true });
    }

    if (roleToRemove.position >= executorMember.roles.highest.position) {
        return context.reply({ content: 'You cannot remove a role that is equal to or higher than your highest role.', ephemeral: true });
    }

    if (roleToRemove.position >= context.guild.members.me.roles.highest.position) {
        return context.reply({ content: 'I cannot remove a role that is equal to or higher than my highest role.', ephemeral: true });
    }

    try {
        const memberToModify = await context.guild.members.fetch(targetUser.id);
        await memberToModify.roles.remove(roleToRemove);
        return context.reply({ content: `Successfully removed the role ${roleToRemove.name} from user ${targetUser.tag}.` });
    } catch (error) {
        console.error('Error removing role:', error);
        return context.reply({ content: 'There was an error removing the role. Please ensure I have the correct permissions and the user is valid.', ephemeral: true });
    }
}

module.exports = {
    ping,
    help,
    addrole,
    removerole,
};