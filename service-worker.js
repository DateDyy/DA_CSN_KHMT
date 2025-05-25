const CACHE_NAME = 'four-in-line-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './NewGame.js',
  './img/four-in-line.png',
  './img/sound-on.png',
  './img/sound-off.png',
  './img/BG_Blue.jpg',
  './img/BG_Green.jpg',
  './img/BG_Wood.png',
  './img/lightbulb-32.png',
  './sounds/background.mp3',
  './sounds/blueBG.mp3',
  './sounds/greenbackground.mp3',
  './sounds/woodBG.mp3',
  './sounds/drop.wav',
  './sounds/win.mp3',
  './sounds/draw.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});