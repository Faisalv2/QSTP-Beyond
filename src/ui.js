/* Rendering primitives: an escaping template tag, a few shared partials, and
   the two chart generators. No dependencies, no build step. */
(function (QB) {
  'use strict';

  /* ── html`` ───────────────────────────────────────────────────────
     Interpolated values are escaped unless they are themselves the result
     of html`` (or wrapped in raw()). Arrays are joined; null/false vanish. */

  function Markup(value) { this.value = value; }
  Markup.prototype.toString = function () { return this.value; };

  var ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (c) { return ESCAPES[c]; });
  }

  function interpolate(value) {
    if (value == null || value === false || value === true) return '';
    if (Array.isArray(value)) return value.map(interpolate).join('');
    if (value instanceof Markup) return value.value;
    return escape(value);
  }

  function html(strings) {
    var out = strings[0];
    for (var i = 1; i < strings.length; i++) {
      out += interpolate(arguments[i]) + strings[i];
    }
    return new Markup(out);
  }

  function raw(value) { return new Markup(String(value)); }

  /* Class list built from a base plus conditional entries. */
  function cx() {
    var parts = [];
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (!arg) continue;
      if (typeof arg === 'string') { parts.push(arg); continue; }
      Object.keys(arg).forEach(function (key) { if (arg[key]) parts.push(key); });
    }
    return parts.join(' ');
  }

  /* ── Shared partials ─────────────────────────────────────────────── */

  var ICONS = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="m20 6-11 11-5-5"/>'
  };

  /* Lucide glyphs, inline, stroked on currentColor. */
  function icon(name, size) {
    return raw(
      '<svg class="icon" viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) +
      '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>'
    );
  }

  /* The four-dot QSTP mark. `tone` decides which dot picks up the ground. */
  function brandDots(tone) {
    return html`<span class="${cx('dots', tone && 'dots--' + tone)}" aria-hidden="true">
      <i class="dots__d dots__d--lime"></i><i class="dots__d dots__d--teal"></i>
      <i class="dots__d dots__d--teal"></i><i class="dots__d dots__d--last"></i>
    </span>`;
  }

  /* A row of single-select buttons. `action` is dispatched with the value; pass
     null for a row that is presentation-only. `variants` is a space-separated
     list of chip-btn modifiers, e.g. "md strong". */
  function chipRow(options, active, action, variants) {
    var modifiers = (variants || '').split(' ').filter(Boolean)
      .map(function (v) { return 'chip-btn--' + v; }).join(' ');

    return html`${options.map(function (label) {
      var on = label === active;
      return html`<button type="button" class="${cx('chip-btn', modifiers, { 'is-active': on })}"
        ${action ? raw('data-act="' + escape(action) + '" data-arg="' + escape(label) + '"') : ''}
        aria-pressed="${String(on)}">${label}</button>`;
    })}`;
  }

  function tag(text, tone) {
    return html`<span class="${cx('chip', 'chip--' + (tone || 'mute'))}">${text}</span>`;
  }

  /* ── Charts ──────────────────────────────────────────────────────── */

  var DONUT = { size: 180, radius: 70, width: 26 };

  /* Stacked ring: each slice is one circle with a dash pattern offset past
     the slices before it, so the geometry follows straight from the data. */
  function donut(slices, centre) {
    var c = DONUT.size / 2;
    var circumference = 2 * Math.PI * DONUT.radius;
    var offset = 0;

    var rings = slices.map(function (slice) {
      var length = (slice.pct / 100) * circumference;
      var ring = html`<circle cx="${c}" cy="${c}" r="${DONUT.radius}" stroke="${slice.color}"
        stroke-dasharray="${length.toFixed(1)} ${(circumference - length).toFixed(1)}"
        stroke-dashoffset="${(-offset).toFixed(1)}"><title>${slice.label} — ${slice.pct}%</title></circle>`;
      offset += length;
      return ring;
    });

    return html`<svg class="donut" viewBox="0 0 ${DONUT.size} ${DONUT.size}" role="img"
      aria-label="Outcome breakdown: ${slices.map(function (s) { return s.label + ' ' + s.pct + '%'; }).join(', ')}">
      <g transform="rotate(-90 ${c} ${c})" fill="none" stroke-width="${DONUT.width}">${rings}</g>
      <text class="donut__value" x="${c}" y="${c - 4}" text-anchor="middle">${centre.value}</text>
      <text class="donut__label" x="${c}" y="${c + 14}" text-anchor="middle">${centre.label}</text>
    </svg>`;
  }

  var PLOT = { w: 520, h: 180, left: 30, right: 510, top: 20, bottom: 160 };

  /* Area + line over an evenly spaced series; every other point is labelled.
     `chart` carries `name` for the aria label and `unit` for the axis ('%'
     unless set — pass '' for plain counts). */
  function lineChart(chart) {
    var series = chart.series;
    var unit = chart.unit == null ? '%' : chart.unit;
    var name = chart.name || 'Trend';
    var step = (PLOT.right - PLOT.left) / (series.length - 1);
    var span = PLOT.bottom - PLOT.top;

    var points = series.map(function (point, i) {
      return {
        label: point.label,
        value: point.value,
        x: PLOT.left + i * step,
        y: PLOT.bottom - (point.value / chart.max) * span
      };
    });

    var path = points.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
    var last = points[points.length - 1];

    var gridlines = [0, 1, 2, 3, 4].map(function (i) {
      var y = PLOT.top + (i * span) / 4;
      return html`<line x1="${PLOT.left}" y1="${y}" x2="${PLOT.right}" y2="${y}"/>`;
    });

    return html`<svg class="plot" viewBox="0 0 ${PLOT.w} ${PLOT.h}" role="img"
      aria-label="${name}, ${series[0].label} to ${last.label}: ${series[0].value}${unit} to ${last.value}${unit}">
      <g class="plot__grid">${gridlines}</g>
      <g class="plot__axis">
        <text x="0" y="${PLOT.top + 4}">${chart.max}${unit}</text>
        <text x="0" y="${PLOT.top + span / 2 + 4}">${Math.round(chart.max / 2)}${unit}</text>
        <text x="0" y="${PLOT.bottom + 4}">0${unit}</text>
        ${points.map(function (p, i) {
          return i % 2 === 0 ? html`<text x="${p.x}" y="${PLOT.bottom + 16}">${p.label}</text>` : '';
        })}
      </g>
      <polygon class="plot__area" points="${path} ${last.x},${PLOT.bottom} ${PLOT.left},${PLOT.bottom}"/>
      <polyline class="plot__line" points="${path}"/>
      <g class="plot__dots">${points.slice(0, -1).map(function (p) {
        return html`<circle cx="${p.x}" cy="${p.y.toFixed(1)}" r="3.5"/>`;
      })}</g>
      <line class="plot__drop" x1="${last.x}" y1="${last.y.toFixed(1)}" x2="${last.x}" y2="${PLOT.bottom}"/>
      <circle class="plot__head" cx="${last.x}" cy="${last.y.toFixed(1)}" r="6"/>
    </svg>`;
  }

  /* ── Small analytics primitives (management Insights) ────────────── */

  /* A compact stat tile — the sub-KPI figures inside a tab. */
  function stat(s) {
    return html`<article class="stat">
      <h3 class="stat__label">${s.label}</h3>
      <p class="stat__row">
        <span class="stat__value">${s.value}</span>
        ${s.delta ? html`<span class="${cx('stat__delta', s.tone && 'stat__delta--' + s.tone)}">${s.delta}</span>` : ''}
      </p>
      ${s.note ? html`<p class="stat__note">${s.note}</p>` : ''}
    </article>`;
  }

  function statsRow(list) {
    return html`<div class="${cx('stats-row', list.length === 3 && 'stats-row--3')}">${list.map(stat)}</div>`;
  }

  /* Horizontal labelled bars. Items: {label, num, display?, color?, extra?};
     widths are relative to opts.max (default: the largest num). */
  function hbars(items, opts) {
    opts = opts || {};
    var max = opts.max || items.reduce(function (m, it) { return Math.max(m, it.num); }, 0);
    return html`<div class="bars">
      ${items.map(function (it) {
        var display = it.display != null ? it.display : it.num;
        return html`<div class="bar">
          <p class="bar__head"><span>${it.label}${it.extra ? html` ${it.extra}` : ''}</span><span class="bar__pct">${display}</span></p>
          <div class="bar__track" role="img" aria-label="${it.label}: ${display}">
            <span class="bar__fill" style="width:${(it.num / max * 100).toFixed(1)}%;background:${it.color || 'var(--color-accent)'}"></span>
          </div>
        </div>`;
      })}
    </div>`;
  }

  /* One horizontal 100% bar split into segments: {label, pct, color}. */
  function stackBar(segs, tall) {
    return html`<div class="${cx('stackbar', tall && 'stackbar--tall')}" role="img"
      aria-label="${segs.map(function (s) { return s.label + ' ' + s.pct + '%'; }).join(', ')}">
      ${segs.map(function (s) {
        return html`<span class="stackbar__seg" style="width:${s.pct}%;background:${s.color}"></span>`;
      })}
    </div>`;
  }

  /* Swatch legend. Items: {label, color, val?} — val is preformatted. */
  function keys(items) {
    return html`<ul class="keys">
      ${items.map(function (k) {
        return html`<li class="key"><span class="key__swatch" style="background:${k.color}"></span>${k.label}${k.val != null ? html` <span class="key__val">${k.val}</span>` : ''}</li>`;
      })}
    </ul>`;
  }

  /* Conversion funnel — widths relative to the first stage's volume. */
  function funnel(stages) {
    var top = stages[0].n;
    return html`<div class="funnel">
      ${stages.map(function (s) {
        return html`<div class="funnel__row">
          <p class="funnel__head">
            <span class="funnel__label">${s.label}</span>
            <span><span class="funnel__val">${s.n.toLocaleString()}</span>${s.note ? html`<span class="funnel__note">${s.note}</span>` : ''}</span>
          </p>
          <div class="funnel__track"><span class="funnel__fill" style="width:${Math.max(2, s.n / top * 100).toFixed(1)}%;background:${s.color}"></span></div>
        </div>`;
      })}
    </div>`;
  }

  /* Small column chart: {name, max, series:[{label, value}]}. */
  function cols(chart) {
    return html`<div class="colchart" role="img"
      aria-label="${chart.name}: ${chart.series.map(function (p) { return p.label + ' ' + p.value; }).join(', ')}">
      ${chart.series.map(function (p) {
        return html`<div class="colchart__col">
          <span class="colchart__val">${p.value}</span>
          <span class="colchart__bar" style="height:${Math.max(3, Math.round(p.value / chart.max * 96))}px"></span>
          <span class="colchart__label">${p.label}</span>
        </div>`;
      })}
    </div>`;
  }

  /* A ruled section label between groups of panels. */
  function zone(label) {
    return html`<div class="zone"><h2 class="zone__label">${label}</h2><span class="zone__rule"></span></div>`;
  }

  /* A numbered strip explaining how a programme works, above the tab's grid.
     `steps` is [{ n, title, text }…]. */
  function howStrip(steps) {
    return html`<ol class="how-strip">
      ${steps.map(function (step) {
        return html`<li class="how-strip__cell">
          <p class="how-strip__n">${step.n}</p>
          <h2 class="how-strip__title">${step.title}</h2>
          <p class="how-strip__text">${step.text}</p>
        </li>`;
      })}
    </ol>`;
  }

  /* A sidebar of single-select dropdowns. `filters` is [[label, options]…],
     or [label, options, field, current] for one that is wired to the store —
     the rest are presentational until the filtering logic lands. */
  function selectRail(label, filters, reset) {
    return html`<section class="panel side-filters" aria-label="${label}">
      <h2 class="eyebrow">${label}</h2>
      ${filters.map(function (f) {
        var id = 'f-' + f[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
        var field = f[2];
        return html`<p class="field">
          <label for="${id}">${f[0]}</label>
          <select class="input input--sm" id="${id}"
                  ${field ? raw('data-field="' + escape(field) + '"') : ''}>
            ${f[1].map(function (opt) {
              return html`<option ${field && opt === f[3] ? raw('selected') : ''}>${opt}</option>`;
            })}
          </select>
        </p>`;
      })}
      ${reset ? html`<button type="button" class="btn btn-ghost btn-flush">${reset}</button>` : ''}
    </section>`;
  }

  /* Key/value pairs down a detail panel. `pairs` is [[key, value]…]. */
  function facts(pairs) {
    return html`<dl class="facts">
      ${pairs.map(function (pair) {
        return html`<div class="fact"><dt class="fact__k">${pair[0]}</dt><dd class="fact__v">${pair[1]}</dd></div>`;
      })}
    </dl>`;
  }

  /* Read-only search field over a directory; the count sits on the right. */
  function searchBar(id, placeholder, count) {
    return html`<div class="search">
      <span class="search__icon">${icon('search', 18)}</span>
      <label class="sr-only" for="${id}">${placeholder}</label>
      <input class="input search__input" id="${id}" type="search" placeholder="${placeholder}">
      <span class="search__count">${count}</span>
    </div>`;
  }

  QB.ui = {
    html: html, raw: raw, escape: escape, cx: cx, Markup: Markup,
    icon: icon, brandDots: brandDots, chipRow: chipRow, tag: tag,
    donut: donut, lineChart: lineChart,
    stat: stat, statsRow: statsRow, hbars: hbars, stackBar: stackBar,
    keys: keys, funnel: funnel, cols: cols, zone: zone, howStrip: howStrip,
    selectRail: selectRail, facts: facts, searchBar: searchBar
  };
})(window.QB = window.QB || {});
