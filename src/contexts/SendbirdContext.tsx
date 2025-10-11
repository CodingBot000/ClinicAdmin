'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';
import type { SendbirdGroupChat } from '@sendbird/chat/groupChannel';
import { supabase } from '@/lib/supabaseClient';
import { getUserHospitalUuid } from '@/lib/hospitalDataLoader';

interface SendbirdContextType {
  sb: SendbirdGroupChat | null;
  userId: string | null;
  isConnecting: boolean;
  error: string | null;
}

const SendbirdContext = createContext<SendbirdContextType>({
  sb: null,
  userId: null,
  isConnecting: false,
  error: null,
});

export const useSendbird = () => {
  const context = useContext(SendbirdContext);
  if (!context) {
    throw new Error('useSendbird must be used within SendbirdProvider');
  }
  return context;
};

interface SendbirdProviderProps {
  children: ReactNode;
}

export function SendbirdProvider({ children }: SendbirdProviderProps) {
  const [sb, setSb] = useState<SendbirdGroupChat | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initSendbird = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Get current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError('No authenticated user found');
          setIsConnecting(false);
          return;
        }

        // Get hospital UUID for this admin
        const hospitalUuid = await getUserHospitalUuid(user.id);

        if (!hospitalUuid) {
          setError('No hospital UUID found for this user');
          setIsConnecting(false);
          return;
        }

        // Initialize Sendbird
        const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID;
        if (!appId) {
          setError('Sendbird App ID not configured');
          setIsConnecting(false);
          return;
        }

        const sendbirdChat = SendbirdChat.init({
          appId,
          modules: [new GroupChannelModule()],
        }) as SendbirdGroupChat;

        // Connect using hospital UUID
        await sendbirdChat.connect(hospitalUuid);

        setSb(sendbirdChat);
        setUserId(hospitalUuid);
        log.info('Sendbird connected successfully with hospital UUID:', hospitalUuid);
      } catch (err) {
        console.error('Sendbird initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Sendbird');
      } finally {
        setIsConnecting(false);
      }
    };

    initSendbird();

    // Cleanup on unmount
    return () => {
      if (sb) {
        sb.disconnect();
      }
    };
  }, []);

  return (
    <SendbirdContext.Provider value={{ sb, userId, isConnecting, error }}>
      {children}
    </SendbirdContext.Provider>
  );
}
