export function getConsent() {
  try { return localStorage.getItem('consent'); } catch (e) { return null; }
}
export function setConsent(v) {
  try {
    if (v) localStorage.setItem('consent', v); else localStorage.removeItem('consent');
  } catch (e) {}
}
