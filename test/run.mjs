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
  contains('second day: the 30-minute grid spans rows', html, 'grid-template-rows:auto repeat(24, 22px)');
  contains('a 90-minute lesson spans three rows', html, 'grid-row:5 / 8');
  contains('french labels', html, 'Réserver');
}
{
  // A single half-hour booking on one day used to shrink that day's cells to 22px
  // while the other days stayed at 36px, so the grid jumped when switching tabs.
  // The axis is now built once over every displayed day.
  const rowsOf = (html) => (html.match(/grid-template-rows:[^"]*/) || [''])[0];
  const card = await makeCard({ days: 2 });
  card._day = 0; const d0 = card._markup(NOW);
  card._day = 1; const d1 = card._markup(NOW);
  ok('every day shares one row height', rowsOf(d0) === rowsOf(d1) && rowsOf(d0) !== '');
  contains('the shared axis keeps the 30-minute step of the busiest day', d0, 'grid-template-rows:auto repeat(24, 22px)');
  ok('the shared axis spans the union of the days (10:00 to 22:00)', (() => {
    const a = H.buildAxis([...DAY1.slots, ...DAY2.slots]);
    return a.start === 10 * 60 && a.end === 22 * 60 && a.step === 30 && a.rows === 24;
  })());
  contains('a 60-minute slot of the hourly day now spans two 30-minute rows', d0, 'grid-row:24 / 26');
  ok('start_hour still clamps the shared axis', (await (async () => {
    const c = await makeCard({ days: 2, start_hour: 20, end_hour: 22 });
    return c._markup(NOW).includes('grid-template-rows:auto repeat(4, 22px)');
  })()));
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

// -- 2-player courts flagged + linked to the site (option B) --------------------
{
  const card = await makeCard({ days: 1 });
  ok('site link for a date is built from the club code', card._siteUrlForDate('2026-09-11T08:00:00+02:00') === 'https://tenup.fft.fr/club/50690472/reservations/20260911');
  card._data = { ...DATA, days: [{ date: '2026-09-11', slots: [
    slot('21099', '2026-09-11T10:00:00+02:00', '2026-09-11T11:00:00+02:00', 'free', { required_players: 2 }),
    slot('21100', '2026-09-11T10:00:00+02:00', '2026-09-11T11:00:00+02:00', 'free', { required_players: 1 }),
    slot('21101', '2026-09-11T10:00:00+02:00', '2026-09-11T11:00:00+02:00', 'free', {}),
  ] }] };
  card._day = 0;
  const at = new Date('2026-09-11T08:00:00+02:00').getTime();
  const html = card._markup(at);
  contains('a 2-player free slot becomes a link to the site for ITS day', html, 'class="cell free two-players" style="grid-column:2;grid-row:2 / 3" href="https://tenup.fft.fr/club/50690472/reservations/20260911"');
  contains('the 2-player slot shows the badge', html, '2 players');
  ok('the 2-player slot is NOT bookable in-card', !html.includes('data-action="book" data-court="21099"'));
  contains('a 1-player free slot stays bookable in-card', html, 'data-action="book" data-court="21100"');
  ok('a slot with unknown player count stays bookable (fallback)', html.includes('data-action="book" data-court="21101"'));
}

// ── 5. redraws: the bug that swallowed the first click ───────────────────────
// Home Assistant assigns a fresh hass on every state change of the whole
// instance. The card used to rebuild its DOM on each one, so the cell being
// pressed was replaced between mousedown and mouseup and the browser never
// fired the click: tapping your own reservation appeared to do nothing.
function spyWrites(node) {
  const state = { writes: 0, html: node.innerHTML };
  Object.defineProperty(node, 'innerHTML', {
    configurable: true,
    get() { return state.html; },
    set(v) { state.writes++; state.html = String(v); },
  });
  return state;
}
{
  const hass = makeHass();
  const card = await makeCard({ days: 2 }, hass);
  const spy = spyWrites(card._card);
  card.hass = makeHass();               // a plain state change elsewhere in HA
  card.hass = makeHass();
  ok('a hass update does not rewrite the card DOM', spy.writes === 0);

  card._render();                        // nothing changed -> still no write
  ok('an unchanged render never touches the DOM', spy.writes === 0);

  card._day = 1; card._render();         // a real change -> exactly one write
  ok('a real change writes once', spy.writes === 1);
  card._render();
  ok('re-rendering the same view stays at one write', spy.writes === 1);
}
{
  // clicking your own slot must open the confirmation, and a hass update
  // arriving right after must not wipe it.
  const hass = makeHass();
  const card = await makeCard({ days: 2 }, hass);
  card._onClick({
    stopPropagation() {},
    target: { closest: () => ({ getAttribute: (k) => ({
      'data-action': 'cancel', 'data-court': '21099',
      'data-start': '2026-09-10T21:00:00+02:00',
    }[k]) }) },
  });
  ok('clicking your own slot asks for confirmation', card._pending && card._pending.kind === 'cancel');
  contains('the cancel dialog is rendered', card._markup(NOW), 'data-action="confirm"');
  const spy = spyWrites(card._card);
  card.hass = makeHass();
  ok('a hass update does not close the confirmation', card._pending !== null && spy.writes === 0);
}
{
  // a language switch is the one hass change the card must react to
  const card = await makeCard({ days: 2 }, makeHass('en'));
  const spy = spyWrites(card._card);
  card.hass = makeHass('fr');
  ok('a language change does redraw', spy.writes === 1);
}

// ── 6. cell styling: opaque fills, no washed-out transparency ────────────────
{
  const card = await makeCard({ days: 1 });
  const css = card.shadowRoot.children[0].textContent;
  ok('free cells are an opaque green', css.includes('.cell.free { background: #3d8a44;'));
  ok('2-player cells are an opaque amber', css.includes('.cell.free.two-players { background: #b08800;'));
  ok('booked cells are an opaque red', css.includes('.cell.busy { background: #a43434;'));
  ok('no washed-out fill is left', !/rgba\(76, 175, 80, 0\.18\)|rgba\(211, 47, 47, 0\.22\)|rgba\(255, 193, 7, 0\.22\)/.test(css));
  ok('long labels stay on one line', css.includes('.cell .lbl { white-space: nowrap;'));
}

// ── 7. the cell says what is happening while Ten'Up answers ─────────────────
{
  let release;
  const hass = makeHass();
  hass.callService = (domain, service, data) => {
    hass.calls.push({ domain, service, data });
    return new Promise((r) => { release = r; });
  };
  const card = await makeCard({ days: 2, language: 'fr' }, hass);
  const mine = card._findSlot('21099', '2026-09-10T21:00:00+02:00');
  card._request('cancel', mine);
  contains('la confirmation est demandee d\'abord', card._markup(NOW), 'data-action="confirm"');

  card._runPending();                       // not awaited: we look mid-flight
  await new Promise((r) => setTimeout(r, 0));
  const mid = card._markup(NOW);
  ok('la boite de dialogue se ferme des la confirmation', !mid.includes('data-action="confirm"'));
  contains('la case passe en attente', mid, 'class="cell pending"');
  contains('elle annonce une annulation', mid, 'Annulation');
  ok('la case en attente n\'est plus cliquable',
     !mid.includes('data-action="cancel" data-court="21099" data-start="2026-09-10T21:00:00+02:00"'));
  ok('une seule case est en attente', (mid.match(/class="cell pending"/g) || []).length === 1);
  contains('les autres cases sont intactes', mid, 'data-action="book" data-court="21100"');

  release({});
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
  const after = card._markup(NOW);
  ok('l\'attente est levee une fois la reponse revenue', !after.includes('class="cell pending"'));
  ok('le compte rendu est affiche', card._toast && card._toast.kind === 'ok');
}
{
  const hass = makeHass();
  const card = await makeCard({ days: 2, language: 'en' }, hass);
  card._inflight = { kind: 'book', court_id: '21100', start: '2026-09-10T21:00:00+02:00' };
  const html = card._markup(NOW);
  contains('a booking in flight says Booking', html, 'Booking');
  contains('and waits for Ten\u2019Up', html, 'waiting for Ten');
}

report();
