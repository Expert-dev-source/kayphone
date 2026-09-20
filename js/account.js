// ===== KAY ID ACCOUNTS =====
(function () {
  let createMode = false;
  let accountReady = false;

  function el(id) { return document.getElementById(id); }
  function setError(text) { const node = el('accountError'); if (node) node.textContent = text || ''; }
  function showGate() { const gate = el('accountGate'); if (gate) gate.classList.add('open'); }
  function hideGate() { const gate = el('accountGate'); if (gate) gate.classList.remove('open'); }

  function renderMode() {
    const heading = el('accountHeading');
    const subheading = el('accountSubheading');
    const submit = el('accountSubmit');
    const toggle = el('accountModeToggle');
    const recovery = el('accountCreateFields');
    if (heading) heading.textContent = createMode ? 'Create your Kay ID' : 'Sign in with Kay ID';
    if (subheading) subheading.textContent = createMode ? 'Choose a unique identity that works across KayPhone and future Kay apps.' : 'Use your Kay identity on this device and across KayPhone apps.';
    if (submit) submit.textContent = createMode ? 'Create Kay ID' : 'Sign In';
    if (toggle) toggle.textContent = createMode ? 'Already have a Kay ID? Sign In' : 'Create a Kay ID';
    if (recovery) recovery.hidden = !createMode;
    setError('');
  }

  function initAccountUI() {
    const form = el('accountForm');
    const toggle = el('accountModeToggle');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = 'true';
    if (toggle) toggle.addEventListener('click', function () { createMode = !createMode; renderMode(); });
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const submit = el('accountSubmit');
      const kayId = el('kayIdInput').value.trim().toLowerCase();
      const password = el('kayPasswordInput').value;
      const recovery = el('kayRecoveryInput') ? el('kayRecoveryInput').value.trim() : '';
      setError('');
      if (submit) { submit.disabled = true; submit.textContent = createMode ? 'Creating…' : 'Signing in…'; }
      const result = createMode ? await Supa.signUpKay(kayId, password, recovery) : await Supa.signInKay(kayId, password);
      if (submit) submit.disabled = false;
      if (result && result.error) {
        setError(result.error.message || 'Could not complete that Kay ID request.');
        if (submit) submit.textContent = createMode ? 'Create Kay ID' : 'Sign In';
        return;
      }
      if (createMode && result.needsConfirmation) {
        setError('Account created, but Supabase email confirmation is enabled. Disable Confirm email in Supabase Auth settings because this Kay-only setup does not use a mail provider.');
        if (submit) submit.textContent = 'Create Kay ID';
        return;
      }
      hideGate();
      accountReady = true;
      if (typeof showToast === 'function') showToast('✅', createMode ? 'Kay ID created' : 'Welcome back');
      if (typeof renderHome === 'function') renderHome();
    });
  }

  function checkSession() {
    if (!Supa.isConfigured) {
      hideGate();
      return;
    }
    initAccountUI();
    if (Supa.getUser()) { accountReady = true; hideGate(); }
    else { accountReady = false; showGate(); }
  }

  window.openKayAccountSettings = async function () {
    if (!Supa.isConfigured) {
      openSubPage('Kay ID', '<div style="padding:22px;color:var(--ios-text-secondary);text-align:center;">Connect Supabase in <b>js/config.js</b> to enable real Kay ID accounts.</div>', 'Settings');
      return;
    }
    const account = await Supa.getAccount();
    const kayId = account && account.kay_id ? account.kay_id : 'Kay ID not set';
    const recovery = account && account.recovery_email ? account.recovery_email : 'Not added';
    openSubPage('Kay ID', '<div style="padding:16px;"><div style="text-align:center;padding:18px 0 22px;"><div class="account-logo" style="margin:0 auto 12px;">K</div><div style="font-size:20px;font-weight:700;color:#fff;">' + escapeHtml(kayId) + '</div><div style="font-size:12px;color:var(--ios-text-secondary);margin-top:5px;">Your Kay identity</div></div><div style="background:rgba(255,255,255,.06);border-radius:14px;overflow:hidden;"><div style="display:flex;justify-content:space-between;padding:14px;border-bottom:1px solid rgba(255,255,255,.06);"><span style="color:#fff;">Recovery email</span><span style="color:var(--ios-text-secondary);font-size:13px;">' + escapeHtml(recovery) + '</span></div><div style="display:flex;justify-content:space-between;padding:14px;"><span style="color:#fff;">Session</span><span style="color:var(--ios-green);font-size:13px;">This device</span></div></div><div style="margin-top:14px;padding:14px;background:rgba(255,255,255,.06);border-radius:14px;color:var(--ios-text-secondary);font-size:12px;line-height:1.5;">Your password is managed by Supabase Auth and is never stored in KayPhone.</div><div style="margin-top:14px;padding:14px;border-radius:14px;background:rgba(255,69,58,.12);color:var(--ios-red);text-align:center;font-weight:600;cursor:pointer;" data-kaylogout="true">Sign Out on This Device</div><div style="margin-top:10px;padding:14px;border-radius:14px;background:rgba(255,69,58,.08);color:var(--ios-red);text-align:center;font-weight:600;cursor:pointer;" data-kayreset="true">Erase Local Device Data</div></div>', 'Settings');
  };

  document.addEventListener('click', async function (event) {
    if (event.target.closest('[data-kaylogout]')) {
      if (!confirm('Sign out of this KayPhone device? Your cloud account stays safe.')) return;
      await Supa.signOutKay();
      localStorage.clear();
      location.reload();
    }
    if (event.target.closest('[data-kayreset]')) {
      if (!confirm('Erase local KayPhone data and sign out? Cloud data will remain in your Kay account.')) return;
      await Supa.signOutKay();
      localStorage.clear();
      try { indexedDB.deleteDatabase('KayPhoneApps'); } catch (e) {}
      location.reload();
    }
  });

  if (typeof Supa !== 'undefined') Supa.onReady(checkSession);
})();
