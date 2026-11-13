import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {ml_dsa65} from 'npm:@noble/post-quantum@0.7.1/ml-dsa.js';
import {cors,json,requestContext,failure} from '../_shared/http.ts';
import {canonical,hash,fromBase64} from '../_shared/integrity.ts';
import {renderReport} from '../_shared/render-report.ts';
const b64=(bytes:Uint8Array)=>{let text='';for(const byte of bytes)text+=String.fromCharCode(byte);return btoa(text);};
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{
  const {client,body}=await requestContext(req);
  if(typeof body.id!=='string'||typeof body.includeNotes!=='boolean')throw Error('BODY');
  const {data:context,error}=await client.rpc('report_context',{assessment:body.id,include_notes:body.includeNotes});if(error||!context)throw Error('CONTEXT');
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const candidate=crypto.getRandomValues(new Uint8Array(32));const candidateKeys=ml_dsa65.keygen(candidate);
  const {data:key,error:keyError}=await admin.rpc('report_key_material',{seed:b64(candidate),public_key:b64(candidateKeys.publicKey)});candidate.fill(0);candidateKeys.secretKey.fill(0);if(keyError||!key)throw Error('SIGNING');
  const seed=fromBase64(key.seed),keys=ml_dsa65.keygen(seed);seed.fill(0);key.seed='';
  try{
   if(b64(keys.publicKey)!==key.publicKey||hash(keys.publicKey)!==key.id)throw Error('KEY');
   const pdf=await renderReport(context,key.id);
   const manifest={schema:'trustbridge.report.v1',algorithm:'ML-DSA-65',id:context.id,workspaceId:context.workspaceId,actorId:context.actorId,assessmentId:context.assessment.id,reviewVersion:context.review?.version??null,issuedAt:context.issuedAt,keyId:key.id,pdfSha256:hash(pdf),contextSha256:hash(new TextEncoder().encode(canonical(context)))};
   const signature=b64(ml_dsa65.sign(new TextEncoder().encode(canonical(manifest)),keys.secretKey));
   const {error:saveError}=await admin.rpc('register_signed_report',{manifest,signature});if(saveError)throw Error('REGISTER');
   return json({manifest,signature,context,pdfBase64:b64(pdf)});
  }finally{keys.secretKey.fill(0);}
 }catch(e){return failure(e);}
});
