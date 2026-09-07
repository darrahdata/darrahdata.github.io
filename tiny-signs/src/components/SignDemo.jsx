import { useEffect, useRef, useState } from "react";

let apiPromise;
function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(window.YT); };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { apiPromise = undefined; script.remove(); reject(new Error("Video service unavailable")); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export default function SignDemo({ sign, compact = false }) {
  const mount = useRef(null);
  const player = useRef(null);
  const repeatRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [rates, setRates] = useState([1]);
  const [repeat, setRepeat] = useState(false);
  const id = sign.demo.videoId;
  useEffect(() => {
    if (!loaded) return;
    let canceled = false;
    let instance;
    const timer = window.setTimeout(() => setError(true), 16000);
    loadYouTube().then(YT => {
      if (canceled) return;
      const node = document.createElement("div");
      mount.current.replaceChildren(node);
      instance = new YT.Player(node, {
        host: "https://www.youtube-nocookie.com", videoId: id,
        playerVars: { playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: event => {
            if (canceled) return;
            clearTimeout(timer); setReady(true); setError(false);
            player.current = event.target;
            event.target.getIframe().title = `${sign.word} demonstration by ${sign.demo.credit}`;
            event.target.getIframe().setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
            setRates(event.target.getAvailablePlaybackRates());
          },
          onStateChange: event => {
            if (canceled) return;
            setPlaying(event.data === 1);
            if (event.data === 0 && repeatRef.current) { event.target.seekTo(0, true); event.target.playVideo(); }
          },
          onPlaybackRateChange: event => { if (!canceled) setRate(event.data); },
          onError: () => { if (!canceled) { clearTimeout(timer); setError(true); setReady(false); } }
        }
      });
    }).catch(() => { if (!canceled) { clearTimeout(timer); setError(true); } });
    return () => { canceled = true; clearTimeout(timer); instance?.destroy(); player.current = null; };
  }, [loaded, id, sign.word, sign.demo.credit]);
  return (
    <div className={`real-demo ${compact ? "is-compact" : ""}`}>
      {!loaded ? <button type="button" className="video-cover" onClick={() => setLoaded(true)}>
        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={`${sign.word} video preview`} />
        <span className="video-cover-action"><b aria-hidden="true">▶</b><strong>Watch {sign.word}</strong><small>A real person. The whole movement.</small></span>
      </button> : <div className="video-frame" ref={mount} />}
      {loaded && !ready && !error && <p className="video-status" role="status">Loading demonstration…</p>}
      {error && <p className="video-status" role="status">The player could not load. <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer">Watch this video on YouTube ↗</a> or use the hand cues below.</p>}
      {ready && <div className="player-controls" aria-label="Video practice controls">
        <button type="button" onClick={() => playing ? player.current.pauseVideo() : player.current.playVideo()}>{playing ? "Ⅱ Pause" : "▶ Play"}</button>
        <button type="button" onClick={() => { player.current.seekTo(0, true); player.current.playVideo(); }}>↺ Replay</button>
        <label>Speed <select value={rate} onChange={e => player.current.setPlaybackRate(Number(e.target.value))}>{rates.map(value => <option key={value} value={value}>{value === 1 ? "Normal" : `${value}×`}</option>)}</select></label>
        <button type="button" aria-pressed={repeat} onClick={() => { repeatRef.current = !repeat; setRepeat(!repeat); }}>Repeat {repeat ? "on" : "off"}</button>
      </div>}
      <div className="demo-credit"><span><b>Human demonstration</b><small>{sign.demo.credit}</small></span><a href={sign.demo.sourceUrl || sign.source.url} target="_blank" rel="noreferrer">Video source ↗</a></div>
      <p className="orientation-note">The signer faces you, like someone across a table. Their right hand appears on your left. Use your own comfortable signing hand.</p>
    </div>
  );
}
