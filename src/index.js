require("dotenv").config();

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
    kick,
    createchannel,
    deletechannel,
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
        .toJSON()
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