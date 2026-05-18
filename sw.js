/* 森、道、市場 2026 ガイド — Service Worker
   コード（html/css/js）はネットワーク優先＝常に最新を表示。
   画像はキャッシュ優先＝オフラインでも高速表示。 */
const CACHE = 'mm2026-v10';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './img/mm2026_full.webp',
  './img/tt_d1.jpg',
  './img/tt_d2.jpg',
  './img/tt_d3.jpg',
  './img/icon-192.png',
  './img/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
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

  if (isCode(url)) {
    /* ネットワーク優先：オンラインなら常に最新、オフラインはキャッシュ */
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    /* 画像など：キャッシュ優先 */
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          return res;
        }).catch(() => cached)
      )
    );
  }
});
