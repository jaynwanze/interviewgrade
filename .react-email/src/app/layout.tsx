import '../styles/globals.css';
import classnames from 'classnames';
import { Inter } from 'next/font/google';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
  });

  return (
    <html lang="en">
      <body className="bg-black text-slate-12 font-sans">
        <div className={classnames(inter.variable, 'font-sans')}>
          {children}
        </div>
      </body>
    </html>
  );
}
