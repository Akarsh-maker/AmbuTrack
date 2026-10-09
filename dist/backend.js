import { validateState } from './state.js';
const LOCAL_KEY='ambutrack-state-v2';
import { configured, loadSDK, createFirebaseSession, isGoogleUser } from './firebase-client.js';
export { configured } from './firebase-client.js';
export async function openBackend(settings,seed,{sdkLoader=loadSDK,storage=globalThis.localStorage,session=null}={}){
  validateState(seed);
  if(!configured(settings)){
    if(settings.enabled)throw Error('Firebase is enabled but its web configuration is incomplete.');
    let state=seed;let recoveryWarning='';
    try{const raw=storage?.getItem(LOCAL_KEY);if(raw)state=validateState(JSON.parse(raw));}catch{recoveryWarning='Previous local data could not be loaded; demo defaults are shown.';}
    return {mode:'local',state,recoveryWarning,async save(next){validateState(next);if(!storage)throw Error('Browser storage is unavailable.');storage.setItem(LOCAL_KEY,JSON.stringify(next));}};
  }
  const {sdk,app,auth}=session||await createFirebaseSession(settings,{sdkLoader});
  const user=auth.currentUser;
  if(!isGoogleUser(user)){const error=Error('Google sign-in is required.');error.code='ambutrack/auth-required';throw error;}
  const db=sdk.getFirestore(app),ref=sdk.doc(db,'users',user.uid,'ambutrack','state');
  // Seed only once. Transactions prevent two tabs from replacing existing data.
  const loaded=await sdk.runTransaction(db,async tx=>{
    const snap=await tx.get(ref);
    if(snap.exists())return snap.data();
    const first={revision:0,state:seed,mutationId:'seed',updatedAt:sdk.serverTimestamp()};tx.set(ref,first);return first;
  });
  if(!isGoogleUser(auth.currentUser)||auth.currentUser.uid!==user.uid){const error=Error('Your sign-in session changed.');error.code='ambutrack/auth-required';throw error;}
  validateState(loaded.state);let revision=loaded.revision;
  if(!Number.isInteger(revision)||revision<0)throw Error('Invalid Firebase state revision.');
  return {mode:'firebase',uid:user.uid,state:loaded.state,async save(next){
    if(!isGoogleUser(auth.currentUser)||auth.currentUser.uid!==user.uid){const error=Error('Your sign-in session changed. Sign in again before saving.');error.code='ambutrack/auth-required';throw error;}
    validateState(next);const expected=revision;
    const mutationId=globalThis.crypto.randomUUID();
    const result=await sdk.runTransaction(db,async tx=>{
      const snap=await tx.get(ref),current=snap.exists()?snap.data():null;
      if(!current||current.revision!==expected){const error=Error('Another tab changed this workspace. Reload to use the latest cloud copy.');error.code='ambutrack/conflict';throw error;}
      tx.set(ref,{revision:expected+1,state:next,mutationId,updatedAt:sdk.serverTimestamp()});return expected+1;
    });revision=result;
  }};
}
// Serialize writes so an older snapshot can never arrive after a newer one.
export function createSaveQueue(save,onStatus){
  let pending=null,running=false,failed=false;
  async function flush(){
    if(running||failed||!pending)return;
    running=true;
    while(pending&&!failed){const current=pending;pending=null;onStatus('saving');try{await save(current);onStatus('saved');}catch(error){pending=pending||current;failed=true;onStatus('error',error);}}
    running=false;
  }
  return {enqueue(state){pending=JSON.parse(JSON.stringify(state));void flush();},retry(){failed=false;void flush();},async drain(){while(running||pending){if(failed)throw Error('Changes could not be saved. Retry the save before signing out.');await new Promise(resolve=>setTimeout(resolve,25));}},get unsaved(){return running||!!pending;}};
}
