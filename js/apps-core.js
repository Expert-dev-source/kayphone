// ===== PHONE =====
Apps.phone = {
  open: function() {
    const dialKeys = [['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],['6','MNO'],['7','PQRS'],['8','TUV'],['9','WXYZ'],['*',''],['0','+'],['#','']];
    const keyHTML = dialKeys.map(([n,l]) =>
      '<div class="dialer-key" data-dialkey="' + encodeURIComponent(n) + '" style="aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;border:1px solid rgba(255,255,255,0.05);color:#fff;">' +
        '<div style="font-size:28px;font-weight:400;">' + n + '</div>' +
        (l ? '<div style="font-size:9px;color:var(--ios-text-secondary);letter-spacing:1px;margin-top:2px;">' + l + '</div>' : '') +
      '</div>'
    ).join('');
    const view = getOrCreateView('phone', 'Phone',
      '<div id="dialerDisplay" style="font-size:48px;font-weight:300;text-align:center;padding:30px 0 20px;font-variant-numeric:tabular-nums;letter-spacing:2px;min-height:90px;color:#fff;"></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:0 20px;">' + keyHTML + '</div>' +
      '<div style="display:flex;justify-content:center;gap:40px;padding:20px 0 30px;">' +
        '<div style="width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;background:rgba(255,255,255,0.1);color:#fff;" onclick="dialerBack()">⌫</div>' +
        '<div style="width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;background:var(--ios-green);" onclick="callNumber()">📞</div>' +
        '<div style="width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;background:rgba(255,255,255,0.1);color:#fff;" onclick="dialerClear()">✕</div>' +
      '</div>' +
      '<div style="padding:20px;"><div style="font-size:16px;font-weight:700;margin-bottom:12px;color:#fff;">Recent</div><div id="recentCalls"></div></div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'phone';
    renderRecentCalls();
  },
  close: function() {
    const v = document.getElementById('view-phone');
    if (v) v.classList.remove('open');
    State.currentApp = null;
  }
};
function pressKey(k) { State.dialerNumber += decodeURIComponent(k); document.getElementById('dialerDisplay').textContent = State.dialerNumber; haptic('light'); }
function dialerBack() { State.dialerNumber = State.dialerNumber.slice(0, -1); document.getElementById('dialerDisplay').textContent = State.dialerNumber; }
function dialerClear() { State.dialerNumber = ''; document.getElementById('dialerDisplay').textContent = ''; }
function callNumber() {
  if (!State.dialerNumber) return;
  haptic('success');
  showToast('📞', 'Calling ' + State.dialerNumber + '...');
  const recents = JSON.parse(localStorage.getItem('kayv3_recents') || '[]');
  recents.unshift({number:State.dialerNumber, time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), type:'outgoing'});
  localStorage.setItem('kayv3_recents', JSON.stringify(recents.slice(0, 20)));
  renderRecentCalls();
}
function renderRecentCalls() {
  const el = document.getElementById('recentCalls');
  if (!el) return;
  const recents = JSON.parse(localStorage.getItem('kayv3_recents') || '[]');
  if (!recents.length) { el.innerHTML = '<div style="color:var(--ios-text-secondary);padding:20px;text-align:center;">No recent calls</div>'; return; }
  // FIX: build call button onclick safely
  el.innerHTML = recents.map(function(r) {
    return '<div style="display:flex;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#fff;">' +
      '<div style="font-size:20px;margin-right:12px;">' + (r.type === 'outgoing' ? '📤' : '📥') + '</div>' +
      '<div style="flex:1;"><div style="font-size:15px;font-weight:600;">' + r.number + '</div><div style="font-size:12px;color:var(--ios-text-secondary);">' + r.time + '</div></div>' +
      '<div style="width:36px;height:36px;border-radius:50%;background:var(--ios-green);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;" data-calltap="1">📞</div>' +
    '</div>';
  }).join('');
}

// ===== MESSAGES =====
// Real, live, 2-way chat over Supabase Realtime. A "conversation" is
// a shared room by name — open the site in two tabs/devices, join
// the same room, and messages sync instantly for both. No fake
// contacts, no scripted auto-replies: whoever's actually in the
// room sends the reply.
let currentChatChannel = null;
let renderedMessageIds = new Set();

Apps.messages = {
  open: async function() {
    const view = getOrCreateView('messages', 'Messages',
      '<div style="padding:0 16px 12px;">' +
        '<div style="display:flex;gap:8px;">' +
          '<input type="text" id="roomJoinInput" placeholder="Room name (e.g. recruiter-chat)" style="flex:1;background:var(--ios-gray5);border:none;border-radius:10px;padding:10px 14px;color:#fff;font-size:14px;outline:none;">' +
          '<button id="roomJoinBtn" style="background:var(--ios-blue);color:#fff;border:none;border-radius:10px;padding:0 16px;font-weight:600;cursor:pointer;">Join</button>' +
        '</div>' +
        '<div style="margin-top:8px;font-size:12px;color:var(--ios-text-secondary);">Chatting as <span id="msgDisplayName">...</span> · <span id="msgChangeName" style="color:var(--ios-blue);cursor:pointer;">change</span></div>' +
      '</div>' +
      '<div style="padding:0 16px 8px;font-size:13px;font-weight:600;color:var(--ios-text-secondary);">Active rooms</div>' +
      '<div id="msgList" style="display:flex;flex-direction:column;gap:2px;"></div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'messages';
    renderMessages();
    const nameEl = document.getElementById('msgDisplayName');
    if (nameEl && Supa.isConfigured) nameEl.textContent = await Supa.getDisplayName();
  },
  close: function() {
    const v = document.getElementById('view-messages');
    if (v) v.classList.remove('open');
    State.currentApp = null;
  }
};

async function renderMessages() {
  const list = document.getElementById('msgList');
  if (!list) return;
  if (!Supa.isConfigured) {
    list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--ios-text-secondary);">' +
      '<div style="font-size:40px;margin-bottom:10px;">💬</div>' +
      '<div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:6px;">Messages needs Supabase</div>' +
      '<div style="font-size:13px;">Add your project URL and anon key to js/config.js to enable live chat.</div>' +
    '</div>';
    return;
  }
  const rooms = await Supa.messages.listConversations();
  if (!rooms.length) {
    list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--ios-text-secondary);">No rooms yet — join one above to create it.</div>';
    return;
  }
  list.innerHTML = rooms.map(function(r) {
    return '<div style="display:flex;gap:12px;align-items:center;padding:12px 16px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);color:#fff;" data-chatid="' + r.id + '" data-chatname="' + escapeAttr(r.name) + '">' +
      '<div style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;background:linear-gradient(135deg,var(--ios-purple),var(--ios-pink));color:#fff;">#</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:16px;font-weight:600;">' + escapeHtml(r.name) + '</div>' +
        '<div style="font-size:13px;color:var(--ios-text-secondary);">Tap to open</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

document.addEventListener('click', async function(e) {
  if (e.target.id === 'roomJoinBtn') {
    const input = document.getElementById('roomJoinInput');
    if (!input || !input.value.trim()) return;
    const room = await Supa.messages.joinOrCreateConversation(input.value.trim());
    if (!room) { showToast('❌', 'Room names: lowercase letters, numbers, - and _ only'); return; }
    input.value = '';
    renderMessages();
    openChat(room.id, room.name);
  }
  if (e.target.id === 'msgChangeName') {
    const current = await Supa.getDisplayName();
    const name = prompt('Your display name (shown to others in chat):', current);
    if (!name || !name.trim()) return;
    await Supa.setDisplayName(name.trim().slice(0, 40));
    const nameEl = document.getElementById('msgDisplayName');
    if (nameEl) nameEl.textContent = name.trim().slice(0, 40);
    showToast('✅', 'Name updated');
  }
});

async function openChat(conversationId, roomName) {
  State.currentChat = conversationId;
  const cid = 'chat-' + conversationId;
  const oldc = document.getElementById('view-' + cid);
  if (oldc) oldc.remove();
  const view = getOrCreateView(cid, '#' + escapeHtml(roomName),
    '<div style="display:flex;flex-direction:column;gap:8px;padding:16px;flex:1;overflow-y:auto;" id="chatMessages"></div>' +
    '<div style="display:flex;gap:8px;padding:10px 16px;border-top:1px solid var(--ios-border);align-items:center;background:var(--ios-bg);">' +
      '<input type="text" id="chatInput" placeholder="Message" style="flex:1;background:var(--ios-gray5);border:none;border-radius:20px;padding:10px 16px;color:#fff;font-size:15px;outline:none;">' +
      '<div id="chatSendBtn" style="width:36px;height:36px;border-radius:50%;background:var(--ios-blue);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;flex-shrink:0;">⬆</div>' +
    '</div>'
  );
  setTimeout(() => view.classList.add('open'), 10);

  if (currentChatChannel) { Supa.messages.unsubscribe(currentChatChannel); currentChatChannel = null; }
  renderedMessageIds = new Set();
  const history = await Supa.messages.listMessages(conversationId);
  history.forEach(m => renderedMessageIds.add(m.id));
  paintChatMessages(history);
  currentChatChannel = Supa.messages.subscribe(conversationId, function(newMsg) {
    if (State.currentChat !== conversationId) return;
    appendChatMessage(newMsg);
  });
}

function chatBubbleHtml(m) {
  const mine = Supa.getUser() && m.sender_id === Supa.getUser().id;
  const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return '<div style="max-width:75%;padding:10px 14px;border-radius:18px;font-size:15px;line-height:1.4;word-wrap:break-word;' +
    (mine ? 'align-self:flex-end;background:var(--ios-blue);border-bottom-right-radius:4px;color:#fff;' : 'align-self:flex-start;background:var(--ios-gray4);border-bottom-left-radius:4px;color:#fff;') + '">' +
    (mine ? '' : '<div style="font-size:11px;font-weight:700;color:var(--ios-purple);margin-bottom:2px;">' + escapeHtml(m.sender_name) + '</div>') +
    escapeHtml(m.body) +
    '<div style="font-size:10px;color:rgba(255,255,255,0.6);margin-top:4px;text-align:right;">' + time + '</div></div>';
}

function paintChatMessages(msgs) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  if (!msgs.length) {
    container.innerHTML = '<div style="text-align:center;color:var(--ios-text-secondary);padding:30px;">No messages yet — say hi 👋</div>';
    return;
  }
  container.innerHTML = msgs.map(chatBubbleHtml).join('');
  container.scrollTop = container.scrollHeight;
}

function appendChatMessage(m) {
  if (renderedMessageIds.has(m.id)) return;
  renderedMessageIds.add(m.id);
  const container = document.getElementById('chatMessages');
  if (!container) return;
  if (container.children.length === 1 && container.textContent.includes('say hi')) container.innerHTML = '';
  const div = document.createElement('div');
  div.innerHTML = chatBubbleHtml(m);
  container.appendChild(div.firstChild);
  container.scrollTop = container.scrollHeight;
  if (!(Supa.getUser() && m.sender_id === Supa.getUser().id)) haptic('medium');
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  if (!input || !input.value.trim() || !State.currentChat) return;
  const text = input.value.trim();
  input.value = '';
  haptic('light');
  const sent = await Supa.messages.send(State.currentChat, text);
  if (!sent) { showToast('❌', 'Message failed to send'); return; }
  // Optimistically paint our own message; Realtime will also echo it
  // back but a duplicate id is harmless to re-render past — skip if seen.
  appendChatMessage(sent);
}

// ===== SAFARI =====
Apps.safari = {
  open: function() {
    const view = getOrCreateView('safari', 'Safari',
      '<div style="display:flex;gap:8px;padding:0 16px 12px;align-items:center;">' +
        '<input type="text" id="browserUrl" placeholder="Search or enter address" value="google.com" style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 14px;color:#fff;font-size:14px;outline:none;">' +
        '<button style="background:var(--ios-blue);color:#fff;border:none;border-radius:10px;padding:10px 18px;font-weight:600;cursor:pointer;" onclick="loadBrowser()">Go</button>' +
      '</div>' +
      '<iframe style="width:100%;height:calc(100% - 60px);border:none;background:#fff;" id="browserFrame" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" src="https://www.google.com/webhp?igu=1"></iframe>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'safari';
  },
  close: function() { const v = document.getElementById('view-safari'); if(v) v.classList.remove('open'); State.currentApp = null; }
};
function loadBrowser() {
  const url = document.getElementById('browserUrl').value;
  const frame = document.getElementById('browserFrame');
  if (url.includes('.')) { frame.src = url.startsWith('http') ? url : 'https://' + url; }
  else { frame.src = 'https://www.google.com/search?q=' + encodeURIComponent(url); }
}

// ===== MUSIC =====
Apps.music = {
  open: function() {
    const view = getOrCreateView('music', 'Now Playing',
      '<div style="text-align:center;padding:20px 0;">' +
        '<div style="width:260px;height:260px;border-radius:12px;margin:0 auto 30px;background:linear-gradient(135deg,var(--ios-purple),var(--ios-pink));display:flex;align-items:center;justify-content:center;font-size:80px;box-shadow:0 20px 60px rgba(0,0,0,0.4);position:relative;overflow:hidden;" id="musicArt">🎵' +
          '<canvas id="realVisualizer" width="260" height="80" style="position:absolute;bottom:0;left:0;"></canvas>' +
        '</div>' +
        '<div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;" id="musicTitle">Midnight City</div>' +
        '<div style="font-size:16px;color:var(--ios-text-secondary);margin-bottom:30px;" id="musicArtist">M83</div>' +
        '<div style="padding:0 30px;margin-bottom:8px;"><div style="width:100%;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;position:relative;cursor:pointer;" onclick="seekMusic(event)" id="musicProgress"><div style="position:absolute;left:0;top:0;height:100%;width:0%;background:#fff;border-radius:2px;" id="musicBar"></div></div></div>' +
        '<div style="display:flex;justify-content:space-between;padding:0 30px;font-size:12px;color:var(--ios-text-secondary);margin-bottom:24px;"><span id="musicCurrent">0:00</span><span id="musicDuration">3:45</span></div>' +
        '<div style="display:flex;justify-content:center;align-items:center;gap:40px;">' +
          '<span style="font-size:28px;color:#fff;cursor:pointer;" onclick="prevTrack()">⏮</span>' +
          '<span style="width:64px;height:64px;background:#fff;color:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;" id="playBtn" onclick="toggleMusic()">▶</span>' +
          '<span style="font-size:28px;color:#fff;cursor:pointer;" onclick="nextTrack()">⏭</span>' +
        '</div>' +
      '</div>' +
      '<div style="margin:20px 30px;padding:16px;background:rgba(255,255,255,0.05);border-radius:12px;text-align:center;cursor:pointer;border:2px dashed rgba(255,255,255,0.1);color:#fff;" data-upload="music">' +
        '<div style="font-size:24px;margin-bottom:8px;">📤</div>' +
        '<div style="font-size:15px;font-weight:600;">Upload Music</div>' +
        '<div style="font-size:12px;color:var(--ios-text-secondary);margin-top:4px;">MP3 files from your device</div>' +
      '</div>' +
      '<div style="padding:0 30px;margin-top:20px;"><div style="font-size:16px;font-weight:700;margin-bottom:12px;color:#fff;">Playlist</div><div id="musicPlaylist"></div></div>'
    );
    setTimeout(() => { view.classList.add('open'); renderPlaylist(); }, 10);
    State.currentApp = 'music';
  },
  close: function() { const v = document.getElementById('view-music'); if(v) v.classList.remove('open'); State.currentApp = null; stopRealVisualizer(); }
};

let audioPlayer = null;
function renderPlaylist() {
  const pl = document.getElementById('musicPlaylist');
  if (!pl) return;
  if (!State.musicPlaylist.length) { pl.innerHTML = '<div style="color:var(--ios-text-secondary);text-align:center;padding:10px;">No songs yet. Upload one!</div>'; return; }
  pl.innerHTML = State.musicPlaylist.map(function(track, i) {
    return '<div style="display:flex;align-items:center;gap:12px;padding:10px;background:rgba(255,255,255,0.05);border-radius:10px;margin-bottom:6px;cursor:pointer;color:#fff;" onclick="playTrack(' + i + ')">' +
      '<div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,var(--ios-purple),var(--ios-pink));display:flex;align-items:center;justify-content:center;font-size:16px;">🎵</div>' +
      '<div style="flex:1;"><div style="font-size:14px;font-weight:600;">' + track.name + '</div><div style="font-size:12px;color:var(--ios-text-secondary);">' + track.artist + '</div></div>' +
      (i === State.musicIndex ? '<span style="color:var(--ios-blue);">▶</span>' : '') +
    '</div>';
  }).join('');
}
function playTrack(index) {
  State.musicIndex = index;
  const track = State.musicPlaylist[index];
  if (!track) return;
  if (audioPlayer) { audioPlayer.pause(); audioPlayer = null; }
  audioPlayer = new Audio(track.url);
  audioPlayer.play().catch(() => {});
  State.musicPlaying = true;
  document.getElementById('musicTitle').textContent = track.name;
  document.getElementById('musicArtist').textContent = track.artist;
  document.getElementById('playBtn').textContent = '⏸';
  showToast('🎵', 'Now playing: ' + track.name);
  showIsland('music', {title:track.name, artist:track.artist});
  renderPlaylist();
  startRealVisualizer();
  updateRealProgress();
}
function toggleMusic() {
  haptic('medium');
  State.musicPlaying = !State.musicPlaying;
  const btn = document.getElementById('playBtn');
  if (btn) btn.textContent = State.musicPlaying ? '⏸' : '▶';
  if (State.musicPlaying) {
    if (audioPlayer) audioPlayer.play().catch(() => {});
    else if (State.musicPlaylist.length) playTrack(State.musicIndex);
    showIsland('music', {title:document.getElementById('musicTitle').textContent, artist:document.getElementById('musicArtist').textContent});
    startRealVisualizer();
    updateRealProgress();
  } else {
    if (audioPlayer) audioPlayer.pause();
    showIsland('default');
    stopRealVisualizer();
  }
}
function prevTrack() { if (State.musicIndex > 0) playTrack(State.musicIndex - 1); else showToast('⏮', 'First track'); }
function nextTrack() { if (State.musicIndex < State.musicPlaylist.length - 1) playTrack(State.musicIndex + 1); else showToast('⏭', 'Last track'); }
function seekMusic(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  document.getElementById('musicBar').style.width = (pct * 100) + '%';
  if (audioPlayer && audioPlayer.duration) audioPlayer.currentTime = pct * audioPlayer.duration;
}
function updateRealProgress() {
  if (!audioPlayer || !State.musicPlaying) return;
  const bar = document.getElementById('musicBar');
  const cur = document.getElementById('musicCurrent');
  const dur = document.getElementById('musicDuration');
  if (bar && audioPlayer.duration) bar.style.width = ((audioPlayer.currentTime / audioPlayer.duration) * 100) + '%';
  if (cur && audioPlayer.currentTime) {
    const m = Math.floor(audioPlayer.currentTime / 60), s = Math.floor(audioPlayer.currentTime % 60);
    cur.textContent = m + ':' + String(s).padStart(2, '0');
  }
  if (dur && audioPlayer.duration) {
    const m = Math.floor(audioPlayer.duration / 60), s = Math.floor(audioPlayer.duration % 60);
    dur.textContent = m + ':' + String(s).padStart(2, '0');
  }
  requestAnimationFrame(updateRealProgress);
}
let visualizerInterval = null;
function startRealVisualizer() {
  if (!audioPlayer) return;
  stopRealVisualizer();
  try {
    if (!State.audioContext) State.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (!State.audioAnalyser) { State.audioAnalyser = State.audioContext.createAnalyser(); State.audioAnalyser.fftSize = 64; }
    if (State.audioSource) State.audioSource.disconnect();
    State.audioSource = State.audioContext.createMediaElementSource(audioPlayer);
    State.audioSource.connect(State.audioAnalyser);
    State.audioAnalyser.connect(State.audioContext.destination);
  } catch(e) {}
  const canvas = document.getElementById('realVisualizer');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const bufferLength = State.audioAnalyser ? State.audioAnalyser.frequencyBinCount : 16;
  const dataArray = new Uint8Array(bufferLength);
  visualizerInterval = setInterval(() => {
    if (!State.musicPlaying) { stopRealVisualizer(); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (State.audioAnalyser) {
      State.audioAnalyser.getByteFrequencyData(dataArray);
      const barWidth = canvas.width / bufferLength;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + (dataArray[i] / 255) * 0.7) + ')';
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
      }
    } else {
      const barWidth = canvas.width / 16;
      for (let i = 0; i < 16; i++) {
        const h = Math.random() * canvas.height * 0.8;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(i * barWidth, canvas.height - h, barWidth - 1, h);
      }
    }
  }, 50);
}
function stopRealVisualizer() {
  if (visualizerInterval) { clearInterval(visualizerInterval); visualizerInterval = null; }
  const canvas = document.getElementById('realVisualizer');
  if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
}
function handleMusicUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const name = file.name.replace(/\.[^/.]+$/, '');
  State.musicPlaylist.push({name, artist:'Local File', url});
  if (State.musicPlaylist.length === 1) playTrack(0);
  else renderPlaylist();
  showToast('🎵', 'Added: ' + name);
}

// ===== PHOTOS =====
// Real gallery backed by Supabase Storage — every shot from Camera
// and every upload lands in your own private bucket folder and is
// fetched with a signed URL, not a fake in-memory array.
let galleryItems = [];

Apps.photos = {
  open: function() {
    const old = document.getElementById('view-photos');
    if (old) old.remove();
    const view = getOrCreateView('photos', 'Photos',
      '<div style="padding:0 16px;margin-bottom:12px;"><div style="font-size:28px;font-weight:700;color:#fff;">Photos</div><div style="font-size:14px;color:var(--ios-text-secondary);" id="galleryCount">Loading...</div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;" id="galleryGrid"></div>',
      '<span data-upload="photo" style="cursor:pointer;">+</span>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'photos';
    renderGallery();
  },
  close: function() { const v = document.getElementById('view-photos'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

async function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  const countEl = document.getElementById('galleryCount');
  if (!grid) return;
  if (!Supa.isConfigured) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--ios-text-secondary);"><div style="font-size:48px;margin-bottom:12px;">🖼️</div><div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px;">Photos needs Supabase</div><div style="font-size:13px;">Add your project URL and anon key to js/config.js.</div></div>';
    if (countEl) countEl.textContent = '';
    return;
  }
  const files = await Supa.photos.list();
  if (countEl) countEl.textContent = files.length + (files.length === 1 ? ' item' : ' items');
  if (!files.length) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--ios-text-secondary);"><div style="font-size:48px;margin-bottom:12px;">🖼️</div><div style="font-size:16px;font-weight:600;color:#fff;">No Photos Yet</div></div>'; galleryItems = []; return; }
  const withUrls = await Promise.all(files.map(async f => ({ name: f.name, url: await Supa.photos.getSignedUrl(f.name) })));
  galleryItems = withUrls.filter(f => f.url);
  grid.innerHTML = galleryItems.map(function(item, i) {
    return '<div style="aspect-ratio:1;background:#222;background-size:cover;background-position:center;cursor:pointer;background-image:url(\'' + item.url.replace(/'/g, "\\'") + '\')" data-photoidx="' + i + '"></div>';
  }).join('');
}

function viewPhoto(index) {
  const item = galleryItems[index];
  if (!item) return;
  const old = document.getElementById('view-photo-lightbox');
  if (old) old.remove();
  const view = getOrCreateView('photo-lightbox', 'Photo',
    '<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:16px;">' +
      '<img src="' + item.url + '" style="max-width:100%;max-height:100%;border-radius:12px;object-fit:contain;">' +
    '</div>',
    '<span data-photodelete="' + escapeAttr(item.name) + '" style="cursor:pointer;color:var(--ios-red);">🗑</span>'
  );
  setTimeout(() => view.classList.add('open'), 10);
}

document.addEventListener('click', async function(e) {
  const p = e.target.closest('[data-photoidx]');
  if (p) { viewPhoto(parseInt(p.dataset.photoidx)); return; }
  const del = e.target.closest('[data-photodelete]');
  if (del) {
    if (!confirm('Delete this photo?')) return;
    await Supa.photos.remove(del.dataset.photodelete);
    safeCloseView('photo-lightbox');
    renderGallery();
    showToast('🗑', 'Photo deleted');
  }
});

function openGalleryFromCamera() { closeCamera(); openApp('photos'); }

