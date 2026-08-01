/* Synthetic person records for the management "1,842 alumni" number that
   data.js only quotes as a headline. Everything here is generated from a
   single rng(): call it with the same function twice and you get the same
   1,842 people back, byte for byte — that determinism is the whole point,
   since screens built on top of this need a fixture that doesn't reshuffle
   itself every reload. No Math.random, no Date: the "current" month is a
   constant baked in below, the same way the rest of the prototype treats
   "today" as fixed copy rather than a live clock. */
(function (QB) {
  'use strict';

  var P = QB.palette;

  /* ── Vocabularies ─────────────────────────────────────────────────
     Kept local rather than pulled from QB.surveyData / QB.directory —
     this file has to stand alone (it seeds the world those screens read
     from), so it carries its own copies of the shapes it needs. */

  var FIRST_NAMES = [
    'Noor', 'Yousef', 'Omar', 'Khalid', 'Hamad', 'Rashid', 'Jassim', 'Tariq',
    'Faisal', 'Ahmed', 'Mohammed', 'Ali', 'Sultan', 'Nasser', 'Abdullah',
    'Saif', 'Majed', 'Fahad', 'Waleed', 'Hassan',
    'Layla', 'Aisha', 'Sara', 'Maryam', 'Mona', 'Dana', 'Reem', 'Noura',
    'Fatima', 'Hind', 'Amina', 'Rania', 'Lina', 'Salma', 'Yasmin', 'Huda',
    'Aarav', 'Priya', 'Rohan', 'Zara', 'Arjun', 'Ananya', 'Farhan', 'Nadia',
    'James', 'Emma', 'Michael', 'Sarah', 'Daniel', 'Olivia', 'David',
    'Sophie', 'Ryan', 'Laura'
  ];

  var FAMILY_NAMES = [
    'Al-Kuwari', 'Al-Thani', 'Al-Marri', 'Al-Sulaiti', 'Al-Mannai', 'Al-Naimi',
    'Al-Kaabi', 'Al-Emadi', 'Al-Ansari', 'Al-Sada', 'Al-Dosari', 'Al-Hajri',
    'Al-Muraikhi', 'Al-Sowaidi', 'Al-Yafei', 'Al-Mansouri', 'Al-Obaidly',
    'Al-Baker', 'Al-Malki', 'Al-Rumaihi', 'Al-Attiyah', 'Al-Khater',
    'Al-Jaber', 'Al-Suwaidi', 'Al-Nuaimi',
    'Hassan', 'Khalifa', 'Ibrahim', 'Kamal', 'Saleh', 'Bader', 'Tamim',
    'Saad', 'Sultan', 'Obaid', 'Rahman', 'Haddad', 'Khalil', 'Barakat',
    'Nasser',
    'Khan', 'Sharma', 'Gupta', 'Rao', 'Fernandes', 'Silva', 'Iqbal',
    'Chaudhry', 'Rahim', 'Siddiqui',
    'Clarke', 'Bennett', 'Wallace', 'Novak', 'Schmidt', 'Costa', 'Moreau',
    'Andersen', 'Wilson', 'Turner'
  ];

  /* QSTP host startups — same cast as data.js / data-survey.js, plus NOOR,
     the QSTP-founded startup that seed-world.js adds to the partner list. */
  var HOSTS = ['Snoonu', 'Meddy', 'Ogram', 'Fluidic', 'Karaz', 'Baladna Digital', 'NOOR'];

  var EXTERNALS = [
    'QNB', 'Ooredoo', 'Qatar Airways', 'Vodafone Qatar', 'Qatar FinTech Hub',
    'HBKU', 'Qatar Foundation', 'Microsoft', 'Careem', 'Talabat',
    'Aramco Digital', 'Google', 'Amazon Web Services', 'Deloitte', 'Accenture'
  ];

  var ROLES = [
    'Software Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full-stack Engineer',
    'Mobile Engineer', 'DevOps Engineer', 'Data Analyst', 'Data Scientist',
    'ML Engineer', 'Product Manager', 'Product Designer', 'UX Researcher',
    'Business Analyst', 'Growth Marketer', 'Mechanical Engineer',
    'Biomedical Engineer', 'Research Assistant', 'QA Engineer',
    'Cloud Engineer', 'Solutions Architect'
  ];

  var SKILLS = [
    'Go', 'Python', 'React', 'TypeScript', 'SQL', 'Figma', 'Machine learning',
    'Data analysis', 'Product management', 'UX research', 'DevOps', 'Mobile',
    'Cloud / AWS', 'Growth marketing', 'Hardware / IoT', 'Research writing',
    'Postgres', 'Docker', 'Kubernetes', 'Node', 'Java', 'Kotlin', 'Swift',
    'Terraform', 'gRPC', 'Excel', 'Looker', 'PyTorch', 'MLOps', 'Payments',
    'Fundraising', 'Materials', 'Simulation', 'Arabic UX'
  ];

  var FIELDS = [
    'Computer Science', 'Software Engineering', 'Data Science',
    'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering',
    'Materials Science', 'Biomedical Sciences', 'Environmental Science',
    'Business Administration', 'Design', 'Public Policy'
  ];

  var DEGREES = ['Bachelor’s', 'Master’s', 'PhD'];

  var STAGES = ['Idea stage', 'Building MVP', 'Launched', 'Generating revenue'];

  var LOOKING_FOR = ['Full-time', 'Part-time', 'Internship', 'Co-founder / startup team'];

  var FOUNDER_TITLES = ['Founder', 'Co-founder & CEO', 'Co-founder & CTO', 'Co-founder'];

  var COUNTRIES = [
    'United Kingdom', 'United States', 'Canada', 'Germany', 'France',
    'Netherlands', 'Türkiye', 'Egypt', 'Jordan', 'India', 'Pakistan',
    'Malaysia', 'Singapore', 'Australia', 'Lebanon'
  ];

  var STARTUP_PREFIX = [
    'Souq', 'Waha', 'Dana', 'Rimal', 'Falcon', 'Pearl', 'Dune', 'Sahel',
    'Marsa', 'Wadi', 'Nakheel', 'Barq', 'Rawi', 'Amwaj', 'Khaleej', 'Zul',
    'Jood', 'Sadu', 'Firas', 'Miskal'
  ];
  var STARTUP_SUFFIX = [
    'Stack', 'Loop', 'Sense', 'Flow', 'Hub', 'Labs', 'Works', 'Grid',
    'Path', 'Bridge', 'Nest', 'Forge', 'Wave', 'Circuit', 'Yard', 'Base',
    'Point', 'Cloud', 'Spark', 'Line'
  ];

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var FULL_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /* "Now", for the purposes of this fixture — the same Jul 2026 the rest of
     the prototype's copy assumes. Fixed so the file never needs Date(). */
  var NOW_YEAR = 2026;
  var NOW_MONTH = 6; /* 0-indexed: Jun=5, Jul=6 */

  var TILES = [P.ink, P.inkDeep, P.teal, P.tealMid, P.tealDeep];

  /* Fall admits in September, Winter in January, Summer in June — sizes are
     the brief's exact per-cycle counts, and their sum is exactly 1,842. */
  var CYCLES = [
    { name: 'Fall ’24', size: 348, year: 2024, month: 8 },
    { name: 'Winter ’25', size: 362, year: 2025, month: 0 },
    { name: 'Summer ’25', size: 340, year: 2025, month: 5 },
    { name: 'Fall ’25', size: 330, year: 2025, month: 8 },
    { name: 'Winter ’26', size: 262, year: 2026, month: 0 },
    { name: 'Summer ’26', size: 200, year: 2026, month: 5 }
  ];

  var STATUS_WEIGHTS = [
    ['Employed', 0.48], ['Studying', 0.17], ['Looking', 0.10],
    ['Founder', 0.09], ['Freelancing', 0.07], ['Break', 0.03],
    ['Unreported', 0.06]
  ];

  var LOCATION_WEIGHTS = [['Qatar', 0.70], ['GCC', 0.12], ['Elsewhere', 0.18]];

  var AVAIL_WEIGHTS = [['open', 0.25], ['soon', 0.20], ['closed', 0.55]];
  var AVAIL_LABEL = { open: 'Open to offers', soon: 'Available in 30 days', closed: 'Not looking' };

  /* ── rng helpers — every one of these pulls exactly one float from rng()
     per call (pickN pulls one per item), so the call order for a given
     status branch is always the same shape regardless of which values come
     back. That's what makes two runs with the same rng identical. ────── */

  function rngInt(rng, n) { return Math.floor(rng() * n); }
  function rngPick(rng, arr) { return arr[rngInt(rng, arr.length)]; }
  function rngBool(rng, p) { return rng() < p; }

  function pickWeighted(rng, table) {
    var r = rng();
    var cum = 0;
    var i;
    for (i = 0; i < table.length; i++) {
      cum += table[i][1];
      if (r < cum) return table[i][0];
    }
    return table[table.length - 1][0];
  }

  /* n unique items out of source, order not meaningful — a Durstenfeld
     partial shuffle so it costs exactly n rng() calls, not source.length. */
  function pickN(rng, source, n) {
    var pool = source.slice();
    var result = [];
    var i, idx;
    for (i = 0; i < n; i++) {
      idx = rngInt(rng, pool.length - i);
      result.push(pool[idx]);
      pool[idx] = pool[pool.length - 1 - i];
    }
    return result;
  }

  function addMonths(year, month, delta) {
    var total = year * 12 + month + delta;
    var y = Math.floor(total / 12);
    var m = total % 12;
    if (m < 0) { m += 12; y -= 1; }
    return { year: y, month: m };
  }

  function formatMonthYear(d) { return MONTHS[d.month] + ' ' + d.year; }

  function monthsAgo(n) { return formatMonthYear(addMonths(NOW_YEAR, NOW_MONTH, -n)); }

  function slugify(s) { return s.toLowerCase().replace(/[^a-z]/g, ''); }

  /* The one detail every current-status entry has to agree with: what the
     person is doing right now, dressed up as a progression row. */
  function currentEntry(rng, person, dateStr) {
    switch (person.status) {
      case 'Employed':
        return { year: dateStr, title: person.role, org: person.employer,
          level: rngPick(rng, ['Junior', 'Mid-level', 'Senior']) };
      case 'Founder':
        return { year: dateStr, title: person.role, org: person.startup, level: 'Founder' };
      case 'Studying':
        return { year: dateStr, title: person.degree + ' Researcher, ' + person.field,
          org: rngPick(rng, ['HBKU', 'Qatar University', 'Abroad']), level: 'Postgraduate' };
      case 'Freelancing':
        return { year: dateStr, title: 'Freelance ' + person.role, org: 'Freelance', level: 'Freelance' };
      default:
        return null;
    }
  }

  var HAS_TITLE = { Employed: true, Founder: true, Studying: true, Freelancing: true };

  QB.seedPeople = function (rng) {
    var people = [];
    var freshAlumniIdx = [];
    var id = 0;
    var c, i;

    for (c = 0; c < CYCLES.length; c++) {
      var cycle = CYCLES[c];
      var isInternCycle = cycle.name === 'Summer ’26';
      var internDate = formatMonthYear({ year: cycle.year, month: cycle.month });
      var monthsSinceIntern = (NOW_YEAR * 12 + NOW_MONTH) - (cycle.year * 12 + cycle.month);

      for (i = 0; i < cycle.size; i++) {
        id += 1;

        var firstName = rngPick(rng, FIRST_NAMES);
        var familyName = rngPick(rng, FAMILY_NAMES);
        var name = firstName + ' ' + familyName;
        var nameParts = familyName.split('-');
        var initials = firstName.charAt(0).toUpperCase() +
          nameParts[nameParts.length - 1].charAt(0).toUpperCase();

        var kind = isInternCycle ? 'intern' : 'alumni';

        var location = pickWeighted(rng, LOCATION_WEIGHTS);
        var country = location === 'Elsewhere' ? rngPick(rng, COUNTRIES) : null;

        var skillCount = 3 + rngInt(rng, 3);
        var skills = pickN(rng, SKILLS, skillCount);

        var avail = pickWeighted(rng, AVAIL_WEIGHTS);
        var availLabel = AVAIL_LABEL[avail];

        var status, role, employer, employerKind;
        var startup = null, stage = null, incubated = null;
        var degree = null, field = null, lookingFor = [];
        var internHost;

        if (kind === 'intern') {
          status = 'Intern';
          role = 'Intern';
          employer = rngPick(rng, HOSTS);
          employerKind = 'Host startup';
          internHost = employer;
        } else {
          status = pickWeighted(rng, STATUS_WEIGHTS);
          internHost = rngPick(rng, HOSTS);
          role = null; employer = null; employerKind = null;

          if (status === 'Employed') {
            if (rngBool(rng, 0.6)) {
              employer = rngPick(rng, HOSTS);
              employerKind = 'Host startup';
            } else {
              employer = rngPick(rng, EXTERNALS);
              employerKind = 'External';
            }
            role = rngPick(rng, ROLES);
          } else if (status === 'Founder') {
            startup = rngPick(rng, STARTUP_PREFIX) + ' ' + rngPick(rng, STARTUP_SUFFIX);
            stage = rngPick(rng, STAGES);
            incubated = rngBool(rng, 1 / 3);
            role = rngPick(rng, FOUNDER_TITLES);
            employer = startup;
            employerKind = 'Own company';
          } else if (status === 'Studying') {
            degree = rngPick(rng, DEGREES);
            field = rngPick(rng, FIELDS);
          } else if (status === 'Looking') {
            lookingFor = [];
            for (var lf = 0; lf < LOOKING_FOR.length; lf++) {
              if (rngBool(rng, 0.45)) lookingFor.push(LOOKING_FOR[lf]);
            }
            if (lookingFor.length === 0) lookingFor.push(rngPick(rng, LOOKING_FOR));
          } else if (status === 'Freelancing') {
            role = rngPick(rng, ROLES);
          }
          /* Break and Unreported: nothing further to fill in — that gap is
             the point, not a bug in the generator. */
        }

        /* fresh + lastUpdate. Interns are, definitionally, current — they
           only get folded into the alumni base once a later cycle runs. */
        /* A record cannot be older than the internship that created it, so
           the draw is capped at the age of the cycle. Someone six months out
           of the programme has a six-month-old record at worst — which also
           makes them current by definition. */
        var fresh, lastUpdate, back;
        if (kind === 'intern') {
          fresh = true;
          back = Math.min(rngInt(rng, 2), monthsSinceIntern);
        } else {
          fresh = rngBool(rng, 0.63);
          back = fresh ? rngInt(rng, 6) : 7 + rngInt(rng, 12);
          if (back > monthsSinceIntern) { back = monthsSinceIntern; fresh = true; }
        }
        lastUpdate = monthsAgo(back);

        /* Progression: always ends on the internship. Statuses with a real
           title get 2–3 rows; the quiet statuses (Looking / Break /
           Unreported / Intern) just keep the internship row, since there is
           nothing truthful to put above it. */
        var internEntry = { year: internDate, title: 'Intern', org: internHost, level: 'Intern' };
        var progression;

        if (kind === 'intern') {
          progression = [internEntry];
        } else if (HAS_TITLE[status]) {
          var curDate = monthsAgo(rngInt(rng, 4));
          var curEntry = currentEntry(rng, { status: status, role: role, employer: employer,
            startup: startup, degree: degree, field: field }, curDate);
          var wantsMid = rngInt(rng, 3) === 0;
          if (wantsMid && monthsSinceIntern >= 14) {
            var midDelta = Math.floor(monthsSinceIntern / 2);
            var midDate = formatMonthYear(addMonths(cycle.year, cycle.month, midDelta));
            var midEntry = { year: midDate, title: 'Junior ' + (role || 'Engineer'), org: internHost, level: 'Junior' };
            progression = [curEntry, midEntry, internEntry];
          } else {
            progression = [curEntry, internEntry];
          }
        } else {
          progression = [internEntry];
        }

        var email = slugify(firstName) + '.' + slugify(familyName) + '.' + id + '@alumni.qstp.qa';

        var person = {
          id: id, name: name, initials: initials, tile: TILES[(id - 1) % TILES.length],
          cycle: cycle.name, kind: kind, status: status, role: role,
          employer: employer, employerKind: employerKind,
          startup: startup, stage: stage, incubated: incubated,
          degree: degree, field: field, lookingFor: lookingFor,
          location: location, country: country, skills: skills,
          avail: avail, availLabel: availLabel, email: email,
          lastUpdate: lastUpdate, fresh: fresh, spotlight: null,
          progression: progression
        };

        people.push(person);
        if (kind === 'alumni' && fresh) freshAlumniIdx.push(people.length - 1);
      }
    }

    /* Exactly 10 spotlights, drawn from the fresh alumni via reservoir
       sampling — the only way to land on a fixed-size sample from a
       variable-size pool using one pass and one rng() per candidate. */
    var reservoir = [];
    for (i = 0; i < freshAlumniIdx.length; i++) {
      if (reservoir.length < 10) {
        reservoir.push(freshAlumniIdx[i]);
      } else {
        var j = rngInt(rng, i + 1);
        if (j < 10) reservoir[j] = freshAlumniIdx[i];
      }
    }
    for (i = 0; i < reservoir.length; i++) {
      var p = people[reservoir[i]];
      if (rngBool(rng, 0.5)) {
        p.spotlight = 'Featured week ' + (1 + rngInt(rng, 52));
      } else {
        p.spotlight = 'Featured in ' + rngPick(rng, FULL_MONTHS);
      }
    }

    return people;
  };
})(window.QB = window.QB || {});
