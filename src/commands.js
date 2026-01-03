const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require("discord.js");
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
                    value: '`/addrole` - Adds a role to a user.\n`/removerole` - Removes a role from a user.\n`/timeout` - Temporarily restrict a user\'s ability to interact in the server.'
                },
                {
                    name: 'Economy Commands',
                    value: '`/profile` - Displays your profile information.\n`/beg` - Beg for money.\n`/gamble <amount>` - Gamble your money.\n`/daily` - Claim your daily reward.'
                },
                {
                    name: 'Roleplay Commands',
                    value: '`/kiss <target>` - Send a kiss to another user.\n`/hug <target>` - Hug another user.\n`/cuddle <target>` - Cuddle another user.'
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

    let gif = null;
    try {
        const fetched = await fetchAnimeGif(actionVerb);
        if (fetched) gif = fetched;
    } catch (e) {
        // ignore and fallback
    }
    if (!gif) gif = gifs[Math.floor(Math.random() * gifs.length)];

    // Update counts in DB: given/received for actor and target
    const db = await getDBInstance();
    const users = db.get('users') || {};
    const actorData = users[actor.id] || {};
    const targetData = users[targetUser.id] || {};

    actorData.roleplay = actorData.roleplay || {};
    targetData.roleplay = targetData.roleplay || {};

    const givenKey = `${actionKey}Given`;
    const receivedKey = `${actionKey}Received`;

    actorData.roleplay[givenKey] = (actorData.roleplay[givenKey] || 0) + 1;
    targetData.roleplay[receivedKey] = (targetData.roleplay[receivedKey] || 0) + 1;

    // write both users back
    await db.set('users', { ...users, [actor.id]: { ...actorData, id: actor.id, name: actor.username }, [targetUser.id]: { ...targetData, id: targetUser.id, name: targetUser.username } });

    const actorGivenCount = actorData.roleplay[givenKey] || 0;
    const targetReceivedCount = targetData.roleplay[receivedKey] || 0;

    const verbThird = toThirdPerson(actionVerb);
    const gerund = toGerund(actionVerb);
    const filename = `${actionKey}_${actor.id}_${targetUser.id}_${Date.now()}.gif`;
    const embedWithFields = new EmbedBuilder()
        .setTitle(`${actor.username} ${verbThird} ${targetUser.username}`)
        .setDescription(`${actor.username} ${gerund} ${targetUser.username}.`)
        .setImage(`attachment://${filename}`)
        .setColor('DarkVividPink')
        .addFields(
            { name: `${targetUser.username} - ${actionKey} received`, value: `${targetReceivedCount}`, inline: true }
        )
        .setTimestamp();

    const recipButton = new ButtonBuilder()
        .setCustomId(`rp_rec_${actionKey}_${actor.id}_${targetUser.id}`)
        .setLabel('Reciprocate')
        .setStyle(ButtonStyle.Primary);

    const declineButton = new ButtonBuilder()
        .setCustomId(`rp_dec_${actionKey}_${actor.id}_${targetUser.id}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Secondary);

    const actionRow = new ActionRowBuilder().addComponents(recipButton, declineButton);

    // Attempt to download the GIF and send as a buffer attachment to avoid CDN/embed loading issues
    let fileToSend = null;
    try {
        const buf = await downloadAsBuffer(gif);
        if (buf) fileToSend = { attachment: buf, name: filename };
    } catch (e) {
        fileToSend = null;
    }
    const files = fileToSend ? [fileToSend] : [{ attachment: gif, name: filename }];
    await context.reply({ embeds: [embedWithFields], components: [actionRow], files });

    const replyMessage = await context.interaction.fetchReply();

    const validIds = new Set([`rp_rec_${actionKey}_${actor.id}_${targetUser.id}`, `rp_dec_${actionKey}_${actor.id}_${targetUser.id}`]);

    const collector = replyMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        filter: (i) => validIds.has(i.customId)
    });

    collector.on('collect', async (interaction) => {
        if (interaction.user.id !== targetUser.id) {
            return interaction.reply({ content: 'Only the target can respond to this interaction.', ephemeral: true });
        }

        // Decline handling
        if (interaction.customId.startsWith('rp_dec_')) {
            recipButton.setDisabled(true);
            declineButton.setDisabled(true);
            const disabledRow = new ActionRowBuilder().addComponents(recipButton, declineButton);

            const declinedEmbed = new EmbedBuilder()
                .setTitle(`${targetUser.username} declined to ${actionVerb}`)
                .setDescription(`${targetUser.username} declined to ${actionVerb} ${actor.username}.`)
                .setColor('Grey')
                .addFields(
                    { name: `${targetUser.username} - ${actionKey} received`, value: `${targetReceivedCount}`, inline: true }
                )
                .setTimestamp();

            await interaction.update({ embeds: [declinedEmbed], components: [disabledRow] });
            collector.stop();
            return;
        }

        // Reciprocation
        if (interaction.customId.startsWith('rp_rec_')) {
            const db2 = await getDBInstance();
            const users2 = db2.get('users') || {};
            const actorData2 = users2[actor.id] || {};
            const targetData2 = users2[targetUser.id] || {};

            actorData2.roleplay = actorData2.roleplay || {};
            targetData2.roleplay = targetData2.roleplay || {};

            const givenKeyActor = `${actionKey}Given`;
            const receivedKeyActor = `${actionKey}Received`;

            targetData2.roleplay[givenKeyActor] = (targetData2.roleplay[givenKeyActor] || 0) + 1;
            actorData2.roleplay[receivedKeyActor] = (actorData2.roleplay[receivedKeyActor] || 0) + 1;

            await db2.set('users', { ...users2, [actor.id]: { ...actorData2, id: actor.id, name: actor.username }, [targetUser.id]: { ...targetData2, id: targetUser.id, name: targetUser.username } });

            let recipGif = null;
            try {
                const fetchedR = await fetchAnimeGif(actionVerb);
                if (fetchedR) recipGif = fetchedR;
            } catch (e) {}
            if (!recipGif) recipGif = gifs[Math.floor(Math.random() * gifs.length)];

            const actorGivenCount2 = actorData2.roleplay[givenKey] || 0;
            const actorReceivedCount2 = actorData2.roleplay[receivedKey] || 0;
            const targetGivenCount2 = targetData2.roleplay[givenKey] || 0;
            const targetReceivedCount2 = targetData2.roleplay[receivedKey] || 0;

            const recipFilename = `${actionKey}_${targetUser.id}_${actor.id}_${Date.now()}.gif`;
            const recipVerbThird = toThirdPerson(actionVerb);
            const recipEmbed = new EmbedBuilder()
                .setTitle(`${targetUser.username} ${recipVerbThird} ${actor.username}`)
                .setDescription(`${targetUser.username} ${gerund} ${actor.username} in return.`)
                .setImage(`attachment://${recipFilename}`)
                .setColor('DarkVividPink')
                .addFields(
                    { name: `${targetUser.username} - ${actionKey} given`, value: `${targetGivenCount2}`, inline: true }
                )
                .setTimestamp();

            recipButton.setDisabled(true);
            declineButton.setDisabled(true);
            const disabledRow2 = new ActionRowBuilder().addComponents(recipButton, declineButton);

            // Attempt to download recip GIF as buffer first
            let recipFile = null;
            try {
                const buf2 = await downloadAsBuffer(recipGif);
                if (buf2) recipFile = { attachment: buf2, name: recipFilename };
            } catch (e) { recipFile = null; }
            const recipFiles = recipFile ? [recipFile] : [{ attachment: recipGif, name: recipFilename }];
            await interaction.update({ embeds: [recipEmbed], components: [disabledRow2], files: recipFiles });
            collector.stop();
        }
    });

    collector.on('end', async () => {
        try {
            recipButton.setDisabled(true);
            declineButton.setDisabled(true);
            const disabledRowEnd = new ActionRowBuilder().addComponents(recipButton, declineButton);
            await context.editReply({ components: [disabledRowEnd] });
        } catch (e) {
            // ignore if message already updated elsewhere
        }
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
    inv,
    use,
};