import { useEffect, useMemo, useState } from "react";
import ConfidenceSelector from "./ConfidenceSelector.jsx";
import SignMotionPlayer from "./SignMotionPlayer.jsx";
import SignPracticeChecklist from "./SignPracticeChecklist.jsx";
import VerificationBadge from "./VerificationBadge.jsx";

const stageCopy = [
  ["Meet the sign", "Read the word and imagine the moment you would use it."],
  ["Try it first", "Give the sign a calm try from memory. There is no score."],
  ["Need help?", "Study the motion cue, then try the sign again."],
  ["Self-check", "Use the checklist to notice your shape, place, and movement."],
  ["Confidence", "Choose the honest level that feels right today."],
  ["Saved", "That practice is now part of your progress."]
];

export default function PracticeSession({ signs, onPractice, onUpdateSign }) {
  const practiceSigns = useMemo(() => {
    const detailed = signs.filter((sign) => sign.steps?.length);
    return (detailed.length ? detailed : signs).slice(0, 16);
  }, [signs]);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState(0);
  const [checked, setChecked] = useState([]);
  const sign = practiceSigns[index % practiceSigns.length];

  useEffect(() => {
    setChecked(sign?.checklist_progress || []);
  }, [sign?.id]);

  if (!sign) return <div className="page"><section className="card"><h1>No practice signs yet</h1></section></div>;

  const saveChecklist = (next) => {
    setChecked(next);
    onUpdateSign(sign.id, { checklist_progress: next });
  };

  const nextSign = () => {
    setIndex((value) => value + 1);
    setStage(0);
  };

  return (
    <div className="page guided-practice-page fade-in">
      <section className="page-header">
        <p className="eyebrow">Practice</p>
        <h1>Learn first. Then try.</h1>
        <p className="muted">A short, pressure-free lesson that saves on this device.</p>
      </section>

      <div className="practice-stage-track" aria-label="Practice lesson progress">
        {stageCopy.map(([title], stepIndex) => (
          <span key={title} className={stepIndex <= stage ? "active" : ""} aria-current={stepIndex === stage ? "step" : undefined}>
            {stepIndex + 1}
          </span>
        ))}
      </div>

      <section className="guided-practice-card card">
        <div className="practice-card-top">
          <div>
            <p className="small-label">Sign {index + 1} · Step {stage + 1} of 6</p>
            <h2>{stageCopy[stage][0]}</h2>
            <p>{stageCopy[stage][1]}</p>
          </div>
          <VerificationBadge status={sign.verification_status} />
        </div>

        {stage === 0 && (
          <div className="practice-word-panel">
            <span className="big-word">{sign.word}</span>
            <p>{sign.summary || sign.description}</p>
            <p className="teaching-moment">Try it: {sign.teachingMoment || sign.when_to_use}</p>
          </div>
        )}

        {stage === 1 && (
          <div className="try-panel">
            <span aria-hidden="true">🤲</span>
            <h3>Give {sign.word} one try.</h3>
            <p>Say the word naturally while you sign. Then choose “I tried it” or open the cue.</p>
          </div>
        )}

        {stage === 2 && <SignMotionPlayer sign={sign} />}

        {stage === 3 && (
          <SignPracticeChecklist sign={sign} checked={checked} onChange={saveChecklist} />
        )}

        {stage === 4 && (
          <ConfidenceSelector
            value={sign.confidence}
            onSelect={(confidence) => {
              onPractice(sign.id, confidence);
              setStage(5);
            }}
          />
        )}

        {stage === 5 && (
          <div className="saved-panel" role="status">
            <span aria-hidden="true">✓</span>
            <h3>{sign.word} practiced</h3>
            <p>Your checklist and confidence are saved locally. You can change them any time.</p>
          </div>
        )}

        <div className="button-row practice-actions">
          {stage > 0 && stage < 5 && <button type="button" className="button ghost" onClick={() => setStage((value) => value - 1)}>Back</button>}
          {stage === 0 && <button type="button" className="button primary" onClick={() => setStage(1)}>I’m ready to try</button>}
          {stage === 1 && (
            <>
              <button type="button" className="button ghost" onClick={() => setStage(2)}>Need help?</button>
              <button type="button" className="button primary" onClick={() => setStage(2)}>I tried it</button>
            </>
          )}
          {stage === 2 && <button type="button" className="button primary" onClick={() => setStage(3)}>I tried the motion</button>}
          {stage === 3 && <button type="button" className="button primary" onClick={() => setStage(4)}>Choose confidence</button>}
          {stage === 5 && <button type="button" className="button primary" onClick={nextSign}>Next sign</button>}
          {stage < 5 && <button type="button" className="button text-button" onClick={nextSign}>Skip for now</button>}
        </div>
      </section>
    </div>
  );
}
