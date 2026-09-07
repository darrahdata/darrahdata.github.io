import { useEffect, useRef, useState } from "react";
import { signs } from "../data/signs.js";
import MirrorPractice from "./MirrorPractice.jsx";
import SignDemo from "./SignDemo.jsx";

const steps = [
  { id: "watch", label: "Watch", short: "See the movement" },
  { id: "copy", label: "Copy", short: "Try it yourself" },
  { id: "use", label: "Use", short: "Put it in the moment" }
];

const relatedSigns = {
  milk: "more",
  more: "all-done",
  "all-done": "eat",
  eat: "drink",
  drink: "all-done",
  diaper: "all-done",
  sleep: "dad",
  mom: "dad",
  dad: "mom",
  up: "help",
  help: "hurt",
  hurt: "help"
};

function formatCount(count) {
  if (!count) return "Not modeled yet";
  return `${count} ${count === 1 ? "time" : "times"} modeled`;
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

export default function GuidedLessonPage({
  sign,
  saved, onToggleSaved,
  progress,
  dominantHand,
  setDominantHand,
  learnMore,
  setLearnMore,
  onLog,
  onPractice,
  onReview,
  onOpen,
  go
}) {
  const flowRef = useRef(null);
  const previousStep = useRef(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [logged, setLogged] = useState(false);
  const [checked, setChecked] = useState({});
  const [practiced, setPracticed] = useState(false);

  useEffect(() => {
    setStepIndex(0);
    setLogged(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [sign.id]);

  useEffect(() => {
    if (previousStep.current !== stepIndex) {
      flowRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      const heading = flowRef.current?.querySelector(".flow-heading h2");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }
    previousStep.current = stepIndex;
  }, [stepIndex]);

  const nextSign = signs.find((item) => item.id === relatedSigns[sign.id]) || signs.find(item => item.group === sign.group && item.id !== sign.id) || signs[0];

  const logPractice = () => {
    if (!logged) onLog(sign.id);
    setLogged(true);
  };

  return (
    <main tabIndex={-1} id="main-content" className="page-shell lesson-page guided-lesson-page">
      <div className="lesson-topline">
        <button type="button" className="back-button" onClick={() => go("signs")}>← Sign library</button>
        <button type="button" className={`learn-toggle ${learnMore ? "active" : ""}`} aria-pressed={learnMore} onClick={() => setLearnMore(!learnMore)}>
          <span>{learnMore ? "Learn mode" : "Quick mode"}</span>
          <small>{learnMore ? "Details shown" : "30–60 seconds"}</small>
        </button>
      </div>

      <section className="lesson-title lesson-title-simple">
        <div>
          <p className="eyebrow">{sign.stageLabel} · {sign.routine}</p>
          <h1>{sign.word}</h1>
          <p>One sign. Three small steps. Learn at your own pace.</p>
        </div>
        <div className="lesson-meta"><button className="button quiet" type="button" aria-pressed={saved} onClick={onToggleSaved}>{saved ? "♥ Saved" : "♡ Save sign"}</button>
          <span>{sign.hands === "one" ? "One hand" : "Two hands"}</span>
          <span>{sign.repetitions}</span>
        </div>
      </section>

      <section ref={flowRef} className="lesson-flow card" aria-label={`${sign.word} guided lesson`}>
        <nav className="lesson-stepper" aria-label="Lesson steps">
          {steps.map((step, index) => (
            <button
              type="button"
              className={stepIndex === index ? "active" : stepIndex > index ? "complete" : ""}
              aria-current={stepIndex === index ? "step" : undefined}
              onClick={() => setStepIndex(index)}
              key={step.id}
            >
              <span>{stepIndex > index ? "✓" : index + 1}</span>
              <strong>{step.label}</strong>
              <small>{step.short}</small>
            </button>
          ))}
        </nav>

        {stepIndex === 0 && (
          <section className="flow-panel watch-panel" aria-labelledby={`watch-heading-${sign.id}`}>
            <div className="flow-heading">
              <span>01</span>
              <div><p className="eyebrow">First, just watch</p><h2 id={`watch-heading-${sign.id}`}>Notice the whole movement.</h2><p>Watch once without copying. Then replay and follow along.</p></div>
            </div>
            <SignDemo key={sign.id} sign={sign} dominantHand={dominantHand} />
            <div className="hand-breakdown"><article><span>01 · {sign.hands === "one" ? `Your ${dominantHand} hand` : sign.id === "help" ? "Your top hand" : "Set up your hands"}</span><p>{sign.handGuide[0]}</p></article><article><span>02 · {sign.hands === "one" ? "Your other hand" : sign.id === "help" ? "Your supporting hand" : "Follow the movement"}</span><p>{sign.handGuide[1]}</p></article></div>
            <p className="lesson-source"><a href={sign.source.url} target="_blank" rel="noreferrer">See the source for {sign.word} ↗</a></p>
            <div className="flow-footer">
              <p><strong>Look for:</strong> {sign.cue.summary}</p>
              <button type="button" className="button primary" onClick={() => setStepIndex(1)}>Now copy it →</button>
            </div>
          </section>
        )}

        {stepIndex === 1 && (
          <section className="flow-panel copy-panel" aria-labelledby={`copy-heading-${sign.id}`}>
            <div className="flow-heading">
              <span>02</span>
              <div><p className="eyebrow">Your turn</p><h2 id={`copy-heading-${sign.id}`}>Match these three cues.</h2><p>Approximate is fine. Tiny Signs helps you compare; it cannot certify a sign.</p></div>
            </div>
            <div className="copy-layout">
              <div className="copy-reference"><SignDemo sign={sign} dominantHand={dominantHand} compact /></div>
              <div className="copy-cues">
                <article><span aria-hidden="true">1</span><div><strong>Hand & palm</strong><p>{sign.shape} {sign.palm}.</p></div></article>
                <article><span aria-hidden="true">2</span><div><strong>Where it goes</strong><p>{sign.place}.</p></div></article>
                <article><span aria-hidden="true">3</span><div><strong>How it moves</strong><p>{sign.move}</p></div></article>
                {sign.hands === "one" && (
                  <div className="copy-handedness">
                    <span><strong>Your signing hand</strong><small>Use the same dominant hand consistently.</small></span>
                    <div className="segmented-control">
                      <button type="button" className={dominantHand === "right" ? "selected" : ""} aria-pressed={dominantHand === "right"} onClick={() => setDominantHand("right")}>Right</button>
                      <button type="button" className={dominantHand === "left" ? "selected" : ""} aria-pressed={dominantHand === "left"} onClick={() => setDominantHand("left")}>Left</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <section className="self-check"><h3>How did that feel?</h3><p>Check these yourself as you practice. Your camera does not grade your signing.</p>
              {sign.checks.map(check => <label key={check.id}><input type="checkbox" checked={!!checked[check.id]} onChange={e => setChecked(current => ({ ...current, [check.id]: e.target.checked }))} /><span>{check.prompt}</span></label>)}
              <p role="status" className="check-feedback">{sign.checks.every(check => checked[check.id]) ? "You’ve checked all four cues. Try it once more without looking." : `${sign.checks.filter(check => checked[check.id]).length} of 4 cues checked. Take your time.`}</p>
            </section>
            <MirrorPractice sign={sign} />
            <div className="flow-footer">
              <button type="button" className="button quiet" onClick={() => setStepIndex(0)}>← Watch again</button>
              <button type="button" className="button primary" onClick={() => { if (!practiced) { onPractice(sign.id); setPracticed(true); } setStepIndex(2); }}>I practiced it →</button>
            </div>
          </section>
        )}

        {stepIndex === 2 && (
          <section className="flow-panel use-panel" aria-labelledby={`use-heading-${sign.id}`}>
            <div className="flow-heading">
              <span>03</span>
              <div><p className="eyebrow">Bring it into real life</p><h2 id={`use-heading-${sign.id}`}>Use {sign.word} in this moment.</h2><p>No quiz. No perfect performance. Just a calm, consistent cue.</p></div>
            </div>
            <div className="practice-success" role="status">{practiced ? "✓ Practice saved. You’re building your own vocabulary." : "Practice this yourself first, or use it during a routine with your baby."}</div>
            <p className="before-baby-note"><strong>Baby hasn’t arrived yet?</strong> Say the word and rehearse the moment. You can finish here—save “I modeled this” for when you actually sign with your baby.</p>
            <div className="use-sequence">
              <article><span>Say</span><div><strong>“{sign.word}.”</strong><p>Use your normal voice and keep talking to your baby.</p></div></article>
              <article><span>Sign</span><div><strong>{sign.repetitions}</strong><p>Make the sign once or twice where your baby can naturally see it.</p></div></article>
              <article><span>Do</span><div><strong>Follow through immediately</strong><p>{sign.teachingMoment}</p></div></article>
            </div>
            {sign.careNote && <div className="care-banner"><span aria-hidden="true">♡</span><p><strong>Keep in mind</strong>{sign.careNote}</p></div>}
            <div className="use-complete">
              <div><p className="eyebrow">Your progress</p><strong>{logged ? "Saved this moment." : formatCount(progress?.count || 0)}</strong><small>Counts are for signs you use with your baby.</small></div>
              <button type="button" className="button primary" disabled={logged} onClick={logPractice}>{logged ? "Modeled ✓" : "I modeled this"}</button>
            </div>
            <button type="button" className="button primary recall-after-lesson" onClick={onReview}>Try it from memory →</button>
            <div className="flow-footer use-footer">
              <button type="button" className="button quiet" onClick={() => setStepIndex(1)}>← Copy again</button>
              <button type="button" className="button secondary" onClick={() => onOpen(nextSign.id)}>Next for this routine: {nextSign.word} →</button>
            </div>
          </section>
        )}

        {learnMore && (
          <section className="deep-dive" aria-labelledby={`deep-heading-${sign.id}`}>
            <div className="section-heading"><div><p className="eyebrow">Learn mode</p><h2 id={`deep-heading-${sign.id}`}>Why the sign looks this way</h2></div><span>Optional detail</span></div>
            <div className="technique-grid">
              <TechniqueCard number="01" title="Shape">{sign.shape}</TechniqueCard>
              <TechniqueCard number="02" title="Place">{sign.place}</TechniqueCard>
              <TechniqueCard number="03" title="Move">{sign.move}</TechniqueCard>
            </div>
            <div className="deep-notes">
              <div className="palm-note"><span aria-hidden="true">↗</span><p><strong>Palm direction:</strong> {sign.palm}</p></div>
              <div className="mistake-callout"><span aria-hidden="true">!</span><p><strong>Common mix-up:</strong> {sign.commonMistake}</p></div>
              <div className="baby-attempt-note"><span aria-hidden="true">♡</span><p><strong>Baby’s version counts.</strong>A first attempt may be smaller, looser, or one-handed. Respond warmly and model the adult form again.</p></div>
            </div>
          </section>
        )}
      </section>

      <footer className="lesson-reassurance"><strong>Never wait for a sign before meeting your baby’s need.</strong><span>Keep talking, reading, and responding to natural cues.</span></footer>
    </main>
  );
}
