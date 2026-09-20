// ===== LOCK / UNLOCK =====
async function startUnlock() {
  if (!State.locked || State.unlocking) return;
  State.unlocking = true;
  haptic('medium');
  const faceId = document.getElementById('faceIdContainer');
  const hint   = document.getElementById('lockHint');
  if (faceId) {
    const arc = document.getElementById('faceArc');
    const glow = document.getElementById('faceGlow');
    const label = document.getElementById('faceIdLabel');
    if (arc)   arc.style.opacity = '1';
    if (glow)  glow.style.opacity = '1';
    if (label) label.textContent = 'Scanning...';
    if (label) label.style.color = 'rgba(48,209,88,0.8)';
  }
  if (hint)   hint.textContent = 'Looking for Face...';

  // Try real Face Detection API first
  const faceDetected = await tryRealFaceDetection();

  if (faceDetected === true) {
    // Real face confirmed — unlock directly
    haptic('success');
    if (faceId) {
      const arc = document.getElementById('faceArc');
      const glow = document.getElementById('faceGlow');
      const label = document.getElementById('faceIdLabel');
      const icon  = document.getElementById('faceIdIcon');
      if (arc)   arc.style.opacity = '0';
      if (icon)  icon.textContent = '✅';
      if (label) { label.textContent = 'Face ID ✓'; label.style.color = 'rgba(48,209,88,0.9)'; }
      if (glow)  { glow.style.background = 'radial-gradient(circle,rgba(48,209,88,0.3) 0%,transparent 70%)'; }
    }
    if (hint)   hint.textContent = 'Face ID ✓';
    State.unlocking = false;
    setTimeout(function() { unlockPhone(); }, 300);
  } else if (faceDetected === 'no_face') {
    // Camera worked but no face found
    haptic('medium');
    if (faceId) {
      const arc   = document.getElementById('faceArc');
      const label = document.getElementById('faceIdLabel');
      const icon  = document.getElementById('faceIdIcon');
      if (arc)   arc.style.opacity = '0';
      if (icon)  icon.textContent = '👤';
      if (label) { label.textContent = 'Try Again'; label.style.color = 'rgba(255,69,58,0.8)'; }
      setTimeout(function() { if(label) { label.textContent='Face ID'; label.style.color='rgba(255,255,255,0.6)'; } if(icon) icon.textContent='👤'; }, 2000);
    }
    if (hint)   hint.textContent = 'Face not recognised';
    State.unlocking = false;
    setTimeout(function() {
      if (hint) hint.textContent = 'Tap or Swipe Up to Unlock';
      showLockPasscode();
    }, 800);
  } else {
    // Camera not available / API not supported — fall back to passcode
    if (faceId) {
      const arc = document.getElementById('faceArc');
      if (arc) arc.style.opacity = '0';
      const label = document.getElementById('faceIdLabel');
      if (label) { label.textContent = 'Face ID'; label.style.color = 'rgba(255,255,255,0.6)'; }
    }
    if (hint)   hint.textContent = 'Enter Passcode';
    State.unlocking = false;
    showLockPasscode();
  }
}

async function tryRealFaceDetection() {
  try {
    // Check if FaceDetector API is available (Chrome 74+, behind flag on some browsers)
    if (!('FaceDetector' in window)) return 'unsupported';

    // Request camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 320, height: 240 }
    });

    // Show scanning animation on lock screen
    const faceId = document.getElementById('faceIdContainer');
    const hint   = document.getElementById('lockHint');
    if (hint) hint.textContent = 'Scanning...';
    showFaceScanOverlay(true);

    return await new Promise(function(resolve) {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;

      const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      let attempts = 0;
      const maxAttempts = 8;

      video.onloadedmetadata = function() {
        video.play();
        const scan = setInterval(async function() {
          attempts++;
          try {
            const faces = await detector.detect(video);
            if (faces.length > 0) {
              clearInterval(scan);
              stream.getTracks().forEach(function(t) { t.stop(); });
              showFaceScanOverlay(false);
              resolve(true);
              return;
            }
          } catch(e) {}

          if (attempts >= maxAttempts) {
            clearInterval(scan);
            stream.getTracks().forEach(function(t) { t.stop(); });
            showFaceScanOverlay(false);
            resolve('no_face');
          }
        }, 300);
      };

      // Timeout safety
      setTimeout(function() {
        stream.getTracks().forEach(function(t) { t.stop(); });
        showFaceScanOverlay(false);
        resolve('no_face');
      }, 4000);
    });

  } catch(e) {
    // Permission denied or not supported
    showFaceScanOverlay(false);
    if (e.name === 'NotAllowedError') return 'denied';
    return 'unsupported';
  }
}

function showFaceScanOverlay(show) {
  let overlay = document.getElementById('faceScanOverlay');
  if (!overlay && show) {
    overlay = document.createElement('div');
    overlay.id = 'faceScanOverlay';
    overlay.style.cssText = 'position:absolute;inset:0;z-index:4500;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);';
    overlay.innerHTML =
      '<div style="position:relative;width:200px;height:200px;">' +
        // Scan frame corners
        '<div style="position:absolute;top:0;left:0;width:30px;height:30px;border-top:3px solid #0A84FF;border-left:3px solid #0A84FF;border-radius:4px 0 0 0;"></div>' +
        '<div style="position:absolute;top:0;right:0;width:30px;height:30px;border-top:3px solid #0A84FF;border-right:3px solid #0A84FF;border-radius:0 4px 0 0;"></div>' +
        '<div style="position:absolute;bottom:0;left:0;width:30px;height:30px;border-bottom:3px solid #0A84FF;border-left:3px solid #0A84FF;border-radius:0 0 0 4px;"></div>' +
        '<div style="position:absolute;bottom:0;right:0;width:30px;height:30px;border-bottom:3px solid #0A84FF;border-right:3px solid #0A84FF;border-radius:0 0 4px 0;"></div>' +
        // Scan line
        '<div id="faceScanLine" style="position:absolute;left:10px;right:10px;height:2px;background:linear-gradient(90deg,transparent,#0A84FF,transparent);top:0;animation:faceScanLine 1.5s ease-in-out infinite;"></div>' +
        // Face icon
        '<div style="position:absolute;inset:30px;border-radius:50%;border:1px dashed rgba(10,132,255,0.4);display:flex;align-items:center;justify-content:center;"><span style="font-size:64px;opacity:0.6;">👤</span></div>' +
      '</div>' +
      '<style>@keyframes faceScanLine{0%{top:10px;opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{top:190px;opacity:0;}}</style>' +
      '<div id="faceScanStatus" style="margin-top:24px;font-size:15px;color:#fff;font-weight:500;">Scanning face...</div>' +
      '<div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.4);">Position your face in frame</div>' +
      '<div onclick="cancelFaceScan()" style="margin-top:24px;font-size:14px;color:var(--ios-blue);cursor:pointer;padding:10px 20px;">Use Passcode Instead</div>';
    document.getElementById('phone').appendChild(overlay);
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    requestAnimationFrame(function() { overlay.style.opacity = '1'; });
  } else if (overlay && !show) {
    overlay.style.opacity = '0';
    setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 300);
  }
}

function cancelFaceScan() {
  showFaceScanOverlay(false);
  State.unlocking = false;
  showLockPasscode();
}

function updateLockNotifications() {
  const container = document.getElementById('lockNotifPreview');
  if (!container) return;
  const recent = notifications.slice(0, 3);
  if (!recent.length) { container.innerHTML = ''; return; }
  container.innerHTML = recent.map(function(n) {
    return '<div style="background:rgba(255,255,255,0.12);backdrop-filter:blur(20px);border-radius:16px;padding:12px 16px;display:flex;gap:10px;align-items:center;border:1px solid rgba(255,255,255,0.08);">' +
      '<div style="width:32px;height:32px;border-radius:9px;background:' + (n.iconBg||'var(--ios-blue)') + ';display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">' + (n.icon||'🔔') + '</div>' +
      '<div style="flex:1;text-align:left;min-width:0;">' +
        '<div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.6);">' + n.app + ' · ' + n.time + '</div>' +
        '<div style="font-size:14px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + n.title + '</div>' +
        '<div style="font-size:12px;color:rgba(255,255,255,0.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + n.body + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function showLockPasscode() {
  State.passcodeEntered = '';
  updatePasscodeDots();
  // Update time display on passcode screen
  const now = new Date();
  const pt = document.getElementById('passcodeTime');
  const pd = document.getElementById('passcodeDate');
  if (pt) pt.textContent = now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
  if (pd) pd.textContent = now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  // Reset label
  const pl = document.getElementById('passcodeLabel');
  if (pl) pl.textContent = 'Enter Passcode';
  document.getElementById('passcodeOverlay').classList.add('open');
}

function hidePasscodeOverlay() {
  document.getElementById('passcodeOverlay').classList.remove('open');
  State.passcodeEntered = '';
  updatePasscodeDots();
  State.unlocking = false;
  // Reset lock hint
  const hint = document.getElementById('lockHint');
  if (hint) hint.textContent = 'Swipe up to unlock';
}
function unlockPhone() {
  State.locked = false;
  State.unlocking = false;
  const faceId = document.getElementById('faceIdContainer');
  const lockScreen = document.getElementById('screen-lock');
  const homeScreen = document.getElementById('screen-home');
  const hint = document.getElementById('lockHint');
  if (faceId) faceId.classList.remove('scanning');
  if (lockScreen) lockScreen.classList.remove('active');
  if (homeScreen) homeScreen.classList.add('active');
  if (hint) hint.textContent = 'Swipe up to unlock';
  try { renderHome(); } catch(e) { console.error('renderHome:', e); }
  try { renderDock(); } catch(e) { console.error('renderDock:', e); }
  try { updateWeather(); } catch(e) {}
}
function lockPhone() {
  State.locked = true;
  State.currentApp = null;
  State.appHistory = [];
  // Close all views
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('open'));
  document.getElementById('cameraView').classList.remove('open');
  if (State.cameraStream) { State.cameraStream.getTracks().forEach(t => t.stop()); State.cameraStream = null; }
  closeCC(); closeNotif(); closeSwitcher(); closeSpotlight();
  // Hide passcode overlay if open
  document.getElementById('passcodeOverlay').classList.remove('open');
  State.passcodeEntered = '';
  // Show lock screen
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-lock').classList.add('active');
  // Reset lock hint
  const hint = document.getElementById('lockHint');
  if (hint) hint.textContent = 'Swipe up to unlock';
  const faceId = document.getElementById('faceIdContainer');
  if (faceId) faceId.classList.remove('scanning');
  State.islandExpanded = false;
  document.getElementById('dynamicIsland').classList.remove('expanded','compact');
  haptic('medium');
}

