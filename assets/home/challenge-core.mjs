import { dailyItem } from '../daily-cycle.mjs';

export const CHALLENGE_STORAGE_KEY = 'darrahdata-daily-challenge-v1';
export const chooseChallenge = (sets, date = new Date()) => dailyItem(sets, date);
const signature = set => JSON.stringify(set.questions.map(q => [q.id, q.prompt, q.options, q.answer]));

export function freshAttempt(daily) {
  return { dateKey: daily.dateKey, challengeId: daily.item.id, signature: signature(daily.item), answers: [], step: 0 };
}

export function restoreAttempt(value, daily) {
  const fresh = freshAttempt(daily);
  if (!value || value.dateKey !== fresh.dateKey || value.challengeId !== fresh.challengeId || value.signature !== fresh.signature || !Array.isArray(value.answers)) return fresh;
  if (value.answers.length > daily.item.questions.length || value.answers.some((answer, index) => !Number.isInteger(answer) || answer < 0 || answer >= daily.item.questions[index].options.length)) return fresh;
  const length = value.answers.length;
  const step = Number.isInteger(value.step) && (value.step === length || value.step === length - 1) ? value.step : length;
  return { ...fresh, answers: [...value.answers], step: Math.max(0, step) };
}

export function answerQuestion(attempt, challenge, choice) {
  const question = challenge.questions[attempt.step];
  if (!question || attempt.answers.length !== attempt.step || !Number.isInteger(choice) || choice < 0 || choice >= question.options.length) return attempt;
  return { ...attempt, answers: [...attempt.answers, choice] };
}

export function advanceQuestion(attempt, challenge) {
  return attempt.step < challenge.questions.length && attempt.answers.length > attempt.step ? { ...attempt, step: attempt.step + 1 } : attempt;
}

export function scoreAttempt(attempt, challenge) {
  return attempt.answers.reduce((score, answer, index) => score + (answer === challenge.questions[index].answer ? 1 : 0), 0);
}

export function loadAttempt(storage, daily) {
  try { return { attempt: restoreAttempt(JSON.parse(storage.getItem(CHALLENGE_STORAGE_KEY) || 'null'), daily), error: false }; }
  catch { return { attempt: freshAttempt(daily), error: true }; }
}

export function saveAttempt(storage, attempt) {
  try { storage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(attempt)); return true; }
  catch { return false; }
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

export function renderRound(attempt, challenge) {
  const score = scoreAttempt(attempt, challenge), complete = attempt.step === challenge.questions.length;
  if (complete) return `<div class="challenge-result"><span class="challenge-badge" aria-hidden="true">✦</span><p class="challenge-kicker">Daily discovery complete</p><h3 id="challenge-question" tabindex="-1">${score} out of ${challenge.questions.length} correct.</h3><p>${score === challenge.questions.length ? 'A perfect little round. Take what you know into the day.' : 'Three ideas to carry into your day. Every answer is a chance to learn.'}</p><a class="challenge-primary" href="${escapeHTML(challenge.appUrl)}">Keep exploring ${escapeHTML(challenge.appName)} <span aria-hidden="true">→</span></a><details class="challenge-review"><summary>Review the three answers</summary>${challenge.questions.map((question, index) => `<div><strong>${escapeHTML(question.prompt)}</strong><p>Your answer: ${escapeHTML(question.options[attempt.answers[index]])}</p><p>Correct answer: ${escapeHTML(question.options[question.answer])}</p><p>${escapeHTML(question.explanation)}</p><a href="${escapeHTML(question.learnUrl)}">Open the lesson →</a></div>`).join('')}</details><p class="challenge-footnote">A fresh challenge tomorrow. Your result is saved only in this browser.</p></div>`;
  const question = challenge.questions[attempt.step], selected = attempt.answers[attempt.step], answered = selected !== undefined;
  return `<p class="challenge-kicker">Question ${attempt.step + 1} of ${challenge.questions.length}</p><h3 id="challenge-question" tabindex="-1">${escapeHTML(question.prompt)}</h3><div class="challenge-answers" role="group" aria-labelledby="challenge-question">${question.options.map((option, index) => `<button type="button" data-answer="${index}"${answered ? ' disabled' : ''} class="challenge-answer${answered && index === question.answer ? ' is-correct' : ''}${answered && index === selected && index !== question.answer ? ' is-incorrect' : ''}"><span class="answer-letter" aria-hidden="true">${answered && index === question.answer ? '✓' : ['A', 'B', 'C'][index]}</span><span>${escapeHTML(option)}</span>${answered && index === question.answer ? '<span class="answer-label">Correct</span>' : ''}${answered && index === selected && index !== question.answer ? '<span class="answer-label">Your choice</span>' : ''}</button>`).join('')}</div>${answered ? `<div class="challenge-feedback" id="challenge-feedback" tabindex="-1" role="status"><strong>${selected === question.answer ? 'That’s right.' : 'Good to know.'}</strong><p>${escapeHTML(question.explanation)}</p><a href="${escapeHTML(question.learnUrl)}">Find it in ${escapeHTML(challenge.appName)} →</a></div><button type="button" class="challenge-primary" data-next>${attempt.step === challenge.questions.length - 1 ? 'See my score' : 'Next question'} <span aria-hidden="true">→</span></button>` : '<p class="challenge-footnote">Choose an answer to see why.</p>'}`;
}
