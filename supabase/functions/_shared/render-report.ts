import {PDFDocument,rgb} from 'npm:pdf-lib@1.17.1';
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1';
import {regularFont,boldFont} from './font-data.ts';
import {fromBase64} from './integrity.ts';
// Server-rendered report: no client-supplied HTML/PDF is ever signed.
export async function renderReport(context: Record<string,unknown>, keyId: string){
 const a=context.assessment as Record<string,unknown>,review=context.review as Record<string,unknown>|null;
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);const regular=await doc.embedFont(fromBase64(regularFont),{subset:true}),bold=await doc.embedFont(fromBase64(boldFont),{subset:true});
 const available=new Set(regular.getCharacterSet());
 const clean=(x:unknown)=>Array.from(String(x??'Not recorded'),c=>c==='\n'||available.has(c.codePointAt(0)!)?c:'[U+'+c.codePointAt(0)!.toString(16).toUpperCase()+']').join('');
 let page=doc.addPage([595,842]),y=790;
 const next=()=>{page=doc.addPage([595,842]);y=790;};
 function line(text:unknown,heading=false){
  const font=heading?bold:regular,size=heading?13:10,max=495;
  const words=clean(text).replace(/\n/g,' \n ').split(' ');let row='';
  function emit(){if(y<60)next();page.drawText(row,{x:50,y,size,font,color:rgb(.06,.065,.07)});y-=heading?22:15;row='';}
  for(const word of words){if(word==='\n'){emit();continue;}const chunks=word.match(/.{1,75}/g)??[''];for(const part of chunks){if(font.widthOfTextAtSize((row?row+' ':'')+part,size)>max)emit();row+=(row?' ':'')+part;}}
  if(row)emit();y-=5;
 }
 page.drawRectangle({x:0,y:810,width:595,height:32,color:rgb(.06,.065,.07)});page.drawRectangle({x:0,y:810,width:8,height:32,color:rgb(1,.5,.2)});
 line('trustbridge. | Signed review report',true);line(context.workspaceName);line('Report ID: '+context.id);line('Generated (UTC): '+context.issuedAt);line('Assessment ID: '+a.id);
 line('Risk: '+({low:'Low Concern',clear:'Low Concern',review:'Review Required',elevated:'Elevated Concern'}[String(a.riskTier??a.level)]??'Review Required'),true);line(a.recommendedAction??'Independently confirm details through a trusted contact.');
 line('Invoice '+a.invoiceNumber+' | '+a.supplierName+' | ZAR '+Number(a.amount).toFixed(2));
 const comparison=a.comparison as {supplierVersion:number;rows:{label:string;reference:string;invoice:string;matches:boolean|null}[]}|undefined;
 if(comparison){line('Immutable supplier reference version '+comparison.supplierVersion,true);for(const row of comparison.rows)line(row.label+': saved '+row.reference+' | invoice '+row.invoice+' | '+(row.matches===null?'Not compared':row.matches?'Match':'Different'));}
 else line('No complete baseline snapshot is available for this assessment.');
 line('Findings',true);for(const finding of (a.findings??[]) as {title:string;detail:string}[])line(finding.title+': '+finding.detail);
 line('Last synced review',true);if(review){line('Status: '+review.status+' | Version: '+review.version+' | Saved: '+review.updated_at);line('Reviewer account: '+review.user_id);for(const key of ['contact_checked','documents_checked','discrepancies_resolved'])line(key.replaceAll('_',' ')+': '+(review[key]?'Checked':'Not checked'));if(context.notesIncluded){line('Reviewer notes (included by request)',true);line(review.notes??'');}}
 else line('No synced review is available.');
 line('Integrity and limits',true);line('This PDF is included in a detached ML-DSA-65 signed bundle. Verify the bundle and this PDF together using the trusted key registry. A signature proves the signed bytes have not changed; it does not verify supplier legitimacy or authorise payment.');
 line('Public key fingerprint: '+keyId);line('Notes omitted unless explicitly selected. This is a point-in-time server record. Later reviews and supplier changes are not included.');
 doc.getPages().forEach((p,i)=>p.drawText(`TrustBridge | Page ${i+1} of ${doc.getPageCount()}`,{x:50,y:25,size:9,font:regular,color:rgb(.4,.4,.4)}));
 return await doc.save();
}
