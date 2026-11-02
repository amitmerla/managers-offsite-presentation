/* Animated SVG charts for the offsite deck. Plain JS, no libraries. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // R&D Regression known issues, from the "Known Issues & Hotfixes By Root Cause" dashboard.
  var BASELINE_2026 = [
    { q: '2026 Q1', v: 8 },
    { q: '2026 Q2', v: 7 },
    { q: '2026 Q3', v: 12 },
    { q: '2026 Q4', v: 7 }
  ];

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function clear(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }
  function easeBack(t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  function tween(ms, delay, fn, ease) {
    ease = ease || easeOut;
    if (REDUCED) { fn(1); return; }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts + (delay || 0);
      var t = Math.min(1, Math.max(0, (ts - start) / ms));
      fn(ease(t));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function defs(svg) {
    var d = el('defs', {}, svg);
    var g1 = el('linearGradient', { id: svg.id + '-teal', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    el('stop', { offset: '0%', 'stop-color': '#b9fff0' }, g1);
    el('stop', { offset: '45%', 'stop-color': '#7fd1cc' }, g1);
    el('stop', { offset: '100%', 'stop-color': '#7fd1cc', 'stop-opacity': '0.15' }, g1);
    var g2 = el('linearGradient', { id: svg.id + '-fire', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    el('stop', { offset: '0%', 'stop-color': '#ffd60a' }, g2);
    el('stop', { offset: '40%', 'stop-color': '#ff6a2b' }, g2);
    el('stop', { offset: '100%', 'stop-color': '#ff3b30', 'stop-opacity': '0.12' }, g2);
    var g3 = el('linearGradient', { id: svg.id + '-green', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    el('stop', { offset: '0%', 'stop-color': '#b6ffe0' }, g3);
    el('stop', { offset: '40%', 'stop-color': '#00ff9c' }, g3);
    el('stop', { offset: '100%', 'stop-color': '#00ff9c', 'stop-opacity': '0.1' }, g3);
    var f = el('filter', { id: svg.id + '-glow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, d);
    el('feGaussianBlur', { stdDeviation: '8', result: 'b' }, f);
    var m = el('feMerge', {}, f);
    el('feMergeNode', { in: 'b' }, m);
    el('feMergeNode', { in: 'SourceGraphic' }, m);
    return d;
  }

  function yAxis(svg, x0, x1, y0, h, max, step) {
    for (var v = 0; v <= max; v += step) {
      var y = y0 - (v / max) * h;
      el('line', { x1: x0, x2: x1, y1: y, y2: y, class: 'grid' }, svg);
      var t = el('text', { x: x0 - 14, y: y + 4, 'text-anchor': 'end' }, svg);
      t.textContent = v;
    }
  }

  /* ---------- 2026 baseline bars ---------- */
  function baseline(svg, tip) {
    clear(svg); defs(svg);
    var W = 760, x0 = 50, x1 = W - 10, y0 = 330, h = 290, max = 14;
    yAxis(svg, x0, x1, y0, h, max, 2);
    var n = BASELINE_2026.length, slot = (x1 - x0) / n, bw = slot * 0.62;
    var avg = 8.5, ay = y0 - (avg / max) * h;

    BASELINE_2026.forEach(function (d, i) {
      var cx = x0 + slot * i + slot / 2, x = cx - bw / 2, fullH = (d.v / max) * h;
      var isPeak = d.v === 12;
      var g = el('g', { class: 'bar' }, svg);
      g.style.color = isPeak ? '#ff6a2b' : '#7fd1cc';
      var r = el('rect', { x: x, y: y0, width: bw, height: 0, rx: 10, fill: 'url(#' + svg.id + (isPeak ? '-fire' : '-teal') + ')' }, g);
      var cap = el('rect', { x: x, y: y0, width: bw, height: 3, rx: 1.5, fill: isPeak ? '#ffd60a' : '#d6fff8' }, g);
      var val = el('text', { x: cx, y: y0 - 14, 'text-anchor': 'middle', class: 'val' }, svg);
      val.textContent = '0';
      var lab = el('text', { x: cx, y: y0 + 32, 'text-anchor': 'middle' }, svg);
      lab.textContent = d.q;
      if (isPeak) {
        var pk = el('text', { x: cx, y: y0 + 52, 'text-anchor': 'middle', fill: '#ff8a80', style: 'fill:#ff8a80;font-size:11px' }, svg);
        pk.textContent = '▲ PEAK';
      }
      tween(1400, 450 + i * 160, function (t) {
        var hh = fullH * t;
        r.setAttribute('y', y0 - hh); r.setAttribute('height', hh);
        cap.setAttribute('y', y0 - hh);
        val.setAttribute('y', y0 - hh - 14);
        val.textContent = Math.round(d.v * Math.min(1, t));
      }, easeBack);
      g.addEventListener('mousemove', function (e) {
        tip.show(e, d.q + ' · R&D Regression', 'Known Issues: ' + d.v + ' · ' + (d.v > avg ? '+' : '') + Math.round((d.v / avg - 1) * 100) + '% vs 2026 average');
      });
      g.addEventListener('mouseleave', tip.hide);
    });

    var line = el('line', { x1: x0, x2: x0, y1: ay, y2: ay, class: 'avg-line' }, svg);
    var al = el('text', { x: x1, y: ay - 10, 'text-anchor': 'end', class: 'avg-label', opacity: 0 }, svg);
    al.textContent = 'AVG 8.5 / QTR';
    tween(1200, 1500, function (t) { line.setAttribute('x2', x0 + (x1 - x0) * t); al.setAttribute('opacity', t * 0.75); });
  }

  /* ---------- 2027 glide path ---------- */
  var targetState = null;
  function targetValues(pct) {
    var total = 34 * (1 - pct / 100);
    var w = [1.3, 1.1, 0.9, 0.7]; // front-loaded: biggest drop once all three layers are live
    return w.map(function (k) { return total / 4 * k; });
  }
  function target(svg, pct, tip) {
    clear(svg); defs(svg);
    var x0 = 50, x1 = 990, y0 = 350, h = 310, max = 14;
    yAxis(svg, x0, x1, y0, h, max, 2);
    var cols = 8, slot = (x1 - x0) / cols, bw = slot * 0.58;
    var mid = x0 + slot * 4;
    el('line', { x1: mid, x2: mid, y1: y0 - h - 10, y2: y0 + 8, stroke: 'rgba(255,255,255,0.18)', 'stroke-dasharray': '3 6' }, svg);
    var t26 = el('text', { x: x0 + slot * 2, y: 26, 'text-anchor': 'middle', style: 'fill:#ff8a80' }, svg); t26.textContent = '2026 · ACTUAL · 34';
    var t27 = el('text', { x: mid + slot * 2, y: 26, 'text-anchor': 'middle', style: 'fill:#00ff9c' }, svg); t27.textContent = '2027 · TARGET GLIDE PATH';

    var bars27 = [], vals27 = [], pts = [];
    BASELINE_2026.forEach(function (d, i) {
      var cx = x0 + slot * i + slot / 2, hh = (d.v / max) * h;
      var r = el('rect', { x: cx - bw / 2, y: y0, width: bw, height: 0, rx: 8, fill: 'url(#' + svg.id + '-fire)', opacity: 0.55 }, svg);
      var v = el('text', { x: cx, y: y0 - hh - 12, 'text-anchor': 'middle', class: 'val', style: 'font-size:22px;opacity:0.7' }, svg); v.textContent = d.v;
      var l = el('text', { x: cx, y: y0 + 30, 'text-anchor': 'middle' }, svg); l.textContent = d.q.replace('2026 ', "'26 ");
      tween(1000, 300 + i * 90, function (t) { r.setAttribute('y', y0 - hh * t); r.setAttribute('height', hh * t); });
      r.addEventListener('mousemove', function (e) { tip.show(e, d.q + ' · actual', d.v + ' R&D regressions'); });
      r.addEventListener('mouseleave', tip.hide);
      pts.push([cx, y0 - hh]);
    });
    for (var i = 0; i < 4; i++) {
      var cx = mid + slot * i + slot / 2;
      var g = el('g', { class: 'bar' }, svg); g.style.color = '#00ff9c';
      var r = el('rect', { x: cx - bw / 2, y: y0, width: bw, height: 0, rx: 8, fill: 'url(#' + svg.id + '-green)' }, g);
      var v = el('text', { x: cx, y: y0 - 12, 'text-anchor': 'middle', class: 'val', style: 'font-size:22px' }, svg); v.textContent = '0';
      var l = el('text', { x: cx, y: y0 + 30, 'text-anchor': 'middle' }, svg); l.textContent = "'27 Q" + (i + 1);
      (function (idx, grp) {
        grp.addEventListener('mousemove', function (e) {
          tip.show(e, '2027 Q' + (idx + 1) + ' · target', '≤ ' + vals27[idx].textContent + ' R&D regressions (vs ' + BASELINE_2026[idx].v + ' in 2026 Q' + (idx + 1) + ')');
        });
        grp.addEventListener('mouseleave', tip.hide);
      })(i, g);
      bars27.push(r); vals27.push(v);
    }
    var path = el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round', opacity: 0.6 }, svg);
    var dot = el('circle', { r: 7, fill: '#00ff9c', filter: 'url(#' + svg.id + '-glow)' }, svg);
    targetState = { svg: svg, bars: bars27, vals: vals27, pts: pts, path: path, dot: dot, x0: x0, y0: y0, h: h, max: max, slot: slot, mid: mid, cur: [0, 0, 0, 0], anim: 0 };
    setTarget(pct, 900);
  }
  function setTarget(pct, delay) {
    var s = targetState; if (!s) return;
    var to = targetValues(pct), from = s.cur.slice(), token = ++s.anim;
    tween(delay ? 1300 : 650, delay || 0, function (t) {
      if (token !== s.anim) return;
      var all = s.pts.slice();
      for (var i = 0; i < 4; i++) {
        var v = from[i] + (to[i] - from[i]) * t, hh = (v / s.max) * s.h;
        s.bars[i].setAttribute('y', s.y0 - hh); s.bars[i].setAttribute('height', Math.max(0, hh));
        s.vals[i].setAttribute('y', s.y0 - hh - 12);
        s.vals[i].textContent = (Math.round(v * 10) / 10).toFixed(1).replace('.0', '');
        s.cur[i] = v;
        all.push([s.mid + s.slot * i + s.slot / 2, s.y0 - hh]);
      }
      var d = 'M' + all.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L');
      s.path.setAttribute('d', d);
      var last = all[all.length - 1];
      s.dot.setAttribute('cx', last[0]); s.dot.setAttribute('cy', last[1]);
    }, delay ? easeBack : easeOut);
  }

  /* ---------- Gartner S-curve ---------- */
  function sCurve(svg) {
    clear(svg); defs(svg);
    var x0 = 40, x1 = 680, y0 = 320, h = 290;
    var years = [2026, 2027, 2028, 2029, 2030];
    years.forEach(function (y, i) {
      var x = x0 + (x1 - x0) * i / 4;
      el('line', { x1: x, x2: x, y1: y0, y2: y0 - h, class: 'grid', stroke: 'rgba(255,255,255,0.05)' }, svg);
      var t = el('text', { x: x, y: y0 + 26, 'text-anchor': 'middle' }, svg); t.textContent = y;
    });
    el('line', { x1: x0, x2: x1, y1: y0, y2: y0, stroke: 'rgba(255,255,255,0.15)' }, svg);
    function f(u) { var k = 1 / (1 + Math.exp(-9 * (u - 0.55))), a = 1 / (1 + Math.exp(4.95)), b = 1 / (1 + Math.exp(-4.05)); return 5 + 65 * (k - a) / (b - a); }
    var pts = [];
    for (var i = 0; i <= 80; i++) { var u = i / 80; pts.push([x0 + (x1 - x0) * u, y0 - (f(u) / 80) * h]); }
    var d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
    var area = el('path', { d: d + ' L' + x1 + ' ' + y0 + ' L' + x0 + ' ' + y0 + 'Z', fill: 'url(#' + svg.id + '-green)', opacity: 0 }, svg);
    var line = el('path', { d: d, fill: 'none', stroke: '#00ff9c', 'stroke-width': 4, 'stroke-linecap': 'round', filter: 'url(#' + svg.id + '-glow)' }, svg);
    var len = line.getTotalLength();
    line.setAttribute('stroke-dasharray', len); line.setAttribute('stroke-dashoffset', len);
    var dot = el('circle', { r: 9, fill: '#fff', filter: 'url(#' + svg.id + '-glow)' }, svg);
    var lbl = el('text', { 'text-anchor': 'end', style: 'fill:#fff;font-size:14px' }, svg);
    var start = el('circle', { cx: pts[0][0], cy: pts[0][1], r: 6, fill: '#8e8e93' }, svg);
    var st = el('text', { x: pts[0][0] + 12, y: pts[0][1] - 12, style: 'fill:#8e8e93' }, svg); st.textContent = '5%';
    tween(2600, 600, function (t) {
      line.setAttribute('stroke-dashoffset', len * (1 - t));
      var p = line.getPointAtLength(len * t);
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
      lbl.setAttribute('x', p.x - 16); lbl.setAttribute('y', p.y - 14);
      lbl.textContent = Math.round(5 + 65 * t) + '%';
      area.setAttribute('opacity', t * 0.35);
    });
    void start;
  }

  /* ---------- loops (firefighting / self-healing) ---------- */
  var loops = [];
  function loop(wrap) {
    var kind = wrap.getAttribute('data-loop');
    var color = kind === 'fire' ? '#ff6a2b' : '#00ff9c';
    var steps = JSON.parse(wrap.getAttribute('data-steps'));
    var center = wrap.getAttribute('data-center').split('|');
    wrap.style.setProperty('--loop-c', color);
    wrap.innerHTML = '';
    var W = 1380, H = 600, cx = W / 2, cy = H / 2 + 10, rx = 470, ry = 225;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, id: 'loop-' + kind, preserveAspectRatio: 'xMidYMid meet' }, wrap);
    defs(svg);
    var ring = el('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, fill: 'none', stroke: 'rgba(255,255,255,0.1)', 'stroke-width': 2, 'stroke-dasharray': '4 10' }, svg);
    var trail = el('path', { fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', filter: 'url(#loop-' + kind + '-glow)', opacity: 0.9 }, svg);
    var comet = el('circle', { r: 9, fill: '#fff', filter: 'url(#loop-' + kind + '-glow)' }, svg);
    void ring;
    var nodes = steps.map(function (s, i) {
      var a = -Math.PI / 2 + (i / steps.length) * Math.PI * 2;
      var nx = cx + rx * Math.cos(a), ny = cy + ry * Math.sin(a);
      var n = document.createElement('div');
      n.className = 'loop-node' + (kind === 'fire' && i === steps.length - 1 ? ' warn' : '');
      n.style.left = (nx / W * 100) + '%';
      n.style.top = (ny / H * 100) + '%';
      n.innerHTML = '<div class="ln-dot">' + (i + 1) + '</div><h4>' + s[0] + '</h4><p>' + s[1] + '</p>';
      n.setAttribute('data-tip', 'Step ' + (i + 1) + ' · ' + s[0].replace('&amp;', '&') + '|' + s[1]);
      wrap.appendChild(n);
      return { el: n, a: a };
    });
    var c = document.createElement('div');
    c.className = 'loop-center';
    c.innerHTML = '<i class="spin"></i><b>' + center[0] + '</b><span>' + center[1] + '</span>';
    wrap.appendChild(c);
    var state = { wrap: wrap, nodes: nodes, comet: comet, trail: trail, cx: cx, cy: cy, rx: rx, ry: ry, running: false, t0: 0 };
    loops.push(state);
    return state;
  }
  function runLoop(state) {
    state.running = true; state.t0 = performance.now();
    var period = 7000, n = state.nodes.length;
    function frame(now) {
      if (!state.running) return;
      var p = ((now - state.t0) % period) / period;
      var a = -Math.PI / 2 + p * Math.PI * 2;
      state.comet.setAttribute('cx', state.cx + state.rx * Math.cos(a));
      state.comet.setAttribute('cy', state.cy + state.ry * Math.sin(a));
      var d = '', segs = 28, span = 0.55;
      for (var i = 0; i <= segs; i++) {
        var aa = a - span * (1 - i / segs);
        d += (i ? 'L' : 'M') + (state.cx + state.rx * Math.cos(aa)).toFixed(1) + ' ' + (state.cy + state.ry * Math.sin(aa)).toFixed(1);
      }
      state.trail.setAttribute('d', d);
      var active = Math.floor(p * n + 0.12) % n;
      state.nodes.forEach(function (nd, i) { nd.el.classList.toggle('lit', i === active); });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function stopLoops() { loops.forEach(function (l) { l.running = false; }); }

  /* ---------- three-layer shield ---------- */
  var shieldState = null;
  function shield(svg, cards) {
    clear(svg); defs(svg);
    var C = 210, radii = [70, 125, 180];
    var labels = ['03 · E2E', '02 · PRE-RELEASE', '01 · PRODUCTION'];
    var rings = radii.map(function (r, i) {
      var g = el('circle', { cx: C, cy: C, r: r, fill: 'none', stroke: '#00ff9c', 'stroke-width': 2, opacity: 0.25 + i * 0.1, 'stroke-dasharray': i === 1 ? '6 8' : 'none' }, svg);
      var t = el('text', { x: C, y: C - r - 8, 'text-anchor': 'middle', style: 'font-family:var(--mono);font-size:10px;letter-spacing:0.14em;fill:#00ff9c;opacity:0.7' }, svg);
      t.textContent = labels[i];
      tween(900, 300 + i * 200, function (k) { g.setAttribute('r', r * k); });
      return g;
    });
    var core = el('circle', { cx: C, cy: C, r: 26, fill: '#00ff9c', filter: 'url(#' + svg.id + '-glow)', opacity: 0.9 }, svg);
    var coreT = el('text', { x: C, y: C + 4, 'text-anchor': 'middle', style: 'font-family:var(--mono);font-size:10px;fill:#000;font-weight:700;letter-spacing:0.1em' }, svg);
    coreT.textContent = 'USERS';
    void core;
    var parts = el('g', {}, svg);
    shieldState = { svg: svg, parts: parts, rings: rings, radii: radii, C: C, running: true, list: [], last: 0, cards: cards };
    function spawn() {
      var a = Math.random() * Math.PI * 2;
      var stopAt = Math.random() < 0.55 ? 2 : Math.random() < 0.7 ? 1 : 0;
      var c = el('circle', { r: 5, fill: '#ff6a2b' }, parts);
      shieldState.list.push({ a: a, r: 240, stop: radii[stopAt], idx: stopAt, el: c, speed: 1.2 + Math.random() * 1.2 });
    }
    function frame(now) {
      if (!shieldState.running) return;
      if (now - shieldState.last > 380) { spawn(); shieldState.last = now; }
      shieldState.list = shieldState.list.filter(function (p) {
        p.r -= p.speed;
        p.el.setAttribute('cx', C + p.r * Math.cos(p.a));
        p.el.setAttribute('cy', C + p.r * Math.sin(p.a));
        if (p.r <= p.stop) {
          caught(p);
          return false;
        }
        return true;
      });
      requestAnimationFrame(frame);
    }
    function caught(p) {
      var x = C + p.stop * Math.cos(p.a), y = C + p.stop * Math.sin(p.a);
      p.el.remove();
      var burst = el('circle', { cx: x, cy: y, r: 4, fill: 'none', stroke: '#00ff9c', 'stroke-width': 2 }, parts);
      tween(600, 0, function (t) { burst.setAttribute('r', 4 + t * 22); burst.setAttribute('opacity', 1 - t); if (t >= 1) burst.remove(); });
      var ring = shieldState.rings[p.idx];
      ring.setAttribute('opacity', 0.95);
      setTimeout(function () { ring.setAttribute('opacity', 0.25 + p.idx * 0.1); }, 160);
      var card = cards.filter(function (c) { return +c.getAttribute('data-layer') === p.idx; })[0];
      if (card) { card.classList.add('hot'); clearTimeout(card._t); card._t = setTimeout(function () { card.classList.remove('hot'); }, 420); }
    }
    if (!REDUCED) requestAnimationFrame(frame);
  }
  function stopShield() { if (shieldState) shieldState.running = false; }

  window.Charts = {
    baseline: baseline,
    target: target,
    setTarget: setTarget,
    targetValues: targetValues,
    sCurve: sCurve,
    loop: loop,
    runLoop: runLoop,
    stopLoops: stopLoops,
    shield: shield,
    stopShield: stopShield,
    tween: tween,
    REDUCED: REDUCED
  };
})();
