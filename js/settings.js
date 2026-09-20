// ===== SETTINGS =====
// ===== PASSCODE CHANGE SYSTEM =====
function openPasscodeChange() {
  let step = 1;
  let newCode = '';
  let currentInput = '';

  const overlay = document.createElement('div');
  overlay.id = 'pcChangeOverlay';
  overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.97);z-index:3000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;';

  const stepLabels = ['Enter Current Passcode', 'Enter New Passcode', 'Confirm New Passcode'];
  const stepSubs   = ['Verify your identity', 'Choose a 6-digit code', 'Re-enter to confirm'];

  function getDots() {
    return [0,1,2,3,4,5].map(i =>
      '<div style="width:14px;height:14px;border-radius:50%;border:2px solid #fff;background:' +
      (i < currentInput.length ? '#fff' : 'transparent') + ';transition:background 0.15s;"></div>'
    ).join('');
  }

  function render(shake) {
    overlay.innerHTML =
      '<div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:8px;">' + stepLabels[step-1] + '</div>' +
      '<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:32px;">' + stepSubs[step-1] + '</div>' +
      '<div id="pcChangeDots" style="display:flex;gap:14px;margin-bottom:40px;">' + getDots() + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">' +
        [['1',''],['2','ABC'],['3','DEF'],
         ['4','GHI'],['5','JKL'],['6','MNO'],
         ['7','PQRS'],['8','TUV'],['9','WXYZ'],
         ['',''], ['0','+'], ['⌫','']
        ].map(([n,l]) =>
          n ? '<div data-pcchangekey="' + n + '" style="width:74px;height:74px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(255,255,255,0.08);">' +
              '<div style="font-size:28px;font-weight:300;color:#fff;">' + n + '</div>' +
              (l ? '<div style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:1px;">' + l + '</div>' : '') +
            '</div>'
          : '<div></div>'
        ).join('') +
      '</div>' +
      '<div id="pcChangeCancelBtn" style="margin-top:28px;font-size:16px;color:var(--ios-blue);cursor:pointer;padding:10px 30px;">Cancel</div>';

    if (shake) {
      overlay.style.animation = 'none';
      overlay.offsetHeight;
      overlay.style.animation = 'shakePasscode 0.45s ease-in-out';
    }

    // Bind cancel
    overlay.querySelector('#pcChangeCancelBtn').onclick = function() { overlay.remove(); };

    // Bind keys
    overlay.querySelectorAll('[data-pcchangekey]').forEach(function(el) {
      el.addEventListener('click', function() {
        const k = el.dataset.pcchangekey;
        handlePCKey(k);
      });
    });
  }

  function updateDots() {
    const dotsEl = overlay.querySelector('#pcChangeDots');
    if (dotsEl) dotsEl.innerHTML = getDots();
  }

  function handlePCKey(k) {
    if (k === '⌫') {
      currentInput = currentInput.slice(0, -1);
      updateDots();
      haptic('light');
      return;
    }
    if (currentInput.length >= 6) return;
    currentInput += k;
    updateDots();
    haptic('light');

    if (currentInput.length === 6) {
      setTimeout(function() {
        if (step === 1) {
          if (currentInput !== PASSCODE) {
            currentInput = '';
            render(true);
            showToast('❌', 'Wrong passcode');
            return;
          }
          step = 2; currentInput = ''; render(false);
        } else if (step === 2) {
          newCode = currentInput; currentInput = ''; step = 3; render(false);
        } else {
          if (currentInput !== newCode) {
            currentInput = ''; step = 2; newCode = ''; render(true);
            showToast('❌', 'Codes do not match — try again');
            return;
          }
          PASSCODE = currentInput;
          localStorage.setItem('kayv3_passcode', PASSCODE);
          overlay.remove();
          showToast('✅', 'Passcode changed!');
        }
      }, 120);
    }
  }

  document.getElementById('phone').appendChild(overlay);
  render(false);
}


Apps.settings = {
  open: function() {
    const old = document.getElementById('view-settings');
    if (old) old.remove();
    const view = getOrCreateView('settings', 'Settings', Settings.mainHTML());
    setTimeout(function() { view.classList.add('open'); }, 10);
    State.currentApp = 'settings';
  },
  close: function() {
    const v = document.getElementById('view-settings');
    if (v) v.classList.remove('open');
    State.currentApp = null;
  }
};

// ===== SETTINGS ENGINE =====
const Settings = {

  // Reusable row builder
  row: function(icon, bg, label, right, action, toggle) {
    const rightHTML = toggle
      ? '<div class="toggle-switch ' + (localStorage.getItem(toggle) === 'true' ? 'on' : '') + '" data-togglekey="' + toggle + '"><div class="toggle-thumb"></div></div>'
      : '<div style="display:flex;align-items:center;gap:6px;"><span class="settings-value">' + (right||'') + '</span><span class="settings-arrow">›</span></div>';
    return '<div class="settings-row" data-settingaction="' + (action||'') + '">' +
      '<div class="settings-icon" style="background:' + bg + ';">' + icon + '</div>' +
      '<span class="settings-label">' + label + '</span>' +
      rightHTML +
    '</div>';
  },

  section: function(title, rows) {
    return '<div class="settings-section">' +
      (title ? '<div class="settings-section-title">' + title + '</div>' : '') +
      '<div class="settings-card">' + rows.join('') + '</div>' +
    '</div>';
  },

  mainHTML: function() {
    const R = Settings.row.bind(Settings);
    const S = Settings.section.bind(Settings);
    const battPct = document.getElementById('lockBatteryPct') ? document.getElementById('lockBatteryPct').textContent : '84%';

    return (
      '<div style="padding:8px 16px 4px;"><div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border-radius:13px;padding:10px 12px;"><span style="font-size:17px;color:var(--ios-text-secondary);">⌕</span><input id="settingsSearch" type="search" placeholder="Search Settings" aria-label="Search Settings" style="flex:1;background:transparent;border:0;outline:0;color:#fff;font-size:15px;min-width:0;"></div></div>' +
      // Profile card
      '<div style="margin:8px 16px 20px;background:rgba(255,255,255,0.05);border-radius:16px;padding:14px;display:flex;align-items:center;gap:14px;cursor:pointer;" data-settingaction="profile">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--ios-blue),var(--ios-purple));display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;box-shadow:0 4px 20px rgba(10,132,255,0.3);">👤</div>' +
        '<div style="flex:1;"><div style="font-size:18px;font-weight:700;color:#fff;">Kay Goold</div>' +
        '<div style="font-size:13px;color:var(--ios-blue);margin-top:2px;">Apple ID, iCloud & Media</div></div>' +
        '<span style="color:var(--ios-text-tertiary);font-size:18px;">›</span>' +
      '</div>' +

      S('Connectivity', [
        R('📶','linear-gradient(135deg,#0A84FF,#005CC5)','Wi-Fi','KayNet_5G','wifi'),
        R('🔷','linear-gradient(135deg,#0A84FF,#5E5CE6)','Bluetooth','On','bluetooth'),
        R('📡','linear-gradient(135deg,#30D158,#0A84FF)','Mobile Data','On','cellular'),
        R('🔥','linear-gradient(135deg,#FF9F0A,#FF6B00)','Personal Hotspot','Off','hotspot'),
        R('✈️','linear-gradient(135deg,#8E8E93,#636366)','Airplane Mode','','airplane', 'kayv3_airplane'),
        R('🌐','linear-gradient(135deg,#0A84FF,#30D158)','VPN','Not Connected','vpn'),
      ]) +

      S('Display & Sound', [
        R('☀️','linear-gradient(135deg,#FFD60A,#FF9F0A)','Display & Brightness','','display'),
        R('🌙','linear-gradient(135deg,#5E5CE6,#BF5AF2)','Dark Mode','Always On','darkmode'),
        R('🔔','linear-gradient(135deg,#FF453A,#FF375F)','Notifications','','notifications'),
        R('🔊','linear-gradient(135deg,#FF9F0A,#FFD60A)','Sounds & Haptics','','sounds'),
        R('📳','linear-gradient(135deg,#8E8E93,#636366)','Haptic Feedback','', 'haptics', 'kayv3_haptics'),
        R('👁️','linear-gradient(135deg,#0A84FF,#64D2FF)','Always On Display','', 'aod', 'kayv3_aod'),
      ]) +

      S('Security & Privacy', [
        R('🔒','linear-gradient(135deg,#FF9F0A,#FF6B00)','Change Passcode','','changepasscode'),
        R('👤','linear-gradient(135deg,#30D158,#0A84FF)','Face ID & Attention','Enabled','faceid'),
        R('🛡️','linear-gradient(135deg,#5E5CE6,#BF5AF2)','Privacy & Security','','privacy'),
        R('📍','linear-gradient(135deg,#FF453A,#FF375F)','Location Services','On','location'),
        R('🔑','linear-gradient(135deg,#FF9F0A,#FFD60A)','Passwords','','passwords'),
        R('🧹','linear-gradient(135deg,#30D158,#64D2FF)','App Tracking','Block All','tracking', 'kayv3_tracking'),
      ]) +

      S('Apps & Features', [
        R('📱','linear-gradient(135deg,#0A84FF,#5E5CE6)','Home Screen','','homescreen'),
        R('🚀','linear-gradient(135deg,#000,#1a1a2e)','Boot Screen','','bootscreen'),
        R('🔍','linear-gradient(135deg,#8E8E93,#636366)','Spotlight Search','','spotlight_settings'),
        R('💬','linear-gradient(135deg,#30D158,#0A84FF)','Messages','','messages_settings'),
        R('📷','linear-gradient(135deg,#636366,#3a3a3c)','Camera','','camera_settings'),
        R('🗺️','linear-gradient(135deg,#30D158,#64D2FF)','Maps','','maps_settings'),
        R('🌐','linear-gradient(135deg,#0A84FF,#5E5CE6)','Safari','','safari_settings'),
        R('🎵','linear-gradient(135deg,#FF375F,#FF9F0A)','Music','','music_settings'),
      ]) +

      S('KayPhone + Galaxy Features', [
        R('🧠','linear-gradient(135deg,#5E5CE6,#BF5AF2)','Modes & Routines','Sleep, Work','modes'),
        R('🪟','linear-gradient(135deg,#0A84FF,#64D2FF)','Link to Windows','Ready','linkwindows'),
        R('🔐','linear-gradient(135deg,#30D158,#0A84FF)','Secure Folder','Protected','securefolder'),
        R('📊','linear-gradient(135deg,#FF9F0A,#FF453A)','Digital Wellbeing','2h 14m today','wellbeing'),
        R('✨','linear-gradient(135deg,#BF5AF2,#FF375F)','Edge Panels','Enabled','edgepanels'),
        R('🏠','linear-gradient(135deg,#30D158,#64D2FF)','Smart Home','4 devices','smarthome'),
      ]) +

      S('System', [
        R('🔋','linear-gradient(135deg,#30D158,#0A84FF)','Battery', battPct,'battery'),
        R('💾','linear-gradient(135deg,#0A84FF,#5E5CE6)','Storage','','storage'),
        R('☁️','linear-gradient(135deg,#64D2FF,#0A84FF)','iCloud','3 GB Free','icloud'),
        R('♿','linear-gradient(135deg,#0A84FF,#30D158)','Accessibility','','accessibility'),
        R('🌍','linear-gradient(135deg,#FF9F0A,#FF6B00)','Language & Region','English','language'),
        R('⌨️','linear-gradient(135deg,#8E8E93,#636366)','Keyboard','','keyboard'),
        R('🔄','linear-gradient(135deg,#30D158,#0A84FF)','Software Update','Up to date','update'),
        R('📱','linear-gradient(135deg,#8E8E93,#636366)','About','KayPhone 15 Pro','about'),
      ]) +

      // Danger zone
      '<div style="margin:0 16px 8px;">' +
        '<div style="background:rgba(255,69,58,0.12);border:1px solid rgba(255,69,58,0.2);border-radius:14px;overflow:hidden;">' +
          '<div class="settings-row" data-settingaction="cleardata" style="border-bottom:1px solid rgba(255,69,58,0.15);">' +
            '<div class="settings-icon" style="background:linear-gradient(135deg,#FF453A,#FF375F);">🗑️</div>' +
            '<span class="settings-label" style="color:var(--ios-red);">Clear All App Data</span>' +
          '</div>' +
          '<div class="settings-row" data-settingaction="reset">' +
            '<div class="settings-icon" style="background:linear-gradient(135deg,#FF9F0A,#FF6B00);">🔄</div>' +
            '<span class="settings-label" style="color:var(--ios-orange);">Reset All Settings</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div style="margin:16px 16px 30px;">' +
        '<div style="background:rgba(255,59,48,0.12);border:1px solid rgba(255,59,48,0.2);border-radius:14px;padding:14px;text-align:center;cursor:pointer;color:var(--ios-red);font-size:16px;font-weight:600;" data-settingaction="lockphone">🔒  Lock Phone</div>' +
      '</div>'
    );
  },

  // ---- SUB-PAGES ----
  wifi: function() {
    const networks = [
      {name:'KayNetwork_5G', strength:4, secured:true, connected:true},
      {name:'KayNetwork_2G', strength:3, secured:true, connected:false},
      {name:'Neighbors_WiFi', strength:2, secured:true, connected:false},
      {name:'CoffeeShop_Free', strength:1, secured:false, connected:false},
    ];
    const bars = function(s) {
      return '<div style="display:flex;align-items:flex-end;gap:1px;height:14px;">' +
        [1,2,3,4].map(function(i) {
          return '<div style="width:3px;background:' + (i <= s ? 'var(--ios-blue)' : 'rgba(255,255,255,0.2)') + ';height:' + (i*3+2) + 'px;border-radius:1px;"></div>';
        }).join('') + '</div>';
    };
    return (
      '<div style="padding:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;background:rgba(255,255,255,0.05);border-radius:14px;margin-bottom:20px;">' +
        '<span style="font-size:15px;color:#fff;">Wi-Fi</span>' +
        '<div class="toggle-switch on" data-togglekey="kayv3_wifi"><div class="toggle-thumb"></div></div>' +
      '</div>' +
      '<div style="font-size:12px;font-weight:700;color:var(--ios-text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">My Networks</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        networks.filter(function(n){return n.connected;}).map(function(n) {
          return '<div style="display:flex;align-items:center;gap:12px;padding:14px;">' +
            '<span style="font-size:18px;">✓</span>' +
            '<span style="font-size:15px;color:#fff;flex:1;">' + n.name + '</span>' +
            (n.secured ? '<span style="font-size:12px;">🔒</span>' : '') +
            bars(n.strength) +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="font-size:12px;font-weight:700;color:var(--ios-text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 8px;">Other Networks</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        networks.filter(function(n){return !n.connected;}).map(function(n,i,arr) {
          return '<div style="display:flex;align-items:center;gap:12px;padding:14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';cursor:pointer;" data-netname="' + encodeURIComponent(n.name) + '">' +
            '<span style="font-size:15px;color:#fff;flex:1;">' + n.name + '</span>' +
            (n.secured ? '<span style="font-size:12px;">🔒</span>' : '<span style="font-size:11px;color:var(--ios-text-secondary);">Open</span>') +
            bars(n.strength) +
          '</div>';
        }).join('') +
      '</div></div>'
    );
  },

  bluetooth: function() {
    const devices = [
      {name:'KayBuds Pro', type:'🎧', connected:true, battery:'94%'},
      {name:'Kay Watch Ultra', type:'⌚', connected:true, battery:'82%'},
      {name:'Kay Speaker', type:'🔊', connected:false, battery:null},
      {name:'MacBook Pro', type:'💻', connected:false, battery:null},
    ];
    return '<div style="padding:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;background:rgba(255,255,255,0.05);border-radius:14px;margin-bottom:20px;">' +
        '<span style="font-size:15px;color:#fff;">Bluetooth</span>' +
        '<div class="toggle-switch on" data-togglekey="kayv3_bt"><div class="toggle-thumb"></div></div>' +
      '</div>' +
      '<div style="font-size:12px;font-weight:700;color:var(--ios-text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">My Devices</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        devices.map(function(d,i,arr) {
          return '<div style="display:flex;align-items:center;gap:12px;padding:14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';cursor:pointer;">' +
            '<span style="font-size:24px;">' + d.type + '</span>' +
            '<div style="flex:1;"><div style="font-size:15px;color:#fff;">' + d.name + '</div>' +
            (d.connected ? '<div style="font-size:12px;color:var(--ios-green);">Connected' + (d.battery ? ' · ' + d.battery : '') + '</div>' : '<div style="font-size:12px;color:var(--ios-text-secondary);">Not Connected</div>') + '</div>' +

          '</div>';
        }).join('') +
      '</div></div>';
  },

  display: function() {
    return '<div style="padding:16px;">' +
      // Brightness slider
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:16px;margin-bottom:12px;">' +
        '<div style="font-size:13px;color:var(--ios-text-secondary);margin-bottom:12px;">BRIGHTNESS</div>' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:14px;">🔅</span>' +
          '<input type="range" min="20" max="100" value="80" id="brightSlider" style="-webkit-appearance:none;flex:1;height:6px;background:rgba(255,255,255,0.2);border-radius:3px;outline:none;">' +
          '<span style="font-size:14px;">🔆</span>' +
        '</div>' +
      '</div>' +
      // Text size
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:16px;margin-bottom:12px;">' +
        '<div style="font-size:13px;color:var(--ios-text-secondary);margin-bottom:12px;">TEXT SIZE</div>' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:12px;color:#fff;">A</span>' +
          '<input type="range" min="12" max="24" value="16" id="textSizeSlider" style="-webkit-appearance:none;flex:1;height:6px;background:rgba(255,255,255,0.2);border-radius:3px;outline:none;">' +
          '<span style="font-size:20px;color:#fff;">A</span>' +
        '</div>' +
      '</div>' +
      // Toggles
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        ['True Tone','Night Shift','Auto-Lock After 30s','Raise to Wake'].map(function(item, i, arr) {
          const key = 'kayv3_disp_' + i;
          const on = i < 2;
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';">' +
            '<span style="font-size:15px;color:#fff;">' + item + '</span>' +
            '<div class="toggle-switch ' + (on?'on':'') + '" data-togglekey="' + key + '"><div class="toggle-thumb"></div></div>' +
          '</div>';
        }).join('') +
      '</div></div>';
  },

  notifications: function() {
    const apps2 = [
      {name:'Messages',icon:'💬',bg:'var(--ios-green)',badge:true,sound:true,banner:true},
      {name:'Phone',icon:'📞',bg:'var(--ios-green)',badge:true,sound:true,banner:true},
      {name:'Calendar',icon:'📅',bg:'var(--ios-red)',badge:true,sound:false,banner:true},
      {name:'Mail',icon:'✉️',bg:'var(--ios-blue)',badge:true,sound:false,banner:false},
      {name:'Kay Store',icon:'🛒',bg:'var(--ios-purple)',badge:false,sound:false,banner:false},
      {name:'Music',icon:'🎵',bg:'var(--ios-red)',badge:false,sound:false,banner:false},
    ];
    return '<div style="padding:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;background:rgba(255,255,255,0.05);border-radius:14px;margin-bottom:20px;">' +
        '<div>' +
          '<div style="font-size:15px;color:#fff;">Allow Notifications</div>' +
          '<div style="font-size:12px;color:var(--ios-text-secondary);margin-top:2px;">Manage per-app below</div>' +
        '</div>' +
        '<div class="toggle-switch on" data-togglekey="kayv3_notifs_on"><div class="toggle-thumb"></div></div>' +
      '</div>' +
      '<div style="font-size:12px;font-weight:700;color:var(--ios-text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">App Notifications</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        apps2.map(function(a,i,arr) {
          return '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';cursor:pointer;" data-notifapp="' + encodeURIComponent(a.name) + '">' +
            '<div style="width:34px;height:34px;border-radius:10px;background:' + a.bg + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">' + a.icon + '</div>' +
            '<span style="flex:1;font-size:15px;color:#fff;">' + a.name + '</span>' +
            '<span style="font-size:12px;color:' + (a.banner?'var(--ios-blue)':'var(--ios-text-secondary)') + ';">' + (a.banner?'Banners':'Off') + '</span>' +
            '<span style="font-size:13px;color:var(--ios-text-tertiary);margin-left:4px;">›</span>' +
          '</div>';
        }).join('') +
      '</div></div>';
  },

  sounds: function() {
    return '<div style="padding:16px;">' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:16px;margin-bottom:12px;">' +
        '<div style="font-size:13px;color:var(--ios-text-secondary);margin-bottom:12px;">RINGER & ALERTS</div>' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
          '<span style="font-size:16px;">🔇</span>' +
          '<input type="range" min="0" max="100" value="75" id="ringerVol" style="-webkit-appearance:none;flex:1;height:6px;background:rgba(255,255,255,0.2);border-radius:3px;outline:none;">' +
          '<span style="font-size:16px;">🔊</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;">' +
          '<span style="font-size:13px;color:var(--ios-text-secondary);">Change with buttons</span>' +
          '<div class="toggle-switch on" data-togglekey="kayv3_vol_btns"><div class="toggle-thumb"></div></div>' +
        '</div>' +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        [['Ringtone','Reflection'],['Text Tone','Note'],['New Mail','Ding'],['Keyboard Clicks','','kayv3_keys'],['Lock Sound','','kayv3_lock'],['System Haptics','','kayv3_haptics']].map(function(r,i,arr) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';cursor:pointer;">' +
            '<span style="font-size:15px;color:#fff;">' + r[0] + '</span>' +
            (r[2]
              ? '<div class="toggle-switch on" data-togglekey="' + r[2] + '"><div class="toggle-thumb"></div></div>'
              : '<div style="display:flex;align-items:center;gap:4px;"><span style="font-size:13px;color:var(--ios-text-secondary);">' + r[1] + '</span><span style="font-size:13px;color:var(--ios-text-tertiary);">›</span></div>'
            ) +
          '</div>';
        }).join('') +
      '</div></div>';
  },

  privacy: function() {
    return '<div style="padding:16px;">' +
      '<div style="background:rgba(255,69,58,0.08);border:1px solid rgba(255,69,58,0.15);border-radius:14px;padding:14px;margin-bottom:20px;display:flex;gap:12px;">' +
        '<span style="font-size:24px;">🛡️</span>' +
        '<div><div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:4px;">Privacy Report</div>' +
        '<div style="font-size:12px;color:var(--ios-text-secondary);line-height:1.4;">In the last 7 days, 0 trackers blocked. Your data stays on this device.</div></div>' +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        [['📍','Location Services','On'],['📷','Camera','2 apps'],['🎤','Microphone','1 app'],['📸','Photos','3 apps'],['📞','Contacts','1 app'],['📅','Calendar','2 apps'],['🏃','Motion & Fitness','1 app']].map(function(r,i,arr) {
          return '<div style="display:flex;align-items:center;gap:12px;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';cursor:pointer;">' +
            '<span style="font-size:20px;">' + r[0] + '</span>' +
            '<span style="flex:1;font-size:15px;color:#fff;">' + r[1] + '</span>' +
            '<span style="font-size:13px;color:var(--ios-text-secondary);">' + r[2] + '</span>' +
            '<span style="font-size:13px;color:var(--ios-text-tertiary);margin-left:4px;">›</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;margin-top:12px;">' +
        [['🍪','Tracking','Block All Requests','kayv3_tracking'],['🔍','Safari Search','Suggest Results','kayv3_search']].map(function(r,i,arr) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<span>' + r[0] + '</span>' +
              '<div><div style="font-size:15px;color:#fff;">' + r[1] + '</div>' +
              '<div style="font-size:11px;color:var(--ios-text-secondary);">' + r[2] + '</div></div>' +
            '</div>' +
            '<div class="toggle-switch on" data-togglekey="' + r[3] + '"><div class="toggle-thumb"></div></div>' +
          '</div>';
        }).join('') +
      '</div></div>';
  },

  battery: function() {
    const pct = document.getElementById('lockBatteryPct') ? parseInt(document.getElementById('lockBatteryPct').textContent) : 84;
    // Generate 24h usage data
    const hours = [];
    for (let i = 23; i >= 0; i--) hours.push(Math.max(5, pct - i * 0.8 + Math.random() * 10));
    const maxH = Math.max(...hours);
    return '<div style="padding:16px;">' +
      // Big battery display
      '<div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;margin-bottom:12px;text-align:center;">' +
        '<div style="font-size:60px;font-weight:200;color:#fff;letter-spacing:-2px;">' + pct + '%</div>' +
        '<div style="font-size:13px;color:var(--ios-text-secondary);margin-top:4px;">Not Charging</div>' +
        '<div style="width:80%;height:12px;background:rgba(255,255,255,0.1);border-radius:6px;margin:16px auto 0;overflow:hidden;">' +
          '<div style="height:100%;width:' + pct + '%;background:' + (pct > 20 ? 'var(--ios-green)' : 'var(--ios-red)') + ';border-radius:6px;transition:width 1s;"></div>' +
        '</div>' +
      '</div>' +
      // 24h chart
      '<div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:16px;margin-bottom:12px;">' +
        '<div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:12px;">Last 24 Hours</div>' +
        '<div style="display:flex;align-items:flex-end;gap:2px;height:60px;">' +
          hours.map(function(h) {
            const heightPct = (h / 100) * 60;
            return '<div style="flex:1;background:var(--ios-blue);border-radius:2px 2px 0 0;height:' + heightPct + 'px;opacity:0.7;"></div>';
          }).join('') +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:6px;"><span style="font-size:10px;color:var(--ios-text-secondary);">24h ago</span><span style="font-size:10px;color:var(--ios-text-secondary);">Now</span></div>' +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        [['Low Power Mode','Saves battery when below 20%','kayv3_lowpower'],['Optimised Charging','Learns your routine','kayv3_optcharge'],['Battery % in Status Bar','','kayv3_battshow']].map(function(r,i,arr) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';">' +
            '<div><div style="font-size:15px;color:#fff;">' + r[0] + '</div>' + (r[1]?'<div style="font-size:12px;color:var(--ios-text-secondary);">' + r[1] + '</div>':'') + '</div>' +
            '<div class="toggle-switch ' + (i===2?'on':'') + '" data-togglekey="' + r[2] + '"><div class="toggle-thumb"></div></div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;margin-top:12px;">' +
        '<div style="padding:14px;"><div style="font-size:13px;color:var(--ios-text-secondary);margin-bottom:8px;">BATTERY HEALTH</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:15px;color:#fff;">Maximum Capacity</span><span style="font-size:15px;font-weight:600;color:var(--ios-green);">100%</span></div>' +
        '<div style="margin-top:8px;font-size:12px;color:var(--ios-text-secondary);">Your battery is currently supporting normal peak performance.</div></div>' +
      '</div></div>';
  },

  storage: function() {
    const photoCount = (typeof galleryItems !== 'undefined') ? galleryItems.length : 0;
    const noteCount = (typeof notesCache !== 'undefined') ? notesCache.length : 0;
    const fileBytes = (typeof filesCache !== 'undefined')
      ? filesCache.reduce(function(sum, f) { return sum + (f.metadata && f.metadata.size ? f.metadata.size : 0); }, 0)
      : 0;
    const vmCount = (typeof vmCache !== 'undefined') ? vmCache.length : 0;
    const usedMB = Math.max(1, Math.round(fileBytes / 1024 / 1024));
    const cats = [
      {label:'Photos', icon:'🖼️', color:'#0A84FF', count: photoCount, unit:'photos'},
      {label:'Files', icon:'📁', color:'#5E5CE6', count: usedMB, unit:'MB'},
      {label:'Notes', icon:'📝', color:'#FFD60A', count: noteCount, unit:'notes'},
      {label:'Voice Memos', icon:'🎙️', color:'#BF5AF2', count: vmCount, unit:'memos'},
      {label:'Custom Apps', icon:'📱', color:'#30D158', count: storeApps.length, unit:'apps'},
    ];
    return '<div style="padding:16px;">' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;margin-bottom:12px;">' +
        '<div style="font-size:13px;color:var(--ios-text-secondary);margin-bottom:8px;">CLOUD STORAGE (SUPABASE)</div>' +
        '<div style="font-size:13px;color:var(--ios-text-tertiary);margin-bottom:12px;">Counts reflect apps opened this session. Open Photos, Notes, Files, or Voice Memos to refresh.</div>' +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
      cats.map(function(c) {
        return '<div style="display:flex;align-items:center;gap:12px;padding:14px;border-bottom:1px solid rgba(255,255,255,0.05);">' +
          '<div style="width:32px;height:32px;border-radius:8px;background:' + c.color + ';display:flex;align-items:center;justify-content:center;font-size:16px;">' + c.icon + '</div>' +
          '<div style="flex:1;color:#fff;font-size:15px;">' + c.label + '</div>' +
          '<div style="color:var(--ios-text-secondary);font-size:14px;">' + c.count + ' ' + c.unit + '</div>' +
        '</div>';
      }).join('') +
      '</div></div>';
  },

  about: function() {
    return '<div style="padding:16px;">' +
      '<div style="text-align:center;padding:30px 0;border-bottom:1px solid rgba(255,255,255,0.05);margin-bottom:20px;">' +
        '<div style="font-size:72px;margin-bottom:12px;">📱</div>' +
        '<div style="font-size:20px;font-weight:700;color:#fff;">KayPhone 15 Pro</div>' +
        '<div style="font-size:13px;color:var(--ios-text-secondary);margin-top:4px;">KayPhone OS 3.0</div>' +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        [
          ['Software Version','KayPhone OS 3.0.1'],
          ['Model Number','MPRQ3LL/A'],
          ['Model Name','KayPhone 15 Pro'],
          ['Chip','KayChip A17 Pro'],
          ['RAM','8 GB'],
          ['Storage','128 GB'],
          ['Screen','6.1" Super OLED ProMotion'],
          ['Resolution','2556 × 1179 @ 460 ppi'],
          ['Camera','48MP Fusion · 12MP Ultra Wide · 12MP Tele'],
          ['Battery','3274 mAh · 100% Health'],
          ['Serial Number','KAY' + Math.random().toString(36).substring(2,10).toUpperCase()],
          ['Wi-Fi','Wi-Fi 6E (802.11ax)'],
          ['Bluetooth','5.3'],
          ['Legal','KayPhone Terms of Service'],
        ].map(function(r,i,arr) {
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';">' +
            '<span style="font-size:14px;color:#fff;">' + r[0] + '</span>' +
            '<span style="font-size:13px;color:var(--ios-text-secondary);max-width:55%;text-align:right;">' + r[1] + '</span>' +
          '</div>';
        }).join('') +
      '</div></div>';
  },

  faceid: function() {
    return '<div style="padding:16px;">' +
      '<div style="text-align:center;padding:30px 20px;">' +
        '<div style="width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,var(--ios-blue),var(--ios-purple));display:flex;align-items:center;justify-content:center;font-size:40px;margin:0 auto 16px;">👤</div>' +
        '<div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:8px;">Face ID</div>' +
        '<div style="font-size:13px;color:var(--ios-text-secondary);line-height:1.5;">Face ID is set up and working.<br>Your face data is stored on this device only.</div>' +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;margin-bottom:12px;">' +
        '<div style="padding:8px 0;">' +
          ['Unlock KayPhone','iTunes & App Store','Apple Pay','Password AutoFill'].map(function(item,i,arr) {
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';">' +
              '<span style="font-size:15px;color:#fff;">' + item + '</span>' +
              '<div class="toggle-switch on" data-togglekey="kayv3_fid_' + i + '"><div class="toggle-thumb"></div></div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;">' +
          '<span style="font-size:15px;color:#fff;">Require Attention</span>' +
          '<div class="toggle-switch on" data-togglekey="kayv3_fid_attn"><div class="toggle-thumb"></div></div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:20px;padding:14px;background:rgba(255,69,58,0.1);border:1px solid rgba(255,69,58,0.2);border-radius:14px;text-align:center;cursor:pointer;color:var(--ios-red);font-weight:600;" data-toast="👤|Face ID reset — please re-enroll">Reset Face ID</div>' +
    '</div>';
  },

  passwords: function() {
    const creds = [
      {site:'google.com', user:'kaygood@gmail.com', icon:'🔍'},
      {site:'github.com', user:'rpdevmaster_kaygoold', icon:'🐙'},
      {site:'tebex.io', user:'kaygoold_dev', icon:'🛒'},
      {site:'netflix.com', user:'kay@example.com', icon:'🎬'},
    ];
    return '<div style="padding:16px;">' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">' +
        '<span style="font-size:24px;">🔑</span>' +
        '<div><div style="font-size:14px;font-weight:600;color:#fff;">Saved Passwords</div><div style="font-size:12px;color:var(--ios-text-secondary);">Secured with Face ID</div></div>' +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        creds.map(function(c,i,arr) {
          return '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';cursor:pointer;" data-toast="🔑|Authenticate to view">' +
            '<div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:18px;">' + c.icon + '</div>' +
            '<div style="flex:1;"><div style="font-size:15px;color:#fff;">' + c.site + '</div><div style="font-size:12px;color:var(--ios-text-secondary);">' + c.user + '</div></div>' +
            '<span style="font-size:13px;color:var(--ios-text-tertiary);">›</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="margin-top:16px;padding:14px;background:rgba(10,132,255,0.1);border:1px solid rgba(10,132,255,0.2);border-radius:14px;text-align:center;cursor:pointer;color:var(--ios-blue);font-weight:600;" data-toast="🔑|Password saved!">+ Add New Password</div>' +
    '</div>';
  },

  homescreen: function() {
    return '<div style="padding:16px;">' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
        [
          ['Show App Library','Add removed apps to library','kayv3_applibrary', true],
          ['Notification Badges','Red dots on app icons','kayv3_badges', true],
          ['Larger App Icons','Slightly bigger app icons','kayv3_bigicons', false],
          ['Haptic Touch','Press and hold apps to jiggle','kayv3_haptictouch', true],
        ].map(function(r,i,arr) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';">' +
            '<div><div style="font-size:15px;color:#fff;">' + r[0] + '</div><div style="font-size:12px;color:var(--ios-text-secondary);">' + r[1] + '</div></div>' +
            '<div class="toggle-switch ' + (r[3]?'on':'') + '" data-togglekey="' + r[2] + '"><div class="toggle-thumb"></div></div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;margin-top:12px;">' +
        '<div style="padding:13px 14px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;" onclick="openWallpapers()">' +
          '<div style="font-size:15px;color:#fff;">Change Wallpaper</div>' +
        '</div>' +
        '<div style="padding:13px 14px;cursor:pointer;" data-toast="📐|Reset layout — hold app icons to rearrange">' +
          '<div style="font-size:15px;color:var(--ios-red);">Reset Home Screen Layout</div>' +
        '</div>' +
      '</div></div>';
  },

  bootscreen: function() {
    const emojis = ['📱','🚀','⚡','🔥','💎','🌟','👑','🎯','🦋','🌊','🎮','💻','🤖','🛸','🎵'];
    const colors = [
      {name:'Default',grad:'linear-gradient(135deg,#0A84FF,#BF5AF2)'},
      {name:'Fire',grad:'linear-gradient(135deg,#FF453A,#FF9F0A)'},
      {name:'Night',grad:'linear-gradient(135deg,#000,#1a1a2e)'},
      {name:'Forest',grad:'linear-gradient(135deg,#30D158,#64D2FF)'},
      {name:'Rose',grad:'linear-gradient(135deg,#FF375F,#BF5AF2)'},
      {name:'Gold',grad:'linear-gradient(135deg,#FFD60A,#FF9F0A)'},
    ];
    return '<div style="padding:16px;">' +
      // Preview
      '<div style="height:180px;background:#000;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:20px;border:1px solid rgba(255,255,255,0.1);" id="bootPreview">' +
        '<div style="font-size:52px;margin-bottom:8px;" id="bootPreviewEmoji">📱</div>' +
        '<div style="font-size:22px;font-weight:800;color:#fff;" id="bootPreviewName">KayPhone</div>' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:2px;margin-top:2px;">PRO MAX</div>' +
      '</div>' +
      // Name input
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px;margin-bottom:12px;">' +
        '<div style="font-size:12px;color:var(--ios-text-secondary);margin-bottom:8px;">DEVICE NAME</div>' +
        '<input id="bootNameInput" type="text" value="KayPhone" placeholder="Your phone name" style="width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 14px;color:#fff;font-size:16px;font-weight:600;outline:none;caret-color:var(--ios-blue);">' +
      '</div>' +
      // Emoji picker
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px;margin-bottom:12px;">' +
        '<div style="font-size:12px;color:var(--ios-text-secondary);margin-bottom:10px;">BOOT ICON</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
          emojis.map(function(em) {
            return '<div data-bootemoji="' + em + '" style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;transition:all 0.15s;border:2px solid transparent;">' + em + '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
      // Subtitle
      '<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px;margin-bottom:12px;">' +
        '<div style="font-size:12px;color:var(--ios-text-secondary);margin-bottom:8px;">TAGLINE</div>' +
        '<input id="bootTagInput" type="text" value="Pro Max" placeholder="Tagline" style="width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 14px;color:#fff;font-size:15px;outline:none;caret-color:var(--ios-blue);">' +
      '</div>' +
      // Apply button
      '<div onclick="applyBootCustomization()" style="padding:14px;background:var(--ios-blue);border-radius:14px;text-align:center;color:#fff;font-size:16px;font-weight:700;cursor:pointer;margin-top:8px;">Apply Boot Screen</div>' +
    '</div>';
  },

  openNotifApp: function(appName) {
    openSubPage(appName + ' Notifications', 
      '<div style="padding:16px;">' +
        '<div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' +
          [['Allow Notifications','','kayv3_notif_'+appName.toLowerCase(),true],
           ['Sound','','kayv3_sound_'+appName.toLowerCase(),true],
           ['Badge App Icon','','kayv3_badge_'+appName.toLowerCase(),true],
          ].map(function(r,i,arr) {
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + ';">' +
              '<span style="font-size:15px;color:#fff;">' + r[0] + '</span>' +
              '<div class="toggle-switch ' + (r[3]?'on':'') + '" data-togglekey="' + r[2] + '"><div class="toggle-thumb"></div></div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px;margin-top:12px;">' +
          '<div style="font-size:13px;color:var(--ios-text-secondary);margin-bottom:10px;">ALERT STYLE</div>' +
          '<div style="display:flex;gap:12px;">' +
            ['None','Banners','Alerts'].map(function(s,i) {
              return '<div style="flex:1;padding:10px;background:' + (i===1?'var(--ios-blue)':'rgba(255,255,255,0.08)') + ';border-radius:12px;text-align:center;color:#fff;font-size:13px;cursor:pointer;" data-alertstyle="' + s + '">' + s + '</div>';
            }).join('') +
          '</div>' +
        '</div></div>',
      'notifications');
  },
};

// ===== SETTINGS ACTION HANDLER (replaces old switch) =====
document.addEventListener('click', function(e) {
  const row = e.target.closest('[data-settingaction]');
  if (!row) return;
  // Don't intercept toggle clicks
  if (e.target.closest('.toggle-switch')) return;
  const action = row.dataset.settingaction;
  if (!action) return;
  e.stopPropagation();

  const subPages = {
    wifi: 'Wi-Fi', bluetooth: 'Bluetooth', display: 'Display & Brightness',
    notifications: 'Notifications', sounds: 'Sounds & Haptics', privacy: 'Privacy & Security',
    battery: 'Battery', storage: 'Storage', about: 'About', faceid: 'Face ID',
    passwords: 'Passwords', homescreen: 'Home Screen',
  };

  if (subPages[action] && Settings[action]) {
    openSubPage(subPages[action], Settings[action](), 'Settings');
    return;
  }

  switch(action) {
    case 'profile':    openSubPage('Apple ID', '<div style="padding:40px;text-align:center;color:var(--ios-text-secondary);">Apple ID settings</div>', 'Settings'); break;
    case 'cellular':   openSubPage('Mobile Data', '<div style="padding:16px;"><div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px;"><div style="font-size:15px;color:#fff;">Mobile Data</div><div style="font-size:12px;color:var(--ios-green);margin-top:4px;">KayTel 5G · Strong Signal</div></div></div>', 'Settings'); break;
    case 'hotspot':    showToast('🔥', 'Personal Hotspot: Off'); break;
    case 'airplane':   showToast('✈️', 'Airplane Mode toggled'); break;
    case 'vpn':        showToast('🌐', 'VPN: No active connection'); break;
    case 'darkmode':   showToast('🌙', 'Always in Dark Mode — this is KayPhone'); break;
    case 'accessibility': openSubPage('Accessibility', '<div style="padding:16px;"><div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' + ['Vision','Hearing','Motor','General'].map(function(s){return '<div style="padding:13px 14px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;color:#fff;">' + s + '</div>';}).join('') + '</div></div>', 'Settings'); break;
    case 'location':   openSubPage('Location Services', Settings.privacy(), 'Settings'); break;
    case 'haptics':    toggleHaptics(); break;
    case 'aod':        showToast('👁️', 'Always On Display: needs real hardware'); break;
    case 'tracking':   showToast('🍪', 'App Tracking: Block All Requests'); break;
    case 'changepasscode': openPasscodeChange(); break;
    case 'icloud':     openSubPage('iCloud', '<div style="padding:16px;"><div style="text-align:center;padding:20px;"><div style="font-size:48px;margin-bottom:12px;">☁️</div><div style="font-size:16px;font-weight:600;color:#fff;">iCloud Storage</div><div style="font-size:14px;color:var(--ios-text-secondary);margin-top:8px;">47 GB used of 50 GB</div><div style="height:8px;background:rgba(255,255,255,0.1);border-radius:4px;margin:12px 0;overflow:hidden;"><div style="height:100%;width:94%;background:var(--ios-blue);border-radius:4px;"></div></div></div></div>', 'Settings'); break;
    case 'language':   showToast('🌍', 'Language: English (UK)'); break;
    case 'keyboard':   openSubPage('Keyboard', '<div style="padding:16px;"><div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' + ['Auto-Correction','Auto-Capitalisation','Smart Punctuation','"." Shortcut','Predictive Text','Emoji Suggestions'].map(function(s,i,arr){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + '"><span style="font-size:15px;color:#fff;">' + s + '</span><div class="toggle-switch on" data-togglekey="kayv3_kb_' + i + '"><div class="toggle-thumb"></div></div></div>';}).join('') + '</div></div>', 'Settings'); break;
    case 'update':     showToast('🔄', 'KayPhone OS 3.0.1 — You are up to date'); break;
    case 'messages_settings': openSubPage('Messages', '<div style="padding:16px;"><div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' + ['iMessage','Read Receipts','Send as SMS','Share Name & Photo','Filter Unknown Senders'].map(function(s,i,arr){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + '"><span style="font-size:15px;color:#fff;">' + s + '</span><div class="toggle-switch ' + (i<3?'on':'') + '" data-togglekey="kayv3_msg_'+i+'"><div class="toggle-thumb"></div></div></div>';}).join('') + '</div></div>', 'Settings'); break;
    case 'camera_settings': openSubPage('Camera', '<div style="padding:16px;"><div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' + [['Grid','kayv3_cam_grid',true],['Mirror Front Camera','kayv3_cam_mirror',false],['Smart HDR','kayv3_cam_hdr',true],['Live Photo','kayv3_cam_live',true],['Scan QR Codes','kayv3_cam_qr',true]].map(function(r,i,arr){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + '"><span style="font-size:15px;color:#fff;">' + r[0] + '</span><div class="toggle-switch ' + (r[2]?'on':'') + '" data-togglekey="' + r[1] + '"><div class="toggle-thumb"></div></div></div>';}).join('') + '</div></div>', 'Settings'); break;
    case 'safari_settings': openSubPage('Safari', '<div style="padding:16px;"><div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' + [['Block Pop-ups','kayv3_sf_popup',true],['Prevent Cross-Site Tracking','kayv3_sf_track',true],['Fraudulent Website Warning','kayv3_sf_fraud',true],['Private Browsing Lock','kayv3_sf_priv',false]].map(function(r,i,arr){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + '"><span style="font-size:15px;color:#fff;">' + r[0] + '</span><div class="toggle-switch ' + (r[2]?'on':'') + '" data-togglekey="' + r[1] + '"><div class="toggle-thumb"></div></div></div>';}).join('') + '</div></div>', 'Settings'); break;
    case 'music_settings': openSubPage('Music', '<div style="padding:16px;"><div style="background:rgba(255,255,255,0.05);border-radius:14px;overflow:hidden;">' + [['Lossless Audio','kayv3_mu_lossless',false],['Dolby Atmos','kayv3_mu_atmos',true],['Crossfade Songs','kayv3_mu_cross',false],['Show Star Ratings','kayv3_mu_stars',false]].map(function(r,i,arr){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,0.05)':'') + '"><span style="font-size:15px;color:#fff;">' + r[0] + '</span><div class="toggle-switch ' + (r[2]?'on':'') + '" data-togglekey="' + r[1] + '"><div class="toggle-thumb"></div></div></div>';}).join('') + '</div></div>', 'Settings'); break;
    case 'modes': openSubPage('Modes & Routines', '<div style="padding:16px;"><div style="background:linear-gradient(135deg,rgba(94,92,230,.25),rgba(191,90,242,.16));border-radius:18px;padding:18px;margin-bottom:14px;"><div style="font-size:24px;margin-bottom:8px;">🧠</div><div style="font-size:18px;font-weight:700;color:#fff;">Make your phone fit the moment</div><div style="font-size:13px;color:var(--ios-text-secondary);line-height:1.45;margin-top:6px;">Create automatic profiles for focus, sleep, work, and travel.</div></div><div style="background:rgba(255,255,255,.05);border-radius:14px;overflow:hidden;">' + [['Sleep','Dim wallpaper · Do Not Disturb','kayv3_mode_sleep',true],['Work','Focus apps · Vibrate','kayv3_mode_work',false],['Driving','Hands-free assistant','kayv3_mode_drive',false]].map(function(r,i,arr){return '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,.05)':'') + '"><div><div style="font-size:15px;color:#fff;">' + r[0] + '</div><div style="font-size:12px;color:var(--ios-text-secondary);margin-top:3px;">' + r[1] + '</div></div><div class="toggle-switch ' + (localStorage.getItem(r[2])==='true'||r[3]?'on':'') + '" data-togglekey="' + r[2] + '"><div class="toggle-thumb"></div></div></div>';}).join('') + '</div><div style="margin-top:14px;padding:14px;border-radius:14px;background:rgba(255,255,255,.05);text-align:center;color:var(--ios-blue);font-weight:600;cursor:pointer;" data-toast="➕|Routine builder coming next">+ Create a Routine</div></div>', 'Settings'); break;
    case 'linkwindows': showToast('🪟', 'Link to Windows is ready to pair'); break;
    case 'securefolder': openSubPage('Secure Folder', '<div style="padding:16px;text-align:center;"><div style="font-size:64px;margin:30px 0 16px;">🔐</div><div style="font-size:19px;font-weight:700;color:#fff;">Your private space</div><div style="font-size:13px;color:var(--ios-text-secondary);line-height:1.5;margin:8px 20px 24px;">Apps and files inside Secure Folder are separated from the rest of KayPhone.</div><div style="padding:14px;border-radius:14px;background:rgba(255,255,255,.06);color:var(--ios-blue);font-weight:600;cursor:pointer;" data-toast="🔐|Secure Folder unlocked for this session">Unlock with Face ID</div></div>', 'Settings'); break;
    case 'wellbeing': openSubPage('Digital Wellbeing', '<div style="padding:16px;"><div style="background:rgba(255,255,255,.05);border-radius:18px;padding:20px;text-align:center;margin-bottom:14px;"><div style="font-size:46px;font-weight:200;color:#fff;">2h 14m</div><div style="font-size:13px;color:var(--ios-text-secondary);">Screen time today</div><div style="height:8px;border-radius:4px;background:rgba(255,255,255,.1);margin-top:18px;overflow:hidden;"><div style="height:100%;width:42%;background:linear-gradient(90deg,var(--ios-green),var(--ios-blue));border-radius:4px;"></div></div></div><div style="background:rgba(255,255,255,.05);border-radius:14px;overflow:hidden;">' + [['KayTok','48 min','var(--ios-pink)'],['Messages','32 min','var(--ios-green)'],['Safari','27 min','var(--ios-blue)'],['Music','18 min','var(--ios-purple)']].map(function(r,i,arr){return '<div style="display:flex;align-items:center;gap:12px;padding:13px 14px;' + (i<arr.length-1?'border-bottom:1px solid rgba(255,255,255,.05)':'') + '"><div style="width:10px;height:10px;border-radius:50%;background:' + r[2] + ';box-shadow:0 0 10px ' + r[2] + ';"></div><span style="flex:1;color:#fff;font-size:15px;">' + r[0] + '</span><span style="color:var(--ios-text-secondary);font-size:13px;">' + r[1] + '</span></div>';}).join('') + '</div></div>', 'Settings'); break;
    case 'edgepanels': showToast('✨', 'Edge Panels enabled — swipe from the right edge'); break;
    case 'smarthome': openSubPage('Smart Home', '<div style="padding:16px;"><div style="font-size:13px;color:var(--ios-text-secondary);margin:4px 0 10px;">YOUR HOME</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">' + [['Living Room','💡','On'],['Bedroom','🌡️','72°'],['Front Door','🔒','Locked'],['Speaker','🔊','Playing']].map(function(r){return '<div style="background:rgba(255,255,255,.06);border-radius:16px;padding:16px;cursor:pointer;" data-toast="🏠|' + r[0] + ': ' + r[2] + '"><div style="font-size:26px;">' + r[1] + '</div><div style="font-size:14px;color:#fff;font-weight:600;margin-top:10px;">' + r[0] + '</div><div style="font-size:12px;color:var(--ios-green);margin-top:3px;">' + r[2] + '</div></div>';}).join('') + '</div><div style="margin-top:14px;padding:14px;border-radius:14px;background:rgba(10,132,255,.12);color:var(--ios-blue);font-weight:600;text-align:center;cursor:pointer;" data-toast="➕|Add a smart home device">+ Add Device</div></div>', 'Settings'); break;
    case 'maps_settings': showToast('🗺️', 'Maps: Using OpenStreetMap tiles'); break;
    case 'spotlight_settings': showToast('🔍', 'Spotlight: Searches apps, notes, messages'); break;
    case 'wallpaper': safeCloseView('settings'); setTimeout(function(){ openWallpapers(); }, 200); break;
    case 'cleardata': if(confirm('Clear ALL app data? Cannot be undone.')) { localStorage.clear(); location.reload(); } break;
    case 'reset': if(confirm('Reset all settings to defaults?')) { PASSCODE='123456'; localStorage.removeItem('kayv3_passcode'); showToast('🔄','Settings reset to defaults'); } break;
    case 'lockphone': lockPhone(); safeCloseView('settings'); break;
  }
});

document.addEventListener('input', function(e) {
  if (e.target.id !== 'settingsSearch') return;
  const query = e.target.value.trim().toLowerCase();
  document.querySelectorAll('#view-settings .settings-section').forEach(function(section) {
    const haystack = section.textContent.toLowerCase();
    section.classList.toggle('is-filtered-out', !!query && !haystack.includes(query));
  });
});
