// ===== APP VIEW SYSTEM =====
function getOrCreateView(appId, title, html, actions) {
  // Always remove and recreate so content refreshes and open class works reliably
  const existing = document.getElementById('view-' + appId);
  if (existing) existing.remove();
  const view = document.createElement('div');
  view.id = 'view-' + appId;
  view.className = 'app-view';
  view.dataset.viewid = appId;
  view.innerHTML =
    '<div class="app-view-header">' +
      '<div class="app-view-back" data-closeid="' + appId + '"><span>←</span></div>' +
      '<span class="app-view-title">' + title + '</span>' +
      (actions ? '<div class="app-view-actions">' + actions + '</div>' : '') +
    '</div>' +
    '<div class="app-view-body">' + html + '</div>';
  document.getElementById('appViews').appendChild(view);
  return view;
}
async function openCustomApp(app) {
  // Remove stale view
  const oldView = document.getElementById('view-' + app.id);
  if (oldView) oldView.remove();

  // Build the app-view shell
  const view = document.createElement('div');
  view.id = 'view-' + app.id;
  view.className = 'app-view';
  view.innerHTML =
    '<div class="app-view-header" style="flex-shrink:0;">' +
      '<div class="app-view-back" data-closeid="' + app.id + '"><span>←</span></div>' +
      '<span class="app-view-title">' + app.name + '</span>' +
    '</div>' +
    '<div class="app-view-body" style="padding:0;flex:1;position:relative;overflow:hidden;height:100%;" id="customAppBody_' + app.id + '">' +
      '<div id="customAppLoader_' + app.id + '" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000;z-index:2;">' +
        '<div style="font-size:44px;margin-bottom:16px;">' + (app.icon||'📱') + '</div>' +
        '<div style="color:#fff;font-size:16px;font-weight:600;">' + app.name + '</div>' +
        '<div style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:8px;">Loading...</div>' +
      '</div>' +
    '</div>';

  document.getElementById('appViews').appendChild(view);
  setTimeout(() => view.classList.add('open'), 10);
  State.currentApp = app.id;

  try {
    // Get the raw HTML from IndexedDB
    const html = await loadAppFromDB(app.id);
    const body = document.getElementById('customAppBody_' + app.id);
    const loader = document.getElementById('customAppLoader_' + app.id);
    if (!body) return;

    if (!html) {
      if (loader) loader.innerHTML =
        '<div style="font-size:48px;margin-bottom:16px;">⚠️</div>' +
        '<div style="color:#fff;font-size:16px;font-weight:600;">App not found</div>' +
        '<div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:8px;">Please re-upload from Kay Store</div>';
      return;
    }

    // Create iframe and inject HTML via document.write — works in all browsers,
    // no URL restrictions, no escaping, full script/style/canvas support
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;height:100%;border:none;position:absolute;inset:0;background:#fff;';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'camera; microphone; accelerometer; gyroscope; payment; clipboard-write');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock');
    body.appendChild(iframe);

    // Inject error-handling wrapper around the app HTML
    // Build error/firebase script as a real function, then serialize it
    function buildInjectedScript() {
      var lines = [];
      lines.push('window.__kayErrors=[];');
      lines.push('window.onerror=function(m,s,l,c,e){');
      lines.push('  window.__kayErrors.push(m);');
      lines.push('  var d=document.getElementById("__kayerr");');
      lines.push('  if(d&&d.style.display==="none"){');
      lines.push('    d.style.display="block";');
      lines.push('    d.innerHTML="<b style=\"color:#FF453A\">App Error:</b> "+m.substring(0,120);');
      lines.push('  }');
      lines.push('  return true;');
      lines.push('};');
      // Firebase stub
      lines.push('if(typeof firebase==="undefined"){');
      lines.push('  var _fbMock={');
      lines.push('    auth:function(){return{');
      lines.push('      onAuthStateChanged:function(cb){setTimeout(function(){cb(null);},0);},');
      lines.push('      signInWithEmailAndPassword:function(){return Promise.reject(new Error("Add Firebase config to your app"));},');
      lines.push('      createUserWithEmailAndPassword:function(){return Promise.reject(new Error("Add Firebase config to your app"));},');
      lines.push('      signOut:function(){return Promise.resolve();},');
      lines.push('      currentUser:null');
      lines.push('    };},');
      lines.push('    firestore:function(){var _c=function(){return{');
      lines.push('      doc:function(){return{get:function(){return Promise.resolve({exists:false,data:function(){return{};}});},');
      lines.push('        set:function(){return Promise.resolve();},update:function(){return Promise.resolve();},');
      lines.push('        onSnapshot:function(cb){cb({exists:false,data:function(){return{};}});return function(){};}};},');
      lines.push('      get:function(){return Promise.resolve({docs:[],forEach:function(){}});},');
      lines.push('      add:function(d){return Promise.resolve({id:"mock_"+Date.now()});},');
      lines.push('      onSnapshot:function(cb){cb({docs:[],forEach:function(){}});return function(){};}');
      lines.push('    };};return{collection:_c,doc:_c};},');
      lines.push('    storage:function(){return{ref:function(){return{put:function(){return{on:function(){}};},getDownloadURL:function(){return Promise.resolve("");}};}};}');
      lines.push('  };');
      lines.push('  window.firebase={initializeApp:function(cfg){console.log("[KayPhone] Firebase stub active — add real config to enable:",cfg&&cfg.projectId);return _fbMock;},apps:[]};');
      lines.push('  window.db=window.firebase.initializeApp().firestore();');
      lines.push('  window.auth=window.firebase.initializeApp().auth();');
      lines.push('}');
      return lines.join('\n');
    }

    var injectedCode = buildInjectedScript();
    var errorBanner = '<div id="__kayerr" style="display:none;position:fixed;top:0;left:0;right:0;background:rgba(20,20,20,0.97);color:#FF453A;font-family:-apple-system,sans-serif;font-size:13px;padding:10px 14px;z-index:99999;border-bottom:2px solid rgba(255,69,58,0.3);"></div>';
    // Build wrapped HTML safely - no string escaping needed
    var parser = new DOMParser();
    var parsed = parser.parseFromString(html, 'text/html');
    var scriptEl = parsed.createElement('script');
    scriptEl.textContent = injectedCode;
    var bannerEl = parsed.createElement('div');
    bannerEl.id = '__kayerr';
    bannerEl.setAttribute('style', 'display:none;position:fixed;top:0;left:0;right:0;background:rgba(20,20,20,0.97);color:#FF453A;font-family:-apple-system,sans-serif;font-size:13px;padding:10px 14px;z-index:99999;border-bottom:2px solid rgba(255,69,58,0.3);');
    if (parsed.head) parsed.head.insertBefore(scriptEl, parsed.head.firstChild);
    if (parsed.body) parsed.body.insertBefore(bannerEl, parsed.body.firstChild);
    var wrappedHtml = '<!DOCTYPE html>' + parsed.documentElement.outerHTML;



    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(wrappedHtml);
    doc.close();

    iframe.onload = function() { if (loader) loader.style.display = 'none'; };
    setTimeout(function() { if (loader) loader.style.display = 'none'; }, 600);

  } catch(err) {
    console.error('openCustomApp error:', err);
    const loader = document.getElementById('customAppLoader_' + app.id);
    if (loader) loader.innerHTML =
      '<div style="font-size:48px;margin-bottom:16px;">💥</div>' +
      '<div style="color:#fff;font-size:16px;font-weight:600;">Failed to load</div>' +
      '<div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:8px;">' + err.message + '</div>';
  }
}

// ===== KAY AI ASSISTANT =====
let kayAssistantRecognition = null;
let kayAssistantListening = false;
let kayAssistantHistory = [];

function openAssistant() {
  const view = document.getElementById('assistantView');
  if (!view) return;
  view.classList.add('open');
  renderAssistantHistory();
  const input = document.getElementById('assistantInput');
  if (input) setTimeout(function() { input.focus(); }, 180);
  if (!kayAssistantHistory.length) {
    addAssistantMessage('assistant', 'Hi, I’m Kay AI. I can open apps, check your time and weather, control Focus, adjust volume, and help you find your way around KayPhone.');
  }
  const status = document.getElementById('assistantStatus');
  if (status) status.textContent = ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) ? 'On-device assistant · voice ready' : 'On-device assistant · text mode';
}

function closeAssistant() {
  const view = document.getElementById('assistantView');
  if (view) view.classList.remove('open');
  stopAssistantListening();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

function renderAssistantHistory() {
  const box = document.getElementById('assistantMessages');
  if (!box) return;
  box.innerHTML = kayAssistantHistory.map(function(m) {
    return '<div class="assistant-message ' + m.role + '"><div>' + escapeHtml(m.text) + '</div></div>';
  }).join('');
  box.scrollTop = box.scrollHeight;
}

function addAssistantMessage(role, text) {
  kayAssistantHistory.push({role:role, text:String(text)});
  if (kayAssistantHistory.length > 30) kayAssistantHistory.shift();
  renderAssistantHistory();
}

function submitAssistantPrompt(prompt) {
  const input = document.getElementById('assistantInput');
  const text = (prompt || (input && input.value) || '').trim();
  if (!text) return;
  if (input) input.value = '';
  addAssistantMessage('user', text);
  const reply = processAssistantCommand(text);
  if (reply) {
    setTimeout(function() {
      addAssistantMessage('assistant', reply.text);
      speakAssistant(reply.text);
      if (reply.action) setTimeout(reply.action, 450);
    }, 180);
  }
}

function speakAssistant(text) {
  if (!window.speechSynthesis || localStorage.getItem('kayv3_ai_speech') === 'false') return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.02; utterance.pitch = 1.02; utterance.volume = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function toggleAssistantListening() {
  if (kayAssistantListening) { stopAssistantListening(); return; }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addAssistantMessage('assistant', 'Voice input is not available in this browser. You can still type to me.');
    return;
  }
  kayAssistantRecognition = new SpeechRecognition();
  kayAssistantRecognition.lang = 'en-US';
  kayAssistantRecognition.interimResults = false;
  kayAssistantRecognition.maxAlternatives = 1;
  kayAssistantRecognition.onstart = function() { kayAssistantListening = true; updateAssistantMic(true); };
  kayAssistantRecognition.onresult = function(e) { submitAssistantPrompt(e.results[0][0].transcript); };
  kayAssistantRecognition.onerror = function() { addAssistantMessage('assistant', 'I couldn’t hear that. Try again or type your request.'); stopAssistantListening(); };
  kayAssistantRecognition.onend = stopAssistantListening;
  try { kayAssistantRecognition.start(); } catch(e) { stopAssistantListening(); }
}

function stopAssistantListening() {
  kayAssistantListening = false;
  if (kayAssistantRecognition) { try { kayAssistantRecognition.stop(); } catch(e) {} }
  kayAssistantRecognition = null;
  updateAssistantMic(false);
}

function updateAssistantMic(active) {
  const mic = document.getElementById('assistantMic');
  const status = document.getElementById('assistantStatus');
  if (mic) { mic.classList.toggle('listening', active); mic.textContent = active ? '■' : '●'; }
  if (status && active) status.textContent = 'Listening…';
}

function processAssistantCommand(command) {
  const cmd = command.toLowerCase().replace(/[?!.,]/g, ' ');
  const appMap = {music:'music',phone:'phone',messages:'messages',camera:'camera',photos:'photos',settings:'settings',weather:'weather',maps:'maps',calendar:'calendar',clock:'clock',notes:'notes',calculator:'calculator',files:'files',games:'games',store:'store',health:'health'};
  for (const [name, id] of Object.entries(appMap)) {
    if ((cmd.includes('open ') || cmd.includes('launch ') || cmd.includes('show ')) && cmd.includes(name)) {
      return {text:'Opening ' + name.charAt(0).toUpperCase() + name.slice(1) + '.', action:function() { closeAssistant(); setTimeout(function() { openApp(id); }, 220); }};
    }
  }
  if (cmd.includes('time') || cmd.includes('what time')) return {text:'It’s ' + new Date().toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}) + '.'};
  if (cmd.includes('date') || cmd.includes('what day')) return {text:'Today is ' + new Date().toLocaleDateString([], {weekday:'long', month:'long', day:'numeric'}) + '.'};
  if (cmd.includes('weather') || cmd.includes('temperature')) {
    return {text:State.weatherData ? 'It’s ' + Math.round(State.weatherData.current.temperature_2m) + '° and ' + getWeatherCondition(State.weatherData.current.weather_code).toLowerCase() + '.' : 'Weather is not available yet. Open Weather to allow location access.'};
  }
  if (cmd.includes('battery') || cmd.includes('charge')) {
    const value = document.getElementById('lockBatteryPct');
    return {text:'Your battery is at ' + (value ? value.textContent : '84%') + '.'};
  }
  if (cmd.includes('focus') || cmd.includes('do not disturb')) {
    const turnOff = cmd.includes('off') || cmd.includes('disable');
    if (typeof setFocus === 'function') setFocus(turnOff ? 'none' : 'Focus');
    return {text:turnOff ? 'Focus is off.' : 'Focus is on. I’ll keep distractions quiet.'};
  }
  if (cmd.includes('volume') && (cmd.includes('up') || cmd.includes('louder'))) { showVolume(10); return {text:'Volume increased.'}; }
  if (cmd.includes('volume') && (cmd.includes('down') || cmd.includes('quieter'))) { showVolume(-10); return {text:'Volume decreased.'}; }
  if (cmd.includes('flashlight') || cmd.includes('torch')) { toggleFlashlight(); return {text:'Flashlight ' + (document.getElementById('flashlightOverlay').classList.contains('on') ? 'on.' : 'off.')}; }
  if (cmd.includes('lock') && cmd.includes('phone')) return {text:'Locking KayPhone.', action:function() { closeAssistant(); lockPhone(); }};
  if (cmd.includes('help') || cmd.includes('what can you do')) return {text:'Try “open Music”, “what time is it?”, “what’s the weather?”, “turn on Focus”, “increase volume”, or “lock my phone”.'};
  if (cmd.includes('joke')) return {text:'Why did the phone go to therapy? It had too many unresolved notifications.'};
  return {text:'I can help with KayPhone actions. Try asking me to open an app, check the time, check weather, control Focus, change volume, or lock the phone.'};
}

document.addEventListener('click', function(e) {
  const prompt = e.target.closest('[data-assistant-prompt]');
  if (prompt) submitAssistantPrompt(prompt.dataset.assistantPrompt);
});
document.addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && e.target.id === 'assistantInput') submitAssistantPrompt();
});

// ===== APP DEFINITIONS =====
const Apps = {};
