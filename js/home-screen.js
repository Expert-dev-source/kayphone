// ===== HOME SCREEN =====
// FIX: Use a proper function to build app HTML without broken onclick strings
function buildAppHTML(app) {
  var badge = app.badge ? '<div class="app-badge">' + app.badge + '</div>' : '';
  var editing = State.editingMode ? 'editing jiggle' : '';
  var photoStyle = app.id === 'photos' ? 'color:#333;' : '';
  return '<div class="app-item ' + editing + '" data-appid="' + app.id + '">' +
    (State.editingMode ? '<div class="app-delete" data-delid="' + app.id + '">×</div>' : '') +
    '<div class="app-icon" style="background:' + app.bg + ';' + photoStyle + '">' + app.icon + badge + '</div>' +
    '<span class="app-name">' + app.name + '</span>' +
    '</div>';
}

function renderHome() {
  for (let p = 0; p < State.totalPages; p++) {
    const grid = document.getElementById('homeGrid' + (p + 1));
    if (!grid) continue;
    const pageApps = installedApps.filter(a => a.page === p && !a.dock);
    grid.innerHTML = pageApps.map(app => buildAppHTML(app)).join('');
  }
}

function renderDock() {
  const dock = document.getElementById('dock');
  if (!dock) return;
  dock.innerHTML = dockApps.map(app =>
    '<div class="app-item" data-appid="' + app.id + '" data-dock="1">' +
      '<div class="app-icon" style="background:' + app.bg + ';">' + app.icon +
        (app.badge ? '<div class="app-badge">' + app.badge + '</div>' : '') +
      '</div>' +
    '</div>'
  ).join('');
}

// ===== DELEGATED APP CLICK HANDLER =====
// Handles all .app-item taps via data-appid — no inline onclick escaping needed
document.addEventListener('click', function(e) {
  if (State.locked) return; // ignore all taps while locked
  // Delete button in editing mode
  var delBtn = e.target.closest('[data-delid]');
  if (delBtn) { e.stopPropagation(); deleteApp(e, delBtn.dataset.delid); return; }

  // App icon tap
  var item = e.target.closest('[data-appid]');
  if (!item) return;
  var id = item.dataset.appid;
  if (!id) return;

  haptic('light');

  if (State.editingMode) { State.editingMode = false; renderHome(); return; }

  var app = [...installedApps, ...storeApps].find(function(a) { return a.id === id; });
  if (!app) return;

  if (!State.openApps.find(function(a) { return a.id === id; })) {
    State.openApps.push(app);
    if (State.openApps.length > 8) State.openApps.shift();
  }

  if (State.currentApp && State.currentApp !== id) pushHistory(State.currentApp);
  State.currentApp = id;
  if (app.isCustom || (app.html && !Apps[id])) {
    openCustomApp(app);
  } else if (Apps[id]) {
    Apps[id].open();
  } else {
    showToast('📱', 'Opening ' + app.name);
  }

  if (app.badge) {
    app.badge = 0;
    renderHome();
    renderDock();
    saveData();
  }
}); // bubbling phase - safer

function goToPage(page) {
  page = Math.max(0, Math.min(State.totalPages - 1, page));
  State.homePage = page;
  var c = document.getElementById('homePages');
  if (c) c.style.transform = 'translateX(-' + page * 100 + '%)';
  document.querySelectorAll('.page-dot').forEach(function(d, i) {
    d.classList.toggle('active', i === page);
  });
}

// ===== APP LAUNCHER =====
function launchApp(e, id) { openApp(id); }
function openApp(id) {
  var app = [...installedApps, ...storeApps].find(function(a) { return a.id === id; });
  if (!app) return;
  if (!State.openApps.find(function(a) { return a.id === id; })) {
    State.openApps.push(app);
    if (State.openApps.length > 8) State.openApps.shift();
  }
  if (State.currentApp && State.currentApp !== id) pushHistory(State.currentApp);
  State.currentApp = id;
  if (app.isCustom || (app.html && !Apps[id])) {
    openCustomApp(app);
  } else if (Apps[id]) {
    Apps[id].open();
  } else {
    showToast('📱', 'Opening ' + app.name);
  }
  app.badge = 0;
  renderHome();
  renderDock();
  saveData();
}
function goHome() {
  haptic('light');
  // Animate open app out
  document.querySelectorAll('.app-view.open').forEach(function(v) {
    v.style.transition = 'transform 0.28s ease, opacity 0.28s ease';
    v.style.transform = 'translateX(100%)';
    v.style.opacity = '0';
    setTimeout(function() {
      v.classList.remove('open');
      v.style.transform = '';
      v.style.opacity = '';
      v.style.transition = '';
    }, 300);
  });
  document.getElementById('cameraView').classList.remove('open');
  closeCC(); closeNotif(); closeSwitcher(); closeSpotlight();
  if (State.cameraStream) { State.cameraStream.getTracks().forEach(t => t.stop()); State.cameraStream = null; }
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-home').classList.add('active');
  }, 150);
  State.currentApp = null;
  State.islandExpanded = false;
  document.getElementById('dynamicIsland').classList.remove('expanded','compact');
}
function closeAllApps() {
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('open'));
  document.getElementById('cameraView').classList.remove('open');
  closeCC();
  closeNotif();
  if (State.cameraStream) { State.cameraStream.getTracks().forEach(t => t.stop()); State.cameraStream = null; }
  State.islandExpanded = false;
  document.getElementById('dynamicIsland').classList.remove('expanded', 'compact');
}
function closeApp() {
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('open'));
  document.getElementById('cameraView').classList.remove('open');
  if (State.cameraStream) { State.cameraStream.getTracks().forEach(t => t.stop()); State.cameraStream = null; }
}

// ===== APP SWITCHER =====
function openSwitcher() {
  haptic('medium');
  renderSwitcher();
  document.getElementById('appSwitcher').classList.add('open');
}
function closeSwitcher() { document.getElementById('appSwitcher').classList.remove('open'); }
function renderSwitcher() {
  const cards = document.getElementById('switcherCards');
  const recent = State.openApps.slice().reverse();
  if (!recent.length) {
    cards.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--ios-text-secondary);gap:12px;"><div style="font-size:48px;">📱</div><div style="font-size:15px;">No Recent Apps</div></div>';
    return;
  }
  cards.innerHTML = recent.map(function(app, i) {
    const realIdx = State.openApps.length - 1 - i;
    return '<div class="switcher-card" data-switchid="' + app.id + '">' +
      '<div class="switcher-close" data-switchclose="' + realIdx + '">×</div>' +
      '<div class="switcher-card-preview" style="background:' + app.bg + ';flex-direction:column;gap:8px;">' +
        '<span style="font-size:60px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3));">' + app.icon + '</span>' +
        '<span style="font-size:13px;color:rgba(255,255,255,0.7);">' + app.name + '</span>' +
      '</div>' +
      '<div class="switcher-card-info">' +
        '<div class="switcher-card-icon" style="background:' + app.bg + ';">' + app.icon + '</div>' +
        '<div style="flex:1;"><div class="switcher-card-name">' + app.name + '</div>' +
        '<div style="font-size:11px;color:var(--ios-text-secondary);">' + new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) + '</div></div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function switchToApp(id) { closeSwitcher(); openApp(id); }
function closeAppFromSwitcher(e, index) { e.stopPropagation(); State.openApps.splice(index, 1); renderSwitcher(); }

