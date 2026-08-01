/* Management / operations. Two workspaces, each a left sidebar plus a body:
   Insights (five analytics views registered in QB.insightTabs by the
   insights-*.js files, over a persistent KPI strip and a filter rail) and
   Programmes (events, spotlight, Ideastorm, referrals).

   Insights owns one call to QB.analytics.compute per render: the rail's nine
   selects make the filter object, and the result is what the strip and the
   active tab draw. The only thing read off the store directly is the size of
   the whole roster, which the lede needs to say what fraction is in view. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  var NAV = ['Insights', 'Alumni', 'Programmes', 'Partners'];

  function header(state, viewer) {
    var current = state.mgmtNav || 'Insights';
    return html`<header class="appbar appbar--ink">
      <a class="appbar__brand" href="#management">
        ${ui.brandDots('onink')}
        <span class="appbar__name">QSTP Beyond</span>
        <span class="appbar__scope">Operations</span>
      </a>
      <nav class="appbar__nav" aria-label="Operations">
        ${NAV.map(function (item) {
          var on = item === current;
          return html`<button type="button" class="${ui.cx('navtab', 'navtab--ink', { 'is-active': on })}"
            data-act="mgmtNav" data-arg="${item}"
            ${on ? ui.raw('aria-current="page"') : ''}>${item}</button>`;
        })}
      </nav>
      <div class="user">
        <span class="avatar avatar--ghost">${viewer.initials}</span>
        <span class="user__text">
          <span class="user__name">${viewer.name}</span>
          <span class="user__meta">${viewer.meta}</span>
        </span>
      </div>
    </header>`;
  }

  /* ── Insights ────────────────────────────────────────────────────── */

  function kpiStrip(kpis) {
    return html`<div class="${ui.cx('kpis', kpis.length === 5 && 'kpis--5')}">
      ${kpis.map(function (kpi) {
        return html`<article class="kpi" style="--kpi-rule:${kpi.rule}">
          <h2 class="kpi__label">${kpi.label}</h2>
          <p class="kpi__row">
            <span class="kpi__value">${kpi.value}</span>
            <span class="${ui.cx('kpi__delta', 'kpi__delta--' + kpi.deltaTone)}">${kpi.delta}</span>
          </p>
          <p class="kpi__note">${kpi.note}</p>
        </article>`;
      })}
    </div>`;
  }
  /* Shared with src/screens/report.js, which draws the same strip above the
     printed sections. */
  QB.kpiStrip = kpiStrip;

  var SIDE_TABS = [
    { id: 'Outcomes', hint: 'ROI & data health' },
    { id: 'Engagement', hint: 'Platform activity' },
    { id: 'Pipeline', hint: 'Jobs & referrals' },
    { id: 'Community', hint: 'Ideastorm & events' },
    { id: 'Partners', hint: 'Organizations' }
  ];
  /* The export report walks these same five sections, in the same order. */
  QB.insightSideTabs = SIDE_TABS;

  /* Section sidebar — shared by both workspaces. */
  function sideNav(title, tabs, active, action) {
    return html`<nav class="side-nav" aria-label="${title} sections">
      <h2 class="side-nav__title">${title}</h2>
      ${tabs.map(function (t) {
        var on = t.id === active;
        return html`<button type="button" class="${ui.cx('side-nav__tab', { 'is-active': on })}"
          data-act="${action}" data-arg="${t.id}" ${on ? ui.raw('aria-current="page"') : ''}>
          <span class="side-nav__name">${t.id}</span>
          <span class="side-nav__hint">${t.hint}</span>
        </button>`;
      })}
    </nav>`;
  }

  /* Employer is the one rail vocabulary the engine does not derive: it is a
     grouping of person.employer against the partner list rather than a list
     of values, so the three options are fixed here. */
  var EMPLOYER_OPTIONS = ['All employers', 'QSTP companies', 'External companies'];

  /* The filter object every view on this workspace is read against. The eight
     rail selects live on state.ins; the time range stays on state.range,
     because the rail and the page head have to name the same window.
     Shared with src/screens/report.js, which computes the export off the same
     merge rather than a second copy of it. */
  function insightFilters(state) {
    var ins = state.ins || {};
    var f = {};
    Object.keys(ins).forEach(function (key) { f[key] = ins[key]; });
    f.range = state.range;
    return f;
  }
  QB.insightFilters = insightFilters;

  function insightsView(state) {
    var tab = QB.insightTabs[state.insightsTab] ? state.insightsTab : 'Outcomes';
    /* Computed once and handed down: the strip, the rail and the active tab
       must all describe the same selection, and compute is memoized on the
       filter object anyway. */
    var a = QB.analytics.compute(QB.insightFilters(state));
    var v = a.vocab;
    var f = a.filters;

    /* Every select is wired — [label, options, field, current] — so a change
       lands on state.ins and the next render narrows the whole workspace. */
    var filters = [
      ['Time range', QB.filters.ranges, 'range', state.range],
      ['Cycle', v.cycles, 'ins.cycle', f.cycle],
      ['Outcome', v.outcomes, 'ins.outcome', f.outcome],
      ['Skill', v.skills, 'ins.skill', f.skill],
      ['Host startup', v.hosts, 'ins.host', f.host],
      ['Current employer', EMPLOYER_OPTIONS, 'ins.employer', f.employer],
      ['Location', v.locations, 'ins.location', f.location],
      ['User type', v.userTypes, 'ins.userType', f.userType],
      ['Engagement', v.engagementLevels, 'ins.engagement', f.engagement]
    ];

    /* A filtered selection has to say so — otherwise a narrowed donut reads
       as the whole roster having changed shape. */
    var roster = QB.store.data.people.length;
    var lede = a.total < roster
      ? a.total.toLocaleString() + ' of ' + roster.toLocaleString() + ' alumni in view'
      : a.total.toLocaleString() + ' tracked alumni · every figure below is computed from them';

    return html`<div class="page-head">
      <div>
        <h1 class="h1--sm">Insights</h1>
        <p class="page-head__lede page-head__lede--sm">${lede}</p>
      </div>
      <div class="page-head__actions page-head__actions--end">
        <p class="page-head__note">Showing ${state.range.toLowerCase()}</p>
        <button type="button" class="btn btn-secondary" data-act="exportInsights">Export all insights</button>
      </div>
    </div>
    ${kpiStrip(a.kpis)}
    <div class="workspace">
      <aside class="side">
        ${sideNav('Insights', SIDE_TABS, tab, 'insightsTab')}
        ${ui.selectRail('Filters · all views', filters, 'Reset filters', 'resetInsights')}
      </aside>
      <div class="workspace__body">${QB.insightTabs[tab](state, a)}</div>
    </div>`;
  }

  /* ── Programmes ──────────────────────────────────────────────────── */

  var PROGRAMME_TABS = [
    { id: 'Events', hint: 'Calendar & capacity', action: 'Create event',
      sub: 'Scheduled events and how they are filling' },
    { id: 'Spotlight', hint: 'Nominations & slots', action: 'Add nominee',
      sub: 'Who is queued to be featured, and when' },
    { id: 'Ideastorm', hint: 'Live ideas', action: 'Ideastorm settings',
      sub: 'Ideas publish directly — this is what is live and how it is moving' },
    { id: 'Referrals', hint: 'Verification queue', action: 'Export queue',
      sub: 'Confirm the alum and their consent before it reaches the employer' }
  ];

  function eventsTable(events) {
    return html`<table class="table">
      <thead><tr>
        <th>Event</th><th>Date</th><th>Registered</th><th>Status</th><th><span class="sr-only">Actions</span></th>
      </tr></thead>
      <tbody>
        ${events.map(function (event) {
          return html`<tr>
            <td class="td-strong">${event.title}</td>
            <td class="td-muted">${event.date}</td>
            <td><span class="td-num">${event.reg}</span><span class="td-cap"> / ${event.cap}</span></td>
            <td>${ui.tag(event.status, event.tone)}</td>
            <td class="td-end"><a href="#">Edit</a></td>
          </tr>`;
        })}
      </tbody>
    </table>`;
  }

  function nominees(people, featured) {
    return html`<ul class="nominees">
      ${people.map(function (person) {
        var on = !!featured[person.id];
        return html`<li class="nominee">
          <span class="tile tile--sm" style="background:${person.tile}">${person.initials}</span>
          <div class="nominee__body">
            <h3 class="nominee__name">${person.name}</h3>
            <p class="nominee__meta">${person.role} · nominated by ${person.by}</p>
          </div>
          <span class="nominee__slot">${person.slot}</span>
          <button type="button" class="${ui.cx('chip-btn', 'chip-btn--pill', { 'is-active': on })}"
                  data-act="feature" data-arg="${person.id}" aria-pressed="${String(on)}">
            ${on ? 'Featured' : 'Feature'}
          </button>
        </li>`;
      })}
    </ul>`;
  }

  /* Ideas go live without review, so this is oversight rather than a queue:
     what is running, how it is moving, and where to send it next. */
  function liveIdeas(items) {
    return html`<div class="mods">
      ${items.map(function (item) {
        return html`<article class="mod">
          <div class="mod__head">
            <h3 class="mod__title">${item.title}</h3>
            ${ui.tag(item.stage, item.tone)}
            ${item.reports ? ui.tag(item.reports, 'warn') : ''}
            <span class="mod__team">${item.meta}</span>
          </div>
          <p class="mod__note">${item.note}</p>
          <div class="mod__actions">
            <button type="button" class="btn btn-primary btn-sm">Route to incubation</button>
            <button type="button" class="btn btn-secondary btn-sm">Feature in spotlight</button>
            <button type="button" class="btn btn-ghost btn-sm">Archive</button>
          </div>
        </article>`;
      })}
    </div>`;
  }

  function referralQueue(referrals) {
    return html`<table class="table">
      <thead><tr>
        <th>Alum</th><th>Referred by</th><th>Destination</th><th>Submitted</th><th>Status</th>
        <th><span class="sr-only">Actions</span></th>
      </tr></thead>
      <tbody>
        ${referrals.map(function (r) {
          return html`<tr>
            <td class="td-strong">${r.alum}</td>
            <td class="td-muted">${r.referrer}</td>
            <td class="td-muted">${r.dest}</td>
            <td class="td-quiet">${r.date}</td>
            <td>${ui.tag(r.status, r.tone)}</td>
            <td class="td-end"><button type="button" class="btn btn-ghost btn-sm">${r.action}</button></td>
          </tr>`;
        })}
      </tbody>
    </table>`;
  }

  function programmeSection(tab, state, d) {
    if (tab.id === 'Events') return { body: eventsTable(d.adminEvents), table: true };
    if (tab.id === 'Spotlight') return { body: nominees(d.spotlight, state.featured), table: false };
    if (tab.id === 'Ideastorm') return { body: liveIdeas(d.ideaAdmin), table: false };
    return { body: referralQueue(d.referralAdmin), table: true };
  }

  function programmes(state, d) {
    var active = state.adminTab;
    var tab = PROGRAMME_TABS.filter(function (t) { return t.id === active; })[0] || PROGRAMME_TABS[0];
    var section = programmeSection(tab, state, d);

    return html`<div class="page-head">
      <div>
        <h1 class="h1--sm">Programmes</h1>
        <p class="page-head__lede page-head__lede--sm">Events, spotlight, Ideastorm and the referral queue</p>
      </div>
    </div>
    <div class="workspace">
      <aside class="side">${sideNav('Programmes', PROGRAMME_TABS, tab.id, 'adminTab')}</aside>
      <div class="workspace__body">
        <section class="panel" aria-label="${tab.id}">
          <div class="panel__head panel__head--bar">
            <div>
              <h2 class="panel__title panel__title--sm">${tab.id}</h2>
              <p class="panel__sub">${tab.sub}</p>
            </div>
            <div class="panel__actions">
              <button type="button" class="btn btn-primary btn-sm">${tab.action}</button>
            </div>
          </div>
          <hr class="${ui.cx('rule', section.table && 'rule--table')}">
          ${section.body}
        </section>
      </div>
    </div>`;
  }

  QB.screens = QB.screens || {};
  QB.screens.management = function (state) {
    var d = QB.data;
    var view = state.mgmtNav === 'Programmes' ? programmes(state, d)
      : QB.mgmtViews[state.mgmtNav] ? QB.mgmtViews[state.mgmtNav](state)
      : insightsView(state);
    return html`${header(state, d.opsViewer)}
    <div class="page page--tight">${view}</div>`;
  };
})(window.QB = window.QB || {});
