import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

test('12 daily challenges have 36 valid questions and live app paths',()=>{
 assert.equal(sets.length,12);assert.equal(new Set(sets.map(s=>s.id)).size,12);
 const ids=new Set();for(const set of sets){assert.equal(set.questions.length,3);for(const q of set.questions){assert.ok(!ids.has(q.id));ids.add(q.id);assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<3);assert.ok(q.explanation&&q.prompt);const u=new URL(q.learnUrl);assert.equal(u.origin,'https://darrahdata.github.io');assert.ok(fs.existsSync(new URL('..'+u.pathname+'index.html',import.meta.url)));}}
 assert.equal(ids.size,36);assert.equal(new Set(sets.map((_,i)=>chooseChallenge(sets,day(i)).item.id)).size,12);
 assert.equal(chooseChallenge(sets,day(12)).item.id,sets[0].id);
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
