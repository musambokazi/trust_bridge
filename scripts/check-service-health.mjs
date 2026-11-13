// Anonymous availability/guard checks only. Never fetch business records or log keys.
const base='https://pbyquxpeizkumucvpcdk.supabase.co';
const key='sb_publishable_RVQclGRtjBKEjyQMTTF7Lw_h7ye8hL9';
const health=await fetch(base+'/auth/v1/health',{headers:{apikey:key},signal:AbortSignal.timeout(20000)});
if(!health.ok)throw Error('Authentication service health check failed: '+health.status);
for(const name of ['check-invoice','manage-suppliers','get-assessment','sign-report','account-controls']){
 const r=await fetch(base+'/functions/v1/'+name,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(20000)});
 if(r.status!==401)throw Error('Unauthenticated guard check failed for '+name+': '+r.status);
}
console.log('PASS: Auth service reachable; all protected Edge Functions reject unauthenticated requests.');
