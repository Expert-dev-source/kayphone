// ===== SPOTLIGHT =====
function openSpotlight() {
  document.getElementById('spotlight').classList.add('open');
  document.getElementById('spotlightInput').value = '';
  document.getElementById('spotlightInput').focus();
  searchSpotlight();
}
function closeSpotlight() { document.getElementById('spotlight').classList.remove('open'); }
function searchSpotlight() {
  const query = document.getElementById('spotlightInput').value.toLowerCase();
  const results = document.getElementById('spotlightResults');
  if (!query) { results.innerHTML = ''; return; }
  let html = '';
  const apps = [...installedApps, ...storeApps].filter(a => a.name.toLowerCase().includes(query));
  if (apps.length) {
    html += '<div class="spotlight-section"><div class="spotlight-section-title">Apps</div>';
    html += apps.map(a =>
      '<div class="spotlight-result" data-spotlightid="' + a.id + '">' +
        '<div class="spotlight-result-icon" style="background:' + a.bg + ';">' + a.icon + '</div>' +
        '<div class="spotlight-result-info"><div class="spotlight-result-name">' + a.name + '</div></div>' +
      '</div>'
    ).join('');
    html += '</div>';
  }
  const noteResults = (typeof notesCache !== 'undefined' ? notesCache : []).filter(n => ((n.title||'') + (n.body||'')).toLowerCase().includes(query));
  if (noteResults.length) {
    html += '<div class="spotlight-section"><div class="spotlight-section-title">Notes</div>';
    html += noteResults.map(function(n) {
      return '<div class="spotlight-result" data-spotlightnote="' + n.id + '">' +
        '<div class="spotlight-result-icon" style="background:var(--ios-yellow);">📝</div>' +
        '<div class="spotlight-result-info"><div class="spotlight-result-name">' + escapeHtml(n.title || 'Untitled') + '</div>' +
        '<div class="spotlight-result-desc">' + escapeHtml((n.body || '').substring(0, 40)) + '</div></div>' +
      '</div>';
    }).join('');
    html += '</div>';
  }
  if (!html) html = '<div style="text-align:center;color:var(--ios-text-secondary);padding:40px;">No results</div>';
  results.innerHTML = html;
}

// ===== CONTROL CENTER =====
function openCC() { document.getElementById('controlCenter').classList.add('open'); }
function closeCC(e) {
  if (e && e.target !== document.getElementById('controlCenter')) return;
  document.getElementById('controlCenter').classList.remove('open');
}
function toggleCCTile(el) {
  haptic('light');
  el.classList.toggle('on');
  const label = el.querySelector('.cc-tile-label').textContent;
  showToast(el.classList.contains('on') ? '✅' : '❌', label + ' ' + (el.classList.contains('on') ? 'On' : 'Off'));
}
function toggleFlashlight() {
  haptic('medium');
  document.getElementById('flashlightOverlay').classList.toggle('on');
  showToast('🔦', 'Flashlight ' + (document.getElementById('flashlightOverlay').classList.contains('on') ? 'On' : 'Off'));
}

// ===== NOTIFICATIONS =====
function openNotif() { document.getElementById('notifCenter').classList.add('open'); renderNotifications(); }
function closeNotif(e) {
  if (e && e.target !== document.getElementById('notifCenter')) return;
  document.getElementById('notifCenter').classList.remove('open');
}
function renderNotifications() {
  const list = document.getElementById('notifList');
  if (!notifications.length) { list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ios-text-secondary);">No notifications</div>'; return; }
  const groups = {};
  notifications.forEach(n => { if (!groups[n.app]) groups[n.app] = []; groups[n.app].push(n); });
  let html = '';
  for (const [app, notifs] of Object.entries(groups)) {
    html += '<div class="notif-group"><div class="notif-group-header">' + app + '</div>';
    html += notifs.map(n =>
      '<div class="notif-item" data-notifid="' + escapeAttr(n.id) + '">' +
        '<div class="notif-icon" style="background:' + escapeAttr(n.iconBg || 'var(--ios-blue)') + ';">' + escapeHtml(n.icon || '🔔') + '</div>' +
        '<div class="notif-content"><div class="notif-title">' + escapeHtml(n.title || '') + '</div>' +
        '<div class="notif-body">' + escapeHtml(n.body || '') + '</div><div class="notif-time">' + escapeHtml(n.time || '') + '</div></div>' +
      '</div>'
    ).join('');
    html += '</div>';
  }
  list.innerHTML = html;
}
function clearNotifications() { notifications = []; saveData(); renderNotifications(); }
function handleNotif(id) {
  const notif = notifications.find(n => n.id === id);
  if (notif && notif.action) { closeNotif(); openApp(notif.action); }
}
function addNotification(app, title, body, action, icon, iconBg) {
  notifications.unshift({id:Date.now().toString(), app, title, body, time:'Just now', action, icon, iconBg});
  if (notifications.length > 20) notifications.pop();
  saveData();
}

// ===== PASSCODE =====
function showPasscode() { showLockPasscode(); }
let passcodeAttempts = 0;
function enterPasscode(digit) {
  haptic('light');
  if (State.passcodeEntered.length >= 6) return;
  State.passcodeEntered += digit;
  updatePasscodeDots();
  if (State.passcodeEntered.length === 6) {
    setTimeout(function() {
      if (State.passcodeEntered === PASSCODE) {
        haptic('success');
        passcodeAttempts = 0;
        document.getElementById('passcodeOverlay').classList.remove('open');
        unlockPhone();
      } else {
        haptic('heavy');
        passcodeAttempts++;
        const po = document.getElementById('passcodeOverlay');
        po.classList.add('shake');
        setTimeout(function() { po.classList.remove('shake'); }, 450);
        const label = document.getElementById('passcodeLabel');
        const remaining = Math.max(0, 6 - passcodeAttempts);
        if (passcodeAttempts >= 6) {
          if (label) label.textContent = 'iPhone Disabled';
          showToast('🔒', 'Too many attempts — try again in 1 minute');
          setTimeout(function() { passcodeAttempts = 0; if(label) label.textContent = 'Enter Passcode'; }, 60000);
        } else {
          if (label) label.textContent = passcodeAttempts >= 3
            ? (remaining + ' attempt' + (remaining === 1 ? '' : 's') + ' remaining')
            : 'Incorrect Passcode';
        }
        State.passcodeEntered = '';
        setTimeout(updatePasscodeDots, 200);
      }
    }, 100);
  }
}
function backspacePasscode() {
  State.passcodeEntered = State.passcodeEntered.slice(0, -1);
  updatePasscodeDots();
  haptic('light');
}
function updatePasscodeDots() {
  document.querySelectorAll('.passcode-dot').forEach(function(dot, i) {
    dot.classList.toggle('filled', i < State.passcodeEntered.length);
  });
}

// ===== WEATHER =====
async function updateWeather() {
  try {
    let lat, lon;
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {timeout:5000}));
      lat = pos.coords.latitude; lon = pos.coords.longitude;
    } catch (geoErr) {
      // Geolocation denied/unavailable — fall back to IP-based
      // location (still real, just less precise) instead of
      // showing a hardcoded fake temperature.
      const ipRes = await fetch('https://ipapi.co/json/');
      const ipData = await ipRes.json();
      lat = ipData.latitude; lon = ipData.longitude;
    }
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto');
    const data = await res.json();
    State.weatherData = data;
    const temp = Math.round(data.current.temperature_2m);
    const cond = getWeatherCondition(data.current.weather_code);
    document.getElementById('widgetWeatherTemp').textContent = temp + '°';
    document.getElementById('widgetWeatherCond').textContent = cond;
    document.getElementById('widgetWeatherIcon').textContent = getWeatherIcon(data.current.weather_code);
    document.getElementById('lockWeatherTemp').textContent = temp + '°';
  } catch(e) {
    // Both geolocation and IP lookup failed (offline, blocked, etc).
    // Show an honest unavailable state rather than a fake reading.
    const temp = document.getElementById('widgetWeatherTemp');
    const cond = document.getElementById('widgetWeatherCond');
    const icon = document.getElementById('widgetWeatherIcon');
    const lock = document.getElementById('lockWeatherTemp');
    if (temp) temp.textContent = '--°';
    if (cond) cond.textContent = 'Unavailable';
    if (icon) icon.textContent = '❓';
    if (lock) lock.textContent = '--°';
  }
}
function getWeatherCondition(code) {
  const c = {0:'Clear',1:'Mainly Clear',2:'Partly Cloudy',3:'Overcast',45:'Fog',48:'Fog',51:'Drizzle',53:'Drizzle',55:'Drizzle',61:'Rain',63:'Rain',65:'Rain',71:'Snow',73:'Snow',75:'Snow',95:'Thunderstorm'};
  return c[code] || 'Clear';
}
function getWeatherIcon(code) {
  const i = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌦️',61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'🌨️',75:'🌨️',95:'⛈️'};
  return i[code] || '☀️';
}
