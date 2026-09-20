// ===================== SECURITY UTILITIES =====================
// Every piece of text that ultimately comes from a user (chat
// messages, note titles/bodies, reminder text, display names,
// file names) is rendered with innerHTML elsewhere in this app for
// layout convenience. That's a stored-XSS risk the moment the
// content is attacker-controlled and shared with other visitors —
// which chat messages and display names explicitly are. Escape
// first, always.
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// For values dropped into an HTML attribute inside a single-quoted
// string (e.g. style="background:url('...')"), escaping quotes and
// backslashes matters more than escaping angle brackets.
function escapeAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
