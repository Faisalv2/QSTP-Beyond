/* Alumni → Ideastorm. Presentation only: the stage filter and the
   express-interest toggles render their resting state and are not yet wired. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  function stageBar(ideaCount) {
    return html`<div class="filter-bar filter-bar--single">
      <span class="filter-bar__label">Stage</span>
      ${ui.chipRow(QB.filters.stages, QB.filters.stages[0], null, 'md strong')}
      <span class="filter-bar__count">${ideaCount} live ideas</span>
    </div>`;
  }

  function ideaCard(idea) {
    return html`<article class="idea">
      <div class="idea__head">
        <span class="chip chip--stage">${idea.stage}</span>
        <span class="idea__joined">${idea.joined + (idea.backed ? 1 : 0)} interested</span>
      </div>
      <h3 class="idea__title">${idea.title}</h3>
      <p class="idea__blurb">${idea.blurb}</p>
      <p class="idea__needs-label">Looking for</p>
      <p class="chip-set">
        ${idea.needs.map(function (need) { return html`<span class="chip-outline">${need}</span>`; })}
      </p>
      <div class="idea__foot">
        <span class="avatar avatar--teal avatar--xs">${idea.ownerInitials}</span>
        <span class="idea__owner">${idea.owner}</span>
        <button type="button" class="${ui.cx('chip-btn', 'chip-btn--action', { 'is-active': idea.backed })}"
                aria-pressed="${idea.backed}">${idea.backed ? 'Interested ✓' : 'Express interest'}</button>
      </div>
    </article>`;
  }

  function requestsPanel(requests) {
    return html`<section class="panel panel--tight panel--ink" aria-labelledby="requests-title">
      <p class="ink-kicker">Your idea · Souq Stack</p>
      <h2 class="ink-title ink-title--lead" id="requests-title">Three alumni asked to join this week.</h2>
      <ul class="requests">
        ${requests.map(function (person) {
          return html`<li class="request">
            <span class="avatar avatar--ghost avatar--sm">${person.initials}</span>
            <div class="request__body">
              <p class="request__name">${person.name}</p>
              <p class="request__role">${person.role}</p>
              <p class="request__note">${person.note}</p>
            </div>
          </li>`;
        })}
      </ul>
      <button type="button" class="btn btn-lime btn-spaced">Review requests</button>
    </section>`;
  }

  function howPanel(steps) {
    return html`<section class="panel panel--tight" aria-labelledby="how-title">
      <h2 class="panel__title panel__title--xs panel__title--lead" id="how-title">How teams form here</h2>
      <ol class="steps">
        ${steps.map(function (step) {
          return html`<li class="step">
            <span class="step__n">${step.n}</span>
            <span class="step__text">${step.text}</span>
          </li>`;
        })}
      </ol>
    </section>`;
  }

  function backingPanel(ideas) {
    return html`<section class="panel panel--tight" aria-labelledby="backing-title">
      <div class="panel__head panel__head--simple panel__head--snug">
        <h2 class="panel__title panel__title--xs" id="backing-title">You’re backing</h2>
        <span class="panel__count">${ideas.length}</span>
      </div>
      <ul class="rows">
        ${ideas.map(function (idea) {
          return html`<li class="row">
            <span class="row__body">
              <span class="row__title">${idea.title}</span>
              <span class="row__meta">${idea.stage} · ${idea.joined + 1} interested</span>
            </span>
            <button type="button" class="btn btn-ghost btn-sm">Leave</button>
          </li>`;
        })}
      </ul>
    </section>`;
  }

  QB.alumniTabs = QB.alumniTabs || {};
  QB.alumniTabs.Ideastorm = function () {
    var d = QB.data;
    var backing = d.ideas.filter(function (idea) { return idea.backed; });

    return html`<div class="page-head page-head--tab">
      <div>
        <p class="page-head__kicker">Ideastorm</p>
        <h1 class="h1--tab">Ideas looking for people.</h1>
        <p class="page-head__lede page-head__lede--wide">Post what you’re building, say which skills
          are missing, and meet the alum who has them.</p>
      </div>
      <button type="button" class="btn btn-primary">Post an idea</button>
    </div>

    <div class="grid-split grid-split--top">
      <div class="stack stack--gap-sm">
        ${stageBar(d.ideas.length)}
        <div class="idea-grid">${d.ideas.map(ideaCard)}</div>
      </div>
      <div class="stack stack--sticky">
        ${requestsPanel(d.ideaRequests)}
        ${howPanel(d.teamSteps)}
        ${backingPanel(backing)}
      </div>
    </div>`;
  };
})(window.QB = window.QB || {});
