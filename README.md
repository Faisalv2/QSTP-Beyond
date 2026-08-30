# QSTP Beyond — community dashboards

Three dashboards for the QSTP Beyond alumni community, implemented from the
design prototype in `QSTP Beyond.dc.html`:

| Screen | Who it is for |
| --- | --- |
| **Alumni** | A graduate of a QSTP internship — four tabs: Home, Job offers, Ideastorm, Referrals. The last three are behind a **status survey** (see below) |
| **Management** | QSTP operations — four views: **Insights** (Outcomes / Engagement / Pipeline / Community / Partners analytics, over a persistent KPI strip and global filters), **Alumni** (directory of every intern and alum, with profiles and career progression), **Programmes** (Events / Spotlight / Ideastorm / Referrals) and **Partners** (directory of partner organizations and the offers they posted) |
| **Organization** | A host startup hiring out of the alumni pool — two tabs: **Talent search** (filters, search, and QSTP-featured alumni on a distinct ground) and **My offers** (every offer posted, with its funnel and applicants, and where new offers are written) |

No framework, no build step. Open `index.html`, or serve the folder:

```sh
npx http-server -p 8000 .
```

Switch screens with the prototype bar at the top, or deep-link with
`#alumni`, `#management`, `#organization`.

## Layout

```
index.html                     page shell — links the stylesheets and the scripts
styles/theme.css               Modernist tokens retuned to the QSTP palette + app roles
styles/app.css                 layout and components, built on those tokens
src/data.js                    fixture records and filter vocabularies
src/data-directory.js          dummy people and organization records for the directories
src/data-survey.js             the status survey: questions, branching and validity rules
src/seed-people.js             generator: 1,842 alumni/interns across the 6 cycles
src/seed-world.js              generator: partners, offers, jobs, ideas, events, referrals
src/store.js                   loads the seed from localStorage, or generates and saves it
src/analytics.js               every management Insights figure, computed from the store
src/ui.js                      html`` template tag, shared partials, donut + line chart
src/screens/*.js               one render function per screen; alumni-*.js,
                               insights-*.js and mgmt-*.js are their sub-views
                               (alumni-profile.js owns the profile timeline)
src/app.js                     store, actions, hash router, delegated events
scripts/smoke.js               renders every screen in a stub DOM and asserts the output
_ds/modernist-…/               the Modernist design system (styles.css, readme.md)
QSTP Beyond.dc.html            the design of record, plus its support.js runtime
```

Each screen is a pure function of state that returns markup; `src/app.js` owns
the state, re-renders the whole screen on every change, and restores the caret
afterwards so typing in the talent search is not interrupted. Interactive
elements carry `data-act` (a click action) or `data-field` (an edited value),
and two delegated listeners on the root dispatch them.

Values interpolated into `` html`…` `` are HTML-escaped unless they are
themselves `` html`…` `` — user input reaches the DOM as text, never markup.

## The seeded world

The platform is seeded with a full synthetic community, generated once and
persisted to localStorage under `qstpBeyond.seed.v3` (~1.2 MB). `QB.store.data`
holds it:

- **1,842 people** across six **cycles** (the platform's unit, not cohorts):
  Fall ’24 (348), Winter ’25 (362), Summer ’25 (340), Fall ’25 (330),
  Winter ’26 (262) and Summer ’26 (200) — the current cycle, whose people are
  current interns. Every alum has a status (employed / founder / studying /
  looking / freelancing / break / unreported, weighted to match the outcome
  distribution the Insights views quote), skills, availability, location,
  freshness (~63% current), and a career progression that always starts as an
  intern at a host startup. Ten are spotlighted.
- **8 partner organizations** — the seven from the directory plus **NOOR**, a
  startup founded through the Ideastorm → incubation pipeline and now hosting
  interns itself. Rosters and alumni counts are computed from the real people.
- **20 job offers** (Snoonu's six preserved), the **jobs feed** derived from
  whichever are open, **12 ideas** owned by seeded founders, **10 events**,
  **16 referrals** and an **8-entry spotlight queue** — every person reference
  resolves to a seeded person.

Generation is deterministic (mulberry32, fixed seed), so a wiped or corrupt
cache regenerates byte-identical data; `QB.store.reset()` does it on demand.
Under Node (the smoke harness) there is no localStorage and the store simply
generates in memory.

The management Insights workspace computes from this store (see `analytics.js`);
the other screens still render their small `QB.data` fixtures and get wired in
later milestones. The prototype's alumni viewer is **Faisal Elbadri · Alumni ·
Summer ’25**, now a Software Engineer at the startup that hosted him — and he
is a real record in the roster (`meta.viewerId`, id 711), which is what the
status survey reads and writes. He overwrites a seeded record in place rather
than being appended, so every cycle keeps exactly the intake it was drawn with.

## The profile modal

The identity block in the alumni app bar opens the viewer's profile over a
blurred page. Its centre is the **timeline**: every milestone the platform can
account for, oldest first, always beginning at the QSTP internship that started
the record — roles taken, a company founded, entry into incubation, ideas
posted to Ideastorm, referrals made and received, offers shortlisted for, and
each status confirmation.

Alumni carry one more: **completing the QSTP programme**, dated a term after
the internship and marked with a graduation cap instead of a dot. Current
interns have not reached it, so they do not show it.

Nothing on it is invented. `QB.profileMilestones(person)` reads the seeded
store, which is why a current intern sees two rows and a four-year alum sees a
dozen. Rows run strictly oldest to newest; milestones the store cannot date
(an idea, a spotlight) read as **Current** and settle at the end rather than
being given a date they never had. A milestone dated before the person's own
internship is dropped — inside a QSTP record it cannot have happened.

**Give a career update** hands off to the status survey, and what it saves
comes back as new milestones — so the loop closes visibly. The modal shares its
scrim, blur and nav-above-the-blur behaviour with the survey (`.scrim`,
`.modal-wrap`, `body[data-modal='open']`); it can be dismissed by the close
button, Escape, or clicking the blurred page, and a **gated** survey is never
covered by it, since that is the one dialog that can compel an answer.

## The status survey

Alumni data is only worth anything while it is current, so the alumni screen
asks for it before it hands anything over. **Job offers**, **Ideastorm** and
**Referrals** stay shut until the status has been confirmed this session.

There are two ways to confirm it, both on the home card:

- **Yes, still accurate** keeps the status already on file. One click, no
  survey, tabs open. The card then reports what it kept.
- **Update my status** opens the survey. So does asking for a locked tab —
  that opens the survey instead of the tab.

The page behind the dialog is blurred and frozen, but both nav bars are lifted
above the scrim and stay clickable: someone who does not want to answer right
now can always go somewhere else. A survey opened by choice can be dismissed
(close button or Escape); one opened by a locked tab cannot — the way out is
the nav.

It branches on the first answer:

| Status | Follow-up |
| --- | --- |
| Employed | employer (autocomplete, QSTP host startups pinned), role, seniority |
| Founder | startup, stage, incubator — answering "not yet" offers an intro to QSTP incubation — and whether it started on Ideastorm |
| Studying | degree level, field |
| Looking for opportunities | what for, and up to five skills to match on |
| Freelancing · Taking a break | none — straight to the closing questions |

So it runs to two steps or three, and the step count is only claimed once the
first answer makes it knowable. The closing questions (referrals, recent wins,
what they want help with) are optional for everyone; the core and branch
questions are not, and Continue stays disabled until they are answered. Once
saved, the home card reports the answer back instead of asking about the old
role, and the three tabs open.

The card therefore has three states — asking, confirmed as-is (keeps the
status on the viewer's store record), and answered (reads back
`QB.surveySummary`) — and `state.statusSource` says which of the two
confirmations happened, so the card never claims answers it was never given.

Saving is real: `QB.applyAnswers` writes the answers onto the viewer's record
in the seeded roster (status, employer, skills, location, freshness, a new
progression head) and `QB.store.save()` persists it — the management Insights
figures move accordingly, and the change survives a reload. Only the session
gate is ephemeral: reloading re-locks the three tabs, but the record keeps
what it was told.

## Design system

Colour, type, spacing, radius and elevation all come from
`_ds/modernist-…/styles.css` via `var(--…)`, retuned for QSTP in
`styles/theme.css` (deep-green ink `#094438`, teal accent `#009ca7`, lime
highlight `#bfd42f`, 12px radius). Buttons, inputs, radios, tags, tables and
the elevation utilities are the system's own classes. See
`_ds/modernist-…/readme.md` for the system's rules.

## Tests

```sh
node scripts/smoke.js
```

Renders all three screens (and each admin tab, filter and empty state) in a
stub DOM, then checks the markup is balanced, the charts are geometrically
sound, the filters narrow correctly and user input is escaped.

## Not yet wired

The Job offers, Ideastorm and Referrals tabs are built as UI only — the layout,
copy and resting states are final, but their interactions are not implemented:

- **Job offers** — the role and place chips render `All roles` / `Anywhere`
  selected and do not filter; Apply and Save for later are inert.
- **Ideastorm** — the stage chips do not filter. "Express interest" shows the
  resting state from each idea's `backed` flag in `src/data.js` (GreenLoop and
  Souq Stack), which also drives the "You're backing" rail and the +1 on the
  interested count. The toggle itself does nothing yet.
- **Referrals** — the compose form is uncontrolled and "Send referral" is inert.
- **Management Insights** — the workspace computes: every chart, table and
  tile, the conversion trend included, comes from
  `QB.analytics.compute(filters)` over the seeded store, and all nine selects
  in the sidebar are wired, including Reset filters. **Export all insights**
  builds a print-formatted report of all five sections under the current
  filters and range (cover page, KPI strip, one section per page) and opens
  the browser's print dialog — save as PDF from there; the charts stay
  vector. Send nudge, Nudge and Re-engage are inert.

- **Programmes** — Create event, Add nominee, Ideastorm settings, Export queue
  and the per-row actions (Route to incubation, Feature in spotlight, Archive,
  Verify alum, Chase consent) are all inert. Only the Spotlight feature toggle
  is wired, from the earlier prototype.
- **Alumni & Partners directories** — the search fields and filter dropdowns
  are presentational: every record is always listed, in fixture order. View
  full profile, Request status update, View organization and Contact partner
  are inert.

Tab switching *is* wired (alumni tabs, both management sidebars, the four
management nav items, the two organization tabs), as is picking a row in either
directory or an offer in My offers — the detail panels are unreachable
otherwise. The **status survey** is fully wired end to end: both ways of
confirming, the branching, the validation, the gate on three tabs, and the
read-back on the home card.

The **organization** screen is the exception to all of the above: its search,
availability / skill / spotlight filters, offer-status filter and Publish offer
have been functional since the first build. Offers are written in My offers —
Post an offer opens the form in the right rail in place of the offer detail —
and a published offer leads the list, selects itself and raises the header
count. Only its per-offer and per-candidate actions (Invite to apply, Review
applicants, Edit offer …) are inert.

Ideastorm has **no approval gate** — ideas publish directly. The Programmes →
Ideastorm view is oversight of what is already live: stage, team, activity,
and where to send it next. Reader-submitted reports are still surfaced (a warn
chip) as post-publication signal, not as a pre-publication review.
