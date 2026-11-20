const CACHE='hisabat-mustafa-tech-pro-v25';
const FILES=['./','./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];

self.addEventListener('install',e=>{
  // addAll يفشل كلياً إذا غاب ملف واحد (مثل أيقونة)، لذلك نضيف كل ملف على حدة
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>Promise.allSettled(FILES.map(f=>c.add(f))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  if(e.request.url.includes('supabase.co') || e.request.url.includes('telegram.org')) return;
  if(e.request.method!=='GET') return;
  // الشبكة أولاً للصفحة الرئيسية ليحصل كل جهاز على أحدث نسخة فوراً، والكاش عند انقطاع الإنترنت
  if(e.request.mode === 'navigate' || e.request.url.endsWith('index.html') || e.request.url.endsWith('/')){
    e.respondWith(
      fetch(e.request).then(r=>{
        if(r && r.status===200){
          const copy=r.clone();
          caches.open(CACHE).then(c=>c.put(e.request,copy));
        }
        return r;
      }).catch(()=>caches.match(e.request).then(c=>c||caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const net=fetch(e.request).then(r=>{
        if(r && r.status===200 && r.type==='basic'){
          const copy=r.clone();
          caches.open(CACHE).then(c=>c.put(e.request,copy));
        }
        return r;
      }).catch(()=>cached);
      return cached||net;
    })
  );
});
