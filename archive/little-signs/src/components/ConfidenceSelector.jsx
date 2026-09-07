const options = [
  { value: "not-yet", label: "Not yet", icon: "○" },
  { value: "getting-it", label: "Getting it", icon: "◐" },
  { value: "confident", label: "Confident", icon: "●" }
];

export default function ConfidenceSelector({ value, onSelect, title = "How confident do you feel doing this sign?" }) {
  return (
    <div className="confidence-selector">
      <h3>{title}</h3>
      <div className="confidence-options" role="group" aria-label={title}>
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={value === option.value ? "selected" : ""}
            aria-pressed={value === option.value}
            onClick={() => onSelect(option.value)}
          >
            <span aria-hidden="true">{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>
      {value && <p className="saved-note" role="status">Saved on this device.</p>}
    </div>
  );
}
