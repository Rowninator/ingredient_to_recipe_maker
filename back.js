// What Android's Back button does in the app (ANDROID.md, step 6).
// The page wires this to @capacitor/app's backButton event; it has no
// Capacitor imports so Node can test it.
//
// state: { aiRunning, scrollTop }
//   aiRunning  true while an AI request is waiting for its reply
//   scrollTop  how many pixels the page is scrolled down (0 at the top)
//
// Returns one of these, checked in this order:
//   "cancel-ai"   an AI request is running: stop waiting for it
//   "scroll-top"  the page is scrolled down: go back to the top
//   "minimize"    anything else: send the app to the background
export function backAction(state) {
  // TODO (learner): write this.
}
