import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const app = read('app.json').expo, pkg = read('package.json'), lock = read('package-lock.json');
if (app.runtimeVersion !== '1.0.1') throw Error('The OTA runtime must remain 1.0.1.');
if (app.version !== pkg.version || !/^\d+\.\d+\.\d+$/.test(app.version)) throw Error('Use matching semantic app versions in app.json and package.json.');
// Conservative: any production dependency/config change gets an isolated channel.
const native = { dependencies: Object.entries(lock.packages).filter(([k, p]) => k && !p.dev).map(([path, p]) => ({ path, version: p.version, integrity: p.integrity })), plugins: app.plugins, androidPackage: app.android.package, orientation: app.orientation, userInterfaceStyle: app.userInterfaceStyle, config: readFileSync('app.config.js', 'utf8') };
// Asset bytes are native build inputs too, including future replacements at the same path.
const imagePaths = new Set();
function collectImages(value) {
  if (typeof value === 'string' && /\.(png|jpe?g|webp)$/i.test(value) && !/^https?:/.test(value)) imagePaths.add(value);
  else if (value && typeof value === 'object') Object.values(value).forEach(collectImages);
}
collectImages({ icon: app.icon, android: app.android, splash: app.splash, plugins: app.plugins });
if (imagePaths.size) native.assets = [...imagePaths].sort().map(path => ({ path, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }));
const hash = createHash('sha256').update(JSON.stringify(native)).digest('hex');
if (process.argv.includes('--write-baseline')) { writeFileSync('runtime-baseline.json', JSON.stringify({ nativeHash: hash }, null, 2) + '\n'); process.exit(0); }
const first = read('runtime-baseline.json').nativeHash;
const suffix = first === hash ? '' : '-' + hash.slice(0, 12);
const channels = { preview: 'preview' + suffix, production: 'production' + suffix };
const repo = process.env.GITHUB_REPOSITORY;
const response = spawnSync('gh', ['api', `repos/${repo}/releases/tags/v${app.version}`], { encoding: 'utf8' });
let existing = null;
if (response.status === 0) existing = JSON.parse(response.stdout);
else if (!response.stderr.includes('404')) throw Error('Could not inspect the existing release: ' + response.stderr);
if (existing && !existing.body.includes('Native compatibility: `' + hash + '`')) throw Error('Native dependencies/configuration changed. Increment the APP version before compiling. Do not change runtime 1.0.1.');
const names = ['preview', 'production'].map(v => `TrustBridge-${app.version}-${v}.apk`);
if (existing && !names.every(n => existing.assets.some(a => a.name === n))) throw Error('Release exists but is incomplete. Inspect it before retrying; APK assets are not overwritten automatically.');
const plan = { version: app.version, nativeHash: hash, runtime: '1.0.1', channels, build: !existing, projectId: app.extra.eas.projectId, owner: app.owner };
writeFileSync('release-plan.json', JSON.stringify(plan, null, 2));
for (const [key, value] of Object.entries({ version: plan.version, build: String(plan.build), project_id: plan.projectId, owner: plan.owner, native_hash: hash, preview_channel: channels.preview, production_channel: channels.production })) {
  if (!value || String(value).includes('\n')) throw Error('Invalid release output: ' + key);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}
console.log(JSON.stringify(plan));
