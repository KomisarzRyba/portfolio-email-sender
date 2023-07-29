import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import { google } from 'googleapis';
import url from 'url';
import { webSafeBase64Encode } from './lib/encoder';
import { MessageSchema } from './lib/message';

const app = express();
const port = 3000;

const tokenFilePath = 'token.json';

dotenv.config();

app.use(express.json());
app.use(cors({ origin: 'https://www.antekolesik.dev' }));

const oauth2client = new google.auth.OAuth2(
	process.env.GOOGLE_OAUTH_CLIENT_ID,
	process.env.GOOGLE_OAUTH_CLIENT_SECRET,
	'https://www.contactapi.antekolesik.dev/oauth2callback'
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

app.get('/', (req, res) => {
	res.redirect(authorizationUrl);
});

app.get('/oauth2callback', async (req, res) => {
	try {
		let q = url.parse(req.url, true).query;
		let { tokens } = await oauth2client.getToken(q.code as string);
		fs.writeFileSync(tokenFilePath, JSON.stringify(tokens));
		oauth2client.setCredentials(tokens);
		res.status(200).redirect('/send');
	} catch (e) {
		res.status(500).send();
	}
});

app.post('/send', async (req, res) => {
	try {
		const body = req.body;
		const { senderName, senderEmail, messageContent } =
			MessageSchema.parse(body);

		const message = `From: ${senderName} <${senderEmail}>\nTo: Antek <antek.olesik@gmail.com>\nSubject: New message from Portfolio\n\nSender: ${senderName} <${senderEmail}>\n${messageContent}`;

		oauth2client.setCredentials(
			JSON.parse(fs.readFileSync(tokenFilePath).toString())
		);
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
