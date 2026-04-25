/*
  =============================================================
  STOPWATCH SERVICE WORKER — offline caching
  =============================================================
  This file enables the stopwatch to run with no internet
  connection after the first visit.

  VERSION: bump this number any time you update index.html
  so the old cache gets replaced with the new version.
  e.g. change 'stopwatch-v1' to 'stopwatch-v2'
  =============================================================
*/

var CACHE_NAME = 'stopwatch-v1';

var CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

/* Install — cache everything on first load */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* Activate — clean up any old caches */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* Fetch — serve from cache, fall back to network */
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});
