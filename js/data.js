// ===== DATA =====
// Bump this when the default installedApps layout changes so
// returning visitors on an older cached layout pick up the update
// instead of being stuck with stale badges/entries.
const KAYPHONE_DATA_VERSION = '2';
let installedApps;
try {
  if (localStorage.getItem('kayv3_data_version') !== KAYPHONE_DATA_VERSION) {
    installedApps = null;
  } else {
    installedApps = JSON.parse(localStorage.getItem('kayv3_installed')||'null');
  }
} catch(e) { installedApps = null; }
if (!installedApps || !Array.isArray(installedApps) || !installedApps.length || !installedApps[0].id) { installedApps = null; }
if (!installedApps) {
  try { localStorage.setItem('kayv3_data_version', KAYPHONE_DATA_VERSION); } catch(e) {}
  installedApps = [
    {id:'phone',name:'Phone',icon:'📞',bg:'linear-gradient(135deg,#34C759,#30D158)',badge:0,dock:true,page:0},
    {id:'messages',name:'Messages',icon:'💬',bg:'linear-gradient(135deg,#34C759,#30D158)',badge:0,dock:true,page:0},
    {id:'safari',name:'Safari',icon:'🧭',bg:'linear-gradient(135deg,#0A84FF,#5E5CE6)',badge:0,dock:true,page:0},
    {id:'music',name:'Music',icon:'🎵',bg:'linear-gradient(135deg,#FF375F,#FF9F0A)',badge:0,dock:true,page:0},
    {id:'kaybook',name:'KayBook',icon:'📘',bg:'linear-gradient(135deg,#1877F2,#0A84FF)',badge:0,page:0},
    {id:'kaychat',name:'KayChat',icon:'💚',bg:'linear-gradient(135deg,#25D366,#128C7E)',badge:0,page:0},
    {id:'kaytok',name:'KayTok',icon:'🎵',bg:'linear-gradient(135deg,#ff0050,#00f2ea)',badge:0,page:0},
    {id:'kaytube',name:'KayTube',icon:'▶️',bg:'linear-gradient(135deg,#FF0000,#CC0000)',badge:0,page:0},
    {id:'kaygram',name:'KayGram',icon:'📷',bg:'linear-gradient(135deg,#E1306C,#F77737)',badge:0,page:0},
    {id:'kaypay',name:'KayPay',icon:'💳',bg:'linear-gradient(135deg,#0A84FF,#5E5CE6)',badge:0,page:0},
    {id:'photos',name:'Photos',icon:'🖼️',bg:'linear-gradient(135deg,#fff,#ddd)',badge:0,page:1},
    {id:'camera',name:'Camera',icon:'📷',bg:'linear-gradient(135deg,#8E8E93,#636366)',badge:0,page:1},
    {id:'maps',name:'Maps',icon:'🗺️',bg:'linear-gradient(135deg,#30D158,#64D2FF)',badge:0,page:1},
    {id:'weather',name:'Weather',icon:'☀️',bg:'linear-gradient(135deg,#64D2FF,#0A84FF)',badge:0,page:1},
    {id:'calendar',name:'Calendar',icon:'📅',bg:'linear-gradient(135deg,#FF453A,#FF9F0A)',badge:0,page:1},
    {id:'clock',name:'Clock',icon:'🕐',bg:'linear-gradient(135deg,#000,#333)',badge:0,page:1},
    {id:'notes',name:'Notes',icon:'📝',bg:'linear-gradient(135deg,#FFD60A,#FF9F0A)',badge:0,page:1},
    {id:'reminders',name:'Reminders',icon:'✅',bg:'linear-gradient(135deg,#0A84FF,#64D2FF)',badge:0,page:1},
    {id:'calculator',name:'Calculator',icon:'🔢',bg:'linear-gradient(135deg,#000,#333)',badge:0,page:2},
    {id:'voicememos',name:'Voice Memos',icon:'🎙️',bg:'linear-gradient(135deg,#BF5AF2,#FF375F)',badge:0,page:2},
    {id:'files',name:'Files',icon:'📁',bg:'linear-gradient(135deg,#5E5CE6,#0A84FF)',badge:0,page:2},
    {id:'settings',name:'Settings',icon:'⚙️',bg:'linear-gradient(135deg,#8E8E93,#AEAEB2)',badge:0,page:2},
    {id:'store',name:'Kay Store',icon:'🛒',bg:'linear-gradient(135deg,#BF5AF2,#FF375F)',badge:0,page:2},
    {id:'health',name:'Health',icon:'❤️',bg:'linear-gradient(135deg,#FF453A,#FF375F)',badge:0,page:2},
    {id:'stocks',name:'Stocks',icon:'📈',bg:'linear-gradient(135deg,#30D158,#000)',badge:0,page:2},
    {id:'games',name:'Games',icon:'🎮',bg:'linear-gradient(135deg,#0A84FF,#30D158)',badge:0,page:2},
    {id:'assistant',name:'Kay AI',icon:'🤖',bg:'linear-gradient(135deg,#5E5CE6,#BF5AF2)',badge:0,page:2}
  ];
}

let dockApps = installedApps.filter(a => a.dock);
let wallpapers; try { wallpapers = JSON.parse(localStorage.getItem('kayv3_wallpapers')||'[]'); } catch(e) { wallpapers = []; }
let currentWallpaper; try { currentWallpaper = localStorage.getItem('kayv3_wallpaper'); } catch(e) {}
if (!currentWallpaper) currentWallpaper = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';
// Video recordings stay local (object URLs, this session only) — see
// README "Known limitations". Everything else real content lives in
// Supabase: photos (js/apps-core.js), notes/reminders/calendar
// (js/apps-productivity.js, js/apps-media-utility.js), messages
// (js/apps-core.js).
let videos; try { videos = JSON.parse(localStorage.getItem('kayv3_videos')||'[]'); } catch(e) { videos = []; }
let storeApps; try { storeApps = JSON.parse(localStorage.getItem('kayv3_store')||'[]'); } catch(e) { storeApps = []; }
let notifications; try { notifications = JSON.parse(localStorage.getItem('kayv3_notifs')||'[]'); } catch(e) { notifications = []; }

// ===== UTILITIES =====
function haptic(type='light') {
  if (!State.hapticEnabled) return;
  if ('vibrate' in navigator) {
    if (type==='light') navigator.vibrate(5);
    else if (type==='medium') navigator.vibrate(10);
    else if (type==='heavy') navigator.vibrate([10,30,10]);
    else if (type==='success') navigator.vibrate([10,50,10]);
  }
}
function showToast(icon, msg, duration=2500) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = '<span style="font-size:18px;">' + icon + '</span><span>' + msg + '</span>';
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, duration);
}
function saveData() {
  try {
    // Strip html blobs before saving - HTML is in IndexedDB
    const stripHtml = arr => arr.map(a => { const c = Object.assign({}, a); delete c.html; return c; });
    localStorage.setItem('kayv3_installed', JSON.stringify(stripHtml(installedApps)));
    localStorage.setItem('kayv3_wallpaper', currentWallpaper);
    localStorage.setItem('kayv3_store', JSON.stringify(stripHtml(storeApps)));
    localStorage.setItem('kayv3_notifs', JSON.stringify(notifications));
  } catch(e) {}
}
function safeCloseView(id) {
  const view = document.getElementById('view-' + id);
  if (view) {
    view.style.transition = 'transform 0.3s cubic-bezier(0.32,0.72,0,1), opacity 0.3s';
    view.style.transform = 'translateX(100%)';
    view.style.opacity = '0.5';
    setTimeout(function() {
      view.classList.remove('open');
      view.style.transform = '';
      view.style.opacity = '';
      view.style.transition = '';
    }, 300);
  }
  State.currentApp = null;
}

