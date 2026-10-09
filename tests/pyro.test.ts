import test from "node:test";
import assert from "node:assert/strict";
import { registerPyroTap, TAP_WINDOW } from "../src/lib/pyro.ts";

test("el easter egg solo se activa con tres toques seguidos y permite repetir", () => {
  let sequence = { count: 0, started: 0 };
  for (const [time, expected] of [
    [2000, false],
    [2200, false],
    [2400, true],
    [2500, false],
    [2700, false],
    [2900, true],
  ] as const) {
    const result = registerPyroTap(sequence, time);
    assert.equal(result.triggered, expected);
    sequence = result.sequence;
  }
});

test("los toques aislados o demasiado separados no activan el easter egg", () => {
  const first = registerPyroTap({ count: 0, started: 0 }, 2000);
  const second = registerPyroTap(first.sequence, 2300);
  const late = registerPyroTap(second.sequence, 2000 + TAP_WINDOW + 1);
  assert.equal(late.triggered, false);
  assert.equal(late.sequence.count, 1);
  assert.equal(
    registerPyroTap(second.sequence, 2000 + TAP_WINDOW).triggered,
    true,
  );
});
