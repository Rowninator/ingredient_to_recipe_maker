# Level 7: iOS App (plan)

Approved 2026-11-02, with the learner's changes to decisions 4 and 5. Pantry Match is packaged for iOS with Capacitor and installed on the learner's iPhone through TestFlight. App Store submission comes after, once the review items below are settled. The page code and matching logic stay the same as in Levels 4–5.

## Before starting (the learner has both)

- **A Mac of their own.** Xcode 26 is required, both by Capacitor 8 and by Apple for uploads. Xcode 26.0–26.3 need macOS Sequoia 15.6 or later; Xcode 26.4.1 and newer need macOS Tahoe 26.2 or later. Step 3 checks which one the Mac can run.
- **Apple Developer Program membership.** Already enrolled. It provides App Store Connect, signing certificates and TestFlight.
- **The iPhone,** on iOS 15 or newer (Capacitor 8's minimum).

## Decisions for the learner

1. **One app build for both platforms. Approved (2026-11-02).**
   - **Today:** `--mode android` builds into `dist-android/`, and `capacitor.config.json` has `webDir: "dist-android"`. Capacitor uses one `webDir` for every platform, so iOS would package a folder named "android".
   - **Chosen:** rename the mode to `app` (output `dist-app/`). Inside it, `Capacitor.getPlatform()` decides the Android-only parts (the Back button and the status-bar fix). One build, tested once, goes into both apps.
2. **Asking before sending to the AI (Guideline 5.1.2(i)).** Apple now says apps must "clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so". Today the pantry goes to Gemini on the first tap of "Suggest with AI".
   - **Approved (2026-11-02):** the first tap shows a short notice ("Your ingredient list is sent to Google's Gemini AI through our server…", plus a privacy policy link) with **Allow** and **Not now** buttons. The answer is saved, and a "Stop sharing with AI" link withdraws it (5.1.1(ii) asks for an easy way to withdraw).
   - **Where:** on every build (website, Android and iOS), so there's one code path. It also helps the Play release.
   - **Who writes what:** see decision 3.
3. **The learner's piece this level. Approved (2026-11-02):** the learner writes the consent check, a small pure function such as `aiConsent(stored)` that reads the saved answer and returns whether to ask, send or stay off. Claude writes the failing tests first and the UI around it, like Levels 1–5.
4. **The pantry in iOS storage.** Capacitor warns that iOS can clear a WebView's `localStorage` when the phone is low on space. It recommends the Preferences plugin for data that must last.
   - **Approved (2026-11-02): accept it.** The pantry is a short list that's easy to re-type, and Preferences is asynchronous while `pantry.js` reads and writes synchronously, so switching would rewrite the Level 2 code. Note it in `RELEASE.md` and re-check it if testers lose their pantry.
   - **Also: iCloud backup (the learner's addition).** Check whether the saved pantry goes into iCloud backups and phone-to-phone transfers. WKWebView keeps `localStorage` under the app's `Library/` folder, and iOS backs up `Library/` (except `Caches/`) by default, so it probably does. **Check (step 5):** confirm on the Simulator where the file lives and whether that folder is backed up.
   - **If it's included:** exclude it, the same as Android's `allowBackup="false"` and data extraction rules (`ANDROID.md` step 9), so the pantry never leaves the phone except in an AI request. On iOS that means marking WebKit's data folder with `isExcludedFromBackup` in the app's native start-up code, which Claude writes in step 5.
   - **If it can't be excluded reliably** (for example, if WebKit recreates the folder without the mark): update `privacy.html` and the App Privacy answers to say the pantry is included in the user's own iCloud backup. The learner chooses between the two in step 5 if it comes to that.
5. **iPhone only for the first release. Approved (2026-11-02).** Guideline 2.4.1 says "iPhone apps should run on iPad whenever possible", so iPad is planned for a later update rather than ruled out. In Xcode, the target's Supported Destinations lists iPhone only, so iPads run it as an iPhone app, which Apple allows. No iPad screenshots are needed.
6. **Level 6 (camera scan) first? Approved (2026-11-02): no.** See "App Store review readiness" below. Go to TestFlight without it, and decide before App Store submission (step 13).

## Security gate (Level 7)

The Level 3 gate applies again, at two points:

- **Before the Worker is redeployed (step 6):** Claude re-runs the key search, REVIEW.md gets a section on the new address, and the learner's mentor approves it.
- **Before any build is uploaded to App Store Connect (step 11):** all five items, with the Level 7 changes:
  1. Claude confirms the API key is not in the code or git history, and the file holding it is in `.gitignore`. Claude also confirms that no Apple signing material is in the code or git history: certificates (`.p12`, `.cer`), private keys (`.p8`, App Store Connect API keys) and provisioning profiles (`.mobileprovision`).
  2. The learner inspects the installed app's traffic through **Safari's Web Inspector** (Safari → Develop → the iPhone or Simulator) and confirms the key never appears. This replaces `chrome://inspect`.
  3. REVIEW.md covers:
     - the `capacitor://localhost` address;
     - Apple signing: where the distribution certificate lives (the Mac's keychain, with Xcode's automatic signing), who can sign in to the Apple Developer account and how it's protected (two-factor);
     - what happens if the Mac or the certificate is lost or leaked: revoke it and create a new one, which doesn't change the app.
  4. The learner confirms the mentor approved REVIEW.md.
  5. The learner confirms billing is still off for the Google project that owns the Gemini key.

## Research decisions (step 2, 2026-11-02)

Done by a subagent. Claude checked the versions on npm. Items marked **check** weren't confirmed by an official source and are verified in the step that names them.

- **Versions:** `@capacitor/ios` **8.5.3** (2026-10-07), matching core, cli and android 8.5.3. 8.6.0 (2026-10-28) is too new for the two-week rule. `@capacitor/app` 8.1.2 includes iOS, but `backButton` and `minimizeApp` are Android only, so `back.js` stays Android-only. [App API](https://capacitorjs.com/docs/apis/app), [npm](https://registry.npmjs.org/@capacitor/ios)
- **Tooling:** iOS 15+ and Xcode 26.0+ ([Updating to 8](https://capacitorjs.com/docs/updating/8-0)). New iOS projects use **Swift Package Manager**, so CocoaPods isn't installed ([Environment setup](https://capacitorjs.com/docs/getting-started/environment-setup)). macOS versions for each Xcode: [Xcode system requirements](https://developer.apple.com/xcode/system-requirements/).
- **Apple's upload rule:** since 28 April 2026, uploads must be built with Xcode 26 and the iOS 26 SDK. [Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/)
- **App address:** the page is served from `capacitor://localhost`. The defaults are `iosScheme: "capacitor"` and `hostname: "localhost"` ([Config](https://capacitorjs.com/docs/config), [CAPInstanceDescriptor.swift](https://github.com/ionic-team/capacitor/blob/8.5.3/ios/Capacitor/Capacitor/CAPInstanceDescriptor.swift)). **Check (step 5):** the exact `Origin` header WKWebView sends, read in Safari's Web Inspector before the Worker change.
- **TestFlight:** up to 100 internal testers (App Store Connect users) and 10,000 external. Each build lasts 90 days. External groups need Beta App Review for their first build. [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview). **Check (step 12):** that internal testing needs no review.
- **Export compliance:** the app uses only HTTPS through the OS. Setting `ITSAppUsesNonExemptEncryption` to `NO` in `Info.plist` answers this once instead of on every upload ([Export compliance](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance)). **Check (step 9):** Apple's own wording for HTTPS-only apps.
- **Privacy manifest:** Capacitor 8.5.3 ships its own `PrivacyInfo.xcprivacy`, with no tracking and no required-reason APIs ([source](https://github.com/ionic-team/capacitor/blob/8.5.3/ios/Capacitor/Capacitor/PrivacyInfo.xcprivacy)). The app needs its own only if it uses required-reason APIs, such as the Preferences plugin ([Privacy manifest](https://capacitorjs.com/docs/ios/privacy-manifest)). **Check (step 9):** Xcode's privacy report on the archive.
- **Status bar and safe areas:** SystemBars is in core. On iOS it needs `UIViewControllerBasedStatusBarAppearance = YES`, and its inset handling is Android only, so the page's `env(safe-area-inset-*)` padding does the work ([System Bars](https://capacitorjs.com/docs/apis/system-bars)). Step 8 checks the notch or Dynamic Island, the home indicator and status bar contrast in dark mode.
- **No Back button on iOS.** Capacitor doesn't turn on WebKit's swipe-back gesture, and the page has no history anyway ([CAPBridgeViewController.swift](https://github.com/ionic-team/capacitor/blob/8.5.3/ios/Capacitor/Capacitor/CAPBridgeViewController.swift)). Step 8 checks that the privacy page has a way back, since there's no Back button.
- **Keyboard:** without `@capacitor/keyboard`, WKWebView handles it itself. **Check (step 8)** that the input stays visible. The plugin is added only if it doesn't.
- **localStorage** can be cleared when storage is low ([Storage guide](https://capacitorjs.com/docs/guides/storage), [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)). See decision 4.
- **App icon:** 1024×1024 with no transparency. The "no alpha" rule comes from App Store validation errors, not a page Apple published. `design/icon-foreground.svg` on `#16B96B` is exported without alpha.

## App Store review readiness (for TestFlight and App Store)

From the [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/):

- **4.2 Minimum functionality.** An app needs "features, content, and UI that elevate it beyond a repackaged website". 4.2.2 rules out apps that are mainly "web clippings, content aggregators, or a collection of links".
  - **Where Pantry Match stands:** recipe matching runs on the phone and works offline. The pantry is saved on the device, and the interface uses native-style Ionic controls with a privacy page packaged in the app. It isn't a wrapper for a remote site: everything except the AI is inside the app. But it looks the same as the website, and that's what 4.2 rejections usually point to.
  - **Camera scan:** Apple never says that adding a native feature satisfies 4.2, so a camera scan isn't a guaranteed fix. It's worth doing for its own sake (Level 6), not as a review tactic.
  - **Plan:** TestFlight first. Before App Store submission (step 13), choose between Level 6 first and submitting as is, then answering any 4.2 rejection in App Review's reply thread. An external TestFlight group's Beta App Review gives an early signal.
- **5.1.1 / 5.1.2 Privacy:** a privacy policy link in App Store Connect and inside the app (both exist), consent before sharing with third-party AI (decision 2), and a way to withdraw it.
  - `privacy.html` gets updated for iOS (Apple instead of Android, and the consent and how to withdraw it).
- **App Privacy label** ([App privacy details](https://developer.apple.com/app-store/app-privacy-details/)): data counts as "collected" only if it's kept longer than it takes to answer the request. An IP address that isn't kept doesn't need disclosing.
  - The Worker doesn't store the pantry. Whether Google keeps it under the Gemini terms decides the answer.
  - Step 9 re-reads those terms (as Level 5 step 8 did) and answers "Other User Content" to match.
- **1.2 and AI content:** user-generated content rules now cover "AI content creation apps". The scope is Apple's call, the same as Play's AI-Generated Content policy. The report/flag feature in `RELEASE.md` section 9 would cover both stores, so it's planned once, before App Store submission (step 13).
- **Age rating:** the new questionnaire (4+, 9+, 13+, 16+, 18+) asks apps to consider AI features. Answered in step 9.
- **Screenshots:** iPhone 6.9" (1206×2622 or 1179×2556) only, since the first release is iPhone only (decision 5).

## Steps

1. **Plan file.** This file, plus a pointer in CLAUDE.md. The learner approves and commits. **Approved 2026-11-02.**
2. **Research (subagent).** Done above.
3. **Mac setup (the learner).**
   - Check the macOS version.
   - Install Xcode 26 from the Mac App Store, open it once to install the iOS platform, and sign in with the Apple ID under Settings → Accounts.
   - Install Node 24.18.0 (the same as Windows and the workflow).
   - Clone the repo and run `npm ci`. For the Mac steps, run Claude Code on the Mac too: CLAUDE.md and this file carry the context.
   - **The Mac only builds.** It gets a clone of the repo, and nothing else from this project. No `worker/.dev.vars` (the Gemini key stays only on the Windows PC and in Cloudflare), no Android keystore (`pantrymatch_upload.jks` stays in `C:\Users\jadee\keys\` and its backup), and no Wrangler login. The iOS app calls the deployed Worker, so the Mac never needs the key. Worker changes, `wrangler deploy` and Android builds stay on Windows. The step 10 search and gate item 1 also check the Mac's clone for these files.
   - Claude gives the exact steps and checks only the versions (`xcodebuild -version`, `node -v`). Claude never installs these itself.
4. **One app build (Windows, if decision 1 is yes).**
   - Rename the mode to `app` (output `dist-app/`, and `webDir` follows it). Gate the Back button and SystemBars on `Capacitor.getPlatform() === "android"`.
   - Update `build.test.js`, `vite.test.js`, `.gitignore`, `package.json` scripts and CLAUDE.md.
   - Check that the Android app in the emulator still behaves exactly as before (Back cases, status bar), so Level 5 doesn't regress.
5. **Add iOS (Mac).**
   - `npm install -E @capacitor/ios@8.5.3`, then `npx cap add ios` (Swift Package Manager). Commit `ios/`.
   - Add `.gitignore` entries for signing files (`*.p12`, `*.p8`, `*.cer`, `*.mobileprovision`) and Xcode user data (`xcuserdata/`, `DerivedData/`). Prove them with `git check-ignore`.
   - Set the bundle ID to `io.github.rowninator.pantrymatch`, which is permanent once uploaded, and Supported Destinations to iPhone only. Add `ITSAppUsesNonExemptEncryption = NO` and `UIViewControllerBasedStatusBarAppearance = YES`.
   - **Backup (decision 4):** find where the pantry is stored and whether it's backed up. If it is, exclude it and prove the mark is still there after a relaunch and after "Clear all", or update the privacy page if exclusion isn't reliable.
   - Run in the iOS Simulator. Read the AI request's `Origin` in Safari's Web Inspector; the Worker should refuse it with 403 for now.
6. **Worker.**
   - **First (due 9 November, from `ANDROID.md`):** update `wrangler` to the newest version that's at least two weeks old, pin `worker/package.json` exactly, and commit `worker/package-lock.json`. Then `cd worker && npm audit` and `npm test`.
   - Add the origin confirmed in step 5 to the allowed sites, with Worker tests. Like Android's, it's shared by every Capacitor iOS app, so the rate limit and billing being off remain the real limits.
   - **Gate before redeploying:** the key search, a REVIEW.md "Level 7: the iOS app's address" section, and the mentor's approval.
   - Then the learner runs `wrangler deploy`. One real request from the Simulator checks it, and one from the Android emulator checks nothing broke.
7. **AI consent (decisions 2 and 3).** Claude writes failing tests and an empty starting version of the consent function. The learner writes it. Claude builds the notice, the Allow and Not now buttons and the withdraw link with `textContent`, then checks them in the browser, the Simulator and the Android emulator.
8. **Interface audit (Simulator and the iPhone through Xcode).** Screenshots are the check. Covers:
   - the notch or Dynamic Island, the home indicator and the status bar in light and dark mode
   - the keyboard covering the input
   - touch targets of at least 44pt (Apple's minimum)
   - VoiceOver labels and reading order
   - larger text: WKWebView doesn't follow iOS text size settings by default, so check what happens and decide
   - landscape
   - no network
   - the save note when storage fails
   - the privacy page and the way back from it
   - the consent notice

   Each finding is reported as issue, location, why it matters and fix, most serious first. The learner chooses which to fix.
9. **Release checklist (an iOS section in `RELEASE.md`).**
   - Bundle ID, version and build number, icon (1024×1024, no alpha) and launch screen.
   - The App Store Connect app record, with the privacy policy URL.
   - App Privacy answers (after re-reading the Gemini terms), the age rating, export compliance and Xcode's privacy report.
   - Screenshots.
   - `privacy.html` updated for iOS and consent.
   - Signing: automatic signing in Xcode, with no certificates or keys exported into the project.
10. **Checkpoint.** `npm test`, the Worker's tests, a key and signing-file search of `dist/`, `dist-app/`, `ios/`, `android/` and all of git history, `/code-review` in a fresh session, fixes, and a commit.
11. **Security gate.** All five items above, before any build is uploaded.
12. **TestFlight.** The learner archives in Xcode (Product → Archive) and uploads to App Store Connect. They add themselves as an internal tester and install from the TestFlight app. Claude checks it on the iPhone with the learner: consent, the AI request, the pantry kept after a relaunch, the privacy link and dark mode.
13. **Before App Store submission (decided then, not approved now):**
    - Level 6 or submit as is (4.2).
    - The AI report/flag feature for both stores (its own plan, review and gate).
    - Whether to use an external TestFlight group first.
