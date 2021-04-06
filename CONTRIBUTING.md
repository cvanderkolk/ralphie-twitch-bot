# Contribution Directions

1. Clone the repo
2. Run `npm install` to install dependencies
3. Fill the four environment variables in your `config/default.js` (I suggest using a test channel for these credentials)
4. You can run the chat listeners locally with `node index` to test and iterate.
5. Have fun 😁

## Environment Variables

For this program to run successfully you'll need to fill all four of the environment variables in `config/production.js`:
1. Twitch Client ID
2. Twitch Client Secret
3. Twitch refresh token
4. Streamlabs access token

### Generate Twitch Client ID/Secret
1 and 2 you can get by creating a [developer application in Twitch's developer console](https://dev.twitch.tv/console/apps).

### Twitch Credentials
Twitch refresh tokens don't expire. You can generate this by going through the [auth code flow](https://dev.twitch.tv/docs/authentication) yourself (using a tool like Postman) or use the built in express server by typing `node web`, then <a href="https://localhost:3000/auth/twitch">logging in</a> with the given endpoint: https://localhost:3000/auth/twitch

Finishing the flow will present you with a refresh token to save in your environment/config. 

### Streamlabs Credentials
Just like with Twitch, you'll have to [create an application in Streamlabs' developer console](https://dev.streamlabs.com/docs/register-your-application). Then you can get your access token either by going through [the auth flow yourself](https://dev.streamlabs.com/docs/obtain-an-access_token) or by inserting your credentials (grep "FILL-ME-IN") & firing the built-in express server with `node web` like above, then <a href="https://localhost:3000/auth/streamlabs">logging in</a> with the given endpoint: https://localhost:3000/auth/streamlabs 

Finishing the flow will present you with an access token to save in your environment/config.