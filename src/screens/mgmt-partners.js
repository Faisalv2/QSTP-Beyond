/* Management → Partners: a directory of partner organizations, with the
   selected org's details and the offers it has posted alongside. Row selection
   is wired (the detail is unreachable otherwise); search and filters are not. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function directoryTable(orgs, selectedId) {
    return html`<section class="panel panel--tight" aria-label="Partner organizations">
      <table class="table table--pick">
        <thead><tr>
          <th>Organization</th><th>Offers</th><th>Hires</th><th>Alumni</th><th>Status</th>
        </tr></thead>
        <tbody>
          ${orgs.map(function (o) {
            var on = o.id === selectedId;
            return html`<tr class="${ui.cx({ 'is-selected': on })}"
              data-act="selectOrg" data-arg="${o.id}" aria-selected="${String(on)}">
              <td>
                <span class="who">
                  <span class="tile tile--sm" style="background:${o.logoBg}">${o.initials}</span>
                  <span class="cell">
                    <span class="cell__a cell__a--strong">${o.name}</span>
                    <span class="cell__b">${o.kind} · ${o.sector}</span>
                  </span>
                </span>
              </td>
              <td><span class="td-num">${o.stats.offers}</span></td>
              <td><span class="td-num">${o.stats.hires}</span></td>
              <td><span class="td-num">${o.stats.alumni}</span></td>
              <td>${ui.tag(o.status, o.tone)}</td>
            </tr>`;
          })}
        </tbody>
      </table>
    </section>`;
  }

  function detail(o, people) {
    return html`<section class="panel panel--tight profile" aria-label="${o.name}">
      <div class="profile__head">
        <span class="tile tile--lg" style="background:${o.logoBg}">${o.initials}</span>
        <div>
          <h2 class="profile__name">${o.name}</h2>
          <p class="profile__role">${o.kind} · ${o.sector}</p>
        </div>
      </div>
      <p class="chip-set chip-set--foot">
        ${ui.tag(o.status, o.tone)}
        ${ui.tag('Last active ' + o.lastActive, 'mute')}
      </p>
      <p class="profile__note">${o.note}</p>

      <hr class="rule">
      <h3 class="eyebrow">Organization</h3>
      ${ui.facts([
        ['Sector', o.sector],
        ['Size', o.size],
        ['Location', o.location],
        ['Partner since', o.joined],
        ['Contact', o.contact],
        ['Email', o.email]
      ])}

      <hr class="rule">
      <h3 class="eyebrow">Activity</h3>
      <div class="minis">
        <p class="mini"><span class="mini__v">${o.stats.offers}</span><span class="mini__k">Offers posted</span></p>
        <p class="mini"><span class="mini__v">${o.stats.hires}</span><span class="mini__k">Hires made</span></p>
        <p class="mini"><span class="mini__v">${o.stats.alumni}</span><span class="mini__k">Alumni employed</span></p>
      </div>

      <hr class="rule">
      <h3 class="eyebrow">Job offers posted</h3>
      ${o.offers.length ? html`<ul class="offers">
        ${o.offers.map(function (offer) {
          return html`<li class="offer">
            <span class="offer__body">
              <span class="offer__title">${offer.title}</span>
              <span class="offer__meta">${offer.meta}</span>
            </span>
            <span class="offer__side">
              ${ui.tag(offer.status, offer.tone)}
              <span class="offer__apps">${offer.applicants} applicants</span>
            </span>
          </li>`;
        })}
      </ul>` : html`<p class="empty empty--flush">No offers posted yet.</p>`}

      <hr class="rule">
      <h3 class="eyebrow">Alumni here</h3>
      ${people.length ? html`<ul class="rows">
        ${people.map(function (p) {
          return html`<li class="row">
            <span class="avatar avatar--sm" style="background:${p.tile}">${p.initials}</span>
            <span class="row__body">
              <span class="row__title row__title--sm">${p.name}</span>
              <span class="row__meta">${p.role} · ${p.cohort}</span>
            </span>
          </li>`;
        })}
      </ul>` : html`<p class="empty empty--flush">No alumni placed here yet.</p>`}

      <hr class="rule">
      <div class="profile__actions">
        <button type="button" class="btn btn-primary btn-sm">View organization</button>
        <button type="button" class="btn btn-secondary btn-sm">Contact partner</button>
      </div>
    </section>`;
  }

  QB.mgmtViews = QB.mgmtViews || {};
  QB.mgmtViews.Partners = function (state) {
    var dir = QB.directory;
    var orgs = dir.partners;
    var selected = orgs.filter(function (o) { return o.id === state.orgId; })[0] || orgs[0];
    var people = selected.people.map(function (id) {
      return dir.alumni.filter(function (p) { return p.id === id; })[0];
    }).filter(Boolean);
    var active = orgs.filter(function (o) { return o.status === 'Active'; }).length;
    var openOffers = orgs.reduce(function (n, o) {
      return n + o.offers.filter(function (f) { return f.status === 'Open'; }).length;
    }, 0);

    return html`<div class="page-head">
      <div>
        <h1 class="h1--sm">Partner organizations</h1>
        <p class="page-head__lede page-head__lede--sm">${orgs.length} partners · ${active} active ·
          ${openOffers} offers open right now</p>
      </div>
    </div>
    <div class="directory">
      <aside class="side">${ui.selectRail('Filters', dir.partnerFilters, 'Reset filters')}</aside>
      <div class="dir-main">
        ${ui.searchBar('org-search', 'Search by organization, sector or contact', orgs.length + ' partners')}
        ${directoryTable(orgs, selected.id)}
      </div>
      <aside class="dir-detail">${detail(selected, people)}</aside>
    </div>`;
  };
})(window.QB = window.QB || {});
