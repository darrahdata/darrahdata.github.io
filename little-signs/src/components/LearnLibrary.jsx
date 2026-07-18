import { useMemo, useState } from "react";
import { categories } from "../data/signs.js";
import CustomWordForm from "./CustomWordForm.jsx";
import SignCard from "./SignCard.jsx";
import VerificationBadge from "./VerificationBadge.jsx";

const learningFilters = ["All signs", "Good first signs", "Feeding", "Sleep", "Feelings", "Play", "Faith", "Routines", "Confident", "Needs practice"];

function matchesLearningFilter(sign, filter) {
  if (filter === "All signs") return true;
  if (filter === "Confident") return sign.confidence === "confident";
  if (filter === "Needs practice") return ["not-yet", "getting-it"].includes(sign.confidence) || sign.in_daily_practice;
  if (filter === "Good first signs") return sign.learningTags?.includes("Good first sign");
  if (filter === "Faith") return sign.category === "Faith and church" || sign.learningTags?.includes("Faith");
  return sign.learningTags?.includes(filter) || sign.category.toLowerCase().includes(filter.toLowerCase());
}

export default function LearnLibrary({ signs, customWords, onUpdateSign, onAddCustomWord }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [learningFilter, setLearningFilter] = useState("All signs");
  const [showCustomForm, setShowCustomForm] = useState(false);

  const filteredSigns = useMemo(() => signs.filter((sign) => {
    const matchesQuery = [sign.word, sign.category, sign.description, ...(sign.learningTags || [])]
      .join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || sign.category === category;
    return matchesQuery && matchesCategory && matchesLearningFilter(sign, learningFilter);
  }), [signs, query, category, learningFilter]);

  return (
    <div className="page fade-in">
      <section className="page-header">
        <p className="eyebrow">Learn</p>
        <h1>Build a useful family vocabulary.</h1>
        <p className="muted">Start with simple signs, watch existing demo sources, and save what needs more practice.</p>
      </section>

      <div className="toolbar library-toolbar card">
        <label className="field search-field">
          Search signs
          <input value={query} placeholder="Try milk, book, help" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="field">
          Learning filter
          <select value={learningFilter} onChange={(event) => setLearningFilter(event.target.value)}>
            {learningFilters.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="field">
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>All</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className="filter-chip-row" aria-label="Quick learning filters">
        {learningFilters.slice(0, 8).map((item) => (
          <button type="button" key={item} className={learningFilter === item ? "selected" : ""} onClick={() => setLearningFilter(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="button-row left">
        <button className="button ghost" onClick={() => setShowCustomForm(!showCustomForm)}>
          {showCustomForm ? "Close custom word" : "+ Add a word to verify"}
        </button>
      </div>

      {showCustomForm && (
        <CustomWordForm onAdd={(word) => { onAddCustomWord(word); setShowCustomForm(false); }} />
      )}

      {customWords.length > 0 && (
        <section>
          <div className="section-heading"><div><p className="eyebrow">Personal list</p><h2>Words I want to learn</h2></div></div>
          <div className="grid-list">
            {customWords.map((word) => (
              <article key={word.id} className="sign-card custom-word">
                <p className="small-label">{word.category || "Custom"}</p>
                <h3>{word.word}</h3>
                <p>{word.reason || "Saved for later verification."}</p>
                {word.notes && <p className="muted">Notes: {word.notes}</p>}
                {word.videoLink && <a href={word.videoLink} target="_blank" rel="noreferrer">Open video source</a>}
                <VerificationBadge status="needs video source" />
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-heading">
          <div><p className="eyebrow">Library</p><h2>{filteredSigns.length} signs</h2></div>
          {(query || category !== "All" || learningFilter !== "All signs") && (
            <button type="button" className="button tiny ghost" onClick={() => { setQuery(""); setCategory("All"); setLearningFilter("All signs"); }}>Clear filters</button>
          )}
        </div>
        {filteredSigns.length ? (
          <div className="grid-list">{filteredSigns.map((sign) => <SignCard key={sign.id} sign={sign} onUpdateSign={onUpdateSign} />)}</div>
        ) : (
          <div className="card empty-state"><h3>No signs match yet</h3><p>Try a broader filter or clear the search.</p></div>
        )}
      </section>
    </div>
  );
}
