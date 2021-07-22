const express = require('express');
const config = require('config');
const fs = require('fs').promises;
const crypto = require('crypto');

const nonce = crypto.randomBytes(16).toString('base64');
const { AuthorizationCode } = require('simple-oauth2');

const app = express();
const port = 3000;

// Twitch client config
const twitchOauthConfig = {
  client: {
    id: config.get('Twitch.clientId'),
    secret: config.get('Twitch.clientSecret')
  },
  auth: {
    tokenHost: 'https://id.twitch.tv/',
    authorizePath: 'oauth2/authorize',
    tokenPath: 'oauth2/token'
  }
};
const twitchCallbackUrl = 'http://localhost:3000/auth/twitch/callback';
const twitchAuth = new AuthorizationCode(twitchOauthConfig);
const twitchScopes = [
  'channel:read:hype_train',
  'channel:read:redemptions',
  'chat:read'
]
const twitchAuthUri = twitchAuth.authorizeURL({
  redirect_uri: twitchCallbackUrl,
  scope: twitchScopes.join(' '),
  state: nonce,
});

app.get('/auth/twitch/callback', async (req, res) => {
  const { code, state } = req.query;

  if (state !== nonce) {
    return res.status(401).send('State mismatch');
  };

  const options = {
    code,
    client_id: config.get('Twitch.clientId'),
    client_secret: config.get('Twitch.clientSecret'),
    redirect_uri: twitchCallbackUrl,
  };

  try {
    const response = await twitchAuth.getToken(options);
    const tokens = response.token;

    // write tokens to file
    await fs.writeFile('./tokens.json', JSON.stringify(tokens, null, 4), 'UTF-8')

    return res.status(200).send('Wrote your Twitch tokens to tokens.json.');
  } catch (error) {
    console.error('Access Token Error', error.message);
    return res.status(500).send('Twitch auth failed');
  }
})

app.get('/', (req, res) => {
  res.send(`<a href="/auth/twitch">Log In To Twitch</a><br><a href="/auth/streamlabs">Log In To Streamlabs</a>`);
})

app.get('/auth/twitch', (req, res) => {
  console.log(twitchAuthUri);
  res.redirect(twitchAuthUri);
})


// streamlabs client config
const streamlabsClientId = 'FILL-ME-OUT';
const streamlabsClientSecret = 'FILL-ME-OUT-TOO';
const streamlabsOauthConfig = {
  client: {
    id: streamlabsClientId,
    secret: streamlabsClientSecret
  },
  auth: {
    tokenHost: 'https://streamlabs.com/api/v1.0/',
  }
};
const streamlabsCallbackUrl = 'http://localhost:3000/auth/streamlabs/callback';
const streamlabsAuth = new AuthorizationCode(streamlabsOauthConfig);
const streamlabsAuthUri = twitchAuth.authorizeURL({
  redirect_uri: streamlabsCallbackUrl,
  scope: 'alerts.create',
  state: nonce,
});

// endpoints
app.get('/auth/streamlabs', (req, res) => {
  console.log(streamlabsAuthUri);
  res.redirect(streamlabsAuthUri);
})

app.get('/auth/streamlabs/callback', async (req, res) => {
  const { code, state } = req.query;

  if (state !== nonce) {
    return res.status(401).send('State mismatch');
  };

  const options = {
    code,
    client_id: streamlabsClientId,
    client_secret: streamlabsClientSecret,
    redirect_uri: streamlabsCallbackUrl,
  };

  try {
    const response = await streamlabsAuth.getToken(options);
    const tokens = response.token;
    // streamlabs access tokens don't expire
    return res.status(200).send(`Here is your Streamlabs access token: ${tokens.access_token}\n\nTake it and put it in your development/production config`);
  } catch (error) {
    console.error('Streamlabs Access Token Error', error.message);
    return res.status(500).send('Streamlabs auth failed');
  }
})

// serve static audio files
app.use(express.static('audio'))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})