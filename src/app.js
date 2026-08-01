/* Store, router and event wiring. One delegated listener per event type;
   every render replaces the screen's markup and then puts the caret back. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  var SCREENS = [
    { id: 'alumni', label: 'Alumni' },
    { id: 'management', label: 'Management' },
    { id: 'organization', label: 'Organization' }
  ];

  var state = {
    screen: 'alumni',
    tab: 'Home',
    range: '12 months',
    adminTab: 'Events',
    featured: { 1: true, 3: true },
    query: '',
    avail: 'Any',
    skill: 'Any skill',
    cohort: 'All cohorts',
    offer: { title: '', loc: '', pay: '', skills: '', type: 'Full-time', prioritise: true },
    offers: QB.data.liveOffers.slice()
  };

  /* ── Actions ─────────────────────────────────────────────────────── */

  var actions = {
    screen: function (value) {
      state.screen = value;
      if (location.hash.slice(1) !== value) location.hash = value;
    },
    tab: function (value) { state.tab = value; },
    range: function (value) { state.range = value; },
    adminTab: function (value) { state.adminTab = value; },
    feature: function (id) { state.featured[id] = !state.featured[id]; },
    avail: function (value) { state.avail = value; },
    skill: function (value) { state.skill = value; },
    offerType: function (value) { state.offer.type = value; },
    clearFilters: function () {
      state.query = '';
      state.avail = 'Any';
      state.skill = 'Any skill';
    },
    publishOffer: function () {
      var offer = state.offer;
      var title = offer.title.trim();
      if (!title) return;
      state.offers = [{
        title: title,
        meta: (offer.loc.trim() || 'Doha') + ' · ' + offer.type + ' · just now',
        applicants: 0
      }].concat(state.offers);
      state.offer = { title: '', loc: '', pay: '', skills: '', type: offer.type, prioritise: offer.prioritise };
    }
  };

  /* Editable fields, keyed by the `data-field` on the control. */
  var fields = {
    query: function (v) { state.query = v; },
    cohort: function (v) { state.cohort = v; },
    offerTitle: function (v) { state.offer.title = v; },
    offerLoc: function (v) { state.offer.loc = v; },
    offerPay: function (v) { state.offer.pay = v; },
    offerSkills: function (v) { state.offer.skills = v; },
    prioritise: function (v) { state.offer.prioritise = v; }
  };

  /* ── Render ──────────────────────────────────────────────────────── */

  function protoBar() {
    return html`<div class="proto-bar">
      <p class="proto-bar__brand">
        ${ui.brandDots('proto')}
        <span class="proto-bar__name">QSTP Beyond</span>
        <span class="proto-bar__tag">Dashboard prototype</span>
      </p>
      <div class="pill-group" role="group" aria-label="Prototype screen">
        ${SCREENS.map(function (screen) {
          var on = screen.id === state.screen;
          return html`<button type="button"
            class="${ui.cx('pill', { 'is-active': on })}"
            data-act="screen" data-arg="${screen.id}" aria-pressed="${on}">${screen.label}</button>`;
        })}
      </div>
    </div>`;
  }

  var root = document.getElementById('app');

  /* A full re-render blows away focus, so note where the caret was first. */
  function captureFocus() {
    var el = document.activeElement;
    if (!el || !el.dataset || !el.dataset.field) return null;
    var snapshot = { field: el.dataset.field };
    try {
      snapshot.start = el.selectionStart;
      snapshot.end = el.selectionEnd;
    } catch (e) { /* selection is not readable on every input type */ }
    return snapshot;
  }

  function restoreFocus(snapshot) {
    if (!snapshot) return;
    var el = root.querySelector('[data-field="' + snapshot.field + '"]');
    if (!el) return;
    el.focus();
    if (snapshot.start == null) return;
    try { el.setSelectionRange(snapshot.start, snapshot.end); } catch (e) { /* ditto */ }
  }

  function render() {
    var snapshot = captureFocus();
    root.innerHTML = String(html`${protoBar()}<main class="screen">${QB.screens[state.screen](state)}</main>`);
    document.body.dataset.screen = state.screen;
    restoreFocus(snapshot);
  }

  /* ── Wiring ──────────────────────────────────────────────────────── */

  root.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-act]');
    if (!trigger || !root.contains(trigger)) return;
    var action = actions[trigger.dataset.act];
    if (!action) return;
    event.preventDefault();
    action(trigger.dataset.arg);
    render();
  });

  root.addEventListener('input', function (event) {
    var control = event.target.closest('[data-field]');
    if (!control) return;
    var field = fields[control.dataset.field];
    if (!field) return;
    field(control.type === 'checkbox' ? control.checked : control.value);
    render();
  });

  /* Radios fire `change`, not `input`, in some browsers. */
  root.addEventListener('change', function (event) {
    var control = event.target.closest('[data-field]');
    if (!control || control.type !== 'radio') return;
    var field = fields[control.dataset.field];
    if (field) { field(control.value); render(); }
  });

  function readHash() {
    var id = location.hash.slice(1);
    return QB.screens[id] ? id : null;
  }

  window.addEventListener('hashchange', function () {
    var id = readHash();
    if (id && id !== state.screen) { state.screen = id; render(); }
  });

  state.screen = readHash() || state.screen;
  render();
})(window.QB = window.QB || {});
