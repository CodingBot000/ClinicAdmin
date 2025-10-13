// import { createClient } from "@/utils/supabase/server";
import { supabase } from "@/lib/supabaseClient";
import { ReservationOutputDto } from "@/models/reservation.dto";
import { TABLE_RESERVATIONS } from "@/constants/tables";

export const getReservationDatas = async (
    id_uuid_hospital: string
): Promise<ReservationOutputDto | null> => {
//   const supabase = createClient();

const { data, error } = await supabase
  .from('reservations')
  .select('*')
  .eq('id_uuid_hospital', id_uuid_hospital)
  .order('status', { ascending: true })   // 숫자 기준 우선순위
  .order('created_at', { ascending: false });  // 최신순
// status_code	의미	프론트 표현 (UI)
// 0	pending	대기 중
// 1	approved	승인됨
// 2	denied	거절됨
// 3	completed	시술 완료
  console.log("getReservationDatas data:", JSON.stringify(data, null, 2));
 
  if (error) {
    console.error("getReservationDatas error:", error);
    return null;
  }
  


  return {
    data: data,
  };
};
