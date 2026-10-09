import { firebaseSettings } from './firebase-config.js';
import { createFirebaseSession, isGoogleUser, signInGoogle, authErrorMessage } from './firebase-client.js';
const button=document.querySelector('#google-signin'),status=document.querySelector('#auth-status'),label=document.querySelector('#signin-label'),retry=document.querySelector('#auth-retry'),existing=document.querySelector('#existing-account');
let session=null,busy=false;
function message(text,kind=''){status.textContent=text;status.className='auth-status '+kind;}
async function prepare(){
 button.disabled=true;retry.hidden=true;message('Preparing secure sign-in…');
 try{session=await createFirebaseSession(firebaseSettings);if(isGoogleUser(session.auth.currentUser)){location.replace('index.html');return;}button.disabled=false;message(session.auth.currentUser?.isAnonymous?'Sign in to upgrade your guest workspace and keep its saved data.':'Use your Google account to open your workspace.');}
 catch(error){message(authErrorMessage(error),'error');retry.hidden=false;}
}
async function signIn(useExisting=false){
 if(!session||busy)return;busy=true;button.disabled=true;existing.disabled=true;label.textContent='Opening Google…';message('Complete sign-in in the Google window.');
 try{const result=await signInGoogle(session,{useExisting});if(!isGoogleUser(result.user))throw Error('Google sign-in did not complete.');message('Signed in. Opening your workspace…','success');location.replace('index.html');}
 catch(error){message(authErrorMessage(error),'error');existing.hidden=error.code!=='auth/credential-already-in-use';}
 finally{busy=false;button.disabled=false;existing.disabled=false;label.textContent='Continue with Google';}
}
button.addEventListener('click',()=>signIn());existing.addEventListener('click',()=>signIn(true));retry.addEventListener('click',prepare);void prepare();
