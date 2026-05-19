/* ============================================================
   森、道、市場 2026 ガイドアプリ — アプリ本体
============================================================ */
(function () {
  'use strict';

  const state = {
    view: 'home',
    day: defaultDay(),
    selectedZone: null,
    highlightShop: null,   // マップ上でハイライト中のショップID
    planMode: false,       // マイプランの出店をまとめてマップ表示
    placingMe: false,
    mapShopQuery: '',
    artistQuery: '',
    shopQuery: '', shopCat: 'all',
    myplanTab: 'artists',
    fav: load('mm2026_fav', { artists: [], shops: [] }),
    checks: load('mm2026_checks', {}),
    mePin: load('mm2026_me', null),
    recent: load('mm2026_recent', { shops: [], artists: [] }),
    night: initNight()
  };
  /* 夜モード初期値：保存値があれば優先、無ければ端末のダークモード設定に従う。
     localStorage が使えない環境でも落ちないよう try/catch で包む。 */
  function initNight() {
    try {
      const v = localStorage.getItem('mm2026_night');
      if (v === '1') return true;
      if (v === '0') return false;
    } catch (e) {}
    try { return window.matchMedia('(prefers-color-scheme:dark)').matches; }
    catch (e) { return false; }
  }

  function load(k, def) {
    try { const r = JSON.parse(localStorage.getItem(k)); return r == null ? def : r; }
    catch (e) { return def; }
  }
  /* localStorage は iOS プライベートモード・容量超過で throw する。
     失敗してもアプリは止めない（メモリ上の状態は保持される）。 */
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch (e) { /* 保存不可でも継続 */ }
  }
  /* 破損・型崩れした localStorage 値で初期化が落ちるのを防ぐ */
  function sanitizeState() {
    const f = state.fav;
    if (!f || typeof f !== 'object' || !Array.isArray(f.artists) || !Array.isArray(f.shops))
      state.fav = { artists: [], shops: [] };
    if (!state.checks || typeof state.checks !== 'object' || Array.isArray(state.checks))
      state.checks = {};
    const m = state.mePin;
    if (!m || typeof m.x !== 'number' || typeof m.y !== 'number' ||
        isNaN(m.x) || isNaN(m.y)) state.mePin = null;
    const r = state.recent;
    if (!r || typeof r !== 'object' || !Array.isArray(r.shops) || !Array.isArray(r.artists))
      state.recent = { shops: [], artists: [] };
  }
  function saveFav() { save('mm2026_fav', state.fav); }
  function isFav(t, id) { return state.fav[t].indexOf(id) !== -1; }
  function toggleFav(t, id) {
    const a = state.fav[t], i = a.indexOf(id);
    if (i === -1) { a.push(id); return true; }
    a.splice(i, 1); return false;
  }
  /* 'YYYY-MM-DD' + 'HH:MM' をローカル時刻の Date に（iOS Safari 互換のため
     文字列パースに頼らず数値引数で生成する） */
  function mkDate(dateStr, hm) {
    const p = String(dateStr).split('-').map(Number);
    const t = String(hm || '00:00').split(':').map(Number);
    return new Date(p[0], (p[1] || 1) - 1, p[2] || 1, t[0] || 0, t[1] || 0, 0);
  }
  function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function defaultDay() {
    const t = new Date();
    const d = FESTIVAL.days.find(x => sameDate(mkDate(x.date), t));
    return d ? d.id : 'd1';
  }
  function todayDay() {
    const n = new Date();
    const d = FESTIVAL.days.find(x => sameDate(mkDate(x.date), n));
    return d ? d.id : null;
  }
  /* 開催状況：'open'（開催時間中）／'before'（次の開場まで）／'ended'（全日程終了） */
  function festivalStatus() {
    const now = new Date();
    const sessions = FESTIVAL.days.map(d => ({
      day: d, open: mkDate(d.date, d.open), close: mkDate(d.date, d.close)
    }));
    for (let i = 0; i < sessions.length; i++) {
      if (now >= sessions[i].open && now <= sessions[i].close)
        return { mode: 'open', day: sessions[i].day };
    }
    const next = sessions.find(s => s.open > now);
    if (next) return { mode: 'before', target: next.open, day: next.day };
    return { mode: 'ended' };
  }
  /* カウントダウン表示の中身を生成（ホームのヒーロー内で使用） */
  function countdownInner(st) {
    if (st.mode === 'open')
      return '<div class="cd-box wide"><b>本日開催中</b><span>HAVE A GREAT DAY</span></div>';
    if (st.mode === 'before') {
      const diff = Math.max(0, st.target - new Date());
      const dd = Math.floor(diff / 864e5),
            hh = Math.floor(diff % 864e5 / 36e5),
            mm = Math.floor(diff % 36e5 / 6e4);
      return '<div class="cd-box"><b class="en">' + dd + '</b><span>DAYS</span></div>' +
             '<div class="cd-box"><b class="en">' + hh + '</b><span>HOURS</span></div>' +
             '<div class="cd-box"><b class="en">' + mm + '</b><span>MIN</span></div>';
    }
    return '<div class="cd-box wide"><b>開催ありがとうございました</b>' +
           '<span>SEE YOU NEXT YEAR</span></div>';
  }
  /* ホーム表示中、カウントダウンを定期更新（開いたまま固まるのを防ぐ）。
     開催状態が変わったらホームを丸ごと再描画する。 */
  function refreshCountdown() {
    if (state.view !== 'home') return;
    const box = document.querySelector('.countdown');
    if (!box) return;
    const st = festivalStatus();
    if (st.mode !== box.dataset.mode) { renderHome(); return; }
    box.innerHTML = countdownInner(st);
  }

  /* ---------- DOM ヘルパ ---------- */
  const $ = s => document.querySelector(s);
  const $$ = s => [].slice.call(document.querySelectorAll(s));
  function el(t, c, h) {
    const e = document.createElement(t);
    if (c) e.className = c;
    if (h != null) e.innerHTML = h;
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  let toastT;
  function toast(m) {
    let t = $('#toast');
    if (!t) { t = el('div', 'toast'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = m; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2000);
  }
  function openUrl(u) { window.open(u, '_blank', 'noopener'); }
  function secTitle(jp, en) {
    return el('div', 'section-title',
      `<span>${esc(jp)}</span><span class="en">${esc(en)}</span>`);
  }

  /* 検索用の正規化キー：大小文字・全角半角・半角カナ・カタカナ/ひらがな・
     記号差を吸収し、スマホでの曖昧な入力でもヒットしやすくする。
     NFKC で半角カナ→全角カナ・全角英数→半角英数を一括変換する。 */
  function normKey(s) {
    var t;
    try { t = String(s).normalize('NFKC'); }
    catch (e) { t = String(s); }
    return t.toLowerCase()
      .replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
      .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
      .replace(/[　\s・･.,，、。\-‐-―ー~〜＆]/g, '');
  }
  function debounce(fn, ms) {
    let t;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), ms);
    };
  }
  /* 最近チェックした出店・アーティストを記録（検索を空にした時に提示） */
  function pushRecent(type, id) {
    const a = state.recent[type];
    if (!a) return;
    const i = a.indexOf(id);
    if (i !== -1) a.splice(i, 1);
    a.unshift(id);
    if (a.length > 12) a.length = 12;
    save('mm2026_recent', state.recent);
  }

  /* ============================================================
     ヘッダー / ナイトモード
  ============================================================ */
  function renderHeader() {
    $('#dayTabs').innerHTML = FESTIVAL.days.map(d =>
      `<button class="day-tab ${d.id === state.day ? 'active' : ''}" data-day="${d.id}">
         <b class="en">${d.label}</b><span>${d.dow}</span></button>`).join('');
    $$('#dayTabs .day-tab').forEach(b => b.onclick = () => {
      state.day = b.dataset.day; renderHeader();
      if (state.view === 'timetable') renderTimetable();
      else if (state.view === 'home') renderHome();
    });
  }
  function tickClock() {
    const n = new Date();
    $('#clock').textContent =
      String(n.getHours()).padStart(2, '0') + ':' +
      String(n.getMinutes()).padStart(2, '0');
  }
  function applyNight() {
    document.body.classList.toggle('night', state.night);
    const b = $('#nightBtn'); if (b) b.textContent = state.night ? '☀️' : '🌙';
    /* ステータスバー色も表示モードに合わせる */
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute('content', state.night ? '#15171c' : '#de1815');
  }

  /* ============================================================
     ビュー切替
  ============================================================ */
  function switchView(v) {
    state.view = v;
    $$('.view').forEach(x => x.classList.toggle('active', x.id === 'view-' + v));
    $$('.tabbar button').forEach(b =>
      b.classList.toggle('active', b.dataset.view === v));
    window.scrollTo(0, 0);
    rerender();
  }
  function rerender() {
    ({ home: renderHome, map: renderMap, timetable: renderTimetable,
       artists: renderArtists, shops: renderShops, myplan: renderMyplan
     }[state.view] || function () {})();
    updateTabBadge();
  }
  function updateTabBadge() {
    const n = state.fav.artists.length + state.fav.shops.length;
    let b = $('#tabBadge');
    const btn = $('.tabbar button[data-view="myplan"]');
    if (!btn) return;
    if (!b) { b = el('span', 'badge'); b.id = 'tabBadge'; btn.appendChild(b); }
    b.textContent = n; b.style.display = n ? '' : 'none';
  }

  /* ============================================================
     ホーム
  ============================================================ */
  function renderHome() {
    const root = $('#view-home');
    root.innerHTML = '';

    /* ヒーロー */
    const hero = el('div', 'hero');
    const st = festivalStatus();
    const d0 = FESTIVAL.days[0], dL = FESTIVAL.days[FESTIVAL.days.length - 1];
    const period = d0.label.replace('/', '.') + ' ' + d0.dow + ' – ' +
                   dL.label.replace('/', '.') + ' ' + dL.dow;
    hero.innerHTML =
      `<div class="hero__dots"></div>
       <h2>${esc(FESTIVAL.name)}</h2>
       <div class="sub">${esc(period)} ／ 蒲郡 ラグーナビーチ</div>
       <div class="venue">${esc(FESTIVAL.venue)}</div>
       <div class="countdown" data-mode="${st.mode}">${countdownInner(st)}</div>`;
    root.appendChild(hero);

    /* 非公式であることの明示（出所混同を避けるための注意書き） */
    root.appendChild(el('div', 'disclaimer',
      'このアプリは森、道、市場のファンが個人的に制作した<b>非公式ガイド</b>です。' +
      '主催・運営とは一切関係ありません。日程・出店・タイムテーブル等の最新かつ正確な情報は、' +
      '必ず <a href="' + FESTIVAL.official +
      '" target="_blank" rel="noopener">公式サイト</a> でご確認ください。'));

    /* 本日のタイムテーブル */
    root.appendChild(secTitle('タイムテーブル', 'TIMETABLE'));
    const tt = el('div', 'card home-tt');
    const ttDay = FESTIVAL.days.find(d => d.id === state.day) || FESTIVAL.days[0];
    tt.innerHTML =
      `<div class="home-tt__row">
         <div><b style="font-size:14px">${ttDay.label} ${ttDay.dow} のタイムテーブル</b>
         <p style="font-size:11px;color:var(--sub)">公式タイムテーブルを見る</p></div>
         <span style="font-size:22px">🕒</span>
       </div>
       <img src="${TIMETABLE[ttDay.id].src}" alt="タイムテーブル" loading="lazy"
         width="${TIMETABLE[ttDay.id].w}" height="${TIMETABLE[ttDay.id].h}">`;
    tt.onclick = () => { state.day = ttDay.id; renderHeader(); switchView('timetable'); };
    root.appendChild(tt);

    /* クイック */
    root.appendChild(secTitle('クイックメニュー', 'MENU'));
    const qg = el('div', 'quick-grid');
    [['🗺️', 'マップ', () => switchView('map')],
     ['🕒', 'タイテ', () => switchView('timetable')],
     ['🎤', '出演者', () => switchView('artists')],
     ['🛍️', '出店', () => switchView('shops')],
     ['⭐', 'マイプラン', () => switchView('myplan')],
     ['🚌', 'アクセス', () => jump('accessCard')],
     ['☔', '天気', () => openUrl(FESTIVAL.weather)],
     ['🎫', 'チケット', () => openUrl(FESTIVAL.links.ticket)]
    ].forEach(q => {
      const b = el('button', 'quick-btn',
        `<div class="ico">${q[0]}</div><div class="lbl">${q[1]}</div>`);
      b.onclick = q[2]; qg.appendChild(b);
    });
    root.appendChild(qg);

    /* アクセス */
    root.appendChild(secTitle('会場アクセス', 'ACCESS'));
    const ac = el('div', 'card'); ac.id = 'accessCard';
    ac.innerHTML = FESTIVAL.access.map(a =>
      `<div class="access-item"><b>${a.icon} ${esc(a.title)}</b>
       <p>${esc(a.detail)}</p><span class="tag-fare">${esc(a.fare)}</span></div>`).join('');
    root.appendChild(ac);

    /* 当日案内 */
    root.appendChild(secTitle('当日の案内', 'INFO'));
    const ic = el('div', 'card');
    ic.innerHTML = INFO.emergency.map(e =>
      `<div class="info-row"><div class="ico">${e.icon}</div>
       <div class="txt"><b>${esc(e.title)}</b><p>${esc(e.text)}</p></div></div>`).join('');
    root.appendChild(ic);

    /* 持ち物チェックリスト */
    root.appendChild(secTitle('持ち物チェックリスト', 'CHECKLIST'));
    const cc = el('div', 'card checklist');
    INFO.checklist.forEach((item, i) => {
      const id = 'chk' + i, done = !!state.checks[id];
      const lab = el('label', done ? 'done' : '',
        `<input type="checkbox" ${done ? 'checked' : ''}><span>${esc(item)}</span>`);
      lab.querySelector('input').onchange = e => {
        state.checks[id] = e.target.checked;
        save('mm2026_checks', state.checks);
        lab.classList.toggle('done', e.target.checked);
      };
      cc.appendChild(lab);
    });
    root.appendChild(cc);

    /* FAQ */
    root.appendChild(secTitle('よくある質問', 'FAQ'));
    const fc = el('div', 'card');
    INFO.faq.forEach(f => {
      const item = el('div', 'faq-item');
      item.innerHTML =
        `<div class="faq-q"><span class="qm">Q</span><span>${esc(f.q)}</span>
         <span class="tgl">＋</span></div>
         <div class="faq-a">${esc(f.a)}</div>`;
      item.querySelector('.faq-q').onclick = () => {
        item.classList.toggle('open');
        item.querySelector('.tgl').textContent =
          item.classList.contains('open') ? '−' : '＋';
      };
      fc.appendChild(item);
    });
    root.appendChild(fc);

    /* 場内ルール */
    root.appendChild(secTitle('場内ルール', 'RULES'));
    const rc = el('div', 'card');
    rc.innerHTML = '<ul style="margin:0;padding-left:18px;font-size:12px;color:var(--sub)">' +
      INFO.rules.map(r => `<li>${esc(r)}</li>`).join('') + '</ul>';
    root.appendChild(rc);

    /* 公式リンク */
    root.appendChild(secTitle('公式リンク', 'OFFICIAL'));
    const lc = el('div', 'card');
    [['公式サイト', FESTIVAL.official],
     ['お知らせ・最新情報', FESTIVAL.links.news],
     ['タイムテーブル（公式）', FESTIVAL.links.timetable],
     ['出店一覧（全店舗）', FESTIVAL.links.market],
     ['チケット', FESTIVAL.links.ticket]
    ].forEach(l => {
      const r = el('div', 'link-row',
        `<span>${esc(l[0])}</span><span class="arr">↗</span>`);
      r.onclick = () => openUrl(l[1]); lc.appendChild(r);
    });
    root.appendChild(lc);
  }
  function jump(id) {
    switchView('home');
    setTimeout(() => {
      const e = document.getElementById(id);
      if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  /* ============================================================
     マップ（ピン＋ショップ名ハイライト）
  ============================================================ */
  const mv = { scale: 1, x: 0, y: 0, innerW: 0, innerH: 0, cw: 0, ch: 0 };
  let mapApply = function () {}, highlightPinsFn = function () {};
  let mapSession = 0;   // 古いマップ描画セッションのコールバックを無効化
  let mapResizeFn = function () {};   // 現行マップのリサイズ処理（リスナー多重登録を防ぐ）

  function renderMap() {
    const root = $('#view-map');
    root.innerHTML = '';

    /* ショップ検索（マップ表示用） */
    const search = el('div', 'map-search');
    search.innerHTML =
      `<div class="searchbar">
         <input type="search" id="mapShopInput" inputmode="search" enterkeyhint="search"
           aria-label="出店名で検索してマップ上に表示"
           placeholder="出店名で検索 → マップ上に表示"
           value="${esc(state.mapShopQuery)}">
       </div>
       <div id="mapShopSug" class="map-sug"></div>`;
    root.appendChild(search);
    const input = $('#mapShopInput');
    input.oninput = e => { state.mapShopQuery = e.target.value; renderMapSug(); };
    input.onfocus = () => { if (!state.mapShopQuery.trim()) renderMapSug(); };

    /* ツールバー：現在地セットボタン（ステージ・入口のピンは廃止して
       マップを見やすくした。ステージ名・ゲートは会場マップ画像に印字済み） */
    const tb = el('div', 'map-toolbar');
    const meBtn = el('button', 'me-btn' + (state.placingMe ? ' active' : ''),
      state.placingMe ? '📍 マップをタップして現在地を指定'
                      : '🧭 現在地をマップに登録');
    meBtn.onclick = () => {
      state.placingMe = !state.placingMe;
      toast(state.placingMe ? 'マップをタップして現在地をセット' : '現在地モード解除');
      renderMap();
    };
    tb.appendChild(meBtn);
    root.appendChild(tb);

    /* マイプラン動線表示中バナー（行きたい出店が0件なら通常表示に戻す） */
    if (state.planMode && !SHOPS.some(s => isFav('shops', s.id))) {
      state.planMode = false;
    }
    if (state.planMode) {
      const favShops = SHOPS.filter(s => isFav('shops', s.id));
      const sc = el('div', 'map-selected map-selected--plan');
      sc.innerHTML =
        `<span class="ico">🗺️</span>
         <div class="t"><b>マイプランの出店 ${favShops.length}店を表示中</b>
         <p>エリアごとのピンで回る順番を考えられます</p></div>
         <button class="x" aria-label="解除">✕</button>`;
      sc.querySelector('.x').onclick = () => { state.planMode = false; renderMap(); };
      root.appendChild(sc);
    } else if (state.highlightShop) {
      /* 選択中ショップ表示 */
      const s = SHOPS.find(x => x.id === state.highlightShop);
      if (s) {
        const sc = el('div', 'map-selected');
        sc.innerHTML =
          `<span class="ico">${s.catIcon}</span>
           <div class="t"><b>${esc(s.name)}</b>
           <p>📍 ${esc(shortName(s.zoneName))}${s.booth ?
             ' ／ 公式マップ ' + s.booth + '番ブース' : ''}</p></div>
           <button class="x">✕</button>`;
        sc.querySelector('.x').onclick = () => {
          state.highlightShop = null; renderMap();
        };
        root.appendChild(sc);
      }
    }

    /* マップ本体 */
    const wrap = el('div', 'map-wrap');
    wrap.innerHTML =
      `<div class="map-canvas" id="mapCanvas">
         <div class="map-inner" id="mapInner"><img src="${MAP.img}" alt="会場マップ" id="mapImg">
           <svg id="areaSvg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg></div>
         <div id="pinLayer"></div>
         <div class="map-zoom">
           <button id="zIn">＋</button><button id="zOut">－</button>
           <button id="zReset" style="font-size:14px">⟳</button>
         </div>
       </div>`;
    root.appendChild(wrap);

    root.appendChild(el('div', 'map-hint', state.planMode
      ? 'マイプランに登録した出店を、エリアごとの📍ピンで表示しています。下の一覧で店をタップすると、その店の詳しい位置を確認できます。'
      : 'ステージ名・入口・トイレなどは会場マップ画像に印字されています。出店名で検索すると、その店の「店名」「出店一覧のエリア名」「会場マップ上のエリアの場所」の3点をマーキングします。ピンチ／ダブルタップで拡大できます。'));

    const zp = el('div'); zp.id = 'zonePanel';
    root.appendChild(zp);

    setupMap();
    if (state.planMode) renderPlanPanel();
    else renderZonePanel();
  }

  function renderMapSug() {
    const box = $('#mapShopSug'); if (!box) return;
    const nq = normKey(state.mapShopQuery);
    box.innerHTML = '';
    let list, isRecent = false;
    if (!nq) {
      /* 未入力時は最近チェックした出店を提示 */
      list = state.recent.shops
        .map(id => SHOPS.find(s => s.id === id)).filter(Boolean).slice(0, 6);
      isRecent = true;
      if (!list.length) return;
      box.appendChild(el('div', 'map-sug__head', '最近チェックした出店'));
    } else {
      list = SHOPS.filter(s => s.nk.indexOf(nq) !== -1).slice(0, 10);
    }
    list.forEach(s => {
      const r = el('div', 'map-sug__item',
        `<span>${s.catIcon} ${esc(s.name)}</span>
         <span class="map-sug__zone">${esc(shortName(s.zoneName))}</span>`);
      r.onclick = () => {
        pushRecent('shops', s.id);
        state.highlightShop = s.id;
        state.mapShopQuery = '';
        state.selectedZone = null;
        state.planMode = false;
        renderMap();   // setupMap の ready() が highlightShop を見て自動フォーカス
      };
      box.appendChild(r);
    });
    if (!isRecent && !list.length)
      box.innerHTML = '<div class="map-sug__empty">該当する出店がありません</div>';
  }

  function setupMap() {
    const canvas = $('#mapCanvas'), inner = $('#mapInner'),
          img = $('#mapImg'), layer = $('#pinLayer');
    const session = ++mapSession;          // このセッションのID
    const live = () => session === mapSession && document.body.contains(canvas);

    function measure() {
      if (!live()) return;
      mv.cw = canvas.clientWidth;
      mv.ch = canvas.clientHeight;
      mv.innerW = mv.cw;
      mv.innerH = img.clientHeight || mv.cw * 1.414;
    }
    function clamp() {
      mv.scale = Math.min(6, Math.max(1, mv.scale));
      const maxX = mv.innerW * mv.scale - mv.cw;
      const maxY = mv.innerH * mv.scale - mv.ch;
      mv.x = Math.min(0, Math.max(-Math.max(0, maxX), mv.x));
      mv.y = Math.min(0, Math.max(-Math.max(0, maxY), mv.y));
    }
    function apply() {
      clamp();
      inner.style.transform = `translate(${mv.x}px,${mv.y}px) scale(${mv.scale})`;
      placeMarkers();
    }
    function placeMarkers() {
      $$('#pinLayer .pin').forEach(p => {
        const zx = +p.dataset.zx, zy = +p.dataset.zy;
        const sx = mv.x + (zx / 100 * mv.innerW) * mv.scale;
        const sy = mv.y + (zy / 100 * mv.innerH) * mv.scale;
        p.style.left = sx + 'px'; p.style.top = sy + 'px';
        /* 横長ラベルのピン（選択中ショップ・エリア・マイプラン）は
           余白を大きく取り、画面端で誤って消えないようにする */
        const wide = p.classList.contains('pin--shop') ||
                     p.classList.contains('pin--area-loc') ||
                     p.classList.contains('pin--plan');
        const mx = wide ? 210 : 60, mtop = wide ? 90 : 10;
        p.style.display = (sx < -mx || sx > mv.cw + mx ||
                           sy < -mtop || sy > mv.ch + 60) ? 'none' : '';
      });
    }
    function buildMarkers() {
      layer.innerHTML = '';
      /* 選択中ショップ：会場マップ上に3点マーキング
         (1) 出店一覧の店名を赤枠  (2) 出店一覧のエリア名見出しを丸囲み
         (3) 中央地図のエリア名（実際の場所）を丸囲み */
      drawAreaMark(state.highlightShop
        ? SHOPS.find(x => x.id === state.highlightShop) : null);
      /* ステージ・入口のピンは廃止（会場マップ画像に名称が印字済みで、
         ピンが多いと地図が見づらくなるため）。 */
      if (state.mePin) {
        const p = el('div', 'pin pin--me',
          `<div class="pin__dot"><span>🙋</span></div>
           <div class="pin__label">現在地</div>`);
        p.dataset.zx = state.mePin.x; p.dataset.zy = state.mePin.y;
        layer.appendChild(p);
      }
      /* マイプラン：行きたい出店をエリアごとにピン表示（動線設計用） */
      if (state.planMode) {
        const byZone = {};
        SHOPS.filter(s => isFav('shops', s.id)).forEach(s => {
          (byZone[s.zone] = byZone[s.zone] || []).push(s);
        });
        Object.keys(byZone).forEach(zone => {
          const venue = ZONE_VENUE[zone];
          if (!venue) return;
          const list = byZone[zone];
          const pp = el('div', 'pin pin--plan',
            `<div class="plan-pin__dot"><span>${list.length}</span></div>
             <div class="plan-pin__label">${esc(shortName(list[0].zoneName))}</div>`);
          pp.dataset.zx = venue[0] + venue[2] / 2;
          pp.dataset.zy = venue[1] + venue[3] / 2;
          layer.appendChild(pp);
        });
      }
      /* 選択中ショップ：固定サイズのピン（どの縮尺でも見える）。
         - エリアピン：そのエリアが会場マップ上のどこにあるかを指す
         - 店名ピン：出店一覧上の店名を指す */
      if (state.highlightShop) {
        const s = SHOPS.find(x => x.id === state.highlightShop);
        if (s) {
          const venue = ZONE_VENUE[s.zone];
          if (venue) {
            const ap = el('div', 'pin pin--area-loc',
              `<div class="area-pin__body">📍 ${esc(shortName(s.zoneName))}</div>
               <div class="area-pin__tip"></div>`);
            ap.dataset.zx = venue[0] + venue[2] / 2;
            ap.dataset.zy = venue[1] + venue[3] / 2;
            layer.appendChild(ap);
          }
          const sp = el('div', 'pin pin--shop',
            `<div class="shop-pin__body">${s.catIcon} ${
               s.booth ? '<b>' + s.booth + '</b> ' : ''}${esc(s.name)}</div>
             <div class="shop-pin__tip"></div>`);
          sp.dataset.zx = s.mx + s.mw / 2;   // 店名の中心を指す
          sp.dataset.zy = s.my + s.mh / 2;
          layer.appendChild(sp);
        }
      }
      placeMarkers();
    }
    function highlightPins() {
      $$('#pinLayer .pin').forEach(p => {
        const z = p.dataset.zone;
        p.classList.toggle('active', z && z === state.selectedZone);
        p.classList.toggle('dimmed', !!state.selectedZone && !!z && z !== state.selectedZone);
      });
    }

    function ready() {
      if (!live()) return;
      /* ステージ選択時のみ寄る。ショップ検索時は自動ズームせず全体表示のまま */
      if (!state.selectedZone) { mv.scale = 1; mv.x = 0; mv.y = 0; }
      measure(); buildMarkers(); apply();
      if (state.selectedZone) focusZone(state.selectedZone, false);
    }
    /* 画像読み込み＋レイアウト確定を待ってから初期化（寸法0バグ防止）。
       setTimeout を使う＝バックグラウンドタブでも確実に発火（rAFは停止する） */
    let tries = 0, done = false;
    function start() {
      if (!live() || done) return;
      if ((!canvas.clientWidth || !img.complete) && tries++ < 120) {
        setTimeout(start, 50); return;
      }
      done = true;
      ready();
    }
    setTimeout(start, 0);
    img.addEventListener('load', () => { tries = 0; setTimeout(start, 0); });
    img.addEventListener('error', () => setTimeout(start, 0));
    /* リサイズ処理は現行セッションのものだけ（window リスナーは init で1個だけ登録） */
    mapResizeFn = () => { if (live()) { measure(); apply(); } };

    function zoomAt(cx, cy, f) {
      const ns = Math.min(6, Math.max(1, mv.scale * f));
      const k = ns / mv.scale;
      mv.x = cx - (cx - mv.x) * k;
      mv.y = cy - (cy - mv.y) * k;
      mv.scale = ns; apply();
    }
    $('#zIn').onclick = () => zoomAt(mv.cw / 2, mv.ch / 2, 1.6);
    $('#zOut').onclick = () => zoomAt(mv.cw / 2, mv.ch / 2, 1 / 1.6);
    $('#zReset').onclick = () => {
      mv.scale = 1; mv.x = 0; mv.y = 0;
      const wasPlan = state.planMode;
      state.selectedZone = null; state.highlightShop = null;
      state.planMode = false;
      if (wasPlan) { renderMap(); return; }
      buildMarkers(); apply(); highlightPins(); renderZonePanel();
    };
    mapApply = apply; highlightPinsFn = highlightPins;

    /* タッチ操作 */
    let drag = false, sx = 0, sy = 0, ox = 0, oy = 0;
    let pinchD = 0, pinchS = 1, pinchCx = 0, pinchCy = 0, lastTap = 0, moved = false;
    function dist(e) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    canvas.addEventListener('touchstart', e => {
      moved = false;
      if (e.touches.length === 1) {
        drag = true;
        sx = e.touches[0].clientX; sy = e.touches[0].clientY;
        ox = mv.x; oy = mv.y;
      } else if (e.touches.length === 2) {
        drag = false; pinchD = Math.max(1, dist(e)); pinchS = mv.scale;
        const r = canvas.getBoundingClientRect();
        pinchCx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
        pinchCy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
      }
    }, { passive: true });
    canvas.addEventListener('touchmove', e => {
      moved = true;
      if (drag && e.touches.length === 1) {
        mv.x = ox + (e.touches[0].clientX - sx);
        mv.y = oy + (e.touches[0].clientY - sy);
        apply();
      } else if (e.touches.length === 2) {
        const ns = Math.min(6, Math.max(1, pinchS * (dist(e) / pinchD)));
        const k = ns / mv.scale;
        mv.x = pinchCx - (pinchCx - mv.x) * k;
        mv.y = pinchCy - (pinchCy - mv.y) * k;
        mv.scale = ns; apply();
      }
    }, { passive: true });
    canvas.addEventListener('touchend', () => { drag = false; });

    canvas.addEventListener('click', e => {
      /* ズームボタン・ピンのクリックは無視（バブリング誤爆防止） */
      if (e.target.closest('.map-zoom') || e.target.closest('.pin')) return;
      /* ドラッグ直後のクリックはダブルタップ判定しない */
      if (moved) { moved = false; return; }
      const r = canvas.getBoundingClientRect();
      const cx = e.clientX - r.left, cy = e.clientY - r.top;
      if (state.placingMe) {
        const zx = (cx - mv.x) / mv.scale / mv.innerW * 100;
        const zy = (cy - mv.y) / mv.scale / mv.innerH * 100;
        state.mePin = { x: Math.max(0, Math.min(100, zx)),
                        y: Math.max(0, Math.min(100, zy)) };
        save('mm2026_me', state.mePin);
        state.placingMe = false;
        toast('現在地をセットしました');
        renderMap();
        return;
      }
      const now = Date.now();
      if (now - lastTap < 300) zoomAt(cx, cy, mv.scale > 1.5 ? 0.45 : 2.4);
      lastTap = now;
    });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.2 : 1 / 1.2);
    }, { passive: false });
  }

  function shortName(n) {
    return n.replace(/（.*?）/g, '').replace(/ STAGE| GATE/gi, '')
            .replace('MORI MICHI ', '').replace(' by Purveyors', '').trim();
  }

  /* 選択中ショップを会場マップ上に3点マーキング。
     SVG (#areaSvg) は #mapInner 内にあり、マップと一緒に拡縮される。
     viewBox 0-100 ＝ マップの正規化座標(%)。 */
  function ellipseSVG(box, cls, padX, padY) {
    const cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2;
    const rx = box[2] / 2 + padX, ry = box[3] / 2 + padY;
    return '<ellipse class="' + cls + '" cx="' + cx.toFixed(2) +
      '" cy="' + cy.toFixed(2) + '" rx="' + rx.toFixed(2) +
      '" ry="' + ry.toFixed(2) + '"/>';
  }
  function drawAreaMark(s) {
    const svg = document.getElementById('areaSvg');
    if (!svg) return;
    if (!s) { svg.innerHTML = ''; return; }
    let html = '';
    const venue = ZONE_VENUE[s.zone];
    const head = ZONE_LABEL_LIST[s.zone];
    /* 中央地図のエリア名と出店一覧の見出しが同じ位置なら丸は1つだけ
       （二重円による誤解を避ける） */
    const sameSpot = venue && head &&
      Math.abs(venue[0] - head[0]) < 0.6 && Math.abs(venue[1] - head[1]) < 0.6;
    /* (3) そのエリアが会場マップ上のどこにあるか：中央地図のエリア名を丸囲み */
    if (venue && !sameSpot)
      html += ellipseSVG(venue, 'area-circle area-circle--venue', 2.6, 2.1);
    /* (2) その店名が記載されているエリア名：出店一覧の見出しを丸囲み */
    if (head) html += ellipseSVG(head, 'area-circle area-circle--list', 1.4, 1.6);
    /* (1) 店名が記載されている部分：出店一覧の店名を赤枠で囲う。
       高さは複数行抽出の異常値に備えて上限を設ける（近隣店への被り防止）。 */
    const pad = 0.4, boxH = Math.min(s.mh, 1.3);
    html += '<rect class="area-namebox" x="' + (s.mx - pad).toFixed(2) +
      '" y="' + (s.my - pad).toFixed(2) +
      '" width="' + (s.mw + pad * 2).toFixed(2) +
      '" height="' + (boxH + pad * 2).toFixed(2) + '" rx="0.5"/>';
    svg.innerHTML = html;
  }

  function focusZone(zoneId, animate) {
    const z = ZONE_BY_ID[zoneId];
    if (!z || !mv.cw) return;
    flyTo(z.x, z.y, z.type === 'stage' ? 2.4 : 2.8, animate);
    highlightPinsFn();
  }
  function focusShop(shopId) {
    const s = SHOPS.find(x => x.id === shopId);
    if (!s || !mv.cw) return;
    const box = ZONE_BOX[s.zone];
    if (box) {
      /* エリア全体（出店一覧ブロック）が収まるように寄る */
      const bw = box.x1 - box.x0, bh = box.y1 - box.y0;
      let scale = Math.min(78 / Math.max(bh, 1), 90 / Math.max(bw, 1));
      scale = Math.max(1.7, Math.min(4.5, scale));
      flyTo((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2, scale, true);
    } else {
      flyTo(s.mx + s.mw / 2, s.my + s.mh / 2, 3.6, true);
    }
  }
  function flyTo(px, py, scale, animate) {
    mv.scale = scale;
    mv.x = mv.cw / 2 - px / 100 * mv.innerW * mv.scale;
    mv.y = mv.ch / 2 - py / 100 * mv.innerH * mv.scale;
    if (animate) {
      const inner = $('#mapInner');
      if (inner) {
        const sess = mapSession;
        inner.style.transition = 'transform .4s ease';
        setTimeout(() => {
          const i = $('#mapInner');
          if (i && sess === mapSession) i.style.transition = '';
        }, 430);
      }
    }
    mapApply();
  }

  function renderZonePanel() {
    const zp = $('#zonePanel');
    if (!zp) return;
    if (!state.selectedZone) { zp.innerHTML = ''; return; }
    const z = ZONE_BY_ID[state.selectedZone];
    const shops = SHOPS.filter(s => s.zone === z.id);
    const typeLabel = z.type === 'stage' ? 'ステージ' :
                      z.type === 'gate' ? '入退場ゲート' : '出店エリア';
    zp.innerHTML = `<div class="card zone-panel">
      <div class="zone-panel__head">
        <span style="font-size:22px">${z.type === 'stage' ? '🎵' :
          z.type === 'gate' ? '🚪' : '🛍️'}</span>
        <b>${esc(z.name)}</b></div>
      <div style="font-size:11px;color:var(--sub);font-weight:700;margin-bottom:4px">
        ${typeLabel}</div></div>`;
    const card = zp.querySelector('.zone-panel');
    if (shops.length) {
      card.appendChild(el('div', null,
        `<div style="font-size:11.5px;font-weight:800;margin:8px 0 2px">
         このエリアの出店（${shops.length}）— タップでマップ表示</div>`));
      shops.forEach(s => {
        const row = el('div', 'zone-shop',
          `<span class="ico">${s.catIcon}</span>
           <span class="nm">${esc(s.name)}</span><span class="arr">›</span>`);
        row.onclick = () => {
          pushRecent('shops', s.id);
          state.highlightShop = s.id; state.selectedZone = null;
          renderMap();
        };
        card.appendChild(row);
      });
    } else if (z.type === 'stage') {
      card.appendChild(el('div', 'now-empty',
        'このステージの出演はタイムテーブルでご確認ください。'));
    } else if (z.type === 'gate') {
      card.appendChild(el('div', 'now-empty',
        '入退場・再入場に使うゲートです。リストバンドをご用意ください。'));
    } else {
      card.appendChild(el('div', 'now-empty',
        'このエリアの出店は会場マップ・公式サイトでご確認ください。'));
    }
  }

  /* マイプラン動線パネル：行きたい出店をエリアごとに一覧表示する */
  function renderPlanPanel() {
    const zp = $('#zonePanel');
    if (!zp) return;
    const favShops = SHOPS.filter(s => isFav('shops', s.id));
    if (!favShops.length) {
      zp.innerHTML = '<div class="card"><div class="now-empty">' +
        'マイプランに行きたい出店がありません。出店ページで★を付けると、' +
        'ここに会場内の動線が表示されます。</div></div>';
      return;
    }
    /* エリアごとにまとめる（出店一覧の並び順を保つ） */
    const byZone = {}, order = [];
    favShops.forEach(s => {
      if (!byZone[s.zone]) { byZone[s.zone] = []; order.push(s.zone); }
      byZone[s.zone].push(s);
    });
    zp.innerHTML =
      `<div class="card zone-panel">
         <div class="zone-panel__head"><span style="font-size:22px">🗺️</span>
           <b>マイプランの動線</b></div>
         <div style="font-size:11px;color:var(--sub);font-weight:700;margin-bottom:4px">
           行きたい出店 ${favShops.length}店／${order.length}エリア — 店名タップで詳しい位置へ</div>
       </div>`;
    const card = zp.querySelector('.zone-panel');
    order.forEach(zone => {
      const list = byZone[zone];
      card.appendChild(el('div', null,
        `<div style="font-size:11.5px;font-weight:800;margin:10px 0 2px">
         📍 ${esc(shortName(list[0].zoneName))}（${list.length}）</div>`));
      list.forEach(s => {
        const row = el('div', 'zone-shop',
          `<span class="ico">${s.catIcon}</span>
           <span class="nm">${esc(s.name)}</span><span class="arr">›</span>`);
        row.onclick = () => {
          pushRecent('shops', s.id);
          state.planMode = false;
          state.highlightShop = s.id;
          state.selectedZone = null;
          renderMap();
        };
        card.appendChild(row);
      });
    });
  }

  /* ============================================================
     タイムテーブル（公式画像）
  ============================================================ */
  function renderTimetable() {
    const root = $('#view-timetable');
    root.innerHTML = '';
    const d = FESTIVAL.days.find(x => x.id === state.day);
    root.appendChild(el('div', 'notice',
      'ℹ️ 公式発表のタイムテーブルです。最新版は ' +
      '<a href="' + FESTIVAL.links.timetable + '" target="_blank" rel="noopener">' +
      '公式サイト</a> もご確認ください。'));
    root.appendChild(secTitle(d.label + ' ' + d.dow + ' タイムテーブル', 'TIMETABLE'));
    root.appendChild(el('div', 'map-hint',
      'ピンチ／ダブルタップ／＋－ボタンで拡大できます。'));

    const tt = TIMETABLE[d.id];
    const wrap = el('div', 'map-wrap');
    /* キャンバス側で縦横比を確保（レイアウトシフト防止）。
       画像自体には width/height 属性を付けない＝ズーム用 .map-inner
       （絶対配置）内で画像が固定サイズになり比率が崩れるのを防ぐ。 */
    wrap.innerHTML =
      `<div class="map-canvas tt-canvas" id="ttCanvas" style="aspect-ratio:${tt.w} / ${tt.h}">
         <div class="map-inner" id="ttInner"><img src="${tt.src}" alt="タイムテーブル" id="ttImg"></div>
         <div class="map-zoom">
           <button id="ttIn">＋</button><button id="ttOut">－</button>
           <button id="ttReset" style="font-size:14px">⟳</button>
         </div>
       </div>`;
    root.appendChild(wrap);
    mountZoom('ttCanvas', 'ttInner', 'ttImg', 'ttIn', 'ttOut', 'ttReset');
  }

  /* 汎用：画像のズーム＆パン */
  function mountZoom(canvasId, innerId, imgId, inId, outId, resetId) {
    const canvas = $('#' + canvasId), inner = $('#' + innerId), img = $('#' + imgId);
    const v = { scale: 1, x: 0, y: 0, iw: 0, ih: 0, cw: 0, ch: 0 };
    function measure() {
      v.cw = canvas.clientWidth; v.ch = canvas.clientHeight;
      v.iw = v.cw; v.ih = img.clientHeight || v.cw;
    }
    function clamp() {
      v.scale = Math.min(6, Math.max(1, v.scale));
      v.x = Math.min(0, Math.max(-(Math.max(0, v.iw * v.scale - v.cw)), v.x));
      v.y = Math.min(0, Math.max(-(Math.max(0, v.ih * v.scale - v.ch)), v.y));
    }
    function apply() {
      clamp();
      inner.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.scale})`;
    }
    function zoomAt(cx, cy, f) {
      const ns = Math.min(6, Math.max(1, v.scale * f));
      const k = ns / v.scale;
      v.x = cx - (cx - v.x) * k; v.y = cy - (cy - v.y) * k;
      v.scale = ns; apply();
    }
    /* 画像の縦横比にキャンバスを合わせ、全体が見切れず収まるようにする */
    function fit() {
      if (img.naturalWidth && img.naturalHeight) {
        canvas.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
      }
    }
    let tTries = 0, tDone = false;
    function start() {
      if (tDone) return;
      if ((!canvas.clientWidth || !img.complete) && tTries++ < 120) {
        setTimeout(start, 50); return;
      }
      tDone = true;
      fit(); measure(); apply();
    }
    setTimeout(start, 0);
    img.addEventListener('load', () => { tTries = 0; tDone = false; setTimeout(start, 0); });
    img.addEventListener('error', () => setTimeout(start, 0));
    $('#' + inId).onclick = () => zoomAt(v.cw / 2, v.ch / 2, 1.6);
    $('#' + outId).onclick = () => zoomAt(v.cw / 2, v.ch / 2, 1 / 1.6);
    $('#' + resetId).onclick = () => { v.scale = 1; v.x = 0; v.y = 0; apply(); };

    let drag = false, sx = 0, sy = 0, ox = 0, oy = 0, moved = false;
    let pd = 0, ps = 1, pcx = 0, pcy = 0, lastTap = 0;
    function dist(e) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    canvas.addEventListener('touchstart', e => {
      moved = false;
      if (e.touches.length === 1) {
        drag = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
        ox = v.x; oy = v.y;
      } else if (e.touches.length === 2) {
        drag = false; pd = Math.max(1, dist(e)); ps = v.scale;
        const r = canvas.getBoundingClientRect();
        pcx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
        pcy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
      }
    }, { passive: true });
    canvas.addEventListener('touchmove', e => {
      moved = true;
      if (drag && e.touches.length === 1) {
        v.x = ox + (e.touches[0].clientX - sx);
        v.y = oy + (e.touches[0].clientY - sy); apply();
      } else if (e.touches.length === 2) {
        const ns = Math.min(6, Math.max(1, ps * (dist(e) / pd)));
        const k = ns / v.scale;
        v.x = pcx - (pcx - v.x) * k; v.y = pcy - (pcy - v.y) * k;
        v.scale = ns; apply();
      }
    }, { passive: true });
    canvas.addEventListener('touchend', () => { drag = false; });
    canvas.addEventListener('click', e => {
      if (e.target.closest('.map-zoom')) return;
      if (moved) { moved = false; return; }
      const r = canvas.getBoundingClientRect();
      const now = Date.now();
      if (now - lastTap < 300)
        zoomAt(e.clientX - r.left, e.clientY - r.top, v.scale > 1.5 ? 0.4 : 2.4);
      lastTap = now;
    });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.2 : 1 / 1.2);
    }, { passive: false });
  }

  /* ============================================================
     アーティスト
  ============================================================ */
  function renderArtists() {
    const root = $('#view-artists');
    root.innerHTML = '';
    const sb = el('div', 'searchbar');
    sb.innerHTML = `<input type="search" inputmode="search" enterkeyhint="search"
      placeholder="アーティスト名で検索（かな・英字どちらでも）"
      aria-label="アーティスト名で検索" value="${esc(state.artistQuery)}">`;
    const artistSearch = debounce(renderArtistList, 160);
    sb.querySelector('input').oninput = e => {
      state.artistQuery = e.target.value; artistSearch();
    };
    root.appendChild(sb);
    root.appendChild(el('div', 'notice',
      'ℹ️ 出演日・ステージ・時間は ' +
      '<a href="' + FESTIVAL.links.timetable + '" target="_blank" rel="noopener">' +
      'タイムテーブル</a> でご確認ください。'));
    const w = el('div'); w.id = 'artistListWrap';
    root.appendChild(w);
    renderArtistList();
  }
  function artistTile(a) {
    const t = el('div', 'tile',
      `<div class="tile__cat">🎤</div>
       <div class="tile__name">${esc(a.name)}</div>
       <div class="tile__meta">出演アーティスト</div>
       <button class="tile__fav" aria-label="お気に入り">${
         isFav('artists', a.id) ? '★' : '☆'}</button>`);
    t.onclick = () => openArtist(a.id);
    t.querySelector('.tile__fav').onclick = e => {
      e.stopPropagation();
      toast(toggleFav('artists', a.id) ? '★ マイプランに追加' : 'マイプランから削除');
      saveFav(); renderArtistList(); updateTabBadge();
    };
    return t;
  }
  function renderArtistList() {
    const w = $('#artistListWrap'); if (!w) return;
    const nq = normKey(state.artistQuery);
    let list = ARTISTS.filter(a => !nq || a.nk.indexOf(nq) !== -1);
    w.innerHTML = '';
    if (!nq) {
      const rec = state.recent.artists
        .map(id => ARTISTS.find(a => a.id === id)).filter(Boolean);
      if (rec.length) {
        w.appendChild(el('div', 'list-count', '最近チェックしたアーティスト'));
        const rg = el('div', 'list-grid');
        rec.slice(0, 6).forEach(a => rg.appendChild(artistTile(a)));
        w.appendChild(rg);
        w.appendChild(el('div', 'list-count', '全出演者 ' + list.length + ' 組'));
      } else {
        w.appendChild(el('div', 'list-count', list.length + ' 組'));
      }
    } else {
      w.appendChild(el('div', 'list-count', list.length + ' 組'));
    }
    if (!list.length) {
      w.appendChild(el('div', 'empty',
        '<div class="big">🔍</div>「' + esc(state.artistQuery.trim()) +
        '」に一致する出演者はいません'));
      return;
    }
    const g = el('div', 'list-grid');
    list.forEach(a => g.appendChild(artistTile(a)));
    w.appendChild(g);
  }

  /* ============================================================
     出店ショップ
  ============================================================ */
  function renderShops() {
    const root = $('#view-shops');
    root.innerHTML = '';
    const sb = el('div', 'searchbar');
    sb.innerHTML = `<input type="search" inputmode="search" enterkeyhint="search"
      placeholder="出店名で検索（かな・英字どちらでも）"
      aria-label="出店名で検索" value="${esc(state.shopQuery)}">`;
    const shopSearch = debounce(renderShopList, 160);
    sb.querySelector('input').oninput = e => {
      state.shopQuery = e.target.value; shopSearch();
    };
    root.appendChild(sb);
    const chips = el('div', 'chips');
    [['all', 'すべて'], ['food', '🍜 フード'], ['drink', '🍺 ドリンク'],
     ['sweets', '🍩 スイーツ'], ['goods', '🛍️ 雑貨'], ['art', '🎨 アート']]
      .forEach(c => {
        const ch = el('button', 'chip' + (c[0] === state.shopCat ? ' active' : ''), c[1]);
        ch.onclick = () => { state.shopCat = c[0]; renderShops(); };
        chips.appendChild(ch);
      });
    root.appendChild(chips);
    root.appendChild(el('div', 'notice',
      'ℹ️ 出店をタップ →「マップで見る」で、店名・出店一覧のエリア名・中央地図上のエリアの場所をマーキングします。' +
      '公式では1000店舗以上が出店。全店舗は <a href="' + FESTIVAL.links.market +
      '" target="_blank" rel="noopener">公式サイト</a> へ。'));
    const w = el('div'); w.id = 'shopListWrap';
    root.appendChild(w);
    renderShopList();
  }
  function shopTile(s) {
    const t = el('div', 'tile',
      `<div class="tile__cat">${s.catIcon}</div>
       <div class="tile__name">${esc(s.name)}</div>
       <div class="tile__meta">📍 ${esc(shortName(s.zoneName))}</div>
       <button class="tile__fav" aria-label="お気に入り">${
         isFav('shops', s.id) ? '★' : '☆'}</button>`);
    t.onclick = () => openShop(s.id);
    t.querySelector('.tile__fav').onclick = e => {
      e.stopPropagation();
      toast(toggleFav('shops', s.id) ? '★ マイプランに追加' : 'マイプランから削除');
      saveFav(); renderShopList(); updateTabBadge();
    };
    return t;
  }
  function renderShopList() {
    const w = $('#shopListWrap'); if (!w) return;
    const nq = normKey(state.shopQuery);
    let list = SHOPS.slice();
    if (state.shopCat !== 'all') list = list.filter(s => s.cat === state.shopCat);
    if (nq) list = list.filter(s => s.nk.indexOf(nq) !== -1);
    w.innerHTML = '';
    /* 検索が空のときは「最近チェックした出店」を上部に提示 */
    if (!nq) {
      const rec = state.recent.shops
        .map(id => SHOPS.find(s => s.id === id))
        .filter(s => s && (state.shopCat === 'all' || s.cat === state.shopCat));
      if (rec.length) {
        w.appendChild(el('div', 'list-count', '最近チェックした出店'));
        const rg = el('div', 'list-grid');
        rec.slice(0, 6).forEach(s => rg.appendChild(shopTile(s)));
        w.appendChild(rg);
        w.appendChild(el('div', 'list-count', 'すべての出店 ' + list.length + ' 店'));
      } else {
        w.appendChild(el('div', 'list-count', list.length + ' 店'));
      }
    } else {
      w.appendChild(el('div', 'list-count', list.length + ' 店'));
    }
    if (!list.length) {
      w.appendChild(el('div', 'empty',
        '<div class="big">🔍</div>「' + esc(state.shopQuery.trim()) +
        '」に一致する出店はありません'));
      return;
    }
    const g = el('div', 'list-grid');
    list.forEach(s => g.appendChild(shopTile(s)));
    w.appendChild(g);
  }

  /* ============================================================
     マイプラン
  ============================================================ */
  function renderMyplan() {
    const root = $('#view-myplan');
    root.innerHTML = '';
    const tabs = el('div', 'seg-tabs');
    [['artists', '⭐ 観たい出演者', state.fav.artists.length],
     ['shops', '🛍️ 行きたい出店', state.fav.shops.length]
    ].forEach(t => {
      const b = el('button', t[0] === state.myplanTab ? 'active' : '',
        t[1] + ' (' + t[2] + ')');
      b.onclick = () => { state.myplanTab = t[0]; renderMyplan(); };
      tabs.appendChild(b);
    });
    root.appendChild(tabs);

    if (state.myplanTab === 'artists') {
      const favs = ARTISTS.filter(a => isFav('artists', a.id));
      if (!favs.length) {
        root.appendChild(el('div', 'empty',
          '<div class="big">⭐</div>観たい出演者を登録すると<br>ここに一覧表示されます'));
        return;
      }
      root.appendChild(el('div', 'notice',
        'ℹ️ 出演時間は ' +
        '<a href="' + FESTIVAL.links.timetable + '" target="_blank" rel="noopener">' +
        'タイムテーブル</a> で確認できます。'));
      const g = el('div', 'list-grid');
      favs.forEach(a => {
        const t = el('div', 'tile',
          `<div class="tile__cat">🎤</div>
           <div class="tile__name">${esc(a.name)}</div>
           <div class="tile__meta">出演アーティスト</div>
           <button class="tile__fav">★</button>`);
        t.onclick = () => openArtist(a.id);
        t.querySelector('.tile__fav').onclick = e => {
          e.stopPropagation(); toggleFav('artists', a.id); saveFav();
          toast('マイプランから削除'); renderMyplan(); updateTabBadge();
        };
        g.appendChild(t);
      });
      root.appendChild(g);
    } else {
      const favs = SHOPS.filter(s => isFav('shops', s.id));
      if (!favs.length) {
        root.appendChild(el('div', 'empty',
          '<div class="big">🛍️</div>行きたい出店を登録すると<br>ここに一覧表示されます'));
        return;
      }
      const planBtn = el('button', 'plan-map-btn',
        '🗺️ 行きたい出店をマップで動線確認');
      planBtn.onclick = () => {
        state.planMode = true;
        state.highlightShop = null;
        state.selectedZone = null;
        switchView('map');
      };
      root.appendChild(planBtn);
      const g = el('div', 'list-grid');
      favs.forEach(s => {
        const t = el('div', 'tile',
          `<div class="tile__cat">${s.catIcon}</div>
           <div class="tile__name">${esc(s.name)}</div>
           <div class="tile__meta">📍 ${esc(shortName(s.zoneName))}</div>
           <button class="tile__fav">★</button>`);
        t.onclick = () => openShop(s.id);
        t.querySelector('.tile__fav').onclick = e => {
          e.stopPropagation(); toggleFav('shops', s.id); saveFav();
          toast('マイプランから削除'); renderMyplan(); updateTabBadge();
        };
        g.appendChild(t);
      });
      root.appendChild(g);
    }
  }

  /* ============================================================
     モーダル
  ============================================================ */
  let modalOpen = false, modalLastFocus = null;
  function openModal(html) {
    const body = $('#modalBody'), bg = $('#modalBg');
    body.innerHTML = html;
    modalLastFocus = document.activeElement;
    bg.classList.add('open');
    /* Android のハードウェア戻る / iOS スワイプバックで閉じられるよう履歴に積む */
    if (!modalOpen) {
      modalOpen = true;
      try { history.pushState({ modal: 1 }, ''); } catch (e) {}
    }
    /* フォーカスをモーダル内へ移す（キーボード／スクリーンリーダー対応） */
    const first = body.querySelector('button, a, input');
    if (first) setTimeout(() => { try { first.focus(); } catch (e) {} }, 30);
  }
  /* fromPop=true は popstate 由来（履歴は既に戻っている）。
     ユーザー操作（×ボタン等）由来は履歴を1つ戻して整合させる。 */
  function closeModal(fromPop) {
    const bg = $('#modalBg');
    if (!bg.classList.contains('open')) return;
    bg.classList.remove('open');
    if (modalOpen && !fromPop) {
      modalOpen = false;
      try { history.back(); } catch (e) {}
    } else {
      modalOpen = false;
    }
    if (modalLastFocus && modalLastFocus.focus) {
      try { modalLastFocus.focus(); } catch (e) {}
    }
    modalLastFocus = null;
  }

  function openArtist(id) {
    const a = ARTISTS.find(x => x.id === id); if (!a) return;
    pushRecent('artists', a.id);
    const faved = isFav('artists', a.id);
    openModal(
      `<div class="modal__handle"></div>
       <div class="modal__cat">🎤</div>
       <div class="modal__title">${esc(a.name)}</div>
       <div class="modal__sub">出演アーティスト</div>
       <div class="modal__row"><div class="ico">🕒</div><div>
         <div class="k">出演日・ステージ・時間</div>
         <div class="v" style="font-size:12px">タイムテーブルでご確認ください</div></div></div>
       <div class="modal__btns">
         <button class="btn btn--fav ${faved ? 'on' : ''}" id="mFav">
           ${faved ? '★ 登録済み' : '☆ マイプランに追加'}</button></div>
       <div class="modal__btns">
         <button class="btn btn--primary" id="mTT">🕒 タイムテーブルを見る</button></div>`);
    $('#mFav').onclick = () => {
      toast(toggleFav('artists', a.id) ? '★ マイプランに追加' : 'マイプランから削除');
      saveFav(); openArtist(id); updateTabBadge();
      if (state.view === 'artists') renderArtistList();
      if (state.view === 'myplan') renderMyplan();
    };
    $('#mTT').onclick = () => { closeModal(); switchView('timetable'); };
  }

  function openShop(id) {
    const s = SHOPS.find(x => x.id === id); if (!s) return;
    pushRecent('shops', s.id);
    const faved = isFav('shops', s.id);
    openModal(
      `<div class="modal__handle"></div>
       <div class="modal__cat">${s.catIcon}</div>
       <div class="modal__title">${esc(s.name)}</div>
       <div class="modal__sub">出店ショップ</div>
       <div class="modal__row"><div class="ico">${s.catIcon}</div><div>
         <div class="k">カテゴリ</div><div class="v">${esc(s.catLabel)}</div></div></div>
       <div class="modal__row"><div class="ico">📍</div><div>
         <div class="k">出店エリア</div><div class="v">${esc(s.zoneName)}</div></div></div>
       ${s.booth ? `<div class="modal__row"><div class="ico">🔢</div><div>
         <div class="k">会場マップ ブース番号</div>
         <div class="v">${esc(shortName(s.zoneName))} ${s.booth}番</div></div></div>` : ''}
       <p style="font-size:10.5px;color:var(--sub);margin:2px 4px 10px">
         「マップで見る」で、①出店一覧の店名（赤枠）②出店一覧のエリア名（赤丸）③そのエリアが会場マップ上のどこにあるか（📍ピン＋赤丸）の3点を表示します。${
         s.booth ? '会場では出店一覧の番号「' + s.booth + '」と同じ番号のブースが目印です。' :
         '会場内の詳しい位置は会場マップでご確認ください。'}</p>
       <div class="modal__btns">
         <button class="btn btn--fav ${faved ? 'on' : ''}" id="sFav">
           ${faved ? '★ 登録済み' : '☆ マイプランに追加'}</button></div>
       <div class="modal__btns">
         <button class="btn btn--primary" id="sMap">🗺️ マップで店名・エリアを見る</button></div>`);
    $('#sFav').onclick = () => {
      toast(toggleFav('shops', s.id) ? '★ マイプランに追加' : 'マイプランから削除');
      saveFav(); openShop(id); updateTabBadge();
      if (state.view === 'shops') renderShopList();
      if (state.view === 'myplan') renderMyplan();
    };
    $('#sMap').onclick = () => {
      closeModal();
      state.highlightShop = s.id;
      state.selectedZone = null;
      state.mapShopQuery = '';
      switchView('map');
      toast('マップ上で「' + s.name + '」をハイライト');
    };
  }

  /* ============================================================
     初期化
  ============================================================ */
  function init() {
    sanitizeState();
    /* 検索用キーを事前計算（毎キーストロークの再計算を避ける）。
       アーティストは50音順にソートしておく。 */
    SHOPS.forEach(s => { s.nk = normKey(s.name); });
    ARTISTS.forEach(a => { a.nk = normKey(a.name); });
    ARTISTS.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    applyNight();
    renderHeader();
    tickClock();
    setInterval(tickClock, 10000);
    setInterval(refreshCountdown, 30000);   // ホームのカウントダウンを更新
    $('#nightBtn').onclick = () => {
      state.night = !state.night;
      try { localStorage.setItem('mm2026_night', state.night ? '1' : '0'); }
      catch (e) {}
      applyNight();
    };
    $$('.tabbar button').forEach(b => b.onclick = () => switchView(b.dataset.view));
    $('#modalBg').onclick = e => { if (e.target.id === 'modalBg') closeModal(); };
    window.addEventListener('resize', () => mapResizeFn());
    /* モーダル：Escape で閉じる／端末の戻る操作（popstate）で閉じる */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && $('#modalBg').classList.contains('open')) closeModal();
    });
    window.addEventListener('popstate', () => { if (modalOpen) closeModal(true); });
    /* バックグラウンド復帰時：時計とカウントダウンを即更新 */
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) { tickClock(); refreshCountdown(); }
    });
    switchView('home');
    updateTabBadge();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
