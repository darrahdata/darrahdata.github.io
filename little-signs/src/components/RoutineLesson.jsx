import { useState } from "react";
import { Link } from "react-router-dom";
import YellowHandCue from "./YellowHandCue.jsx";

export default function RoutineLesson({ routines, signs, completed, onCompleteRoutine, onUpdateSign }) {
  const [selectedId, setSelectedId] = useState(routines[0]?.id);
  const selected = routines.find((routine) => routine.id === selectedId) || routines[0];
  const routineSigns = selected.signIds
    .map((idOrWord) => signs.find((sign) => sign.id === idOrWord || sign.word.toLowerCase() === idOrWord.toLowerCase()))
    .filter(Boolean);

  return (
    <div className="page fade-in">
      <section className="page-header">
        <p className="eyebrow">Routines</p>
        <h1>Learn signs inside real parent moments.</h1>
        <p className="muted">Pick a routine and practice the signs in order.</p>
      </section>

      <div className="routine-layout">
        <aside className="routine-list card">
          {routines.map((routine) => (
            <button
              key={routine.id}
              className={selected.id === routine.id ? "selected" : ""}
              onClick={() => setSelectedId(routine.id)}
            >
              <span>{routine.icon}</span>
              <span>{routine.title}</span>
              {completed[routine.id] && <small>Done</small>}
            </button>
          ))}
        </aside>

        <section className="routine-detail card">
          <div className="routine-title">
            <span>{selected.icon}</span>
            <div>
              <p className="small-label">Routine lesson</p>
              <h2>{selected.title}</h2>
            </div>
          </div>
          <p>{selected.summary}</p>
          <div className="use-today-box">
            <strong>Use this today</strong>
            <p>{selected.useToday}</p>
          </div>

          <h3>Signs in this routine</h3>
          <div className="routine-signs">
            {routineSigns.map((sign) => (
              <div key={sign.id} className="routine-sign-card">
                <YellowHandCue sign={sign} variant="thumb" showText={false} />
                <Link to={`/learn/${sign.id}`}>{sign.word}</Link>
                <button
                  className="button tiny"
                  onClick={() => onUpdateSign(sign.id, { in_daily_practice: true })}
                >
                  Practice
                </button>
              </div>
            ))}
          </div>

          <h3>Example phrases</h3>
          <ul className="check-list">
            {selected.examplePhrases.map((phrase) => (
              <li key={phrase}>{phrase}</li>
            ))}
          </ul>

          <button className="button primary" onClick={() => onCompleteRoutine(selected.id)}>
            Mark routine practiced
          </button>
        </section>
      </div>
    </div>
  );
}
