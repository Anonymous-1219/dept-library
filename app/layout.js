import './globals.css';
import { Bricolage_Grotesque } from 'next/font/google';
import AuthProvider from '../components/AuthProvider';
import { AdsProvider } from '../components/Ads';
import Shell from '../components/Shell';
import { SITE } from '../lib/config';

const font = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font', display: 'swap' });

export const metadata = {
  title: SITE.name,
  description: `Past questions, notes and handouts for ${SITE.department}.`,
};
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#09080d' };

const themeScript =
  "try{document.documentElement.dataset.theme=localStorage.getItem('theme')||'dark'}catch(e){document.documentElement.dataset.theme='dark'}";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={font.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="aurora"><div className="orb o1" /><div className="orb o2" /><div className="orb o3" /></div>
        <AuthProvider>
          <AdsProvider>
            <Shell>{children}</Shell>
          </AdsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
