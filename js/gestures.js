// ===== GESTURE SYSTEM =====
// Edge swipe thresholds
const EDGE_LEFT = 30;   // px from left edge = back gesture
const SWIPE_MIN = 60;   // minimum swipe distance
const SWIPE_FAST = 350; // max ms for fast swipe

function gestureInit() {
  const phone = document.getElementById('phone');
  if (!phone) return; // guard for non-browser environments

  phone.addEventListener('touchstart', function(e) {
    const t = e.touches[0];
    const rect = phone.getBoundingClientRect();
    State.gestureStartX = t.clientX - rect.left;
    State.gestureStartY = t.clientY - rect.top;
    State.gestureStartTime = Date.now();
    State.gestureActive = true;
    // Detect edge zones
    if (State.gestureStartX < EDGE_LEFT) {
      State.gestureEdge = 'left';
      // Flash left edge indicator
      const ind = document.getElementById('gestureEdgeLeft');
      if (ind) { ind.style.opacity = '1'; setTimeout(() => { ind.style.opacity = '0'; }, 400); }
    }
    else if (State.gestureStartX > rect.width - EDGE_LEFT) State.gestureEdge = 'right';
    else if (State.gestureStartY > rect.height - 80) State.gestureEdge = 'bottom';
    else if (State.gestureStartY < 60) State.gestureEdge = 'top';
    else State.gestureEdge = null;
  }, {passive:true});

  phone.addEventListener('touchend', function(e) {
    if (!State.gestureActive) return;
    State.gestureActive = false;
    const t = e.changedTouches[0];
    const rect = phone.getBoundingClientRect();
    const endX = t.clientX - rect.left;
    const endY = t.clientY - rect.top;
    const dx = endX - State.gestureStartX;
    const dy = endY - State.gestureStartY;
    const dt = Date.now() - State.gestureStartTime;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    const fast = dt < SWIPE_FAST;

    if (State.locked) {
      // Swipe up anywhere on lock screen = unlock
      if (dy < -50 && absDy > absDx) { haptic('medium'); startUnlock(); }
      return;
    }

    // LEFT EDGE SWIPE RIGHT = go back
    if (State.gestureEdge === 'left' && dx > SWIPE_MIN && absDx > absDy * 1.5) {
      haptic('light');
      goBack();
      return;
    }

    // BOTTOM SWIPE UP = home or app switcher
    if (State.gestureEdge === 'bottom') {
      if (dy < -120 && fast && absDy > absDx) { haptic('light'); goHome(); return; }
      if (dy < -60 && !fast && absDy > absDx) { haptic('medium'); openSwitcher(); return; }
    }

    // TOP-RIGHT SWIPE DOWN = control center
    if (State.gestureEdge === 'top' && State.gestureStartX > rect.width * 0.5 && dy > 60) {
      haptic('light'); openCC(); return;
    }
    // TOP-LEFT SWIPE DOWN = notifications
    if (State.gestureEdge === 'top' && State.gestureStartX <= rect.width * 0.5 && dy > 60) {
      haptic('light'); openNotif(); return;
    }

    // HOME SCREEN: swipe left/right to change pages
    if (document.getElementById('screen-home').classList.contains('active') && !State.currentApp) {
      if (absDx > SWIPE_MIN && absDx > absDy * 1.5) {
        if (dx < 0 && State.homePage < State.totalPages - 1) goToPage(State.homePage + 1);
        else if (dx > 0 && State.homePage > 0) goToPage(State.homePage - 1);
        return;
      }
      // HOME: swipe down = spotlight
      if (dy > 80 && State.gestureStartY < rect.height * 0.6 && absDy > absDx) {
        haptic('light'); openSpotlight(); return;
      }
    }
  }, {passive:true});

  // Mouse fallback for desktop testing
  let mouseTracking = false;
  phone.addEventListener('mousedown', function(e) {
    const rect = phone.getBoundingClientRect();
    State.gestureStartX = e.clientX - rect.left;
    State.gestureStartY = e.clientY - rect.top;
    State.gestureStartTime = Date.now();
    mouseTracking = true;
    if (State.gestureStartX < EDGE_LEFT) State.gestureEdge = 'left';
    else if (State.gestureStartX > rect.width - EDGE_LEFT) State.gestureEdge = 'right';
    else if (State.gestureStartY > rect.height - 80) State.gestureEdge = 'bottom';
    else if (State.gestureStartY < 60) State.gestureEdge = 'top';
    else State.gestureEdge = null;
  });
  phone.addEventListener('mouseup', function(e) {
    if (!mouseTracking) return; mouseTracking = false;
    const rect = phone.getBoundingClientRect();
    const dx = (e.clientX - rect.left) - State.gestureStartX;
    const dy = (e.clientY - rect.top) - State.gestureStartY;
    const dt = Date.now() - State.gestureStartTime;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (State.locked) { if (dy < -50) startUnlock(); return; }
    if (State.gestureEdge === 'left' && dx > SWIPE_MIN && absDx > absDy * 1.5) { haptic('light'); goBack(); return; }
    if (State.gestureEdge === 'bottom' && dy < -80) { haptic('light'); goHome(); return; }
    if (State.gestureEdge === 'top' && dy > 60) {
      if (State.gestureStartX > rect.width * 0.5) openCC(); else openNotif(); return;
    }
    // Page swiping handled by dedicated swipe system
  });
}

// App history navigation
function pushHistory(appId) {
  State.appHistory = State.appHistory.filter(id => id !== appId);
  State.appHistory.push(appId);
  if (State.appHistory.length > 10) State.appHistory.shift();
}
function goBack() {
  // Close current app view and go to previous
  if (State.currentApp) {
    const view = document.getElementById('view-' + State.currentApp);
    if (view) view.classList.remove('open');
    State.appHistory = State.appHistory.filter(id => id !== State.currentApp);
    State.currentApp = null;
    // If there's history, reopen previous app
    if (State.appHistory.length) {
      const prev = State.appHistory[State.appHistory.length - 1];
      openApp(prev);
    }
    return;
  }
  // No app open — just go home
  goHome();
}

