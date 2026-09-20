// ===== KAYWIDGET APP =====
// The third-party widget is intentionally isolated in a sandboxed iframe so
// its global DOM/CSS cannot cover the KayPhone shell or other apps.
const KAY_WIDGET_ID = '1ff01cfdc900';
const KAY_WIDGET_SCRIPT = 'https://mywidgetflow.vercel.app/widget.min.js';

Apps.widgetflow = {
  open: function () {
    const view = getOrCreateView('widgetflow', 'KayWidget',
      '<div class="widget-app-shell">' +
        '<div class="widget-app-loading" id="kayWidgetLoading">' +
          '<div class="widget-app-icon">✦</div>' +
          '<div style="font-size:16px;font-weight:700;color:#fff;">KayWidget</div>' +
          '<div style="font-size:12px;color:var(--ios-text-secondary);margin-top:6px;">Connecting securely…</div>' +
        '</div>' +
        '<iframe id="kayWidgetFrame" class="widget-app-frame" title="KayWidget" sandbox="allow-scripts allow-forms allow-popups allow-modals"></iframe>' +
      '</div>'
    );
    // App views sit under the global status bar; keep this app's controls tappable.
    view.style.paddingTop = '44px';
    setTimeout(function () {
      view.classList.add('open');
      const frame = document.getElementById('kayWidgetFrame');
      const loading = document.getElementById('kayWidgetLoading');
      if (!frame) return;
      frame.addEventListener('load', function () { if (loading) loading.style.display = 'none'; });
      frame.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>html,body{margin:0;min-height:100%;background:transparent;color:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}body{overflow:auto}</style></head><body><script src="' + KAY_WIDGET_SCRIPT + '" data-widget-id="' + KAY_WIDGET_ID + '" async><\/script></body></html>';
    }, 20);
    State.currentApp = 'widgetflow';
  },
  close: function () {
    const view = document.getElementById('view-widgetflow');
    if (view) view.remove();
    State.currentApp = null;
  }
};
