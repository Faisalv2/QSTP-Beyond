/* Real analytics over the seeded world.

   src/data-insights.js used to invent every figure the management Insights
   screens draw; it is gone. This file computes the same shapes — same
   top-level keys, same per-item field names — from QB.store.data instead, so
   the five tabs and the KPI strip are pointed at something that reconciles:
   donut slices that sum to the roster, a "fresh %" that is a real fraction, a
   founder count that is a real count.

   Three rules run through the whole file.

   1. Deterministic and pure. No Math.random, no Date. "Now" is the fixed
      July 2026 the rest of the prototype assumes, so two runs — or a run
      under Node and a run in a browser — agree to the byte.

   2. Honest about what the seed does not contain. The world has people,
      partners, offers, ideas, events and referrals; it has no event log, no
      page views, no session history. Blocks that would need one are derived
      as documented proxies from counts that *are* real, and every such
      formula is commented as a proxy where it appears. Nothing here invents
      a number without saying so.

   3. Never NaN, never Infinity, never negative. Filters can produce an empty
      subset (outcome "Employed" plus user type "Current interns" is empty by
      construction), so every division is guarded and every block has a
      zeroed form. Series that feed ui.lineChart / ui.cols always carry at
      least two points, because those helpers divide by series.length - 1. */
(function (QB) {
  'use strict';

  var P = QB.palette;

  /* ── Fixed clock ──────────────────────────────────────────────────── */

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var MONTH_INDEX = {};
  (function () {
    var i;
    for (i = 0; i < MONTHS.length; i++) MONTH_INDEX[MONTHS[i]] = i;
  })();

  /* Absolute month number, so date maths is integer subtraction. Jul 2026 is
     the same "now" seed-people.js bakes in — the two must not drift. */
  var NOW_YEAR = 2026;
  var NOW_MONTH = 6;
  var NOW_ABS = NOW_YEAR * 12 + NOW_MONTH;

  /* ── The range window ─────────────────────────────────────────────────
     `range` is a TIME WINDOW, not a people filter. It never removes a person
     from the subset: a person's status is a state, not an event, so every
     distribution over people (the outcome donut, by-cycle, by-field,
     employers, freshness, completeness, retention, progression, engagement
     counts) ignores it completely. What it does scope is the dated
     collections — offers (via their 'posted' vocabulary), referrals (via
     their '12 Jun 2026' dates), events — and the length of every series.
     Windows are 3 / 12 / Infinity months back from the fixed July 2026.

     `quarters`, `weeks` and `events` are the series lengths each window
     gets; all are >= 2 so the chart helpers, which divide by length - 1,
     cannot produce Infinity. */
  var RANGES = {
    '90 days':   { months: 3,        quarters: 2, weeks: 6,  events: 4 },
    '12 months': { months: 12,       quarters: 4, weeks: 8,  events: 8 },
    'All time':  { months: Infinity, quarters: 8, weeks: 12, events: 12 }
  };

  var DEFAULTS = {
    range: '12 months',
    cycle: 'All cycles',
    outcome: 'All outcomes',
    skill: 'All skills',
    host: 'All hosts',
    employer: 'All employers',
    location: 'Qatar & abroad',
    userType: 'Interns + alumni',
    engagement: 'Any activity'
  };

  /* ── Small numeric helpers — all of them guard an empty denominator ── */

  function safeDiv(a, b) { return b > 0 ? a / b : 0; }
  function pct(n, d) { return d > 0 ? (n / d) * 100 : 0; }
  function pctRounded(n, d) { return Math.round(pct(n, d)); }
  function pctStr(n, d) { return pctRounded(n, d) + '%'; }
  function one(x) { return Math.round(x * 10) / 10; }

  /* Thousands separators without a locale — String#toLocaleString varies by
     host, and the fixtures this replaces were plain '1,842'. */
  function commas(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function signed(n) { return (n >= 0 ? '+' : '−') + Math.abs(n); }
  /* Only --up and --down exist in app.css, so a flat delta reads as "up". */
  function tone(n) { return n >= 0 ? 'up' : 'down'; }

  /* A round axis maximum at or above `v`, never 0 (charts divide by it). */
  function niceMax(v) {
    if (!(v > 0)) return 1;
    if (v <= 10) return Math.ceil(v);
    var magnitude = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
    var step = magnitude / 2;
    return Math.ceil(v / step) * step;
  }

  /* Integer percentages that sum to exactly 100 — largest remainder, so a
     stacked bar always fills its track and never overflows it. An all-zero
     input stays all-zero rather than inventing a split. */
  function sharesTo100(counts) {
    var total = counts.reduce(function (s, n) { return s + n; }, 0);
    var out = counts.map(function () { return 0; });
    if (total <= 0) return out;

    var floors = [];
    var used = 0;
    var i;
    for (i = 0; i < counts.length; i++) {
      var exact = (counts[i] / total) * 100;
      var f = Math.floor(exact);
      floors.push({ i: i, rem: exact - f });
      out[i] = f;
      used += f;
    }
    floors.sort(function (a, b) { return b.rem - a.rem || a.i - b.i; });
    for (i = 0; i < 100 - used; i++) out[floors[i % floors.length].i] += 1;
    return out;
  }

  function tally(list, keyOf) {
    var counts = {};
    var order = [];
    list.forEach(function (item) {
      var key = keyOf(item);
      if (key == null || key === '') return;
      if (!Object.prototype.hasOwnProperty.call(counts, key)) { counts[key] = 0; order.push(key); }
      counts[key] += 1;
    });
    return order.map(function (key) { return { key: key, n: counts[key] }; });
  }

  /* Descending by count, then by first-seen order — stable across engines,
     which Array#sort alone is not guaranteed to be for equal keys. */
  function byCountDesc(rows) {
    return rows.slice().sort(function (a, b) { return b.n - a.n || a.key.localeCompare(b.key); });
  }

  /* ── Date parsing ─────────────────────────────────────────────────── */

  /* 'Mar 2025' → months before now. Unparseable input reads as "now" rather
     than NaN, which would poison every average it touches. */
  function monthsAgoFromMonthYear(str) {
    if (!str) return 0;
    var parts = String(str).split(' ');
    var m = MONTH_INDEX[parts[0]];
    var y = parseInt(parts[1], 10);
    if (m == null || !isFinite(y)) return 0;
    return Math.max(0, NOW_ABS - (y * 12 + m));
  }

  /* '12 Jun 2026' → months before now; negative for a future date, which the
     seeded events calendar is full of. */
  function monthsFromMonthYearDay(str) {
    if (!str) return 0;
    var parts = String(str).split(' ');
    var m = MONTH_INDEX[parts[1]];
    var y = parseInt(parts[2], 10);
    if (m == null || !isFinite(y)) return 0;
    return NOW_ABS - (y * 12 + m);
  }

  function dayOf(str) {
    var d = parseInt(String(str).split(' ')[0], 10);
    return isFinite(d) ? d : 1;
  }

  /* The offers' `posted` field is a vocabulary, not a date (seed-world.js
     POSTED_POOL plus the six hand-written Snoonu rows). This is the lookup
     that turns it into months; anything outside the table falls through to a
     generic parse so a new phrase degrades instead of breaking. */
  var POSTED_MONTHS = {
    'today': 0, '2 days ago': 0, '4 days ago': 0, '9 days ago': 0,
    '1 week ago': 0, '2 weeks ago': 0, '3 weeks ago': 1, '5 weeks ago': 1,
    '2 months ago': 2, '3 months ago': 3
  };

  function postedMonthsAgo(posted) {
    if (posted == null) return 0;
    var key = String(posted);
    if (Object.prototype.hasOwnProperty.call(POSTED_MONTHS, key)) return POSTED_MONTHS[key];
    var m = /^(\d+)\s+(day|week|month|year)s?\s+ago$/.exec(key);
    if (!m) return 0;
    var n = parseInt(m[1], 10);
    if (m[2] === 'day') return Math.floor(n / 30);
    if (m[2] === 'week') return Math.floor(n / 4.345);
    if (m[2] === 'year') return n * 12;
    return n;
  }

  function monthsAgoLabel(n) {
    if (n <= 0) return 'this month';
    if (n === 1) return '1 month ago';
    return n + ' months ago';
  }

  /* ── Series labels — computed from the fixed clock, never from Date ── */

  function quarterLabel(abs) {
    var y = Math.floor(abs / 12);
    var m = abs - y * 12;
    return 'Q' + (Math.floor(m / 3) + 1) + '·' + String(y).slice(2);
  }

  function monthLabel(abs) {
    var y = Math.floor(abs / 12);
    return MONTHS[abs - y * 12];
  }

  /* Week endings counting back from Mon 27 Jul 2026, newest last. A constant
     rather than calendar arithmetic — there is no Date in this file. */
  var WEEK_LABELS = ['11 May', '18 May', '25 May', '1 Jun', '8 Jun', '15 Jun',
    '22 Jun', '29 Jun', '6 Jul', '13 Jul', '20 Jul', '27 Jul'];

  function lastN(arr, n) {
    return arr.slice(Math.max(0, arr.length - Math.max(2, n)));
  }

  /* Every series handed to ui.lineChart / ui.cols goes through this: those
     helpers step by (length - 1), so a one-point series divides by zero. */
  function atLeastTwo(points, label) {
    if (points.length >= 2) return points;
    if (points.length === 1) return [{ label: label, value: 0 }].concat(points);
    return [{ label: label, value: 0 }, { label: label, value: 0 }];
  }

  /* ── Vocabularies derived from the store ──────────────────────────── */

  /* The order the outcome donut and the outcome filter both use. Anything
     the store grows that is not on this list is appended, so a new status in
     the seed shows up rather than vanishing. */
  var STATUS_ORDER = ['Employed', 'Founder', 'Studying', 'Freelancing', 'Looking',
    'Break', 'Intern', 'Unreported'];

  var STATUS_LABEL = {
    Employed: 'Employed',
    Founder: 'Founded a company',
    Studying: 'Studying',
    Freelancing: 'Freelancing',
    Looking: 'Job-seeking',
    Break: 'Career break',
    Intern: 'Current interns',
    Unreported: 'Unreported'
  };

  /* The outcome filter's options wear the display labels (the donut legend's
     vocabulary), while selectPeople matches raw status keys — this reverse
     map lets normalize() accept either, so 'Founded a company' from the rail
     and 'Founder' from a test both land on the same subset. */
  var LABEL_STATUS = {};
  Object.keys(STATUS_LABEL).forEach(function (key) { LABEL_STATUS[STATUS_LABEL[key]] = key; });

  var STATUS_COLOR = {
    Employed: P.ink,
    Founder: P.teal,
    Studying: P.tealPale,
    Freelancing: P.tealMid,
    Looking: P.inkDeep,
    Break: P.tealDeep,
    Intern: P.lime,
    Unreported: P.grey
  };

  /* Working now, in the sense the donut centre means it: a placement, a
     company of their own, client work, or a live internship. */
  var IN_WORK = { Employed: 1, Founder: 1, Freelancing: 1, Intern: 1 };

  /* A person's specialization. person.field is only populated on the
     Studying branch of the generator, so it cannot describe the roster;
     skills can, and every person has three to five of them. Each person
     lands in the field they match most skills in, ties broken by the order
     below. */
  var FIELDS = [
    { label: 'Software', skills: ['Go', 'Python', 'React', 'TypeScript', 'Node', 'Java', 'Kotlin', 'Swift', 'Mobile', 'gRPC'] },
    { label: 'Data / AI', skills: ['SQL', 'Machine learning', 'Data analysis', 'PyTorch', 'MLOps', 'Excel', 'Looker'] },
    { label: 'Design', skills: ['Figma', 'UX research', 'Arabic UX'] },
    { label: 'Cloud / DevOps', skills: ['DevOps', 'Cloud / AWS', 'Docker', 'Kubernetes', 'Terraform', 'Postgres'] },
    { label: 'Product / Growth', skills: ['Product management', 'Growth marketing', 'Payments', 'Fundraising'] },
    { label: 'Hardware / Research', skills: ['Hardware / IoT', 'Research writing', 'Materials', 'Simulation'] }
  ];

  function fieldOf(person) {
    var skills = person.skills || [];
    var best = null;
    var bestScore = 0;
    FIELDS.forEach(function (field) {
      var score = 0;
      skills.forEach(function (s) { if (field.skills.indexOf(s) !== -1) score++; });
      if (score > bestScore) { bestScore = score; best = field.label; }
    });
    return best || 'Other';
  }

  /* The organization the person interned at: the progression always ends on
     the internship row (seed-people.js builds it that way), so the last
     entry's org is the host. */
  function hostOf(person) {
    var prog = person.progression || [];
    return prog.length ? prog[prog.length - 1].org : null;
  }

  function sortedUnique(values) {
    var seen = {};
    var out = [];
    values.forEach(function (v) {
      if (v == null || v === '') return;
      if (Object.prototype.hasOwnProperty.call(seen, v)) return;
      seen[v] = 1;
      out.push(v);
    });
    return out.sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; });
  }

  function buildVocab(data) {
    var people = data.people;

    var statuses = {};
    people.forEach(function (p) { statuses[p.status] = 1; });
    var outcomes = [];
    STATUS_ORDER.forEach(function (s) {
      /* 'Intern' is expressed through the user-type filter, not the outcome
         one — it is a kind, not something an alum reported. The options wear
         display labels; normalize() maps them back to status keys. */
      if (s !== 'Intern' && statuses[s]) outcomes.push(STATUS_LABEL[s] || s);
    });
    Object.keys(statuses).forEach(function (s) {
      if (s !== 'Intern' && STATUS_ORDER.indexOf(s) === -1) outcomes.push(s);
    });

    var skills = [];
    people.forEach(function (p) { (p.skills || []).forEach(function (s) { skills.push(s); }); });

    return {
      cycles: ['All cycles'].concat(data.meta.cycles),
      outcomes: ['All outcomes'].concat(outcomes),
      skills: ['All skills'].concat(sortedUnique(skills)),
      hosts: ['All hosts'].concat(sortedUnique(people.map(hostOf))),
      /* Fixed vocabularies from the filter contract rather than the data:
         these are groupings of person.location / person.kind / person.fresh,
         and the rail has to offer them all whether or not the current world
         happens to contain one. Employer and time range are likewise fixed
         ('All employers' / 'QSTP companies' / 'External companies', and
         QB.filters.ranges). */
      locations: ['Qatar & abroad', 'Qatar', 'GCC', 'Abroad'],
      userTypes: ['Interns + alumni', 'Alumni', 'Current interns'],
      engagementLevels: ['Any activity', 'Active', 'Dormant']
    };
  }

  /* ── The subset ───────────────────────────────────────────────────── */

  function normalize(filters) {
    var out = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      out[k] = filters && filters[k] != null ? filters[k] : DEFAULTS[k];
    });
    if (!Object.prototype.hasOwnProperty.call(RANGES, out.range)) out.range = DEFAULTS.range;
    /* The rail sends display labels; tests and old callers send status keys.
       Both normalize to the key, which also keeps the memo from treating the
       two spellings of one filter as two cache entries. */
    if (LABEL_STATUS[out.outcome]) out.outcome = LABEL_STATUS[out.outcome];
    return out;
  }

  function isQstpEmployer(person, partnerNames) {
    if (person.employerKind === 'Own company') return true;
    return !!person.employer && partnerNames.indexOf(person.employer) !== -1;
  }

  /* Every filter except `range` narrows the people. Each clause is a plain
     early return so an unrecognised value simply matches nothing rather than
     silently passing everyone through. */
  function selectPeople(data, f, partnerNames) {
    return data.people.filter(function (p) {
      if (f.cycle !== 'All cycles' && p.cycle !== f.cycle) return false;
      if (f.outcome !== 'All outcomes' && p.status !== f.outcome) return false;
      if (f.skill !== 'All skills' && (p.skills || []).indexOf(f.skill) === -1) return false;
      if (f.host !== 'All hosts' && hostOf(p) !== f.host) return false;

      if (f.employer === 'QSTP companies' && !isQstpEmployer(p, partnerNames)) return false;
      if (f.employer === 'External companies') {
        if (!p.employer || isQstpEmployer(p, partnerNames)) return false;
      }

      if (f.location === 'Qatar' && p.location !== 'Qatar') return false;
      if (f.location === 'GCC' && p.location !== 'GCC') return false;
      if (f.location === 'Abroad' && p.location !== 'Elsewhere') return false;

      if (f.userType === 'Alumni' && p.kind !== 'alumni') return false;
      if (f.userType === 'Current interns' && p.kind !== 'intern') return false;

      if (f.engagement === 'Active' && !p.fresh) return false;
      if (f.engagement === 'Dormant' && p.fresh) return false;

      return true;
    });
  }

  /* ── People-derived blocks ────────────────────────────────────────── */

  function countBy(people, test) {
    var n = 0;
    people.forEach(function (p) { if (test(p)) n++; });
    return n;
  }

  function cyclesPresent(people, allCycles) {
    return allCycles.filter(function (c) {
      return people.some(function (p) { return p.cycle === c; });
    });
  }

  function buildOutcomes(people) {
    var total = people.length;
    var counts = {};
    people.forEach(function (p) { counts[p.status] = (counts[p.status] || 0) + 1; });

    var order = STATUS_ORDER.slice();
    Object.keys(counts).forEach(function (s) { if (order.indexOf(s) === -1) order.push(s); });

    var slices = [];
    order.forEach(function (status) {
      var n = counts[status] || 0;
      if (!n) return;
      slices.push({
        label: STATUS_LABEL[status] || status,
        pct: pct(n, total),
        n: n,
        color: STATUS_COLOR[status] || P.grey
      });
    });
    return slices;
  }

  /* Months from the internship to whatever came next. The progression is
     newest-first and always ends on the internship row, so the step we want
     is the last pair. People whose progression never moved past the
     internship (Looking / Break / Unreported / current interns) contribute
     nothing — there is no elapsed time to measure yet. */
  function timeToNextStep(person) {
    var prog = person.progression || [];
    if (prog.length < 2) return null;
    var internAgo = monthsAgoFromMonthYear(prog[prog.length - 1].year);
    var nextAgo = monthsAgoFromMonthYear(prog[prog.length - 2].year);
    var months = internAgo - nextAgo;
    return months >= 0 ? months : null;
  }

  function buildTimeToEmployment(people, cycles) {
    var rows = [];
    var allMonths = [];

    cycles.forEach(function (cycle) {
      var months = [];
      people.forEach(function (p) {
        if (p.cycle !== cycle) return;
        var m = timeToNextStep(p);
        if (m != null) { months.push(m); allMonths.push(m); }
      });
      var avg = months.length ? one(months.reduce(function (s, m) { return s + m; }, 0) / months.length) : 0;
      rows.push({
        label: cycle,
        num: avg,
        /* A cycle nobody has moved on from yet gets an em dash, not a 0.0
           that reads as "instant". */
        display: months.length ? avg.toFixed(1) + ' mo' : '—',
        n: months.length
      });
    });

    var overall = allMonths.length
      ? one(allMonths.reduce(function (s, m) { return s + m; }, 0) / allMonths.length)
      : 0;

    /* Faster than average reads dark, slower reads pale. */
    rows.forEach(function (row) {
      row.color = !row.n ? P.grey : row.num <= overall - 0.5 ? P.ink : row.num <= overall + 0.5 ? P.teal : P.tealPale;
      delete row.n;
    });

    var withData = [];
    cycles.forEach(function (cycle, i) { if (rows[i].display !== '—') withData.push(rows[i]); });

    var change = 'no comparable cycles yet';
    if (withData.length >= 2) {
      var newest = withData[withData.length - 1];
      var oldest = withData[0];
      var diff = one(newest.num - oldest.num);
      change = (diff <= 0 ? '−' : '+') + Math.abs(diff).toFixed(1) + ' mo vs ' + oldest.label;
    }

    var peak = rows.reduce(function (m, r) { return Math.max(m, r.num); }, 0);

    return {
      value: allMonths.length ? overall.toFixed(1) + ' mo' : '—',
      change: change,
      max: niceMax(peak),
      byCohort: rows
    };
  }

  /* Where the people with somewhere to be actually are: inside the park,
     elsewhere in Qatar, or out of the country. Employer decides the first
     split, location the second. */
  function buildRetention(people, partnerNames) {
    var working = people.filter(function (p) {
      return p.status === 'Employed' || p.status === 'Founder' || p.status === 'Freelancing';
    });

    var inPark = 0, inQatar = 0, abroad = 0;
    working.forEach(function (p) {
      if (p.location !== 'Qatar') { abroad++; return; }
      if (isQstpEmployer(p, partnerNames)) inPark++;
      else inQatar++;
    });

    var shares = sharesTo100([inPark, inQatar, abroad]);
    var rows = [
      { label: 'QSTP companies', pct: shares[0], color: P.teal },
      { label: 'Elsewhere in Qatar', pct: shares[1], color: P.ink },
      { label: 'Abroad', pct: shares[2], color: P.grey }
    ];

    var note = working.length
      ? shares[0] + shares[1] + '% of working alumni remain in Qatar; ' + shares[0] +
        '% never left the park. ' + commas(working.length) + ' people with a current place.'
      : 'Nobody in this selection has a current place to report.';

    return { rows: rows, note: note };
  }

  /* Startups founded, cumulative by intake cycle. The seed gives founders a
     "current role since" date inside the last four months rather than a
     founding date, so the cycle they came through is the only honest axis —
     each founder is counted in their own intake, and the series runs up. */
  function buildStartups(people, cycles, win) {
    var founders = people.filter(function (p) { return p.status === 'Founder'; });
    var incubated = countBy(founders, function (p) { return !!p.incubated; });

    var running = 0;
    var points = cycles.map(function (cycle) {
      running += countBy(founders, function (p) { return p.cycle === cycle; });
      return { label: cycle, value: running };
    });
    points = atLeastTwo(lastN(points, win.quarters), 'No cycles');

    var newest = cycles.length ? countBy(founders, function (p) { return p.cycle === cycles[cycles.length - 1]; }) : 0;

    var stages = {};
    founders.forEach(function (p) { if (p.stage) stages[p.stage] = (stages[p.stage] || 0) + 1; });

    var status = [
      { label: incubated + ' in incubation', tone: 'teal' },
      { label: (stages['Idea stage'] || 0) + ' idea stage', tone: 'mute' },
      { label: ((stages['Launched'] || 0) + (stages['Generating revenue'] || 0)) + ' launched or earning', tone: 'lime' }
    ];

    return {
      total: commas(founders.length),
      change: signed(newest) + ' from ' + (cycles.length ? cycles[cycles.length - 1] : 'the latest cycle'),
      series: {
        name: 'Startups founded, cumulative by intake cycle',
        unit: '',
        max: niceMax(founders.length),
        series: points
      },
      status: status,
      count: founders.length,
      incubated: incubated
    };
  }

  /* Seniority mix by how long ago the internship was. Only people whose
     current progression row carries a professional level are counted — a
     postgraduate or a freelancer has no seniority to place on this scale,
     and folding them in would make the four segments mean nothing. */
  var LEVEL_KEYS = ['Junior', 'Mid-level', 'Senior', 'Founder'];

  var TENURE_BUCKETS = [
    { label: '< 12 months out', min: 0, max: 12 },
    { label: '12–18 months out', min: 12, max: 18 },
    { label: '18+ months out', min: 18, max: Infinity }
  ];

  function buildProgression(people) {
    var rows = TENURE_BUCKETS.map(function (bucket) {
      var counts = LEVEL_KEYS.map(function () { return 0; });
      people.forEach(function (p) {
        var prog = p.progression || [];
        if (!prog.length) return;
        var out = monthsAgoFromMonthYear(prog[prog.length - 1].year);
        if (out < bucket.min || out >= bucket.max) return;
        var idx = LEVEL_KEYS.indexOf(prog[0].level);
        if (idx !== -1) counts[idx] += 1;
      });
      return { label: bucket.label, segs: sharesTo100(counts) };
    });

    return {
      key: [
        { label: 'Junior', color: P.tealPale },
        { label: 'Mid-level', color: P.teal },
        { label: 'Senior', color: P.ink },
        { label: 'Founder', color: P.lime }
      ],
      rows: rows
    };
  }

  function buildEmployers(people, partnerNames) {
    var rows = byCountDesc(tally(people, function (p) { return p.employer; })).slice(0, 6);
    return rows.map(function (row) {
      var owned = people.some(function (p) {
        return p.employer === row.key && p.employerKind === 'Own company';
      });
      var kind = partnerNames.indexOf(row.key) !== -1 ? 'Host'
        : owned ? 'Alumni startup' : 'External';
      return { label: row.key, num: row.n, kind: kind };
    });
  }

  /* Inside the ecosystem: employed by one of the eight partner
     organizations, or a founder QSTP is incubating. Same numerator as the
     conversion KPI, so the table and the strip agree. */
  function inEcosystem(person, partnerNames) {
    if (person.status === 'Employed') return partnerNames.indexOf(person.employer) !== -1;
    if (person.status === 'Founder') return !!person.incubated;
    return false;
  }

  function buildByCohort(people, cycles, partnerNames) {
    return cycles.map(function (cycle) {
      var inCycle = people.filter(function (p) { return p.cycle === cycle; });
      var n = inCycle.length;
      return {
        cohort: cycle,
        employed: pctStr(countBy(inCycle, function (p) { return p.status === 'Employed'; }), n),
        founded: pctStr(countBy(inCycle, function (p) { return p.status === 'Founder'; }), n),
        eco: pctStr(countBy(inCycle, function (p) { return inEcosystem(p, partnerNames); }), n),
        unreported: pctStr(countBy(inCycle, function (p) { return p.status === 'Unreported'; }), n)
      };
    });
  }

  /* Share of each field now employed or founding — the same "conversion by
     field" reading the fixture had, over skill-derived fields. */
  function buildByField(people) {
    var totals = {};
    var converted = {};
    people.forEach(function (p) {
      var field = fieldOf(p);
      totals[field] = (totals[field] || 0) + 1;
      if (p.status === 'Employed' || p.status === 'Founder') {
        converted[field] = (converted[field] || 0) + 1;
      }
    });

    return Object.keys(totals).map(function (field) {
      return { label: field, num: pctRounded(converted[field] || 0, totals[field]) };
    }).sort(function (a, b) { return b.num - a.num || a.label.localeCompare(b.label); });
  }

  function buildFreshness(people) {
    var total = people.length;
    var ages = people.map(function (p) { return monthsAgoFromMonthYear(p.lastUpdate); });
    function within(n) { return ages.filter(function (a) { return a <= n; }).length; }

    var stale = total - within(12);
    return {
      rows: [
        { label: 'Updated ≤ 3 months', num: pctRounded(within(3), total), display: pctStr(within(3), total), color: P.ink },
        { label: 'Updated ≤ 6 months', num: pctRounded(within(6), total), display: pctStr(within(6), total), color: P.teal },
        { label: 'Updated ≤ 12 months', num: pctRounded(within(12), total), display: pctStr(within(12), total), color: P.tealPale }
      ],
      note: total
        ? commas(stale) + ' people (' + pctStr(stale, total) + ') have no update in 12+ months.'
        : 'No people in this selection.'
    };
  }

  /* Completeness is a six-point checklist over the fields a profile can
     carry. It is a real count of filled fields, not a guess: everything on
     the list is something the survey asks for. */
  function completenessScore(person) {
    var score = 0;
    if (person.role) score++;
    if (person.employer || person.startup) score++;
    if ((person.skills || []).length >= 4) score++;
    if (person.location) score++;
    if ((person.progression || []).length >= 2) score++;
    if (person.fresh) score++;
    return score;
  }

  function buildCompleteness(people) {
    var full = 0, partial = 0, minimal = 0;
    people.forEach(function (p) {
      var s = completenessScore(p);
      if (s >= 5) full++;
      else if (s >= 3) partial++;
      else minimal++;
    });

    var shares = sharesTo100([full, partial, minimal]);
    return {
      segs: [
        { label: 'Full profile', pct: shares[0], color: P.ink },
        { label: 'Partial', pct: shares[1], color: P.teal },
        { label: 'Minimal', pct: shares[2], color: P.grey }
      ],
      note: people.length
        ? commas(full) + ' of ' + commas(people.length) + ' profiles carry five or more of the six fields recruiters search on.'
        : 'No profiles in this selection.'
    };
  }

  /* Response rate per quarter: the share of the selection whose last update
     falls inside the six months ending at that quarter. At the newest
     quarter that is exactly the "fresh status ≤ 6 mo" KPI, so the chart's
     right-hand end and the strip cannot disagree. */
  function buildResponseTrend(people, win) {
    var total = people.length;
    var ages = people.map(function (p) { return monthsAgoFromMonthYear(p.lastUpdate); });

    var points = [];
    var i;
    for (i = win.quarters - 1; i >= 0; i--) {
      var back = i * 3;
      var n = ages.filter(function (a) { return a >= back && a < back + 6; }).length;
      points.push({ label: quarterLabel(NOW_ABS - back), value: pctRounded(n, total) });
    }
    points = atLeastTwo(points, quarterLabel(NOW_ABS));

    var head = points[points.length - 1].value;
    var first = points[0].value;

    return {
      name: 'Status response rate',
      headline: head + '%',
      change: signed(head - first) + ' pts vs ' + points[0].label,
      max: niceMax(Math.max(10, points.reduce(function (m, p) { return Math.max(m, p.value); }, 0))),
      series: points
    };
  }

  /* Oldest first — the follow-up queue wants the people who have been quiet
     longest. */
  function buildStaleQueue(people, limit) {
    return people
      .filter(function (p) { return monthsAgoFromMonthYear(p.lastUpdate) >= 12; })
      .map(function (p) { return { p: p, ago: monthsAgoFromMonthYear(p.lastUpdate) }; })
      .sort(function (a, b) { return b.ago - a.ago || a.p.id - b.p.id; })
      .slice(0, limit)
      .map(function (row) {
        return { name: row.p.name, cohort: row.p.cycle, last: monthsAgoLabel(row.ago) };
      });
  }

  /* ── Engagement ───────────────────────────────────────────────────────
     The seed has no session log, so nothing here is a measurement. What is
     real is `fresh` — whether a person confirmed their status recently —
     which stands in for "active", and the content volumes in the store. The
     rest are fixed fractions of those, and each one says so. */

  var DAU_SHARE = 0.19;   /* proxy: a fifth of the active base on a given day */
  var WAU_SHARE = 0.55;   /* proxy: just over half of it in a given week */
  var ACTIONS_PER_ACTIVE = 1.6; /* proxy: actions per active person per week */

  /* Proxy: a fixed rising shape, so the weekly chart has a readable slope
     without a random walk. Newest last. */
  var ACTIVITY_SHAPE = [0.58, 0.63, 0.60, 0.68, 0.66, 0.72, 0.70, 0.76, 0.81, 0.79, 0.86, 0.92];

  function buildEngagement(people, cycles, world, win) {
    var activeAlumni = countBy(people, function (p) { return p.fresh && p.kind === 'alumni'; });
    var activeInterns = countBy(people, function (p) { return p.fresh && p.kind === 'intern'; });
    var active = activeAlumni + activeInterns;

    /* Split first, then sum, so the tile's note always adds up to its
       value — rounding each part separately would let them drift. */
    function tile(label, share, hint) {
      var a = Math.round(activeAlumni * share);
      var i = Math.round(activeInterns * share);
      return {
        label: label,
        value: commas(a + i),
        note: commas(a) + ' alumni · ' + commas(i) + ' interns — ' + hint
      };
    }

    var activeTiles = [
      tile('Daily active', DAU_SHARE, 'proxy: ' + Math.round(DAU_SHARE * 100) + '% of the active base'),
      tile('Weekly active', WAU_SHARE, 'proxy: ' + Math.round(WAU_SHARE * 100) + '% of the active base'),
      tile('Monthly active', 1, 'people with a confirmed status')
    ];

    var shape = lastN(ACTIVITY_SHAPE, win.weeks);
    var labels = lastN(WEEK_LABELS, win.weeks);
    var activity = shape.map(function (factor, i) {
      return { label: labels[i], value: Math.round(active * ACTIONS_PER_ACTIVE * factor) };
    });
    activity = atLeastTwo(activity, WEEK_LABELS[WEEK_LABELS.length - 1]);

    /* Proxy for feature usage: the relative volume of each feature's content
       inside the window, normalized to 100. Real counts, standing in for the
       click stream the prototype does not keep. */
    var volumes = [
      { label: 'Job offers', n: world.offers.length },
      { label: 'Referrals', n: world.referrals.length },
      { label: 'Ideastorm', n: world.ideas.length },
      { label: 'Events', n: world.events.length },
      { label: 'Spotlight', n: world.spotlight.length }
    ];
    var featureShares = sharesTo100(volumes.map(function (v) { return v.n; }));
    var features = volumes.map(function (v, i) { return { label: v.label, num: featureShares[i] }; })
      .sort(function (a, b) { return b.num - a.num || a.label.localeCompare(b.label); });

    var cohortRows = cycles.map(function (cycle) {
      var inCycle = people.filter(function (p) { return p.cycle === cycle; });
      var n = pctRounded(countBy(inCycle, function (p) { return p.fresh; }), inCycle.length);
      return {
        label: cycle,
        num: n,
        display: n + '%',
        color: n >= 70 ? P.ink : n >= 45 ? P.teal : P.tealPale
      };
    });

    /* At-risk is the opposite end of the follow-up queue: people who have
       only just gone quiet, ordered least-stale first, because those are the
       ones a nudge can still reach. */
    var atRisk = people
      .filter(function (p) { return !p.fresh; })
      .map(function (p) { return { p: p, ago: monthsAgoFromMonthYear(p.lastUpdate) }; })
      .sort(function (a, b) { return a.ago - b.ago || a.p.id - b.p.id; })
      .slice(0, 4)
      .map(function (row) {
        /* Days, from whole months — the seed records months, so this is a
           conversion, not a finer measurement. */
        return { name: row.p.name, cohort: row.p.cycle, last: Math.round(row.ago * 30) + ' days' };
      });

    return {
      active: activeTiles,
      activity: {
        name: 'Actions per week (proxy)',
        unit: '',
        max: niceMax(activity.reduce(function (m, p) { return Math.max(m, p.value); }, 0)),
        series: activity
      },
      features: features,
      cohorts: cohortRows,
      atRisk: atRisk
    };
  }

  /* ── Pipeline ─────────────────────────────────────────────────────── */

  function buildPipeline(people, world, win, peopleById) {
    var offers = world.offers;
    var referrals = world.referrals;

    var applied = 0, interviewed = 0, hired = 0, filled = 0;
    var orgs = {};
    offers.forEach(function (o) {
      applied += o.funnel.applied;
      interviewed += o.funnel.interviewed;
      hired += o.funnel.hired;
      if (o.funnel.hired > 0) filled++;
      orgs[o.org] = 1;
    });

    var postedThisMonth = countBy(offers, function (o) { return postedMonthsAgo(o.posted) === 0; });

    /* Time to fill: the seed records when an offer was posted, never when it
       closed, so this is the median age of the offers that did hire — a
       floor on the real figure, not the figure itself. */
    var filledAges = offers
      .filter(function (o) { return o.funnel.hired > 0; })
      .map(function (o) { return postedMonthsAgo(o.posted) * 30; })
      .sort(function (a, b) { return a - b; });
    var medianAge = filledAges.length
      ? filledAges[Math.floor((filledAges.length - 1) / 2)]
      : 0;

    var jobStats = [
      { label: 'Offers posted', value: commas(offers.length), delta: signed(postedThisMonth) + ' this month',
        tone: tone(postedThisMonth), note: 'From ' + Object.keys(orgs).length + ' organizations' },
      { label: 'Applications per offer', value: one(safeDiv(applied, offers.length)).toFixed(1),
        note: commas(applied) + ' applications in the window' },
      { label: 'Fill rate', value: pctStr(filled, offers.length),
        note: filled + ' of ' + offers.length + ' offers hired' },
      { label: 'Time to fill', value: medianAge + ' days',
        note: 'Proxy: median age of offers that hired' }
    ];

    /* Monotonic by construction — every stage is a sum over the same real
       funnels, and each seeded funnel already narrows. */
    var funnel = [
      { label: 'Applications', n: applied, note: one(safeDiv(applied, offers.length)).toFixed(1) + ' per offer', color: P.teal },
      { label: 'Interviews', n: interviewed, note: pctStr(interviewed, applied) + ' of applications', color: P.tealPale },
      { label: 'Hires', n: hired, note: pctStr(hired, interviewed) + ' of interviews', color: P.lime }
    ];

    /* Offers per month, over exactly the months the in-window offers span. */
    var oldest = offers.reduce(function (m, o) { return Math.max(m, postedMonthsAgo(o.posted)); }, 0);
    var span = Math.min(Math.max(oldest, 1), isFinite(win.months) ? Math.max(win.months, 1) : 11);
    var offerPoints = [];
    var i;
    for (i = span; i >= 0; i--) {
      offerPoints.push({
        label: monthLabel(NOW_ABS - i),
        value: countBy(offers, function (o) { return postedMonthsAgo(o.posted) === i; })
      });
    }
    offerPoints = atLeastTwo(offerPoints, monthLabel(NOW_ABS));

    /* Demand and supply are different populations, so both are expressed as
       a share — of the offers asking for the skill, and of the selected
       people listing it — which is the only way the two bars compare. */
    var demandRows = byCountDesc(tally(
      offers.reduce(function (acc, o) {
        return acc.concat(String(o.skills || '').split(', ').filter(Boolean));
      }, []),
      function (s) { return s; }
    )).slice(0, 6);

    var skillsGap = demandRows.map(function (row) {
      var lower = row.key.toLowerCase();
      var supply = countBy(people, function (p) {
        return (p.skills || []).some(function (s) { return String(s).toLowerCase() === lower; });
      });
      return {
        label: row.key,
        demand: pctRounded(row.n, offers.length),
        supply: pctRounded(supply, people.length)
      };
    });
    var skillsMax = niceMax(skillsGap.reduce(function (m, s) {
      return Math.max(m, s.demand, s.supply);
    }, 10));

    /* Referrals */

    var referrers = {};
    var refHired = 0, refInterviewing = 0;
    referrals.forEach(function (r) {
      referrers[r.referrerId] = 1;
      if (r.status === 'Hired') refHired++;
      if (r.status === 'Interviewing' || r.status === 'Hired') refInterviewing++;
    });

    var refStats = [
      { label: 'Referrals submitted', value: commas(referrals.length),
        note: 'From ' + Object.keys(referrers).length + ' unique referrers' },
      { label: 'Referral → hire', value: pctStr(refHired, referrals.length),
        note: refHired + ' hires via referral' },
      /* Proxy: the perks ledger is not in the seed. A perk is assumed for
         every referral that reached an interview or a hire. */
      { label: 'Perks issued', value: commas(refInterviewing),
        note: 'Proxy: referrals that reached interview or hire' },
      { label: 'Perks redeemed', value: commas(refHired),
        note: 'Proxy: ' + pctStr(refHired, refInterviewing) + ' of issued perks' }
    ];

    var refPoints = [];
    for (i = win.quarters - 1; i >= 0; i--) {
      var qStart = NOW_ABS - i * 3;
      var qy = Math.floor(qStart / 12);
      var qFirstMonth = qy * 12 + Math.floor((qStart - qy * 12) / 3) * 3;
      refPoints.push({
        label: quarterLabel(qStart),
        value: countBy(referrals, function (r) {
          var abs = NOW_ABS - monthsFromMonthYearDay(r.date);
          return abs >= qFirstMonth && abs < qFirstMonth + 3;
        })
      });
    }
    refPoints = atLeastTwo(refPoints, quarterLabel(NOW_ABS));

    var referrerRows = byCountDesc(tally(referrals, function (r) { return String(r.referrerId); }))
      .slice(0, 4)
      .map(function (row) {
        var person = peopleById[row.key];
        var hires = countBy(referrals, function (r) {
          return String(r.referrerId) === row.key && r.status === 'Hired';
        });
        return {
          name: person ? person.name : 'Alum #' + row.key,
          meta: (person ? person.cycle : 'Unknown cycle') + ' · ' + row.n + ' referred',
          val: hires + (hires === 1 ? ' hire' : ' hires')
        };
      });

    var refCompanies = byCountDesc(tally(
      referrals.filter(function (r) { return r.status === 'Hired'; }),
      function (r) { return r.company; }
    )).slice(0, 5).map(function (row) { return { label: row.key, num: row.n }; });

    return {
      jobStats: jobStats,
      funnel: funnel,
      offersSeries: { name: 'Offers posted per month', unit: '', max: niceMax(offerPoints.reduce(function (m, p) {
        return Math.max(m, p.value);
      }, 0)), series: offerPoints },
      skillsKey: [
        { label: 'Demand — share of offers', color: P.teal },
        { label: 'Supply — share of alumni', color: P.ink }
      ],
      skillsMax: skillsMax,
      skillsGap: skillsGap,
      refStats: refStats,
      refTrend: { name: 'Referrals per quarter', unit: '', max: niceMax(refPoints.reduce(function (m, p) {
        return Math.max(m, p.value);
      }, 0)), series: refPoints },
      topReferrers: referrerRows,
      refCompanies: refCompanies
    };
  }

  /* ── Community ────────────────────────────────────────────────────── */

  var ATTENDANCE_RATE = 0.85; /* proxy: no attendance is recorded — the
                                 calendar is forward-looking, so turnout is
                                 projected from registrations */
  var SPOTLIGHT_VIEW_LIFT = 26;  /* proxy: per queued feature, no view log */
  var SPOTLIGHT_OFFER_LIFT = 8;  /* proxy: per queued feature, no offer log */

  function buildCommunity(people, cycles, world, win) {
    var ideas = world.ideas;

    /* Idea owners are looked up inside the selection, not the whole roster:
       an idea whose owner is filtered out is not this selection's idea. */
    var owners = {};
    people.forEach(function (p) { owners[String(p.id)] = p; });
    function ownerOf(idea) { return owners[String(idea.ownerId)] || null; }

    var stageRows = byCountDesc(tally(ideas, function (i) { return i.stage; }))
      .map(function (row) { return { label: row.key, num: row.n }; });

    var withTeam = countBy(ideas, function (i) { return (i.joined || 0) > 0; });
    var preSeed = ideas.filter(function (i) { return i.stage === 'Pre-seed'; });
    var founders = people.filter(function (p) { return p.status === 'Founder'; });
    var incubated = countBy(founders, function (p) { return !!p.incubated; });
    var joins = ideas.reduce(function (s, i) { return s + (i.joined || 0); }, 0);

    /* Ideas carry no post date, so each is attributed to the intake cycle of
       the person who owns it — the nearest thing to a timestamp the seed
       has. Cumulative would hide the shape, so this is per cycle. */
    var byOwnerCycle = cycles.map(function (cycle) {
      return {
        label: cycle,
        value: countBy(ideas, function (idea) {
          var owner = ownerOf(idea);
          return !!owner && owner.cycle === cycle;
        })
      };
    });
    byOwnerCycle = atLeastTwo(lastN(byOwnerCycle, win.quarters), 'No cycles');

    var soughtSkills = byCountDesc(tally(
      ideas.reduce(function (acc, i) { return acc.concat(i.needs || []); }, []),
      function (s) { return s; }
    )).slice(0, 5).map(function (row) { return { label: row.key, num: row.n }; });

    /* Monotonic by construction: each stage is a subset of the one above. */
    var foundedFromIdeas = countBy(preSeed, function (idea) {
      var owner = ownerOf(idea);
      return !!owner && owner.status === 'Founder';
    });
    var formation = [
      { label: 'Ideas posted', n: ideas.length, note: 'live on Ideastorm', color: P.ink },
      { label: 'Formed a team', n: withTeam, note: pctStr(withTeam, ideas.length) + ' of ideas', color: P.teal },
      { label: 'Reached pre-seed', n: preSeed.length, note: pctStr(preSeed.length, ideas.length) + ' of ideas', color: P.tealPale },
      { label: 'Founded a company', n: foundedFromIdeas, note: pctStr(foundedFromIdeas, ideas.length) + ' end to end', color: P.lime }
    ];

    var stats = [
      { label: 'Live ideas', value: commas(ideas.length),
        note: 'Across ' + stageRows.length + ' stages' },
      { label: 'Team formation rate', value: pctStr(withTeam, ideas.length),
        note: withTeam + ' of ' + ideas.length + ' ideas have members' },
      /* The last stage of the formation funnel, so the tile and the funnel
         cannot tell two different stories about the same number. */
      { label: 'Became real startups', value: commas(foundedFromIdeas),
        note: commas(incubated) + ' alumni founders are in incubation' },
      { label: 'Cross-cohort connections', value: commas(joins),
        note: 'Members joined across ' + ideas.length + ' ideas' }
    ];

    /* The seeded calendar is entirely ahead of the fixed "now", so the range
       window is applied either side of it rather than backwards only —
       otherwise every event would fall outside every window. */
    var events = world.events.slice()
      .sort(function (a, b) {
        var am = -monthsFromMonthYearDay(a.date);
        var bm = -monthsFromMonthYearDay(b.date);
        return am - bm || dayOf(a.date) - dayOf(b.date) || a.id - b.id;
      })
      .slice(0, win.events)
      .map(function (e) {
        var attended = Math.round((e.reg || 0) * ATTENDANCE_RATE);
        return {
          title: e.title,
          date: e.date,
          rsvp: e.reg || 0,
          attended: attended,
          rate: pctStr(attended, e.reg || 0)
        };
      });

    var reg = events.reduce(function (s, e) { return s + e.rsvp; }, 0);
    var cap = world.events.reduce(function (s, e) { return s + (e.cap || 0); }, 0);

    var queued = world.spotlight.length;
    return {
      stats: stats,
      postedSeries: { name: 'Ideas posted per intake cycle', unit: '',
        max: niceMax(byOwnerCycle.reduce(function (m, p) { return Math.max(m, p.value); }, 0)),
        series: byOwnerCycle },
      categories: stageRows,
      formation: formation,
      soughtSkills: soughtSkills,
      spotlight: {
        views: '+' + queued * SPOTLIGHT_VIEW_LIFT + '%',
        offers: '+' + queued * SPOTLIGHT_OFFER_LIFT + '%',
        note: 'Proxy — the prototype keeps no view or invite log. Modelled as a ' +
          SPOTLIGHT_VIEW_LIFT + '% view and ' + SPOTLIGHT_OFFER_LIFT +
          '% invite lift per alum in the ' + queued + '-person spotlight queue.'
      },
      events: events,
      eventNote: events.length
        ? commas(reg) + ' registrations across ' + events.length + ' events, against ' +
          commas(cap) + ' seats. Turnout is projected at ' + Math.round(ATTENDANCE_RATE * 100) +
          '% of registrations — attendance is not recorded yet.'
        : 'No events in this window.'
    };
  }

  /* ── Partners ─────────────────────────────────────────────────────── */

  function buildPartners(people, world, allPartners) {
    var offers = world.offers;

    var rows = allPartners.map(function (partner) {
      var own = offers.filter(function (o) { return o.org === partner.name; });
      var hires = own.reduce(function (s, o) { return s + o.funnel.hired; }, 0);
      return {
        org: partner.name,
        offers: own.length,
        hires: hires,
        last: partner.lastActive,
        status: partner.status,
        tone: partner.tone
      };
    }).sort(function (a, b) { return b.offers - a.offers || b.hires - a.hires || a.org.localeCompare(b.org); });

    var posted = rows.filter(function (r) { return r.offers > 0; });
    var repeat = rows.filter(function (r) { return r.offers > 1; });

    var stats = [
      { label: 'Organizations onboarded', value: commas(allPartners.length),
        note: 'Host startups, incubatees & external' },
      { label: 'Active', value: commas(countBy(allPartners, function (p) { return p.status === 'Active'; })),
        note: 'Posting or searching recently' },
      { label: 'Dormant', value: commas(countBy(allPartners, function (p) { return p.status !== 'Active'; })),
        note: 'Quiet or dormant on the partner record' },
      { label: 'Repeat posting rate', value: pctStr(repeat.length, posted.length),
        note: repeat.length + ' of ' + posted.length + ' posting orgs posted more than once' }
    ];

    /* Proxy: there is no recruiter search log. What partners actually ask
       for in their offers stands in for what they would type into search. */
    var searches = byCountDesc(tally(
      offers.reduce(function (acc, o) {
        return acc.concat(String(o.skills || '').split(', ').filter(Boolean));
      }, []),
      function (s) { return s; }
    )).slice(0, 5).map(function (row) { return { label: '“' + row.key + '”', num: row.n }; });

    /* Proxy for profile views: how often a person surfaces as one of an
       offer's suggested matches. Real placements in a real list — but a
       shortlist appearance, not a recruiter opening the profile. */
    var appearances = {};
    var inSubset = {};
    people.forEach(function (p) { inSubset[p.id] = p; });
    offers.forEach(function (o) {
      (o.people || []).forEach(function (ref) {
        if (!inSubset[ref.id]) return;
        appearances[ref.id] = (appearances[ref.id] || 0) + 1;
      });
    });

    var viewed = Object.keys(appearances).map(function (id) {
      return { id: id, n: appearances[id] };
    }).sort(function (a, b) { return b.n - a.n || Number(a.id) - Number(b.id); })
      .slice(0, 4)
      .map(function (row) {
        var person = inSubset[row.id];
        return {
          name: person.name,
          meta: (person.role || person.status) + ' · ' + person.cycle,
          val: row.n + (row.n === 1 ? ' offer match' : ' offer matches')
        };
      });

    var dormant = allPartners.filter(function (p) { return p.status !== 'Active'; })
      .map(function (p) {
        var row = rows.filter(function (r) { return r.org === p.name; })[0];
        return {
          name: p.name,
          meta: p.lastActive + ' · ' + row.offers + (row.offers === 1 ? ' offer, ' : ' offers, ') +
            row.hires + (row.hires === 1 ? ' hire' : ' hires')
        };
      });

    return {
      stats: stats,
      searches: searches,
      orgTable: rows.slice(0, 6),
      viewed: viewed,
      dormant: dormant
    };
  }

  /* ── KPI strip ────────────────────────────────────────────────────── */

  /* Every delta on the strip is the same comparison: the selection as it
     stands against the selection without its newest intake cycle — "what
     this looked like before the latest cohort landed". Real, deterministic,
     and zero when the selection holds one cycle or none. */
  function buildKpis(people, cycles, partnerNames) {
    var total = people.length;
    var newest = cycles.length ? cycles[cycles.length - 1] : null;
    var prior = newest ? people.filter(function (p) { return p.cycle !== newest; }) : [];
    var added = total - prior.length;

    var fresh = countBy(people, function (p) { return p.fresh; });
    var freshPct = pctRounded(fresh, total);
    var freshPrior = pctRounded(countBy(prior, function (p) { return p.fresh; }), prior.length);

    /* Conversion to the ecosystem
         (alumni employed at one of the partner organizations
          + founders QSTP is incubating) / people in the selection
       The same numerator byCohort's "In ecosystem" column uses. */
    var atQstp = countBy(people, function (p) {
      return p.status === 'Employed' && partnerNames.indexOf(p.employer) !== -1;
    });
    var incubated = countBy(people, function (p) { return p.status === 'Founder' && !!p.incubated; });
    var conversion = pct(atQstp + incubated, total);
    var conversionPrior = pct(
      countBy(prior, function (p) { return p.status === 'Employed' && partnerNames.indexOf(p.employer) !== -1; }) +
      countBy(prior, function (p) { return p.status === 'Founder' && !!p.incubated; }),
      prior.length
    );

    var founders = countBy(people, function (p) { return p.status === 'Founder'; });
    var foundersPrior = countBy(prior, function (p) { return p.status === 'Founder'; });

    var activeAlumni = countBy(people, function (p) { return p.fresh && p.kind === 'alumni'; });
    var activeInterns = fresh - activeAlumni;
    var freshPriorCount = countBy(prior, function (p) { return p.fresh; });

    var conversionDelta = one(conversion - conversionPrior);

    return [
      { label: 'Alumni tracked', value: commas(total), delta: signed(added), deltaTone: tone(added),
        note: 'Across ' + cycles.length + (cycles.length === 1 ? ' intake cycle' : ' intake cycles'),
        rule: P.ink },
      { label: 'Fresh status ≤ 6 mo', value: freshPct + '%', delta: signed(freshPct - freshPrior) + ' pts',
        deltaTone: tone(freshPct - freshPrior),
        note: commas(fresh) + ' of ' + commas(total) + ' confirmed recently', rule: P.teal },
      { label: 'Conversion to ecosystem', value: one(conversion).toFixed(1) + '%',
        delta: (conversionDelta >= 0 ? '+' : '−') + Math.abs(conversionDelta).toFixed(1) + ' pt',
        deltaTone: tone(conversionDelta),
        note: commas(atQstp) + ' inside QSTP companies · ' + commas(incubated) + ' incubated',
        rule: P.lime },
      { label: 'Startups founded', value: commas(founders), delta: signed(founders - foundersPrior),
        deltaTone: tone(founders - foundersPrior),
        note: commas(countBy(people, function (p) { return p.status === 'Founder' && !!p.incubated; })) + ' in incubation',
        rule: P.tealPale },
      { label: 'Active this month', value: commas(fresh), delta: signed(fresh - freshPriorCount),
        deltaTone: tone(fresh - freshPriorCount),
        note: commas(activeAlumni) + ' alumni · ' + commas(activeInterns) + ' interns', rule: P.tealDeep }
    ];
  }

  /* The conversion trend the Outcomes tab plots: the same numerator the KPI
     uses, taken cycle by cycle, so the panel headline and the strip agree by
     construction. Cycles are the x-axis — the seed carries no quarterly
     history, and plotting an invented one under a real number would put
     fiction where the whole tab now tells the truth. */
  function shortCycle(cycle) {
    return cycle.charAt(0) + ' ' + cycle.slice(cycle.indexOf('’'));
  }

  function isConverted(person, partnerNames) {
    return (person.status === 'Employed' && partnerNames.indexOf(person.employer) !== -1) ||
      (person.status === 'Founder' && !!person.incubated);
  }

  function buildConversion(people, cycles, partnerNames) {
    /* Conversion is an alumni outcome — current interns cannot have converted
       yet, so a cycle that is all interns would plot a 0% cliff that reads as
       a collapse. Cycles appear on the axis only once they hold alumni. */
    var series = [];
    cycles.forEach(function (cycle) {
      var group = people.filter(function (p) { return p.cycle === cycle && p.kind === 'alumni'; });
      if (!group.length) return;
      series.push({ label: shortCycle(cycle),
        value: one(pct(countBy(group, function (p) { return isConverted(p, partnerNames); }), group.length)) });
    });
    series = atLeastTwo(series, '—');

    var overall = one(pct(countBy(people, function (p) { return isConverted(p, partnerNames); }),
      people.length));
    var delta = one(series[series.length - 1].value - series[series.length - 2].value);
    var top = series.reduce(function (m, p) { return Math.max(m, p.value); }, 0);

    return {
      name: 'Hire-to-ecosystem conversion',
      headline: overall.toFixed(1) + '%',
      change: (delta >= 0 ? '+' : '−') + Math.abs(delta).toFixed(1) + ' pt vs prior cycle',
      max: Math.max(10, Math.ceil(top / 10) * 10),
      series: series
    };
  }

  /* ── Assembly ─────────────────────────────────────────────────────── */

  var lastKey = null;
  var lastResult = null;

  function compute(filters) {
    var f = normalize(filters);
    var key = JSON.stringify(f);
    /* A single render calls this several times (KPI strip, then the active
       tab), so the last result is handed back by reference rather than
       recomputed. */
    if (key === lastKey && lastResult) return lastResult;

    var data = QB.store.data;
    var win = RANGES[f.range];
    var partnerNames = data.partners.map(function (p) { return p.name; });

    var people = selectPeople(data, f, partnerNames);
    var cycles = cyclesPresent(people, data.meta.cycles);

    /* Here is where `range` is applied, and nowhere else: the dated
       collections get scoped to the window, the distributions over people do
       not. A person's status is a state rather than an event, so narrowing
       the window must not make alumni disappear from the donut — it narrows
       what happened, not who exists. Series lengths follow from the same
       window (RANGES above). */
    var world = {
      offers: data.offers.filter(function (o) { return postedMonthsAgo(o.posted) <= win.months; }),
      referrals: data.referrals.filter(function (r) {
        return monthsFromMonthYearDay(r.date) <= win.months;
      }),
      /* The seeded calendar sits entirely ahead of the fixed "now", so
         events are matched on distance either side of it. */
      events: data.events.filter(function (e) {
        return Math.abs(monthsFromMonthYearDay(e.date)) <= win.months;
      }),
      ideas: data.ideas,
      spotlight: data.spotlight
    };

    var peopleById = {};
    data.people.forEach(function (p) { peopleById[String(p.id)] = p; });

    var outcomes = buildOutcomes(people);
    var inWork = countBy(people, function (p) { return !!IN_WORK[p.status]; });
    var retention = buildRetention(people, partnerNames);
    var startups = buildStartups(people, cycles, win);
    var freshness = buildFreshness(people);

    var result = {
      total: people.length,
      filters: f,
      vocab: buildVocab(data),

      kpis: buildKpis(people, cycles, partnerNames),
      conversion: buildConversion(people, cycles, partnerNames),

      outcomes: outcomes,
      outcomeCentre: { value: pctStr(inWork, people.length), label: 'IN WORK' },
      timeToEmployment: buildTimeToEmployment(people, cycles),
      retention: retention.rows,
      retentionNote: retention.note,
      startups: {
        total: startups.total,
        change: startups.change,
        series: startups.series,
        status: startups.status
      },
      progression: buildProgression(people),
      employers: buildEmployers(people, partnerNames),
      byCohort: buildByCohort(people, cycles, partnerNames),
      byField: buildByField(people),

      freshness: freshness,
      completeness: buildCompleteness(people),
      responseTrend: buildResponseTrend(people, win),
      staleQueue: buildStaleQueue(people, 6),

      engagement: buildEngagement(people, cycles, world, win),
      pipeline: buildPipeline(people, world, win, peopleById),
      community: buildCommunity(people, cycles, world, win),
      partners: buildPartners(people, world, data.partners)
    };

    lastKey = key;
    lastResult = result;
    return result;
  }

  QB.analytics = {
    compute: compute,
    defaults: function () { return normalize(null); },
    ranges: RANGES,
    /* The memo assumes the store is immutable between calls — the survey
       breaks that assumption when it saves, so the store calls this after
       every write and the next compute starts from the data again. */
    invalidate: function () { lastKey = null; lastResult = null; }
  };
})(window.QB = window.QB || {});
