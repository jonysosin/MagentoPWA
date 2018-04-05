var cacheName = 'cache-v4';

//Files to save in cache
var files = ['./', './index.html?utm=homescreen', "/static-page.html", "/terminos-y-condiciones", "/privacy-policy-cookie-restriction-mode"];

//Adding `install` event listener
self.addEventListener('install', function (event) {
    console.info('Event: Install');

    event.waitUntil(caches.open(cacheName).then(function (cache) {
        //[] of files to cache & if any of the file not present `addAll` will fail
        return cache.addAll(files).then(function () {
            console.info('All files are cached');
            return self.skipWaiting(); //To forces the waiting service worker to become the active service worker
        }).catch(function (error) {
            console.error('Failed to cache', error);
        });
    }));
});

/*
  FETCH EVENT: triggered for every request made by index page, after install.
*/

//Adding `fetch` event listener
self.addEventListener('fetch', function (event) {
    console.info('Event: Fetch');

    var request = event.request;
    debugger;

    //Tell the browser to wait for newtwork request and respond with below
    event.respondWith(
        //If request is already in cache, return it
        caches.match(request).then(function (response) {
            if (response) {
                return response;
            }

            // // Checking for navigation preload response
            // if (event.preloadResponse) {
            //   console.info('Using navigation preload');
            //   return response;
            // }

            //if request is not cached or navigation preload response, add it to cache
            return fetch(request).then(function (response) {
                var responseToCache = response.clone();
                caches.open(cacheName).then(function (cache) {
                    cache.put(request, responseToCache).catch(function (err) {
                        console.warn(request.url + ': ' + err.message);
                    });
                });

                return response;
            });
        }));
});

/*
  ACTIVATE EVENT: triggered once after registering, also used to clean up caches.
*/

//Adding `activate` event listener
self.addEventListener('activate', function (event) {
    console.info('Event: Activate');

    //Navigation preload is help us make parallel request while service worker is booting up.
    //Enable - chrome://flags/#enable-service-worker-navigation-preload
    //Support - Chrome 57 beta (behing the flag)
    //More info - https://developers.google.com/web/updates/2017/02/navigation-preload#the-problem

    // Check if navigationPreload is supported or not
    // if (self.registration.navigationPreload) {
    //   self.registration.navigationPreload.enable();
    // }
    // else if (!self.registration.navigationPreload) {
    //   console.info('Your browser does not support navigation preload.');
    // }

    //Remove old and unwanted caches
    event.waitUntil(caches.keys().then(function (cacheNames) {
        return Promise.all(cacheNames.map(function (cache) {
            if (cache !== cacheName) {
                return caches.delete(cache); //Deleting the old cache (cache v1)
            }
        }));
    }).then(function () {
        console.info("Old caches are cleared!");
        // To tell the service worker to activate current one
        // instead of waiting for the old one to finish.
        return self.clients.claim();
    }));
});

/*
  PUSH EVENT: triggered everytime, when a push notification is received.
*/

//Adding `push` event listener
self.addEventListener('push', function (event) {
    console.info('Event: Push');

    var title = 'Push notification demo';
    var body = {
        'body': 'click to return to application',
        'tag': 'demo',
        'icon': './images/icons/apple-touch-icon.png',
        'badge': './images/icons/apple-touch-icon.png',
        //Custom actions buttons
        'actions': [{ 'action': 'yes', 'title': 'I ♥ this app!' }, { 'action': 'no', 'title': 'I don\'t like this app' }]
    };

    event.waitUntil(self.registration.showNotification(title, body));
});

/*
  BACKGROUND SYNC EVENT: triggers after `bg sync` registration and page has network connection.
  It will try and fetch github username, if its fulfills then sync is complete. If it fails,
  another sync is scheduled to retry (will will also waits for network connection)
*/

self.addEventListener('sync', function (event) {
    console.info('Event: Sync');

    //Check registered sync name or emulated sync from devTools
    if (event.tag === 'github' || event.tag === 'test-tag-from-devtools') {
        event.waitUntil(
            //To check all opened tabs and send postMessage to those tabs
            self.clients.matchAll().then(function (all) {
                return all.map(function (client) {
                    return client.postMessage('online'); //To make fetch request, check app.js - line no: 122
                });
            }).catch(function (error) {
                console.error(error);
            }));
    }
});

/*
  NOTIFICATION EVENT: triggered when user click the notification.
*/

//Adding `notification` click event listener
self.addEventListener('notificationclick', function (event) {
    var url = 'https://demopwa.in/';

    //Listen to custom action buttons in push notification
    if (event.action === 'yes') {
        console.log('I ♥ this app!');
    } else if (event.action === 'no') {
        console.warn('I don\'t like this app');
    }

    event.notification.close(); //Close the notification

    //To open the app after clicking notification
    event.waitUntil(clients.matchAll({
        type: 'window'
    }).then(function (clients) {
        for (var i = 0; i < clients.length; i++) {
            var client = clients[i];
            //If site is opened, focus to the site
            if (client.url === url && 'focus' in client) {
                return client.focus();
            }
        }

        //If site is cannot be opened, open in new window
        if (clients.openWindow) {
            return clients.openWindow('/');
        }
    }).catch(function (error) {
        console.error(error);
    }));
});