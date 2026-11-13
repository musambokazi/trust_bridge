// Validate the central directory before allocating decompressed buffers.
export function readBundle(bytes:Uint8Array,unzip:(bytes:Uint8Array)=>Record<string,Uint8Array>,decode:(bytes:Uint8Array)=>string){
 if(bytes.length<22||bytes.length>6_000_000)throw Error('Invalid bundle size');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0||view.getUint16(end+4,true)!==0||view.getUint16(end+6,true)!==0)throw Error('Unsupported ZIP');
 const count=view.getUint16(end+10,true),offset=view.getUint32(end+16,true);if(count<2||count>5||offset>=end)throw Error('Unsupported bundle directory');
 let at=offset,total=0;const names=new Set<string>();
 for(let i=0;i<count;i++){
  if(at+46>end||view.getUint32(at,true)!==0x02014b50||view.getUint16(at+10,true)!==0||view.getUint16(at+8,true)&1)throw Error('Only uncompressed report bundles are supported');
  const size=view.getUint32(at+24,true),packed=view.getUint32(at+20,true),nameLen=view.getUint16(at+28,true),extra=view.getUint16(at+30,true),comment=view.getUint16(at+32,true);
  if(size!==packed||size>5_000_000||at+46+nameLen+extra+comment>end)throw Error('Invalid bundle entry');
  const name=decode(bytes.slice(at+46,at+46+nameLen));if(!['report.pdf','proof.json','README.txt'].includes(name)||names.has(name))throw Error('Unexpected bundle contents');if(name==='proof.json'&&size>500000)throw Error('Oversized report proof');
  const local=view.getUint32(at+42,true);
  if(local+30>offset||view.getUint32(local,true)!==0x04034b50||view.getUint16(local+8,true)!==0||view.getUint16(local+6,true)&1)throw Error('Invalid local ZIP header');
  const localName=view.getUint16(local+26,true),localExtra=view.getUint16(local+28,true);
  if(local+30+localName+localExtra+packed>offset||decode(bytes.slice(local+30,local+30+localName))!==name)throw Error('Conflicting ZIP entry');
  names.add(name);total+=size;at+=46+nameLen+extra+comment;
 }
 if(total>5_500_000||!names.has('report.pdf')||!names.has('proof.json'))throw Error('Invalid report contents');
 const files=unzip(bytes);if(!files['report.pdf']||!files['proof.json']||files['proof.json'].length>500000)throw Error('Invalid report proof');
 // Local headers can disagree with a central directory in a malicious ZIP.
 if(Object.entries(files).some(([name,value])=>!names.has(name)||value.length>5_000_000)||Object.values(files).reduce((n,v)=>n+v.length,0)>5_500_000)throw Error('Invalid expanded report');
 let binary='';for(const byte of files['report.pdf'])binary+=String.fromCharCode(byte);
 return {...JSON.parse(decode(files['proof.json'])),pdfBase64:btoa(binary)};
}
