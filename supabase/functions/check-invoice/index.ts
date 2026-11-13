import {cors,json,requestContext,failure} from '../_shared/http.ts';
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{const {client,body}=await requestContext(req);const {data,error}=await client.rpc('assess_invoice',body);if(error)throw Error('CHECK');return json(data);}catch(e){return failure(e);}
});
