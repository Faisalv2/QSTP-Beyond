/* Insights → Pipeline: the job-offer funnel and referral analytics.
   Presentation only. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function funnelPanel(p) {
    return html`<section class="panel" aria-label="Hiring funnel">
      <h2 class="panel__title panel__title--sm">Offer → application → hire</h2>
      <p class="panel__sub">Across the 47 offers posted this quarter</p>
      <hr class="rule">
      ${ui.funnel(p.funnel)}
    </section>`;
  }

  function offersPanel(p) {
    return html`<section class="panel" aria-label="Offers posted">
      <h2 class="panel__title panel__title--sm">Offers posted</h2>
      <p class="panel__sub">Per month, all organizations</p>
      <hr class="rule">
      ${ui.cols(p.offersSeries)}
    </section>`;
  }

  function skillsPanel(p) {
    return html`<section class="panel panel--gap" aria-label="Skills gap">
      <div class="panel__head panel__head--split">
        <div>
          <h2 class="panel__title panel__title--sm">In-demand skills vs alumni supply</h2>
          <p class="panel__sub">Mentions in offers and searches vs alumni who list the skill</p>
        </div>
        ${ui.keys(p.skillsKey)}
      </div>
      <hr class="rule">
      <div class="pair-grid">
        ${p.skillsGap.map(function (s) {
          return html`<div class="pair">
            <p class="pair__label">${s.label}</p>
            <div class="pair__row">
              <span class="pair__track"><span class="pair__fill" style="width:${(s.demand / p.skillsMax * 100).toFixed(1)}%;background:${p.skillsKey[0].color}"></span></span>
              <span class="pair__val">${s.demand}</span>
            </div>
            <div class="pair__row">
              <span class="pair__track"><span class="pair__fill" style="width:${(s.supply / p.skillsMax * 100).toFixed(1)}%;background:${p.skillsKey[1].color}"></span></span>
              <span class="pair__val">${s.supply}</span>
            </div>
          </div>`;
        })}
      </div>
    </section>`;
  }

  function refTrend(p) {
    return html`<section class="panel" aria-label="Referrals over time">
      <h2 class="panel__title panel__title--sm">Referrals over time</h2>
      <p class="panel__sub">Submitted per quarter</p>
      <hr class="rule">
      ${ui.cols(p.refTrend)}
    </section>`;
  }

  function topReferrers(p) {
    return html`<section class="panel" aria-label="Top referrers">
      <h2 class="panel__title panel__title--sm">Top referrers</h2>
      <p class="panel__sub">Most active this year</p>
      <hr class="rule">
      <ul class="rows">
        ${p.topReferrers.map(function (r) {
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

  function refCompanies(p) {
    return html`<section class="panel" aria-label="Companies gaining alumni via referrals">
      <h2 class="panel__title panel__title--sm">Hired via referral</h2>
      <p class="panel__sub">Where referred alumni landed</p>
      <hr class="rule">
      ${ui.hbars(p.refCompanies)}
    </section>`;
  }

  QB.insightTabs = QB.insightTabs || {};
  QB.insightTabs.Pipeline = function () {
    var p = QB.insights.pipeline;
    return html`${ui.statsRow(p.jobStats)}
    <div class="grid-analysis">${funnelPanel(p)}${offersPanel(p)}</div>
    ${skillsPanel(p)}
    ${ui.zone('Referrals')}
    ${ui.statsRow(p.refStats)}
    <div class="grid-third">${refTrend(p)}${topReferrers(p)}${refCompanies(p)}</div>`;
  };
})(window.QB = window.QB || {});
