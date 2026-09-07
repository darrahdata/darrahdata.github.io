import { useEffect, useRef, useState } from 'react';
import { offlineStatus, saveOfflinePack, removeOfflinePack } from '../offline.js';
export default function OfflinePack() {
  const [status,setStatus] = useState(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const abort = useRef(null);
  useEffect(() => {
    let active=true;
    offlineStatus().then(s => {if(active)setStatus(s);}).catch(() => {if(active)setStatus({supported:false,count:0,total:60});});
    return () => {active=false;abort.current?.abort();};
  },[]);
  async function save() {
    const controller = new AbortController(); abort.current=controller;
    setBusy(true);setMessage('Saving the 30-sign video pack…');
    try {
      const result=await saveOfflinePack((count,total) => {if(!controller.signal.aborted){setStatus({supported:true,count,total});setMessage(`Saving ${count} of ${total} files…`);}},controller.signal);
      if(!controller.signal.aborted){setStatus(result);setMessage('All 30 videos and reference images are saved for offline practice.');}
    } catch(error) {
      if(!controller.signal.aborted) {controller.abort();setBusy(false);setMessage(error.name === 'QuotaExceededError' ? 'Your browser has insufficient storage. Free some space and retry.' : 'The download stopped. Reconnect and retry; already saved files will be reused.');}
    } finally { if(!controller.signal.aborted)setBusy(false); }
  }
  async function remove() {
    setBusy(true);
    try {await removeOfflinePack();setStatus(await offlineStatus());setMessage('Offline videos removed. Your practice history is unchanged.');}
    catch {setMessage('Storage is unavailable in this browser.');}
    finally {setBusy(false);}
  }
  const complete=status && status.count === status.total;
  return <section className="card setting-card offline-pack"><p className="eyebrow">Take your practice with you</p><h2>Offline video pack</h2><p>Save all 30 human reference clips and images, about 34 MB. Your written lessons and practice screens are saved automatically after the app loads online.</p><p>Browser storage can be cleared by your device. Check this status before you travel.</p>
    {status?.supported ? <><p className="offline-count">{complete ? '✓ All videos saved' : `${status.count} / ${status.total} files saved`}</p><div className="offline-actions"><button type="button" className="button primary" disabled={busy || complete} onClick={save}>{busy ? 'Saving…' : complete ? 'Ready offline ✓' : 'Save videos for offline use'}</button>{status.count > 0 && <button type="button" className="button quiet" disabled={busy} onClick={remove}>Remove saved videos</button>}</div></> : <p>{status === null ? 'Checking offline storage…' : 'Offline storage is unavailable here. Open Tiny Signs in Safari or Chrome with normal browsing enabled.'}</p>}
    <p role="status">{message}</p><a href={`${import.meta.env.BASE_URL}credits.html`} target="_blank" rel="noreferrer">Video credits & license ↗</a>
  </section>;
}
