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
    mapShopQuery: '',
    artistQuery: '', artistDay: 'all',
    shopQuery: '', shopZone: 'all',
    /* 出店ショップの出店日フィルタ。'all'=全日。d1/d2/d3=その日に出店する店のみ。
       同一ブース番号で日替わりに店舗が入れ替わる出店（種と旅と・モリミチ喫茶室・
       ウキウキ通り 18-20 など）を正しく絞り込むために必須。 */
    shopDay: 'all',
    myplanTab: 'shops',
    /* マイプラン「行きたい出店」内の第2層タブ。
       wishlist=既存fav(行きたい) / visited=行った / nextyear=来年行きたい */
    myplanShopSubTab: 'wishlist',
    fav: load('mm2026_fav', { artists: [], shops: [] }),
    checks: load('mm2026_checks', {}),
    recent: load('mm2026_recent', { shops: [], artists: [] }),
    /* 行った出店IDの配列（fav と独立）。✅ 訪問チェック用。 */
    visited: load('mm2026_visited', []),
    /* 来年行きたい出店IDの配列（出店のみ。アーティストは毎年変わるため対象外） */
    nextYear: load('mm2026_nextyear', []),
    /* 出店ごとのメモ。{shopId: {tags: string[], body: string, updatedAt: number}} */
    notes: load('mm2026_notes', {}),
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
    const r = state.recent;
    if (!r || typeof r !== 'object' || !Array.isArray(r.shops) || !Array.isArray(r.artists))
      state.recent = { shops: [], artists: [] };
    if (!Array.isArray(state.visited)) state.visited = [];
    if (!Array.isArray(state.nextYear)) state.nextYear = [];
    if (!state.notes || typeof state.notes !== 'object' || Array.isArray(state.notes))
      state.notes = {};
  }
  function saveFav() { save('mm2026_fav', state.fav); }
  function isFav(t, id) { return state.fav[t].indexOf(id) !== -1; }
  function toggleFav(t, id) {
    const a = state.fav[t], i = a.indexOf(id);
    if (i === -1) { a.push(id); return true; }
    a.splice(i, 1); return false;
  }
  /* 行った（visited）API — fav と同じパターン。出店のみ。 */
  function saveVisited() { save('mm2026_visited', state.visited); }
  function isVisited(id) { return state.visited.indexOf(id) !== -1; }
  function toggleVisited(id) {
    const i = state.visited.indexOf(id);
    if (i === -1) { state.visited.push(id); return true; }
    state.visited.splice(i, 1); return false;
  }
  /* 来年行きたい（nextYear）API — 出店のみ。 */
  function saveNextYear() { save('mm2026_nextyear', state.nextYear); }
  function isNextYear(id) { return state.nextYear.indexOf(id) !== -1; }
  function toggleNextYear(id) {
    const i = state.nextYear.indexOf(id);
    if (i === -1) { state.nextYear.push(id); return true; }
    state.nextYear.splice(i, 1); return false;
  }
  /* ショップメモ API。{tags, body, updatedAt} を持つ。
     空オブジェクト相当（tags が空配列＆body が空文字）になったら state からも削除する。 */
  function saveNotes() { save('mm2026_notes', state.notes); }
  function getNote(id) {
    const n = state.notes[id];
    if (!n || typeof n !== 'object') return { tags: [], body: '', updatedAt: 0 };
    return {
      tags: Array.isArray(n.tags) ? n.tags : [],
      body: typeof n.body === 'string' ? n.body : '',
      updatedAt: typeof n.updatedAt === 'number' ? n.updatedAt : 0
    };
  }
  function setNote(id, obj) {
    /* タグは重複を排除しておく（インポート時の汚染データ対策も兼ねる） */
    const tags = Array.isArray(obj.tags) ? [...new Set(obj.tags.filter(t => typeof t === 'string'))] : [];
    /* 500字制限は「Unicode コードポイント単位」でカウントする。
       UTF-16 単位（s.length）だとサロゲートペアの絵文字が2でカウントされ、
       250 字付近で勝手に切られてしまうため。 */
    let body = typeof obj.body === 'string' ? obj.body : '';
    const arr = [...body];
    if (arr.length > 500) body = arr.slice(0, 500).join('');
    if (tags.length === 0 && body.length === 0) {
      delete state.notes[id];
    } else {
      state.notes[id] = { tags, body, updatedAt: Date.now() };
    }
  }
  /* 文字数カウント（コードポイント単位） */
  function noteBodyLen(body) {
    return typeof body === 'string' ? [...body].length : 0;
  }
  function hasNote(id) {
    const n = state.notes[id];
    return !!(n && ((Array.isArray(n.tags) && n.tags.length > 0) || (typeof n.body === 'string' && n.body.length > 0)));
  }
  /* メモ用の固定タグ。順序は表示順。 */
  const NOTE_TAGS = ['おすすめ', 'また来たい', '待ち時間注意', '売切れ早い', '写真映え'];
  /* このアプリの公開URL（シェア時に使う） */
  const APP_URL = 'https://nagoya-ningen.github.io/morimichi-app/';
  /* シェアヘルパ。Web Share API → clipboard.writeText → prompt の段階フォールバック。 */
  async function shareOrCopy({ title, text, url }) {
    const payload = { title, text, url };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return 'shared';
      }
    } catch (e) { /* ユーザーキャンセル等はサイレントに */ }
    /* Web Share 非対応 or キャンセル後 → クリップボードコピー */
    const composed = [text, url].filter(Boolean).join('\n');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(composed);
        toast('リンクをコピーしました');
        return 'copied';
      }
    } catch (e) {}
    /* 最終フォールバック：prompt で見せる */
    try { window.prompt('テキストをコピーしてください', composed); } catch (e) {}
    return 'fallback';
  }
  /* メモ入力の debounce 用 timer 保持 */
  let _noteSaveTimer = null;
  function scheduleSaveNotes(delay) {
    if (_noteSaveTimer) clearTimeout(_noteSaveTimer);
    _noteSaveTimer = setTimeout(() => { saveNotes(); _noteSaveTimer = null; }, delay || 500);
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

  /* ローマ字（ヘボン式・訓令式の主要パターン）→ひらがな簡易変換。
     英語名の店・アーティストを「ミナペルホネン」「みなぺるほねん」など
     カナで検索した時、normKey 同士の includes でぼんやり一致させるための
     補助キーを作る目的。完璧な変換は目指さず、主要50音＋濁音半濁音＋
     拗音＋促音＋撥音をカバーする。
     入力は normKey 通過後（lowercase / 記号除去済み）の文字列を想定。 */
  var ROMA_TABLE = [
    // 長い順に並べる（拗音・3字節を先にマッチさせる）
    ['kkya','っきゃ'],['kkyu','っきゅ'],['kkyo','っきょ'],
    ['ssha','っしゃ'],['sshu','っしゅ'],['ssho','っしょ'],['sshi','っし'],
    ['ccha','っちゃ'],['cchu','っちゅ'],['ccho','っちょ'],['cchi','っち'],
    ['ttsu','っつ'],['tsu','つ'],['tta','った'],['tte','って'],['tto','っと'],['tti','っち'],
    ['nnya','んにゃ'],['nnyu','んにゅ'],['nnyo','んにょ'],
    ['ppya','っぴゃ'],['ppyu','っぴゅ'],['ppyo','っぴょ'],
    ['kya','きゃ'],['kyu','きゅ'],['kyo','きょ'],['kyi','きぃ'],['kye','きぇ'],
    ['gya','ぎゃ'],['gyu','ぎゅ'],['gyo','ぎょ'],
    ['sha','しゃ'],['shu','しゅ'],['sho','しょ'],['she','しぇ'],['shi','し'],
    ['sya','しゃ'],['syu','しゅ'],['syo','しょ'],
    ['cha','ちゃ'],['chu','ちゅ'],['cho','ちょ'],['che','ちぇ'],['chi','ち'],
    ['tya','ちゃ'],['tyu','ちゅ'],['tyo','ちょ'],
    ['tha','てぁ'],['thi','てぃ'],['thu','てゅ'],['the','てぇ'],['tho','てょ'],
    ['nya','にゃ'],['nyu','にゅ'],['nyo','にょ'],
    ['hya','ひゃ'],['hyu','ひゅ'],['hyo','ひょ'],
    ['mya','みゃ'],['myu','みゅ'],['myo','みょ'],
    ['rya','りゃ'],['ryu','りゅ'],['ryo','りょ'],
    ['bya','びゃ'],['byu','びゅ'],['byo','びょ'],
    ['pya','ぴゃ'],['pyu','ぴゅ'],['pyo','ぴょ'],
    ['ja','じゃ'],['ju','じゅ'],['jo','じょ'],['je','じぇ'],['ji','じ'],
    ['jya','じゃ'],['jyu','じゅ'],['jyo','じょ'],
    ['zya','じゃ'],['zyu','じゅ'],['zyo','じょ'],
    ['dya','ぢゃ'],['dyu','ぢゅ'],['dyo','ぢょ'],
    ['fa','ふぁ'],['fi','ふぃ'],['fe','ふぇ'],['fo','ふぉ'],['fu','ふ'],['hu','ふ'],
    ['va','ヴぁ'],['vi','ヴぃ'],['vu','ヴ'],['ve','ヴぇ'],['vo','ヴぉ'],
    ['wa','わ'],['wi','うぃ'],['we','うぇ'],['wo','を'],['wu','う'],
    ['xa','ぁ'],['xi','ぃ'],['xu','ぅ'],['xe','ぇ'],['xo','ぉ'],
    ['ka','か'],['ki','き'],['ku','く'],['ke','け'],['ko','こ'],
    ['ga','が'],['gi','ぎ'],['gu','ぐ'],['ge','げ'],['go','ご'],
    ['sa','さ'],['si','し'],['su','す'],['se','せ'],['so','そ'],
    ['za','ざ'],['zi','じ'],['zu','ず'],['ze','ぜ'],['zo','ぞ'],
    ['ta','た'],['ti','ち'],['te','て'],['to','と'],
    ['da','だ'],['di','ぢ'],['du','づ'],['de','で'],['do','ど'],
    ['na','な'],['ni','に'],['nu','ぬ'],['ne','ね'],['no','の'],
    ['ha','は'],['hi','ひ'],['he','へ'],['ho','ほ'],
    ['ba','ば'],['bi','び'],['bu','ぶ'],['be','べ'],['bo','ぼ'],
    ['pa','ぱ'],['pi','ぴ'],['pu','ぷ'],['pe','ぺ'],['po','ぽ'],
    ['ma','ま'],['mi','み'],['mu','む'],['me','め'],['mo','も'],
    ['ya','や'],['yu','ゆ'],['yo','よ'],['yi','い'],['ye','いぇ'],
    ['ra','ら'],['ri','り'],['ru','る'],['re','れ'],['ro','ろ'],
    ['la','ら'],['li','り'],['lu','る'],['le','れ'],['lo','ろ'],
    ['a','あ'],['i','い'],['u','う'],['e','え'],['o','お'],
    ['n','ん']
  ];
  function romajiToKana(s) {
    if (!s) return '';
    /* 既に英字を含まない（=カナ/漢字のみ）なら変換不要 */
    if (!/[a-z]/.test(s)) return s;
    var src = s;
    var out = '';
    var i = 0;
    while (i < src.length) {
      var c = src.charAt(i);
      if (c < 'a' || c > 'z') {
        out += c;
        i++;
        continue;
      }
      /* 二重子音→促音（kk,ss,tt,pp,ll,mm,gg,bb,dd,ff,jj,rr,zz） */
      if (i + 1 < src.length && c === src.charAt(i + 1) &&
          'kstpgbdfjrlzm'.indexOf(c) !== -1 && c !== 'n') {
        /* 「ll」「mm」「rr」も実用上は促音化しない方が良いケースがあるが、
           includes 判定の上で誤検出より見落としを避ける */
        out += 'っ';
        i++;
        continue;
      }
      var matched = false;
      for (var k = 0; k < ROMA_TABLE.length; k++) {
        var pat = ROMA_TABLE[k][0];
        if (src.substr(i, pat.length) === pat) {
          /* 'n' は次が母音や y のときは「な行/にゃ行」になるので
             ROMA_TABLE の上位で吸収済み。それ以外は「ん」 */
          out += ROMA_TABLE[k][1];
          i += pat.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        /* 未知の英字は素通し（数字や記号など。normKey で多くは落ちている） */
        out += c;
        i++;
      }
    }
    /* normKey を通して長音記号などを統一 */
    return normKey(out);
  }

  /* レコード（店・アーティスト）の検索用キーをまとめて作る。
     - nk      : 名前の normKey
     - nkRoma  : 名前を romajiToKana 経由で normKey した結果（英名→カナ仮想）
     - aliasNk : aliases 配列（任意）を normKey した文字列の連結
     - aliasRoma: aliases を romajiToKana したものの連結（通常カナだが念のため） */
  function buildSearchKeys(name, aliases) {
    var nk = normKey(name);
    var nkRoma = romajiToKana(nk);
    var aliasNk = '';
    var aliasRoma = '';
    if (Array.isArray(aliases)) {
      for (var i = 0; i < aliases.length; i++) {
        var a = aliases[i];
        if (!a) continue;
        var an = normKey(a);
        aliasNk += '' + an;
        aliasRoma += '' + romajiToKana(an);
      }
    }
    return { nk: nk, nkRoma: nkRoma, aliasNk: aliasNk, aliasRoma: aliasRoma };
  }

  /* 検索クエリ nq とレコードのキー群でマッチ判定。
     - クエリと名前の正規化キー双方を「そのまま」「ローマ字→カナ変換後」両方で
       includes 比較し、いずれかが一致したらヒット。
     - 単方向ではなく双方向にすることで、英名→カナ・カナ→英名のどちらの
       入力でも掛かる（カナ→英名はカナのまま英字にはならないが、
       レコード名のローマ字→カナ展開で吸収できる）。 */
  function matchKey(nq, keys) {
    if (!nq) return true;
    if (!keys) return false;
    var nqRoma = romajiToKana(nq);
    if (keys.nk && keys.nk.indexOf(nq) !== -1) return true;
    if (keys.nkRoma && keys.nkRoma.indexOf(nq) !== -1) return true;
    if (nqRoma && keys.nk && keys.nk.indexOf(nqRoma) !== -1) return true;
    if (nqRoma && keys.nkRoma && keys.nkRoma.indexOf(nqRoma) !== -1) return true;
    if (keys.aliasNk && keys.aliasNk.indexOf(nq) !== -1) return true;
    if (keys.aliasRoma && keys.aliasRoma.indexOf(nq) !== -1) return true;
    if (nqRoma && keys.aliasNk && keys.aliasNk.indexOf(nqRoma) !== -1) return true;
    if (nqRoma && keys.aliasRoma && keys.aliasRoma.indexOf(nqRoma) !== -1) return true;
    return false;
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

    /* マイページ機能の紹介セクション（ヒーロー直後・最優先で見せる）。
       会期後の振り返り体験（めぐった／来年こそは／メモ／画像シェア）を
       初見ユーザーにも分かるように説明。 */
    const intro = el('div', 'myplan-intro');
    intro.innerHTML =
      '<div class="myplan-intro__kicker">MY PAGE</div>' +
      '<div class="myplan-intro__head">マイページで、今年の森道を残す</div>' +
      '<div class="myplan-intro__grid">' +
        '<div class="myplan-intro__cell">' +
          '<div class="myplan-intro__num">01</div>' +
          '<div class="myplan-intro__lbl">めぐった出店を記録</div>' +
          '<div class="myplan-intro__desc">出店をタップして「行った」を選ぶと、タイルに印が付きます。</div>' +
        '</div>' +
        '<div class="myplan-intro__cell myplan-intro__cell--indigo">' +
          '<div class="myplan-intro__num">02</div>' +
          '<div class="myplan-intro__lbl">来年こそはリスト</div>' +
          '<div class="myplan-intro__desc">気になっていたけれど行けなかった店を、来年に持ち越し。</div>' +
        '</div>' +
        '<div class="myplan-intro__cell">' +
          '<div class="myplan-intro__num">03</div>' +
          '<div class="myplan-intro__lbl">店ごとのメモ</div>' +
          '<div class="myplan-intro__desc">おすすめ・また来たいなどタグ＋自由メモ。500字まで。</div>' +
        '</div>' +
        '<div class="myplan-intro__cell myplan-intro__cell--indigo">' +
          '<div class="myplan-intro__num">04</div>' +
          '<div class="myplan-intro__lbl">画像でシェア</div>' +
          '<div class="myplan-intro__desc">「2026年の、わたしの森道」を1枚の画像に。SNSへ。</div>' +
        '</div>' +
      '</div>';
    const introBtn = el('button', 'myplan-intro__btn', 'マイページを開く');
    introBtn.onclick = () => switchView('myplan');
    intro.appendChild(introBtn);
    root.appendChild(intro);

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
     ['🪩', 'アフターパーティ', () => openUrl('https://nagoya-ningen.github.io/morimichi-afterparty/')]
    ].forEach(q => {
      const b = el('button', 'quick-btn',
        `<div class="ico">${q[0]}</div><div class="lbl">${q[1]}</div>`);
      b.onclick = q[2]; qg.appendChild(b);
    });
    root.appendChild(qg);

    /* 非公式であることの明示（注意書きはクイックメニューの後に配置） */
    root.appendChild(el('div', 'disclaimer',
      'このアプリは森、道、市場のファンが個人的に制作した<b>非公式ガイド</b>です。' +
      '主催・運営とは一切関係ありません。日程・出店・タイムテーブル等の最新かつ正確な情報は、' +
      '必ず <a href="' + FESTIVAL.official +
      '" target="_blank" rel="noopener">公式サイト</a> でご確認ください。'));

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

    /* 持ち物チェックリスト：デフォルト折りたたみ。チェック数があるときだけサマリーで件数表示 */
    root.appendChild(secTitle('持ち物チェックリスト', 'CHECKLIST'));
    const doneCount = Object.values(state.checks).filter(Boolean).length;
    const totalCount = INFO.checklist.length;
    const cc = el('details', 'card checklist checklist--collapsible');
    const summary = el('summary', 'checklist__summary',
      '<span>持ち物（' + doneCount + ' / ' + totalCount + ' 完了）</span><span class="tgl">＋</span>');
    cc.appendChild(summary);
    INFO.checklist.forEach((item, i) => {
      const id = 'chk' + i, done = !!state.checks[id];
      const lab = el('label', done ? 'done' : '',
        `<input type="checkbox" ${done ? 'checked' : ''}><span>${esc(item)}</span>`);
      lab.querySelector('input').onchange = e => {
        state.checks[id] = e.target.checked;
        save('mm2026_checks', state.checks);
        lab.classList.toggle('done', e.target.checked);
        /* 件数表示を更新 */
        const dc = Object.values(state.checks).filter(Boolean).length;
        const sp = summary.querySelector('span');
        if (sp) sp.textContent = '持ち物（' + dc + ' / ' + totalCount + ' 完了）';
      };
      cc.appendChild(lab);
    });
    cc.addEventListener('toggle', () => {
      const t = cc.querySelector('.tgl');
      if (t) t.textContent = cc.open ? '−' : '＋';
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
    /* マップ検索は座標を持つ店のみ対象（追加店はマップ上に位置が無い）。
       出店日フィルタ（shopDay）も適用し、選んだ日に出店しない店は除外。 */
    const dayOk = s => state.shopDay === 'all' || shopOpenOn(s, state.shopDay);
    if (!nq) {
      /* 未入力時は最近チェックした出店を提示 */
      list = state.recent.shops
        .map(id => SHOPS.find(s => s.id === id))
        .filter(s => s && s.hasMapPos && dayOk(s)).slice(0, 6);
      isRecent = true;
      if (!list.length) return;
      box.appendChild(el('div', 'map-sug__head', '最近チェックした出店'));
    } else {
      list = SHOPS.filter(s => s.hasMapPos && dayOk(s) && matchKey(nq, s)).slice(0, 10);
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
          /* 座標を持つ店のみ店名ピンを置く（追加店は hasMapPos=false） */
          if (s.hasMapPos) {
            const sp = el('div', 'pin pin--shop',
              `<div class="shop-pin__body">${s.catIcon} ${
                 s.booth ? '<b>' + s.booth + '</b> ' : ''}${esc(s.name)}</div>
               <div class="shop-pin__tip"></div>`);
            sp.dataset.zx = s.mx + s.mw / 2;   // 店名の中心を指す
            sp.dataset.zy = s.my + s.mh / 2;
            layer.appendChild(sp);
          }
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
  /* 出演日ヘルパー。FESTIVAL.days を参照し、英字曜日を和名に変換する。 */
  const DOW_JA = { MON: '月', TUE: '火', WED: '水', THU: '木',
                   FRI: '金', SAT: '土', SUN: '日' };
  function dayChip(d) { return d.label + ' ' + (DOW_JA[d.dow] || d.dow); }
  /* アーティストの出演日を「5/22(金)・5/24(日)」形式の文字列にする。 */
  function artistDaysText(a) {
    const days = (a.days || [])
      .map(id => FESTIVAL.days.find(d => d.id === id))
      .filter(Boolean);
    if (!days.length) return '';
    return days.map(d => d.label + '(' + (DOW_JA[d.dow] || d.dow) + ')').join('・');
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
    /* 座標を持たない追加店はマップ上に矩形を描けないため何も描かない */
    if (!s || !s.hasMapPos) { svg.innerHTML = ''; return; }
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
    /* 座標未取得のエリア（公式照合で追加）はマップ上の位置が無いため
       flyTo しない。下部の出店パネルのみ表示する。 */
    if (typeof z.x !== 'number' || typeof z.y !== 'number') return;
    flyTo(z.x, z.y, z.type === 'stage' ? 2.4 : 2.8, animate);
    highlightPinsFn();
  }
  function focusShop(shopId) {
    const s = SHOPS.find(x => x.id === shopId);
    if (!s || !mv.cw) return;
    if (!s.hasMapPos) return;          // 座標なしの追加店は寄れない
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
    /* 出店日フィルタを適用（マップ側も shopDay を共有して整合させる） */
    const dayOk = s => state.shopDay === 'all' || shopOpenOn(s, state.shopDay);
    const shops = SHOPS.filter(s => s.zone === z.id && dayOk(s));
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
          /* 座標を持つ店はマップ上でハイライト、無い店は詳細を開く */
          if (s.hasMapPos) {
            state.highlightShop = s.id; state.selectedZone = null;
            renderMap();
          } else {
            openShop(s.id);
          }
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
    /* 日程フィルタ。すべて＋公演3日（5/22・5/23・5/24）で出演者を絞り込む。 */
    const dayChips = el('div', 'chips');
    [['all', 'すべて']].concat(FESTIVAL.days.map(d => [d.id, dayChip(d)]))
      .forEach(c => {
        const ch = el('button',
          'chip' + (c[0] === state.artistDay ? ' active' : ''), c[1]);
        ch.onclick = () => { state.artistDay = c[0]; renderArtists(); };
        dayChips.appendChild(ch);
      });
    root.appendChild(dayChips);
    root.appendChild(el('div', 'notice',
      'ℹ️ 出演日・ステージ・時間は ' +
      '<a href="' + FESTIVAL.links.timetable + '" target="_blank" rel="noopener">' +
      'タイムテーブル</a> でご確認ください。'));
    const w = el('div'); w.id = 'artistListWrap';
    root.appendChild(w);
    renderArtistList();
  }
  function artistTile(a) {
    const dt = artistDaysText(a);
    const t = el('div', 'tile',
      `<div class="tile__cat">🎤</div>
       <div class="tile__name">${esc(a.name)}</div>
       <div class="tile__meta">${dt ? '🗓 ' + esc(dt) : '出演アーティスト'}</div>
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
    const dayOk = a => state.artistDay === 'all' ||
      (a.days && a.days.indexOf(state.artistDay) !== -1);
    let list = ARTISTS.filter(a => (!nq || matchKey(nq, a)) && dayOk(a));
    w.innerHTML = '';
    if (!nq) {
      const rec = state.recent.artists
        .map(id => ARTISTS.find(a => a.id === id))
        .filter(a => a && dayOk(a));
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
    /* 出店日フィルタ。日替わり出店（種と旅と・モリミチ喫茶室・ウキウキ通り 18-20 ほか）
       を絞り込むため、検索・エリア絞り込みより手前に出す。 */
    const dayChips = el('div', 'chips');
    [['all', '全日']].concat(FESTIVAL.days.map(d =>
      [d.id, d.label + '(' + ({FRI:'金',SAT:'土',SUN:'日'}[d.dow] || d.dow) + ')']
    )).forEach(c => {
      const ch = el('button',
        'chip' + (c[0] === state.shopDay ? ' active' : ''), c[1]);
      ch.onclick = () => { state.shopDay = c[0]; renderShops(); };
      dayChips.appendChild(ch);
    });
    root.appendChild(dayChips);
    /* エリアフィルタ。すべて＋出店のある各エリアで絞り込む。
       マップのエリア括りと対応し、選択中はマップ表示への導線を出す。
       出店ゼロのエリア（のんのんパレード等）はチップに出さない。 */
    const chips = el('div', 'chips');
    [['all', 'すべて']].concat(
      ZONES.filter(z => z.type === 'area' &&
        SHOPS.some(s => s.zone === z.id)).map(z => [z.id, shortName(z.name)])
    ).forEach(c => {
      const ch = el('button',
        'chip' + (c[0] === state.shopZone ? ' active' : ''), c[1]);
      ch.onclick = () => { state.shopZone = c[0]; renderShops(); };
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
    const v = isVisited(s.id);
    const m = hasNote(s.id);
    const ny = isNextYear(s.id);
    /* バッジ重ね順：✅ visited → 📝 memo → 🌱 nextyear。tile__fav は右上に固定。
       バッジが多すぎるとタイルがうるさくなるため、状態がある時だけ表示する。 */
    const badgeArr = [
      v ? '<span class="tile__badge tile__badge--visited" title="行った">✅</span>' : '',
      m ? '<span class="tile__badge tile__badge--memo" title="メモあり">📝</span>' : '',
      ny ? '<span class="tile__badge tile__badge--nextyear" title="来年も行きたい">🌱</span>' : ''
    ].filter(Boolean);
    const badges = badgeArr.join('');
    /* バッジ数に応じて .tile--has-badgesN クラスを付け、エリア名の右パディング量を出し分ける。
       これで「バッジ無しタイル」に無駄な余白が出ない。 */
    const badgeCls = badgeArr.length ? ' tile--has-badges tile--badges-' + badgeArr.length : '';
    /* カテゴリの絵文字（🛍️ / 🍜 など）は撤去し、店名を左上に詰める。
       カテゴリ識別はモーダル側で表示するため、リストでは情報密度を優先する。 */
    const t = el('div', 'tile tile--shop' + (v ? ' tile--visited' : '') + badgeCls,
      `<div class="tile__name">${esc(s.name)}</div>
       <div class="tile__meta">📍 ${esc(shortName(s.zoneName))}</div>
       ${badges ? `<div class="tile__badges">${badges}</div>` : ''}
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
    const zoneOk = s => state.shopZone === 'all' || s.zone === state.shopZone;
    /* 出店日フィルタ。state.shopDay が 'all' なら無条件で通す。
       それ以外は shopOpenOn を使い、days 未指定（=全日）の店も通す。 */
    const dayOk = s => state.shopDay === 'all' || shopOpenOn(s, state.shopDay);
    let list = SHOPS.filter(s => zoneOk(s) && dayOk(s));
    if (nq) list = list.filter(s => matchKey(nq, s));
    w.innerHTML = '';
    /* エリア選択中は、そのエリアをマップで見る導線を最上部に出す。
       座標を持たないエリア（公式照合で追加）はマップ表示できないため出さない。 */
    if (state.shopZone !== 'all') {
      const z = ZONE_BY_ID[state.shopZone];
      if (z && typeof z.x === 'number') {
        const mb = el('button', 'btn btn--primary',
          '🗺️ ' + shortName(z.name) + ' をマップで見る');
        mb.style.width = '100%';
        mb.style.marginBottom = '8px';
        mb.onclick = () => {
          state.selectedZone = state.shopZone;
          state.highlightShop = null;
          switchView('map');
        };
        w.appendChild(mb);
      }
    }
    /* 検索が空のときは「最近チェックした出店」を上部に提示 */
    if (!nq) {
      const rec = state.recent.shops
        .map(id => SHOPS.find(s => s.id === id))
        .filter(s => s && zoneOk(s) && dayOk(s));
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
    /* 出店中心の振り返り体験を優先し、行きたい出店を左・観たい出演者を右に。 */
    [['shops', '🛍️ 行きたい出店', state.fav.shops.length],
     ['artists', '⭐ 観たい出演者', state.fav.artists.length]
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
        const dt = artistDaysText(a);
        const t = el('div', 'tile',
          `<div class="tile__cat">🎤</div>
           <div class="tile__name">${esc(a.name)}</div>
           <div class="tile__meta">${dt ? '🗓 ' + esc(dt) : '出演アーティスト'}</div>
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
      /* 「行きたい出店」タブ：第2層チップで wishlist / visited / nextyear を切替 */
      const subCounts = {
        wishlist: state.fav.shops.length,
        visited: state.visited.length,
        nextyear: state.nextYear.length
      };
      const subTabs = el('div', 'chips chips--sub');
      [['wishlist', '⭐ 行きたい'],
       ['visited',  '✅ 行った'],
       ['nextyear', '🌱 来年']
      ].forEach(sb => {
        const c = el('button', 'chip' + (state.myplanShopSubTab === sb[0] ? ' active' : ''),
          sb[1] + ' (' + subCounts[sb[0]] + ')');
        c.onclick = () => { state.myplanShopSubTab = sb[0]; renderMyplan(); };
        subTabs.appendChild(c);
      });
      root.appendChild(subTabs);

      const sub = state.myplanShopSubTab;
      let list = [];
      let emptyMsg = '';
      if (sub === 'wishlist') {
        list = SHOPS.filter(s => isFav('shops', s.id));
        emptyMsg = '<div class="big">🛍️</div>行きたい出店を登録すると<br>ここに一覧表示されます';
      } else if (sub === 'visited') {
        list = SHOPS.filter(s => isVisited(s.id));
        emptyMsg = '<div class="big">✅</div>出店モーダルで「行った」をタップすると<br>ここに一覧表示されます';
      } else {
        list = SHOPS.filter(s => isNextYear(s.id));
        emptyMsg = '<div class="big">🌱</div>「来年も行きたい」と思った出店を<br>モーダルからチェックして残しておきましょう';
      }

      /* wishlist サブタブの最上段：マイプランをシェアボタン。
         （旧「行きたい出店をマップで動線確認」を撤去してここに置き換え） */
      if (sub === 'wishlist' && list.length) {
        const shareBtn = el('button', 'plan-map-btn',
          'マイプランをシェア');
        shareBtn.onclick = () => showMyplanImagePreview();
        root.appendChild(shareBtn);
      }

      /* nextyear サブタブの最上段：「今年の心残り」サジェスト
         fav に入れたが visited に入っていない出店を抽出 → ワンタップで来年に一括追加 */
      if (sub === 'nextyear') {
        const regrets = SHOPS.filter(s =>
          isFav('shops', s.id) && !isVisited(s.id) && !isNextYear(s.id));
        if (regrets.length) {
          const rec = el('div', 'regret-card');
          rec.innerHTML =
            '<div class="regret-card__head">次は、ここから — ' + regrets.length + ' 店</div>' +
            '<div class="regret-card__sub">気になっていたけれど「行った」にチェックされていない出店です。ワンタップで来年リストに追加できます。</div>';
          const addAll = el('button', 'btn btn--primary regret-card__btn',
            '🌱 ' + regrets.length + ' 店をまとめて来年リストへ');
          addAll.onclick = () => {
            regrets.forEach(s => {
              if (!isNextYear(s.id)) state.nextYear.push(s.id);
            });
            saveNextYear();
            toast(regrets.length + ' 店を来年リストに追加');
            renderMyplan();
          };
          rec.appendChild(addAll);
          root.appendChild(rec);
        }
      }

      if (!list.length) {
        root.appendChild(el('div', 'empty', emptyMsg));
        appendMyplanSettings(root);
        return;
      }
      const g = el('div', 'list-grid');
      list.forEach(s => {
        const badgeArr = [
          isVisited(s.id) ? '<span class="tile__badge tile__badge--visited">✅</span>' : '',
          hasNote(s.id) ? '<span class="tile__badge tile__badge--memo">📝</span>' : '',
          isNextYear(s.id) ? '<span class="tile__badge tile__badge--nextyear">🌱</span>' : ''
        ].filter(Boolean);
        const badges = badgeArr.join('');
        const badgeCls = badgeArr.length ? ' tile--has-badges tile--badges-' + badgeArr.length : '';
        const t = el('div', 'tile tile--shop' + (isVisited(s.id) ? ' tile--visited' : '') + badgeCls,
          `<div class="tile__name">${esc(s.name)}</div>
           <div class="tile__meta">📍 ${esc(shortName(s.zoneName))}</div>
           ${badges ? `<div class="tile__badges">${badges}</div>` : ''}
           <button class="tile__fav">${isFav('shops', s.id) ? '★' : '☆'}</button>`);
        t.onclick = () => openShop(s.id);
        t.querySelector('.tile__fav').onclick = e => {
          e.stopPropagation(); toggleFav('shops', s.id); saveFav();
          toast(isFav('shops', s.id) ? '★ 行きたいに追加' : '行きたいから削除');
          renderMyplan(); updateTabBadge();
        };
        /* visited サブタブではメモの先頭2行を併記（タグ＋本文の冒頭） */
        if (sub === 'visited') {
          const n = getNote(s.id);
          if (n.tags.length || n.body) {
            const m = el('div', 'tile__notepreview');
            const tagLine = n.tags.length
              ? '<div class="tile__notetags">' + n.tags.slice(0, 3).map(x => '#' + esc(x)).join(' ') + '</div>'
              : '';
            const bodyLine = n.body
              ? '<div class="tile__notebody">' + esc(n.body.replace(/\n+/g, ' ').slice(0, 60)) + (n.body.length > 60 ? '…' : '') + '</div>'
              : '';
            m.innerHTML = tagLine + bodyLine;
            t.appendChild(m);
          }
        }
        g.appendChild(t);
      });
      root.appendChild(g);
      appendMyplanSettings(root);
    }
  }

  /* マイプラン最下段の「設定」セクション：シェア／エクスポート／インポート */
  function appendMyplanSettings(root) {
    /* シェア／画像書き出しは「もっと使いたい人」向けのアクション。
       JSON 入出力（バックアップ）と段を分けて見せる。 */
    const shareWrap = el('div', 'myplan-settings');
    shareWrap.innerHTML = '<div class="myplan-settings__head">↗ マイプランをシェア</div>' +
      '<div class="myplan-settings__sub">行きたい・行った・来年の総数を、画像 or テキストで友達に。</div>';
    const shareRow = el('div', 'myplan-settings__btns');
    const imgBtn = el('button', 'btn btn--ghost', '📸 画像で書き出す');
    imgBtn.onclick = exportMyplanImage;
    const textBtn = el('button', 'btn btn--ghost', '↗ テキストでシェア');
    textBtn.onclick = shareMyplanText;
    shareRow.appendChild(imgBtn);
    shareRow.appendChild(textBtn);
    shareWrap.appendChild(shareRow);
    root.appendChild(shareWrap);

    const wrap = el('div', 'myplan-settings');
    wrap.innerHTML = '<div class="myplan-settings__head">⚙️ データの保存</div>' +
      '<div class="myplan-settings__sub">記録は端末のブラウザに保存されています。機種変更・ブラウザデータ消去に備えてバックアップを取れます。</div>';
    const btnRow = el('div', 'myplan-settings__btns');
    const exportBtn = el('button', 'btn btn--ghost', '⬇️ JSONで書き出す');
    exportBtn.onclick = exportMyplan;
    const importBtn = el('button', 'btn btn--ghost', '⬆️ JSONを読み込む');
    importBtn.onclick = () => $('#myplanImportFile').click();
    btnRow.appendChild(exportBtn);
    btnRow.appendChild(importBtn);
    wrap.appendChild(btnRow);
    /* 隠しファイル入力 */
    const fileInput = el('input', '');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.id = 'myplanImportFile';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => importMyplan(e.target.files && e.target.files[0]);
    wrap.appendChild(fileInput);
    root.appendChild(wrap);
  }

  /* テキストシェア：マイプランの総数を読みやすい一文にまとめてシェア（絵文字なし） */
  function shareMyplanText() {
    const v = state.visited.length;
    const n = state.nextYear.length;
    const lines = ['今年の森道、めぐったのは ' + v + ' 店。'];
    if (n > 0) lines.push('来年こそは ' + n + ' 店。');
    lines.push('');
    lines.push('#森道市場2026 #森道市場');
    shareOrCopy({
      title: '2026 年の、わたしの森道。',
      text: lines.join('\n'),
      url: APP_URL
    });
  }

  /* マイプランカード画像を 1080x1920（9:16）で描画して canvas を返す。
     コンセプト：チケットスタブ型・媒体名は載せず純粋に「私のフェス記録」。
     ポイント色は朱赤（巡った）と群青（来年こそは）の2色で対比を作る。 */
  function generateMyplanCanvas() {
    const W = 1080, H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    /* カラーパレット：紙＋墨をベースに、朱赤と群青の2色で2項目を対比 */
    const COLOR = {
      paper:   '#F2EBDC',  /* 生成り紙 */
      ink:     '#1A1410',  /* 墨 */
      crimson: '#B5341F',  /* 朱（01・巡った の差し色） */
      indigo:  '#2E4A6B',  /* 群青（02・来年こそは の差し色） */
      sub:     '#6E5F4E',  /* 茶系・補助テキスト */
      hair:    'rgba(26,20,16,0.18)' /* 細い罫線 */
    };
    /* フォント（system フォント前提） */
    const FONT = {
      jp:  '-apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif',
      en:  '"SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
      mono:'"SF Mono", "Menlo", monospace'
    };

    /* 数値とリスト */
    const visited  = state.visited.length;
    const nextYr   = state.nextYear.length;
    const visitedShops = SHOPS.filter(s => isVisited(s.id));
    const nextYearShops = SHOPS.filter(s => isNextYear(s.id));

    /* 1. 紙の地 */
    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';

    /* 2. 上下ミシン目フレーム（半券らしさ） */
    ctx.strokeStyle = COLOR.ink;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(80, 220); ctx.lineTo(W - 80, 220); ctx.stroke();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, 240); ctx.lineTo(W - 80, 240); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80, 1800); ctx.lineTo(W - 80, 1800); ctx.stroke();
    ctx.setLineDash([]);

    /* 3. 上部の半券メタ（媒体名は入れない） */
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR.sub;
    ctx.font = '500 22px ' + FONT.mono;
    ctx.fillText('TICKET STUB', 80, 170);
    ctx.textAlign = 'right';
    const today = new Date();
    const serial = 'No. ' +
      String(today.getDate()).padStart(2,'0') +
      String(today.getMonth()+1).padStart(2,'0') + ' / 2026';
    ctx.fillText(serial, W - 80, 170);

    /* 4. メインタイトル */
    ctx.textAlign = 'center';
    ctx.fillStyle = COLOR.ink;
    ctx.font = '900 56px ' + FONT.en;
    ctx.fillText('MORIMICHI ICHIBA', W/2, 350);
    ctx.font = '500 36px ' + FONT.jp;
    ctx.fillText('森、道、市場', W/2, 406);
    ctx.font = '900 84px ' + FONT.en;
    ctx.fillText('2026.05.22 - 24', W/2, 520);
    ctx.fillStyle = COLOR.sub;
    ctx.font = '300 28px ' + FONT.jp;
    ctx.fillText('ラグーナビーチ ／ 蒲郡', W/2, 570);

    /* 5. キャッチコピー */
    ctx.fillStyle = COLOR.ink;
    ctx.font = '500 44px ' + FONT.jp;
    ctx.fillText('わたしの森道。', W/2, 680);

    /* 6. 2項目の数値ブロック（巡った／来年こそは）。中央分割の細罫 */
    const BLOCK_TOP = 760;
    const COL_L = W/4;
    const COL_R = W*3/4;
    ctx.strokeStyle = COLOR.hair;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2, BLOCK_TOP); ctx.lineTo(W/2, 1740); ctx.stroke();

    /* 左セル：めぐった（朱赤の番号） */
    ctx.textAlign = 'center';
    ctx.fillStyle = COLOR.crimson;
    ctx.font = '500 26px ' + FONT.mono;
    ctx.fillText('01', COL_L, BLOCK_TOP + 40);
    ctx.fillStyle = COLOR.ink;
    ctx.font = '900 44px ' + FONT.jp;
    ctx.fillText('めぐった', COL_L, BLOCK_TOP + 100);
    ctx.font = '900 168px ' + FONT.en;
    ctx.fillText(String(visited), COL_L, BLOCK_TOP + 250);
    ctx.fillStyle = COLOR.sub;
    ctx.font = '300 22px ' + FONT.en;
    ctx.fillText('STOPS · VISITED', COL_L, BLOCK_TOP + 295);

    /* 右セル：来年こそは（群青の番号） */
    ctx.fillStyle = COLOR.indigo;
    ctx.font = '500 26px ' + FONT.mono;
    ctx.fillText('02', COL_R, BLOCK_TOP + 40);
    ctx.fillStyle = COLOR.ink;
    ctx.font = '900 44px ' + FONT.jp;
    ctx.fillText('来年こそは', COL_R, BLOCK_TOP + 100);
    ctx.font = '900 168px ' + FONT.en;
    ctx.fillText(String(nextYr), COL_R, BLOCK_TOP + 250);
    ctx.fillStyle = COLOR.sub;
    ctx.font = '300 22px ' + FONT.en;
    ctx.fillText('FOR NEXT YEAR', COL_R, BLOCK_TOP + 295);

    /* 7. 店舗名リスト（各カラムに縦並び）。差し色の短い下線をタイトル下に */
    const LIST_TOP = BLOCK_TOP + 360;
    const LIST_BOTTOM = 1740;
    const LIST_LINE_H = 42;
    const MAX_LINES = Math.floor((LIST_BOTTOM - LIST_TOP) / LIST_LINE_H);

    function drawShopList(centerX, items, accentColor) {
      /* 差し色の短い下線（リスト見出しの区切り） */
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 42, LIST_TOP - 14);
      ctx.lineTo(centerX + 42, LIST_TOP - 14);
      ctx.stroke();
      /* 中央揃えで店舗名を描く */
      ctx.textAlign = 'center';
      ctx.fillStyle = COLOR.ink;
      ctx.font = '500 26px ' + FONT.jp;
      const willOverflow = items.length > MAX_LINES;
      const showCount = willOverflow ? MAX_LINES - 1 : items.length;
      for (let i = 0; i < showCount; i++) {
        const name = items[i].name;
        /* 12文字を超えるものは末尾省略 */
        const trimmed = name.length > 12 ? name.slice(0, 12) + '…' : name;
        ctx.fillText(trimmed, centerX, LIST_TOP + 26 + i * LIST_LINE_H);
      }
      if (willOverflow) {
        const rest = items.length - showCount;
        ctx.fillStyle = COLOR.sub;
        ctx.font = '500 22px ' + FONT.jp;
        ctx.fillText('ほか ' + rest + ' 店', centerX, LIST_TOP + 26 + showCount * LIST_LINE_H);
      }
      if (items.length === 0) {
        ctx.fillStyle = COLOR.sub;
        ctx.font = '300 22px ' + FONT.jp;
        ctx.fillText('— なし —', centerX, LIST_TOP + 26);
      }
    }
    drawShopList(COL_L, visitedShops,  COLOR.crimson);
    drawShopList(COL_R, nextYearShops, COLOR.indigo);

    /* 8. フッター（媒体名は入れず、フェス側の表記のみ） */
    ctx.textAlign = 'center';
    ctx.fillStyle = COLOR.sub;
    ctx.font = '500 20px ' + FONT.jp;
    ctx.fillText('森道市場 2026  非公式ガイド', W/2, 1860);

    return canvas;
  }

  /* プレビューモーダル：書き出し前に画像を確認、シェア／保存。
     iOS では img の長押しでカメラロール保存も可能。 */
  function showMyplanImagePreview() {
    const canvas = generateMyplanCanvas();
    const dataUrl = canvas.toDataURL('image/png');
    openModal(
      '<div class="modal__handle"></div>' +
      '<p class="image-preview__title">プレビュー</p>' +
      '<div class="image-preview">' +
        '<img src="' + dataUrl + '" alt="マイプラン プレビュー" class="image-preview__img">' +
      '</div>' +
      '<p class="image-preview__hint">画像を長押し（スマホ）でカメラロールに保存できます。下のボタンからもシェア／保存できます。</p>' +
      '<div class="modal__btns">' +
        '<button class="btn btn--primary" id="ipShare">シェア／保存する</button>' +
      '</div>'
    );
    const visited = state.visited.length;
    const nextYr  = state.nextYear.length;
    $('#ipShare').onclick = () => {
      canvas.toBlob((blob) => {
        if (!blob) { toast('画像の生成に失敗しました'); return; }
        const file = new File([blob], 'morimichi2026-mine.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: '2026 年の、わたしの森道。',
            text: '今年の森道、めぐったのは ' + visited + ' 店。来年こそは ' + nextYr + ' 店。\n#森道市場2026 #森道市場'
          }).catch(() => {});
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'morimichi2026-mine.png';
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
        toast('画像をダウンロードしました');
      }, 'image/png');
    };
  }

  /* マイページ「画像で書き出す」ボタンから呼ぶエントリポイント */
  function exportMyplanImage() {
    showMyplanImagePreview();
  }
  /* 角丸矩形ヘルパ（Canvas） */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* 全マイプランデータを1ファイルにまとめてダウンロード */
  function exportMyplan() {
    const payload = {
      version: 1,
      app: 'morimichi2026',
      exportedAt: new Date().toISOString(),
      data: {
        fav: state.fav,
        visited: state.visited,
        nextYear: state.nextYear,
        notes: state.notes,
        checks: state.checks
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'morimichi2026-myplan-' + yyyymmdd + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    toast('マイプランを書き出しました');
  }

  /* JSONファイルを読み込み、現在のデータを上書き
     サニタイズは要素レベルまで（破損データ部分はスキップして残りを採用）。 */
  function importMyplan(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const obj = JSON.parse(e.target.result);
        if (!obj || obj.app !== 'morimichi2026' || obj.version !== 1 || !obj.data) {
          alert('このファイルはマイプランの書き出しファイルではないようです。');
          return;
        }
        if (!confirm('現在の記録を、ファイルの内容で上書きします。よろしいですか？\n（書き出し日時：' +
                     (obj.exportedAt || '不明') + '）')) return;
        const d = obj.data;
        let skipped = 0;
        /* 文字列配列ヘルパ：要素単位で型チェック、不正はスキップ */
        const strArr = (a) => {
          if (!Array.isArray(a)) { skipped++; return null; }
          const out = []; for (const x of a) { if (typeof x === 'string') out.push(x); else skipped++; }
          return out;
        };
        /* fav は {artists:[], shops:[]} 形式を強要 */
        if (d.fav && typeof d.fav === 'object' && !Array.isArray(d.fav)) {
          const fa = strArr(d.fav.artists), fs = strArr(d.fav.shops);
          if (fa && fs) state.fav = { artists: fa, shops: fs };
          else skipped++;
        }
        /* visited / nextYear は文字列配列 */
        const vis = strArr(d.visited); if (vis) state.visited = vis;
        const ny  = strArr(d.nextYear); if (ny)  state.nextYear = ny;
        /* notes は {[id]: NoteObj}。各 NoteObj を setNote 経由でサニタイズ */
        if (d.notes && typeof d.notes === 'object' && !Array.isArray(d.notes)) {
          state.notes = {};
          for (const id of Object.keys(d.notes)) {
            const n = d.notes[id];
            if (n && typeof n === 'object' && !Array.isArray(n)) {
              setNote(id, n);
            } else { skipped++; }
          }
        }
        /* checks はオブジェクト */
        if (d.checks && typeof d.checks === 'object' && !Array.isArray(d.checks)) {
          state.checks = d.checks;
        }
        sanitizeState();
        saveFav(); saveVisited(); saveNextYear(); saveNotes();
        save('mm2026_checks', state.checks);
        toast(skipped > 0
          ? 'マイプランを読み込みました（' + skipped + '件の不正データはスキップ）'
          : 'マイプランを読み込みました');
        renderMyplan(); updateTabBadge();
        if (state.view === 'shops') renderShopList();
      } catch (err) {
        alert('ファイルを読み込めませんでした：' + (err && err.message ? err.message : err));
      }
    };
    reader.readAsText(file);
  }

  /* ============================================================
     モーダル
  ============================================================ */
  let modalOpen = false, modalLastFocus = null;
  function openModal(html) {
    const body = $('#modalBody'), bg = $('#modalBg');
    /* 全モーダル共通で、右上に明示的な「✕」閉じるボタンを差し込む。
       モーダル外タップ／Escape／スワイプバックでも閉じられるが、上部に
       タップ可能な明示ボタンを置くことで「戻りにくさ」を解消する。 */
    body.innerHTML =
      '<button class="modal__close" id="modalCloseBtn" type="button" aria-label="閉じる">✕</button>' + html;
    const closeBtn = body.querySelector('#modalCloseBtn');
    if (closeBtn) closeBtn.onclick = () => closeModal();
    modalLastFocus = document.activeElement;
    bg.classList.add('open');
    /* Android のハードウェア戻る / iOS スワイプバックで閉じられるよう履歴に積む */
    if (!modalOpen) {
      modalOpen = true;
      try { history.pushState({ modal: 1 }, ''); } catch (e) {}
    }
    /* フォーカスをモーダル内へ移す（キーボード／スクリーンリーダー対応）。
       閉じるボタンには初期フォーカスを当てない（誤タップ防止のため
       一番上のコンテンツ要素を優先）。 */
    const first = body.querySelector('button:not(#modalCloseBtn), a, input');
    if (first) setTimeout(() => { try { first.focus(); } catch (e) {} }, 30);
  }
  /* fromPop=true は popstate 由来（履歴は既に戻っている）。
     ユーザー操作（×ボタン等）由来は履歴を1つ戻して整合させる。 */
  function closeModal(fromPop) {
    const bg = $('#modalBg');
    if (!bg.classList.contains('open')) return;
    /* メモ入力中に閉じられても未確定分を確実に保存する。
       _noteSaveTimer が走っていればキャンセルして即時 save。 */
    if (_noteSaveTimer) { clearTimeout(_noteSaveTimer); _noteSaveTimer = null; }
    saveNotes();
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

  /* ============================================================
     初回ポップアップ：新しくなったマイページの紹介
     初めて開く人（および以前にお礼ポップアップで保存されたフラグを持つ人）
     にも、新機能の説明として1回だけ表示する。新キーを使うため、
     既存ユーザーへの「既読」状態は引き継がない。 */
  function showThanksPopupIfFirst() {
    let seen = '';
    try { seen = localStorage.getItem('mm2026_intro_seen_v1') || ''; } catch (e) {}
    if (seen === '1') return;

    const html =
      '<div class="thanks-popup">' +
        '<h2 class="thanks-popup__title">マイページが新しくなりました</h2>' +
        '<div class="thanks-popup__body">' +
          '<p>森道2026を「あとから振り返って残す」ための4つの機能を、マイページに追加しました。</p>' +
          '<ul class="thanks-popup__list">' +
            '<li><b>めぐった出店を記録</b>　出店をタップして「行った」を選ぶと、タイルに印が付きます。</li>' +
            '<li><b>来年こそはリスト</b>　気になっていたのに行けなかった店を、来年に持ち越し。</li>' +
            '<li><b>店ごとのメモ</b>　おすすめ・また来たい・写真映え… タグ＋自由メモを500字まで。</li>' +
            '<li><b>マイプランをシェア</b>　「わたしの森道」を1枚の画像にして、SNSに残せます。</li>' +
          '</ul>' +
          '<p>会期中の慌ただしさが落ち着いたら、ぜひ振り返ってみてください。</p>' +
        '</div>' +
        '<div class="thanks-popup__actions">' +
          '<button class="thanks-popup__btn thanks-popup__btn--primary" ' +
            'id="introOpenBtn" type="button">マイページを開く</button>' +
          '<button class="thanks-popup__btn thanks-popup__btn--close" ' +
            'id="thanksCloseBtn" type="button">あとで</button>' +
        '</div>' +
      '</div>';

    openModal(html);

    /* 「見た」フラグの保存。マイページを開いた／閉じたのいずれでも保存し、
       再表示を抑止する。 */
    function markSeen() {
      try { localStorage.setItem('mm2026_intro_seen_v1', '1'); } catch (e) {}
    }
    const openBtn = document.getElementById('introOpenBtn');
    const closeBtn = document.getElementById('thanksCloseBtn');
    if (openBtn) openBtn.addEventListener('click', () => {
      markSeen();
      closeModal();
      setTimeout(() => switchView('myplan'), 50);
    });
    if (closeBtn) closeBtn.addEventListener('click', () => {
      markSeen();
      closeModal();
    });
    const bg = document.getElementById('modalBg');
    if (bg && typeof MutationObserver !== 'undefined') {
      const obs = new MutationObserver(() => {
        if (!bg.classList.contains('open')) {
          markSeen();
          obs.disconnect();
        }
      });
      obs.observe(bg, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function openArtist(id) {
    const a = ARTISTS.find(x => x.id === id); if (!a) return;
    pushRecent('artists', a.id);
    const faved = isFav('artists', a.id);
    const dt = artistDaysText(a);
    openModal(
      `<div class="modal__handle"></div>
       <div class="modal__cat">🎤</div>
       <div class="modal__title">${esc(a.name)}</div>
       <div class="modal__sub">出演アーティスト</div>
       <div class="modal__row"><div class="ico">🗓</div><div>
         <div class="k">出演日</div>
         <div class="v">${dt ? esc(dt) : '公式タイムテーブルでご確認ください'}</div></div></div>
       <div class="modal__row"><div class="ico">🕒</div><div>
         <div class="k">ステージ・時間</div>
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
    const visited = isVisited(s.id);
    const nextYr = isNextYear(s.id);
    const note = getNote(s.id);
    const tagsHtml = NOTE_TAGS.map(t => {
      const on = note.tags.indexOf(t) !== -1;
      return `<button type="button" class="chip ${on ? 'active' : ''}" data-note-tag="${esc(t)}">${esc(t)}</button>`;
    }).join('');
    openModal(
      `<div class="modal__handle"></div>
       <div class="modal__cat">${s.catIcon}</div>
       <div class="modal__title">${esc(s.name)}</div>
       <div class="modal__sub">出店ショップ</div>
       <div class="modal__row"><div class="ico">📍</div><div>
         <div class="k">出店エリア</div><div class="v">${esc(s.zoneName)}</div></div></div>
       ${s.hasMapPos && s.booth ? `<div class="modal__row"><div class="ico">🔢</div><div>
         <div class="k">会場マップ ブース番号</div>
         <div class="v">${esc(shortName(s.zoneName))} ${s.booth}番</div></div></div>` : ''}
       ${s.days ? `<div class="modal__row"><div class="ico">📅</div><div>
         <div class="k">出店日</div>
         <div class="v">${s.days.map(id => {
           const d = FESTIVAL.days.find(x => x.id === id);
           return d ? d.label + '(' + ({FRI:'金',SAT:'土',SUN:'日'}[d.dow] || d.dow) + ')' : id;
         }).join('・')}のみ</div></div></div>` : ''}
       <p style="font-size:10.5px;color:var(--sub);margin:2px 4px 10px">${
         s.hasMapPos
           ? '「マップで見る」で、①出店一覧の店名（赤枠）②出店一覧のエリア名（赤丸）③そのエリアが会場マップ上のどこにあるか（📍ピン＋赤丸）の3点を表示します。' +
             (s.booth ? '会場では出店一覧の番号「' + s.booth + '」と同じ番号のブースが目印です。' :
              '会場内の詳しい位置は会場マップでご確認ください。')
           : 'この出店は公式サイトで追加確認した店舗です。会場マップ上の正確な位置は未取得のため、現地では「' +
             esc(shortName(s.zoneName)) + '」エリアの案内・公式マップでご確認ください。'}</p>
       <div class="modal__btns modal__btns--triple">
         <button class="btn btn--fav ${faved ? 'on' : ''}" id="sFav" title="マイプランに追加">${faved ? '★ 行きたい' : '☆ 行きたい'}</button>
         <button class="btn btn--visited ${visited ? 'on' : ''}" id="sVisited" title="行った／訪問済み">${visited ? '✅ 行った' : '⬜ 行った'}</button>
         <button class="btn btn--nextyear ${nextYr ? 'on' : ''}" id="sNextYr" title="来年も行きたい">${nextYr ? '🌱 来年' : '🌿 来年'}</button>
       </div>
       <div class="note-block">
         <div class="note-block__head">📝 メモ・おすすめ</div>
         <div class="chips note-block__tags" id="sNoteTags">${tagsHtml}</div>
         <textarea class="note-block__body" id="sNoteBody" maxlength="500" placeholder="例：◯◯がおすすめ／また来たい／開場すぐ売り切れ など（500字まで）">${esc(note.body)}</textarea>
         <div class="note-block__count"><span id="sNoteCount">${noteBodyLen(note.body)}</span> / 500</div>
       </div>
       ${s.hasMapPos ? `<div class="modal__btns">
         <button class="btn btn--primary" id="sMap">🗺️ マップで店名・エリアを見る</button></div>` : ''}
       <div class="modal__btns">
         <button class="btn btn--ghost" id="sShare">↗ この出店をシェア</button>
       </div>`);
    $('#sFav').onclick = () => {
      toast(toggleFav('shops', s.id) ? '★ マイプランに追加' : 'マイプランから削除');
      saveFav(); openShop(id); updateTabBadge();
      if (state.view === 'shops') renderShopList();
      if (state.view === 'myplan') renderMyplan();
    };
    $('#sVisited').onclick = () => {
      toast(toggleVisited(s.id) ? '✅ 行ったに追加' : '行ったから削除');
      saveVisited(); openShop(id);
      if (state.view === 'shops') renderShopList();
      if (state.view === 'myplan') renderMyplan();
    };
    $('#sNextYr').onclick = () => {
      toast(toggleNextYear(s.id) ? '🌱 来年に追加' : '来年から削除');
      saveNextYear(); openShop(id);
      if (state.view === 'myplan') renderMyplan();
    };
    /* メモ：タグはクリックで toggle、本文は入力で debounce 保存 */
    $$('#sNoteTags .chip').forEach(c => c.onclick = (e) => {
      e.preventDefault();
      const t = c.getAttribute('data-note-tag');
      const cur = getNote(s.id);
      const i = cur.tags.indexOf(t);
      const added = i === -1;
      if (added) cur.tags.push(t); else cur.tags.splice(i, 1);
      setNote(s.id, cur);
      c.classList.toggle('active');
      scheduleSaveNotes(0);  /* タグ toggle は即保存 */
      /* 保存されたことが伝わるよう toast を即出す */
      toast((added ? '＃' : '× ') + t);
      if (state.view === 'shops') renderShopList();
      if (state.view === 'myplan') renderMyplan();
    });
    const sNoteBody = $('#sNoteBody');
    const sNoteCount = $('#sNoteCount');
    if (sNoteBody) {
      sNoteBody.oninput = () => {
        /* コードポイント単位で 500 字に切り詰め、絵文字の二重カウントを防ぐ */
        const arr = [...sNoteBody.value];
        let v = arr.length > 500 ? arr.slice(0, 500).join('') : sNoteBody.value;
        if (v !== sNoteBody.value) sNoteBody.value = v;
        if (sNoteCount) sNoteCount.textContent = String(noteBodyLen(v));
        const cur = getNote(s.id);
        cur.body = v;
        setNote(s.id, cur);
        scheduleSaveNotes(500);
      };
      /* モーダルを閉じる前に未確定の保存を確定させる（メモ即時保存の保険） */
      sNoteBody.onblur = () => { scheduleSaveNotes(0); };
    }
    const sMap = $('#sMap');
    if (sMap) sMap.onclick = () => {
      closeModal();
      state.highlightShop = s.id;
      state.selectedZone = null;
      state.mapShopQuery = '';
      switchView('map');
      toast('マップ上で「' + s.name + '」をハイライト');
    };
    const sShare = $('#sShare');
    if (sShare) sShare.onclick = () => {
      shareOrCopy({
        title: s.name + ' @森道市場2026',
        text: '『' + s.name + '』@ ' + shortName(s.zoneName) + ' — 森道市場2026 非公式ガイド',
        url: APP_URL + '#shop=' + encodeURIComponent(s.id)
      });
    };
  }

  /* ============================================================
     初期化
  ============================================================ */
  function init() {
    sanitizeState();
    /* 検索用キーを事前計算（毎キーストロークの再計算を避ける）。
       nk … 名前の正規化キー（既存互換）
       nkRoma / aliasNk / aliasRoma … 英⇄カナ相互検索用の補助キー。
       アーティストは50音順にソートしておく。 */
    SHOPS.forEach(s => {
      var k = buildSearchKeys(s.name, s.aliases);
      s.nk = k.nk; s.nkRoma = k.nkRoma;
      s.aliasNk = k.aliasNk; s.aliasRoma = k.aliasRoma;
    });
    ARTISTS.forEach(a => {
      var k = buildSearchKeys(a.name, a.aliases);
      a.nk = k.nk; a.nkRoma = k.nkRoma;
      a.aliasNk = k.aliasNk; a.aliasRoma = k.aliasRoma;
    });
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
    /* シェアURL（#shop=sN）で来訪した場合、該当出店のモーダルを自動で開く。
       存在しないIDは無視。お礼ポップアップとの競合を避けるため、ポップアップ評価より先に処理。 */
    try {
      const h = (location.hash || '').replace(/^#/, '');
      const m = /^shop=(.+)$/.exec(h);
      if (m) {
        const target = decodeURIComponent(m[1]);
        if (SHOPS.some(s => s.id === target)) {
          setTimeout(() => openShop(target), 200);
        }
      }
    } catch (e) {}
    /* 初期描画が落ち着いてからお礼ポップアップを評価（一度きり表示） */
    setTimeout(showThanksPopupIfFirst, 300);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
