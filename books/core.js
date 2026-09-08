(function (root) {
  'use strict';
  const statuses = ['want', 'reading', 'finished'];
  const text = (v, max = 10000) => typeof v === 'string' ? v.slice(0, max) : '';
  const normalize = v => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const titleKey = v => normalize(v.split(':')[0]);
  const authorKey = v => normalize(v).split(' ').sort().join(' ');
  const uid = () => root.crypto?.randomUUID?.() || 'b-' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  const safeURL = value => {
    try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
  };
  const coverURL = value => typeof value==='string' && /^covers\/[a-z0-9-]+\.jpg$/.test(value) ? value : safeURL(value);
  const progress = book => book.status === 'finished' ? 100 : book.mode === 'pages' ? (book.total > 0 ? Math.min(100, Math.round(book.current / book.total * 100)) : 0) : Math.min(100, Math.max(0, book.percent || 0));
  function validate(raw) {
    if (!raw || raw.version !== 1 || !Array.isArray(raw.books) || !Array.isArray(raw.highlights) || raw.books.length > 10000 || raw.highlights.length > 50000) throw new Error('This is not a supported Bookmarked backup.');
    const ids = new Set();
    const books = raw.books.map(b => {
      if (!b || !text(b.id, 200) || ids.has(b.id) || !text(b.title, 300).trim() || !statuses.includes(b.status) || !['pages', 'percent'].includes(b.mode)) throw new Error('The backup contains an invalid book.');
      ids.add(b.id);
      for (const k of ['current', 'total', 'percent']) if (!Number.isFinite(b[k]) || b[k] < 0 || b[k] > (k === 'percent' ? 100 : 100000)) throw new Error('The backup contains invalid reading progress.');
      if (b.total > 0 && b.current > b.total) throw new Error('A page number exceeds its book length.');
      return {id:text(b.id,200),title:text(b.title,300),author:text(b.author,200),status:b.status,mode:b.mode,current:b.current,total:b.total,percent:b.percent,summary:text(b.summary,5000),why:text(b.why,2000),notes:text(b.notes,30000),cover:coverURL(b.cover),source:safeURL(b.source),tags:Array.isArray(b.tags)?b.tags.filter(x=>typeof x==='string').slice(0,5).map(x=>text(x,40)):[]};
    });
    const highlightIds = new Set();
    const highlights = raw.highlights.map(h => {
      if (!h || !text(h.id,200) || highlightIds.has(h.id) || !ids.has(h.bookId) || !text(h.text,30000).trim() || !['highlight','note'].includes(h.kind)) throw new Error('The backup contains an invalid highlight.');
      highlightIds.add(h.id);
      return {id:text(h.id,200),bookId:text(h.bookId,200),text:text(h.text,30000),location:text(h.location,200),kind:h.kind};
    });
    return {version:1,books,highlights};
  }
  function parseClippings(input) {
    const entries = []; let skipped = 0;
    const blocks = input.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split(/^={10,}\s*$/m);
    for (const block of blocks) {
      if (!block.trim()) continue;
      const lines = block.trim().split('\n');
      const metadataIndex = lines.findIndex((line, i) => i > 0 && /^\s*-/.test(line));
      if (metadataIndex < 1) { skipped++; continue; }
      const metadata = lines[metadataIndex];
      const type = metadata.match(/\b(Highlight|Note)\b/i);
      const body = lines.slice(metadataIndex + 1).join('\n').trim();
      if (!type || !body) { skipped++; continue; }
      const heading = lines.slice(0,metadataIndex).join(' ').trim();
      const author = heading.match(/\(([^()]*)\)\s*$/);
      const title = (author ? heading.slice(0,author.index) : heading).trim();
      if (!title) { skipped++; continue; }
      const location = metadata.match(/\bLocation\s+([\d,-]+)/i);
      const page = metadata.match(/\bpage\s+([\d,-]+)/i);
      entries.push({title:title.slice(0,300),author:author?author[1].trim():'Unknown author',kind:type[1].toLowerCase(),text:body.slice(0,30000),location:location?'Location '+location[1]:page?'Page '+page[1]:''});
    }
    return {entries,skipped};
  }
  function importClippings(library, input) {
    const result = validate(library);
    const parsed = parseClippings(input);
    let added = 0, duplicates = 0, booksAdded = 0;
    const fingerprint = h => JSON.stringify([h.bookId,h.kind,normalize(h.location),h.text.replace(/\s+/g,' ').trim()]);
    const seen = new Set(result.highlights.map(fingerprint));
    for (const entry of parsed.entries) {
      let book = result.books.find(b => titleKey(b.title) === titleKey(entry.title) && (entry.author==='Unknown author'||authorKey(b.author)===authorKey(entry.author)));
      if (!book) {
        book = {id:uid(),title:entry.title,author:entry.author,status:'want',mode:'percent',current:0,total:0,percent:0,summary:'',why:'',notes:'',cover:'',source:'',tags:[]};
        result.books.push(book); booksAdded++;
      }
      const h = {id:uid(),bookId:book.id,text:entry.text,location:entry.location,kind:entry.kind};
      const key = fingerprint(h);
      if (seen.has(key)) { duplicates++; continue; }
      seen.add(key); result.highlights.push(h); added++;
    }
    return {library:validate(result),added,duplicates,booksAdded,skipped:parsed.skipped};
  }
  const api = {validate,progress,parseClippings,importClippings,normalize,uid};
  root.ShelfCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
