# QSTP Beyond — community dashboards

Three dashboards for the QSTP Beyond alumni community, implemented from the
Claude Design prototype in `QSTP Beyond.dc.html`:

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
src/data-insights.js           dummy analytics for the management Insights views
src/data-directory.js          dummy people and organization records for the directories
src/data-survey.js             the status survey: questions, branching and validity rules
src/ui.js                      html`` template tag, shared partials, donut + line chart
src/screens/*.js               one render function per screen; alumni-*.js,
                               insights-*.js and mgmt-*.js are their sub-views
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

The card therefore has three states — asking, confirmed as-is (keeps
`viewer.currentStatus`), and answered (reads back `QB.surveySummary`) — and
`state.statusSource` says which of the two confirmations happened, so the card
never claims answers it was never given.

Nothing is persisted — reloading the page restores the gate. The answers live
in `state.survey.answers` and go nowhere else yet.

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
- **Management Insights** — every chart, table and tile reads dummy fixtures
  from `src/data-insights.js` (internally consistent: funnels multiply out,
  splits sum to 100%, counts reconcile). Of the global-filter selects in the
  sidebar only **Time range** is wired (it drives the "Showing …" label);
  the rest are presentational and filter nothing. Export all insights, Send
  nudge, Nudge and Re-engage are inert.

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
