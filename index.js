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

} = require("./commands.js")

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

const commands = [].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);
async function deployCommands() {
    try {
        console.log("/ Deploying commands...");
        await rest.put(Routes.applicationCommand(client.user.id), {body: commands});
        console.log('/ Commands deplyed.');
    } catch (error) {
        console.log('failed to deploy commands:', error);
    }
}

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const cmd = interaction.commandName;

        try {
            switch (cmd) {
                default:
                    return interaction.reply({content: 'command unknown.', ephemeral: true});
            }
        } catch (error) {
            console.log('Error handling command:', error);
        }
    }
});

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`)
    try {
        await deployCommands();
    } catch (error) {
        console.error('Command deploy failed', error);
    }
});

client.login(TOKEN);