/* The printed report behind "Export all insights": one document holding all
   five Insights sections — Outcomes, Engagement, Pipeline, Community,
   Partners — computed under whatever filters are on screen when the button
   is pressed. Zero-dependency means no PDF library; window.print() is the
   PDF engine, so this file's only job is to build a print-formatted DOM tree
   and hand it to src/app.js, which mounts it outside #app and calls print.

   Every figure comes from a single QB.analytics.compute call, reusing
   QB.insightFilters — the same merge management.js's insightsView uses — so
   the report can never show numbers the on-screen rail could not have
   produced. The five section bodies are QB.insightTabs[id](state, a): the
   exact markup the screen draws, not a re-derived summary of it. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function rangeWords(range) {
    if (range === '90 days') return 'last 90 days';
    if (range === 'All time') return 'all time';
    return 'last 12 months';
  }

  /* Rail label for each ins.* field, in the rail's own order (minus Time
     range, which the cover already states as the reporting window). */
  var FILTER_LABELS = {
    cycle: 'Cycle',
    outcome: 'Outcome',
    skill: 'Skill',
    host: 'Host startup',
    employer: 'Employer',
    location: 'Location',
    userType: 'User type',
    engagement: 'Engagement'
  };

  /* Only the filters that differ from QB.analytics.defaults() are worth
     printing — a clean rail should not read as nine facts, just one. `f` is
     the raw merged filter object (QB.insightFilters' output), not the
     normalized one compute() returns: normalize() rewrites a display label
     like 'Founded a company' to the status key 'Founder', which would print
     the wrong word for the same reason the rail never shows raw keys. */
  function filterSummary(f) {
    var d = QB.analytics.defaults();
    var parts = [];
    Object.keys(FILTER_LABELS).forEach(function (key) {
      if (f[key] !== d[key]) parts.push(FILTER_LABELS[key] + ' ' + f[key]);
    });
    return parts.length ? 'Filters: ' + parts.join(' · ') : 'Filters: none — full roster';
  }

  function cover(state, f, a) {
    var roster = QB.store.data.people.length;
    var rosterLine = a.total < roster
      ? a.total.toLocaleString() + ' of ' + roster.toLocaleString() + ' alumni in view'
      : a.total.toLocaleString() + ' tracked alumni · every figure below is computed from them';

    return html`<header class="report__cover">
      <p class="report__eyebrow">QSTP Beyond · Management insights</p>
      <h1 class="report__title">Insights report</h1>
      <p class="report__line">Reporting window: ${rangeWords(state.range)}</p>
      <p class="report__line">${rosterLine}</p>
      <p class="report__line">${filterSummary(f)}</p>
    </header>`;
  }

  function section(tab, state, a) {
    return html`<section class="report__section" aria-label="${tab.id}">
      <div class="report__section-head">
        <h2 class="report__section-title">${tab.id}</h2>
        <p class="report__section-hint">${tab.hint}</p>
      </div>
      ${QB.insightTabs[tab.id](state, a)}
    </section>`;
  }

  /* The one entry point: a full report for the state as it stands right now.
     Returns markup only — src/app.js owns the #report node it is poured
     into and the window.print() call around it. */
  QB.buildReport = function (state) {
    var f = QB.insightFilters(state);
    var a = QB.analytics.compute(f);

    return html`${cover(state, f, a)}
    ${QB.kpiStrip(a.kpis)}
    ${QB.insightSideTabs.map(function (tab) { return section(tab, state, a); })}`;
  };
})(window.QB = window.QB || {});
