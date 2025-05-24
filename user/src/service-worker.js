console.log('Service Worker loaded.');

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data ? event.data.text() : 'no data'}"`);

    const options = {
        body: event.data ? event.data.text() : 'You have a new notification.',
        icon: './images/icon-192x192.png', // Ganti dengan path ikon notifikasi Anda
        badge: './images/badge-72x72.png', // Ganti dengan path badge notifikasi Anda (opsional)
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2' // Contoh data tambahan, sesuaikan dengan kebutuhan
        }
        // Tambahkan actions jika perlu, contoh:
        // actions: [
        //   {action: 'explore', title: 'Lihat',
        //    icon: './images/checkmark.png'},
        //   {action: 'close', title: 'Tutup',
        //    icon: './images/x.png'},
        // ]
    };

    // Parse data if it's expected to be JSON
    if (event.data) {
        try {
            const jsonData = event.data.json();
            console.log('[Service Worker] Push data is JSON:', jsonData);
            // Override options based on JSON data if structure is defined
            options.body = jsonData.body || options.body;
            options.title = jsonData.title || 'New Notification'; // Add title if backend provides it
            if (jsonData.icon) options.icon = jsonData.icon;
            if (jsonData.badge) options.badge = jsonData.badge;
            if (jsonData.data) options.data = jsonData.data;
            if (jsonData.actions) options.actions = jsonData.actions;

        } catch (e) {
            console.warn('[Service Worker] Push data is not JSON or parsing failed.');
        }
    }


    event.waitUntil(
        self.registration.showNotification('Pinjemin Notification', options) // Ganti 'Pinjemin Notification' dengan judul default notifikasi
    );
});

// Optional: Add listener for notification clicks
self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close(); // Tutup notifikasi setelah diklik

    // Contoh: Buka URL atau fokus ke tab yang sudah ada
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // Contoh: Jika notifikasi punya data.url, navigasi ke sana
                if (event.notification.data && event.notification.data.url) {
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus(); // Fokus jika tab sudah terbuka di URL yang sama
                    }
                }
                // Atau, buka window baru jika tidak ada tab yang cocok atau tidak ada data.url
                if (clients.openWindow) {
                    // Default URL jika tidak ada data.url, atau gunakan data.url
                    const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/#/'; // Ganti dengan URL default aplikasi Anda
                    return clients.openWindow(urlToOpen);
                }
            }
            // Fallback jika openWindow tidak didukung (sangat jarang)
            if (clients.openWindow) {
                const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/#/';
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Optional: Add listener for notification close
// self.addEventListener('notificationclose', function(event) {
//   console.log('[Service Worker] Notification closed.', event);
// });

// Optional: Add listener for install/activate if needed for caching etc.
// self.addEventListener('install', function(event) {
//   console.log('[Service Worker] Installing Service Worker ...', event);
// });

// self.addEventListener('activate', function(event) {
//   console.log('[Service Worker] Activating Service Worker ...', event);
// });
