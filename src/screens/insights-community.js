/* Insights → Community: Ideastorm, spotlight and events. Presentation only. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function categories(c) {
    return html`<section class="panel" aria-label="Ideas by category">
      <h2 class="panel__title panel__title--sm">Ideas by category</h2>
      <p class="panel__sub">The 38 live ideas, by tag</p>
      <hr class="rule">
      ${ui.hbars(c.categories)}
    </section>`;
  }

  function posted(c) {
    return html`<section class="panel" aria-label="Ideas posted over time">
      <h2 class="panel__title panel__title--sm">Ideas posted</h2>
      <p class="panel__sub">Per quarter</p>
      <hr class="rule">
      ${ui.cols(c.postedSeries)}
    </section>`;
  }

  function formation(c) {
    return html`<section class="panel" aria-label="From idea to company">
      <h2 class="panel__title panel__title--sm">From idea to company</h2>
      <p class="panel__sub">All-time, since Ideastorm launched</p>
      <hr class="rule">
      ${ui.funnel(c.formation)}
    </section>`;
  }

  function sought(c) {
    return html`<section class="panel" aria-label="Most sought skills">
      <h2 class="panel__title panel__title--sm">Most sought skills</h2>
      <p class="panel__sub">What idea teams are searching for</p>
      <hr class="rule">
      ${ui.hbars(c.soughtSkills)}
    </section>`;
  }

  function spotlightImpact(c) {
    return html`<section class="panel" aria-label="Spotlight impact">
      <h2 class="panel__title panel__title--sm">Spotlight impact</h2>
      <p class="panel__sub">What being featured does for an alum</p>
      <hr class="rule">
      <div class="impact">
        <p class="figure figure--flush">
          <span class="figure__value">${c.spotlight.views}</span>
          <span class="figure__change">Profile views</span>
        </p>
        <p class="figure figure--flush">
          <span class="figure__value">${c.spotlight.offers}</span>
          <span class="figure__change">Offer invites</span>
        </p>
      </div>
      <p class="panel__foot">${c.spotlight.note}</p>
    </section>`;
  }

  function eventsPanel(c) {
    return html`<section class="panel" aria-label="Event attendance">
      <h2 class="panel__title panel__title--sm">Event attendance</h2>
      <p class="panel__sub">RSVPs vs turnout, last four events</p>
      <hr class="rule rule--table">
      <table class="table">
        <thead><tr><th>Event</th><th>Date</th><th>RSVPs</th><th>Attended</th><th>Rate</th></tr></thead>
        <tbody>
          ${c.events.map(function (row) {
            return html`<tr>
              <td class="td-strong">${row.title}</td>
              <td class="td-muted">${row.date}</td>
              <td>${row.rsvp}</td>
              <td><span class="td-num">${row.attended}</span></td>
              <td>${row.rate}</td>
            </tr>`;
          })}
        </tbody>
      </table>
      <p class="panel__foot">${c.eventNote}</p>
    </section>`;
  }

  QB.insightTabs = QB.insightTabs || {};
  QB.insightTabs.Community = function () {
    var c = QB.insights.community;
    return html`${ui.statsRow(c.stats)}
    <div class="grid-analysis">${categories(c)}${posted(c)}</div>
    <div class="grid-half">${formation(c)}${sought(c)}</div>
    ${ui.zone('Spotlight & events')}
    <div class="grid-analysis">${spotlightImpact(c)}${eventsPanel(c)}</div>`;
  };
})(window.QB = window.QB || {});
