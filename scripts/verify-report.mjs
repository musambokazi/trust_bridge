// Node 24+. Trusted keys must come from a separately authenticated channel.
import fs from 'node:fs';import {createRequire} from 'node:module';
import {readBundle} from '../mobile/src/reports/zip.ts';
import {verifyBundle} from '../mobile/src/reports/integrity.ts';
const require=createRequire(new URL('../mobile/package.json',import.meta.url));const {unzipSync,strFromU8}=require('fflate');
const [bundlePath,registryPath]=process.argv.slice(2);
if(!bundlePath||!registryPath){console.error('Usage: node scripts/verify-report.mjs report.zip trusted-public-keys.json');process.exit(2);}
try{
 if(fs.statSync(bundlePath).size>6_000_000)throw Error('Report bundle exceeds 6 MB');
 const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
 const bundle=readBundle(new Uint8Array(fs.readFileSync(bundlePath)),unzipSync,strFromU8);
 const result=verifyBundle(bundle,Array.isArray(registry)?registry:registry.keys);
 console.log('VALID ML-DSA-65 signature; unchanged PDF and snapshot.');console.log('Assessment:',result.assessmentId);console.log('Trusted key fingerprint:',result.keyId);
 console.log('This proves byte integrity under the trusted key, not supplier legitimacy or payment approval. Registry revocation information may be stale.');
}catch(e){console.error('NOT VERIFIED:',e instanceof Error?e.message:'Invalid report');process.exitCode=1;}
