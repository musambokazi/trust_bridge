import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, chmodSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, delimiter } from 'node:path';
import { spawnSync } from 'node:child_process';
const planner = resolve('../scripts/plan-release.mjs');
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'trustbridge-release-'));
  const write = (name: string, value: unknown) => writeFileSync(join(dir, name), JSON.stringify(value));
  write('app.json', { expo: { version: '1.0.1', runtimeVersion: '1.0.1', android: { package: 'example.trustbridge' }, plugins: ['expo-router'], extra: { eas: { projectId: 'demo-project' } }, owner: 'team' } });
  write('package.json', { version: '1.0.1' });
  write('package-lock.json', { packages: { '': { version: '1.0.1' }, 'node_modules/expo': { version: '58.0.19' } } });
  writeFileSync(join(dir, 'app.config.js'), 'module.exports = ({ config }) => config;');
  writeFileSync(join(dir, 'gh'), `#!/usr/bin/env node\nconst fs=require('node:fs');if(fs.existsSync('remote-release.json'))process.stdout.write(fs.readFileSync('remote-release.json'));else{console.error('HTTP 404');process.exit(1)}`);
  chmodSync(join(dir, 'gh'), 0o700);
  const run = (args: string[] = []) => spawnSync(process.execPath, [planner, ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: dir + delimiter + process.env.PATH, GITHUB_REPOSITORY: 'example/trustbridge', GITHUB_OUTPUT: join(dir, 'outputs') } });
  assert.equal(run(['--write-baseline']).status, 0);
  return { dir, write, run, clean: () => rmSync(dir, { recursive: true, force: true }) };
}
test('first release builds both profiles using canonical channels and fixed runtime', () => { const f = fixture(); try { const r = f.run(); assert.equal(r.status, 0, r.stderr); const p = JSON.parse(r.stdout); assert.equal(p.build, true); assert.equal(p.runtime, '1.0.1'); assert.deepEqual(p.channels, { preview: 'preview', production: 'production' }); } finally { f.clean(); } });
test('existing complete binary release allows OTA without another compilation', () => { const f = fixture(); try { const hash = JSON.parse(readFileSync(join(f.dir, 'runtime-baseline.json'), 'utf8')).nativeHash; f.write('remote-release.json', { body: 'Native compatibility: `' + hash + '`', assets: ['preview', 'production'].map(v => ({ name: `TrustBridge-1.0.1-${v}.apk` })) }); const r = f.run(); assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout).build, false); } finally { f.clean(); } });
test('changed native dependencies never receive the old binary channel', () => { const f = fixture(); try { f.write('package-lock.json', { packages: { '': {}, 'node_modules/expo': { version: '58.0.20' } } }); const r = f.run(); assert.equal(r.status, 0, r.stderr); const p = JSON.parse(r.stdout); assert.match(p.channels.preview, /^preview-[a-f0-9]{12}$/); assert.match(p.channels.production, /^production-[a-f0-9]{12}$/); } finally { f.clean(); } });
test('a mismatched native hash cannot overwrite an existing app version', () => { const f = fixture(); try { f.write('remote-release.json', { body: 'Native compatibility: `different`', assets: [] }); const r = f.run(); assert.notEqual(r.status, 0); assert.match(r.stderr, /Increment the APP version/); } finally { f.clean(); } });
test('runtime number cannot drift and incomplete releases cannot be silently overwritten', () => { const f = fixture(); try { const app = JSON.parse(readFileSync(join(f.dir, 'app.json'), 'utf8')); app.expo.runtimeVersion = '1.0.2'; f.write('app.json', app); assert.match(f.run().stderr, /runtime must remain 1.0.1/); app.expo.runtimeVersion = '1.0.1'; f.write('app.json', app); const hash = JSON.parse(readFileSync(join(f.dir, 'runtime-baseline.json'), 'utf8')).nativeHash; f.write('remote-release.json', { body: 'Native compatibility: `' + hash + '`', assets: [] }); assert.match(f.run().stderr, /Release exists but is incomplete/); } finally { f.clean(); } });

test('replacing a native icon at the same path changes its compatibility channel', () => { const f = fixture(); try { const app = JSON.parse(readFileSync(join(f.dir, 'app.json'), 'utf8')); app.expo.icon = './icon.png'; f.write('app.json', app); writeFileSync(join(f.dir, 'icon.png'), 'first-image-fixture'); const first = f.run(); assert.equal(first.status, 0, first.stderr); writeFileSync(join(f.dir, 'icon.png'), 'replacement-image-fixture'); const second = f.run(); assert.equal(second.status, 0, second.stderr); assert.notEqual(JSON.parse(first.stdout).nativeHash, JSON.parse(second.stdout).nativeHash); assert.notEqual(JSON.parse(first.stdout).channels.preview, JSON.parse(second.stdout).channels.preview); } finally { f.clean(); } });

 test('local native source changes require an isolated channel even without dependency changes', () => { const f = fixture(); try { mkdirSync(join(f.dir, 'modules/documents/android'), { recursive: true }); const source = join(f.dir, 'modules/documents/android/Reader.kt'); writeFileSync(source, 'first implementation'); const first = f.run(); assert.equal(first.status, 0, first.stderr); writeFileSync(source, 'changed implementation'); const second = f.run(); assert.equal(second.status, 0, second.stderr); assert.notEqual(JSON.parse(first.stdout).nativeHash, JSON.parse(second.stdout).nativeHash); } finally { f.clean(); } });
