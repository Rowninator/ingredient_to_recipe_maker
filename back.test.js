import { test } from "node:test";
import assert from "node:assert/strict";
import { backAction } from "./back.js";

test("at the top with nothing running, Back minimizes the app", () => {
  assert.equal(backAction({ aiRunning: false, scrollTop: 0 }), "minimize");
});

test("scrolled down, Back scrolls to the top", () => {
  assert.equal(backAction({ aiRunning: false, scrollTop: 800 }), "scroll-top");
});

test("scrolled down by just 1 pixel still counts as scrolled", () => {
  assert.equal(backAction({ aiRunning: false, scrollTop: 1 }), "scroll-top");
});

test("a negative scrollTop (overscroll) counts as the top", () => {
  assert.equal(backAction({ aiRunning: false, scrollTop: -5 }), "minimize");
});

test("while an AI request runs, Back cancels it", () => {
  assert.equal(backAction({ aiRunning: true, scrollTop: 0 }), "cancel-ai");
});

test("cancelling the AI request comes before scrolling", () => {
  assert.equal(backAction({ aiRunning: true, scrollTop: 800 }), "cancel-ai");
});

test("each press does one thing: cancel, then scroll up, then minimize", () => {
  // The page updates its state between presses, like a real user's three taps.
  const presses = [
    { aiRunning: true, scrollTop: 800 },
    { aiRunning: false, scrollTop: 800 },
    { aiRunning: false, scrollTop: 0 },
  ];
  assert.deepEqual(presses.map(backAction), ["cancel-ai", "scroll-top", "minimize"]);
});

test("doesn't change the state it's given", () => {
  const state = { aiRunning: true, scrollTop: 800 };
  backAction(state);
  assert.deepEqual(state, { aiRunning: true, scrollTop: 800 });
});
