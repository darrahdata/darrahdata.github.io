'use strict';
const C = ShelfCore;
const KEY = 'darrahdata-bookmarked-v1';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const statuses = {want:'Want to read',reading:'Reading',finished:'Finished'};
const colors = ['#303b37','#373940','#3d3433','#303940','#3b3930','#38303a'];
const coverURL = isbn => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
const SEEDS = [
  {id:'bebe',title:'Bringing Up Bébé',author:'Pamela Druckerman',status:'finished',isbn:'9780143122968',tags:['Family life','Independence'],summary:'An American parent in Paris explores the everyday expectations, boundaries, and family rhythms she observes in French parenting.',why:'A starting point for thinking about a child joining family life, rather than family life revolving entirely around the child.',source:'https://openlibrary.org/isbn/9780143122968'},
  {id:'happiest',title:'The Happiest Baby on the Block',author:'Harvey Karp',status:'finished',isbn:'9780553393231',tags:['Newborn days','Soothing'],summary:'A guide to understanding newborn fussiness and using a set of soothing techniques during the early months of life.',why:'Practical preparation for comforting a newborn. Use current pediatric guidance for safe sleep and feeding alongside any parenting book.',source:'https://openlibrary.org/isbn/9780553393231'},
  {id:'hunt',title:'Hunt, Gather, Parent',author:'Michaeleen Doucleff',status:'want',isbn:'9781982149673',tags:['Independence','Family life'],summary:'A journey through three communities exploring how children learn to help, cooperate, and take part in everyday family life.',why:'A natural next read after Bébé: less micromanaging, more meaningful participation. Read it as cultural reporting and inspiration, not one universal parenting formula.',source:'https://www.simonandschuster.com/books/Hunt-Gather-Parent/Michaeleen-Doucleff/9781982149673'},
  {id:'no-bad',title:'No Bad Kids',author:'Janet Lansbury',status:'want',isbn:'9781499351118',tags:['Toddler years','Boundaries'],summary:'A practical approach to toddler behavior built around calm leadership, clear limits, and respect for a child’s feelings.',why:'For holding a boundary without yelling or negotiating endlessly. Most relevant as your son grows into the toddler years.',source:'https://www.penguinrandomhouseretail.com/book/?isbn=9780593736135'},
  {id:'no-drama',title:'No-Drama Discipline',author:'Daniel J. Siegel & Tina Payne Bryson',status:'want',isbn:'9780345548061',tags:['Connection','Discipline'],summary:'An approach to discipline that pairs emotional connection with teaching, helping parents respond to difficult behavior with more intention.',why:'A companion to No Bad Kids when you want to think about the skills a boundary teaches, not just the behavior it stops.',source:'https://www.randomhousebooks.com/books/228322/'},
  {id:'failure',title:'The Gift of Failure',author:'Jessica Lahey',status:'want',isbn:'9780062299253',tags:['Resilience','For later'],summary:'An exploration of how stepping back from rescuing children can create room for responsibility, motivation, and learning from mistakes.',why:'Closest to your interest in raising a capable child who can work through challenges. Primarily useful for the school years; a perspective to keep for later.',source:'https://www.jessicalahey.com/the-gift-of-failure'}
];
const seedLibrary = () => ({version:1,books:SEEDS.map(b=>({...b,cover:`covers/${b.id}.jpg`,mode:'percent',percent:b.status==='finished'?100:0,current:0,total:0,notes:''})),highlights:[]});
let storageBlocked = false, initialWarning = '', storageSnapshot = null;
let library;
try {
  const stored = localStorage.getItem(KEY);
  storageSnapshot=stored;
  library = stored === null ? C.validate(seedLibrary()) : C.validate(JSON.parse(stored));
} catch {
  library = C.validate(seedLibrary()); storageBlocked = true;
  initialWarning = 'Your saved library could not be read. Existing data has not been changed. Restore a valid backup, or enable browser storage.';
}
let view = 'books', filter = 'all', query = '', activeId = null, dirty = false, bookDirty = false, passageDirty = false, toastTimer;
function icons() { window.lucide?.createIcons(); }
function notify(message) {
  const node = $('toast');
  const modal = document.querySelector('dialog[open]');
  (modal || document.body).append(node);
  node.textContent = message; node.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>{node.hidden=true;},5000);
}
function persist(next, restoring = false) {
  if (storageBlocked && !restoring) { notify(initialWarning || 'Saving is unavailable. Please restore a backup or enable browser storage.'); return false; }
  try {
    const valid = C.validate(next);
    if(!restoring && localStorage.getItem(KEY)!==storageSnapshot){notify('Your library changed in another tab. Reload before saving to avoid overwriting it.');return false;}
    const serialized=JSON.stringify(valid);
    localStorage.setItem(KEY,serialized);
    storageSnapshot=serialized;
    library=valid; storageBlocked=false;
    document.querySelector('.storage-note').innerHTML='<span class="status-dot"></span>Saved on this browser';
    return true;
  } catch { notify('Could not save. Browser storage may be full or unavailable. Your previous library is unchanged.'); return false; }
}
function coverMarkup(book, large = false) {
  return `${book.cover?`<img class="cover" src="${esc(book.cover)}" alt="${esc(book.title)} cover" ${large?'':'loading="lazy"'} referrerpolicy="no-referrer">`:''}<span class="cover-fallback" ${book.cover?'hidden':''}><span>${esc(book.title)}</span><small>${esc(book.author)}</small></span>`;
}
function bindCoverFallbacks() {
  document.querySelectorAll('img.cover').forEach(img=>{
    const fail=()=>{img.hidden=true;if(img.nextElementSibling)img.nextElementSibling.hidden=false;};
    img.onerror=fail;
    img.onload=()=>{if(img.naturalWidth<5)fail();};
    if(img.complete && img.naturalWidth<5)fail();
  });
}
function progressLabel(b) {
  if(b.status==='finished')return 'Finished';
  if(b.status==='want')return 'Not started';
  if(b.mode==='pages')return b.total?`${b.current} / ${b.total} pages`:`${b.current} pages read`;
  return `${C.progress(b)}% complete`;
}
function render() {
  $('nav-count').textContent=library.books.length;
  $('highlight-count').textContent=library.highlights.length;
  $('total-books').textContent=library.books.length;
  $('finished-books').textContent=library.books.filter(b=>b.status==='finished').length;
  document.querySelectorAll('[data-filter]').forEach(btn=>{
    const value=btn.dataset.filter;
    btn.classList.toggle('active',filter===value);btn.setAttribute('aria-pressed',String(filter===value));
    btn.querySelector('span').textContent=library.books.filter(b=>value==='all'||b.status===value).length;
  });
  document.querySelectorAll('[data-view]').forEach(btn=>{btn.classList.toggle('active',btn.dataset.view===view);if(btn.dataset.view===view)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');});
  const isBooks=view==='books';
  $('breadcrumb').textContent=isBooks?'My bookshelf':'Highlights';
  $('page-title').textContent=isBooks?'Your bookshelf.':'The words you keep.';
  $('page-description').textContent=isBooks?'Good books. Lasting ideas. One page at a time.':'Passages to return to. Ideas to make your own.';
  document.querySelector('.filters').hidden=!isBooks;
  $('search').placeholder=isBooks?'Find a book…':'Find a highlight…';
  $('book-grid').hidden=!isBooks;$('highlights-list').hidden=isBooks;
  $('section-title').textContent=isBooks?({all:'The collection',reading:'In good company',want:'Next on your shelf',finished:'Read & remembered'}[filter]):'Collected passages';
  if(isBooks){
    const books=library.books.filter(b=>(filter==='all'||b.status===filter)&&C.normalize(b.title+' '+b.author+' '+b.tags.join(' ')).includes(C.normalize(query)));
    $('result-count').textContent=`${books.length} ${books.length===1?'book':'books'}`;
    $('book-grid').innerHTML=books.map(b=>`<article class="book-card">
      <div class="cover-stage" style="--stage:${colors[library.books.indexOf(b)%colors.length]}"><button class="cover-button" data-book="${esc(b.id)}" aria-label="Open ${esc(b.title)}">${coverMarkup(b)}</button><span class="card-status ${b.status}">${statuses[b.status]}</span></div>
      <div class="book-meta"><button class="book-title" data-book="${esc(b.id)}">${esc(b.title)}</button><p class="author">${esc(b.author)}</p><p class="book-summary">${esc(b.summary||b.why||'A new addition to your shelf.')}</p>
      <div class="book-bottom"><span>${progressLabel(b)}</span><button class="text-button" data-book="${esc(b.id)}">${b.status==='want'?'Start reading':b.status==='finished'?'Revisit book':'Update progress'}${icon('arrow-up-right')}</button></div>${b.status==='reading'?`<div class="progress-track" role="progressbar" aria-label="${esc(b.title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${C.progress(b)}"><span style="width:${C.progress(b)}%"></span></div>`:''}</div></article>`).join('');
    $('empty').hidden=books.length>0;
    $('empty-title').textContent=query?'No matching books.':filter==='reading'?'Your next chapter is waiting.':filter==='finished'?'Every finished book starts with a page.':'Room for your next read.';
    $('empty-copy').textContent=query?'Try another title or author.':filter==='reading'?'Choose a book from your shelf when you’re ready.':'Make this shelf your own.';
    $('empty-action').textContent=query?'Clear search':filter!=='all'?'See all books':'Add a book';
  } else {
    const highlights=library.highlights.filter(h=>{const b=library.books.find(x=>x.id===h.bookId);return C.normalize(h.text+' '+b.title+' '+b.author).includes(C.normalize(query));});
    $('result-count').textContent=`${highlights.length} ${highlights.length===1?'passage':'passages'}`;
    $('highlights-list').innerHTML=highlights.map(highlightMarkup).join('');
    $('empty').hidden=highlights.length>0;
    $('empty-title').textContent=query?'No matching passages.':'Some words stay with you.';
    $('empty-copy').textContent=query?'Try another phrase, title, or author.':'Your saved passages will live here.';
    $('empty-action').textContent=query?'Clear search':'Import highlights';
  }
  icons();bindCoverFallbacks();
}
function highlightMarkup(h) {
  const b=library.books.find(x=>x.id===h.bookId);
  return `<article class="highlight"><div class="highlight-head"><button data-book="${esc(b.id)}">${esc(b.title)}</button><button class="icon-button" data-delete-highlight="${esc(h.id)}" title="Delete passage" aria-label="Delete passage">${icon('trash-2')}</button></div><blockquote>${esc(h.text)}</blockquote><p class="highlight-meta">${h.kind==='note'?'Note':'Highlight'}${h.location?' · '+esc(h.location):''}</p></article>`;
}
function openModal(id) { $(id).showModal();icons(); }
function closeModal(id) {
  if(id==='detail-dialog'&&dirty&&!confirm('Discard your unsaved changes?'))return;
  dirty=false;$(id).close();document.body.append($('toast'));
}
function openBook(id) {
  if($('detail-dialog').open&&dirty&&!confirm('Discard your unsaved changes?'))return;
  const b=library.books.find(x=>x.id===id);if(!b)return;
  activeId=id;dirty=false;bookDirty=false;passageDirty=false;
  $('detail-body').innerHTML=`<div class="detail-header"><div>${coverMarkup(b,true)}</div><div><h2 id="detail-title">${esc(b.title)}</h2><p class="author">${esc(b.author)}</p><div class="detail-tags">${b.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div></div>
    ${b.summary?`<section class="detail-section"><h3>Between the covers</h3><p>${esc(b.summary)}</p>${b.source?`<a class="source-link" href="${esc(b.source)}" target="_blank" rel="noopener noreferrer">About this book ↗</a>`:''}</section>`:''}
    ${b.why?`<section class="detail-section why"><h3>Why it’s on your shelf</h3><p>${esc(b.why)}</p></section>`:''}
    <form id="progress-form" class="detail-form"><h3>Your place in the book</h3>
      <div class="form-row"><label>Reading status<select id="book-status" name="status">${Object.entries(statuses).map(([v,s])=>`<option value="${v}" ${b.status===v?'selected':''}>${s}</option>`).join('')}</select></label><label>Track by<select name="mode" id="progress-mode"><option value="percent" ${b.mode==='percent'?'selected':''}>Percentage</option><option value="pages" ${b.mode==='pages'?'selected':''}>Page number</option></select></label></div>
      <div id="page-fields" class="progress-fields" ${b.mode==='pages'?'':'hidden'}><label>Current page<input type="number" name="current" id="current-page" value="${b.current}" min="0" max="100000" step="1"></label><label>Total pages <span class="optional">(optional)</span><input type="number" name="total" id="total-pages" value="${b.total||''}" min="1" max="100000" step="1"></label></div>
      <label id="percent-field" ${b.mode==='percent'?'':'hidden'}>Percent complete<input type="number" name="percent" id="percent" min="0" max="100" step="1" value="${C.progress(b)}"></label>
      <label>Your notes<textarea name="notes" rows="5" maxlength="30000" placeholder="An idea, a question, something to try…">${esc(b.notes)}</textarea></label>
      <details><summary>Edit book details</summary><div class="edit-fields"><label>Title<input name="title" required maxlength="300" value="${esc(b.title)}"></label><label>Author<input name="author" required maxlength="200" value="${esc(b.author)}"></label><label>Summary<textarea name="summary" maxlength="5000" rows="3">${esc(b.summary)}</textarea></label><label>Why this book?<textarea name="why" maxlength="2000" rows="2">${esc(b.why)}</textarea></label></div></details>
      <p class="save-note">Saved only in this browser. Backups include your notes and highlights.</p><div class="form-actions"><button class="text-button delete" type="button" id="delete-book">${icon('trash-2')}Remove book</button><button class="primary" type="submit">${icon('check')}Save changes</button></div>
    </form>
    <section class="detail-highlights"><h3>Highlights & notes</h3><div id="book-highlights">${library.highlights.filter(h=>h.bookId===id).map(highlightMarkup).join('')}</div>
    <form id="highlight-form"><label>Add a passage<textarea name="text" rows="3" required maxlength="30000" placeholder="Words you want to keep…"></textarea></label><div class="form-row"><label>Page or location <span class="optional">(optional)</span><input name="location" maxlength="200" placeholder="Page 42"></label><label>Type<select name="kind"><option value="highlight">Highlight</option><option value="note">Note</option></select></label></div><div class="form-actions"><button type="submit" class="secondary">Add passage</button></div></form></section>`;
  $('progress-form').addEventListener('input',()=>{dirty=true;bookDirty=true;});
  $('highlight-form').addEventListener('input',()=>{dirty=true;passageDirty=true;});
  $('book-status').onchange=()=>{
    if($('book-status').value==='want'){$('current-page').value=0;$('percent').value=0;}
    if($('book-status').value==='finished'){$('percent').value=100;if(Number($('total-pages').value)>0)$('current-page').value=$('total-pages').value;}
  };
  $('progress-mode').addEventListener('change',syncProgressFields);
  $('current-page').addEventListener('input',()=> $('current-page').setCustomValidity(''));
  $('total-pages').addEventListener('input',()=> $('current-page').setCustomValidity(''));
  $('progress-form').addEventListener('submit',saveProgress);
  $('delete-book').onclick=()=>{
    if(!confirm(`Remove “${b.title}” and its notes and highlights?`))return;
    if(persist({...library,books:library.books.filter(x=>x.id!==id),highlights:library.highlights.filter(h=>h.bookId!==id)})){dirty=false;closeModal('detail-dialog');render();notify('Book removed.');}
  };
  $('highlight-form').onsubmit=e=>{
    e.preventDefault();const f=new FormData(e.target);const value=f.get('text').trim();if(!value){notify('Enter a passage first.');return;}
    const h={id:C.uid(),bookId:id,text:value,location:f.get('location').trim(),kind:f.get('kind')};
    if(persist({...library,highlights:[...library.highlights,h]})){e.target.reset();passageDirty=false;dirty=bookDirty;$('book-highlights').innerHTML=library.highlights.filter(h=>h.bookId===id).map(highlightMarkup).join('');render();icons();notify('Passage saved.');}
  };
  syncProgressFields();
  if(!$('detail-dialog').open)openModal('detail-dialog');
  icons();bindCoverFallbacks();
}
function syncProgressFields(event) {
  const pages=$('progress-mode').value==='pages';
  if(event){
    const total=Number($('total-pages').value),current=Number($('current-page').value);
    if(total>0){if(pages)$('current-page').value=Math.min(total,Math.round(Number($('percent').value)/100*total));else $('percent').value=Math.min(100,Math.round(current/total*100));}
  }
  $('page-fields').hidden=!pages;$('percent-field').hidden=pages;
  $('current-page').disabled=!pages;$('total-pages').disabled=!pages;$('percent').disabled=pages;
}
function saveProgress(e) {
  e.preventDefault();const f=new FormData(e.target);
  const old=library.books.find(b=>b.id===activeId);if(!old)return;
  let status=f.get('status'),current=f.has('current')?Number(f.get('current')):old.current,total=f.has('total')?Number(f.get('total')):old.total,percent=f.has('percent')?Number(f.get('percent')):old.percent;
  if(total&&current>total){$('current-page').setCustomValidity('The current page cannot exceed the total pages.');$('current-page').reportValidity();return;}
  if(!f.get('title').trim()||!f.get('author').trim()){notify('Please enter a title and author.');return;}
  if(passageDirty&&!confirm('Save book changes and discard the unsaved passage?'))return;
  if(status==='finished'){percent=100;if(total)current=total;}
  if(status==='want' && (f.get('mode')==='pages'?current>0:percent>0))status='reading';
  const updated={...old,title:f.get('title').trim(),author:f.get('author').trim(),status,mode:f.get('mode'),current,total,percent,notes:f.get('notes'),summary:f.get('summary').trim(),why:f.get('why').trim()};
  if(persist({...library,books:library.books.map(b=>b.id===activeId?updated:b)})){dirty=false;render();closeModal('detail-dialog');notify('Your place is saved.');}
}
document.addEventListener('click',e=>{
  const book=e.target.closest('[data-book]');if(book){openBook(book.dataset.book);return;}
  const close=e.target.closest('[data-close]');if(close){closeModal(close.dataset.close);return;}
  const del=e.target.closest('[data-delete-highlight]');if(del){
    if(!confirm('Delete this passage?'))return;
    if(persist({...library,highlights:library.highlights.filter(h=>h.id!==del.dataset.deleteHighlight)})){
      del.closest('.highlight').remove();render();notify('Passage deleted.');
    }
  }
});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',e=>{e.preventDefault();closeModal(d.id);}));
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;query='';$('search').value='';render();});
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render();});
$('search').oninput=e=>{query=e.target.value;render();};
$('empty-action').onclick=()=>{if(query){query='';$('search').value='';render();}else if(view==='highlights')openModal('import-dialog');else if(filter!=='all'){filter='all';render();}else openModal('add-dialog');};
$('add-open').onclick=()=>openModal('add-dialog');
$('import-open').onclick=()=>openModal('import-dialog');
$('add-form').onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.target);if(!f.get('title').trim()||!f.get('author').trim())return;
  const total=Number(f.get('total'))||0,status=f.get('status');
  const isbn=f.get('isbn').replace(/[ -]/g,'');
  if(isbn && !/^(?:\d{9}[\dXx]|\d{13})$/.test(isbn)){notify('Enter a 10- or 13-character ISBN, or leave it blank.');return;}
  const b={id:C.uid(),title:f.get('title').trim(),author:f.get('author').trim(),status,mode:total?'pages':'percent',current:status==='finished'?total:0,total,percent:status==='finished'?100:0,summary:f.get('summary').trim(),why:f.get('why').trim(),notes:'',cover:isbn?coverURL(isbn):'',source:'',tags:[]};
  if(persist({...library,books:[...library.books,b]})){e.target.reset();closeModal('add-dialog');view='books';filter='all';query='';$('search').value='';render();notify('Added to your shelf.');}
};
$('clippings-file').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  if(file.size>10*1024*1024){$('import-result').textContent='Choose a file smaller than 10 MB.';e.target.value='';return;}
  e.target.disabled=true;$('import-result').textContent='Reading your clippings…';
  try{
    const text=await file.text();const r=C.importClippings(library,text);
    if(!r.added){$('import-result').textContent=r.duplicates?`No new passages. ${r.duplicates} duplicates skipped; ${r.skipped} unsupported entries skipped.`:'No English-language highlights or notes found. Your library is unchanged.';return;}
    if(persist(r.library)){$('import-result').textContent=`Imported ${r.added} passages. ${r.duplicates} duplicates skipped; ${r.skipped} unsupported entries skipped. ${r.booksAdded} books added. Reading progress was not changed.`;render();}
    else $('import-result').textContent='Import was not saved. Your library is unchanged.';
  }catch{$('import-result').textContent='This file could not be imported. Your library is unchanged.';}
  finally{e.target.disabled=false;e.target.value='';}
};
$('backup').onclick=()=>{
  const blob=new Blob([JSON.stringify(library,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='bookmarked-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);notify('Backup downloaded. Keep it somewhere safe.');
};
$('restore').onclick=()=>$('restore-file').click();
$('restore-file').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    if(file.size>20*1024*1024)throw new Error('File too large.');
    const next=C.validate(JSON.parse(await file.text()));
    if(!confirm(`Replace this browser’s library with ${next.books.length} books and ${next.highlights.length} passages from this backup?`))return;
    if(persist(next,true)){view='books';filter='all';query='';$('search').value='';render();notify('Library restored.');}
  }catch{notify('That backup is invalid or too large. Your library is unchanged.');}
  finally{e.target.value='';}
};
render();
if(initialWarning){document.querySelector('.storage-note').textContent='Storage needs attention';notify(initialWarning);}
