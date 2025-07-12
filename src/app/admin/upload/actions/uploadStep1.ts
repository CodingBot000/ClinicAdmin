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
  TABLE_FEEDBACKS,
  TABLE_CONTACTS
} from '@/constants/tables';
import { createClient } from '@supabase/supabase-js';
import { HospitalDetailData } from '@/types/hospital';


export const uploadActionsStep1 = async (prevState: any, formData: FormData) => {
    const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
    const id_uuid_hospital = formData.get("id_uuid") as string; // 클라이언트에서 생성한 UUID 사용
    const current_user_uid = formData.get("current_user_uid") as string; // 현재 로그인한 사용자 UID
  
    const name = formData.get("name") as string;
    const surgeries = formData.get("surgeries") as string;
    const searchkey = formData.get("searchkey") as string;
    const search_key = formData.get("search_key") as string;
  
const address = formData.get("address") as string; // JSON 문자열
const addressData = address ? JSON.parse(address) : null;
const address_full_road = addressData?.address_full_road || '';
const address_full_road_en = addressData?.address_full_road_en || '';
const address_full_jibun = addressData?.address_full_jibun || '';
const address_full_jibun_en = addressData?.address_full_jibun_en || '';
const address_si = addressData?.address_si || '';
const address_si_en = addressData?.address_si_en || '';
const address_gu = addressData?.address_gu || '';
const address_gu_en = addressData?.address_gu_en || '';
const address_dong = addressData?.address_dong || '';
const address_dong_en = addressData?.address_dong_en || '';
const zipcode = addressData?.zipcode || '';
const latitude = addressData?.latitude ? Number(addressData.latitude) : null;
const longitude = addressData?.longitude ? Number(addressData.longitude) : null;
const address_detail = addressData?.address_detail || '';
const address_detail_en = addressData?.address_detail_en || '';
const directions_to_clinic = addressData?.directions_to_clinic || '';
const directions_to_clinic_en = addressData?.directions_to_clinic_en || '';



    const location = formData.get("location") as string;


    const lastUnique = await supabase
    .from(TABLE_HOSPITAL)
    .select("id_unique")
    .order("id_unique", { ascending: false })
    .limit(1);
  
  if (!lastUnique.data || lastUnique.error) {
    console.log("uploadActions -b") ;
    return {
      ...prevState,
      message: lastUnique.error.code || lastUnique.error.message,
      status: "error",
    };
  }
  // legacy id . 나중에 id_uuid로 완전전환후 삭제해야됨  끝
  
  const nextIdUnique = (lastUnique.data && lastUnique.data.length > 0)
    ? lastUnique.data[0].id_unique + 1
    : 0;
  

  // admin uuid 가져오기
  const { data: adminData, error: adminError } = await supabase
    .from(TABLE_ADMIN)
    .select('id')
    .eq('id_auth_user', current_user_uid)
    .single();
  
  if (adminError) {
    console.error('Admin UUID 조회 실패:', adminError);
    // return await rollbackAll('관리자 정보를 찾을 수 없습니다.');
    return {
      ...prevState,
      message: adminError.code || adminError.message,
      status: "error",
    };
  }
  
  // const id_surgeries = (surgeries && surgeries.length > 0) ? surgeries.split(",") : [1010];
  const form_hospital = {
    id_unique: nextIdUnique,  // legacy id  나중에 삭제 
    id_uuid: id_uuid_hospital,
    id_uuid_admin: adminData.id, // admin uuid 추가
    name,
    searchkey,
    search_key,
    address_full_road,
    address_full_road_en,
    address_full_jibun,
    address_full_jibun_en,
    address_si,
    address_si_en,
    address_gu,
    address_gu_en,
    address_dong,
    address_dong_en,
    zipcode,
    latitude,
    longitude,
    address_detail,
    address_detail_en,
    directions_to_clinic,
    directions_to_clinic_en,
    location,
    // imageurls: hospitalFileNames,
  };
  // 편집 모드인 경우 update, 신규인 경우 insert
  let hospitalOperation;
  if (isEditMode) {
    hospitalOperation = await supabase
      .from(TABLE_HOSPITAL)
      .update(form_hospital)
      .eq('id_uuid', id_uuid_hospital)
      .select("*");
  } else {
    hospitalOperation = await supabase
      .from(TABLE_HOSPITAL)
      .insert(form_hospital)
      .select("*");
  }
  
  if (hospitalOperation.error) {
    console.log("uploadActions hospital operation error:", hospitalOperation.error);
    // return await rollbackAll(hospitalOperation.error.message);
    return {
      ...prevState,
      message: hospitalOperation.error.code || hospitalOperation.error.message,
      status: "error",
    };
  }
  
//   console.log("병원 정보 처리 완료:", isEditMode ? "업데이트" : "신규 등록");
  

// let extra_options_parsed;
// try {
//   extra_options_parsed = JSON.parse(extra_options_raw);
// } catch (error) {
//   console.error("extra_options 파싱 실패:", error);
//   return {
//     ...prevState,
//     message: "추가 옵션 데이터 파싱에 실패했습니다.",
//     status: "error",
//   };
// }


// const stringToBoolean = (value: any): boolean => {
//     if (typeof value === 'boolean') return value;
//     if (typeof value === 'string') {
//       return value.toLowerCase() === 'true' || value === '1';
//     }
//     return Boolean(value);
//   };

//   const extra_options = {
//     has_private_recovery_room: stringToBoolean(extra_options_parsed.has_private_recovery_room),
//     has_parking: stringToBoolean(extra_options_parsed.has_parking),
//     has_cctv: stringToBoolean(extra_options_parsed.has_cctv),
//     has_night_counseling: stringToBoolean(extra_options_parsed.has_night_counseling),
//     has_female_doctor: stringToBoolean(extra_options_parsed.has_female_doctor),
//     has_anesthesiologist: stringToBoolean(extra_options_parsed.has_anesthesiologist),
//     specialist_count: parseInt(extra_options_parsed.specialist_count) || 0,
//   };
  ///////////////////////////////
  // hospital_details 테이블 입력 
  // extra options 포함
  
  const sns_content_agreement_raw = formData.get("sns_content_agreement") as string;
  const sns_content_agreement = sns_content_agreement_raw === 'null' ? null : Number(sns_content_agreement_raw) as 1 | 0;
  
  // hospital_details 데이터 생성 함수
  const createHospitalDetailData = (formData: FormData, id_uuid: string, id_hospital: number) => {
    // const available_languages_raw = formData.get('available_languages') as string;
    // const available_languages = available_languages_raw ? JSON.parse(available_languages_raw) : [];
  
    // introduction 필드 디버깅
    const introduction = formData.get("introduction") as string || '';
    const introduction_en = formData.get("introduction_en") as string || '';
    return {
      id_hospital: id_hospital,
      id_uuid_hospital: id_uuid,
      // has_private_recovery_room: extra_options.has_private_recovery_room,
      // has_parking: extra_options.has_parking,
      // has_cctv: extra_options.has_cctv,
      // has_night_counseling: extra_options.has_night_counseling,
      // has_female_doctor: extra_options.has_female_doctor,
      // has_anesthesiologist: extra_options.has_anesthesiologist,
      // specialist_count: extra_options.specialist_count,
      // has_private_recovery_room: false,
      // has_parking: false,
      // has_cctv: false,
      // has_night_counseling: false,
      // has_female_doctor: false,
      // has_anesthesiologist: false,
      // specialist_count: 0,
      email: formData.get("email") as string || '',
      tel: formData.get("tel") as string || '',
      kakao_talk: formData.get("kakao_talk") as string || '',
      line: formData.get("line") as string || '',
      we_chat: formData.get("we_chat") as string || '',
      whats_app: formData.get("whats_app") as string || '',
      telegram: formData.get("telegram") as string || '',
      facebook_messenger: formData.get("facebook_messenger") as string || '',
      instagram: formData.get("instagram") as string || '',
      tiktok: formData.get("tiktok") as string || '',
      youtube: formData.get("youtube") as string || '',
      other_channel: formData.get("other_channel") as string || '',
      map: '',
      etc: '',
      sns_content_agreement: sns_content_agreement,
      // available_languages: available_languages,
      introduction: introduction,
      introduction_en: introduction_en,
    };
  };
  
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
  
  // id_hospital을 삭제하면 사용하지않을 코드 레거시 
  const { data: hospitalData, error: hospitalError } = await supabase
  .from(TABLE_HOSPITAL)
  .select("id_unique")
  .eq('id_uuid', id_uuid_hospital)
  .single();

  if (hospitalError) {
    console.error("병원 데이터 조회 실패:", hospitalError);
    return {
      ...prevState,
      message: hospitalError.code || hospitalError.message,
      status: "error",
    };
  }
  
  const id_hospital = hospitalData.id_unique;

  let detailOperation;
  if (isEditMode && existingDetail) {
    // 편집 모드이고 기존 데이터가 있으면 UPDATE
    const updateData = createHospitalDetailData(formData, id_uuid_hospital, id_hospital);
    
    detailOperation = await supabase
      .from(TABLE_HOSPITAL_DETAIL)
      .update(updateData)
      .eq('id_uuid_hospital', id_uuid_hospital);
  } else {
    // 신규 등록이거나 기존 데이터가 없으면 INSERT
    const insertData = createHospitalDetailData(formData, id_uuid_hospital, id_hospital);

    detailOperation = await supabase
      .from(TABLE_HOSPITAL_DETAIL)
      .insert([insertData]);
  }
  
  if (detailOperation.error) {
    // 에러 타입에 따른 사용자 친화적 메시지 생성
    let userMessage = "병원 정보 저장 중 오류가 발생했습니다.";
    
    if (detailOperation.error.code === '23505') {
      userMessage = "이미 등록된 병원 정보입니다. 중복된 데이터가 있는지 확인해주세요.";
    } else if (detailOperation.error.code === '23503') {
      userMessage = "연결된 데이터에 문제가 있습니다. 관리자에게 문의해주세요.";
    } else if (detailOperation.error.code === '22P02') {
      userMessage = "입력된 데이터 형식이 올바르지 않습니다. 숫자 필드를 확인해주세요.";
    } else if (detailOperation.error.message.includes('latitude') || detailOperation.error.message.includes('longitude')) {
      userMessage = "위치 정보(위도/경도) 형식이 올바르지 않습니다. 주소를 다시 검색해주세요.";
    } else if (detailOperation.error.message.includes('double precision')) {
      userMessage = "숫자 형식 데이터에 오류가 있습니다. 입력값을 확인해주세요.";
    }
    
    return {
      ...prevState,
      message: userMessage,
      status: "error",
      errorDetails: {
        code: detailOperation.error.code,
        message: detailOperation.error.message,
        operation: isEditMode && existingDetail ? "업데이트" : "신규 등록"
      }
    };
  }
  
  // 모든 insert가 성공적으로 완료되면 admin 테이블의 id_uuid_hospital 업데이트
  if (current_user_uid) {
    // 현재 사용자의 admin 정보 확인
    const { data: currentAdmin, error: adminSelectError } = await supabase
      .from(TABLE_ADMIN)
      .select("id, id_uuid_hospital")
      .eq("id_auth_user", current_user_uid)
      .maybeSingle();
    
    if (adminSelectError) {
      console.error("Admin 정보 조회 실패:", adminSelectError);
    } else if (currentAdmin && !currentAdmin.id_uuid_hospital) {
      // id_uuid_hospital이 비어있으면 업데이트
      
      const { error: adminUpdateError } = await supabase
        .from(TABLE_ADMIN)
        .update({ id_uuid_hospital: id_uuid_hospital })
        .eq("id_auth_user", current_user_uid);
      
      if (adminUpdateError) {
        console.error("Admin 테이블 업데이트 실패:", adminUpdateError);
      } else {
        console.log("Admin 테이블 업데이트 성공 - 병원 정보 연결 완료");
      }
    } else if (currentAdmin?.id_uuid_hospital) {
      console.log("Admin 테이블 - 이미 병원 정보가 연결되어 있음:", currentAdmin.id_uuid_hospital);
    } else {
      console.log("Admin 정보를 찾을 수 없음");
    }
  } else {
    console.log("현재 사용자 UID가 제공되지 않았습니다.");
  }
  
  // 피드백이 있는 경우 저장
  const feedback = formData.get('feedback');
  if (feedback) {
    const { error: feedbackError } = await supabase
      .from(TABLE_FEEDBACKS)
      .insert([
        {
          feedback_content: feedback,
          id_uuid_hospital: id_uuid_hospital,
        },
      ]);
  
    if (feedbackError) {
      console.error('피드백 저장 실패:', feedbackError);
      // 피드백 저장 실패는 전체 프로세스를 중단하지 않습니다
    }
  }

  // 연락처 정보 저장
  const contactsInfoRaw = formData.get('contacts_info') as string;
  if (contactsInfoRaw) {
    try {
      const contactsInfo = JSON.parse(contactsInfoRaw);
      console.log('연락처 정보 저장 시작:', contactsInfo);

      // 기존 연락처 정보 삭제 (편집 모드인 경우)
      if (isEditMode) {
        await supabase
          .from(TABLE_CONTACTS)
          .delete()
          .eq('id_uuid_hospital', id_uuid_hospital);
      }

      const contactsToInsert: any[] = [];


        // 진료문의 전화 번호 
      if (contactsInfo.consultationPhone && contactsInfo.consultationPhone.trim() !== '') 
      {
        contactsToInsert.push({
          id_uuid_hospital: id_uuid_hospital,
          type: 'consultation_phone',
          value: contactsInfo.consultationPhone.trim(),
          sequence: 1
        });
      }

      // 상담 관리자 전화번호 (배열)
      if (contactsInfo.consultationManagerPhones && Array.isArray(contactsInfo.consultationManagerPhones)) {
        contactsInfo.consultationManagerPhones.forEach((phone: string, index: number) => {
          if (phone && phone.trim() !== '') {
            contactsToInsert.push({
              id_uuid_hospital: id_uuid_hospital,
              type: 'consult_manager_phone',
              value: phone.trim(),
              sequence: index
            });
          }
        });
      }
      

      // SMS 발신 번호
      if (contactsInfo.smsPhone && contactsInfo.smsPhone.trim() !== '') {
        contactsToInsert.push({
          id_uuid_hospital: id_uuid_hospital,
          type: 'sms_phone',
          value: contactsInfo.smsPhone.trim(),
          sequence: 1
        });
      }

      // 이벤트 관리자 번호
      if (contactsInfo.eventManagerPhone && contactsInfo.eventManagerPhone.trim() !== '') {
        contactsToInsert.push({
          id_uuid_hospital: id_uuid_hospital,
          type: 'event_manager_phone',
          value: contactsInfo.eventManagerPhone.trim(),
          sequence: 1
        });
      }

      // 마케팅 이메일 (배열)
      if (contactsInfo.marketingEmails && Array.isArray(contactsInfo.marketingEmails)) {
        contactsInfo.marketingEmails.forEach((email: string, index: number) => {
          if (email && email.trim() !== '') {
            contactsToInsert.push({
              id_uuid_hospital: id_uuid_hospital,
              type: 'marketing_email',
              value: email.trim(),
              sequence: index
            });
          }
        });
      }

      // 연락처 정보 저장
      if (contactsToInsert.length > 0) {
        const { error: contactsError } = await supabase
          .from(TABLE_CONTACTS)
          .insert(contactsToInsert);

        if (contactsError) {
          console.error('연락처 정보 저장 실패:', contactsError);
          // 연락처 저장 실패는 전체 프로세스를 중단하지 않습니다
        } else {
          console.log('연락처 정보 저장 완료:', contactsToInsert.length, '개 항목');
        }
      }
    } catch (error) {
      console.error('연락처 정보 파싱 실패:', error);
    }
  }
  
//   revalidatePath("/", "layout");
  console.log("uploadActions No error uploadActions ");
  
  // const endTime = Date.now();
  // const totalTime = endTime - startTime;
  // console.log("uploadActions 완료:", new Date().toISOString());
  // console.log(`총 처리 시간: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}초)`);
  
  return {
    ...prevState,
    message: "성공적으로 등록되었습니다.",
    status: "success",
  };
  }