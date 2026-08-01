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
      name: 'Faisal Elbadri',
      initials: 'FE',
      meta: 'Alumni · Summer ’25',
      profileComplete: 80,
      today: 'Friday, 31 July'
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
    matchNote: 'Software Engineer at Snoonu · Summer ’25 · Doha. Add Terraform and Arabic UX to reach four more roles.',

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
      { n: '01', title: 'Express interest',
        text: 'The owner sees your profile and your skills, and nothing else, until you both agree.' },
      { n: '02', title: 'Meet properly',
        text: 'If it’s mutual, QSTP opens a shared channel and books a 30-minute intro slot for you.' },
      { n: '03', title: 'Take it further',
        text: 'Teams of three or more can apply to the incubation pipeline directly from here.' }
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

    opsViewer: { name: 'Dana Al-Mansouri', initials: 'DM', meta: 'Programme operations' },

    trackedAlumni: 1842,

    adminEvents: [
      { title: 'Founders’ Breakfast', date: '4 Aug 2026', reg: 62, cap: 80, status: 'Live', tone: 'lime' },
      { title: 'Ideastorm Pitch Night', date: '11 Aug 2026', reg: 108, cap: 120, status: 'Live', tone: 'lime' },
      { title: 'Alumni × Startups Hiring Fair', date: '19 Aug 2026', reg: 241, cap: 400, status: 'Live', tone: 'lime' },
      { title: 'Deep-Tech Grant Clinic', date: '2 Sep 2026', reg: 0, cap: 60, status: 'Draft', tone: 'mute' },
      { title: 'Winter Internship Kick-off', date: '14 Sep 2026', reg: 0, cap: 150, status: 'Draft', tone: 'mute' }
    ],

    /* Ideas publish straight to Ideastorm — there is no approval gate. This is
       the oversight list: what is live, how it is moving, what to do with it. */
    ideaAdmin: [
      { title: 'Souq Stack', stage: 'Pre-seed', tone: 'teal',
        meta: '9 members · forming · active today',
        note: 'Checkout and settlement rails for small GCC merchants. Two design partners signed; asking for a co-founder introduction and a legal-structure session.' },
      { title: 'GreenLoop', stage: 'Prototype', tone: 'lime',
        meta: '6 members · active · active 2 days ago',
        note: 'Turning desalination brine into industrial minerals. Asking for extended bench time at the materials lab — candidate for the incubation pipeline this quarter.' },
      { title: 'CampusCoin', stage: 'Concept', tone: 'mute', reports: '2 reports',
        meta: '3 members · stalled · no activity in 41 days',
        note: 'Token-based campus rewards. Two alumni reported unclear token claims and the team has not responded — recommend archive.' }
    ],

    /* Referrals reach programme staff before the employer: confirm the alum,
       get their consent, then pass it on and track the outcome. */
    referralAdmin: [
      { alum: 'Dana Khalil', referrer: 'Omar Al-Thani', dest: 'Fluidic · Full-stack Engineer',
        date: '24 Jul 2026', status: 'Needs verification', tone: 'warn', action: 'Verify alum' },
      { alum: 'Reem Saleh', referrer: 'Sara Ibrahim', dest: 'Ogram · Data Analyst',
        date: '18 Jul 2026', status: 'Awaiting consent', tone: 'mute', action: 'Chase consent' },
      { alum: 'Yousef Kamal', referrer: 'Layla Hassan', dest: 'Meddy · ML Engineer',
        date: '2 Jul 2026', status: 'With employer', tone: 'teal', action: 'View' },
      { alum: 'Noor Al-Kuwari', referrer: 'Rashid Tamim', dest: 'Snoonu · Backend Engineer',
        date: '12 Jun 2026', status: 'Hired', tone: 'lime', action: 'View' }
    ],

    /* ── Organization ─────────────────────────────────────────────── */

    org: { name: 'Snoonu', initials: 'SN', kind: 'Host startup · QSTP Beyond', recruiter: 'MA' },
    pool: { open: 412, soon: 96 },

    talent: [
      { id: 1, name: 'Noor Al-Kuwari', initials: 'NK', tile: INK,
        role: 'Backend Engineer, 2 yrs', cohort: 'Cohort ’23',
        avail: 'Open to offers', availKey: 'open', skills: ['Go', 'Postgres', 'AWS', 'Docker'],
        spotlight: 'Featured week 31',
        note: 'Built the payments service at a QSTP incubatee; wants a founding-team seat next.' },
      { id: 2, name: 'Yousef Kamal', initials: 'YK', tile: TEAL,
        role: 'ML Engineer, 3 yrs', cohort: 'Cohort ’22',
        avail: 'Available in 30 days', availKey: 'soon', skills: ['Python', 'PyTorch', 'MLOps'],
        note: 'Arabic NLP research at HBKU, now shipping production models.' },
      { id: 3, name: 'Sara Ibrahim', initials: 'SI', tile: TEAL_MID,
        role: 'Product Designer, 4 yrs', cohort: 'Cohort ’21',
        avail: 'Open to offers', availKey: 'open', skills: ['Figma', 'Research', 'Design systems'],
        spotlight: 'Featured in July',
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

    /* The org's own offers. `people` references directory ids with a per-offer
       match score; offers published from the UI get the same shape. */
    liveOffers: [
      { id: 1, title: 'Senior Backend Engineer', type: 'Full-time', location: 'Doha · Hybrid',
        pay: 'QAR 28–34k', posted: '2 days ago', status: 'Open', tone: 'lime',
        skills: 'Go, Postgres, Kubernetes',
        funnel: { applied: 14, shortlisted: 6, interviewed: 3, hired: 0 },
        people: [{ id: 1, match: '94%' }, { id: 2, match: '88%' }, { id: 8, match: '72%' }] },

      { id: 2, title: 'Product Analyst (Intern)', type: 'Internship', location: 'Doha · On-site',
        pay: 'QAR 8–10k', posted: '9 days ago', status: 'Open', tone: 'lime',
        skills: 'SQL, Excel, Looker',
        funnel: { applied: 31, shortlisted: 9, interviewed: 4, hired: 0 },
        people: [{ id: 12, match: '81%' }, { id: 7, match: '76%' }, { id: 11, match: '64%' }] },

      { id: 3, title: 'DevOps Engineer', type: 'Full-time', location: 'Remote',
        pay: 'QAR 24–29k', posted: '3 weeks ago', status: 'Open', tone: 'lime',
        skills: 'Kubernetes, Terraform, AWS',
        funnel: { applied: 8, shortlisted: 3, interviewed: 1, hired: 0 },
        people: [{ id: 8, match: '69%' }, { id: 1, match: '61%' }] },

      { id: 4, title: 'Data Scientist', type: 'Full-time', location: 'Doha · Hybrid',
        pay: 'QAR 26–31k', posted: '2 months ago', status: 'Filled', tone: 'teal',
        skills: 'Python, Forecasting, dbt',
        funnel: { applied: 22, shortlisted: 7, interviewed: 4, hired: 1 },
        people: [{ id: 7, match: '91%' }, { id: 5, match: '84%' }] },

      { id: 5, title: 'Mobile Engineer (iOS)', type: 'Full-time', location: 'Doha · Hybrid',
        pay: 'QAR 25–30k', posted: '5 weeks ago', status: 'Closed', tone: 'mute',
        skills: 'Swift, iOS, REST',
        funnel: { applied: 11, shortlisted: 4, interviewed: 2, hired: 1 },
        people: [{ id: 9, match: '88%' }, { id: 8, match: '70%' }] },

      { id: 6, title: 'Growth Marketer', type: 'Full-time', location: 'Doha · On-site',
        pay: 'QAR 18–23k', posted: '3 months ago', status: 'Closed', tone: 'mute',
        skills: 'Lifecycle, Paid social',
        funnel: { applied: 9, shortlisted: 2, interviewed: 0, hired: 0 },
        people: [{ id: 4, match: '58%' }] }
    ]
  };

  /* Filter vocabularies — single source for the chip rows and the predicates. */
  QB.filters = {
    alumniTabs: ['Home', 'Job offers', 'Ideastorm', 'Referrals'],
    roles: ['All roles', 'Engineering', 'Design', 'Data', 'Growth'],
    places: ['Anywhere', 'Doha', 'Remote'],
    stages: ['All stages', 'Concept', 'Prototype', 'Pre-seed'],
    ranges: ['90 days', '12 months', 'All time'],
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
