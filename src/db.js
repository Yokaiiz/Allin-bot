let dbInstance = null;

class LowDB {
    constructor(adapter, defaultData = {}) {
        const { Low } = require('lowdb');
        this.Low = Low;
        this.adapter = adapter;
        this.db = new Low(this.adapter, defaultData);
        this.initialized = false;
    }

    async init(defaultData = {}) {
        if (!this.initialized) {
            await this.db.read();
            this.db.data ||= defaultData;
            await this.db.write();
            this.initialized = true;
        }
    }

    get data() {
        return this.db.data;
    }

    async write() {
        await this.db.write();
    }

    async read() {
        await this.db.read();
    }

    async set(key, value) {
        this.db.data[key] = value;
        await this.db.write();
    }

    get(key) {
        return this.db.data[key];
    }
}


// WHAT is a boolean
async function getDBInstance(adapter, defaultData = {}) {
    if (!dbInstance && adapter) {
        dbInstance = new LowDB(adapter, defaultData);
        await dbInstance.init(defaultData);
    }
    return dbInstance;
}

async function autoRegUser(userId) {
    const db = await getDBInstance();
    const users = db.get('users') || {};
    if (users[userId]) {
        return;
    }
    users[userId] = { id: userId, regDate: new Date().toISOString() };
    await db.set('users', users);
}

async function ensureUserRegistered(userId) {
    const users = db.get('users') || {};
    users[context.user.id] = users[context.user.id] || {};
    users[context.user.id][key] = val;
    await db.set('users', users);
}

module.exports = {
    LowDB,
    getDBInstance,
    autoRegUser,
    ensureUserRegistered,
};
