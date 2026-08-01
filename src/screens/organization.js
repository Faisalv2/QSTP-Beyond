/* Organization — a host startup hiring out of the alumni pool.
   Two tabs: Talent search (this file) and My offers (org-offers.js). */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  var NAV = ['Talent search', 'My offers'];
  var COHORTS = ['All cohorts', '2024–2025', '2021–2023'];

  function header(org, tab, liveOffers) {
    return html`<header class="appbar appbar--light">
      <a class="appbar__brand" href="#organization">
        <span class="tile tile--md" aria-hidden="true">${org.initials}</span>
        <span class="appbar__org">
          <span class="appbar__name appbar__name--sm">${org.name}</span>
          <span class="appbar__kind">${org.kind}</span>
        </span>
      </a>
      <nav class="appbar__nav" aria-label="Organization">
        ${NAV.map(function (item) {
          var on = item === tab;
          return html`<button type="button" class="${ui.cx('navtab', { 'is-active': on })}"
            data-act="orgTab" data-arg="${item}"
            ${on ? ui.raw('aria-current="page"') : ''}>${item}</button>`;
        })}
      </nav>
      <span class="badge">${liveOffers} live offer${liveOffers === 1 ? '' : 's'}</span>
      <span class="avatar avatar--plain">${org.recruiter}</span>
    </header>`;
  }

  /* The spotlight toggle leads the rail and is the only lime control in it —
     QSTP-featured alumni are the reason a recruiter opens this screen. */
  function spotlightFilter(on, count) {
    return html`<button type="button" class="${ui.cx('spot-filter', { 'is-active': on })}"
      data-act="spotlightOnly" aria-pressed="${String(on)}">
      <span class="spot-filter__icon">${ui.icon('star', 15)}</span>
      <span class="spot-filter__label">Spotlight alumni</span>
      <span class="spot-filter__count">${count}</span>
    </button>`;
  }

  function filterRail(state, spotlightCount) {
    return html`<aside class="filters" aria-label="Filters">
      ${spotlightFilter(state.spotlightOnly, spotlightCount)}

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

      <hr class="rule rule--rail">
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
      return html`<article class="${ui.cx('talent', { 'talent--spotlight': person.spotlight })}">
        <span class="avatar avatar--lg" style="background:${person.tile}">${person.initials}</span>
        <div class="talent__body">
          <div class="talent__head">
            <h3 class="talent__name">${person.name}</h3>
            ${ui.tag(person.avail, QB.availTone[person.availKey])}
            ${person.spotlight ? html`<span class="chip chip--spotlight">
              ${ui.icon('star', 11)}${person.spotlight}
            </span>` : ''}
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

  function liveOffersPanel(offers) {
    var open = offers.filter(function (o) { return o.status === 'Open'; });
    return html`<section class="panel panel--tight" aria-labelledby="live-title">
      <div class="panel__head panel__head--simple">
        <h2 class="panel__title panel__title--xs" id="live-title">Your live offers</h2>
        <span class="panel__count">${open.length} open</span>
      </div>
      <ul class="offers">
        ${open.map(function (offer) {
          return html`<li class="offer">
            <span class="offer__body">
              <span class="offer__title">${offer.title}</span>
              <span class="offer__meta">${offer.location} · posted ${offer.posted}</span>
            </span>
            <span class="offer__count">
              <span class="offer__n">${offer.funnel.applied}</span>
              <span class="offer__unit">applicants</span>
            </span>
          </li>`;
        })}
      </ul>
      <button type="button" class="btn btn-ghost btn-flush" data-act="orgTab" data-arg="My offers">
        Manage all offers
      </button>
    </section>`;
  }

  /* Free text, availability, skill, and the spotlight toggle. */
  function filterTalent(people, state) {
    var query = state.query.trim().toLowerCase();
    return people.filter(function (person) {
      if (state.spotlightOnly && !person.spotlight) return false;
      var haystack = [person.name, person.role, person.skills.join(' '), person.note].join(' ').toLowerCase();
      var hitQuery = !query || haystack.indexOf(query) !== -1;
      var hitSkill = state.skill === 'Any skill' || person.skills.some(function (skill) {
        return skill.toLowerCase().indexOf(state.skill.toLowerCase()) !== -1;
      });
      return hitQuery && hitSkill && QB.matchesAvailability(person, state.avail);
    });
  }

  function talentSearch(state, d) {
    var matches = filterTalent(d.talent, state);
    var spotlightCount = d.talent.filter(function (p) { return p.spotlight; }).length;

    return html`<div class="page-head">
      <div>
        <h1 class="h1--sm">Hire from the QSTP alumni pool</h1>
        <p class="page-head__lede page-head__lede--sm">${d.pool.open} alumni open to offers · ${d.pool.soon} available within 30 days</p>
      </div>
    </div>

    <div class="grid-hire">
      ${filterRail(state, spotlightCount)}
      <div class="stack stack--gap-sm">
        ${searchBar(state, matches.length)}
        ${talentList(matches)}
      </div>
      <div class="stack stack--sticky-top">
        ${liveOffersPanel(state.offers)}
      </div>
    </div>`;
  }

  QB.orgTabs = QB.orgTabs || {};
  QB.orgTabs['Talent search'] = talentSearch;

  QB.screens = QB.screens || {};
  QB.screens.organization = function (state) {
    var d = QB.data;
    var tab = QB.orgTabs[state.orgTab] ? state.orgTab : 'Talent search';
    var open = state.offers.filter(function (o) { return o.status === 'Open'; }).length;

    return html`${header(d.org, tab, open)}
    <div class="page page--tight">${QB.orgTabs[tab](state, d)}</div>`;
  };
})(window.QB = window.QB || {});
