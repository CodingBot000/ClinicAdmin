
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // supabase client 초기화 파일
// import { useSession } from '@supabase/auth-helpers-react'; // 선택적
import { toast } from 'sonner'; // 알림 라이브러리 사용 예
import { TABLE_RESERVATIONS } from '@/constants/tables';

export const useReservationRealtime = (hospitalId: string) => {
    if (!hospitalId) return;
    
  useEffect(() => {
    if (!hospitalId) return;

    const channel = supabase
      .channel('reservations_insert')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLE_RESERVATIONS,
          filter: `id_uuid_hospital=eq.${hospitalId}`,
        },
        (payload) => {
          const { name, preferred_date, preferred_time } = payload.new;

          // 알림 출력
          toast.success(`새 예약: ${name}님 - ${preferred_date} ${preferred_time}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospitalId]);
};
