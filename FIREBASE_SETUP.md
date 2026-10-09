# AmbuTrack — Google sign-in and Firebase setup

The supplied Firebase web configuration is now installed and enabled for **ambu-track-8da6c**. The app includes a Google sign-in page, protected dashboard, signed-in account details, sign-out, and per-user Firestore workspaces.

**Code is configured; Firebase Console settings and a real Google sign-in still need verification.** The web configuration does not grant administrative access to enable providers or publish database rules, so those console actions were not performed by this code update.

## Firebase Console checklist

Open [this Firebase project](https://console.firebase.google.com/project/ambu-track-8da6c/overview).

1. Go to **Authentication → Sign-in method → Google**. Enable it, select the project's support email when prompted, and save.
2. Go to **Authentication → Settings → Authorized domains**. Add:
   - `akarsh-maker.github.io` for GitHub Pages
   - `ambutrack.wgamingfor.chatgpt.site` for the separate Sites copy
   - `localhost` for local development
   - Any other hostname where you deploy this app
3. Create the default **Cloud Firestore** database if it does not already exist.
4. In **Firestore → Rules**, publish the included `firestore.rules`. The updated rules require the correct UID and a Google-authenticated session. Do not leave Firestore in open test mode.

No private key, service-account JSON or Google password belongs in this website. The supplied public web config is in `dist/firebase-config.js`. The analytics measurement ID is retained, but the app does not initialize Firebase Analytics or Cloud Storage.

## User flow

1. Open the website or `login.html`.
2. Click **Continue with Google** and select an account in Google's popup.
3. Firebase restores the account's existing workspace or creates a new seeded demo workspace.
4. The dashboard shows the signed-in name/email and a **Sign out** button.
5. Sign out pauses any simulated trip and waits for its latest save before ending the Firebase session. A failed save must be resolved before sign-out to avoid discarding open changes.
6. Reloaded active trips are restored paused. The same Google account can access its workspace from another device once that device also has access to the hosted site.

The separate Sites deployment remains owner-private. GitHub Pages is published separately according to this repository’s Pages settings. Sites access and Firebase sign-in are separate gates; adding Google sign-in does not change the website's audience.

## Account isolation and older guest data

Data is stored at `users/{firebaseUid}/ambutrack/state`. The Firestore rules allow a Google-authenticated user to access only the matching UID. The dashboard also detects sign-out/account changes in other tabs and returns to the login page. Writes stop when the authenticated UID changes.

If the browser has an older anonymous Firebase session, the login page first attempts `linkWithPopup` to upgrade that identity to Google and preserve its UID/data. If that Google credential already belongs to another workspace, the page offers an explicit **Use existing Google workspace** action. That action opens the Google account's workspace; it does not merge or delete the old guest data.

Legacy browser-local history is not automatically copied into a Google account. New accounts get clean demo data; existing cloud records are preserved. This avoids accidentally importing one person's local history into another person's account.

## Backend data and saving

Each document contains `revision`, `mutationId`, `updatedAt` (server timestamp), and `state`:

| State field | Data |
|---|---|
| `schemaVersion` | `1` |
| `units` | Ambulance IDs, graph nodes, type, crew, availability |
| `hospitals` | Fictional hospital IDs, nodes, services, bed counts |
| `history` | Latest 100 completed/cancelled demo trips |
| `activeTrip` | Active request and simulation checkpoint, or null |
| `settings` | Selected locations/unit and traffic/closure toggles |

Demo records are seeded only for a missing workspace document. Saves are serialized, and Firestore transactions use revision checks to prevent stale tabs from overwriting newer data. Moving simulations checkpoint every five real seconds. Abruptly closing a tab can lose movement after the latest successful checkpoint. There is no live Firestore snapshot subscription; reload another device/tab to fetch the latest cloud version.

Save/connection errors are visible. Cloud failures do not silently switch to local storage. The old local adapter remains available for code-level offline development only by explicitly setting `enabled: false`; the supplied configuration has cloud mode enabled.

This single-document design is bounded to 20 units, 20 hospitals and 100 history entries for a small student demo, not a production emergency-service database.

## Test it

- Open the deployed sign-in page in a full browser tab, allow popups and complete Google sign-in.
- Check the About page's workspace UID against Firestore.
- Change fleet availability, wait for saving to finish and reload.
- Run a trip, wait for a checkpoint and reload; it should be paused at the saved point.
- Complete a trip and verify its history survives reload.
- Sign out and confirm the dashboard returns to Google sign-in.
- Sign in with a different account and verify it cannot access the first account's workspace.
- If another tab signs out or switches account, verify the old dashboard closes.

The automated suite currently contains 20 tests covering routing and mocked backend/authentication behaviour. It does **not** constitute a completed Google OAuth login or a live Firestore security-rules test. Browser visual testing was unavailable in the build environment.

## Troubleshooting

| Message | Action |
|---|---|
| Unauthorized domain | Add the exact deployed hostname to Firebase Auth Authorized domains |
| Google provider disabled | Enable Google in Firebase Authentication |
| Popup blocked | Allow popups, then click Continue with Google again; open the app in a full browser if embedded |
| Popup closed | Click Continue with Google again |
| Firestore permission denied | Publish the supplied rules to the correct project |
| Another tab changed workspace | Reload to use the latest cloud copy; stale changes are not overwritten onto it |

## Replacing demo records later

Edit `dist/data.js` for new workspace defaults. For an existing workspace, pause activity in all tabs before editing its Firestore state in the console, preserve schema/graph-node IDs, increment `revision`, and reload. Real geographic data also needs a valid road graph; changing hospital names alone does not make the routes real. Use fictional patient/request data in this educational demo.

## Optional CLI deployment

The included Firebase configuration can deploy the rules and static website if you install and authenticate the Firebase CLI:

```sh
firebase login
firebase deploy --only firestore:rules --project ambu-track-8da6c
firebase deploy --only hosting --project ambu-track-8da6c
```

These commands were not executed during this update. `firebase.json` also includes emulator port settings for future development; emulator connections must be explicitly added to the frontend before using them.

## Official references

- [Google sign-in with Firebase](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase web setup](https://firebase.google.com/docs/web/setup)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firestore access rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
