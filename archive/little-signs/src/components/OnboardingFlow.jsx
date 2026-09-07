import { useState } from "react";
import { useNavigate } from "react-router-dom";

const interests = [
  "Church and faith",
  "Healthy eating",
  "Reading",
  "Podcasts and listening",
  "Workout and movement",
  "Chess and thinking",
  "Family routines",
  "Sleep",
  "Comfort",
  "Emotions and comfort",
  "Meals",
  "Playtime",
  "Outdoors"
];

const routines = [
  "Morning routine",
  "Meal time",
  "Bath time",
  "Bedtime",
  "Reading together",
  "Going to church",
  "Saying prayers",
  "Going for a walk",
  "Playtime",
  "Calming down",
  "Diaper change"
];

function toggle(list, item) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    babyStage: "expecting",
    dueDate: "",
    childAge: "",
    goalMinutes: 5,
    learningMode: "both",
    interests: ["Church and faith", "Healthy eating", "Reading"],
    routines: ["Meal time", "Bedtime", "Reading together"]
  });
  const navigate = useNavigate();

  const finish = () => {
    onComplete({ ...profile, createdAt: new Date().toISOString() });
    navigate("/today", { replace: true });
  };

  return (
    <section className="onboarding card fade-in">
      <div className="eyebrow">Little Signs</div>
      <h1>Build a loving sign habit before baby arrives.</h1>
      <p className="muted">
        A few minutes a day can help you prepare for real moments like feeding,
        bedtime, prayer, reading, and comfort.
      </p>

      <div className="progress-dots" aria-label={`Onboarding step ${step + 1} of 4`}>
        {[0, 1, 2, 3].map((dot) => (
          <span key={dot} className={dot <= step ? "dot active" : "dot"} />
        ))}
      </div>

      {step === 0 && (
        <div className="stack">
          <h2>Where are you starting?</h2>
          <div className="segmented">
            {[
              ["expecting", "Expecting"],
              ["baby", "Baby"],
              ["toddler", "Toddler"]
            ].map(([value, label]) => (
              <button
                key={value}
                className={profile.babyStage === value ? "selected" : ""}
                onClick={() => setProfile({ ...profile, babyStage: value })}
              >
                {label}
              </button>
            ))}
          </div>
          {profile.babyStage === "expecting" ? (
            <label className="field">
              Due date optional
              <input
                type="date"
                value={profile.dueDate}
                onChange={(event) => setProfile({ ...profile, dueDate: event.target.value })}
              />
            </label>
          ) : (
            <label className="field">
              Child age optional
              <input
                placeholder="Example: 8 months"
                value={profile.childAge}
                onChange={(event) => setProfile({ ...profile, childAge: event.target.value })}
              />
            </label>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="stack">
          <h2>Your daily rhythm</h2>
          <p className="muted">Choose a gentle practice goal.</p>
          <div className="goal-grid">
            {[3, 5, 10].map((minutes) => (
              <button
                key={minutes}
                className={`goal-card ${profile.goalMinutes === minutes ? "selected" : ""}`}
                onClick={() => setProfile({ ...profile, goalMinutes: minutes })}
              >
                <strong>{minutes}</strong>
                <span>minutes</span>
              </button>
            ))}
          </div>
          <div className="segmented">
            {[
              ["baby", "Baby signs"],
              ["asl", "Beginner ASL"],
              ["both", "Both"]
            ].map(([value, label]) => (
              <button
                key={value}
                className={profile.learningMode === value ? "selected" : ""}
                onClick={() => setProfile({ ...profile, learningMode: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="stack">
          <h2>What feels personal?</h2>
          <p className="muted">These help personalize your learning plan.</p>
          <div className="chip-grid">
            {interests.map((interest) => (
              <button
                key={interest}
                className={profile.interests.includes(interest) ? "chip selected" : "chip"}
                onClick={() => setProfile({ ...profile, interests: toggle(profile.interests, interest) })}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="stack">
          <h2>Which routines should we coach?</h2>
          <p className="muted">Pick the moments you want signs to fit into naturally.</p>
          <div className="chip-grid">
            {routines.map((routine) => (
              <button
                key={routine}
                className={profile.routines.includes(routine) ? "chip selected" : "chip"}
                onClick={() => setProfile({ ...profile, routines: toggle(profile.routines, routine) })}
              >
                {routine}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="button-row">
        {step > 0 && (
          <button className="button ghost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button className="button primary" onClick={() => setStep(step + 1)}>
            Continue
          </button>
        ) : (
          <button className="button primary" onClick={finish}>
            Create my plan
          </button>
        )}
      </div>
    </section>
  );
}
