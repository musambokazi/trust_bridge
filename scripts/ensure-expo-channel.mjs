import { spawnSync } from 'node:child_process';
const name = process.env.TRUSTBRIDGE_UPDATE_CHANNEL;
if (!/^(preview|production)(-[a-f0-9]{12})?$/.test(name || '')) throw Error('Invalid channel');
function eas(args) { return spawnSync('npx', ['--yes', 'eas-cli@27.2.0', ...args], { encoding: 'utf8' }); }
for (const type of ['branch', 'channel']) {
  const found = eas([type + ':view', name, '--json', '--non-interactive']);
  if (found.status !== 0) {
    const created = eas([type + ':create', name, '--json', '--non-interactive']);
    if (created.status !== 0) throw Error(created.stderr || created.stdout);
  }
}
const mapped = eas(['channel:edit', name, '--branch', name, '--non-interactive']);
if (mapped.status !== 0) throw Error(mapped.stderr || mapped.stdout);
console.log('Expo channel and branch ready: ' + name);
