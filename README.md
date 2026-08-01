# QSTP Beyond — community dashboards

Three dashboards for the QSTP Beyond alumni community, implemented from the
Claude Design prototype in `QSTP Beyond.dc.html`:

| Screen | Who it is for |
| --- | --- |
| **Alumni** | A graduate of a QSTP internship — four tabs: Home, Job offers, Ideastorm, Referrals |
| **Management** | QSTP operations — outcomes, conversion, engagement, programme admin |
| **Organization** | A host startup hiring out of the alumni pool |

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
src/ui.js                      html`` template tag, shared partials, donut + line chart
src/screens/*.js               one render function per screen; alumni-*.js are its tabs
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

Tab switching *is* wired, since the tabs are otherwise unreachable.
