import {cors,json,requestContext,failure} from '../_shared/http.ts';
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{const {client,body}=await requestContext(req);
 if(body.operation==='create'){
  const p=body.payload,allowed=['name','category','registration','bank_reference','contact','tax_reference','branch_code'];
  if(typeof body.request_id!=='string'||!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!allowed.includes(k))||allowed.some(k=>typeof p[k]!=='string'))throw Error('BODY');
  const insert={id:body.request_id,workspace_id:body.wid,...Object.fromEntries(allowed.map(k=>[k,p[k].trim()]))};
  const created=await client.from('suppliers').insert(insert).select('id').single();
  if(!created.error)return json(created.data);
  if(created.error.code==='23505'){
   const existing=await client.from('suppliers').select('*').eq('id',body.request_id).eq('workspace_id',body.wid).maybeSingle();
   if(!existing.error&&existing.data&&allowed.every(k=>existing.data[k]===p[k].trim()))return json({id:existing.data.id});
  }
  throw Error('CREATE');
 }
 if(body.operation!=='supplier')throw Error('BODY');
 const {data,error}=await client.rpc('apply_workflow_operation',body);if(error)throw Error('CHANGE');return json(data);}catch(e){return failure(e);}
});
