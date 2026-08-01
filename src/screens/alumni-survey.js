/* The status-update survey, as a modal over the alumni screen. The page
   behind it is blurred; the nav bars are not, so a respondent who does not
   want to answer right now can still go somewhere else.

   Its questions and branching rules live in data-survey.js — this file is
   only the drawing of them. */
(function (QB) {
  'use strict';

  var ui = QB.ui;
  var html = ui.html;

  /* Actions carry "field|value" because a delegated click gets one argument. */
  function arg(field, value) { return field + '|' + value; }

  /* ── Question controls ───────────────────────────────────────────── */

  function question(label, hint, body, optional) {
    return html`<div class="q">
      <p class="q__label">${label}${optional ? html`<span class="q__optional">optional</span>` : ''}</p>
      ${hint ? html`<p class="q__hint">${hint}</p>` : ''}
      ${body}
    </div>`;
  }

  /* Big tappable cards — for the question that sets the whole branch. */
  function optionCards(field, options, value) {
    return html`<div class="opts" role="radiogroup">
      ${options.map(function (opt) {
        var on = opt.id === value;
        return html`<button type="button" class="${ui.cx('opt', { 'is-active': on })}"
          role="radio" aria-checked="${String(on)}"
          data-act="surveyPick" data-arg="${arg(field, opt.id)}">
          <span class="opt__emoji" aria-hidden="true">${opt.emoji}</span>
          <span class="opt__label">${opt.label}</span>
        </button>`;
      })}
    </div>`;
  }

  /* Inline chips — one answer out of a short list. */
  function pickRow(field, options, value) {
    return html`<div class="picks" role="radiogroup">
      ${options.map(function (opt) {
        var on = opt === value;
        return html`<button type="button" class="${ui.cx('chip-btn', 'chip-btn--md', { 'is-active': on })}"
          role="radio" aria-checked="${String(on)}"
          data-act="surveyPick" data-arg="${arg(field, opt)}">${opt}</button>`;
      })}
    </div>`;
  }

  /* Inline chips — any number of answers, tap to add and tap to remove. */
  function multiRow(field, options, values, full) {
    return html`<div class="picks" role="group">
      ${options.map(function (opt) {
        var on = values.indexOf(opt) !== -1;
        /* At the cap, everything not already picked stops responding. */
        var shut = !on && full;
        return html`<button type="button"
          class="${ui.cx('chip-btn', 'chip-btn--md', { 'is-active': on, 'is-spent': shut })}"
          aria-pressed="${String(on)}" ${shut ? ui.raw('disabled') : ''}
          data-act="surveyToggle" data-arg="${arg(field, opt)}">${opt}</button>`;
      })}
    </div>`;
  }

  /* Free text with a datalist behind it. Host startups are labelled so the
     pinned ones read as a recommendation rather than an arbitrary order. */
  function suggestField(field, id, value, placeholder, options, labelled) {
    return html`<input class="input" id="${id}" list="${id}-list" data-field="${'survey.' + field}"
             value="${value}" placeholder="${placeholder}" autocomplete="off">
      <datalist id="${id}-list">
        ${options.map(function (opt) {
          var note = labelled && labelled.indexOf(opt) !== -1;
          return html`<option value="${opt}"
            ${note ? ui.raw('label="QSTP host startup"') : ''}></option>`;
        })}
      </datalist>`;
  }

  function textField(field, id, value, placeholder) {
    return html`<input class="input" id="${id}" data-field="${'survey.' + field}"
             value="${value}" placeholder="${placeholder}" autocomplete="off">`;
  }

  /* ── Steps ───────────────────────────────────────────────────────── */

  function coreStep(a, s) {
    return html`${question('What’s your current status?', null, optionCards('status', s.statuses, a.status))}
    ${question('Where are you based?', null, html`${pickRow('location', s.locations, a.location)}
      ${a.location === 'Elsewhere' ? html`<div class="sub-q">
        <label class="q__sub-label" for="q-country">Which country? <span class="q__optional">optional</span></label>
        <select class="input input--sm" id="q-country" data-field="survey.country">
          <option value="">Prefer not to say</option>
          ${s.countries.map(function (c) {
            return html`<option ${c === a.country ? ui.raw('selected') : ''}>${c}</option>`;
          })}
        </select>
      </div>` : ''}`)}`;
  }

  function employedStep(a, s) {
    return html`${question('Where do you work?', 'Start typing — QSTP host startups are suggested first.',
      suggestField('company', 'q-company', a.company, 'Snoonu', s.companies, s.hosts))}
    ${question('Your role?', null,
      suggestField('role', 'q-role', a.role, 'Software Engineer', s.roles))}
    ${question('Seniority level?', null, pickRow('seniority', s.seniority, a.seniority))}`;
  }

  function founderStep(a, s) {
    return html`${question('Startup name?', null, textField('startup', 'q-startup', a.startup, 'Souq Stack'))}
    ${question('What stage?', null, pickRow('stage', s.stages, a.stage))}
    ${question('Are you part of an incubator or accelerator?', null,
      html`${pickRow('incubator', s.incubators, a.incubator)}
      ${a.incubator === 'Not yet' ? html`<div class="sub-q sub-q--offer">
        <p class="sub-q__title">Want an intro to QSTP incubation?</p>
        <p class="sub-q__note">We’ll pass your startup to the incubation team — no commitment.</p>
        ${pickRow('intro', ['Yes, please', 'Not right now'], a.intro)}
      </div>` : ''}`)}
    ${question('Did this start on Ideastorm?', null, pickRow('ideastorm', ['Yes', 'No'], a.ideastorm))}`;
  }

  function studyingStep(a, s) {
    return html`${question('Degree level?', null, pickRow('degree', s.degrees, a.degree))}
    ${question('Field?', null, suggestField('field', 'q-field', a.field, 'Computer Science', s.fields))}`;
  }

  function lookingStep(a, s) {
    var full = a.skills.length >= s.maxSkills;
    return html`${question('What are you looking for?', 'Pick as many as apply.',
      multiRow('lookingFor', s.lookingFor, a.lookingFor, false))}
    ${question('Top skills to match you with?',
      full ? 'That’s all ' + s.maxSkills + ' — remove one to swap it.'
           : 'Up to ' + s.maxSkills + '. ' + a.skills.length + ' picked.',
      multiRow('skills', s.skills, a.skills, full), true)}`;
  }

  function branchStep(a, s) {
    switch (QB.surveyBranch(a)) {
      case 'employed': return employedStep(a, s);
      case 'founder': return founderStep(a, s);
      case 'studying': return studyingStep(a, s);
      case 'looking': return lookingStep(a, s);
      default: return '';
    }
  }

  function closingStep(a, s) {
    return html`${a.status === 'Employed'
      ? question('Open to referring fellow QSTP alumni to your workplace?', null,
        pickRow('referring', ['Yes', 'No'], a.referring), true)
      : ''}
    ${question('Anything worth celebrating since your last update?', null,
      multiRow('wins', s.wins, a.wins, false), true)}
    ${question('Want help with anything right now?', null,
      multiRow('help', s.help, a.help, false), true)}`;
  }

  var STEP_COPY = {
    core: { title: 'Where are you now?', sub: 'Two questions. The rest depends on your answer.' },
    branch: { title: 'Tell us a bit more', sub: 'This is what makes the match worth anything.' },
    closing: { title: 'Last thing', sub: 'All optional — skip anything you’d rather not answer.' }
  };

  function stepBody(step, a, s) {
    if (step === 'core') return coreStep(a, s);
    if (step === 'branch') return branchStep(a, s);
    return closingStep(a, s);
  }

  /* ── The dialog ──────────────────────────────────────────────────── */

  function progress(steps, index) {
    return html`<p class="survey__prog" aria-hidden="true">
      ${steps.map(function (step, i) {
        return html`<span class="${ui.cx('survey__seg', { 'is-done': i <= index })}"></span>`;
      })}
    </p>`;
  }

  QB.surveyDialog = function (state) {
    var s = QB.surveyData;
    var a = state.survey.answers;
    var steps = QB.surveySteps(a);
    var index = Math.min(state.survey.step, steps.length - 1);
    var step = steps[index];
    var last = index === steps.length - 1;
    var gated = state.survey.gated;
    var copy = STEP_COPY[step];

    return html`<div class="scrim"></div>
    <div class="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="survey-title">
      <section class="survey">
        <header class="survey__head">
          <div class="survey__head-row">
            <div>
              <p class="survey__eyebrow">Status update · step ${index + 1}${
                /* How many steps follow depends on the first answer, so the
                   total is only claimed once that answer exists. */
                a.status ? ' of ' + steps.length : ''}</p>
              <h2 class="survey__title" id="survey-title">${copy.title}</h2>
            </div>
            ${gated ? '' : html`<button type="button" class="survey__close" data-act="surveyClose"
              aria-label="Close status update">${ui.icon('x', 18)}</button>`}
          </div>
          <p class="survey__sub">${gated && index === 0 ? s.gateReason[gated] : copy.sub}</p>
          ${progress(steps, index)}
        </header>

        <div class="survey__body">${stepBody(step, a, s)}</div>

        <footer class="survey__foot">
          ${index > 0
            ? html`<button type="button" class="btn btn-ghost btn-sm" data-act="surveyBack">Back</button>`
            : html`<span class="survey__foot-note">${gated
              ? 'Needed once per session'
              : 'Takes about a minute'}</span>`}
          <button type="button" class="btn btn-primary" data-act="surveyNext"
                  ${QB.surveyReady(step, a) ? '' : ui.raw('disabled')}>
            ${last ? (gated ? 'Save and open ' + gated : 'Save my status') : 'Continue'}
          </button>
        </footer>
      </section>
    </div>`;
  };
})(window.QB = window.QB || {});
