// Service Worker pour le site ZOLA
const CACHE_NAME = 'zola-site-v1';
const STATIC_CACHE = 'zola-static-v1';
const DYNAMIC_CACHE = 'zola-dynamic-v1';

// Fichiers à mettre en cache statiquement
const STATIC_FILES = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/variables.css',
  '/css/components.css',
  '/css/animations.css',
  '/css/responsive.css',
  '/js/main.js',
  '/js/modules/config-manager.js',
  '/assets/config.json',
  '/manifest.json'
];

// Fichiers audio à mettre en cache
const AUDIO_FILES = [
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installation...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Cache statique ouvert');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Fichiers statiques mis en cache');
        return caches.open(DYNAMIC_CACHE);
      })
      .then(cache => {
        console.log('Service Worker: Cache dynamique ouvert');
        return cache.addAll(AUDIO_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installation terminée');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Erreur lors de l\'installation:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activation...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation terminée');
        return self.clients.claim();
      })
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Stratégie de cache pour les fichiers statiques
  if (STATIC_FILES.includes(url.pathname) || STATIC_FILES.includes(url.pathname + '/')) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(response => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then(cache => cache.put(request, responseClone));
              }
              return response;
            });
        })
    );
    return;
  }
  
  // Stratégie de cache pour les fichiers audio
  if (AUDIO_FILES.includes(request.url)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(response => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then(cache => cache.put(request, responseClone));
              }
              return response;
            });
        })
    );
    return;
  }
  
  // Stratégie de cache pour les images
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(response => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then(cache => cache.put(request, responseClone));
              }
              return response;
            });
        })
    );
    return;
  }
  
  // Stratégie par défaut : Network First avec fallback cache
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(response => {
            if (response) {
              return response;
            }
            // Fallback pour les pages HTML
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            return new Response('Ressource non disponible hors ligne', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Gestion des messages du client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Gestion des notifications push (futur)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/images/icon-192x192.png',
      badge: '/assets/images/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Voir le site',
          icon: '/assets/images/checkmark.png'
        },
        {
          action: 'close',
          title: 'Fermer',
          icon: '/assets/images/xmark.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Gestion des erreurs
self.addEventListener('error', event => {
  console.error('Service Worker: Erreur:', event.error);
});

// Gestion des rejets de promesses non gérés
self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Promesse rejetée non gérée:', event.reason);
});
