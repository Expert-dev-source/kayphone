// ===================== KAYPHONE OS PRO MAX - FIXED =====================
let PASSCODE = localStorage.getItem('kayv3_passcode') || '123456';

// Suppress cross-origin iframe "Script error." from bubbling to console
window.addEventListener('error', function(e) {
  if (e.message === 'Script error.' || e.message === 'Script error') {
    e.stopImmediatePropagation();
    e.preventDefault();
    return true;
  }
}, true);

// ===== INDEXEDDB FOR APP STORAGE (no 5MB localStorage limit) =====
let appDB = null;
function openAppDB() {
  return new Promise((resolve, reject) => {
    if (appDB) { resolve(appDB); return; }
    const req = indexedDB.open('KayPhoneApps', 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore('apps', { keyPath: 'id' });
    };
    req.onsuccess = e => { appDB = e.target.result; resolve(appDB); };
    req.onerror = () => reject(req.error);
  });
}
async function saveAppToDB(id, html) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('apps', 'readwrite');
    tx.objectStore('apps').put({ id, html });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function loadAppFromDB(id) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('apps', 'readonly');
    const req = tx.objectStore('apps').get(id);
    req.onsuccess = () => resolve(req.result ? req.result.html : null);
    req.onerror = () => reject(req.error);
  });
}
async function deleteAppFromDB(id) {
  const db = await openAppDB();
  return new Promise((resolve) => {
    const tx = db.transaction('apps', 'readwrite');
    tx.objectStore('apps').delete(id);
    tx.oncomplete = resolve;
  });
}
// Blob URL cache so we only create one per app per session
const blobUrlCache = {};
async function getBlobUrl(appId) {
  if (blobUrlCache[appId]) return blobUrlCache[appId];
  const html = await loadAppFromDB(appId);
  if (!html) return null;
  const blob = new Blob([html], { type: 'text/html' });
  blobUrlCache[appId] = URL.createObjectURL(blob);
  return blobUrlCache[appId];
}

const State = {
  locked:true, currentApp:null, openApps:[], editingMode:false,
  islandExpanded:false, islandMode:'default', cameraFacing:'user', cameraMode:'photo',
  isRecording:false, mediaRecorder:null, recordedChunks:[],
  audioContext:null, audioAnalyser:null, audioSource:null,
  musicPlaying:false, musicCurrentTime:0, musicDuration:0, musicPlaylist:[], musicIndex:0,
  alarms:[], timerInterval:null, timerSeconds:0,
  stopwatchInterval:null, stopwatchTime:0,
  calcExpr:'', calcRes:'0', dialerNumber:'',
  currentChat:null,
  mapInstance:null, weatherData:null,
  currentCalendarDate:new Date(), selectedCalendarDate:null,
  audioRecorder:null, recordingStream:null,
  passcodeEntered:'', hapticEnabled:true, unlocking:false,
  homePage:0, totalPages:3,
  cameraStream:null,
  // Gesture tracking
  gestureStartX:0, gestureStartY:0, gestureStartTime:0,
  gestureActive:false, gestureEdge:null,
  // App history stack
  appHistory:[]
};

