/* Renders every screen in a stub DOM and asserts the markup is well-formed
   and carries the values the design calls for. Run: node scripts/smoke.js */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SOURCES = [
  'src/data.js', 'src/ui.js',
  'src/screens/alumni.js', 'src/screens/alumni-jobs.js',
  'src/screens/alumni-ideastorm.js', 'src/screens/alumni-referrals.js',
  'src/screens/management.js', 'src/screens/organization.js',
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
  screen: 'alumni', tab: 'Home', range: '12 months', adminTab: 'Events',
  featured: { 1: true, 3: true }, query: '', avail: 'Any', skill: 'Any skill',
  cohort: 'All cohorts',
  offer: { title: '', loc: '', pay: '', skills: '', type: 'Full-time', prioritise: true },
  offers: QB.data.liveOffers.slice()
};
const render = (screen, overrides) =>
  String(QB.screens[screen](Object.assign({}, baseState, overrides)));

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
assertBalanced('management', mgmt);
check('management: 4 KPIs', (mgmt.match(/class="kpi"/g) || []).length === 4);
check('management: range label', mgmt.includes('Showing 12 months'));
check('management: donut ring per outcome', (mgmt.match(/<circle/g) || []).length >= 5);
check('management: line ends at the headline value', mgmt.includes('7.2%'));
check('management: events tab active', mgmt.includes('Create event'));

/* The donut must consume the whole circumference. */
const dashes = [...mgmt.matchAll(/stroke-dasharray="([\d.]+) ([\d.]+)"/g)].map(m => +m[1]);
const circumference = 2 * Math.PI * 70;
check('management: donut slices sum to the full ring',
  Math.abs(dashes.reduce((a, b) => a + b, 0) - circumference) < 0.5);

const spotlightTab = render('management', { adminTab: 'Spotlight' });
assertBalanced('management/spotlight', spotlightTab);
check('management: featured toggles reflect state',
  (spotlightTab.match(/>\s*Featured\s*</g) || []).length === 2);

const ideasTab = render('management', { adminTab: 'Ideastorm' });
assertBalanced('management/ideastorm', ideasTab);
check('management: 3 moderation items', (ideasTab.match(/class="mod"/g) || []).length === 3);

const org = render('organization');
assertBalanced('organization', org);
check('organization: all 5 alumni unfiltered', (org.match(/class="talent"/g) || []).length === 5);
check('organization: match count', org.includes('5 matches'));
check('organization: publish disabled with an empty title', org.includes('disabled'));

const filtered = render('organization', { query: 'figma' });
check('organization: query narrows the list', (filtered.match(/class="talent"/g) || []).length === 1);
check('organization: query is echoed into the field', filtered.includes('value="figma"'));

const openNow = render('organization', { avail: 'Open now' });
check('organization: availability filter', (openNow.match(/class="talent"/g) || []).length === 2);

const skillFilter = render('organization', { skill: 'Python' });
check('organization: skill filter', (skillFilter.match(/class="talent"/g) || []).length === 2);

const none = render('organization', { query: 'zzzz' });
check('organization: empty state', none.includes('class="empty"'));

const ready = render('organization', { offer: Object.assign({}, baseState.offer, { title: 'CTO' }) });
check('organization: publish enabled once a title is typed', !ready.includes('disabled'));

/* Interpolated text must be escaped, not injected. */
const injected = render('organization', { query: '<img src=x onerror=alert(1)>' });
check('organization: user input is escaped', !injected.includes('<img src=x'));
assertBalanced('organization/injection', injected);

console.log(failures ? `\n${failures} failing check(s)` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
