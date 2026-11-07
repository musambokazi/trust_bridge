import assert from "node:assert/strict";
import { test } from "node:test";
import { CaptureScopes } from "../src/security/CaptureScopes.ts";

test("password to confirm handoff never unlocks while another owner is active", async () => {
  const events: string[] = [];
  const scopes = new CaptureScopes(async () => { events.push("protect"); }, async () => { events.push("allow"); });
  const password = scopes.acquire(); await password.ready;
  const blur = password.release();
  const confirmation = scopes.acquire(); await Promise.all([blur, confirmation.ready]);
  assert.deepEqual(events, ["protect"]);
  await confirmation.release();
  await confirmation.release();
  assert.deepEqual(events, ["protect", "allow"]);
});

test("late native protection completion is released after navigation or cancellation", async () => {
  const events: string[] = [];
  let finish!: () => void;
  const scopes = new CaptureScopes(() => new Promise<void>((resolve) => { finish = () => { events.push("protect"); resolve(); }; }), async () => { events.push("allow"); });
  const owner = scopes.acquire();
  await Promise.resolve();
  const cleanup = owner.release();
  finish(); await Promise.all([owner.ready, cleanup]);
  assert.deepEqual(events, ["protect", "allow"]);
});

test("failed native protection cannot leave the app permanently locked for recording", async () => {
  let fail = true;
  const events: string[] = [];
  const scopes = new CaptureScopes(async () => { if (fail) throw Error("native failure"); events.push("protect"); }, async () => { events.push("allow"); });
  const bad = scopes.acquire(); await assert.rejects(bad.ready); await bad.release();
  fail = false;
  const good = scopes.acquire(); await good.ready; await good.release();
  assert.deepEqual(events, ["protect", "allow"]);
});
