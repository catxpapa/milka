// app/public/sw.js
// 喵卡应用 Service Worker - PWA 支持

const CACHE_NAME = 'milka-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/assets/icons/favicon.png'
];

// 安装事件 - 缓存核心资源
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 缓存核心资源');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ 缓存失败:', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker 激活');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截网络请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 缓存命中，返回缓存资源
        if (response) {
          return response;
        }
        
        // 缓存未命中，发起网络请求
        return fetch(event.request)
          .then((response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应用于缓存
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.error('🌐 网络请求失败:', error);
            
            // 返回离线页面或默认响应
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// 消息处理 - 与主线程通信
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ 跳过等待，立即激活');
    self.skipWaiting();
  }
});

console.log('🚀 Service Worker 脚本加载完成');