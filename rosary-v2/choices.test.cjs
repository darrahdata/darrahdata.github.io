// Exercise the actual inline prayer builders and saved-session logic without a browser.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\ninit\(\);\s*$/,'');
function fixture(){
  const elements=new Map(),storage=new Map();
  const get=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false});return elements.get(id);};
  const context=vm.createContext({window:{addEventListener:()=>{}},document:{getElementById:get,querySelector:()=>null,addEventListener:()=>{}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},Date});
  const run=code=>vm.runInContext(code,context);
  run(source);
  run("stopReadAloud=()=>{};showScreen=()=>{};startTimer=()=>{};requestWakeLock=()=>{};renderBead=()=>persistSession();trackUsage=()=>{};");
  return {run,get,storage};
}
test('style and length are independent and summaries describe every combination',()=>{
  const {run,get}=fixture();
  run("selectToday();selectStyle('one');selectPrayerStyle('dominican');");
  assert.equal(run('state.style'),'one');
  run("selectStyle('darrah');");
  assert.equal(run('state.prayerStyle'),'dominican');
  assert.equal(get('prayer-style-select').value,'dominican');
  assert.match(get('hero-meta').textContent,/Dominican.*1 Hail Mary per mystery/);
  run("selectPrayerStyle('standard');");
  assert.equal(run('state.style'),'darrah');
  assert.match(get('style-description').textContent,/all five mysteries/);
  assert.doesNotMatch(html,/New to the Rosary\?/);
});
test('all six choices cover each mystery with the requested number of Hail Marys',()=>{
  const {run}=fixture();
  for(const mystery of ['joyful','sorrowful','glorious','luminous'])for(const prayerStyle of ['standard','dominican'])for(const [length,count] of [['five',10],['one',2],['darrah',1]]){
    const beads=JSON.parse(run(`selectMystery('${mystery}');selectPrayerStyle('${prayerStyle}');selectStyle('${length}');startRosary();JSON.stringify(state.beads)`));
    const indices=beads.flatMap((b,i)=>b.kind==='mystery'?[i]:[]);
    assert.equal(indices.length,5);
    for(let i=0;i<5;i++){
      const prayers=beads.slice(indices[i]+1,indices[i+1]||beads.length).filter(b=>b.name==='Hail Mary');
      assert.equal(prayers.length,count,`${mystery}/${prayerStyle}/${length}, mystery ${i+1}`);
      for(const prayer of prayers)assert.equal(/Leader:|Response:/.test(prayer.text),prayerStyle==='dominican');
    }
    if(prayerStyle==='dominican'&&count<10){assert.doesNotMatch(beads[1].text,/5 decades/);assert.match(beads[1].text,/after each mystery/);}
    if(prayerStyle==='standard'){assert.equal(beads[0].name,'Sign of the Cross');assert.equal(beads.at(-1).name,'Sign of the Cross');}
  }
});
test('each new combination survives reload with its exact sequence, position, intention and selections',()=>{
  for(const prayerStyle of ['standard','dominican'])for(const length of ['five','one','darrah']){
    const first=fixture();
    first.run(`selectMystery('sorrowful');selectPrayerStyle('${prayerStyle}');selectStyle('${length}');startRosary();state.index=9;state.intention='Our family';persistSession();`);
    const expected=first.run('JSON.stringify(state.beads)');
    const next=fixture();next.storage.set('rosary-v2-session',first.storage.get('rosary-v2-session'));next.run('resumeSavedSession();');
    assert.equal(next.run('JSON.stringify(state.beads)'),expected);
    assert.equal(next.run('state.index'),9);assert.equal(next.run('state.intention'),'Our family');
    assert.equal(next.get('prayer-style-select').value,prayerStyle);assert.equal(next.get('style-select').value,length);
    assert.equal(JSON.parse(next.storage.get('rosary-v2-session')).version,3);
  }
});
test('all pre-update saved sequences remain identical, including the family opening and first Saturday',()=>{
  const snapshots=JSON.parse(fs.readFileSync(path.join(__dirname,'legacy-flows.fixture.json'),'utf8'));
  for(const sample of snapshots){
    const {run,storage}=fixture();
    storage.set('rosary-v2-session',JSON.stringify({version:2,mystery:sample.mystery,style:sample.style,rosary:'scriptural',firstSaturday:sample.firstSaturday,index:4,intention:'Keep our place',startedAt:Date.now()-1000}));
    for(let repeat=0;repeat<2;repeat++){
      run('resumeSavedSession();');
      const digest=createHash('sha256').update(run('JSON.stringify(state.beads)')).digest('hex');
      assert.equal(digest,sample.sha256,JSON.stringify(sample));assert.equal(run('state.index'),4);
    }
    assert.equal(JSON.parse(storage.get('rosary-v2-session')).flowVersion,2);
    run('startRosary();');assert.equal(run('state.flowVersion'),3);
  }
});
test('legacy opening migration runs only once; invalid modern choices are rejected',()=>{
  const {run,storage}=fixture();
  for(const style of ['one','five']){
    storage.set('rosary-v2-session',JSON.stringify({version:1,mystery:'joyful',style,index:0,startedAt:Date.now()}));
    run('resumeSavedSession();');assert.equal(run('state.index'),1);assert.equal(run('state.beads[state.index].name'),"Apostles' Creed");
    run('resumeSavedSession();');assert.equal(run('state.index'),1);
  }
  const valid=JSON.parse(storage.get('rosary-v2-session'));
  for(const patch of [{prayerStyle:'__proto__'},{style:'dominican'},{flowVersion:4}]){
    storage.set('rosary-v2-session',JSON.stringify({...valid,...patch}));assert.equal(run('restoreSession()'),null);
  }
});
test('first Saturday opening works for all Dominican lengths and is absent from Standard',()=>{
  const {run}=fixture();
  for(const length of ['one','five','darrah']){
    run(`selectMystery('joyful');selectStyle('${length}');selectPrayerStyle('dominican');state.firstSaturday=true;`);
    assert.match(run('buildBeads()[0].text'),/reparation/);
    run("selectPrayerStyle('standard');");assert.doesNotMatch(run('buildBeads()[0].text'),/reparation/);
  }
});
