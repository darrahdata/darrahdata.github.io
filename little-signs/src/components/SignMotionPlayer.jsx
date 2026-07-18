import { useEffect, useState } from "react";
import YellowHandCue from "./YellowHandCue.jsx";

export default function SignMotionPlayer({ sign, compact = false }) {
  const [speed, setSpeed] = useState("normal");
  const [playing, setPlaying] = useState(true);
  const [stepMode, setStepMode] = useState(false);
  const [step, setStep] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const totalSteps = Math.max(sign.steps?.length || 1, 1);
  const movementText = sign.movement || sign.signing_instructions || "Follow the written cue and compare it with a trusted demo.";
  const repetitionText = sign.repetition || "Confirm repetition in the trusted demo.";

  useEffect(() => {
    if (!playing || stepMode) return undefined;
    const timer = window.setTimeout(() => setPlaying(false), speed === "slow" ? 5200 : 3000);
    return () => window.clearTimeout(timer);
  }, [playing, speed, stepMode, replayKey]);

  const playAt = (nextSpeed) => {
    setSpeed(nextSpeed);
    setStepMode(false);
    setPlaying(true);
    setReplayKey((value) => value + 1);
  };

  const nextStep = () => {
    setStepMode(true);
    setPlaying(false);
    setStep((value) => (value + 1) % totalSteps);
  };

  return (
    <section className={`motion-player ${compact ? "compact" : ""}`} aria-label={`Motion cue for ${sign.word}`}>
      <button
        type="button"
        className={`motion-stage ${playing ? "playing" : ""} ${speed === "slow" ? "slow" : ""}`}
        onClick={() => playAt(speed)}
        aria-label={`Replay the ${sign.word} motion cue`}
      >
        <div key={replayKey} className="motion-visual">
          <YellowHandCue
            sign={sign}
            variant="practice"
            showText={!compact}
            activeFrame={stepMode ? step : null}
            animate={playing}
            speed={speed}
          />
        </div>
        <div className="motion-labels" aria-hidden="true">
          <span>Start</span><span>Move</span><span>Finish</span>
          {sign.repetition && <span>↻ Repeat</span>}
        </div>
      </button>

      {stepMode && (
        <div className="step-callout" role="status">
          <strong>Step {step + 1} of {totalSteps}</strong>
          <span>{sign.steps?.[step] || sign.movement}</span>
        </div>
      )}

      <div className="motion-controls" aria-label="Motion controls">
        <button type="button" className={speed === "slow" && !stepMode ? "selected" : ""} onClick={() => playAt("slow")}>Slow</button>
        <button type="button" className={speed === "normal" && !stepMode ? "selected" : ""} onClick={() => playAt("normal")}>Normal</button>
        <button type="button" className={stepMode ? "selected" : ""} onClick={nextStep}>Step by step</button>
        <button type="button" onClick={() => playAt(speed)}>↻ Repeat</button>
        <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause motion cue" : "Play motion cue"}>
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <p className="motion-alt">Text alternative: {movementText} {repetitionText}</p>
    </section>
  );
}
