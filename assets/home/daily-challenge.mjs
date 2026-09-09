import { watchLocalDay } from '../daily-cycle.mjs';
import { chooseChallenge, loadAttempt, saveAttempt, answerQuestion, advanceQuestion, renderRound, scoreAttempt, renderAppLinks } from './challenge-core.mjs?v=2';

const root = document.getElementById('daily-challenge');
const storage = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
let daily, attempt, cannotSave = false, changingDay = false;

function render(focusId) {
  root.querySelectorAll('video').forEach(video => video.pause());
  document.getElementById('challenge-round').innerHTML = renderRound(attempt, daily.item);
  const completed = attempt.step === daily.item.questions.length;
  const progress = document.getElementById('challenge-progress');
  progress.innerHTML = daily.item.questions.map((question, index) => `<span class="${attempt.answers[index] === undefined ? '' : attempt.answers[index] === question.answer ? 'correct' : 'answered'}" aria-hidden="true"></span>`).join('');
  progress.setAttribute('aria-label', `${attempt.answers.length} of ${daily.item.questions.length} answered; ${scoreAttempt(attempt, daily.item)} correct`);
  document.getElementById('challenge-apps').innerHTML = renderAppLinks(daily.item, daily.item.questions[attempt.step]?.appId);
  document.getElementById('challenge-topic').textContent = daily.item.title;
  document.getElementById('challenge-date').dateTime = daily.dateKey;
  document.getElementById('challenge-date').textContent = new Date(`${daily.dateKey}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  document.getElementById('challenge-status').textContent = completed ? 'Today’s badge earned' : 'Three questions · about a minute';
  document.getElementById('challenge-save-note').textContent = cannotSave ? 'Saving is unavailable. Progress lasts for this visit only.' : 'Changes at local midnight. Progress stays in this browser.';
  if (cannotSave) root.querySelector('.challenge-result .challenge-footnote')?.replaceChildren('A fresh challenge tomorrow. This result is kept for this visit only.');
  if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
}

async function start() {
  try {
    const response = await fetch(new URL('./challenges.json?v=2', import.meta.url));
    if (!response.ok) throw new Error('Challenge unavailable');
    const sets = await response.json();
    if (!Array.isArray(sets) || sets.length === 0 || sets.some(set => set.questions?.length !== 3)) throw new Error('Invalid challenge');
    watchLocalDay(date => {
      const next = chooseChallenge(sets, date);
      if (next.dateKey === daily?.dateKey) return;
      changingDay = Boolean(daily);
      daily = next;
      const loaded = loadAttempt(storage, daily);
      attempt = loaded.attempt;
      cannotSave = loaded.error;
      render();
      if (changingDay) document.getElementById('challenge-new-day').textContent = 'A new day, a fresh three-question challenge.';
    });
    root.addEventListener('click', event => {
      const replay = event.target.closest('[data-replay]');
      if (replay) {
        const video = root.querySelector('video');
        if (video) { video.currentTime = 0; video.play().catch(() => { const message = root.querySelector('.challenge-media-error'); if (message) message.hidden = false; }); }
        return;
      }
      const answer = event.target.closest('[data-answer]');
      const next = event.target.closest('[data-next]');
      if (!answer && !next) return;
      const updated = answer ? answerQuestion(attempt, daily.item, Number(answer.dataset.answer)) : advanceQuestion(attempt, daily.item);
      if (updated === attempt) return;
      attempt = updated;
      cannotSave = !saveAttempt(storage, attempt);
      render(answer ? 'challenge-feedback' : 'challenge-question');
    });
    root.addEventListener('change', event => {
      if (event.target.matches('[data-speed]')) {
        const video = root.querySelector('video');
        if (video) video.playbackRate = Number(event.target.value);
      }
    });
    root.addEventListener('error', event => {
      if (event.target.tagName === 'VIDEO') {
        const message = root.querySelector('.challenge-media-error');
        if (message) message.hidden = false;
      }
    }, true);
  } catch {
    document.getElementById('challenge-round').innerHTML = '<h3>Today’s challenge couldn’t load.</h3><p>Check your connection and try again, or explore your apps below.</p><button class="challenge-primary" type="button" id="challenge-retry">Try again</button>';
    document.getElementById('challenge-retry').addEventListener('click', start, { once: true });
    document.getElementById('challenge-status').textContent = 'Three questions, fresh each day';
  }
}
start();
