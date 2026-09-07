import { Link } from "react-router-dom";
import SignCard from "./SignCard.jsx";
import YellowHandCue from "./YellowHandCue.jsx";

function formatDate(value) {
  if (!value) return "Before baby arrives";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export default function TodayScreen({ profile, signs, routines, onUpdateSign }) {
  const todaySigns = signs.slice(0, 5);
  const selectedRoutine = routines.find((routine) => profile.routines?.includes(routine.title)) || routines[1];

  return (
    <div className="page fade-in">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Today</p>
          <h1>A few signs for real parent moments.</h1>
          <p>
            Practice for {profile.goalMinutes} minutes today. Your plan is tuned for {profile.babyStage}.
          </p>
          {profile.dueDate && <p className="soft-pill">Due date: {formatDate(profile.dueDate)}</p>}
        </div>
        <div className="hero-hand-strip" aria-label="Today sign previews">
          {todaySigns.slice(0, 3).map((sign) => (
            <Link key={sign.id} to={`/learn/${sign.id}`} className="hero-hand-link">
              <YellowHandCue sign={sign} variant="thumb" showText={false} />
              <span>{sign.word}</span>
            </Link>
          ))}
        </div>
        <Link to="/practice" className="button primary hero-button">
          Practice now
        </Link>
      </section>

      <section className="coach-card card">
        <div className="coach-icon">🤍</div>
        <div>
          <p className="small-label">Use this today</p>
          <h2>{selectedRoutine.title}</h2>
          <p>{selectedRoutine.useToday}</p>
        </div>
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">Your signs</p>
          <h2>Today’s 5 signs</h2>
        </div>
        <Link to="/learn">View all</Link>
      </section>

      <div className="grid-list">
        {todaySigns.map((sign) => (
          <SignCard key={sign.id} sign={sign} onUpdateSign={onUpdateSign} compact />
        ))}
      </div>

      <section className="card note-card">
        <h2>Gentle tip</h2>
        <p>
          Pick one routine and repeat the same sign every time it happens. Babies learn from rhythm,
          repetition, facial expression, and warm connection.
        </p>
      </section>
    </div>
  );
}
