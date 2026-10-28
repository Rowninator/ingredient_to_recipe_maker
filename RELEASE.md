# Release checklist: Pantry Match for Android

Goal: a signed `.aab` in Google Play **internal testing**, installed on the learner's phone from Play. Plan and reasons: `ANDROID.md` (steps 8–11). Each item names who does it. ☐ = to do, ☑ = done.

## 1. App identity
- ☑ App ID `io.github.rowninator.pantrymatch`. This is permanent once uploaded (`capacitor.config.json`, `android/app/build.gradle`).
- ☑ App name "Pantry Match" (`android/app/src/main/res/values/strings.xml`).
- ☐ **Learner:** `versionCode 1`, `versionName "1.0"` (`android/app/build.gradle`) for the first upload. **Every later upload needs a higher `versionCode`**, or Play rejects it.

## 2. Icon and launch screen
- ☑ **Learner:** create the icon in Android Studio (done 2026-10-28).
  - Open `android/` in Android Studio, right-click `app` → **New → Image Asset** → **Launcher Icons (Adaptive and Legacy)**.
  - Foreground layer: Asset type **Image**, path `design/icon-foreground.svg`. Leave Resize at 100%: the SVG is already padded so the leaf sits inside the safe-zone circle.
  - Background layer: **Color** `#16B96B` (the header logo's green, `--pm-logo`).
  - Options: Legacy icon **Yes**, Round icon **Yes**. Monochrome (themed icon): the same SVG.
  - Click **Next**, then **Finish**. It replaces Capacitor's default icon in every size.
- ☑ Launch screen: Android shows the app icon on the page background (`#FBFAF5` light, `#111614` dark). This is set in `values/styles.xml` plus `values/` and `values-night/splash.xml`, so it picks up the new icon automatically.
- ☑ **Claude:** after the icon is made, check the launcher, the launch screen (light and dark) and Settings → Apps in the emulator (passed 2026-10-28, `ANDROID.md` step 9).

## 3. Privacy policy
- ☑ `privacy.html` is built by Vite as a second page (`vite.config.js`). `build.test.js` checks it's in both builds.
- ☑ It's linked from the app and site footer ("Privacy policy"). In the app it opens the packaged copy, so it works offline, and Back returns to the main screen.
- ☑ Contact email: rowninator@gmail.com (`build.test.js` checks it is no longer the placeholder).
- ☐ Public URL for Play Console: `https://rowninator.github.io/ingredient_to_recipe_maker/privacy.html`. It goes live when `main` is pushed (step 11, after the security gate). Open it in a browser before pasting it into Play.

## 4. Upload key (keystore)
- ☐ **Learner** (Claude never sees the passwords): in Android Studio, **Build → Generate Signed App Bundle or APK → Android App Bundle → Create new…**
  - **Key store path:** `C:\Users\jadee\keys\pantry-match-upload.jks`. This is **outside the repo**; never put it in the project folder.
  - Set a strong store password and key password, with alias `upload` and validity 25 years or more. Fill in at least the first and last name in the certificate.
  - Save both passwords in a password manager. Don't type them into chat, a file or a commit.
  - **Back up the `.jks` file** somewhere other than this computer (an encrypted cloud folder or a USB drive). If it's lost, Google can reset the upload key, but that takes a support request and waiting ([Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)).
  - Leave "Remember passwords" **unticked**. There's no `keystore.properties`: the passwords are typed into the wizard for each release.
- ☑ Play App Signing: Google creates and holds the **app signing key** for new apps. Our key is only the **upload key**.
- ☑ Kept out of git by the `*.jks`, `*.keystore`, `keystore.properties` and `android/app/release/` ignores (`.gitignore`). Check 1 of the step 10 gate also searches for the keystore.

## 5. Build the release bundle (step 11, after the gate)
- ☐ **Claude:** `npm test`, `cd worker && npm test`, then `npm audit`. The `uuid` finding is accepted in `ANDROID.md`; anything new is reported.
- ☐ **Claude:** `npm run android`, so `android/` has a fresh `dist-android/` build.
- ☐ **Learner:** **Build → Generate Signed App Bundle** → the keystore above → **release**. The output is `android/app/release/app-release.aab`, which is git-ignored.
- ☑ Release builds have WebView debugging **off** (Capacitor's default when the build isn't debuggable), so `chrome://inspect` can't see the Play-installed app. That's why gate check 2 runs on the **debug build of the same commit**.

## 6. Play Console (learner)
- ☐ A developer account (personal accounts made after 13 Nov 2023 need a 12-tester, 14-day closed test only before **production**, not for internal testing).
- ☐ **Create app:** name "Pantry Match", default language, **App**, **Free**. Accept the declarations yourself.
- ☐ **App content:**
  - Privacy policy URL (section 3).
  - Ads: **No**.
  - App access: **all functionality is available without special access**.
  - Content rating questionnaire.
  - Target audience: **13+ or older**. Choosing under 13 brings in the Families policy, which this release doesn't plan for.
  - News, government, financial and health declarations: **No**.
- ☐ **Data safety:** not required while the app is only on internal testing ([Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)). Draft answers for later tracks:
  - The ingredient list is **collected and shared** (it's sent off the device to the Worker and to Google's Gemini API) for **app functionality**.
  - It is not linked to identity.
  - It's sent over HTTPS.
  - Users choose when to send it.
  - Deleting it from the app deletes it on the device.
- ☐ **Internal testing:**
  - Create a release and upload the `.aab`.
  - Release notes: "First test build".
  - Add a tester email list that includes your own Google account.
  - Save and publish, then open the **opt-in link** on your phone and install from Play.

## 7. Before upload: security gate (ANDROID.md step 10)
All four, in order:
1. **Claude:** no key, keystore or keystore password in the code or git history.
2. **Learner:** check the debug build's traffic in `chrome://inspect`; the key never appears.
3. REVIEW.md covers the app's address and the keystore.
4. The mentor approves REVIEW.md.

## 8. After install (step 11)
- ☐ **Learner + Claude**, on the phone, installed from Play:
  - the launcher icon and launch screen;
  - add items, then close and reopen (the pantry is kept);
  - Suggest with AI (real recipes);
  - every Back case;
  - the privacy link;
  - dark mode.
