import {cors,json,requestContext,failure} from '../_shared/http.ts';
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{const {client,body}=await requestContext(req);if(typeof body.id!=='string')throw Error('BODY');const {data,error}=await client.from('assessments').select('result').eq('id',body.id).single();if(error||!data) return json({error:'Assessment unavailable'},404);return json(data.result);}catch(e){return failure(e);}
});
