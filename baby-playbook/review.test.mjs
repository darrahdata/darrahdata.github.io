import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as core from './core.mjs';
const root=new URL('./',import.meta.url),read=name=>fs.readFileSync(new URL(name,root),'utf8');
const dataContext={window:{}};vm.runInNewContext(read('data.js'),dataContext);vm.runInNewContext(read('faith.js'),dataContext);
const DATA=dataContext.window.BABY_PLAYBOOK,FAITH=dataContext.window.BABY_FAITH,rows=core.flatten(DATA.sections);
const at=s=>new Date(s+'T12:00:00');
test('birth dates select the right stage at calendar boundaries; due dates never imply birth',()=>{
 for(const [dob,now,stage] of [['2026-06-08','2026-09-07','newborn'],['2026-06-07','2026-09-07','infant'],['2026-03-07','2026-09-07','older'],['2025-09-07','2026-09-07','toddler'],['2023-09-07','2026-09-07','preschool']])assert.equal(core.ageInfo({type:'birth',date:dob},at(now)).stage,stage);
 assert.equal(core.ageInfo({type:'due',date:'2025-01-01'},at('2026-09-07')).stage,'before');
 assert.equal(core.ageInfo({type:'birth',date:'2026-09-07'},at('2026-09-07')).label,'0 days old');
 assert.equal(core.ageInfo({type:'birth',date:'2026-03-07'},at('2026-03-09')).days,2);
 assert.equal(core.parseDate('2026-02-30'),null);assert.ok(core.validProfile({type:'birth',date:'2027-01-01'},at('2026-09-07')));
});
test('storage round-trips every family tool and tolerates corrupt or denied storage',()=>{
 let json;const store={getItem:()=>json,setItem:(k,v)=>json=v};const state=core.normalizeState({profile:{name:'Joseph',date:'2026-09-01',type:'birth'},contacts:{pediatricianPhone:'555-123-4567'},handoff:{notes:'Fed at 2'},faithPlan:{parish:'St. Joseph'},checks:{mass:true},favorites:[rows[0].id],theme:'dark'});
 assert.ok(core.writeState(store,state));assert.deepEqual(core.readState(store).state,state);
 json='{broken';assert.ok(core.readState(store).error);assert.deepEqual(core.readState(store).state.favorites,[]);
 assert.equal(core.writeState({setItem(){throw Error('denied');}},state),false);
 assert.deepEqual(core.normalizeState({favorites:{evil:true},profile:[],checks:null}).favorites,[]);
 assert.equal(core.normalizeState({profile:{name:{bad:true}}}).profile.name,undefined);
});
test('search handles common parent vocabulary and multiple terms',()=>{
 assert.ok(rows.some(r=>core.matchesQuery(r,'poop')));assert.ok(rows.some(r=>core.matchesQuery(r,'nappy')));assert.ok(rows.some(r=>core.matchesQuery(r,'wet diaper')));
 assert.ok(FAITH.cards.some(c=>core.matchesQuery(c,'church')));assert.equal(core.matchesQuery(rows[0],'zznotarealword'),false);
});
test('all original cards survive, IDs stay unique, and identified care contradictions are gone',()=>{
 assert.equal(rows.length,274);assert.equal(new Set(rows.map(r=>r.id)).size,274);assert.equal(rows.filter(r=>r.sources?.length).length,49);
 const text=JSON.stringify(DATA);for(const phrase of ['Four feeds on the family clock','Full Pause at night','Half of newborn','Match his volume','One-bite rule','No lights, no chat','Don\'t invent new crutches'])assert.ok(!text.includes(phrase),phrase);
 assert.ok(rows.filter(r=>/swaddle/i.test(r.t)).every(r=>/roll/i.test(r.lead+' '+JSON.stringify(r.fields))));
 assert.ok(rows.find(r=>r.id==='red-flags-floppy-won-t-wake').lead.includes('911'));
});
test('Catholic practices do not surface toddler discipline in newborn daily selections',()=>{
 assert.equal(FAITH.cards.length,18);for(const c of FAITH.cards){assert.ok(['all',...Object.keys(core.STAGES)].includes(c.stage),c.id);assert.ok(c.action);}
 for(const stage of ['newborn','infant'])assert.ok(FAITH.cards.filter(c=>core.faithForStage(c,stage)).every(c=>c.stage!=='toddler'));
 assert.ok(core.faithForStage(FAITH.cards.find(c=>c.id==='saint-story'),'preschool'));assert.ok(core.faithForStage(FAITH.cards.find(c=>c.id==='daily-blessing'),'toddler'));
 for(const id of ['baptism','mass','family']){assert.equal(FAITH[id].length,7);assert.equal(new Set(FAITH[id].map(c=>c.id)).size,7);}
});
test('personal text is escaped, phone links sanitized, and handoffs include dates',()=>{
 assert.equal(core.escapeHTML('<img onerror="bad">\''),'&lt;img onerror=&quot;bad&quot;&gt;&#39;');
 assert.equal(core.telephone('+1 (555) 123-4567'),'+15551234567');assert.equal(core.telephone('javascript:alert(1)'), '1');
 const s=core.normalizeState({profile:{name:'Joseph'},handoff:{feedTime:'2026-09-07T09:30',updatedAt:'2026-09-07T10:00:00',next:'Dad',notes:'Likes singing'}});
 const text=core.handoffText(s);assert.match(text,/Sep 7/);assert.match(text,/Dad/);assert.match(text,/Likes singing/);
 core.toggleFavorite(s,'test');assert.ok(s.favorites.includes('test'));core.toggleFavorite(s,'test');assert.equal(s.favorites.length,0);
});
// Exercise the actual view functions and form handlers in a JS harness, without browser UI automation.
function runtime(initial={}){
 const nodes=new Map(),listeners={},windowListeners={},store=new Map([[core.STORAGE_KEY,JSON.stringify(initial)]]);
 const element=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,dataset:{},setAttribute(){},focus(){},scrollIntoView(){}});return nodes.get(id);};
 const document={getElementById:element,documentElement:{dataset:{}},addEventListener:(type,fn)=>listeners[type]=fn,querySelectorAll:()=>[],querySelector:()=>null,activeElement:{tagName:'BODY'}};
 const context={...core,esc:core.escapeHTML,window:{...dataContext.window,scrollTo(){},scrollY:0,print(){}},document,location:{hash:'#today'},navigator:{onLine:true},localStorage:{getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,v)},addEventListener:(type,fn)=>windowListeners[type]=fn,setTimeout:()=>0,clearTimeout(){},confirm:()=>true,FormData:class{constructor(form){this.values=form.values;}entries(){return Object.entries(this.values);}},Date,URL,console};
 vm.createContext(context);vm.runInContext(read('app.js').replace(/^import .*?;\n/,''),context);
 return {context,nodes,listeners,store,run:code=>vm.runInContext(code,context)};
}
test('every route renders useful content and only valid internal destinations',()=>{
 const app=runtime();const sections=DATA.sections.map(s=>'care/'+s.id);let html='';for(const route of ['today','guide','faith','handoff','help','guide/favorites',...sections]){app.context.location.hash='#'+route;app.run('render()');const out=app.nodes.get('main').innerHTML;assert.match(out,/<h1>/,route);assert.ok(!out.includes('undefined'),route);html+=out;}
 const links=[...html.matchAll(/href="#([^"\s]+)"/g)].map(m=>m[1]);const valid=new Set(['today','guide','faith','handoff','help','guide/favorites',...sections]);for(const l of links)assert.ok(valid.has(l),l);
 app.context.location.hash='#%ZZ';assert.doesNotThrow(()=>app.run('render()'));
});
test('saving a real form updates the persisted emergency card and its print output',()=>{
 const app=runtime();const vals={legalName:'Joseph <script>bad()</script>',pediatrician:'Dr. Example',pediatricianPhone:'(555) 123-4567',allergies:'No known allergies',feedingPlan:'Follow clinician plan'};
 app.listeners.submit({target:{id:'contact-form',values:vals},preventDefault(){}});
 const saved=JSON.parse(app.store.get(core.STORAGE_KEY));assert.equal(saved.contacts.legalName,vals.legalName);assert.ok(saved.contacts.updatedAt);
 app.run('printCard()');const print=app.nodes.get('print-card').innerHTML;assert.match(print,/Joseph &lt;script&gt;/);assert.ok(!print.includes('<script>bad'));assert.match(print,/555/);assert.match(print,/feeding plan/i);
 const restored=runtime(saved);restored.context.location.hash='#help';restored.run('render()');assert.match(restored.nodes.get('main').innerHTML,/tel:5551234567/);
});
test('invalid profile submit is rejected and storage errors are visible',()=>{
 const app=runtime();app.listeners.submit({target:{id:'profile-form',values:{name:'Baby',type:'birth',date:'2999-01-01'}},preventDefault(){}});assert.equal(app.nodes.get('profile-error').hidden,false);assert.match(app.nodes.get('profile-error').textContent,/future/);
 app.context.localStorage.setItem=()=>{throw Error('quota');};app.listeners.submit({target:{id:'handoff-form',values:{next:'Dad'}},preventDefault(){}});assert.match(app.nodes.get('main').innerHTML,/Saving is unavailable/);
});
test('offline shell is complete and worker only handles its own app',async()=>{
 const script=read('sw.js'),handlers={},cachedAssets=[],deleted=[];let cacheMatch=true,fetches=0;
 const cache={addAll:async assets=>cachedAssets.push(...assets),match:async()=>cacheMatch?new Response('cached'):undefined};
 const ctx={URL,Response,caches:{open:async()=>cache,keys:async()=>['baby-playbook-v1','tiny-signs-v1','other-app'],delete:async key=>deleted.push(key)},fetch:async()=>{fetches++;throw Error('offline');},self:{location:{origin:'https://darrahdata.github.io'},registration:{scope:'https://darrahdata.github.io/baby-playbook/'},clients:{claim:async()=>{}},addEventListener:(type,fn)=>handlers[type]=fn}};
 vm.runInNewContext(script,ctx);let waiting;handlers.install({waitUntil:p=>waiting=p});await waiting;
 for(const asset of cachedAssets)assert.ok(fs.existsSync(new URL(asset==='./'?'index.html':asset,root)),asset);
 handlers.activate({waitUntil:p=>waiting=p});await waiting;assert.deepEqual(deleted,['baby-playbook-v1']);
 let response;handlers.fetch({request:{url:'https://darrahdata.github.io/tiny-signs/',method:'GET'},respondWith:p=>response=p});assert.equal(response,undefined);
 handlers.fetch({request:{url:'https://darrahdata.github.io/baby-playbook/app.js',method:'GET'},respondWith:p=>response=p});assert.equal(await (await response).text(),'cached');assert.equal(fetches,0);
 const manifest=JSON.parse(read('manifest.webmanifest'));assert.equal(manifest.scope,'./');assert.equal(manifest.id,'/baby-playbook/');
});
