// ===================== SUPABASE CLIENT =====================
// Single source of truth for talking to the backend. Every app
// module calls into `Supa.*` below instead of touching
// localStorage or fake arrays — see each app's file for usage.

const Supa = (function () {
  const cfg = window.KAYPHONE_CONFIG || {};
  const isConfigured = !!cfg.SUPABASE_URL &&
    !!cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
    !cfg.SUPABASE_ANON_KEY.includes('YOUR-ANON-PUBLIC-KEY');

  let client = null;
  let currentUser = null;
  let ready = false;
  const readyCallbacks = [];

  if (isConfigured && window.supabase && window.supabase.createClient) {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }

  async function init() {
    if (!client) { ready = true; flushReady(); return; }
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session && session.user) {
        currentUser = session.user;
      } else {
        const { data, error } = await client.auth.signInAnonymously();
        if (error) throw error;
        currentUser = data.user;
      }
      await ensureProfile();
    } catch (e) {
      console.error('[Supa] auth init failed:', e.message || e);
    }
    ready = true;
    flushReady();
  }

  function flushReady() {
    while (readyCallbacks.length) readyCallbacks.shift()();
  }

  function onReady(cb) {
    if (ready) cb();
    else readyCallbacks.push(cb);
  }

  async function ensureProfile() {
    if (!currentUser) return;
    const { data } = await client.from('profiles').select('id, display_name').eq('id', currentUser.id).maybeSingle();
    if (!data) {
      let saved = null;
      try { saved = localStorage.getItem('kayphone_display_name'); } catch (e) {}
      const name = saved || ('Guest' + Math.floor(1000 + Math.random() * 9000));
      await client.from('profiles').insert({ id: currentUser.id, display_name: name });
      try { localStorage.setItem('kayphone_display_name', name); } catch (e) {}
    }
  }

  async function getDisplayName() {
    if (!client || !currentUser) return 'Guest';
    const { data } = await client.from('profiles').select('display_name').eq('id', currentUser.id).maybeSingle();
    return (data && data.display_name) || 'Guest';
  }

  async function setDisplayName(name) {
    if (!client || !currentUser) return;
    await client.from('profiles').update({ display_name: name }).eq('id', currentUser.id);
    try { localStorage.setItem('kayphone_display_name', name); } catch (e) {}
  }

  // ---------- generic CRUD helper for a user-scoped table ----------
  function userTable(tableName) {
    return {
      list: async function (orderCol, ascending) {
        if (!client || !currentUser) return [];
        const { data, error } = await client.from(tableName).select('*')
          .eq('user_id', currentUser.id)
          .order(orderCol || 'created_at', { ascending: ascending !== false });
        if (error) { console.error('[Supa] list', tableName, error.message); return []; }
        return data || [];
      },
      insert: async function (row) {
        if (!client || !currentUser) return null;
        const payload = Object.assign({}, row, { user_id: currentUser.id });
        const { data, error } = await client.from(tableName).insert(payload).select().single();
        if (error) { console.error('[Supa] insert', tableName, error.message); return null; }
        return data;
      },
      update: async function (id, patch) {
        if (!client || !currentUser) return null;
        const { data, error } = await client.from(tableName).update(patch).eq('id', id).eq('user_id', currentUser.id).select().single();
        if (error) { console.error('[Supa] update', tableName, error.message); return null; }
        return data;
      },
      remove: async function (id) {
        if (!client || !currentUser) return false;
        const { error } = await client.from(tableName).delete().eq('id', id).eq('user_id', currentUser.id);
        if (error) { console.error('[Supa] delete', tableName, error.message); return false; }
        return true;
      },
    };
  }

  // ---------- messages / conversations ----------
  const messages = {
    listConversations: async function () {
      if (!client) return [];
      const { data, error } = await client.from('conversations').select('id, name, created_at').order('created_at', { ascending: false });
      if (error) { console.error('[Supa] listConversations', error.message); return []; }
      return data || [];
    },
    joinOrCreateConversation: async function (name) {
      if (!client || !currentUser) return null;
      const clean = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '').slice(0, 60);
      if (!clean) return null;
      const { data: existing } = await client.from('conversations').select('*').eq('name', clean).maybeSingle();
      if (existing) return existing;
      const { data, error } = await client.from('conversations').insert({ name: clean, created_by: currentUser.id }).select().single();
      if (error) { console.error('[Supa] createConversation', error.message); return null; }
      return data;
    },
    listMessages: async function (conversationId) {
      if (!client) return [];
      const { data, error } = await client.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(200);
      if (error) { console.error('[Supa] listMessages', error.message); return []; }
      return data || [];
    },
    send: async function (conversationId, body) {
      if (!client || !currentUser) return null;
      const name = await getDisplayName();
      const { data, error } = await client.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        sender_name: name,
        body: body.slice(0, 2000),
      }).select().single();
      if (error) { console.error('[Supa] send', error.message); return null; }
      return data;
    },
    subscribe: function (conversationId, onInsert) {
      if (!client) return null;
      const channel = client.channel('room:' + conversationId)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: 'conversation_id=eq.' + conversationId,
        }, function (payload) { onInsert(payload.new); })
        .subscribe();
      return channel;
    },
    unsubscribe: function (channel) {
      if (client && channel) client.removeChannel(channel);
    },
  };

  // ---------- storage (photos / voice memos / files) ----------
  function storageBucket(bucketName) {
    return {
      upload: async function (fileNameOrPath, blob, contentType) {
        if (!client || !currentUser) return null;
        const path = currentUser.id + '/' + fileNameOrPath;
        const { error } = await client.storage.from(bucketName).upload(path, blob, {
          contentType: contentType || blob.type || 'application/octet-stream',
          upsert: false,
        });
        if (error) { console.error('[Supa] upload', bucketName, error.message); return null; }
        return path;
      },
      list: async function () {
        if (!client || !currentUser) return [];
        const { data, error } = await client.storage.from(bucketName).list(currentUser.id, {
          sortBy: { column: 'created_at', order: 'desc' },
        });
        if (error) { console.error('[Supa] list storage', bucketName, error.message); return []; }
        return (data || []).filter(f => f.name !== '.emptyFolderPlaceholder');
      },
      getSignedUrl: async function (fileName, expiresSeconds) {
        if (!client || !currentUser) return null;
        const path = currentUser.id + '/' + fileName;
        const { data, error } = await client.storage.from(bucketName).createSignedUrl(path, expiresSeconds || 3600);
        if (error) { console.error('[Supa] signedUrl', bucketName, error.message); return null; }
        return data.signedUrl;
      },
      remove: async function (fileName) {
        if (!client || !currentUser) return false;
        const path = currentUser.id + '/' + fileName;
        const { error } = await client.storage.from(bucketName).remove([path]);
        if (error) { console.error('[Supa] remove storage', bucketName, error.message); return false; }
        return true;
      },
    };
  }

  return {
    isConfigured: isConfigured,
    init: init,
    onReady: onReady,
    getUser: function () { return currentUser; },
    getDisplayName: getDisplayName,
    setDisplayName: setDisplayName,
    notes: userTable('notes'),
    reminders: userTable('reminders'),
    calendarEvents: userTable('calendar_events'),
    voiceMemoMeta: userTable('voice_memos'),
    messages: messages,
    photos: storageBucket('photos'),
    voiceMemos: storageBucket('voice-memos'),
    files: storageBucket('files'),
  };
})();

Supa.init();
