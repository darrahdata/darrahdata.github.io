import { useState } from "react";

export default function CustomWordForm({ onAdd }) {
  const [form, setForm] = useState({
    word: "",
    category: "Custom",
    reason: "",
    notes: "",
    videoLink: ""
  });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.word.trim()) return;
    onAdd({ ...form, word: form.word.trim() });
  };

  return (
    <form className="card custom-form" onSubmit={submit}>
      <h2>Add a word to verify later</h2>
      <p className="muted">
        Custom words are saved as “needs video source” so you can add a trusted ASL reference.
      </p>
      <label className="field">
        Word
        <input value={form.word} onChange={(event) => update("word", event.target.value)} required />
      </label>
      <label className="field">
        Category
        <input value={form.category} onChange={(event) => update("category", event.target.value)} />
      </label>
      <label className="field">
        Why I want to learn this
        <input value={form.reason} onChange={(event) => update("reason", event.target.value)} />
      </label>
      <label className="field">
        Notes
        <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} />
      </label>
      <label className="field">
        Video link optional
        <input value={form.videoLink} onChange={(event) => update("videoLink", event.target.value)} />
      </label>
      <button className="button primary" type="submit">
        Save custom word
      </button>
    </form>
  );
}
