/* Organization → My offers: every offer this org has posted, with the selected
   one's funnel and applicants alongside. Row selection and the status filter
   are wired; the per-offer actions are not. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  var STATUSES = ['All', 'Open', 'Filled', 'Closed'];

  function summary(offers) {
    var sum = function (key) {
      return offers.reduce(function (n, o) { return n + o.funnel[key]; }, 0);
    };
    return [
      { label: 'Live offers', value: String(offers.filter(function (o) { return o.status === 'Open'; }).length),
        note: 'Visible in the alumni feed now' },
      { label: 'Applications', value: String(sum('applied')), note: 'Across all offers posted' },
      { label: 'In review', value: String(sum('shortlisted')), note: sum('interviewed') + ' interviewed' },
      { label: 'Hires', value: String(sum('hired')), note: 'From the QSTP alumni pool' }
    ];
  }

  /* Composing takes the right rail, so the list of what is already posted
     stays in view while a new offer is written. */
  function offerForm(state) {
    return html`<section class="panel panel--tight" aria-labelledby="offer-title">
      <div class="panel__head panel__head--simple">
        <h2 class="panel__title panel__title--sm" id="offer-title">Post an offer</h2>
        <button type="button" class="btn btn-ghost btn-sm" data-act="cancelOffer">Cancel</button>
      </div>
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

  function offerCard(offer, selected) {
    var f = offer.funnel;
    return html`<article class="${ui.cx('offercard', { 'is-selected': offer.id === selected })}"
      data-act="selectOffer" data-arg="${offer.id}" aria-selected="${String(offer.id === selected)}">
      <div class="offercard__head">
        <h3 class="offercard__title">${offer.title}</h3>
        ${ui.tag(offer.status, offer.tone)}
      </div>
      <p class="offercard__meta">${offer.type} · ${offer.location} · ${offer.pay} · posted ${offer.posted}</p>
      <p class="offercard__stats">
        <span class="offercard__stat"><span class="offercard__n">${f.applied}</span> applied</span>
        <span class="offercard__stat"><span class="offercard__n">${f.shortlisted}</span> shortlisted</span>
        <span class="offercard__stat"><span class="offercard__n">${f.interviewed}</span> interviewed</span>
        <span class="offercard__stat"><span class="offercard__n">${f.hired}</span> hired</span>
      </p>
    </article>`;
  }

  function detail(offer) {
    var f = offer.funnel;
    var P = QB.palette;
    var people = offer.people.map(function (ref) {
      var person = QB.directory.alumni.filter(function (p) { return p.id === ref.id; })[0];
      return person ? { person: person, match: ref.match } : null;
    }).filter(Boolean);

    return html`<section class="panel panel--tight profile" aria-label="${offer.title}">
      <div class="profile__head profile__head--stack">
        <div>
          <h2 class="profile__name">${offer.title}</h2>
          <p class="profile__role">${offer.type} · ${offer.location}</p>
        </div>
      </div>
      <p class="chip-set chip-set--foot">
        ${ui.tag(offer.status, offer.tone)}
        ${ui.tag('Posted ' + offer.posted, 'mute')}
      </p>

      <hr class="rule">
      <h3 class="eyebrow">Offer</h3>
      ${ui.facts([
        ['Type', offer.type],
        ['Location', offer.location],
        ['Monthly range', offer.pay],
        ['Must-have skills', offer.skills]
      ])}

      <hr class="rule">
      <h3 class="eyebrow">Applicant funnel</h3>
      ${f.applied ? ui.funnel([
        { label: 'Applied', n: f.applied, color: P.ink },
        { label: 'Shortlisted', n: f.shortlisted, color: P.teal },
        { label: 'Interviewed', n: f.interviewed, color: P.tealPale },
        { label: 'Hired', n: f.hired, color: P.lime }
      ]) : html`<p class="empty empty--flush">No applications yet — this offer went live moments ago.</p>`}

      <hr class="rule">
      <h3 class="eyebrow">Top applicants</h3>
      ${people.length ? html`<ul class="rows">
        ${people.map(function (a) {
          return html`<li class="row">
            <span class="avatar avatar--sm" style="background:${a.person.tile}">${a.person.initials}</span>
            <span class="row__body">
              <span class="row__title row__title--sm">${a.person.name}</span>
              <span class="row__meta">${a.person.role} · ${a.person.cohort}</span>
            </span>
            <span class="row__val row__val--match">${a.match}</span>
          </li>`;
        })}
      </ul>` : html`<p class="empty empty--flush">No applicants to review yet.</p>`}

      <hr class="rule">
      <div class="profile__actions">
        <button type="button" class="btn btn-primary btn-sm">Review applicants</button>
        <button type="button" class="btn btn-secondary btn-sm">Edit offer</button>
        ${offer.status === 'Open'
          ? html`<button type="button" class="btn btn-ghost btn-sm">Close offer</button>`
          : html`<button type="button" class="btn btn-ghost btn-sm">Repost</button>`}
      </div>
    </section>`;
  }

  QB.orgTabs = QB.orgTabs || {};
  QB.orgTabs['My offers'] = function (state) {
    var all = state.offers;
    var shown = state.offerStatus === 'All'
      ? all
      : all.filter(function (o) { return o.status === state.offerStatus; });
    var selected = shown.filter(function (o) { return o.id === state.offerId; })[0] || shown[0];
    var totals = summary(all);
    var rail = state.composing ? offerForm(state) : (selected ? detail(selected) : '');

    return html`<div class="page-head page-head--tab">
      <div>
        <h1 class="h1--sm">My offers</h1>
        <p class="page-head__lede page-head__lede--sm">${totals[0].value} live · ${totals[1].value} applications ·
          ${totals[3].value} hires from the alumni pool</p>
      </div>
      <div class="page-head__actions">
        <button type="button" class="btn btn-primary" data-act="composeOffer">Post an offer</button>
      </div>
    </div>

    ${ui.statsRow(totals)}

    <div class="grid-offers">
      <div class="stack stack--gap-sm">
        <div class="filter-bar filter-bar--single">
          <span class="filter-bar__label">Status</span>
          ${ui.chipRow(STATUSES, state.offerStatus, 'offerStatus', 'md strong')}
          <span class="filter-bar__count">${shown.length} of ${all.length} offers</span>
        </div>
        ${shown.length
          ? shown.map(function (o) { return offerCard(o, !state.composing && selected && selected.id); })
          : html`<p class="empty">No offers with that status.</p>`}
      </div>
      ${rail ? html`<aside class="dir-detail">${rail}</aside>` : ''}
    </div>`;
  };
})(window.QB = window.QB || {});
