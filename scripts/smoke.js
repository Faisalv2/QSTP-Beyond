/* Renders every screen in a stub DOM and asserts the markup is well-formed
   and carries the values the design calls for. Run: node scripts/smoke.js */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SOURCES = [
  'src/data.js', 'src/data-insights.js', 'src/data-directory.js',
  'src/data-survey.js', 'src/ui.js',
  'src/screens/alumni.js', 'src/screens/alumni-survey.js', 'src/screens/alumni-jobs.js',
  'src/screens/alumni-ideastorm.js', 'src/screens/alumni-referrals.js',
  'src/screens/management.js',
  'src/screens/insights-outcomes.js', 'src/screens/insights-engagement.js',
  'src/screens/insights-pipeline.js', 'src/screens/insights-community.js',
  'src/screens/insights-partners.js',
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

const sandbox = {
  console,
  document: {
    activeElement: null,
    body: { dataset: {} },
    addEventListener() {},
    getElementById: (id) => (id === 'app' ? appEl : null)
  },
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
  survey: { open: false, gated: null, step: 0, answers: QB.blankAnswers() }
};
const render = (screen, overrides) =>
  String(QB.screens[screen](Object.assign({}, baseState, overrides)));

/* A survey mid-flight: `answers` overrides are merged onto a blank sheet. */
const survey = (over) => {
  const s = Object.assign({ open: true, gated: null, step: 0 }, over);
  s.answers = Object.assign(QB.blankAnswers(), over && over.answers);
  return render('alumni', { survey: s, statusUpdated: false });
};

/* Boot render happened during load. */
check('app mounts on load', appEl.innerHTML.includes('proto-bar'));
check('boot screen is alumni', appEl.innerHTML.includes('Good morning, Layla.'));
assertBalanced('boot markup', appEl.innerHTML);

const alumni = render('alumni');
assertBalanced('alumni', alumni);
check('alumni: 4 spotlight entries, stacked', (alumni.match(/class="spot-row"/g) || []).length === 4);
check('alumni: 4 events', (alumni.match(/class="event"/g) || []).length === 4);
check('alumni: events run the full side column', alumni.includes('panel--stretch'));
check('alumni: profile meter at 80%', alumni.includes('width:80%'));
check('alumni: no points anywhere', !/\bpts\b|class="points/.test(alumni));
check('alumni: Events is off the nav', !alumni.includes('>Events</a>'));
check('alumni: no public-profile button', !alumni.includes('View your public profile'));
check('alumni: four nav tabs', (alumni.match(/class="navtab/g) || []).length === 4);
check('alumni: the survey is not up until asked for', !alumni.includes('survey-scrim'));
check('alumni: Update my status opens it', alumni.includes('data-act="openSurvey"'));
check('alumni: the three gated tabs are marked', (alumni.match(/navtab--locked/g) || []).length === 3);

/* ── The status survey ────────────────────────────────────────────── */

const S = QB.surveyData;

const q1 = survey();
assertBalanced('alumni/survey-core', q1);
check('survey: the page behind it is blurred', q1.includes('class="survey-scrim"'));
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

/* The express path: the status on file is still true, so no survey is needed. */
const unasked = render('alumni');
check('as-is: the card asks about the status on file',
  unasked.includes(QB.data.viewer.currentStatus + ' — still right?') &&
  unasked.includes('last confirmed ' + QB.data.viewer.statusSince));
check('as-is: confirming it is one click', unasked.includes('data-act="confirmStatus"'));

const asIs = render('alumni', { statusUpdated: true, statusSource: 'confirmed' });
assertBalanced('alumni/confirmed-as-is', asIs);
check('as-is: the status on file is kept, not blanked',
  asIs.includes(QB.data.viewer.currentStatus) && !asIs.includes('still right?'));
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
  render('alumni', { tab: 'Nope' }).includes('Good morning, Layla.'));

const mgmt = render('management');
assertBalanced('management/outcomes', mgmt);
check('management: 5-KPI strip', (mgmt.match(/class="kpi"/g) || []).length === 5);
check('management: 5 sidebar sections', (mgmt.match(/class="side-nav__tab/g) || []).length === 5);
check('management: 9 global filters', (mgmt.match(/<select/g) || []).length === 9);
check('management: range label', mgmt.includes('Showing 12 months'));

/* The reporting range moved off the appbar into the insights filter rail, and
   is the one filter there that is actually wired. */
check('management: no range or export on the appbar',
  !mgmt.includes('class="segbar"') && !/>Export</.test(mgmt));
check('management: range is a filter in the rail',
  /<select class="input input--sm" id="f-time-range"\s+data-field="range">/.test(mgmt));
check('management: the rail select carries the current range',
  /<option selected>12 months<\/option>/.test(mgmt));
check('management: export lives in the insights tab', mgmt.includes('Export all insights'));

const range90 = render('management', { range: '90 days' });
assertBalanced('management/range-90', range90);
check('management: changing the range is reflected back',
  range90.includes('Showing 90 days') && /<option selected>90 days<\/option>/.test(range90));

/* Only Insights has the range; the other three workspaces must not claim one. */
const progRange = render('management', { mgmtNav: 'Programmes' });
check('management: the range filter is scoped to Insights',
  !progRange.includes('Showing 12 months') && !progRange.includes('Export all insights'));
check('management: 7-slice outcome legend', (mgmt.match(/class="legend__row"/g) || []).length === 7);
check('management: donut centre reflects the slices in work', mgmt.includes('68%'));
check('management: conversion headline', mgmt.includes('7.2%'));

/* The donut must consume the whole circumference. */
const dashes = [...mgmt.matchAll(/stroke-dasharray="([\d.]+) ([\d.]+)"/g)].map(m => +m[1]);
const circumference = 2 * Math.PI * 70;
check('management: donut slices sum to the full ring',
  Math.abs(dashes.reduce((a, b) => a + b, 0) - circumference) < 0.5);

const engagementTab = render('management', { insightsTab: 'Engagement' });
assertBalanced('management/engagement', engagementTab);
check('engagement: DAU/WAU/MAU tiles', (engagementTab.match(/class="stat"/g) || []).length === 3);
check('engagement: at-risk queue', engagementTab.includes('Ali Mansour'));

const pipelineTab = render('management', { insightsTab: 'Pipeline' });
assertBalanced('management/pipeline', pipelineTab);
check('pipeline: 3-stage hiring funnel', (pipelineTab.match(/class="funnel__row"/g) || []).length === 3);
check('pipeline: application volume', pipelineTab.includes('531'));
check('pipeline: 6 skills-gap pairs', (pipelineTab.match(/class="pair"/g) || []).length === 6);
check('pipeline: referrer leaderboard', pipelineTab.includes('Rashid Tamim'));

const communityTab = render('management', { insightsTab: 'Community' });
assertBalanced('management/community', communityTab);
check('community: 4-stage formation funnel', (communityTab.match(/class="funnel__row"/g) || []).length === 4);
check('community: spotlight impact', communityTab.includes('+212%'));
check('community: 4 events tracked', (communityTab.match(/class="td-strong"/g) || []).length === 4);

const partnersTab = render('management', { insightsTab: 'Partners' });
assertBalanced('management/partners', partnersTab);
check('partners: org activity table', partnersTab.includes('Snoonu'));
check('partners: dormant list', partnersTab.includes('Baladna Digital'));

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

console.log(failures ? `\n${failures} failing check(s)` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
