/* Dummy directory records for the management Alumni and Partners views.
   People and companies are the same ones that appear elsewhere in the app, so
   the directory cross-references the other screens rather than inventing a
   parallel cast. `fresh` is "status confirmed within 6 months". */
(function (QB) {
  'use strict';

  var P = QB.palette;

  QB.directory = {

    /* ── Alumni & interns ─────────────────────────────────────────── */

    alumni: [
      { id: 1, initials: 'NK', tile: P.ink, name: 'Noor Al-Kuwari', cohort: 'Cohort ’23',
        type: 'Alumni', field: 'Software', location: 'Doha', host: 'Snoonu',
        role: 'Backend Engineer', employer: 'Snoonu', employerKind: 'Host startup',
        status: 'Employed', tone: 'lime', updated: '3 weeks ago', fresh: true, profile: 92,
        skills: ['Go', 'Postgres', 'AWS', 'Docker'],
        note: 'Built the payments service at Snoonu; open to a founding-team seat.',
        progression: [
          { year: 'Mar 2025', title: 'Backend Engineer', org: 'Snoonu', level: 'Mid-level' },
          { year: 'Feb 2024', title: 'Junior Backend Engineer', org: 'Snoonu', level: 'Junior' },
          { year: 'Jun 2023', title: 'Intern', org: 'Snoonu', level: 'Intern' }
        ] },

      { id: 2, initials: 'LH', tile: P.teal, name: 'Layla Hassan', cohort: 'Cohort ’23',
        type: 'Alumni', field: 'Software', location: 'Doha', host: 'Snoonu',
        role: 'Backend Engineer', employer: 'Snoonu', employerKind: 'Host startup',
        status: 'Incubation pipeline', tone: 'teal', updated: '2 days ago', fresh: true, profile: 80,
        skills: ['Go', 'Payments', 'Postgres'],
        note: 'Building Souq Stack alongside her role — two design partners signed.',
        progression: [
          { year: 'Jan 2026', title: 'Founder, Souq Stack', org: 'Ideastorm → incubation', level: 'Founder' },
          { year: 'Sep 2024', title: 'Backend Engineer', org: 'Snoonu', level: 'Mid-level' },
          { year: 'Feb 2024', title: 'Junior Backend Engineer', org: 'Snoonu', level: 'Junior' },
          { year: 'Jun 2023', title: 'Intern', org: 'Snoonu', level: 'Intern' }
        ] },

      { id: 3, initials: 'AK', tile: P.inkDeep, name: 'Aisha Khalifa', cohort: 'Cohort ’22',
        type: 'Alumni', field: 'Energy', location: 'Doha', host: 'Ogram',
        role: 'Co-founder & CEO', employer: 'Fluidic', employerKind: 'Own company',
        status: 'Founded', tone: 'teal', updated: '1 week ago', fresh: true, profile: 96,
        skills: ['IoT', 'Hardware', 'Fundraising'],
        note: 'Raised a QAR 4M pre-seed 18 months after her internship.',
        progression: [
          { year: 'Feb 2024', title: 'Co-founder & CEO', org: 'Fluidic', level: 'Founder' },
          { year: 'Mar 2023', title: 'Product Engineer', org: 'Ogram', level: 'Junior' },
          { year: 'Jun 2022', title: 'Intern', org: 'Ogram', level: 'Intern' }
        ] },

      { id: 4, initials: 'SI', tile: P.tealMid, name: 'Sara Ibrahim', cohort: 'Cohort ’21',
        type: 'Alumni', field: 'Design', location: 'Doha', host: 'Meddy',
        role: 'Head of Design', employer: 'Karaz', employerKind: 'External',
        status: 'Employed', tone: 'lime', updated: '5 weeks ago', fresh: true, profile: 88,
        skills: ['Figma', 'Research', 'Design systems'],
        note: 'Ran the design system for a 40-person fintech; mentors two QSTP interns.',
        progression: [
          { year: 'Apr 2025', title: 'Head of Design', org: 'Karaz', level: 'Senior' },
          { year: 'Aug 2023', title: 'Product Designer', org: 'Karaz', level: 'Mid-level' },
          { year: 'Jul 2022', title: 'Junior Designer', org: 'Meddy', level: 'Junior' },
          { year: 'Jun 2021', title: 'Intern', org: 'Meddy', level: 'Intern' }
        ] },

      { id: 5, initials: 'YK', tile: P.tealDeep, name: 'Yousef Kamal', cohort: 'Cohort ’22',
        type: 'Alumni', field: 'Data', location: 'Doha', host: 'Meddy',
        role: 'ML Engineer', employer: 'Meddy', employerKind: 'Host startup',
        status: 'Employed', tone: 'lime', updated: '2 months ago', fresh: true, profile: 78,
        skills: ['Python', 'PyTorch', 'MLOps'],
        note: 'Arabic NLP research at HBKU, now shipping production models.',
        progression: [
          { year: 'Jan 2026', title: 'ML Engineer', org: 'Meddy', level: 'Mid-level' },
          { year: 'Sep 2023', title: 'ML Research Assistant', org: 'HBKU', level: 'Junior' },
          { year: 'Jun 2022', title: 'Intern', org: 'Meddy', level: 'Intern' }
        ] },

      { id: 6, initials: 'MS', tile: P.tealMid, name: 'Mona Saad', cohort: 'Cohort ’21',
        type: 'Alumni', field: 'Biotech', location: 'Doha', host: 'Baladna Digital',
        role: 'PhD Researcher', employer: 'HBKU', employerKind: 'External',
        status: 'Studying', tone: 'mute', updated: '3 months ago', fresh: true, profile: 71,
        skills: ['Materials', 'Lab ops', 'Research'],
        note: 'Her brine-recovery paper became the basis for GreenLoop.',
        progression: [
          { year: 'Oct 2023', title: 'PhD Researcher, Materials', org: 'HBKU', level: 'Postgraduate' },
          { year: 'Aug 2022', title: 'Research Assistant', org: 'Baladna Digital', level: 'Junior' },
          { year: 'Jun 2021', title: 'Intern', org: 'Baladna Digital', level: 'Intern' }
        ] },

      { id: 7, initials: 'MH', tile: P.ink, name: 'Maryam Hassan', cohort: 'Cohort ’24',
        type: 'Alumni', field: 'Data', location: 'Doha', host: 'Ogram',
        role: 'Data Analyst', employer: 'Ogram', employerKind: 'Host startup',
        status: 'Employed', tone: 'lime', updated: '7 months ago', fresh: false, profile: 61,
        skills: ['SQL', 'Python', 'dbt', 'Looker'],
        note: 'Owns the growth dashboard at Ogram. Wants more modelling work.',
        progression: [
          { year: 'Sep 2024', title: 'Data Analyst', org: 'Ogram', level: 'Junior' },
          { year: 'Jun 2024', title: 'Intern', org: 'Ogram', level: 'Intern' }
        ] },

      { id: 8, initials: 'OT', tile: P.tealDeep, name: 'Omar Al-Thani', cohort: 'Cohort ’25',
        type: 'Alumni', field: 'Software', location: 'Doha', host: 'Snoonu',
        role: 'Full-stack Engineer', employer: 'Snoonu', employerKind: 'Host startup',
        status: 'Employed', tone: 'lime', updated: '2 weeks ago', fresh: true, profile: 74,
        skills: ['React', 'TypeScript', 'Node'],
        note: 'Just started at a host startup — taking referral intros for 2026.',
        progression: [
          { year: 'Feb 2026', title: 'Full-stack Engineer', org: 'Snoonu', level: 'Junior' },
          { year: 'Jun 2025', title: 'Intern', org: 'Snoonu', level: 'Intern' }
        ] },

      { id: 9, initials: 'RS', tile: P.tealMid, name: 'Reem Saleh', cohort: 'Cohort ’24',
        type: 'Alumni', field: 'Software', location: 'Abroad', host: 'Karaz',
        role: 'Software Engineer', employer: 'Careem · Dubai', employerKind: 'External',
        status: 'Employed', tone: 'lime', updated: '14 months ago', fresh: false, profile: 48,
        skills: ['Java', 'Kotlin', 'Android'],
        note: 'Left Qatar in 2025. Status is self-reported and overdue for a check.',
        progression: [
          { year: 'Jan 2025', title: 'Software Engineer', org: 'Careem · Dubai', level: 'Junior' },
          { year: 'Jun 2024', title: 'Intern', org: 'Karaz', level: 'Intern' }
        ] },

      { id: 10, initials: 'TN', tile: P.inkDeep, name: 'Tariq Nasser', cohort: 'Cohort ’23',
        type: 'Alumni', field: 'Energy', location: 'Unknown', host: 'Karaz',
        role: 'Not reported', employer: '—', employerKind: '—',
        status: 'Unreported', tone: 'warn', updated: '13 months ago', fresh: false, profile: 32,
        skills: ['Simulation', 'MATLAB'],
        note: 'No response to three status requests. In the follow-up queue.',
        progression: [
          { year: 'Jun 2023', title: 'Intern', org: 'Karaz', level: 'Intern' }
        ] },

      { id: 11, initials: 'DK', tile: P.teal, name: 'Dana Khalil', cohort: 'Cohort ’25',
        type: 'Current intern', field: 'Software', location: 'Doha', host: 'Fluidic',
        role: 'Software Intern', employer: 'Fluidic', employerKind: 'Incubatee',
        status: 'Current intern', tone: 'teal', updated: '4 days ago', fresh: true, profile: 55,
        skills: ['React', 'Node', 'Figma'],
        note: 'Mid-placement at Fluidic. Referred to a full-stack role by Omar Al-Thani.',
        progression: [
          { year: 'Jun 2026', title: 'Intern', org: 'Fluidic', level: 'Intern' }
        ] },

      { id: 12, initials: 'HS', tile: P.ink, name: 'Hamad Sultan', cohort: 'Cohort ’26',
        type: 'Current intern', field: 'Data', location: 'Doha', host: 'Snoonu',
        role: 'Data Intern', employer: 'Snoonu', employerKind: 'Host startup',
        status: 'Current intern', tone: 'teal', updated: '1 day ago', fresh: true, profile: 44,
        skills: ['SQL', 'Python'],
        note: 'Six weeks into placement. Posted GreenLoop’s data model on Ideastorm.',
        progression: [
          { year: 'Jul 2026', title: 'Intern', org: 'Snoonu', level: 'Intern' }
        ] }
    ],

    alumniFilters: [
      ['User type', ['Interns + alumni', 'Alumni only', 'Current interns']],
      ['Cohort', ['All cohorts', '2026', '2025', '2024', '2023', '2022', '2021']],
      ['Status', ['All statuses', 'Employed', 'Founded', 'Incubation pipeline', 'Studying', 'Current intern', 'Unreported']],
      ['Field', ['All fields', 'Software', 'Data', 'Design', 'Biotech', 'Energy']],
      ['Host startup', ['All hosts', 'Snoonu', 'Meddy', 'Ogram', 'Fluidic', 'Karaz', 'Baladna Digital']],
      ['Location', ['Anywhere', 'Doha', 'Abroad', 'Unknown']],
      ['Status freshness', ['Any', 'Fresh (≤ 6 mo)', 'Stale (6 mo+)']]
    ],

    /* ── Partner organizations ────────────────────────────────────── */

    partners: [
      { id: 1, initials: 'SN', logoBg: P.ink, name: 'Snoonu', kind: 'Host startup',
        sector: 'Q-commerce', size: '240 staff', joined: 'Feb 2021', location: 'Doha',
        status: 'Active', tone: 'lime', lastActive: '2 days ago',
        contact: 'Mariam Al-Ansari · Talent Lead', email: 'talent@snoonu.qa',
        note: 'Longest-running host. Takes 4–6 interns a cycle and converts most of them.',
        stats: { offers: 6, hires: 4, alumni: 34 },
        offers: [
          { title: 'Senior Backend Engineer', meta: 'Full-time · Doha · 2 days ago', applicants: 14, status: 'Open', tone: 'lime' },
          { title: 'Product Analyst', meta: 'Internship · Doha · 9 days ago', applicants: 31, status: 'Open', tone: 'lime' },
          { title: 'DevOps Engineer', meta: 'Full-time · Remote · 3 weeks ago', applicants: 8, status: 'Open', tone: 'lime' },
          { title: 'Data Scientist', meta: 'Full-time · Doha · 2 months ago', applicants: 22, status: 'Filled', tone: 'teal' }
        ],
        people: [1, 2, 8, 12] },

      { id: 2, initials: 'MD', logoBg: P.tealMid, name: 'Meddy', kind: 'Host startup',
        sector: 'Health-tech', size: '120 staff', joined: 'Jun 2021', location: 'Doha',
        status: 'Active', tone: 'lime', lastActive: '1 week ago',
        contact: 'Khalid Rahman · Head of People', email: 'people@meddy.qa',
        note: 'Strong design and ML placements. Asks for Arabic-UX capable designers.',
        stats: { offers: 4, hires: 2, alumni: 21 },
        offers: [
          { title: 'ML Engineer', meta: 'Full-time · Doha · 1 week ago', applicants: 19, status: 'Open', tone: 'lime' },
          { title: 'Product Designer', meta: 'Full-time · Remote · 4 days ago', applicants: 11, status: 'Open', tone: 'lime' },
          { title: 'Backend Intern', meta: 'Internship · Doha · 6 weeks ago', applicants: 27, status: 'Filled', tone: 'teal' }
        ],
        people: [5, 4] },

      { id: 3, initials: 'FL', logoBg: P.teal, name: 'Fluidic', kind: 'Incubatee',
        sector: 'Deep tech · IoT', size: '14 staff', joined: 'Mar 2024', location: 'Doha',
        status: 'Active', tone: 'lime', lastActive: 'today',
        contact: 'Aisha Khalifa · Co-founder', email: 'aisha@fluidic.qa',
        note: 'Founded by a QSTP alum (Cohort ’22) and now hosting interns itself.',
        stats: { offers: 2, hires: 1, alumni: 3 },
        offers: [
          { title: 'Founding Engineer', meta: 'Equity + salary · Doha · today', applicants: 6, status: 'Open', tone: 'lime' },
          { title: 'Full-stack Engineer', meta: 'Full-time · Doha · 2 weeks ago', applicants: 9, status: 'Open', tone: 'lime' }
        ],
        people: [3, 11] },

      { id: 4, initials: 'OG', logoBg: P.inkDeep, name: 'Ogram', kind: 'Host startup',
        sector: 'Workforce marketplace', size: '90 staff', joined: 'Sep 2021', location: 'Doha',
        status: 'Quiet', tone: 'mute', lastActive: '5 weeks ago',
        contact: 'Sami Haddad · Engineering Manager', email: 'sami@ogram.co',
        note: 'Posting has slowed since Q1. Worth a call before the winter cycle.',
        stats: { offers: 3, hires: 1, alumni: 18 },
        offers: [
          { title: 'Data Scientist', meta: 'Full-time · Doha · 5 weeks ago', applicants: 22, status: 'Open', tone: 'lime' },
          { title: 'Growth Analyst', meta: 'Full-time · Doha · 3 months ago', applicants: 14, status: 'Closed', tone: 'mute' }
        ],
        people: [7, 6] },

      { id: 5, initials: 'KZ', logoBg: P.tealDeep, name: 'Karaz', kind: 'External',
        sector: 'Consumer apps', size: '60 staff', joined: 'Jan 2023', location: 'Remote · Doha 1w/mo',
        status: 'Dormant', tone: 'mute', lastActive: '2 months ago',
        contact: 'Hind Al-Marri · Recruiter', email: 'hiring@karaz.app',
        note: 'One offer, no hires. Hosted two interns in 2023 and 2024 but has not returned.',
        stats: { offers: 1, hires: 0, alumni: 11 },
        offers: [
          { title: 'Growth Lead, MENA', meta: 'Full-time · Remote · 2 months ago', applicants: 5, status: 'Expired', tone: 'warn' }
        ],
        people: [4, 9, 10] },

      { id: 6, initials: 'BD', logoBg: P.tealMid, name: 'Baladna Digital', kind: 'External',
        sector: 'Agri-tech', size: '45 staff', joined: 'May 2022', location: 'Al Khor',
        status: 'Dormant', tone: 'mute', lastActive: '4 months ago',
        contact: 'Faisal Obaid · CTO', email: 'faisal@baladna.digital',
        note: 'Took biotech placements in 2021–22. No posting since the spring cycle.',
        stats: { offers: 2, hires: 1, alumni: 6 },
        offers: [
          { title: 'IoT Engineer', meta: 'Full-time · Al Khor · 4 months ago', applicants: 7, status: 'Expired', tone: 'warn' }
        ],
        people: [6] },

      { id: 7, initials: 'QF', logoBg: P.ink, name: 'Qatar FinTech Hub', kind: 'External',
        sector: 'Fintech accelerator', size: '30 staff', joined: 'Nov 2025', location: 'Doha',
        status: 'Dormant', tone: 'mute', lastActive: 'never posted',
        contact: 'Noura Sultan · Programme Manager', email: 'noura@qfth.qa',
        note: 'Onboarded nine months ago and has never posted. Needs an activation call.',
        stats: { offers: 0, hires: 0, alumni: 0 },
        offers: [],
        people: [] }
    ],

    partnerFilters: [
      ['Type', ['All types', 'Host startup', 'Incubatee', 'External']],
      ['Sector', ['All sectors', 'Q-commerce', 'Health-tech', 'Deep tech · IoT', 'Workforce marketplace', 'Consumer apps', 'Agri-tech', 'Fintech accelerator']],
      ['Activity', ['Any activity', 'Active', 'Quiet', 'Dormant']],
      ['Open offers', ['Any', 'Has open offers', 'No open offers']],
      ['Joined', ['Any time', 'Last 12 months', '1–3 years ago', '3+ years ago']]
    ]
  };
})(window.QB = window.QB || {});
