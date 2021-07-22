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

const baseUrl = 'https://ralphie-twitch-bot.herokuapp.com';

function getRandomItem(set) {
    const items = Array.from(set);
    return items[Math.floor(Math.random() * items.length)];
}

const soundClipMap = {
    'Gross': {
        soundUrl: 'jesus gross.mp3',
        imageUrl: 'https://i.makeagif.com/media/2-06-2018/-fzdXc.gif',
    },
    'Get Her Off Of Me': {
        soundUrl: 'get her off of me.mp3',
        imageUrl: 'https://i.pinimg.com/originals/77/c0/02/77c0028b38b7aa20391672260371d912.gif',
    },
    'Gagatrondra': {
        soundUrl: 'gagatrondra.mp3',
        imageUrl: 'https://media1.giphy.com/media/VFy9mDuUOTTQfWw39T/giphy.gif',
    },
    'Talented Brilliant': {
        soundUrl: 'talented brilliant.mp3',
        imageUrl: 'https://i.gifer.com/1YZx.gif',
    },
    'How Dare You': {
        soundUrl: 'how dare you.mp3',
        imageUrl: 'https://i.imgur.com/r75UZGW.gif?noredirect',
    },
    "I Can't Believe You've Done This": {
        soundUrl: "can't believe.mp3",
        imageUrl: 'https://thumbs.gfycat.com/HarmoniousEachEgg-small.gif',
    },
    'Not Today Satan': {
        soundUrl: 'not today satan.mp3',
        imageUrl: 'https://images.squarespace-cdn.com/content/v1/5e3ae820597c7c5ee13d77bf/1586334315884-80Z0TKTB6OPSRS7AGS6T/ke17ZwdGBToddI8pDm48kAI4xq1X9O62QpEWWz26IsVZw-zPPgdn4jUwVcJE1ZvWEtT5uBSRWt4vQZAgTJucoTqqXjS3CfNDSuuf31e0tVF79dn-GXmv6G1Rqpzg9hme7yDMTHYtmNQQDOJBMZyks91lH3P2bFZvTItROhWrBJ0/not-today-satan.gif',
    },
    'Daddy Chill': {
        soundUrl: 'daddy chill.mp3',
        imageUrl: 'https://thumbs.gfycat.com/DampSimilarFrog-size_restricted.gif',
    },
    'Bastard People': {
        imageUrl: 'https://i.makeagif.com/media/9-13-2017/wH15a2.gif',
        soundUrl: 'corky.mp3',
    },
    'Hey Queen': {
        imageUrl: 'https://media.tenor.com/images/f5bd171d6fba0fe1f7cba84f13b2dd52/tenor.gif',
        soundUrl: 'hey queen.mp3',
    },
    'Wha Happen': {
        imageUrl: 'https://media4.giphy.com/media/l2JIk0sWj9sUvbvCU/giphy.gif',
        soundUrl: 'wha happen.mp3',
    },
};

async function sendStreamlabsAlert(imageUrl, soundUrl, message) {
    const url = 'https://www.streamlabs.com/api/v1.0/alerts';
    const formdata = FormData();
    formdata.append("access_token", config.get('Streamlabs.accessToken'));
    formdata.append("type", "donation");
    formdata.append("image_href", imageUrl);
    formdata.append("message", message);
    formdata.append("duration", "5000");
    formdata.append("sound_href", `${baseUrl}/${soundUrl}`);

    const response = await fetch(url, { method: 'POST', body: formdata });
    console.log(await response.json());
};

async function main() {
    const tokenData = JSON.parse(await fs.readFile('./tokens.json'));
    const auth = new RefreshableAuthProvider(
        new StaticAuthProvider(clientId, tokenData.accessToken),
        {
            clientSecret,
            refreshToken: process.env.TWITCH_REFRESH_TOKEN || tokenData.refresh_token,
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


    await pubSubClient.onRedemption(userId, redemption => {
        const { rewardName } = redemption;
        if (rewardName in soundClipMap) {
            console.log('triggering an alert with streamlabs');
            const { imageUrl, soundUrl } = soundClipMap[rewardName];
            sendStreamlabsAlert(imageUrl, soundUrl, rewardName);
        };
    });

    // chat bot stuff
    const chatClient = new ChatClient(auth, { channels: ['ralphiehardesty'] });
    await chatClient.connect();

    const giveawayUsers = new Set();
    const giveawayCodeMap = {
        'eshop10': '$10 Digital Gift Card to the Nintendo eShop',
        'eshop20': '$20 Digital Gift Card to the Nintendo eShop',
    };

    const discordLink = 'https://discord.gg/FhY3Zwr5';
    const friendCode = 'SW-6387-2884-3980';
    let dodoCode = '';

    chatClient.onMessage((channel, user, message, msg) => {
        // mod/vip/broadcaster commands
        if (msg.userInfo.isMod || msg.userInfo.isBroadcaster || msg.userInfo.isVip) {
            if (message.startsWith('!dodo set')) {
                const [, , code] = message.split(' ');
                dodoCode = code;
            };

            if (message.startsWith('!gifboard')) {
                try {
                    const gifName = message.split('!gifboard ')[1];
                    if (gifName in soundClipMap) {
                        const { imageUrl, soundUrl } = soundClipMap[gifName];
                        const text = message.split(gifName)[1];
                        const alertText = text || gifName;
                        sendStreamlabsAlert(imageUrl, soundUrl, alertText);
                    }
                }
                catch (e) {
                    console.log(`Error when manually triggering gifboard:\n${e}`);
                }
            };
        }

        // just mods & broadcaster
        if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
            if (message.includes('!giveaway start') && msg.userInfo.isMod) {
                giveawayUsers.clear();
                const giveawayName = message.split(' ')[2];
                chatClient.say(channel, `We are starting a giveaway for a ${giveawayCodeMap[giveawayName]}. To enter, type !luvralphie in chat.`)
            }
            if (message === '!giveaway stop' && msg.userInfo.isMod) {
                // pick a random user from the giveaways
                console.log(`This is what the set looks like: ${giveawayUsers}`)
                const randomUser = getRandomItem(giveawayUsers);
                chatClient.say(channel, `${randomUser} won the giveaway!!! Give them some snaps. Whisper ${user} to redeem your prize.`);
                giveawayUsers.clear();
            };
            if (message === '!so') {
                const streamer = message.split(' ')[1];
                const response = `Please go follow ${streamer} on Twitch at: https://www.twitch.tv/${streamer} because they are an icon, a legend, and they are the moment`;
                chatClient.say(channel, response);
            };
        }

        // everyone else
        if (message === '!dodo') chatClient.say(channel, `Dodo code: ${dodoCode}`);
        if (message === '!discord') chatClient.say(channel, `Discord link:\n(~˘▾˘)~ ${discordLink}`);
        if (message === '!fc') chatClient.say(channel, `Friend code:\n(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ ✧ﾟ･: ${friendCode}`);
        if (message.includes('!luvralphie') && !msg.userInfo.isMod) {
            console.log(`Added ${user} to giveaway`)
            giveawayUsers.add(user);
        };

        // !mp


    });
}

main();