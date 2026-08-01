/* Insights → Partners: the organization side of the platform.
   Presentation only. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function searches(pt) {
    return html`<section class="panel" aria-label="Recruiter search activity">
      <h2 class="panel__title panel__title--sm">What recruiters search for</h2>
      <p class="panel__sub">Top queries, last 90 days</p>
      <hr class="rule">
      ${ui.hbars(pt.searches)}
    </section>`;
  }

  function orgTable(pt) {
    return html`<section class="panel" aria-label="Organization activity">
      <h2 class="panel__title panel__title--sm">Organization activity</h2>
      <p class="panel__sub">Repeat posting is the satisfaction proxy — quiet orgs need a call</p>
      <hr class="rule rule--table">
      <table class="table">
        <thead><tr><th>Organization</th><th>Offers</th><th>Hires</th><th>Last active</th><th>Status</th></tr></thead>
        <tbody>
          ${pt.orgTable.map(function (row) {
            return html`<tr>
              <td class="td-strong">${row.org}</td>
              <td>${row.offers}</td>
              <td><span class="td-num">${row.hires}</span></td>
              <td class="td-quiet">${row.last}</td>
              <td>${ui.tag(row.status, row.tone)}</td>
            </tr>`;
          })}
        </tbody>
      </table>
    </section>`;
  }

  function viewed(pt) {
    return html`<section class="panel" aria-label="Most-viewed alumni profiles">
      <h2 class="panel__title panel__title--sm">Most-viewed alumni</h2>
      <p class="panel__sub">Profile views by recruiters, last 30 days</p>
      <hr class="rule">
      <ul class="rows">
        ${pt.viewed.map(function (r) {
          return html`<li class="row">
            <span class="row__body">
              <span class="row__title row__title--sm">${r.name}</span>
              <span class="row__meta">${r.meta}</span>
            </span>
            <span class="row__val">${r.val}</span>
          </li>`;
        })}
      </ul>
    </section>`;
  }

  function dormant(pt) {
    return html`<section class="panel" aria-label="Dormant organizations">
      <h2 class="panel__title panel__title--sm">Dormant organizations</h2>
      <p class="panel__sub">Candidates for re-engagement</p>
      <hr class="rule">
      <ul class="rows">
        ${pt.dormant.map(function (r) {
          return html`<li class="row">
            <span class="row__body">
              <span class="row__title row__title--sm">${r.name}</span>
              <span class="row__meta">${r.meta}</span>
            </span>
            <button type="button" class="btn btn-ghost btn-sm">Re-engage</button>
          </li>`;
        })}
      </ul>
    </section>`;
  }

  QB.insightTabs = QB.insightTabs || {};
  QB.insightTabs.Partners = function () {
    var pt = QB.insights.partners;
    return html`${ui.statsRow(pt.stats)}
    <div class="grid-analysis">${searches(pt)}${orgTable(pt)}</div>
    <div class="grid-half">${viewed(pt)}${dormant(pt)}</div>`;
  };
})(window.QB = window.QB || {});
