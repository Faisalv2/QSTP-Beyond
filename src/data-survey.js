/* The status-update survey: its questions, its vocabularies, and the rules
   that decide which branch an answer opens. Everything the dialog needs to
   know about shape lives here; alumni-survey.js only draws it. */
(function (QB) {
  'use strict';

  /* Companies the autocomplete suggests. QSTP host startups are pinned to the
     top of the list and labelled, because they are the answer we most want to
     read back cleanly rather than as free text. */
  var HOSTS = ['Snoonu', 'Meddy', 'Ogram', 'Fluidic', 'Karaz', 'Baladna Digital'];

  var OTHERS = [
    'QNB', 'Ooredoo', 'Qatar Airways', 'Qatar FinTech Hub', 'Hamad Bin Khalifa University',
    'Qatar Foundation', 'Vodafone Qatar', 'Aramco Digital', 'Careem', 'Talabat',
    'Microsoft', 'Google', 'Amazon Web Services', 'Deloitte', 'Accenture'
  ];

  QB.surveyData = {
    /* `branch` names the follow-up block a status opens — null means the
       survey goes straight from the core questions to the closing ones. */
    statuses: [
      { id: 'Employed', emoji: '💼', label: 'Employed', branch: 'employed' },
      { id: 'Founder', emoji: '🚀', label: 'Founder / building a startup', branch: 'founder' },
      { id: 'Studying', emoji: '🎓', label: 'Studying', branch: 'studying' },
      { id: 'Looking', emoji: '🔍', label: 'Looking for opportunities', branch: 'looking' },
      { id: 'Freelancing', emoji: '💻', label: 'Freelancing', branch: null },
      { id: 'Break', emoji: '🏝️', label: 'Taking a break / other', branch: null }
    ],

    locations: ['Qatar', 'GCC', 'Elsewhere'],

    countries: [
      'United Kingdom', 'United States', 'Canada', 'Germany', 'France',
      'Netherlands', 'Türkiye', 'Egypt', 'Jordan', 'Lebanon', 'Tunisia',
      'Morocco', 'India', 'Pakistan', 'Malaysia', 'Singapore', 'Australia',
      'Somewhere else'
    ],

    hosts: HOSTS,
    companies: HOSTS.concat(OTHERS),

    roles: [
      'Software Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full-stack Engineer',
      'Mobile Engineer', 'DevOps Engineer', 'Data Analyst', 'Data Scientist',
      'ML Engineer', 'Product Manager', 'Product Designer', 'UX Researcher',
      'Business Analyst', 'Growth Marketer', 'Mechanical Engineer',
      'Biomedical Engineer', 'Research Assistant'
    ],

    seniority: ['Intern/trainee', 'Junior', 'Mid', 'Senior', 'Lead/Manager'],

    stages: ['Idea stage', 'Building MVP', 'Launched', 'Generating revenue'],

    incubators: ['QSTP / Qatar Foundation program', 'Other incubator', 'Not yet'],

    degrees: ['Bachelor’s', 'Master’s', 'PhD', 'Other'],

    fields: [
      'Computer Science', 'Software Engineering', 'Data Science',
      'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering',
      'Materials Science', 'Biomedical Sciences', 'Environmental Science',
      'Business Administration', 'Design', 'Public Policy'
    ],

    lookingFor: ['Full-time', 'Part-time', 'Internship', 'Co-founder / startup team'],

    skills: [
      'Go', 'Python', 'React', 'TypeScript', 'SQL', 'Figma', 'Machine learning',
      'Data analysis', 'Product management', 'UX research', 'DevOps', 'Mobile',
      'Cloud / AWS', 'Growth marketing', 'Hardware / IoT', 'Research writing'
    ],
    maxSkills: 5,

    wins: ['Promotion', 'New job', 'Launched a product', 'Raised funding',
      'Published/won something', 'Nothing new'],

    help: ['Finding a job', 'Finding co-founders', 'Mentorship', 'Nothing, all good'],

    /* Picking one of these clears the rest of its group, and vice versa —
       "nothing new" and "three things happened" cannot both be true. */
    exclusive: { wins: 'Nothing new', help: 'Nothing, all good' },

    /* Tabs that stay shut until the status has been confirmed this session. */
    gatedTabs: ['Job offers', 'Ideastorm', 'Referrals'],

    /* Why each gated tab needs a current status — shown in the dialog. */
    gateReason: {
      'Job offers': 'Employers only see alumni whose status is current, so offers are matched against what you tell us here.',
      'Ideastorm': 'Teams form around what you are doing now — your status is what founders see when you express interest.',
      'Referrals': 'A referral carries your current role with it, so it has to be right before it reaches an employer.'
    }
  };

  var byId = {};
  QB.surveyData.statuses.forEach(function (s) { byId[s.id] = s; });

  /* Blank answers — also the shape the rest of the app can rely on. */
  QB.blankAnswers = function () {
    return {
      status: '', location: '', country: '',
      company: '', role: '', seniority: '',
      startup: '', stage: '', incubator: '', intro: '', ideastorm: '',
      degree: '', field: '',
      lookingFor: [], skills: [],
      referring: '', wins: [], help: []
    };
  };

  QB.statusById = function (id) { return byId[id] || null; };

  /* Which follow-up block the current answers open, if any. */
  QB.surveyBranch = function (answers) {
    var status = byId[answers.status];
    return status ? status.branch : null;
  };

  /* The steps this respondent will actually walk through. */
  QB.surveySteps = function (answers) {
    var steps = ['core'];
    if (QB.surveyBranch(answers)) steps.push('branch');
    steps.push('closing');
    return steps;
  };

  /* Whether a step has enough to move on. The closing questions are all
     optional, so that step is always ready. */
  QB.surveyReady = function (step, answers) {
    var filled = function (v) { return !!String(v).trim(); };
    if (step === 'core') return filled(answers.status) && filled(answers.location);
    if (step !== 'branch') return true;

    switch (QB.surveyBranch(answers)) {
      case 'employed':
        return filled(answers.company) && filled(answers.role) && filled(answers.seniority);
      case 'founder':
        return filled(answers.startup) && filled(answers.stage) &&
          filled(answers.incubator) && filled(answers.ideastorm);
      case 'studying':
        return filled(answers.degree) && filled(answers.field);
      case 'looking':
        return answers.lookingFor.length > 0;
      default:
        return true;
    }
  };

  /* How the confirmed status reads back on the home card. "Elsewhere" without
     a country says nothing, so it is left off rather than printed. */
  QB.surveySummary = function (a) {
    var where = a.location === 'Elsewhere' ? a.country : a.location;
    var line;
    switch (a.status) {
      case 'Employed':
        line = a.role + ' at ' + a.company;
        break;
      case 'Founder':
        line = 'Founder at ' + a.startup + ' · ' + a.stage;
        break;
      case 'Studying':
        line = a.degree + ' in ' + a.field;
        break;
      case 'Looking':
        line = 'Looking for ' + a.lookingFor.join(', ').toLowerCase();
        break;
      case 'Freelancing':
        line = 'Freelancing';
        break;
      default:
        line = 'Taking a break';
    }
    return where ? line + ' · ' + where : line;
  };

  /* ── Writing a completed survey onto a real person ───────────────────
     QB.applyAnswers mutates (and returns) a store record — this is the
     function surveyNext calls once the last step is saved. It reads
     QB.store.data.partners to decide Host startup vs External, which is
     why it is only ever called after store.js has booted, never at load
     time here. */

  function isHostPartner(name) {
    var partners = (QB.store && QB.store.data && QB.store.data.partners) || [];
    var i;
    for (i = 0; i < partners.length; i++) {
      if (partners[i].name === name) return true;
    }
    return false;
  }

  /* A fresh head is only worth adding if it says something the top of the
     progression doesn't already say — otherwise confirming the same status
     twice in a row would grow the timeline for no reason. */
  function unshiftHead(person, head) {
    if (!head) return;
    var top = person.progression[0];
    var same = top && top.year === head.year && top.title === head.title &&
      top.org === head.org && top.level === head.level;
    if (same) return;
    person.progression.unshift(head);
    if (person.progression.length > 4) person.progression.length = 4;
  }

  QB.applyAnswers = function (person, answers) {
    var head = null;

    /* Common to every branch. */
    person.location = answers.location;
    person.country = answers.location === 'Elsewhere' ? (answers.country || null) : null;
    person.fresh = true;
    person.lastUpdate = 'Jul 2026';

    switch (answers.status) {
      case 'Employed':
        person.status = 'Employed';
        person.role = answers.role;
        person.employer = answers.company;
        person.employerKind = isHostPartner(person.employer) ? 'Host startup' : 'External';
        person.startup = null; person.stage = null; person.incubated = null;
        person.degree = null; person.field = null;
        person.lookingFor = [];
        head = { year: 'Jul 2026', title: person.role, org: person.employer,
          level: answers.seniority || 'Employed' };
        break;

      case 'Founder':
        person.status = 'Founder';
        person.startup = answers.startup;
        person.stage = answers.stage;
        person.incubated = answers.incubator === 'QSTP / Qatar Foundation program';
        person.employer = person.startup;
        person.employerKind = 'Own company';
        person.role = 'Founder';
        person.degree = null; person.field = null;
        person.lookingFor = [];
        head = { year: 'Jul 2026', title: 'Founder', org: person.startup, level: 'Founder' };
        break;

      case 'Studying':
        person.status = 'Studying';
        person.degree = answers.degree;
        person.field = answers.field;
        person.role = null; person.employer = null; person.employerKind = null;
        person.startup = null; person.stage = null; person.incubated = null;
        person.lookingFor = [];
        head = { year: 'Jul 2026', title: person.degree, org: person.field, level: 'Postgraduate' };
        break;

      case 'Looking':
        person.status = 'Looking';
        person.lookingFor = answers.lookingFor.slice();
        if (answers.skills && answers.skills.length) person.skills = answers.skills.slice();
        person.role = null; person.employer = null; person.employerKind = null;
        person.startup = null; person.stage = null; person.incubated = null;
        break;

      case 'Freelancing':
        person.status = 'Freelancing';
        /* 'Intern' is a placement, not a discipline — 'Freelance Intern'
           would be nonsense, so it falls through to the generic label. */
        person.role = person.role && person.role !== 'Intern' ? person.role : 'Freelancer';
        person.employer = null; person.employerKind = null;
        person.startup = null; person.stage = null; person.incubated = null;
        person.degree = null; person.field = null;
        person.lookingFor = [];
        head = { year: 'Jul 2026', org: 'Freelance', level: 'Freelance',
          title: person.role === 'Freelancer' ? 'Freelancer' : 'Freelance ' + person.role };
        break;

      default: /* Break */
        person.status = 'Break';
        person.role = null; person.employer = null; person.employerKind = null;
        person.startup = null; person.stage = null; person.incubated = null;
        person.degree = null; person.field = null;
        person.lookingFor = [];
        break;
    }

    unshiftHead(person, head);
    return person;
  };

  /* The home card's one-line summary of a person's current status — the
     as-is counterpart to QB.surveySummary, which reads a mid-survey answer
     sheet rather than a saved record. */
  QB.statusLine = function (person) {
    switch (person.status) {
      case 'Employed':
        return person.role + ' at ' + person.employer;
      case 'Founder':
        return 'Founder at ' + person.startup + ' · ' + person.stage;
      case 'Studying':
        return person.degree + ' in ' + person.field;
      case 'Looking':
        return 'Looking for ' + person.lookingFor.join(', ').toLowerCase();
      case 'Freelancing':
        return 'Freelancing · ' + person.role;
      case 'Intern':
        return 'Intern at ' + person.employer;
      default:
        return 'Taking a break';
    }
  };
})(window.QB = window.QB || {});
