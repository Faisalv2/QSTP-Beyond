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
    'chevron-right': '<path d="m9 18 6-6-6-6"/>'
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
        aria-pressed="${on}">${label}</button>`;
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

  /* Area + line over an evenly spaced series; every other point is labelled. */
  function lineChart(chart) {
    var series = chart.series;
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
      aria-label="Conversion into the QSTP ecosystem, ${series[0].label} to ${last.label}: ${series[0].value}% rising to ${last.value}%">
      <g class="plot__grid">${gridlines}</g>
      <g class="plot__axis">
        <text x="0" y="${PLOT.top + 4}">${chart.max}%</text>
        <text x="0" y="${PLOT.top + span / 2 + 4}">${chart.max / 2}%</text>
        <text x="0" y="${PLOT.bottom + 4}">0%</text>
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

  QB.ui = {
    html: html, raw: raw, escape: escape, cx: cx, Markup: Markup,
    icon: icon, brandDots: brandDots, chipRow: chipRow, tag: tag,
    donut: donut, lineChart: lineChart
  };
})(window.QB = window.QB || {});
