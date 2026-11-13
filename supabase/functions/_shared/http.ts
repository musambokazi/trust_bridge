import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
export const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
export const json=(value: unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function requestContext(req: Request) {
 if(req.method!=='POST') throw Error('METHOD');
 if(Number(req.headers.get('content-length')??0)>24000) throw Error('BODY');
 const auth=req.headers.get('authorization');if(!auth?.startsWith('Bearer '))throw Error('AUTH');
 const url=Deno.env.get('SUPABASE_URL')!, key=Deno.env.get('SUPABASE_ANON_KEY')!;
 const client=createClient(url,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.auth.getUser();if(error||!data.user?.email_confirmed_at)throw Error('AUTH');
 const text=await req.text();if(text.length>24000)throw Error('BODY');
 const body=JSON.parse(text);if(!body||Array.isArray(body)||typeof body!=='object')throw Error('BODY');
 return {client,body,user:data.user};
}
export function failure(e: unknown){ const message=e instanceof Error?e.message:'';return json({error:message==='AUTH'?'A confirmed sign-in is required.':message==='METHOD'?'POST required.':message==='BODY'?'Invalid request body.':'Request could not be completed. Check permissions, two-factor authentication and sync status.'},message==='AUTH'?401:message==='METHOD'?405:400); }
