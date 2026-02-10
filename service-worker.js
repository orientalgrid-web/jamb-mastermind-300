// Service Worker for JAMB Mastermind 300 with Offline Support
const CACHE_NAME = 'jamb-mastermind-v1.1';
const OFFLINE_URL = 'offline.html';
const STATIC_CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  // CSS and Fonts
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Segoe+UI:wght@300;400;500;600;700&display=swap',
  // Icons for offline
  'https://cdn-icons-png.flaticon.com/512/2237/2237282.png',
  // JavaScript files (cache your scripts if you have separate ones)
  // './scripts/app.js',
  // './scripts/questions.js'
];

// Install event - Cache all static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Cache installation failed:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event with offline strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests and chrome-extension
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // API requests - Network first, then cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For all other requests: Cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();
            
            // Cache the new response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(error => {
            console.log('[Service Worker] Network failed, serving offline page:', error);
            
            // If request is for a page, show custom offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL)
                .then(offlinePage => offlinePage || new Response('You are offline. Please check your internet connection.'));
            }
            
            // For other resources, return a fallback
            if (event.request.url.includes('.css')) {
              return new Response('/* Offline - Styles not available */', {
                headers: { 'Content-Type': 'text/css' }
              });
            }
            
            if (event.request.url.includes('.js')) {
              return new Response('// Offline - JavaScript not available', {
                headers: { 'Content-Type': 'application/javascript' }
              });
            }
            
            // Default fallback
            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for quiz results
self.addEventListener('sync', event => {
  if (event.tag === 'sync-quiz-results') {
    console.log('[Service Worker] Background sync for quiz results');
    event.waitUntil(syncPendingResults());
  }
});

async function syncPendingResults() {
  try {
    // Get pending results from IndexedDB or localStorage
    const pendingResults = JSON.parse(localStorage.getItem('pendingResults') || '[]');
    
    if (pendingResults.length > 0) {
      // Send to server
      const response = await fetch('/api/sync-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingResults)
      });
      
      if (response.ok) {
        // Clear pending results after successful sync
        localStorage.removeItem('pendingResults');
        console.log('[Service Worker] Pending results synced successfully');
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Periodic sync for background updates
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-questions') {
    event.waitUntil(updateQuestionCache());
  }
});

async function updateQuestionCache() {
  console.log('[Service Worker] Updating question cache in background');
  // You can periodically update question database here
}

// Push notifications (optional)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: 'https://cdn-icons-png.flaticon.com/512/2237/2237282.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/2237/2237282.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: 'https://cdn-icons-png.flaticon.com/512/2237/2237282.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: 'https://cdn-icons-png.flaticon.com/512/2237/2237282.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('JAMB Mastermind 300', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click received.');
  
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(clients.openWindow('/'));
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow('/'));
  }
});
