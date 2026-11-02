import { readFileSync } from 'node:fs';
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
if (!app.expo.extra?.eas?.projectId) {
  const account = process.env.EXPO_ACCOUNT || eas(['whoami'], true);
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(account)) throw Error('Set the EXPO_ACCOUNT repository variable to the intended Expo account slug.');
  eas(['project:init', '--account', account, '--force', '--non-interactive']);
} else eas(['project:info']);
const linked = JSON.parse(readFileSync('app.json', 'utf8')).expo;
if (!linked.extra?.eas?.projectId) throw Error('EAS project was not linked.');
console.log('TRUSTBRIDGE_EXPO_PROJECT=' + linked.extra.eas.projectId);
console.log('TRUSTBRIDGE_EXPO_OWNER=' + linked.owner);
