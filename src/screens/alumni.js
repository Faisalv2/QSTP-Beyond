/* Alumni home — the view a graduate of a QSTP internship lands on. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function header(viewer, tab, locked) {
    return html`<header class="appbar appbar--light">
      <a class="appbar__brand" href="#alumni">
        ${ui.brandDots()}
        <span class="appbar__name">QSTP Beyond</span>
      </a>
      <nav class="appbar__nav" aria-label="Alumni">
        ${QB.filters.alumniTabs.map(function (item) {
          var on = item === tab;
          /* A locked tab is still reachable — asking for it opens the survey. */
          var shut = locked.indexOf(item) !== -1;
          return html`<button type="button"
            class="${ui.cx('navtab', { 'is-active': on, 'navtab--locked': shut })}"
            data-act="tab" data-arg="${item}"
            ${shut ? ui.raw('title="Confirm your status to open this"') : ''}
            ${on ? ui.raw('aria-current="page"') : ''}>${item}</button>`;
        })}
      </nav>
      <div class="user">
        <span class="avatar avatar--teal avatar--online">${viewer.initials}</span>
        <span class="user__text">
          <span class="user__name">${viewer.name}</span>
          <span class="user__meta">${viewer.meta}</span>
        </span>
      </div>
    </header>`;
  }

  /* Three states. Unconfirmed, the card asks. Confirmed as-is, it keeps the
     status on file and says so. Answered through the survey, it reports the
     new answer back — leaving the old role there would make the answer look
     ignored. Either confirmation opens the three gated tabs. */
  function statusCard(viewer, state) {
    var done = state.statusUpdated;
    var surveyed = state.statusSource === 'survey';

    return html`<section class="status" aria-labelledby="status-title">
      <div class="status__main">
        <p class="status__kicker">Career status · ${done
          ? 'confirmed a moment ago'
          : 'last confirmed ' + viewer.statusSince}</p>
        <h2 class="status__title" id="status-title">${surveyed
          ? QB.surveySummary(state.survey.answers)
          : viewer.currentStatus + (done ? '' : ' — still right?')}</h2>
        <p class="status__body">${done
          ? (surveyed
            ? html`Job offers, Ideastorm and Referrals are open for this session.
              Everything you told us is on your profile.`
            : html`Kept as it was. Job offers, Ideastorm and Referrals are open
              for this session — change it any time if that stops being true.`)
          : html`Alumni who keep their status current unlock Gold referral tier
            and get first look at founding-team roles.`}</p>
        <div class="status__actions">
          ${done
            ? html`<button type="button" class="btn btn-on-ink" data-act="openSurvey">Change my status</button>`
            : html`<button type="button" class="btn btn-lime" data-act="confirmStatus">Yes, still accurate</button>
              <button type="button" class="btn btn-on-ink" data-act="openSurvey">Update my status</button>`}
        </div>
      </div>
      <div class="status__aside">
        <p class="meter__head"><span>Profile</span><span>${viewer.profileComplete}%</span></p>
        <div class="meter" role="progressbar" aria-label="Profile completeness"
             aria-valuenow="${viewer.profileComplete}" aria-valuemin="0" aria-valuemax="100">
          <span class="meter__fill" style="width:${viewer.profileComplete}%"></span>
        </div>
        <p class="status__hint">Add 2 skills and a portfolio link to appear in recruiter search.</p>
      </div>
    </section>`;
  }

  function spotlightPanel(people) {
    return html`<section class="panel" aria-labelledby="spotlight-title">
      <div class="panel__head">
        <h2 class="panel__title" id="spotlight-title">Spotlight</h2>
        <p class="panel__sub">Alumni doing something worth copying</p>
        <div class="panel__actions">
          <button type="button" class="btn btn-secondary btn-icon btn-round" aria-label="Previous">
            ${ui.icon('chevron-left', 16)}
          </button>
          <button type="button" class="btn btn-secondary btn-icon btn-round" aria-label="Next">
            ${ui.icon('chevron-right', 16)}
          </button>
        </div>
      </div>
      <hr class="rule">
      <div class="spot-list">
        ${people.map(function (person) {
          return html`<article class="spot-row">
            <p class="spot-row__tile" style="background:${person.tile}">
              <span class="spot__initials">${person.initials}</span>
              <span class="spot__slug">Photo</span>
            </p>
            <div class="spot-row__body">
              <h3 class="spot__name">${person.name}</h3>
              <p class="spot__role">${person.role}</p>
              <p class="spot__blurb">${person.blurb}</p>
            </div>
          </article>`;
        })}
      </div>
    </section>`;
  }

  function eventsPanel(events) {
    return html`<section class="panel panel--tight panel--stretch" aria-labelledby="events-title">
      <div class="panel__head panel__head--simple">
        <h2 class="panel__title panel__title--sm" id="events-title">Events</h2>
        <a class="panel__link" href="#">Full calendar</a>
      </div>
      <ul class="events">
        ${events.map(function (event) {
          return html`<li class="event">
            <p class="event__date">
              <span class="event__mon">${event.mon}</span>
              <span class="event__day">${event.day}</span>
            </p>
            <div class="event__body">
              <h3 class="event__title">${event.title}</h3>
              <p class="event__meta">${event.meta}</p>
              ${ui.tag(event.tag, event.tone)}
            </div>
          </li>`;
        })}
      </ul>
    </section>`;
  }

  function home(d, state) {
    var viewer = d.viewer;

    return html`<div class="page-head">
      <div>
        <p class="page-head__kicker">${viewer.today}</p>
        <h1>Good morning, ${viewer.name.split(' ')[0]}.</h1>
        <p class="page-head__lede">Three years since your QSTP internship.
          Twelve roles opened this week that match your stack.</p>
      </div>
    </div>

    <div class="grid-split grid-split--home">
      <div class="stack">
        ${statusCard(viewer, state)}
        ${spotlightPanel(d.spotlight)}
      </div>
      ${eventsPanel(d.events)}
    </div>`;
  }

  QB.alumniTabs = QB.alumniTabs || {};
  QB.alumniTabs.Home = home;

  QB.screens = QB.screens || {};
  QB.screens.alumni = function (state) {
    var d = QB.data;
    var tab = QB.alumniTabs[state.tab] ? state.tab : 'Home';
    var locked = state.statusUpdated ? [] : QB.surveyData.gatedTabs;

    return html`${header(d.viewer, tab, locked)}
    <div class="page">${QB.alumniTabs[tab](d, state)}</div>
    ${state.survey.open ? QB.surveyDialog(state) : ''}`;
  };
})(window.QB = window.QB || {});
