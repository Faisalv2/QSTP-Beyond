/* Alumni → Job offers. Presentation only: the filter chips render their
   resting selection and the actions are inert until the logic pass. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function filterBar(jobCount) {
    return html`<div class="filter-bar">
      <div class="filter-bar__row">
        <span class="filter-bar__label">Role</span>
        ${ui.chipRow(QB.filters.roles, QB.filters.roles[0], null, 'md strong')}
      </div>
      <hr class="filter-bar__rule">
      <div class="filter-bar__row">
        <span class="filter-bar__label">Place</span>
        ${ui.chipRow(QB.filters.places, QB.filters.places[0], null, 'md')}
        <span class="filter-bar__count">${jobCount} open roles</span>
      </div>
    </div>`;
  }

  function jobCard(job) {
    return html`<article class="job">
      <span class="job__logo" style="background:${job.logoBg}">${job.initials}</span>
      <div class="job__body">
        <div class="job__head">
          <h3 class="job__title">${job.title}</h3>
          ${ui.tag(job.badge, job.badgeTone)}
        </div>
        <p class="job__meta">${job.company} · ${job.location} · ${job.type}</p>
        <p class="job__tags">
          ${job.tags.map(function (t) { return html`<span class="skill">${t}</span>`; })}
        </p>
        <p class="job__match">
          <span class="job__match-track">
            <span class="job__match-fill" style="width:${job.match}"></span>
          </span>
          <span class="job__match-label">${job.match} skills match</span>
        </p>
      </div>
      <div class="job__side">
        <p class="job__pay">${job.pay}</p>
        <p class="job__posted">Posted ${job.posted}</p>
        <button type="button" class="btn btn-primary btn-flush-label">Apply</button>
        <button type="button" class="btn btn-secondary btn-flush-label">Save for later</button>
      </div>
    </article>`;
  }

  function matchPanel(d) {
    return html`<section class="panel panel--tight" aria-labelledby="match-title">
      <div class="panel__head panel__head--simple">
        <h2 class="panel__title panel__title--xs" id="match-title">What you’re matched on</h2>
        <a class="panel__link panel__link--sm" href="#">Edit</a>
      </div>
      <p class="chip-set">
        ${d.matchSkills.map(function (s) { return html`<span class="chip-outline chip-outline--md">${s}</span>`; })}
      </p>
      <p class="panel__note">${d.matchNote}</p>
    </section>`;
  }

  function savedPanel(roles) {
    return html`<section class="panel panel--tight" aria-labelledby="saved-title">
      <div class="panel__head panel__head--simple panel__head--snug">
        <h2 class="panel__title panel__title--xs" id="saved-title">Saved roles</h2>
        <span class="panel__count">${roles.length}</span>
      </div>
      <ul class="rows">
        ${roles.map(function (role) {
          return html`<li class="row row--stacked">
            <span class="row__title">${role.title}</span>
            <span class="row__meta">${role.company} · ${role.meta}</span>
          </li>`;
        })}
      </ul>
    </section>`;
  }

  function introPanel() {
    return html`<section class="panel panel--tight panel--ink" aria-labelledby="intro-title">
      <p class="ink-kicker">Warm intro available</p>
      <h2 class="ink-title" id="intro-title">Two alumni already work at Snoonu.</h2>
      <p class="ink-body">Rashid (Cohort ’20) and Noor (Cohort ’23) can pass your profile
        to the hiring manager.</p>
      <button type="button" class="btn btn-lime">Ask for an intro</button>
    </section>`;
  }

  QB.alumniTabs = QB.alumniTabs || {};
  QB.alumniTabs['Job offers'] = function () {
    var d = QB.data;

    return html`<div class="page-head page-head--tab">
      <div>
        <p class="page-head__kicker">Job offers</p>
        <h1 class="h1--tab">Roles from host startups.</h1>
        <p class="page-head__lede page-head__lede--wide">Every role here sits inside a QSTP company,
          and alumni applications are read before the open pool.</p>
      </div>
      <div class="page-head__actions">
        <button type="button" class="btn btn-secondary">Saved roles (${d.savedRoles.length})</button>
        <button type="button" class="btn btn-primary">Weekly job alert · on</button>
      </div>
    </div>

    <div class="grid-split grid-split--top">
      <div class="stack stack--gap-sm">
        ${filterBar(d.jobs.length)}
        ${d.jobs.map(jobCard)}
      </div>
      <div class="stack stack--sticky">
        ${matchPanel(d)}
        ${savedPanel(d.savedRoles)}
        ${introPanel()}
      </div>
    </div>`;
  };
})(window.QB = window.QB || {});
