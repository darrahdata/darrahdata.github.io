const SHELL = 'tiny-signs-shell-e530d38ad4b6';
const MEDIA = 'tiny-signs-media-v1';
const ROOT = new URL('./',self.location).href;
const PRECACHE = ["index.html","manifest.webmanifest","icon.svg","credits.html","assets/dev-Bx_24ilI.js","assets/dev-nwFmLhcT.css","assets/icon-D30zJPF8.svg","assets/manifest-CRX9RlH4.webmanifest"].map(path => new URL(path,ROOT).href);
self.addEventListener('install',event => event.waitUntil((async() => {
  const cache=await caches.open(SHELL);await cache.addAll(PRECACHE);await self.skipWaiting();
})()));
self.addEventListener('activate',event => event.waitUntil((async() => {
  for(const name of await caches.keys()) if(name.startsWith('tiny-signs-shell-') && name !== SHELL) await caches.delete(name);
  await self.clients.claim();
})()));
async function rangeResponse(request,response) {
  const range=request.headers.get('range');
  if(!range) return response;
  const bytes=await response.arrayBuffer();
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  const invalid=() => new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.byteLength}`}});
  if(!match || (!match[1] && !match[2])) return invalid();
  const start=match[1] ? Number(match[1]) : Math.max(0,bytes.byteLength-Number(match[2]));
  const end=match[1] ? (match[2] ? Math.min(Number(match[2]),bytes.byteLength-1) : bytes.byteLength-1) : bytes.byteLength-1;
  if(start > end || start >= bytes.byteLength) return invalid();
  return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':response.headers.get('Content-Type') || 'video/mp4','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${bytes.byteLength}`,'Content-Length':String(end-start+1)}});
}
self.addEventListener('fetch',event => {
  const request=event.request;
  if(request.method !== 'GET' || !request.url.startsWith(ROOT)) return;
  event.respondWith((async() => {
    const parsed=new URL(request.url);
    if(parsed.pathname.startsWith(new URL('media/',ROOT).pathname)) {
      const cache=await caches.open(MEDIA);const saved=await cache.match(request.url);
      if(saved) return rangeResponse(request,saved);
      return fetch(request);
    }
    if(request.mode === 'navigate') {
      try {const response=await fetch(request);if(response.ok)return response;} catch {}
      return (await caches.match(request.url)) || (await caches.match(new URL('index.html',ROOT).href)) || new Response('Open Tiny Signs online once to prepare offline lessons.',{status:503});
    }
    return (await caches.match(request)) || fetch(request);
  })());
});
