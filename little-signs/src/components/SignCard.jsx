import { Link } from "react-router-dom";
import VerificationBadge from "./VerificationBadge.jsx";
import YellowHandCue from "./YellowHandCue.jsx";

export default function SignCard({ sign, onUpdateSign, compact = false }) {
  const badges = [
    sign.difficulty === "beginner" ? "Beginner" : sign.difficulty,
    ...(sign.learningTags || []).filter((tag) => ["Good first sign", "Two-hand sign", "Uses face"].includes(tag)),
    sign.confidence === "confident" ? "Confident" : null
  ].filter(Boolean).slice(0, 4);

  return (
    <article className={`sign-card ${compact ? "compact" : ""}`}>
      <YellowHandCue sign={sign} variant="thumb" showText={false} />
      <div className="sign-card-header">
        <div>
          <p className="small-label">{sign.category}</p>
          <h3>{sign.word}</h3>
        </div>
        <button
          className={`icon-button ${sign.is_favorite ? "active" : ""}`}
          aria-label={sign.is_favorite ? "Remove favorite" : "Add favorite"}
          onClick={() => onUpdateSign(sign.id, { is_favorite: !sign.is_favorite })}
        >
          {sign.is_favorite ? "♥" : "♡"}
        </button>
      </div>
      <p>{sign.description}</p>
      {badges.length > 0 && (
        <div className="mini-badge-row" aria-label={`Learning details for ${sign.word}`}>
          {badges.map((badge) => <span key={badge}>{badge}</span>)}
        </div>
      )}
      <VerificationBadge status={sign.verification_status} />
      {sign.source_links?.length > 0 && <p className="source-count">{sign.source_links.length} demo sources</p>}
      <div className="card-actions">
        <Link className="button small" to={`/learn/${sign.id}`}>
          Open lesson
        </Link>
        <button
          className="button small ghost"
          onClick={() => onUpdateSign(sign.id, { in_daily_practice: !sign.in_daily_practice })}
        >
          {sign.in_daily_practice ? "In practice" : "Add practice"}
        </button>
      </div>
    </article>
  );
}
