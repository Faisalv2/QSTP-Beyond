/* Management / operations — how QSTP reads the alumni programme. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  var NAV = ['Insights', 'Alumni', 'Programmes', 'Partners'];

  function header(state) {
    return html`<header class="appbar appbar--ink">
      <a class="appbar__brand" href="#management">
        ${ui.brandDots('onink')}
        <span class="appbar__name">QSTP Beyond</span>
        <span class="appbar__scope">Operations</span>
      </a>
      <nav class="appbar__nav appbar__nav--ink" aria-label="Operations">
        ${NAV.map(function (item, i) {
          return html`<a href="#" ${i === 0 ? ui.raw('aria-current="page"') : ''}>${item}</a>`;
        })}
      </nav>
      <div class="segbar" role="group" aria-label="Reporting range">
        ${ui.chipRow(QB.filters.ranges, state.range, 'range', 'seg')}
      </div>
      <button type="button" class="btn btn-on-ink">Export</button>
    </header>`;
  }

  function kpiCards(kpis) {
    return html`<div class="kpis">
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

  function outcomesPanel(d) {
    return html`<section class="panel" aria-labelledby="outcomes-title">
      <h2 class="panel__title panel__title--sm" id="outcomes-title">Outcome breakdown</h2>
      <p class="panel__sub">Where the ${d.trackedAlumni.toLocaleString()} alumni are today</p>
      <hr class="rule">
      <div class="donut-row">
        ${ui.donut(d.outcomes, d.outcomeCentre)}
        <ul class="legend">
          ${d.outcomes.map(function (slice) {
            return html`<li class="legend__row">
              <span class="legend__swatch" style="background:${slice.color}"></span>
              <span class="legend__label">${slice.label}</span>
              <span class="legend__pct">${slice.pct.toFixed(1)}%</span>
              <span class="legend__n">${slice.n}</span>
            </li>`;
          })}
        </ul>
      </div>
    </section>`;
  }

  function conversionPanel(chart) {
    return html`<section class="panel" aria-labelledby="conversion-title">
      <div class="panel__head panel__head--split">
        <div>
          <h2 class="panel__title panel__title--sm" id="conversion-title">Conversion into the QSTP ecosystem</h2>
          <p class="panel__sub">Interns who later joined an incubatee, founded, or entered the pipeline</p>
        </div>
        <p class="figure">
          <span class="figure__value">${chart.headline}</span>
          <span class="figure__change">${chart.change}</span>
        </p>
      </div>
      <hr class="rule rule--snug">
      ${ui.lineChart(chart)}
    </section>`;
  }

  function engagementPanel(groups) {
    return html`<section class="panel" aria-labelledby="engagement-title">
      <h2 class="panel__title panel__title--sm" id="engagement-title">Status response rate</h2>
      <p class="panel__sub">Alumni who confirmed their career status this quarter</p>
      <hr class="rule">
      <div class="bars">
        ${groups.map(function (group) {
          return html`<div class="bar">
            <p class="bar__head"><span>${group.label}</span><span class="bar__pct">${group.pct}%</span></p>
            <div class="bar__track" role="img" aria-label="${group.label}: ${group.pct} percent">
              <span class="bar__fill" style="width:${group.pct}%;background:${group.color}"></span>
            </div>
          </div>`;
        })}
      </div>
      <p class="panel__foot">Referral perks lifted response by <strong>+17 pts</strong>
        among cohorts that earned points in the last 90 days.</p>
    </section>`;
  }

  var ADMIN_ACTION = {
    Events: 'Create event',
    Spotlight: 'Add nominee',
    Ideastorm: 'Moderation rules'
  };

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
                  data-act="feature" data-arg="${person.id}" aria-pressed="${on}">
            ${on ? 'Featured' : 'Feature'}
          </button>
        </li>`;
      })}
    </ul>`;
  }

  function moderationQueue(items) {
    return html`<div class="mods">
      ${items.map(function (item) {
        return html`<article class="mod">
          <div class="mod__head">
            <h3 class="mod__title">${item.title}</h3>
            ${ui.tag(item.flag, item.tone)}
            <span class="mod__team">${item.team}</span>
          </div>
          <p class="mod__note">${item.note}</p>
          <div class="mod__actions">
            <button type="button" class="btn btn-primary btn-sm">Approve</button>
            <button type="button" class="btn btn-secondary btn-sm">Ask for detail</button>
            <button type="button" class="btn btn-ghost btn-sm">Route to incubation</button>
          </div>
        </article>`;
      })}
    </div>`;
  }

  function adminPanel(state, d) {
    var body = state.adminTab === 'Events' ? eventsTable(d.adminEvents)
      : state.adminTab === 'Spotlight' ? nominees(d.spotlight, state.featured)
      : moderationQueue(d.moderation);

    return html`<section class="panel panel--flush" aria-label="Programme admin">
      <div class="tabs" role="tablist">
        ${QB.filters.adminTabs.map(function (label) {
          var on = label === state.adminTab;
          return html`<button type="button" role="tab" aria-selected="${on}"
            class="${ui.cx('tab', { 'is-active': on })}"
            data-act="adminTab" data-arg="${label}">${label}</button>`;
        })}
        <button type="button" class="btn btn-primary btn-sm tabs__action">${ADMIN_ACTION[state.adminTab]}</button>
      </div>
      <hr class="rule rule--flush">
      <div class="admin-body">${body}</div>
    </section>`;
  }

  QB.screens = QB.screens || {};
  QB.screens.management = function (state) {
    var d = QB.data;

    return html`${header(state)}
    <div class="page page--tight">
      <div class="page-head">
        <div>
          <h1 class="h1--sm">Alumni outcomes</h1>
          <p class="page-head__lede page-head__lede--sm">${d.trackedAlumni.toLocaleString()} tracked alumni · data refreshed 06:00 AST</p>
        </div>
        <p class="page-head__note">Showing ${state.range.toLowerCase()}</p>
      </div>

      ${kpiCards(d.kpis)}

      <div class="grid-analysis">
        ${outcomesPanel(d)}
        ${conversionPanel(d.conversion)}
      </div>

      <div class="grid-analysis">
        ${engagementPanel(d.engagement)}
        ${adminPanel(state, d)}
      </div>
    </div>`;
  };
})(window.QB = window.QB || {});
