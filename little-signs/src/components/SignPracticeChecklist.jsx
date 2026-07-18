export default function SignPracticeChecklist({ sign, checked = [], onChange, compact = false }) {
  const items = sign.selfCheck || [
    "My hand is in the right shape.",
    "My palm faces the right way.",
    "I start in the right place.",
    "I move in the right direction.",
    "I repeat the movement correctly.",
    "My face and body feel relaxed."
  ];

  const toggle = (index) => {
    const next = checked.includes(index)
      ? checked.filter((item) => item !== index)
      : [...checked, index].sort((a, b) => a - b);
    onChange(next);
  };

  return (
    <div className={`practice-checklist ${compact ? "compact" : ""}`}>
      <div className="checklist-progress" aria-live="polite">
        <strong>{checked.length} of {items.length}</strong>
        <span>self-checks complete</span>
      </div>
      <div className="checklist-items">
        {items.map((item, index) => (
          <label key={item} className={checked.includes(index) ? "checked" : ""}>
            <input type="checkbox" checked={checked.includes(index)} onChange={() => toggle(index)} />
            <span className="check-mark" aria-hidden="true">{checked.includes(index) ? "✓" : ""}</span>
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
