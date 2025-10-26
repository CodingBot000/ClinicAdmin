'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';
import type { SendbirdGroupChat } from '@sendbird/chat/groupChannel';
import { useAuth } from '@/hooks/useAuth';

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
  const [adminId, setAdminId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

   // 1. 로그인된 admin의 id를 가져온다 (/api/auth/me)
   useEffect(() => {
    const fetchAdminSession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          // 세션 만료 등
          setError("세션이 유효하지 않습니다.");
          return;
        }

        const json = await res.json();
        // json = { ok: true, user: { id, email } }
        if (json.ok && json.user?.id) {
          setAdminId(json.user.id); // <-- 이게 admin 테이블의 id
        } else {
          setError("사용자 정보를 불러올 수 없습니다.");
        }
      } catch (e) {
        setError("세션 정보를 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchAdminSession();
  }, []);

  useEffect(() => {
    const initSendbird = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        const response = await fetch("/api/admin/hospital/uuid", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({ userUid: adminId }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to fetch hospital UUID");
        }

        const { hospitalUuid } = await response.json();

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
  }, [adminId]);

  return (
    <SendbirdContext.Provider value={{ sb, userId, isConnecting, error }}>
      {children}
    </SendbirdContext.Provider>
  );
}
