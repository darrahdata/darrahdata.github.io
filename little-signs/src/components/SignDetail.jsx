import { Link, useParams } from "react-router-dom";
import VerificationBadge from "./VerificationBadge.jsx";
import SignDemo from "./SignDemo.jsx";
import YellowHandCue from "./YellowHandCue.jsx";

export default function SignDetail({ signs, onUpdateSign, onPractice }) {
  const { signId } = useParams();
  const sign = signs.find((item) => item.id === signId);

  if (!sign) {
    return (
      <div className="page">
        <section className="card">
          <h1>Sign not found</h1>
          <Link to="/learn" className="button primary">
            Back to library
          </Link>
        </section>
      </div>
    );
  }

  const related = sign.related_signs
    .map((idOrWord) => signs.find((item) => item.id === idOrWord || item.word.toLowerCase() === idOrWord.toLowerCase()))
    .filter(Boolean);

  return (
    <div className="page fade-in">
      <Link to="/learn" className="back-link">‹ Back to Learn</Link>

      <section className="lesson-hero card">
        <p className="small-label">{sign.category}</p>
        <h1>{sign.word}</h1>
        <p>{sign.description}</p>
        <VerificationBadge status={sign.verification_status} />
        <div className="button-row left">
          <button
            className="button primary"
            onClick={() => onUpdateSign(sign.id, { in_daily_practice: !sign.in_daily_practice })}
          >
            {sign.in_daily_practice ? "Remove from practice" : "Add to daily practice"}
          </button>
          <button
            className="button ghost"
            onClick={() => onUpdateSign(sign.id, { learned: !sign.learned })}
          >
            {sign.learned ? "Marked learned" : "I know this"}
          </button>
        </div>
      </section>

      <section className="memory-card card">
        <p className="small-label">Visual memory cue</p>
        <YellowHandCue sign={sign} variant="lesson" />
        <p className="micro-note">These friendly yellow hands are simplified memory cues, not a substitute for a verified ASL video or Deaf instructor.</p>
      </section>

      <section className="video-card card">
        <p className="small-label">Watch a real sign demo</p>
        <SignDemo sign={sign} />
      </section>

      <section className="detail-grid">
        <article className="card">
          <p className="small-label">Why it matters</p>
          <p>{sign.why_it_matters}</p>
        </article>
        <article className="card">
          <p className="small-label">When to use it</p>
          <p>{sign.when_to_use}</p>
        </article>
        <article className="card wide">
          <p className="small-label">Signing notes</p>
          <p>{sign.signing_instructions}</p>
        </article>
      </section>

      <section className="card practice-prompt">
        <p className="small-label">Mirror practice</p>
        <h2>{sign.example_phrase}</h2>
        <p>Try the sign three times while saying the word out loud. Keep your face warm and expressive.</p>
        <div className="button-row left">
          <button className="button primary" onClick={() => onPractice(sign.id, "known")}>I remembered it</button>
          <button className="button ghost" onClick={() => onPractice(sign.id, "review")}>I almost know it</button>
          <button className="button ghost" onClick={() => onPractice(sign.id, "forgot")}>Show me again later</button>
        </div>
      </section>

      <section className="card">
        <p className="small-label">Routine examples</p>
        <ul className="check-list">
          {sign.routine_examples.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Next signs</p>
              <h2>Related signs</h2>
            </div>
          </div>
          <div className="related-row">
            {related.map((item) => (
              <Link key={item.id} className="related-card" to={`/learn/${item.id}`}>
                <span>{item.word}</span>
                <small>{item.category}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="card culture-note">
        <h2>Respectful learning note</h2>
        <p>
          This app supports early communication and beginner ASL learning. ASL is a full language
          with its own grammar, culture, and regional variation. For the most accurate learning,
          use trusted ASL resources and learn from Deaf educators when possible.
        </p>
      </section>
    </div>
  );
}
