import{test}from'node:test';import assert from'node:assert/strict';import{createAuthClient}from'../dist/auth-client.js';
const base={url:'https://dedcvvgiuxpwdzqqdifn.supabase.co',publishableKey:'sb_publishable_test'};
test('Auth accepts only the configured private link, calls real verification API and normalizes token lifetime',async()=>{
 const calls=[];const c=createAuthClient({...base,fetcher:async(url,options)=>{calls.push({url,...options});return Response.json({access_token:'synthetic',refresh_token:'refresh',expires_in:3600,user:{id:'qa'}});}});const session=await c.verifyLink(base.url+'/auth/v1/verify?token_hash='+'a'.repeat(64));assert.equal(calls.length,1);assert.deepEqual(JSON.parse(calls[0].body),{token_hash:'a'.repeat(64),type:'email'});assert.equal(calls[0].headers.apikey,base.publishableKey);assert.ok(session.expires_at>Date.now()/1000+3500);await assert.rejects(c.verifyLink('https://another.example/?token_hash='+'a'.repeat(64)),/corresponde/);await assert.rejects(c.verifyLink('broken'),/completo/);assert.equal(calls.length,1);
});
test('Auth network and expired-link errors use understandable Spanish without losing the underlying HTTP distinction',async()=>{
 await assert.rejects(createAuthClient({...base,fetcher:async()=>{throw Error('Failed to fetch');}}).verifyLink('a'.repeat(64)),/Revisá internet/);await assert.rejects(createAuthClient({...base,fetcher:async()=>Response.json({msg:'Token has expired or invalid'},{status:403})}).verifyLink('a'.repeat(64)),e=>e.status===403&&/enlace venció/.test(e.message));
});
