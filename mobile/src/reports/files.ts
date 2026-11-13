import {Platform} from 'react-native';
import {Directory,File,Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
export async function sharePrivateFile(bytes:Uint8Array,name:string,mime:string){
 if(Platform.OS==='web'){
  const blob=new Blob([new Uint8Array(bytes)],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);return;
 }
 if(!await Sharing.isAvailableAsync())throw Error('File sharing is unavailable on this device.');
 const dir=new Directory(Paths.cache,'review-exports');dir.create({idempotent:true,intermediates:true});
 for(const entry of dir.list())if(entry instanceof File){const stamp=Number(entry.name.split('-')[0]);if(stamp>0&&Date.now()-stamp>3600000){try{entry.delete();}catch{/* Next export retries cleanup. */}}}
 const file=new File(dir,Date.now()+'-'+name);file.write(bytes);
 await Sharing.shareAsync(file.uri,{mimeType:mime,dialogTitle:'Share TrustBridge file'});
}
