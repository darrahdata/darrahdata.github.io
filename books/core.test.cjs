const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const C = require('./core.js');
const base = () => ({version:1,books:[{id:'bebe',title:'Bringing Up Bébé',author:'Pamela Druckerman',status:'reading',mode:'pages',current:40,total:320,percent:0,notes:'Thoughts\nwith accents: é',summary:'Original summary',why:'For family life',cover:'covers/bebe.jpg',source:'https://example.com',tags:['Family']}],highlights:[]});
const clipping = (title='Bringing Up Bébé: One American Mother (Druckerman, Pamela)',location='Location 100-101',body='A passage\non two lines.',kind='Highlight') => `${title}\r\n- Your ${kind} on page 10 | ${location} | Added on Sunday\r\n\r\n${body}\r\n==========\r\n`;

test('page and percent progress, including unknown total and finished',()=>{
  assert.equal(C.progress(base().books[0]),13);
  assert.equal(C.progress({...base().books[0],total:0}),0);
  assert.equal(C.progress({...base().books[0],status:'finished'}),100);
  assert.equal(C.progress({...base().books[0],mode:'percent',percent:42}),42);
});
test('backup round trip preserves notes, Unicode and local cover paths',()=>assert.deepEqual(C.validate(JSON.parse(JSON.stringify(C.validate(base())))),C.validate(base())));
test('backup rejects malformed records, duplicate ids and invalid progress',()=>{
  for(const value of [null,{},[],{version:2,books:[],highlights:[]}])assert.throws(()=>C.validate(value));
  for(const value of [NaN,Infinity,-1,100001]){const b=base();b.books[0].current=value;assert.throws(()=>C.validate(b));}
  const b=base();b.books[0].current=321;assert.throws(()=>C.validate(b));
  const duplicate=base();duplicate.books.push({...duplicate.books[0]});assert.throws(()=>C.validate(duplicate));
  const orphan=base();orphan.highlights=[{id:'h',bookId:'missing',text:'A passage',kind:'highlight'}];assert.throws(()=>C.validate(orphan));
});
test('unsafe URLs are removed without altering plain text',()=>{
  const b=base();b.books[0].cover='javascript:alert(1)';b.books[0].source='data:text/html,x';b.books[0].notes='<script>test</script>';
  const result=C.validate(b);assert.equal(result.books[0].cover,'');assert.equal(result.books[0].source,'');assert.equal(result.books[0].notes,b.books[0].notes);
});
test('English Kindle BOM, CRLF, multiline text and author inversion',()=>{
  const r=C.importClippings(base(),'\uFEFF'+clipping());
  assert.equal(r.added,1);assert.equal(r.booksAdded,0);assert.equal(r.library.highlights[0].bookId,'bebe');assert.equal(r.library.highlights[0].text,'A passage\non two lines.');
  assert.equal(r.library.books[0].current,40);assert.equal(r.library.books[0].notes,base().books[0].notes);
});
test('reimports skip duplicates, but different locations and notes survive',()=>{
  const first=C.importClippings(base(),clipping()+clipping());assert.equal(first.added,1);assert.equal(first.duplicates,1);
  const second=C.importClippings(first.library,clipping()+clipping(undefined,'Location 102')+clipping(undefined,undefined,undefined,'Note'));
  assert.equal(second.added,2);assert.equal(second.duplicates,1);assert.equal(second.library.highlights.length,3);
});
test('malformed records and bookmarks do not block valid highlights',()=>{
  const r=C.importClippings(base(),'broken\n==========\n'+clipping()+clipping(undefined,undefined,'','Bookmark'));
  assert.equal(r.added,1);assert.equal(r.skipped,2);
  assert.equal(C.parseClippings('').entries.length,0);
  assert.equal(C.parseClippings(clipping().replace(/==========\r\n$/,'')).entries.length,1);
});
test('same passage in different books remains distinct',()=>{
  const r=C.importClippings(base(),clipping()+clipping('Another Book (Other Author)'));
  assert.equal(r.added,2);assert.equal(r.booksAdded,1);assert.equal(r.library.books[1].status,'want');
});

// Execute the app against a small DOM adapter without browser automation.
function appContext(stored=null) {
  const els=new Map();
  const element=id=>{
    if(!els.has(id))els.set(id,{id,value:'',textContent:'',innerHTML:'',hidden:false,dataset:{},classList:{toggle(){}},setAttribute(){},removeAttribute(){},addEventListener(){},append(){},querySelector(){return element(id+'-child');},showModal(){this.open=true;},close(){this.open=false;},setCustomValidity(msg){this.error=msg;},reportValidity(){},click(){},reset(){}});
    return els.get(id);
  };
  const filters=['all','reading','want','finished'].map(x=>{const e=element('filter-'+x);e.dataset.filter=x;return e;});
  const views=['books','highlights'].map(x=>{const e=element('view-'+x);e.dataset.view=x;return e;});
  const document={getElementById:element,querySelectorAll:s=>s==='[data-filter]'?filters:s==='[data-view]'?views:[],querySelector:s=>s==='dialog[open]'?null:element(s),addEventListener(){},body:{append(){}},createElement:()=>element('new')};
  let storage=stored;
  const context=vm.createContext({ShelfCore:C,document,window:{},localStorage:{getItem:()=>storage,setItem:(key,value)=>{storage=value;}},FormData:class{constructor(form){this.data=form.values;}get(key){return this.data[key]??null;}has(key){return key in this.data;}},setTimeout:()=>0,clearTimeout(){},confirm:()=>true,URL,Blob,console});
  vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),context);
  return {context,element,read:()=>JSON.parse(storage),run:code=>vm.runInContext(code,context),setStorage:value=>storage=value};
}
const values = {status:'reading',mode:'pages',current:'40',total:'320',title:'Hunt, Gather, Parent',author:'Michaeleen Doucleff',notes:'An idea worth keeping',summary:'Original summary',why:'Independence'};
function save(app,fields=values){app.run(`activeId='hunt';saveProgress({preventDefault(){},target:{values:${JSON.stringify(fields)}}});`);}
test('app starts with six books and the two finished reads',()=>{
  const app=appContext();assert.equal(app.run('library.books.length'),6);assert.equal(app.run('library.books.filter(b=>b.status==="finished").length'),2);
  assert.match(app.element('book-grid').innerHTML,/Bringing Up Bébé/);
});
test('manual pages and notes persist and survive reload',()=>{
  const app=appContext();save(app);const b=app.read().books.find(b=>b.id==='hunt');assert.equal(b.current,40);assert.equal(b.total,320);assert.equal(b.notes,values.notes);
  const reload=appContext(JSON.stringify(app.read()));assert.equal(reload.run('library.books.find(b=>b.id==="hunt").current'),40);
});
test('invalid page progress cannot overwrite the saved library',()=>{
  const app=appContext();save(app);save(app,{...values,current:'999'});assert.equal(app.read().books.find(b=>b.id==='hunt').current,40);assert.match(app.element('current-page').error,/cannot exceed/);
});
test('manual percent update starts a book, marking finished sets completion',()=>{
  const app=appContext();save(app,{...values,status:'want',mode:'percent',percent:'37',current:undefined,total:undefined});
  assert.equal(app.read().books.find(b=>b.id==='hunt').status,'reading');assert.equal(app.read().books.find(b=>b.id==='hunt').percent,37);
  save(app,{...values,status:'finished'});assert.equal(app.read().books.find(b=>b.id==='hunt').current,320);
});
test('corrupt storage is not overwritten and other-tab writes are protected',()=>{
  const app=appContext('broken');save(app);assert.equal(app.run('storageBlocked'),true);
  const healthy=appContext();save(healthy);healthy.setStorage(JSON.stringify({...healthy.read(),highlights:[]} )+' ');save(healthy,{...values,current:'50'});assert.equal(healthy.run('library.books.find(b=>b.id==="hunt").current'),40);
});
test('user text is escaped when rendering summaries and details',()=>{
  const app=appContext();save(app,{...values,summary:'<img src=x onerror=alert(1)>'});app.run('render()');
  assert.match(app.element('book-grid').innerHTML,/&lt;img src=x onerror=alert\(1\)&gt;/);assert.doesNotMatch(app.element('book-grid').innerHTML,/<img src=x/);
});
test('literal selectors have matching static or generated IDs',()=>{
  const html=fs.readFileSync(__dirname+'/index.html','utf8'),js=fs.readFileSync(__dirname+'/app.js','utf8');
  const ids=new Set([...html.matchAll(/id="([\w-]+)"/g),...js.matchAll(/id="([\w-]+)"/g)].map(m=>m[1]));
  for(const match of js.matchAll(/\$\('([\w-]+)'\)/g))assert.ok(ids.has(match[1]),'Missing ID: '+match[1]);
  const staticIds=[...html.matchAll(/id="([\w-]+)"/g)].map(m=>m[1]);assert.equal(staticIds.length,new Set(staticIds).size);
});
