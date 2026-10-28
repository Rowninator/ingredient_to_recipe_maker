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
- **Before any build is uploaded (step 10):** all five items, with the Level 5 changes:
  1. Claude confirms the API key is not in the code or git history, and the file holding it is in `.gitignore`. Claude also confirms the keystore and its passwords are not in the code or git history.
  2. The learner inspects the installed app's traffic through Chrome's remote inspection (`chrome://inspect`) and confirms the key never appears.
  3. REVIEW.md covers the app's address and the keystore (where it lives, who has the passwords, what happens if it's lost).
  4. The learner confirms the mentor approved REVIEW.md.
  5. The learner confirms billing is still off for the Google project that owns the Gemini key, since allowing `https://localhost` relies on the free tier's limits (REVIEW.md).

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
- **Accepted audit finding (step 4, 2026-10-26):** after `@capacitor/cli` 8.5.3 was installed, `npm audit` reports 3 moderate findings. `uuid` below 11.1.1 is missing a buffer bounds check in v3/v5/v6 when a buffer is passed ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)). It comes in through `xcode`, the CLI's iOS project tool. The CLI only runs on this machine at build time, and we don't build for iOS. npm's only fix downgrades the CLI to 8.4.3, which wouldn't match core and android 8.5.3. The learner accepted it. Re-check before the release build (step 9).
- **Accepted audit finding (step 9, 2026-10-28), until 9 November 2026:**
  - **What:** `cd worker && npm audit` reports 1 high and 2 moderate findings, all in `undici` 7.x through `miniflare` in `wrangler` 4.149.0. They include denial of service and TLS certificate validation bypass ([GHSA-2m5v-pch6-74hx](https://github.com/advisories/GHSA-2m5v-pch6-74hx), [GHSA-4w7w-5xrc-9h26](https://github.com/advisories/GHSA-4w7w-5xrc-9h26) and others).
  - **Scope:** `wrangler` only runs on this machine (`wrangler dev`, `wrangler deploy`). The deployed Worker doesn't include `undici`.
  - **Why accepted:** the fix needs `wrangler` 4.153.0 or later, released 2026-10-26. It meets the "at least two weeks old" rule from 9 November. The learner accepted it until then. Conditions:
    1. Until then, don't run `wrangler dev` or `wrangler deploy` on public Wi-Fi.
    2. On or after 9 November, update `wrangler` to the newest version that's at least two weeks old, then rerun `cd worker && npm audit` and `npm test`.
    3. In the same change, pin every package in `worker/package.json` to an exact version (no `^`), like the root `package.json`. Commit the updated `worker/package-lock.json` with it.
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
   - **Done so far (2026-10-27):** `backAction(state)` in `back.js`, with `state` = `{ aiRunning, scrollTop }`. It returns `"cancel-ai"`, `"scroll-top"` or `"minimize"`, checked in that order. Any `scrollTop` above 0 counts as scrolled, and 0 or less counts as the top. `back.test.js` has 8 tests: 7 fail on the stub, and "doesn't change the state" passes trivially. All 8 pass against a private reference kept in the scratchpad. While they fail, the test hook reports them after every code edit, which is expected. `@capacitor/app` 8.1.2 is installed when the wiring is done.
   - **Done (2026-10-27):** the learner wrote `backAction` on their own (8/8). `@capacitor/app` 8.1.2 is installed, and Claude wired the function in `index.html`. Only the `--mode android` build loads the plugin, through a dynamic import, so the website bundle has no Capacitor code (checked). Cancel reuses `resetAi()`. Scroll-to-top uses Ionic's `scrollToTop` (no animation with reduced motion). Minimize uses `App.minimizeApp()`.
   - **Emulator checks with real Back presses, all passed:**
     - **Scrolled:** scrolls to the top and stays in the app.
     - **At the top:** the app goes to the background, and reopening it brings back the same pantry.
     - **AI running:** the loading line clears and the button resets, and nothing appears 8 s later.
     - **Keyboard open:** only the keyboard closes.
     - **"Clear all" dialog:** the dialog closes and the pantry is kept.
     - **AI running and scrolled:** three presses do cancel → scroll up → minimize.
     - No new console errors.
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
   - **Done (2026-10-27).** Checked on the API 37 emulator (411×914 CSS px).
   - **Passed:**
     - **Safe areas:** they are 24px top and bottom, and at full scroll the last line ends above the gesture bar (`.page` already pads `env(safe-area-inset-bottom)`). The `Error injecting safe area CSS` log at some launches is Capacitor setting the values before the page exists; it sets them correctly right after.
     - **Keyboard:** the input stays visible.
     - **Landscape:** no sideways scroll, and the pantry and AI cards are kept.
     - **TalkBack:** labels, headings and reading order are right (read from the accessibility tree), and the live regions announce updates.
     - **Dark mode,** including the "Clear all" dialog.
     - **200% font:** no clipped text.
     - **No network:** shows "Can't reach the AI right now…".
     - **Blocked save:** shows "Couldn't save on this device".
   - **Fixed (both chosen by the learner):**
     1. **Touch targets.** "Clear all" was 63×32 and the chips were 36 tall, below Android's 48dp ([Touch target size](https://support.google.com/accessibility/android/answer/7101858)). A mis-tap on a chip removes an item.
        - Clear all is now 48 tall, with negative margins so the heading row's layout doesn't change.
        - Each chip sits in a `.chip-tap` wrapper that holds the tap handler and adds 6px above and below (48 tall). The pill itself stays 36px, because Ionic's chip clips anything outside it.
        - The visible gap between chip rows grew from 8px to 12px.
        - Checked in the app (a tap 2px outside the pill removes the item) and on the website.
     2. **Status bar icons after a theme switch.** They stayed dark when dark mode turned on while the app was open, because Capacitor re-applies the style it chose at launch (`SystemBars.java` `handleOnConfigurationChanged`). The app build now calls `SystemBars.setStyle({ style: Default })` when `prefers-color-scheme` changes. Checked both ways in the emulator.
   - **Not covered:** spoken TalkBack output, and a camera cutout in landscape (this emulator has none).
8. **Release checklist (`RELEASE.md`).**
   - App ID, `versionCode` / `versionName`, icon and splash screen.
   - The signing keystore is kept outside the repo, with passwords not stored in git, and it is backed up. Play App Signing is used as the research describes.
   - Target SDK, Data safety answers (the pantry is sent to Google's AI through the Worker), and internal testing track setup.
   - **Privacy policy page:** a page in the Vite build (for example `privacy.html` as a second build input), so the Actions deploy publishes it at `https://rowninator.github.io/ingredient_to_recipe_maker/privacy.html`. Pages serves only the built site. A test or build check confirms it's in `dist/`.
   - **Progress (2026-10-27):**
     - **Learner's choices:** a contact email they provide, the icon made with Android Studio's Image Asset, and the upload key made in Android Studio's wizard with no passwords in any file.
     - **Done:** `privacy.html` (built in both modes, with `build.test.js`), a footer link opening the packaged copy in the app (checked in the emulator: it opens offline, and Back returns), and the launch screen set to the icon on the page background.
     - **Written:** `design/icon-foreground.svg` and `RELEASE.md`.
     - **Left for the learner:** the contact email, the icon, the keystore and its backup.
9. **Checkpoint.** `npm test`, the Worker's tests, a key check of `dist/` and `android/`, `/code-review` in a fresh session, fixes, and a commit.
   - **Re-audit on the final build (after the icon), first:** rerun step 7's checks on a fresh `npm run android` build. Show the learner a screenshot for each check. Two of them come from earlier notes:
     - **"Clear all" dialog with the emulator in dark mode.** Claude reported a light `confirm()` dialog in dark mode at the end of step 6, and step 7 recorded it as passing without showing a screenshot. Test it directly and show the screenshot.
     - **The bottom of the page at full scroll.** Step 4 saw the gesture bar overlap the bottom text and logged `Error injecting safe area CSS`. The step 8 footer link is now the last line. Show the screenshot, plus whether the log line appears at that launch.
   - Also: the launcher icon, the launch screen (light and dark) and Settings → Apps.
   - **Re-audit done (2026-10-28).** On a clean debug build with the final icon (API 37 emulator, 411×914 CSS px), with screenshots shown to the learner.
     - **Icon:** the first Image Asset run filled the whole 108dp layer, so launchers cropped the leaf. The SVG's viewBox now pads it to 60%: the farthest point is 30.5dp from the centre, inside the 33dp safe zone. The whole leaf now shows on the home screen, in the app drawer and in Settings → Apps.
     - **Launch screen:** the leaf icon on `#FBFAF5` in light mode and `#111614` in dark mode.
     - **"Clear all" dialog:** dark in dark mode, both when the app starts in dark and when dark mode turns on while the app is open. Step 6's screenshot shows the emulator was in light mode then, so Claude's step 6 "light in dark mode" report was wrong.
     - **Bottom at full scroll:** the "Privacy policy" link ends at 867 of 914 CSS px, above the 24px gesture area, at 100% and 200% font. Mid-scroll text passing under the gesture bar is normal. `Error injecting safe area CSS` didn't appear in 7 cold launches; the inset was 24px.
     - **Also passed again:**
       - keyboard (the input stays visible);
       - landscape (no sideways scroll, pantry kept);
       - touch targets: Clear all, chips and the footer link are 48 tall, Add and the input are 50;
       - accessibility tree (labels and headings);
       - 200% font (no clipped text);
       - offline message;
       - failed-save note;
       - status bar icons after a theme switch, both ways.
     - **Noted, not ours:** Settings lists "Nearby devices" under Permissions. The installed app requests `ACCESS_LOCAL_NETWORK`, which isn't in our merged manifest (only `INTERNET`), so it comes from Android 17 itself. It isn't granted. Check what the phone shows in step 11.
   - **Checkpoint (2026-10-28):**
     - **Tests:** 169 site tests and 7 Worker tests pass.
     - **Key and keystore search:** run over fresh `dist/` and `dist-android/` builds, `android/` and all of git history. No key, nothing shaped like a key, and no keystore files.
     - **Release merged manifest:** only `INTERNET` and AndroidX's own receiver permission, with no `ACCESS_LOCAL_NETWORK`.
     - **`npm audit`:** the site has only the accepted `uuid` finding. The Worker's `undici` finding is accepted until 9 November (Research decisions).
     - **`/code-review`:** run in a fresh session; 8 findings. Fixed (the learner's choice):
       1. Android backup copied the pantry off the device. Now `allowBackup="false"` plus `res/xml/data_extraction_rules.xml`, which excludes every domain from cloud backup and from phone-to-phone transfer ([Auto Backup](https://developer.android.com/identity/data/autobackup)). On the emulator, `bmgr backupnow` reports "Backup is not allowed". The phone-to-phone rules can't be tested on one emulator.
       2. `privacy.html` said no device details are sent. It now says standard connection information (IP address, and a browser identifier with the Android version and device model) comes with each request and the Worker doesn't store or log it. The Data safety draft in `RELEASE.md` matches.
       3. `build.test.js` now checks that the Android bundle calls the deployed Worker and never `localhost:8787`.
       4. The template's two example tests were deleted (one expected `com.getcapacitor.app`).
       5. The unused `FileProvider` and `file_paths.xml` were removed. Only Capacitor's camera capture through a file input uses them, and the app has none.
       6. `SystemBars.setStyle` now has a `.catch()`.
     - **Left as is:** Back during an AI request still cancels silently (the step 2 decision). The `https://localhost` origin is already accepted in REVIEW.md, and the step 10 gate now has a fifth item: the learner confirms billing is still off.
10. **Security gate.** All five items above, before any build is uploaded.
   - **Item 1, passed (2026-10-28, commit `b4f7908`, clean tree):**
     - **Key:** the API key is only in `worker/.dev.vars`, which is ignored and was never committed. It isn't in the folder, in fresh `dist/` and `dist-android/` builds, in `.wrangler`, or in any git commit or stored object, including unreachable ones. Nothing shaped like a Google key appears either.
     - **Keystore:** no keystore-type files (`.jks`, `.keystore`, `.p12`, `.pfx`, `keystore.properties`) are in the folder or any commit. The keystore itself isn't in git's object store, and no file matches it byte for byte. No signing settings or passwords are in Gradle, properties, XML or `.idea` files, or in history.
     - **Name:** the upload key was renamed to `C:\Users\jadee\keys\pantrymatch_upload.jks` (outside the repo) so the root `*.jks` ignore covers it.
   - **Item 2, passed (2026-10-28):** the learner inspected the debug build of `b4f7908` on the emulator through `chrome://inspect`.
     - **Request:** the POST goes to the `workers.dev` address with Origin `https://localhost`. It carries no `x-goog-api-key`, no `Authorization` and no `key=`, and its payload is only the pantry list.
     - **Searches:** in network headers and bodies, and in the loaded code, there are no matches for `AIza`, `AQ.` or the start of the real key. `key` only matches ordinary words.
     - **Storage:** local storage holds only `pantry-match:pantry`.
   - **Item 3, passed (2026-10-28):** REVIEW.md's "Level 5: the upload key" section covers where the key lives (outside the repo, with an encrypted off-device backup) and that only the learner has the passwords, in a password manager. It also covers the git ignore backstop, and losing or leaking the key (an upload key reset through Play App Signing; the app signing key is unaffected). Claude checked it against the item 1 results.
   - **Item 5, passed (2026-10-28):** the learner confirmed billing is still off for the Google project that owns the Gemini key.
   - **Item 4, passed (2026-10-28):** the learner confirmed the mentor approved the updated REVIEW.md.
   - **Gate passed (2026-10-28).** Pushing `main` and uploading the bundle are now allowed (step 11).
11. **Release.** Build the signed `.aab`. The learner uploads it to internal testing and installs it on their phone from Play. Claude checks it on the phone with the learner (the AI request, saving the pantry, Back).
