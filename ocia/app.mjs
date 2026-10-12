import {qrcode} from './vendor/qrcode.mjs';
import {MAX_STEPS,defaultClassTitle,validateSet,encodeSet,decodeSet,shareURL,groupSteps,setStepCount,moveStepGroup} from './core.mjs';
import {createCatalog,mysterySets,questions,massSections,sources} from './content.mjs';

const $ = id => document.getElementById(id);
const main = $('main'), dialog = $('dialog');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const action = (key,label,glyph='',extra='') => `<button type="button" data-action="${key}" ${extra}><span class="button-content">${glyph?icon(glyph):''}${escape(label)}</span></button>`;
const iconButton = (key,label,glyph,extra='') => `<button type="button" class="action-icon" data-action="${key}" aria-label="${escape(label)}" title="${escape(label)}" ${extra}>${icon(glyph)}</button>`;
const blankSet = () => ({version:1,title:defaultClassTitle(),ids:[]});
let catalog, toastTimer, returnFocus, utterance, storageOK = true;
let state = {view:'prayers',mystery:null,query:'',reader:null,builder:null,saved:[],savedId:null,resume:null,size:1.3,voice:'',share:null,massOptions:{},builderOpen:false};

function notify(message) {
  clearTimeout(toastTimer); $('toast').textContent=message; $('toast').hidden=false;
  toastTimer=setTimeout(()=>$('toast').hidden=true,4200);
}
function clearNotice() {clearTimeout(toastTimer);$('toast').hidden=true;}
function readStore(key,fallback) {try {return JSON.parse(localStorage.getItem(`ocia-${key}`)) ?? fallback;}catch{return fallback;}}
function writeStore(key,value) {try {localStorage.setItem(`ocia-${key}`,JSON.stringify(value));return true;}catch{storageOK=false;notify('This browser cannot save your place. You can still use a class link.');return false;}}
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
  if(resume && validStoredSet(resume.set)?.ids.length && Number.isInteger(resume.index) && resume.index>=0)state.resume={set:validStoredSet(resume.set),index:Math.min(resume.index,resume.set.ids.length-1)};
  const preferences=readStore('preferences',{});
  state.size=[1.15,1.3,1.5,1.75].includes(preferences?.size)?preferences.size:1.3;
  state.voice=typeof preferences?.voice==='string'?preferences.voice:'';
  document.documentElement.style.setProperty('--reading-size',`${state.size}rem`);
}
function icons() {window.lucide?.createIcons();}
function sectionHeading(title,description) {return `<header class="section-heading"><h1>${escape(title)}</h1>${description?`<p>${escape(description)}</p>`:''}</header>`;}
function row(item) {return `<li class="prayer-row"><button type="button" class="prayer-open" data-action="read-item" data-id="${item.id}"><span><strong>${escape(item.name)}</strong><span>${escape(item.kind==='mystery'?`Mystery ${item.order} · ${item.desire}`:item.summary)}</span></span>${icon('chevron-right')}</button></li>`;}
function resumeMarkup() {return state.resume?`<section class="intro-action"><div><span class="eyebrow">Continue where you left off</span><h2>${escape(state.resume.set.title)}</h2><p>${state.resume.index+1} of ${state.resume.set.ids.length} · ${escape(catalog.get(state.resume.set.ids[state.resume.index]).name)}</p></div>${action('resume','Continue','arrow-right','class="secondary"')}</section>`:'';}
function prayerGroups(query='') {
  const matches=[...catalog.values()].filter(item=>item.kind==='prayer'&&`${item.name} ${item.summary}`.toLowerCase().includes(query.toLowerCase()));
  return matches.length?['Essentials','Creeds','Daily prayer','Other prayers'].map(group=>{
    const entries=matches.filter(item=>item.category===group);
    return entries.length?`<section><div class="split-heading"><h2>${group}</h2><span class="eyebrow">${entries.length} prayers</span></div><ul class="prayer-list">${entries.map(item=>row(item)).join('')}</ul></section>`:'';
  }).join(''):'<p class="empty" role="status">No prayers found. Try a prayer name such as “Our Father.”</p>';
}
function renderPrayers() {
  main.innerHTML=sectionHeading('A place to begin.','The words are here. There is no need to know them by heart.')+resumeMarkup()+
    `<section class="intro-action"><div><h2>Begin with the essentials</h2><p>Sign of the Cross · Our Father · Hail Mary · Glory Be</p></div>${action('essentials','Pray together','arrow-right','class="primary"')}</section>
    <label class="search-label" for="prayer-search">Find a prayer</label><input id="prayer-search" type="search" placeholder="Prayer name" value="${escape(state.query)}" autocomplete="off">
    <div id="prayer-groups" class="prayer-groups">${prayerGroups(state.query)}</div>
    <section class="faq"><h2>Questions you can ask here</h2>${questions.map(([q,a])=>`<details><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`).join('')}</section>
    <p class="source-note">For OCIA learning and prayer. Your instructor can help with questions about the prayers and the Mass.</p>`;
}
function renderMysteries() {
  if(state.mystery) {
    const set=mysterySets.find(item=>item.key===state.mystery);
    const items=[...catalog.values()].filter(item=>item.category===`${set.name} Mysteries`);
    main.innerHTML=action('all-mysteries','All mysteries','arrow-left','class="back-link"')+sectionHeading(`${set.name} Mysteries`,set.theme)+
      `<div class="inline-actions">${action('reflect-set','Reflect on all five','book-open','class="primary"')}</div><ul class="prayer-list">${items.map(item=>row(item)).join('')}</ul>
      <p class="source-note">${escape(set.days)} · A customary schedule; you may reflect on any set in class.</p>`;
  }else {
    main.innerHTML=sectionHeading('The life of Jesus, contemplated.','Four sets of mysteries. Five moments in each.')+
      `<details><summary>What is a mystery?</summary><p>A mystery invites reflection on an event in the lives of Jesus and Mary. It is not a puzzle or a test. The Rosary connects these reflections with repeated prayers.</p></details>
      <ul class="chapter-list">${mysterySets.map(set=>`<li><button type="button" class="chapter" data-action="mystery-set" data-id="${set.key}"><img src="${set.image}" alt="" loading="lazy" width="76" height="96"><span><strong>${set.name}</strong><span class="theme">${escape(set.theme)}</span><small>${escape(set.days)} · 5 mysteries</small></span>${icon('chevron-right')}</button></li>`).join('')}</ul>
      <p class="source-note"><a href="${sources.rosary}" target="_blank" rel="noopener noreferrer">Rosary guide · USCCB <span class="sr-only">(opens a new tab)</span></a></p>`;
  }
}
function massResponse(block) {
  let text=block.prayer?catalog.get(block.prayer).text:block.text;
  // The devotional prayer stays unchanged; only its Mass presentation omits the final Amen.
  if(block.atMass)text=text.replace(/\s+Amen\.$/,'');
  return `<div class="mass-response"><p class="response-label">${escape(block.label)}</p><p class="mass-prayer">${escape(text)}</p>${block.note?`<p class="mass-note">${escape(block.note)}</p>`:''}</div>`;
}
function massForm(form) {
  return `${form.note?`<p class="mass-note">${escape(form.note)}</p>`:''}${form.pending?`<p class="mass-pending"><strong>Not yet included.</strong> ${escape(form.pending)}</p>`:''}${(form.responses||[]).map(massResponse).join('')}`;
}
function renderMass() {
  main.innerHTML=sectionHeading('Your guide to the Mass.','United States · Roman Catholic Mass in English')+
    `<div class="notice"><p><strong>A classroom guide, not a complete worship aid.</strong> The prayers and brief responses below are ready to read. Longer forms not yet included are marked; their text and publication permissions still need review.</p></div>
    <nav class="mass-index" aria-label="Parts of the Mass">${massSections.map((section,index)=>`<a href="#mass-${section.id}">${index+1}. ${escape(section.name)}</a>`).join('')}</nav>
    ${massSections.map((section,index)=>`<section class="mass-section" id="mass-${section.id}"><span class="eyebrow">${index+1} / 4 · ${section.formal}</span><h2>${section.name}</h2><p>${section.summary}</p>${section.items.map(item=>{
      const selected=item.options?.find(option=>option.id===state.massOptions[item.id])||item.options?.[0];
      return `<details class="mass-part" id="mass-part-${item.id}"><summary>${escape(item.name)}</summary><p>${escape(item.note)}</p>${item.options?`<label class="field-label" for="mass-choice-${item.id}">${escape(item.name)} form</label><select id="mass-choice-${item.id}" data-mass-option="${item.id}" aria-controls="mass-form-${item.id}">${item.options.map(option=>`<option value="${option.id}" ${option.id===selected.id?'selected':''}>${escape(option.name)}</option>`).join('')}</select><div id="mass-form-${item.id}" class="mass-form">${massForm(selected)}</div>`:massForm({...item,note:null})}</details>`;
    }).join('')}</section>`).join('')}
    <section class="faq"><h2>Some parts change</h2><p class="privacy">Readings, the psalm, seasonal texts, and special rites are not a single fixed script. Follow your parish’s texts for the celebration. An instructor’s class prayer set is for learning together; it does not change the order or permitted options of Mass.</p></section>`;
}
function countOptions(count,maximum) {
  return Array.from({length:maximum},(_,index)=>`<option value="${index+1}" ${index+1===count?'selected':''}>×${index+1}</option>`).join('');
}
function stepMarkup({id,start,count},index,groups) {
  const item=catalog.get(id);
  return `<li class="step"><div class="step-name">${escape(item.name)}<small>${escape(item.category)}</small></div><div class="step-controls">
    <select class="step-count" data-step-count="${start}" aria-label="${escape(`Repetitions of ${item.name}`)}">${countOptions(count,MAX_STEPS-state.builder.ids.length+count)}</select>
    ${iconButton('move-up',`Move ${item.name} earlier`,'arrow-up',`data-index="${start}" ${index===0?'disabled':''}`)}
    ${iconButton('move-down',`Move ${item.name} later`,'arrow-down',`data-index="${start}" ${index===groups.length-1?'disabled':''}`)}
    ${iconButton('remove',`Remove ${item.name}`,'x',`data-index="${start}"`)}</div></li>`;
}
function renderClass() {
  if(!state.builderOpen){
    main.innerHTML=sectionHeading('Your class.','Pray and learn together, one page at a time.')+
      `<section class="class-welcome"><h2>Joining your instructor’s class?</h2><p>Open their class link or scan their QR code. Your prayers will be there in order, with every word to read. No account is needed.</p></section>
      <section class="class-prepare"><h2>Preparing a class?</h2><p>Choose prayers and mysteries, name your set, and share it with the group.</p>${action('prepare-class','Prepare a class','list-plus','class="secondary"')}</section>`;
    return;
  }
  main.innerHTML=action('class-overview','Class overview','arrow-left','class="back-link"')+sectionHeading('Your class, in order.','Choose the prayers and mysteries you will share together.')+
    `<div class="builder-layout"><section aria-label="Class builder"><label class="field-label" for="class-title">Class title</label><input id="class-title" maxlength="80" value="${escape(state.builder.title)}" autocomplete="off">
      <div class="builder-tools inline-actions">${action('picker','Add prayer or mystery','plus','class="secondary"')}<span class="eyebrow">${state.builder.ids.length} / ${MAX_STEPS} pages</span></div>
      <ol class="step-list">${groupSteps(state.builder.ids).map(stepMarkup).join('')}</ol>${state.builder.ids.length?'':'<p class="empty">Your class set is empty. Choose a prayer or mystery to begin.</p>'}
      <div class="builder-footer">${action('preview','Preview','play',`${state.builder.ids.length?'':'disabled'}`)}${action('share','Share class','qr-code',`class="primary" ${state.builder.ids.length?'':'disabled'}`)}</div>
      <div class="inline-actions">${action('save','Save set','save',`${state.builder.ids.length?'':'disabled'}`)}${action('new','New set','file-plus')}</div>
      <p class="privacy">${storageOK?'Your draft is saved on this device.':'Saving is unavailable on this device.'} A shared link contains the class title and its prayer order. Anyone with the link can open it; no account is needed. Leave private names and intentions out of the title.</p></section>
    <aside><label class="field-label" for="starter">Add a starter sequence</label><select id="starter"><option value="">Choose a sequence</option><option value="opening">Class opening prayers</option>${mysterySets.map(set=>`<option value="${set.key}">Five ${set.name} Mysteries</option>`).join('')}</select>
      <section class="saved"><h2>Saved sets</h2>${state.saved.length?state.saved.map(entry=>`<div class="saved-row"><button type="button" data-action="load" data-id="${escape(entry.id)}">${escape(entry.set.title)}<small>${entry.set.ids.length} pages</small></button>${iconButton('delete-saved',`Delete ${entry.set.title}`,'trash-2',`data-id="${escape(entry.id)}"`)}</div>`).join(''):'<p class="privacy">No saved sets yet.</p>'}</section>
      <p class="privacy">Edits produce a new share link and QR code. An older link always opens its original set.</p>
    </aside></div>`;
}
function render() {
  document.body.classList.toggle('reader-mode',!!state.reader);
  document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-current',el.dataset.view===state.view?'page':'false'));
  if(state.reader)renderReader();
  else ({prayers:renderPrayers,mysteries:renderMysteries,mass:renderMass,class:renderClass}[state.view])();
  icons();
}
function focusMain() {main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
function navigate(view) {stopAudio();clearNotice();state.reader=null;state.view=view;state.query='';if(location.hash.startsWith('#class='))history.replaceState(null,'',location.pathname+location.search);render();focusMain();}
function persistDraft() {writeStore('draft',{...state.builder,savedId:state.savedId});}
function saveClass(name) {
  const title=name.trim()||defaultClassTitle();
  const set=validateSet({...state.builder,title},catalog);
  if(!set.ids.length)return;
  if(!state.savedId&&state.saved.length>=20){notify('You can save 20 sets on this device. Remove an old set first.');return;}
  state.builder.title=title;
  state.savedId ||= crypto.randomUUID();
  state.saved=[{id:state.savedId,set},...state.saved.filter(entry=>entry.id!==state.savedId)];
  if(writeStore('sets',state.saved))notify('Class set saved on this device.');
  persistDraft();dialog.close();render();
  returnFocus=main.querySelector('[data-action="save"]');
  returnFocus?.focus({preventScroll:true});
}
function addItems(ids) {
  if(state.builder.ids.length+ids.length>MAX_STEPS){notify(`A class set can contain up to ${MAX_STEPS} pages.`);return false;}
  state.builder.ids.push(...ids);persistDraft();return true;
}
function addItem(id,count=1) {
  if(!catalog.has(id)||!Number.isInteger(count)||count<1||count>MAX_STEPS||!addItems(Array(count).fill(id)))return;
  if(state.view==='class'&&!state.reader)render();
  if(dialog.open&&dialog.dataset.kind==='picker')renderPickerItems($('picker-search').value);
  notify(`${catalog.get(id).name}${count>1?` ×${count}`:''} added to My Class.`);
}
function startReader(set,index=0) {
  stopAudio();clearNotice();set=validateSet(set,catalog);if(!set.ids.length)return;
  state.reader={set,index:Math.min(Math.max(0,index),set.ids.length-1),complete:false};
  rememberPlace();render();focusMain();
}
function rememberPlace() {state.resume={set:state.reader.set,index:state.reader.index};writeStore('resume',state.resume);}
function renderReader() {
  const {set,index,complete}=state.reader;
  if(complete){main.innerHTML=`<section class="complete">${icon('book-open')}<span class="eyebrow">${escape(set.title)}</span><h1>A moment to be still.</h1><p>You have reached the end of this class set.</p><div class="inline-actions">${action('again','Begin again','rotate-ccw','class="primary"')}${action('exit','Return to library','arrow-left')}</div>${action('contents','Review the set','list','class="secondary"')}</section>`;return;}
  const item=catalog.get(set.ids[index]);
  main.innerHTML=`<header class="reader-header"><span class="session-title">${escape(set.title)}</span>${iconButton('exit','Close prayer and save place','x')}</header>
    <div class="reader-progress"><span>${index+1} of ${set.ids.length}</span>${action('contents','Contents','list')}</div>
    <div class="reader-progress"><progress value="${index+1}" max="${set.ids.length}" aria-label="Class progress">${index+1} of ${set.ids.length}</progress></div>
    <article aria-labelledby="reader-title"><div class="reader-topline"><span>${escape(item.kind==='mystery'?`${item.category} · ${item.order} of 5`:'Everyone · '+item.category)}</span><div class="reader-tools">${iconButton('settings','Reading settings','type')}${'speechSynthesis'in window?iconButton('audio','Read aloud','volume-2','aria-pressed="false" id="audio-button"'):''}</div></div>
    <h1 class="reader-title" id="reader-title">${escape(item.name)}</h1>
    ${item.image?`<img class="mystery-image" src="${item.image}" alt="Devotional artwork depicting ${escape(item.name)}" loading="lazy"><p class="desire">${escape(item.desire)}</p>`:''}
    <div class="prayer-text" id="prayer-text">${item.text.split(/\n+/).map(text=>`<p>${escape(text)}</p>`).join('')}</div>
    <details class="reading-help"><summary>${item.kind==='mystery'?'Reflecting on this mystery':'About this prayer'}</summary><p>${escape(item.explanation)}</p></details></article>
    <footer class="reader-dock"><div class="dock-inner">${action('previous','Previous','chevron-left',index===0?'disabled':'')}<span class="count">${index+1} / ${set.ids.length}</span>${action('next',index===set.ids.length-1?'Finish':'Next','chevron-right','class="primary"')}</div></footer>`;
}
function turn(delta) {
  if(!state.reader||state.reader.complete||dialog.open)return;
  const next=state.reader.index+delta;
  if(next<0)return;
  stopAudio();
  if(next>=state.reader.set.ids.length){state.reader.complete=true;state.resume=null;writeStore('resume',null);}
  else {state.reader.index=next;rememberPlace();}
  render();focusMain();
}
function showDialog(kind,title,content) {
  returnFocus=document.activeElement;dialog.dataset.kind=kind;
  $('dialog-content').innerHTML=`<div class="dialog-heading"><h2 id="dialog-title">${escape(title)}</h2>${iconButton('close-dialog','Close','x')}</div>${content}`;
  icons();dialog.showModal();
}
function picker() {
  showDialog('picker','Add to your class',`<label class="field-label" for="picker-search">Prayer or mystery</label><input type="search" id="picker-search" placeholder="Search prayers and mysteries" autocomplete="off"><div class="picker-repetitions"><label class="field-label" for="picker-count">Repetitions</label><select id="picker-count">${countOptions(1,Math.max(1,MAX_STEPS-state.builder.ids.length))}</select></div><ul class="dialog-content-list" id="picker-results"></ul>`);
  renderPickerItems('');$('picker-search').focus();
}
function renderPickerItems(query) {
  const remaining=MAX_STEPS-state.builder.ids.length;
  const count=Number($('picker-count').value)||1;
  $('picker-count').innerHTML=countOptions(Math.min(count,Math.max(1,remaining)),Math.max(1,remaining));
  $('picker-count').disabled=remaining===0;
  const items=[...catalog.values()].filter(item=>`${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  $('picker-results').innerHTML=remaining===0?`<li class="empty">Your class has ${MAX_STEPS} pages. Reduce a repetition count or remove an item to add more.</li>`:items.length?items.map(item=>`<li><button type="button" data-action="add" data-id="${item.id}"><span>${escape(item.name)}<small>${escape(item.category)}</small></span>${icon('plus')}</button></li>`).join(''):'<li class="empty">No matching prayers or mysteries.</li>';
  icons();
}
function contents() {
  showDialog('contents',state.reader.set.title,`<ol class="dialog-content-list">${state.reader.set.ids.map((id,index)=>`<li><button type="button" data-action="jump" data-index="${index}" ${index===state.reader.index?'aria-current="step"':''}><span>${index+1}. ${escape(catalog.get(id).name)}</span>${index===state.reader.index?icon('check'):''}</button></li>`).join('')}</ol>`);
}
function share() {
  let url;
  try{url=shareURL(state.builder,catalog,location.href);}catch(error){notify(error.message);return;}
  const qr=qrcode(0,'M');qr.addData(url);qr.make();
  state.share={url,svg:qr.createSvgTag({cellSize:4,margin:16,scalable:true})};
  const local=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  showDialog('share','Share this class',`<p class="share-caption">${escape(state.builder.title)} · ${state.builder.ids.length} pages</p><div class="qr" role="img" aria-label="QR code for ${escape(state.builder.title)}">${state.share.svg}</div>
    ${local?'<p class="notice">Local preview: this link and QR code work on this computer only. A published address is required before sharing with the class.</p>':''}
    <div class="share-url"><label class="field-label" for="share-url">Read-only class link</label><input id="share-url" readonly value="${escape(url)}"></div>
    <div class="inline-actions">${action('copy-link','Copy link','link','class="primary"')}${action('download-qr','Save QR','download')}${action('print-qr','Print','printer')}${navigator.share?action('native-share','Share','share-2'):''}</div>
    <p class="privacy">No account needed. Each person moves through the pages on their own. Keep the same QR for this exact set; create a new one after edits.</p><p class="print-only">${escape(url)}</p>`);
}
function settings() {
  const voices='speechSynthesis'in window?speechSynthesis.getVoices().filter(voice=>/^en\b/i.test(voice.lang)):[];
  showDialog('settings','Reading settings',`<label class="field-label" for="text-size">Text size</label><select id="text-size">${[[1.15,'Standard'],[1.3,'Comfortable'],[1.5,'Large'],[1.75,'Extra large']].map(([value,label])=>`<option value="${value}" ${state.size===value?'selected':''}>${label}</option>`).join('')}</select>${voices.length?`<label class="search-label" for="reading-voice">Reading voice</label><select id="reading-voice"><option value="">Device default</option>${voices.map(voice=>`<option value="${escape(voice.voiceURI)}" ${voice.voiceURI===state.voice?'selected':''}>${escape(voice.name)} (${escape(voice.lang)})</option>`).join('')}</select>`:''}`);
}
function audioButton(active) {
  const button=$('audio-button');if(!button)return;
  button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',active?'Stop reading':'Read aloud');button.title=active?'Stop reading':'Read aloud';button.innerHTML=icon(active?'square':'volume-2');icons();
}
function stopAudio() {utterance=null;if('speechSynthesis'in window)speechSynthesis.cancel();audioButton(false);}
function toggleAudio() {
  if(utterance){stopAudio();return;}
  if(!state.reader||!('speechSynthesis'in window))return;
  const item=catalog.get(state.reader.set.ids[state.reader.index]);
  const speech=new SpeechSynthesisUtterance(`${item.name}. ${item.desire||''} ${item.text}`);
  speech.lang='en-US';speech.rate=.85;
  speech.voice=speechSynthesis.getVoices().find(voice=>voice.voiceURI===state.voice)||null;
  utterance=speech;audioButton(true);
  speech.onend=()=>{if(utterance===speech){utterance=null;audioButton(false);}};
  speech.onerror=()=>{if(utterance===speech){utterance=null;audioButton(false);notify('Read-aloud is unavailable on this device. All text remains on screen.');}};
  speechSynthesis.speak(speech);
}
function loadShared() {
  if(!location.hash.startsWith('#class='))return false;
  try{
    const set=decodeSet(location.hash.slice(7),catalog);
    const sameSet=state.resume&&encodeSet(state.resume.set,catalog)===encodeSet(set,catalog);
    startReader(set,sameSet?state.resume.index:0);return true;
  }
  catch(error){state.reader=null;render();showDialog('bad-link','This class link could not open',`<p>${escape(error.message)}</p><div class="builder-footer">${action('close-dialog','Browse prayers','book-open','class="primary"')}</div>`);return true;}
}
async function handleAction(button) {
  const {action:key,id}=button.dataset, index=Number(button.dataset.index);
  if(key==='close-dialog'){dialog.close();return;}
  if(key==='prepare-class'||key==='class-overview'){
    state.builderOpen=key==='prepare-class';writeStore('builder-open',state.builderOpen);render();focusMain();
  }
  if(key==='read-item'&&catalog.has(id))startReader({version:1,title:catalog.get(id).name,ids:[id]});
  if(key==='essentials')startReader({version:1,title:'The essential prayers',ids:['cross','ourFather','hailMary','gloryBe']});
  if(key==='resume'&&state.resume)startReader(state.resume.set,state.resume.index);
  if(key==='add'&&state.view==='class'&&dialog.open&&dialog.dataset.kind==='picker')addItem(id,Number($('picker-count').value));
  if(key==='mystery-set'){state.mystery=id;render();focusMain();}
  if(key==='all-mysteries'){state.mystery=null;render();focusMain();}
  if(key==='reflect-set')startReader({version:1,title:`The ${mysterySets.find(set=>set.key===state.mystery).name} Mysteries`,ids:Array.from({length:5},(_,i)=>`${state.mystery}-${i+1}`)});
  if(key==='picker')picker();
  if(['move-up','move-down','remove'].includes(key)&&Number.isInteger(index)&&index>=0&&index<state.builder.ids.length){
    if(key==='move-up'||key==='move-down')state.builder.ids=moveStepGroup(state.builder.ids,index,key==='move-up'?-1:1);
    if(key==='remove')state.builder.ids=setStepCount(state.builder.ids,index,0);
    persistDraft();render();main.querySelector('.builder-tools button')?.focus();
  }
  if(key==='save'){
    if(!state.builder.ids.length)return;
    if(!state.savedId&&state.saved.length>=20){notify('You can save 20 sets on this device. Remove an old set first.');return;}
    showDialog('save-set','Save your class set',`<form id="save-class-form"><label class="field-label" for="saved-set-name">Set name</label><input id="saved-set-name" maxlength="80" value="${escape(state.builder.title.trim()||defaultClassTitle())}" autocomplete="off"><div class="builder-footer">${action('close-dialog','Cancel')}<button type="submit" class="primary">Save set</button></div></form>`);
    $('saved-set-name').focus();$('saved-set-name').select();
  }
  if(key==='new'){
    if(state.builder.ids.length)showDialog('new-set','Start a new class set?',`<p>Your current draft will be replaced. Saved sets and links you have already shared will stay unchanged.</p><div class="builder-footer">${action('close-dialog','Keep editing')}${action('confirm-new','Start new set','file-plus','class="primary"')}</div>`);
    else {state.savedId=null;state.builder=blankSet();persistDraft();render();$('class-title').focus();}
  }
  if(key==='confirm-new'){dialog.close();state.savedId=null;state.builder=blankSet();persistDraft();render();$('class-title').focus();}
  if(key==='load'){
    const entry=state.saved.find(entry=>entry.id===id);if(!entry)return;
    state.builder=validateSet(entry.set,catalog);state.savedId=id;persistDraft();render();focusMain();
  }
  if(key==='delete-saved'){
    const entry=state.saved.find(entry=>entry.id===id);if(!entry)return;
    showDialog('delete-set','Remove this saved set?',`<p>${escape(entry.set.title)}</p><p class="privacy">This removes the saved copy on this device. Your current draft and links already shared will stay unchanged.</p><div class="builder-footer">${action('close-dialog','Keep set')}${action('confirm-delete','Remove set','trash-2',`data-id="${escape(id)}"`)}</div>`);
  }
  if(key==='confirm-delete'){
    dialog.close();
    state.saved=state.saved.filter(entry=>entry.id!==id);if(state.savedId===id)state.savedId=null;
    writeStore('sets',state.saved);render();notify('Saved set removed. Your current draft is unchanged.');
  }
  if(key==='preview')startReader(state.builder);
  if(key==='share')share();
  if(key==='copy-link'){
    try{await navigator.clipboard.writeText(state.share.url);notify('Class link copied.');}catch{$('share-url').focus();$('share-url').select();notify('Select and copy the highlighted link.');}
  }
  if(key==='download-qr'){
    const url=URL.createObjectURL(new Blob([state.share.svg],{type:'image/svg+xml'}));const link=document.createElement('a');link.href=url;link.download='ocia-class-qr.svg';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  if(key==='print-qr')window.print();
  if(key==='native-share')try{await navigator.share({title:state.builder.title,url:state.share.url});}catch(error){if(error.name!=='AbortError')notify('Sharing is unavailable. Use Copy link instead.');}
  if(key==='exit')navigate(state.view);
  if(key==='next')turn(1);
  if(key==='previous')turn(-1);
  if(key==='again')startReader(state.reader.set);
  if(key==='contents')contents();
  if(key==='jump'&&Number.isInteger(index)&&index>=0&&index<state.reader.set.ids.length){dialog.close();startReader(state.reader.set,index);}
  if(key==='settings')settings();
  if(key==='audio')toggleAudio();
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
  if(event.target.id==='class-title'){state.builder.title=event.target.value;persistDraft();}
  if(event.target.id==='picker-search')renderPickerItems(event.target.value);
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='save-class-form')return;
  event.preventDefault();
  if(dialog.open&&dialog.dataset.kind==='save-set')saveClass($('saved-set-name').value);
});
document.addEventListener('change',event=>{
  if(event.target.matches('[data-step-count]')&&state.view==='class'&&!state.reader){
    const start=Number(event.target.dataset.stepCount);
    try{
      state.builder.ids=setStepCount(state.builder.ids,start,Number(event.target.value));
      persistDraft();render();
      main.querySelector(`[data-step-count="${start}"]`)?.focus({preventScroll:true});
    }catch(error){notify(error.message);render();}
  }
  if(event.target.matches('[data-mass-option]')){
    const id=event.target.dataset.massOption;
    const item=massSections.flatMap(section=>section.items).find(item=>item.id===id);
    const selected=item?.options?.find(option=>option.id===event.target.value);
    if(selected){state.massOptions[id]=selected.id;$(`mass-form-${id}`).innerHTML=massForm(selected);}
  }
  if(event.target.id==='starter'){
    const key=event.target.value;if(!key)return;
    const ids=key==='opening'?['cross','comeHolySpirit','ourFather','gloryBe','cross']:Array.from({length:5},(_,i)=>`${key}-${i+1}`);
    if(ids.every(id=>catalog.has(id))&&addItems(ids)){render();notify('Sequence added to your class.');}
  }
  if(event.target.id==='text-size'){state.size=Number(event.target.value);document.documentElement.style.setProperty('--reading-size',`${state.size}rem`);}
  if(event.target.id==='reading-voice'){state.voice=event.target.value;stopAudio();}
  if(['text-size','reading-voice'].includes(event.target.id))writeStore('preferences',{size:state.size,voice:state.voice});
});
document.addEventListener('keydown',event=>{
  if(dialog.open||event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,select,button,a,summary,[contenteditable="true"]'))return;
  if(state.reader&&!state.reader.complete&&['ArrowLeft','ArrowRight',' '].includes(event.key)){event.preventDefault();turn(event.key==='ArrowLeft'?-1:1);}
});
dialog.addEventListener('close',()=>{
  if(dialog.dataset.kind==='bad-link'&&location.hash.startsWith('#class='))history.replaceState(null,'',location.pathname+location.search);
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});else main.focus({preventScroll:true});
});
window.addEventListener('pagehide',stopAudio);
window.addEventListener('hashchange',event=>{
  if(!catalog)return;
  if(location.hash.startsWith('#class='))loadShared();
  else if(new URL(event.oldURL).hash.startsWith('#class='))navigate('prayers');
});

async function init() {
  const response=await fetch('./prayers.json');if(!response.ok)throw new Error('Prayer library could not load.');
  catalog=createCatalog(await response.json());hydrate();
  if(!loadShared())render();
}
init().catch(error=>{console.error(error);main.innerHTML=sectionHeading('Let’s try again.','The prayer library could not load. Check your connection and reload this page.')+'<button type="button" id="reload">Reload</button>';$('reload').addEventListener('click',()=>location.reload());});
