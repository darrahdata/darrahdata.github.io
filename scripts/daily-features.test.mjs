import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as challengeCore from '../assets/home/challenge-core.mjs';
import { spawnSync } from 'node:child_process';
import { localDateKey, dailyIndex, dailyItem, watchLocalDay } from '../assets/daily-cycle.mjs';
import { chooseChallenge, freshAttempt, restoreAttempt, answerQuestion, advanceQuestion, scoreAttempt, loadAttempt, saveAttempt, renderRound } from '../assets/home/challenge-core.mjs';
const sets = JSON.parse(fs.readFileSync(new URL('../assets/home/challenges.json',import.meta.url)));
const day = offset => new Date(2026,8,7+offset,12);

test('all 138 daily slots are unique before restarting, regardless of visit time',()=>{
 const items=Array.from({length:138},(_,id)=>({id}));
 assert.equal(new Set(items.map((_,index)=>dailyItem(items,day(index)).item.id)).size,138);
 assert.equal(dailyItem(items,day(138)).item.id,0);
 assert.equal(dailyItem(items,new Date(2026,8,8,0,0,0)).item.id,1);
 assert.equal(dailyItem(items,new Date(2026,8,8,23,59,59)).item.id,1);
 assert.equal(dailyItem(items,day(-1)).item.id,137);
 assert.throws(()=>dailyItem([],day(0)),RangeError);
});

test('calendar rotation works at DST, leap day, year end, and opposing timezones',()=>{
 const moduleUrl=new URL('../assets/daily-cycle.mjs',import.meta.url).href;
 for(const TZ of ['America/Los_Angeles','Pacific/Kiritimati','Pacific/Honolulu','UTC']){
  const script=`import assert from 'node:assert/strict';import {dailyIndex,localDateKey} from ${JSON.stringify(moduleUrl)};const dates=[[2026,2,8],[2026,10,1],[2028,1,29],[2026,11,31]];for(const [y,m,d] of dates){const before=new Date(y,m,d,23,59,59),after=new Date(y,m,d+1,0,0,0);assert.equal((dailyIndex(138,after)-dailyIndex(138,before)+138)%138,1);}assert.equal(localDateKey(new Date(2026,8,7,23,59)),'2026-09-07');assert.equal(dailyIndex(138,new Date(2026,8,7,0)),0);`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',script],{env:{...process.env,TZ},encoding:'utf8'});assert.equal(result.status,0,TZ+result.stderr);
 }
});

test('midnight and resume recalculate the date, without duplicate changes or leaked timers',()=>{
 let now=day(0),callback,delay;const changes=[],events=new Map();
 const target={addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
 const stop=watchLocalDay(date=>changes.push(localDateKey(date)),{now:()=>now,timers:{setTimeout:(fn,ms)=>{callback=fn;delay=ms;return 1;},clearTimeout(){}},windowTarget:target,documentTarget:target});
 assert.deepEqual(changes,['2026-09-07']);callback();assert.equal(changes.length,1);assert.ok(delay<=60000);
 now=new Date(2026,8,7,23,59,59);callback();assert.ok(delay<1100);
 now=new Date(2026,8,8,0,0,0);callback();assert.equal(changes.at(-1),'2026-09-08');
 now=day(5);events.get('pageshow')();assert.equal(changes.at(-1),'2026-09-12');events.get('focus')();assert.equal(changes.length,3);
 now.getTimezoneOffset=()=>999;events.get('focus')();assert.equal(changes.length,4,'same-day timezone change refreshes a stored Date');
 stop();assert.equal(events.size,0);now=day(6);callback();assert.equal(changes.length,4);
});

test('30 mixed daily challenges contain 90 valid questions and lesson paths',()=>{
 assert.equal(sets.length,30);assert.equal(new Set(sets.map(s=>s.id)).size,30);
 const ids=new Set();for(const set of sets){assert.equal(set.questions.length,3);assert.deepEqual(set.questions.map(q=>q.appId).sort(),['ave-maria','baby-playbook','tiny-signs']);for(const q of set.questions){assert.ok(!ids.has(q.id));ids.add(q.id);assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<3);assert.ok(q.explanation&&q.prompt);const u=new URL(q.learnUrl);assert.equal(u.origin,'https://darrahdata.github.io');assert.ok(fs.existsSync(new URL('..'+u.pathname+'index.html',import.meta.url)));}}
 assert.equal(ids.size,90);assert.equal(new Set(sets.map((_,i)=>chooseChallenge(sets,day(i)).item.id)).size,30);
 assert.equal(chooseChallenge(sets,day(30)).item.id,sets[0].id);
});

test('answers lock in once, steps cannot be skipped, and completion scores correctly',()=>{
 const daily=chooseChallenge(sets,day(0));let attempt=freshAttempt(daily),challenge=daily.item;
 assert.equal(advanceQuestion(attempt,challenge),attempt);assert.equal(answerQuestion(attempt,challenge,-1),attempt);
 attempt=answerQuestion(attempt,challenge,challenge.questions[0].answer);
 assert.equal(scoreAttempt(attempt,challenge),1);assert.equal(answerQuestion(attempt,challenge,2),attempt);
 assert.match(renderRound(attempt,challenge),/That’s right/);assert.match(renderRound(attempt,challenge),/disabled/);
 attempt=advanceQuestion(attempt,challenge);attempt=answerQuestion(attempt,challenge,(challenge.questions[1].answer+1)%3);assert.match(renderRound(attempt,challenge),/Good to know/);
 attempt=advanceQuestion(attempt,challenge);attempt=answerQuestion(attempt,challenge,challenge.questions[2].answer);attempt=advanceQuestion(attempt,challenge);
 assert.equal(attempt.step,3);assert.equal(scoreAttempt(attempt,challenge),2);assert.match(renderRound(attempt,challenge),/2 out of 3 correct/);assert.match(renderRound(attempt,challenge),/Daily discovery complete/);
 assert.equal(advanceQuestion(attempt,challenge),attempt);
});

test('reload restores answers; a new day or changed questions starts fresh',()=>{
 const daily=chooseChallenge(sets,day(0));let value;const store={getItem:()=>value,setItem:(k,v)=>value=v};
 const attempt=answerQuestion(freshAttempt(daily),daily.item,0);assert.ok(saveAttempt(store,attempt));assert.deepEqual(loadAttempt(store,daily).attempt,attempt);
 assert.deepEqual(loadAttempt(store,chooseChallenge(sets,day(1))).attempt.answers,[]);
 const modified=structuredClone(daily);modified.item.questions[0].prompt+=' updated';assert.deepEqual(restoreAttempt(attempt,modified).answers,[]);
 assert.deepEqual(restoreAttempt({...attempt,answers:[99]},daily).answers,[]);
 value='{broken';assert.ok(loadAttempt(store,daily).error);assert.equal(saveAttempt({setItem(){throw Error('blocked');}},attempt),false);
});

test('question rendering escapes content and the challenge exists only on the collection homepage',()=>{
 const daily=structuredClone(chooseChallenge(sets,day(0)));daily.item.questions[0].prompt='<img src=x onerror=alert(1)>';
 const html=renderRound(freshAttempt(daily),daily.item);assert.ok(!html.includes('<img'));assert.match(html,/&lt;img/);
 const home=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(home,/id="daily-challenge"/);
 for(const app of ['tiny-signs/dev.html','baby-playbook/index.html','rosary-v2/index.html','books/index.html'])assert.ok(!fs.readFileSync(new URL('../'+app,import.meta.url),'utf8').includes('daily-challenge.mjs'));
});

test('mixed rounds rotate the starting app and retain a full no-repeat question cycle',()=>{
 assert.deepEqual(sets.slice(0,3).map(set=>set.questions[0].appId),['ave-maria','tiny-signs','baby-playbook']);
 const kinds=new Set(sets.flatMap(set=>set.questions.map(q=>q.kind)));
 for(const kind of ['Name that prayer','Complete the prayer','Name that sign','Mystery trivia','What would you do?'])assert.ok(kinds.has(kind),kind);
 const links=challengeCore.renderAppLinks(sets[0],'ave-maria');
 assert.equal((links.match(/<a /g)||[]).length,3);assert.equal((links.match(/aria-current=/g)||[]).length,1);
});

test('prayer excerpts and video questions render accessible clues with appropriate credits',()=>{
 const questions=sets.flatMap(set=>set.questions),videos=questions.filter(q=>q.media);
 const media=JSON.parse(fs.readFileSync(new URL('../tiny-signs/src/data/media.json',import.meta.url)));
 assert.equal(videos.length,10);
 for(const q of questions){
  assert.ok(q.appName&&q.appUrl&&q.kind);
  if(['Name that prayer','Complete the prayer'].includes(q.kind))assert.ok(q.clue.split(/\s+/).length<=25);
  if(!q.media)continue;
  const signId=new URL(q.learnUrl).hash.split('/').at(-1);
  assert.equal(q.media.src,'/tiny-signs/'+media[signId].src);
  assert.equal(q.media.poster,'/tiny-signs/'+media[signId].poster);
  assert.equal(q.media.sourceUrl,media[signId].sourceUrl);
  for(const path of [q.media.src,q.media.poster])assert.ok(fs.existsSync(new URL('..'+path,import.meta.url)),path);
  const set={...sets[0],questions:[q,...sets[0].questions.slice(1)]};
  const daily={item:set,dateKey:'2026-09-08'},attempt=freshAttempt(daily),html=renderRound(attempt,set);
  assert.match(html,/aria-label="Mystery sign demonstration"/);assert.match(html,/Half speed/);assert.match(html,/Read a movement clue/);assert.match(html,/CC BY-NC-SA 4.0/);
  assert.ok(!html.includes(q.media.sourceUrl),'do not link the named source until the answer is revealed');assert.ok(!html.includes('autoplay'));
  const answered=answerQuestion(attempt,set,q.answer);assert.ok(renderRound(answered,set).includes(q.media.sourceUrl));
 }
 const q=questions.find(q=>q.kind==='Name that prayer'),set={...sets[0],questions:[q,...sets[0].questions.slice(1)]};
 assert.match(renderRound(freshAttempt({item:set,dateKey:'2026-09-08'}),set),/<blockquote class="challenge-quote">/);
});

async function challengeRuntime({failLoad=false,stored=null}={}){
 const nodes=new Map(),events={},saves=[];let playCount=0,pauseCount=0;
 const video={currentTime:8,playbackRate:1,pause(){pauseCount++;},play(){playCount++;return Promise.resolve();}};
 const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',hidden:true,setAttribute(){},focus(){},replaceChildren(value){this.textContent=value;},addEventListener:(type,fn)=>events[id+':'+type]=fn});return nodes.get(id);};
 const root=node('daily-challenge');root.querySelectorAll=selector=>selector==='video'&&node('challenge-round').innerHTML.includes('<video')?[video]:[];
 root.querySelector=selector=>selector==='video'?root.querySelectorAll('video')[0]||null:selector==='.challenge-media-error'?node('media-error'):null;
 const sandbox={...challengeCore,document:{getElementById:node},localStorage:{getItem:()=>stored,setItem:(key,value)=>{stored=value;saves.push(value);}},fetch:async()=>({ok:!failLoad,json:async()=>structuredClone(sets)}),URL,Date,Number,Boolean,Array,console,watchLocalDay:callback=>callback(day(1))};
 const script=fs.readFileSync(new URL('../assets/home/daily-challenge.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('import.meta.url',JSON.stringify('https://darrahdata.github.io/assets/home/daily-challenge.mjs')).replace(/start\(\);\s*$/,'globalThis.started = start();');
 vm.createContext(sandbox);vm.runInContext(script,sandbox);await sandbox.started;
 const click=(selector,data={})=>events['daily-challenge:click']({target:{closest:key=>key===selector?{dataset:data}:null}});
 return {nodes,events,video,saves,click,get plays(){return playCount;},get pauses(){return pauseCount;}};
}

test('live event handlers wire replay, half speed, media fallback, answer feedback and all three apps',async()=>{
 const app=await challengeRuntime();assert.match(app.nodes.get('challenge-round').innerHTML,/<video/);
 app.click('[data-replay]');assert.equal(app.video.currentTime,0);assert.equal(app.plays,1);
 app.events['daily-challenge:change']({target:{matches:selector=>selector==='[data-speed]',value:'0.5'}});assert.equal(app.video.playbackRate,0.5);
 app.events['daily-challenge:error']({target:{tagName:'VIDEO'}});assert.equal(app.nodes.get('media-error').hidden,false);
 const today=chooseChallenge(sets,day(1)).item;
 for(const q of today.questions){app.click('[data-answer]',{answer:String(q.answer)});assert.ok(app.nodes.get('challenge-round').innerHTML.includes('Find it in '+q.appName));app.click('[data-next]');}
 assert.ok(app.pauses>0,'outgoing video is paused');assert.match(app.nodes.get('challenge-round').innerHTML,/3 out of 3 correct/);
 for(const name of ['Ave Maria','Tiny Signs','Baby Playbook'])assert.ok(app.nodes.get('challenge-round').innerHTML.includes(name));
 const restored=await challengeRuntime({stored:app.saves.at(-1)});assert.match(restored.nodes.get('challenge-round').innerHTML,/3 out of 3 correct/);
 const failed=await challengeRuntime({failLoad:true});assert.match(failed.nodes.get('challenge-round').innerHTML,/couldn’t load/);assert.ok(failed.events['challenge-retry:click']);
});
