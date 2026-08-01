/* World seed — builds every cross-referencing fixture (partners, offers,
   jobs, ideas, events, referrals, spotlight queue) from a person list that
   some sibling generator hands in. Nothing here reaches for Math.random or
   Date: the same rng function and the same people array must always produce
   the same world, because two different screens seed themselves from this
   independently and have to agree with each other. */
(function (QB) {
  'use strict';

  var P = QB.palette;

  /* ── rng helpers — every call below goes through one of these, in a fixed
     order, so the output only ever depends on (rng, people) ─────────── */

  function randInt(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  function pick(rng, arr) {
    return arr[randInt(rng, 0, arr.length - 1)];
  }

  function shuffleCopy(rng, arr) {
    var a = arr.slice();
    var i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = randInt(rng, 0, i);
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  /* ── small people-filtering utilities ────────────────────────────── */

  function byEmployer(people, name) {
    return people.filter(function (p) { return p.employer === name; });
  }

  function skillOverlapCount(personSkills, offerSkills) {
    if (!personSkills || !offerSkills) return 0;
    var lower = personSkills.map(function (s) { return String(s).toLowerCase(); });
    var n = 0;
    offerSkills.forEach(function (s) {
      if (lower.indexOf(String(s).toLowerCase()) !== -1) n++;
    });
    return n;
  }

  function matchPercent(rng, overlap, total) {
    var base = 55 + overlap * 12 + randInt(rng, -3, 4);
    if (total > 0) base += Math.round((overlap / total) * 6);
    return clamp(base, 52, 97) + '%';
  }

  function peopleForOffer(rng, people, offerSkills) {
    var withOverlap = people.filter(function (p) {
      return skillOverlapCount(p.skills, offerSkills) > 0;
    });
    var chosen = shuffleCopy(rng, withOverlap).slice(0, 3);
    return chosen.map(function (p) {
      return { id: p.id, match: matchPercent(rng, skillOverlapCount(p.skills, offerSkills), offerSkills.length) };
    });
  }

  /* Engineering / Design / Data / Growth — the categories the job-board
     filter chips already use (QB.filters.roles). */
  function categoryFor(title, skillsStr) {
    var hay = (title + ' ' + skillsStr).toLowerCase();
    if (hay.indexOf('design') !== -1 || hay.indexOf('figma') !== -1 || hay.indexOf('ux') !== -1) return 'Design';
    if (hay.indexOf('data') !== -1 || hay.indexOf('analy') !== -1 || hay.indexOf('scien') !== -1 ||
        hay.indexOf('ml') !== -1 || hay.indexOf('nlp') !== -1 || hay.indexOf('research') !== -1) return 'Data';
    if (hay.indexOf('growth') !== -1 || hay.indexOf('market') !== -1 || hay.indexOf('lifecycle') !== -1) return 'Growth';
    return 'Engineering';
  }

  function placeFor(location) {
    return location.indexOf('Remote') === 0 ? 'Remote' : 'Doha';
  }

  /* ── partner base facts — same 7 organizations as src/data-directory.js,
     plus NOOR (id 8): the one partner on this list that exists *because*
     of the programme rather than merely alongside it. `people`/`stats`
     are filled in later, once the real people list is known. ─────────── */

  var PARTNER_BASE = [
    { id: 1, initials: 'SN', logoBg: P.ink, name: 'Snoonu', kind: 'Host startup',
      sector: 'Q-commerce', size: '240 staff', joined: 'Feb 2021', location: 'Doha',
      status: 'Active', tone: 'lime', lastActive: '2 days ago',
      contact: 'Mariam Al-Ansari · Talent Lead', email: 'talent@snoonu.qa',
      note: 'Longest-running host. Takes 4–6 interns a cycle and converts most of them.' },

    { id: 2, initials: 'MD', logoBg: P.tealMid, name: 'Meddy', kind: 'Host startup',
      sector: 'Health-tech', size: '120 staff', joined: 'Jun 2021', location: 'Doha',
      status: 'Active', tone: 'lime', lastActive: '1 week ago',
      contact: 'Khalid Rahman · Head of People', email: 'people@meddy.qa',
      note: 'Strong design and ML placements. Asks for Arabic-UX capable designers.' },

    { id: 3, initials: 'FL', logoBg: P.teal, name: 'Fluidic', kind: 'Incubatee',
      sector: 'Deep tech · IoT', size: '14 staff', joined: 'Mar 2024', location: 'Doha',
      status: 'Active', tone: 'lime', lastActive: 'today',
      contact: 'Aisha Khalifa · Co-founder', email: 'aisha@fluidic.qa',
      note: 'Founded by a QSTP alum (Cohort ’22) and now hosting interns itself.' },

    { id: 4, initials: 'OG', logoBg: P.inkDeep, name: 'Ogram', kind: 'Host startup',
      sector: 'Workforce marketplace', size: '90 staff', joined: 'Sep 2021', location: 'Doha',
      status: 'Quiet', tone: 'mute', lastActive: '5 weeks ago',
      contact: 'Sami Haddad · Engineering Manager', email: 'sami@ogram.co',
      note: 'Posting has slowed since Q1. Worth a call before the winter cycle.' },

    { id: 5, initials: 'KZ', logoBg: P.tealDeep, name: 'Karaz', kind: 'External',
      sector: 'Consumer apps', size: '60 staff', joined: 'Jan 2023', location: 'Remote · Doha 1w/mo',
      status: 'Dormant', tone: 'mute', lastActive: '2 months ago',
      contact: 'Hind Al-Marri · Recruiter', email: 'hiring@karaz.app',
      note: 'One offer, no hires. Hosted two interns in 2023 and 2024 but has not returned.' },

    { id: 6, initials: 'BD', logoBg: P.tealMid, name: 'Baladna Digital', kind: 'External',
      sector: 'Agri-tech', size: '45 staff', joined: 'May 2022', location: 'Al Khor',
      status: 'Dormant', tone: 'mute', lastActive: '4 months ago',
      contact: 'Faisal Obaid · CTO', email: 'faisal@baladna.digital',
      note: 'Took biotech placements in 2021–22. No posting since the spring cycle.' },

    { id: 7, initials: 'QF', logoBg: P.ink, name: 'Qatar FinTech Hub', kind: 'External',
      sector: 'Fintech accelerator', size: '30 staff', joined: 'Nov 2025', location: 'Doha',
      status: 'Dormant', tone: 'mute', lastActive: 'never posted',
      contact: 'Noura Sultan · Programme Manager', email: 'noura@qfth.qa',
      note: 'Onboarded nine months ago and has never posted. Needs an activation call.' },

    /* The one partner that did not arrive from outside — Ideastorm sent it. */
    /* Ink, not lime: .tile sets white initials, which lime cannot carry. */
    { id: 8, initials: 'NR', logoBg: P.inkDeep, name: 'NOOR', kind: 'Incubatee',
      sector: 'Arabic-language AI', size: '9 staff', joined: 'Apr 2025', location: 'Doha',
      status: 'Active', tone: 'lime', lastActive: '3 days ago',
      contact: 'Fatima Rashid · Co-founder', email: 'fatima@noor.ai',
      note: 'Founded through the QSTP Beyond Ideastorm → incubation pipeline; now building Gulf-dialect voice and text models, and hosting its own interns.' }
  ];

  var PARTNER_NAMES = PARTNER_BASE.map(function (p) { return p.name; });

  /* ── offers — templates per non-Snoonu partner. Snoonu's six are copied
     verbatim from data.js liveOffers below, ids 1–6; everyone else's start
     at 7 so the whole set stays unique. ─────────────────────────────── */

  var OFFER_SEEDS = {
    'Meddy': [
      { title: 'Backend Engineer', type: 'Full-time', skills: ['Go', 'Postgres', 'APIs'] },
      { title: 'Product Designer', type: 'Full-time', skills: ['Figma', 'Design systems', 'Arabic UX'] },
      { title: 'Data Analyst (Intern)', type: 'Internship', skills: ['SQL', 'Looker'] }
    ],
    'Fluidic': [
      { title: 'Founding Engineer', type: 'Co-founder', skills: ['TypeScript', 'IoT', '0→1'] },
      { title: 'Hardware Engineer', type: 'Full-time', skills: ['Embedded', 'IoT', 'C++'] }
    ],
    'Ogram': [
      { title: 'Data Scientist', type: 'Full-time', skills: ['Python', 'Forecasting', 'dbt'] },
      { title: 'Growth Analyst', type: 'Full-time', skills: ['SQL', 'Lifecycle'] }
    ],
    'Karaz': [
      { title: 'Growth Lead, MENA', type: 'Full-time', skills: ['Lifecycle', 'Paid social', 'B2C'] },
      { title: 'Backend Engineer', type: 'Full-time', skills: ['Node', 'Postgres'] }
    ],
    'Baladna Digital': [
      { title: 'IoT Engineer', type: 'Full-time', skills: ['Embedded', 'Sensors'] },
      { title: 'Data Engineer', type: 'Full-time', skills: ['Python', 'ETL'] }
    ],
    'Qatar FinTech Hub': [
      { title: 'Fintech Analyst (Intern)', type: 'Internship', skills: ['Compliance', 'SQL'] }
    ],
    'NOOR': [
      { title: 'NLP Engineer', type: 'Full-time', skills: ['Python', 'PyTorch', 'Arabic NLP'] },
      { title: 'Applied Research Intern', type: 'Internship', skills: ['Python', 'ML', 'Research'] }
    ]
  };

  var POSTED_POOL = ['today', '2 days ago', '4 days ago', '1 week ago', '2 weeks ago',
    '3 weeks ago', '5 weeks ago', '2 months ago', '3 months ago'];
  var LOCATION_POOL = ['Doha · Hybrid', 'Doha · On-site', 'Remote'];
  var PAY_POOL = ['QAR 18–23k', 'QAR 20–25k', 'QAR 22–26k', 'QAR 24–29k', 'QAR 26–31k', 'QAR 28–34k'];
  var INTERN_PAY_POOL = ['QAR 6–9k', 'QAR 8–10k'];

  function snoonuOffers() {
    /* Copied from src/data.js `liveOffers`, tagged with the org they now
       travel with once offers live alongside every other partner's. */
    return [
      { id: 1, org: 'Snoonu', title: 'Senior Backend Engineer', type: 'Full-time', location: 'Doha · Hybrid',
        pay: 'QAR 28–34k', posted: '2 days ago', status: 'Open', tone: 'lime',
        skills: 'Go, Postgres, Kubernetes',
        funnel: { applied: 14, shortlisted: 6, interviewed: 3, hired: 0 },
        people: [] },

      { id: 2, org: 'Snoonu', title: 'Product Analyst (Intern)', type: 'Internship', location: 'Doha · On-site',
        pay: 'QAR 8–10k', posted: '9 days ago', status: 'Open', tone: 'lime',
        skills: 'SQL, Excel, Looker',
        funnel: { applied: 31, shortlisted: 9, interviewed: 4, hired: 0 },
        people: [] },

      { id: 3, org: 'Snoonu', title: 'DevOps Engineer', type: 'Full-time', location: 'Remote',
        pay: 'QAR 24–29k', posted: '3 weeks ago', status: 'Open', tone: 'lime',
        skills: 'Kubernetes, Terraform, AWS',
        funnel: { applied: 8, shortlisted: 3, interviewed: 1, hired: 0 },
        people: [] },

      { id: 4, org: 'Snoonu', title: 'Data Scientist', type: 'Full-time', location: 'Doha · Hybrid',
        pay: 'QAR 26–31k', posted: '2 months ago', status: 'Filled', tone: 'teal',
        skills: 'Python, Forecasting, dbt',
        funnel: { applied: 22, shortlisted: 7, interviewed: 4, hired: 1 },
        people: [] },

      { id: 5, org: 'Snoonu', title: 'Mobile Engineer (iOS)', type: 'Full-time', location: 'Doha · Hybrid',
        pay: 'QAR 25–30k', posted: '5 weeks ago', status: 'Closed', tone: 'mute',
        skills: 'Swift, iOS, REST',
        funnel: { applied: 11, shortlisted: 4, interviewed: 2, hired: 1 },
        people: [] },

      { id: 6, org: 'Snoonu', title: 'Growth Marketer', type: 'Full-time', location: 'Doha · On-site',
        pay: 'QAR 18–23k', posted: '3 months ago', status: 'Closed', tone: 'mute',
        skills: 'Lifecycle, Paid social',
        funnel: { applied: 9, shortlisted: 2, interviewed: 0, hired: 0 },
        people: [] }
    ];
  }

  function buildOffers(rng, people) {
    var offers = snoonuOffers();
    /* Snoonu's `people` refs above are re-derived from the passed-in list
       instead of hardcoded ids, same as every other offer below. */
    offers.forEach(function (o) {
      o.people = peopleForOffer(rng, people, o.skills.split(', '));
    });

    var nextId = 7;
    PARTNER_BASE.slice(1).forEach(function (partner) {
      var seeds = OFFER_SEEDS[partner.name] || [];
      seeds.forEach(function (seed) {
        var type = seed.type;
        var location = type === 'Co-founder' ? 'Doha · On-site' : pick(rng, LOCATION_POOL);
        var pay = type === 'Co-founder' ? 'Equity + salary'
          : type === 'Internship' ? pick(rng, INTERN_PAY_POOL)
          : pick(rng, PAY_POOL);
        var posted = pick(rng, POSTED_POOL);

        var roll = rng();
        var status = roll < 0.5 ? 'Open' : roll < 0.8 ? 'Filled' : 'Closed';
        var tone = status === 'Open' ? 'lime' : status === 'Filled' ? 'teal' : 'mute';

        var applied = randInt(rng, 5, 32);
        var shortlisted = clamp(Math.round(applied * (0.2 + rng() * 0.35)), 1, applied);
        var interviewed = clamp(Math.round(shortlisted * (0.25 + rng() * 0.45)), 0, shortlisted);
        var hired = status === 'Open' ? 0 : randInt(rng, 0, interviewed);

        offers.push({
          id: nextId++,
          org: partner.name,
          title: seed.title,
          type: type,
          location: location,
          pay: pay,
          posted: posted,
          status: status,
          tone: tone,
          skills: seed.skills.join(', '),
          funnel: { applied: applied, shortlisted: shortlisted, interviewed: interviewed, hired: hired },
          people: peopleForOffer(rng, people, seed.skills)
        });
      });
    });

    return offers;
  }

  /* ── jobs — the alumni-facing feed, one row per *open* offer, reshaped
     to match `QB.data.jobs` in src/data.js key for key. ────────────── */

  function buildJobs(offers, partnersByName) {
    return offers.filter(function (o) { return o.status === 'Open'; }).map(function (o) {
      var partner = partnersByName[o.org];
      var badge, badgeTone;
      if (partner.kind === 'Incubatee') {
        badge = 'Incubatee'; badgeTone = 'lime';
      } else if (partner.people.length > 0) {
        badge = partner.people.length + ' alumni here'; badgeTone = 'teal';
      } else if (o.posted === 'today') {
        badge = 'New'; badgeTone = 'lime';
      } else {
        badge = 'Fast reply'; badgeTone = 'teal';
      }
      return {
        id: o.id,
        title: o.title,
        company: partner.name,
        initials: partner.initials,
        logoBg: partner.logoBg,
        cat: categoryFor(o.title, o.skills),
        place: placeFor(o.location),
        location: o.location,
        type: o.type,
        pay: o.pay,
        posted: o.posted,
        badge: badge,
        badgeTone: badgeTone,
        match: o.people.length > 0 ? o.people[0].match : '60%',
        tags: o.skills.split(', ')
      };
    });
  }

  /* ── partners — recompute `people` and `stats` from the real roster,
     and mirror the offers each partner now actually has open. ────────── */

  function buildPartners(people, offers) {
    return PARTNER_BASE.map(function (base) {
      var roster = byEmployer(people, base.name);
      var partnerOffers = offers.filter(function (o) { return o.org === base.name; });
      var hires = partnerOffers.reduce(function (sum, o) { return sum + o.funnel.hired; }, 0);

      var out = {};
      Object.keys(base).forEach(function (k) { out[k] = base[k]; });
      out.stats = { offers: partnerOffers.length, hires: hires, alumni: roster.length };
      out.offers = partnerOffers.map(function (o) {
        return { title: o.title, meta: o.type + ' · ' + o.location + ' · ' + o.posted,
          applicants: o.funnel.applied, status: o.status, tone: o.tone };
      });
      out.people = roster.slice(0, 6).map(function (p) { return p.id; });
      return out;
    });
  }

  /* ── ideas — six from data.js Ideastorm, six new, all with an owner
     denormalized from the real people list. ──────────────────────────── */

  var IDEA_SEEDS = [
    { title: 'Majlis — Arabic AI tutor', stage: 'Concept', joined: 4,
      needs: ['ML engineer', 'iOS'],
      blurb: 'A voice-first tutor for Gulf-dialect Arabic, aimed at expat families. The curriculum is written; the model work is open.' },
    { title: 'GreenLoop', stage: 'Prototype', joined: 6,
      needs: ['Chem eng', 'Grant writer'],
      blurb: 'Turning desalination brine into industrial minerals. Bench prototype has been running at the QSTP labs since March.' },
    { title: 'Souq Stack', stage: 'Pre-seed', joined: 9,
      needs: ['Co-founder', 'Payments'],
      blurb: 'Checkout and settlement rails for small GCC merchants. Two design partners signed; hiring a technical co-founder.' },
    { title: 'Shift', stage: 'Concept', joined: 2,
      needs: ['Backend', 'Ops lead'],
      blurb: 'Shift-swapping for hospitality staff in Doha — WhatsApp-first, no app to install. Two venues want to pilot in September.' },
    { title: 'Rig Sense', stage: 'Prototype', joined: 5,
      needs: ['Data eng', 'Sales'],
      blurb: 'Vibration sensors that predict pump failure on LNG sites. The hardware works; the buyer-facing data story does not yet.' },
    { title: 'Warda', stage: 'Pre-seed', joined: 7,
      needs: ['Growth', 'Full-stack'],
      blurb: 'Same-day flower and gift logistics for GCC retailers. Revenue since April, raising a small round this autumn.' },
    { title: 'Nabta', needs: ['Agronomist', 'Backend'],
      blurb: 'Sensor-driven irrigation scheduling for greenhouse growers in the Gulf. Two farms are piloting the dashboard; the hardware still needs a redesign for dust.' },
    { title: 'Sadad Flow', needs: ['Compliance', 'Backend'],
      blurb: 'Instant settlement for GCC gig-economy payouts, built on the existing bank rails. In conversation with two workforce platforms about a pilot.' },
    { title: 'Rawi', needs: ['Content', 'iOS'],
      blurb: 'Short-form Arabic audio stories for children, recorded with Gulf-dialect voice actors. The first twenty episodes are done; the app is not.' },
    { title: 'Circuit Care', needs: ['Embedded', 'Clinical advisor'],
      blurb: 'A wearable that flags irregular vitals for home dialysis patients and pages a nurse. In discussion with one Doha clinic for a supervised trial.' },
    { title: 'Barr', needs: ['Ops lead', 'Mapping'],
      blurb: 'Route-planning for last-mile delivery across unmapped desert roads outside Doha. Three riders are running it daily; the map data is still hand-corrected.' },
    { title: 'Lughati', needs: ['ML engineer', 'Linguist'],
      blurb: 'Gulf-dialect speech-to-text for call centres, trained on donated recordings. Accuracy is strong for Qatari Arabic; still weak on Gulf-wide dialects.' }
  ];

  var STAGE_POOL = ['Concept', 'Prototype', 'Pre-seed'];

  function buildIdeas(rng, people) {
    var incubatedFounders = people.filter(function (p) { return p.status === 'Founder' && p.incubated; });
    var otherFounders = people.filter(function (p) { return p.status === 'Founder' && !p.incubated; });
    var rest = shuffleCopy(rng, people.filter(function (p) { return p.status !== 'Founder'; }));
    var ownerPool = incubatedFounders.concat(otherFounders).concat(rest);
    if (ownerPool.length === 0) ownerPool = people.slice();

    var ideas = IDEA_SEEDS.map(function (seed, i) {
      var stage = seed.stage || pick(rng, STAGE_POOL);
      var joined = seed.joined || randInt(rng, 2, 10);
      var owner = ownerPool[i % ownerPool.length];
      return {
        id: i + 1,
        ownerId: owner.id,
        title: seed.title,
        blurb: seed.blurb,
        stage: stage,
        needs: seed.needs,
        joined: joined,
        owner: owner.name,
        ownerInitials: owner.initials,
        backed: false
      };
    });

    /* Exactly two ideas read as "you're backing this" in the resting state. */
    var order = shuffleCopy(rng, ideas.map(function (idea, i) { return i; }));
    ideas[order[0]].backed = true;
    ideas[order[1]].backed = true;

    return ideas;
  }

  /* ── events — Home/alumni cards and the management events table are the
     same events, described from two seats; merged into one record each,
     plus `id`. `tone` is the consumer tag's colour, `statusTone` is the
     admin status's — the two originals disagree on purpose (a "Live" event
     can still show "spots left" in teal to the alumni who see it). ─────── */

  var EVENT_SEEDS = [
    { mon: 'Aug', day: '04', title: 'Founders’ Breakfast', meta: 'QSTP Innovation Centre · 08:00',
      tag: 'You’re going', tone: 'lime', date: '4 Aug 2026', reg: 62, cap: 80, status: 'Live', statusTone: 'lime' },
    { mon: 'Aug', day: '11', title: 'Ideastorm Pitch Night', meta: 'Tech Hub Auditorium · 18:30',
      tag: '12 spots left', tone: 'teal', date: '11 Aug 2026', reg: 108, cap: 120, status: 'Live', statusTone: 'lime' },
    { mon: 'Aug', day: '19', title: 'Alumni × Startups Hiring Fair', meta: 'QSTP Plaza · all day',
      tag: 'You’re going', tone: 'lime', date: '19 Aug 2026', reg: 241, cap: 400, status: 'Live', statusTone: 'lime' },
    { mon: 'Sep', day: '02', title: 'Deep-Tech Grant Clinic', meta: 'Online · 16:00',
      tag: 'Applications open', tone: 'teal', date: '2 Sep 2026', reg: 0, cap: 60, status: 'Draft', statusTone: 'mute' },
    { mon: 'Sep', day: '14', title: 'Winter Internship Kick-off', meta: 'QSTP Innovation Centre · 10:00',
      tag: 'Applications open', tone: 'teal', date: '14 Sep 2026', reg: 0, cap: 150, status: 'Draft', statusTone: 'mute' }
  ];

  var NEW_EVENT_SEEDS = [
    { mon: 'Sep', day: '23', title: 'Alumni Demo Day', meta: 'QSTP Auditorium · 17:00', date: '23 Sep 2026', cap: 150 },
    { mon: 'Sep', day: '30', title: 'Referral Rewards Briefing', meta: 'Online · 16:00', date: '30 Sep 2026', cap: 90 },
    { mon: 'Oct', day: '07', title: 'Founders’ Office Hours', meta: 'QSTP Innovation Centre · 14:00', date: '7 Oct 2026', cap: 40 },
    { mon: 'Oct', day: '14', title: 'Ideastorm Demo Crawl', meta: 'Tech Hub Auditorium · 18:00', date: '14 Oct 2026', cap: 130 },
    { mon: 'Oct', day: '21', title: 'Women in Deep Tech Mixer', meta: 'QSTP Plaza · 18:30', date: '21 Oct 2026', cap: 70, draft: true }
  ];

  function buildEvents(rng) {
    var events = EVENT_SEEDS.map(function (seed, i) {
      var e = {}; Object.keys(seed).forEach(function (k) { e[k] = seed[k]; });
      e.id = i + 1;
      return e;
    });

    NEW_EVENT_SEEDS.forEach(function (seed, i) {
      var status = seed.draft ? 'Draft' : 'Live';
      var reg = status === 'Draft' ? 0 : randInt(rng, Math.round(seed.cap * 0.3), Math.round(seed.cap * 0.95));
      var ratio = seed.cap > 0 ? reg / seed.cap : 0;
      var tag, tone;
      if (status === 'Draft') {
        tag = 'Applications open'; tone = 'teal';
      } else if (ratio >= 0.85) {
        tag = (seed.cap - reg) + ' spots left'; tone = 'teal';
      } else {
        tag = pick(rng, ['You’re going', 'Applications open']); tone = tag === 'You’re going' ? 'lime' : 'teal';
      }
      events.push({
        id: events.length + 1,
        mon: seed.mon, day: seed.day, title: seed.title, meta: seed.meta,
        tag: tag, tone: tone,
        date: seed.date, reg: reg, cap: seed.cap,
        status: status, statusTone: status === 'Live' ? 'lime' : 'mute'
      });
    });

    return events;
  }

  /* ── referrals — alumni-facing shape from data.js `referrals`, plus the
     ids each side denormalizes from. ─────────────────────────────────── */

  var REFERRAL_COMPANIES = PARTNER_NAMES.concat(['Careem · Dubai', 'Deloitte Qatar', 'Ooredoo']);
  var REFERRAL_ROLES = ['Backend Engineer', 'Data Analyst', 'Product Designer', 'ML Engineer',
    'Growth Marketer', 'Full-stack Engineer', 'DevOps Engineer', 'QA Engineer'];
  var REFERRAL_DATES = ['14 Jan 2026', '2 Feb 2026', '19 Feb 2026', '6 Mar 2026', '23 Mar 2026',
    '9 Apr 2026', '27 Apr 2026', '11 May 2026', '28 May 2026', '15 Jun 2026', '2 Jul 2026',
    '18 Jul 2026', '24 Jul 2026', '29 Jul 2026', '8 Jan 2026', '31 Jul 2026'];
  var REFERRAL_STATUS_TONE = { Submitted: 'mute', Verification: 'mute', Interviewing: 'teal', Hired: 'lime' };
  var REFERRAL_STATUSES = ['Submitted', 'Verification', 'Interviewing', 'Hired'];

  function buildReferrals(rng, people) {
    var alumPool = shuffleCopy(rng, people);
    var referrerCandidates = people.filter(function (p) { return p.status === 'Employed'; });
    var referrerPool = shuffleCopy(rng, referrerCandidates.length > 0 ? referrerCandidates : people);
    var datePool = shuffleCopy(rng, REFERRAL_DATES);

    var referrals = [];
    var i;
    for (i = 0; i < 16; i++) {
      var alum = alumPool[i % alumPool.length];
      var referrer = referrerPool[i % referrerPool.length];
      if (referrer.id === alum.id) {
        referrer = referrerPool[(i + 1) % referrerPool.length];
      }
      var status = pick(rng, REFERRAL_STATUSES);
      referrals.push({
        id: i + 1,
        alumId: alum.id,
        referrerId: referrer.id,
        alum: alum.name,
        referrer: referrer.name,
        initials: alum.initials,
        company: pick(rng, REFERRAL_COMPANIES),
        role: pick(rng, REFERRAL_ROLES),
        date: datePool[i % datePool.length],
        status: status,
        tone: REFERRAL_STATUS_TONE[status]
      });
    }
    return referrals;
  }

  /* ── spotlight queue — people with a live `spotlight` reason first, then
     the next-strongest Employed/Founder records, until we have eight. ──── */

  var SPOTLIGHT_BY_POOL = ['Programmes', 'Self', 'Alumni vote'];
  var SPOTLIGHT_SLOT_POOL = ['Week 33', 'Week 34', 'Queued'];

  function blurbFor(person) {
    if (person.status === 'Founder' && person.startup) {
      return 'Building ' + person.startup + ' full-time after their QSTP placement; the team is now hiring its first engineers.';
    }
    if (person.status === 'Founder') {
      return 'Left to found a company within a year of their internship and hasn’t looked back.';
    }
    if (person.status === 'Freelancing') {
      return 'Freelancing across ' + (person.skills && person.skills[0] ? person.skills[0] : 'client') + ' work while weighing the next full-time move.';
    }
    if (person.status === 'Studying') {
      return 'Back at the lab bench, turning research from their internship into a published paper.';
    }
    if (person.employer) {
      return 'Now ' + (person.role || 'working') + ' at ' + person.employer + ', and still mentors current interns.';
    }
    return 'One of the programme’s most active alumni this year.';
  }

  /* Not every spotlighted person carries a role (a Studying alum has a degree
     instead), but the nominee row always shows one line under the name. */
  function roleLineFor(person) {
    if (person.role) return person.role + (person.employer ? ', ' + person.employer : '');
    if (person.status === 'Studying') return person.degree + ' · ' + person.field;
    if (person.status === 'Looking') return 'Between roles · ' + person.cycle;
    return person.status + ' · ' + person.cycle;
  }

  function buildSpotlight(rng, people) {
    var withSpotlight = people.filter(function (p) { return p.spotlight; });
    var strongOthers = shuffleCopy(rng, people.filter(function (p) {
      return !p.spotlight && (p.status === 'Employed' || p.status === 'Founder');
    }));
    var pool = withSpotlight.concat(strongOthers);
    if (pool.length === 0) pool = people.slice();

    var chosen = [];
    var i;
    for (i = 0; i < 8; i++) chosen.push(pool[i % pool.length]);

    var order = shuffleCopy(rng, chosen.map(function (p, idx) { return idx; }));
    var featuredIdx = { };
    featuredIdx[order[0]] = 'Week 31';
    featuredIdx[order[1]] = 'Week 32';

    return chosen.map(function (person, idx) {
      var featured = featuredIdx.hasOwnProperty(idx);
      var by;
      if (!featured && PARTNER_NAMES.indexOf(person.employer) !== -1 && rng() < 0.3) {
        by = person.employer;
      } else {
        by = pick(rng, SPOTLIGHT_BY_POOL);
      }
      var slot = featuredIdx[idx] || pick(rng, SPOTLIGHT_SLOT_POOL);
      return {
        id: idx + 1,
        personId: person.id,
        name: person.name,
        initials: person.initials,
        tile: person.tile,
        role: roleLineFor(person),
        by: by,
        slot: slot,
        blurb: blurbFor(person),
        featured: featured
      };
    });
  }

  /* ── entry point ──────────────────────────────────────────────────── */

  QB.seedWorld = function (rng, people) {
    var offers = buildOffers(rng, people);

    var partners = buildPartners(people, offers);
    var partnersByName = {};
    partners.forEach(function (p) { partnersByName[p.name] = p; });

    var jobs = buildJobs(offers, partnersByName);
    var ideas = buildIdeas(rng, people);
    var events = buildEvents(rng);
    var referrals = buildReferrals(rng, people);
    var spotlight = buildSpotlight(rng, people);

    return {
      partners: partners,
      offers: offers,
      jobs: jobs,
      ideas: ideas,
      events: events,
      referrals: referrals,
      spotlight: spotlight
    };
  };
})(window.QB = window.QB || {});
