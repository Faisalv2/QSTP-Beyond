/* Insights → Outcomes: the ROI story, then data health & reporting.
   Presentation only — every figure arrives computed, in the analytics object
   the workspace hands down, and is drawn here exactly as given. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function distribution(ins) {
    return html`<section class="panel" aria-label="Outcome distribution">
      <h2 class="panel__title panel__title--sm">Outcome distribution</h2>
      <p class="panel__sub">Current status of the ${ins.total.toLocaleString()} people in this selection</p>
      <hr class="rule">
      <div class="donut-row">
        ${ui.donut(ins.outcomes, ins.outcomeCentre)}
        <ul class="legend">
          ${ins.outcomes.map(function (slice) {
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

  function conversion(ins) {
    return html`<section class="panel" aria-label="Hire-to-ecosystem conversion">
      <div class="panel__head panel__head--split">
        <div>
          <h2 class="panel__title panel__title--sm">Hire-to-ecosystem conversion</h2>
          <p class="panel__sub">Share of each cycle now at a partner company or in incubation</p>
        </div>
        <p class="figure">
          <span class="figure__value">${ins.conversion.headline}</span>
          <span class="figure__change">${ins.conversion.change}</span>
        </p>
      </div>
      <hr class="rule rule--snug">
      ${ui.lineChart(ins.conversion)}
    </section>`;
  }

  function timeToEmp(ins) {
    var t = ins.timeToEmployment;
    return html`<section class="panel" aria-label="Time to employment">
      <div class="panel__head panel__head--split">
        <div>
          <h2 class="panel__title panel__title--sm">Time to employment</h2>
          <p class="panel__sub">Average months from programme end to first role or founding</p>
        </div>
        <p class="figure">
          <span class="figure__value">${t.value}</span>
          <span class="figure__change">${t.change}</span>
        </p>
      </div>
      <hr class="rule">
      ${ui.hbars(t.byCohort, { max: t.max })}
    </section>`;
  }

  function retention(ins) {
    return html`<section class="panel" aria-label="Retention in the Qatar ecosystem">
      <h2 class="panel__title panel__title--sm">Retention in the Qatar ecosystem</h2>
      <p class="panel__sub">Where working alumni are today</p>
      <hr class="rule">
      ${ui.stackBar(ins.retention, true)}
      ${ui.keys(ins.retention.map(function (s) { return { label: s.label, color: s.color, val: s.pct + '%' }; }))}
      <p class="panel__foot">${ins.retentionNote}</p>
    </section>`;
  }

  function employers(ins) {
    return html`<section class="panel" aria-label="Top employers of alumni">
      <h2 class="panel__title panel__title--sm">Top employers</h2>
      <p class="panel__sub">Companies hiring alumni — host startups vs external</p>
      <hr class="rule">
      ${ui.hbars(ins.employers.map(function (e) {
        return { label: e.label, num: e.num,
          extra: ui.tag(e.kind, e.kind === 'Host' ? 'teal' : 'mute') };
      }))}
    </section>`;
  }

  function startups(ins) {
    return html`<section class="panel" aria-label="Startups founded by alumni">
      <div class="panel__head panel__head--split">
        <div>
          <h2 class="panel__title panel__title--sm">Startups founded by alumni</h2>
          <p class="panel__sub">Cumulative across the intake cycles in view</p>
        </div>
        <p class="figure">
          <span class="figure__value">${ins.startups.total}</span>
          <span class="figure__change">${ins.startups.change}</span>
        </p>
      </div>
      <hr class="rule rule--snug">
      ${ui.lineChart(ins.startups.series)}
      <p class="chip-set chip-set--foot">
        ${ins.startups.status.map(function (s) { return ui.tag(s.label, s.tone); })}
      </p>
    </section>`;
  }

  function progression(ins) {
    return html`<section class="panel" aria-label="Career progression">
      <h2 class="panel__title panel__title--sm">Career progression</h2>
      <p class="panel__sub">Seniority mix by years since the programme</p>
      <hr class="rule">
      ${ins.progression.rows.map(function (row) {
        return html`<div class="stackrow">
          <p class="stackrow__label">${row.label}</p>
          ${ui.stackBar(row.segs.map(function (pct, i) {
            var key = ins.progression.key[i];
            return { label: key.label, pct: pct, color: key.color };
          }))}
        </div>`;
      })}
      ${ui.keys(ins.progression.key)}
    </section>`;
  }

  function byCohort(ins) {
    return html`<section class="panel" aria-label="Outcomes by cycle">
      <h2 class="panel__title panel__title--sm">Outcomes by cycle</h2>
      <p class="panel__sub">Intake-to-intake comparison of headline outcomes</p>
      <hr class="rule rule--table">
      <table class="table">
        <thead><tr><th>Cycle</th><th>Employed</th><th>Founded</th><th>In ecosystem</th><th>Unreported</th></tr></thead>
        <tbody>
          ${ins.byCohort.map(function (row) {
            return html`<tr>
              <td class="td-strong">${row.cohort}</td>
              <td>${row.employed}</td><td>${row.founded}</td>
              <td>${row.eco}</td><td class="td-muted">${row.unreported}</td>
            </tr>`;
          })}
        </tbody>
      </table>
    </section>`;
  }

  function byField(ins) {
    return html`<section class="panel" aria-label="Conversion by field">
      <h2 class="panel__title panel__title--sm">Conversion by field</h2>
      <p class="panel__sub">Share of each specialization now employed or founding</p>
      <hr class="rule">
      ${ui.hbars(ins.byField.map(function (f) {
        return { label: f.label, num: f.num, display: f.num + '%' };
      }), { max: 100 })}
    </section>`;
  }

  /* — Data health — */

  function freshness(ins) {
    return html`<section class="panel" aria-label="Status freshness">
      <h2 class="panel__title panel__title--sm">Status freshness</h2>
      <p class="panel__sub">Alumni whose career status was confirmed recently</p>
      <hr class="rule">
      ${ui.hbars(ins.freshness.rows, { max: 100 })}
      <p class="panel__foot">${ins.freshness.note}</p>
    </section>`;
  }

  function completeness(ins) {
    return html`<section class="panel" aria-label="Profile completeness">
      <h2 class="panel__title panel__title--sm">Profile completeness</h2>
      <p class="panel__sub">How much career detail alumni have filled in</p>
      <hr class="rule">
      ${ui.stackBar(ins.completeness.segs, true)}
      ${ui.keys(ins.completeness.segs.map(function (s) { return { label: s.label, color: s.color, val: s.pct + '%' }; }))}
      <p class="panel__foot">${ins.completeness.note}</p>
    </section>`;
  }

  function responseTrend(ins) {
    var t = ins.responseTrend;
    return html`<section class="panel" aria-label="Update response rate">
      <div class="panel__head panel__head--split">
        <div>
          <h2 class="panel__title panel__title--sm">Update response rate</h2>
          <p class="panel__sub">Share of alumni confirming status each quarter</p>
        </div>
        <p class="figure">
          <span class="figure__value">${t.headline}</span>
          <span class="figure__change">${t.change}</span>
        </p>
      </div>
      <hr class="rule rule--snug">
      ${ui.lineChart(t)}
    </section>`;
  }

  function staleQueue(ins) {
    return html`<section class="panel" aria-label="Follow-up queue">
      <h2 class="panel__title panel__title--sm">Follow-up queue</h2>
      <p class="panel__sub">Alumni with no status update in 12+ months</p>
      <hr class="rule rule--table">
      <table class="table">
        <thead><tr><th>Alum</th><th>Cycle</th><th>Last update</th><th><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>
          ${ins.staleQueue.map(function (row) {
            return html`<tr>
              <td class="td-strong">${row.name}</td>
              <td class="td-muted">${row.cohort}</td>
              <td class="td-quiet">${row.last}</td>
              <td class="td-end"><button type="button" class="btn btn-ghost btn-sm">Send nudge</button></td>
            </tr>`;
          })}
        </tbody>
      </table>
    </section>`;
  }

  QB.insightTabs = QB.insightTabs || {};
  QB.insightTabs.Outcomes = function (state, ins) {
    return html`<div class="grid-analysis grid-analysis--lead">${distribution(ins)}${conversion(ins)}</div>
    <div class="grid-half">${timeToEmp(ins)}${retention(ins)}</div>
    <div class="grid-analysis">${employers(ins)}${startups(ins)}</div>
    <div class="grid-half">${progression(ins)}${byField(ins)}</div>
    <div class="panel--gap">${byCohort(ins)}</div>
    ${ui.zone('Data health & reporting compliance')}
    <div class="grid-half">${freshness(ins)}${completeness(ins)}</div>
    <div class="grid-analysis">${responseTrend(ins)}${staleQueue(ins)}</div>`;
  };
})(window.QB = window.QB || {});
