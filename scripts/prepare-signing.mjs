import fs from 'node:fs';
// These are supplied only through environment secrets. Never print credentials.
const fields=['TRUSTBRIDGE_KEYSTORE_BASE64','TRUSTBRIDGE_KEYSTORE_PASSWORD','TRUSTBRIDGE_KEY_ALIAS','TRUSTBRIDGE_KEY_PASSWORD'];
const configured=fields.filter(k=>process.env[k]);
let store;
if(configured.length){
 if(configured.length!==fields.length)throw Error('Provide all four organisation signing secrets together.');
 const bytes=Buffer.from(process.env.TRUSTBRIDGE_KEYSTORE_BASE64,'base64');if(bytes.length<1000||bytes.length>100000)throw Error('Invalid organisation keystore file.');
 const path='android/app/organisation-release.keystore';fs.writeFileSync(path,bytes,{mode:0o600});
 store={keystorePath:path,keystorePassword:process.env.TRUSTBRIDGE_KEYSTORE_PASSWORD,keyAlias:process.env.TRUSTBRIDGE_KEY_ALIAS,keyPassword:process.env.TRUSTBRIDGE_KEY_PASSWORD};
 console.log('Using organisation-controlled signing credentials. Validate the certificate and upgrade path before public distribution.');
}else{
 const path='android/app/debug.keystore';if(!fs.existsSync(path))throw Error('Missing internal preview signing key.');
 store={keystorePath:path,keystorePassword:'android',keyAlias:'androiddebugkey',keyPassword:'android'};
 console.log('INTERNAL VALIDATION ONLY: organisation signing secrets are absent; retaining the historical preview key for upgrade compatibility.');
}
fs.writeFileSync('credentials.json',JSON.stringify({android:{keystore:store}}),{mode:0o600});
