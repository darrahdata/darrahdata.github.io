import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ConfidenceSelector from "./ConfidenceSelector.jsx";
import MirrorPractice from "./MirrorPractice.jsx";
import SignDemo from "./SignDemo.jsx";
import SignMotionPlayer from "./SignMotionPlayer.jsx";
import SignPracticeChecklist from "./SignPracticeChecklist.jsx";
import VerificationBadge from "./VerificationBadge.jsx";

const fieldLabels = [
  ["handedness", "Hands"],
  ["handshape", "Handshape"],
  ["palmOrientation", "Palm"],
  ["startLocation", "Start"],
  ["movement", "Movement"],
  ["repetition", "Repeat"],
  ["facialExpression", "Face"]
];

export default function SignDetail({ signs, onUpdateSign, onPractice }) {
  const { signId } = useParams();
  const sign = signs.find((item) => item.id === signId);

  useEffect(() => {
    if (sign && !sign.viewed_at) {
      onUpdateSign(sign.id, { viewed_at: new Date().toISOString() });
    }
  }, [sign?.id]);

  if (!sign) {
    return (
      <div className="page">
        <section className="card">
          <h1>Sign not found</h1>
          <Link to="/learn" className="button primary">Back to library</Link>
        </section>
      </div>
    );
  }

  const related = (sign.related_signs || [])
    .map((idOrWord) => signs.find((item) => item.id === idOrWord || item.word.toLowerCase() === idOrWord.toLowerCase()))
    .filter(Boolean);
  const hasDetailedLesson = Boolean(sign.steps?.length);
  const checklist = sign.checklist_progress || [];

  return (
    <div className="page sign-lesson-page fade-in">
      <Link to="/learn" className="back-link">‹ Back to Learn</Link>

      <section className="lesson-hero card">
        <div className="lesson-title-row">
          <div>
            <p className="small-label">{sign.category}</p>
            <h1>{sign.word}</h1>
          </div>
          <button
            type="button"
            className={`favorite-large ${sign.is_favorite ? "active" : ""}`}
            aria-label={sign.is_favorite ? `Remove ${sign.word} from favorites` : `Add ${sign.word} to favorites`}
            onClick={() => onUpdateSign(sign.id, { is_favorite: !sign.is_favorite })}
          >
            {sign.is_favorite ? "♥" : "♡"}
          </button>
        </div>
        <p className="lesson-summary">{sign.summary || sign.description}</p>
        <div className="badge-row">
          <span className="lesson-badge">{sign.difficulty || "Beginner"}</span>
          <VerificationBadge status={sign.verification_status} />
        </div>
        {!hasDetailedLesson && (
          <div className="needs-lesson-note">
            <strong>Written lesson coming next</strong>
            <p>Use a trusted video source for this sign. Little Signs will not guess at instructions that have not been reviewed.</p>
          </div>
        )}
      </section>

      <section className="card how-to-card">
        <p className="eyebrow">How to sign it</p>
        <div className="lesson-section-heading">
          <span>1</span>
          <div><h2>Watch</h2><p>First see the full movement, then practice one part at a time.</p></div>
        </div>
        <SignDemo sign={sign} />
        <SignMotionPlayer sign={sign} />
        <p className="micro-note">The yellow hands are simplified movement cues. Confirm handshape, placement, and rhythm with the linked demo or a Deaf educator.</p>
      </section>

      <section className="card">
        <div className="lesson-section-heading">
          <span>2</span>
          <div><h2>Set your hand</h2><p>Get the shape and starting position comfortable before moving.</p></div>
        </div>
        <dl className="hand-setup-grid">
          {fieldLabels.map(([field, label]) => (
            <div key={field}>
              <dt>{label}</dt>
              <dd>{sign[field] || "Confirm this detail in a trusted demo."}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card">
        <div className="lesson-section-heading">
          <span>3</span>
          <div><h2>Move</h2><p>Keep the motion small, visible, and relaxed.</p></div>
        </div>
        {hasDetailedLesson ? (
          <ol className="lesson-steps">
            {sign.steps.map((step, index) => (
              <li key={step}><span>{index + 1}</span><p>{step}</p></li>
            ))}
          </ol>
        ) : (
          <p>{sign.signing_instructions}</p>
        )}
      </section>

      <section className="card">
        <div className="lesson-section-heading">
          <span>4</span>
          <div><h2>Check yourself</h2><p>This is a self-check, not automatic grading.</p></div>
        </div>
        <SignPracticeChecklist
          sign={sign}
          checked={checklist}
          onChange={(next) => onUpdateSign(sign.id, { checklist_progress: next })}
        />
      </section>

      <section className="coaching-grid">
        <article className="card mistakes-card">
          <p className="small-label">Common mistakes</p>
          <ul className="mistake-list">
            {(sign.commonMistakes || ["Skipping the trusted demo", "Moving too quickly to self-check"]).map((mistake) => (
              <li key={mistake}><span aria-hidden="true">!</span>{mistake}</li>
            ))}
          </ul>
        </article>
        <article className="card parent-tip-card">
          <p className="small-label">Parent tip · {sign.teachingMoment || sign.when_to_use}</p>
          <h2>Model, pause, respond.</h2>
          <p>{sign.parentTip || sign.routine_examples?.[0] || sign.when_to_use}</p>
        </article>
      </section>

      <section className="card confidence-card">
        <ConfidenceSelector value={sign.confidence} onSelect={(confidence) => onPractice(sign.id, confidence)} />
      </section>

      <MirrorPractice sign={sign} />

      {related.length > 0 && (
        <section>
          <div className="section-heading">
            <div><p className="eyebrow">Next signs</p><h2>Related signs</h2></div>
          </div>
          <div className="related-row">
            {related.map((item) => (
              <Link key={item.id} className="related-card" to={`/learn/${item.id}`}>
                <span>{item.word}</span><small>{item.category}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="card culture-note">
        <h2>Respectful learning note</h2>
        <p>Little Signs is a parent learning companion. ASL is a full language with its own grammar, culture, and regional variation. Use videos and instruction from Deaf educators when possible.</p>
      </section>
    </div>
  );
}
