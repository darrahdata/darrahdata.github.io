import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCatalog,mysterySets,massSections} from './content.mjs';
import {encodeSet,decodeSet,validateSet,shareURL,moveStep,groupSteps,setStepCount,moveStepGroup,MAX_STEPS,defaultClassTitle} from './core.mjs';

const data=JSON.parse(fs.readFileSync(new URL('./prayers.json',import.meta.url)));
const catalog=createCatalog(data);

test('the library preserves every prayer and all twenty mystery texts',()=>{
  for(const [id,item] of Object.entries(data.prayers))assert.equal(catalog.get(id).text,item.text);
  assert.equal([...catalog.values()].filter(item=>item.kind==='mystery').length,20);
  for(const set of mysterySets)for(let index=0;index<5;index++){
    const item=catalog.get(`${set.key}-${index+1}`);
    assert.equal(item.text,data.mysteries[set.key].list[index][2]);
    assert.ok(fs.existsSync(new URL(item.image,import.meta.url)));
  }
});

test('shared sets round-trip Unicode, repetitions and order without changing older links',()=>{
  const original={version:1,title:'María & St. Joseph • OCIA',ids:['cross','hailMary','hailMary','joyful-1','niceneCreed']};
  const encoded=encodeSet(original,catalog);
  assert.deepEqual(decodeSet(encoded,catalog),original);
  original.ids.reverse();original.title='Next week';
  assert.notDeepEqual(decodeSet(encoded,catalog),original);
  assert.deepEqual(decodeSet(encoded,catalog).ids,['cross','hailMary','hailMary','joyful-1','niceneCreed']);
});

test('invalid links, unknown prayers and excessive payloads are rejected',()=>{
  const valid={version:1,title:'OCIA',ids:['cross']};
  for(const patch of [{version:2},{title:1},{title:'x'.repeat(81)},{ids:['__proto__']},{ids:['no-prayer']},{ids:'cross'},{ids:Array(MAX_STEPS+1).fill('cross')}])assert.throws(()=>validateSet({...valid,...patch},catalog));
  for(const payload of ['', '!!!','A'.repeat(6001),btoa('null'),btoa(JSON.stringify([1,'Empty',[]])),btoa(JSON.stringify([99,'Old',['cross']]))])assert.throws(()=>decodeSet(payload,catalog));
  assert.throws(()=>encodeSet({...valid,ids:[]},catalog));
});

test('optional class creators round-trip without changing existing class links',()=>{
  const legacy={version:1,title:'10/13/2026 OCIA',ids:['joyful-1','ourFather',...Array(10).fill('hailMary'),'gloryBe','fatima']};
  const previous=Buffer.from(JSON.stringify([1,legacy.title,legacy.ids])).toString('base64url');
  assert.equal(encodeSet(legacy,catalog),previous);
  assert.deepEqual(decodeSet(previous,catalog),legacy);
  assert.equal(encodeSet({...legacy,createdBy:'   '},catalog),previous);
  const credited={...legacy,createdBy:'María & John'};
  assert.deepEqual(decodeSet(encodeSet({...credited,createdBy:'  María & John  '},catalog),catalog),credited);
  assert.notEqual(encodeSet(credited,catalog),previous);
  assert.deepEqual(validateSet(credited,catalog),credited);
  for(const createdBy of [null,1,{},'x'.repeat(81)]){
    assert.throws(()=>validateSet({...legacy,createdBy},catalog));
    const invalid=Buffer.from(JSON.stringify([1,legacy.title,legacy.ids,createdBy])).toString('base64url');
    assert.throws(()=>decodeSet(invalid,catalog));
  }
});

test('class data stays in the URL fragment and works beneath a GitHub Pages path',()=>{
  const url=new URL(shareURL({version:1,title:'Class',ids:['cross']},catalog,'https://darrahdata.github.io/ocia/?old=1#anything'));
  assert.equal(url.pathname,'/ocia/');assert.equal(url.search,'');
  assert.deepEqual(decodeSet(url.hash.slice(7),catalog).ids,['cross']);
});

test('ordering is immutable and stays within bounds',()=>{
  const ids=['cross','ourFather','hailMary'];
  assert.deepEqual(moveStep(ids,1,-1),['ourFather','cross','hailMary']);
  assert.deepEqual(moveStep(ids,0,-1),ids);assert.deepEqual(moveStep(ids,2,1),ids);
  assert.deepEqual(ids,['cross','ourFather','hailMary']);
});

test('consecutive repetitions group without combining separate prayer placements',()=>{
  const ids=['cross','hailMary','hailMary','ourFather','hailMary'];
  assert.deepEqual(groupSteps(ids),[
    {id:'cross',start:0,count:1},
    {id:'hailMary',start:1,count:2},
    {id:'ourFather',start:3,count:1},
    {id:'hailMary',start:4,count:1}
  ]);
  assert.deepEqual(groupSteps([]),[]);
  assert.deepEqual(ids,['cross','hailMary','hailMary','ourFather','hailMary']);
});

test('ten repetitions keep the version-one sharing format and reading order',()=>{
  const ids=['cross','hailMary','joyful-1'];
  const repeated=setStepCount(ids,1,10);
  assert.deepEqual(repeated,['cross',...Array(10).fill('hailMary'),'joyful-1']);
  assert.deepEqual(ids,['cross','hailMary','joyful-1']);
  const original={version:1,title:'Rosary class',ids:repeated};
  assert.deepEqual(decodeSet(encodeSet(original,catalog),catalog),original);
  assert.deepEqual(groupSteps(decodeSet(encodeSet(original,catalog),catalog).ids),[
    {id:'cross',start:0,count:1},
    {id:'hailMary',start:1,count:10},
    {id:'joyful-1',start:11,count:1}
  ]);
});

test('repeat changes and removals affect the entire selected run only',()=>{
  const ids=['cross','hailMary','hailMary','ourFather','hailMary'];
  assert.deepEqual(setStepCount(ids,1,3),['cross','hailMary','hailMary','hailMary','ourFather','hailMary']);
  assert.deepEqual(setStepCount(ids,1,1),['cross','hailMary','ourFather','hailMary']);
  assert.deepEqual(setStepCount(ids,1,0),['cross','ourFather','hailMary']);
  assert.deepEqual(setStepCount(['cross','cross'],0,0),[]);
  assert.deepEqual(ids,['cross','hailMary','hailMary','ourFather','hailMary']);
  for(const count of [-1,MAX_STEPS+1,1.5,NaN,Infinity,'2'])assert.throws(()=>setStepCount(ids,1,count),/repeat count/);
  for(const start of [-1,2,ids.length,0.5,NaN,'1'])assert.throws(()=>setStepCount(ids,start,2),/start/);
  assert.throws(()=>setStepCount([],0,1),/start/);
});

test('moving a group preserves all repetitions and leaves bounds unchanged',()=>{
  const ids=['cross','hailMary','hailMary','ourFather','ourFather','ourFather'];
  assert.deepEqual(moveStepGroup(ids,1,-1),['hailMary','hailMary','cross','ourFather','ourFather','ourFather']);
  assert.deepEqual(moveStepGroup(ids,1,1),['cross','ourFather','ourFather','ourFather','hailMary','hailMary']);
  assert.deepEqual(moveStepGroup(ids,0,-1),ids);
  assert.deepEqual(moveStepGroup(ids,3,1),ids);
  assert.notEqual(moveStepGroup(ids,0,-1),ids);
  assert.deepEqual(ids,['cross','hailMary','hailMary','ourFather','ourFather','ourFather']);
  assert.throws(()=>moveStepGroup(ids,2,1),/start/);
  assert.throws(()=>moveStepGroup(ids,1,2),/one place/);
  assert.deepEqual(groupSteps(moveStepGroup(['hailMary','cross','hailMary'],1,1)),[
    {id:'hailMary',start:0,count:2},
    {id:'cross',start:2,count:1}
  ]);
});

test('older flat drafts retain their repeated pages, including runs longer than ten',()=>{
  const draft={version:1,title:'Existing class',ids:['cross',...Array(12).fill('hailMary'),'ourFather']};
  const restored=validateSet(JSON.parse(JSON.stringify(draft)),catalog);
  assert.deepEqual(restored,draft);
  assert.deepEqual(groupSteps(restored.ids),[
    {id:'cross',start:0,count:1},
    {id:'hailMary',start:1,count:12},
    {id:'ourFather',start:13,count:1}
  ]);
  assert.deepEqual(moveStepGroup(restored.ids,1,1),['cross','ourFather',...Array(12).fill('hailMary')]);
  assert.deepEqual(setStepCount(restored.ids,1,10),['cross',...Array(10).fill('hailMary'),'ourFather']);
  assert.deepEqual(restored,draft);
});

test('repeat changes enforce the 32-page total while permitting reductions and removal',()=>{
  const ids=[...Array(10).fill('hailMary'),...Array(10).fill('ourFather'),...Array(10).fill('gloryBe'),'cross'];
  const full=setStepCount(ids,30,2);
  assert.equal(full.length,MAX_STEPS);
  assert.deepEqual(decodeSet(encodeSet({version:1,title:'Full class',ids:full},catalog),catalog).ids,full);
  assert.throws(()=>setStepCount(ids,30,3),/32 pages/);
  assert.throws(()=>setStepCount(full,30,3),/32 pages/);
  assert.equal(setStepCount(full,0,9).length,31);
  assert.equal(setStepCount(full,0,0).length,22);
  assert.deepEqual(setStepCount(['cross'],0,MAX_STEPS),Array(MAX_STEPS).fill('cross'));
  assert.equal(setStepCount(['cross','hailMary'],1,MAX_STEPS-1).length,MAX_STEPS);
  assert.throws(()=>setStepCount(['cross','hailMary'],1,MAX_STEPS),/32 pages/);
  assert.equal(ids.length,31);
});

test('default names use only the local calendar date',()=>{
  const date=new Date(2026,9,12,23,59);
  assert.equal(defaultClassTitle(date),'October 12, 2026');
  assert.equal(defaultClassTitle(new Date(2026,9,13,0,1)),'October 13, 2026');
});

test('every Mass part has inline responses and alternatives resolve to real prayers',()=>{
  const ids=[];
  for(const section of massSections)for(const item of section.items){
    ids.push(item.id);
    for(const form of item.options||[item]){
      assert.ok(form.responses?.length,item.name);
      for(const block of form.responses)assert.ok(block.text||catalog.has(block.prayer));
    }
  }
  assert.equal(new Set(ids).size,ids.length);
});
