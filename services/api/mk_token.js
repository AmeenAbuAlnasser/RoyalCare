const crypto = require('crypto');
const secret = 'royalcare-local-center-session-secret';
const payload = { centerId: '17c0114c-0c7a-4a72-9944-a01263d6cecf', userId: '79d4632b-baf0-4647-85df-921f24c99bba', role: 'CENTER_OWNER', exp: Math.floor(Date.now()/1000) + 3600 };
const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
const nonce = crypto.randomBytes(8).toString('hex');
const sig = crypto.createHmac('sha256', secret).update(body + '.' + nonce).digest('base64url');
console.log(body + '.' + nonce + '.' + sig);
