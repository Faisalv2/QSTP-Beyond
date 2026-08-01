/* The alumni profile, as a modal over the alumni screen — opened from the
   identity block in the app bar.

   Its centre is the timeline. A QSTP record always begins at the internship
   that started it, and everything the platform can honestly date is stacked
   on top: roles taken, a company founded, entry into incubation, referrals
   made and received, ideas posted, offers shortlisted for, and each time the
   status was confirmed. Nothing here is invented — every row is read off the
   seeded store, which is why a first-cycle intern sees a short timeline and
   an alum of four years sees a long one. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* The fixed "now" the rest of the prototype assumes. */
  var NOW = 2026 * 12 + 6;

  /* A QSTP intake runs a term, so the programme is completed about three
     months after the internship it opened with. */
  var CYCLE_MONTHS = 3;

  /* 'Jun 2026' and '12 Jun 2026' both parse; anything else has no date, and
     sorts as current rather than pretending to a position in the past. */
  function monthKey(text) {
    var match = text && String(text).match(/([A-Z][a-z]{2})\s+(\d{4})/);
    if (!match) return null;
    var month = MONTHS.indexOf(match[1]);
    return month === -1 ? null : Number(match[2]) * 12 + month;
  }

  function label(key) { return MONTHS[key % 12] + ' ' + Math.floor(key / 12); }

  /* An offer's age is written the way a person would say it, so a shortlist
     can still be placed on the timeline rather than filed under "current". */
  function postedKey(posted) {
    var match = String(posted || '').match(/(\d+)\s*(day|week|month)/);
    if (!match) return NOW;
    var n = Number(match[1]);
    var months = match[2] === 'month' ? n
      : match[2] === 'week' ? Math.round(n / 4.3)
      : Math.round(n / 30);
    return NOW - months;
  }

  /* Milestones run strictly oldest to newest. `rank` only guards the opening:
     the internship starts the record whatever else claims an early date.
     Undated milestones sort after the dated ones — they describe where the
     person is now, not a moment that can be placed on the line. */
  function add(items, kind, when, title, meta, opts) {
    var settings = opts || {};
    items.push({
      kind: kind,
      when: when,
      key: settings.key != null ? settings.key : monthKey(when),
      rank: settings.rank || 0,
      title: title,
      meta: meta
    });
  }

  /* Every milestone the store can account for, oldest first. */
  QB.profileMilestones = function (person) {
    var data = QB.store.data;
    var items = [];
    var progression = person.progression || [];

    var start = progression[progression.length - 1];
    var founded = null;

    progression.forEach(function (entry, i) {
      var origin = i === progression.length - 1;
      if (origin) {
        add(items, 'origin', entry.year,
          'QSTP internship at ' + entry.org,
          person.cycle + ' cycle · where the record begins', { rank: -1 });
      } else {
        if (entry.level === 'Founder') founded = monthKey(entry.year);
        add(items, 'role', entry.year,
          entry.title + (entry.org ? ' at ' + entry.org : ''),
          entry.level || 'Career step');
      }
    });

    /* Finishing the programme is the checkpoint that turns an intern into an
       alum, so it belongs on the record — dated from the internship, since a
       cycle runs a term. Current interns have not reached it yet. */
    if (person.kind === 'alumni' && start && monthKey(start.year) != null) {
      var completed = monthKey(start.year) + CYCLE_MONTHS;
      add(items, 'graduation', label(completed), 'Completed the QSTP programme',
        person.cycle + ' cycle', { key: completed });
    }

    if (person.status === 'Founder' && person.incubated && person.startup) {
      /* Incubation follows the founding, so it inherits that date when the
         progression records one. */
      add(items, 'founder', founded == null ? null : label(founded),
        'Entered QSTP incubation with ' + person.startup,
        person.stage || 'In the pipeline', { key: founded });
    }

    (data.ideas || []).forEach(function (idea) {
      if (idea.ownerId !== person.id) return;
      add(items, 'idea', null, 'Posted “' + idea.title + '” on Ideastorm',
        idea.stage + ' · ' + idea.joined + ' interested');
    });

    (data.referrals || []).forEach(function (referral) {
      if (referral.referrerId === person.id) {
        add(items, 'referral', referral.date,
          'Referred ' + referral.alum + ' to ' + referral.company, 'Referral · ' + referral.status);
      } else if (referral.alumId === person.id) {
        add(items, 'referral', referral.date,
          'Referred to ' + referral.company + ' by ' + referral.referrer,
          'Referral · ' + referral.status);
      }
    });

    /* Shortlists are the noisiest source, so only the strongest few earn a
       row — a timeline of twelve near-identical entries says less than three. */
    var shortlists = [];
    (data.offers || []).forEach(function (offer) {
      (offer.people || []).forEach(function (ref) {
        if (ref.id === person.id) shortlists.push({ offer: offer, match: ref.match });
      });
    });
    shortlists.sort(function (a, b) { return parseInt(b.match, 10) - parseInt(a.match, 10); });
    shortlists.slice(0, 3).forEach(function (entry) {
      var posted = postedKey(entry.offer.posted);
      add(items, 'offer', label(posted),
        'Shortlisted for ' + entry.offer.title + ' at ' + entry.offer.org,
        entry.match + ' skills match', { key: posted });
    });

    if (person.spotlight) {
      add(items, 'spotlight', null, 'Featured in the alumni spotlight', person.spotlight);
    }

    /* A confirmation is an event like any other and sits on its own date —
       pinning it to the end would print dates running backwards. */
    add(items, 'update', person.lastUpdate, 'Status confirmed',
      QB.statusLine(person) + (person.fresh ? '' : ' · needs a refresh'));

    /* Referrals and shortlists come from collections dated independently of
       anyone's cycle, so a few land before their person had joined. Inside a
       QSTP record that cannot have happened — dropping them is truer than
       printing a timeline whose dates run backwards. */
    var opened = items[0] && items[0].rank === -1 ? items[0].key : null;
    if (opened != null) {
      items = items.filter(function (item) {
        if (item.rank === -1 || item.key == null) return true;
        return item.key >= opened || (item.kind !== 'referral' && item.kind !== 'offer');
      });
    }

    return items.sort(function (a, b) {
      if (a.rank !== b.rank) return a.rank - b.rank;
      var ak = a.key == null ? Infinity : a.key;
      var bk = b.key == null ? Infinity : b.key;
      return ak - bk;
    });
  };

  function timeline(items) {
    return html`<ol class="journey">
      ${items.map(function (item) {
        return html`<li class="${ui.cx('journey__item', 'journey__item--' + item.kind)}">
          ${item.kind === 'graduation'
            ? html`<span class="journey__cap" aria-hidden="true">🎓</span>`
            : html`<span class="journey__dot" aria-hidden="true"></span>`}
          <p class="journey__when">${item.when || 'Current'}</p>
          <h4 class="journey__title">${item.title}</h4>
          <p class="journey__meta">${item.meta}</p>
        </li>`;
      })}
    </ol>`;
  }

  function chips(person) {
    return html`<p class="chip-set chip-set--foot">
      ${ui.tag(person.kind === 'intern' ? 'Current intern' : person.status, person.fresh ? 'lime' : 'mute')}
      ${ui.tag(person.availLabel, QB.availTone[person.avail] || 'mute')}
      ${ui.tag(person.location === 'Elsewhere' ? (person.country || 'Abroad') : person.location, 'mute')}
    </p>`;
  }

  QB.profileDialog = function (state) {
    var person = QB.store.viewer();
    var items = QB.profileMilestones(person);
    var skills = person.skills || [];

    return html`<div class="scrim scrim--closes" data-act="closeProfile"></div>
    <div class="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <section class="survey profile-modal">
        <header class="survey__head">
          <div class="survey__head-row">
            <div class="profile-modal__id">
              <span class="avatar avatar--teal avatar--lg avatar--online">${person.initials}</span>
              <div>
                <p class="survey__eyebrow">${person.cycle} · ${person.kind === 'intern' ? 'Intern' : 'Alumni'}</p>
                <h2 class="survey__title" id="profile-title">${person.name}</h2>
                <p class="profile-modal__line">${QB.statusLine(person)}</p>
              </div>
            </div>
            <button type="button" class="survey__close" data-act="closeProfile"
              aria-label="Close profile">${ui.icon('x', 18)}</button>
          </div>
          ${chips(person)}
        </header>

        <div class="survey__body">
          <div class="q">
            <p class="q__label">Your QSTP timeline</p>
            <p class="q__hint">${items.length === 1 || items.length === 2
              ? 'It starts at your internship and grows as you tell us what happens next.'
              : items.length + ' milestones on record, oldest first.'}</p>
            ${timeline(items)}
          </div>

          ${skills.length ? html`<div class="q">
            <p class="q__label">Skills on record</p>
            <p class="picks">${skills.map(function (skill) {
              return html`<span class="chip-btn chip-btn--md">${skill}</span>`;
            })}</p>
          </div>` : ''}
        </div>

        <footer class="survey__foot">
          <span class="survey__foot-note">Last confirmed ${person.lastUpdate}</span>
          <button type="button" class="btn btn-primary" data-act="openSurvey">Give a career update</button>
        </footer>
      </section>
    </div>`;
  };
})(window.QB = window.QB || {});
