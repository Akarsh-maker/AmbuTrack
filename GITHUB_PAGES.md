# Publish AmbuTrack on GitHub Pages

The complete application and a test/deploy workflow are included in this repository.

## One-time activation

1. Open [Settings → Pages](https://github.com/Akarsh-maker/AmbuTrack/settings/pages).
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open [Actions](https://github.com/Akarsh-maker/AmbuTrack/actions), choose **Test and deploy AmbuTrack**, then **Run workflow** on `main`. If the first push ran before Pages was enabled, re-run that failed workflow after enabling Pages.

The workflow runs all 20 automated tests, uploads only `dist/`, and deploys it. Subsequent pushes to `main` deploy automatically after tests pass.

Expected address after the first successful deployment:

**https://akarsh-maker.github.io/AmbuTrack/**

Sign-in page: **https://akarsh-maker.github.io/AmbuTrack/login.html**

## Firebase sign-in

In the `ambu-track-8da6c` Firebase project, add **akarsh-maker.github.io** to **Authentication → Settings → Authorized domains**. Enter only the hostname, without `https://` or `/AmbuTrack/`.

Google sign-in must be enabled and the included `firestore.rules` published. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md). Browser login still needs live verification after these console settings are complete.

The supplied Firebase web config is public client configuration. No service-account key, GitHub token or private credential is included. Firebase authorization is enforced by the included per-user Google-authenticated database rules once those rules are deployed.

## Notes

- HTML, CSS, JavaScript and links use relative paths, so the `/AmbuTrack/` project subpath is supported.
- `dist` is the deployable website. Tests, Python launcher and docs stay in the source repository.
- The workflow's normal GitHub token cannot perform initial Pages enablement. The repository owner must enable Pages in Settings; no access token or secret is needed for normal deployments.
- The separate ChatGPT Sites copy is unchanged by pushes to this repository. GitHub Pages will be a public site backed by Google sign-in, with isolated user workspaces.
