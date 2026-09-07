import media from './data/media.json';
export const MEDIA_CACHE = 'tiny-signs-media-v1';
export const mediaPaths = Object.values(media).flatMap(item => [item.src,item.poster]);
const url = path => new URL(`${import.meta.env.BASE_URL}${path}`,window.location.origin).href;
export async function offlineStatus(paths = mediaPaths) {
  if (!('caches' in window) || !('serviceWorker' in navigator)) return {supported:false,count:0,total:paths.length};
  const cache = await caches.open(MEDIA_CACHE);
  const items = await Promise.all(paths.map(path => cache.match(url(path))));
  return {supported:true,count:items.filter(Boolean).length,total:paths.length};
}
export async function saveOfflinePack(onProgress, signal, paths = mediaPaths) {
  const cache = await caches.open(MEDIA_CACHE);
  let cursor = 0, count = 0;
  async function worker() {
    while (cursor < paths.length) {
      if (signal.aborted) throw new DOMException('Canceled','AbortError');
      const path = paths[cursor++];
      const requestUrl = url(path);
      if (!(await cache.match(requestUrl))) {
        const response = await fetch(requestUrl,{signal,cache:'reload'});
        if (!response.ok || response.status !== 200) throw new Error('A file could not be saved. Reconnect and retry.');
        await cache.put(requestUrl,response);
      }
      count++; onProgress(count,paths.length);
    }
  }
  await Promise.all([worker(),worker(),worker()]);
  return offlineStatus(paths);
}
export async function removeOfflinePack() { await caches.delete(MEDIA_CACHE); }
