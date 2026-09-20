// ===================== NOTIFICATION BANNERS =====================
let bannerTimeout = null;
let bannerAction = null;

function showBanner(app, title, msg, icon, iconBg, action) {
  const banner = document.getElementById('notifBanner');
  const bIcon  = document.getElementById('bannerIcon');
  const bApp   = document.getElementById('bannerApp');
  const bTitle = document.getElementById('bannerTitle');
  const bMsg   = document.getElementById('bannerMsg');
  if (!banner) return;
  bIcon.textContent  = icon  || '🔔';
  bIcon.style.background = iconBg || 'var(--ios-blue)';
  bApp.textContent   = app   || 'Notification';
  bTitle.textContent = title || '';
  bMsg.textContent   = msg   || '';
  bannerAction = action || null;
  clearTimeout(bannerTimeout);
  banner.classList.add('show');
  haptic('light');
  bannerTimeout = setTimeout(function() { banner.classList.remove('show'); }, 4000);
}

function bannerTapped() {
  const banner = document.getElementById('notifBanner');
  if (banner) banner.classList.remove('show');
  if (bannerAction) { openApp(bannerAction); bannerAction = null; }
}

// Override addNotification to show banner (safe - no recursion)
const _origAddNotif = addNotification;
let _addingNotif = false;
function addNotification(app, title, body, action, icon, iconBg) {
  _origAddNotif(app, title, body, action, icon, iconBg);
  if (!State.locked && !_addingNotif) showBanner(app, title, body, icon, iconBg, action);
}

// Simulate incoming notifications periodically
const demoNotifs = [
  {app:'Messages', title:'Mom', msg:'Dinner at 7? 🍝', icon:'💬', bg:'var(--ios-green)', action:'messages'},
  {app:'KayBook',  title:'Sarah Johnson liked your post', msg:'Check it out!', icon:'📘', bg:'#1877F2', action:'kaybook'},
  {app:'KayStore', title:'Sale ends soon!', msg:'50% off selected apps today only', icon:'🛒', bg:'var(--ios-purple)', action:'store'},
  {app:'Calendar', title:'Reminder', msg:'Team standup in 15 minutes', icon:'📅', bg:'var(--ios-red)', action:'calendar'},
  {app:'KayPay',   title:'Payment received', msg:'Kay received $50.00 from John', icon:'💳', bg:'var(--ios-blue)', action:'kaypay'},
];
let demoNotifIdx = 0;
setInterval(function() {
  if (State.locked || powerMenuOpen) return;
  const n = demoNotifs[demoNotifIdx % demoNotifs.length];
  demoNotifIdx++;
  // Add to list first, then show banner (addNotification would show banner too)
  _origAddNotif(n.app, n.title, n.msg, n.action, n.icon, n.bg);
  if (!State.locked) showBanner(n.app, n.title, n.msg, n.icon, n.bg, n.action);
  updateLockNotifications();
}, 45000); // every 45 seconds

// ===================== QUICK ACTION MENU =====================
let quickMenuOpen = false;

function showQuickMenu(appId, x, y) {
  const app = installedApps.find(function(a) { return a.id === appId; });
  if (!app) return;
  const menu = document.getElementById('quickMenu');
  if (!menu) return;

  const actions = getQuickActions(appId);
  menu.innerHTML = actions.map(function(a) {
    return '<div class="quick-item" data-quickaction="' + a.action + '" data-quickapp="' + appId + '">' +
      '<span>' + a.label + '</span>' +
      '<span class="quick-item-icon">' + a.icon + '</span>' +
    '</div>';
  }).join('') +
  '<div style="height:1px;background:rgba(255,255,255,0.1);"></div>' +
  '<div class="quick-item" style="justify-content:center;color:var(--ios-red);" data-quickdelete="' + appId + '">Remove App <span style="margin-left:8px;">🗑</span></div>';

  // Position near the app icon
  const phone = document.getElementById('phone');
  const rect = phone.getBoundingClientRect();
  const relX = x - rect.left;
  const relY = y - rect.top;
  menu.style.left = Math.min(relX, rect.width - 200) + 'px';
  menu.style.top  = Math.min(relY + 10, rect.height - 300) + 'px';
  menu.classList.add('open');
  quickMenuOpen = true;
  haptic('heavy');
}

function getQuickActions(appId) {
  const actions = {
    phone:    [{label:'New Call',icon:'📞',action:'call'},{label:'Recents',icon:'📋',action:'recents'},{label:'Favourites',icon:'⭐',action:'fav'}],
    messages: [{label:'New Message',icon:'✏️',action:'compose'},{label:'Mark All Read',icon:'✓',action:'markread'}],
    camera:   [{label:'Take Photo',icon:'📷',action:'photo'},{label:'Video',icon:'🎥',action:'video'},{label:'Portrait',icon:'🎨',action:'portrait'},{label:'Selfie',icon:'🤳',action:'selfie'}],
    safari:   [{label:'New Tab',icon:'➕',action:'newtab'},{label:'New Private Tab',icon:'🔒',action:'private'},{label:'Bookmarks',icon:'📖',action:'bookmarks'}],
    music:    [{label:'Play/Pause',icon:'⏯️',action:'playpause'},{label:'Next Track',icon:'⏭️',action:'next'},{label:'Add to Library',icon:'➕',action:'addlib'}],
    maps:     [{label:'Get Directions',icon:'🧭',action:'directions'},{label:'Share Location',icon:'📍',action:'shareloc'},{label:'Saved Places',icon:'⭐',action:'saved'}],
    settings: [{label:'Wi-Fi',icon:'📶',action:'wifi'},{label:'Bluetooth',icon:'🔷',action:'bt'},{label:'Battery',icon:'🔋',action:'battery'}],
    store:    [{label:'Upload App',icon:'📤',action:'upload'},{label:'My Apps',icon:'📱',action:'myapps'}],
    photos:   [{label:'Camera',icon:'📷',action:'camera'},{label:'Albums',icon:'🗂️',action:'albums'},{label:'Memories',icon:'🎞️',action:'memories'}],
  };
  return actions[appId] || [{label:'Open',icon:'▶',action:'open'},{label:'Share',icon:'↗️',action:'share'}];
}

function closeQuickMenu() {
  const menu = document.getElementById('quickMenu');
  if (menu) menu.classList.remove('open');
  quickMenuOpen = false;
}

// Quick menu delegation
document.addEventListener('click', function(e) {
  if (quickMenuOpen && !e.target.closest('#quickMenu')) {
    closeQuickMenu();
    return;
  }
  var qa = e.target.closest('[data-quickaction]');
  if (qa) {
    e.stopPropagation();
    const action = qa.dataset.quickaction;
    const appId  = qa.dataset.quickapp;
    closeQuickMenu();
    handleQuickAction(action, appId);
    return;
  }
  var qd = e.target.closest('[data-quickdelete]');
  if (qd) {
    e.stopPropagation();
    const id = qd.dataset.quickdelete;
    closeQuickMenu();
    deleteApp(null, id);
    return;
  }
});

function handleQuickAction(action, appId) {
  switch(action) {
    case 'compose':   openApp('messages'); break;
    case 'photo':     openApp('camera'); break;
    case 'playpause': toggleMusic(); break;
    case 'next':      nextTrack(); break;
    case 'upload':    openApp('store'); break;
    case 'call':      openApp('phone'); break;
    case 'camera':    openApp('camera'); break;
    case 'open':      openApp(appId); break;
    default: showToast('⚡', action.charAt(0).toUpperCase() + action.slice(1)); break;
  }
}

// Wire quick menu to long press on app icons
let quickPressTimer = null;
let quickPressId = null;
let quickPressX = 0, quickPressY = 0;

document.addEventListener('touchstart', function(e) {
  var item = e.target.closest('[data-appid]');
  if (!item || State.locked) return;
  quickPressId = item.dataset.appid;
  quickPressX = e.touches[0].clientX;
  quickPressY = e.touches[0].clientY;
  quickPressTimer = setTimeout(function() {
    if (quickPressId) {
      State.editingMode = false;
      showQuickMenu(quickPressId, quickPressX, quickPressY);
      quickPressId = null;
    }
  }, 500);
}, {passive:true});

document.addEventListener('touchend', function() {
  clearTimeout(quickPressTimer);
  quickPressId = null;
}, {passive:true});

document.addEventListener('touchmove', function() {
  clearTimeout(quickPressTimer);
  quickPressId = null;
}, {passive:true});

// ===================== APP LIBRARY =====================
const libraryCategories = [
  {name:'Social',      icon:'💬', apps:['messages','kaybook','kaychat','kaytok','kaygram','kaytube']},
  {name:'Productivity',icon:'⚡', apps:['notes','reminders','calendar','files','calculator']},
  {name:'Media',       icon:'🎵', apps:['music','photos','camera','voicememos']},
  {name:'Utilities',   icon:'🔧', apps:['settings','clock','weather','maps','safari']},
  {name:'Finance',     icon:'💳', apps:['kaypay','stocks']},
  {name:'Fun',         icon:'🎮', apps:['games','health','assistant']},
];

function openAppLibrary() {
  const lib = document.getElementById('appLibrary');
  if (!lib) return;
  lib.classList.add('open');
  renderLibrary('');
}
function closeAppLibrary() {
  const lib = document.getElementById('appLibrary');
  if (lib) lib.classList.remove('open');
}
function filterLibrary() {
  const q = (document.getElementById('librarySearch') || {}).value || '';
  renderLibrary(q.toLowerCase());
}
function renderLibrary(filter) {
  const grid = document.getElementById('libraryGrid');
  if (!grid) return;
  const cats = filter
    ? [{name:'Search Results', icon:'🔍', apps: installedApps.filter(function(a){ return a.name.toLowerCase().includes(filter); }).map(function(a){return a.id;})}]
    : libraryCategories;
  grid.innerHTML = cats.map(function(cat) {
    const catApps = cat.apps.map(function(id){ return installedApps.find(function(a){ return a.id === id; }); }).filter(Boolean);
    if (!catApps.length) return '';
    return '<div class="library-folder" data-libcat="' + cat.name + '">' +
      '<div class="library-folder-name">' + cat.icon + ' ' + cat.name + '</div>' +
      '<div class="library-folder-icons">' +
        catApps.slice(0,4).map(function(a) {
          return '<div class="library-folder-icon" style="background:' + a.bg + ';" data-appid="' + a.id + '">' + a.icon + '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }).join('');
}

// Swipe left past last home page = open App Library
document.addEventListener('touchend', function(e) {
  if (State.locked || !document.getElementById('screen-home').classList.contains('active')) return;
  const dx = (e.changedTouches[0].clientX - State.gestureStartX);
  if (dx < -80 && State.homePage === State.totalPages - 1) {
    openAppLibrary();
  }
}, {passive:true});

