const CACHE_NAME = 'ajb-learn-v3';
const APP_SHELL = [
  './',
  './index.html',
  './course.html',
  './ebook.html',
  './practice.html',
  './quiz.html',
  './dashboard.html',
  './login.html',
  './reset-password.html',
  './subscription.html',
  './css/ajb-premium.css',
  './js/site.js',
  './js/learning.js',
  './js/resources.js',
  './js/mcq-page.js',
  './assets/images/ajb-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
