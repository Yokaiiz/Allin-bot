const fs = require('fs');
const path = require('path');
const { getDBInstance } = require('./db.js');

const itemDataPath = path.resolve(__dirname, 'data/itemData.json');
let itemData = null;

function loadItemData() {
    if (itemData === null) {
        try {
            const data = fs.readFileSync(itemDataPath, 'utf8');
            itemData = JSON.parse(data);
        } catch (error) {
            console.error('Error loading item data:', error);
            itemData = [];
        }
    }
    return itemData;
}

class CommandContext {
    constructor(interactionOrMessage, args = null) {
        if (interactionOrMessage.isChatInputCommand && interactionOrMessage.isChatInputCommand()) {
            this.interaction = interactionOrMessage;
            this.commandName = interactionOrMessage.commandName;
            this.user = interactionOrMessage.user;
            this.channel = interactionOrMessage.channel;
            this.guild = interactionOrMessage.guild;
            this.options = interactionOrMessage.options;
            this.args = null;
        } else {
            this.message = interactionOrMessage;
            this.user = interactionOrMessage.author;
            this.channel = interactionOrMessage.channel;
            this.guild = interactionOrMessage.guild;
            this.args = args || [];
            this.interaction = null;
            this.options = null;
        }
    }

    reply(options) {
        if (this.interaction) {
            return this.interaction.reply(options);
        } else {
            return this.channel.send(options.content || options);
        }
    }

    deferReply(options) {
        if (this.interaction) {
            return this.interaction.deferReply(options);
        } else {
            return Promise.resolve();
        }
    }

    followUp(options) {
        if (this.interaction) {
            return this.interaction.followUp(options);
        } else {
            return this.channel.send(options.content || options);
        }
    }

    editReply(options) {
        if (this.interaction) {
            return this.interaction.editReply(options);
        } else {
            return Promise.resolve();
        }
    }

    formatName() {
        return `***${this.user.username}***`;
    }

    static getItemData() {
        return loadItemData();
    }

    static getItemById(id) {
        const items = loadItemData();
        return items.find(item => item.id === id);
    }

    static getItemByName(name) {
        const items = loadItemData();
        const lowerName = name.toLowerCase();
        return items.find(item => 
            item.name.toLowerCase() === lowerName || 
            item.id.toLowerCase() === lowerName ||
            item.id.toLowerCase().includes(lowerName) ||
            item.name.toLowerCase().includes(lowerName)
        );
    }

    getItemData() {
        return CommandContext.getItemData();
    }

    getItemById(id) {
        return CommandContext.getItemById(id);
    }

    getItemByName(name) {
        return CommandContext.getItemByName(name);
    }

    async addItemToInventory(itemId, quantity = 1) {
        const item = this.getItemById(itemId);
        if (!item) {
            throw new Error(`Item with ID "${itemId}" not found`);
        }

        const db = await getDBInstance();
        const users = db.get('users') || {};
        const userId = this.user.id;

        if (!users[userId]) {
            users[userId] = { id: userId, regDate: new Date().toISOString(), inventory: {} };
        }

        if (!users[userId].inventory) {
            users[userId].inventory = {};
        }

        if (users[userId].inventory[itemId]) {
            users[userId].inventory[itemId] += quantity;
        } else {
            users[userId].inventory[itemId] = quantity;
        }

        await db.set('users', users);
        return users[userId].inventory[itemId];
    }

    async getInventory() {
        const db = await getDBInstance();
        const users = db.get('users') || {};
        const userId = this.user.id;

        const rawInventory = users[userId]?.inventory || {};

        const inventory = [];
        for (const [itemId, quantity] of Object.entries(rawInventory)) {
            const item = this.getItemById(itemId);
            if (item) {
                inventory.push({
                    id: itemId,
                    name: item.name,
                    description: item.description,
                    rarity: item.rarity,
                    quantity: quantity
                });
            }
        }

        return inventory;
    }

    async getInventoryItem(itemId) {
        const db = await getDBInstance();
        const users = db.get('users') || {};
        const userId = this.user.id;

        const quantity = users[userId]?.inventory?.[itemId] || 0;
        if (quantity === 0) {
            return null;
        }

        const item = this.getItemById(itemId);
        if (!item) {
            return null;
        }

        return {
            id: itemId,
            name: item.name,
            description: item.description,
            rarity: item.rarity,
            quantity: quantity
        };
    }
}

module.exports = { CommandContext };