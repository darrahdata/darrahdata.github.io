import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCatalog,mysterySets,massSections} from './content.mjs';
import {encodeSet,decodeSet,validateSet,shareURL,moveStep,MAX_STEPS,defaultClassTitle} from './core.mjs';

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

test('default names use the local calendar date and the class sequence',()=>{
  const date=new Date(2026,9,12,23,59);
  assert.equal(defaultClassTitle(date,1),'October 12, 2026 · Class 1');
  assert.equal(defaultClassTitle(date,2),'October 12, 2026 · Class 2');
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
