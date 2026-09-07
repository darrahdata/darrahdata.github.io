import { useEffect, useMemo, useRef, useState } from 'react';
import { offlineStatus, saveOfflinePack, removeOfflinePack } from '../offline.js';
import { signs } from '../data/signs.js';
import { collections, collectionSigns } from '../data/collections.js';
export default function OfflinePack() {
  const [scope,setScope]=useState('first-signs');
  const [status,setStatus] = useState(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const abort = useRef(null);
  const collection=collections.find(c=>c.id===scope);
  const pack=useMemo(()=>(collection ? collectionSigns(signs,collection) : signs).filter(s=>s.demo?.src),[scope]);
  const paths=useMemo(()=>[...new Set(pack.flatMap(s=>[s.demo.src,s.demo.poster]))],[pack]);
  const megabytes=Math.ceil(pack.reduce((sum,s)=>sum+(s.demo.bytes || 0),0)/1000000);
  useEffect(() => {
    let active=true;setStatus(null);setMessage('');
    offlineStatus(paths).then(s => {if(active)setStatus(s);}).catch(() => {if(active)setStatus({supported:false,count:0,total:paths.length});});
    return () => {active=false;abort.current?.abort();};
  },[paths]);
  async function save() {
    const controller = new AbortController(); abort.current=controller;
    setBusy(true);setMessage(`Saving ${pack.length} videos and images…`);
    try {
      const result=await saveOfflinePack((count,total) => {if(!controller.signal.aborted){setStatus({supported:true,count,total});setMessage(`Saving ${count} of ${total} files…`);}},controller.signal,paths);
      if(!controller.signal.aborted){setStatus(result);setMessage(`All ${pack.length} videos in this pack are saved for offline practice.`);}
    } catch(error) {
      if(!controller.signal.aborted) {controller.abort();setBusy(false);setMessage(error.name === 'QuotaExceededError' ? 'Your browser has insufficient storage. Try a smaller collection or free some space.' : 'The download stopped. Reconnect and retry; already saved files will be reused.');}
    } finally { if(!controller.signal.aborted)setBusy(false); }
  }
  async function remove() {
    if(!window.confirm('Remove all saved Tiny Signs videos from this device? Your practice history and saved-sign list will stay.'))return;
    setBusy(true);
    try {await removeOfflinePack();setStatus(await offlineStatus(paths));setMessage('All offline videos removed. Your practice history is unchanged.');}
    catch {setMessage('Storage is unavailable in this browser.');}
    finally {setBusy(false);}
  }
  async function cancel(){abort.current?.abort();setBusy(false);setMessage('Download paused. Already saved files will be reused when you retry.');try{setStatus(await offlineStatus(paths));}catch{}}
  const complete=status && status.count === status.total;
  return <section className="card setting-card offline-pack"><p className="eyebrow">Take your practice with you</p><h2>Save a collection for offline use</h2><p>Choose the moments you need, or download the full library. Written lessons and practice screens save automatically after an online load.</p>
    <label className="recall-scope">Video pack <select value={scope} disabled={busy} onChange={e=>setScope(e.target.value)}>{collections.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}<option value="all">All in-app videos</option></select></label><p><strong>{pack.length} videos · about {megabytes} MB</strong>. External teacher references need internet access.</p><p>Browser storage can be cleared by your device. Check this status before you travel.</p>
    {status?.supported ? <><p className="offline-count">{complete ? '✓ This collection is saved' : `${status.count} / ${status.total} files saved`}</p><div className="offline-actions"><button type="button" className="button primary" disabled={busy || complete} onClick={save}>{busy ? 'Saving…' : complete ? 'Ready offline ✓' : 'Save this video pack'}</button>{busy && <button type="button" className="button quiet" onClick={cancel}>Pause download</button>}<button type="button" className="button quiet" disabled={busy} onClick={remove}>Remove all offline videos</button></div></> : <p>{status === null ? 'Checking offline storage…' : 'Offline storage is unavailable here. Open Tiny Signs in Safari or Chrome with normal browsing enabled.'}</p>}
    <p role="status">{message}</p><a href={`${import.meta.env.BASE_URL}credits.html`} target="_blank" rel="noreferrer">Video credits & license ↗</a>
  </section>;
}
