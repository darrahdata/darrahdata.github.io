import { Link } from "react-router-dom";

export default function ProgressDashboard({ profile, signs, progress, routines, onReset }) {
  const learned = signs.filter((sign) => sign.learned).length;
  const practicing = signs.filter((sign) => sign.in_daily_practice).length;
  const favorites = signs.filter((sign) => sign.is_favorite).length;
  const needsVerification = signs.filter((sign) => sign.verification_status !== "verified").length + (progress.customWords || []).length;
  const completedRoutines = Object.keys(progress.routinesCompleted || {}).length;
  const topCategories = Object.entries(
    signs.reduce((acc, sign) => {
      if (sign.is_favorite || sign.in_daily_practice || sign.learned) {
        acc[sign.category] = (acc[sign.category] || 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="page fade-in">
      <section className="page-header">
        <p className="eyebrow">Progress</p>
        <h1>Your gentle learning rhythm.</h1>
        <p className="muted">
          You are building a communication habit for {profile.babyStage === "expecting" ? "baby’s arrival" : "daily family life"}.
        </p>
      </section>

      <section className="stats-grid">
        <article className="stat-card card"><strong>{learned}</strong><span>Signs learned</span></article>
        <article className="stat-card card"><strong>{practicing}</strong><span>In practice</span></article>
        <article className="stat-card card"><strong>{progress.streak?.current || 0}</strong><span>Practice rhythm</span></article>
        <article className="stat-card card"><strong>{completedRoutines}</strong><span>Routines practiced</span></article>
      </section>

      <section className="card">
        <h2>Saved and verified</h2>
        <div className="progress-row"><span>Favorites</span><strong>{favorites}</strong></div>
        <div className="progress-row"><span>Custom words</span><strong>{progress.customWords?.length || 0}</strong></div>
        <div className="progress-row"><span>Items needing verification</span><strong>{needsVerification}</strong></div>
      </section>

      <section className="card">
        <h2>Favorite categories</h2>
        {topCategories.length ? (
          <div className="chip-grid compact-chips">
            {topCategories.map(([category, count]) => (
              <span className="chip static" key={category}>{category} · {count}</span>
            ))}
          </div>
        ) : (
          <p className="muted">Favorite or practice a few signs to see category patterns.</p>
        )}
      </section>

      <section className="card">
        <h2>Suggested next step</h2>
        <p>
          Practice one routine from start to finish, then add one new sign to daily practice.
        </p>
        <div className="button-row left">
          <Link className="button primary" to="/routines">Open routines</Link>
          <Link className="button ghost" to="/practice">Practice now</Link>
        </div>
      </section>

      <section className="card culture-note">
        <h2>Reset demo data</h2>
        <p className="muted">This clears localStorage for this browser only.</p>
        <button className="button ghost danger" onClick={onReset}>Reset app</button>
      </section>
    </div>
  );
}
