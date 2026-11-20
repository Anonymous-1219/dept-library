import { SITE } from '../../lib/config';

export const metadata = { title: `Privacy and terms, ${SITE.name}` };

export default function Privacy() {
  return (
    <div className="narrow txt">
      <h1 className="pg">Privacy and terms</h1>
      <h2 className="sec2">What we keep</h2>
      <p>Your name, email and a count of what you download. We never sell your details.</p>
      <h2 className="sec2">Cookies</h2>
      <p>We remember your light or dark choice. If you accept, we also count how many people see and tap each ad. Declining does not break anything.</p>
      <h2 className="sec2">Ads</h2>
      <p>Sponsored cards are placed by the site owner. They are labelled, and we do not track you across other sites.</p>
      <h2 className="sec2">Files and copyright</h2>
      <p>Course reps confirm they are allowed to share what they upload. If a file is yours and you want it removed, email <a href={`mailto:${SITE.copyrightEmail}`}>{SITE.copyrightEmail}</a> or use the Report button on the file.</p>
      <h2 className="sec2">Fair use of the library</h2>
      <p>Use the files for study. Do not re-sell them or upload things you do not have the right to share.</p>
    </div>
  );
}
