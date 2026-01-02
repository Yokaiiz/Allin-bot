const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require("discord.js");
const { getDBInstance } = require('./db.js');



const apid = ["292385626773258240", "961370035555811388"]


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
                    value: '`/addrole` - Adds a role to a user.\n`/removerole` - Removes a role from a user.\n`/timeout` - Temporarily restrict a user\'s ability to interact in the server.'
                },
                {
                    name: 'Economy Commands',
                    value: '`/profile` - Displays your profile information.\n`/beg` - Beg for money.\n`/gamble <amount>` - Gamble your money.\n`/daily` - Claim your daily reward.'
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


async function test_ali(context) {
    if (context.user.id !== apid[0] && context.user.id !== apid[1]) {
        return;
    }

    const args = context.args;
    if (!args || args.length === 0) {
        return context.reply({ content: 'KEY AND VALUE NOW!!!!!!!', ephemeral: true });
    }

    const [keyVal] = args; // e.g. "currency.1000"
    const [key, value] = keyVal.split(".");
    if (!key || typeof value === 'undefined') {
        return context.reply({ content: 'key.value to update db entries', ephemeral: true });
    }

    let val = value;
    if (!isNaN(val) && val.trim() !== '') {
        val = parseInt(val, 10);
    }

    const db = await getDBInstance();
    // we don't REALLY need to check if the DBS initialized, because why would it hang on start?? (add a catch here if you want bud)

    const users = db.get('users') || {};
    users[context.user.id] = users[context.user.id] || {};
    users[context.user.id][key] = val;
    await db.set('users', users);

    return context.reply({ content: `${key} set to ${val}`, ephemeral: false });
}

async function profile(context) {
    const db = await getDBInstance();
    const users = db.get('users') || {};
    const userData = users[context.user.id] || {};
    const currency = userData.currency || 0;
    const lastDaily = userData.lastDaily || null;
    const dailyCount = userData.dailyCount || 0;

    db.set('users', {...users, [context.user.id]: {...userData, id: context.user.id, name: context.user.username, currency: userData.currency || 0}});

    const profileEmbed = new EmbedBuilder()
    .setTitle(`${context.user.username}'s Profile`)
    .setColor('DarkVividPink')
    .setThumbnail(context.user.displayAvatarURL({ Dynamic: true }))
    .addFields(
        { name: 'Currency', value: `$${currency}`, inline: false },
        { name: 'Total Dailies Claimed', value: `${dailyCount}`, inline: false },
        { name: 'Last Daily Claim', value: lastDaily ? new Date(lastDaily).toUTCString() : 'Never', inline: false },
    )
    .setTimestamp();

    await context.reply({
        embeds: [profileEmbed],
    });
}

async function beg(context) {
    const db = await getDBInstance();
    const users = db.get('users') || {};
    const userData = users[context.user.id] || {};
    let currency = userData.currency || 0;

    const earned = Math.floor(Math.random() * 100) + 1; // Earn between 1 and 100
    currency += earned;
    db.set('users', {...users, [context.user.id]: {...userData, id: context.user.id, name: context.user.username, currency: currency}});

    const begEmbed = new EmbedBuilder()
    .setTitle('Begging Results')
    .setColor('DarkVividPink')
    .setThumbnail(context.user.displayAvatarURL({ Dynamic: true }))
    .setDescription(`You begged and received **${earned}** dollars!\nYou now have a total of **${currency}** dollars.`)
    .setTimestamp();

    await context.reply({
        embeds: [begEmbed],
    });
}

async function gamble(context) {
    const db = await getDBInstance();
    const users = db.get('users') || {};
    const userData = users[context.user.id] || {};
    let currency = userData.currency || 0;
    const betAmount = context.options.getInteger('amount');
    if (!betAmount || betAmount <= 0) {
        return context.reply({ content: 'Please provide a valid bet amount greater than 0.', ephemeral: true });
    }

    if (betAmount > currency) {
        return context.reply({ content: `You cannot bet more than you have! You currently have $${currency}.`, ephemeral: true });
    }

    if (currency <= 0) {
        await db.set('users', { ...users, [context.user.id]: { ...userData, id: context.user.id, name: context.user.username, currency: 0 } });
        return context.reply({ content: 'You have no money to gamble. Please earn some currency first.', ephemeral: true });
    }

    const r = Math.random();
    let multiplier = 0; // positive = win multiplier, 0 = lose bet, negative = lose multiple of bet
    let tierName = '';

    // Tiers (example probabilities):
    // Jackpot: 1% -> 10x
    // Big Win: 9% -> 3x
    // Small Win: 40% -> 1x
    // Loss: 35% -> lose your bet
    // Double Loss: 15% -> lose double your bet
    if (r < 0.01) {
        multiplier = 10;
        tierName = 'Jackpot';
    } else if (r < 0.10) {
        multiplier = 3;
        tierName = 'Big Win';
    } else if (r < 0.50) {
        multiplier = 1;
        tierName = 'Small Win';
    } else if (r < 0.85) {
        multiplier = 0;
        tierName = 'Loss';
    } else {
        multiplier = -2; // lose double the bet
        tierName = 'Double Loss';
    }

    let resultMessage = '';
    if (multiplier > 0) {
        const gain = betAmount * multiplier;
        currency += gain;
        resultMessage = `You hit **${tierName}**! You won $${gain} (x${multiplier}).`;
    } else if (multiplier === 0) {
        currency -= betAmount;
        resultMessage = `You lost your bet of $${betAmount}.`;
    } else {
        const loss = Math.abs(multiplier) * betAmount;
        currency -= loss;
        resultMessage = `Oh no! **${tierName}** — you lost $${loss}.`;
    }

    // Ensure currency doesn't go negative below 0 (optional business rule)
    if (currency < 0) currency = 0;

    await db.set('users', { ...users, [context.user.id]: { ...userData, id: context.user.id, name: context.user.username, currency } });

    const gambleEmbed = new EmbedBuilder()
        .setTitle('Gambling Results')
        .setColor('DarkVividPink')
        .setThumbnail(context.user.displayAvatarURL({ Dynamic: true }))
        .setDescription(`${resultMessage}\nYou now have a total of **${currency}** dollars.`)
        .setTimestamp();

    await context.reply({ embeds: [gambleEmbed] });
}

async function daily(context) {
    const db = await getDBInstance();
    const users = db.get('users') || {};
    const userData = users[context.user.id] || {};
    let currency = userData.currency || 0;
    let lastDaily = userData.lastDaily ? new Date(userData.lastDaily) : null;
    const now = new Date();

    if (lastDaily) {
        const timeDiff = now - lastDaily;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        if (hoursDiff < 24) {
            const nextClaim = new Date(lastDaily.getTime() + 24 * 60 * 60 * 1000);
            return context.reply({ content: `You have already claimed your daily reward. You can claim again on ${nextClaim.toUTCString()}.`, ephemeral: true });
        }
    }

    // Track total number of dailies claimed and scale reward accordingly
    const prevDailyCount = userData.dailyCount || 0;
    const dailyCount = prevDailyCount + 1;

    // Formula: base 500 + 50 per claimed daily, capped to prevent runaway values
    const baseDaily = 500;
    const perClaim = 50;
    const maxDaily = 50000;
    let dailyAmount = baseDaily + (dailyCount * perClaim);
    if (dailyAmount > maxDaily) dailyAmount = maxDaily;

    currency += dailyAmount;
    db.set('users', { ...users, [context.user.id]: { ...userData, id: context.user.id, name: context.user.username, currency, lastDaily: now.toISOString(), dailyCount } });

    const dailyEmbed = new EmbedBuilder()
        .setTitle('Daily Reward Claimed')
        .setColor('DarkVividPink')
        .setThumbnail(context.user.displayAvatarURL({ Dynamic: true }))
        .setDescription(`You have claimed your daily reward #${dailyCount} and received **${dailyAmount}** dollars!\nYou now have a total of **${currency}** dollars.`)
        .setTimestamp();

    await context.reply({ embeds: [dailyEmbed] });
}

async function timeout(context) {
    const targetUser = context.options.getUser('target');
    const duration = context.options.getInteger('duration');
    const reason = context.options.getString('reason') || 'No reason provided';
    const executorMember = context.guild.members.cache.get(context.user.id);

    if (!executorMember.permissions.has(
        PermissionFlagsBits.ModerateMembers,
        PermissionFlagsBits.Administrator,
    )) {
        return context.reply({ content: 'You do not have permission to timeout members or do not have admin.', ephemeral: true });
    }

    if (!context.guild.members.me.permissions.has(
        PermissionFlagsBits.ModerateMembers,
        PermissionFlagsBits.Administrator,
    )) {
        return context.reply({ content: 'I do not have permission to timeout members or do not have admin.', ephemeral: true });
    }

    try {
        const memberToTimeout = await context.guild.members.fetch(targetUser.id);
        await memberToTimeout.timeout(duration * 60 * 1000, reason);
        return context.reply({ content: `Successfully timed out user ${targetUser.tag} for ${duration} minutes. Reason: ${reason}` });
    } catch (error) {
        console.error('Error timing out member:', error);
        return context.reply({ content: 'There was an error timing out the member. Please ensure I have the correct permissions and the user is valid.', ephemeral: true });
    }
}

async function ban(context) {
    const targetUser = context.options.getUser('target');
    const reason = context.options.getString('reason') || 'No reason provided';
    const executorMember = context.guild.members.cache.get(context.user.id);
    if (!executorMember.permissions.has(
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.Administrator,
    )) {
        return context.reply({ content: 'You do not have permission to ban members or do not have admin.', ephemeral: true });
    }
    if (!context.guild.members.me.permissions.has(
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.Administrator,
    )) {
        return context.reply({ content: 'I do not have permission to ban members or do not have admin.', ephemeral: true });
    }
    try {
        const memberToBan = await context.guild.members.fetch(targetUser.id);
        await memberToBan.ban({ reason });
        return context.reply({ content: `Successfully banned user ${targetUser.tag}. Reason: ${reason}` });
    }
    catch (error) {
        console.error('Error banning member:', error);
        return context.reply({ content: 'There was an error banning the member. Please ensure I have the correct permissions and the user is valid.', ephemeral: true });
    }
}


module.exports = {
    ping,
    help,
    addrole,
    removerole,
    test_ali,
    profile,
    beg,
    gamble,
    daily,
    timeout,
    ban,
};