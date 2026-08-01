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
})(window.QB = window.QB || {});
