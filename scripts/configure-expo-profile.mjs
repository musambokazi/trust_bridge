import { readFileSync, writeFileSync } from 'node:fs';
const variant = process.env.APP_VARIANT;
if (!['preview', 'production'].includes(variant)) throw Error('Set APP_VARIANT to preview or production.');
if (!process.env.EXPO_PROJECT_ID || !process.env.TRUSTBRIDGE_UPDATE_CHANNEL) throw Error('Missing Expo project/channel metadata.');
const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
eas.build[variant].channel = process.env.TRUSTBRIDGE_UPDATE_CHANNEL;
eas.build[variant].env = { ...eas.build[variant].env, APP_VARIANT: variant, EXPO_PROJECT_ID: process.env.EXPO_PROJECT_ID, EXPO_ACCOUNT: process.env.EXPO_ACCOUNT, TRUSTBRIDGE_UPDATE_CHANNEL: process.env.TRUSTBRIDGE_UPDATE_CHANNEL };
writeFileSync('eas.json', JSON.stringify(eas, null, 2) + '\n');
