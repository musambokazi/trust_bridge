import test from "node:test";
import assert from "node:assert/strict";
import { compact, empty, hydrate } from "../src/workflow/cache.ts";
import { blankReview, validateReview, validateSupplierEdit, operationError } from "../src/workflow/types.ts";
import { reportHTML } from "../src/workflow/report.ts";
import { comparisonRows } from "../src/workflow/comparisonModel.ts";
import type { Assessment } from "../src/domain/demo.ts";
const item: Assessment = { id: "report-test", supplierId: "s", invoiceNumber: '<img src=x onerror="alert(1)">', supplierName: "Supplier & Sons", amount: 100, date: "2026-11-12T12:00:00Z", level: "review", approvedReference: "FULL-BANK-1234", submittedReference: "DIFFERENT-1234", findings: [{field:"bank",title:"Bank differs",detail:"Confirm independently.",mismatch:true}], comparison: { supplierName: "Original", invoiceName: "Supplier", supplierVersion: 1, supplierReviewedAt: null, capturedAt: "2026-11-12T12:00:00Z", rows: [{field:"bank",label:"Bank",reference:"FULL-BANK-1234",invoice:"DIFFERENT-1234",matches:false}] } };
test("full-value server mismatch survives equal masked suffixes", () => {
 const rows=comparisonRows(item); assert.equal(rows[0]!.matches,false); assert.equal(rows[0]!.reference,rows[0]!.invoice); assert.ok(!rows[0]!.reference.includes("FULL-BANK"));
});
test("review completion requires every check and bounded notes", () => {
 assert.match(validateReview({...blankReview,status:"reviewed"}),/every checklist/);
 assert.equal(validateReview({...blankReview,contact_checked:true,documents_checked:true,discrepancies_resolved:true,status:"reviewed"}),"");
 assert.ok(validateReview({...blankReview,notes:"a".repeat(2001)}));
 assert.ok(validateSupplierEdit({name:"Supplier",category:"",registration:"",contact:"",reviewed:false,reason:""}));
 assert.equal(operationError("P0001"),"blocked"); assert.equal(operationError(""),"failed");
});
test("outbox migration retains old checks and rejects damaged pending data", () => {
 const old=hydrate(JSON.stringify({suppliers:[],assessments:[],pending:[{id:"p",input:{supplierId:"s"},at:"now"}]})); assert.equal(old.pending.length,1); assert.deepEqual(old.operations,[]);
 assert.throws(()=>hydrate('{"pending":[{}]}'),/outbox/);
});
test("cache pressure evicts downloaded records, never unsynced content", () => {
 const cache=empty(); cache.pending.push({id:"pending",input:{supplierId:"s",invoiceNumber:"INV",supplierName:"Owner",amount:"100",bankReference:"SECRET_PENDING_1234"},at:"now"});
 cache.assessments.push({...item,id:"pending"});
 cache.history=Array.from({length:100},(_,i)=>({id:String(i),supplier_id:"s",actor_id:null,version:i,reason:"a".repeat(5000),before_values:null,after_values:{},created_at:"now"}));
 const result=compact(cache); assert.equal(result.pending[0]!.input.bankReference,"SECRET_PENDING_1234"); assert.ok(result.assessments.some(a=>a.id==="pending")); assert.ok(JSON.stringify(result).length<=350000); assert.equal(cache.history.length,100);
});
test("report escapes injected content, masks bank fields and omits notes by default", () => {
 const review={...blankReview,assessment_id:item.id,user_id:"owner",version:1,updated_at:item.date,notes:'SECRET NOTES <script>alert(1)</script>'};
 const html=reportHTML(item,review,{includeNotes:false,pendingReview:true,pendingCheck:true,generatedAt:item.date});
 assert.ok(!html.includes('<img src=x')); assert.ok(html.includes('&lt;img')); assert.ok(!html.includes('FULL-BANK')); assert.ok(!html.includes('DIFFERENT-1234')); assert.ok(!html.includes('SECRET NOTES')); assert.ok(html.includes('UNVERIFIED')); assert.ok(html.includes('newer local review'));
 const withNotes=reportHTML(item,review,{includeNotes:true,pendingReview:false,pendingCheck:false,generatedAt:item.date}); assert.ok(withNotes.includes('&lt;script&gt;')); assert.ok(!withNotes.includes('<script>'));
 const legacy=reportHTML({...item,comparison:undefined},undefined,{includeNotes:false,pendingReview:false,pendingCheck:false,generatedAt:item.date}); assert.ok(legacy.includes('No full reference snapshot'));
});
