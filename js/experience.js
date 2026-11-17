/* Kay OS experience layer. No network access, credentials, or mock cloud data. */
(function () {
  'use strict';

  var glyphs = {
    space:'✳',phone:'↗',messages:'••',safari:'◈',music:'♫',kaybook:'K',kaychat:'↔',
    kaytok:'◁',kaytube:'▶',kaygram:'◎',kaypay:'₭',photos:'▦',camera:'◉',
    maps:'⌁',weather:'☼',calendar:'31',clock:'◷',notes:'≡',reminders:'✓',
    calculator:'+',voicememos:'〰',files:'▤',settings:'⚙',store:'⊞',
    health:'♥',stocks:'↗',games:'◇',assistant:'✳',widgetflow:'✦'
  };
  var recentKey = 'kayv3_recent_apps';
  var recent = [];
  var activeResult = 0;
  var initialized = false;
  try { recent = JSON.parse(localStorage.getItem(recentKey) || '[]'); if (!Array.isArray(recent)) recent=[]; } catch (_) { recent=[]; }

  function glyph(app) {
    var label = glyphs[app.id] || String(app.name || '?').trim().charAt(0).toUpperCase() || '?';
    return '<span class="kay-app-glyph" aria-hidden="true">' + escapeHtml(label) + '</span>';
  }
  function rememberApp(id) {
    if (!id) return;
    recent = [id].concat(recent.filter(function (item) { return item !== id; })).slice(0,5);
    try { localStorage.setItem(recentKey, JSON.stringify(recent)); } catch (_) {}
  }
  function formattedDate() {
    return new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date());
  }
  function clockTick() {
    var now = new Date();
    var hours = new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',hour12:false}).format(now);
    var greeting = now.getHours() < 12 ? 'Good morning.' : now.getHours() < 17 ? 'Good afternoon.' : 'Good evening.';
    var time = document.getElementById('kayHomeTime');
    var date = document.getElementById('kayHomeDate');
    var greet = document.getElementById('kayHomeGreeting');
    var stage = document.getElementById('kayStageDate');
    if (time) time.textContent = hours;
    if (date) date.textContent = formattedDate();
    if (greet) greet.textContent = greeting;
    if (stage) stage.textContent = formattedDate();
    refreshStatus();
  }
  function refreshStatus() {
    var status = document.getElementById('kayCloudStatus');
    var focus = document.getElementById('kayFocusButton');
    var cloud = typeof Supa !== 'undefined' && Supa.isConfigured;
    var account = cloud && !!Supa.getUser();
    if (status) status.textContent = account ? 'Cloud connected' : cloud ? 'Sign in to sync' : 'Local mode';
    if (focus) {
      var enabled = document.body.dataset.focus === 'work';
      focus.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      var caption = focus.querySelector('.kay-quick-caption');
      if (caption) caption.textContent = enabled ? 'Focus on' : 'Focus';
    }
  }
  function mountHome() {
    var firstPage = document.getElementById('homePage1');
    if (!firstPage || document.getElementById('kayHomeIntro')) return;
    var header = document.createElement('div');
    header.id = 'kayHomeIntro';
    header.className = 'kay-home-intro';
    header.innerHTML =
      '<div class="kay-home-top"><div class="kay-home-brand">KAY<em>/</em>OS</div>' +
      '<button type="button" class="kay-search-button" data-kay-action="search" aria-label="Search apps and notes">⌕ Search <kbd>⌘K</kbd></button></div>' +
      '<div class="kay-home-hero"><div class="kay-home-eyebrow" id="kayHomeDate"></div>' +
      '<time class="kay-home-time" id="kayHomeTime"></time>' +
      '<div class="kay-home-greeting" id="kayHomeGreeting"></div>' +
      '<div class="kay-home-description">Everything you need, without the noise.</div></div>' +
      '<div class="kay-home-rule"></div><div class="kay-home-status"><span>01 / Your space</span>' +
      '<strong id="kayCloudStatus">Local mode</strong></div>';
    firstPage.insertBefore(header, firstPage.firstChild);
    var widgets = firstPage.querySelector('.home-widgets');
    if (!widgets) return;
    var label = document.createElement('div');
    label.className = 'kay-quick-label';
    label.innerHTML = '<span>Made for today</span><span>↘</span>';
    var row = document.createElement('div');
    row.className = 'kay-quick-row';
    row.innerHTML =
      '<button class="kay-quick-action" data-kay-action="notes" type="button"><span class="kay-quick-symbol">≡</span><span>Notes</span></button>' +
      '<button class="kay-quick-action" data-kay-action="music" type="button"><span class="kay-quick-symbol">♫</span><span>Music</span></button>' +
      '<button class="kay-quick-action" id="kayFocusButton" data-kay-action="focus" type="button" aria-pressed="false"><span class="kay-quick-symbol">◐</span><span class="kay-quick-caption">Focus</span></button>';
    widgets.parentElement.insertBefore(label, widgets);
    widgets.parentElement.insertBefore(row, widgets);
    const card=document.createElement('button');
    card.type='button';card.className='kay-space-home';card.dataset.kayAction='space';
    card.innerHTML='<span class="kay-space-home-icon">✳</span><span class="kay-space-home-copy"><strong>Kay Space / Your ideas</strong><small id="kaySpaceNext">Capture something worth keeping</small></span><span class="kay-space-home-count"><span id="kaySpaceCount">0</span> TO DO ↗</span>';
    widgets.parentElement.insertBefore(card,widgets);
    if(window.KaySpace)KaySpace.refresh();
  }
  function mountStage() {
    var container = document.querySelector('.device-container');
    if (!container || document.getElementById('kayDesktopStage')) return;
    var stage = document.createElement('aside');
    stage.id = 'kayDesktopStage';
    stage.className = 'kay-desktop-stage';
    stage.innerHTML =
      '<div class="kay-stage-mark">KAY / OS</div><div class="kay-stage-overline">A BETTER KIND OF DIGITAL SPACE</div>' +
      '<h1 class="kay-stage-title">A phone,<br><em>reimagined.</em></h1>' +
      '<p class="kay-stage-body">Your everyday tools, social spaces and creative playground in one browser. ' +
      'An interface built around what you can actually do.</p>' +
      '<div class="kay-stage-rule"></div>' +
      '<div class="kay-stage-row"><span>Find an app or a note</span><button data-kay-action="search" type="button">Search ↗</button></div>' +
      '<div class="kay-stage-row"><span>Pick up an idea</span><button data-kay-action="space" type="button">Open Kay Space ↗</button></div>' +
      '<div class="kay-stage-row"><span>Set the tone</span><button data-kay-action="music" type="button">Music ↗</button></div>' +
      '<div class="kay-stage-foot" id="kayStageDate"></div>';
    container.appendChild(stage);
  }
  function mountSearchHelp() {
    var panel = document.getElementById('spotlight');
    if (!panel || document.getElementById('kaySearchHelp')) return;
    var tip = document.createElement('p');
    tip.id = 'kaySearchHelp';
    tip.className = 'kay-search-help';
    tip.textContent = 'Find an app, search your notes, or run a quick action.';
    panel.querySelector('.spotlight-search').after(tip);
    var foot = document.createElement('div');
    foot.className = 'kay-search-footer';
    foot.innerHTML = '<span>↑ ↓ Navigate · ↵ Open</span><button type="button" data-kay-action="close-search">Esc Close</button>';
    panel.appendChild(foot);
  }
  var actions = [
    {label:'Open Kay Space', desc:'Your creative board, tasks and links', keywords:'space board creative tasks', icon:'✳', action:'space'},
    {label:'New idea', desc:'Capture a thought in Kay Space', keywords:'quick capture write', icon:'+', action:'capture'},
    {label:'Open Notes', desc:'Capture and organize ideas', keywords:'note write', icon:'≡', action:'notes'},
    {label:'Open Photos', desc:'Your actual photo library', keywords:'photo gallery image', icon:'▦', action:'photos'},
    {label:'Play music', desc:'Jump into Music', keywords:'song audio', icon:'♫', action:'music'},
    {label:'Toggle Focus', desc:'Quiet in-app notifications', keywords:'focus mute notifications', icon:'◐', action:'focus'},
    {label:'Settings', desc:'Make this space yours', keywords:'display wallpaper account', icon:'⚙', action:'settings'},
    {label:'Lock KayPhone', desc:'Return to your lock screen', keywords:'lock device', icon:'◇', action:'lock'}
  ];
  function addSection(results, title, items) {
    if (!items.length) return;
    var section = document.createElement('section');
    section.className = 'spotlight-section';
    var heading = document.createElement('div');
    heading.className = 'spotlight-section-title';
    heading.textContent = title;
    section.appendChild(heading);
    items.forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'spotlight-result';
      button.style.width = '100%';
      button.style.textAlign = 'left';
      button.dataset.kayResult = '1';
      button.dataset.kayAction = item.action || '';
      if (item.appid) button.dataset.kayAppid = item.appid;
      var square = document.createElement('span');
      square.className = 'spotlight-result-icon';
      square.textContent = item.icon || '↗';
      var content = document.createElement('span');
      content.className = 'spotlight-result-info';
      var name = document.createElement('span');
      name.className = 'spotlight-result-name';
      name.style.display = 'block';
      name.textContent = item.label;
      content.appendChild(name);
      if (item.desc) {
        var desc = document.createElement('span');
        desc.className = 'spotlight-result-desc';
        desc.style.display = 'block';
        desc.textContent = item.desc;
        content.appendChild(desc);
      }
      button.appendChild(square);
      button.appendChild(content);
      section.appendChild(button);
    });
    results.appendChild(section);
  }
  function drawSearch() {
    var field = document.getElementById('spotlightInput');
    var results = document.getElementById('spotlightResults');
    if (!field || !results) return;
    var q = field.value.trim().toLowerCase();
    results.replaceChildren();
    var catalog = (Array.isArray(installedApps) ? installedApps : []).concat(Array.isArray(storeApps) ? storeApps : []);
    var apps = catalog.filter(function (app) { return !q || (app.name || '').toLowerCase().includes(q) || (app.id || '').toLowerCase().includes(q); });
    var seen = new Set();
    apps = apps.filter(function (app) { if(seen.has(app.id))return false; seen.add(app.id); return true; });
    if (!q) {
      var preferred = recent.map(function (id) { return apps.find(function (app) { return app.id === id; }); }).filter(Boolean);
      if (!preferred.length) preferred = apps.slice(0,5);
      apps = preferred;
    }
    var act = actions.filter(function (a) { return !q || (a.label + ' ' + a.desc + ' ' + a.keywords).toLowerCase().includes(q); });
    var matches = typeof notesCache !== 'undefined' && Array.isArray(notesCache) ?
      notesCache.filter(function (n) { return q && ((n.title || '') + ' ' + (n.body || '')).toLowerCase().includes(q); }).slice(0,6) : [];
    addSection(results, q ? 'Quick actions' : 'Start here', act.slice(0,5));
    addSection(results, q ? 'Apps' : 'Recent & recommended', apps.slice(0,10).map(function (app) {
      return { label:app.name, desc:'Open app', icon:glyphs[app.id] || '↗', appid:app.id };
    }));
    addSection(results,'Notes',matches.map(function (note) {
      return {label:note.title || 'Untitled note', desc:(note.body || '').slice(0,65), icon:'≡', appid:'notes'};
    }));
    if (!results.children.length) {
      var empty = document.createElement('p');
      empty.className = 'kay-search-help';
      empty.textContent = 'No matches. Try an app name, Focus, or Settings.';
      results.appendChild(empty);
    }
    activeResult = 0;
    highlightResult();
  }
  function highlightResult() {
    var rows = Array.from(document.querySelectorAll('#spotlightResults [data-kay-result]'));
    if (!rows.length) return;
    activeResult = Math.max(0,Math.min(rows.length-1,activeResult));
    rows.forEach(function (row,index) { row.classList.toggle('kay-selected',index === activeResult); });
    rows[activeResult].scrollIntoView({block:'nearest'});
  }
  function openSearch() {
    if (typeof State !== 'undefined' && State.locked) return;
    var panel = document.getElementById('spotlight');
    var field = document.getElementById('spotlightInput');
    if (!panel || !field) return;
    panel.classList.add('open');
    field.value = '';
    drawSearch();
    field.focus();
  }
  function closeSearch() {
    var panel = document.getElementById('spotlight');
    if (panel) panel.classList.remove('open');
  }
  function execute(action) {
    if (typeof State !== 'undefined' && State.locked) return;
    if (action === 'search') { openSearch(); return; }
    if (action === 'close-search') { closeSearch(); return; }
    if (action === 'capture' && window.KaySpace) { KaySpace.quickCapture(); return; }
    if (action === 'focus') {
      if (typeof setFocus === 'function') setFocus(document.body.dataset.focus === 'work' ? 'off' : 'work');
      refreshStatus();
      return;
    }
    closeSearch();
    if (action === 'lock') { if (typeof lockPhone === 'function') lockPhone(); return; }
    if (typeof openApp === 'function') openApp(action);
  }
  function bindEvents() {
    document.addEventListener('click',function (event) {
      var result = event.target.closest('[data-kay-result]');
      if (result) {
        event.preventDefault();
        if (result.dataset.kayAppid) execute(result.dataset.kayAppid);
        else execute(result.dataset.kayAction);
        return;
      }
      var control = event.target.closest('[data-kay-action]');
      if (!control) return;
      event.preventDefault();
      execute(control.dataset.kayAction);
    });
    document.addEventListener('keydown',function (event) {
      var tag = event.target && event.target.tagName;
      var editable = tag === 'INPUT' || tag === 'TEXTAREA' || (event.target && event.target.isContentEditable);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (document.getElementById('spotlight').classList.contains('open')) closeSearch(); else openSearch();
      } else if (event.key === '/' && !editable && !event.altKey && !event.ctrlKey && !event.metaKey) {
        if (document.getElementById('screen-home').classList.contains('active')) { event.preventDefault(); openSearch(); }
      } else if (event.key === 'Escape' && document.getElementById('spotlight').classList.contains('open')) {
        event.preventDefault();
        closeSearch();
      } else if (document.getElementById('spotlight').classList.contains('open')) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          activeResult += event.key === 'ArrowDown' ? 1 : -1;
          highlightResult();
        } else if (event.key === 'Enter' && event.target === document.getElementById('spotlightInput')) {
          event.preventDefault();
          var rows = document.querySelectorAll('#spotlightResults [data-kay-result]');
          if (rows[activeResult]) rows[activeResult].click();
        }
      }
    });
    document.addEventListener('click',function (event) {
      var item = event.target.closest('[data-appid]');
      if (item && item.dataset.appid) rememberApp(item.dataset.appid);
    },true);
    document.addEventListener('visibilitychange',function () { if (!document.hidden) clockTick(); });
    window.addEventListener('focus',clockTick);
  }
  function init() {
    if (initialized) return;
    initialized = true;
    mountHome(); mountStage(); mountSearchHelp(); bindEvents();
    window.openSpotlight = openSearch;
    window.closeSpotlight = closeSearch;
    window.searchSpotlight = drawSearch;
    var previousOpen = window.openApp;
    if (typeof previousOpen === 'function') {
      window.openApp = function (id) { rememberApp(id); return previousOpen(id); };
    }
    clockTick();
    if(window.KaySpace)KaySpace.refresh();
    setInterval(clockTick,20000);
  }
  window.KayExperience = { init:init, glyph:glyph, refresh:refreshStatus };
})();
