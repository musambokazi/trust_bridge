import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { saveRegistrationWorkspace } from "../src/backend/saveRegistrationWorkspace.ts";
import type { AccountDraft } from "../src/backend/types.ts";
const draft: AccountDraft['workspace'] = { kind:'individual',name:'Account holder',country:'South Africa',email:'test@example.invalid',phone:'+27820000000',registration:'',tax_number:'',address:'',contact_name:'Account holder',contact_role:'',alternate_email:'',alternate_phone:'',industry:'',offering:'' };
for (const scenario of ['new','retry','concurrent'] as const) test(`workspace registration ${scenario} preserves identity and avoids conflicting upsert`,async()=>{
 const calls: string[]=[];let exists=scenario==='retry';
 const client=createClient('https://test.example.invalid','test-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
   const url=new URL(String(input));const method=init?.method??'GET';calls.push(method);
   assert.equal(url.searchParams.has('on_conflict'),false);
   assert.equal(url.searchParams.get('owner_id'),method==='POST'?null:'eq.owner');
   let body:unknown=exists?[{id:'original'}]:[];let status=200;
   if(method==='POST'){
     assert.equal(JSON.parse(String(init?.body)).owner_id,'owner');
     if(scenario==='concurrent'){exists=true;status=409;body={code:'23505',message:'Already created'};}
     else{exists=true;status=201;body=null;}
   }
   if(method==='PATCH'){
     assert.equal(url.searchParams.get('id'),'eq.original');
     assert.equal(JSON.parse(String(init?.body)).id,undefined);
     body={id:'original'};
   }
   return new Response(body===null?null:JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
 }}});
 const result=await saveRegistrationWorkspace(client,'owner',draft);assert.equal(result.error,null);
 assert.deepEqual(calls,scenario==='new'?['GET','POST']:scenario==='retry'?['GET','PATCH']:['GET','POST','GET','PATCH']);
});
