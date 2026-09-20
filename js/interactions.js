// ===== HORIZONTAL PAGE SWIPE (fixed - smooth, no fighting) =====
(function() {
  var psX = 0, psY = 0, psT = 0;
  var psDragging = false;
  var psDx = 0;
  var SWIPE_THRESHOLD = 40;   // min px to commit page change
  var SWIPE_VELOCITY  = 0.3;  // px/ms to fast-swipe even if short
  var DIRECTION_LOCK  = 8;    // px to decide horizontal vs vertical

  function getContainer() { return document.getElementById('homePages'); }
  function getPhone()     { return document.getElementById('phone'); }

  function isHomeActive() {
    return !State.locked &&
           document.getElementById('screen-home') &&
           document.getElementById('screen-home').classList.contains('active') &&
           !State.currentApp;
  }

  function applyDrag(dx) {
    var c = getContainer(); if (!c) return;
    var pct = -State.homePage * 100 + (dx / getPhone().offsetWidth) * 100;
    // Clamp with rubber-band past edges
    var minPct = -(State.totalPages - 1) * 100;
    if (pct > 0)      pct = pct * 0.25;
    if (pct < minPct) pct = minPct + (pct - minPct) * 0.25;
    c.style.transition = 'none';
    c.style.transform  = 'translateX(' + pct + '%)';
  }

  function snapTo(page) {
    var c = getContainer(); if (!c) return;
    page = Math.max(0, Math.min(State.totalPages - 1, page));
    goToPage(page);
    c.style.transition = 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)';
    c.style.transform  = 'translateX(' + (-page * 100) + '%)';
    setTimeout(function() { c.style.transition = ''; }, 400);
  }

  document.addEventListener('touchstart', function(e) {
    if (!isHomeActive()) return;
    psDragging = false;
    psDx = 0;
    psX = e.touches[0].clientX;
    psY = e.touches[0].clientY;
    psT = Date.now();
  }, {passive: true});

  document.addEventListener('touchmove', function(e) {
    if (!isHomeActive()) return;
    var dx = e.touches[0].clientX - psX;
    var dy = e.touches[0].clientY - psY;

    // Direction lock: only engage horizontal swipe if clearly horizontal
    if (!psDragging) {
      if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return;
      if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll wins
      // It's horizontal - but only if touch started in the middle zone
      var phone = getPhone(); if (!phone) return;
      var rect = phone.getBoundingClientRect();
      var relY = psY - rect.top;
      if (relY < 55 || relY > rect.height - 90) return; // don't steal from status/dock
      psDragging = true;
    }

    if (!psDragging) return;
    psDx = dx;
    applyDrag(dx);
  }, {passive: true});

  document.addEventListener('touchend', function(e) {
    if (!psDragging) { psDragging = false; return; }
    psDragging = false;
    var dx       = e.changedTouches[0].clientX - psX;
    var dt       = Date.now() - psT;
    var velocity = Math.abs(dx) / dt;
    var isFlick  = velocity > SWIPE_VELOCITY;
    var isEnough = Math.abs(dx) > SWIPE_THRESHOLD;

    if ((isFlick || isEnough) && Math.abs(dx) > 20) {
      if (dx < 0 && State.homePage < State.totalPages - 1) {
        // Swiped left → next page
        // If on last page and swiped left, open App Library
        if (State.homePage === State.totalPages - 1) {
          snapTo(State.homePage);
          if (typeof openAppLibrary === 'function') openAppLibrary();
        } else {
          snapTo(State.homePage + 1);
        }
      } else if (dx > 0 && State.homePage > 0) {
        snapTo(State.homePage - 1);
      } else {
        snapTo(State.homePage); // bounce back
      }
    } else {
      snapTo(State.homePage); // too short - snap back
    }
  }, {passive: true});

  // Page dot clicks
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('page-dot')) {
      goToPage(parseInt(e.target.dataset.page));
    }
  });
})();


// ===== FILE INPUTS =====
// ===== APP MANAGEMENT =====
function deleteApp(e, id) {
  try { if (e && typeof e.stopPropagation==='function') e.stopPropagation(); } catch(ex) {}
  const app = installedApps.find(function(a){ return a.id===id; });
  if (!app) return;
  if (!confirm('Delete "'+app.name+'"?')) return;
  const idx = installedApps.findIndex(function(a){ return a.id===id; });
  if (idx>-1) installedApps.splice(idx,1);
  dockApps = installedApps.filter(function(a){ return a.dock; });
  const view = document.getElementById('view-'+id);
  if (view) view.remove();
  State.appHistory = State.appHistory.filter(function(h){ return h!==id; });
  if (State.currentApp===id) State.currentApp=null;
  State.editingMode=false;
  saveData(); renderHome(); renderDock();
  showToast('🗑','"'+app.name+'" deleted');
  haptic('medium');
}
function showAppMenu(e,id) {
  try { if (e && typeof e.preventDefault==='function') e.preventDefault(); } catch(ex) {}
  State.editingMode=true; renderHome();
}

// ===== STORE FUNCTIONS =====
function handleAppUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(ev) {
    const html = ev.target.result;
    const name = file.name.replace(/\.[^/.]+$/,'');
    const appId = 'app_'+Date.now();
    const colors=['#0A84FF','#30D158','#FF9F0A','#FF453A','#BF5AF2','#FF375F','#64D2FF','#5E5CE6'];
    const c1=colors[Math.floor(Math.random()*colors.length)];
    const c2=colors[Math.floor(Math.random()*colors.length)];
    try { await saveAppToDB(appId,html); } catch(err){ showToast('❌','Save failed: '+err.message); return; }
    const inferredCategory=/game|arcade|snake|puzzle/i.test(name)?'Games':/photo|draw|paint|studio|music/i.test(name)?'Creative':/chat|social|gram|book/i.test(name)?'Social':'Utilities';
    const newApp={id:appId,name:name.charAt(0).toUpperCase()+name.slice(1),icon:'📱',bg:'linear-gradient(135deg,'+c1+','+c2+')',desc:'Uploaded HTML app · '+Math.max(1,Math.round(file.size/1024))+' KB',category:inferredCategory,page:2,isCustom:true,version:'1.0.0'};
    storeApps.push(newApp);
    saveData();
    if (document.getElementById('view-store') && document.getElementById('view-store').classList.contains('open')) Apps.store.open();
    showToast('📦','"'+newApp.name+'" uploaded! Tap Install to add.');
  };
  reader.readAsText(file);
}

function installStoreApp(index) {
  const app=storeApps[index]; if (!app) return;
  if (installedApps.find(function(a){return a.id===app.id;})) { showToast('ℹ️','"'+app.name+'" already installed'); return; }
  installedApps.push(app);
  dockApps=installedApps.filter(function(a){return a.dock;});
  renderHome(); renderDock(); saveData();
  if (document.getElementById('view-store') && document.getElementById('view-store').classList.contains('open')) Apps.store.open();
  showToast('✅','"'+app.name+'" installed!'); haptic('success');
}

async function previewStoreApp(index) {
  const app=storeApps[index]; if (!app) return;
  await openCustomApp(app);
}

async function deleteStoreApp(index) {
  const app=storeApps[index]; if (!app) return;
  if (!confirm('Delete "'+app.name+'"?')) return;
  const hi=installedApps.findIndex(function(a){return a.id===app.id;});
  if (hi>-1) installedApps.splice(hi,1);
  storeApps.splice(index,1);
  try { await deleteAppFromDB(app.id); } catch(e) {}
  if (blobUrlCache[app.id]) { URL.revokeObjectURL(blobUrlCache[app.id]); delete blobUrlCache[app.id]; }
  const v=document.getElementById('view-'+app.id); if (v) v.remove();
  saveData(); renderHome(); renderDock();
  if (document.getElementById('view-store') && document.getElementById('view-store').classList.contains('open')) Apps.store.open();
  showToast('🗑','"'+app.name+'" deleted');
}

function renderStore() {
  const available=document.getElementById('storeAvailable');
  const installed=document.getElementById('storeInstalled');
  const query=(document.getElementById('storeSearch')||{}).value||'';
  const q=query.trim().toLowerCase();
  const catalog=(typeof KAY_STORE_CATALOG!=='undefined'?KAY_STORE_CATALOG:[]).filter(function(app){
    const categoryMatch=selectedStoreCategory==='Featured'||app.category===selectedStoreCategory;
    return categoryMatch && (!q || (app.name+' '+app.category+' '+app.desc).toLowerCase().includes(q));
  });
  const custom=storeApps.filter(function(app){
    const categoryMatch=selectedStoreCategory==='Featured'||(app.category||'Utilities')===selectedStoreCategory;
    return categoryMatch && (!q || (app.name+' '+(app.category||'Utilities')+' '+(app.desc||'HTML App')).toLowerCase().includes(q));
  });
  if (available) {
    const cards=[];
    catalog.forEach(function(app){
      const isInstalled=!!installedApps.find(function(a){return a.id===app.id;});
      cards.push('<div style="background:rgba(255,255,255,0.06);border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);margin-bottom:10px;">'+
        '<div style="height:120px;background:'+app.bg+';display:flex;align-items:center;justify-content:center;position:relative;"><div style="font-size:56px;">'+app.icon+'</div><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,rgba(0,0,0,0.55));"></div><div style="position:absolute;bottom:9px;left:12px;"><div style="font-size:16px;font-weight:700;color:#fff;">'+app.name+'</div><div style="font-size:11px;color:rgba(255,255,255,0.7);">'+app.category+' · KayPhone Original</div></div></div>'+
        '<div style="padding:10px 12px 4px;color:var(--ios-text-secondary);font-size:12px;line-height:1.4;">'+app.desc+'</div>'+
        '<div style="display:flex;gap:8px;padding:10px 12px;">'+
          (isInstalled?'<button onclick="openApp(\''+app.id+'\')" style="flex:1;padding:10px;background:var(--ios-blue);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">▶ Open</button>':'<button onclick="installStoreBuiltin(\''+app.id+'\')" style="flex:1;padding:10px;background:var(--ios-blue);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">⬇ Add to Home</button>')+
        '</div></div>');
    });
    custom.forEach(function(app){
      const i=storeApps.indexOf(app), isInstalled=!!installedApps.find(function(a){return a.id===app.id;});
      cards.push('<div style="background:rgba(255,255,255,0.06);border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);margin-bottom:10px;"><div style="height:120px;background:'+(app.bg||'linear-gradient(135deg,#0A84FF,#BF5AF2)')+';display:flex;align-items:center;justify-content:center;position:relative;"><div style="font-size:56px;">'+(app.icon||'📱')+'</div><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.5));"></div><div style="position:absolute;bottom:8px;left:12px;"><div style="font-size:16px;font-weight:700;color:#fff;">'+app.name+'</div><div style="font-size:11px;color:rgba(255,255,255,0.6);">'+(app.category||'Utilities')+' · Your App</div></div></div><div style="display:flex;gap:8px;padding:10px 12px;"><button data-previewid="'+i+'" style="flex:1;padding:10px;background:rgba(255,255,255,0.1);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">▶ Preview</button>'+(isInstalled?'<button style="flex:1;padding:10px;background:rgba(255,255,255,0.06);color:var(--ios-text-secondary);border:1px solid rgba(255,255,255,0.1);border-radius:12px;font-size:14px;font-weight:600;" disabled>✓ Installed</button>':'<button data-installid="'+i+'" style="flex:1;padding:10px;background:var(--ios-blue);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">⬇ Install</button>')+'<button data-deletestoreid="'+i+'" style="padding:10px 12px;background:rgba(255,69,58,0.15);color:var(--ios-red);border:1px solid rgba(255,69,58,0.2);border-radius:12px;font-size:14px;cursor:pointer;">🗑</button></div></div>');
    });
    available.innerHTML=cards.length?cards.join(''):'<div style="text-align:center;padding:44px 20px;color:var(--ios-text-secondary);"><div style="font-size:52px;margin-bottom:12px;">⌕</div><div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px;">No apps found</div><div style="font-size:13px;line-height:1.5;">Try another category or upload your own HTML app.</div></div>';
    const count=document.getElementById('storeResultCount'); if(count) count.textContent=cards.length+' app'+(cards.length===1?'':'s');
  }
  if (installed) {
    installed.innerHTML=installedApps.filter(function(a){return !a.isCustom;}).map(function(app){
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:14px;margin-bottom:6px;">'+
        '<div style="width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;background:'+app.bg+';">'+app.icon+'</div>'+
        '<div style="flex:1;font-size:15px;font-weight:500;color:#fff;">'+app.name+'</div>'+
        '<span style="font-size:11px;color:var(--ios-text-secondary);background:rgba(255,255,255,0.06);padding:3px 8px;border-radius:8px;">Built-in</span>'+
      '</div>';
    }).join('');
  }
}

function installStoreBuiltin(id) {
  const catalog=(typeof KAY_STORE_CATALOG!=='undefined'?KAY_STORE_CATALOG:[]).find(function(a){return a.id===id;});
  if (!catalog) return;
  if (installedApps.find(function(a){return a.id===id;})) { openApp(id); return; }
  const app=Object.assign({},catalog,{page:2,badge:0,dock:false});
  installedApps.push(app); dockApps=installedApps.filter(function(a){return a.dock;});
  renderHome(); renderDock(); saveData(); renderStore();
  showToast('✅',catalog.name+' added to Home Screen'); haptic('success');
}

// ===== SETTINGS HELPERS =====
function openWallpapers() {
  const old=document.getElementById('view-wallpapers'); if (old) old.remove();
  const defaults=[
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80',
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80',
    'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&q=80',
    'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80',
    'https://images.unsplash.com/photo-1604076913837-52ab5629fde4?w=800&q=80',
    'https://images.unsplash.com/photo-1495044696702-93e2f95c3e6c?w=800&q=80',
  ];
  const view=getOrCreateView('wallpapers','Wallpaper',
    '<div style="padding:16px;">'+
      '<div style="font-size:13px;font-weight:600;color:var(--ios-text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Choose Wallpaper</div>'+
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;" id="wallpaperGrid"></div>'+
    '</div>'+
    '<div style="margin:0 16px 20px;background:rgba(255,255,255,0.06);border-radius:16px;padding:16px;text-align:center;cursor:pointer;color:#fff;" data-upload="wallpaper">'+
      '<div style="font-size:28px;margin-bottom:6px;">📤</div>'+
      '<div style="font-size:15px;font-weight:600;">Upload Custom Wallpaper</div>'+
    '</div>'
  );
  setTimeout(function(){
    view.classList.add('open');
    const grid=document.getElementById('wallpaperGrid');
    if (grid) grid.innerHTML=[...defaults,...wallpapers].map(function(url){
      return '<div style="aspect-ratio:9/16;border-radius:14px;background-size:cover;background-position:center;cursor:pointer;border:3px solid '+(url===currentWallpaper?'var(--ios-blue)':'transparent')+';background-image:url('+JSON.stringify(url)+');transition:border 0.2s;" data-wallurl="'+encodeURIComponent(url)+'"></div>';
    }).join('');
  },10);
}

function selectWallpaper(url,el) {
  applyWallpaper(url);
  document.querySelectorAll('#wallpaperGrid div').forEach(function(d){d.style.borderColor='transparent';});
  if (el) el.style.borderColor='var(--ios-blue)';
  showToast('🖼️','Wallpaper changed!'); haptic('success');
}

function toggleHaptics() {
  State.hapticEnabled=!State.hapticEnabled;
  const el=document.getElementById('hapticValue');
  if (el) el.textContent=State.hapticEnabled?'On':'Off';
  showToast('📳','Haptics '+(State.hapticEnabled?'On':'Off'));
}

// Health app (was missing)
Apps.health = {
  open: function() {
    const old=document.getElementById('view-health'); if(old) old.remove();
    const view=getOrCreateView('health','Health',
      '<div style="padding:20px;text-align:center;">'+
        '<div style="font-size:28px;font-weight:700;color:#fff;margin-bottom:4px;">Activity</div>'+
        '<div style="font-size:14px;color:var(--ios-text-secondary);">Today</div>'+
      '</div>'+
      '<div style="display:flex;justify-content:center;gap:16px;padding:20px 0;">'+
        [['Move','var(--ios-red)','75%','66'],['Exercise','var(--ios-green)','85%','40'],['Stand','var(--ios-teal)','62%','100']].map(function(r){
          return '<div style="text-align:center;"><div style="width:90px;height:90px;position:relative;">'+
            '<svg width="90" height="90" viewBox="0 0 90 90" style="transform:rotate(-90deg);">'+
              '<circle fill="none" stroke="var(--ios-gray4)" stroke-width="8" cx="45" cy="45" r="37"/>'+
              '<circle fill="none" stroke="'+r[1]+'" stroke-width="8" stroke-linecap="round" stroke-dasharray="232" stroke-dashoffset="'+r[3]+'" cx="45" cy="45" r="37"/>'+
            '</svg>'+
            '<div style="font-size:17px;font-weight:700;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;">'+r[2]+'</div>'+
          '</div><div style="font-size:11px;color:var(--ios-text-secondary);margin-top:6px;">'+r[0]+'</div></div>';
        }).join('')+
      '</div>'+
      '<div style="padding:0 20px;">'+
        '<div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#fff;">Steps Today</div>'+
        '<div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;text-align:center;">'+
          '<div style="font-size:52px;font-weight:200;color:#fff;">8,432</div>'+
          '<div style="font-size:14px;color:var(--ios-text-secondary);margin-top:4px;">of 10,000 goal · 84%</div>'+
          '<div style="width:100%;height:8px;background:var(--ios-gray4);border-radius:4px;margin-top:16px;overflow:hidden;">'+
            '<div style="width:84%;height:100%;background:linear-gradient(90deg,var(--ios-red),var(--ios-orange));border-radius:4px;"></div>'+
          '</div>'+
        '</div>'+
        '<div style="margin-top:16px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">'+
          [['❤️','Heart Rate','72 bpm'],['🔥','Calories','420 kcal'],['😴','Sleep','7h 23m'],['💧','Water','1.8 L']].map(function(r){
            return '<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px;"><div style="font-size:24px;margin-bottom:4px;">'+r[0]+'</div><div style="font-size:12px;color:var(--ios-text-secondary);">'+r[1]+'</div><div style="font-size:18px;font-weight:600;color:#fff;margin-top:2px;">'+r[2]+'</div></div>';
          }).join('')+
        '</div>'+
      '</div>'
    );
    setTimeout(function(){view.classList.add('open');},10);
    State.currentApp='health';
  },
  close:function(){const v=document.getElementById('view-health');if(v)v.classList.remove('open');State.currentApp=null;}
};


const fileInputConfigs = [
  {id:'photoUpload', accept:'image/*', handler:async function(e) {
    const file = e.target.files[0]; if (!file) return;
    if (!Supa.isConfigured) { showToast('❌', 'Connect Supabase to upload photos'); return; }
    showToast('⏳', 'Uploading...');
    const path = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const saved = await Supa.photos.upload(path, file, file.type);
    if (!saved) { showToast('❌', 'Upload failed'); return; }
    showToast('🖼️', 'Photo added!');
    renderGallery();
    updateWidgetPhotos();
  }},
  {id:'wallpaperUpload', accept:'image/*', handler:function(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { wallpapers.push(ev.target.result); try{localStorage.setItem('kayv3_wallpapers',JSON.stringify(wallpapers));}catch(e){} applyWallpaper(ev.target.result); showToast('🖼️','Custom wallpaper applied!'); };
    reader.readAsDataURL(file);
  }},
  {id:'appUpload', accept:'.html,.htm,.txt', handler:handleAppUpload},
  {id:'musicUpload', accept:'audio/*', handler:handleMusicUpload},
  {id:'fileUpload', accept:'*/*', handler:async function(e) {
    const file = e.target.files[0]; if (!file) return;
    if (!Supa.isConfigured) { showToast('❌', 'Connect Supabase to upload files'); return; }
    showToast('⏳', 'Uploading ' + file.name + '...');
    const path = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const saved = await Supa.files.upload(path, file, file.type);
    if (!saved) { showToast('❌', 'Upload failed'); return; }
    showToast('📤', 'Uploaded: ' + file.name);
    renderFiles();
  }}
];
fileInputConfigs.forEach(fi => {
  const input = document.createElement('input');
  input.type = 'file'; input.id = fi.id; input.accept = fi.accept; input.style.display = 'none';
  input.onchange = fi.handler;
  document.body.appendChild(input);
});
