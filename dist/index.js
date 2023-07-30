"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodejs_1 = require("@upstash/redis/nodejs");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const googleapis_1 = require("googleapis");
const url_1 = __importDefault(require("url"));
const encoder_1 = require("./lib/encoder");
const message_1 = require("./lib/message");
const app = (0, express_1.default)();
const port = 3000;
dotenv_1.default.config();
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: 'https://www.antekolesik.dev' }));
const oauth2client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_OAUTH_CLIENT_ID, process.env.GOOGLE_OAUTH_CLIENT_SECRET, process.env.GOOGLE_OAUTH_REDIRECT_URI);
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
const gmail = googleapis_1.google.gmail({
    version: 'v1',
    auth: oauth2client,
});
const redis = new nodejs_1.Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
app.get('/', (req, res) => {
    res.redirect(authorizationUrl);
});
app.get('/oauth2callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let q = url_1.default.parse(req.url, true).query;
        let { tokens } = yield oauth2client.getToken(q.code);
        yield redis.json.set('token', '$', JSON.stringify(tokens));
        oauth2client.setCredentials(tokens);
        res.status(200).send();
    }
    catch (e) {
        console.log(e);
        res.status(500).send();
    }
}));
app.post('/send', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { senderName, senderEmail, messageContent } = message_1.MessageSchema.parse(req.body);
        const message = `From: ${senderName} <${senderEmail}>\nTo: Antek <antek.olesik@gmail.com>\nSubject: New message from Portfolio\n\nSender: ${senderName} <${senderEmail}>\n${messageContent}`;
        const token = yield redis.json.get('token');
        oauth2client.setCredentials(token);
        let { data } = yield gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: (0, encoder_1.webSafeBase64Encode)(message),
            },
        });
        res.status(200).send(data);
    }
    catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
}));
app.listen(port, () => {
    console.log('Listening on port ' + port);
});
module.exports = app;
