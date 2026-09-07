import { useEffect, useRef, useState } from "react";

export const mediaUrl = path => `${import.meta.env.BASE_URL}${path}`;

export default function SignDemo({ sign, compact = false, concealWord = false }) {
  const videoRef = useRef(null);
  useEffect(() => { const video = videoRef.current; return () => video?.pause(); }, []);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [error, setError] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [message, setMessage] = useState("");
  async function play() {
    try { await videoRef.current.play(); setMessage(""); }
    catch { setMessage("Tap the video’s play control to begin."); }
  }
  function seek(delta) {
    const video = videoRef.current;
    video.pause();
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
    setTime(video.currentTime);
  }
  async function enlarge() {
    const video = videoRef.current;
    try {
      if (video.requestFullscreen) await video.requestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      else setMessage("Use your browser’s zoom or turn your phone sideways for a larger view.");
    } catch { setMessage("Use your browser’s zoom or turn your phone sideways for a larger view."); }
  }
  if (!sign.demo?.src) return <div className="external-demo"><span className="external-demo-symbol" aria-hidden="true">✝</span><p className="eyebrow">Teacher’s demonstration · opens another site</p><h3>Learn {sign.word} with a real signer.</h3><p>This lesson’s demonstration is available on ASL University. Open it, study the hand positions, then return here to practice.</p><a className="button primary" href={sign.demo.sourceUrl} target="_blank" rel="noreferrer">Open {sign.word} teaching reference ↗</a><p className="external-demo-note">{sign.demo.credit} · Internet required. This reference is not included in the offline video pack.</p></div>;
  return <div className={`real-demo ${compact ? "is-compact" : ""}`}>
    <div className="native-video-frame">
      <video ref={videoRef} src={mediaUrl(sign.demo.src)} poster={mediaUrl(sign.demo.poster)}
        controls playsInline preload="none" loop={repeat}
        aria-label={concealWord ? "Mystery sign reference clip" : `${sign.word} reference clip`}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onLoadedMetadata={e => { setDuration(e.currentTarget.duration); setError(false); }}
        onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onError={() => setError(true)} />
    </div>
    {error && <p className="video-status" role="status">This clip is unavailable. Reconnect and save the offline pack in Settings, or open the source below.</p>}
    <div className="player-controls" aria-label="Video practice controls">
      <button type="button" onClick={() => playing ? videoRef.current.pause() : play()}>{playing ? "Ⅱ Pause" : "▶ Play"}</button>
      <button type="button" onClick={() => { videoRef.current.currentTime = 0; play(); }}>↺ Replay</button>
      <label>Speed <select value={rate} onChange={e => { const next = Number(e.target.value); videoRef.current.playbackRate = next; setRate(next); }}>{[.25,.5,1].map(value => <option key={value} value={value}>{value === 1 ? "Normal" : `${value}×`}</option>)}</select></label>
      <button type="button" aria-pressed={repeat} onClick={() => setRepeat(!repeat)}>Repeat {repeat ? "on" : "off"}</button>
      <button type="button" onClick={enlarge}>Enlarge</button>
    </div>
    <div className="precision-controls"><span>Inspect the movement</span><button type="button" disabled={!duration} onClick={() => seek(-.1)}>← 0.1s</button><input aria-label="Video position" type="range" min="0" max={duration || 1} step="0.05" value={Math.min(time,duration || 1)} disabled={!duration} onChange={e => { videoRef.current.pause(); videoRef.current.currentTime = Number(e.target.value); setTime(Number(e.target.value)); }} /><button type="button" disabled={!duration} onClick={() => seek(.1)}>0.1s →</button></div>
    {message && <p role="status" className="video-status">{message}</p>}
    {concealWord && <p className="quiz-credit">ASL Signbank (2026) · CC BY-NC-SA 4.0 · <a href={`${import.meta.env.BASE_URL}credits.html`} target="_blank" rel="noreferrer">Credits</a></p>}
    {!concealWord && <><div className="demo-credit"><span><b>Human reference clip</b><small>{sign.demo.credit} · {sign.demo.license}</small></span><a href={sign.demo.sourceUrl} target="_blank" rel="noreferrer">Source & sign variant ↗</a></div>
      <p className="orientation-note">The signer faces you. Their right hand appears on your left. Use your comfortable signing hand. This reference shows hand movement; learn natural expression and context with a qualified ASL teacher.</p></>}
  </div>;
}
