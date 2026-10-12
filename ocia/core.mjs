export const MAX_STEPS = 32;
export const DEFAULT_TITLE = 'Our class prayers';

export function defaultClassTitle(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {month:'long',day:'numeric',year:'numeric'}).format(date);
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

export function groupSteps(ids) {
  const groups = [];
  ids.forEach((id, start) => {
    const last = groups.at(-1);
    if (last?.id === id) last.count++;
    else groups.push({id,start,count:1});
  });
  return groups;
}

function findStepGroup(groups, start) {
  if (!Number.isInteger(start) || start < 0) throw new Error('Choose the start of a prayer or mystery group.');
  const index = groups.findIndex(group => group.start === start);
  if (index < 0) throw new Error('Choose the start of a prayer or mystery group.');
  return index;
}

export function setStepCount(ids, start, count) {
  if (!Number.isInteger(count) || count < 0 || count > MAX_STEPS) throw new Error(`Choose a repeat count from 1 to ${MAX_STEPS}, or 0 to remove the group.`);
  const groups = groupSteps(ids);
  const group = groups[findStepGroup(groups,start)];
  if (ids.length - group.count + count > MAX_STEPS) throw new Error(`A class can contain up to ${MAX_STEPS} pages. Reduce a repeat count or remove a group first.`);
  return [...ids.slice(0,start), ...Array(count).fill(group.id), ...ids.slice(start + group.count)];
}

export function moveStepGroup(ids, start, delta) {
  if (delta !== -1 && delta !== 1) throw new Error('Move a prayer or mystery group one place up or down.');
  const groups = groupSteps(ids);
  const index = findStepGroup(groups,start), destination = index + delta;
  if (destination < 0 || destination >= groups.length) return [...ids];
  [groups[index],groups[destination]] = [groups[destination],groups[index]];
  return groups.flatMap(group => Array(group.count).fill(group.id));
}
