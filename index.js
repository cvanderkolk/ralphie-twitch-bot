// import { promises as fs } from 'fs';
const fs = require('fs').promises;
const config = require('config');

const clientId = config.get('Twitch.clientId');
const clientSecret = config.get('Twitch.clientSecret');

const fetch = require('node-fetch');
const { RefreshableAuthProvider, StaticAuthProvider } = require('twitch-auth');
const { ApiClient } = require('twitch');
const { ChatClient } = require('twitch-chat-client');
const FormData = require('form-data');
const { PubSubClient } = require('twitch-pubsub-client');

function getRandomItem(set) {
    const items = Array.from(set);
    return items[Math.floor(Math.random() * items.length)];
}

const soundClipMap = {
    'Get Her Off Of Me': {
        soundUrl: 'https://gdurl.com/XMDO/download',
        imageUrl: 'https://i.pinimg.com/originals/77/c0/02/77c0028b38b7aa20391672260371d912.gif',
    },
    'Bruh': '',
    'Not Today Satan': {
        soundUrl: 'https://gdurl.com/DTKd/download',
        imageUrl: 'https://images.squarespace-cdn.com/content/v1/5e3ae820597c7c5ee13d77bf/1586334315884-80Z0TKTB6OPSRS7AGS6T/ke17ZwdGBToddI8pDm48kAI4xq1X9O62QpEWWz26IsVZw-zPPgdn4jUwVcJE1ZvWEtT5uBSRWt4vQZAgTJucoTqqXjS3CfNDSuuf31e0tVF79dn-GXmv6G1Rqpzg9hme7yDMTHYtmNQQDOJBMZyks91lH3P2bFZvTItROhWrBJ0/not-today-satan.gif',
    },
};

async function sendStreamlabsAlert(rewardName) {
    const url = 'https://www.streamlabs.com/api/v1.0/alerts';

    const formdata = FormData();
    formdata.append("access_token", config.get('Streamlabs.accessToken'));
    formdata.append("type", "donation");
    formdata.append("image_href", soundClipMap[rewardName].imageUrl);
    formdata.append("message", rewardName);
    formdata.append("duration", "5000");
    formdata.append("sound_href", soundClipMap[rewardName].soundUrl);

    const response = await fetch(url, { method: 'POST', body: formdata });
    console.log(await response.json());
};

async function main() {
    const tokenData = JSON.parse(await fs.readFile('./tokens.json'));
    const auth = new RefreshableAuthProvider(
        new StaticAuthProvider(clientId, tokenData.accessToken),
        {
            clientSecret,
            refreshToken: tokenData.refreshToken,
            expiry: tokenData.expiryTimestamp === null ? null : new Date(tokenData.expiryTimestamp),
            onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
                const newTokenData = {
                    accessToken,
                    refreshToken,
                    expiryTimestamp: expiryDate === null ? null : expiryDate.getTime()
                };
                await fs.writeFile('./tokens.json', JSON.stringify(newTokenData, null, 4), 'UTF-8')
            }
        }
    );

    const apiClient = new ApiClient({ authProvider: auth });

    const pubSubClient = new PubSubClient();
    const userId = await pubSubClient.registerUserListener(apiClient);


    const listener = await pubSubClient.onRedemption(userId, redemption => {
        const { rewardName, id, message, rewardId, rewardPrompt, userId, displayName, userName } = redemption;
        console.log(`-------\n${rewardName}: ${id}\nMessage: ${message}\nPrompt: ${rewardPrompt}\nReward Id: ${rewardId}\nUserId: ${userId}\ndisplayname: ${displayName}\nusername: ${userName}\n-----\n\n`);
        if (rewardName in soundClipMap) {
            console.log('triggering an alert with streamlabs');
            sendStreamlabsAlert(rewardName);
        };
    });

    // chat bot stuff
    const chatClient = new ChatClient(auth, { channels: ['ralphiehardesty'] });
    await chatClient.connect();

    const giveawayUsers = new Set();
    const giveawayCodeMap = {
        'eshop10': '$10 Digital Gift Card to the Nintendo eShop'
    }

    chatClient.onMessage((channel, user, message, msg) => {
        console.log(`${message}\nUser: ${user}, isMod: ${msg.userInfo.isMod}`);
        if (message.includes('!luvralphie') && !msg.userInfo.isMod) {
            console.log(`Added ${user} to giveaway`)
            giveawayUsers.add(user);
        };
        if (message.includes('!giveaway start') && msg.userInfo.isMod) {
            const giveawayName = message.split(' ')[2];
            chatClient.say(channel, `We are starting a giveaway for a ${giveawayCodeMap[giveawayName]}. To enter, type !luvralphie in chat.`)
        }
        if (message == '!giveaway stop' && msg.userInfo.isMod) {
            // pick a random user from the giveaways
            console.log(`This is what the set looks like: ${giveawayUsers}`)
            const randomUser = getRandomItem(giveawayUsers);
            chatClient.say(channel, `${randomUser} won the giveaway!!! Give them some snaps. Whisper ${user} to redeem your prize.`);
            giveawayUsers.clear();
        };
    });
}

main();