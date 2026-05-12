const express = require('express');
const { exec } = require('child_process');

const app = express();

app.use(express.json());

console.log("🔥 WEBHOOK SERVER LOADED");

app.post('/webhook', (req, res) => {
    console.log("\n==============================");
    console.log("🚀 GitHub webhook received!");
    console.log("Event:", req.headers["x-github-event"]);
    console.log("==============================\n");

    // STEP 1: Git pull
    exec('git pull', (err, stdout, stderr) => {
        console.log("📦 STEP 1: GIT PULL");
        console.log(stdout);
        if (stderr) console.error(stderr);

        if (err) {
            console.error("❌ Git pull failed:", err.message);
            return res.status(500).send("git pull failed: " + err.message);
        }

        // STEP 2: Install dependencies
        exec('npm install', (err2, stdout2, stderr2) => {
            console.log("\n📦 STEP 2: NPM INSTALL");
            console.log(stdout2);
            if (stderr2) console.error(stderr2);

            if (err2) {
                console.error("❌ npm install failed:", err2.message);
                return res.status(500).send("npm install failed: " + err2.message);
            }

            // STEP 3: Restart bot
            exec('pm2 restart allin-bot', (err3, stdout3, stderr3) => {
                console.log("\n📦 STEP 3: PM2 RESTART");
                console.log(stdout3);
                if (stderr3) console.error(stderr3);

                if (err3) {
                    console.error("❌ pm2 restart failed:", err3.message);
                    return res.status(500).send("pm2 restart failed: " + err3.message);
                }

                console.log("\n✅ DEPLOY SUCCESSFUL");
                console.log("==============================\n");

                return res.status(200).send("OK");
            });
        });
    });
});

app.listen(3000, () => {
    console.log("🌐 Webhook running on port 3000");
});