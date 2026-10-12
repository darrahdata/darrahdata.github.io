export const MAX_STEPS = 32;
export const DEFAULT_TITLE = 'Our class prayers';

export function defaultClassTitle(date = new Date(), number = 1) {
  return `${new Intl.DateTimeFormat('en-US', {month:'long',day:'numeric',year:'numeric'}).format(date)} · Class ${number}`;
}

export function validateSet(value, catalog) {
  if (!value || value.version !== 1 || typeof value.title !== 'string' || value.title.length > 80 ||
      !Array.isArray(value.ids) || value.ids.length > MAX_STEPS ||
      value.ids.some(id => typeof id !== 'string' || !catalog.has(id))) throw new Error('This class link is not supported or is incomplete.');
  return {version:1, title:value.title.trim() || DEFAULT_TITLE, ids:[...value.ids]};
}

export function encodeSet(value, catalog) {
  const set = validateSet(value, catalog);
  if (!set.ids.length) throw new Error('Add a prayer or mystery before sharing.');
  const bytes = new TextEncoder().encode(JSON.stringify([1,set.title,set.ids]));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/, '');
}

export function decodeSet(encoded, catalog) {
  if (!encoded || encoded.length > 6000 || !/^[\w-]+$/.test(encoded)) throw new Error('This class link is incomplete.');
  try {
    const bytes = Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')), c => c.charCodeAt(0));
    const [version,title,ids] = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    const set = validateSet({version,title,ids},catalog);
    if (!set.ids.length) throw new Error();
    return set;
  } catch {throw new Error('This class link is incomplete or uses a newer prayer library. Ask your instructor for a fresh link.');}
}

export function shareURL(set, catalog, location) {
  const url = new URL(location);
  url.search = '';
  url.hash = `class=${encodeSet(set,catalog)}`;
  return url.href;
}

export function moveStep(ids, index, delta) {
  const next = [...ids], destination = index + delta;
  if (index < 0 || index >= ids.length || destination < 0 || destination >= ids.length) return next;
  [next[index],next[destination]] = [next[destination],next[index]];
  return next;
}
