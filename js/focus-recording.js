// ===================== FOCUS MODES =====================
const focusModes = {
  personal: {name:'Personal',    icon:'😊', color:'var(--ios-blue)',   dnd:false},
  work:     {name:'Work',        icon:'💼', color:'var(--ios-purple)', dnd:true},
  sleep:    {name:'Sleep',       icon:'😴', color:'var(--ios-indigo)', dnd:true},
  dnd:      {name:'Do Not Disturb',icon:'🌙',color:'var(--ios-gray3)', dnd:true},
};
let activeFocus = null;

function setFocus(mode) {
  activeFocus = mode ? focusModes[mode] : null;
  const overlay = document.getElementById('focusOverlay');
  const ccDND = document.getElementById('ccDND');
  if (activeFocus) {
    if (overlay) {
      overlay.style.opacity = '1';
      overlay.innerHTML = '<div class="focus-badge" style="background:' + activeFocus.color + ';">' + activeFocus.icon + ' ' + activeFocus.name + '</div>';
      setTimeout(function() { overlay.style.opacity = '0'; }, 3000);
    }
    if (ccDND && activeFocus.dnd) ccDND.classList.add('on');
    showToast(activeFocus.icon, activeFocus.name + ' Focus on');
    localStorage.setItem('kayv3_focus', mode);
  } else {
    if (ccDND) ccDND.classList.remove('on');
    localStorage.removeItem('kayv3_focus');
    showToast('🌕', 'Focus off');
  }
  haptic('medium');
}

// Add focus options to Control Center
function addFocusToCC() {
  const ccGrid = document.querySelector('.cc-grid');
  if (!ccGrid || document.getElementById('ccFocus')) return;
  const focusBtn = document.createElement('div');
  focusBtn.id = 'ccFocus';
  focusBtn.className = 'cc-tile';
  focusBtn.innerHTML = '<div class="cc-tile-icon">😊</div><div class="cc-tile-label">Focus</div>';
  focusBtn.onclick = function() { showFocusSheet(); };
  ccGrid.appendChild(focusBtn);
}

function showFocusSheet() {
  const sheet = document.createElement('div');
  sheet.className = 'bottom-sheet';
  sheet.style.zIndex = '3000';
  sheet.innerHTML =
    '<div class="sheet-handle"></div>' +
    '<div class="sheet-title">🎯 Focus Mode</div>' +
    '<div id="focusOptionsGrid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;">' +
    '</div>' +
    '<div id="focusTurnOff" style="text-align:center;padding:14px;border-radius:14px;background:rgba(255,255,255,0.08);cursor:pointer;font-weight:600;color:#fff;">Turn Off Focus</div>';

  document.getElementById('phone').appendChild(sheet);
  requestAnimationFrame(function() { sheet.classList.add('open'); });
  // Populate focus grid with data attrs (no inline onclick)
  var grid = sheet.querySelector('#focusOptionsGrid');
  if (grid) {
    Object.entries(focusModes).forEach(function(entry) {
      var key = entry[0], m = entry[1];
      var active = activeFocus && activeFocus.name === m.name;
      var div = document.createElement('div');
      div.style.cssText = 'background:' + (active ? m.color : 'rgba(255,255,255,0.08)') + ';border-radius:16px;padding:16px;cursor:pointer;text-align:center;transition:all 0.2s;';
      div.innerHTML = '<div style="font-size:28px;margin-bottom:6px;">' + m.icon + '</div><div style="font-size:14px;font-weight:600;color:#fff;">' + m.name + '</div>';
      div.addEventListener('click', function() { setFocus(key); sheet.remove(); });
      grid.appendChild(div);
    });
  }
  var turnOff = sheet.querySelector('#focusTurnOff');
  if (turnOff) turnOff.addEventListener('click', function() { setFocus(null); sheet.remove(); });
  sheet.addEventListener('click', function(e) { if (e.target === sheet) sheet.remove(); });
}

// ===================== SCREEN RECORDING =====================
let isRecordingScreen = false;

function toggleScreenRecording() {
  isRecordingScreen = !isRecordingScreen;
  const ind = document.getElementById('recIndicator');
  if (ind) ind.classList.toggle('active', isRecordingScreen);
  showToast(isRecordingScreen ? '🔴' : '⏹', isRecordingScreen ? 'Screen Recording started' : 'Recording saved');
  haptic(isRecordingScreen ? 'heavy' : 'success');
}

// Add screen record to CC
function addScreenRecordToCC() {
  const ccGrid = document.querySelector('.cc-grid');
  if (!ccGrid || document.getElementById('ccRec')) return;
  const recBtn = document.createElement('div');
  recBtn.id = 'ccRec';
  recBtn.className = 'cc-tile';
  recBtn.innerHTML = '<div class="cc-tile-icon">⏺</div><div class="cc-tile-label">Record</div>';
  recBtn.onclick = function() { toggleScreenRecording(); this.classList.toggle('on', isRecordingScreen); closeCC(); };
  ccGrid.appendChild(recBtn);
}

// ===================== CLOSE APP LIBRARY ON SWIPE BACK =====================
document.addEventListener('touchend', function(e) {
  if (!document.getElementById('appLibrary').classList.contains('open')) return;
  const dx = e.changedTouches[0].clientX - State.gestureStartX;
  if (dx > 60) closeAppLibrary();
}, {passive:true});

// ===================== HAPTIC FEEDBACK PATTERNS =====================
// Already defined above, but add new patterns
function hapticPattern(pattern) {
  if (!State.hapticEnabled || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}

// ===================== SMART STATUS BAR =====================
// Status bar changes color based on open app background
function updateStatusBarForApp(appId) {
  // Already white text on dark bg - all good
}


// Run boot sequence first, then init() is called inside it
runBootSequence();
