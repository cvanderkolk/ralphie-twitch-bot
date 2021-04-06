# ralphie-twitch-bot

Hi 👋 This is a nodeJS bot for my husband [Ralph's Twitch channel](https://www.twitch.tv/ralphiehardesty), which I built because I wanted an easy way to use channel point redemptions to trigger gifs/sounds onscreen via [Streamlabs](https://streamlabs.com/). It lives in the cloud thanks to [Heroku](https://www.heroku.com/).

# FAQ

## What does it do?

- Allow users to redeem channel points to trigger gifs/sounds onscreen
- Allow mods in the channel to trigger the same gifs/sounds manually with `!gifboard` (e.g. `!gifboard Gagatrondra`)
- Power simple giveaways in chat

## Couldn't you use another tool?

Sure, but this is more fun 😁 One of these days I'll check out [Moobot](https://moo.bot/) or something.

## Can I use it?

Go nuts 💃

# Usage Directions

For this program to run successfully you'll need to fill all four of the environment variables in `config/production.js`:
1. Twitch Client ID
2. Twitch Client Secret
3. Twitch refresh token
4. Streamlabs access token

## Generate Twitch Client ID/Secret
1 and 2 you can get by creating a [developer application in Twitch's developer console](https://dev.twitch.tv/console/apps).

## Twitch Credentials
Twitch refresh tokens don't expire. You can generate this by going through the [auth code flow](https://dev.twitch.tv/docs/authentication) yourself (using a tool like Postman) or use the built in express server by typing `node web`, then <a href="https://localhost:3000/auth/twitch">logging in</a> with the given endpoint: https://localhost:3000/auth/twitch

Finishing the flow will present you with a refresh token to save in your environment/config. 

## Streamlabs Credentials
Just like with Twitch, you'll have to [create an application in Streamlabs' developer console](https://dev.streamlabs.com/docs/register-your-application). Then you can get your access token either by going through [the auth flow yourself](https://dev.streamlabs.com/docs/obtain-an-access_token) or by inserting your credentials (grep "FILL-ME-IN") & firing the built-in express server with `node web` like above, then <a href="https://localhost:3000/auth/streamlabs">logging in</a> with the given endpoint: https://localhost:3000/auth/streamlabs 

Finishing the flow will present you with an access token to save in your environment/config.

# TODO:

- [ ] Welcome on follow
- [ ] Add support for saving/repeating drag names
- [ ] Set/share discord link
- [ ] Add interface to CRUD gif listing

Questions? Comments? Suggestions? Feel free to create issues. I've done my best to document myself but I offer no guarentees as this is a fun side-project!