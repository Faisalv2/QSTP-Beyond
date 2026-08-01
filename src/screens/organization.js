/* Organization — a host startup hiring out of the alumni pool. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  var NAV = ['Talent search', 'My offers', 'Spotlight', 'Pipeline'];
  var COHORTS = ['All cohorts', '2024–2025', '2021–2023'];

  function header(org, liveOffers) {
    return html`<header class="appbar appbar--light">
      <a class="appbar__brand" href="#organization">
        <span class="tile tile--md" aria-hidden="true">${org.initials}</span>
        <span class="appbar__org">
          <span class="appbar__name appbar__name--sm">${org.name}</span>
          <span class="appbar__kind">${org.kind}</span>
        </span>
      </a>
      <nav class="appbar__nav" aria-label="Organization">
        ${NAV.map(function (item, i) {
          return html`<a href="#" ${i === 0 ? ui.raw('aria-current="page"') : ''}>${item}</a>`;
        })}
      </nav>
      <span class="badge">${liveOffers} live offer${liveOffers === 1 ? '' : 's'}</span>
      <span class="avatar avatar--plain">${org.recruiter}</span>
    </header>`;
  }

  function filterRail(state) {
    return html`<aside class="filters" aria-label="Filters">
      <h2 class="filters__label">Availability</h2>
      <div class="filters__chips">${ui.chipRow(QB.filters.availability, state.avail, 'avail')}</div>

      <h2 class="filters__label">Skills</h2>
      <div class="filters__chips">${ui.chipRow(QB.filters.skills, state.skill, 'skill')}</div>

      <h2 class="filters__label">Cohort</h2>
      <div class="filters__radios">
        ${COHORTS.map(function (label) {
          return html`<label class="radio">
            <input type="radio" name="cohort" value="${label}" data-field="cohort"
                   ${label === state.cohort ? ui.raw('checked') : ''}>
            <span class="dot"></span>${label}
          </label>`;
        })}
      </div>

      <hr class="rule">
      <button type="button" class="btn btn-ghost btn-flush" data-act="clearFilters">Clear all filters</button>
    </aside>`;
  }

  function searchBar(state, matches) {
    return html`<div class="search">
      <span class="search__icon">${ui.icon('search', 18)}</span>
      <label class="sr-only" for="talent-search">Search alumni</label>
      <input class="input search__input" id="talent-search" type="search" data-field="query"
             value="${state.query}"
             placeholder="Search by name, skill, or role — e.g. “React, open to relocate”">
      <span class="search__count" aria-live="polite">${matches} match${matches === 1 ? '' : 'es'}</span>
    </div>`;
  }

  function talentList(people) {
    if (!people.length) {
      return html`<p class="empty">No alumni match those filters yet. Try clearing one.</p>`;
    }
    return html`${people.map(function (person) {
      return html`<article class="talent">
        <span class="avatar avatar--lg" style="background:${person.tile}">${person.initials}</span>
        <div class="talent__body">
          <div class="talent__head">
            <h3 class="talent__name">${person.name}</h3>
            ${ui.tag(person.avail, QB.availTone[person.availKey])}
          </div>
          <p class="talent__meta">${person.role} · ${person.cohort}</p>
          <p class="talent__skills">
            ${person.skills.map(function (skill) { return html`<span class="skill">${skill}</span>`; })}
          </p>
          <p class="talent__note">${person.note}</p>
        </div>
        <div class="talent__actions">
          <button type="button" class="btn btn-primary btn-flush-label">Invite to apply</button>
          <button type="button" class="btn btn-secondary btn-flush-label">Save to pipeline</button>
        </div>
      </article>`;
    })}`;
  }

  function offerForm(state) {
    return html`<section class="panel panel--tight" aria-labelledby="offer-title">
      <h2 class="panel__title panel__title--sm" id="offer-title">Create an offer</h2>
      <p class="panel__sub">Appears in the alumni Job offers feed within minutes.</p>
      <hr class="rule">
      <div class="form">
        <p class="field">
          <label for="off-title">Role title</label>
          <input class="input" id="off-title" data-field="offerTitle"
                 value="${state.offer.title}" placeholder="Senior Backend Engineer">
        </p>
        <div class="field">
          <span class="field__label">Type</span>
          <div class="field__seg" role="group" aria-label="Offer type">
            ${ui.chipRow(QB.filters.offerTypes, state.offer.type, 'offerType', 'block')}
          </div>
        </div>
        <div class="form__pair">
          <p class="field">
            <label for="off-loc">Location</label>
            <input class="input" id="off-loc" data-field="offerLoc"
                   value="${state.offer.loc}" placeholder="Doha · Hybrid">
          </p>
          <p class="field">
            <label for="off-pay">Monthly range</label>
            <input class="input" id="off-pay" data-field="offerPay"
                   value="${state.offer.pay}" placeholder="QAR 24–30k">
          </p>
        </div>
        <p class="field">
          <label for="off-skills">Must-have skills</label>
          <input class="input" id="off-skills" data-field="offerSkills"
                 value="${state.offer.skills}" placeholder="Go, Postgres, Kubernetes">
        </p>
        <label class="check">
          <input type="checkbox" data-field="prioritise" ${state.offer.prioritise ? ui.raw('checked') : ''}>
          Prioritise QSTP alumni referrals
        </label>
        <button type="button" class="btn btn-primary btn-block" data-act="publishOffer"
                ${state.offer.title.trim() ? '' : ui.raw('disabled')}>Publish offer</button>
      </div>
    </section>`;
  }

  function liveOffersPanel(offers) {
    return html`<section class="panel panel--tight" aria-labelledby="live-title">
      <div class="panel__head panel__head--simple">
        <h2 class="panel__title panel__title--xs" id="live-title">Your live offers</h2>
        <span class="panel__count">${offers.length} active</span>
      </div>
      <ul class="offers">
        ${offers.map(function (offer) {
          return html`<li class="offer">
            <div class="offer__body">
              <h3 class="offer__title">${offer.title}</h3>
              <p class="offer__meta">${offer.meta}</p>
            </div>
            <p class="offer__count">
              <span class="offer__n">${offer.applicants}</span>
              <span class="offer__unit">applicants</span>
            </p>
          </li>`;
        })}
      </ul>
    </section>`;
  }

  function spotlightPanel(people) {
    return html`<section class="panel panel--tight panel--ink" aria-labelledby="org-spotlight-title">
      <div class="panel__head panel__head--simple">
        <h2 class="panel__title panel__title--xs" id="org-spotlight-title">Spotlight</h2>
        <a class="panel__link panel__link--lime" href="#">See all</a>
      </div>
      <ul class="mini-people">
        ${people.slice(0, 3).map(function (person) {
          return html`<li class="mini-person">
            <span class="tile tile--sm" style="background:${person.tile}">${person.initials}</span>
            <span class="mini-person__text">
              <span class="mini-person__name">${person.name}</span>
              <span class="mini-person__role">${person.role}</span>
            </span>
          </li>`;
        })}
      </ul>
    </section>`;
  }

  /* Same predicate stack the prototype ran: free text, availability, skill. */
  function filterTalent(people, state) {
    var query = state.query.trim().toLowerCase();
    return people.filter(function (person) {
      var haystack = [person.name, person.role, person.skills.join(' '), person.note].join(' ').toLowerCase();
      var hitQuery = !query || haystack.indexOf(query) !== -1;
      var hitSkill = state.skill === 'Any skill' || person.skills.some(function (skill) {
        return skill.toLowerCase().indexOf(state.skill.toLowerCase()) !== -1;
      });
      return hitQuery && hitSkill && QB.matchesAvailability(person, state.avail);
    });
  }

  QB.screens = QB.screens || {};
  QB.screens.organization = function (state) {
    var d = QB.data;
    var matches = filterTalent(d.talent, state);

    return html`${header(d.org, state.offers.length)}
    <div class="page page--tight">
      <div class="page-head">
        <div>
          <h1 class="h1--sm">Hire from the QSTP alumni pool</h1>
          <p class="page-head__lede page-head__lede--sm">${d.pool.open} alumni open to offers · ${d.pool.soon} available within 30 days</p>
        </div>
      </div>

      <div class="grid-hire">
        ${filterRail(state)}
        <div class="stack stack--gap-sm">
          ${searchBar(state, matches.length)}
          ${talentList(matches)}
        </div>
        <div class="stack stack--sticky-top">
          ${offerForm(state)}
          ${liveOffersPanel(state.offers)}
          ${spotlightPanel(d.spotlight)}
        </div>
      </div>
    </div>`;
  };
})(window.QB = window.QB || {});
