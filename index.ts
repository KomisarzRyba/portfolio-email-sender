import { Redis } from '@upstash/redis/nodejs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { google } from 'googleapis';
import { Credentials } from 'google-auth-library/build/src/auth/credentials';
import url from 'url';
import { webSafeBase64Encode } from './lib/encoder';
import { MessageSchema } from './lib/message';

const app = express();
const port = 3000;

dotenv.config();

app.use(express.json());
app.use(cors({ origin: 'https://www.antekolesik.dev' }));

const oauth2client = new google.auth.OAuth2(
	process.env.GOOGLE_OAUTH_CLIENT_ID,
	process.env.GOOGLE_OAUTH_CLIENT_SECRET,
	process.env.GOOGLE_OAUTH_REDIRECT_URI
);

const scopes = [
	'https://mail.google.com/',
	'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
	'https://www.googleapis.com/auth/gmail.compose',
	'https://www.googleapis.com/auth/gmail.modify',
	'https://www.googleapis.com/auth/gmail.send',
];

const authorizationUrl = oauth2client.generateAuthUrl({
	access_type: 'offline',
	scope: scopes,
	include_granted_scopes: true,
});

const gmail = google.gmail({
	version: 'v1',
	auth: oauth2client,
});

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

app.get('/', (req, res) => {
	res.redirect(authorizationUrl);
});

app.get('/oauth2callback', async (req, res) => {
	try {
		let q = url.parse(req.url, true).query;
		let { tokens } = await oauth2client.getToken(q.code as string);
		// oauth2client.setCredentials(tokens);
		await redis.json.set('token', '$', JSON.stringify(tokens));
		res.status(200).send();
	} catch (e) {
		console.log(e);
		res.status(500).send();
	}
});

app.post('/send', async (req, res) => {
	try {
		const { senderName, senderEmail, messageContent } = MessageSchema.parse(
			req.body
		);

		// compose a message
		const message = `From: ${senderName} <${senderEmail}>\nTo: Antek <antek.olesik@gmail.com>\nSubject: New message from Portfolio\n\nSender: ${senderName} <${senderEmail}>\n${messageContent}`;

		// get credentials from redis
		const tokens = (await redis.json.get('token')) as Credentials;
		if (!tokens) {
			throw new Error(
				'No credentials found or wrong credentials fetched'
			);
		}

		oauth2client.setCredentials({
			refresh_token: tokens.refresh_token,
		});

		let { data } = await gmail.users.messages.send({
			userId: 'me',
			requestBody: {
				raw: webSafeBase64Encode(message),
			},
		});
		res.status(200).send(data);
	} catch (e: any) {
		console.log(e);
		res.status(500).send(e);
	}
});

app.listen(port, () => {
	console.log('Listening on port ' + port);
});

module.exports = app;
