/* Dummy analytics fixtures for the management Insights views. Every figure is
   invented but internally consistent (funnels multiply out, splits sum to
   100%, counts reconcile) so the UI reads true until real data replaces it. */
(function (QB) {
  'use strict';

  var P = QB.palette;

  QB.insights = {

    /* ── KPI strip — always visible above every insights view ─────── */

    kpis: [
      { label: 'Alumni tracked', value: '1,842', delta: '+126', deltaTone: 'up',
        note: 'Across 9 intern cohorts', rule: P.ink },
      { label: 'Fresh status ≤ 6 mo', value: '63%', delta: '+17 pts', deltaTone: 'up',
        note: 'Since referral perks launched', rule: P.teal },
      { label: 'Conversion to ecosystem', value: '7.2%', delta: '+0.8 pt', deltaTone: 'up',
        note: '133 alumni inside QSTP companies', rule: P.lime },
      { label: 'Startups founded', value: '203', delta: '+9 QoQ', deltaTone: 'up',
        note: '87 still active', rule: P.tealPale },
      { label: 'Active this month', value: '612', delta: '−3%', deltaTone: 'down',
        note: '441 alumni · 171 interns', rule: P.tealDeep }
    ],

    /* ── Outcomes ─────────────────────────────────────────────────── */

    /* Current status of all 1,842 — counts sum exactly. */
    outcomes: [
      { label: 'Employed', pct: 46.5, n: 857, color: P.ink },
      { label: 'Founded a company', pct: 8.2, n: 151, color: P.teal },
      { label: 'Incubation pipeline', pct: 7.2, n: 133, color: P.lime },
      { label: 'Freelancing', pct: 6.1, n: 112, color: P.tealMid },
      { label: 'Studying', pct: 17.0, n: 313, color: P.tealPale },
      { label: 'Job-seeking', pct: 9.3, n: 171, color: P.inkDeep },
      { label: 'Unreported', pct: 5.7, n: 105, color: P.grey }
    ],
    outcomeCentre: { value: '68%', label: 'IN WORK' },

    timeToEmployment: {
      value: '4.2 mo', change: '−0.6 mo vs 2024 exits', max: 6,
      byCohort: [
        { label: 'Cohort ’21', num: 5.8, display: '5.8 mo', color: P.tealPale },
        { label: 'Cohort ’22', num: 5.1, display: '5.1 mo', color: P.tealPale },
        { label: 'Cohort ’23', num: 4.6, display: '4.6 mo', color: P.teal },
        { label: 'Cohort ’24', num: 4.0, display: '4.0 mo', color: P.teal },
        { label: 'Cohort ’25', num: 3.1, display: '3.1 mo', color: P.ink }
      ]
    },

    retention: [
      { label: 'QSTP companies', pct: 22, color: P.teal },
      { label: 'Elsewhere in Qatar', pct: 51, color: P.ink },
      { label: 'Abroad', pct: 27, color: P.grey }
    ],
    retentionNote: '73% of working alumni remain in Qatar; 22% never left the park.',

    startups: {
      total: '203', change: '+9 this quarter',
      series: { name: 'Startups founded, cumulative', unit: '', max: 220, series: [
        { label: 'Q4·23', value: 118 }, { label: 'Q1·24', value: 128 },
        { label: 'Q2·24', value: 139 }, { label: 'Q3·24', value: 152 },
        { label: 'Q4·24', value: 164 }, { label: 'Q1·25', value: 178 },
        { label: 'Q2·25', value: 191 }, { label: 'Q3·25', value: 203 }
      ] },
      status: [
        { label: '87 active', tone: 'lime' },
        { label: '64 idea stage', tone: 'mute' },
        { label: '52 joined incubation', tone: 'teal' }
      ]
    },

    progression: {
      key: [
        { label: 'Junior', color: P.tealPale },
        { label: 'Mid-level', color: P.teal },
        { label: 'Senior', color: P.ink },
        { label: 'Founder', color: P.lime }
      ],
      rows: [
        { label: '1 year out', segs: [62, 30, 6, 2] },
        { label: '2 years out', segs: [38, 41, 14, 7] },
        { label: '3+ years out', segs: [16, 38, 30, 16] }
      ]
    },

    employers: [
      { label: 'Snoonu', num: 34, kind: 'Host' },
      { label: 'Meddy', num: 21, kind: 'Host' },
      { label: 'Ogram', num: 18, kind: 'Host' },
      { label: 'QNB', num: 15, kind: 'External' },
      { label: 'Ooredoo', num: 12, kind: 'External' },
      { label: 'Karaz', num: 11, kind: 'Host' }
    ],

    byCohort: [
      { cohort: '’21', employed: '61%', founded: '14%', eco: '9%', unreported: '3%' },
      { cohort: '’22', employed: '58%', founded: '12%', eco: '8%', unreported: '4%' },
      { cohort: '’23', employed: '55%', founded: '9%', eco: '8%', unreported: '5%' },
      { cohort: '’24', employed: '49%', founded: '6%', eco: '7%', unreported: '6%' },
      { cohort: '’25', employed: '31%', founded: '3%', eco: '5%', unreported: '9%' }
    ],

    byField: [
      { label: 'Software', num: 82 }, { label: 'Data', num: 74 },
      { label: 'Design', num: 71 }, { label: 'Biotech', num: 58 },
      { label: 'Energy', num: 52 }
    ],

    /* ── Data health ──────────────────────────────────────────────── */

    freshness: {
      rows: [
        { label: 'Updated ≤ 3 months', num: 41, display: '41%', color: P.ink },
        { label: 'Updated ≤ 6 months', num: 63, display: '63%', color: P.teal },
        { label: 'Updated ≤ 12 months', num: 78, display: '78%', color: P.tealPale }
      ],
      note: '405 alumni (22%) have no update in 12+ months.'
    },

    completeness: {
      segs: [
        { label: 'Full profile', pct: 57, color: P.ink },
        { label: 'Partial', pct: 31, color: P.teal },
        { label: 'Minimal', pct: 12, color: P.grey }
      ],
      note: 'Complete profiles are 2.4× more likely to surface in recruiter search.'
    },

    responseTrend: {
      name: 'Status response rate', headline: '63%', change: '+17 pts YoY', max: 80,
      series: [
        { label: 'Q4·23', value: 34 }, { label: 'Q1·24', value: 38 },
        { label: 'Q2·24', value: 41 }, { label: 'Q3·24', value: 44 },
        { label: 'Q4·24', value: 49 }, { label: 'Q1·25', value: 52 },
        { label: 'Q2·25', value: 58 }, { label: 'Q3·25', value: 63 }
      ]
    },

    staleQueue: [
      { name: 'Omar Farouk', cohort: 'Cohort ’21', last: '16 months ago' },
      { name: 'Huda Salem', cohort: 'Cohort ’22', last: '14 months ago' },
      { name: 'Tariq Nasser', cohort: 'Cohort ’23', last: '13 months ago' },
      { name: 'Lina Aziz', cohort: 'Cohort ’24', last: '12 months ago' }
    ],

    /* ── Engagement ───────────────────────────────────────────────── */

    engagement: {
      active: [
        { label: 'Daily active', value: '118', delta: '+6%', tone: 'up', note: '74 alumni · 44 interns' },
        { label: 'Weekly active', value: '341', delta: '+2%', tone: 'up', note: '228 alumni · 113 interns' },
        { label: 'Monthly active', value: '612', delta: '−3%', tone: 'down', note: '441 alumni · 171 interns' }
      ],
      activity: { name: 'Actions per week', unit: '', max: 700, series: [
        { label: 'Jun 8', value: 420 }, { label: 'Jun 15', value: 480 },
        { label: 'Jun 22', value: 455 }, { label: 'Jun 29', value: 530 },
        { label: 'Jul 6', value: 585 }, { label: 'Jul 13', value: 560 },
        { label: 'Jul 20', value: 610 }, { label: 'Jul 27', value: 648 }
      ] },
      features: [
        { label: 'Job offers', num: 34 }, { label: 'Events', num: 26 },
        { label: 'Ideastorm', num: 19 }, { label: 'Referrals', num: 12 },
        { label: 'Spotlight', num: 9 }
      ],
      cohorts: [
        { label: 'Cohort ’21', num: 22, display: '22%', color: P.tealPale },
        { label: 'Cohort ’22', num: 31, display: '31%', color: P.tealPale },
        { label: 'Cohort ’23', num: 44, display: '44%', color: P.teal },
        { label: 'Cohort ’24', num: 58, display: '58%', color: P.teal },
        { label: 'Cohort ’25', num: 71, display: '71%', color: P.ink }
      ],
      atRisk: [
        { name: 'Ali Mansour', cohort: 'Cohort ’21', last: '61 days' },
        { name: 'Hassan Jaber', cohort: 'Cohort ’22', last: '44 days' },
        { name: 'Reem Saleh', cohort: 'Cohort ’24', last: '38 days' },
        { name: 'Dana Khalil', cohort: 'Cohort ’25', last: '35 days' }
      ]
    },

    /* ── Pipeline: jobs + referrals ───────────────────────────────── */

    pipeline: {
      jobStats: [
        { label: 'Offers posted', value: '47', delta: '+9 QoQ', tone: 'up', note: 'From 12 organizations' },
        { label: 'Applications per offer', value: '11.3', delta: '+1.2', tone: 'up', note: '531 applications total' },
        { label: 'Fill rate', value: '68%', delta: '+5 pts', tone: 'up', note: '32 of 47 offers hired' },
        { label: 'Time to fill', value: '19 days', delta: '−4 days', tone: 'up', note: 'Median, filled offers' }
      ],
      funnel: [
        { label: 'Applications', n: 531, note: '11.3 per offer', color: P.teal },
        { label: 'Interviews', n: 96, note: '18% of applications', color: P.tealPale },
        { label: 'Hires', n: 32, note: '33% of interviews', color: P.lime }
      ],
      offersSeries: { name: 'Offers posted per month', max: 10, series: [
        { label: 'Feb', value: 4 }, { label: 'Mar', value: 6 }, { label: 'Apr', value: 5 },
        { label: 'May', value: 8 }, { label: 'Jun', value: 7 }, { label: 'Jul', value: 9 },
        { label: 'Aug', value: 8 }
      ] },
      skillsKey: [
        { label: 'Demand', color: P.teal },
        { label: 'Alumni who have it', color: P.ink }
      ],
      skillsMax: 80,
      skillsGap: [
        { label: 'Go', demand: 72, supply: 38 },
        { label: 'Kubernetes', demand: 61, supply: 24 },
        { label: 'Python', demand: 58, supply: 66 },
        { label: 'React', demand: 52, supply: 60 },
        { label: 'Arabic UX', demand: 33, supply: 12 },
        { label: 'Figma', demand: 38, supply: 45 }
      ],
      refStats: [
        { label: 'Referrals submitted', value: '84', delta: '+12 QoQ', tone: 'up', note: 'From 41 unique referrers' },
        { label: 'Referral → hire', value: '31%', delta: '+4 pts', tone: 'up', note: '26 hires via referral' },
        { label: 'Perks issued', value: '41', note: 'For confirmed interviews & hires' },
        { label: 'Perks redeemed', value: '27', note: '66% redemption rate' }
      ],
      refTrend: { name: 'Referrals per quarter', max: 20, series: [
        { label: 'Q2·24', value: 9 }, { label: 'Q3·24', value: 11 }, { label: 'Q4·24', value: 14 },
        { label: 'Q1·25', value: 17 }, { label: 'Q2·25', value: 19 }, { label: 'Q3·25', value: 14 }
      ] },
      topReferrers: [
        { name: 'Rashid Tamim', meta: 'Cohort ’20 · 6 referred', val: '3 hires' },
        { name: 'Layla Hassan', meta: 'Cohort ’23 · 5 referred', val: '2 hires' },
        { name: 'Sara Ibrahim', meta: 'Cohort ’21 · 4 referred', val: '2 hires' },
        { name: 'Omar Al-Thani', meta: 'Cohort ’25 · 3 referred', val: '1 hire' }
      ],
      refCompanies: [
        { label: 'Snoonu', num: 9 }, { label: 'Meddy', num: 5 },
        { label: 'Ogram', num: 4 }, { label: 'Fluidic', num: 3 }, { label: 'Karaz', num: 2 }
      ]
    },

    /* ── Community: Ideastorm + spotlight + events ────────────────── */

    community: {
      stats: [
        { label: 'Live ideas', value: '38', delta: '+6 this quarter', tone: 'up', note: 'Across 6 categories' },
        { label: 'Team formation rate', value: '42%', delta: '+3 pts', tone: 'up', note: '89 of 214 ideas ever posted' },
        { label: 'Became real startups', value: '11', note: '5 now in incubation' },
        { label: 'Cross-cohort connections', value: '129', delta: '+18 this quarter', tone: 'up', note: 'Alumni ↔ intern collaborations' }
      ],
      postedSeries: { name: 'Ideas posted per quarter', max: 16, series: [
        { label: 'Q2·24', value: 8 }, { label: 'Q3·24', value: 9 }, { label: 'Q4·24', value: 11 },
        { label: 'Q1·25', value: 12 }, { label: 'Q2·25', value: 14 }, { label: 'Q3·25', value: 10 }
      ] },
      categories: [
        { label: 'AI / ML', num: 11 }, { label: 'Fintech', num: 8 },
        { label: 'Climate', num: 6 }, { label: 'Health', num: 5 },
        { label: 'Logistics', num: 4 }, { label: 'Other', num: 4 }
      ],
      formation: [
        { label: 'Ideas posted', n: 214, note: 'all-time', color: P.ink },
        { label: 'Formed a team', n: 89, note: '42% of ideas', color: P.teal },
        { label: 'Applied to incubation', n: 24, note: '27% of teams', color: P.tealPale },
        { label: 'Founded a company', n: 11, note: '5.1% end to end', color: P.lime }
      ],
      soughtSkills: [
        { label: 'ML engineer', num: 14 }, { label: 'Full-stack', num: 12 },
        { label: 'Growth', num: 9 }, { label: 'Payments', num: 5 }, { label: 'Chem eng', num: 4 }
      ],
      spotlight: {
        views: '+212%', offers: '+64%',
        note: 'Median lift in the four weeks after being featured, across 14 featured alumni.'
      },
      events: [
        { title: 'Alumni Iftar', date: '19 Mar', rsvp: 220, attended: 196, rate: '89%' },
        { title: 'Spring Demo Day', date: '12 May', rsvp: 180, attended: 141, rate: '78%' },
        { title: 'Career Clinic', date: '8 Jun', rsvp: 90, attended: 61, rate: '68%' },
        { title: 'Ideastorm Pitch Night', date: '3 Jul', rsvp: 120, attended: 104, rate: '87%' }
      ],
      eventNote: 'Attendees are 2.3× more likely to update their status within 30 days of an event.'
    },

    /* ── Partners: organization side ──────────────────────────────── */

    partners: {
      stats: [
        { label: 'Organizations onboarded', value: '28', delta: '+4 this quarter', tone: 'up', note: 'Host startups & external' },
        { label: 'Active', value: '19', note: 'Posted or searched ≤ 30 days' },
        { label: 'Dormant', value: '9', note: 'No activity in 60+ days' },
        { label: 'Repeat posting rate', value: '61%', delta: '+7 pts', tone: 'up', note: '17 orgs posted more than once' }
      ],
      searches: [
        { label: '“Go developer”', num: 41 }, { label: '“React”', num: 33 },
        { label: '“Data analyst”', num: 29 }, { label: '“Arabic UX”', num: 18 },
        { label: '“DevOps”', num: 12 }
      ],
      orgTable: [
        { org: 'Snoonu', offers: 6, hires: 4, last: '2 days ago', status: 'Active', tone: 'lime' },
        { org: 'Meddy', offers: 4, hires: 2, last: '1 week ago', status: 'Active', tone: 'lime' },
        { org: 'Fluidic', offers: 2, hires: 1, last: '3 weeks ago', status: 'Active', tone: 'lime' },
        { org: 'Ogram', offers: 3, hires: 1, last: '5 weeks ago', status: 'Quiet', tone: 'mute' },
        { org: 'Karaz', offers: 1, hires: 0, last: '2 months ago', status: 'Dormant', tone: 'mute' }
      ],
      viewed: [
        { name: 'Noor Al-Kuwari', meta: 'Backend Engineer · ’23', val: '112 views' },
        { name: 'Sara Ibrahim', meta: 'Product Designer · ’21', val: '96 views' },
        { name: 'Yousef Kamal', meta: 'ML Engineer · ’22', val: '88 views' },
        { name: 'Maryam Hassan', meta: 'Data Analyst · ’24', val: '71 views' }
      ],
      dormant: [
        { name: 'Karaz', meta: '2 months quiet · 1 offer, 0 hires' },
        { name: 'Qatar FinTech Hub', meta: '3 months quiet · never posted' },
        { name: 'Baladna Digital', meta: '4 months quiet · 2 offers, 1 hire' }
      ]
    }
  };
})(window.QB = window.QB || {});
