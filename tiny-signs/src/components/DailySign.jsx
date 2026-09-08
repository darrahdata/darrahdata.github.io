import { useEffect, useState } from 'react';
import { dailyItem, watchLocalDay } from '../../../assets/daily-cycle.mjs';
import SignDemo from './SignDemo.jsx';

export function DailySignFeature({ daily, onOpen }) {
  const sign = daily.item;
  return <section className="first-lesson" aria-labelledby="welcome-heading">
    <div className="first-lesson-copy">
      <p className="eyebrow">Sign of the day · <time dateTime={daily.dateKey}>{new Date(`${daily.dateKey}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</time></p>
      <h1 id="welcome-heading">A new sign.<br /><em>A little closer.</em></h1>
      <p>Today, learn <strong>{sign.word}</strong>. Watch the demonstration, try the movement, and find a moment to use it together.</p>
      <button type="button" className="button primary" onClick={() => onOpen(sign.id)}>Learn {sign.word}, step by step <span aria-hidden="true">→</span></button>
      <span className="daily-sign-progress">Sign {daily.index + 1} of {daily.total} <span aria-hidden="true">·</span> A new sign every day</span>
      <span className="beginner-note">We go through every sign in order, then start again. Changes at midnight in your local time.</span>
    </div>
    <div className="home-demo">
      <div className="home-demo-title"><span>TODAY’S SIGN</span><strong>{sign.word}</strong><small>{sign.hands === 'one' ? 'One hand' : 'Two hands'} · {sign.routine}</small></div>
      <SignDemo key={sign.id} sign={sign} />
    </div>
  </section>;
}

export default function DailySign({ signs, onOpen }) {
  const [date, setDate] = useState(() => new Date());
  useEffect(() => watchLocalDay(setDate), []);
  return <DailySignFeature daily={dailyItem(signs, date)} onOpen={onOpen} />;
}
