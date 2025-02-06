import '@/styles/globals.css';
import '@/styles/reset.css';
import { GeistSans } from 'geist/font/sans';
import { Inter } from 'next/font/google';
import 'react-tooltip/dist/react-tooltip.css';
import 'server-only';
import { AppProviders } from './AppProviders';

const inter = Inter({
  display: 'swap',
  subsets: ['cyrillic', 'cyrillic-ext', 'latin-ext', 'latin', 'vietnamese'],
  variable: '--font-inter',
});

export const metadata = {
  icons: {
    icon: '/images/logo-black-main.ico',
  },
  title: 'InterviewGrade ',
  description: 'InterviewGrade',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <head></head>
      <body className="bg-background">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
