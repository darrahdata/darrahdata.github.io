import { Link } from "react-router-dom";

const confidenceLabel = {
  "not-yet": "Not yet",
  "getting-it": "Getting it",
  confident: "Confident"
};

export default function ProgressDashboard({ profile, signs, progress, routines, onReset }) {
  const viewedSigns = signs.filter((sign) => sign.viewed_at);
  const practicedSigns = signs.filter((sign) => sign.practiced || sign.times_practiced > 0);
  const confidentSigns = signs.filter((sign) => sign.confidence === "confident");
  const needsPractice = signs.filter((sign) => ["not-yet", "getting-it"].includes(sign.confidence) || sign.in_daily_practice);
  const completedRoutines = Object.keys(progress.routinesCompleted || {}).length;
  const confidenceSigns = signs.filter((sign) => sign.confidence);

  return (
    <div className="page fade-in">
      <section className="page-header">
        <p className="eyebrow">Progress</p>
        <h1>Your gentle learning rhythm.</h1>
        <p className="muted">A local record of lessons viewed, signs practiced, and confidence—not a test score.</p>
      </section>

      <section className="stats-grid progress-stats">
        <article className="stat-card card"><strong>{viewedSigns.length}</strong><span>Signs viewed</span></article>
        <article className="stat-card card"><strong>{practicedSigns.length}</strong><span>Signs practiced</span></article>
        <article className="stat-card card"><strong>{confidentSigns.length}</strong><span>Marked confident</span></article>
        <article className="stat-card card"><strong>{completedRoutines}/{routines.length}</strong><span>Routines practiced</span></article>
      </section>

      <section className="card confidence-overview">
        <div className="section-heading">
          <div><p className="small-label">Confidence</p><h2>Your signs</h2></div>
          <Link className="button tiny ghost" to="/practice">Practice</Link>
        </div>
        {confidenceSigns.length ? (
          <div className="confidence-list">
            {confidenceSigns.map((sign) => (
              <Link key={sign.id} to={`/learn/${sign.id}`} className="confidence-row">
                <span><strong>{sign.word}</strong><small>{sign.times_practiced || 0} practice {sign.times_practiced === 1 ? "time" : "times"}</small></span>
                <span className={`confidence-pill ${sign.confidence}`}>{confidenceLabel[sign.confidence]}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state compact"><p>Practice a sign and choose a confidence level to see it here.</p></div>
        )}
      </section>

      <section className="card">
        <div className="section-heading">
          <div><p className="small-label">Next up</p><h2>Needs practice</h2></div>
          <strong>{needsPractice.length}</strong>
        </div>
        {needsPractice.length ? (
          <div className="practice-chip-list">
            {needsPractice.slice(0, 12).map((sign) => (
              <Link key={sign.id} to={`/learn/${sign.id}`}>{sign.word}<small>{confidenceLabel[sign.confidence] || "In practice"}</small></Link>
            ))}
          </div>
        ) : (
          <p className="muted">Nothing is marked for extra practice yet.</p>
        )}
      </section>

      <section className="card">
        <p className="small-label">Routine progress</p>
        <h2>{completedRoutines} of {routines.length} routines practiced</h2>
        <div className="routine-progress-list">
          {routines.map((routine) => (
            <div key={routine.id} className={progress.routinesCompleted?.[routine.id] ? "complete" : ""}>
              <span aria-hidden="true">{progress.routinesCompleted?.[routine.id] ? "✓" : "○"}</span>
              <span>{routine.title}</span>
            </div>
          ))}
        </div>
        <Link className="button primary" to="/routines">Open routines</Link>
      </section>

      <section className="card progress-summary">
        <h2>Saved on this device</h2>
        <div className="progress-row"><span>Practice rhythm</span><strong>{progress.streak?.current || 0} days</strong></div>
        <div className="progress-row"><span>Favorites</span><strong>{signs.filter((sign) => sign.is_favorite).length}</strong></div>
        <div className="progress-row"><span>Checklist items completed</span><strong>{signs.reduce((total, sign) => total + (sign.checklist_progress?.length || 0), 0)}</strong></div>
        <div className="progress-row"><span>Items needing verification</span><strong>{signs.filter((sign) => sign.verification_status !== "verified").length + (progress.customWords?.length || 0)}</strong></div>
      </section>

      <section className="card culture-note">
        <h2>Respectful learning note</h2>
        <p>Confidence means you feel ready to use the sign—not that the app has graded it. Revisit trusted videos and learn from Deaf educators when possible.</p>
      </section>

      <section className="card">
        <h2>Reset local data</h2>
        <p className="muted">This clears your profile and progress from this browser only.</p>
        <button className="button ghost danger" onClick={onReset}>Reset app</button>
      </section>
    </div>
  );
}
