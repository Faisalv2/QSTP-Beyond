/* The persistence layer between the seed generators and the screens.

   The two generators (seed-people.js, seed-world.js) are pure functions of an
   rng, so the world they build is reproducible — but only if the rng is the
   same one, pulled in the same order. This file owns that contract: one
   mulberry32 stream from a fixed seed, people first, world second, never
   Math.random. That makes regeneration cheap and boring, which is why a
   corrupt or missing cache is not an error here — it just means we build the
   world again and get the identical bytes back.

   localStorage is a nicety, not a dependency. The smoke harness runs this
   under Node where there is no such global, and a browser can refuse the
   write (private mode, quota); in both cases boot has to carry on with an
   in-memory world rather than throw. */
(function (QB) {
  'use strict';

  var KEY = 'qstpBeyond.seed.v3';
  var VERSION = 3;
  var SEED = 20260731;

  /* The cycle the prototype treats as "now" — the 200 people in it are
     current interns rather than alumni. */
  var CURRENT_CYCLE = 'Summer ’26';

  /* The prototype viewer, Faisal Elbadri, is not a separate fixture — he is
     the first 'Summer ’25' record (id 711, since the two cycles before it sum
     to 710), turned into a fixed identity so the app has one real seeded
     person to write survey answers onto. Overwriting a record inside that
     cycle rather than appending one keeps every cycle count exactly as the
     generator drew it. */
  var VIEWER_ID = 711;

  /* mulberry32: 32 bits of state, one multiply-xor round per draw. Small
     enough to read, and identical across engines because every step stays
     inside Math.imul's defined 32-bit behaviour. */
  function mulberry32(a) {
    return function () {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* Reading the global can itself throw (a browser with storage disabled
     raises SecurityError on access, not just on use), so the probe is
     wrapped rather than left as a bare typeof. */
  function hasStorage() {
    try {
      return typeof localStorage !== 'undefined' && localStorage !== null;
    } catch (e) {
      return false;
    }
  }

  /* ── Generation ───────────────────────────────────────────────────── */

  /* Overwrites the seeded record at VIEWER_ID in place — no push, no splice,
     so the roster stays exactly 1,842 long. This runs between the two
     generators and touches no rng, so it cannot shift a single offer, idea
     or referral drawn afterwards; only this one person's fields change, and
     seed-world.js sees the true employer when it builds Snoonu's roster.
     Skills, avail and tile are left as the generator rolled them — nothing
     about the viewer's copy depends on those, so there is nothing to fix. */
  function applyViewer(people) {
    var person = people[VIEWER_ID - 1];
    if (!person || person.id !== VIEWER_ID) return null;

    /* An alum of the Summer ’25 cycle who converted at the startup that
       hosted him — the outcome the programme exists to produce, and the one
       that gives the profile timeline a completed programme to mark. His
       status is a few months old on purpose: the home card has something
       real to ask about. */
    person.name = 'Faisal Elbadri';
    person.initials = 'FE';
    person.status = 'Employed';
    person.kind = 'alumni';
    person.role = 'Software Engineer';
    person.employer = 'Snoonu';
    person.employerKind = 'Host startup';
    person.startup = null;
    person.stage = null;
    person.incubated = null;
    person.degree = null;
    person.field = null;
    person.lookingFor = [];
    person.location = 'Qatar';
    person.country = null;
    person.fresh = true;
    person.lastUpdate = 'Feb 2026';
    person.email = 'faisal.elbadri.711@alumni.qstp.qa';
    person.progression = [
      { year: 'Oct 2025', title: 'Software Engineer', org: 'Snoonu', level: 'Junior' },
      { year: 'Jun 2025', title: 'Intern', org: 'Snoonu', level: 'Intern' }
    ];

    return person;
  }

  /* One rng for both generators, in this order: seed-world.js draws from the
     stream seed-people.js left off, so splitting them onto two rngs would
     silently change every offer, idea and referral. */
  function generate() {
    var rng = mulberry32(SEED);
    var people = QB.seedPeople(rng);
    var viewer = applyViewer(people);
    var world = QB.seedWorld(rng, people);

    /* Read the cycle list off the roster rather than restating it — the
       generator is the authority on which cycles exist and in what order. */
    var cycles = [];
    people.forEach(function (person) {
      if (cycles.indexOf(person.cycle) === -1) cycles.push(person.cycle);
    });

    return {
      meta: {
        version: VERSION, seed: SEED, cycles: cycles, currentCycle: CURRENT_CYCLE,
        viewerId: viewer ? viewer.id : null
      },
      people: people,
      partners: world.partners,
      offers: world.offers,
      jobs: world.jobs,
      ideas: world.ideas,
      events: world.events,
      referrals: world.referrals,
      spotlight: world.spotlight
    };
  }

  /* ── Cache ────────────────────────────────────────────────────────── */

  /* Anything the cache cannot vouch for — absent, unreadable, not JSON, or
     stamped with a version this build doesn't know — returns null so the
     caller falls through to a regenerate. A stale cache is never worth a
     thrown error when rebuilding costs one function call. */
  function read() {
    if (!hasStorage()) return null;

    var raw;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
    if (!raw) return null;

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return null;
    }

    if (!parsed || !parsed.meta || parsed.meta.version !== VERSION) return null;
    /* A matching version number is a promise about shape, not proof of one:
       a half-written or hand-edited cache can carry the right stamp and still
       be missing the roster the screens read. Anything that cannot answer
       "who is the viewer?" is treated exactly like corrupt JSON — thrown away
       and rebuilt — because the alternative is a screen that throws on every
       render and shows the reader nothing at all. */
    if (!isUsable(parsed)) return null;
    return parsed;
  }

  var COLLECTIONS = ['people', 'partners', 'offers', 'jobs', 'ideas', 'events',
    'referrals', 'spotlight'];

  function isUsable(data) {
    var ok = COLLECTIONS.every(function (key) {
      return Object.prototype.hasOwnProperty.call(data, key) && isArray(data[key]);
    });
    if (!ok || !data.people.length) return false;
    return !!findViewer(data);
  }

  function isArray(v) { return Object.prototype.toString.call(v) === '[object Array]'; }

  /* The one place the viewer is resolved. Falls back to the first person of
     the current cycle when the stored id points at nobody, so a cache written
     by an older build degrades to the wrong-but-present person rather than to
     a crash. */
  function findViewer(data) {
    var people = data.people || [];
    var i;
    for (i = 0; i < people.length; i++) {
      if (people[i].id === data.meta.viewerId) return people[i];
    }
    for (i = 0; i < people.length; i++) {
      if (people[i].cycle === data.meta.currentCycle) return people[i];
    }
    return people[0] || null;
  }

  /* A failed write is a lost cache, not a failed boot. */
  function save(data) {
    if (!hasStorage()) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clear() {
    if (!hasStorage()) return;
    try {
      localStorage.removeItem(KEY);
    } catch (e) { /* nothing to remove, or nowhere to remove it from */ }
  }

  function load() {
    var stored = read();
    if (stored) return stored;

    var fresh = generate();
    save(fresh);
    return fresh;
  }

  /* Anything derived from the store (the analytics memo) is stale the moment
     the data changes; analytics.js loads after this file, so probe at call
     time rather than at parse time. */
  function derivedStale() {
    if (QB.analytics && QB.analytics.invalidate) QB.analytics.invalidate();
  }

  /* Deterministic seed means this hands back a world byte-identical to the
     one it threw away — the point is clearing a cache written by an older
     shape, not shuffling the fixture. */
  function reset() {
    clear();
    var fresh = generate();
    save(fresh);
    QB.store.data = fresh;
    derivedStale();
    return fresh;
  }

  /* The public save: always writes whatever QB.store.data currently is,
     rather than needing every caller to pass it back in. Same
     lost-write-is-not-a-crash contract as the internal `save`, because it
     is the internal `save`. */
  function saveCurrent() {
    derivedStale();
    return save(QB.store.data);
  }

  /* Older seeds are dead weight in a quota that only holds a few megabytes,
     and this one is over a megabyte on its own. */
  function dropSuperseded() {
    if (!hasStorage()) return;
    var v;
    for (v = 1; v < VERSION; v++) {
      try {
        localStorage.removeItem('qstpBeyond.seed.v' + v);
      } catch (e) { /* nothing to reclaim, or nowhere to reclaim it from */ }
    }
  }

  dropSuperseded();

  QB.store = {
    data: load(),
    save: saveCurrent,
    reset: reset,
    /* Screens ask for the viewer through here rather than walking the roster
       themselves, so the fallback above is the only definition of "who". */
    viewer: function () { return findViewer(QB.store.data); }
  };
})(window.QB = window.QB || {});
