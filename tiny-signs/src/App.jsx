import { useEffect, useMemo, useState } from "react";
import { signs, stageOrder } from "./data/signs.js";
import MotionCoach from "./components/MotionCoach.jsx";
import MirrorPractice from "./components/MirrorPractice.jsx";

const STORAGE_KEY = "tiny-signs-progress-v1";
const SETTINGS_KEY = "tiny-signs-settings-v1";

const routines = [
  { name: "Feeding", note: "Right before breast or bottle", signId: "milk", icon: "◒" },
  { name: "Changing", note: "Once baby is safely settled", signId: "diaper", icon: "◇" },
  { name: "Night shift", note: "At the same point before every rest", signId: "sleep", icon: "☾" },
  { name: "Calm & connect", note: "Name Dad while you talk and soothe", signId: "dad", icon: "♡" }
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
  if (hash === "signs") return { page: "signs" };
  return { page: "today" };
}

function formatCount(count) {
  if (!count) return "Not modeled yet";
  return `${count} ${count === 1 ? "time" : "times"} modeled`;
}

function AppHeader({ page, totalModeled, lowLight, onToggleTheme, go }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button type="button" className="brand" onClick={() => go("today")} aria-label="Tiny Signs home">
          <span className="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
          <span><strong>Tiny Signs</strong><small>newborn sign coach</small></span>
        </button>
        <div className="header-actions">
          <span className="modeled-count"><b>{totalModeled}</b> modeled</span>
          <button type="button" className="theme-toggle" onClick={onToggleTheme} aria-pressed={lowLight}>
            <span aria-hidden="true">{lowLight ? "☀" : "☾"}</span>
            <span className="theme-label">{lowLight ? "Day" : "Low light"}</span>
          </button>
        </div>
      </div>
      <nav className="desktop-nav" aria-label="Main navigation">
        <button className={page === "today" ? "active" : ""} aria-current={page === "today" ? "page" : undefined} type="button" onClick={() => go("today")}>Today</button>
        <button className={page === "signs" ? "active" : ""} aria-current={page === "signs" ? "page" : undefined} type="button" onClick={() => go("signs")}>All signs</button>
        <button className={page === "learn" ? "active" : ""} aria-current={page === "learn" ? "page" : undefined} type="button" onClick={() => go("learn/milk")}>Practice</button>
      </nav>
    </header>
  );
}

function BottomNav({ page, go }) {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <button className={page === "today" ? "active" : ""} aria-current={page === "today" ? "page" : undefined} type="button" onClick={() => go("today")}>
        <span aria-hidden="true">⌂</span>Today
      </button>
      <button className={page === "signs" ? "active" : ""} aria-current={page === "signs" ? "page" : undefined} type="button" onClick={() => go("signs")}>
        <span aria-hidden="true">☝</span>Signs
      </button>
      <button className={page === "learn" ? "active" : ""} aria-current={page === "learn" ? "page" : undefined} type="button" onClick={() => go("learn/milk")}>
        <span aria-hidden="true">◎</span>Practice
      </button>
    </nav>
  );
}

function SignCard({ sign, progress, onOpen, compact = false }) {
  const firstFrame = sign.cue?.frames?.[0];
  const symbols = {
    open: "🖐️", c: "🫳", fist: "✊", pinch: "🤌", point: "☝️",
    "two-open": "🖐️", "two-pinch": "🤌", "two-point": "👉", "two-three": "3", "a-on-flat": "👍"
  };
  return (
    <button type="button" className={`sign-card ${compact ? "compact" : ""}`} onClick={() => onOpen(sign.id)}>
      <span className={`sign-symbol sign-${sign.id}`} aria-hidden="true">{symbols[firstFrame?.shape] || "🖐️"}</span>
      <span className="sign-card-copy">
        <strong>{sign.word}</strong>
        <small>{compact ? sign.routine : sign.stageLabel}</small>
        {!compact && <em>{formatCount(progress?.count || 0)}</em>}
      </span>
      <span className="round-arrow" aria-hidden="true">→</span>
    </button>
  );
}

function TodayPage({ progress, onOpen, go }) {
  const starterSigns = signs.filter((sign) => sign.stage === "birth");
  return (
    <main id="main-content" className="page-shell today-page">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">A calm visual coach for Dad</p>
          <h1>See it. Copy it.<br /><span>Use it together.</span></h1>
          <p>Learn the first signs you can model with your baby inside the feeding, changing, sleep, and soothing routines you take responsibility for.</p>
          <div className="hero-actions">
            <button type="button" className="button primary" onClick={() => onOpen("milk")}>Practice Milk · 60 sec</button>
            <button type="button" className="button quiet" onClick={() => go("signs")}>See all 12 signs</button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>
          <span className="hero-hand">🖐️</span>
          <span className="hero-caption">shape · place · move</span>
        </div>
      </section>

      <section className="newborn-note" aria-labelledby="newborn-heading">
        <span className="note-icon" aria-hidden="true">0+</span>
        <div>
          <h2 id="newborn-heading">Model from birth. Expect no response yet.</h2>
          <p>Your baby may not sign back until around 8–9 months or later. Right now, your job is simply to say the word, make the sign once or twice, and immediately follow with the real routine.</p>
        </div>
      </section>

      <section className="dad-plan card" aria-labelledby="dad-plan-heading">
        <div className="dad-plan-intro">
          <p className="eyebrow">Your easiest practice plan</p>
          <h2 id="dad-plan-heading">Own two routines. Start with two signs.</h2>
          <p>You do not need a separate lesson block. Put the same sign inside a job you lead from beginning to end, every day.</p>
        </div>
        <div className="dad-plan-steps">
          <div><span>01</span><p><strong>Choose your jobs</strong>Milk at feeds that fit your family’s plan; Diaper for changes. Add more only when those feel automatic.</p></div>
          <div><span>02</span><p><strong>Narrate out loud</strong>Tell him what you are doing, say the key word, and make the sign once or twice.</p></div>
          <div><span>03</span><p><strong>Be the thermostat</strong>When the room gets frantic, slow your voice and your hands. Calm repetition is easier to notice.</p></div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="routine-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Use what is already happening</p><h2 id="routine-heading">Four routines you can own</h2></div>
          <span>Consistency beats quantity</span>
        </div>
        <div className="routine-grid">
          {routines.map((routine) => (
            <button type="button" className="routine-card" key={routine.name} onClick={() => onOpen(routine.signId)}>
              <span className="routine-icon" aria-hidden="true">{routine.icon}</span>
              <strong>{routine.name}</strong>
              <p>{routine.note}</p>
              <span>Learn {signs.find((sign) => sign.id === routine.signId)?.word} →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section-block" aria-labelledby="starter-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Your first set</p><h2 id="starter-heading">Start with these five</h2></div>
          <button className="text-button" type="button" onClick={() => go("signs")}>View every sign</button>
        </div>
        <div className="starter-grid">
          {starterSigns.map((sign) => <SignCard key={sign.id} sign={sign} progress={progress[sign.id]} onOpen={onOpen} compact />)}
        </div>
      </section>

      <section className="teaching-loop card" aria-labelledby="loop-heading">
        <div className="teaching-copy">
          <p className="eyebrow">The whole method</p>
          <h2 id="loop-heading">Say it → sign it → do it</h2>
          <p>Keep speaking, reading, and singing. The sign adds a visual cue; it does not replace language.</p>
        </div>
        <ol>
          <li><span>1</span><div><strong>Secure baby first</strong><p>Never trade a safe hold for a two-handed sign.</p></div></li>
          <li><span>2</span><div><strong>Say and sign</strong><p>Get natural attention and make the sign once or twice.</p></div></li>
          <li><span>3</span><div><strong>Follow through</strong><p>Immediately feed, change, soothe, or continue the routine.</p></div></li>
        </ol>
      </section>

      <SafetyFooter />
    </main>
  );
}

function SignsPage({ progress, onOpen }) {
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? signs : signs.filter((sign) => sign.stage === filter);
  return (
    <main id="main-content" className="page-shell signs-page">
      <div className="page-intro">
        <p className="eyebrow">A small, useful vocabulary</p>
        <h1>12 signs for daily life</h1>
        <p>Age bands tell you when a sign becomes especially useful—not when your baby must perform it.</p>
      </div>
      <div className="filter-tabs" role="group" aria-label="Filter signs by stage">
        <button type="button" className={filter === "all" ? "active" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
        {stageOrder.map((stage) => (
          <button type="button" className={filter === stage.id ? "active" : ""} aria-pressed={filter === stage.id} onClick={() => setFilter(stage.id)} key={stage.id}>{stage.shortLabel}</button>
        ))}
      </div>
      <div className="sign-library" aria-live="polite">
        {visible.map((sign) => <SignCard key={sign.id} sign={sign} progress={progress[sign.id]} onOpen={onOpen} />)}
      </div>
      <SafetyFooter />
    </main>
  );
}

function TechniqueCard({ number, title, children }) {
  return (
    <article className="technique-card">
      <span>{number}</span>
      <p className="eyebrow">{title}</p>
      <strong>{children}</strong>
    </article>
  );
}

function LessonPage({ sign, progress, dominantHand, setDominantHand, onLog, onOpen, go }) {
  const [checked, setChecked] = useState([]);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    setChecked([]);
    setLogged(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [sign.id]);

  const toggleCheck = (index) => {
    setChecked((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  };

  const ready = checked.length === sign.checks.length;
  const nextIndex = (signs.findIndex((item) => item.id === sign.id) + 1) % signs.length;

  const logPractice = () => {
    onLog(sign.id);
    setLogged(true);
  };

  return (
    <main id="main-content" className="page-shell lesson-page">
      <button type="button" className="back-button" onClick={() => go("signs")}>← All signs</button>
      <section className="lesson-title">
        <div>
          <p className="eyebrow">{sign.stageLabel} · {sign.routine}</p>
          <h1>{sign.word}</h1>
          <p>A practical sign to model during {sign.routine.toLowerCase()}.</p>
        </div>
        <div className="lesson-meta">
          <span>{sign.hands === "one" ? "One hand" : "Two hands"}</span>
          <span>{sign.repetitions}</span>
          <small>{formatCount(progress?.count || 0)}</small>
        </div>
      </section>

      <div className="lesson-layout">
        <div className="lesson-main">
          <section className="card demonstration-card">
            <MotionCoach sign={sign} dominantHand={dominantHand} />
            <div className="verified-demo">
              <div><strong>See a real ASL demonstration</strong><p>Use this Deaf-led sign reference to confirm exact form and natural timing.</p></div>
              <a className="button source" href={sign.source.url} target="_blank" rel="noreferrer">Watch on {sign.source.label} ↗</a>
            </div>
          </section>

          <section className="technique-section" aria-labelledby="technique-heading">
            <div className="section-heading"><div><p className="eyebrow">Break it down</p><h2 id="technique-heading">Shape · place · move</h2></div></div>
            <div className="technique-grid">
              <TechniqueCard number="01" title="Shape">{sign.shape}</TechniqueCard>
              <TechniqueCard number="02" title="Place">{sign.place}</TechniqueCard>
              <TechniqueCard number="03" title="Move">{sign.move}</TechniqueCard>
            </div>
            <div className="palm-note"><span aria-hidden="true">↗</span><p><strong>Palm direction:</strong> {sign.palm}</p></div>
          </section>

          <section className="card self-check" aria-labelledby="check-heading">
            <div className="self-check-heading">
              <div><p className="eyebrow">Am I doing it right?</p><h2 id="check-heading">Check four things</h2></div>
              <span>{checked.length} / {sign.checks.length}</span>
            </div>
            <div className="check-list">
              {sign.checks.map((check, index) => (
                <button
                  type="button"
                  className={checked.includes(index) ? "checked" : ""}
                  aria-pressed={checked.includes(index)}
                  onClick={() => toggleCheck(index)}
                  key={check.label}
                >
                  <span className="check-box" aria-hidden="true">{checked.includes(index) ? "✓" : ""}</span>
                  <span><strong>{check.label}</strong><small>{check.prompt}</small></span>
                </button>
              ))}
            </div>
            <div className="mistake-callout"><span aria-hidden="true">!</span><p><strong>Common mix-up:</strong> {sign.commonMistake}</p></div>
            <div className="ready-row">
              <div><strong>{ready ? "Your four checks match." : "Match all four parts first."}</strong><p>Tiny Signs guides your comparison; it does not certify or automatically grade your sign.</p></div>
              <button type="button" className="button primary" disabled={!ready || logged} onClick={logPractice}>
                {logged ? "Modeled today ✓" : "Ready to model"}
              </button>
            </div>
          </section>

          <MirrorPractice sign={sign} />
        </div>

        <aside className="lesson-aside">
          {sign.hands === "one" && (
            <section className="card handedness-card">
              <p className="eyebrow">Your signing hand</p>
              <h2>Choose what feels natural</h2>
              <div className="segmented-control">
                <button type="button" className={dominantHand === "right" ? "selected" : ""} aria-pressed={dominantHand === "right"} onClick={() => setDominantHand("right")}>Right</button>
                <button type="button" className={dominantHand === "left" ? "selected" : ""} aria-pressed={dominantHand === "left"} onClick={() => setDominantHand("left")}>Left</button>
              </div>
              <p>Use your dominant hand consistently. “Copy view” mirrors the motion to make imitation easier.</p>
            </section>
          )}

          <section className="card use-now-card">
            <p className="eyebrow">Use it in real life</p>
            <h2>{sign.routine}</h2>
            <blockquote>{sign.teachingMoment}</blockquote>
            <p>Model it consistently without asking your baby to perform. Respond to natural cues and approximations.</p>
          </section>

          <section className="card baby-version-card">
            <span aria-hidden="true">♡</span>
            <div><p className="eyebrow">Baby’s version counts</p><h2>Respond to the attempt</h2></div>
            <p>A baby’s sign may be smaller, looser, or one-handed. If it is consistent and fits the moment, respond warmly and model the adult form again.</p>
          </section>

          {sign.careNote && (
            <section className="care-note">
              <strong>Keep in mind</strong>
              <p>{sign.careNote}</p>
            </section>
          )}
        </aside>
      </div>

      <section className="next-sign card">
        <div><p className="eyebrow">Keep going</p><h2>Next: {signs[nextIndex].word}</h2></div>
        <button type="button" className="button secondary" onClick={() => onOpen(signs[nextIndex].id)}>Learn next sign →</button>
      </section>
    </main>
  );
}

function SafetyFooter() {
  return (
    <footer className="safety-footer">
      <div><strong>Tiny Signs supports connection—not a milestone race.</strong><p>Keep talking, reading, and responding to your baby’s natural cues. Never wait for a sign before meeting a need. These vocabulary lessons are an introduction, not a complete ASL course.</p></div>
      <div className="source-links">
        <a href="https://www.healthychildren.org/English/ages-stages/baby/Pages/These-Hands-Were-Made-for-Talking.aspx" target="_blank" rel="noreferrer">AAP baby-sign guidance ↗</a>
        <a href="https://www.nidcd.nih.gov/health/american-sign-language" target="_blank" rel="noreferrer">About ASL · NIDCD ↗</a>
        <a href="https://www.cdc.gov/infant-toddler-nutrition/mealtime/signs-your-child-is-hungry-or-full.html" target="_blank" rel="noreferrer">Responsive feeding · CDC ↗</a>
      </div>
    </footer>
  );
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [progress, setProgress] = useState(() => readStored(STORAGE_KEY, {}));
  const [settings, setSettings] = useState(() => readStored(SETTINGS_KEY, { dominantHand: "right", lowLight: false }));

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
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

  const openSign = (id) => go(`learn/${id}`);

  const logPractice = (id) => {
    setProgress((current) => ({
      ...current,
      [id]: {
        count: (current[id]?.count || 0) + 1,
        lastModeled: new Date().toISOString()
      }
    }));
  };

  const totalModeled = useMemo(() => Object.values(progress).reduce((total, item) => total + (item.count || 0), 0), [progress]);
  const selectedSign = signs.find((sign) => sign.id === route.signId) || signs[0];

  return (
    <div className={settings.lowLight ? "app low-light" : "app"}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <AppHeader
        page={route.page}
        totalModeled={totalModeled}
        lowLight={settings.lowLight}
        onToggleTheme={() => setSettings((current) => ({ ...current, lowLight: !current.lowLight }))}
        go={go}
      />
      {route.page === "today" && <TodayPage progress={progress} onOpen={openSign} go={go} />}
      {route.page === "signs" && <SignsPage progress={progress} onOpen={openSign} />}
      {route.page === "learn" && (
        <LessonPage
          sign={selectedSign}
          progress={progress[selectedSign.id]}
          dominantHand={settings.dominantHand}
          setDominantHand={(dominantHand) => setSettings((current) => ({ ...current, dominantHand }))}
          onLog={logPractice}
          onOpen={openSign}
          go={go}
        />
      )}
      <BottomNav page={route.page} go={go} />
    </div>
  );
}
