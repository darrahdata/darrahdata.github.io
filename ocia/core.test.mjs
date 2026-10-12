import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCatalog,mysterySets,massSections} from './content.mjs';
import {encodeSet,decodeSet,validateSet,shareURL,moveStep,groupSteps,setStepCount,moveStepGroup,MAX_STEPS,defaultClassTitle,DEFAULT_TITLE} from './core.mjs';

const data=JSON.parse(fs.readFileSync(new URL('./prayers.json',import.meta.url)));
const catalog=createCatalog(data);

test('the Fatima Prayer has the corrected wording and one complete Everyone part',()=>{
  const text='O my Jesus, forgive us our sins, save us from the fires of hell; lead all souls to heaven, especially those who are in most need of Your mercy. Amen.';
  assert.equal(catalog.get('fatima').text,text);
  assert.deepEqual(catalog.get('fatima').parts,[{role:'Everyone',text}]);
});

test('the library preserves every prayer and all twenty mystery texts',()=>{
  for(const [id,item] of Object.entries(data.prayers))assert.equal(catalog.get(id).text,item.text);
  assert.equal([...catalog.values()].filter(item=>item.kind==='mystery').length,20);
  for(const set of mysterySets)for(let index=0;index<5;index++){
    const item=catalog.get(`${set.key}-${index+1}`);
    assert.equal(item.text,data.mysteries[set.key].list[index][2]);
    assert.ok(fs.existsSync(new URL(item.image,import.meta.url)));
  }
});

test('prayer participation parts preserve every word and retain Leader and Response outside Fatima',()=>{
  const prayers=[...catalog.values()].filter(item=>item.kind==='prayer');
  const normalized=text=>text.replace(/\s+/g,' ').trim();
  assert.equal(prayers.length,14);
  for(const item of prayers){
    if(item.id==='fatima')assert.deepEqual(item.parts,[{role:'Everyone',text:item.text}]);
    else{
      assert.ok(item.parts.length>=2,item.id);
      assert.deepEqual([...new Set(item.parts.map(part=>part.role))],['Leader','Response'],item.id);
    }
    assert.ok(item.parts.every(part=>part.text.length>0),item.id);
    const original=item.id==='hailHolyQueen'?item.text.replace(/\b[VR]\.\s*/g,''):item.text;
    assert.equal(normalized(item.parts.map(part=>part.text).join(' ')),normalized(original),item.id);
  }
  const queen=catalog.get('hailHolyQueen');
  assert.equal(queen.parts.length,4);
  assert.deepEqual(queen.parts.slice(-2),[
    {role:'Leader',text:'Pray for us, O holy Mother of God.'},
    {role:'Response',text:'That we may be made worthy of the promises of Christ.'}
  ]);
  assert.ok(queen.parts.every(part=>!/^\s*[VR]\./.test(part.text)));
  assert.match(queen.text,/V\. Pray for us/);
});

test('Our Father and Hail Mary use the requested class reading boundaries',()=>{
  assert.equal(catalog.get('ourFather').readerTitle,'Lord’s Prayer (Our Father)');
  assert.deepEqual(catalog.get('ourFather').parts,[
    {role:'Leader',text:'Our Father, who art in heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in heaven.'},
    {role:'Response',text:'Give us this day our daily bread; and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.'}
  ]);
  assert.deepEqual(catalog.get('hailMary').parts,[
    {role:'Leader',text:'Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus.'},
    {role:'Response',text:'Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.'}
  ]);
  assert.equal(catalog.get('fatima').parts.map(part=>part.text).join(' ').match(/O my Jesus/g).length,1);
});

test('all twenty mystery titles, Bible quotations and references match rosary-v2 verbatim',()=>{
  const source=fs.readFileSync(new URL('../rosary-v2/index.html',import.meta.url),'utf8');
  let checked=0;
  for(const set of mysterySets){
    const block=source.match(new RegExp(`const ${set.key.toUpperCase()}_SCRIPTURAL_MYSTERIES=\\[([\\s\\S]*?)\\n\\];`));
    assert.ok(block,`${set.name} has a scriptural source array`);
    const records=[...block[1].matchAll(/\{type:'[^']+',name:'([^']+)',scripture:'([^']+)',citation:'([^']+)',image:'([^']+)'\}/g)];
    assert.equal(records.length,5,`${set.name} contains exactly five source mysteries`);
    records.forEach(([,readerTitle,scripture,citation,image],index)=>{
      const id=`${set.key}-${index+1}`;
      const item=catalog.get(id);
      assert.deepEqual({readerTitle:item.readerTitle,scripture:item.scripture,citation:item.citation},{readerTitle,scripture,citation},id);
      assert.match(item.scripture,/^“.+”$/,`${id} retains its quotation marks`);
      assert.equal(item.id,id);
      assert.equal(item.name,data.mysteries[set.key].list[index][0]);
      assert.equal(item.image,data.mysteries[set.key].list[index][3]);
      assert.equal(item.image,image);
      checked++;
    });
  }
  assert.equal(checked,20);
  assert.equal(catalog.get('joyful-1').readerTitle,'The First Joyful Mystery: The Annunciation of the Lord.');
  assert.equal(catalog.get('joyful-2').readerTitle,'The Second Joyful Mystery: The Visitation of Mary to Elizabeth.');
  assert.equal(catalog.get('joyful-2').scripture,'“My soul doth magnify the Lord, and my spirit hath rejoiced in God my Saviour.”');
  assert.equal(catalog.get('joyful-2').citation,'(Luke 1:46-47)');
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

test('creation dates share separately from names and optional creators',()=>{
  const original={version:1,title:'Tuesday Prayers',ids:['ourFather','hailMary'],createdAt:'2026-10-13T02:03:04.567Z'};
  for(const createdBy of [undefined,'María & John']){
    const dated=createdBy?{...original,createdBy}:original;
    const encoded=encodeSet(dated,catalog);
    assert.deepEqual(JSON.parse(Buffer.from(encoded,'base64url').toString('utf8')),[1,original.title,original.ids,createdBy||'',original.createdAt]);
    assert.deepEqual(decodeSet(encoded,catalog),dated);
    assert.deepEqual(validateSet(dated,catalog),dated);
  }
  assert.equal(encodeSet({...original,createdBy:'   '},catalog),encodeSet(original,catalog));
  assert.equal(decodeSet(encodeSet({...original,title:'Renamed Prayers'},catalog),catalog).createdAt,original.createdAt);
  assert.equal(validateSet({...original,createdAt:'2024-02-29T00:00:00.000Z'},catalog).createdAt,'2024-02-29T00:00:00.000Z');
});

test('legacy links remain byte-for-byte unchanged without invented creation dates',()=>{
  for(const createdBy of [undefined,'OCIA Team']){
    const legacy={version:1,title:'10/13/2026 OCIA',ids:['cross','ourFather']};
    const payload=[1,legacy.title,legacy.ids];
    if(createdBy){legacy.createdBy=createdBy;payload.push(createdBy);}
    const oldLink=Buffer.from(JSON.stringify(payload)).toString('base64url');
    assert.equal(encodeSet(legacy,catalog),oldLink);
    assert.deepEqual(decodeSet(oldLink,catalog),legacy);
    assert.equal(Object.hasOwn(validateSet(legacy,catalog),'createdAt'),false);
    assert.equal(Object.hasOwn(decodeSet(oldLink,catalog),'createdAt'),false);
  }
});

test('invalid creation dates are rejected in drafts and shared links',()=>{
  const valid={version:1,title:'Prayer Set',ids:['cross']};
  for(const createdAt of [null,0,{},[],new Date('2026-10-13T00:00:00.000Z'),'', 'not a date',
    '2026-10-13T00:00:00Z','2026-10-13T00:00:00.000+00:00','2026-10-13T00:00:00.000Z ',
    '2026-02-29T00:00:00.000Z','2026-02-30T00:00:00.000Z','2026-13-01T00:00:00.000Z',
    '2026-10-13T24:00:00.000Z','2026-10-13T00:60:00.000Z','2026-10-13T00:00:60.000Z']){
    assert.throws(()=>validateSet({...valid,createdAt},catalog));
    if(!(createdAt instanceof Date)){
      const invalid=Buffer.from(JSON.stringify([1,valid.title,valid.ids,'',createdAt])).toString('base64url');
      assert.throws(()=>decodeSet(invalid,catalog));
    }
  }
});

test('creation and update calendar dates stay exact in shared metadata',()=>{
  const set={version:1,title:'OCIA Class',ids:['joyful-1','ourFather',...Array(10).fill('hailMary'),'gloryBe','fatima'],createdBy:'Rhoda',createdAt:'2026-10-13',updatedAt:'2026-10-13'};
  const encoded=encodeSet(set,catalog);
  assert.deepEqual(JSON.parse(Buffer.from(encoded,'base64url').toString('utf8')),[1,set.title,set.ids,'Rhoda','2026-10-13','2026-10-13']);
  assert.deepEqual(decodeSet(encoded,catalog),set,'Date-only metadata must not gain a timezone or invented time');
  assert.deepEqual(validateSet(set,catalog),set);
  const mixed={...set,updatedAt:'2026-10-14T04:05:06.789Z'};
  assert.deepEqual(decodeSet(encodeSet(mixed,catalog),catalog),mixed);
  const leap={...set,createdAt:'2024-02-29',updatedAt:'2024-02-29'};
  assert.deepEqual(decodeSet(encodeSet(leap,catalog),catalog),leap);
});

test('update metadata preserves unknown creation dates and older five-field links',()=>{
  const base={version:1,title:'Legacy Prayer Set',ids:['cross']};
  for(const createdBy of [undefined,'OCIA Team']){
    const updated={...base,...(createdBy?{createdBy}:{}),updatedAt:'2026-10-13'};
    const encoded=encodeSet(updated,catalog);
    assert.deepEqual(JSON.parse(Buffer.from(encoded,'base64url').toString('utf8')),[1,base.title,base.ids,createdBy||'','','2026-10-13']);
    assert.deepEqual(decodeSet(encoded,catalog),updated);
    assert.equal(Object.hasOwn(decodeSet(encoded,catalog),'createdAt'),false);
  }
  for(const createdAt of ['2026-10-13','2026-10-13T01:02:03.456Z']){
    const older={...base,createdAt};
    const link=Buffer.from(JSON.stringify([1,base.title,base.ids,'',createdAt])).toString('base64url');
    assert.equal(encodeSet(older,catalog),link);
    assert.deepEqual(decodeSet(link,catalog),older);
    assert.equal(Object.hasOwn(decodeSet(link,catalog),'updatedAt'),false);
  }
});

test('both metadata dates reject invalid calendar values and nonstring placeholders',()=>{
  const base={version:1,title:'Dates',ids:['cross']};
  const invalidDates=[null,0,false,{},[],'','2026-2-03','2026-02-3','2026-02-29','2024-02-30','2026-04-31','2026-00-01','2026-13-01','2026-10-00','2026-10-32','2026-10-13 ','2026/10/13','October 13, 2026'];
  for(const field of ['createdAt','updatedAt'])for(const date of invalidDates)assert.throws(()=>validateSet({...base,[field]:date},catalog),`${field}: ${String(date)}`);
  for(const date of invalidDates){
    const link=Buffer.from(JSON.stringify([1,base.title,base.ids,'','2026-10-13',date])).toString('base64url');
    assert.throws(()=>decodeSet(link,catalog));
  }
  for(const creationDate of [null,0,false,{},[]]){
    const link=Buffer.from(JSON.stringify([1,base.title,base.ids,'',creationDate,'2026-10-13'])).toString('base64url');
    assert.throws(()=>decodeSet(link,catalog),'Only the exact empty string is a missing-creation-date placeholder');
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

test('default prayer set names are independent of creation dates',()=>{
  assert.equal(DEFAULT_TITLE,'My Prayer Set');
  assert.equal(defaultClassTitle(),'My Prayer Set');
  assert.equal(validateSet({version:1,title:'   ',ids:['cross']},catalog).title,'My Prayer Set');
});

test('every Mass part has guidance and spoken responses resolve to real prayers',()=>{
  const ids=[];
  for(const section of massSections)for(const item of section.items){
    ids.push(item.id);
    assert.ok(item.when?.trim(),`${item.name} explains when it is used`);
    if(['homily','psalm'].includes(item.id)){
      assert.ok(item.note?.trim(),`${item.name} explains how to follow along`);
      assert.equal(item.responses?.length||0,0);
      continue;
    }
    for(const form of item.options||[item]){
      assert.ok(form.responses?.length,item.name);
      for(const block of form.responses)assert.ok(block.text||catalog.has(block.prayer)||block.cue?.text,`${item.name} contains spoken words or a real prayer`);
    }
  }
  assert.equal(new Set(ids).size,ids.length);
});
