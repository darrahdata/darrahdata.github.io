import { useMemo, useState } from "react";
import { categories } from "../data/signs.js";
import CustomWordForm from "./CustomWordForm.jsx";
import SignCard from "./SignCard.jsx";
import VerificationBadge from "./VerificationBadge.jsx";

export default function LearnLibrary({ signs, customWords, onUpdateSign, onAddCustomWord }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [showCustomForm, setShowCustomForm] = useState(false);

  const filteredSigns = useMemo(() => {
    return signs.filter((sign) => {
      const matchesQuery = [sign.word, sign.category, sign.description]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory = category === "All" || sign.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [signs, query, category]);

  return (
    <div className="page fade-in">
      <section className="page-header">
        <p className="eyebrow">Learn</p>
        <h1>Build your parent vocabulary.</h1>
        <p className="muted">
          Search signs, save favorites, and add words you want to verify later with trusted ASL sources.
        </p>
      </section>

      <div className="toolbar card">
        <label className="field search-field">
          Search signs
          <input
            value={query}
            placeholder="Try milk, prayer, book, wait"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="field">
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>All</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="button-row left">
        <button className="button primary" onClick={() => setShowCustomForm(!showCustomForm)}>
          {showCustomForm ? "Close custom word" : "Add custom word"}
        </button>
      </div>

      {showCustomForm && (
        <CustomWordForm
          onAdd={(word) => {
            onAddCustomWord(word);
            setShowCustomForm(false);
          }}
        />
      )}

      {customWords.length > 0 && (
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Personal list</p>
              <h2>Words I want to learn</h2>
            </div>
          </div>
          <div className="grid-list">
            {customWords.map((word) => (
              <article key={word.id} className="sign-card custom-word">
                <p className="small-label">{word.category || "Custom"}</p>
                <h3>{word.word}</h3>
                <p>{word.reason || "Saved for later verification."}</p>
                {word.notes && <p className="muted">Notes: {word.notes}</p>}
                {word.videoLink && (
                  <a href={word.videoLink} target="_blank" rel="noreferrer">
                    Open video source
                  </a>
                )}
                <VerificationBadge status="needs video source" />
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Library</p>
            <h2>{filteredSigns.length} signs</h2>
          </div>
        </div>
        <div className="grid-list">
          {filteredSigns.map((sign) => (
            <SignCard key={sign.id} sign={sign} onUpdateSign={onUpdateSign} />
          ))}
        </div>
      </section>
    </div>
  );
}
