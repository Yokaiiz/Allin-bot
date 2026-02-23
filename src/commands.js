const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, ComponentType, PermissionFlagsBits, ChannelType } = require("discord.js");
const { getDBInstance } = require('./db.js');
const roleplayGifs = require('./roleplay_gifs.json');


const apid = ["292385626773258240", "961370035555811388"]

const activeEffects = new Map();

// Fetch anime GIF from Tenor (Node 18+ has global fetch). Falls back to null on error.
async function fetchAnimeGif(term) {
    const key = process.env.TENOR_API_KEY;
    if (!key) return null;
    try {
        const q = encodeURIComponent(`anime ${term}`);
        const url = `https://g.tenor.com/v1/search?q=${q}&key=${key}&limit=20&media_filter=minimal`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (data && Array.isArray(data.results) && data.results.length > 0) {
            const pick = data.results[Math.floor(Math.random() * data.results.length)];
            // Tenor v1 returns a `media` array with different formats
            if (pick.media && pick.media[0]) {
                const media = pick.media[0];
                if (media.gif && media.gif.url) return media.gif.url;
                if (media.mediumgif && media.mediumgif.url) return media.mediumgif.url;
                if (media.tinygif && media.tinygif.url) return media.tinygif.url;
            }
            // fallback to result url if present
            if (pick.url) return pick.url;
        }
    } catch (e) {
        console.error('fetchAnimeGif error', e);
    }
    return null;
}

// Download a remote URL and return a Buffer, or null on failure
async function downloadAsBuffer(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const ab = await res.arrayBuffer();
        return Buffer.from(ab);
    } catch (e) {
        console.error('downloadAsBuffer error', e);
        return null;
    }
}

// Return a simple 3rd-person singular form for a verb (handles common cases)
function toThirdPerson(verb) {
    if (!verb || typeof verb !== 'string') return verb;
    const lower = verb.toLowerCase();
    // verbs ending with s, x, z, ch, sh -> add 'es' (kiss -> kisses)
    if (/(s|x|z|ch|sh)$/.test(lower)) return verb + 'es';
    // default: add 's'
    return verb + 's';
}

// Return a gerund (present participle) form for common verbs (kiss -> kissing, hug -> hugging)
function toGerund(verb) {
    if (!verb || typeof verb !== 'string') return verb;
    const lower = verb.toLowerCase();
    // verbs ending with 'e' (but not 'ee') -> drop 'e' + ing (cuddle -> cuddling)
    if (lower.endsWith('e') && !lower.endsWith('ee')) return verb.slice(0, -1) + 'ing';
    // short verbs like 'hug' that follow CVC pattern should double final consonant
    if (/^[a-zA-Z]{1,4}$/.test(verb)) {
        const len = verb.length;
        const last = lower[len - 1];
        const prev = lower[len - 2] || '';
        if (!/[aeiou]/.test(last) && /[aeiou]/.test(prev)) {
            return verb + last + 'ing';
        }
    }
    return verb + 'ing';
}

// Items that can be found when begging
const begItems = [
    { name: 'Old Coin', value: 10, rarity: 'common' },
    { name: 'Torn Ribbon', value: 5, rarity: 'common' },
    { name: 'Shiny Necklace', value: 200, rarity: 'uncommon' },
    { name: 'Mystery Box', value: 0, rarity: 'uncommon' },
    { name: 'Golden Ticket', value: 500, rarity: 'rare' },
    { name: 'Rare Gem', value: 1000, rarity: 'very rare' }
];


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
                    value: '`/addrole` - Adds a role to a user.\n`/removerole` - Removes a role from a user.\n`/timeout` - Temporarily restrict a user\'s ability to interact in the server.\n`/ban` - Bans a user from the server.\n`/kick` - Kicks a user from the server.\n`/createchannel` - Creates a new channel, category, or forum.\n`/deletechannel` - Deletes a channel, category, or forum.\n`/purge` - Deletes a specified number of messages from a channel.'
                },
                {
                    name: 'Economy Commands',
                    value: '`/profile` - Displays your profile information.\n`/beg` - Beg for money.\n`/gamble <amount>` - Gamble your money.\n`/daily` - Claim your daily reward.\n`/inv` - Displays your inventory.\n`/use <item>` - Uses an item from your inventory.\n`/shop` - Displays the shop.'
                },
                {
                    name: 'Roleplay Commands',
                    value: '`/kiss <target>` - Send a kiss to another user.\n`/hug <target>` - Hug another user.\n`/cuddle <target>` - Cuddle another user.\n`/slap <target>` - Slap another user.\n`/punch <target>` - Punch another user.\n`/kill <target>` - Kill another user.'
                }
            )
            .setTimestamp();

            try {
                await interaction.update({ embeds: [discordBotHelpEmbed], components: [buttonRow] });
            } catch (err) {
                console.error('interaction.update failed (help menu), falling back to edit:', err);
                try { await replyMessage.edit({ embeds: [discordBotHelpEmbed], components: [buttonRow] }); } catch (e) { try { await context.editReply({ embeds: [discordBotHelpEmbed], components: [buttonRow] }); } catch (e2) {/* ignore */} }
            }
        }
    });

    collector.on('end', async () => {
        helpSelectMenu.setDisabled(true);
        const disabledRow = new ActionRowBuilder().addComponents(
            helpSelectMenu,
        );
        try {
            await context.editReply({ components: [disabledRow, buttonRow] });
        } catch (err) {
            console.error('help collector end edit failed, falling back:', err);
            try { await replyMessage.edit({ components: [disabledRow, buttonRow] }); } catch (e) { try { await context.editReply({ components: [disabledRow, buttonRow] }); } catch (e2) {/* ignore */} }
        }

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

function getActiveEffect(userId, effectType) {
    const userEffects = activeEffects.get(userId);
    if (!userEffects) return null;
    return userEffects[effectType] || null;
}

function setActiveEffect(userId, effectType, duration) {
    if (!activeEffects.has(userId)) {
        activeEffects.set(userId, {});
    }
    const userEffects = activeEffects.get(userId);
    const expiresAt = Date.now() + duration;
    userEffects[effectType] = { expiresAt };
    
    setTimeout(() => {
        const currentEffects = activeEffects.get(userId);
        if (currentEffects && currentEffects[effectType]) {
            delete currentEffects[effectType];
            if (Object.keys(currentEffects).length === 0) {
                activeEffects.delete(userId);
            }
        }
    }, duration);
}

async function beg(context) {
    const db = await getDBInstance();
    const users = db.get('users') || {};
    const userData = users[context.user.id] || {};
    let currency = userData.currency || 0;

    let earned = Math.floor(Math.random() * 100) + 1;
    
    const luckBoost = getActiveEffect(context.user.id, 'luck_boost_35');
    if (luckBoost && luckBoost.expiresAt > Date.now()) {
        const multiplier = 1.35;
        earned = Math.floor(earned * multiplier);
    }
    
    currency += earned;
    db.set('users', {...users, [context.user.id]: {...userData, id: context.user.id, name: context.user.username, currency: currency}});

    let itemReceived = null;
    const itemChance = Math.random();
    if (itemChance < 0.15) {
        const allItems = context.getItemData();
        if (allItems && allItems.length > 0) {
            const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
            try {
                await context.addItemToInventory(randomItem.id, 1);
                itemReceived = randomItem;
            } catch (error) {
                console.error('Error adding item to inventory:', error);
            }
        }
    }

    let description = `You begged and received **${earned}** dollars!\n-# > *You now have a total of **${currency}** dollars!*`;
    if (itemReceived) {
        description += `\n\n**BOOYAH!** You also got: **${itemReceived.name}**`;
    }

    const begEmbed = new EmbedBuilder()
    .setTitle('Begging Results')
    .setColor('DarkVividPink')
    .setThumbnail(context.user.displayAvatarURL({ Dynamic: true }))
    .setDescription(description)
    .setTimestamp();

    await context.reply({ embeds: [begEmbed] });
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

async function _roleplayAction(context, actionKey, actionVerb, gifs) {
    const targetUser = context.options.getUser('target');
    const actor = context.user;

    if (!targetUser) {
        return context.reply({ content: `Who do you want to ${actionVerb}? Use the \`target\` option.`, ephemeral: true });
    }

    if (targetUser.bot) {
        return context.reply({ content: `You can't ${actionVerb} a bot.`, ephemeral: true });
    }

    // Pick a random gif (local first, Tenor fallback)
    let gif = null;
    if (Array.isArray(gifs) && gifs.length > 0) {
        gif = gifs[Math.floor(Math.random() * gifs.length)];
    } else {
        try {
            gif = await fetchAnimeGif(actionVerb);
        } catch {}
    }

    const db = await getDBInstance();
    const users = db.get('users') || {};
    const actorData = users[actor.id] || {};
    const targetData = users[targetUser.id] || {};

    actorData.roleplay ??= {};
    targetData.roleplay ??= {};

    const givenKey = `${actionKey}Given`;
    const receivedKey = `${actionKey}Received`;

    actorData.roleplay[givenKey] = (actorData.roleplay[givenKey] || 0) + 1;
    targetData.roleplay[receivedKey] = (targetData.roleplay[receivedKey] || 0) + 1;

    await db.set('users', {
        ...users,
        [actor.id]: { ...actorData, id: actor.id, name: actor.username },
        [targetUser.id]: { ...targetData, id: targetUser.id, name: targetUser.username }
    });

    const verbThird = toThirdPerson(actionVerb);
    const gerund = toGerund(actionVerb);

    const embed = new EmbedBuilder()
        .setTitle(`${actor.username} ${verbThird} ${targetUser.username}`)
        .setDescription(`${actor.username} ${gerund} ${targetUser.username}.`)
        .setColor('DarkVividPink')
        .addFields({
            name: `${targetUser.username} - ${actionKey} received`,
            value: `${targetData.roleplay[receivedKey]}`,
            inline: true
        })
        .setImage(gif)
        .setTimestamp();

    const recipButton = new ButtonBuilder()
        .setCustomId(`rp_rec_${actionKey}_${actor.id}_${targetUser.id}`)
        .setLabel('Reciprocate')
        .setStyle(ButtonStyle.Primary);

    const declineButton = new ButtonBuilder()
        .setCustomId(`rp_dec_${actionKey}_${actor.id}_${targetUser.id}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(recipButton, declineButton);

    await context.reply({ embeds: [embed], components: [row] });

    const replyMessage = await context.interaction.fetchReply();

    const collector = replyMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        filter: i =>
            i.customId === `rp_rec_${actionKey}_${actor.id}_${targetUser.id}` ||
            i.customId === `rp_dec_${actionKey}_${actor.id}_${targetUser.id}`
    });

    collector.on('collect', async interaction => {
        if (interaction.user.id !== targetUser.id) {
            return interaction.reply({ content: 'Only the target can respond to this interaction.', ephemeral: true });
        }

        recipButton.setDisabled(true);
        declineButton.setDisabled(true);
        const disabledRow = new ActionRowBuilder().addComponents(recipButton, declineButton);

        // Decline
        if (interaction.customId.startsWith('rp_dec_')) {
            const declinedEmbed = new EmbedBuilder()
                .setTitle(`${targetUser.username} declined to ${actionVerb}`)
                .setDescription(`${targetUser.username} declined to ${actionVerb} ${actor.username}.`)
                .setColor('Grey')
                .setTimestamp();

            await interaction.update({ embeds: [declinedEmbed], components: [disabledRow] });
            collector.stop();
            return;
        }

        // Reciprocate
        const users2 = db.get('users') || {};
        const actorData2 = users2[actor.id] || {};
        const targetData2 = users2[targetUser.id] || {};

        actorData2.roleplay ??= {};
        targetData2.roleplay ??= {};

        targetData2.roleplay[givenKey] = (targetData2.roleplay[givenKey] || 0) + 1;
        actorData2.roleplay[receivedKey] = (actorData2.roleplay[receivedKey] || 0) + 1;

        await db.set('users', {
            ...users2,
            [actor.id]: { ...actorData2, id: actor.id, name: actor.username },
            [targetUser.id]: { ...targetData2, id: targetUser.id, name: targetUser.username }
        });

        let recipGif = null;
        if (Array.isArray(gifs) && gifs.length > 0) {
            recipGif = gifs[Math.floor(Math.random() * gifs.length)];
        } else {
            try {
                recipGif = await fetchAnimeGif(actionVerb);
            } catch {}
        }

        const recipEmbed = new EmbedBuilder()
            .setTitle(`${targetUser.username} ${verbThird} ${actor.username}`)
            .setDescription(`${targetUser.username} ${gerund} ${actor.username} in return.`)
            .setColor('DarkVividPink')
            .addFields({
                name: `${targetUser.username} - ${actionKey} given`,
                value: `${targetData2.roleplay[givenKey]}`,
                inline: true
            })
            .setImage(recipGif)
            .setTimestamp();

        await interaction.update({ embeds: [recipEmbed], components: [disabledRow] });
        collector.stop();
    });

    collector.on('end', async () => {
        try {
            recipButton.setDisabled(true);
            declineButton.setDisabled(true);
            await context.editReply({
                components: [new ActionRowBuilder().addComponents(recipButton, declineButton)]
            });
        } catch {}
    });
}

async function kiss(context) {
    return _roleplayAction(context, 'kisses', 'kiss', roleplayGifs.kiss);
}

async function hug(context) {
    return _roleplayAction(context, 'hugs', 'hug', roleplayGifs.hug);
}

async function cuddle(context) {
    return _roleplayAction(context, 'cuddles', 'cuddle', roleplayGifs.cuddle);
}

async function slap(context) {
    return _roleplayAction(context, 'slaps', 'slap', roleplayGifs.slap);
}

async function punch(context) {
    return _roleplayAction(context, 'punches', 'punch', roleplayGifs.punch);
}

async function kill(context) {
    return _roleplayAction(context, 'kills', 'kill', roleplayGifs.kill);
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


async function inv(context) {
    const inventory = await context.getInventory();

    if (!inventory || inventory.length === 0) {
        return context.reply({ content: `${context.formatName()}, you've got no items in your inventory!`, ephemeral: true });
    }

    const description = inventory.map((item, idx) => {
        return `[\`${idx + 1}\`]: ${item.name} x${item.quantity}`;
    }).join('\n');

    const invEmbed = new EmbedBuilder()
        .setTitle(`${context.user.username}'s Inventory`)
        .setColor('Aqua')
        .setDescription(description)
        .setTimestamp();

    await context.reply({ embeds: [invEmbed] });
}

async function use(context) {
    const args = context.args;
    
    if (!args || args.length === 0) {
        return context.reply({ content: 'specify the item you want to use, e.g. `ali use <item>', ephemeral: true });
    }

    const itemNameInput = args.join(' ').toLowerCase();
    const itemData = context.getItemByName(itemNameInput);
    
    if (!itemData) {
        return 
    }

    if (!itemData.duration || !itemData.effect) {
        return 
    }

    const inventory = await context.getInventory();
    if (!inventory || inventory.length === 0) {
        return context.reply({ content: 'you got ZERO items', ephemeral: true });
    }

    const itemInInventory = inventory.find(item => item.id === itemData.id);
    if (!itemInInventory || itemInInventory.quantity <= 0) {
        return 
    }
    


    const db = await getDBInstance();
    const users = db.get('users') || {};
    const userId = context.user.id;
    const userData = users[userId] || {};

    if (!userData.inventory || !userData.inventory[itemData.id]) {
        return // should never happen
    }

    if (userData.inventory[itemData.id] <= 0) {
        return // should never happen
    }

    userData.inventory[itemData.id] -= 1;
    if (userData.inventory[itemData.id] === 0) {
        delete userData.inventory[itemData.id];
    }

    await db.set('users', { ...users, [userId]: { ...userData, id: userId, name: context.user.username } });

    setActiveEffect(userId, itemData.effect, itemData.duration);

    const durationMinutes = Math.floor(itemData.duration / 60000);
    await context.reply({
        content: `You used **${itemData.name}**\n\n-# > **Effect:** ${itemData.description}\n-# > **Duration:** ${durationMinutes} minutes`
    });
}

async function kick(context) {
    const targetUser = context.options.getUser('target');
    const reason = context.options.getString('reason') || 'No reason provided';
    const executorMember = context.guild.members.cache.get(context.user.id);

    if (!executorMember.permissions.has(
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.Administrator,
    )) {
        return context.reply({ content: 'You do not have permission to kick members or do not have admin.', ephemeral: true });
    }

    if (!context.guild.members.me.permissions.has(
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.Administrator,
    )) {
        return context.reply({ content: 'I do not have permission to kick members or do not have admin.', ephemeral: true });
    }
    
    try {
        const memberToKick = await context.guild.members.fetch(targetUser.id);
        await memberToKick.kick(reason);
        return context.reply({ content: `Successfully kicked user ${targetUser.tag}. Reason: ${reason}` });
    } catch (error) {
        console.error('Error kicking member:', error);
        return context.reply({ content: 'There was an error kicking the member. Please ensure I have the correct permissions and the user is valid.', ephemeral: true });
    }
}

async function createchannel(context) {
    const rawName = context.options.getString('name');
    if (!rawName) return context.reply({ content: 'You must provide a channel name.', ephemeral: true });

    // sanitize - discord prefers lower-case and dashes for text channel names
    const channelName = rawName.trim().replace(/\s+/g, '-').toLowerCase();
    const typeInput = (context.options.getString('type') || 'text').toLowerCase();
    const topic = context.options.getString('topic');

    const executorMember = context.guild.members.cache.get(context.user.id);
    if (!executorMember || (!executorMember.permissions.has(PermissionFlagsBits.ManageChannels) && !executorMember.permissions.has(PermissionFlagsBits.Administrator))) {
        return context.reply({ content: 'You do not have permission to create channels.', ephemeral: true });
    }

    if (!context.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels) && !context.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
        return context.reply({ content: 'I do not have permission to create channels.', ephemeral: true });
    }

    // Prevent creating duplicate channels with the same name
    const existing = context.guild.channels.cache.find(ch => ch.name === channelName);
    if (existing) {
        return context.reply({ content: `A channel named **${channelName}** already exists.`, ephemeral: true });
    }

    let channelType;
    switch (typeInput) {
        case 'voice':
        case 'vc':
            channelType = ChannelType.GuildVoice;
            break;
        case 'category':
            channelType = ChannelType.GuildCategory;
            break;
        case 'stage':
            channelType = ChannelType.GuildStageVoice;
            break;
        case 'forum':
            channelType = ChannelType.GuildForum;
            break;
        case 'news':
        case 'announcement':
            channelType = ChannelType.GuildAnnouncement;
            break;
        case 'text':
        default:
            channelType = ChannelType.GuildText;
            break;
    }

    try {
        const created = await context.guild.channels.create({
            name: channelName,
            type: channelType,
            topic: channelType === ChannelType.GuildText ? (topic || null) : undefined,
            reason: `Created by ${context.user.tag} via bot command`
        });

        return context.reply({ content: `Successfully created channel <#${created.id}>.`, ephemeral: false });
    } catch (error) {
        console.error('Error creating channel:', error);
        return context.reply({ content: 'There was an error creating the channel. Please ensure I have the correct permissions and that the name is valid.', ephemeral: true });
    }
}

async function deletechannel(context) {
    const nameInput = context.options.getString('name')?.trim();
    const channelOption = context.options.getChannel('channel');

    if (!nameInput && !channelOption) {
        return context.reply({ content: 'You must provide a channel `name` or select a `channel` to delete. Example: `/deletechannel channel:#general` or `/deletechannel name:general`', ephemeral: true });
    }

    const executorMember = context.guild.members.cache.get(context.user.id);
    if (!executorMember || (!executorMember.permissions.has(PermissionFlagsBits.ManageChannels) && !executorMember.permissions.has(PermissionFlagsBits.Administrator))) {
        return context.reply({ content: 'You do not have permission to delete channels.', ephemeral: true });
    }

    if (!context.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels) && !context.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
        return context.reply({ content: 'I do not have permission to delete channels.', ephemeral: true });
    }

    // Collect candidate channels
    let candidates = [];
    try {
        if (channelOption) {
            candidates.push(channelOption);
        }

        if (nameInput) {
            const exact = context.guild.channels.cache.filter(ch => ch.name && ch.name.toLowerCase() === nameInput.toLowerCase());
            if (exact.size) candidates.push(...exact.values());
            else {
                const partial = context.guild.channels.cache.filter(ch => ch.name && ch.name.toLowerCase().includes(nameInput.toLowerCase()));
                if (partial.size) candidates.push(...partial.values());
            }
        }
    } catch (e) {
        console.error('Error searching channels:', e);
    }

    // Deduplicate by id
    candidates = [...new Map(candidates.map(ch => [ch.id, ch])).values()];

    if (!candidates.length) return context.reply({ content: `No channels found matching **${nameInput || (channelOption ? channelOption.id : '')}**.`, ephemeral: true });

    // If multiple matches, present a select menu to the user
    if (candidates.length > 1) {
        const options = candidates.slice(0, 25).map(ch => ({ label: `#${ch.name}`, description: `ID: ${ch.id}`, value: ch.id }));
        const select = new StringSelectMenuBuilder()
            .setCustomId(`delete_channel_select_${context.user.id}`)
            .setPlaceholder('Select a channel to delete')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);

        await context.reply({ content: 'Multiple channels matched your query. Please select the one you want to delete:', components: [row], ephemeral: true });
        const replyMessage = await context.interaction.fetchReply();

        const collector = replyMessage.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000, filter: (i) => i.user.id === context.user.id });

        collector.on('collect', async (interaction) => {
            await interaction.deferUpdate();
            const selectedId = interaction.values[0];
            const ch = context.guild.channels.cache.get(selectedId) || await context.guild.channels.fetch(selectedId).catch(() => null);
            if (!ch) {
                try {
                    await interaction.editReply({ content: 'Selected channel not found.', components: [] });
                } catch (err) {
                    console.error('interaction.editReply failed (selected not found), falling back to message edit:', err);
                    try { await replyMessage.edit({ content: 'Selected channel not found.', components: [] }); } catch (e) { try { await context.editReply({ content: 'Selected channel not found.', components: [] }); } catch (e2) {/* ignore */} }
                }
                return;
            }
            await proceedToConfirmDelete(context, ch);
        });

        collector.on('end', async () => {
            try {
                select.setDisabled(true);
                await context.editReply({ components: [new ActionRowBuilder().addComponents(select)] });
            } catch (err) {
                console.error('delete select end edit failed, falling back:', err);
                try { await replyMessage.edit({ components: [new ActionRowBuilder().addComponents(select)] }); } catch (e) { try { await context.editReply({ components: [new ActionRowBuilder().addComponents(select)] }); } catch (e2) {/* ignore */} }
            }
        });

        return;
    }

    const channel = candidates[0];
    await proceedToConfirmDelete(context, channel);

    // helper
    async function proceedToConfirmDelete(ctx, ch) {
        if (!ch) return ctx.reply({ content: 'Channel not found.', ephemeral: true });
        if (!ch.deletable && !ch.manageable) {
            return ctx.reply({ content: 'I do not have permission to delete that channel.', ephemeral: true });
        }

        const confirmButton = new ButtonBuilder().setCustomId(`del_ch_conf_${ch.id}_${ctx.user.id}`).setLabel('Confirm Delete').setStyle(ButtonStyle.Danger);
        const cancelButton = new ButtonBuilder().setCustomId(`del_ch_can_${ch.id}_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const embed = new EmbedBuilder().setTitle(`Delete channel #${ch.name}`).setDescription(`Are you sure you want to delete **#${ch.name}** (ID: ${ch.id})? This action cannot be undone.`).setColor('DarkVividPink');

        await ctx.reply({ embeds: [embed], components: [row], ephemeral: true });
        const replyMessage = await ctx.interaction.fetchReply();

        const collector = replyMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000, filter: (i) => i.user.id === ctx.user.id && (i.customId === `del_ch_conf_${ch.id}_${ctx.user.id}` || i.customId === `del_ch_can_${ch.id}_${ctx.user.id}`) });

        collector.on('collect', async (i) => {
            await i.deferUpdate();
            if (i.customId.startsWith('del_ch_can_')) {
                try { select && select.setDisabled(true); } catch (e) {}
                try {
                    return await i.editReply({ content: 'Deletion cancelled.', embeds: [], components: [] });
                } catch (err) {
                    console.error('i.editReply failed (cancel), falling back to message edit:', err);
                    try { await replyMessage.edit({ content: 'Deletion cancelled.', embeds: [], components: [] }); } catch (e) { try { await ctx.editReply({ content: 'Deletion cancelled.', embeds: [], components: [] }); } catch (e2) {/* ignore */} }
                    return;
                }
            }

            if (i.customId.startsWith('del_ch_conf_')) {
                try {
                    await ch.delete(`Deleted by ${ctx.user.tag} via bot command`);
                    try {
                        return await i.editReply({ content: `Successfully deleted channel **#${ch.name}** (ID: ${ch.id}).`, embeds: [], components: [] });
                    } catch (err) {
                        console.error('i.editReply failed (success), falling back to message edit:', err);
                        try { await replyMessage.edit({ content: `Successfully deleted channel **#${ch.name}** (ID: ${ch.id}).`, embeds: [], components: [] }); } catch (e) { try { await ctx.editReply({ content: `Successfully deleted channel **#${ch.name}** (ID: ${ch.id}).`, embeds: [], components: [] }); } catch (e2) {/* ignore */} }
                        return;
                    }
                } catch (e) {
                    console.error('Error deleting channel:', e);
                    try {
                        return await i.editReply({ content: 'There was an error deleting the channel. Please ensure I have the correct permissions.', embeds: [], components: [] });
                    } catch (err) {
                        console.error('i.editReply failed (error), falling back to message edit:', err);
                        try { await replyMessage.edit({ content: 'There was an error deleting the channel. Please ensure I have the correct permissions.', embeds: [], components: [] }); } catch (e2) { try { await ctx.editReply({ content: 'There was an error deleting the channel. Please ensure I have the correct permissions.', embeds: [], components: [] }); } catch (e3) {/* ignore */} }
                        return;
                    }
                }
            }
        });

        collector.on('end', async () => {
            try {
                confirmButton.setDisabled(true);
                cancelButton.setDisabled(true);
                await ctx.editReply({ components: [new ActionRowBuilder().addComponents(confirmButton, cancelButton)] });
            } catch (err) {
                console.error('confirm collector end edit failed, falling back:', err);
                try { await replyMessage.edit({ components: [new ActionRowBuilder().addComponents(confirmButton, cancelButton)] }); } catch (e) { try { await ctx.editReply({ components: [new ActionRowBuilder().addComponents(confirmButton, cancelButton)] }); } catch (e2) {/* ignore */} }
            }
        });
    }
}

async function shop(context) {
    const items = context.getItemData();
    const db = await getDBInstance();
    const users = db.get('users') || {};
    const userData = users[context.user.id] || {};
    const currency = userData.currency || 0;

    if (!items || items.length === 0) {
        try {
            return context.reply({ content: 'The shop is closed, it currently has no items.'});
        } catch (err) {
            console.error('Error replying about empty shop:', err);
            return context.reply({ content: 'Please try again later.'})
        }
    }

    const description = items.map(item => {
        return `**${item.name}** - $${item.price}\n-# > ${item.description}`;
    });

    const ItemSelect = new StringSelectMenuBuilder()
    .setCustomId('shop_select')
    .setPlaceholder('Select an item to purchase')
    .addOptions(items.map(item => ({
        label: item.name,
        description: `$${item.price} - ${item.description}`,
        value: item.id
    })));

    const ItemSelectRow = new ActionRowBuilder().addComponents(
        ItemSelect
    );

    const mainShopEmbed = new EmbedBuilder()
    .setTitle('Shop')
    .setColor('Green')
    .setDescription(`You have **$${currency}**\n\n${description.join('\n\n')}`)
    .setTimestamp();
    
    try {
        await context.reply({
            embeds: [mainShopEmbed],
            components: [ItemSelectRow],
            ephemeral: true,
        });
    } catch (err) {
        console.error('Error replying with shop embed:', err);
        return context.reply({ content: 'There was an error displaying the shop. Please try again later.' });
    };

    const replyMessage = await context.interaction.fetchReply();

    const collector = replyMessage.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
        filter: (i) => i.customId === 'shop_select' && i.user.id === context.user.id
    });

    collector.on('collect', async (i) => {
        const selectedItemId = i.values[0];
        const selectedItem = items.find(item => item.id === selectedItemId);

        if (!selectedItem) {
            try {
                await i.reply({ content: 'Selected item not found.', ephemeral: true });
            } catch (err) {
                console.error('Error replying about selected item not found:', err);
                try { await context.reply({ content: 'Selected item not found.', ephemeral: true }); } catch (e) {}
            }
            return;
        }

        if (currency < selectedItem.price) {
            try {
                await i.reply({ content: `You don't have enough money to buy **${selectedItem.name}**.`, ephemeral: true });
            } catch (err) {
                console.error('Error replying about insufficient funds:', err);
                try { await context.reply({ content: `You don't have enough money to buy **${selectedItem.name}**.`, ephemeral: true }); } catch (e) {}
            }

            return;
        }

        const db = await getDBInstance();
        const users = db.get('users') || {};
        users[context.user.id] = {
            ...userData,
            currency: currency - selectedItem.price,
            inventory: [...(userData.inventory || []), selectedItem.id]
        };
        db.set('users', users);

        try {
            await i.reply({ content: `You bought **${selectedItem.name}** for $${selectedItem.price}.`, ephemeral: true });
        } catch (err) {
            console.error('Error replying about successful purchase:', err);
            try { await context.reply({ content: `You bought **${selectedItem.name}** for $${selectedItem.price}.`, ephemeral: true }); } catch (e) {}
        }
    })
}

async function purge(context) {
    const amount = context.options.getInteger('amount');

    if (!context.guild) {
        return context.reply({
            content: 'This command can only be used in a server.',
            ephemeral: true
        });
    }

    // BOT permissions
    const botMember =
        context.guild.members.me ??
        await context.guild.members.fetch(context.client.user.id);

    if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return context.reply({
            content: 'I do not have permission to manage messages in this channel.',
            ephemeral: true
        });
    }

    // USER permissions
    const member =
        context.member ??
        await context.guild.members.fetch(context.user.id);

    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return context.reply({
            content: 'You do not have permission to manage messages in this channel.',
            ephemeral: true
        });
    }

    if (!amount || amount < 1) {
        return context.reply({
            content: 'You must specify a number of messages to delete (at least 1).',
            ephemeral: true
        });
    }

    await context.deferReply({ ephemeral: true });

    let deleted = 0;
    let lastId = null;

    while (deleted < amount) {
        const limit = Math.min(100, amount - deleted);

        const messages = await context.channel.messages.fetch({
            limit,
            before: lastId ?? undefined
        });

        if (!messages.size) break;

        const deletable = messages.filter(m =>
            Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000
        );

        if (!deletable.size) break;

        await context.channel.bulkDelete(deletable, true);

        deleted += deletable.size;
        lastId = messages.last().id;
    }

    await context.editReply({
        content: `🧹 Deleted **${deleted}** message${deleted === 1 ? '' : 's'}.`
    });
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
    kiss,
    hug,
    cuddle,
    slap,
    punch,
    kill,
    inv,
    use,
    kick,
    createchannel,
    deletechannel,
    shop,
    purge,
};