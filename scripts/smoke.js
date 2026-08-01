/* Renders every screen in a stub DOM and asserts the markup is well-formed
   and carries the values the design calls for. Run: node scripts/smoke.js */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SOURCES = [
  'src/data.js', 'src/data-directory.js',
  'src/data-survey.js',
  'src/seed-people.js', 'src/seed-world.js', 'src/store.js',
  'src/analytics.js',
  'src/ui.js',
  'src/screens/alumni.js', 'src/screens/alumni-survey.js', 'src/screens/alumni-profile.js',
  'src/screens/alumni-jobs.js',
  'src/screens/alumni-ideastorm.js', 'src/screens/alumni-referrals.js',
  'src/screens/management.js',
  'src/screens/insights-outcomes.js', 'src/screens/insights-engagement.js',
  'src/screens/insights-pipeline.js', 'src/screens/insights-community.js',
  'src/screens/insights-partners.js',
  'src/screens/report.js',
  'src/screens/mgmt-alumni.js', 'src/screens/mgmt-partners.js',
  'src/screens/organization.js', 'src/screens/org-offers.js',
  'src/app.js'
];

/* ── Minimum DOM the app touches ──────────────────────────────────── */

const appEl = {
  innerHTML: '',
  addEventListener() {},
  querySelector() { return null; },
  contains() { return false; }
};

/* store.js caches its seeded world in localStorage, which Node has no notion
   of. Backing it with a plain object exercises the write-then-read path
   rather than the "no storage, generate in memory" fallback — and `cache`
   stays visible from out here so the checks can inspect what was written. */
const cache = Object.create(null);
const localStorageStub = {
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : null;
  },
  setItem(key, value) { cache[key] = String(value); },
  removeItem(key) { delete cache[key]; }
};

const sandbox = {
  console,
  document: {
    activeElement: null,
    body: { dataset: {} },
    addEventListener() {},
    getElementById: (id) => (id === 'app' ? appEl : null)
  },
  localStorage: localStorageStub,
  location: { hash: '' },
  addEventListener() {}
};
sandbox.window = sandbox;

vm.createContext(sandbox);
for (const file of SOURCES) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
}

/* ── Checks ───────────────────────────────────────────────────────── */

let failures = 0;
function check(label, condition) {
  if (!condition) { failures++; console.error('FAIL  ' + label); }
  else { console.log('ok    ' + label); }
}

/* Tags must nest and close; every attribute must be quoted. */
function assertBalanced(label, markup) {
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr', 'path', 'circle', 'line',
    'polyline', 'polygon', 'rect', 'use', 'stop']);
  const stack = [];
  const re = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|[^">])*)(\/?)>/g;
  let m;
  while ((m = re.exec(markup))) {
    const [, closing, name, attrs, selfClose] = m;
    if (attrs.replace(/[\w:.-]+\s*=\s*"[^"]*"/g, '').includes('=')) {
      failures++; console.error(`FAIL  ${label}: unquoted attribute in <${name}${attrs}>`);
      return;
    }
    if (selfClose || VOID.has(name)) continue;
    if (closing) {
      const open = stack.pop();
      if (open !== name) {
        failures++; console.error(`FAIL  ${label}: </${name}> closes <${open}>`);
        return;
      }
    } else stack.push(name);
  }
  check(label + ': balanced markup', stack.length === 0);
}

const QB = sandbox.QB;
const baseState = {
  screen: 'alumni', tab: 'Home', mgmtNav: 'Insights', insightsTab: 'Outcomes',
  alumId: 1, orgId: 1, range: '12 months', adminTab: 'Events',
  orgTab: 'Talent search', offerId: 1, offerStatus: 'All', spotlightOnly: false,
  featured: { 1: true, 3: true }, query: '', avail: 'Any', skill: 'Any skill',
  cohort: 'All cohorts',
  offer: { title: '', loc: '', pay: '', skills: '', type: 'Full-time', prioritise: true },
  offers: QB.data.liveOffers.slice(),
  statusUpdated: false, statusSource: null,
  ins: QB.analytics.defaults(),
  survey: { open: false, gated: null, step: 0, answers: QB.blankAnswers() }
};
const render = (screen, overrides) =>
  String(QB.screens[screen](Object.assign({}, baseState, overrides)));

/* The insights markup is computed from the store, and the store is mutated
   further down by the survey checks — so no figure here can be frozen as a
   literal. `insightsFor` derives the expectation the same way the workspace
   does (state.ins for the eight selects, state.range for the window), at the
   moment of the assertion, which keeps expectation and render in agreement
   whatever has happened to the store in between. */
const insightsFor = (overrides) => {
  const s = Object.assign({}, baseState, overrides);
  return QB.analytics.compute(Object.assign({}, s.ins, { range: s.range }));
};

/* A survey mid-flight: `answers` overrides are merged onto a blank sheet. */
const survey = (over) => {
  const s = Object.assign({ open: true, gated: null, step: 0 }, over);
  s.answers = Object.assign(QB.blankAnswers(), over && over.answers);
  return render('alumni', { survey: s, statusUpdated: false });
};

/* Boot render happened during load. */
check('app mounts on load', appEl.innerHTML.includes('proto-bar'));
check('boot screen is alumni', appEl.innerHTML.includes('Good morning, Faisal.'));
assertBalanced('boot markup', appEl.innerHTML);

const alumni = render('alumni');
assertBalanced('alumni', alumni);
check('alumni: the greeting names the viewer', alumni.includes('Good morning, Faisal.'));
check('alumni: the lede reads as an alum of a past cycle',
  alumni.includes('A year on from your QSTP internship') && !alumni.includes('Week 7 of'));
check('alumni: 4 spotlight entries, stacked', (alumni.match(/class="spot-row"/g) || []).length === 4);
check('alumni: 4 events', (alumni.match(/class="event"/g) || []).length === 4);
check('alumni: events run the full side column', alumni.includes('panel--stretch'));
check('alumni: profile meter at 80%', alumni.includes('width:80%'));
check('alumni: no points anywhere', !/\bpts\b|class="points/.test(alumni));
check('alumni: Events is off the nav', !alumni.includes('>Events</a>'));
check('alumni: no public-profile button', !alumni.includes('View your public profile'));
check('alumni: four nav tabs', (alumni.match(/class="navtab/g) || []).length === 4);
check('alumni: no dialog is up until asked for', !alumni.includes('class="scrim'));
check('alumni: Update my status opens it', alumni.includes('data-act="openSurvey"'));
check('alumni: the three gated tabs are marked', (alumni.match(/navtab--locked/g) || []).length === 3);

/* ── The profile modal ────────────────────────────────────────────── */

check('alumni: the identity block opens the profile',
  alumni.includes('data-act="openProfile"') && alumni.includes('aria-haspopup="dialog"'));

const profile = render('alumni', { profile: true });
assertBalanced('alumni/profile', profile);
check('profile: it is a modal dialog over a blurred page',
  profile.includes('class="scrim') && profile.includes('role="dialog"') &&
  profile.includes('aria-modal="true"'));
check('profile: the scrim dismisses it', profile.includes('scrim--closes'));
check('profile: it names the viewer and their cycle',
  profile.includes('Faisal Elbadri') && profile.includes(QB.store.viewer().cycle));
check('profile: it offers a career update', profile.includes('data-act="openSurvey"'));
check('profile: it can be closed', profile.includes('data-act="closeProfile"'));
check('profile: it draws a timeline', profile.includes('class="journey"'));

/* The timeline is a record, so it has to start where the record starts. */
const profileRecord = QB.store.viewer();
const milestones = QB.profileMilestones(profileRecord);
check('timeline: it begins at the QSTP internship',
  milestones[0].kind === 'origin' && /QSTP internship at Snoonu/.test(milestones[0].title));
check('timeline: the origin is dated by the internship, not by today',
  milestones[0].when === profileRecord.progression[profileRecord.progression.length - 1].year);
check('timeline: it ends on the latest status confirmation',
  milestones[milestones.length - 1].kind === 'update');
check('timeline: every milestone renders a row',
  (profile.match(/class="journey__item/g) || []).length === milestones.length);

/* Completing the programme is what makes someone an alum, so it is on every
   alum's record and on no intern's — and it wears a cap rather than a dot. */
check('timeline: the viewer is an alum, so the programme is marked complete',
  milestones.some((m) => m.kind === 'graduation'));
check('timeline: the completion is dated after the internship, not before',
  milestones.filter((m) => m.kind === 'graduation')[0].key > milestones[0].key);
check('profile: the completed checkpoint is drawn as a graduation cap',
  profile.includes('journey__cap') && profile.includes('🎓'));
check('profile: only that one row wears a cap',
  (profile.match(/journey__cap/g) || []).length === 1);

const everyone = QB.store.data.people;
check('timeline: every alum has a completed programme',
  everyone.filter((p) => p.kind === 'alumni')
    .every((p) => QB.profileMilestones(p).some((m) => m.kind === 'graduation')));
check('timeline: no current intern has one yet',
  everyone.filter((p) => p.kind === 'intern')
    .every((p) => !QB.profileMilestones(p).some((m) => m.kind === 'graduation')));

/* The ordering rule, over the whole roster rather than one lucky record:
   opens at the internship, never runs backwards, undated milestones last. */
const misordered = everyone.filter((person) => {
  const rows = QB.profileMilestones(person);
  if (!rows.length || rows[0].kind !== 'origin') return true;
  let previous = -Infinity;
  let undatedSeen = false;
  return rows.some((row) => {
    if (row.key == null) { undatedSeen = true; return false; }
    if (undatedSeen || row.key < previous) return true;
    previous = row.key;
    return false;
  });
});
check('timeline: all 1,842 records are ordered, oldest first', misordered.length === 0);

/* A QSTP milestone cannot predate joining QSTP. */
check('timeline: nothing on a record predates its internship',
  everyone.every((person) => {
    const rows = QB.profileMilestones(person);
    return rows.every((row) => row.key == null || row.key >= rows[0].key);
  }));

/* Someone with a long record must pick up the other milestone kinds. */
const richest = QB.store.data.people
  .map((p) => ({ p, m: QB.profileMilestones(p) }))
  .sort((a, b) => b.m.length - a.m.length)[0];
check('timeline: a full career carries more than the two an intern has',
  richest.m.length > milestones.length);
check('timeline: it still begins at the internship for them',
  richest.m[0].kind === 'origin');
check('timeline: it runs oldest to newest',
  richest.m.every((item, i, all) =>
    i === 0 || (all[i - 1].key == null ? Infinity : all[i - 1].key) <= (item.key == null ? Infinity : item.key)));
check('timeline: dated milestones carry their date, undated ones read as current',
  richest.m.every((item) => (item.key == null) === (item.when == null)));

/* Every referral the store credits to a person must appear on their timeline. */
const referrer = QB.store.data.people.filter((p) =>
  QB.store.data.referrals.some((r) => r.referrerId === p.id))[0];
if (referrer) {
  const theirs = QB.store.data.referrals.filter((r) => r.referrerId === referrer.id).length;
  check('timeline: referrals they made are on it',
    QB.profileMilestones(referrer).filter((m) => m.kind === 'referral').length >= theirs);
}

/* A founder in the pipeline gets the incubation milestone. */
const incubated = QB.store.data.people.filter((p) => p.status === 'Founder' && p.incubated)[0];
check('timeline: entering QSTP incubation is a milestone',
  QB.profileMilestones(incubated).some((m) => m.kind === 'founder' &&
    m.title.includes(incubated.startup)));

/* The survey outranks the profile — it is the one dialog that can compel. */
const both = render('alumni', {
  profile: true,
  survey: { open: true, gated: 'Ideastorm', step: 0, answers: QB.blankAnswers() }
});
check('profile: a gated survey is never covered by it',
  (both.match(/role="dialog"/g) || []).length === 1 && !both.includes('data-act="closeProfile"'));

/* ── The status survey ────────────────────────────────────────────── */

const S = QB.surveyData;

const q1 = survey();
assertBalanced('alumni/survey-core', q1);
check('survey: the page behind it is blurred', q1.includes('class="scrim"'));
check('survey: it is a modal dialog', q1.includes('role="dialog"') && q1.includes('aria-modal="true"'));
check('survey: six statuses to choose from', (q1.match(/class="opt[ "]/g) || []).length === 6);
check('survey: every status carries its emoji',
  S.statuses.every((s) => q1.includes(s.emoji)));
check('survey: three places to be based',
  S.locations.every((l) => q1.includes('data-arg="location|' + l + '"')));
check('survey: no country dropdown until it is needed', !q1.includes('id="q-country"'));
check('survey: cannot continue with nothing answered', /data-act="surveyNext"\s+disabled>/.test(q1));
/* How many steps follow is not known until the first question is answered. */
check('survey: no step total is claimed before the branch is known',
  q1.includes('step 1</p>') && !q1.includes('step 1 of'));
check('survey: a voluntary one can be closed', q1.includes('data-act="surveyClose"'));

const core = survey({ answers: { status: 'Employed', location: 'Qatar' } });
check('survey: answering both core questions unlocks Continue',
  !/data-act="surveyNext"\s+disabled>/.test(core));
check('survey: the chosen status reads as selected',
  core.includes('data-arg="status|Employed"') && (core.match(/opt is-active/g) || []).length === 1);
check('survey: employed is a 3-step survey', core.includes('step 1 of 3'));

const elsewhere = survey({ answers: { status: 'Freelancing', location: 'Elsewhere' } });
assertBalanced('alumni/survey-elsewhere', elsewhere);
check('survey: Elsewhere asks which country', elsewhere.includes('id="q-country"'));
check('survey: the country is optional', elsewhere.includes('>Prefer not to say</option>'));
check('survey: a status with no branch is a 2-step survey', elsewhere.includes('step 1 of 2'));
check('survey: an unbranched status can still continue',
  !/data-act="surveyNext"\s+disabled>/.test(elsewhere));

/* Each status opens its own follow-up block. */
const employed = survey({ step: 1, answers: { status: 'Employed', location: 'Qatar' } });
assertBalanced('alumni/survey-employed', employed);
check('survey/employed: asks employer, role and seniority',
  employed.includes('id="q-company"') && employed.includes('id="q-role"') &&
  S.seniority.every((l) => employed.includes('data-arg="seniority|' + l + '"')));
check('survey/employed: host startups are pinned and labelled',
  employed.indexOf('value="Snoonu"') < employed.indexOf('value="QNB"') &&
  (employed.match(/label="QSTP host startup"/g) || []).length === S.hosts.length);
check('survey/employed: incomplete branch blocks Continue',
  /data-act="surveyNext"\s+disabled>/.test(employed));

const employedFull = survey({ step: 1, answers: {
  status: 'Employed', location: 'Qatar', company: 'Snoonu', role: 'Backend Engineer', seniority: 'Mid'
} });
check('survey/employed: a full branch unlocks Continue',
  !/data-act="surveyNext"\s+disabled>/.test(employedFull));

const founder = survey({ step: 1, answers: { status: 'Founder', location: 'Qatar' } });
assertBalanced('alumni/survey-founder', founder);
check('survey/founder: asks name, stage, incubator and origin',
  founder.includes('id="q-startup"') &&
  S.stages.every((s) => founder.includes('data-arg="stage|' + s + '"')) &&
  founder.includes('data-arg="ideastorm|Yes"'));
check('survey/founder: no intro offer until they say they have no incubator',
  !founder.includes('sub-q--offer'));

const noIncubator = survey({ step: 1, answers: {
  status: 'Founder', location: 'Qatar', startup: 'Souq Stack', stage: 'Launched', incubator: 'Not yet'
} });
assertBalanced('alumni/survey-founder-intro', noIncubator);
check('survey/founder: "Not yet" turns the question into an offer',
  noIncubator.includes('sub-q--offer') && noIncubator.includes('Want an intro to QSTP incubation?'));
/* The intro offer is a nudge, not a question — answering everything else is
   enough to move on. */
const founderDone = survey({ step: 1, answers: {
  status: 'Founder', location: 'Qatar', startup: 'Souq Stack', stage: 'Launched',
  incubator: 'Not yet', ideastorm: 'Yes'
} });
check('survey/founder: the intro offer is not itself required',
  founderDone.includes('sub-q--offer') &&
  !/data-act="surveyNext"\s+disabled>/.test(founderDone));
check('survey/founder: the rest of the branch is required',
  /data-act="surveyNext"\s+disabled>/.test(noIncubator));

const studying = survey({ step: 1, answers: { status: 'Studying', location: 'GCC' } });
assertBalanced('alumni/survey-studying', studying);
check('survey/studying: asks degree level and field',
  S.degrees.every((d) => studying.includes('data-arg="degree|' + d + '"')) &&
  studying.includes('id="q-field"'));

const looking = survey({ step: 1, answers: { status: 'Looking', location: 'Qatar' } });
assertBalanced('alumni/survey-looking', looking);
check('survey/looking: asks what for, and for skills',
  S.lookingFor.every((l) => looking.includes('data-arg="lookingFor|' + l + '"')) &&
  looking.includes('data-arg="skills|Go"'));
check('survey/looking: skills are capped and counted', looking.includes('Up to 5. 0 picked.'));

const capped = survey({ step: 1, answers: {
  status: 'Looking', location: 'Qatar', lookingFor: ['Full-time'],
  skills: S.skills.slice(0, 5)
} });
check('survey/looking: at the cap the rest stop responding',
  capped.includes('chip-btn--md is-spent') && capped.includes('remove one to swap it'));
check('survey/looking: picked skills stay removable',
  (capped.match(/is-active"\s+aria-pressed="true"/g) || []).length >= 5);

/* The closing block: optional for everyone, and Q4 only for the employed. */
const closing = survey({ step: 2, answers: {
  status: 'Employed', location: 'Qatar', company: 'Snoonu', role: 'Backend Engineer', seniority: 'Mid'
} });
assertBalanced('alumni/survey-closing', closing);
check('survey/closing: the employed are asked about referring',
  closing.includes('data-arg="referring|Yes"'));
check('survey/closing: celebrations and help are both asked',
  S.wins.every((w) => closing.includes('data-arg="wins|' + w + '"')) &&
  S.help.every((h) => closing.includes('data-arg="help|' + h + '"')));
check('survey/closing: everything here is marked optional',
  (closing.match(/class="q__optional"/g) || []).length === 3);
check('survey/closing: nothing is required to finish',
  !/data-act="surveyNext"\s+disabled>/.test(closing));
check('survey/closing: the last step says save, not continue',
  closing.includes('Save my status') && !closing.includes('>Continue<'));

const closingSelf = survey({ step: 1, answers: { status: 'Freelancing', location: 'Qatar' } });
check('survey/closing: only the employed are asked about referring',
  !closingSelf.includes('data-arg="referring|Yes"'));

/* Opened by a locked tab rather than by choice. */
const gated = survey({ gated: 'Ideastorm' });
assertBalanced('alumni/survey-gated', gated);
check('survey/gated: a gated survey cannot be dismissed', !gated.includes('data-act="surveyClose"'));
check('survey/gated: it says which tab it is holding',
  gated.includes(S.gateReason.Ideastorm) && gated.includes('Needed once per session'));

const gatedLast = survey({ gated: 'Job offers', step: 1, answers: {
  status: 'Freelancing', location: 'Qatar'
} });
check('survey/gated: the last button names the tab it opens',
  gatedLast.includes('Save and open Job offers'));

/* After the survey the home card reports back rather than asking again. */
const confirmed = render('alumni', {
  statusUpdated: true, statusSource: 'survey',
  survey: { open: false, gated: null, step: 0, answers: Object.assign(QB.blankAnswers(), {
    status: 'Founder', location: 'Qatar', startup: 'Souq Stack', stage: 'Building MVP'
  }) }
});
assertBalanced('alumni/confirmed', confirmed);
check('confirmed: the card reads back the answer',
  confirmed.includes('Founder at Souq Stack · Building MVP · Qatar'));
check('confirmed: it no longer asks whether the old role is right',
  !confirmed.includes('still right?') && !confirmed.includes('Yes, still accurate'));
check('confirmed: the tabs are unlocked', !confirmed.includes('navtab--locked'));
check('confirmed: the status can still be changed', confirmed.includes('Change my status'));

check('confirmed: an employed answer reads as a role at a company',
  render('alumni', {
    statusUpdated: true, statusSource: 'survey',
    survey: { open: false, gated: null, step: 0, answers: Object.assign(QB.blankAnswers(), {
      status: 'Employed', location: 'Elsewhere', country: 'Germany',
      company: 'Snoonu', role: 'Backend Engineer'
    }) }
  }).includes('Backend Engineer at Snoonu · Germany'));

/* The express path: the status on file is still true, so no survey is needed.
   What the card shows now comes off the seeded store record, not off
   QB.data.viewer — resolve it the same way statusCard does. */
const viewerRecord = QB.store.data.people.find((p) => p.id === QB.store.data.meta.viewerId);
const unasked = render('alumni');
check('as-is: the card asks about the status on file',
  unasked.includes(QB.statusLine(viewerRecord) + ' — still right?') &&
  unasked.includes('last confirmed ' + viewerRecord.lastUpdate));
check('as-is: confirming it is one click', unasked.includes('data-act="confirmStatus"'));

const asIs = render('alumni', { statusUpdated: true, statusSource: 'confirmed' });
assertBalanced('alumni/confirmed-as-is', asIs);
check('as-is: the status on file is kept, not blanked',
  asIs.includes(QB.statusLine(viewerRecord)) && !asIs.includes('still right?'));
check('as-is: it counts as this session’s update',
  !asIs.includes('navtab--locked') && asIs.includes('confirmed a moment ago'));
check('as-is: it does not claim answers that were never given',
  !asIs.includes('Everything you told us') && asIs.includes('Kept as it was'));
check('as-is: it cannot be confirmed twice',
  !asIs.includes('data-act="confirmStatus"') && asIs.includes('Change my status'));

/* Answers are text from the respondent, so they must not reach the DOM raw. */
const nasty = survey({ step: 1, answers: {
  status: 'Employed', location: 'Qatar', company: '<img src=x onerror=alert(1)>'
} });
check('survey: typed answers are escaped', !nasty.includes('<img src=x'));
assertBalanced('alumni/survey-injection', nasty);

const jobs = render('alumni', { tab: 'Job offers' });
assertBalanced('alumni/jobs', jobs);
check('jobs: 5 role cards', (jobs.match(/class="job"/g) || []).length === 5);
check('jobs: open-role count matches the list', jobs.includes('5 open roles'));
check('jobs: skills-match meter is drawn', jobs.includes('width:94%'));
check('jobs: 3 saved roles', (jobs.match(/class="row row--stacked"/g) || []).length === 3);
check('jobs: warm-intro panel', jobs.includes('Ask for an intro'));

const ideas = render('alumni', { tab: 'Ideastorm' });
assertBalanced('alumni/ideastorm', ideas);
check('ideastorm: 6 idea cards', (ideas.match(/class="idea"/g) || []).length === 6);
check('ideastorm: live count matches the grid', ideas.includes('6 live ideas'));
check('ideastorm: backed ideas show as interested',
  (ideas.match(/Interested ✓/g) || []).length === 2);
check('ideastorm: backing rail lists both', (ideas.match(/>Leave</g) || []).length === 2);
check('ideastorm: backing bumps the interest count', ideas.includes('Prototype · 7 interested'));
check('ideastorm: 3 join requests', (ideas.match(/class="request"/g) || []).length === 3);
/* How teams form sits above the grid as a strip, as on the Referrals tab. */
check('ideastorm: 3-step strip', (ideas.match(/class="how-strip__cell"/g) || []).length === 3);
check('ideastorm: the strip is above the grid, not in the side rail',
  ideas.indexOf('how-strip') < ideas.indexOf('grid-split') &&
  ideas.indexOf('how-strip') > ideas.indexOf('page-head'));
check('ideastorm: every step is titled',
  (ideas.match(/class="how-strip__title"/g) || []).length === 3);

const referrals = render('alumni', { tab: 'Referrals' });
assertBalanced('alumni/referrals', referrals);
check('referrals: 3-step strip', (referrals.match(/class="how-strip__cell"/g) || []).length === 3);
check('referrals: 3 tracked referrals', (referrals.match(/class="who"/g) || []).length === 3);
check('referrals: in-flight excludes the hired one', referrals.includes('2 in flight'));
check('referrals: directory lists 4 available alumni',
  (referrals.match(/>Refer</g) || []).length === 4);
check('referrals: compose form has all three fields',
  ['ref-name', 'ref-where', 'ref-why'].every(function (id) { return referrals.includes(id); }));

/* Tab UI is built; the interactions behind it are not wired yet. */
[jobs, ideas, referrals].forEach(function (markup, i) {
  check('tab ' + i + ': no unwired data-act on filters', !/data-act=""/.test(markup));
});
check('alumni: an unknown tab falls back to Home',
  render('alumni', { tab: 'Nope' }).includes('Good morning, Faisal.'));

const mgmt = render('management');
const a12 = insightsFor();
assertBalanced('management/outcomes', mgmt);
check('management: 5-KPI strip', (mgmt.match(/class="kpi"/g) || []).length === 5);
check('management: 5 sidebar sections', (mgmt.match(/class="side-nav__tab/g) || []).length === 5);
check('management: 9 global filters', (mgmt.match(/<select/g) || []).length === 9);
/* Every one of the nine now writes back to the store — none is decoration. */
check('management: all 9 filters are wired',
  (mgmt.match(/<select[^>]*data-field="/g) || []).length === 9);
check('management: the rail can be put back', mgmt.includes('data-act="resetInsights"'));
check('management: range label', mgmt.includes('Showing 12 months'));
check('management: the lede counts the roster it computed from',
  mgmt.includes(a12.total.toLocaleString() + ' tracked alumni') &&
  a12.total === QB.store.data.people.length);
check('management: the KPI strip is the computed one',
  a12.kpis.every((k) => mgmt.includes(k.value) && mgmt.includes(k.note)));

/* The reporting range moved off the appbar into the insights filter rail, and
   is the one filter there that is actually wired. */
check('management: no range or export on the appbar',
  !mgmt.includes('class="segbar"') && !/>Export</.test(mgmt));
check('management: range is a filter in the rail',
  /<select class="input input--sm" id="f-time-range"\s+data-field="range">/.test(mgmt));
check('management: the rail select carries the current range',
  /<option selected>12 months<\/option>/.test(mgmt));
check('management: export lives in the insights tab', mgmt.includes('Export all insights'));
check('management: the export button triggers the report', mgmt.includes('data-act="exportInsights"'));

const range90 = render('management', { range: '90 days' });
assertBalanced('management/range-90', range90);
check('management: changing the range is reflected back',
  range90.includes('Showing 90 days') && /<option selected>90 days<\/option>/.test(range90));

/* Only Insights has the range; the other three workspaces must not claim one. */
const progRange = render('management', { mgmtNav: 'Programmes' });
check('management: the range filter is scoped to Insights',
  !progRange.includes('Showing 12 months') && !progRange.includes('Export all insights'));
check('management: the outcome legend has a row per status in the data',
  (mgmt.match(/class="legend__row"/g) || []).length === a12.outcomes.length &&
  a12.outcomes.every((s) => mgmt.includes(s.label)));
check('management: donut centre reflects the slices in work',
  mgmt.includes('>' + a12.outcomeCentre.value + '</text>'));
check('management: conversion headline', mgmt.includes(a12.kpis[2].value));

/* The donut must consume the whole circumference. */
const dashes = [...mgmt.matchAll(/stroke-dasharray="([\d.]+) ([\d.]+)"/g)].map(m => +m[1]);
const circumference = 2 * Math.PI * 70;
check('management: donut slices sum to the full ring',
  Math.abs(dashes.reduce((a, b) => a + b, 0) - circumference) < 0.5);

/* ── The filter rail actually filters ─────────────────────────────────
   One cycle, one status, and one combination that cannot describe anybody. */

const cycleTab = { ins: { cycle: 'Summer ’26' } };
const currentCycle = render('management', cycleTab);
const aCycle = insightsFor(cycleTab);
assertBalanced('management/insights-cycle', currentCycle);
check('filters: a cycle narrows the roster to that intake',
  aCycle.total === 200 &&
  currentCycle.includes(aCycle.total.toLocaleString() + ' of ' +
    QB.store.data.people.length.toLocaleString() + ' alumni in view'));
check('filters: the current cycle is one solid slice of interns',
  aCycle.outcomes.length === 1 && aCycle.outcomes[0].label === 'Current interns' &&
  (currentCycle.match(/class="legend__row"/g) || []).length === 1 &&
  currentCycle.includes('>100%</text>'));

const employedOnly = { ins: { outcome: 'Employed' } };
const employedView = render('management', employedOnly);
const aEmployed = insightsFor(employedOnly);
assertBalanced('management/insights-outcome', employedView);
check('filters: an outcome changes how many slices there are',
  (employedView.match(/class="legend__row"/g) || []).length === aEmployed.outcomes.length &&
  aEmployed.outcomes.length < a12.outcomes.length && aEmployed.total < a12.total);

/* Employed current interns is empty by construction — the one selection most
   likely to divide by zero. Every tab has to hold up under it, not just the
   one that happens to be open. */
const impossible = { ins: { outcome: 'Employed', userType: 'Current interns' } };
const emptyView = render('management', impossible);
assertBalanced('management/insights-empty', emptyView);
check('filters: an impossible combination reads as empty, not as broken',
  insightsFor(impossible).total === 0 && !/NaN|Infinity|undefined/.test(emptyView) &&
  emptyView.includes('0 of ' + QB.store.data.people.length.toLocaleString() + ' alumni in view') &&
  emptyView.includes('Nobody in this selection has a current place to report.'));
check('filters: no tab divides by an empty selection',
  ['Outcomes', 'Engagement', 'Pipeline', 'Community', 'Partners'].every((tab) => {
    const markup = render('management', Object.assign({ insightsTab: tab }, impossible));
    assertBalanced('management/insights-empty/' + tab, markup);
    return !/NaN|Infinity|undefined/.test(markup);
  }));

/* The range is a window over what happened, not over who exists: it scopes the
   dated collections and the series lengths, and leaves the distributions over
   people — the donut above all — exactly where they were.

   The referral half of the Pipeline tab is what the window actually moves
   here. Every seeded offer's `posted` reads as three months old or less, so
   even the 90-day window holds all twenty of them and the offer funnel is the
   same in every range; the referrals carry real dates and thin out. */
const pipe90 = render('management', { insightsTab: 'Pipeline', range: '90 days' });
const pipeAll = render('management', { insightsTab: 'Pipeline', range: 'All time' });
const ref90 = insightsFor({ range: '90 days' }).pipeline;
const refAll = insightsFor({ range: 'All time' }).pipeline;
const ringOf = (markup) => (markup.match(/stroke-dasharray="[^"]*"/g) || []).join('|');

check('filters: a narrower range submits fewer referrals to the pipeline',
  pipe90 !== pipeAll &&
  Number(ref90.refStats[0].value) < Number(refAll.refStats[0].value) &&
  pipe90.includes('>' + ref90.refStats[0].value + '<') &&
  pipeAll.includes('>' + refAll.refStats[0].value + '<'));
check('filters: the range leaves the outcome donut alone',
  ringOf(render('management', { range: '90 days' })) ===
    ringOf(render('management', { range: 'All time' })));

const engagementTab = render('management', { insightsTab: 'Engagement' });
assertBalanced('management/engagement', engagementTab);
check('engagement: DAU/WAU/MAU tiles', (engagementTab.match(/class="stat"/g) || []).length === 3);
check('engagement: at-risk queue names the people who just went quiet',
  a12.engagement.atRisk.length === 4 &&
  a12.engagement.atRisk.every((r) => engagementTab.includes(r.name) && engagementTab.includes(r.cohort)));

const pipelineTab = render('management', { insightsTab: 'Pipeline' });
assertBalanced('management/pipeline', pipelineTab);
check('pipeline: 3-stage hiring funnel', (pipelineTab.match(/class="funnel__row"/g) || []).length === 3);
check('pipeline: application volume',
  pipelineTab.includes(a12.pipeline.funnel[0].n.toLocaleString()));
check('pipeline: a skills-gap pair per skill in demand',
  (pipelineTab.match(/class="pair"/g) || []).length === a12.pipeline.skillsGap.length);
check('pipeline: referrer leaderboard',
  a12.pipeline.topReferrers.every((r) => pipelineTab.includes(r.name)));

const communityTab = render('management', { insightsTab: 'Community' });
assertBalanced('management/community', communityTab);
check('community: 4-stage formation funnel', (communityTab.match(/class="funnel__row"/g) || []).length === 4);
check('community: spotlight impact', communityTab.includes(a12.community.spotlight.views));
check('community: every event in the window is tracked',
  (communityTab.match(/class="td-strong"/g) || []).length === a12.community.events.length &&
  a12.community.events.every((e) => communityTab.includes(e.title)));

const partnersTab = render('management', { insightsTab: 'Partners' });
assertBalanced('management/partners', partnersTab);
check('partners: org activity table',
  a12.partners.orgTable.every((row) => partnersTab.includes(row.org)));
check('partners: dormant list',
  a12.partners.dormant.length > 0 &&
  a12.partners.dormant.every((row) => partnersTab.includes(row.name)));

/* ── The printed report ────────────────────────────────────────────────
   QB.buildReport is the "Export all insights" button's whole job: one
   document holding all five sections, computed off the same
   QB.insightFilters merge insightsView reads, at whatever the rail is set
   to when the button is pressed. */

const SECTION_NAMES = ['Outcomes', 'Engagement', 'Pipeline', 'Community', 'Partners'];

const report12 = String(QB.buildReport(baseState));
assertBalanced('report/default', report12);
check('report: all five sections are present, in order',
  SECTION_NAMES.every((name) => report12.includes('>' + name + '<')) &&
  SECTION_NAMES.every((name, i) => i === 0 ||
    report12.indexOf('>' + SECTION_NAMES[i - 1] + '<') < report12.indexOf('>' + name + '<')));
check('report: carries the KPI strip', (report12.match(/class="kpi"/g) || []).length === 5);
check('report: states the current range in words',
  report12.includes('Reporting window: last 12 months'));
check('report: a clean rail reads as no filters',
  report12.includes('Filters: none — full roster'));
check('report: the report node is never part of the app render',
  !appEl.innerHTML.includes('id="report"') && !mgmt.includes('id="report"'));

const report90 = String(QB.buildReport(Object.assign({}, baseState, { range: '90 days' })));
assertBalanced('report/range-90', report90);
check('report: the range in words follows state.range',
  report90.includes('Reporting window: last 90 days'));

/* A non-default filter has to show up on the cover, and the body has to be
   computed under it — not just labelled with it. */
const reportCycleState = Object.assign({}, baseState,
  { ins: Object.assign({}, baseState.ins, { cycle: 'Summer ’26' }) });
const reportCycle = String(QB.buildReport(reportCycleState));
const aReportCycle = QB.analytics.compute(QB.insightFilters(reportCycleState));
assertBalanced('report/cycle-filter', reportCycle);
check('report: a non-default filter is named on the cover',
  reportCycle.includes('Filters: Cycle Summer ’26') && !reportCycle.includes('Filters: none'));
check('report: the body is computed from the same filtered subset',
  aReportCycle.total === 200 &&
  reportCycle.includes(aReportCycle.total.toLocaleString() + ' of ' +
    QB.store.data.people.length.toLocaleString() + ' alumni in view') &&
  aReportCycle.kpis.every((k) => reportCycle.includes(k.value)));

const programmes = render('management', { mgmtNav: 'Programmes' });
assertBalanced('management/programmes', programmes);
check('programmes: events section is the default', programmes.includes('Create event'));
check('programmes: 4 sidebar sections', (programmes.match(/class="side-nav__tab/g) || []).length === 4);
check('programmes: sections are a sidebar, not a tab strip', !/class="tabs?"/.test(programmes));

const spotlightTab = render('management', { mgmtNav: 'Programmes', adminTab: 'Spotlight' });
assertBalanced('management/programmes-spotlight', spotlightTab);
check('programmes: featured toggles reflect state',
  (spotlightTab.match(/>\s*Featured\s*</g) || []).length === 2);

const ideasTab = render('management', { mgmtNav: 'Programmes', adminTab: 'Ideastorm' });
assertBalanced('management/programmes-ideastorm', ideasTab);
check('programmes: 3 live ideas', (ideasTab.match(/class="mod"/g) || []).length === 3);
check('programmes: ideas publish without approval',
  !/Approve|Ask for detail|Needs review|Moderation rules/.test(ideasTab));
check('programmes: ideas can still be routed and archived',
  ideasTab.includes('Route to incubation') && ideasTab.includes('Archive'));

const refAdminTab = render('management', { mgmtNav: 'Programmes', adminTab: 'Referrals' });
assertBalanced('management/programmes-referrals', refAdminTab);
check('programmes: 4 referrals in the queue', (refAdminTab.match(/class="td-strong"/g) || []).length === 4);
check('programmes: verification is the first action', refAdminTab.includes('Verify alum'));

const dir = QB.directory;
const alumDir = render('management', { mgmtNav: 'Alumni' });
assertBalanced('management/alumni', alumDir);
check('alumni dir: every record is listed',
  (alumDir.match(/data-act="selectAlum"/g) || []).length === dir.alumni.length);
check('alumni dir: exactly one row is selected',
  (alumDir.match(/class="is-selected"/g) || []).length === 1);
check('alumni dir: 7 filter dropdowns', (alumDir.match(/<select/g) || []).length === 7);
check('alumni dir: profile shows the selected person',
  alumDir.includes('Noor Al-Kuwari') && alumDir.includes('Built the payments service'));
check('alumni dir: career progression is a timeline',
  (alumDir.match(/class="tl"/g) || []).length === dir.alumni[0].progression.length);
check('alumni dir: stale statuses are marked', alumDir.includes('td-stale'));

const alumOther = render('management', { mgmtNav: 'Alumni', alumId: 3 });
assertBalanced('management/alumni-selected', alumOther);
check('alumni dir: selecting swaps the profile',
  alumOther.includes('Co-founder &amp; CEO') && !alumOther.includes('Built the payments service'));
check('alumni dir: a founder timeline reaches Founder level', alumOther.includes('Founder'));

const unreported = render('management', { mgmtNav: 'Alumni', alumId: 10 });
check('alumni dir: an unreported alum is flagged stale', unreported.includes('Stale status'));

const partnerDir = render('management', { mgmtNav: 'Partners' });
assertBalanced('management/partners-dir', partnerDir);
check('partners dir: every org is listed',
  (partnerDir.match(/data-act="selectOrg"/g) || []).length === dir.partners.length);
check('partners dir: 5 filter dropdowns', (partnerDir.match(/<select/g) || []).length === 5);
check('partners dir: detail lists the offers it posted',
  (partnerDir.match(/class="offer"/g) || []).length === dir.partners[0].offers.length);
check('partners dir: detail lists alumni placed there',
  (partnerDir.match(/class="row"/g) || []).length === dir.partners[0].people.length);
check('partners dir: contact details shown', partnerDir.includes('talent@snoonu.qa'));

const emptyOrg = render('management', { mgmtNav: 'Partners', orgId: 7 });
assertBalanced('management/partners-empty', emptyOrg);
check('partners dir: an org that never posted shows empty states',
  (emptyOrg.match(/class="empty empty--flush"/g) || []).length === 2);

/* The whole screen must be free of the approval gate, not just the tab. */
check('management: no approval concept anywhere',
  !/Approve|Needs review/.test(programmes + ideasTab + refAdminTab + mgmt));

const org = render('organization');
assertBalanced('organization', org);
check('organization: all 5 alumni unfiltered', (org.match(/class="talent[ "]/g) || []).length === 5);
check('organization: match count', org.includes('5 matches'));
check('organization: offers are composed from My offers, not here',
  !org.includes('data-field="offerTitle"') && !org.includes('data-act="publishOffer"'));
check('organization: the rail still links through to the offers tab',
  org.includes('Manage all offers'));
check('organization: two nav tabs', (org.match(/class="navtab/g) || []).length === 2);
check('organization: spotlight and pipeline tabs are gone',
  !/>Spotlight</.test(org) && !/>Pipeline</.test(org));
check('organization: no spotlight panel in the rail', !org.includes('panel--ink'));
check('organization: featured alumni get their own ground',
  (org.match(/talent--spotlight/g) || []).length === 2);
check('organization: spotlight filter is in the rail', org.includes('class="spot-filter"'));

const spotOnly = render('organization', { spotlightOnly: true });
assertBalanced('organization/spotlight-filter', spotOnly);
check('organization: spotlight filter narrows to featured alumni',
  (spotOnly.match(/class="talent talent--spotlight"/g) || []).length === 2 &&
  (spotOnly.match(/class="talent[ "]/g) || []).length === 2);
check('organization: the active filter reads as pressed', spotOnly.includes('aria-pressed="true"'));

const filtered = render('organization', { query: 'figma' });
check('organization: query narrows the list', (filtered.match(/class="talent[ "]/g) || []).length === 1);
check('organization: query is echoed into the field', filtered.includes('value="figma"'));

const openNow = render('organization', { avail: 'Open now' });
check('organization: availability filter', (openNow.match(/class="talent[ "]/g) || []).length === 2);

const skillFilter = render('organization', { skill: 'Python' });
check('organization: skill filter', (skillFilter.match(/class="talent[ "]/g) || []).length === 2);

const none = render('organization', { query: 'zzzz', spotlightOnly: true });
check('organization: empty state', none.includes('class="empty"'));

const myOffers = render('organization', { orgTab: 'My offers' });
assertBalanced('organization/my-offers', myOffers);
check('my offers: every offer is listed',
  (myOffers.match(/class="offercard[ "]/g) || []).length === QB.data.liveOffers.length);
check('my offers: summary totals are derived from the offers',
  myOffers.includes('>95<') && myOffers.includes('>31<') && myOffers.includes('>2<'));
check('my offers: only open offers count as live', myOffers.includes('3 live'));
check('my offers: exactly one card is selected',
  (myOffers.match(/offercard is-selected/g) || []).length === 1);
check('my offers: the detail shows a 4-stage funnel',
  (myOffers.match(/class="funnel__row"/g) || []).length === 4);
check('my offers: applicants resolve to real people', myOffers.includes('Noor Al-Kuwari'));

const closedOnly = render('organization', { orgTab: 'My offers', offerStatus: 'Closed' });
assertBalanced('organization/my-offers-filtered', closedOnly);
check('my offers: status filter narrows the list',
  (closedOnly.match(/class="offercard[ "]/g) || []).length === 2);
check('my offers: filtering reselects within the visible set',
  closedOnly.includes('Mobile Engineer (iOS)'));

const filledOffer = render('organization', { orgTab: 'My offers', offerId: 4 });
check('my offers: a filled offer offers a repost, not a close', filledOffer.includes('Repost'));

/* Composing an offer moved here from Talent search; it takes the right rail so
   the offers already posted stay in view. */
check('my offers: the form is closed until Post an offer is pressed',
  !myOffers.includes('data-field="offerTitle"') && myOffers.includes('data-act="composeOffer"'));

const composing = render('organization', { orgTab: 'My offers', composing: true });
assertBalanced('organization/composing', composing);
check('my offers: composing opens the form', composing.includes('data-field="offerTitle"'));
check('my offers: composing replaces the detail, not the list',
  !composing.includes('class="funnel__row"') &&
  (composing.match(/class="offercard[ "]/g) || []).length === QB.data.liveOffers.length);
/* No card may read as selected while the rail is showing the form instead. */
check('my offers: composing clears the selected card',
  !composing.includes('offercard is-selected') && !composing.includes('aria-selected="true"'));
check('my offers: publish disabled with an empty title',
  /data-act="publishOffer"\s+disabled>/.test(composing));
check('my offers: composing is cancellable', composing.includes('data-act="cancelOffer"'));

const ready = render('organization', {
  orgTab: 'My offers', composing: true,
  offer: Object.assign({}, baseState.offer, { title: 'CTO' })
});
check('my offers: publish enabled once a title is typed',
  ready.includes('data-act="publishOffer"') && !/data-act="publishOffer"\s+disabled>/.test(ready));

/* Interpolated text must be escaped, not injected. */
const injected = render('organization', { query: '<img src=x onerror=alert(1)>' });
check('organization: user input is escaped', !injected.includes('<img src=x'));
assertBalanced('organization/injection', injected);

/* ── The seeded store ─────────────────────────────────────────────────
   Nothing renders from QB.store yet — the screens still read QB.data. What
   is asserted here is that the fixture underneath them is the right shape,
   survives a round-trip through storage, and rebuilds identically. */

const STORE_KEY = 'qstpBeyond.seed.v3';
const store = QB.store.data;

check('store: the roster is the full 1,842', store.people.length === 1842);
check('store: six cycles, stamped in the meta',
  store.meta.cycles.length === 6 && store.meta.version === 3 && store.meta.seed === 20260731);
check('store: the cycles on the meta are the cycles on the people',
  store.meta.cycles.every((c) => store.people.some((p) => p.cycle === c)) &&
  store.people.every((p) => store.meta.cycles.includes(p.cycle)));
check('store: the current cycle is the last one', store.meta.currentCycle === 'Summer ’26');

const current = store.people.filter((p) => p.cycle === store.meta.currentCycle);
check('store: 200 people are in the current cycle', current.length === 200);
check('store: everyone in the current cycle is a current intern',
  current.every((p) => p.kind === 'intern' && p.status === 'Intern'));
check('store: nobody outside it is an intern',
  store.people.filter((p) => p.kind === 'intern').length === current.length);

/* The prototype viewer is not a separate fixture — he is the first
   'Summer ’26' record (id 1643), turned into a fixed identity. The
   transform replaces that record in place, so the roster stays 1,842. */
const viewerId = store.meta.viewerId;
const seededViewer = store.people.find((p) => p.id === viewerId);
check('store: meta.viewerId resolves to Faisal Elbadri, the alum',
  viewerId === 711 && !!seededViewer && seededViewer.name === 'Faisal Elbadri' &&
  seededViewer.initials === 'FE' && seededViewer.status === 'Employed' && seededViewer.kind === 'alumni');
check('store: the viewer is an alum of a past cycle, working at Snoonu',
  seededViewer.cycle === 'Summer ’25' && seededViewer.cycle !== store.meta.currentCycle &&
  seededViewer.employer === 'Snoonu' && seededViewer.employerKind === 'Host startup');
check('store: the transform replaced a record rather than appending one',
  store.people.filter((p) => p.id === 711).length === 1);
/* Overwriting inside a cycle rather than appending keeps every intake exact. */
check('store: no cycle lost or gained a place to the viewer transform',
  store.meta.cycles.map((c) => store.people.filter((p) => p.cycle === c).length)
    .join(',') === '348,362,340,330,262,200');

check('store: 8 partners', store.partners.length === 8);
const noor = store.partners.find((p) => p.name === 'NOOR');
check('store: NOOR is one of them', !!noor);
check('store: NOOR is credited to Ideastorm', !!noor && noor.note.includes('Ideastorm'));

const snoonu = store.partners.find((p) => p.name === 'Snoonu');
const snoonuRoster = store.people.filter((p) => p.employer === 'Snoonu');
check('store: Snoonu’s partner alumni stat counts the viewer',
  !!snoonu && snoonuRoster.some((p) => p.id === viewerId) &&
  snoonu.stats.alumni === snoonuRoster.length);

check('store: 20 offers', store.offers.length === 20);
check('store: every funnel narrows at each stage',
  store.offers.every((o) => o.funnel.applied >= o.funnel.shortlisted &&
    o.funnel.shortlisted >= o.funnel.interviewed &&
    o.funnel.interviewed >= o.funnel.hired && o.funnel.hired >= 0));
check('store: every offer belongs to a partner',
  store.offers.every((o) => store.partners.some((p) => p.name === o.org)));

const peopleById = new Map(store.people.map((p) => [p.id, p]));
check('store: 12 ideas', store.ideas.length === 12);
check('store: every idea owner resolves to a person',
  store.ideas.every((i) => peopleById.has(i.ownerId)));
check('store: the denormalized owner name matches the record',
  store.ideas.every((i) => peopleById.get(i.ownerId).name === i.owner));

/* Persistence: the boot above should have written the world it handed back. */
check('store: the seed was persisted under its key', typeof cache[STORE_KEY] === 'string');
check('store: what was persisted is what booted',
  JSON.stringify(JSON.parse(cache[STORE_KEY])) === JSON.stringify(store));

/* A reload reads the cache instead of regenerating — same JSON either way,
   which is exactly why a corrupt cache can be thrown away without ceremony. */
const cached = JSON.parse(cache[STORE_KEY]);
check('store: the cached copy is a complete world',
  ['meta', 'people', 'partners', 'offers', 'jobs', 'ideas', 'events', 'referrals', 'spotlight']
    .every((k) => cached[k] !== undefined));

const before = JSON.stringify(store);
const regenerated = QB.store.reset();
check('store: reset rewrites the key', typeof cache[STORE_KEY] === 'string');
check('store: the fixed seed makes reset byte-identical',
  JSON.stringify(regenerated) === before);
check('store: reset swaps in the fresh data', QB.store.data === regenerated);

/* ── QB.applyAnswers / QB.statusLine ──────────────────────────────────
   Run against a throwaway clone of a seeded person, so nothing here
   disturbs the store checks above or QB.store.data's identity. */

const employedAnswers = Object.assign(QB.blankAnswers(), {
  status: 'Employed', location: 'Qatar', company: 'Snoonu',
  role: 'Backend Engineer', seniority: 'Senior'
});
const employedScratch = JSON.parse(JSON.stringify(store.people[0]));
QB.applyAnswers(employedScratch, employedAnswers);
check('applyAnswers: an Employed sheet sets role, employer, fresh and lastUpdate',
  employedScratch.status === 'Employed' && employedScratch.role === 'Backend Engineer' &&
  employedScratch.employer === 'Snoonu' && employedScratch.employerKind === 'Host startup' &&
  employedScratch.fresh === true && employedScratch.lastUpdate === 'Jul 2026');
check('applyAnswers: it unshifts a progression head for the new role',
  employedScratch.progression[0].year === 'Jul 2026' &&
  employedScratch.progression[0].title === 'Backend Engineer' &&
  employedScratch.progression[0].org === 'Snoonu');

const headCountAfterFirst = employedScratch.progression.length;
QB.applyAnswers(employedScratch, employedAnswers);
check('applyAnswers: repeating the same answers does not stack a duplicate head',
  employedScratch.progression.length === headCountAfterFirst);

const lookingScratch = JSON.parse(JSON.stringify(store.people[0]));
lookingScratch.skills = ['Go', 'Python'];
QB.applyAnswers(lookingScratch, Object.assign(QB.blankAnswers(), {
  status: 'Looking', location: 'Qatar', lookingFor: ['Full-time'], skills: ['Figma', 'SQL']
}));
check('applyAnswers: a Looking sheet replaces skills',
  JSON.stringify(lookingScratch.skills) === JSON.stringify(['Figma', 'SQL']) &&
  lookingScratch.status === 'Looking' && lookingScratch.employer === null);

check('statusLine: covers Intern and Founder',
  QB.statusLine({ status: 'Intern', employer: 'Snoonu' }) === 'Intern at Snoonu' &&
  QB.statusLine({ status: 'Founder', startup: 'Souq Stack', stage: 'Launched' }) ===
    'Founder at Souq Stack · Launched');

/* ── store.save() ──────────────────────────────────────────────────── */

const saveTarget = QB.store.data.people.find((p) => p.id === QB.store.data.meta.viewerId);
QB.applyAnswers(saveTarget, employedAnswers);
QB.store.save();
const savedCache = JSON.parse(cache[STORE_KEY]);
const savedRecord = savedCache.people.find((p) => p.id === QB.store.data.meta.viewerId);
check('store.save: the mutation reaches the stub cache',
  !!savedRecord && savedRecord.status === 'Employed' && savedRecord.role === 'Backend Engineer' &&
  savedRecord.employer === 'Snoonu' && savedRecord.lastUpdate === 'Jul 2026');

/* ── Surviving a cache the code no longer understands ─────────────────
   A version stamp is a promise about shape, not proof of one. A payload that
   claims the current version but cannot answer "who is the viewer?" used to
   throw inside statusCard, and because a screen is one expression that threw
   away the entire page — the alumni dashboard rendered blank, prototype bar
   and all. Both halves of that are now tested: the store refuses the payload,
   and a screen that throws anyway is contained. */

const goodCache = cache[STORE_KEY];

/* Re-running store.js is exactly what a page load does, so poisoning the cache
   and evaluating the module again tests the real read path rather than a
   paraphrase of it. */
const bootStoreWith = (payload) => {
  cache[STORE_KEY] = payload;
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/store.js'), 'utf8'), sandbox,
    { filename: 'src/store.js' });
  return QB.store.data;
};

const poison = (mutate) => {
  const parsed = JSON.parse(goodCache);
  mutate(parsed);
  return JSON.stringify(parsed);
};

[
  ['an empty roster', (d) => { d.people = []; }],
  ['a viewer id that resolves to nobody', (d) => { d.meta.viewerId = 999999; }],
  ['a roster that is not an array', (d) => { d.people = {}; }],
  ['a missing collection', (d) => { delete d.partners; }]
].forEach(([label, mutate]) => {
  const data = bootStoreWith(poison(mutate));
  check('store: ' + label + ' is rebuilt, not trusted',
    data.people.length === 1842 && !!QB.store.viewer());
});

/* Truncated JSON and a superseded stamp were already handled; assert they
   still are, now that the shape gate sits behind them. */
check('store: a truncated cache is still rebuilt',
  bootStoreWith('{"meta":{"version":2},"people":').people.length === 1842);
check('store: a superseded version is still rebuilt',
  bootStoreWith(poison((d) => { d.meta.version = 1; })).people.length === 1842);

bootStoreWith(goodCache);
check('store: a sound cache is used as it stands',
  QB.store.data.people.length === 1842 && QB.store.viewer().name === 'Faisal Elbadri');
check('store: the viewer resolves through one shared door',
  typeof QB.store.viewer === 'function' &&
  QB.store.viewer().id === QB.store.data.meta.viewerId);

/* ── The survey reaches the dashboard ─────────────────────────────────
   The point of the whole wiring: a status saved on the alumni screen has to
   move a figure on the management one. Kept until last because it changes the
   viewer's record for good — every expectation above is derived at the moment
   it is asserted, so this cannot reach back and unsettle them. */

const founderAnswers = Object.assign(QB.blankAnswers(), {
  status: 'Founder', location: 'Qatar', startup: 'Souq Stack',
  stage: 'Launched', incubator: 'QSTP', ideastorm: 'Yes'
});
const foundersBefore = insightsFor().kpis[3].value;
QB.applyAnswers(
  QB.store.data.people.find((p) => p.id === QB.store.data.meta.viewerId),
  founderAnswers
);
QB.store.save();
const foundersAfter = insightsFor().kpis[3].value;
const count = (value) => Number(String(value).replace(/,/g, ''));

check('survey → dashboard: founding a startup lands on the KPI strip',
  count(foundersAfter) === count(foundersBefore) + 1 &&
  render('management').includes('>' + foundersAfter + '<'));
check('survey → dashboard: the donut counts the new founder too',
  insightsFor().outcomes.some((s) => s.label === 'Founded a company' &&
    s.n === count(foundersAfter)));

console.log(failures ? `\n${failures} failing check(s)` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
