/* Alumni → Referrals. Presentation only: the compose form holds no state and
   "Send referral" is inert until the logic pass. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function referralTable(referrals, inFlight) {
    return html`<section class="panel" aria-labelledby="referrals-title">
      <div class="panel__head">
        <h2 class="panel__title panel__title--md" id="referrals-title">Your referrals</h2>
        <p class="panel__sub">${inFlight} in flight</p>
      </div>
      <hr class="rule rule--table">
      <table class="table">
        <thead><tr><th>Alum</th><th>Referred to</th><th>Submitted</th><th>Status</th></tr></thead>
        <tbody>
          ${referrals.map(function (referral) {
            return html`<tr>
              <td>
                <span class="who">
                  <span class="avatar avatar--plain avatar--sm">${referral.initials}</span>
                  <span class="who__name">${referral.name}</span>
                </span>
              </td>
              <td class="td-muted">${referral.company}</td>
              <td class="td-quiet">${referral.date}</td>
              <td>${ui.tag(referral.status, referral.tone)}</td>
            </tr>`;
          })}
        </tbody>
      </table>
    </section>`;
  }

  function composePanel() {
    return html`<section class="panel panel--tight" aria-labelledby="refer-title">
      <h2 class="panel__title panel__title--xs" id="refer-title">Refer an alum</h2>
      <p class="panel__sub">Takes about a minute.</p>
      <hr class="rule">
      <div class="form">
        <p class="field">
          <label for="ref-name">Who are you referring?</label>
          <input class="input" id="ref-name" placeholder="Name or QSTP email">
        </p>
        <p class="field">
          <label for="ref-where">Where you’d refer them</label>
          <input class="input" id="ref-where" placeholder="Snoonu · Backend Engineer">
        </p>
        <p class="field">
          <label for="ref-why">Why they’re a fit</label>
          <textarea class="input input--note" id="ref-why"
            placeholder="We shipped the payments service together in 2024 — she led the migration."></textarea>
        </p>
        <button type="button" class="btn btn-primary btn-block">Send referral</button>
      </div>
    </section>`;
  }

  function directoryPanel(people) {
    return html`<section class="panel panel--tight" aria-labelledby="directory-title">
      <div class="panel__head panel__head--simple panel__head--snug">
        <h2 class="panel__title panel__title--xs" id="directory-title">Open to being referred</h2>
        <a class="panel__link panel__link--sm" href="#">Directory</a>
      </div>
      <ul class="rows">
        ${people.map(function (person) {
          return html`<li class="row">
            <span class="avatar avatar--sm" style="background:${person.tile}">${person.initials}</span>
            <span class="row__body">
              <span class="row__title row__title--sm">${person.name}</span>
              <span class="row__meta">${person.role}</span>
            </span>
            <button type="button" class="btn btn-ghost btn-sm">Refer</button>
          </li>`;
        })}
      </ul>
    </section>`;
  }

  QB.alumniTabs = QB.alumniTabs || {};
  QB.alumniTabs.Referrals = function () {
    var d = QB.data;
    var inFlight = d.referrals.filter(function (r) { return r.status !== 'Hired'; }).length;
    var openToRefer = d.talent.filter(function (t) { return t.availKey !== 'closed'; }).slice(0, 4);

    return html`<div class="page-head page-head--tab">
      <div>
        <p class="page-head__kicker">Referrals</p>
        <h1 class="h1--tab">Bring an alum into your team.</h1>
        <p class="page-head__lede page-head__lede--wide">Refer someone from your cohort to a role where
          you work — QSTP tracks it end to end so you never chase a recruiter.</p>
      </div>
    </div>

    ${ui.howStrip(d.referralSteps)}

    <div class="grid-split grid-split--top">
      ${referralTable(d.referrals, inFlight)}
      <div class="stack stack--sticky">
        ${composePanel()}
        ${directoryPanel(openToRefer)}
      </div>
    </div>`;
  };
})(window.QB = window.QB || {});
