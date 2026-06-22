import { useMemo, useState } from "react";
import VerificationBadge from "./VerificationBadge.jsx";
import SignDemo from "./SignDemo.jsx";
import YellowHandCue from "./YellowHandCue.jsx";

const scenarios = [
  {
    prompt: "Your baby finished eating and you want to ask if they are finished. Which sign would you use?",
    answer: "All done",
    options: ["All done", "More", "Sleep", "Bath"]
  },
  {
    prompt: "You are about to read the same page again. Which sign fits the moment?",
    answer: "Again",
    options: ["Again", "Diaper", "Water", "Walk"]
  },
  {
    prompt: "Your child cannot open a toy and is frustrated. Which sign can you model?",
    answer: "Help",
    options: ["Help", "Church", "Apple", "Quiet"]
  },
  {
    prompt: "You are getting ready to leave for a stroller walk. Which sign fits?",
    answer: "Walk",
    options: ["Walk", "Full", "No", "Mary"]
  }
];

export default function PracticeSession({ signs, onPractice }) {
  const practiceSigns = useMemo(() => signs.slice(0, 8), [signs]);
  const [mode, setMode] = useState("flashcards");
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [scenarioResult, setScenarioResult] = useState(null);

  const sign = practiceSigns[index % practiceSigns.length];
  const scenario = scenarios[index % scenarios.length];

  const next = () => {
    setIndex((current) => current + 1);
    setShowAnswer(false);
    setScenarioResult(null);
  };

  return (
    <div className="page fade-in">
      <section className="page-header">
        <p className="eyebrow">Practice</p>
        <h1>Small reps, real-life confidence.</h1>
        <p className="muted">Choose a mode and practice without pressure.</p>
      </section>

      <div className="mode-tabs card">
        {[
          ["flashcards", "Flashcards"],
          ["watch", "Watch + repeat"],
          ["scenarios", "Real-life prompts"],
          ["listening", "Listening cues"]
        ].map(([value, label]) => (
          <button key={value} className={mode === value ? "selected" : ""} onClick={() => setMode(value)}>
            {label}
          </button>
        ))}
      </div>

      {mode === "flashcards" && (
        <section className="practice-card card">
          <p className="small-label">Flashcard {index + 1}</p>
          <h2>{showAnswer ? sign.word : "Remember the sign for..."}</h2>
          {!showAnswer && <div className="big-word">{sign.word}</div>}
          {showAnswer && (
            <>
              <YellowHandCue sign={sign} variant="practice" />
              <p>{sign.signing_instructions}</p>
              <VerificationBadge status={sign.verification_status} />
            </>
          )}
          <div className="button-row center">
            {!showAnswer ? (
              <button className="button primary" onClick={() => setShowAnswer(true)}>Show me</button>
            ) : (
              <>
                <button className="button primary" onClick={() => { onPractice(sign.id, "known"); next(); }}>I know it</button>
                <button className="button ghost" onClick={() => { onPractice(sign.id, "review"); next(); }}>Almost</button>
                <button className="button ghost" onClick={() => { onPractice(sign.id, "forgot"); next(); }}>Forgot</button>
              </>
            )}
          </div>
        </section>
      )}

      {mode === "watch" && (
        <section className="practice-card card">
          <p className="small-label">Watch and repeat</p>
          <h2>{sign.word}</h2>
          <YellowHandCue sign={sign} variant="practice" />
          <SignDemo sign={sign} compact />
          <p>Watch, try it, then repeat it three times while saying the word out loud.</p>
          <div className="button-row center">
            <button className="button primary" onClick={() => { onPractice(sign.id, "known"); next(); }}>Mark practiced</button>
            <button className="button ghost" onClick={next}>Skip</button>
          </div>
        </section>
      )}

      {mode === "scenarios" && (
        <section className="practice-card card">
          <p className="small-label">Real-life prompt</p>
          <h2>{scenario.prompt}</h2>
          <div className="option-grid">
            {scenario.options.map((option) => (
              <button
                key={option}
                className={scenarioResult === option ? (option === scenario.answer ? "correct" : "incorrect") : ""}
                onClick={() => setScenarioResult(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {scenarioResult && (
            <p className={scenarioResult === scenario.answer ? "feedback correct-text" : "feedback"}>
              {scenarioResult === scenario.answer ? "Yes. That fits the moment." : `Try ${scenario.answer}.`}
            </p>
          )}
          <div className="button-row center">
            <button className="button primary" onClick={next}>Next prompt</button>
          </div>
        </section>
      )}

      {mode === "listening" && (
        <section className="practice-card card">
          <p className="small-label">Listening cue</p>
          <h2>Imagine the app says:</h2>
          <div className="big-word">{sign.word}</div>
          <YellowHandCue sign={sign} variant="practice" />
          <p>Practice signing it three times. This mode is ready for text-to-speech later.</p>
          <div className="button-row center">
            <button className="button primary" onClick={() => { onPractice(sign.id, "known"); next(); }}>I signed it</button>
            <button className="button ghost" onClick={next}>Next word</button>
          </div>
        </section>
      )}
    </div>
  );
}
