// ===== SUB-PAGE NAVIGATION SYSTEM =====
// Opens a sliding sub-page within any app view
function openSubPage(title, html, parentId) {
  const id = 'sub_' + Date.now();
  const page = document.createElement('div');
  page.id = id;
  page.className = 'app-view';
  page.style.cssText = 'position:absolute;inset:0;background:#000;z-index:250;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);opacity:1;pointer-events:all;color:#fff;overflow:hidden;';
  page.innerHTML =
    '<div class="app-view-header">' +
      '<div class="app-view-back" data-closeid="' + id + '" style="display:flex;align-items:center;gap:4px;">' +
        '<span style="font-size:18px;color:var(--ios-blue);">‹</span>' +
        '<span style="font-size:15px;color:var(--ios-blue);">' + (parentId ? parentId.charAt(0).toUpperCase() + parentId.slice(1) : 'Back') + '</span>' +
      '</div>' +
      '<span class="app-view-title">' + title + '</span>' +
    '</div>' +
    '<div class="app-view-body">' + html + '</div>';
  document.getElementById('appViews').appendChild(page);
  requestAnimationFrame(function() {
    page.style.transform = 'translateX(0) scale(1)';
    page.classList.add('open');
  });
  // Override back button to slide out instead of just hiding
  page.querySelector('[data-closeid]').addEventListener('click', function(e) {
    e.stopPropagation();
    page.style.transform = 'translateX(100%)';
    setTimeout(function() { page.remove(); }, 350);
  });
}

// Helper: settings toggle row
function settingsToggle(icon, bg, label, storageKey, defaultVal) {
  const val = localStorage.getItem(storageKey) !== null
    ? localStorage.getItem(storageKey) === 'true'
    : defaultVal;
  return '<div class="settings-row" style="justify-content:space-between;" data-togglekey="' + storageKey + '">' +
    '<div style="display:flex;align-items:center;gap:12px;">' +
      '<div class="settings-icon" style="background:' + bg + ';">' + icon + '</div>' +
      '<span style="font-size:15px;color:#fff;">' + label + '</span>' +
    '</div>' +
    '<div class="toggle-switch ' + (val ? 'on' : '') + '" data-togglekey="' + storageKey + '">' +
      '<div class="toggle-thumb"></div>' +
    '</div>' +
  '</div>';
}


// Delegated handlers - all data-attribute based to avoid quote escaping
document.addEventListener('click', function(e) {
  // Back button
  var btn = e.target.closest('[data-closeid]');
  if (btn) { e.stopPropagation(); safeCloseView(btn.dataset.closeid); return; }
  // Dialer keys
  var dk = e.target.closest('[data-dialkey]');
  if (dk) { pressKey(dk.dataset.dialkey); return; }
  // Message list rows (conversation id, a uuid string — not an array index)
  var mc = e.target.closest('[data-chatid]');
  if (mc) { openChat(mc.dataset.chatid, mc.dataset.chatname); return; }
  // Chat send button
  if (e.target.id === 'chatSendBtn') { sendMessage(); return; }
  // Passcode change handled by event listeners bound in render()
  // App switcher - close button (must check before switchid)
  var swClose = e.target.closest('[data-switchclose]');
  if (swClose) { e.stopPropagation(); closeAppFromSwitcher(null, parseInt(swClose.dataset.switchclose)); return; }
  // App switcher - open app (only if not clicking close)
  var sw = e.target.closest('[data-switchid]');
  if (sw) { closeSwitcher(); openApp(sw.dataset.switchid); return; }
  // Notification items
  var ni = e.target.closest('[data-notifid]');
  if (ni) { handleNotif(ni.dataset.notifid); return; }
  // File upload triggers
  var up = e.target.closest('[data-upload]');
  if (up) { document.getElementById(up.dataset.upload + 'Upload').click(); return; }
  // Toast shortcut buttons
  var ts = e.target.closest('[data-toast]');
  if (ts) { var parts = ts.dataset.toast.split('|'); showToast(parts[0], parts[1] || ''); return; }
  // Call recent tap
  var ct = e.target.closest('[data-calltap]');
  if (ct) { showToast('📞', 'Calling...'); return; }
  // Lock button in settings
  var lb = e.target.closest('[data-lockbtn]');
  if (lb) { lockPhone(); return; }
  // Wallpaper selection
  var ww = e.target.closest('[data-wallurl]');
  if (ww) { selectWallpaper(decodeURIComponent(ww.dataset.wallurl), ww); return; }
  // WiFi network selection
  var wn = e.target.closest('[data-netname]');
  if (wn) { showToast('📶', 'Connecting to ' + decodeURIComponent(wn.dataset.netname) + '...'); return; }
  // Boot emoji picker
  var bep = e.target.closest('[data-bootemoji]');
  if (bep) {
    const em = bep.dataset.bootemoji;
    localStorage.setItem('kayv3_boot_emoji', em);
    document.querySelectorAll('[data-bootemoji]').forEach(function(el) { el.style.borderColor = 'transparent'; el.style.background = 'rgba(255,255,255,0.08)'; });
    bep.style.borderColor = 'var(--ios-blue)';
    bep.style.background = 'rgba(10,132,255,0.15)';
    const prev = document.getElementById('bootPreviewEmoji');
    if (prev) prev.textContent = em;
    haptic('light');
    return;
  }
  // Alert style selection
  var ast = e.target.closest('[data-alertstyle]');
  if (ast) { showToast('🔔', ast.dataset.alertstyle + ' selected'); return; }
  // Notif app settings
  var nap = e.target.closest('[data-notifapp]');
  if (nap) { Settings.openNotifApp(decodeURIComponent(nap.dataset.notifapp)); return; }
  // BT device tap
  var btd = e.target.closest('[data-btdev]');
  if (btd) { try { var d = JSON.parse(decodeURIComponent(btd.dataset.btdev)); showToast(d.type, (d.connected ? 'Disconnecting from ' : 'Connecting to ') + d.name + '...'); } catch(ex) {} return; }
  // Install store app
  var inst = e.target.closest('[data-installid]');
  if (inst) { installStoreApp(parseInt(inst.dataset.installid)); return; }
  // Toggle switches
  var tog = e.target.closest('.toggle-switch[data-togglekey]');
  if (tog) {
    tog.classList.toggle('on');
    const key = tog.dataset.togglekey;
    const val = tog.classList.contains('on');
    localStorage.setItem(key, val);
    haptic('light');
    return;
  }
  // Preview/open store app without installing
  var prev = e.target.closest('[data-previewid]');
  if (prev) { previewStoreApp(parseInt(prev.dataset.previewid)); return; }
  // Delete store app
  var del = e.target.closest('[data-deletestoreid]');
  if (del) { deleteStoreApp(parseInt(del.dataset.deletestoreid)); return; }
});

// Brightness slider (created dynamically in Settings display page)
document.addEventListener('input', function(e) {
  if (e.target.id === 'brightSlider') {
    document.querySelector('.phone').style.filter = 'brightness(' + e.target.value + '%)';
  }
  if (e.target.id === 'textSizeSlider') {
    document.documentElement.style.fontSize = e.target.value + 'px';
  }
  if (e.target.id === 'bootNameInput') {
    var p = document.getElementById('bootPreviewName');
    if (p) p.textContent = e.target.value || 'KayPhone';
  }
  if (e.target.id === 'bootTagInput') {
    localStorage.setItem('kayv3_boot_tag', e.target.value);
  }
  if (e.target.id === 'ringerVol') {
    // Volume slider - no real audio output to control
  }
});

// Dynamic input enter keys
document.addEventListener('keypress', function(e) {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'chatInput') { sendMessage(); return; }
  if (e.target.id === 'browserUrl') { loadBrowser(); return; }
  if (e.target.id === 'mapSearchInput') { searchMap(); return; }
  if (e.target.id === 'spotlightInput') { return; } // handled by oninput
});

