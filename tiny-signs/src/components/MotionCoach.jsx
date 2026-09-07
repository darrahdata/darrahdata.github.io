import { useEffect, useMemo, useState } from "react";

const glyphs = {
  open: "🖐️",
  c: "C",
  fist: "✊",
  pinch: "🤌",
  point: "☝️",
  cup: "🫱",
  flat: "✋",
  support: "👍",
  twoOpen: "🖐️  🖐️",
  twoPinch: "🤌  🤌",
  twoPoint: "👉  👈",
  "two-open": "🖐️  🖐️",
  "two-pinch": "🤌  🤌",
  "two-point": "👉  👈",
  "two-three": "3   3",
  "a-on-flat": "👍\n🫴",
  diaper: "🤌  🤌",
  help: "👍\n🫴"
};

const motionClasses = {
  "down-close": "down",
  pinch: "tap",
  turn: "flip",
  "touch-chin": "touch",
  "touch-forehead": "touch"
};

export default function MotionCoach({ sign, dominantHand = "right", compact = false }) {
  const [speed, setSpeed] = useState("slow");
  const [playing, setPlaying] = useState(true);
  const [step, setStep] = useState(null);
  const [replay, setReplay] = useState(0);
  const [mirrored, setMirrored] = useState(true);
  const frames = sign.cue?.frames || [];
  const visibleFrames = step === null ? frames : [frames[step]];
  const duration = speed === "slow" ? 5.4 : 3.1;

  useEffect(() => {
    setPlaying(true);
    setStep(null);
    setReplay((value) => value + 1);
  }, [sign.id]);

  const stageStyle = useMemo(() => ({ "--motion-duration": `${duration}s` }), [duration]);

  const play = (nextSpeed = speed) => {
    setSpeed(nextSpeed);
    setStep(null);
    setPlaying(true);
    setReplay((value) => value + 1);
  };

  const nextStep = () => {
    setPlaying(false);
    setStep((value) => (value === null ? 0 : (value + 1) % frames.length));
  };

  return (
    <section className={`motion-coach ${compact ? "is-compact" : ""}`} aria-labelledby={`motion-heading-${sign.id}-${compact ? "compact" : "full"}`}>
      <div className="motion-heading-row">
        <div>
          <p className="eyebrow">Illustrated guide</p>
          <h2 id={`motion-heading-${sign.id}-${compact ? "compact" : "full"}`}>{compact ? `Copy ${sign.word}` : "Watch the movement"}</h2>
        </div>
        <button
          type="button"
          className="view-toggle"
          aria-pressed={mirrored}
          onClick={() => setMirrored((value) => !value)}
        >
          {mirrored ? "Copy view" : "Instructor view"}
        </button>
      </div>

      <div
        key={`${sign.id}-${replay}`}
        className={`motion-stage ${playing ? "is-playing" : ""} ${mirrored ? "is-mirrored" : ""} ${dominantHand === "left" && sign.hands === "one" ? "is-left-handed" : ""}`}
        style={stageStyle}
        aria-label={`${sign.word} motion map for ${dominantHand}-handed practice. ${sign.move}`}
      >
        <div className="motion-path" aria-hidden="true">
          <span>start</span><i></i><span>move</span><i></i><span>finish</span>
        </div>
        <div className="motion-frames" style={{ "--frame-count": visibleFrames.length }}>
          {visibleFrames.map((frame, index) => (
            <div className="motion-frame" key={`${frame.label}-${index}`}>
              <div className="hand-orientation" aria-hidden="true">
                <div className={`hand-glyph shape-${frame.shape || frame.glyph || "open"} motion-${motionClasses[frame.motion] || frame.motion || "hold"}`}>
                  {(glyphs[frame.glyph || frame.shape] || frame.glyph || "🖐️").split("\n").map((line) => <span key={line}>{line}</span>)}
                </div>
              </div>
              <strong>{frame.label}</strong>
              <small>{frame.note || sign.cue.summary}</small>
            </div>
          ))}
        </div>
      </div>

      {step !== null && (
        <p className="step-status" role="status">
          Step {step + 1} of {frames.length}: {frames[step].note || frames[step].label}
        </p>
      )}

      <div className="motion-controls" aria-label="Motion controls">
        <button className={speed === "slow" && step === null ? "selected" : ""} aria-pressed={speed === "slow" && step === null} type="button" onClick={() => play("slow")}>Slow</button>
        {!compact && <button className={speed === "normal" && step === null ? "selected" : ""} aria-pressed={speed === "normal" && step === null} type="button" onClick={() => play("normal")}>Normal</button>}
        <button className={step !== null ? "selected" : ""} aria-pressed={step !== null} type="button" onClick={nextStep}>Step</button>
        <button type="button" onClick={() => play(speed)}>Replay</button>
        {!compact && <button type="button" aria-pressed={!playing} onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Play"}</button>}
      </div>

      <p className="motion-disclaimer">
        This diagram is a memory map, not the teaching authority. Use the linked real demonstration for exact timing, contact, and natural movement.
      </p>
    </section>
  );
}
