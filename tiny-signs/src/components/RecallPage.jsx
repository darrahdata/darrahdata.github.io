import { useState } from "react";
import { signs } from "../data/signs.js";
import SignDemo from "./SignDemo.jsx";

export function makeDeck(progress, scope = "learned") {
  let pool = scope === "all" ? signs : signs.filter(sign => progress[sign.id]?.practiceCount || progress[sign.id]?.count);
  if (!pool.length) pool = signs.filter(sign => ["milk", "more", "all-done"].includes(sign.id));
  return [...pool].sort((a,b) => {
    const pa = progress[a.id] || {}, pb = progress[b.id] || {};
    const priority = p => p.recallRating === 'again' ? 0 : p.recallAt ? 2 : 1;
    return priority(pa) - priority(pb) || (pa.recallAt || '').localeCompare(pb.recallAt || '');
  }).slice(0,5);
}
export default function RecallPage({ progress, onRecall, onOpen, go }) {
  const [mode, setMode] = useState('make');
  const [scope, setScope] = useState('learned');
  const [deck, setDeck] = useState(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState([]);
  const pool = makeDeck(progress,scope);
  const sign = deck?.[index];
  const complete = deck && !sign;
  function start() { setDeck(pool); setIndex(0); setResults([]); setRevealed(false); setAnswer(''); }
  function rate(rating) {
    onRecall(sign.id,rating);
    setResults(current => [...current, {id:sign.id,rating}]);
    setIndex(current => current + 1); setRevealed(false); setAnswer('');
    window.scrollTo({top:0,behavior:'auto'});
  }
  return <main id="main-content" tabIndex={-1} className="page-shell recall-page">
    <p className="eyebrow">A little practice, from memory</p><h1>Let’s see what stuck.</h1>
    {!deck && <section className="card recall-setup"><h2>Try first. Then compare.</h2><p>Practice up to five signs. Signs you want to revisit appear first; familiar signs return later.</p>
      <div className="recall-choices"><button type="button" aria-pressed={mode === 'make'} onClick={() => setMode('make')}><strong>Make the sign</strong><span>See a word. Try signing it before the video appears.</span></button><button type="button" aria-pressed={mode === 'recognize'} onClick={() => setMode('recognize')}><strong>Name the sign</strong><span>Watch a clip without the word. Recall its meaning.</span></button></div>
      <label className="recall-scope">Practice from <select value={scope} onChange={e => setScope(e.target.value)}><option value="learned">My practiced signs</option><option value="all">All 30 signs</option></select></label>
      <p>{scope === 'learned' && !signs.some(s => progress[s.id]?.practiceCount || progress[s.id]?.count) ? 'No practiced signs yet. We’ll start with Milk, More, and All done. You can reveal the answer whenever you need it.' : `${pool.length} signs in this round.`}</p>
      <button type="button" className="button primary" onClick={start}>Start practice →</button></section>}
    {sign && <section className="card recall-round" aria-labelledby="recall-prompt">
      <div className="recall-top"><span>{index + 1} / {deck.length}</span><button type="button" className="text-button" onClick={() => setDeck(null)}>Finish early</button></div>
      <h2 id="recall-prompt">{mode === 'make' ? `Can you sign “${sign.word}”?` : 'What does this sign mean?'}</h2>
      {mode === 'make' && !revealed && <div className="memory-prompt"><span aria-hidden="true">✦</span><p>Think about the handshape, palm direction, location, and movement. Try it once without looking.</p></div>}
      {(mode === 'recognize' || revealed) && <SignDemo key={`${sign.id}-${index}`} sign={sign} concealWord={!revealed} />}
      {mode === 'recognize' && !revealed && <label className="recall-answer">Your guess (optional)<input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type the word, or say it out loud" autoComplete="off" /></label>}
      {!revealed ? <button type="button" className="button primary reveal-button" onClick={() => setRevealed(true)}>Reveal & compare →</button> : <div className="recall-reveal" aria-live="polite"><p className="eyebrow">The sign is</p><h3>{sign.word}</h3>{answer && <p>Your guess: {answer}</p>}<p>{sign.cue.summary}</p><p><strong>Watch for:</strong> {sign.commonMistake}</p><button type="button" className="text-button" onClick={() => onOpen(sign.id)}>Open the full lesson →</button><p>How did it go? This is your assessment, not an automatic accuracy score.</p><div className="recall-rating"><button type="button" className="button secondary" onClick={() => rate('again')}>Practice again</button><button type="button" className="button primary" onClick={() => rate('remembered')}>I remembered it ✓</button></div></div>}
    </section>}
    {complete && <section className="card recall-complete"><p className="eyebrow">Round complete</p><h2>Nice to have these at your fingertips.</h2><p>You marked {results.filter(r => r.rating === 'remembered').length} of {results.length} signs as remembered. Your choices are saved on this device.</p><div className="review-list">{results.map(r => <button key={r.id} type="button" onClick={() => onOpen(r.id)}><strong>{signs.find(s => s.id === r.id).word}</strong><span>{r.rating === 'again' ? 'Revisit next' : 'Remembered ✓'}</span></button>)}</div><div className="flow-footer"><button type="button" className="button secondary" onClick={() => setDeck(null)}>Another round</button><button type="button" className="button primary" onClick={() => go('today')}>Back to today →</button></div></section>}
  </main>;
}
