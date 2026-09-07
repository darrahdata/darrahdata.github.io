import media from './data/media.json';
export const MEDIA_CACHE = 'tiny-signs-media-v1';
export const mediaPaths = Object.values(media).flatMap(item => [item.src,item.poster]);
const url = path => new URL(`${import.meta.env.BASE_URL}${path}`,window.location.origin).href;
export async function offlineStatus() {
  if (!('caches' in window) || !('serviceWorker' in navigator)) return {supported:false,count:0,total:mediaPaths.length};
  const cache = await caches.open(MEDIA_CACHE);
  const items = await Promise.all(mediaPaths.map(path => cache.match(url(path))));
  return {supported:true,count:items.filter(Boolean).length,total:mediaPaths.length};
}
export async function saveOfflinePack(onProgress, signal) {
  const cache = await caches.open(MEDIA_CACHE);
  let cursor = 0, count = 0;
  async function worker() {
    while (cursor < mediaPaths.length) {
      if (signal.aborted) throw new DOMException('Canceled','AbortError');
      const path = mediaPaths[cursor++];
      const requestUrl = url(path);
      if (!(await cache.match(requestUrl))) {
        const response = await fetch(requestUrl,{signal,cache:'reload'});
        if (!response.ok || response.status !== 200) throw new Error('A file could not be saved. Reconnect and retry.');
        await cache.put(requestUrl,response);
      }
      count++; onProgress(count,mediaPaths.length);
    }
  }
  await Promise.all([worker(),worker(),worker()]);
  return offlineStatus();
}
export async function removeOfflinePack() { await caches.delete(MEDIA_CACHE); }
