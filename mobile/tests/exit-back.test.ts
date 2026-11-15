import test from "node:test";
import assert from "node:assert/strict";
import { exitBackWindow } from "../src/navigation/exitBack.ts";
test('exit needs two Back actions within the confirmation window',()=>{
 const back=exitBackWindow();assert.equal(back.attempt(0),'prompt');assert.equal(back.attempt(1000),'exit');assert.equal(back.attempt(1100),'prompt');
});
test('expired, backgrounded and newly focused screens cannot use an old exit confirmation',()=>{
 const back=exitBackWindow();assert.equal(back.attempt(1000),'prompt');assert.equal(back.attempt(3500),'prompt');back.reset();assert.equal(back.attempt(3600),'prompt');assert.equal(back.attempt(4000),'exit');
});
