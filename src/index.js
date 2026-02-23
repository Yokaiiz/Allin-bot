require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    GuildMembers
} = require("discord.js");
const {
    ping,
    help,
    addrole,
    removerole,
    test_ali,
    profile,
    beg,
    gamble,
    daily,
    kiss,
    hug,
    cuddle,
    slap,
    punch,
    kill,
    timeout,
    ban,
    inv,
    use,
    call,
    hangup,
    friend,
    kick,
    createchannel,
    deletechannel,
    shop,
    purge,
    set_nickname,
} = require("./commands.js");
const { CommandContext } = require("./commandContext.js");
const { getDBInstance, autoRegUser } = require("./db.js");
const { JSONFile } = require('lowdb/node');
const path = require('path');

const { EmbedBuilder } = require("@discordjs/builders");
const {
    ButtonStyle,
    ComponentType
} = require("discord-api-types/v10");

const TOKEN = process.env.BOT_TOKEN;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel],
});

// this holds all the data for the commands that are sent to the Discord API 
const commandDefinitions = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!')
        .setContexts(0, 1, 2)
        .toJSON(),
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Provides helpful information about the bot.')
        .setContexts(0, 1, 2)
        .toJSON(),
    new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('Adds a role to a user.')
        .setContexts(0)
        .addUserOption(option =>
            option
            .setName('target')
            .setDescription('The user to whom the role will be added.')
            .setRequired(true)
        )
        .addRoleOption(option =>
            option
            .setName('role')
            .setDescription('The role to add to the user.')
            .setRequired(true)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('removerole')
        .setDescription('Removes a role from a user.')
        .setContexts(0)
        .addUserOption(option =>
            option
            .setName('target')
            .setDescription('The user from whom the role will be removed.')
            .setRequired(true)
        )
        .addRoleOption(option =>
            option
            .setName('role')
            .setDescription('The role to remove from the user.')
            .setRequired(true)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Displays your profile information.')
        .setContexts(0, 1, 2)
        .toJSON(),
    new SlashCommandBuilder()
        .setName('beg')
        .setDescription('Beg for money.')
        .setContexts(0, 1, 2)
        .toJSON(),
    new SlashCommandBuilder()
        .setName('gamble')
        .setDescription('Gamble your money.')
        .setContexts(0, 1, 2)
        .addIntegerOption(option =>
            option
            .setName('amount')
            .setDescription('The amount of money to gamble.')
            .setRequired(true)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('Kiss someone')
        .setContexts(0, 1, 2)
        .addUserOption(option => option.setName('target').setDescription('User to kiss').setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Hug someone')
        .setContexts(0, 1, 2)
        .addUserOption(option => option.setName('target').setDescription('User to hug').setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('cuddle')
        .setDescription('Cuddle someone')
        .setContexts(0, 1, 2)
        .addUserOption(option => option.setName('target').setDescription('User to cuddle').setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('slap')
        .setDescription('Slap someone')
        .setContexts(0, 1, 2)
        .addUserOption(option => option.setName('target').setDescription('User to slap').setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('punch')
        .setDescription('Punch someone')
        .setContexts(0, 1, 2)
        .addUserOption(option => option.setName('target').setDescription('User to punch').setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('kill')
        .setDescription('Kill someone')
        .setContexts(0, 1, 2)
        .addUserOption(option => option.setName('target').setDescription('User to kill').setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward.')
        .setContexts(0, 1, 2)
        .toJSON(),
    new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user for a specified duration.')
        .setContexts(0)
        .addUserOption(option =>
            option
            .setName('target')
            .setDescription('The user to timeout.')
            .setRequired(true)
        )
        .addIntegerOption(option =>
            option
            .setName('duration')
            .setDescription('Duration of the timeout in minutes.')
            .setRequired(true)
        )
        .addStringOption(option =>
            option
            .setName('reason')
            .setDescription('Reason for the timeout.')
            .setRequired(false)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a user from the server.')
        .setContexts(0)
        .addUserOption(option =>
            option
            .setName('target')
            .setDescription('The user to ban.')
            .setRequired(true)
        )
        .addStringOption(option =>
            option
            .setName('reason')
            .setDescription('Reason for the ban.')
            .setRequired(false)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('inv')
        .setDescription('Displays your inventory.')
        .setContexts(0, 1, 2)
        .toJSON(),
    new SlashCommandBuilder()
        .setName('use')
        .setDescription('Uses an item from your inventory.')
        .setContexts(0, 1, 2)
        .addStringOption(option =>
            option
            .setName('item')
            .setDescription('The item to use.')
            .setRequired(true)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a user from the server.')
        .setContexts(0)
        .addUserOption(option =>
            option
            .setName('target')
            .setDescription('The user to kick.')
            .setRequired(true)
        )
        .addStringOption(option =>
            option
            .setName('reason')
            .setDescription('Reason for the kick.')
            .setRequired(false)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('createchannel')
        .setDescription('Creates a new channel.')
        .setContexts(0)
        .addStringOption(option =>
            option
            .setName('name')
            .setDescription('Name of the channel to create.')
            .setRequired(true)
        )
        .addStringOption(option =>
            option
            .setName('type')
            .setDescription('Channel type: text (default), voice, category, news, stage, forum')
            .setRequired(false)
        )
        .addStringOption(option =>
            option
            .setName('topic')
            .setDescription('Optional topic for text channels')
            .setRequired(false)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('deletechannel')
        .setDescription('Deletes a channel.')
        .setContexts(0)
        .addStringOption(option =>
            option
            .setName('name')
            .setDescription('Name of the channel to delete (optional).')
            .setRequired(false)
        )
        .addChannelOption(option =>
            option
            .setName('channel')
            .setDescription('Select the channel to delete (preferred).')
            .setRequired(false)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Displays the shop.')
        .setContexts(0, 1, 2)
        .toJSON(),
    new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Deletes a number of messages from the channel.')
        .setContexts(0)
        .addIntegerOption(option =>
            option
            .setName('amount')
            .setDescription('Number of messages to delete (max 100).')
            .setRequired(true)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('call')
        .setDescription('Join the global call relay. Messages you send will be relayed to other callers via webhooks.')
        .setContexts(0, 1, 2)
        .toJSON(),
    new SlashCommandBuilder()
        .setName('hangup')
        .setDescription('Leave the global call relay.')
        .setContexts(0, 1, 2)
        .toJSON(),
    new SlashCommandBuilder()
        .setName('friend')
        .setDescription('Send your username/tag to your current call peer (if any).')
        .setContexts(0, 1, 2)
        .toJSON(),
    new SlashCommandBuilder()
        .setName('set_nickname')
        .setDescription('Sets the nickname of a user.')
        .setContexts(0)
        .addUserOption(option =>
            option
            .setName('user')
            .setDescription('The user whose nickname will be changed.')
            .setRequired(true)
        )
        .addStringOption(option =>
            option
            .setName('nickname')
            .setDescription('The new nickname for the user.')
            .setRequired(true)
        )
        .toJSON(),
];

const commandHandlers = {
    ping: { // this is the command name, it's gotta be in lowercase and match the command name in the Discord command definitions!
        execute: ping, // this is what it executes when the command is called
        cooldown: 1000 // this is in milliseconds, so it converts to 1 second!
    },
    help: {
        execute: help,
        cooldown: 1000
    },
    addrole: {
        execute: addrole,
        cooldown: 1000
    },
    removerole: {
        execute: removerole,
        cooldown: 1000
    },
    test_ali: {
        execute: test_ali,
        cooldown: 1000
    },
    profile: {
        execute: profile,
        cooldown: 1000
    },
    beg: {
        execute: beg,
        cooldown: 5000
    },
    gamble: {
        execute: gamble,
        cooldown: 5000
    },
    kiss: {
        execute: kiss,
        cooldown: 3000
    },
    hug: {
        execute: hug,
        cooldown: 3000
    },
    cuddle: {
        execute: cuddle,
        cooldown: 3000
    },
    slap: {
        execute: slap,
        cooldown: 3000
    },
    punch: {
        execute: punch,
        cooldown: 3000
    },
    kill: {
        execute: kill,
        cooldown: 3000
    },
    daily: {
        execute: daily,
        cooldown: 86400000 // 24 hours
    },
    timeout: {
        execute: timeout,
        cooldown: 1000
    },
    ban: {
        execute: ban,
        cooldown: 1000
    },
    inv: {
        execute: inv,
        cooldown: 1000
    },
    use: {
        execute: use,
        cooldown: 1000
    },
    kick: {
        execute: kick,
        cooldown: 1000
    },
    createchannel: {
        execute: createchannel,
        cooldown: 1000
    },
    deletechannel: {
        execute: deletechannel,
        cooldown: 1000
    },
    shop: {
        execute: shop,
        cooldown: 1000
    },
    purge: {
        execute: purge,
        cooldown: 5000
    },
    set_nickname: {
        execute: set_nickname,
        cooldown: 1000
    },
    call: {
        execute: call,
        cooldown: 1000
    },
    hangup: {
        execute: hangup,
        cooldown: 1000
    },
    friend: {
        execute: friend,
        cooldown: 1000
    },
};

const rest = new REST({ version: "10" }).setToken(TOKEN);

let handlersRegistered = false;
function registerClientEventHandlers(client) {
    if (handlersRegistered) return;
    
    client.on('interactionCreate', async (interaction) => {
        if (interaction.isChatInputCommand()) {
            try {
                await handleCommand(interaction, CommandContext, commandHandlers);
            } catch (error) {
                console.log('Error handling command:', error);
            }
        }
    });

    client.on('messageCreate', async (message) => {
        // ignore bots and webhook-originated messages
        if (!message || !message.author) return;
        if (message.author.bot || message.webhookId) return;

        // Relay: forward messages from any speaker in a call channel (exclude bots)
        try {
            const db = await getDBInstance();
            const users = db.get('users') || {};

            // find any "owner" entries whose call.channelId matches this message channel
            const owners = Object.entries(users).filter(([uid, u]) => u && u.call && u.call.channelId === message.channel.id && u.call.peerId);
            if (owners.length === 0) {
                // nothing to relay for this channel
            } else {
                // debug stickers for diagnosis
                if (message.stickers && message.stickers.size > 0) {
                    try {
                        console.debug('CallRelay: message.stickers', Array.from(message.stickers.values()).map(s => ({ id: s.id, name: s.name, format_type: s.format_type })));
                    } catch (e) { /* ignore */ }
                }

                // build base relay content (include attachments)
                let relayContentBase = message.content || '';
                if (message.attachments && message.attachments.size > 0) {
                    for (const att of message.attachments.values()) {
                        relayContentBase += `\n${att.url}`;
                    }
                }

                // helper to download sticker buffer
                async function fetchStickerBuffer(sticker) {
                    try {
                        const fmt = sticker.format_type || sticker.format || 1;
                        let ext = 'png';
                        if (fmt === 2) ext = 'png';
                        if (fmt === 3) ext = 'json';
                        const url = `https://cdn.discordapp.com/stickers/${sticker.id}.${ext}`;
                        const res = await fetch(url);
                        if (!res.ok) return null;
                        const ab = await res.arrayBuffer();
                        return { buffer: Buffer.from(ab), ext };
                    } catch (e) {
                        return null;
                    }
                }

                for (const [ownerId, owner] of owners) {
                    try {
                        const peerId = owner.call.peerId;
                        const peer = users[peerId] || {};
                        if (!peer || !peer.call || peer.call.peerId !== ownerId) {
                            // invalid pairing - cleanup
                            delete users[ownerId].call;
                            await db.set('users', users);
                            continue;
                        }

                        const destChannelId = peer.call.channelId;
                        if (!destChannelId) continue;
                        if (destChannelId === message.channel.id) continue; // avoid echoing back

                        console.debug(`CallRelay: forwarding message from speaker ${message.author.id} (channel ${message.channel.id}) to peer ${peerId} in channel ${destChannelId}`);

                        const channel = await client.channels.fetch(destChannelId).catch(() => null);
                        if (!channel) {
                            console.warn('CallRelay: destination channel not found', destChannelId);
                            continue;
                        }
                        if (typeof channel.fetchWebhooks !== 'function') {
                            console.warn('CallRelay: channel does not support webhooks', destChannelId);
                            continue;
                        }

                        // find or create webhook owned by the bot
                        let webhook = null;
                        try {
                            const hooks = await channel.fetchWebhooks();
                            webhook = hooks.find(h => h.owner && h.owner.id === client.user.id && h.name && h.name.startsWith('CallRelay'));
                        } catch (e) {
                            console.warn('CallRelay: fetchWebhooks failed for', destChannelId, e?.message || e);
                        }

                        if (!webhook) {
                            try {
                                webhook = await channel.createWebhook({ name: `CallRelay-${client.user.username}`, avatar: client.user.displayAvatarURL() });
                                console.debug('CallRelay: created webhook', webhook.id, 'in', destChannelId);
                            } catch (e) {
                                console.warn('CallRelay: cannot create webhook in', destChannelId, e?.message || e);
                                continue; // cannot create webhook
                            }
                        } else {
                            console.debug('CallRelay: using existing webhook', webhook.id, 'in', destChannelId);
                        }

                        const sendOptions = {
                            content: relayContentBase || '\u200B',
                            username: message.member ? message.member.displayName : message.author.username,
                            avatarURL: message.author.displayAvatarURL({ forceStatic: false })
                        };

                        if (message.stickers && message.stickers.size > 0) {
                            const files = [];
                            for (const s of message.stickers.values()) {
                                const fetched = await fetchStickerBuffer(s).catch(() => null);
                                if (fetched && fetched.buffer) {
                                    if (fetched.ext === 'json') {
                                        sendOptions.content += `\n[Sticker: ${s.name || s.id} - LOTTIE not supported]`;
                                        continue;
                                    }
                                    files.push({ attachment: fetched.buffer, name: `sticker_${s.id}.${fetched.ext}` });
                                } else {
                                    sendOptions.content += `\n[Sticker: ${s.name || s.id}]`;
                                }
                            }
                            if (files.length) sendOptions.files = files;
                        }

                        try {
                            await webhook.send(sendOptions);
                            console.debug('CallRelay: sent webhook message to', destChannelId);
                        } catch (sendErr) {
                            console.warn('CallRelay: webhook.send failed, will fallback to channel.send', destChannelId, sendErr?.message || sendErr);
                            try {
                                if (channel && typeof channel.send === 'function') {
                                    await channel.send({ content: `${message.member ? message.member.displayName : message.author.username}: ${relayContentBase}` });
                                    console.debug('CallRelay: fallback channel.send succeeded to', destChannelId);
                                }
                            } catch (fallbackErr) {
                                console.warn('CallRelay: fallback channel.send also failed for', destChannelId, fallbackErr?.message || fallbackErr);
                            }
                        }
                    } catch (err) {
                        console.error('Call relay error sending to peer', ownerId, err);
                    }
                }
            }
        } catch (err) {
            console.error('Call relay error', err);
        }

        // legacy prefix commands (keep existing behaviour)
        const prefix = "ali"
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (!command) return;

        const context = new CommandContext(message, args);
        const handler = commandHandlers[command];

        if (!handler) return;

        await autoRegUser(context.user.id); // auto register
        await handler.execute(context);
    });

    client.on('ready', async () => {
        console.log(`Logged in as ${client.user.tag}`)
        try {
            const dbFile = path.resolve(__dirname, '../db.json');
            const adapter = new JSONFile(dbFile);
            await getDBInstance(adapter, { users: {} });
            // perform cleanup of stale call state persisted in DB (in case bot restarted)
            try {
                const db = await getDBInstance();
                const users = db.get('users') || {};
                let waiting = db.get('callWaiting') || {};
                let cleaned = 0;

                // clean user call entries that are not mutual
                for (const [uid, udata] of Object.entries(users)) {
                    if (!udata || !udata.call) continue;
                    const peerId = udata.call.peerId;
                    if (!peerId || !users[peerId] || !users[peerId].call || users[peerId].call.peerId !== uid) {
                        delete users[uid].call;
                        cleaned++;
                    }
                }

                // clean waiting queue entries referencing missing users or users already in calls
                for (const [gId, wait] of Object.entries(waiting)) {
                    if (!wait || !wait.userId) {
                        delete waiting[gId];
                        cleaned++;
                        continue;
                    }
                    const wuid = wait.userId;
                    if (!users[wuid] || (users[wuid].call && users[wuid].call.peerId)) {
                        delete waiting[gId];
                        cleaned++;
                    }
                }

                if (cleaned > 0) {
                    await db.set('users', users);
                    await db.set('callWaiting', waiting);
                    console.log(`Cleaned ${cleaned} stale call/waiting entries from DB`);
                }
            } catch (e) {
                console.warn('CallRelay: cleanup on ready failed', e?.message || e);
            }
            console.log('started db ');
            
            await deployCommands();
        } catch (error) {
            console.error('Command deploy failed', error);
        }
    });

    handlersRegistered = true;
}

async function deployCommands() {
    try {
        await rest.put(Routes.applicationCommands(client.application.id), {body: commandDefinitions});
        console.log('registered commands to discord api with ' + commandDefinitions.length + ' commands');
    } catch (error) {
        console.log('failed to deploy commands:', error);
    }
}


const cooldowns = new Map(); // store it OUTSIDE a function as a global so we avoid re-creating it on every call
async function handleCommand(interaction, ctx = CommandContext, commandHandlers) {
    const commandName = interaction.commandName;
    const handler = commandHandlers[commandName];
    
    if (!handler) {
        return interaction.reply({ content: 'Command not found!', ephemeral: true });
    }

    const cooldown = handler.cooldown || 1000; // this is in milliseconds, so it converts to 1 second!
    const userId = interaction.user.id;
    const cooldownKey = `${userId}-${commandName}`;
    
    const now = Date.now();
    const lastUsed = cooldowns.get(cooldownKey) || 0;
    const timeSinceLastUsed = now - lastUsed;

    if (timeSinceLastUsed < cooldown) {
        const remainingTime = ((cooldown - timeSinceLastUsed) / 1000).toFixed(1);
        const context = new ctx(interaction);
        return interaction.reply({ 
            content: `${context.formatName()}, you're on cooldown! Please wait ${remainingTime} more seconds.`, 
            ephemeral: true 
        });
    }
    
    cooldowns.set(cooldownKey, now);
    
    await autoRegUser(userId); // auto register
    const context = new ctx(interaction);
    await handler.execute(context);
}


registerClientEventHandlers(client);

client.login(TOKEN);