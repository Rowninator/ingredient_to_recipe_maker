import { test } from "node:test";
import assert from "node:assert/strict";
import { contrastRatio } from "./contrast.js";

// Ratios are compared to 2 decimal places; the function itself doesn't round.
function close(actual, expected) {
  assert.equal(typeof actual, "number");
  assert.ok(Math.abs(actual - expected) < 0.01, `expected about ${expected}, got ${actual}`);
}

test("black on white is 21", () => {
  close(contrastRatio("#000000", "#ffffff"), 21);
});

test("a colour on itself is 1", () => {
  close(contrastRatio("#155b55", "#155b55"), 1);
});

test("the order of the two colours doesn't matter", () => {
  assert.equal(contrastRatio("#ffffff", "#155b55"), contrastRatio("#155b55", "#ffffff"));
});

test("upper and lower case give the same result", () => {
  assert.equal(contrastRatio("#FBFAF5", "#155B55"), contrastRatio("#fbfaf5", "#155b55"));
});

test("mid grey on white is about 4.48", () => {
  close(contrastRatio("#777777", "#ffffff"), 4.48);
});

test("matches the measured design colours", () => {
  close(contrastRatio("#155b55", "#fbfaf5"), 7.56);
  close(contrastRatio("#8a938a", "#fffefa"), 3.14);
});

test("doesn't round up: the design's hint grey is just under 4.5", () => {
  assert.ok(contrastRatio("#687772", "#fbfaf5") < 4.5);
});

test("works on very dark channels (the low end of the WCAG formula)", () => {
  close(contrastRatio("#050505", "#000000"), 1.03);
});

test("throws on anything that isn't #rrggbb", () => {
  for (const bad of ["#fff", "155b55", "#15b5g5", "#155b55ff", "red", "", null, undefined, 42]) {
    assert.throws(() => contrastRatio(bad, "#ffffff"), Error, `should throw for ${String(bad)}`);
    assert.throws(() => contrastRatio("#ffffff", bad), Error, `should throw for ${String(bad)} as the 2nd colour`);
  }
});
