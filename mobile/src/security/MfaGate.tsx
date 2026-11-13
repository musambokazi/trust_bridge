import React,{useEffect,useState} from 'react';import {ActivityIndicator,StyleSheet,View} from 'react-native';import {router,usePathname} from 'expo-router';import {useAuth} from '../backend/AuthState';import {supabase} from '../backend/client';import {color as c} from '../theme';
export function MfaGate({children}:{children:React.ReactNode}){const {session}=useAuth(),path=usePathname();const [checked,setChecked]=useState(''),[required,setRequired]=useState(false);
 useEffect(()=>{let active=true;if(!session){setRequired(false);setChecked('');return;}void supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({data,error})=>{if(active){setRequired(!error&&data?.nextLevel==='aal2'&&data.currentLevel!=='aal2');setChecked(session.access_token);}}).catch(()=>{if(active)setChecked(session.access_token);});return()=>{active=false;};},[session?.access_token]);
 const safe=['/two-factor','/sign-in','/auth-callback'].includes(path);
 useEffect(()=>{if(session&&checked===session.access_token&&required&&!safe)router.replace('/two-factor');},[checked,required,safe,session?.access_token]);
 const blocked=!!session&&!safe&&(checked!==session.access_token||required);
 // Preserve the mounted navigator and its current route across token refresh.
 // The opaque overlay prevents interaction while assurance is checked.
 return <View style={{flex:1}}>{children}{blocked&&<View style={[StyleSheet.absoluteFill,{backgroundColor:c.bg,alignItems:'center',justifyContent:'center'}]}><ActivityIndicator color={c.orange}/></View>}</View>;
}
