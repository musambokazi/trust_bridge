import test from "node:test";
import assert from "node:assert/strict";
import { registrationError } from "../src/auth/registrationError.ts";
test('existing account errors direct the user to sign in, not another signup',()=>{
 for(const code of ['user_already_exists','email_exists'])assert.equal(registrationError({code}).action,'sign-in');
 assert.equal(registrationError({status:422,message:'User already registered'}).action,'sign-in');
 assert.equal(registrationError({status:422,message:'Other validation error'}).action,undefined);
});
test('rate limits and delivery failures do not suggest changing passwords',()=>{
 assert.match(registrationError({status:429}).message,/wait/);
 assert.equal(registrationError({code:'over_email_send_rate_limit'}).action,undefined);
 assert.match(registrationError({code:'email_address_not_authorized'}).message,/delivery is not configured/);
 assert.equal(registrationError({code:'weak_password'}).action,'password');
});
test('unexpected auth failures never expose server messages or imply account creation succeeded',()=>{
 assert.equal(registrationError({status:500}).action,undefined);
 assert.match(registrationError({status:500}).message,/could not complete/);
});
