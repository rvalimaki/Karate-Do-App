// Offline shell for the handbook's web build.
//
// The app is three files — index.html, the wasm-bindgen glue, the wasm binary —
// and the asset names carry a content hash, so every build rewrites the list
// below and therefore the bytes of this file. That byte change is the only
// thing that makes a browser install a new worker, which is to say: it is how a
// deploy reaches a phone that already has the app on its home screen.
//
// The kata data is deliberately *not* cached here. The app fetches it from the
// data repo and keeps it in localStorage itself (see `spawn_bundle_sync` in
// data.rs), which already answers offline and already knows when to refetch.
// Caching it twice would only let the two copies disagree.
//
// Generated from web/sw.js.in by scripts/publish_web.sh — do not edit the copy
// under the published directory.

const CACHE = 'karate-do-3d5c27920d3e';
const SHELL = [
    "./",
    "manifest.webmanifest",
    "icons/apple-touch-icon.png",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/icon-maskable-512.png",
    "assets/karate-do-dxh8c42a62bc2c6ea13.js",
    "assets/karate-do_bg-dxhd9b05fbbbaa49e10.wasm"
];
// Absolute forms of the same list, to match incoming request URLs against.
const CACHED = new Set(SHELL.map(function (p) { return new URL(p, self.location).href; }));

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE)
            .then(function (c) { return c.addAll(SHELL); })
            // Don't sit in "waiting" until every tab closes: a home-screen app
            // is one tab that never closes, so the update would never land.
            .then(function () { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(keys.map(function (k) {
                    return k === CACHE ? null : caches.delete(k);
                }));
            })
            .then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (e) {
    const req = e.request;
    if (req.method !== 'GET') return;
    // Launching from the home screen asks for the scope root, and a reload can
    // ask for index.html by name; both mean "give me the app".
    if (req.mode === 'navigate') {
        e.respondWith(
            caches.match(SHELL[0]).then(function (r) { return r || fetch(req); })
        );
        return;
    }
    // Anything not in the shell — version.json, bundle.json, the YouTube
    // thumbnails — is the app's own traffic. Leaving it untouched keeps its
    // own cache directives (`no-store` on the data files) meaningful.
    const url = new URL(req.url);
    url.hash = '';
    if (!CACHED.has(url.href)) return;
    e.respondWith(
        caches.match(req).then(function (r) { return r || fetch(req); })
    );
});
