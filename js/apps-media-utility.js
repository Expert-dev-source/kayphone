// ===== CAMERA =====
Apps.camera = { open: function() { openCamera(); }, close: function() { closeCamera(); } };
function openCamera() { document.getElementById('cameraView').classList.add('open'); startCamera(); }
function closeCamera() {
  document.getElementById('cameraView').classList.remove('open');
  if (State.cameraStream) { State.cameraStream.getTracks().forEach(t => t.stop()); State.cameraStream = null; }
  if (State.isRecording && State.mediaRecorder) { State.mediaRecorder.stop(); State.isRecording = false; }
}
// FIX: removed duplicate "async async" keyword
async function startCamera() {
  try {
    State.cameraStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:State.cameraFacing}});
    const video = document.getElementById('cameraVideo');
    video.srcObject = State.cameraStream;
    video.play();
  } catch(e) { showToast('📷', 'Camera access denied or unavailable'); }
}
function flipCamera() {
  State.cameraFacing = State.cameraFacing === 'user' ? 'environment' : 'user';
  if (State.cameraStream) State.cameraStream.getTracks().forEach(t => t.stop());
  startCamera();
}
function takePhoto() {
  haptic('medium');
  const video = document.getElementById('cameraVideo');
  if (!video || !State.cameraStream || video.videoWidth === 0) { showToast('📷', 'Camera not ready'); return; }
  if (!Supa.isConfigured) { showToast('❌', 'Connect Supabase to save photos'); return; }
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0);
  canvas.toBlob(async function(blob) {
    if (!blob) { showToast('❌', 'Capture failed'); return; }
    const path = Date.now() + '.jpg';
    const saved = await Supa.photos.upload(path, blob, 'image/jpeg');
    if (!saved) { showToast('❌', 'Save failed'); return; }
    showToast('📸', 'Photo saved!');
    updateCameraThumbnail();
    updateWidgetPhotos();
  }, 'image/jpeg', 0.9);
}
async function updateCameraThumbnail() {
  const thumb = document.getElementById('cameraGalleryThumb');
  if (!thumb || !Supa.isConfigured) return;
  const files = await Supa.photos.list();
  if (files.length) {
    const url = await Supa.photos.getSignedUrl(files[0].name);
    if (url) thumb.style.backgroundImage = "url('" + url + "')";
  }
}
async function updateWidgetPhotos() {
  const container = document.getElementById('widgetPhotos');
  if (!container) return;
  if (!Supa.isConfigured) {
    container.innerHTML = Array(4).fill('<div class="widget-photo" style="background:linear-gradient(135deg,var(--ios-gray4),var(--ios-gray5));"></div>').join('');
    return;
  }
  const files = await Supa.photos.list();
  const items = files.slice(0, 4);
  const urls = await Promise.all(items.map(f => Supa.photos.getSignedUrl(f.name)));
  while (urls.length < 4) urls.push(null);
  container.innerHTML = urls.map(url =>
    '<div class="widget-photo" style="background:' + (url ? "url('" + url.replace(/'/g, "\\'") + "')" : 'linear-gradient(135deg,var(--ios-gray4),var(--ios-gray5))') + ';background-size:cover;background-position:center;"></div>'
  ).join('');
}
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('camera-mode')) {
    document.querySelectorAll('.camera-mode').forEach(m => m.classList.remove('active'));
    e.target.classList.add('active');
    State.cameraMode = e.target.dataset.mode;
    const shutter = document.getElementById('cameraShutter');
    if (State.cameraMode === 'video') { shutter.onclick = toggleVideoRecording; }
    else { shutter.onclick = takePhoto; shutter.classList.remove('recording'); }
  }
});
function toggleVideoRecording() {
  const shutter = document.getElementById('cameraShutter');
  if (!State.isRecording) {
    State.isRecording = true;
    shutter.classList.add('recording');
    State.recordedChunks = [];
    State.mediaRecorder = new MediaRecorder(State.cameraStream);
    State.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) State.recordedChunks.push(e.data); };
    State.mediaRecorder.onstop = () => {
      const blob = new Blob(State.recordedChunks, {type:'video/webm'});
      const url = URL.createObjectURL(blob);
      videos.unshift(url);
      try { localStorage.setItem('kayv3_videos', JSON.stringify(videos)); } catch(e) {}
      showToast('🎥', 'Video saved!');
      updateCameraThumbnail();
    };
    State.mediaRecorder.start();
    showToast('🔴', 'Recording started');
  } else {
    State.isRecording = false;
    shutter.classList.remove('recording');
    State.mediaRecorder.stop();
  }
}

// ===== MAPS =====
Apps.maps = {
  open: function() {
    const view = getOrCreateView('maps', 'Maps',
      '<div style="position:absolute;top:50px;left:10px;right:10px;z-index:1000;display:flex;gap:8px;">' +
        '<input type="text" id="mapSearchInput" placeholder="Search for a place" style="flex:1;background:rgba(30,30,30,0.9);backdrop-filter:blur(20px);border:none;border-radius:12px;padding:12px 16px;color:#fff;font-size:15px;outline:none;">' +
        '<button style="background:var(--ios-blue);color:#fff;border:none;border-radius:12px;padding:0 16px;font-weight:600;cursor:pointer;" onclick="searchMap()">Search</button>' +
      '</div>' +
      '<div id="map" style="width:100%;height:100%;"></div>'
    );
    setTimeout(() => { view.classList.add('open'); initMap(); }, 100);
    State.currentApp = 'maps';
  },
  close: function() { const v = document.getElementById('view-maps'); if(v) v.classList.remove('open'); State.currentApp = null; }
};
function initMap() {
  if (typeof L === 'undefined') { setTimeout(initMap, 500); return; }
  if (State.mapInstance) State.mapInstance.remove();
  const map = L.map('map').setView([51.505, -0.09], 13);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {attribution:'©OpenStreetMap, ©CartoDB', maxZoom:19}).addTo(map);
  State.mapInstance = map;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      map.setView([pos.coords.latitude, pos.coords.longitude], 15);
      L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map).bindPopup('You are here').openPopup();
    });
  }
}
function searchMap() {
  const query = document.getElementById('mapSearchInput').value;
  if (!query || !State.mapInstance) return;
  showToast('🗺️', 'Searching for "' + query + '"...');
  const lat = State.mapInstance.getCenter().lat + (Math.random() - 0.5) * 0.1;
  const lng = State.mapInstance.getCenter().lng + (Math.random() - 0.5) * 0.1;
  State.mapInstance.setView([lat, lng], 15);
  L.marker([lat, lng]).addTo(State.mapInstance).bindPopup(query).openPopup();
}

// ===== WEATHER =====
Apps.weather = {
  open: function() {
    const data = State.weatherData;
    const hasData = !!data;
    const temp = hasData ? Math.round(data.current.temperature_2m) : null;
    const cond = hasData ? getWeatherCondition(data.current.weather_code) : 'Unavailable';
    let hourlyHtml = '';
    if (data && data.hourly) {
      const now = new Date().getHours();
      for (let i = now; i < now + 24 && i < data.hourly.time.length; i += 3) {
        const h = new Date(data.hourly.time[i]).getHours();
        const t = Math.round(data.hourly.temperature_2m[i]);
        const c = data.hourly.weather_code[i];
        hourlyHtml += '<div style="text-align:center;flex-shrink:0;"><div style="font-size:12px;color:var(--ios-text-secondary);margin-bottom:6px;">' + h + ':00</div><div style="font-size:20px;margin-bottom:6px;">' + getWeatherIcon(c) + '</div><div style="font-size:14px;font-weight:600;color:#fff;">' + t + '°</div></div>';
      }
    } else {
      hourlyHtml = '<div style="text-align:center;flex-shrink:0;padding:10px;color:var(--ios-text-secondary);font-size:13px;">Allow location access (or check your connection) for live hourly data.</div>';
    }
    const old = document.getElementById('view-weather');
    if (old) old.remove();
    const view = getOrCreateView('weather', 'Weather',
      '<div style="text-align:center;padding:20px 0 30px;">' +
        '<div style="font-size:16px;color:var(--ios-text-secondary);margin-bottom:8px;">📍 My Location</div>' +
        '<div style="font-size:90px;font-weight:200;line-height:1;letter-spacing:-3px;color:#fff;">' + (temp !== null ? temp + '°' : '--°') + '</div>' +
        '<div style="font-size:18px;color:var(--ios-text-secondary);margin-top:8px;">' + cond + '</div>' +
        (temp !== null ? '<div style="font-size:15px;color:var(--ios-text-secondary);margin-top:4px;">H:' + (temp + 5) + '°  L:' + (temp - 5) + '°</div>' : '') +
      '</div>' +
      '<div style="display:flex;gap:20px;padding:16px 20px;border-top:1px solid var(--ios-border);border-bottom:1px solid var(--ios-border);overflow-x:auto;">' + hourlyHtml + '</div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'weather';
  },
  close: function() { const v = document.getElementById('view-weather'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

// ===== CALENDAR =====
// Real persisted events via Supabase (`calendar_events` table),
// scoped to the visitor's own account — not an in-memory array that
// resets to empty on every refresh.
let calendarEventsCache = [];

Apps.calendar = {
  open: function() {
    const old = document.getElementById('view-calendar');
    if (old) old.remove();
    const view = getOrCreateView('calendar', 'Calendar',
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:0 20px 16px;">' +
        '<div style="font-size:28px;color:var(--ios-blue);cursor:pointer;" onclick="changeMonth(-1)">‹</div>' +
        '<h2 id="calMonthYear" style="font-size:24px;font-weight:700;color:#fff;"></h2>' +
        '<div style="font-size:28px;color:var(--ios-blue);cursor:pointer;" onclick="changeMonth(1)">›</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;padding:0 16px;" id="calGrid"></div>' +
      '<div style="padding:20px;" id="calEvents"></div>' +
      '<div style="padding:0 20px 20px;"><button style="width:100%;padding:12px;background:var(--ios-blue);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;" onclick="addCalendarEvent()">+ Add Event</button></div>'
    );
    setTimeout(() => { view.classList.add('open'); renderCalendar(); }, 10);
    State.currentApp = 'calendar';
  },
  close: function() { const v = document.getElementById('view-calendar'); if(v) v.classList.remove('open'); State.currentApp = null; }
};
async function renderCalendar() {
  const grid = document.getElementById('calGrid');
  if (!grid) return;
  const year = State.currentCalendarDate.getFullYear(), month = State.currentCalendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const my = document.getElementById('calMonthYear');
  if (my) my.textContent = State.currentCalendarDate.toLocaleDateString('en-US', {month:'long', year:'numeric'});

  if (Supa.isConfigured) calendarEventsCache = await Supa.calendarEvents.list('event_date', true);

  let html = ['S','M','T','W','T','F','S'].map(d => '<div style="font-size:11px;color:var(--ios-text-secondary);padding:8px 0;font-weight:600;">' + d + '</div>').join('');
  for (let i = 0; i < firstDay; i++) html += '<div></div>';
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const dateStr = dateKey(year, month, day);
    const hasEvent = calendarEventsCache.some(e => e.event_date === dateStr);
    html += '<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:15px;border-radius:50%;cursor:pointer;position:relative;color:#fff;' + (isToday ? 'background:var(--ios-blue);font-weight:600;' : '') + '" onclick="selectCalendarDay(' + day + ')">' + day + (hasEvent ? '<div style="position:absolute;bottom:6px;width:4px;height:4px;background:var(--ios-red);border-radius:50%;"></div>' : '') + '</div>';
  }
  grid.innerHTML = html;
  renderCalendarEvents();
}
function dateKey(year, month, day) {
  return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}
function changeMonth(delta) { State.currentCalendarDate.setMonth(State.currentCalendarDate.getMonth() + delta); State.selectedCalendarDate = null; renderCalendar(); }
function selectCalendarDay(day) { State.selectedCalendarDate = day; renderCalendarEvents(); document.querySelectorAll('#calGrid > div').forEach(function(){}); renderCalendar(); }
function renderCalendarEvents() {
  const container = document.getElementById('calEvents');
  if (!container || State.selectedCalendarDate === null) { if (container) container.innerHTML = ''; return; }
  if (!Supa.isConfigured) { container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--ios-text-secondary);font-size:13px;">Connect Supabase in js/config.js to save events.</div>'; return; }
  const year = State.currentCalendarDate.getFullYear(), month = State.currentCalendarDate.getMonth();
  const dateStr = dateKey(year, month, State.selectedCalendarDate);
  const events = calendarEventsCache.filter(e => e.event_date === dateStr);
  if (!events.length) { container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--ios-text-secondary);">No events</div>'; return; }
  container.innerHTML = events.map(e =>
    '<div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:14px;margin-bottom:8px;border-left:3px solid var(--ios-blue);color:#fff;">' +
      '<div style="font-size:12px;color:var(--ios-blue);font-weight:600;margin-bottom:4px;">' + escapeHtml(e.event_time) + '</div>' +
      '<div style="font-size:15px;font-weight:600;">' + escapeHtml(e.title) + '</div>' +
    '</div>'
  ).join('');
}
async function addCalendarEvent() {
  if (State.selectedCalendarDate === null) { showToast('📅', 'Select a day first'); return; }
  if (!Supa.isConfigured) { showToast('❌', 'Connect Supabase to add events'); return; }
  const title = prompt('Event title:');
  if (!title) return;
  const time = prompt('Time (e.g. 2:00 PM):') || 'All Day';
  const year = State.currentCalendarDate.getFullYear(), month = State.currentCalendarDate.getMonth();
  const created = await Supa.calendarEvents.insert({
    title, event_time: time,
    event_date: dateKey(year, month, State.selectedCalendarDate),
  });
  if (!created) { showToast('❌', 'Could not save event'); return; }
  await renderCalendar();
  showToast('📅', 'Event added!');
}

// ===== CLOCK =====
Apps.clock = {
  open: function() {
    const old = document.getElementById('view-clock');
    if (old) old.remove();
    const view = getOrCreateView('clock', 'Clock',
      '<div style="font-family:monospace;font-size:72px;font-weight:200;text-align:center;padding:40px 0 20px;letter-spacing:-2px;color:#fff;" id="clockBig">' + new Date().toLocaleTimeString('en-US', {hour12:false}) + '</div>' +
      '<div style="text-align:center;font-size:16px;color:var(--ios-text-secondary);margin-bottom:40px;">' + new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'}) + '</div>' +
      '<div style="padding:0 20px;">' +
        '<div style="font-size:18px;font-weight:700;margin-bottom:16px;color:#fff;">World Clocks</div>' +
        [['New York','America/New_York'],['London','Europe/London'],['Tokyo','Asia/Tokyo'],['Lagos','Africa/Lagos']].map(([city, tz]) =>
          '<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.05);border-radius:12px;padding:14px 16px;margin-bottom:8px;color:#fff;">' +
            '<span style="font-size:15px;">' + city + '</span>' +
            '<span style="font-family:monospace;font-size:18px;font-weight:600;" class="world-time" data-tz="' + tz + '">--:--</span>' +
          '</div>'
        ).join('') +
      '</div>' +
      '<div style="padding:20px;">' +
        '<div style="font-size:18px;font-weight:700;margin-bottom:16px;color:#fff;">Alarms</div>' +
        '<div id="alarmsList"></div>' +
        '<button style="width:100%;padding:12px;background:var(--ios-blue);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;margin-top:12px;" onclick="addAlarm()">+ Add Alarm</button>' +
      '</div>' +
      '<div style="padding:0 20px 20px;">' +
        '<div style="font-size:18px;font-weight:700;margin-bottom:16px;color:#fff;">Timer</div>' +
        '<div style="text-align:center;font-size:48px;font-weight:200;margin-bottom:16px;color:#fff;" id="timerDisplay">00:00:00</div>' +
        '<div style="display:flex;gap:10px;">' +
          '<button style="flex:1;padding:12px;background:var(--ios-green);color:#000;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;" onclick="startTimer()">Start</button>' +
          '<button style="flex:1;padding:12px;background:var(--ios-red);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;" onclick="stopTimer()">Stop</button>' +
        '</div>' +
      '</div>' +
      '<div style="padding:0 20px 20px;">' +
        '<div style="font-size:18px;font-weight:700;margin-bottom:16px;color:#fff;">Stopwatch</div>' +
        '<div style="text-align:center;font-size:48px;font-weight:200;margin-bottom:16px;color:#fff;" id="stopwatchDisplay">00:00.00</div>' +
        '<div style="display:flex;gap:10px;">' +
          '<button style="flex:1;padding:12px;background:var(--ios-green);color:#000;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;" onclick="startStopwatch()">Start</button>' +
          '<button style="flex:1;padding:12px;background:var(--ios-red);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;" onclick="stopStopwatch()">Stop</button>' +
          '<button style="flex:1;padding:12px;background:var(--ios-gray4);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;" onclick="resetStopwatch()">Reset</button>' +
        '</div>' +
      '</div>'
    );
    setTimeout(() => { view.classList.add('open'); renderAlarms(); }, 10);
    State.currentApp = 'clock';
  },
  close: function() { const v = document.getElementById('view-clock'); if(v) v.classList.remove('open'); State.currentApp = null; }
};
function renderAlarms() {
  const list = document.getElementById('alarmsList');
  if (!list) return;
  if (!State.alarms.length) { list.innerHTML = '<div style="color:var(--ios-text-secondary);padding:10px;">No alarms set</div>'; return; }
  list.innerHTML = State.alarms.map(function(a, i) {
    return '<div style="display:flex;align-items:center;padding:14px 0;border-bottom:1px solid var(--ios-border);color:#fff;">' +
      '<div style="flex:1;"><div style="font-size:36px;font-weight:300;">' + a.time + '</div><div style="font-size:13px;color:var(--ios-text-secondary);">' + a.label + '</div></div>' +
      '<div style="width:50px;height:30px;background:' + (a.on ? 'var(--ios-green)' : 'var(--ios-gray4)') + ';border-radius:15px;position:relative;cursor:pointer;" onclick="toggleAlarm(' + i + ')">' +
        '<div style="width:26px;height:26px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:transform 0.3s;transform:translateX(' + (a.on ? '20px' : '0') + ');box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>' +
      '</div>' +
    '</div>';
  }).join('');
}
function addAlarm() {
  const time = prompt('Alarm time (HH:MM):');
  if (!time) return;
  const label = prompt('Label:') || 'Alarm';
  State.alarms.push({time, label, on:true});
  renderAlarms();
  showToast('⏰', 'Alarm set for ' + time);
}
function toggleAlarm(i) { State.alarms[i].on = !State.alarms[i].on; renderAlarms(); }
function startTimer() {
  const mins = parseInt(prompt('Minutes:')) || 5;
  State.timerSeconds = mins * 60;
  if (State.timerInterval) clearInterval(State.timerInterval);
  State.timerInterval = setInterval(() => {
    State.timerSeconds--;
    const h = Math.floor(State.timerSeconds / 3600), m = Math.floor((State.timerSeconds % 3600) / 60), s = State.timerSeconds % 60;
    const el = document.getElementById('timerDisplay');
    if (el) el.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    if (State.timerSeconds <= 0) { clearInterval(State.timerInterval); showToast('⏱️', 'Timer done!'); showIsland('timer', {text:'Done'}); }
  }, 1000);
}
function stopTimer() { if (State.timerInterval) clearInterval(State.timerInterval); }
function startStopwatch() {
  if (State.stopwatchInterval) clearInterval(State.stopwatchInterval);
  const startTime = Date.now() - State.stopwatchTime;
  State.stopwatchInterval = setInterval(() => {
    State.stopwatchTime = Date.now() - startTime;
    const totalSecs = Math.floor(State.stopwatchTime / 1000);
    const mins = Math.floor(totalSecs / 60), secs = totalSecs % 60;
    const ms = Math.floor((State.stopwatchTime % 1000) / 10);
    const el = document.getElementById('stopwatchDisplay');
    if (el) el.textContent = String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0') + '.' + String(ms).padStart(2,'0');
  }, 10);
}
function stopStopwatch() { if (State.stopwatchInterval) clearInterval(State.stopwatchInterval); }
function resetStopwatch() { stopStopwatch(); State.stopwatchTime = 0; const el = document.getElementById('stopwatchDisplay'); if (el) el.textContent = '00:00.00'; }

