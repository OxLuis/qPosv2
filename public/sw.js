self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('v2').then((cache) => {
        return cache.addAll([
          './index.html',
          './css/styles.css',
          './css/all.min.css',
          './css/swiper-bundle.min.css',
          './css/tailwind.min.css',
          './js/script.js',
          './js/alpine.min.js',
          './js/index-min.js',
          './js/lottie.min.js',
          './js/main.js',
          './js/swiper-bundle.min.js',
          './img/icon-192x192.png',
          './img/icon-512x512.png',
          './img/slider/1.jpg',
          './img/slider/2.jpg',
          './img/slider/3.jpg',
          './img/app/cash.png',
          './img/app/cash.png',
          './img/app/credit.png',
          './img/app/debit.png',
          './img/app/logo.png',
          './img/app/qr.png',
          './img/app/here.png',
          './img/app/takeout.png',
          './img/app/error.json',
          './img/app/success.json',
          './img/app/pos.json',
          './img/app/qr.json',
          './img/app/debit.json',
          './img/app/credit.json',
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  