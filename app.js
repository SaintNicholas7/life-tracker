(() => {
  'use strict';

  const STORE_KEY = 'lt.v1';

  /* ---------- Icons ---------- */
  const ICONS = {
    dollar: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M14.7 9.2c0-1.1-1.2-1.7-2.7-1.7s-2.7.7-2.7 1.9c0 2.6 5.4 1.3 5.4 4 0 1.2-1.2 1.9-2.7 1.9s-2.7-.7-2.7-1.8"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>',
    social: '<svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="4"/><path class="f" d="M10.2 9.4v5.2l4.4-2.6z"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 2.2C19.5 15.4 12 20 12 20z"/></svg>',
    desktop: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2.5"/><path d="M12 16v4M8 20h8"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    sliders: '<svg viewBox="0 0 24 24"><path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.4"/><circle cx="8" cy="17" r="2.4"/></svg>',
  };
  const ic = (n) => ICONS[n];

  /* ---------- What we track ---------- */
  const CATS = {
    work:    { cls: 'c-work',    icon: 'clock',  menu: 'In the field',  menuSub: 'Paid plumbing jobs',   title: 'Log in the field hours', hint: 'Time out on jobs (this is the paid time)', chips: [2, 4, 6, 8, 10] },
    backend: { cls: 'c-backend', icon: 'desktop', menu: 'Plumbing business', menuSub: 'Backend work, unpaid', title: 'Log plumbing business hours', hint: 'Backend work on the plumbing business', chips: [0.5, 1, 2, 3, 4] },
    social:  { cls: 'c-social',  icon: 'social', menu: 'Social media & projects', menuSub: 'YouTube, content & projects', title: 'Log social media & projects', hint: 'Hours on your YouTube channel, content & projects', chips: [0.5, 1, 2, 3, 4] },
    sleep:   { cls: 'c-sleep',   icon: 'moon',   menu: 'Sleep',        menuSub: 'Hours slept',        title: 'Log sleep',          hint: 'Counts for the day you woke up',           chips: [6, 7, 7.5, 8, 9] },
    leisure: { cls: 'c-leisure', icon: 'heart',  menu: 'Leisure',      menuSub: 'Family & free time', title: 'Log leisure & family', hint: 'Hours of leisure and family time',        chips: [1, 2, 3, 4, 6] },
  };
  const ORDER = ['work', 'backend', 'social', 'sleep', 'leisure'];

  // Each detail screen: which category it reads, and how it shows numbers.
  const VIEWS = {
    money:   { cat: 'work',    cls: 'c-money',   icon: 'dollar', title: 'Earnings',     money: true },
    work:    { cat: 'work',    cls: 'c-work',    icon: 'clock',  title: 'In the field hours' },
    backend: { cat: 'backend', cls: 'c-backend', icon: 'desktop', title: 'Plumbing business hours' },
    social:  { cat: 'social',  cls: 'c-social',  icon: 'social', title: 'Social media & projects' },
    sleep:   { cat: 'sleep',   cls: 'c-sleep',   icon: 'moon',   title: 'Sleep',        avg: true },
    leisure: { cat: 'leisure', cls: 'c-leisure', icon: 'heart',  title: 'Leisure & family' },
  };

  /* ---------- Data ---------- */
  const DEFAULTS = { rate: 20, weekStart: 1 };
  let S = load();

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY));
      if (raw && typeof raw.days === 'object' && raw.days) {
        return { settings: Object.assign({}, DEFAULTS, raw.settings), days: raw.days };
      }
    } catch (e) { /* first run or blocked storage */ }
    return { settings: Object.assign({}, DEFAULTS), days: {} };
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
    catch (e) { toast('Could not save on this device'); }
  }

  /* ---------- Dates ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const weekStartOf = (d) => addDays(d, -((d.getDay() - S.settings.weekStart + 7) % 7));
  const weekKeys = (start) => Array.from({ length: 7 }, (_, i) => key(addDays(start, i)));
  const fmtShort = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const fmtLong = (d) => d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  /* ---------- Numbers ---------- */
  const hrs = (k, c) => (S.days[k] && S.days[k][c]) || 0;
  const rateOf = (k) => (S.days[k] && S.days[k].rate != null ? S.days[k].rate : S.settings.rate);
  const earned = (k) => hrs(k, 'work') * rateOf(k);
  const num = (n) => String(Math.round(n * 100) / 100);
  const fh = (h) => num(h) + 'h';
  const fm = (m) => {
    const r = Math.round(m * 100) / 100;
    return '$' + r.toLocaleString(undefined, { minimumFractionDigits: Number.isInteger(r) ? 0 : 2, maximumFractionDigits: 2 });
  };

  // Start/end times are optional notes and do not have to add up to the hours.
  const timesOf = (k, c) => (S.days[k] && S.days[k].times && S.days[k].times[c]) || null;

  const noteOf = (k, c) => (S.days[k] && S.days[k].notes && S.days[k].notes[c]) || '';

  // Optional extras (times, notes) live beside the hours, per day and category.
  function setMeta(day, field, cat, value) {
    if (value) {
      (day[field] || (day[field] = {}))[cat] = value;
    } else if (day[field]) {
      delete day[field][cat];
      if (!Object.keys(day[field]).length) delete day[field];
    }
  }

  function setHours(k, cat, h, times, note) {
    const day = S.days[k] || (S.days[k] = {});
    if (h > 0) day[cat] = h; else delete day[cat];
    setMeta(day, 'times', cat, h > 0 && times && (times.start || times.end) ? times : null);
    setMeta(day, 'notes', cat, h > 0 && note ? note : null);
    if (!ORDER.some((c) => day[c])) delete S.days[k];
    save();
  }

  // 24-hour time: "9" / "900" / "0900" / "09:00" all become "09:00". Returns '' if empty, null if invalid.
  function cleanTime(str) {
    const d = String(str || '').replace(/\D/g, '');
    if (!d) return '';
    let h, m;
    if (d.length <= 2) { h = +d; m = 0; }
    else if (d.length === 3) { h = +d[0]; m = +d.slice(1); }
    else { h = +d.slice(0, 2); m = +d.slice(2, 4); }
    return h > 23 || m > 59 ? null : `${pad(h)}:${pad(m)}`;
  }

  /* ---------- DOM helpers ---------- */
  const $ = (s) => document.querySelector(s);
  const app = $('#app');
  const sheet = $('#sheet');
  const body = document.body;

  let route = 'home';
  let vm = null; // visible month in a calendar screen
  const thisMonth = () => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; };

  /* ---------- Home ---------- */
  function bars(values, todayIdx) {
    const max = Math.max(...values, 0.0001);
    return '<div class="bars" aria-hidden="true">' + values.map((v, i) =>
      `<span class="${i === todayIdx ? 'now' : ''}" style="height:${Math.max(7, (v / max) * 100)}%"></span>`).join('') + '</div>';
  }

  function card(id, cls, icon, label, big, sub, values, todayIdx, extra) {
    return `<a class="card ${cls} ${extra || ''}" href="#/${id}">
      <span class="badge">${ic(icon)}</span><span class="chev">${ic('chev')}</span>
      <span class="label">${label}</span>
      <span class="big" ${id === 'money' ? 'data-money' : ''}>${big}</span>
      <span class="sub">${sub}</span>
      ${bars(values, todayIdx)}
    </a>`;
  }

  function homeHTML() {
    const ws = weekStartOf(new Date());
    const ks = weekKeys(ws);
    const todayIdx = ks.indexOf(key(new Date()));
    const sum = (f) => ks.reduce((a, k) => a + f(k), 0);

    const money = sum(earned);
    const work = sum((k) => hrs(k, 'work'));
    const backend = sum((k) => hrs(k, 'backend'));
    const social = sum((k) => hrs(k, 'social'));
    const leisure = sum((k) => hrs(k, 'leisure'));
    const nights = ks.filter((k) => hrs(k, 'sleep') > 0);
    const sleepAvg = nights.length ? sum((k) => hrs(k, 'sleep')) / nights.length : 0;

    const h = new Date().getHours();
    const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const empty = !Object.keys(S.days).length;

    return `
      <header class="top">
        <div><h1>${hello}</h1><p>Week of ${fmtShort(ws)} – ${fmtShort(addDays(ws, 6))}</p></div>
        <button class="icon-btn" data-act="settings" aria-label="Settings">${ic('sliders')}</button>
      </header>
      <section class="grid">
        ${card('money', 'c-money', 'dollar', 'You made', fm(money), empty ? 'Tap + to log your first day' : `this week · ${fm(S.settings.rate)}/hr`, ks.map(earned), todayIdx, 'hero')}
        ${card('work', 'c-work', 'clock', 'In the field', fh(work), 'Paid job time', ks.map((k) => hrs(k, 'work')), todayIdx)}
        ${card('backend', 'c-backend', 'desktop', 'Plumbing business', fh(backend), 'Backend work, unpaid', ks.map((k) => hrs(k, 'backend')), todayIdx)}
        ${card('social', 'c-social', 'social', 'Social media & projects', fh(social), 'This week', ks.map((k) => hrs(k, 'social')), todayIdx)}
        ${card('sleep', 'c-sleep', 'moon', 'Sleep', nights.length ? fh(sleepAvg) : '–', nights.length ? 'avg per night' : 'No nights logged', ks.map((k) => hrs(k, 'sleep')), todayIdx)}
        ${card('leisure', 'c-leisure', 'heart', 'Leisure', fh(leisure), 'Family & free time', ks.map((k) => hrs(k, 'leisure')), todayIdx)}
      </section>`;
  }

  function countUp() {
    const el = app.querySelector('[data-money]');
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const real = el.textContent;
    const total = weekKeys(weekStartOf(new Date())).reduce((a, k) => a + earned(k), 0);
    if (!total) return;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 700);
      el.textContent = fm(total * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step); else el.textContent = real;
    };
    requestAnimationFrame(step);
  }

  /* ---------- Calendar detail ---------- */
  function detailHTML(id) {
    const v = VIEWS[id];
    const val = (k) => (v.money ? earned(k) : hrs(k, v.cat));
    const show = (n) => (v.money ? fm(n) : fh(n));

    const first = new Date(vm.y, vm.m, 1);
    const last = new Date(vm.y, vm.m + 1, 0);
    const todayKey = key(new Date());
    const monthName = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    // month summary
    const monthKeys = [];
    for (let d = new Date(first); d <= last; d = addDays(d, 1)) monthKeys.push(key(d));
    const total = monthKeys.reduce((a, k) => a + val(k), 0);
    const logged = monthKeys.filter((k) => val(k) > 0).length;
    const summary = v.avg
      ? `<b>${logged ? fh(total / logged) : '–'}</b><span>avg per night · ${logged} night${logged === 1 ? '' : 's'} logged</span>`
      : `<b>${show(total)}</b><span>${monthName.split(' ')[0]} total · ${logged} day${logged === 1 ? '' : 's'} logged</span>`;

    // weekday headings follow the chosen start of week
    const base = weekStartOf(new Date());
    const dows = Array.from({ length: 7 }, (_, i) => addDays(base, i).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3));

    let rows = '';
    for (let ws = weekStartOf(first); ws <= last; ws = addDays(ws, 7)) {
      const ks = weekKeys(ws);
      let cells = '';
      for (const k of ks) {
        const d = parse(k);
        const n = val(k);
        const t = n > 0 ? timesOf(k, v.cat) : null;
        const times = t && (t.start || t.end)
          ? `<span class="t">${[t.start, t.end].filter(Boolean).map((x) => `<i>${x}</i>`).join('')}</span>` : '';
        const hasNote = n > 0 && noteOf(k, v.cat);
        cells += `<button class="day ${d.getMonth() !== vm.m ? 'out' : ''} ${n > 0 ? 'has' : ''} ${hasNote ? 'note' : ''} ${k === todayKey ? 'today' : ''}" data-act="day" data-date="${k}" aria-label="${fmtLong(d)}">
          <span class="n">${d.getDate()}</span><span class="v">${n > 0 ? show(n) : ''}</span>${times}</button>`;
      }
      const wt = ks.reduce((a, k) => a + val(k), 0);
      const wl = ks.filter((k) => val(k) > 0).length;
      const wv = v.avg ? (wl ? fh(wt / wl) : '–') : show(wt);
      rows += `<div class="row">${cells}<div class="wk ${wt > 0 ? '' : 'zero'}"><span class="v">${wt > 0 || !v.avg ? wv : '–'}</span><span class="t">${v.avg ? 'avg' : 'week'}</span></div></div>`;
    }

    return `
      <div class="${v.cls}">
        <header class="dhead">
          <a class="icon-btn" href="#/" aria-label="Back">${ic('back')}</a>
          <h1>${v.title}</h1>
        </header>
        <div class="summary">${summary}</div>
        <section class="cal">
          <div class="mnav">
            <button class="icon-btn" data-act="prev" aria-label="Previous month">${ic('left')}</button>
            <h2>${monthName}</h2>
            <button class="icon-btn" data-act="next" aria-label="Next month">${ic('right')}</button>
          </div>
          <div class="row">${dows.map((d) => `<div class="dow">${d}</div>`).join('')}<div class="dow">${v.avg ? 'Avg' : 'Week'}</div></div>
          ${rows}
        </section>
        <p class="hint">Tap any day to add or edit it · a dot means it has notes${v.money ? ` · earnings come from your in the field hours ×${fm(S.settings.rate)}/hr` : ''}</p>
      </div>`;
  }

  /* ---------- Rendering / routing ---------- */
  function parseRoute() {
    const h = location.hash.replace(/^#\/?/, '');
    return VIEWS[h] ? h : 'home';
  }
  function render() {
    app.innerHTML = route === 'home' ? homeHTML() : detailHTML(route);
    if (route === 'home') countUp();
  }
  window.addEventListener('hashchange', () => {
    route = parseRoute();
    vm = thisMonth();
    closeAll();
    render();
    window.scrollTo(0, 0);
  });

  /* ---------- Floating + menu ---------- */
  $('#fab').innerHTML = ic('plus');
  $('#menu').innerHTML = ORDER.map((c) => {
    const o = CATS[c];
    return `<button class="mitem ${o.cls}" role="menuitem" data-act="add" data-cat="${c}">
      <span class="badge">${ic(o.icon)}</span><span>${o.menu}<small>${o.menuSub}</small></span></button>`;
  }).join('');

  function toggleMenu(open) {
    const on = open ?? !body.classList.contains('menu-open');
    body.classList.toggle('menu-open', on);
    $('#fab').setAttribute('aria-expanded', String(on));
  }
  function closeAll() {
    toggleMenu(false);
    body.classList.remove('sheet-open');
    sh = null;
  }

  /* ---------- Log / edit sheet ---------- */
  let sh = null; // { cat, date }

  function openSheet(cat, date) {
    toggleMenu(false);
    sh = { cat, date: date || key(new Date()) };
    const c = CATS[cat];
    sheet.className = c.cls;
    sheet.innerHTML = `
      <div class="grab"></div>
      <div class="sh-head"><span class="badge">${ic(c.icon)}</span><div><h2>${c.title}</h2><p>${c.hint}</p></div></div>
      <label class="fld">Date<input type="date" id="shDate" value="${sh.date}"></label>
      <label class="fld">Hours
        <div class="stepper">
          <button type="button" data-act="step" data-d="-0.5" aria-label="Less">${ic('minus')}</button>
          <input id="shHrs" type="number" inputmode="decimal" min="0" max="24" step="0.25" placeholder="0">
          <button type="button" data-act="step" data-d="0.5" aria-label="More">${ic('plus')}</button>
        </div>
      </label>
      <div class="chips">${c.chips.map((h) => `<button type="button" data-act="chip" data-h="${h}">${h}h</button>`).join('')}</div>
      <div class="times-head"><span>Time of day <i>(optional)</i></span><button type="button" class="link" id="shClear" data-act="clear-times">Clear</button></div>
      <div class="times">
        <label class="fld">Start<input type="text" id="shStart" inputmode="numeric" maxlength="5" placeholder="09:00" autocomplete="off"></label>
        <label class="fld">End<input type="text" id="shEnd" inputmode="numeric" maxlength="5" placeholder="17:00" autocomplete="off"></label>
      </div>
      <label class="fld">Notes <i class="opt">(optional)</i>
        <textarea id="shText" rows="3" placeholder="Job, address, anything you want to jot down"></textarea>
      </label>
      <p class="note" id="shNote"></p>
      <div class="actions"><button class="btn ghost" id="shRemove" data-act="remove">Remove</button><button class="btn" data-act="save">Save</button></div>`;
    fillSheet();
    body.classList.add('sheet-open');
    setTimeout(() => { const i = $('#shHrs'); if (i && matchMedia('(hover: hover)').matches) i.focus(); }, 280);
  }

  function fillSheet() {
    const h = hrs(sh.date, sh.cat);
    const t = timesOf(sh.date, sh.cat) || {};
    $('#shHrs').value = h || '';
    $('#shStart').value = t.start || '';
    $('#shEnd').value = t.end || '';
    $('#shText').value = noteOf(sh.date, sh.cat);
    $('#shRemove').hidden = !h;
    updateNote();
  }
  function updateNote() {
    const note = $('#shNote');
    const h = parseFloat($('#shHrs').value) || 0;
    const d = parse(sh.date);
    let text = fmtLong(d);
    if (sh.cat === 'work') {
      text += ` · <b>${fm(h * rateOf(sh.date))}</b> at ${fm(rateOf(sh.date))}/hr`;
    }
    const s = cleanTime($('#shStart').value), e = cleanTime($('#shEnd').value);
    if (s && e) {
      const [sh1, sm] = s.split(':').map(Number), [eh, em] = e.split(':').map(Number);
      let mins = eh * 60 + em - (sh1 * 60 + sm);
      if (mins <= 0) mins += 1440; // runs past midnight, e.g. sleep
      text += ` · ${s} – ${e} (${num(mins / 60)}h span)`;
    }
    note.innerHTML = text;
  }

  function saveSheet() {
    const raw = $('#shHrs').value.trim();
    const h = parseFloat(raw);
    if (raw === '' || Number.isNaN(h)) return toast('Enter the number of hours');
    if (h < 0 || h > 24) return toast('Hours must be between 0 and 24');
    const { cat, date } = sh;
    const start = cleanTime($('#shStart').value), end = cleanTime($('#shEnd').value);
    if (start === null || end === null) return toast('Use 24-hour time, like 09:00 or 15:30');
    setHours(date, cat, h, { start, end }, $('#shText').value.trim());
    closeAll();
    render();
    toast(h > 0 ? `Saved ${fh(h)} · ${fmtLong(parse(date))}` : 'Entry removed');
  }

  /* ---------- Settings sheet ---------- */
  function openSettings() {
    toggleMenu(false);
    sh = null;
    sheet.className = 'c-work';
    sheet.innerHTML = `
      <div class="grab"></div>
      <div class="sh-head"><span class="badge">${ic('sliders')}</span><div><h2>Settings</h2><p>Stored only on this device</p></div></div>
      <label class="fld">Hourly pay for field hours ($)<input type="number" id="setRate" inputmode="decimal" min="0" step="0.01" value="${S.settings.rate}"></label>
      <label class="fld" style="display:flex;align-items:center;gap:10px;text-transform:none;letter-spacing:0;font-size:14px;font-weight:500;margin-top:-4px">
        <input type="checkbox" id="setAll" checked style="width:20px;height:20px;margin:0"> Apply this rate to past days too
      </label>
      <label class="fld">Week starts on
        <select id="setWeek"><option value="1" ${S.settings.weekStart === 1 ? 'selected' : ''}>Monday</option><option value="0" ${S.settings.weekStart === 0 ? 'selected' : ''}>Sunday</option></select>
      </label>
      <div class="row2">
        <button class="btn line" data-act="export">Back up</button>
        <button class="btn line" data-act="import">Restore</button>
        <input type="file" id="setFile" accept="application/json,.json" hidden>
      </div>
      <div class="actions"><button class="btn" data-act="save-settings">Done</button></div>`;
    body.classList.add('sheet-open');
  }

  function saveSettings() {
    const rate = parseFloat($('#setRate').value);
    if (Number.isNaN(rate) || rate < 0) return toast('Enter a valid hourly rate');
    if (rate !== S.settings.rate) {
      for (const k in S.days) {
        if ($('#setAll').checked) delete S.days[k].rate;
        else if (S.days[k].rate == null && S.days[k].work) S.days[k].rate = S.settings.rate; // keep old days at the old rate
      }
      S.settings.rate = rate;
    }
    S.settings.weekStart = Number($('#setWeek').value);
    save();
    closeAll();
    render();
    toast('Settings saved');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `life-tracker-backup-${key(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data.days !== 'object') throw new Error('bad file');
        if (!confirm('Replace everything on this device with the backup?')) return;
        S = { settings: Object.assign({}, DEFAULTS, data.settings), days: data.days };
        save();
        closeAll();
        render();
        toast('Backup restored');
      } catch (e) { toast('That file is not a valid backup'); }
    };
    reader.readAsText(file);
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const a = el.dataset.act;
    if (a === 'fab') toggleMenu();
    else if (a === 'dismiss') closeAll();
    else if (a === 'add') openSheet(el.dataset.cat);
    else if (a === 'day') openSheet(VIEWS[route].cat, el.dataset.date);
    else if (a === 'prev' || a === 'next') {
      vm = new Date(vm.y, vm.m + (a === 'next' ? 1 : -1), 1);
      vm = { y: vm.getFullYear(), m: vm.getMonth() };
      render();
    }
    else if (a === 'step') {
      const i = $('#shHrs');
      const v = Math.min(24, Math.max(0, (parseFloat(i.value) || 0) + Number(el.dataset.d)));
      i.value = num(v);
      updateNote();
    }
    else if (a === 'chip') { $('#shHrs').value = el.dataset.h; updateNote(); }
    else if (a === 'clear-times') { $('#shStart').value = ''; $('#shEnd').value = ''; updateNote(); }
    else if (a === 'save') saveSheet();
    else if (a === 'remove') { setHours(sh.date, sh.cat, 0); closeAll(); render(); toast('Entry removed'); }
    else if (a === 'settings') openSettings();
    else if (a === 'save-settings') saveSettings();
    else if (a === 'export') exportData();
    else if (a === 'import') $('#setFile').click();
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'shDate' && e.target.value && sh) { sh.date = e.target.value; fillSheet(); }
    if (e.target.id === 'setFile' && e.target.files[0]) importData(e.target.files[0]);
  });
  document.addEventListener('input', (e) => {
    if (!sh) return;
    if (e.target.id === 'shStart' || e.target.id === 'shEnd') {
      const d = e.target.value.replace(/\D/g, '').slice(0, 4);
      e.target.value = d.length === 3 ? `${d[0]}:${d.slice(1)}` : d.length > 3 ? `${d.slice(0, 2)}:${d.slice(2)}` : d; // auto-add the colon
    }
    if (['shHrs', 'shStart', 'shEnd'].includes(e.target.id)) updateNote();
  });
  document.addEventListener('focusout', (e) => {
    if (sh && (e.target.id === 'shStart' || e.target.id === 'shEnd')) {
      const t = cleanTime(e.target.value);
      if (t !== null) e.target.value = t; // "9" becomes "09:00"
      updateNote();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
    if (e.key === 'Enter' && sh && e.target.id === 'shHrs') saveSheet();
  });

  /* ---------- Start ---------- */
  route = parseRoute();
  vm = thisMonth();
  render();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* optional */ }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
