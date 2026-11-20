export const SITE = {
  name: 'Department Library',
  department: 'our department',
  tagline: 'Study smarter, together',
  levels: [100, 200, 300, 400, 500],
  kinds: ['Past questions', 'Lecture notes', 'Textbook', 'Handout', 'Assignment', 'Other'],
  maxMB: 50,
  previewPagesGuest: 5,
  previewPagesMember: 15,
  contactEmail: 'hello@yourdomain.com',
  copyrightEmail: 'copyright@yourdomain.com',
  developer: 'Mupel Designs',
};

export const semesterName = (n) => (n === 1 ? 'First semester' : 'Second semester');

export function fmtSize(b) {
  if (!b) return '';
  const mb = b / 1048576;
  return mb >= 1 ? mb.toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
}

export function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const LEVEL_COLORS = { 100: 'var(--l100)', 200: 'var(--l200)', 300: 'var(--l300)', 400: 'var(--l400)', 500: 'var(--l500)' };
export const levelColor = (l) => LEVEL_COLORS[l] || 'var(--accent)';
