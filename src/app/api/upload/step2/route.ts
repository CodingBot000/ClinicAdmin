import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { 
  TABLE_HOSPITAL_DETAIL, 
  TABLE_HOSPITAL_BUSINESS_HOUR
} from '@/constants/tables';

// CORS 헤더 정의
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
    const id_uuid_hospital = formData.get("id_uuid_hospital") as string;
    const current_user_uid = formData.get("current_user_uid") as string;

    const opening_hours_raw = formData.get("opening_hours") as string;
    const extra_options_raw = formData.get("extra_options") as string;

    console.log('current_user_uid', current_user_uid);
    console.log('id_uuid_hospital', id_uuid_hospital);

    // opening_hours JSON 파싱
    let opening_hours_parsed;
    try {
      opening_hours_parsed = JSON.parse(opening_hours_raw);
    } catch (error) {
      console.error("opening_hours 파싱 실패:", error);
      return NextResponse.json({
        message: "영업시간 데이터 파싱에 실패했습니다.",
        status: "error",
      }, { status: 400 });
    }

    // opening_hours_parsed가 null이거나 배열이 아닌 경우 기본값 설정
    if (!opening_hours_parsed || !Array.isArray(opening_hours_parsed)) {
      console.warn("opening_hours 데이터가 올바르지 않습니다:", opening_hours_parsed);
      opening_hours_parsed = []; // 빈 배열로 초기화
    }

    console.log("파싱된 opening_hours (배열):", opening_hours_parsed);

    // 각 요일별로 개별 레코드 생성 및 insert
    const businessHourInserts = [];

    for (let i = 0; i < opening_hours_parsed.length; i++) {
      const hour = opening_hours_parsed[i];
      
      // from과 to를 시간 문자열로 변환 (HH:MM 형식)
      const openTime = hour.from ? `${hour.from.hour.toString().padStart(2, '0')}:${hour.from.minute.toString().padStart(2, '0')}` : null;
      const closeTime = hour.to ? `${hour.to.hour.toString().padStart(2, '0')}:${hour.to.minute.toString().padStart(2, '0')}` : null;
      
      let status = '';
      if (hour.open) {
        status = 'open';
      } else if (hour.closed) {
        status = 'closed';
      } else if (hour.ask) {
        status = 'ask';
      }

      const form_business_hour = {
        id_uuid_hospital: id_uuid_hospital,
        day_of_week: hour.day, // 영어 요일 그대로 저장
        open_time: openTime,
        close_time: closeTime,
        status: status,
      };
      
      businessHourInserts.push(form_business_hour);
    }

    console.log("영업시간 데이터:", businessHourInserts);

    // 먼저 기존 데이터가 있는지 확인
    const { data: existingBusinessHour, error: checkErrorBusinessHour } = await supabase
      .from(TABLE_HOSPITAL_BUSINESS_HOUR)
      .select('*')
      .eq('id_uuid_hospital', id_uuid_hospital);
    
    console.error("hospital_business_hours 조회 중 에러:", checkErrorBusinessHour);

    if (existingBusinessHour && existingBusinessHour.length > 0) {
      console.log("hospital_business_hours 데이터가 존재");
      for (const form_business_hour of businessHourInserts) {
        const { day_of_week } = form_business_hour;
      
        const { data, error } = await supabase
          .from(TABLE_HOSPITAL_BUSINESS_HOUR)
          .update({
            open_time: form_business_hour.open_time,
            close_time: form_business_hour.close_time,
            status: form_business_hour.status,
          })
          .eq('id_uuid_hospital', id_uuid_hospital)
          .eq('day_of_week', day_of_week);
      
        if (error) {
          console.error(`요일 ${day_of_week} 업데이트 실패:`, error);
        } else {
          console.log(`요일 ${day_of_week} 업데이트 성공:`, data);
        }
      }
    } else {
      console.log("hospital_business_hours 데이터가 존재하지 않습니다. 추가할 데이터: ", businessHourInserts);
      let operateBusinessHour = await supabase
        .from(TABLE_HOSPITAL_BUSINESS_HOUR)
        .insert(businessHourInserts)
        .select("*");

      if (operateBusinessHour.error) {
        console.log("error 3 : ", operateBusinessHour.error);
        return NextResponse.json({
          message: operateBusinessHour.error.code || operateBusinessHour.error.message,
          status: "error",
        }, { status: 500 });
      }
    }

    // extra_options JSON 파싱 및 boolean 변환
    let extra_options_parsed;
    try {
      extra_options_parsed = JSON.parse(extra_options_raw);
    } catch (error) {
      console.error("extra_options 파싱 실패:", error);
      return NextResponse.json({
        message: "추가 옵션 데이터 파싱에 실패했습니다.",
        status: "error",
      }, { status: 400 });
    }

    // string을 boolean으로 변환하는 헬퍼 함수
    const stringToBoolean = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    const extra_options = {
      has_private_recovery_room: stringToBoolean(extra_options_parsed.has_private_recovery_room),
      has_parking: stringToBoolean(extra_options_parsed.has_parking),
      has_cctv: stringToBoolean(extra_options_parsed.has_cctv),
      has_night_counseling: stringToBoolean(extra_options_parsed.has_night_counseling),
      has_female_doctor: stringToBoolean(extra_options_parsed.has_female_doctor),
      has_anesthesiologist: stringToBoolean(extra_options_parsed.has_anesthesiologist),
      specialist_count: parseInt(extra_options_parsed.specialist_count) || 0,
    };

    console.log("변환된 opening_hours (배열):", opening_hours_parsed);
    console.log("변환된 extra_options:", extra_options);
    
    // 먼저 기존 데이터가 있는지 확인
    const { data: existingDetail, error: checkError } = await supabase
      .from(TABLE_HOSPITAL_DETAIL)
      .select('*')
      .eq('id_uuid_hospital', id_uuid_hospital)
      .maybeSingle();
    
    if (checkError) {
      console.error("hospital_details 조회 중 에러:", checkError);
      return NextResponse.json({
        message: checkError.code || checkError.message,
        status: "error",
      }, { status: 500 });
    }

    if (!existingDetail) {
      return NextResponse.json({
        message: "병원 정보가 존재하지 않아 업데이트 할수 없습니다.(uploadActionStep2)",
        status: "error",
      }, { status: 400 });
    }

    let detailOperation = await supabase
      .from(TABLE_HOSPITAL_DETAIL)
      .update(extra_options)
      .eq('id_uuid_hospital', id_uuid_hospital);
    
    if (detailOperation.error) {
      console.log("hospitalDetail operation error:", detailOperation.error);
      return NextResponse.json({
        message: detailOperation.error.code || detailOperation.error.message,
        status: "error",
      }, { status: 500 });
    }

    return NextResponse.json({
      message: "성공적으로 등록되었습니다.",
      status: "success",
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Step2 API 오류:', error);
    return NextResponse.json({
      message: "서버 오류가 발생했습니다.",
      status: "error",
    }, { status: 500, headers: corsHeaders });
  }
} 