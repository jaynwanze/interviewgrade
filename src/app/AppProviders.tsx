'use client';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/next';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import React, { Suspense } from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';
import ReactNoSSR from 'react-no-ssr';
import { Toaster as SonnerToaster } from 'sonner';
import { ThemeProvider } from './ThemeProvider';

// Create a client
const queryClient = new QueryClient();

/**
 * This is a wrapper for the app that provides the supabase client, the router event wrapper
 * the react-query client, supabase listener, and the navigation progress bar.
 *
 * The listener is used to listen for changes to the user's session and update the UI accordingly.
 */
export function AppProviders({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        <NotificationsProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Analytics />
            <ReactNoSSR>
              <SonnerToaster theme={'light'} />
              <HotToaster />
            </ReactNoSSR>
            <Suspense>
              <ProgressBar
                height="4px"
                color="#0047ab"
                options={{ showSpinner: false }}
                shallowRouting
              />
            </Suspense>
          </QueryClientProvider>
        </NotificationsProvider>
      </ThemeProvider>
    </>
  );
}
