/* ============================================================
   森、道、市場 2026 ガイドアプリ — アプリ本体
============================================================ */
(function () {
  'use strict';

  const state = {
    view: 'home',
    day: defaultDay(),
    mapFilter: 'all',
    selectedZone: null,
    highlightShop: null,   // マップ上でハイライト中のショップID
    placingMe: false,
    mapShopQuery: '',
    artistQuery: '',
    shopQuery: '', shopCat: 'all',
    myplanTab: 'artists',
    fav: load('mm2026_fav', { artists: [], shops: [] }),
    checks: load('mm2026_checks', {}),
    mePin: load('mm2026_me', null),
    night: localStorage.getItem('mm2026_night') === '1'
  };

  function load(k, def) {
    try { const r = JSON.parse(localStorage.getItem(k)); return r == null ? def : r; }
    catch (e) { return def; }
  }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function saveFav() { save('mm2026_fav', state.fav); }
  function isFav(t, id) { return state.fav[t].indexOf(id) !== -1; }
  function toggleFav(t, id) {
    const a = state.fav[t], i = a.indexOf(id);
    if (i === -1) { a.push(id); return true; }
    a.splice(i, 1); return false;
  }
  function defaultDay() {
    const t = new Date();
    const d = FESTIVAL.days.find(x => sameDate(new Date(x.date), t));
    return d ? d.id : 'd1';
  }
  function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function todayDay() {
    const n = new Date();
    const d = FESTIVAL.days.find(x => sameDate(new Date(x.date), n));
    return d ? d.id : null;
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
    const today = todayDay();

    /* ヒーロー */
    const hero = el('div', 'hero');
    const first = new Date(FESTIVAL.days[0].date + 'T11:00:00');
    const diff = first - new Date();
    let cd;
    if (today) {
      cd = `<div class="cd-box wide"><b>本日開催中</b><span>HAVE A GREAT DAY</span></div>`;
    } else if (diff > 0) {
      const dd = Math.floor(diff / 864e5),
            hh = Math.floor(diff % 864e5 / 36e5),
            mm = Math.floor(diff % 36e5 / 6e4);
      cd = `<div class="cd-box"><b class="en">${dd}</b><span>DAYS</span></div>
            <div class="cd-box"><b class="en">${hh}</b><span>HOURS</span></div>
            <div class="cd-box"><b class="en">${mm}</b><span>MIN</span></div>`;
    } else {
      cd = `<div class="cd-box wide"><b>開催ありがとうございました</b>
            <span>SEE YOU NEXT YEAR</span></div>`;
    }
    hero.innerHTML =
      `<div class="hero__dots"></div>
       <h2>${esc(FESTIVAL.name)}</h2>
       <div class="sub">5.22 FRI – 5.24 SUN ／ 蒲郡 ラグーナビーチ</div>
       <div class="venue">${esc(FESTIVAL.venue)}</div>
       <div class="countdown">${cd}</div>`;
    root.appendChild(hero);

    /* 本日のタイムテーブル */
    root.appendChild(secTitle('タイムテーブル', 'TIMETABLE'));
    const tt = el('div', 'card home-tt');
    const ttDay = FESTIVAL.days.find(d => d.id === (today || state.day));
    tt.innerHTML =
      `<div class="home-tt__row">
         <div><b style="font-size:14px">${ttDay.label} ${ttDay.dow} のタイムテーブル</b>
         <p style="font-size:11px;color:var(--sub)">公式タイムテーブルを見る</p></div>
         <span style="font-size:22px">🕒</span>
       </div>
       <img src="${TIMETABLE[ttDay.id]}" alt="タイムテーブル" loading="lazy">`;
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
         <input type="search" id="mapShopInput" placeholder="出店名で検索 → マップ上でハイライト"
           value="${esc(state.mapShopQuery)}">
       </div>
       <div id="mapShopSug" class="map-sug"></div>`;
    root.appendChild(search);
    const input = $('#mapShopInput');
    input.oninput = e => { state.mapShopQuery = e.target.value; renderMapSug(); };

    /* フィルタ */
    const tb = el('div', 'map-toolbar');
    const seg = el('div', 'seg');
    [['all', 'すべて'], ['stage', 'ステージ'], ['area', 'エリア'], ['gate', '入口']]
      .forEach(f => {
        const b = el('button', state.mapFilter === f[0] ? 'active' : '', f[1]);
        b.onclick = () => { state.mapFilter = f[0]; renderMap(); };
        seg.appendChild(b);
      });
    tb.appendChild(seg);
    const meBtn = el('button', 'icon-btn', state.placingMe ? '📍' : '🧭');
    meBtn.style.cssText = 'width:42px;height:42px;border-radius:9px;box-shadow:var(--hard);font-size:17px;flex-shrink:0;';
    meBtn.onclick = () => {
      state.placingMe = !state.placingMe;
      toast(state.placingMe ? 'マップをタップして現在地をセット' : '現在地モード解除');
      renderMap();
    };
    tb.appendChild(meBtn);
    root.appendChild(tb);

    /* 選択中ショップ表示 */
    if (state.highlightShop) {
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
         <div class="map-inner" id="mapInner"><img src="${MAP.img}" alt="会場マップ" id="mapImg"></div>
         <div id="pinLayer"></div>
         <div class="map-zoom">
           <button id="zIn">＋</button><button id="zOut">－</button>
           <button id="zReset" style="font-size:14px">⟳</button>
         </div>
       </div>`;
    root.appendChild(wrap);

    root.appendChild(el('div', 'map-legend',
      `<span><i style="background:var(--red)"></i>ステージ</span>
       <span><i style="background:var(--yellow)"></i>エリア</span>
       <span><i style="background:var(--teal)"></i>入口</span>
       <span><i style="background:#fff;border-color:var(--red)"></i>現在地</span>`));
    root.appendChild(el('div', 'map-hint',
      '出店名で検索、または出店ページの「マップで見る」から、店名をマップ上で黄色くハイライトします。ピンチ／ダブルタップで拡大。'));

    const zp = el('div'); zp.id = 'zonePanel';
    root.appendChild(zp);

    setupMap();
    renderZonePanel();
  }

  function renderMapSug() {
    const box = $('#mapShopSug'); if (!box) return;
    const q = state.mapShopQuery.trim().toLowerCase();
    if (!q) { box.innerHTML = ''; return; }
    const list = SHOPS.filter(s => s.name.toLowerCase().indexOf(q) !== -1).slice(0, 8);
    box.innerHTML = '';
    list.forEach(s => {
      const r = el('div', 'map-sug__item',
        `<span>${s.catIcon} ${esc(s.name)}</span>
         <span style="font-size:10px;color:var(--sub)">${esc(s.zoneName)}</span>`);
      r.onclick = () => {
        state.highlightShop = s.id;
        state.mapShopQuery = '';
        state.selectedZone = null;
        renderMap();   // setupMap の ready() が highlightShop を見て自動フォーカス
      };
      box.appendChild(r);
    });
    if (!list.length)
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
        p.style.display = (sx < -60 || sx > mv.cw + 60 ||
                           sy < -10 || sy > mv.ch + 60) ? 'none' : '';
      });
    }
    function buildMarkers() {
      layer.innerHTML = '';
      const zones = ZONES.filter(z =>
        state.mapFilter === 'all' ||
        (state.mapFilter === 'stage' && z.type === 'stage') ||
        (state.mapFilter === 'gate' && z.type === 'gate') ||
        (state.mapFilter === 'area' && z.type === 'area'));
      zones.forEach(z => {
        const icon = z.type === 'stage' ? '🎵' : z.type === 'gate' ? '🚪' : '🛍️';
        const p = el('div', 'pin pin--' + z.type +
          (state.selectedZone === z.id ? ' active' : ''),
          `<div class="pin__dot"><span>${icon}</span></div>
           <div class="pin__label">${esc(shortName(z.name))}</div>`);
        p.dataset.zx = z.x; p.dataset.zy = z.y; p.dataset.zone = z.id;
        p.onclick = e => {
          e.stopPropagation();
          state.selectedZone = z.id; state.highlightShop = null;
          focusZone(z.id, true); renderZonePanel(); highlightPins();
        };
        layer.appendChild(p);
      });
      if (state.mePin) {
        const p = el('div', 'pin pin--me',
          `<div class="pin__dot"><span>🙋</span></div>
           <div class="pin__label">現在地</div>`);
        p.dataset.zx = state.mePin.x; p.dataset.zy = state.mePin.y;
        layer.appendChild(p);
      }
      /* 選択中ショップ：店名を指す固定サイズのピン（どの縮尺でも見える） */
      if (state.highlightShop) {
        const s = SHOPS.find(x => x.id === state.highlightShop);
        if (s) {
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
      /* 選択対象がなければ全体表示にリセット（前回のズーム状態を持ち越さない） */
      if (!state.highlightShop && !state.selectedZone) {
        mv.scale = 1; mv.x = 0; mv.y = 0;
      }
      measure(); buildMarkers(); apply();
      if (state.highlightShop) focusShop(state.highlightShop);
      else if (state.selectedZone) focusZone(state.selectedZone, false);
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
      state.selectedZone = null; state.highlightShop = null;
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

  function focusZone(zoneId, animate) {
    const z = ZONE_BY_ID[zoneId];
    if (!z || !mv.cw) return;
    flyTo(z.x, z.y, z.type === 'stage' ? 2.4 : 2.8, animate);
    highlightPinsFn();
  }
  function focusShop(shopId) {
    const s = SHOPS.find(x => x.id === shopId);
    if (!s || !mv.cw) return;
    flyTo(s.mx + s.mw / 2, s.my + s.mh / 2, 3.6, true);
  }
  function flyTo(px, py, scale, animate) {
    mv.scale = scale;
    mv.x = mv.cw / 2 - px / 100 * mv.innerW * mv.scale;
    mv.y = mv.ch * 0.44 - py / 100 * mv.innerH * mv.scale;
    if (animate) {
      const inner = $('#mapInner');
      if (inner) {
        inner.style.transition = 'transform .4s ease';
        setTimeout(() => { if (inner) inner.style.transition = ''; }, 430);
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

    const wrap = el('div', 'map-wrap');
    wrap.innerHTML =
      `<div class="map-canvas tt-canvas" id="ttCanvas">
         <div class="map-inner" id="ttInner"><img src="${TIMETABLE[d.id]}" alt="タイムテーブル" id="ttImg"></div>
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
    sb.innerHTML = `<input type="search" placeholder="アーティスト名で検索"
      value="${esc(state.artistQuery)}">`;
    sb.querySelector('input').oninput = e => {
      state.artistQuery = e.target.value; renderArtistList();
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
  function renderArtistList() {
    const w = $('#artistListWrap'); if (!w) return;
    const q = state.artistQuery.trim().toLowerCase();
    let list = ARTISTS.slice();
    if (q) list = list.filter(a => a.name.toLowerCase().indexOf(q) !== -1);
    list.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    w.innerHTML = '';
    w.appendChild(el('div', 'list-count', list.length + ' 組'));
    if (!list.length) {
      w.appendChild(el('div', 'empty', '<div class="big">🔍</div>該当なし'));
      return;
    }
    const g = el('div', 'list-grid');
    list.forEach(a => {
      const t = el('div', 'tile',
        `<div class="tile__cat">🎤</div>
         <div class="tile__name">${esc(a.name)}</div>
         <div class="tile__meta">出演アーティスト</div>
         <button class="tile__fav">${isFav('artists', a.id) ? '★' : '☆'}</button>`);
      t.onclick = () => openArtist(a.id);
      t.querySelector('.tile__fav').onclick = e => {
        e.stopPropagation();
        toast(toggleFav('artists', a.id) ? '★ マイプランに追加' : 'マイプランから削除');
        saveFav(); renderArtistList(); updateTabBadge();
      };
      g.appendChild(t);
    });
    w.appendChild(g);
  }

  /* ============================================================
     出店ショップ
  ============================================================ */
  function renderShops() {
    const root = $('#view-shops');
    root.innerHTML = '';
    const sb = el('div', 'searchbar');
    sb.innerHTML = `<input type="search" placeholder="出店名で検索"
      value="${esc(state.shopQuery)}">`;
    sb.querySelector('input').oninput = e => {
      state.shopQuery = e.target.value; renderShopList();
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
      'ℹ️ 出店をタップ →「マップで見る」で、会場マップ上の店名を黄色くハイライトします。' +
      '公式では1000店舗以上が出店。全店舗は <a href="' + FESTIVAL.links.market +
      '" target="_blank" rel="noopener">公式サイト</a> へ。'));
    const w = el('div'); w.id = 'shopListWrap';
    root.appendChild(w);
    renderShopList();
  }
  function renderShopList() {
    const w = $('#shopListWrap'); if (!w) return;
    const q = state.shopQuery.trim().toLowerCase();
    let list = SHOPS.slice();
    if (state.shopCat !== 'all') list = list.filter(s => s.cat === state.shopCat);
    if (q) list = list.filter(s => s.name.toLowerCase().indexOf(q) !== -1);
    w.innerHTML = '';
    w.appendChild(el('div', 'list-count', list.length + ' 店'));
    if (!list.length) {
      w.appendChild(el('div', 'empty', '<div class="big">🔍</div>該当なし'));
      return;
    }
    const g = el('div', 'list-grid');
    list.forEach(s => {
      const t = el('div', 'tile',
        `<div class="tile__cat">${s.catIcon}</div>
         <div class="tile__name">${esc(s.name)}</div>
         <div class="tile__meta">📍 ${esc(shortName(s.zoneName))}</div>
         <button class="tile__fav">${isFav('shops', s.id) ? '★' : '☆'}</button>`);
      t.onclick = () => openShop(s.id);
      t.querySelector('.tile__fav').onclick = e => {
        e.stopPropagation();
        toast(toggleFav('shops', s.id) ? '★ マイプランに追加' : 'マイプランから削除');
        saveFav(); renderShopList(); updateTabBadge();
      };
      g.appendChild(t);
    });
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
  function openModal(html) {
    $('#modalBody').innerHTML = html;
    $('#modalBg').classList.add('open');
  }
  function closeModal() { $('#modalBg').classList.remove('open'); }

  function openArtist(id) {
    const a = ARTISTS.find(x => x.id === id); if (!a) return;
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
         「マップで見る」で会場マップ上の店名を黄色くハイライトして拡大します。${
         s.booth ? '会場では出店一覧の番号「' + s.booth + '」と同じ番号のブースが目印です。' :
         '会場内の詳しい位置は会場マップでご確認ください。'}</p>
       <div class="modal__btns">
         <button class="btn btn--fav ${faved ? 'on' : ''}" id="sFav">
           ${faved ? '★ 登録済み' : '☆ マイプランに追加'}</button></div>
       <div class="modal__btns">
         <button class="btn btn--primary" id="sMap">🗺️ マップで店名の位置を見る</button></div>`);
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
    applyNight();
    renderHeader();
    tickClock();
    setInterval(tickClock, 10000);
    $('#nightBtn').onclick = () => {
      state.night = !state.night;
      localStorage.setItem('mm2026_night', state.night ? '1' : '0');
      applyNight();
    };
    $$('.tabbar button').forEach(b => b.onclick = () => switchView(b.dataset.view));
    $('#modalBg').onclick = e => { if (e.target.id === 'modalBg') closeModal(); };
    window.addEventListener('resize', () => mapResizeFn());
    switchView('home');
    updateTabBadge();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
