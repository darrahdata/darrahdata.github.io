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
        <p className="muted">See what to say, what to sign, and how to repeat it without pressure.</p>
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
            <strong>When to use this routine</strong>
            <p>{selected.useToday}</p>
          </div>

          <h3>A natural practice loop</h3>
          <div className="routine-coaching-list">
            {routineSigns.slice(0, 4).map((sign, index) => (
              <article key={sign.id} className="routine-coaching-step">
                <span className="routine-step-number">{index + 1}</span>
                <div>
                  <p><strong>Parent says:</strong> “{selected.examplePhrases[index] || sign.example_phrase || sign.word}”</p>
                  <p><strong>Parent signs:</strong> <Link to={`/learn/${sign.id}`}>{sign.word}</Link></p>
                  <p className="muted"><strong>Repeat naturally:</strong> {sign.parentTip || sign.routine_examples?.[0] || "Use the sign once during the moment, then respond warmly."}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="routine-gentle-note">Model the signs as part of warm conversation. Your child does not need to copy before receiving food, comfort, help, or attention.</p>

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

          <h3>More phrases to say aloud</h3>
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
