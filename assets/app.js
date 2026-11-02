/* Deck engine: navigation, code rain, decode text, counters, narration, tooltips. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var REDUCED = window.Charts.REDUCED;
  var slides = $$('.slide');
  var stage = $('#stage');
  var cur = -1;
  var booted = false;

  /* ---------- stage scaling (fixed 1600×900 canvas, like a real deck) ---------- */
  function fit() {
    var s = Math.min(window.innerWidth / 1600, (window.innerHeight - 20) / 900);
    stage.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- Matrix code rain, tinted by slide theme ---------- */
  var rain = (function () {
    var cv = $('#rain'), ctx = cv.getContext('2d');
    var glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789ZΣ<>=+*';
    var fs = 18, cols = 0, drops = [], speeds = [];
    var color = [0, 255, 156], target = [0, 255, 156], boost = 0;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(innerWidth / fs);
      drops = []; speeds = [];
      for (var i = 0; i < cols; i++) { drops.push(Math.random() * -60); speeds.push(0.35 + Math.random() * 0.75); }
    }
    size();
    window.addEventListener('resize', size);
    var last = 0;
    function frame(ts) {
      requestAnimationFrame(frame);
      if (ts - last < 33) return;
      last = ts;
      for (var k = 0; k < 3; k++) color[k] += (target[k] - color[k]) * 0.04;
      boost *= 0.94;
      ctx.fillStyle = 'rgba(0,0,0,' + (0.09 - boost * 0.04) + ')';
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      ctx.font = fs + 'px "SF Mono", Menlo, monospace';
      var c = 'rgb(' + (color[0] | 0) + ',' + (color[1] | 0) + ',' + (color[2] | 0) + ')';
      for (var i = 0; i < cols; i++) {
        var ch = glyphs.charAt((Math.random() * glyphs.length) | 0);
        var x = i * fs, y = drops[i] * fs;
        ctx.fillStyle = Math.random() > 0.975 ? '#fff' : c;
        ctx.globalAlpha = 0.35 + Math.random() * 0.5;
        ctx.fillText(ch, x, y);
        ctx.globalAlpha = 1;
        drops[i] += speeds[i] * (1 + boost * 3);
        if (y > innerHeight && Math.random() > 0.975) drops[i] = Math.random() * -20;
      }
    }
    if (!REDUCED) requestAnimationFrame(frame);
    return {
      tint: function (theme) {
        target = theme === 'fire' ? [255, 110, 40] : theme === 'heal' ? [0, 255, 156] : [70, 220, 150];
      },
      burst: function () { boost = 1; }
    };
  })();

  /* ---------- decode / scramble text ---------- */
  var SCR = 'アカサタナ01<>/\\|=+*#ABCDEFX';
  function decode(node) {
    var final = node.getAttribute('data-final') || node.textContent;
    node.setAttribute('data-final', final);
    if (REDUCED) { node.textContent = final; return; }
    var frame = 0, total = 26;
    clearInterval(node._iv);
    node._iv = setInterval(function () {
      frame++;
      var reveal = Math.floor((frame / total) * final.length);
      var out = '';
      for (var i = 0; i < final.length; i++) {
        var ch = final.charAt(i);
        out += i < reveal || ch === ' ' ? ch : SCR.charAt((Math.random() * SCR.length) | 0);
      }
      node.textContent = out;
      if (frame >= total) { clearInterval(node._iv); node.textContent = final; }
    }, 32);
  }

  /* ---------- counters ---------- */
  function countUp(node, delay) {
    var to = parseFloat(node.getAttribute('data-count'));
    var dec = +(node.getAttribute('data-dec') || 0);
    node.textContent = (0).toFixed(dec);
    window.Charts.tween(1800, delay || 500, function (t) {
      node.textContent = (to * t).toFixed(dec);
    });
  }

  function glitch(node) {
    node.classList.remove('glitching');
    void node.offsetWidth;
    node.classList.add('glitching');
    setTimeout(function () { node.classList.remove('glitching'); }, 950);
  }

  /* ---------- per-slide enter hooks ---------- */
  var tip; // defined below
  var built = {};
  var hooks = {
    's-title': function (s) { setTimeout(function () { glitch($('[data-glitch]', s)); }, 900); },
    's-stats': function (s) {
      $$('.ring-fg', s).forEach(function (r) { r.style.strokeDashoffset = 528; void r.getBBox(); });
      requestAnimationFrame(function () {
        $$('.ring-fg', s).forEach(function (r) { r.style.strokeDashoffset = 528 * (1 - r.getAttribute('data-pct') / 100); });
      });
    },
    's-loop': function (s) {
      var w = $('.loop-wrap', s);
      if (!w._loop) w._loop = window.Charts.loop(w);
      window.Charts.runLoop(w._loop);
    },
    's-baseline': function () { window.Charts.baseline($('#baselineChart'), tip); },
    's-target': function () {
      window.Charts.target($('#targetChart'), +$('#pctRange').value, tip);
    },
    's-gartner': function () { window.Charts.sCurve($('#sCurve')); },
    's-fires': function (s) {
      var e = $('.embers', s);
      if (!e.children.length) {
        for (var i = 0; i < 46; i++) {
          var b = document.createElement('i');
          b.style.left = (Math.random() * 100) + '%';
          b.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
          b.style.animationDuration = (2.4 + Math.random() * 3) + 's';
          b.style.animationDelay = (-Math.random() * 5) + 's';
          var sz = 3 + Math.random() * 6;
          b.style.width = b.style.height = sz + 'px';
          e.appendChild(b);
        }
      }
      setTimeout(function () { glitch($('[data-glitch]', s)); }, 700);
    },
    's-layers': function (s) { window.Charts.shield($('#shield'), $$('.layer', s)); },
    's-close': function (s) { typeLines($$('.close-term div', s), 300); }
  };

  function leaveAll() {
    window.Charts.stopLoops();
    window.Charts.stopShield();
  }

  /* ---------- navigation ---------- */
  var progress = $('#progress');
  slides.forEach(function (s, i) {
    var b = document.createElement('i');
    b.title = (i + 1) + ' · ' + (s.getAttribute('data-kicker') || '');
    b.addEventListener('click', function () { go(i); });
    progress.appendChild(b);
  });
  $('#totNum').textContent = String(slides.length).padStart(2, '0');

  function go(n, opts) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === cur) return;
    var prev = cur;
    cur = n;
    leaveAll();
    slides.forEach(function (s, i) {
      s.classList.toggle('active', i === n);
      s.classList.toggle('past', i < n);
    });
    var s = slides[n];
    var theme = s.getAttribute('data-theme') || 'neutral';
    document.body.setAttribute('data-theme', theme);
    rain.tint(theme);
    if (prev !== -1) rain.burst();
    $('#kicker').textContent = s.getAttribute('data-kicker') || '';
    $('#curNum').textContent = String(n + 1).padStart(2, '0');
    $$('i', progress).forEach(function (b, i) { b.classList.toggle('done', i <= n); });
    $$('[data-decode]', s).forEach(function (d) { decode(d); });
    $$('[data-count]', s).forEach(function (c, i) { countUp(c, 600 + i * 120); });
    $$('.slide:not(.active) .ring-fg').forEach(function (r) { r.style.strokeDashoffset = 528; });
    var cls = s.className.split(' ').filter(function (c) { return hooks[c]; })[0];
    if (cls) hooks[cls](s);
    renderNotes();
    if (!opts || !opts.fromHash) history.replaceState(null, '', '#' + (n + 1));
    if (narrator.on && !(opts && opts.keepNarration)) narrator.speakCurrent();
    tip.hide();
  }
  function next() { go(cur + 1); }
  function prev() { go(cur - 1); }
  $('#next').addEventListener('click', next);
  $('#prev').addEventListener('click', prev);

  document.addEventListener('keydown', function (e) {
    if (!booted) { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); finishBoot(); return; }
    var tag = (e.target.tagName || '').toLowerCase();
    if (e.target.isContentEditable || tag === 'input' || tag === 'select' || tag === 'textarea') {
      if (e.key === 'Escape') e.target.blur();
      return;
    }
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(slides.length - 1);
    else if (k === 'n' || k === 'N') toggleNotes();
    else if (k === 'o' || k === 'O') toggleOverview();
    else if (k === 'f' || k === 'F') toggleFull();
    else if (k === 'p' || k === 'P') narrator.toggle();
    else if (k === 'Escape') { closeOverlays(); }
    else if (/^[1-9]$/.test(k)) go(+k - 1);
  });

  // swipe on touch screens
  var tx = null;
  document.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 60) (dx < 0 ? next : prev)();
    tx = null;
  });

  window.addEventListener('hashchange', function () {
    var n = parseInt(location.hash.slice(1), 10);
    if (n) go(n - 1, { fromHash: true });
  });

  /* ---------- boot sequence ---------- */
  function typeLines(lines, startDelay, done) {
    var i = 0;
    lines.forEach(function (l) { l.textContent = ''; l.classList.remove('typing'); });
    function nextLine() {
      if (i >= lines.length) { if (done) done(); return; }
      var l = lines[i], txt = l.getAttribute('data-type').replace(/&amp;/g, '&'), j = 0;
      l.classList.add('typing');
      var iv = setInterval(function () {
        j++;
        l.textContent = txt.slice(0, j);
        if (j >= txt.length) {
          clearInterval(iv);
          if (i < lines.length - 1) l.classList.remove('typing');
          i++;
          setTimeout(nextLine, 260);
        }
      }, REDUCED ? 0 : 38);
    }
    setTimeout(nextLine, startDelay || 0);
  }
  var bootTimer;
  function finishBoot() {
    if (booted) return;
    booted = true;
    clearTimeout(bootTimer);
    $('#boot').classList.add('gone');
    var n = parseInt(location.hash.slice(1), 10);
    go(n ? n - 1 : 0, { fromHash: true });
  }
  $('#boot').addEventListener('click', finishBoot);
  if (location.hash && parseInt(location.hash.slice(1), 10) > 1) {
    finishBoot();
  } else {
    typeLines($$('.boot-line'), 300, function () { bootTimer = setTimeout(finishBoot, 900); });
  }

  /* ---------- tooltips ---------- */
  tip = (function () {
    var t = $('#tip'), tb = $('b', t), ts = $('span', t);
    function place(e) {
      var w = t.offsetWidth, h = t.offsetHeight;
      var x = e.clientX + 18, y = e.clientY + 18;
      if (x + w > innerWidth - 12) x = e.clientX - w - 18;
      if (y + h > innerHeight - 12) y = e.clientY - h - 18;
      t.style.left = x + 'px'; t.style.top = y + 'px';
    }
    function show(e, title, body) { tb.textContent = title; ts.textContent = body || ''; t.classList.add('show'); place(e); }
    function hide() { t.classList.remove('show'); }
    document.addEventListener('mousemove', function (e) {
      var n = e.target.closest && e.target.closest('[data-tip]');
      if (n) {
        var parts = n.getAttribute('data-tip').split('|');
        show(e, parts[0], parts[1]);
      } else if (!e.target.closest || !e.target.closest('.bar, rect')) {
        hide();
      }
    });
    return { show: show, hide: hide };
  })();

  /* ---------- cursor glow ---------- */
  var glow = $('.cursor-glow');
  document.addEventListener('mousemove', function (e) {
    glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px';
  });

  /* ---------- toast ---------- */
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  /* ---------- notes + narration ---------- */
  var notesEl = $('#notes'), notesBody = $('#notesBody');
  function renderNotes() {
    var text = slides[cur].getAttribute('data-notes') || '';
    notesBody.innerHTML = '';
    text.split(/(\s+)/).forEach(function (w) {
      if (!w) return;
      if (/^\s+$/.test(w)) { notesBody.appendChild(document.createTextNode(w)); return; }
      var sp = document.createElement('span');
      sp.className = 'w'; sp.textContent = w;
      notesBody.appendChild(sp);
    });
  }
  function toggleNotes(force) {
    var open = typeof force === 'boolean' ? force : !notesEl.classList.contains('open');
    notesEl.classList.toggle('open', open);
    $('#btnNotes').classList.toggle('on', open);
  }
  $('#btnNotes').addEventListener('click', function () { toggleNotes(); });

  var narrator = (function () {
    var synth = window.speechSynthesis;
    var pick = $('#voicePick');
    var voices = [];
    var api = { on: false };
    var timer = null, utter = null, gotBoundary = false;

    function score(v) {
      var n = v.name;
      var s = 0;
      if (/premium/i.test(n)) s += 50;
      if (/enhanced|natural|neural/i.test(n)) s += 40;
      if (/google/i.test(n)) s += 15;
      if (/en-US/i.test(v.lang)) s += 8;
      if (/en-GB/i.test(v.lang)) s += 6;
      if (/samantha|ava|zoe|evan|daniel|serena/i.test(n)) s += 10;
      return s;
    }
    function loadVoices() {
      if (!synth) return;
      voices = synth.getVoices().filter(function (v) { return /^en/i.test(v.lang); }).sort(function (a, b) { return score(b) - score(a); });
      var keep = pick.value;
      pick.innerHTML = '';
      voices.forEach(function (v, i) {
        var o = document.createElement('option');
        o.value = String(i); o.textContent = v.name.replace(/\s*\(.*\)/, '') + ' · ' + v.lang;
        pick.appendChild(o);
      });
      if (keep && +keep < voices.length) pick.value = keep;
      pick.style.display = voices.length ? '' : 'none';
    }
    if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; } else { pick.style.display = 'none'; }

    function words() { return $$('.w', notesBody); }
    function mark(idx) {
      words().forEach(function (w, i) {
        w.classList.toggle('now', i === idx);
        w.classList.toggle('spoken', i < idx);
      });
      var n = words()[idx];
      if (n) n.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    function stopSpeech() {
      clearInterval(timer); timer = null;
      if (synth) synth.cancel();
      utter = null;
      words().forEach(function (w) { w.classList.remove('now', 'spoken'); });
    }
    api.speakCurrent = function () {
      stopSpeech();
      if (!synth) { toast('SPEECH NOT AVAILABLE IN THIS BROWSER'); return; }
      var text = slides[cur].getAttribute('data-notes') || '';
      var ws = words();
      // char offset → word index map
      var offsets = [], pos = 0;
      ws.forEach(function (w) { var at = text.indexOf(w.textContent, pos); offsets.push(at); pos = at + w.textContent.length; });
      var u = new SpeechSynthesisUtterance(text);
      var v = voices[+pick.value || 0];
      if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = 1.0;
      gotBoundary = false;
      var myIdx = cur;
      u.onboundary = function (e) {
        if (e.name && e.name !== 'word') return;
        gotBoundary = true;
        var idx = 0;
        for (var i = 0; i < offsets.length; i++) { if (offsets[i] <= e.charIndex) idx = i; else break; }
        mark(idx);
      };
      u.onstart = function () {
        // Natural/premium voices often never fire boundary events: fall back to timing.
        var t0 = performance.now(), msPerWord = 60000 / (165 * u.rate);
        timer = setInterval(function () {
          if (gotBoundary) { clearInterval(timer); return; }
          mark(Math.min(ws.length - 1, Math.floor((performance.now() - t0) / msPerWord)));
        }, 80);
      };
      u.onend = function () {
        if (utter !== u) return;
        clearInterval(timer);
        mark(ws.length);
        if (api.on && $('#autoAdv').checked && myIdx === cur) {
          if (cur < slides.length - 1) setTimeout(function () { if (api.on && myIdx === cur) next(); }, 900);
          else api.toggle(false);
        }
      };
      u.onerror = function () { clearInterval(timer); };
      utter = u;
      synth.speak(u);
    };
    api.toggle = function (force) {
      api.on = typeof force === 'boolean' ? force : !api.on;
      $('#btnNarrate').classList.toggle('on', api.on);
      $('#btnNarrate span').textContent = api.on ? 'Stop' : 'Narrate';
      if (api.on) { toggleNotes(true); api.speakCurrent(); toast('NARRATION ON · P TO STOP'); }
      else stopSpeech();
    };
    pick.addEventListener('change', function () { if (api.on) api.speakCurrent(); });
    return api;
  })();
  $('#btnNarrate').addEventListener('click', function () { narrator.toggle(); });

  /* ---------- overview ---------- */
  var ov = $('#overview'), ovGrid = $('.ov-grid', ov);
  function buildOverview() {
    ovGrid.innerHTML = '';
    slides.forEach(function (s, i) {
      var c = document.createElement('button');
      c.type = 'button';
      c.className = 'ov-card' + (i === cur ? ' cur' : '') + (s.getAttribute('data-theme') === 'fire' ? ' fire' : '');
      c.style.transitionDelay = (i * 30) + 'ms';
      var title = ($('h1, h2', s) || {}).textContent || '';
      c.innerHTML = '<span class="n">' + String(i + 1).padStart(2, '0') + '</span><span><span class="t"></span><br><span class="k"></span></span>';
      $('.t', c).textContent = title.replace(/\s+/g, ' ').trim();
      $('.k', c).textContent = s.getAttribute('data-kicker') || '';
      c.addEventListener('click', function () { toggleOverview(false); go(i); });
      ovGrid.appendChild(c);
    });
  }
  function toggleOverview(force) {
    var open = typeof force === 'boolean' ? force : !ov.classList.contains('open');
    if (open) buildOverview();
    ov.classList.toggle('open', open);
    $('#btnGrid').classList.toggle('on', open);
  }
  $('#btnGrid').addEventListener('click', function () { toggleOverview(); });
  ov.addEventListener('click', function (e) { if (e.target === ov) toggleOverview(false); });

  /* ---------- fullscreen ---------- */
  function toggleFull() {
    if (!document.fullscreenElement) { (document.documentElement.requestFullscreen || function () {}).call(document.documentElement); }
    else document.exitFullscreen();
  }
  $('#btnFull').addEventListener('click', toggleFull);

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox');
  $$('.thumb').forEach(function (t) {
    t.addEventListener('click', function () { $('img', lb).src = t.getAttribute('data-src'); lb.classList.add('open'); });
  });
  lb.addEventListener('click', function () { lb.classList.remove('open'); });
  function closeOverlays() { lb.classList.remove('open'); toggleOverview(false); toggleNotes(false); }

  /* ---------- 2027 target slider ---------- */
  var range = $('#pctRange');
  function syncTarget(animate) {
    var pct = +range.value;
    var ceil = Math.round(34 * (1 - pct / 100));
    range.style.setProperty('--p', pct + '%');
    $('#pctOut').textContent = pct;
    $('#ceilOut').textContent = ceil;
    var perMonth = (ceil / 12).toFixed(1);
    $('#targetSay').textContent = pct === 100
      ? 'Zero R&D regressions reaching customers in 2027. The self-healing endgame.'
      : '≈ ' + perMonth + ' regressions a month instead of 2.8 — ' + (34 - ceil) + ' fewer customer-facing escapes.';
    if (animate) window.Charts.setTarget(pct);
  }
  range.addEventListener('input', function () { syncTarget(true); });
  syncTarget(false);

  /* ---------- discussion timers ---------- */
  var qGrid = $('.q-grid');
  var activeQ = null, qInterval = null;
  $$('.q').forEach(function (q) {
    q._left = 600;
    q.addEventListener('click', function () {
      if (activeQ === q) {
        q.classList.toggle('paused');
        return;
      }
      if (activeQ) { activeQ.classList.remove('focus'); activeQ.classList.add('paused'); }
      activeQ = q;
      q.classList.add('focus'); q.classList.remove('paused');
      qGrid.classList.add('focusing');
      clearInterval(qInterval);
      qInterval = setInterval(function () {
        if (!activeQ || activeQ.classList.contains('paused')) return;
        activeQ._left--;
        var l = activeQ._left, a = Math.abs(l);
        $('.qtimer', activeQ).textContent = (l < 0 ? '+' : '') + Math.floor(a / 60) + ':' + String(a % 60).padStart(2, '0');
        activeQ.style.setProperty('--elapsed', Math.min(100, (600 - l) / 6) + '%');
        activeQ.classList.toggle('over', l < 0);
      }, 1000);
    });
  });
  qGrid.addEventListener('dblclick', function () {
    if (activeQ) activeQ.classList.remove('focus');
    activeQ = null; qGrid.classList.remove('focusing');
  });

  /* ---------- pod plan table ---------- */
  var KEY = 'offsite-pod-plans-v1';
  var DEFAULT_ROWS = [
    ['Transformers', 'Datadog smart alerts on detector performance; AI next', 'Shraga QA agent per version: vs. no detector, vs. prior version', 'Smart AI QA, detector → replay', 'No big live fires'],
    ['Mobile', '', '', '', ''],
    ['Pod:', '', '', '', ''],
    ['Pod:', '', '', '', '']
  ];
  var tbody = $('#podTable tbody');
  function loadRows() {
    try { var r = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(r) && r.length) return r; } catch (e) { /* storage unavailable */ }
    return DEFAULT_ROWS.map(function (r) { return r.slice(); });
  }
  function saveRows() {
    var rows = $$('tr', tbody).map(function (tr) { return $$('td', tr).map(function (td) { return td.textContent.trim(); }); });
    try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch (e) { /* storage unavailable */ }
    return rows;
  }
  function renderRows(rows) {
    tbody.innerHTML = '';
    rows.forEach(function (r, i) {
      var tr = document.createElement('tr');
      tr.style.animationDelay = (i * 80) + 'ms';
      r.forEach(function (v) {
        var td = document.createElement('td');
        td.contentEditable = 'true';
        td.spellcheck = false;
        td.textContent = v;
        td.addEventListener('input', saveRows);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }
  renderRows(loadRows());
  $('#addRow').addEventListener('click', function () {
    var rows = saveRows(); rows.push(['Pod:', '', '', '', '']); renderRows(rows); saveRows();
    var last = $('tr:last-child td', tbody); if (last) last.focus();
  });
  $('#resetTable').addEventListener('click', function () {
    renderRows(DEFAULT_ROWS.map(function (r) { return r.slice(); })); saveRows(); toast('TABLE RESET');
  });
  $('#copyMd').addEventListener('click', function () {
    var rows = saveRows();
    var head = $$('#podTable th').map(function (th) { return th.textContent; });
    var md = '| ' + head.join(' | ') + ' |\n|' + head.map(function () { return '---'; }).join('|') + '|\n' +
      rows.map(function (r) { return '| ' + r.map(function (c) { return c.replace(/\|/g, '\\|'); }).join(' | ') + ' |'; }).join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(md) : Promise.reject()).then(
      function () { toast('COPIED AS MARKDOWN'); },
      function () { window.prompt('Copy the table:', md); }
    );
  });
})();
