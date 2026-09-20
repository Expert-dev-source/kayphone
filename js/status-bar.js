// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  const lockTime = now.toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit',hour12:true});
  const statusTime = now.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',hour12:false});
  const date = now.toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric'});
  document.getElementById('lockTime').textContent = lockTime;
  document.getElementById('lockDate').textContent = date;
  document.getElementById('statusTime').textContent = statusTime;
  const cb = document.getElementById('clockBig');
  if (cb) cb.textContent = now.toLocaleTimeString('en-US', {hour12:false});
  document.querySelectorAll('.world-time').forEach(el => {
    el.textContent = now.toLocaleTimeString('en-US', {timeZone:el.dataset.tz,hour:'2-digit',minute:'2-digit',hour12:false});
  });
}
setInterval(updateClock, 1000);
updateClock();

// ===== BATTERY =====
async function updateBattery() {
  try {
    if ('getBattery' in navigator) {
      const bat = await navigator.getBattery();
      const pct = Math.round(bat.level * 100);
      const fill = document.getElementById('batteryFill');
      fill.style.width = pct + '%';
      fill.classList.toggle('low', pct < 20);
      fill.classList.toggle('charging', bat.charging);
      document.getElementById('lockBatteryPct').textContent = pct + '%';
      document.getElementById('widgetBattery').textContent = pct + '%';
      bat.addEventListener('levelchange', updateBattery);
      bat.addEventListener('chargingchange', updateBattery);
    } else {
      document.getElementById('batteryFill').style.width = '84%';
      document.getElementById('lockBatteryPct').textContent = '84%';
      document.getElementById('widgetBattery').textContent = '84%';
    }
  } catch(e) {}
}
updateBattery();

// ===== WALLPAPER =====
function applyWallpaper(url) {
  currentWallpaper = url;
  try { localStorage.setItem('kayv3_wallpaper', url); } catch(e) {}
  document.getElementById('wallpaper').style.backgroundImage = "url('" + url + "')";
}
applyWallpaper(currentWallpaper);

// ===== DYNAMIC ISLAND =====
function showIsland(mode, data) {
  State.islandMode = mode;
  const island = document.getElementById('dynamicIsland');
  document.querySelectorAll('.di-content').forEach(c => c.classList.remove('active'));
  if (mode === 'music') {
    document.getElementById('diMusic').classList.add('active');
    document.getElementById('diMusicTitle').textContent = data.title || 'Music';
    document.getElementById('diMusicArtist').textContent = data.artist || 'Tap to expand';
    island.classList.add('compact');
  } else if (mode === 'timer') {
    document.getElementById('diTimer').classList.add('active');
    document.getElementById('diTimerText').textContent = data.text || '00:00';
    island.classList.add('compact');
  } else if (mode === 'call') {
    document.getElementById('diCall').classList.add('active');
    island.classList.add('compact');
  } else {
    document.getElementById('diDefault').classList.add('active');
    island.classList.remove('compact');
  }
  if (mode !== 'default') setTimeout(() => showIsland('default'), 6000);
}
function expandIsland() {
  const island = document.getElementById('dynamicIsland');
  if (State.islandExpanded) {
    State.islandExpanded = false;
    island.classList.remove('expanded');
    if (State.islandMode !== 'default') island.classList.add('compact');
  } else {
    State.islandExpanded = true;
    island.classList.add('expanded');
    island.classList.remove('compact');
    if (State.islandMode === 'music') {
      document.getElementById('diExpandedIcon').textContent = '🎵';
      document.getElementById('diExpandedTitle').textContent = document.getElementById('diMusicTitle').textContent;
      document.getElementById('diExpandedSub').textContent = document.getElementById('diMusicArtist').textContent;
      document.getElementById('diPlayBtn').textContent = State.musicPlaying ? '⏸' : '▶';
    }
  }
}
function islandAction(action) {
  if (action === 'play') { toggleMusic(); document.getElementById('diPlayBtn').textContent = State.musicPlaying ? '⏸' : '▶'; }
  else if (action === 'next') nextTrack();
  else if (action === 'prev') prevTrack();
}

