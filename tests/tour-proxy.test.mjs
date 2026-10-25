import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {registerTourProxy} from '../tour-proxy.js';
async function server(options,run){const app=express();registerTourProxy(app,options);const s=app.listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));try{await run('http://127.0.0.1:'+s.address().port);}finally{await new Promise(r=>s.close(r));}}
test('preserves search query, injects server key, removes all caller key variants',async()=>{
 let target,config;
 await server({key:()=> 'fixture%2Bsecret',request:async(u,o)=>{target=u;config=o;return new Response('{"response":{"items":[]}}',{headers:{'content-type':'application/json'}});}},async base=>{
 const r=await fetch(base+'/api/tourapi/KorService2/searchKeyword2?keyword=%EC%84%9C%EC%9A%B8&serviceKey=attacker&SERVICEKEY=other');assert.equal(r.status,200);assert.deepEqual(await r.json(),{response:{items:[]}});
 });
 assert.equal(target.origin,'https://apis.data.go.kr');assert.equal(target.searchParams.get('keyword'),'서울');assert.deepEqual(target.searchParams.getAll('serviceKey'),['fixture+secret']);assert.equal(target.searchParams.has('SERVICEKEY'),false);assert.equal(config.redirect,'error');
});
test('rejects arbitrary services/operations without upstream access',async()=>{
 await server({key:()=> 'fixture',request:()=>{throw Error('must not call');}},async base=>{assert.equal((await fetch(base+'/api/tourapi/arbitrary/admin')).status,404);assert.equal((await fetch(base+'/api/tourapi/KorService2/admin')).status,404);});
});
test('missing credential fails closed',async()=>{await server({key:()=>'',request:()=>{throw Error('must not call');}},async base=>assert.equal((await fetch(base+'/api/tourapi/KorService2/areaBasedList2')).status,503));});
test('redacts credential echoed in provider errors',async()=>{await server({key:()=> 'fixture+secret',request:async()=>new Response('fixture+secret fixture%2Bsecret',{status:403})},async base=>{const r=await fetch(base+'/api/tourapi/KorService2/areaBasedList2');assert.equal(r.status,403);assert.equal(await r.text(),'[redacted] [redacted]');});});
test('network errors do not expose credential URLs',async()=>{await server({key:()=> 'fixture',request:async()=>{throw Error('secret-url');}},async base=>{const r=await fetch(base+'/api/tourapi/KorService2/areaBasedList2');assert.equal(r.status,502);assert.ok(!(await r.text()).includes('secret-url'));});});
