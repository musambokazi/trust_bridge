import { readFileSync, existsSync, renameSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
function eas(args, capture = false) {
  const result = spawnSync('npx', ['--yes', 'eas-cli@27.2.0', ...args], {
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit', encoding: 'utf8',
  });
  if (result.status !== 0) throw Error(`EAS ${args[0]} failed. Check EXPO_TOKEN permissions and the Expo account.`);
  return result.stdout?.trim();
}
if (!process.env.EXPO_TOKEN) throw Error('Add the EXPO_TOKEN Actions secret to musambokazi/trust_bridge. Secrets from other repositories are not inherited.');
const app = JSON.parse(readFileSync('app.json', 'utf8'));
let initialized;
if (!app.expo.extra?.eas?.projectId) {
  const output = process.env.EXPO_ACCOUNT || eas(['whoami'], true);
  const account = output.replace(/\u001b\[[0-9;]*m/g, '').split(/\r?\n/).map(line => line.trim()).find(line => /^[a-z0-9][a-z0-9_-]*(?: \(authenticated using EXPO_TOKEN\))?$/i.test(line))?.split(' ')[0];
  if (!account || !/^[a-z0-9][a-z0-9_-]*$/i.test(account)) throw Error('Set the EXPO_ACCOUNT repository variable to the intended Expo account slug.');
  const dynamic = existsSync('app.config.js');
  if (dynamic) renameSync('app.config.js', 'app.config.js.bootstrap');
  try { initialized = JSON.parse(eas(['project:init', '--account', account, '--force', '--json', '--non-interactive'], true)); }
  finally { if (dynamic) renameSync('app.config.js.bootstrap', 'app.config.js'); }
} else eas(['project:info']);
const linkedApp = JSON.parse(readFileSync('app.json', 'utf8'));
if (!linkedApp.expo.owner && initialized?.owner) { linkedApp.expo.owner = initialized.owner; writeFileSync('app.json', JSON.stringify(linkedApp, null, 2) + '\n'); }
const linked = linkedApp.expo;
if (!linked.extra?.eas?.projectId) throw Error('EAS project was not linked.');
console.log('TRUSTBRIDGE_EXPO_PROJECT=' + linked.extra.eas.projectId);
console.log('TRUSTBRIDGE_EXPO_OWNER=' + linked.owner);
