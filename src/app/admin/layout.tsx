'use client';

import { SendbirdProvider } from '@/contexts/SendbirdContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SendbirdProvider>
      {children}
    </SendbirdProvider>
  );
}
