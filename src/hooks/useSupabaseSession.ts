import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        // 1. 먼저 로컬 스토리지에서 세션 확인
        const localSession = localStorage.getItem('supabase.auth.token');
        log.info('로컬 스토리지 세션:', localSession);

        // 2. Supabase 세션 확인
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (mounted) {
          setSession(currentSession);
          setError(null);
        }
      } catch (err) {
        console.error('세션 초기화 중 에러:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('세션 초기화 실패'));
          setSession(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // 세션 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        log.info('세션 상태 변화:', event, currentSession?.user?.email);
        
        if (mounted) {
          setSession(currentSession);
          setError(null);
        }
      }
    );

    // 초기 세션 로드
    initializeSession();

    // 클린업
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.getSession();
      
      if (refreshError) {
        throw refreshError;
      }

      setSession(newSession);
      setError(null);
      return newSession;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('세션 갱신 실패');
      setError(error);
      setSession(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    session,
    isLoading,
    error,
    refreshSession,
    supabase
  };
} 