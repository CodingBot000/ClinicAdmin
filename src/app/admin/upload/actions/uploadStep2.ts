"use server";

import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { getTimestamp } from '@/utils/address/getTimeStamp';
import { makeUploadImageFileName } from '@/utils/makeUploadImageFileName';
import {
  TABLE_HOSPITAL,
  TABLE_DOCTOR,
  TABLE_HOSPITAL_DETAIL,
  TABLE_HOSPITAL_TREATMENT,
  TABLE_HOSPITAL_BUSINESS_HOUR,
  TABLE_ADMIN,
  TABLE_TREATMENT,
  STORAGE_IMAGES,
  STORAGE_HOSPITAL_IMG,
  STORAGE_DOCTOR_IMG,
  TABLE_FEEDBACKS
} from '@/constants/tables';
import { createClient } from '@supabase/supabase-js';
import { HospitalDetailData } from '@/types/hospital';


export const uploadActionsStep2 = async (prevState: any, formData: FormData) => {
    const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
    const id_uuid_hospital = formData.get("id_uuid_hospital") as string; // 클라이언트에서 생성한 UUID 사용
    const current_user_uid = formData.get("current_user_uid") as string; // 현재 로그인한 사용자 UID

    const opening_hours_raw = formData.get("opening_hours") as string;
    const extra_options_raw = formData.get("extra_options") as string;


    console.log('qqqqqqqqq current_user_uid', current_user_uid);
    console.log('qqqqqqqqq id_uuid_hospital', id_uuid_hospital);


  // opening_hours JSON 파싱
  let opening_hours_parsed;
  try {
    opening_hours_parsed = JSON.parse(opening_hours_raw);
  } catch (error) {
    console.error("uploadActionsStep2 opening_hours 파싱 실패:", error);
    return {
      ...prevState,
      message: "영업시간 데이터 파싱에 실패했습니다.",
      status: "error",
    };
  }

  // opening_hours_parsed가 null이거나 배열이 아닌 경우 기본값 설정
  if (!opening_hours_parsed || !Array.isArray(opening_hours_parsed)) {
    console.warn("opening_hours 데이터가 올바르지 않습니다:", opening_hours_parsed);
    opening_hours_parsed = []; // 빈 배열로 초기화
  }

  console.log("uploadActionsStep2 파싱된 opening_hours (배열):", opening_hours_parsed);
  


  ///////////////////////////////
  // openning hour  선택 테이블 입력 

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

  console.log("uploadActionsStep2 영업시간 데이터:", businessHourInserts);


  // 먼저 기존 데이터가 있는지 확인
  const { data: existingBusinessHour, error: checkErrorBusinessHour } = await supabase
    .from(TABLE_HOSPITAL_BUSINESS_HOUR)
    .select('*')
    .eq('id_uuid_hospital', id_uuid_hospital);
  
  // if (checkErrorBusinessHour) {
    console.error("uploadActionsStep2 hospital_business_hours 조회 중 에러:", checkErrorBusinessHour);
  //   return {
  //     ...prevState,
  //     message: checkErrorBusinessHour.code || checkErrorBusinessHour.message,
  //     status: "error",
  //   };
  // }


  if (existingBusinessHour && existingBusinessHour.length > 0) {
    console.log("uploadActionsStep2 hospital_business_hours 데이터가 존재");
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
        console.error(`uploadActionsStep2 요일 ${day_of_week} 업데이트 실패:`, error);
      } else {
        console.log(`uploadActionsStep2 요일 ${day_of_week} 업데이트 성공:`, data);
      }
    }
  } else {
    console.log("uploadActionsStep2 hospital_business_hours 데이터가 존재하지 않습니다. 추가할 데이터: ",businessHourInserts);
    let operateBusinessHour = await supabase
    .from(TABLE_HOSPITAL_BUSINESS_HOUR)
    .insert(businessHourInserts)
    .select("*")
    

  if (operateBusinessHour.error) {
    console.log("uploadActionsStep2 error 3 : ", operateBusinessHour.error);
    // return await rollbackAll(insertBusinessHour.error.message);
    return {
      ...prevState,
      message: operateBusinessHour.error.code || operateBusinessHour.error.message,
      status: "error",
    };
  }
  }



  // extra_options JSON 파싱 및 boolean 변환
  let extra_options_parsed;
  try {
    extra_options_parsed = JSON.parse(extra_options_raw);
  } catch (error) {
    console.error("uploadActionsStep2 extra_options 파싱 실패:", error);
    return {
      ...prevState,
      message: "추가 옵션 데이터 파싱에 실패했습니다.",
      status: "error",
    };
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
    // return await rollbackAll(checkError.message);
    return {
      ...prevState,
      message: checkError.code || checkError.message,
      status: "error",
    };
  }

  if (!existingDetail) {
    return {
      ...prevState,
      message: "병원 정보가 존재하지 않아 업데이트 할수 없습니다.(uploadActionStep2)",
      status: "error",
    };
  }

  let detailOperation = await supabase
  .from(TABLE_HOSPITAL_DETAIL)
  .update(extra_options)
  .eq('id_uuid_hospital', id_uuid_hospital);
  

  if (detailOperation.error) {
    console.log("uploadActionsStep2 hospitalDetail operation error:", detailOperation.error);
    // return await rollbackAll(hospitalOperation.error.message);
    return {
      ...prevState,
      message: detailOperation.error.code || detailOperation.error.message,
      status: "error",
    };
  }

  
  return {
    ...prevState,
    message: "성공적으로 등록되었습니다.",
    status: "success",
  };
  }