'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PlayerProvider } from '@/contexts/PlayerContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlayerProvider>
      <AppLayout>
        {children}
      </AppLayout>
    </PlayerProvider>
  );
}