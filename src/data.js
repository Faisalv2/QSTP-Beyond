/* Fixture data for the QSTP Beyond dashboards.
   Colours here are the ones that have to travel with a record (an avatar tile,
   a chart series); everything else is a token in styles/theme.css. */
(function (QB) {
  'use strict';

  var INK = '#094438';
  var INK_DEEP = '#10241f';
  var TEAL = '#009ca7';
  var TEAL_MID = '#0a6a72';
  var TEAL_DEEP = '#0a4f56';
  var TEAL_PALE = '#93dae0';
  var LIME = '#bfd42f';
  var GREY = '#d5dad6';

  QB.palette = {
    ink: INK, inkDeep: INK_DEEP,
    teal: TEAL, tealMid: TEAL_MID, tealDeep: TEAL_DEEP, tealPale: TEAL_PALE,
    lime: LIME, grey: GREY
  };

  /* Tone names map to the --tone-*-bg / --tone-*-fg pairs in theme.css. */
  QB.data = {
    viewer: {
      name: 'Layla Hassan',
      initials: 'LH',
      meta: 'Alumni · Cohort ’23',
      profileComplete: 80,
      today: 'Wednesday, 30 July'
    },

    spotlight: [
      { id: 1, initials: 'AK', tile: INK, name: 'Aisha Khalifa', role: 'Co-founder, Fluidic',
        by: 'Programmes', slot: 'Week 31',
        blurb: 'Raised a QAR 4M pre-seed 18 months after her QSTP internship.' },
      { id: 2, initials: 'RT', tile: TEAL, name: 'Rashid Tamim', role: 'Staff Engineer, Snoonu',
        by: 'Snoonu', slot: 'Week 32',
        blurb: 'Mentored 11 interns; three now work on his team.' },
      { id: 3, initials: 'MS', tile: TEAL_MID, name: 'Mona Saad', role: 'PhD, Materials · HBKU',
        by: 'Self', slot: 'Queued',
        blurb: 'Her brine-recovery paper became the basis for GreenLoop.' },
      { id: 4, initials: 'JB', tile: INK_DEEP, name: 'Jassim Bader', role: 'Product Lead, Meddy',
        by: 'Alumni vote', slot: 'Queued',
        blurb: 'Runs the monthly Ideastorm review for early-stage teams.' }
    ],

    events: [
      { mon: 'Aug', day: '04', title: 'Founders’ Breakfast',
        meta: 'QSTP Innovation Centre · 08:00', tag: 'You’re going', tone: 'lime' },
      { mon: 'Aug', day: '11', title: 'Ideastorm Pitch Night',
        meta: 'Tech Hub Auditorium · 18:30', tag: '12 spots left', tone: 'teal' },
      { mon: 'Aug', day: '19', title: 'Alumni × Startups Hiring Fair',
        meta: 'QSTP Plaza · all day', tag: 'You’re going', tone: 'lime' },
      { mon: 'Sep', day: '02', title: 'Deep-Tech Grant Clinic',
        meta: 'Online · 16:00', tag: 'Applications open', tone: 'teal' }
    ],

    /* ── Alumni: job offers ───────────────────────────────────────── */

    jobs: [
      { id: 1, title: 'Senior Backend Engineer', company: 'Snoonu', initials: 'SN', logoBg: INK,
        cat: 'Engineering', place: 'Doha', location: 'Doha · Hybrid', type: 'Full-time',
        pay: 'QAR 28–34k', posted: '2 days ago', badge: '2 alumni here', badgeTone: 'teal',
        match: '94%', tags: ['Go', 'Postgres', 'Kubernetes'] },
      { id: 2, title: 'Founding Engineer', company: 'Fluidic', initials: 'FL', logoBg: TEAL,
        cat: 'Engineering', place: 'Doha', location: 'Doha · On-site', type: 'Equity + salary',
        pay: 'QAR 22–26k', posted: 'today', badge: 'Incubatee', badgeTone: 'lime',
        match: '88%', tags: ['TypeScript', 'IoT', '0→1'] },
      { id: 3, title: 'Product Designer', company: 'Meddy', initials: 'MD', logoBg: TEAL_MID,
        cat: 'Design', place: 'Remote', location: 'Remote · GCC', type: 'Full-time',
        pay: 'QAR 20–25k', posted: '4 days ago', badge: 'Fast reply', badgeTone: 'teal',
        match: '71%', tags: ['Figma', 'Design systems', 'Arabic UX'] },
      { id: 4, title: 'Data Scientist', company: 'Ogram', initials: 'OG', logoBg: INK_DEEP,
        cat: 'Data', place: 'Doha', location: 'Doha · Hybrid', type: 'Full-time',
        pay: 'QAR 26–31k', posted: '1 week ago', badge: 'Sponsors visa', badgeTone: 'teal',
        match: '80%', tags: ['Python', 'Forecasting', 'dbt'] },
      { id: 5, title: 'Growth Lead, MENA', company: 'Karaz', initials: 'KZ', logoBg: TEAL_DEEP,
        cat: 'Growth', place: 'Remote', location: 'Remote · Doha 1w/mo', type: 'Full-time',
        pay: 'QAR 24–29k', posted: '3 days ago', badge: 'New', badgeTone: 'lime',
        match: '62%', tags: ['Lifecycle', 'Paid social', 'B2C'] }
    ],

    matchSkills: ['Go', 'Postgres', 'Kubernetes', 'gRPC', 'SQL'],
    matchNote: 'Backend Engineer · Cohort ’23 · Doha. Add Terraform and Arabic UX to reach four more roles.',

    savedRoles: [
      { title: 'Founding Engineer', company: 'Fluidic', meta: 'saved 3 days ago' },
      { title: 'Platform Engineer', company: 'Snoonu', meta: 'closes 12 Aug' },
      { title: 'Backend Engineer', company: 'Karaz', meta: 'saved 2 weeks ago' }
    ],

    /* ── Alumni: Ideastorm ────────────────────────────────────────── */

    /* `backed` is the design's resting state for "you're backing" — it becomes
       state once the express-interest toggle is wired. */
    ideas: [
      { id: 1, title: 'Majlis — Arabic AI tutor', stage: 'Concept', joined: 4, backed: false,
        owner: 'Fatima R. · Cohort ’24', ownerInitials: 'FR', needs: ['ML engineer', 'iOS'],
        blurb: 'A voice-first tutor for Gulf-dialect Arabic, aimed at expat families. The curriculum is written; the model work is open.' },
      { id: 2, title: 'GreenLoop', stage: 'Prototype', joined: 6, backed: true,
        owner: 'Hamad S. · Cohort ’22', ownerInitials: 'HS', needs: ['Chem eng', 'Grant writer'],
        blurb: 'Turning desalination brine into industrial minerals. Bench prototype has been running at the QSTP labs since March.' },
      { id: 3, title: 'Souq Stack', stage: 'Pre-seed', joined: 9, backed: true,
        owner: 'Layla H. · Cohort ’23', ownerInitials: 'LH', needs: ['Co-founder', 'Payments'],
        blurb: 'Checkout and settlement rails for small GCC merchants. Two design partners signed; hiring a technical co-founder.' },
      { id: 4, title: 'Shift', stage: 'Concept', joined: 2, backed: false,
        owner: 'Dana M. · Cohort ’25', ownerInitials: 'DM', needs: ['Backend', 'Ops lead'],
        blurb: 'Shift-swapping for hospitality staff in Doha — WhatsApp-first, no app to install. Two venues want to pilot in September.' },
      { id: 5, title: 'Rig Sense', stage: 'Prototype', joined: 5, backed: false,
        owner: 'Khalid B. · Cohort ’21', ownerInitials: 'KB', needs: ['Data eng', 'Sales'],
        blurb: 'Vibration sensors that predict pump failure on LNG sites. The hardware works; the buyer-facing data story does not yet.' },
      { id: 6, title: 'Warda', stage: 'Pre-seed', joined: 7, backed: false,
        owner: 'Aisha K. · Cohort ’22', ownerInitials: 'AK', needs: ['Growth', 'Full-stack'],
        blurb: 'Same-day flower and gift logistics for GCC retailers. Revenue since April, raising a small round this autumn.' }
    ],

    ideaRequests: [
      { initials: 'YK', name: 'Yousef Kamal', role: 'ML Engineer · Cohort ’22',
        note: 'Can own the model pipeline two days a week.' },
      { initials: 'SI', name: 'Sara Ibrahim', role: 'Product Designer · Cohort ’21',
        note: 'Offering six weeks of design for equity.' },
      { initials: 'MH', name: 'Maryam Hassan', role: 'Data Analyst · Cohort ’24',
        note: 'Wants to run the merchant interviews.' }
    ],

    teamSteps: [
      { n: '01', text: 'Express interest — the owner sees your profile and skills, nothing else.' },
      { n: '02', text: 'If it’s mutual, QSTP opens a shared channel and a 30-minute intro slot.' },
      { n: '03', text: 'Teams of three or more can apply to the incubation pipeline directly.' }
    ],

    /* ── Alumni: referrals ────────────────────────────────────────── */

    referralSteps: [
      { n: '01', title: 'Name the alum',
        text: 'We confirm they’re QSTP alumni and ask their permission before anything is shared.' },
      { n: '02', title: 'Your team gets it first',
        text: 'The referral lands with the hiring manager tagged as an alumni introduction, ahead of the open pool.' },
      { n: '03', title: 'You see every step',
        text: 'Submitted, interviewing, hired — the status updates here, and both of you are told the outcome.' }
    ],

    referrals: [
      { initials: 'NA', name: 'Noor Al-Kuwari', company: 'Snoonu · Backend Engineer',
        date: '12 Jun 2026', status: 'Hired', tone: 'lime' },
      { initials: 'YK', name: 'Yousef Kamal', company: 'Meddy · ML Engineer',
        date: '2 Jul 2026', status: 'Interviewing', tone: 'teal' },
      { initials: 'RS', name: 'Reem Saleh', company: 'Ogram · Data Analyst',
        date: '18 Jul 2026', status: 'Submitted', tone: 'mute' }
    ],

    /* ── Management ───────────────────────────────────────────────── */

    trackedAlumni: 1842,

    kpis: [
      { label: 'Alumni tracked', value: '1,842', delta: '+126', deltaTone: 'up',
        note: 'Across 9 intern cohorts', rule: INK },
      { label: 'Conversion to ecosystem', value: '7.2%', delta: '+0.8 pt', deltaTone: 'up',
        note: '133 alumni inside QSTP companies', rule: TEAL },
      { label: 'Status response rate', value: '63%', delta: '+17 pts', deltaTone: 'up',
        note: 'Since referral perks launched', rule: LIME },
      { label: 'Active ideas', value: '38', delta: '−4', deltaTone: 'down',
        note: '6 teams formed this quarter', rule: TEAL_PALE }
    ],

    /* `pct` drives both the legend and the donut geometry. */
    outcomes: [
      { label: 'Employed', pct: 54.0, n: 995, color: INK },
      { label: 'Founded a company', pct: 11.0, n: 203, color: TEAL },
      { label: 'Incubation pipeline', pct: 7.2, n: 133, color: LIME },
      { label: 'Studying', pct: 19.0, n: 350, color: TEAL_PALE },
      { label: 'Unknown / lapsed', pct: 8.8, n: 161, color: GREY }
    ],
    outcomeCentre: { value: '65%', label: 'IN WORK' },

    conversion: {
      headline: '7.2%',
      change: '+0.8 pt QoQ',
      max: 8,
      series: [
        { label: 'Q4·23', value: 3.1 }, { label: 'Q1·24', value: 3.6 },
        { label: 'Q2·24', value: 4.2 }, { label: 'Q3·24', value: 4.0 },
        { label: 'Q4·24', value: 5.1 }, { label: 'Q1·25', value: 5.9 },
        { label: 'Q2·25', value: 6.5 }, { label: 'Q3·25', value: 7.2 }
      ]
    },

    engagement: [
      { label: 'Cohort ’21', pct: 71, color: INK },
      { label: 'Cohort ’22', pct: 66, color: INK },
      { label: 'Cohort ’23', pct: 58, color: TEAL },
      { label: 'Cohort ’24', pct: 49, color: TEAL },
      { label: 'Cohort ’25', pct: 44, color: TEAL_PALE }
    ],

    adminEvents: [
      { title: 'Founders’ Breakfast', date: '4 Aug 2026', reg: 62, cap: 80, status: 'Live', tone: 'lime' },
      { title: 'Ideastorm Pitch Night', date: '11 Aug 2026', reg: 108, cap: 120, status: 'Live', tone: 'lime' },
      { title: 'Alumni × Startups Hiring Fair', date: '19 Aug 2026', reg: 241, cap: 400, status: 'Live', tone: 'lime' },
      { title: 'Deep-Tech Grant Clinic', date: '2 Sep 2026', reg: 0, cap: 60, status: 'Draft', tone: 'mute' },
      { title: 'Winter Internship Kick-off', date: '14 Sep 2026', reg: 0, cap: 150, status: 'Draft', tone: 'mute' }
    ],

    moderation: [
      { title: 'Souq Stack', flag: 'Needs review', tone: 'teal', team: '9 members · forming',
        note: 'Requesting a co-founder introduction and a legal-structure session. Two design partners named — verify before featuring.' },
      { title: 'GreenLoop', flag: 'Lab access', tone: 'lime', team: '6 members · active',
        note: 'Asking for extended bench time at the materials lab. Candidate for the incubation pipeline this quarter.' },
      { title: 'CampusCoin', flag: 'Flagged ×2', tone: 'warn', team: '3 members · stalled',
        note: 'Two alumni flagged unclear token claims. No activity in 41 days — recommend archive.' }
    ],

    /* ── Organization ─────────────────────────────────────────────── */

    org: { name: 'Snoonu', initials: 'SN', kind: 'Host startup · QSTP Beyond', recruiter: 'MA' },
    pool: { open: 412, soon: 96 },

    talent: [
      { id: 1, name: 'Noor Al-Kuwari', initials: 'NK', tile: INK,
        role: 'Backend Engineer, 2 yrs', cohort: 'Cohort ’23',
        avail: 'Open to offers', availKey: 'open', skills: ['Go', 'Postgres', 'AWS', 'Docker'],
        note: 'Built the payments service at a QSTP incubatee; wants a founding-team seat next.' },
      { id: 2, name: 'Yousef Kamal', initials: 'YK', tile: TEAL,
        role: 'ML Engineer, 3 yrs', cohort: 'Cohort ’22',
        avail: 'Available in 30 days', availKey: 'soon', skills: ['Python', 'PyTorch', 'MLOps'],
        note: 'Arabic NLP research at HBKU, now shipping production models.' },
      { id: 3, name: 'Sara Ibrahim', initials: 'SI', tile: TEAL_MID,
        role: 'Product Designer, 4 yrs', cohort: 'Cohort ’21',
        avail: 'Open to offers', availKey: 'open', skills: ['Figma', 'Research', 'Design systems'],
        note: 'Ran the design system for a 40-person fintech; mentors two QSTP interns.' },
      { id: 4, name: 'Omar Al-Thani', initials: 'OT', tile: INK_DEEP,
        role: 'Full-stack Engineer, 1 yr', cohort: 'Cohort ’25',
        avail: 'Not looking', availKey: 'closed', skills: ['React', 'TypeScript', 'Node'],
        note: 'Just started at a host startup — happy to take referral intros for 2026.' },
      { id: 5, name: 'Maryam Hassan', initials: 'MH', tile: TEAL_DEEP,
        role: 'Data Analyst, 2 yrs', cohort: 'Cohort ’24',
        avail: 'Available in 30 days', availKey: 'soon', skills: ['SQL', 'Python', 'dbt', 'Looker'],
        note: 'Owns the growth dashboard at an e-commerce incubatee. Wants more modelling work.' }
    ],

    liveOffers: [
      { title: 'Senior Backend Engineer', meta: 'Doha · Hybrid · posted 2d ago', applicants: 14 },
      { title: 'Product Analyst (Intern)', meta: 'Doha · On-site · posted 9d ago', applicants: 31 },
      { title: 'DevOps Engineer', meta: 'Remote · posted 3w ago', applicants: 8 }
    ]
  };

  /* Filter vocabularies — single source for the chip rows and the predicates. */
  QB.filters = {
    alumniTabs: ['Home', 'Job offers', 'Ideastorm', 'Referrals'],
    roles: ['All roles', 'Engineering', 'Design', 'Data', 'Growth'],
    places: ['Anywhere', 'Doha', 'Remote'],
    stages: ['All stages', 'Concept', 'Prototype', 'Pre-seed'],
    ranges: ['90 days', '12 months', 'All time'],
    adminTabs: ['Events', 'Spotlight', 'Ideastorm'],
    availability: ['Any', 'Open now', 'Within 30 days'],
    skills: ['Any skill', 'Go', 'Python', 'React', 'Figma', 'SQL'],
    offerTypes: ['Full-time', 'Internship', 'Co-founder']
  };

  /* Availability chip tone, and the predicate the sidebar filter runs. */
  QB.availTone = { open: 'lime', soon: 'teal', closed: 'mute' };

  QB.matchesAvailability = function (person, filter) {
    if (filter === 'Open now') return person.availKey === 'open';
    if (filter === 'Within 30 days') return person.availKey !== 'closed';
    return true;
  };
})(window.QB = window.QB || {});
