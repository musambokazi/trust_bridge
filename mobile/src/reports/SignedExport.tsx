import React,{useState} from 'react';
import {View} from 'react-native';
import {zipSync,strToU8} from 'fflate';
import {router} from 'expo-router';
import {Button,Muted,Txt} from '../components/ui';
import {supabase,secureStorage} from '../backend/client';
import {useAuth} from '../backend/AuthState';
import {useDemo} from '../state/DemoState';
import {fromBase64,verifyBundle,type SignedBundle,type PublicReportKey} from './integrity';
import {sharePrivateFile} from './files';
export function SignedExport({id,includeNotes}:{id:string;includeNotes:boolean}){
 const {workspace}=useAuth();const {pending,operations}=useDemo();const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const waiting=pending.some(p=>p.id===id)||operations.some(o=>o.kind==='review'&&o.entityId===id);
 async function run(){setBusy(true);setNotice('');try{
  if(waiting)throw Error('Sync the comparison and review before requesting a server-signed report.');
  const result=await supabase.functions.invoke<SignedBundle>('sign-report',{body:{id,includeNotes}});if(result.error||!result.data)throw Error('Connect and confirm your permissions and two-factor sign-in before requesting a signed report.');
  if(result.data.manifest.assessmentId!==id||result.data.manifest.workspaceId!==workspace?.id)throw Error('The report does not match the requested assessment.');
  const {data:keys,error}=await supabase.rpc('report_public_keys');if(error||!Array.isArray(keys))throw Error('Unable to load the trusted key registry.');
  verifyBundle(result.data,keys as PublicReportKey[]);
  await secureStorage.setItem('report-public-keys',JSON.stringify({keys,checkedAt:new Date().toISOString()}));
  const bundle=result.data;
  const bytes=zipSync({'report.pdf':fromBase64(bundle.pdfBase64),'proof.json':strToU8(JSON.stringify({...bundle,pdfBase64:undefined},null,2)),'README.txt':strToU8('TrustBridge ML-DSA-65 integrity bundle\nKeep report.pdf and proof.json together. Open Verify report in TrustBridge to validate the signature against the trusted server key registry. A signature does not establish supplier legitimacy or payment authorisation.\n')},{level:0});
  await sharePrivateFile(bytes,'TrustBridge-'+bundle.manifest.id+'.zip','application/zip');
  setNotice('Signed PDF and proof packaged together. Verify the ZIP after sharing; changing the PDF or proof causes verification to fail.');
 }catch(e){setNotice(e instanceof Error?e.message:'Unable to create a signed report.');}finally{setBusy(false);}}
 return <View style={{gap:12}}><Txt style={{fontSize:20,fontWeight:'600'}}>Post-quantum report integrity</Txt><Muted>The server renders the saved assessment and last synced review, then signs their PDF and snapshot with ML-DSA-65. The ZIP contains the PDF and detached proof. Online access is required to sign; a draft printout is unsigned.</Muted><Button title="Export ML-DSA signed PDF bundle" loading={busy} disabled={waiting} onPress={()=>{void run();}}/><Button secondary title="Verify a report bundle" onPress={()=>router.push('/verify-report')}/>{!!notice&&<Txt accessibilityRole="alert">{notice}</Txt>}</View>;
}
