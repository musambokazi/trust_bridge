import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {cors,json,requestContext,failure} from '../_shared/http.ts';
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{const {client,body,user}=await requestContext(req);
 if(body.action!=='delete'||body.confirmation!=='DELETE MY ACCOUNT'||typeof body.password!=='string'||body.password.length>1024)throw Error('BODY');
 const allowed=await client.rpc('account_data',{wid:null,delete_check:true});if(allowed.error||allowed.data?.user_id!==user.id)throw Error('DENIED');
 const verifier=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const reauth=await verifier.auth.signInWithPassword({email:user.email!,password:body.password});
 body.password='';
 if(reauth.error||reauth.data.user?.id!==user.id)throw Error('AUTH');
 // Revoke the temporary reauthentication session. No session or password is returned.
 await verifier.auth.signOut({scope:'local'});
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const avatar=await admin.storage.from("avatars").remove([user.id+"/avatar.jpg"]);if(avatar.error)throw Error("DELETE");
 const remove=await admin.auth.admin.deleteUser(user.id);if(remove.error)throw Error('DELETE');
 return json({deleted:true});
 }catch(e){return failure(e);}
});
