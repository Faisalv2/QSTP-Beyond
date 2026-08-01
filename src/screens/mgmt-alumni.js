/* Management → Alumni: a directory of every intern and alum, with the selected
   person's profile and career progression alongside. Row selection is wired
   (the profile is unreachable otherwise); search and filters are not. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function directoryTable(people, selectedId) {
    return html`<section class="panel panel--tight" aria-label="Alumni directory">
      <table class="table table--pick">
        <thead><tr><th>Alum</th><th>Status</th><th>Now at</th><th>Updated</th></tr></thead>
        <tbody>
          ${people.map(function (p) {
            var on = p.id === selectedId;
            return html`<tr class="${ui.cx({ 'is-selected': on })}"
              data-act="selectAlum" data-arg="${p.id}" aria-selected="${String(on)}">
              <td>
                <span class="who">
                  <span class="avatar avatar--sm" style="background:${p.tile}">${p.initials}</span>
                  <span class="cell">
                    <span class="cell__a cell__a--strong">${p.name}</span>
                    <span class="cell__b">${p.role} · ${p.cohort}</span>
                  </span>
                </span>
              </td>
              <td>${ui.tag(p.status, p.tone)}</td>
              <td>
                <span class="cell">
                  <span class="cell__a">${p.employer}</span>
                  <span class="cell__b">${p.employerKind}</span>
                </span>
              </td>
              <td class="${ui.cx('td-quiet', !p.fresh && 'td-stale')}">${p.updated}</td>
            </tr>`;
          })}
        </tbody>
      </table>
    </section>`;
  }

  function profile(p) {
    return html`<section class="panel panel--tight profile" aria-label="${p.name}">
      <div class="profile__head">
        <span class="avatar avatar--lg" style="background:${p.tile}">${p.initials}</span>
        <div>
          <h2 class="profile__name">${p.name}</h2>
          <p class="profile__role">${p.role}${p.employer === '—' ? '' : ' · ' + p.employer}</p>
        </div>
      </div>
      <p class="chip-set chip-set--foot">
        ${ui.tag(p.status, p.tone)}
        ${ui.tag(p.type, 'mute')}
        ${p.fresh ? '' : ui.tag('Stale status', 'warn')}
      </p>
      <p class="profile__note">${p.note}</p>

      <hr class="rule">
      <h3 class="eyebrow">Record</h3>
      ${ui.facts([
        ['Cohort', p.cohort],
        ['Interned at', p.host],
        ['Field', p.field],
        ['Location', p.location],
        ['Status updated', p.updated]
      ])}
      <p class="meter__head meter__head--light"><span>Profile complete</span><span>${p.profile}%</span></p>
      <div class="meter meter--light" role="progressbar" aria-label="Profile completeness"
           aria-valuenow="${p.profile}" aria-valuemin="0" aria-valuemax="100">
        <span class="meter__fill" style="width:${p.profile}%"></span>
      </div>

      <hr class="rule">
      <h3 class="eyebrow">Skills</h3>
      <p class="chip-set">
        ${p.skills.map(function (s) { return html`<span class="chip-outline">${s}</span>`; })}
      </p>

      <hr class="rule">
      <h3 class="eyebrow">Career progression</h3>
      <ol class="timeline">
        ${p.progression.map(function (step) {
          return html`<li class="tl">
            <span class="tl__year">${step.year}</span>
            <span class="tl__rail"><span class="tl__dot"></span><span class="tl__line"></span></span>
            <span class="tl__body">
              <span class="tl__title">${step.title}</span>
              <span class="tl__meta">${step.org} · ${step.level}</span>
            </span>
          </li>`;
        })}
      </ol>

      <hr class="rule">
      <div class="profile__actions">
        <button type="button" class="btn btn-primary btn-sm">View full profile</button>
        <button type="button" class="btn btn-secondary btn-sm">Request status update</button>
      </div>
    </section>`;
  }

  QB.mgmtViews = QB.mgmtViews || {};
  QB.mgmtViews.Alumni = function (state) {
    var dir = QB.directory;
    var people = dir.alumni;
    var selected = people.filter(function (p) { return p.id === state.alumId; })[0] || people[0];
    var interns = people.filter(function (p) { return p.type === 'Current intern'; }).length;

    return html`<div class="page-head">
      <div>
        <h1 class="h1--sm">Alumni directory</h1>
        <p class="page-head__lede page-head__lede--sm">${QB.data.trackedAlumni.toLocaleString()} tracked ·
          showing ${people.length} (${people.length - interns} alumni, ${interns} current interns)</p>
      </div>
    </div>
    <div class="directory">
      <aside class="side">${ui.selectRail('Filters', dir.alumniFilters, 'Reset filters')}</aside>
      <div class="dir-main">
        ${ui.searchBar('alum-search', 'Search by name, skill, employer or cohort', people.length + ' people')}
        ${directoryTable(people, selected.id)}
      </div>
      <aside class="dir-detail">${profile(selected)}</aside>
    </div>`;
  };
})(window.QB = window.QB || {});
