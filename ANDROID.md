# Level 5: Android App (plan)

Approved 2026-10-26. Pantry Match is packaged as an Android app with Capacitor and released to Google Play internal testing. The page code and the app's logic stay the same as in Level 4.

## Decisions

- **App ID:** `io.github.rowninator.pantrymatch`. It's permanent once a build is uploaded to Play.
- **Release target:** a signed `.aab` uploaded to Google Play internal testing (needs a Play developer account).
- **The learner writes** the back-navigation function (Claude writes failing tests first; hints only). Claude writes everything else.
- **Java:** use the JDK bundled with Android Studio if the Capacitor version from step 2 supports it, rather than a separate install. The Java 8 on this machine is too old and isn't used.
- **Versions:** pinned exactly, at least two weeks old, like Level 4.

## Security gate (Level 5)

The Level 3 gate applies again, at two points:

- **Before the Worker is redeployed (step 5):** the key search is re-run, REVIEW.md is updated for the app's address (see step 5), and the learner's mentor approves it.
- **Before any build is uploaded (step 10):** all four items, with the Level 5 changes:
  1. Claude confirms the API key is not in the code or git history, and the file holding it is in `.gitignore`. Claude also confirms the keystore and its passwords are not in the code or git history.
  2. The learner inspects the installed app's traffic through Chrome's remote inspection (`chrome://inspect`) and confirms the key never appears.
  3. REVIEW.md covers the app's address and the keystore (where it lives, who has the passwords, what happens if it's lost).
  4. The learner confirms the mentor approved REVIEW.md.

## Research decisions (step 2, 2026-10-26)

Done by a subagent. Claude re-checked the versions, the audit status and the back-button source.

- **Versions:** `@capacitor/core`, `@capacitor/cli` and `@capacitor/android` 8.5.3 (2026-10-07), and `@capacitor/app` 8.1.2 (2026-10-02). They're compatible: android needs core `^8.5.0`, app needs core `>=8.0.0`, and the CLI needs Node 22 or newer (this machine and the workflow use 24.18.0). Capacitor 9 is still alpha. [Releases](https://github.com/ionic-team/capacitor/releases/tag/8.5.3)
- **Tooling:**
  - Android Studio Otter 2025.2.1 or newer, plus the Android 16 (API 36) SDK Platform. The template defaults are minSdk 24, compileSdk 36 and targetSdk 36. [Environment setup](https://capacitorjs.com/docs/getting-started/environment-setup), [Updating to 8](https://capacitorjs.com/docs/updating/8-0)
  - Capacitor 8 compiles with Java 21. Android Studio's bundled JDK (`jbr`) provides it, so nothing else is installed. [Capacitor build.gradle](https://github.com/ionic-team/capacitor/blob/8.5.3/android/capacitor/build.gradle)
  - Terminal builds (`npx cap run`, `gradlew`) use `JAVA_HOME`, so it is pointed at Android Studio's `jbr` folder. Step 3 checks `jbr\bin\java -version`. [Java versions in Android builds](https://developer.android.com/build/jdks)
  - **Changed in step 3 (2026-10-26):** the installed Android Studio (Rabbit 2026.2.1) bundles Java 25. Capacitor 8.5.3's Gradle 8.14.3 can't run on Java 25 (support starts at Gradle 9.1.0, see the [Gradle compatibility table](https://docs.gradle.org/current/userguide/compatibility.html)). The learner chose to download Java 21 through Android Studio's own "Download JDK…" (it goes into `C:\Users\jadee\.jdks`). `JAVA_HOME` and Studio's Gradle JDK both point to it, and Capacitor's Gradle and AGP versions stay unchanged. Studio's API 37 emulator is kept, and the API 36 SDK Platform is added for compileSdk 36.
- **App address:** the page runs at `https://localhost` (`androidScheme` `https`, `hostname` `localhost`), so `fetch()` sends `Origin: https://localhost`. This comes from the docs and source and hasn't been seen on a device yet, so it is confirmed in `chrome://inspect` before the Worker change. [Config](https://capacitorjs.com/docs/config)
- **Which Back presses reach the app:**
  - **Keyboard open:** no. The keyboard takes the press and hides itself. [InputMethodService](https://developer.android.com/reference/android/inputmethodservice/InputMethodService)
  - **The "Clear all" `confirm()` dialog open:** no. Android cancels the dialog and `confirm()` returns false, which keeps the pantry. [BridgeWebChromeClient](https://github.com/ionic-team/capacitor/blob/8.5.3/android/capacitor/src/main/java/com/getcapacitor/BridgeWebChromeClient.java)
  - **Ionic's `ionBackButton`:** not used. It fires along with the Capacitor listener, and the page has no Ionic overlays, so using both would handle one press twice. [Hardware back button](https://ionicframework.com/docs/developing/hardware-back-button)
  - **Everything else:** yes, once `App.addListener('backButton')` is registered. The listener fully replaces the default. Without one, Back on the main screen does nothing (from the 8.1.2 source; checked in the emulator in step 6). `canGoBack` is always false because the page has no history. [App API](https://capacitorjs.com/docs/apis/app)
- **Back-button cases (approved):**
  1. An AI request is running → cancel it (the same as `resetAi()` does on a pantry change).
  2. Otherwise, the page is scrolled down → scroll to the top.
  3. Otherwise → minimize the app (`App.minimizeApp()`), which keeps its state, like Android 12+ does for a main screen.

  The function takes plain values (no Capacitor imports), so Node can test it.
- **Google Play:**
  - New apps and updates must target API 36 (Capacitor's default). [Target SDK](https://support.google.com/googleplay/android-developer/answer/11926878)
  - New apps must be uploaded as an `.aab`. [App bundles](https://developer.android.com/guide/app-bundle)
  - Play App Signing is automatic for new apps. Google holds the app signing key. We keep only the **upload key**, which Google can reset if it's lost. [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)
  - Internal testing allows up to 100 testers, who opt in through a link. It needs no Data safety form. Sending the pantry off the device counts as "collecting" data once the app moves to a wider track. [Internal testing](https://support.google.com/googleplay/android-developer/answer/9845334), [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)
  - Every app needs a privacy policy link in Play Console and in the app, so step 8 keeps it. [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311)
  - New personal accounts need a 12-tester, 14-day closed test only before production, not for internal testing. [Testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)
- **Audit finding:** the `braces` advisory was withdrawn on 2026-10-23, and `npm audit` reports 0 vulnerabilities. `vite-plugin-static-copy` 4.1.1 is still the latest release, so there's no update to take. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- **Edge-to-edge:** targeting API 36 always draws the app under the system bars. Capacitor 8's SystemBars sets `--safe-area-inset-*`, and Ionic's `--ion-safe-area-*` uses them. `viewport-fit=cover` is already set. Step 7 checks the header, the status bar icon contrast in light and dark, and any custom padding at the screen edges (which should use `var(--ion-safe-area-*)`). [System Bars](https://capacitorjs.com/docs/apis/system-bars)

## Steps

1. **Plan file.** This file, plus a pointer to it in CLAUDE.md. The learner commits.
2. **Research (subagent).** Results go into a "Research decisions" section here. Official docs are linked for each fact.
   - The newest Capacitor release at least two weeks old, with exact versions of `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` and `@capacitor/app`.
   - The Android Studio, SDK and Java versions it needs, and whether Android Studio's bundled JDK is supported.
   - The app's page address on Android (the `androidScheme` / hostname defaults), so the Worker allows the right origin.
   - **Which Back presses actually reach the app.** Check the keyboard being open, the native `confirm()` dialog used by "Clear all", Ionic overlays, and the page's own state. The function's cases are designed around the presses that do reach it, for example the Clear all confirm, an AI request running, or a page scrolled down. Presses that the system or WebView already handles are left out.
   - How `@capacitor/app`'s `backButton` event works, and what happens when a listener is added (whether the default action stops).
   - Google Play's current target SDK requirement, Play App Signing, and what internal testing needs (Data safety form, privacy policy URL).
   - Whether `vite-plugin-static-copy` has a release that fixes the `braces` audit finding (DESIGN.md, "Accepted audit finding").
3. **Learner's setup.** The learner installs Android Studio from developer.android.com, the SDK the research names, and an emulator (AVD). Claude gives the exact steps. Claude checks the Java and SDK paths only and never installs these itself.
4. **Add Capacitor.**
   - `capacitor.config` with the app ID and `webDir: "dist"`. Add the `android/` folder and commit it.
   - Add `.gitignore` entries for signing files (`*.jks`, `*.keystore`, `keystore.properties`) and local SDK paths (`local.properties`). Prove them with `git check-ignore`.
   - `npm run build` → `npx cap sync android` → run in the emulator.
   - Inside the app, `PROXY_URL` picks the deployed Worker. The web rules for `rowninator.github.io` and localhost stay as they are.
5. **Worker.**
   - Add the app's origin (expected `https://localhost`; confirmed in step 2) to the allowed sites, with a Worker test.
   - Before redeploying: Claude re-runs the key search. REVIEW.md is updated with the new address. It explains that every Capacitor app shares that address, so the site check can't tell this app from another one. The real limits on misuse are the rate limit (5 a minute per IP) and billing being off. Then the learner's mentor approves.
   - Only then does the learner redeploy (`wrangler deploy`). One real request from the emulator checks it.
6. **Back button (the learner writes it).**
   - Claude writes failing tests and an empty starting version of a small pure function (a shared ES module with no Capacitor imports, so Node can test it). It takes the app's state and returns what Back should do.
   - The cases come from step 2's research.
   - The learner writes the function. Claude wires it to `@capacitor/app`'s `backButton` event and checks every case in the emulator.
7. **Interface audit (emulator).** Screenshots are the check. Covers:
   - the status bar and edge-to-edge layout (safe areas)
   - the keyboard covering the input
   - touch targets of at least 48dp
   - TalkBack labels and reading order
   - light/dark, and 200% font size
   - no network (the AI error message)
   - rotation
   - the save note when storage fails

   Each finding is reported as issue, location, why it matters and fix, most serious first. The learner chooses which to fix.
8. **Release checklist (`RELEASE.md`).**
   - App ID, `versionCode` / `versionName`, icon and splash screen.
   - The signing keystore is kept outside the repo, with passwords not stored in git, and it is backed up. Play App Signing is used as the research describes.
   - Target SDK, Data safety answers (the pantry is sent to Google's AI through the Worker), and internal testing track setup.
   - **Privacy policy page:** a page in the Vite build (for example `privacy.html` as a second build input), so the Actions deploy publishes it at `https://rowninator.github.io/ingredient_to_recipe_maker/privacy.html`. Pages serves only the built site. A test or build check confirms it's in `dist/`.
9. **Checkpoint.** `npm test`, the Worker's tests, a key check of `dist/` and `android/`, `/code-review` in a fresh session, fixes, and a commit.
10. **Security gate.** All four items above, before any build is uploaded.
11. **Release.** Build the signed `.aab`. The learner uploads it to internal testing and installs it on their phone from Play. Claude checks it on the phone with the learner (the AI request, saving the pantry, Back).
