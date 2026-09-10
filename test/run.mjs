/**
 * ha-tenup-card behaviour tests.  Run with:  node test/run.mjs
 *
 * What silently goes wrong in this card:
 *   1. the time axis (30-minute lessons next to 60-minute slots, clamped hours);
 *   2. the state of a cell (a free slot that is already over must not be bookable);
 *   3. the service payloads of book and cancel (the wrong court or start books
 *      the wrong slot on a real account);
 *   4. the editor: config-changed must carry detail.config, and HA's echo must
 *      not rebuild the form or erase a value.
 */
process.env.TZ = 'Europe/Paris';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadCard, check, contains, report } from './harness.mjs';
const ok = (label, cond) => check(label, !!cond, true);

const HERE = dirname(fileURLToPath(import.meta.url));
const registry = await loadCard(process.env.TENUP_CARD || join(HERE, '..', 'dist', 'ha-tenup-card.js'));
const Card = registry.get('ha-tenup-card');
const Editor = registry.get('ha-tenup-card-editor');
const H = Card._helpers;

// A fixed "now": Thursday 2026-09-10 20:30 Paris.
const NOW = new Date('2026-09-10T20:30:00+02:00').getTime();

const COURTS = [{ id: '21099', name: 'Court COUVERT' }, { id: '21100', name: 'COURT 1' }, { id: '21101', name: 'COURT 2' }];
function slot(court, start, end, state, extra = {}) {
  const c = COURTS.find((x) => x.id === court);
  return { court_id: court, court_name: c.name, start, end, state, label: null, reservation_id: null, ...extra };
}
const DAY1 = {
  date: '2026-09-10',
  slots: [
    slot('21100', '2026-09-10T19:00:00+02:00', '2026-09-10T20:00:00+02:00', 'free'),          // over: must render as past
    slot('21100', '2026-09-10T20:00:00+02:00', '2026-09-10T21:00:00+02:00', 'busy', { label: 'T. CHOLE' }),
    slot('21100', '2026-09-10T21:00:00+02:00', '2026-09-10T22:00:00+02:00', 'free'),
    slot('21099', '2026-09-10T21:00:00+02:00', '2026-09-10T22:00:00+02:00', 'mine', { label: 'J. LAPLACE', reservation_id: '165841846' }),
    slot('21101', '2026-09-10T20:00:00+02:00', '2026-09-10T21:00:00+02:00', 'free'),
  ],
};
const DAY2 = {
  date: '2026-09-12',
  slots: [
    slot('21100', '2026-09-12T11:00:00+02:00', '2026-09-12T11:30:00+02:00', 'free'),
    slot('21100', '2026-09-12T11:30:00+02:00', '2026-09-12T13:00:00+02:00', 'busy', { label: 'CJ sam 11h30 Nathan Manon' }),
    slot('21101', '2026-09-12T10:00:00+02:00', '2026-09-12T11:00:00+02:00', 'free'),
  ],
};
const DATA = { entry_id: 'entry-1', club_code: '50690472', club_name: 'MUROIS (TENNIS CLUB)', fetched_at: '2026-09-10T20:25:00+02:00', courts: COURTS, days: [DAY1, DAY2] };

function makeHass(lang = 'en') {
  const calls = [];
  return {
    language: lang, states: {},
    calls,
    callWS: async (msg) => { calls.push({ ws: msg }); return DATA; },
    callService: async (domain, service, data) => { calls.push({ domain, service, data }); return {}; },
  };
}

async function makeCard(config, hass = makeHass()) {
  const card = new Card();
  card.setConfig(Object.freeze({ ...config }));   // Lovelace deep-freezes the stored config
  card.hass = hass;
  await new Promise((r) => setTimeout(r, 0));     // let _fetch resolve
  return card;
}

// ── 1. helpers ───────────────────────────────────────────────────────────────
ok('minutesOf reads local time', H.minutesOf('2026-09-10T21:00:00+02:00') === 21 * 60);
ok('hhmm formats', H.hhmm('2026-09-12T11:30:00+02:00') === '11:30');
ok('a free slot that is over is past', H.slotState(DAY1.slots[0], NOW) === 'past');
ok('a free slot to come stays free', H.slotState(DAY1.slots[2], NOW) === 'free');
ok('my past reservation stays mine (cancel link is Ten\'Up\'s call)', H.slotState({ ...DAY1.slots[3], end: '2026-09-10T20:00:00+02:00' }, NOW) === 'mine');

let axis = H.buildAxis(DAY1.slots);
ok('hourly axis when every slot is on the hour', axis.step === 60 && axis.start === 19 * 60 && axis.end === 22 * 60 && axis.rows === 3);
axis = H.buildAxis(DAY2.slots);
ok('30-minute axis as soon as a slot is not on the hour', axis.step === 30 && axis.start === 10 * 60 && axis.end === 13 * 60 && axis.rows === 6);
axis = H.buildAxis(DAY1.slots, 20, 21);
ok('start_hour / end_hour clamp the axis', axis.start === 20 * 60 && axis.end === 21 * 60 && axis.rows === 1);
ok('sortedJson is key-order independent', H.sortedJson({ b: 1, a: [{ d: 2, c: 3 }] }) === H.sortedJson({ a: [{ c: 3, d: 2 }], b: 1 }));
ok('french strings', H.t({ language: 'fr' }, {}, 'book') === 'Réserver' && H.t({ language: 'fr' }, { language: 'en' }, 'book') === 'Book');

// ── 2. rendering ─────────────────────────────────────────────────────────────
{
  const card = await makeCard({ days: 2 });
  const html = card._markup(NOW);
  contains('title falls back to the club name', html, 'MUROIS (TENNIS CLUB)');
  contains('day tabs are rendered', html, 'data-action="day" data-index="1"');
  contains('the free count of the day tab counts only slots to come', html, '<span class="n">2</span>');
  contains('a free slot to come is bookable', html, 'data-action="book" data-court="21100" data-start="2026-09-10T21:00:00+02:00"');
  ok('a free slot that is over is not bookable', !html.includes('data-start="2026-09-10T19:00:00+02:00"'));
  contains('the over slot renders as past', html, 'class="cell past"');
  contains('a busy slot shows who booked it', html, 'T. CHOLE');
  contains('my slot can be cancelled', html, 'data-action="cancel" data-court="21099" data-start="2026-09-10T21:00:00+02:00"');
  contains('court headers', html, 'COURT 2');
  contains('updated time in the header', html, 'Updated 20:25');
}
{
  const card = await makeCard({ show_names: false });
  ok('show_names=false hides the names', !card._markup(NOW).includes('T. CHOLE'));
}
{
  const card = await makeCard({ courts: ['21100'] });
  const html = card._markup(NOW);
  ok('courts filter keeps only the listed court', html.includes('COURT 1') && !html.includes('COURT 2') && !html.includes('Court COUVERT'));
  contains('the free count follows the filter', html, '<span class="n">1</span>');
}
{
  const card = await makeCard({ days: 2, language: 'fr' });
  card._day = 1;
  const html = card._markup(NOW);
  contains('second day: the 30-minute grid spans rows', html, 'grid-template-rows:auto repeat(6, 22px)');
  contains('a 90-minute lesson spans three rows', html, 'grid-row:5 / 8');
  contains('french labels', html, 'Réserver');
}

// ── 3. actions ───────────────────────────────────────────────────────────────
{
  const hass = makeHass();
  const card = await makeCard({}, hass);
  const free = card._findSlot('21100', '2026-09-10T21:00:00+02:00');
  card._request('book', free);
  ok('book asks for confirmation by default', card._pending && card._pending.kind === 'book');
  contains('the dialog names the court and the time', card._markup(NOW), 'Book COURT 1 on Thursday 10 September, 21:00 to 22:00?');
  await card._runPending();
  const call = hass.calls.find((c) => c.service === 'book');
  ok('book calls tenup.book with the court and the ISO start', call && call.domain === 'tenup' && call.data.court_id === '21100' && call.data.start === '2026-09-10T21:00:00+02:00');
  ok('the entry id of the planning is passed along', call.data.entry_id === 'entry-1');
  ok('a success toast is shown', card._toast && card._toast.kind === 'ok');
  ok('the dialog is closed', card._pending === null);
}
{
  const hass = makeHass();
  const card = await makeCard({ confirm: false, entry_id: 'entry-9' }, hass);
  const mine = card._findSlot('21099', '2026-09-10T21:00:00+02:00');
  card._request('cancel', mine);
  await new Promise((r) => setTimeout(r, 0));
  const call = hass.calls.find((c) => c.service === 'cancel');
  ok('confirm=false cancels straight away with the reservation id', call && call.data.reservation_id === '165841846');
  ok('a configured entry_id wins over the planning one', call.data.entry_id === 'entry-9');
}
{
  const hass = makeHass();
  hass.callService = async () => { throw { message: "Ten'Up: Réservation impossible. 1 en cours" }; };
  const card = await makeCard({ confirm: false }, hass);
  card._request('book', card._findSlot('21101', '2026-09-10T20:00:00+02:00'));
  await new Promise((r) => setTimeout(r, 0));
  ok('a refusal becomes an error toast with the Ten\'Up message', card._toast && card._toast.kind === 'err' && card._toast.text.includes('Réservation impossible'));
  contains('the error toast is rendered', card._markup(NOW), 'class="toast err"');
}
{
  let threw = false;
  try { new Card().setConfig(Object.freeze({ days: 0 })); } catch (e) { threw = true; }
  ok('days out of range is rejected', threw);
}

// ── 4. editor ────────────────────────────────────────────────────────────────
{
  const editor = new Editor();
  const events = [];
  editor.dispatchEvent = (ev) => { events.push(ev); return true; };
  editor.setConfig(Object.freeze({ days: 3 }));
  editor.hass = { language: 'en', callWS: async () => { throw new Error('no'); } };
  await new Promise((r) => setTimeout(r, 0));
  let builds = 0;
  const origRefresh = editor._refresh.bind(editor);
  editor._refresh = () => { builds++; origRefresh(); };
  editor._onChange({ name: 'Tennis', entry_id: '', days: 2, start_hour: 8, end_hour: '', courts: ['21100'], show_names: true, confirm: false, compact: false, language: 'auto' });
  const ev = events.find((e) => e.type === 'config-changed');
  ok('config-changed carries detail.config', ev && ev.detail && ev.detail.config);
  const cfg = ev.detail.config;
  ok('defaults are dropped, choices are kept', cfg.name === 'Tennis' && cfg.days === 2 && cfg.start_hour === 8 && cfg.end_hour === undefined && cfg.entry_id === undefined && cfg.confirm === false && cfg.show_names === undefined && cfg.language === undefined && JSON.stringify(cfg.courts) === '["21100"]');
  editor.setConfig(Object.freeze({ courts: ['21100'], confirm: false, name: 'Tennis', start_hour: 8, days: 2 }));   // HA echo, keys reordered
  ok('the echo of our own config does not rebuild the form', builds === 0);
  editor.setConfig(Object.freeze({ name: 'Other' }));
  ok('a real external change rebuilds the form', builds === 1);
}

// -- direct "Open on Ten'Up" link (option A) ------------------------------------
{
  const card = await makeCard({ days: 2 });
  const url = card._siteUrl();
  ok('site link uses club code + selected day', url === 'https://tenup.fft.fr/club/50690472/reservations/20260910');
  card._day = 1;
  ok('site link follows the day tab', card._siteUrl() === 'https://tenup.fft.fr/club/50690472/reservations/20260912');
  card._day = 0;
  contains('header shows an Open-on-Ten\'Up anchor to the site', card._markup(NOW), 'href="https://tenup.fft.fr/club/50690472/reservations/20260910"');
  contains('the site link opens in a new tab safely', card._markup(NOW), 'rel="noopener noreferrer"');
}
{
  const noData = new Card();
  noData.setConfig(Object.freeze({}));
  ok('no site link before data is known', noData._siteUrl() === null);
}
{
  const hass = makeHass();
  hass.callService = async () => { throw { message: "Ten'Up: Ce cr\u00e9neau demande 2 joueurs; l'ajout d'un partenaire n'est pas encore pris en charge" }; };
  const card = await makeCard({ confirm: false }, hass);
  card._request('book', card._findSlot('21099', '2026-09-10T21:00:00+02:00') || card._findSlot('21101', '2026-09-10T20:00:00+02:00'));
  await new Promise((r) => setTimeout(r, 0));
  const html = card._markup(NOW);
  contains('a refusal toast offers the direct site link', html, '<a href="https://tenup.fft.fr/club/50690472/reservations/20260910"');
  ok('the refusal keeps the Ten\'Up message', card._toast.kind === 'err' && /2 joueurs/.test(card._toast.text));
}

report();
