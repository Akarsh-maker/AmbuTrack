export function configured(settings){return settings.enabled===true&&['apiKey','authDomain','projectId','appId'].every(k=>typeof settings.config?.[k]==='string'&&settings.config[k].trim().length>0);}
export function isGoogleUser(user){return !!user&&!user.isAnonymous&&user.providerData?.some(p=>p.providerId==='google.com');}
export async function loadSDK(){
  const [app,auth,firestore]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js')
  ]);return {...app,...auth,...firestore};
}
export async function createFirebaseSession(settings,{sdkLoader=loadSDK}={}){
  if(!configured(settings))throw Error('Firebase web configuration is missing or disabled.');
  const sdk=await sdkLoader();
  const app=sdk.getApps?.().length?sdk.getApp():sdk.initializeApp(settings.config);
  const auth=sdk.getAuth(app);
  await sdk.setPersistence(auth,sdk.browserLocalPersistence);
  await auth.authStateReady();
  return {sdk,app,auth};
}
export function signInGoogle(session,{useExisting=false}={}){
  const {sdk,auth}=session,provider=new sdk.GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  // Linking upgrades an old anonymous UID so its existing Firestore data survives.
  if(auth.currentUser?.isAnonymous&&!useExisting)return sdk.linkWithPopup(auth.currentUser,provider);
  return sdk.signInWithPopup(auth,provider);
}
export function authErrorMessage(error){
 const messages={
  'auth/popup-closed-by-user':'The sign-in window was closed. Click Continue with Google to try again.',
  'auth/cancelled-popup-request':'A sign-in window is already open. Complete it or try again.',
  'auth/popup-blocked':'Your browser blocked the Google window. Allow pop-ups for this site, then try again.',
  'auth/unauthorized-domain':'This website is not authorized yet. Add its hostname under Firebase Authentication → Settings → Authorized domains.',
  'auth/operation-not-allowed':'Google sign-in is not enabled for this Firebase project. Enable it under Authentication → Sign-in method.',
  'auth/configuration-not-found':'Firebase Authentication needs to be set up for this project. Enable the Google provider in Firebase Console.',
  'auth/network-request-failed':'Could not reach Google or Firebase. Check your connection and try again.',
  'auth/invalid-api-key':'Firebase rejected this project’s web API key. Check the project configuration.',
  'auth/credential-already-in-use':'This Google account already has an AmbuTrack workspace. Use the button below to open it; your guest workspace will not be merged or deleted.',
  'auth/account-exists-with-different-credential':'This email already uses a different sign-in method. Link Google to that account in Firebase before continuing.',
  'auth/web-storage-unsupported':'Your browser is blocking sign-in storage. Allow site storage and try again.',
  'permission-denied':'Signed in, but Firestore denied access. Publish the supplied firestore.rules for this Firebase project.',
  'unavailable':'Firestore is unavailable. Check your connection and try again.'
 };
 return messages[error?.code]||'Could not complete the connection. Please try again. If this continues, check the Firebase project setup.';
}
