// ===== NOTES =====
// Persisted for real in Supabase (`notes` table, RLS-scoped to the
// visitor's own anonymous account) — survives refresh and returns
// on the same browser across visits.
let notesCache = [];
let currentNoteId = null;
let noteSaveTimer = null;

// Warm the cache in the background so Spotlight can search notes
// even before the Notes app has been opened this session.
if (typeof Supa !== 'undefined') {
  Supa.onReady(function() {
    if (Supa.isConfigured) Supa.notes.list('updated_at', false).then(function(d) { notesCache = d; });
  });
}

Apps.notes = {
  open: function() {
    const old = document.getElementById('view-notes');
    if (old) old.remove();
    const view = getOrCreateView('notes', 'Notes',
      '<div style="padding:0 16px;" id="notesList"></div>',
      '<span onclick="newNote()" style="cursor:pointer;">+</span>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'notes';
    renderNotes();
  },
  close: function() { const v = document.getElementById('view-notes'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

async function renderNotes() {
  const list = document.getElementById('notesList');
  if (!list) return;
  if (!Supa.isConfigured) {
    list.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--ios-text-secondary);"><div style="font-size:48px;margin-bottom:12px;">📝</div><div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px;">Notes needs Supabase</div><div style="font-size:13px;">Add your project URL and anon key to js/config.js.</div></div>';
    return;
  }
  notesCache = await Supa.notes.list('updated_at', false);
  if (!notesCache.length) { list.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--ios-text-secondary);"><div style="font-size:48px;margin-bottom:12px;">📝</div><div style="font-size:16px;font-weight:600;color:#fff;">No Notes</div></div>'; return; }
  list.innerHTML = notesCache.map(function(n) {
    return '<div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer;border-left:3px solid ' + (n.pinned ? 'var(--ios-yellow)' : 'transparent') + ';color:#fff;" data-noteid="' + n.id + '">' +
      '<div style="font-size:16px;font-weight:600;">' + escapeHtml(n.title || 'Untitled') + '</div>' +
      '<div style="font-size:13px;color:var(--ios-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(n.body || 'No content') + '</div>' +
      '<div style="font-size:11px;color:var(--ios-text-tertiary);margin-top:6px;">' + new Date(n.updated_at).toLocaleDateString() + (n.pinned ? ' • Pinned' : '') + '</div>' +
    '</div>';
  }).join('');
}

document.addEventListener('click', function(e) {
  const n = e.target.closest('[data-noteid]');
  if (n) openNote(n.dataset.noteid);
});

async function newNote() {
  if (!Supa.isConfigured) { showToast('❌', 'Connect Supabase to create notes'); return; }
  const created = await Supa.notes.insert({ title: '', body: '' });
  if (!created) { showToast('❌', 'Could not create note'); return; }
  openNote(created.id);
}
function openNote(id) { currentNoteId = id; openNoteEditor(); }

function openNoteEditor() {
  const note = notesCache.find(n => n.id === currentNoteId) || { title: '', body: '', pinned: false };
  const old = document.getElementById('view-note-editor');
  if (old) old.remove();
  const view = getOrCreateView('note-editor', note.title || 'Note',
    '<div style="padding:16px;display:flex;flex-direction:column;height:100%;">' +
      '<input type="text" id="noteTitle" value="' + escapeAttr(note.title || '').replace(/"/g, '&quot;') + '" placeholder="Title" style="width:100%;background:transparent;border:none;color:#fff;font-size:28px;font-weight:700;outline:none;margin-bottom:12px;" oninput="saveCurrentNote()">' +
      '<textarea id="noteBody" placeholder="Type your note..." style="flex:1;width:100%;background:transparent;border:none;color:#fff;font-size:16px;line-height:1.5;outline:none;resize:none;" oninput="saveCurrentNote()">' + escapeHtml(note.body || '') + '</textarea>' +
    '</div>',
    '<span onclick="togglePinNote()" style="cursor:pointer;">📌</span>'
  );
  setTimeout(() => view.classList.add('open'), 10);
}
function saveCurrentNote() {
  const title = document.getElementById('noteTitle');
  const body = document.getElementById('noteBody');
  if (!title || !body || !currentNoteId) return;
  clearTimeout(noteSaveTimer);
  noteSaveTimer = setTimeout(async function() {
    await Supa.notes.update(currentNoteId, { title: title.value, body: body.value, updated_at: new Date().toISOString() });
  }, 500);
}
async function togglePinNote() {
  if (!currentNoteId) return;
  const note = notesCache.find(n => n.id === currentNoteId);
  const nextPinned = !(note && note.pinned);
  await Supa.notes.update(currentNoteId, { pinned: nextPinned });
  showToast('📌', nextPinned ? 'Pinned' : 'Unpinned');
}

// ===== REMINDERS =====
// Real persisted list, per-visitor, via Supabase (`reminders` table).
let remindersCache = [];

Apps.reminders = {
  open: function() {
    const old = document.getElementById('view-reminders');
    if (old) old.remove();
    const view = getOrCreateView('reminders', 'Reminders',
      '<div style="padding:0 16px;"><div id="remindersList"></div></div>',
      '<span onclick="addReminder()" style="cursor:pointer;">+</span>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'reminders';
    renderReminders();
  },
  close: function() { const v = document.getElementById('view-reminders'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

async function renderReminders() {
  const list = document.getElementById('remindersList');
  if (!list) return;
  if (!Supa.isConfigured) {
    list.innerHTML = '<div style="text-align:center;padding:60px;color:var(--ios-text-secondary);"><div style="font-size:48px;margin-bottom:12px;">✅</div><div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px;">Reminders needs Supabase</div><div style="font-size:13px;">Add your project URL and anon key to js/config.js.</div></div>';
    return;
  }
  remindersCache = await Supa.reminders.list('created_at', false);
  if (!remindersCache.length) { list.innerHTML = '<div style="text-align:center;padding:60px;color:var(--ios-text-secondary);"><div style="font-size:48px;margin-bottom:12px;">✅</div><div style="font-size:16px;font-weight:600;color:#fff;">All caught up!</div></div>'; return; }
  list.innerHTML = remindersCache.map(function(r) {
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,0.05);border-radius:12px;margin-bottom:8px;color:#fff;">' +
      '<div style="width:24px;height:24px;border:2px solid ' + (r.completed ? 'var(--ios-green)' : 'var(--ios-text-secondary)') + ';border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;" data-remindertoggle="' + r.id + '">' + (r.completed ? '✓' : '') + '</div>' +
      '<div style="flex:1;"><div style="font-size:15px;font-weight:500;' + (r.completed ? 'text-decoration:line-through;color:var(--ios-text-secondary);' : '') + '">' + escapeHtml(r.text) + '</div>' + (r.due_date ? '<div style="font-size:12px;color:var(--ios-text-secondary);margin-top:2px;">📅 ' + escapeHtml(r.due_date) + '</div>' : '') + '</div>' +
      '<div style="color:var(--ios-red);cursor:pointer;font-size:18px;" data-reminderdelete="' + r.id + '">🗑</div>' +
    '</div>';
  }).join('');
}

document.addEventListener('click', async function(e) {
  const t = e.target.closest('[data-remindertoggle]');
  if (t) { await toggleReminder(t.dataset.remindertoggle); return; }
  const d = e.target.closest('[data-reminderdelete]');
  if (d) { await deleteReminder(d.dataset.reminderdelete); return; }
});

async function addReminder() {
  if (!Supa.isConfigured) { showToast('❌', 'Connect Supabase to add reminders'); return; }
  const text = prompt('Reminder:');
  if (!text) return;
  const due = prompt('Due date (YYYY-MM-DD, optional):');
  const payload = { text, completed: false };
  if (due) payload.due_date = due;
  const created = await Supa.reminders.insert(payload);
  if (!created) { showToast('❌', 'Could not save — check the date format'); return; }
  renderReminders();
}
async function toggleReminder(id) {
  const r = remindersCache.find(x => x.id === id);
  if (!r) return;
  await Supa.reminders.update(id, { completed: !r.completed });
  renderReminders();
  if (!r.completed) showToast('✅', 'Completed!');
}
async function deleteReminder(id) {
  await Supa.reminders.remove(id);
  renderReminders();
}

// ===== CALCULATOR =====
Apps.calculator = {
  open: function() {
    const old = document.getElementById('view-calculator');
    if (old) old.remove();
    const calcKeys = [['C','gray','calcClear()'],['±','gray','calcNeg()'],['%','gray','calcPercent()'],['÷','orange','calcOp(\'/\')'],['7','dark','calcNum(7)'],['8','dark','calcNum(8)'],['9','dark','calcNum(9)'],['×','orange','calcOp(\'*\')'],['4','dark','calcNum(4)'],['5','dark','calcNum(5)'],['6','dark','calcNum(6)'],['−','orange','calcOp(\'-\')'],['1','dark','calcNum(1)'],['2','dark','calcNum(2)'],['3','dark','calcNum(3)'],['+','orange','calcOp(\'+\')'],['0','dark','calcNum(0)'],['.','dark','calcDot()'],['=','orange','calcSolve()']];
    const keyHTML = calcKeys.map(([label, cls, action]) =>
      '<button style="aspect-ratio:1;border-radius:50%;border:none;font-size:28px;font-weight:500;cursor:pointer;color:#fff;font-family:inherit;' +
      (cls === 'gray' ? 'background:var(--ios-gray2);' : cls === 'orange' ? 'background:var(--ios-orange);color:#000;' : 'background:var(--ios-gray3);') +
      '" onclick="' + action + '">' + label + '</button>'
    ).join('');
    const view = getOrCreateView('calculator', 'Calculator',
      '<div style="text-align:right;padding:20px 24px;">' +
        '<div style="font-size:20px;color:var(--ios-text-secondary);min-height:28px;word-wrap:break-word;" id="calcExpr"></div>' +
        '<div style="font-size:64px;font-weight:300;margin-top:4px;word-wrap:break-word;color:#fff;" id="calcRes">0</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:0 16px 20px;">' + keyHTML + '</div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'calculator';
  },
  close: function() { const v = document.getElementById('view-calculator'); if(v) v.classList.remove('open'); State.currentApp = null; }
};
function calcNum(n) { State.calcExpr += n; updateCalc(); }
function calcOp(op) { if (State.calcExpr && !['+','-','*','/'].includes(State.calcExpr.slice(-1))) { State.calcExpr += ' ' + op + ' '; } updateCalc(); }
function calcDot() { const parts = State.calcExpr.split(/[+\-*/]/); if (!parts[parts.length-1].includes('.')) State.calcExpr += '.'; updateCalc(); }
function calcClear() { State.calcExpr = ''; State.calcRes = '0'; updateCalc(); }
function calcNeg() { State.calcRes = String(-parseFloat(State.calcRes)); updateCalc(); }
function calcPercent() { State.calcRes = String(parseFloat(State.calcRes) / 100); updateCalc(); }
function calcSolve() {
  try {
    if (State.calcExpr) {
      let e = State.calcExpr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
      State.calcRes = eval(e).toString();
      State.calcExpr = '';
      updateCalc();
    }
  } catch(e) { State.calcRes = 'Error'; updateCalc(); }
}
function updateCalc() {
  const ex = document.getElementById('calcExpr'), re = document.getElementById('calcRes');
  if (ex) ex.textContent = State.calcExpr;
  if (re) re.textContent = State.calcRes;
}

// ===== VOICE MEMOS =====
// Real mic capture (MediaRecorder), real duration (measured off the
// actual recorded audio), uploaded to Supabase Storage — no fake
// "0:42" placeholder duration, no memory-only blob that vanishes
// on refresh.
let vmCache = [];
let vmRecordStartedAt = 0;

Apps.voicememos = {
  open: function() {
    const old = document.getElementById('view-voicememos');
    if (old) old.remove();
    const view = getOrCreateView('voicememos', 'Voice Memos',
      '<div style="text-align:center;padding:40px 20px;">' +
        '<div style="height:100px;display:flex;align-items:center;justify-content:center;gap:3px;margin-bottom:30px;" id="vmWaveform"></div>' +
        '<div style="width:80px;height:80px;border-radius:50%;background:var(--ios-red);display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto;cursor:pointer;box-shadow:0 0 30px rgba(255,69,58,0.4);color:#fff;" id="vmRecordBtn" onclick="toggleRecording()">●</div>' +
        '<div style="margin-top:20px;font-size:14px;color:var(--ios-text-secondary);" id="vmStatus">Tap to record</div>' +
      '</div>' +
      '<div style="padding:0 16px;" id="vmList"></div>'
    );
    setTimeout(() => { view.classList.add('open'); initVMWaveform(); renderVMList(); }, 10);
    State.currentApp = 'voicememos';
  },
  close: function() { const v = document.getElementById('view-voicememos'); if(v) v.classList.remove('open'); State.currentApp = null; }
};
function initVMWaveform() {
  const container = document.getElementById('vmWaveform');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const bar = document.createElement('div');
    bar.style.cssText = 'width:4px;background:var(--ios-blue);border-radius:2px;transition:height 0.1s;height:4px;';
    container.appendChild(bar);
  }
}
function animateVMWaveform() {
  if (!State.isRecording) return;
  const bars = document.querySelectorAll('#vmWaveform div');
  bars.forEach(bar => { bar.style.height = (4 + Math.random() * 80) + 'px'; });
  requestAnimationFrame(animateVMWaveform);
}
async function toggleRecording() {
  const status = document.getElementById('vmStatus');
  if (!State.isRecording) {
    if (!Supa.isConfigured) { showToast('❌', 'Connect Supabase to save recordings'); return; }
    try {
      State.recordingStream = await navigator.mediaDevices.getUserMedia({audio:true});
      State.audioRecorder = new MediaRecorder(State.recordingStream);
      State.recordedChunks = [];
      State.audioRecorder.ondataavailable = e => { if (e.data.size > 0) State.recordedChunks.push(e.data); };
      State.audioRecorder.onstop = async () => {
        const durationSec = Math.max(1, Math.round((Date.now() - vmRecordStartedAt) / 1000));
        const blob = new Blob(State.recordedChunks, {type:'audio/webm'});
        const fileName = Date.now() + '.webm';
        showToast('⏳', 'Saving...');
        const path = await Supa.voiceMemos.upload(fileName, blob, 'audio/webm');
        if (!path) { showToast('❌', 'Save failed'); return; }
        await Supa.voiceMemoMeta.insert({
          storage_path: path,
          name: 'Recording ' + new Date().toLocaleString(),
          duration_seconds: durationSec,
        });
        renderVMList();
        showToast('🎙️', 'Recording saved!');
      };
      vmRecordStartedAt = Date.now();
      State.audioRecorder.start();
      State.isRecording = true;
      if (status) status.textContent = 'Recording...';
      animateVMWaveform();
    } catch(e) { showToast('❌', 'Microphone access denied'); }
  } else {
    State.isRecording = false;
    if (status) status.textContent = 'Tap to record';
    if (State.audioRecorder) State.audioRecorder.stop();
    if (State.recordingStream) State.recordingStream.getTracks().forEach(t => t.stop());
  }
}
function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60), s = Math.round(totalSeconds % 60);
  return m + ':' + String(s).padStart(2, '0');
}
async function renderVMList() {
  const list = document.getElementById('vmList');
  if (!list) return;
  if (!Supa.isConfigured) { list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--ios-text-secondary);font-size:13px;">Connect Supabase in js/config.js to save recordings.</div>'; return; }
  vmCache = await Supa.voiceMemoMeta.list('created_at', false);
  if (!vmCache.length) { list.innerHTML = ''; return; }
  list.innerHTML = vmCache.map(function(vm) {
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,0.05);border-radius:12px;margin-bottom:8px;color:#fff;">' +
      '<div style="width:36px;height:36px;border-radius:50%;background:var(--ios-blue);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;flex-shrink:0;" data-vmplay="' + vm.id + '">▶</div>' +
      '<div style="flex:1;"><div style="font-size:14px;font-weight:600;">' + escapeHtml(vm.name) + '</div><div style="font-size:11px;color:var(--ios-text-secondary);">' + new Date(vm.created_at).toLocaleDateString() + ' • ' + formatDuration(vm.duration_seconds) + '</div></div>' +
      '<div style="color:var(--ios-red);cursor:pointer;" data-vmdelete="' + vm.id + '">🗑</div>' +
    '</div>';
  }).join('');
}
document.addEventListener('click', async function(e) {
  const play = e.target.closest('[data-vmplay]');
  if (play) { await playVM(play.dataset.vmplay); return; }
  const del = e.target.closest('[data-vmdelete]');
  if (del) { await deleteVM(del.dataset.vmdelete); return; }
});
async function playVM(id) {
  const vm = vmCache.find(v => v.id === id);
  if (!vm) return;
  const fileName = vm.storage_path.split('/').pop();
  const url = await Supa.voiceMemos.getSignedUrl(fileName);
  if (!url) { showToast('❌', 'Could not load recording'); return; }
  new Audio(url).play();
  showToast('▶', 'Playing ' + vm.name);
}
async function deleteVM(id) {
  const vm = vmCache.find(v => v.id === id);
  if (!vm) return;
  const fileName = vm.storage_path.split('/').pop();
  await Supa.voiceMemos.remove(fileName);
  await Supa.voiceMemoMeta.remove(id);
  renderVMList();
}

// ===== FILES =====
// Real listing of whatever's actually in your Supabase Storage
// `files` bucket for this visitor — real names, real byte sizes
// (formatted from Storage's own metadata), real download links. No
// fabricated "2.4 MB" placeholders standing in for other apps' data.
let filesCache = [];

Apps.files = {
  open: function() {
    const old = document.getElementById('view-files');
    if (old) old.remove();
    const view = getOrCreateView('files', 'Files',
      '<div style="display:flex;gap:10px;padding:0 16px 16px;">' +
        '<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;text-align:center;font-size:13px;font-weight:600;color:#fff;" id="filesCountLabel">Loading...</div>' +
        '<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;text-align:center;font-size:13px;font-weight:600;cursor:pointer;color:#fff;" data-upload="file">📤 Upload</div>' +
      '</div>' +
      '<div style="padding:0 16px;" id="filesList"></div>'
    );
    setTimeout(() => { view.classList.add('open'); renderFiles(); }, 10);
    State.currentApp = 'files';
  },
  close: function() { const v = document.getElementById('view-files'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
function iconForFile(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼️';
  if (['mp4','webm','mov'].includes(ext)) return '🎥';
  if (['mp3','wav','m4a','webm_audio'].includes(ext)) return '🎙️';
  if (['pdf'].includes(ext)) return '📕';
  if (['doc','docx','txt','md'].includes(ext)) return '📝';
  if (['zip','rar','7z'].includes(ext)) return '🗜️';
  return '📄';
}

async function renderFiles() {
  const list = document.getElementById('filesList');
  const label = document.getElementById('filesCountLabel');
  if (!list) return;
  if (!Supa.isConfigured) {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ios-text-secondary);">Connect Supabase in js/config.js to enable Files.</div>';
    if (label) label.textContent = '📁 Files';
    return;
  }
  filesCache = await Supa.files.list();
  if (label) label.textContent = '📁 ' + filesCache.length + (filesCache.length === 1 ? ' file' : ' files');
  if (!filesCache.length) { list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ios-text-secondary);">No files yet — tap Upload</div>'; return; }
  list.innerHTML = filesCache.map(function(f) {
    const size = f.metadata && f.metadata.size ? formatBytes(f.metadata.size) : '';
    return '<div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;color:#fff;cursor:pointer;" data-fileopen="' + escapeAttr(f.name) + '">' +
      '<div style="font-size:28px;">' + iconForFile(f.name) + '</div>' +
      '<div style="flex:1;min-width:0;"><div style="font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(f.name) + '</div><div style="font-size:12px;color:var(--ios-text-secondary);">' + size + '</div></div>' +
      '<div style="color:var(--ios-red);cursor:pointer;font-size:16px;" data-filedelete="' + escapeAttr(f.name) + '">🗑</div>' +
    '</div>';
  }).join('');
}

document.addEventListener('click', async function(e) {
  const open = e.target.closest('[data-fileopen]');
  if (open && !e.target.closest('[data-filedelete]')) {
    const url = await Supa.files.getSignedUrl(open.dataset.fileopen);
    if (url) window.open(url, '_blank');
    return;
  }
  const del = e.target.closest('[data-filedelete]');
  if (del) {
    e.stopPropagation();
    if (!confirm('Delete "' + del.dataset.filedelete + '"?')) return;
    await Supa.files.remove(del.dataset.filedelete);
    renderFiles();
  }
});

