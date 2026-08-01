/* Insights → Engagement: platform activity. Presentation only — the figures
   arrive computed on the analytics object the workspace hands down. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function features(e) {
    return html`<section class="panel" aria-label="Feature usage">
      <h2 class="panel__title panel__title--sm">Feature usage</h2>
      <p class="panel__sub">Share of the content posted in the selected window</p>
      <hr class="rule">
      ${ui.hbars(e.features.map(function (f) {
        return { label: f.label, num: f.num, display: f.num + '%' };
      }))}
    </section>`;
  }

  function activity(e) {
    return html`<section class="panel" aria-label="Activity over time">
      <h2 class="panel__title panel__title--sm">Activity over time</h2>
      <p class="panel__sub">Logins and actions per week — watch for engagement decay</p>
      <hr class="rule rule--snug">
      ${ui.lineChart(e.activity)}
    </section>`;
  }

  function cohorts(e) {
    return html`<section class="panel" aria-label="Engagement by cycle">
      <h2 class="panel__title panel__title--sm">Engagement by cycle</h2>
      <p class="panel__sub">Share of each intake with a recently confirmed status</p>
      <hr class="rule">
      ${ui.hbars(e.cohorts, { max: 100 })}
    </section>`;
  }

  function atRisk(e) {
    return html`<section class="panel" aria-label="At-risk users">
      <h2 class="panel__title panel__title--sm">At-risk users</h2>
      <p class="panel__sub">No activity in 30+ days — a follow-up queue</p>
      <hr class="rule rule--table">
      <table class="table">
        <thead><tr><th>User</th><th>Cycle</th><th>Inactive for</th><th><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>
          ${e.atRisk.map(function (row) {
            return html`<tr>
              <td class="td-strong">${row.name}</td>
              <td class="td-muted">${row.cohort}</td>
              <td class="td-quiet">${row.last}</td>
              <td class="td-end"><button type="button" class="btn btn-ghost btn-sm">Nudge</button></td>
            </tr>`;
          })}
        </tbody>
      </table>
    </section>`;
  }

  QB.insightTabs = QB.insightTabs || {};
  QB.insightTabs.Engagement = function (state, ins) {
    var e = ins.engagement;
    return html`${ui.statsRow(e.active)}
    <div class="grid-analysis">${features(e)}${activity(e)}</div>
    <div class="grid-analysis">${cohorts(e)}${atRisk(e)}</div>`;
  };
})(window.QB = window.QB || {});
