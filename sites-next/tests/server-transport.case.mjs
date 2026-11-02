import {test}from'node:test';import assert from'node:assert/strict';import{createSupabaseRepository}from'../backend/supabase-repository.js';
test('temporary Data API JWT clock errors retry the identical server request without becoming a rejected business event',async()=>{
 const sent=[];const repository=createSupabaseRepository({url:'https://dedcvvgiuxpwdzqqdifn.supabase.co',secretKey:'server-test-only',fetcher:async(_url,options)=>{sent.push(options.body);return sent.length===1?Response.json({code:'PGRST303',message:'JWT issued at future'},{status:401}):Response.json({revision:1});}});
 assert.deepEqual(await repository.read({userId:'u',businessId:'b',deviceId:'d'}),{revision:1});assert.equal(sent.length,2);assert.equal(sent[0],sent[1]);
});
test('persistent Data API authentication failure is unknown; domain and permission failures retain their distinction',async()=>{
 for(const [body,status,code]of [[{code:'PGRST301',message:'JWT invalid'},401,'UNKNOWN'],[{code:'22023',message:'Bad amount'},400,'REJECTED'],[{code:'42501',message:'Not allowed'},403,'FORBIDDEN']]){
 let calls=0;const r=createSupabaseRepository({url:'https://dedcvvgiuxpwdzqqdifn.supabase.co',secretKey:'server-test-only',fetcher:async()=>{calls++;return Response.json(body,{status});}});await assert.rejects(r.read({userId:'u',businessId:'b',deviceId:'d'}),e=>e.code===code);assert.equal(calls,1);
 }
});
