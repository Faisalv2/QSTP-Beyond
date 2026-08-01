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
    mgmtNav: 'Insights',
    insightsTab: 'Outcomes',
    alumId: 1,
    orgId: 1,
    range: '12 months',
    adminTab: 'Events',
    featured: { 1: true, 3: true },
    orgTab: 'Talent search',
    offerId: 1,
    offerStatus: 'All',
    composing: false,
    query: '',
    avail: 'Any',
    skill: 'Any skill',
    spotlightOnly: false,
    cohort: 'All cohorts',
    offer: { title: '', loc: '', pay: '', skills: '', type: 'Full-time', prioritise: true },
    offers: QB.data.liveOffers.slice(),

    /* The status survey. `statusUpdated` is per session: the three gated tabs
       stay shut until it is true, and nothing here is persisted. */
    statusUpdated: false,
    statusSource: null,
    survey: { open: false, gated: null, step: 0, answers: QB.blankAnswers() }
  };

  /* ── The status survey ───────────────────────────────────────────── */

  function isGated(tab) {
    return !state.statusUpdated && QB.surveyData.gatedTabs.indexOf(tab) !== -1;
  }

  function openSurvey(gatedTab) {
    state.survey.open = true;
    state.survey.gated = gatedTab || null;
    state.survey.step = 0;
    /* The nav has to be on screen for the way out of a gated survey to exist. */
    if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
  }

  function closeSurvey() {
    state.survey.open = false;
    state.survey.gated = null;
    state.survey.step = 0;
  }

  /* ── Actions ─────────────────────────────────────────────────────── */

  var actions = {
    screen: function (value) {
      state.screen = value;
      closeSurvey();
      if (location.hash.slice(1) !== value) location.hash = value;
    },
    tab: function (value) {
      /* Three tabs are shut until the status is current. Asking for one opens
         the survey rather than the tab; asking for any other lets the
         respondent out, which is why the nav stays clickable behind it. */
      if (isGated(value)) { openSurvey(value); return; }
      state.tab = value;
      closeSurvey();
    },
    openSurvey: function () { openSurvey(null); },
    /* The express path: the status on file is still true, so confirming it
       counts as this session's update and opens the gated tabs. */
    confirmStatus: function () {
      state.statusUpdated = true;
      state.statusSource = 'confirmed';
    },
    surveyClose: function () { if (!state.survey.gated) closeSurvey(); },
    surveyBack: function () { state.survey.step = Math.max(0, state.survey.step - 1); },
    surveyPick: function (value) {
      var cut = value.indexOf('|');
      state.survey.answers[value.slice(0, cut)] = value.slice(cut + 1);
    },
    surveyToggle: function (value) {
      var cut = value.indexOf('|');
      var field = value.slice(0, cut);
      var option = value.slice(cut + 1);
      var picked = state.survey.answers[field];
      var only = QB.surveyData.exclusive[field];

      if (picked.indexOf(option) !== -1) {
        state.survey.answers[field] = picked.filter(function (v) { return v !== option; });
        return;
      }
      /* "Nothing new" and a list of things that happened cannot both stand. */
      if (only && option === only) { state.survey.answers[field] = [only]; return; }
      state.survey.answers[field] = picked.filter(function (v) { return v !== only; }).concat(option);
    },
    surveyNext: function () {
      var answers = state.survey.answers;
      var steps = QB.surveySteps(answers);
      var step = steps[Math.min(state.survey.step, steps.length - 1)];
      if (!QB.surveyReady(step, answers)) return;

      if (state.survey.step < steps.length - 1) { state.survey.step += 1; return; }

      state.statusUpdated = true;
      state.statusSource = 'survey';
      var gated = state.survey.gated;
      closeSurvey();
      if (gated) state.tab = gated;
    },
    mgmtNav: function (value) { state.mgmtNav = value; },
    insightsTab: function (value) { state.insightsTab = value; },
    selectAlum: function (id) { state.alumId = Number(id); },
    selectOrg: function (id) { state.orgId = Number(id); },
    range: function (value) { state.range = value; },
    adminTab: function (value) { state.adminTab = value; },
    feature: function (id) { state.featured[id] = !state.featured[id]; },
    avail: function (value) { state.avail = value; },
    skill: function (value) { state.skill = value; },
    spotlightOnly: function () { state.spotlightOnly = !state.spotlightOnly; },
    orgTab: function (value) { state.orgTab = value; },
    composeOffer: function () { state.composing = true; state.orgTab = 'My offers'; },
    cancelOffer: function () { state.composing = false; },
    selectOffer: function (id) { state.offerId = Number(id); state.composing = false; },
    offerStatus: function (value) { state.offerStatus = value; },
    offerType: function (value) { state.offer.type = value; },
    clearFilters: function () {
      state.query = '';
      state.avail = 'Any';
      state.skill = 'Any skill';
      state.spotlightOnly = false;
    },
    publishOffer: function () {
      var offer = state.offer;
      var title = offer.title.trim();
      if (!title) return;
      var id = state.offers.reduce(function (max, o) { return Math.max(max, o.id); }, 0) + 1;
      state.offers = [{
        id: id,
        title: title,
        type: offer.type,
        location: offer.loc.trim() || 'Doha',
        pay: offer.pay.trim() || 'Not stated',
        posted: 'just now',
        status: 'Open',
        tone: 'lime',
        skills: offer.skills.trim() || 'Not stated',
        funnel: { applied: 0, shortlisted: 0, interviewed: 0, hired: 0 },
        people: []
      }].concat(state.offers);
      state.offerId = id;
      state.composing = false;
      /* A status filter would otherwise hide what was just published. */
      state.offerStatus = 'All';
      state.offer = { title: '', loc: '', pay: '', skills: '', type: offer.type, prioritise: offer.prioritise };
    }
  };

  /* Editable fields, keyed by the `data-field` on the control. */
  var fields = {
    query: function (v) { state.query = v; },
    cohort: function (v) { state.cohort = v; },
    range: function (v) { state.range = v; },
    offerTitle: function (v) { state.offer.title = v; },
    offerLoc: function (v) { state.offer.loc = v; },
    offerPay: function (v) { state.offer.pay = v; },
    offerSkills: function (v) { state.offer.skills = v; },
    prioritise: function (v) { state.offer.prioritise = v; }
  };

  /* `survey.company` and friends write straight into the answer sheet rather
     than needing an entry each. */
  function setField(name, value) {
    if (name.indexOf('survey.') === 0) {
      state.survey.answers[name.slice(7)] = value;
      return true;
    }
    if (!fields[name]) return false;
    fields[name](value);
    return true;
  }

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
            data-act="screen" data-arg="${screen.id}" aria-pressed="${String(on)}">${screen.label}</button>`;
        })}
      </div>
    </div>`;
  }

  var root = document.getElementById('app');

  /* A full re-render blows away focus, so note where the caret was first.
     Survey options are answered by clicking a button rather than typing, so
     those are worth putting back too — otherwise every answer drops a
     keyboard user back to the top of the dialog. */
  function captureFocus() {
    var el = document.activeElement;
    if (!el || !el.dataset) return null;

    if (el.dataset.field) {
      var snapshot = { sel: '[data-field="' + el.dataset.field + '"]' };
      try {
        snapshot.start = el.selectionStart;
        snapshot.end = el.selectionEnd;
      } catch (e) { /* selection is not readable on every input type */ }
      return snapshot;
    }
    if (el.dataset.act && el.closest('.survey')) {
      return { sel: '[data-act="' + el.dataset.act + '"]' +
        (el.dataset.arg ? '[data-arg="' + el.dataset.arg.replace(/"/g, '\\"') + '"]' : '') };
    }
    return null;
  }

  function restoreFocus(snapshot) {
    if (!snapshot) return;
    var el;
    try { el = root.querySelector(snapshot.sel); } catch (e) { return; }
    if (!el || el.disabled) return;
    el.focus();
    if (snapshot.start == null) return;
    try { el.setSelectionRange(snapshot.start, snapshot.end); } catch (e) { /* ditto */ }
  }

  function render() {
    var snapshot = captureFocus();
    root.innerHTML = String(html`${protoBar()}<main class="screen">${QB.screens[state.screen](state)}</main>`);
    document.body.dataset.screen = state.screen;
    /* Locks the page behind the dialog and lifts the nav bars above the blur. */
    document.body.dataset.survey =
      state.screen === 'alumni' && state.survey.open ? 'open' : 'closed';
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
    var value = control.type === 'checkbox' ? control.checked : control.value;
    if (setField(control.dataset.field, value)) render();
  });

  /* Radios and selects fire `change`, not `input`, in some browsers. */
  root.addEventListener('change', function (event) {
    var control = event.target.closest('[data-field]');
    if (!control || (control.type !== 'radio' && control.tagName !== 'SELECT')) return;
    if (setField(control.dataset.field, control.value)) render();
  });

  /* Escape leaves a survey that was opened by choice; a gated one has to be
     answered or navigated away from. */
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !state.survey.open || state.survey.gated) return;
    closeSurvey();
    render();
  });

  function readHash() {
    var id = location.hash.slice(1);
    return QB.screens[id] ? id : null;
  }

  window.addEventListener('hashchange', function () {
    var id = readHash();
    if (id && id !== state.screen) { state.screen = id; closeSurvey(); render(); }
  });

  state.screen = readHash() || state.screen;
  render();
})(window.QB = window.QB || {});
