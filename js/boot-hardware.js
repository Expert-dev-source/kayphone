// ===== INIT =====
// ===================== BOOT SYSTEM =====================
let volumeLevel = 75;
let volumeTimeout = null;
let powerHoldTimer = null;
let powerMenuOpen = false;

function runBootSequence() {
  const boot = document.getElementById('bootScreen');
  const logo = document.getElementById('bootLogo');
  const ring = document.getElementById('bootRing');
  const bg   = document.getElementById('bootBg');
  const word = document.getElementById('bootWordmark');
  const bar  = document.getElementById('bootBar');
  const prog = document.getElementById('bootProgress');
  if (!boot) return;

  loadBootCustomization();

  // Phase 1: bg glow
  setTimeout(function() { if(bg) bg.style.opacity = '1'; }, 100);

  // Phase 2: logo pops in
  setTimeout(function() {
    logo.style.opacity = '1';
    logo.style.transform = 'scale(1)';
    if(ring) ring.style.opacity = '1';
  }, 300);

  // Phase 3: wordmark slides up
  setTimeout(function() {
    word.style.opacity = '1';
    word.style.transform = 'translateY(0)';
  }, 800);

  // Phase 4: progress bar
  setTimeout(function() {
    bar.style.opacity = '1';
    setTimeout(function() { if(prog) prog.style.width = '100%'; }, 60);
  }, 1100);

  // Phase 5: ring fades, logo settles
  setTimeout(function() {
    if(ring) ring.style.opacity = '0';
  }, 2200);

  // Phase 6: boot done - fade out
  setTimeout(function() {
    boot.style.transition = 'opacity 0.7s ease';
    boot.style.opacity = '0';
    setTimeout(function() {
      boot.style.display = 'none';
      try { init(); } catch(e) { console.error('init error:', e); }
    }, 700);
  }, 3400);
}

// ===================== VOLUME SYSTEM =====================
function showVolume(delta) {
  volumeLevel = Math.max(0, Math.min(100, volumeLevel + delta));
  const overlay = document.getElementById('volumeOverlay');
  const bar = document.getElementById('volBar');
  const pct = document.getElementById('volPct');
  const icon = document.getElementById('volIcon');
  if (!overlay) return;
  bar.style.height = volumeLevel + '%';
  pct.textContent = volumeLevel + '%';
  icon.textContent = volumeLevel === 0 ? '🔇' : volumeLevel < 30 ? '🔈' : volumeLevel < 70 ? '🔉' : '🔊';
  overlay.style.opacity = '1';
  clearTimeout(volumeTimeout);
  volumeTimeout = setTimeout(() => { overlay.style.opacity = '0'; }, 2000);
  haptic('light');
}

// ===================== POWER BUTTON SYSTEM =====================
function openPowerMenu() {
  powerMenuOpen = true;
  const menu = document.getElementById('powerMenu');
  menu.style.display = 'flex';
  haptic('heavy');
  // Set up power-off slider drag
  setupPowerOffSlider();
}
function closePowerMenu() {
  powerMenuOpen = false;
  const menu = document.getElementById('powerMenu');
  menu.style.display = 'none';
}
function setupPowerOffSlider() {
  const slider = document.getElementById('powerOffSlider');
  const thumb  = document.getElementById('powerOffThumb');
  if (!slider || !thumb) return;
  let dragging = false, startX = 0, currentX = 0;
  const maxSlide = slider.offsetWidth - thumb.offsetWidth - 16;

  function onStart(e) {
    dragging = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX);
    thumb.style.cursor = 'grabbing';
  }
  function onMove(e) {
    if (!dragging) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    currentX = Math.max(0, Math.min(maxSlide, x - startX));
    thumb.style.transform = 'translateX(' + currentX + 'px)';
    // Haptic at 90%
    if (currentX > maxSlide * 0.9) haptic('medium');
  }
  function onEnd() {
    if (!dragging) return;
    dragging = false;
    if (currentX > maxSlide * 0.85) {
      // Power off!
      closePowerMenu();
      powerOff();
    } else {
      // Snap back
      thumb.style.transition = 'transform 0.3s var(--spring)';
      thumb.style.transform = 'translateX(0)';
      setTimeout(() => thumb.style.transition = '', 300);
    }
  }
  thumb.addEventListener('touchstart', onStart, {passive:true});
  thumb.addEventListener('touchmove', onMove, {passive:true});
  thumb.addEventListener('touchend', onEnd, {passive:true});
  thumb.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
}

function powerOff() {
  haptic('heavy');
  const phone = document.getElementById('phone');
  // Animate screen off
  phone.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  phone.style.opacity = '0';
  phone.style.transform = 'scale(0.98)';
  setTimeout(() => {
    // Show black screen with power-on hint
    phone.style.opacity = '1';
    phone.style.transform = 'scale(1)';
    // Show boot sequence again after 2s (simulates powering back on)
    const boot = document.getElementById('bootScreen');
    if (boot) {
      boot.style.display = 'flex';
      boot.style.opacity = '1';
      document.getElementById('bootProgress').style.width = '0%';
      document.getElementById('bootLogo').style.opacity = '0';
      document.getElementById('bootWordmark').style.opacity = '0';
      setTimeout(() => {
        lockPhone();
        runBootSequence2();
      }, 500);
    }
  }, 800);
}

function runBootSequence2() {
  const boot = document.getElementById('bootScreen');
  const logo = document.getElementById('bootLogo');
  const ring = document.getElementById('bootRing');
  const bg   = document.getElementById('bootBg');
  const word = document.getElementById('bootWordmark');
  const bar  = document.getElementById('bootBar');
  const prog = document.getElementById('bootProgress');
  if (!boot) return;
  // Reset
  if (prog) prog.style.transition = 'none';
  if (prog) prog.style.width = '0%';
  if (logo) { logo.style.opacity='0'; logo.style.transform='scale(0.7)'; }
  if (word) { word.style.opacity='0'; word.style.transform='translateY(16px)'; }
  if (bar)  bar.style.opacity = '0';
  loadBootCustomization();
  setTimeout(function() { if(bg) bg.style.opacity='1'; }, 100);
  setTimeout(function() { logo.style.opacity='1'; logo.style.transform='scale(1)'; if(ring) ring.style.opacity='1'; }, 300);
  setTimeout(function() { word.style.opacity='1'; word.style.transform='translateY(0)'; }, 700);
  setTimeout(function() {
    bar.style.opacity='1';
    setTimeout(function() { if(prog){ prog.style.transition='width 1.8s cubic-bezier(0.4,0,0.2,1)'; prog.style.width='100%'; } }, 60);
  }, 1000);
  setTimeout(function() { if(ring) ring.style.opacity='0'; }, 2000);
  setTimeout(function() {
    boot.style.transition = 'opacity 0.7s ease';
    boot.style.opacity = '0';
    setTimeout(function() { boot.style.display='none'; }, 700);
  }, 2800);
}

// ===================== HARDWARE BUTTON WIRING =====================
function applyBootCustomization() {
  const name = (document.getElementById('bootNameInput') || {}).value || 'KayPhone';
  const tag = (document.getElementById('bootTagInput') || {}).value || 'Pro Max';
  const emoji = localStorage.getItem('kayv3_boot_emoji') || '📱';
  const logoInner = document.getElementById('bootLogoInner');
  const nameEl    = document.getElementById('bootName');
  const tagEl     = document.getElementById('bootTag');
  if (logoInner) logoInner.textContent = emoji;
  if (nameEl) nameEl.textContent = name;
  if (tagEl)  tagEl.textContent  = tag.toUpperCase();
  // Save
  localStorage.setItem('kayv3_boot_name', name);
  localStorage.setItem('kayv3_boot_tag', tag);
  showToast('🚀', 'Boot screen updated!');
  haptic('success');
}

function loadBootCustomization() {
  const name  = localStorage.getItem('kayv3_boot_name');
  const tag   = localStorage.getItem('kayv3_boot_tag');
  const emoji = localStorage.getItem('kayv3_boot_emoji') || '📱';
  const logoInner = document.getElementById('bootLogoInner');
  const nameEl    = document.getElementById('bootName');
  const tagEl     = document.getElementById('bootTag');
  if (logoInner) logoInner.textContent = emoji;
  if (nameEl && name) nameEl.textContent = name;
  if (tagEl  && tag)  tagEl.textContent  = tag.toUpperCase();
}

function initHardwareButtons() {
  const btnVolUp   = document.getElementById('btnVolUp');
  const btnVolDown = document.getElementById('btnVolDown');
  const btnPower   = document.getElementById('btnPower');
  const btnAction  = document.getElementById('btnAction');

  // Volume up
  if (btnVolUp) {
    btnVolUp.addEventListener('click', () => { if (!State.locked) showVolume(10); });
    btnVolUp.addEventListener('touchstart', () => { if (!State.locked) showVolume(10); }, {passive:true});
  }

  // Volume down
  if (btnVolDown) {
    btnVolDown.addEventListener('click', () => { if (!State.locked) showVolume(-10); });
    btnVolDown.addEventListener('touchstart', () => { if (!State.locked) showVolume(-10); }, {passive:true});
  }

  // Power button: click = lock/wake, hold = power menu
  if (btnPower) {
    btnPower.addEventListener('mousedown', () => {
      powerHoldTimer = setTimeout(() => { if (!powerMenuOpen) openPowerMenu(); }, 800);
    });
    btnPower.addEventListener('mouseup', () => {
      clearTimeout(powerHoldTimer);
    });
    btnPower.addEventListener('touchstart', () => {
      powerHoldTimer = setTimeout(() => { if (!powerMenuOpen) openPowerMenu(); }, 800);
    }, {passive:true});
    btnPower.addEventListener('touchend', (e) => {
      clearTimeout(powerHoldTimer);
      if (!powerMenuOpen) {
        if (State.locked) startUnlock();
        else lockPhone();
        haptic('light');
      }
    }, {passive:true});
    btnPower.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Action button: toggle flashlight (like iPhone 15 Pro)
  if (btnAction) {
    let actionHeld = false;
    btnAction.addEventListener('mousedown', () => {
      actionHeld = false;
      setTimeout(() => { actionHeld = true; }, 400);
    });
    btnAction.addEventListener('mouseup', () => {
      if (!actionHeld) {
        toggleFlashlight();
        haptic('medium');
      }
    });
    btnAction.addEventListener('touchstart', () => {
      actionHeld = false;
      setTimeout(() => { actionHeld = true; }, 400);
    }, {passive:true});
    btnAction.addEventListener('touchend', () => {
      if (!actionHeld) { toggleFlashlight(); haptic('medium'); }
    }, {passive:true});
  }

  // Keyboard shortcuts for desktop
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp')   showVolume(10);
    if (e.key === 'ArrowDown') showVolume(-10);
    if (e.key === 'l' || e.key === 'L') { if (!State.locked) lockPhone(); else startUnlock(); }
    if (e.key === 'Escape' && powerMenuOpen) closePowerMenu();
  });
}

function init() {
  gestureInit();
  initHardwareButtons();

  // Lock screen tap → show passcode
  const lsc = document.getElementById('lockScreenContent');
  if (lsc) {
    lsc.addEventListener('click', function(e) {
      if (State.locked) startUnlock();
    });
  }

  renderHome();
  renderDock();
  updateWidgetPhotos();
  updateCameraThumbnail();

  if (!notifications.length) {
    notifications = [
      {id:'1',app:'KayPhone',title:'Welcome',body:'Swipe up to unlock, long-press apps to edit, spacebar opens Spotlight.',time:'now',action:'settings',icon:'👋',iconBg:'var(--ios-blue)'},
      {id:'2',app:'Messages',title:'Live chat',body:'Join a room name in Messages — open this site in another tab to try it.',time:'now',action:'messages',icon:'💬',iconBg:'var(--ios-green)'}
    ];
    saveData();
  }

  setTimeout(() => showToast('👋', 'Welcome to KayPhone OS Pro Max!'), 1000);
  // Wire up extra CC buttons
  setTimeout(addFocusToCC, 500);
  setTimeout(addScreenRecordToCC, 500);
  // Restore focus mode
  const savedFocus = localStorage.getItem('kayv3_focus');
  if (savedFocus) setFocus(savedFocus);
  setInterval(updateWeather, 300000);
}

