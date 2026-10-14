import {qrcode} from './vendor/qrcode.mjs';
import {MAX_STEPS,defaultClassTitle,validateSet,encodeSet,decodeSet,shareURL,groupSteps,setStepCount,moveStepGroup} from './core.mjs?v=20261012-prayer-beads';
import {createCatalog,mysterySets,massSections} from './content.mjs?v=20261013-prayer-roles';

const $ = id => document.getElementById(id);
const main = $('main'), dialog = $('dialog');
const dockObserver=new ResizeObserver(entries=>{
  document.documentElement.style.setProperty('--dock-height',`${Math.ceil(entries[0].target.getBoundingClientRect().height)}px`);
});
const navObserver=new ResizeObserver(entries=>{
  const nav=entries[0].target;
  const textSize=parseFloat(getComputedStyle(document.documentElement).fontSize);
  const columns=entries[0].contentRect.width<textSize*16?'2':'4';
  if(nav.style.getPropertyValue('--nav-columns')!==columns)requestAnimationFrame(()=>nav.style.setProperty('--nav-columns',columns));
  document.documentElement.style.setProperty('--nav-height',`${Math.ceil(nav.getBoundingClientRect().height)}px`);
});
navObserver.observe($('primary-nav'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const action = (key,label,glyph='',extra='') => `<button type="button" data-action="${key}" ${extra}><span class="button-content">${glyph?icon(glyph):''}${escape(label)}</span></button>`;
const iconButton = (key,label,glyph,extra='') => `<button type="button" class="action-icon" data-action="${key}" aria-label="${escape(label)}" title="${escape(label)}" ${extra}>${icon(glyph)}</button>`;
const blankSet = () => {
  const now=new Date().toISOString();
  return {version:1,title:defaultClassTitle(),ids:[],createdAt:now,updatedAt:now};
};
let catalog, toastTimer, returnFocus, pickerUndo, storageOK = true;
let state = {view:'help',mystery:null,query:'',reader:null,builder:null,saved:[],savedId:null,resume:null,share:null,builderOpen:false,classOverview:false};

function notify(message) {
  clearTimeout(toastTimer); $('toast').textContent=message; $('toast').hidden=false;
  toastTimer=setTimeout(()=>$('toast').hidden=true,4200);
}
function clearNotice() {clearTimeout(toastTimer);$('toast').hidden=true;}
function readStore(key,fallback) {try {return JSON.parse(localStorage.getItem(`ocia-${key}`)) ?? fallback;}catch{return fallback;}}
function writeStore(key,value) {try {localStorage.setItem(`ocia-${key}`,JSON.stringify(value));return true;}catch{storageOK=false;notify('This browser cannot save your place. You can still use a prayer set link.');return false;}}
function validStoredSet(value) {try{return validateSet(value,catalog);}catch{return null;}}
function hydrate() {
  const draft=readStore('draft',null);
  state.builder=validStoredSet(draft) || blankSet();
  const saved=readStore('sets',[]);
  state.saved=Array.isArray(saved)?saved.filter(entry=>typeof entry?.id==='string'&&validStoredSet(entry.set)).slice(0,20):[];
  state.savedId=state.saved.some(entry=>entry.id===draft?.savedId)?draft.savedId:null;
  state.builderOpen=readStore('builder-open',false)===true;
  if(!validStoredSet(draft))persistDraft();
  const resume=readStore('resume',null);
  if(resume && validStoredSet(resume.set)?.ids.length && Number.isInteger(resume.index) && resume.index>=-1)state.resume={set:validStoredSet(resume.set),index:Math.min(resume.index,resume.set.ids.length-1),withIntro:resume.withIntro===true||resume.index===-1};
}
function icons() {window.lucide?.createIcons();}
function sectionHeading(title,description) {return `<header class="section-heading"><h1>${escape(title)}</h1>${description?`<p>${escape(description)}</p>`:''}</header>`;}
function row(item) {return `<li class="prayer-row"><button type="button" class="prayer-open" data-action="read-item" data-id="${item.id}"><span><strong>${escape(item.name)}</strong><span>${escape(item.kind==='mystery'?`Mystery ${item.order} · ${item.desire}`:item.summary)}</span></span>${icon('chevron-right')}</button></li>`;}
function resumeMarkup() {return state.resume?`<section class="intro-action"><div><span class="eyebrow">Continue Where You Left Off</span><h2>${escape(state.resume.set.title)}</h2><p>${state.resume.index<0?'Ready to Begin':`${state.resume.index+1} of ${state.resume.set.ids.length} · ${escape(catalog.get(state.resume.set.ids[state.resume.index]).name)}`}</p></div>${action('resume','Continue','arrow-right','class="secondary"')}</section>`:'';}
function prayerGroups(query='') {
  const matches=[...catalog.values()].filter(item=>item.kind==='prayer'&&`${item.name} ${item.summary}`.toLowerCase().includes(query.toLowerCase()));
  return matches.length?['Essentials','Creeds','Daily Prayer','Other Prayers'].map(group=>{
    const entries=matches.filter(item=>item.category===group);
    return entries.length?`<section><div class="split-heading"><h2>${group}</h2><span class="eyebrow">${entries.length} Prayers</span></div><ul class="prayer-list">${entries.map(item=>row(item)).join('')}</ul></section>`:'';
  }).join(''):'<p class="empty" role="status">No prayers found. Try a prayer name such as “Our Father.”</p>';
}
function renderPrayers() {
  if(state.mystery){renderMysteries();return;}
  main.innerHTML=`<section class="intro-action"><div><h1>Begin With Essentials</h1><p>Sign of the Cross · Our Father · Hail Mary · Glory Be</p></div>${action('essentials','Pray Together','arrow-right','class="primary"')}</section>${resumeMarkup()}
    <input id="prayer-search" type="search" aria-label="Find a Prayer" placeholder="Find a Prayer" value="${escape(state.query)}" autocomplete="off">
    <div id="prayer-groups" class="prayer-groups">${prayerGroups(state.query)}</div>${mysteryLibrary()}`;
}
function mysteryLibrary() {
  return `<section id="mysteries" class="mystery-library" aria-labelledby="mysteries-heading"><header class="section-heading"><h2 id="mysteries-heading" tabindex="-1">Mysteries of the Rosary</h2><p>Twenty key scenes from the life of Jesus Christ and the Virgin Mary to contemplate while reciting the prayers of the Rosary. Each set has five mysteries.</p></header>
    <ul class="chapter-list">${mysterySets.map(set=>`<li><button type="button" class="chapter" data-action="mystery-set" data-id="${set.key}"><img src="${set.image}" alt="" loading="lazy" width="76" height="96"><span><strong>${set.name}</strong><span class="theme">${escape(set.theme)}</span><small>Usually Prayed: ${escape(set.days)}</small></span>${icon('chevron-right')}</button></li>`).join('')}</ul>
    <p class="source-note">These are customary days; your group may choose any mystery.</p></section>`;
}
function renderMysteries() {
  const set=mysterySets.find(item=>item.key===state.mystery);
  const items=[...catalog.values()].filter(item=>item.category===`${set.name} Mysteries`);
  main.innerHTML=action('all-mysteries','All Mysteries','arrow-left','class="back-link"')+sectionHeading(`${set.name} Mysteries`,set.theme)+
    `<div class="inline-actions">${action('reflect-set','Reflect on All Five','book-open','class="primary"')}</div><ul class="prayer-list">${items.map(item=>row(item)).join('')}</ul>
    <p class="source-note">Usually Prayed: ${escape(set.days)}</p>`;
}
function spokenMarkup(text) {
  return text.split(/(?:^|\n)(\([^\n]*\))(?=\n|$)/).filter(part=>part.trim()).map(part=>{
    const words=part.trim();
    return /^\([^()\n]*\)$/.test(words)?`<span class="prayer-direction">${escape(words)}</span>`:`<q class="prayer-words" lang="en">${escape(words)}</q>`;
  }).join(' ');
}
function massSpoken(role,text) {
  const roleKind=role.startsWith('Leader')?'leader':'response';
  return `<div class="mass-turn" data-role="${roleKind}"><p class="response-label prayer-role prayer-role-${roleKind}">${escape(role)}:</p><p class="mass-prayer">${spokenMarkup(text)}</p></div>`;
}
function massResponse(block) {
  let text=block.prayer?catalog.get(block.prayer).text:block.text;
  // The devotional prayer stays unchanged; only its Mass presentation omits the final Amen.
  if(block.atMass)text=text.replace(/\s+Amen\.$/,'');
  const lead=block.lead||(!block.cue?block.label:'');
  return `<div class="mass-response">${lead?`<p class="mass-cue">${escape(lead)}</p>`:''}${block.cue?massSpoken(block.cue.role||'Leader · Priest',block.cue.text):''}${text?massSpoken(block.role||'Response · Everyone',text):''}${block.note?`<p class="mass-note">${escape(block.note)}</p>`:''}</div>`;
}
function massForm(form) {
  return (form.responses||[]).map(massResponse).join('');
}
function renderMass() {
  main.innerHTML=sectionHeading('The Mass','Follow the Mass in order. Leader shows the priest or reader’s words; Response shows what the congregation says.')+
    `<nav class="mass-index" aria-label="Parts of the Mass">${massSections.map((section,index)=>`<a href="#mass-${section.id}">${index+1}. ${escape(section.formal)}</a>`).join('')}</nav>
    ${massSections.map((section,index)=>`<section class="mass-section" id="mass-${section.id}"><span class="eyebrow">${index+1} / 4</span><h2>${escape(section.formal)}</h2><p>${section.summary}</p>${section.items.map(item=>{
      const selected=item;
      return `<section class="mass-part" id="mass-part-${item.id}" aria-labelledby="mass-title-${item.id}"><header class="mass-part-header"><h3 class="mass-part-title" id="mass-title-${item.id}">${escape(item.name)}</h3>${item.when?`<span class="mass-when">${escape(item.when)}</span>`:''}</header>${item.note?`<p class="mass-note">${escape(item.note)}</p>`:''}<div id="mass-form-${item.id}" class="mass-form">${massForm(selected)}</div></section>`;
    }).join('')}</section>`).join('')}`;
}
function countOptions(count,maximum) {
  return Array.from({length:maximum},(_,index)=>`<option value="${index+1}" ${index+1===count?'selected':''}>×${index+1}</option>`).join('');
}
function creatorField(id) {
  return `<div class="creator-field"><label class="field-label" for="${id}">Created By (Optional)</label><input id="${id}" maxlength="80" value="${escape(state.builder.createdBy||'')}" autocomplete="off" placeholder="Name"><p class="field-help">The person who prepared this prayer set. Shown when you share it.</p></div>`;
}
function metadataDate(value) {
  if(!value)return '';
  const date=/^\d{4}-\d{2}-\d{2}$/.test(value)?new Date(`${value}T12:00:00`):new Date(value);
  return date.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
}
function dateFields(prefix) {
  return [['createdAt','created-at','Date Created']].map(([key,suffix,label])=>{
    const id=`${prefix}-${suffix}`;
    return state.builder[key]?`<div class="created-date-field"><label class="field-label" for="${id}">${label}</label><input id="${id}" value="${escape(metadataDate(state.builder[key]))}" readonly></div>`:'';
  }).join('');
}
function setMetadata(set,element='span',className='class-creator') {
  const parts=[];
  if(set.createdBy)parts.push(`<span class="creator-name">Created By ${escape(set.createdBy)}</span>`);
  if(set.createdAt)parts.push(`<time class="creation-date" datetime="${escape(set.createdAt)}">Date Created: ${escape(metadataDate(set.createdAt))}</time>`);
  return parts.length?`<${element} class="${className} set-metadata">${parts.join('')}</${element}>`:'';
}
function stepMarkup({id,start,count},index,groups) {
  const item=catalog.get(id);
  return `<li class="step"><div class="step-name">${escape(item.name)}<small>${escape(item.category)}</small></div><div class="step-controls">
    <select class="step-count" data-step-count="${start}" aria-label="${escape(`Repetitions of ${item.name}`)}">${countOptions(count,MAX_STEPS-state.builder.ids.length+count)}</select>
    ${iconButton('move-up',`Move ${item.name} Earlier`,'arrow-up',`data-index="${start}" ${index===0?'disabled':''}`)}
    ${iconButton('move-down',`Move ${item.name} Later`,'arrow-down',`data-index="${start}" ${index===groups.length-1?'disabled':''}`)}
    ${iconButton('remove',`Remove ${item.name}`,'x',`data-index="${start}"`)}</div></li>`;
}
function savedClasses(readOnly=false) {
  return `<section class="saved"><h2>Saved Prayer Sets</h2>${state.saved.length?state.saved.map(entry=>`<div class="saved-row"><button type="button" data-action="${readOnly?'read-saved':'load'}" data-id="${escape(entry.id)}">${escape(entry.set.title)}${setMetadata(entry.set,'small','class-credit')}<small>${entry.set.ids.length} Pages</small></button><div class="saved-actions">${action('share-saved','Share QR','qr-code',`class="secondary" data-id="${escape(entry.id)}" aria-label="${escape(`Share QR for ${entry.set.title}`)}"`)}${iconButton('delete-saved',`Delete ${entry.set.title}`,'trash-2',`data-id="${escape(entry.id)}"`)}</div></div>`).join(''):`<p class="privacy">${readOnly?'Open a prayer set link or scan its QR code to save it here automatically.':'No saved prayer sets yet.'}</p>`}</section>`;
}
function renderClass() {
  if(!state.builderOpen||state.classOverview){
    main.innerHTML=sectionHeading('My Prayers','Open a saved prayer set or create one to share.')+
      savedClasses(true)+
      `<section class="class-welcome"><h2>Have a QR Code or Link?</h2><p>Open a shared prayer set link or scan its QR code. The prayers open in order and save here automatically. No account is needed.</p></section>
      <section class="class-prepare"><h2>Make a Prayer Set</h2><p>Gather prayers and mysteries for yourself or your group. Choose the order, name your set, and share it when you are ready.</p>${action('prepare-class','Create Prayer Set','list-plus','class="secondary"')}</section>`;
    return;
  }
  main.innerHTML=action('class-overview','All My Prayers','arrow-left','class="back-link"')+sectionHeading('Create Prayer Set','Choose prayers and mysteries in the order you want to pray.')+
    `<div class="builder-layout"><section aria-label="Prayer Set Builder"><label class="field-label" for="class-title">Prayer Set Name</label><input id="class-title" maxlength="80" value="${escape(state.builder.title)}" autocomplete="off">
      ${creatorField('class-creator')}<div id="class-date-fields">${dateFields('class')}</div>
      <div class="builder-tools inline-actions">${action('picker','Add Prayer or Mystery','plus','class="secondary"')}<span class="eyebrow">${state.builder.ids.length} / ${MAX_STEPS} Pages</span></div>
      <ol class="step-list" tabindex="-1" aria-label="Prayer Set Order">${groupSteps(state.builder.ids).map(stepMarkup).join('')}</ol>${state.builder.ids.length?'':'<p class="empty">Your prayer set is empty. Choose a prayer or mystery to begin.</p>'}
      <div class="builder-footer">${action('preview','Preview','play',`${state.builder.ids.length?'':'disabled'}`)}${action('share','Share / QR Code','qr-code',`class="primary" ${state.builder.ids.length?'':'disabled'}`)}</div>
      <div class="inline-actions">${action('save','Save Prayer Set','save',`${state.builder.ids.length?'':'disabled'}`)}${action('new','New Prayer Set','file-plus')}</div>
      <p class="privacy">${storageOK?'Your draft is saved on this device.':'Saving is unavailable on this device.'} A shared link contains the prayer set’s details and order. Anyone with the link can open it; no account is needed. Leave private intentions out of the name.</p></section>
    <aside><label class="field-label" for="starter">Add a Starter Sequence</label><select id="starter"><option value="">Choose a Sequence</option><option value="opening">Opening Prayers</option>${mysterySets.map(set=>`<option value="${set.key}">Five ${set.name} Mysteries</option>`).join('')}</select>
      ${savedClasses()}
      <p class="privacy">Edits produce a new share link and QR code. An older link always opens its original prayer set.</p>
    </aside></div>`;
}
function renderHelp() {
  const tabs=[
    {title:'Prayers',view:'prayers',glyph:'book-open',paragraphs:[
      'Search for a prayer or tap a title to read it. Mysteries of the Rosary are here too, with Scripture and artwork.',
      'Leader begins; join in for Response or Everyone. Tap the right side of a prayer to go forward, or the left side to go back. You can also use Next, Previous, or Contents.'
    ]},
    {title:'My Prayers',view:'class',glyph:'users',paragraphs:[
      'Open saved prayer sets here. A shared link or QR code opens a set and saves it on this device; tap Begin Prayer to start.',
      'To make a set, tap Create Prayer Set. Add prayers and mysteries in order. Step numbers show their place; Pray 10 Times means ten prayers at that step. Use − and + to change the count, or Remove Step to take it out. Undo brings back the step you just removed. Tap Review Set to check the order, then name and save it. Share QR lets you share it with others.'
    ]},
    {title:'The Mass',view:'mass',glyph:'church',paragraphs:[
      'Scroll through the Mass in order, or use the four section links to find your place.',
      'Leader shows the priest or reader’s words; Response shows the congregation’s words. Timing notes explain when a part is used.'
    ]}
  ];
  main.innerHTML=sectionHeading('How to Use','Your prayer companion in your pocket.')+
    `<section class="help-guide" aria-label="Using the Tabs"><ul class="help-tabs">${tabs.map(tab=>`<li><span class="help-tab-icon" aria-hidden="true">${icon(tab.glyph)}</span><div><h2>${escape(tab.title)}</h2>${tab.paragraphs.map(paragraph=>`<p>${escape(paragraph)}</p>`).join('')}<div class="help-actions inline-actions"><button type="button" data-view="${tab.view}" class="secondary"><span class="button-content">Open ${escape(tab.title)}${icon('arrow-right')}</span></button></div></div></li>`).join('')}</ul></section>`;
}
function render() {
  document.body.classList.toggle('reader-mode',!!state.reader);
  document.querySelectorAll('#primary-nav [data-view]').forEach(el=>el.setAttribute('aria-current',el.dataset.view===state.view?'page':'false'));
  if(state.reader)renderReader();
  else ({prayers:renderPrayers,mass:renderMass,class:renderClass,help:renderHelp}[state.view])();
  icons();
  dockObserver.disconnect();
  const dock=main.querySelector('.reader-dock');
  if(dock)dockObserver.observe(dock);
}
function focusMain() {main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
function navigate(view,{keepPrayerGroup=false}={}) {clearNotice();state.reader=null;state.view=view;state.query='';if(view==='prayers'&&!keepPrayerGroup)state.mystery=null;if(location.hash.startsWith('#class='))history.replaceState(null,'',location.pathname+location.search);render();focusMain();}
function persistDraft({edited=false}={}) {
  if(edited)state.builder.updatedAt=new Date().toISOString();
  writeStore('draft',{...state.builder,savedId:state.savedId});
  if(edited)for(const prefix of ['class','saved-set']){
    const fields=$(`${prefix}-date-fields`);
    if(fields)fields.innerHTML=dateFields(prefix);
  }
}
function updateBuilderIds(ids) {
  const edited=ids.length!==state.builder.ids.length||ids.some((id,index)=>id!==state.builder.ids[index]);
  if(edited)pickerUndo=null;
  state.builder.ids=ids;
  persistDraft({edited});
}
function matchesSet(first,second) {
  return !!first?.ids.length&&!!second?.ids.length&&encodeSet(first,catalog)===encodeSet(second,catalog);
}
function saveSharedClass(set) {
  if(state.saved.some(entry=>matchesSet(entry.set,set)))return;
  if(state.saved.length>=20){notify('This prayer set is open, but your 20 saved prayer sets are full. Remove a saved prayer set, then reopen this link to save it.');return;}
  const saved=[{id:crypto.randomUUID(),set:validateSet(set,catalog)},...state.saved];
  if(writeStore('sets',saved)){
    state.saved=saved;
    notify('Prayer Set Saved to My Prayers');
  }else notify('This prayer set could not be saved on this device. Keep its link to open it again.');
}
function saveClass(name,createdBy=state.builder.createdBy||'') {
  const title=name.trim()||defaultClassTitle();
  const set=validateSet({...state.builder,title,createdBy},catalog);
  if(!set.ids.length)return;
  if(!state.savedId&&state.saved.length>=20){notify('You can save 20 prayer sets on this device. Remove an old prayer set first.');return;}
  const edited=set.title!==(state.builder.title.trim()||defaultClassTitle())||(set.createdBy||'')!==(state.builder.createdBy||'').trim();
  if(edited)set.updatedAt=new Date().toISOString();
  state.builder.title=title;
  if(set.createdBy)state.builder.createdBy=set.createdBy;else delete state.builder.createdBy;
  if(set.updatedAt)state.builder.updatedAt=set.updatedAt;
  state.savedId ||= crypto.randomUUID();
  state.saved=[{id:state.savedId,set},...state.saved.filter(entry=>entry.id!==state.savedId)];
  const saved=writeStore('sets',state.saved);
  persistDraft();render();
  share(set,saved);
  returnFocus=main.querySelector('[data-action="share"]');
}
function addItems(ids) {
  if(state.builder.ids.length+ids.length>MAX_STEPS){notify(`A prayer set can contain up to ${MAX_STEPS} pages.`);return false;}
  updateBuilderIds([...state.builder.ids,...ids]);return true;
}
function addItem(id,count=1) {
  if(!catalog.has(id)||!Number.isInteger(count)||count<1||count>MAX_STEPS||!addItems(Array(count).fill(id)))return;
  if(state.view==='class'&&!state.reader)render();
  if(dialog.open&&dialog.dataset.kind==='picker'){
    returnFocus=main.querySelector('[data-action="picker"]');
    renderPickerItems($('picker-search').value);
    const groups=groupSteps(state.builder.ids), position=groups.length, total=groups.at(-1).count;
    $('picker-status').textContent=`Step ${position}: ${catalog.get(id).name}. Pray ${total} ${total===1?'Time':'Times'}.${state.builder.ids.length===MAX_STEPS?' Your set is full. Reduce a count or remove a step to add more.':''}`;
    dialog.querySelector(state.builder.ids.length===MAX_STEPS?'[data-action="review-set"]':`[data-action="add"][data-id="${id}"]`)?.focus({preventScroll:true});
  }else notify(`${catalog.get(id).name}${count>1?` ×${count}`:''} added to My Prayers.`);
}
function startReader(set,index=0,withIntro=false) {
  clearNotice();set=validateSet(set,catalog);if(!set.ids.length)return;
  state.reader={set,index:Math.min(Math.max(withIntro?-1:0,index),set.ids.length-1),withIntro,complete:false};
  rememberPlace();render();focusMain();
}
function rememberPlace() {state.resume={set:state.reader.set,index:state.reader.index,withIntro:state.reader.withIntro};writeStore('resume',state.resume);}
function renderReader() {
  const {set,index,complete}=state.reader;
  if(complete){main.innerHTML=`<section class="complete">${icon('book-open')}<h1>Prayer Complete</h1><p>${set.ids.length===1?'You’ve completed this prayer.':'You’ve completed these prayers.'}</p><div class="inline-actions">${action('again','Pray Again','rotate-ccw','class="primary"')}${action('exit','Done','arrow-left')}</div>${action('contents','Review Prayer Set','list','class="secondary"')}</section>`;return;}
  const toolbar=`<header class="reader-header reader-toolbar">${action('contents','Contents','list')}${iconButton('exit','Close Prayer and Save Place','x')}</header>`;
  if(index===-1){
    main.innerHTML=`${toolbar}<section class="reader-intro" aria-labelledby="reader-title"><h1 class="reader-title session-name" id="reader-title">${escape(set.title)}</h1>${setMetadata(set)}${action('begin-prayer','Begin Prayer','arrow-right','class="primary"')}</section>`;
    return;
  }
  const item=catalog.get(set.ids[index]);
  const repetition=groupSteps(set.ids).find(group=>index>=group.start&&index<group.start+group.count);
  main.innerHTML=`${toolbar}
    <div class="reader-progress"><span>${index+1} of ${set.ids.length}</span></div>
    <div class="reader-progress"><progress value="${index+1}" max="${set.ids.length}" aria-label="Prayer Set Progress">${index+1} of ${set.ids.length}</progress></div>
    <article aria-labelledby="reader-title" class="${item.kind==='mystery'?'mystery-reading':'prayer-reading'}">
    <h1 class="reader-title" id="reader-title">${escape(item.readerTitle||item.name)}</h1>
    ${repetition.count>1?`<p class="repeat-progress">${index-repetition.start+1} of ${repetition.count}</p>${item.kind==='prayer'?`<div class="repeat-beads" aria-hidden="true">${Array.from({length:repetition.count},(_,bead)=>`<span class="prayer-bead${bead===index-repetition.start?' current':bead<index-repetition.start?' done':''}"></span>`).join('')}</div>`:''}`:''}
    ${item.kind==='prayer'?`<div class="prayer-text" id="prayer-text">${item.parts.map(part=>`<p data-role="${part.role.toLowerCase()}"><span class="prayer-role prayer-role-${part.role.toLowerCase()}">${escape(part.role)}:</span> ${spokenMarkup(part.text)}</p>`).join('')}</div>`:`<blockquote class="mystery-scripture"><p>${escape(item.scripture)}</p><cite>${escape(item.citation)}</cite></blockquote><figure class="mystery-image"><img src="${escape(item.image)}" alt="${escape(item.name)}" decoding="async"></figure>`}</article>
    <footer class="reader-dock"><div class="dock-inner">${action('previous','Previous','chevron-left',index===0&&!state.reader.withIntro?'disabled':'')}<span class="count">${index+1} / ${set.ids.length}</span>${action('next',index===set.ids.length-1?'Finish':'Next','chevron-right','class="primary"')}</div></footer>`;
}
function turn(delta) {
  if(!state.reader||state.reader.complete||dialog.open)return;
  const next=state.reader.index+delta;
  if(next<(state.reader.withIntro?-1:0))return;

  if(next>=state.reader.set.ids.length){state.reader.complete=true;state.resume=null;writeStore('resume',null);}
  else {state.reader.index=next;rememberPlace();}
  render();focusMain();
}
function showDialog(kind,title,content) {
  returnFocus=document.activeElement;dialog.dataset.kind=kind;
  $('dialog-content').innerHTML=`<div class="dialog-close-row">${iconButton('close-dialog','Close','x')}</div><div class="dialog-heading"><h2 id="dialog-title">${escape(title)}</h2></div>${content}`;
  icons();dialog.showModal();
}
function picker() {
  pickerUndo=null;
  showDialog('picker','Add to Your Prayer Set',`<p class="picker-help">Step numbers show the order. Use − and + to change how many times you pray.</p><label class="sr-only" for="picker-search">Prayer or Mystery</label><input type="search" id="picker-search" placeholder="Search Prayers and Mysteries" autocomplete="off"><div class="picker-repetitions"><label class="field-label" for="picker-count">Repetitions</label><select id="picker-count">${countOptions(1,Math.max(1,MAX_STEPS-state.builder.ids.length))}</select></div><p id="picker-status" class="picker-status" role="status" aria-live="polite" aria-atomic="true"></p><ul class="dialog-content-list" id="picker-results"></ul><footer class="picker-footer"><div id="picker-feedback" class="picker-feedback" hidden><span id="picker-removed" role="status" aria-live="polite" aria-atomic="true"></span>${action('picker-undo','Undo','undo-2')}</div><span id="picker-summary"></span>${action('review-set','Review Set','','class="primary"')}</footer>`);
  renderPickerItems('');
  if(state.builder.ids.length===MAX_STEPS)$('picker-status').textContent='Your set is full. Reduce a count or remove a step to add more.';
  if(!matchMedia('(pointer: coarse)').matches)$('picker-search').focus();
}
function pickerStep(item,{position,start,count},remaining) {
  const context=`${item.name} at Step ${position}`;
  return `<section class="picker-step" data-id="${item.id}" data-index="${start}" aria-labelledby="picker-step-${start}"><span class="picker-step-number">Step ${position}</span><h3 id="picker-step-${start}">${escape(item.name)}</h3><small>${escape(item.category)}</small><div class="picker-step-count">${iconButton('picker-less',`Pray ${context} Fewer Times`,'minus',`data-id="${item.id}" data-index="${start}" ${count===1?'disabled':''}`)}<span>Pray ${count} ${count===1?'Time':'Times'}</span>${iconButton('picker-more',`Pray ${context} More Times`,'plus',`data-id="${item.id}" data-index="${start}" ${remaining===0?'disabled':''}`)}</div>${action('picker-remove','Remove Step','trash-2',`data-id="${item.id}" data-index="${start}" class="picker-remove" aria-label="Remove ${escape(context)}"`)}</section>`;
}
function focusPickerControl({id,index,action:key}) {
  let button=dialog.querySelector(`#picker-results button[data-action="${key}"][data-id="${id}"]${index===undefined?'':`[data-index="${index}"]`}`);
  // A count boundary disables the control just used. Keep focus in that step.
  if(button?.disabled&&['picker-less','picker-more'].includes(key))button=dialog.querySelector(`#picker-results button[data-action="${key==='picker-less'?'picker-more':'picker-less'}"][data-index="${index}"]`);
  if(!button||button.disabled)button=dialog.querySelector('[data-action="review-set"]:enabled')||$('picker-search');
  button.focus({preventScroll:true});
}
function renderPickerItems(query,focus) {
  const scrollTop=dialog.scrollTop;
  const focused=document.activeElement?.closest('#picker-results button[data-id]');
  focus ||= focused?{...focused.dataset}:null;
  const remaining=MAX_STEPS-state.builder.ids.length;
  const count=Number($('picker-count').value)||1;
  $('picker-count').innerHTML=countOptions(Math.min(count,Math.max(1,remaining)),Math.max(1,remaining));
  $('picker-count').disabled=remaining===0;
  const selectedCount=Number($('picker-count').value);
  const groups=groupSteps(state.builder.ids);
  const positions=new Map();
  groups.forEach((group,index)=>{
    if(!positions.has(group.id))positions.set(group.id,[]);
    positions.get(group.id).push({...group,position:index+1});
  });
  const items=[...catalog.values()].filter(item=>`${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  $('picker-results').innerHTML=items.length?items.map(item=>{
    const selected=positions.get(item.id)||[];
    const label=`Add ${item.name}${selected.length?' Again':''} ×${selectedCount}`;
    const add=`<button type="button" data-action="add" data-id="${item.id}" class="${selected.length?'picker-add-again':'picker-item'}" aria-label="${escape(label)}" ${remaining===0?'disabled':''}>${selected.length?`${icon('plus')}<span>Add Again</span>`:`<span class="picker-label">${escape(item.name)}<small>${escape(item.category)}</small></span><span class="picker-add">${icon('plus')}<span>Add</span></span>`}</button>`;
    return `<li class="${selected.length?'is-added':''}">${selected.map(group=>pickerStep(item,group,remaining)).join('')}${add}</li>`;
  }).join(''):'<li class="empty">No matching prayers or mysteries.</li>';
  $('picker-summary').textContent=`${groups.length} ${groups.length===1?'Step':'Steps'} · ${state.builder.ids.length} / ${MAX_STEPS} Pages`;
  $('picker-feedback').hidden=!pickerUndo;
  $('picker-removed').textContent=pickerUndo?`${catalog.get(pickerUndo.id).name} Removed From Step ${pickerUndo.position}`:'';
  dialog.querySelector('[data-action="review-set"]').disabled=groups.length===0;
  icons();
  if(focus)focusPickerControl(focus);
  dialog.scrollTop=scrollTop;
}
function editPickerStep(key,id,start) {
  const groups=groupSteps(state.builder.ids),position=groups.findIndex(group=>group.id===id&&group.start===start);
  if(position<0)return;
  const group=groups[position];
  if((key==='picker-less'&&group.count===1)||(key==='picker-more'&&state.builder.ids.length===MAX_STEPS))return;
  const previous=[...state.builder.ids];
  const count=key==='picker-remove'?0:group.count+(key==='picker-more'?1:-1);
  updateBuilderIds(setStepCount(previous,start,count));
  if(key==='picker-remove')pickerUndo={ids:previous,id,start,position:position+1};
  render();returnFocus=main.querySelector('[data-action="picker"]');
  renderPickerItems($('picker-search').value,{id,index:start,action:key});
  if(key==='picker-remove'){
    $('picker-status').textContent='';
    dialog.querySelector('[data-action="picker-undo"]').focus();
  }else $('picker-status').textContent=`Step ${position+1}: ${catalog.get(id).name}. Pray ${count} ${count===1?'Time':'Times'}.`;
}
function undoPickerRemoval() {
  if(!pickerUndo)return;
  const previous=pickerUndo;
  updateBuilderIds(previous.ids);
  render();returnFocus=main.querySelector('[data-action="picker"]');
  renderPickerItems($('picker-search').value,{id:previous.id,index:previous.start,action:'picker-more'});
  $('picker-status').textContent=`${catalog.get(previous.id).name} Restored to Step ${previous.position}.`;
  document.activeElement?.scrollIntoView({block:'center'});
}
function contents() {
  showDialog('contents',state.reader.set.title,`<ol class="dialog-content-list">${state.reader.set.ids.map((id,index)=>`<li><button type="button" data-action="jump" data-index="${index}" ${index===state.reader.index?'aria-current="step"':''}><span>${index+1}. ${escape(catalog.get(id).name)}</span>${index===state.reader.index?icon('check'):''}</button></li>`).join('')}</ol>`);
}
function share(set=state.builder,saved=false) {
  let url;
  try{set=validateSet(set,catalog);url=shareURL(set,catalog,location.href);}catch(error){notify(error.message);return;}
  const qr=qrcode(0,'M');qr.addData(url);qr.make();
  state.share={title:set.title,url,canvas:qrCanvas(qr)};
  const local=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  showDialog('share',saved?'Prayer Set Saved — Ready to Share':'Share This Prayer Set',`<p class="share-caption">${escape(set.title)} · ${set.ids.length} Pages</p><div class="qr" role="img" aria-label="QR Code for ${escape(set.title)}"></div>${setMetadata(set,'p','share-creator')}<p class="share-instruction">Scan this code to open and save the prayer set on your phone.</p>
    ${local?'<p class="notice">Local preview: this link and QR code work on this computer only. A published address is required before sharing with your group.</p>':''}
    <div class="share-url"><label class="field-label" for="share-url">Prayer Set Link</label><input id="share-url" readonly value="${escape(url)}"></div>
    <div class="inline-actions">${action('download-qr','Download QR','download','class="primary"')}${action('copy-link','Copy Link','link')}${action('print-qr','Print','printer')}${navigator.share?action('native-share','Share Link','share-2'):''}</div>
    <p class="privacy">No account needed. Each person moves through the pages on their own. Keep the same QR for this exact prayer set; create a new one after edits.</p><p class="print-only">${escape(url)}</p>`);
  dialog.querySelector('.qr').append(state.share.canvas);
  dialog.querySelector('[data-action="close-dialog"]').focus({preventScroll:true});
}
function qrCanvas(qr) {
  const count=qr.getModuleCount(),border=4,modulePixels=Math.ceil(1200/(count+border*2));
  const canvas=document.createElement('canvas');canvas.width=canvas.height=(count+border*2)*modulePixels;
  canvas.setAttribute('aria-hidden','true');
  const context=canvas.getContext('2d');
  // Draw opaque pixels so page themes cannot recolor the white background or modules.
  context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
  context.fillStyle='#000';
  for(let row=0;row<count;row++)for(let column=0;column<count;column++){
    if(qr.isDark(row,column))context.fillRect((column+border)*modulePixels,(row+border)*modulePixels,modulePixels,modulePixels);
  }
  return canvas;
}
async function qrImage(share) {
  return await new Promise((resolve,reject)=>share.canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('QR image could not be created.')),'image/png'));
}
function loadShared() {
  if(!location.hash.startsWith('#class='))return false;
  try{
    const set=decodeSet(location.hash.slice(7),catalog);
    const sameSet=matchesSet(state.resume?.set,set);
    state.view='class';
    state.classOverview=true;
    startReader(set,sameSet?state.resume.index:-1,true);
    saveSharedClass(set);return true;
  }
  catch(error){state.reader=null;render();showDialog('bad-link','This Prayer Set Link Could Not Open',`<p>${escape(error.message)}</p><div class="builder-footer">${action('browse-prayers','Browse Prayers','book-open','class="primary"')}</div>`);return true;}
}
async function handleAction(button) {
  const {action:key,id}=button.dataset, index=Number(button.dataset.index);
  if(key==='close-dialog'){dialog.close();return;}
  if(key==='review-set'&&dialog.dataset.kind==='picker'){
    returnFocus=main.querySelector('.step-list');
    dialog.close();returnFocus?.scrollIntoView({behavior:'instant',block:'start'});return;
  }
  if(key==='browse-prayers'){dialog.close();navigate('prayers');return;}
  if(key==='prepare-class'||key==='class-overview'){
    state.view='class';state.classOverview=false;state.builderOpen=key==='prepare-class';writeStore('builder-open',state.builderOpen);render();focusMain();
  }
  if(key==='read-item'&&catalog.has(id))startReader({version:1,title:catalog.get(id).name,ids:[id]});
  if(key==='essentials')startReader({version:1,title:'The Essential Prayers',ids:['cross','ourFather','hailMary','gloryBe']});
  if(key==='resume'&&state.resume)startReader(state.resume.set,state.resume.index,state.resume.withIntro);
  if(state.view==='class'&&dialog.open&&dialog.dataset.kind==='picker'){
    if(key==='add')addItem(id,Number($('picker-count').value));
    if(['picker-less','picker-more','picker-remove'].includes(key))editPickerStep(key,id,index);
    if(key==='picker-undo')undoPickerRemoval();
  }
  if(key==='mystery-set'&&mysterySets.some(set=>set.key===id)){state.view='prayers';state.mystery=id;render();focusMain();}
  if(key==='all-mysteries'){state.view='prayers';state.mystery=null;render();$('mysteries-heading').focus({preventScroll:true});$('mysteries').scrollIntoView({behavior:'instant',block:'start'});}
  if(key==='reflect-set')startReader({version:1,title:`The ${mysterySets.find(set=>set.key===state.mystery).name} Mysteries`,ids:Array.from({length:5},(_,i)=>`${state.mystery}-${i+1}`)});
  if(key==='picker')picker();
  if(['move-up','move-down','remove'].includes(key)&&Number.isInteger(index)&&index>=0&&index<state.builder.ids.length){
    const ids=key==='remove'?setStepCount(state.builder.ids,index,0):moveStepGroup(state.builder.ids,index,key==='move-up'?-1:1);
    updateBuilderIds(ids);render();main.querySelector('.builder-tools button')?.focus();
  }
  if(key==='save'){
    if(!state.builder.ids.length)return;
    if(!state.savedId&&state.saved.length>=20){notify('You can save 20 prayer sets on this device. Remove an old prayer set first.');return;}
    showDialog('save-set','Save Your Prayer Set',`<form id="save-class-form"><label class="field-label" for="saved-set-name">Prayer Set Name</label><input id="saved-set-name" maxlength="80" value="${escape(state.builder.title.trim()||defaultClassTitle())}" autocomplete="off">${creatorField('saved-set-creator')}<div id="saved-set-date-fields">${dateFields('saved-set')}</div><div class="builder-footer">${action('close-dialog','Cancel')}<button type="submit" class="primary">Save Prayer Set</button></div></form>`);
    $('saved-set-name').focus();$('saved-set-name').select();
  }
  if(key==='new'){
    if(state.builder.ids.length)showDialog('new-set','Start a New Prayer Set?',`<p>Your current draft will be replaced. Saved prayer sets and links you have already shared will stay unchanged.</p><div class="builder-footer">${action('close-dialog','Keep Editing')}${action('confirm-new','Start New Prayer Set','file-plus','class="primary"')}</div>`);
    else {state.savedId=null;state.builder=blankSet();persistDraft();render();$('class-title').focus();}
  }
  if(key==='confirm-new'){dialog.close();state.savedId=null;state.builder=blankSet();persistDraft();render();$('class-title').focus();}
  if(key==='load'){
    const entry=state.saved.find(entry=>entry.id===id);if(!entry)return;
    state.builder=validateSet(entry.set,catalog);state.savedId=id;persistDraft();render();focusMain();
  }
  if(key==='read-saved'){
    const entry=state.saved.find(entry=>entry.id===id);if(!entry)return;
    startReader(entry.set,matchesSet(state.resume?.set,entry.set)?state.resume.index:-1,true);
  }
  if(key==='delete-saved'){
    const entry=state.saved.find(entry=>entry.id===id);if(!entry)return;
    showDialog('delete-set','Remove This Saved Prayer Set?',`<p>${escape(entry.set.title)}</p><p class="privacy">This removes the saved copy on this device. Your current draft and links already shared will stay unchanged.</p><div class="builder-footer">${action('close-dialog','Keep Prayer Set')}${action('confirm-delete','Remove Prayer Set','trash-2',`data-id="${escape(id)}"`)}</div>`);
  }
  if(key==='confirm-delete'){
    dialog.close();
    state.saved=state.saved.filter(entry=>entry.id!==id);if(state.savedId===id)state.savedId=null;
    writeStore('sets',state.saved);render();notify('Saved prayer set removed. Your current draft is unchanged.');
  }
  if(key==='preview')startReader(state.builder,-1,true);
  if(key==='share')share();
  if(key==='share-saved'){
    const entry=state.saved.find(entry=>entry.id===id);
    if(entry)share(entry.set);
  }
  if(key==='copy-link'){
    try{await navigator.clipboard.writeText(state.share.url);notify('Prayer set link copied.');}catch{$('share-url').focus();$('share-url').select();notify('Select and copy the highlighted link.');}
  }
  if(key==='download-qr'){
    const current=state.share;
    try{
      const url=URL.createObjectURL(await qrImage(current));const link=document.createElement('a');link.href=url;
      link.download=`${current.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'ocia-prayer-set'}-qr.png`;
      link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch{notify('The QR image could not download. You can still scan the code, copy the link, or print it.');}
  }
  if(key==='print-qr')window.print();
  if(key==='native-share')try{await navigator.share({title:state.share.title,url:state.share.url});}catch(error){if(error.name!=='AbortError')notify('Sharing is unavailable. Use Copy Link instead.');}
  if(key==='exit')navigate(state.view,{keepPrayerGroup:true});
  if(key==='next')turn(1);
  if(key==='begin-prayer'&&state.reader?.index===-1)turn(1);
  if(key==='previous')turn(-1);
  if(key==='again')startReader(state.reader.set,state.reader.withIntro?-1:0,state.reader.withIntro);
  if(key==='contents')contents();
  if(key==='jump'&&Number.isInteger(index)&&index>=0&&index<state.reader.set.ids.length){dialog.close();startReader(state.reader.set,index,state.reader.withIntro);}
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled||!catalog)return;
  if(button.dataset.view){navigate(button.dataset.view);return;}
  if(button.dataset.action){
    // Safari does not focus clicked buttons; dialogs still need a reliable return target.
    button.focus({preventScroll:true});
    handleAction(button).catch(error=>{console.error(error);notify('Something could not be completed. Your prayer text is still available.');});
  }
});
document.addEventListener('input',event=>{
  if(event.target.id==='prayer-search'){state.query=event.target.value;$('prayer-groups').innerHTML=prayerGroups(state.query);icons();}
  if(event.target.id==='class-title'&&state.builder.title!==event.target.value){state.builder.title=event.target.value;persistDraft({edited:true});}
  if(event.target.id==='class-creator'&&(state.builder.createdBy||'')!==event.target.value){state.builder.createdBy=event.target.value;persistDraft({edited:true});}
  if(event.target.id==='picker-search')renderPickerItems(event.target.value);
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='save-class-form')return;
  event.preventDefault();
  if(dialog.open&&dialog.dataset.kind==='save-set')saveClass($('saved-set-name').value,$('saved-set-creator').value);
});
document.addEventListener('change',event=>{
  if(event.target.id==='picker-count')renderPickerItems($('picker-search').value);
  if(event.target.matches('[data-step-count]')&&state.view==='class'&&!state.reader){
    const start=Number(event.target.dataset.stepCount);
    try{
      updateBuilderIds(setStepCount(state.builder.ids,start,Number(event.target.value)));
      render();
      main.querySelector(`[data-step-count="${start}"]`)?.focus({preventScroll:true});
    }catch(error){notify(error.message);render();}
  }
  if(event.target.id==='starter'){
    const key=event.target.value;if(!key)return;
    const ids=key==='opening'?['cross','comeHolySpirit','ourFather','gloryBe','cross']:Array.from({length:5},(_,i)=>`${key}-${i+1}`);
    if(ids.every(id=>catalog.has(id))&&addItems(ids)){render();notify('Sequence added to your prayer set.');}
  }
});
// Qualify an ordinary tap without taking over native scrolling, text selection or controls.
let readingTap=null;
const readingPointers=new Set();
const readingSelection=()=>Boolean(window.getSelection()?.toString());
function readingTapArea(event) {
  if(!state.reader||state.reader.complete||state.reader.index<0||dialog.open||!(event.target instanceof Element))return null;
  if(event.target.closest('button,a,input,textarea,select,summary,label,[role="button"],[role="link"],[contenteditable]:not([contenteditable="false"])'))return null;
  const article=main.querySelector('article.prayer-reading,article.mystery-reading');
  const dock=main.querySelector('.reader-dock');
  if(!article||!dock||!(article.contains(event.target)||[main,document.body,document.documentElement].includes(event.target)))return null;
  const bounds=main.getBoundingClientRect();
  return event.clientX>=bounds.left&&event.clientX<=bounds.right&&event.clientY>=Math.max(0,article.getBoundingClientRect().top)&&event.clientY<dock.getBoundingClientRect().top?article:null;
}
document.addEventListener('pointerdown',event=>{
  readingPointers.add(event.pointerId);readingTap=null;
  if(readingPointers.size!==1||!event.isPrimary||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||readingSelection())return;
  const article=readingTapArea(event);if(!article)return;
  readingTap={pointerId:event.pointerId,article,reader:state.reader,index:state.reader.index,x:event.clientX,y:event.clientY,scrollX,scrollY,started:performance.now(),released:false};
},{passive:true});
document.addEventListener('pointermove',event=>{
  if(readingTap?.pointerId===event.pointerId&&Math.hypot(event.clientX-readingTap.x,event.clientY-readingTap.y)>10)readingTap=null;
},{passive:true});
document.addEventListener('pointerup',event=>{
  readingPointers.delete(event.pointerId);
  const tap=readingTap;
  if(!tap||tap.pointerId!==event.pointerId)return;
  if(readingPointers.size||performance.now()-tap.started>400||Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>10||scrollX!==tap.scrollX||scrollY!==tap.scrollY||readingSelection()||readingTapArea(event)!==tap.article||state.reader!==tap.reader||state.reader.index!==tap.index){readingTap=null;return;}
  tap.released=true;tap.releasedAt=performance.now();
},{passive:true});
document.addEventListener('pointercancel',event=>{readingPointers.delete(event.pointerId);readingTap=null;},{passive:true});
// A body listener also makes blank reading space deliver clicks in mobile Safari.
document.body.addEventListener('click',event=>{
  const tap=readingTap;readingTap=null;
  if(!tap?.released||event.button!==0||event.detail<1||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||performance.now()-tap.releasedAt>800||scrollX!==tap.scrollX||scrollY!==tap.scrollY||readingSelection()||readingTapArea(event)!==tap.article||state.reader!==tap.reader||state.reader.index!==tap.index)return;
  const bounds=main.getBoundingClientRect();
  turn(event.clientX<bounds.left+bounds.width/2?-1:1);
});
window.addEventListener('scroll',()=>{readingTap=null;},{capture:true,passive:true});
document.addEventListener('contextmenu',()=>{readingTap=null;});
document.addEventListener('dragstart',()=>{readingTap=null;});
document.addEventListener('selectionchange',()=>{if(readingSelection())readingTap=null;});
window.addEventListener('blur',()=>{readingPointers.clear();readingTap=null;});

document.addEventListener('keydown',event=>{
  if(dialog.open||event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.target.closest('input,textarea,select,button,a,summary,[contenteditable="true"]'))return;
  if(state.reader&&!state.reader.complete&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();turn(event.key==='ArrowLeft'?-1:1);}
});
dialog.addEventListener('close',()=>{
  if(dialog.dataset.kind==='bad-link'&&location.hash.startsWith('#class='))history.replaceState(null,'',location.pathname+location.search);
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});else main.focus({preventScroll:true});
});
window.addEventListener('hashchange',event=>{
  if(!catalog)return;
  if(location.hash.startsWith('#class='))loadShared();
  else if(new URL(event.oldURL).hash.startsWith('#class='))navigate('prayers');
});

async function init() {
  const response=await fetch('./prayers.json?v=20261012-rosary-closing');if(!response.ok)throw new Error('Prayer library could not load.');
  catalog=createCatalog(await response.json());hydrate();
  if(!loadShared())render();
}
init().catch(error=>{console.error(error);main.innerHTML=sectionHeading('Let’s Try Again.','The prayer library could not load. Check your connection and reload this page.')+'<button type="button" id="reload">Reload</button>';$('reload').addEventListener('click',()=>location.reload());});
