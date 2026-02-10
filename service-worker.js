// Simple offline support
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return new Response('App is working offline!');
    })
  );
});
