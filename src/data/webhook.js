const express = require('express');
const { exec } = require('child_process');

const app = express();

app.use(express.json());

app.post('/update', (req, res) => {
    console.log('GitHub update received!');

    exec('git pull', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }

        console.log(stdout);

        exec('npm install', (err) => {
            if (err) {
                console.error(err);
                return res.sendStatus(500);
            }

            exec('pm2 restart discord-bot');

            console.log('Bot restarted!');
        });

        res.sendStatus(200);
    });
});

app.listen(3000, () => {
    console.log('Webhook listening on port 3000');
});