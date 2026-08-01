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

    /* The management Insights filter rail. Its `range` member is never read —
       `state.range` above stays the single source for the time window, since
       the appbar and the rail have to agree on one value — but it is left in
       place so this object is exactly the shape QB.analytics.compute wants. */
    ins: QB.analytics.defaults(),

    /* The status survey. `statusUpdated` is per session: the three gated tabs
       stay shut until it is true, and nothing here is persisted. */
    statusUpdated: false,
    statusSource: null,
    survey: { open: false, gated: null, step: 0, answers: QB.blankAnswers() },
    profile: false
  };

  /* The one seeded person the survey and the home card write onto and read
     from. The store owns the resolution so there is a single answer to it. */
  function viewer() { return QB.store.viewer(); }

  /* ── The status survey ───────────────────────────────────────────── */

  function isGated(tab) {
    return !state.statusUpdated && QB.surveyData.gatedTabs.indexOf(tab) !== -1;
  }

  function openSurvey(gatedTab) {
    state.survey.open = true;
    state.survey.gated = gatedTab || null;
    state.survey.step = 0;
    /* Two dialogs never stack; the survey takes over from the profile that
       usually launched it, and closing it returns to the screen, not to a
       half-remembered modal underneath. */
    state.profile = false;
    /* The nav has to be on screen for the way out of a gated survey to exist. */
    if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
  }

  function closeSurvey() {
    state.survey.open = false;
    state.survey.gated = null;
    state.survey.step = 0;
    state.profile = false;
  }

  /* ── Export report ───────────────────────────────────────────────────
     #report is a print artifact, not a screen: it lives outside #app so a
     re-render of the app never clobbers it (see styles/app.css — it is
     display:none on screen and only laid out under @media print), and it is
     created lazily so the Node smoke harness, whose document stub has no
     createElement, never has to run this path at all. */
  var reportEl = null;
  function reportNode() {
    if (reportEl) return reportEl;
    reportEl = document.createElement('div');
    reportEl.id = 'report';
    reportEl.className = 'report';
    document.body.appendChild(reportEl);
    /* Registered once, on first export: the report is scratch space, so it
       is emptied the moment the print dialog closes rather than lingering
       as dead markup until the next export overwrites it. */
    window.addEventListener('afterprint', function () { reportEl.innerHTML = ''; });
    return reportEl;
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
    /* A gated survey has to be answered or navigated away from, so it does
       not surrender the screen to a dialog the reader can simply dismiss. */
    openProfile: function () {
      if (state.survey.open && state.survey.gated) return;
      state.survey.open = false;
      state.profile = true;
      if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
    },
    closeProfile: function () { state.profile = false; },
    /* The way out of a screen whose saved data no longer matches the code. */
    resetData: function () {
      QB.store.reset();
      state.statusUpdated = false;
      state.statusSource = null;
      state.survey.answers = QB.blankAnswers();
    },
    /* The express path: the status on file is still true, so confirming it
       counts as this session's update and opens the gated tabs. The record
       itself still gets a fresh timestamp — "still accurate" is itself an
       update, just not one that changes what it says. */
    confirmStatus: function () {
      var v = viewer();
      v.fresh = true;
      v.lastUpdate = 'Jul 2026';
      QB.store.save();
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

      QB.applyAnswers(viewer(), answers);
      QB.store.save();

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
    /* Both halves of the rail go back at once: the eight selects live on
       state.ins, the time range on state.range. */
    resetInsights: function () {
      state.ins = QB.analytics.defaults();
      state.range = '12 months';
    },
    /* Builds the full report at the current filter selection and hands the
       browser's print dialog the job of turning it into a PDF — every
       browser's "Save as PDF" does that for free, and the charts are inline
       SVG so they come out as vectors. Guarded so calling this under the
       Node smoke harness, which has no window.print, is a no-op rather than
       a crash. */
    exportInsights: function () {
      reportNode().innerHTML = String(QB.buildReport(state));
      if (typeof window.print === 'function') window.print();
    },
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
     than needing an entry each; `ins.cycle` and friends do the same into the
     insights filter object, which is why the rail can grow a select without
     this file growing a line. */
  function setField(name, value) {
    if (name.indexOf('survey.') === 0) {
      state.survey.answers[name.slice(7)] = value;
      return true;
    }
    if (name.indexOf('ins.') === 0) {
      state.ins[name.slice(4)] = value;
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

  /* A screen is one expression, so anything that throws inside it takes the
     whole page down — including the prototype bar you would use to navigate
     away from the broken screen. Catching here trades a blank window for a
     readable failure and a way out: the other screens still work, and the
     seed can be rebuilt without opening devtools. */
  function screenMarkup() {
    try {
      return html`<main class="screen">${QB.screens[state.screen](state)}</main>`;
    } catch (error) {
      if (window.console && console.error) console.error('[QSTP Beyond]', error);
      return html`<main class="screen"><div class="page">
        <div class="page-head"><div>
          <p class="page-head__kicker">Something went wrong</p>
          <h1 class="h1--sm">This screen could not be drawn.</h1>
          <p class="page-head__lede page-head__lede--sm">The other dashboards above still work.
            If this screen keeps failing, its saved data is probably from an older
            build — rebuilding it is safe and takes a moment.</p>
        </div></div>
        <section class="panel">
          <p class="panel__note">${String(error && error.message || error)}</p>
          <hr class="rule">
          <button type="button" class="btn btn-primary btn-sm" data-act="resetData">Rebuild seeded data</button>
        </section>
      </div></main>`;
    }
  }

  function render() {
    var snapshot = captureFocus();
    root.innerHTML = String(html`${protoBar()}${screenMarkup()}`);
    document.body.dataset.screen = state.screen;
    /* Locks the page behind whichever dialog is up and lifts the nav bars
       above the blur. Both modals live on the alumni screen. */
    document.body.dataset.modal =
      state.screen === 'alumni' && (state.survey.open || state.profile) ? 'open' : 'closed';
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
    if (event.key !== 'Escape') return;
    if (state.profile) { state.profile = false; render(); return; }
    if (!state.survey.open || state.survey.gated) return;
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
