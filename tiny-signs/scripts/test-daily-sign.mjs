import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { dailyItem } from '../../assets/daily-cycle.mjs';
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
 const { signs }=await vite.ssrLoadModule('/src/data/signs.js');
 const { DailySignFeature }=await vite.ssrLoadModule('/src/components/DailySign.jsx');
 assert.equal(signs.length,138);
 const cycle=signs.map((_,index)=>dailyItem(signs,new Date(2026,8,7+index,12)));
 assert.equal(new Set(cycle.map(d=>d.item.id)).size,138);
 assert.equal(dailyItem(signs,new Date(2026,8,7+138,12)).item.id,signs[0].id);
 for(const daily of cycle){
  const html=renderToStaticMarkup(createElement(DailySignFeature,{daily,onOpen(){}}));
  assert.ok(html.includes(daily.item.word.replaceAll('&','&amp;')),daily.item.id);
  assert.ok(html.includes(`Sign ${daily.index+1} of 138`),daily.item.id);
  if(daily.item.demo.src)assert.ok(html.includes(daily.item.demo.src),daily.item.id);
  else {assert.ok(!html.includes('<video'),daily.item.id);assert.ok(html.includes(daily.item.demo.sourceUrl),daily.item.id);}
 }
 assert.equal(cycle.filter(d=>!d.item.demo.src).length,3);
 // The returned keyed demo remounts for each sign so old playback state cannot survive rollover.
 const one=DailySignFeature({daily:cycle[0],onOpen(){}}),two=DailySignFeature({daily:cycle[1],onOpen(){}});
 assert.equal(one.props.children[1].props.children[1].key,cycle[0].item.id);
 assert.notEqual(one.props.children[1].props.children[1].key,two.props.children[1].props.children[1].key);
 console.log('PASS: complete 138-sign cycle, matching daily labels/media, 3 external-reference fallbacks, and keyed player reset.');
} finally {await vite.close();}
