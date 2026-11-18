/* 마음숲 홈페이지 · 화면 저장(서비스 워커) v1 (2026-11-18)
   - 한 번 연 화면을 휴대폰에 저장해 두고, 다음에 열 때 저장본을 바로 보여 줌 → 뒤에서 새 화면을 받아 저장 (다음 열 때 반영)
   - 데이터(구글 시트·서버·AI 대화)는 저장하지 않고 늘 새로 받음 */
const CACHE = 'msq-home-v1';
const PRE = ["/", "/favicon.svg", "/favicon-32.png", "/apple-touch-icon.png", "/icon-192.png", "/site.webmanifest", "/coach-1.jpg", "/coach-2.jpg", "/coach-3.jpg", "/coach-4.jpg", "/coach-5.jpg"];
const CDN = /^https:\/\/(unpkg\.com\/lucide@|cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard@)/;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('msq-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function fresh(c, req, key) {
  return fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(key || req, res.clone()); return res; });
}
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === location.origin;
  if (!same && !CDN.test(r.url)) return;                       // 시트·서버·유튜브 등은 건드리지 않음
  if (same && (u.pathname.startsWith('/api/') || u.pathname.startsWith('/.netlify/'))) return;
  const page = same && r.mode === 'navigate' && (u.pathname === '/' || u.pathname === '/index.html');
  if (same && r.mode === 'navigate' && !page) return;           // 다른 페이지(사이트맵 등)는 그대로
  const key = page ? '/' : r;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key);
    const net = fresh(c, r, page ? '/' : null).catch(() => hit);
    if (hit) { e.waitUntil(net.then(() => {}, () => {})); return hit; }
    return net;
  }));
});
