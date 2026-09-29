// Ao atualizar o site (ex.: novo bimestre), mude a versão abaixo
const CACHE = 'faltas-v3';
const ARQUIVOS = [
  './manifest.webmanifest',
  './config.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(chaves =>
      Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// A página pede para ser guardada (funciona com qualquer nome de arquivo)
self.addEventListener('message', e => {
  if (e.data && e.data.cachear) {
    caches.open(CACHE).then(c => c.add(e.data.cachear)).catch(() => {});
  }
});

// Internet primeiro (sempre a versão mais nova); sem internet, usa a cópia salva
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Só cuida dos arquivos do próprio site (estatísticas e outros sites passam direto)
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
        }
        return resp;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
