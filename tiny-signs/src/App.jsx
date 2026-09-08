import { useEffect, useState } from "react";
import { signs } from "./data/signs.js";
import GuidedLessonPage from "./components/GuidedLessonPage.jsx";
import RecallPage from "./components/RecallPage.jsx";
import SignDemo from "./components/SignDemo.jsx";
import FamilyLibrary, { CollectionTiles } from "./components/FamilyLibrary.jsx";
import SettingsPage from "./components/SettingsPage.jsx";

const STORAGE_KEY = "tiny-signs-progress-v1";
const SETTINGS_KEY = "tiny-signs-settings-v1";

const routines = [
  { name: "Feeding", note: "Breast or bottle", signId: "milk", signLabel: "Milk", icon: "◒" },
  { name: "Changing", note: "A diaper change", signId: "diaper", signLabel: "Diaper", icon: "◇" },
  { name: "Bedtime", note: "Nap or night", signId: "sleep", signLabel: "Sleep", icon: "☾" },
  { name: "Comforting", note: "Soothe and connect", signId: "dad", signLabel: "Dad", icon: "♡" },
  { name: "Playing", note: "Another turn", signId: "more", signLabel: "More", icon: "◎" }
];

function readStored(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function readRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash.startsWith("learn/")) return { page: "learn", signId: hash.split("/")[1] };
  if (hash === "practice" || hash.startsWith("practice/")) return { page: "practice", collectionId: hash.split("/")[1] };
  if (hash === "signs" || hash.startsWith("signs/")) return { page: "signs", collectionId: hash.split("/")[1] };
  if (hash === "settings") return { page: "settings" };
  return { page: "today" };
}

function AppHeader({ page, lowLight, onToggleTheme, go }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <nav className="all-apps-nav" aria-label="Site"><a className="all-apps-link" href="../"><span className="all-apps-symbol" aria-hidden="true">←</span> All apps</a></nav>
        <button type="button" className="brand" onClick={() => go("today")} aria-label="Tiny Signs home">
          <span className="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
          <span><strong>Tiny Signs</strong><small>learn baby signs</small></span>
        </button>
        <div className="header-actions">
          <button type="button" className="theme-toggle" onClick={onToggleTheme} aria-pressed={lowLight}>
            <span aria-hidden="true">{lowLight ? "☀" : "☾"}</span>
            <span className="theme-label">{lowLight ? "Day" : "Low light"}</span>
          </button>
        </div>
      </div>
      <nav className="desktop-nav" aria-label="Main navigation">
        <button className={page === "today" ? "active" : ""} aria-current={page === "today" ? "page" : undefined} type="button" onClick={() => go("today")}>Home</button>
        <button className={page === "signs" ? "active" : ""} aria-current={page === "signs" ? "page" : undefined} type="button" onClick={() => go("signs")}>All signs</button>
        <button className={page === "practice" ? "active" : ""} aria-current={page === "practice" ? "page" : undefined} type="button" onClick={() => go("practice")}>Practice</button>
        <button className={page === "settings" ? "active" : ""} aria-current={page === "settings" ? "page" : undefined} type="button" onClick={() => go("settings")}>Settings</button>
      </nav>
    </header>
  );
}

function BottomNav({ page, go }) {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <button className={page === "today" ? "active" : ""} aria-current={page === "today" ? "page" : undefined} type="button" onClick={() => go("today")}>
        <span aria-hidden="true">⌂</span>Home
      </button>
      <button className={page === "signs" ? "active" : ""} aria-current={page === "signs" ? "page" : undefined} type="button" onClick={() => go("signs")}>
        <span aria-hidden="true">☝</span>Signs
      </button>
      <button className={page === "practice" ? "active" : ""} aria-current={page === "practice" ? "page" : undefined} type="button" onClick={() => go("practice")}><span aria-hidden="true">↺</span>Practice</button>
      <button className={page === "settings" ? "active" : ""} aria-current={page === "settings" ? "page" : undefined} type="button" onClick={() => go("settings")}>
        <span aria-hidden="true">⚙</span>Settings
      </button>
    </nav>
  );
}

function TodayPage({ progress, onOpen, go }) {
  const starterIds = ["milk", "more", "all-done"];
  const starters = starterIds.map(id => signs.find(sign => sign.id === id));
  const practiced = starters.filter(sign => progress[sign.id]?.practiceCount > 0).length;
  const next = starters.find(sign => !progress[sign.id]?.practiceCount) || starters[0];
  return (
    <main id="main-content" tabIndex={-1} className="page-shell today-page">
      <section className="first-lesson" aria-labelledby="welcome-heading">
        <div className="first-lesson-copy">
          <p className="eyebrow">Little signs. Everyday connection.</p>
          <h1 id="welcome-heading">Your first sign.<br /><em>A little closer.</em></h1>
          <p>You don’t need to know any sign language. Start with Milk: watch a real person, try the movement, and learn when to use it.</p>
          <button type="button" className="button primary" onClick={() => onOpen("milk")}>Learn Milk, step by step <span aria-hidden="true">→</span></button>
          <span className="beginner-note">Learning before baby arrives? This is for you, too.</span>
        </div>
        <div className="home-demo"><div className="home-demo-title"><span>YOUR FIRST SIGN</span><strong>Milk</strong><small>One hand · feeding time</small></div><SignDemo sign={starters[0]} /></div>
      </section>
      <section className="starter-path card" aria-labelledby="path-heading">
        <div className="section-heading"><div><p className="eyebrow">Start small</p><h2 id="path-heading">Three signs to feel ready.</h2><p>Learn these at your own pace. Then practice with everyday routines.</p></div><span className="path-count">{practiced} / 3 practiced</span></div>
        <div className="path-steps">{starters.map((sign,index) => <button type="button" key={sign.id} onClick={() => onOpen(sign.id)}><span className="path-number">{progress[sign.id]?.practiceCount ? "✓" : `0${index + 1}`}</span><strong>{sign.word}</strong><small>{["Before a feed", "Another song or turn", "When an activity ends"][index]}</small><span className="path-link">{progress[sign.id]?.practiceCount ? "Practice again" : "Learn this sign"} →</span></button>)}</div>
        <div className="path-footer"><span>No streaks. No catching up. Just a few useful signs.</span><button type="button" className="text-button" onClick={() => onOpen(next.id)}>{practiced === 3 ? "Revisit Milk" : `Continue with ${next.word}`} →</button></div>
      </section>
      <section className="recall-invitation card"><div><p className="eyebrow">Beyond watching</p><h2>Can you remember the movement?</h2><p>Try a short round with the video hidden, or name a sign you see.</p></div><button type="button" className="button primary" onClick={() => go("practice")}>Practice from memory →</button></section>
      <section className="section-block" aria-labelledby="moment-heading"><div className="section-heading"><div><p className="eyebrow">In the moment</p><h2 id="moment-heading">Find a sign for right now.</h2></div><button className="text-button" type="button" onClick={() => go("signs")}>All {signs.length} signs →</button></div><div className="moment-grid">{routines.map(routine => <button type="button" className="moment-button" key={routine.name} onClick={() => onOpen(routine.signId)}><span className="moment-icon" aria-hidden="true">{routine.icon}</span><span><strong>{routine.name}</strong><small>{routine.note}</small></span><span className="moment-sign">{routine.signLabel} →</span></button>)}</div></section>
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Grow your vocabulary together</p><h2>For all the places life takes you.</h2></div><button type="button" className="text-button" onClick={() => go("signs")}>Explore the library →</button></div><CollectionTiles compact go={go}/></section>
      <section className="before-baby card"><span aria-hidden="true">♡</span><div><h2>Practice now. Use it together later.</h2><p>For now, rehearse while you say the word out loud. With your baby, say the word, make the sign, then follow through with the feed, cuddle, or game. These lessons are for you to watch; the connection happens face to face.</p></div></section>
      <SafetyFooter />
    </main>
  );
}

function SafetyFooter() {
  return (
    <footer className="safety-footer">
      <div><strong>Tiny Signs supports connection—not a milestone race.</strong><p>Keep talking, reading, and responding to your baby’s natural cues. Never wait for a sign before meeting a need. These vocabulary lessons are an introduction, not a complete ASL course.</p></div>
      <div className="source-links">
        <a href="https://www.healthychildren.org/English/ages-stages/baby/Pages/These-Hands-Were-Made-for-Talking.aspx" target="_blank" rel="noreferrer">AAP baby-sign guidance ↗</a>
        <a href={`${import.meta.env.BASE_URL}credits.html`}>Video credits & teaching notes ↗</a>
        <a href="https://www.nidcd.nih.gov/health/american-sign-language" target="_blank" rel="noreferrer">About ASL · NIDCD ↗</a>
        <a href="https://www.cdc.gov/infant-toddler-nutrition/mealtime/signs-your-child-is-hungry-or-full.html" target="_blank" rel="noreferrer">Responsive feeding · CDC ↗</a>
      </div>
    </footer>
  );
}

export default function App() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => { const update=()=>setOnline(navigator.onLine); window.addEventListener("online",update); window.addEventListener("offline",update); return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);}; },[]);
  const [route, setRoute] = useState(readRoute);
  const [progress, setProgress] = useState(() => readStored(STORAGE_KEY, {}));
  const [settings, setSettings] = useState(() => ({
    dominantHand: "right",
    lowLight: false,
    learnMore: false,
    lastSignId: "milk",
    ...readStored(SETTINGS_KEY, {})
  }));

  useEffect(() => {
    const onHashChange = () => { setRoute(readRoute()); window.scrollTo({ top: 0, behavior: "auto" }); };
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) window.history.replaceState(null, "", "#/today");
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // The lessons still work when storage is blocked or unavailable.
    }
  }, [progress]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Preferences remain available for the current session.
    }
  }, [settings]);

  const go = (path) => {
    window.location.hash = `/${path}`;
  };

  const openSign = (id) => {
    setSettings((current) => ({ ...current, lastSignId: id }));
    go(`learn/${id}`);
  };

  const logPractice = (id) => {
    setProgress((current) => ({
      ...current,
      [id]: {
        ...current[id],
        count: (current[id]?.count || 0) + 1,
        lastModeled: new Date().toISOString()
      }
    }));
  };

  const savedSigns = Array.isArray(settings.savedSigns) ? settings.savedSigns : [];
  const toggleSaved = id => setSettings(current => { const saved = Array.isArray(current.savedSigns) ? current.savedSigns : []; return {...current,savedSigns:saved.includes(id) ? saved.filter(item=>item !== id) : [...saved,id]}; });
  const selectedSign = signs.find((sign) => sign.id === route.signId) || signs[0];
  const updateSettings = (changes) => setSettings((current) => ({ ...current, ...changes }));
  const resetProgress = () => {
    if (window.confirm("Reset all Tiny Signs practice and modeled counts on this device?")) setProgress({});
  };

  return (
    <div className={settings.lowLight ? "app low-light" : "app"}>
      <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById("main-content")?.focus(); }}>Skip to content</a>
      <AppHeader
        page={route.page}
        lowLight={settings.lowLight}
        onToggleTheme={() => setSettings((current) => ({ ...current, lowLight: !current.lowLight }))}
        go={go}
      />
      {!online && <div className="offline-banner" role="status">You’re offline. Written lessons and saved video packs are available.</div>}
      {route.page === "today" && <TodayPage progress={progress} onOpen={openSign} go={go} />}
      {route.page === "signs" && <FamilyLibrary key={route.collectionId || "all"} collectionId={route.collectionId} saved={savedSigns} onToggleSaved={toggleSaved} progress={progress} onOpen={openSign} go={go} />}
      {route.page === "learn" && (
        <GuidedLessonPage key={selectedSign.id}
          sign={selectedSign}
          saved={savedSigns.includes(selectedSign.id)} onToggleSaved={() => toggleSaved(selectedSign.id)}
          progress={progress[selectedSign.id]}
          dominantHand={settings.dominantHand}
          setDominantHand={(dominantHand) => setSettings((current) => ({ ...current, dominantHand }))}
          learnMore={settings.learnMore}
          setLearnMore={(learnMore) => setSettings((current) => ({ ...current, learnMore }))}
          onReview={() => go("practice")}
          onPractice={(id) => setProgress(current => ({ ...current, [id]: { ...current[id], practiceCount: (current[id]?.practiceCount || 0) + 1 } }))}
          onLog={logPractice}
          onOpen={openSign}
          go={go}
        />
      )}
      {route.page === "practice" && <RecallPage key={route.collectionId || "default"} initialScope={route.collectionId} saved={savedSigns} progress={progress} onOpen={openSign} go={go} onRecall={(id,rating) => setProgress(current => ({...current,[id]:{...current[id],recallRating:rating,recallAt:new Date().toISOString(),recallCount:(current[id]?.recallCount || 0)+1}}))} />}
      {route.page === "settings" && <SettingsPage settings={settings} onChangeSettings={updateSettings} onResetProgress={resetProgress} />}
      <BottomNav page={route.page} go={go} />
    </div>
  );
}
