/* 森、道、市場 2026 ガイド — Service Worker
   コード（html/css/js）はネットワーク優先＝常に最新を表示。
   画像はキャッシュ優先＝オフラインでも高速表示。 */
const CACHE = 'mm2026-v69';

/* 起動に最低限必要なファイル（軽量）。1つでも失敗すると addAll は全体が
   失敗するため、個別に add し、失敗してもインストールを止めない。 */
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './img/icon-192.png',
  './img/icon-512.png'
];
/* 重い画像（マップ・タイテ）。install はブロックせず、バックグラウンドで
   先読みする。失敗しても初回アクセス時に cache-first で取得される。 */
const EXTRA = [
  './img/mm2026_full.webp',
  './img/tt_d1.jpg',
  './img/tt_d2.jpg',
  './img/tt_d3.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(CORE.map(u => c.add(u).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
  /* 画像の先読みは waitUntil に含めない＝回線が遅くても install を止めない */
  caches.open(CACHE).then(c =>
    EXTRA.forEach(u => c.add(u).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isCode(url) {
  return /\.(html|css|js)(\?|$)/.test(url) || url.endsWith('/');
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  /* 同一オリジン以外（Google Fonts 等）は素通し */
  if (url.indexOf(self.location.origin) !== 0) return;

  if (isCode(url)) {
    /* ネットワーク優先：オンラインなら常に最新、オフラインはキャッシュ。
       HTTPキャッシュを無視して必ず最新を取得する（更新が確実に届くように）。
       正常応答(2xx)のみキャッシュへ保存し、404/500を焼き付けない。
       キャッシュも無ければ index.html → ルートへ多段フォールバック。 */
    e.respondWith(
      fetch(e.request, { cache: 'reload' }).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }).catch(() =>
        caches.match(e.request)
          .then(hit => hit || caches.match('./index.html'))
          .then(hit => hit || caches.match('./'))
          .then(hit => hit || new Response(
            'オフラインです。電波の良い場所で再度お試しください。',
            { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))
      )
    );
  } else {
    /* 画像など：キャッシュ優先。未取得かつオフラインなら 503 を返す
       （undefined を respondWith しないことでハンドラ無応答を防ぐ）。 */
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          }
          return res;
        }).catch(() =>
          cached || new Response('', { status: 503, statusText: 'offline' })
        )
      )
    );
  }
});
