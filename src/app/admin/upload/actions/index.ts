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
  STORAGE_DOCTOR_IMG
} from '@/constants/tables';
import { createClient } from '@supabase/supabase-js';
import { HospitalDetailData } from '@/types/hospital';

export const uploadActions = async (prevState: any, formData: FormData) => {
  const startTime = Date.now();
  console.log("uploadActions 시작:", new Date().toISOString());
  
  // 트랜잭션 및 롤백을 위한 변수들
  let uploadedImages: string[] = [];
  let uploadedDoctorImages: string[] = [];
  let insertedHospitalId: string | null = null;
  let insertedDoctorId: string | null = null;
  
  // 에러 발생 시 모든 작업을 롤백하는 함수
  const rollbackAll = async (errorMessage: string) => {
    console.log("롤백 시작:", errorMessage);
    
    // 1. 업로드된 병원 이미지 삭제
    if (uploadedImages.length > 0) {
      try {
        await supabase.storage
          .from(STORAGE_IMAGES)
          .remove(uploadedImages.map(url => {
            const path = url.replace(`${process.env.NEXT_PUBLIC_IMG_URL}`, '');
            return path;
          }));
        console.log("병원 이미지 롤백 완료");
      } catch (e) {
        console.error("병원 이미지 롤백 실패:", e);
      }
    }
    
    // 2. 업로드된 의사 이미지 삭제
    if (uploadedDoctorImages.length > 0) {
      try {
        await supabase.storage
          .from(STORAGE_IMAGES)
          .remove(uploadedDoctorImages.map(url => {
            const path = url.replace(`${process.env.NEXT_PUBLIC_IMG_URL}`, '');
            return path;
          }));
        console.log("의사 이미지 롤백 완료");
      } catch (e) {
        console.error("의사 이미지 롤백 실패:", e);
      }
    }
    
    // 3. 삽입된 데이터베이스 레코드들 삭제 (역순으로)
    if (id_uuid) {
      try {
        // hospital_treatment 삭제
        await supabase
          .from(TABLE_HOSPITAL_TREATMENT)
          .delete()
          .eq('id_uuid_hospital', id_uuid);
        
        // hospital_details 삭제
        await supabase
          .from(TABLE_HOSPITAL_DETAIL)
          .delete()
          .eq('id_uuid_hospital', id_uuid);
          
        // hospital_business_hour 삭제
        await supabase
          .from(TABLE_HOSPITAL_BUSINESS_HOUR)
          .delete()
          .eq('id_uuid_hospital', id_uuid);
          
        // doctor 삭제
        await supabase
          .from(TABLE_DOCTOR)
          .delete()
          .eq('id_uuid_hospital', id_uuid);
          
        // hospital 삭제
        await supabase
          .from(TABLE_HOSPITAL)
          .delete()
          .eq('id_uuid', id_uuid);
          
        console.log("데이터베이스 롤백 완료");
      } catch (e) {
        console.error("데이터베이스 롤백 실패:", e);
      }
    }
    
    console.log("롤백 완료");
    
    return {
      ...prevState,
      message: errorMessage,
      status: "error",
    };
  };

  // const supabase = createClient();


  const name = formData.get("name") as string;
  const surgeries = formData.get("surgeries") as string;
  const searchkey = formData.get("searchkey") as string;
  const search_key = formData.get("search_key") as string;
  // const address = formData.get("address") as string;

  const address_full_road = formData.get("address_full_road") as string;
  const address_full_road_en = formData.get("address_full_road_en") as string;
  const address_full_jibun = formData.get("address_full_jibun") as string;
  const address_full_jibun_en = formData.get("address_full_jibun_en") as string;
  const address_si = formData.get("address_si") as string;
  const address_si_en = formData.get("address_si_en") as string;
  const address_gu = formData.get("address_gu") as string;
  const address_gu_en = formData.get("address_gu_en") as string;
  const address_dong = formData.get("address_dong") as string;
  const address_dong_en = formData.get("address_dong_en") as string;
  const zipcode = formData.get("zipcode") as string;
  const latitudeRaw = formData.get("latitude") as string;
  const longitudeRaw = formData.get("longitude") as string;
  const address_detail = formData.get("address_detail") as string;
  const address_detail_en = formData.get("address_detail_en") as string;
  const directions_to_clinic = formData.get("directions_to_clinic") as string;
  const directions_to_clinic_en = formData.get("directions_to_clinic_en") as string;

  // 숫자 필드는 파싱해줘야 안전합니다!
  const latitude = latitudeRaw ? Number(latitudeRaw) : undefined;
  const longitude = longitudeRaw ? Number(longitudeRaw) : undefined;


  // const address_detail = formData.get("address_detail") as string; 
  //  const latitude = formData.get("latitude") as string;
  // const longitude = formData.get("longitude") as string;
  const location = formData.get("location") as string;
  // const selected_treatments = formData.get("selected_treatments") as string;
  const selected_treatments = (formData.get("selected_treatments") as string).split(",").map((treatment: string) => treatment.trim());
  const opening_hours_raw = formData.get("opening_hours") as string;
  const extra_options_raw = formData.get("extra_options") as string;
  const treatment_options = formData.get("treatment_options") as string;
  const price_expose_raw = formData.get("price_expose") as string;
  const etc = formData.get("etc") as string;
  
  // 가격노출 설정 파싱 (string을 boolean으로 변환)
  const price_expose = price_expose_raw === 'true';
  console.log("Actions - price_expose:", {
    raw: price_expose_raw,
    parsed: price_expose,
    type: typeof price_expose
  });
  
  console.log("Actions - etc 정보:", etc);
  
  // 상품옵션 데이터 파싱
  let treatment_options_parsed = [];
  
  console.log("Actions - treatment_options 원본:", treatment_options);
  console.log("Actions - treatment_options 타입:", typeof treatment_options);
  
  if (treatment_options) {
    try {
      treatment_options_parsed = JSON.parse(treatment_options);
      console.log("Actions - treatment_options 파싱 성공:", treatment_options_parsed);
      console.log("Actions - 파싱된 배열 길이:", treatment_options_parsed.length);
    } catch (error) {
      console.error("Actions - treatment_options 파싱 에러:", error);
      treatment_options_parsed = [];
    }
  } else {
    console.log("Actions - treatment_options가 없습니다.");
  }

  // opening_hours JSON 파싱
  let opening_hours_parsed;
  try {
    opening_hours_parsed = JSON.parse(opening_hours_raw);
  } catch (error) {
    console.error("opening_hours 파싱 실패:", error);
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

  console.log("파싱된 opening_hours (배열):", opening_hours_parsed);
  
  // extra_options JSON 파싱 및 boolean 변환
  let extra_options_parsed;
  try {
    extra_options_parsed = JSON.parse(extra_options_raw);
  } catch (error) {
    console.error("extra_options 파싱 실패:", error);
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
    specialistCount: parseInt(extra_options_parsed.specialistCount) || 0,
  };

  console.log("변환된 opening_hours (배열):", opening_hours_parsed);
  console.log("변환된 extra_options:", extra_options);
  
  // 클라이언트에서 이미 업로드된 이미지 URL들 받기
  const clinic_image_urls_raw = formData.get("clinic_image_urls") as string;
  const doctor_image_urls_raw = formData.get("doctor_image_urls") as string;
  const doctors_raw = formData.get("doctors") as string; // 의사 정보
  const id_uuid = formData.get("id_uuid") as string; // 클라이언트에서 생성한 UUID 사용
  const current_user_uid = formData.get("current_user_uid") as string; // 현재 로그인한 사용자 UID

  // 이미지 URL 및 의사 정보 파싱
  let clinic_image_urls: string[] = [];
  let doctor_image_urls: string[] = [];
  let doctors_parsed: any[] = [];
  
  try {
    if (clinic_image_urls_raw) {
      clinic_image_urls = JSON.parse(clinic_image_urls_raw);
    }
    if (doctor_image_urls_raw) {
      doctor_image_urls = JSON.parse(doctor_image_urls_raw);
    }
    if (doctors_raw) {
      doctors_parsed = JSON.parse(doctors_raw);
      console.log("의사 정보 파싱 완료:", doctors_parsed);
    }
  } catch (error) {
    console.error("데이터 파싱 오류:", error);
    return {
      ...prevState,
      message: "데이터 파싱에 실패했습니다.",
      status: "error",
    };
  }
  
  console.log("받은 이미지 URL 정보:");
  console.log("  - 병원 이미지:", clinic_image_urls.length, "개");
  console.log("  - 의사 이미지:", doctor_image_urls.length, "개");
  console.log("  - 병원 UUID:", id_uuid);

  // 이미지 URL 검증 (존재하는지 확인)
  if (clinic_image_urls.length === 0) {
    return {
      ...prevState,
      message: "병원 이미지가 업로드되지 않았습니다.",
      status: "error",
    };
  }

  console.log("uploadActions") 

  // 이미지는 이미 업로드됨 - URL만 사용
  const hospitalFileNames = clinic_image_urls;
  
  // 이미 업로드된 이미지 URL을 추적용 배열에 추가
  uploadedImages.push(...clinic_image_urls);
  uploadedDoctorImages.push(...doctor_image_urls);

  // legacy id . 나중에 id_uuid로 완전전환후 삭제해야됨 
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
  // const id_surgeries = (surgeries && surgeries.length > 0) ? surgeries.split(",") : [1010];
  const form_hospital = {
    id_unique: nextIdUnique,  // legacy id  나중에 삭제 
    id_uuid,
    name,
    // id_surgeries: id_surgeries,
    searchkey: name,
    search_key: name,

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
    imageurls: hospitalFileNames,
  };

  const insertHospital = await supabase
    .from(TABLE_HOSPITAL)
    .insert(form_hospital)
    .select("*");

  console.log("uploadActions insertHospital error 1 : ", insertHospital.error);
  if (insertHospital.error) {
    console.log("uploadActions insertHospital error 2 : ", insertHospital.error);
    return await rollbackAll(insertHospital.error.message);
  }


  ///////////////////////////////
  // doctor 테이블 입력 

  console.log("Doctor 정보 처리 시작");
  console.log("  - doctor 이미지 URL 개수:", doctor_image_urls.length);
  console.log("  - 의사 정보 개수:", doctors_parsed.length);

  // 의사 정보가 있는 경우에만 처리
  if (doctors_parsed.length > 0) {
    // 각 의사마다 별도 레코드로 insert
    for (let i = 0; i < doctors_parsed.length; i++) {
      const doctor = doctors_parsed[i];
      const imageUrl = doctor.imageUrl || ''; // 해당 의사의 이미지 URL
      
      const form_doctor = {
        id_hospital: null,
        id_uuid_hospital: id_uuid,
        image_url: imageUrl, // 단일 URL로 저장 (의사 이미지는 1개만 허용)
        bio: doctor.bio || "",
        name: doctor.name || "",
        chief: doctor.chief || 0, // 대표원장 여부 (1 또는 0)
      };

      console.log(`Doctor ${i + 1} insert 시도:`, {
        name: doctor.name,
        bio: doctor.bio,
        imageUrl: imageUrl,
        chief: doctor.chief
      });

      const insertDoctor = await supabase
        .from(TABLE_DOCTOR)
        .insert(form_doctor)
        .select("*");

      if (insertDoctor.error) {
        console.log(`Doctor ${i + 1} insert 오류:`, insertDoctor.error);
        return await rollbackAll(insertDoctor.error.message);
      }

      console.log(`Doctor ${i + 1} insert 성공:`, insertDoctor.data);
    }
    
    console.log("모든 Doctor 정보 insert 완료");
  } else {
    console.log("등록된 의사 정보가 없습니다.");
  }




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
      id_uuid_hospital: id_uuid,
      day_of_week: hour.day, // 영어 요일 그대로 저장
      open_time: openTime,
      close_time: closeTime,
      status: status,
    };
    
    businessHourInserts.push(form_business_hour);
  }

  console.log("영업시간 데이터:", businessHourInserts);

  // 모든 영업시간 데이터를 한 번에 insert
  const insertBusinessHour = await supabase
    .from(TABLE_HOSPITAL_BUSINESS_HOUR)
    .insert(businessHourInserts)
    .select("*");

  if (insertBusinessHour.error) {
    console.log("uploadActions error 3 : ", insertBusinessHour.error);
    return await rollbackAll(insertBusinessHour.error.message);
  }





  ///////////////////////////////
  // treatment 선택 테이블 입력 

  if (treatment_options_parsed.length > 0) {
    console.log("시술 상품옵션 데이터 처리 시작");
    
    // treatment 테이블에서 code와 id_uuid 매핑 데이터 가져오기
    const { data: treatmentData, error: treatmentError } = await supabase
      .from(TABLE_TREATMENT)
      .select('code, id_uuid');
    
    if (treatmentError) {
      console.error("treatment 테이블 조회 실패:", treatmentError);
      return await rollbackAll("시술 데이터 조회에 실패했습니다.");
    }
    
    // code를 키로 하는 매핑 맵 생성
    const codeToUuidMap = new Map();
    treatmentData?.forEach((treatment: any) => {
      codeToUuidMap.set(treatment.code, treatment.id_uuid);
    });
    
    console.log("시술 코드 매핑 맵:", Object.fromEntries(codeToUuidMap));
    
    // hospital_treatment 테이블에 insert할 데이터 준비
    const hospitalTreatmentInserts = [];
    
    for (const option of treatment_options_parsed) {
      const treatmentUuid = codeToUuidMap.get(option.treatmentKey);
      
      if (!treatmentUuid) {
        console.warn(`시술 코드 ${option.treatmentKey}에 해당하는 UUID를 찾을 수 없습니다.`);
        continue;
      }
      
      const hospitalTreatmentData = {
        id_uuid_hospital: id_uuid,
        id_uuid_treatment: treatmentUuid,
        option_value: option.value1 || "", // 상품명
        price: parseInt(option.value2) || 0, // 가격
        discount_price: 0, // 디폴트 0
        price_expose: price_expose ? 1 : 0, // 가격노출 설정 (체크되면 1, 해제되면 0)
      };
      
      hospitalTreatmentInserts.push(hospitalTreatmentData);
    }
    
    console.log("hospital_treatment insert 데이터:", hospitalTreatmentInserts);
    
    if (hospitalTreatmentInserts.length > 0) {
      const { error: hospitalTreatmentError } = await supabase
        .from(TABLE_HOSPITAL_TREATMENT)
        .insert(hospitalTreatmentInserts);
      
      if (hospitalTreatmentError) {
        console.log("uploadActions hospital_treatment error:", hospitalTreatmentError);
        return await rollbackAll(hospitalTreatmentError.message);
      }
      
      console.log("hospital_treatment 데이터 insert 완료");
    }
    
    // 기타 시술 정보가 있는 경우 별도 레코드로 저장
    if (etc && etc.trim() !== "") {
      console.log("기타 시술 정보 저장 중:", etc);
      
      const etcTreatmentData = {
        id_uuid_hospital: id_uuid,
        id_uuid_treatment: null, // 기타 정보는 특정 시술에 속하지 않음
        option_value: "기타", // 옵션명을 "기타"로 설정
        price: 0, // 기타 정보는 가격 없음
        discount_price: 0,
        price_expose: 0, // 기타 정보는 가격 노출하지 않음
        etc: etc.trim() // 기타 정보 내용
      };
      
      const { error: etcTreatmentError } = await supabase
        .from(TABLE_HOSPITAL_TREATMENT)
        .insert([etcTreatmentData]);
      
      if (etcTreatmentError) {
        console.log("uploadActions hospital_treatment (기타) error:", etcTreatmentError);
        return await rollbackAll(etcTreatmentError.message);
      }
      
      console.log("기타 시술 정보 저장 완료");
    }
  }

  ///////////////////////////////
  // hospital_details 테이블 입력 
  // extra options 포함

  const sns_channels_raw = formData.get("sns_channels") as string;
  const sns_channels = sns_channels_raw ? JSON.parse(sns_channels_raw) : {};

  const sns_content_agreement = formData.get('sns_content_agreement') as string;
  const sns_content_agreement_value = sns_content_agreement === 'null' ? null : parseInt(sns_content_agreement) as 1 | 0;

  const hospitalDetailDefaultValue = (
    formData: FormData,
    id_uuid: string
  ): HospitalDetailData => {
    return {
      tel: formData.get('tel') as string,
      email: formData.get('email') as string,
      kakao_talk: sns_channels.kakaoTalk,
      line: sns_channels.line,
      we_chat: sns_channels.weChat,
      whats_app: sns_channels.whatsApp,
      telegram: sns_channels.telegram,
      facebook_messenger: sns_channels.facebookMessenger,
      instagram: sns_channels.instagram,
      tiktok: sns_channels.tiktok,
      youtube: sns_channels.youtube,
      other_channel: sns_channels.other_channel,
      map: '',
      etc: '',
      has_private_recovery_room: false,
      has_parking: false,
      has_cctv: false,
      has_night_counseling: false,
      has_female_doctor: false,
      has_anesthesiologist: false,
      specialist_count: 0,
      sns_content_agreement: sns_content_agreement_value,
    };
  };

  const { error } = await supabase
    .from(TABLE_HOSPITAL_DETAIL)
    .insert([hospitalDetailDefaultValue(formData, id_uuid)]);

  if (error) {
    console.log("uploadActions hospital_details error:", error);
    return await rollbackAll(error.message);
  }

  // 모든 insert가 성공적으로 완료되면 admin 테이블의 id_uuid_hospital 업데이트
  if (current_user_uid) {
    console.log("Admin 테이블 업데이트 시작 - 현재 사용자 UID:", current_user_uid);
    
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
      console.log("Admin 테이블 업데이트 - 병원 UUID 연결:", id_uuid);
      
      const { error: adminUpdateError } = await supabase
        .from(TABLE_ADMIN)
        .update({ id_uuid_hospital: id_uuid })
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

  revalidatePath("/", "layout");
  console.log("uploadActions No error uploadActions ");

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  console.log("uploadActions 완료:", new Date().toISOString());
  console.log(`총 처리 시간: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}초)`);

  return {
    ...prevState,
    message: "success upload!",
    status: "success",
  };
};


  

// console.log("uploadActions") 
//   const filenames = await Promise.all(
//     imageurls
//       .filter((entry) => entry instanceof File)
//       .map(async (e) => {
//         const upload = await supabase.storage
//           .from("images")
//           .upload(`hospitalimg/${e.name}`, e);

//         if (upload.error) {
//           console.log("uploadActions filenames upload.error: ", upload.error) ;
//           return {
//             ...prevState,
//             message: upload.error.message,
//             status: "error",
//           };
//         }
//         console.log("uploadActions filenames return") ;
//         return `${process.env.NEXT_PUBLIC_IMG_URL}${upload.data?.path}`;
//       })
//   );

//   if (filenames.find((e) => e.message)) {
//     console.log("uploadActions -a filenames.find error: ", filenames[0].message) ;
//     return {
//       ...prevState,
//       message: filenames[0].message,
//       status: "error",
//     };
//   }

//   const lastUnique = await supabase
//     .from("hospital")
//     .select("id_unique")
//     .order("id_unique", { ascending: false })
//     .limit(1);

//   if (!lastUnique.data || lastUnique.error) {
//     console.log("uploadActions -b") ;
//     return {
//       ...prevState,
//       message: lastUnique.error.code || lastUnique.error.message,
//       status: "error",
//     };
//   }

//   const form = {
//     id_unique: lastUnique.data[0].id_unique + 1,
//     name,
//     id_surgeries: surgeries.split(","),
//     searchkey,
//     search_key,
//     address,
//     address_detail,
//     latitude,
//     longitude,
//     location,
//     imageurls: filenames,
//   };

//   const insertHospital = await supabase
//     .from("hospital")
//     .insert(form)
//     .select("*");

//   const removeStorageImg = async () => {
//     console.log("uploadActions removeStorageImg");
//     const filenames = imageurls.filter((entry) => entry instanceof File);

//     const remove = await supabase.storage
//       .from("images")
//       .remove(filenames.map((e) => `hospitalimg/${e.name}`));

//     const error = remove.error || insertHospital.error;

//     if (error) {
//       console.log("uploadActions removeStorageImg error : ", error);
//       return {
//         ...prevState,
//         message: error.message,
//         status: "error",
//       };
//     }
//   } 

//   console.log("uploadActions insertHospital error 1 : ", insertHospital.error);
//   if (insertHospital.error) {
//     // error 발생 시 업로드 했더 이미지 삭제
//     removeStorageImg();
//     console.log("uploadActions insertHospital error 2 : ", insertHospital.error);
//     return {
//       ...prevState,
//       message: insertHospital.error.message,
//       status: "error",
//     };
//   }

//   const hospitalDetailDefaultValue = (id_hospital: string) => ({
//     id_hospital,
//     tel: "0507-1433-0210",
//     kakaotalk: "",
//     homepage: "http://www.reoneskin.com",
//     instagram: "https://www.instagram.com/reone__clinic/",
//     facebook: "",
//     blog: "https://blog.naver.com/reone21",
//     youtube: "https://www.youtube.com/watch?v=Yaa1HZJXIJY",
//     ticktok:
//       "https://www.tiktok.com/@vslineclinicglobal/video/7255963489192168711?is_from_webapp=1&sender_device=pc&web_id=7373256937738012176",
//     snapchat: "",
//     map: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.348038374547!2d127.02511807637043!3d37.52329227204984!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca39ea4618cdb%3A0xd0ad0677746be4c7!2z7Jyg7KeE7Iqk7J2Y7JuQ!5e0!3m2!1sko!2skr!4v1716566609639!5m2!1sko!2skr",
//     desc_address: "327, Dosan-daero, Gangnam-gu, Seoul, Republic of Korea",
//     desc_openninghour: `
//       MON
//       10:00 - 19:00
//       13:00 - 14:00 BreakTime
//       TUE
//       10:00 - 19:00
//       13:00 - 14:00 BreakTime
//       WED
//       10:00 - 19:00
//       13:00 - 14:00 BreakTime
//       THU
//       10:00 - 19:00
//       13:00 - 14:00 BreakTime
//       FRI
//       10:00 - 19:00
//       13:00 - 14:00 BreakTime
//       SAT
//       10:00 - 16:00
//       SUN
//       Regular holiday (Event Week SunDay)
//     `,
//     desc_facilities:
//       "Separate Male/Female Restrooms, Wireless Internet, Parking, Valet Parking",
//     desc_doctors_imgurls: [
//       "https://tqyarvckzieoraneohvv.supabase.co/storage/v1/object/public/images/doctors/doctor_reone1.png",
//       "https://tqyarvckzieoraneohvv.supabase.co/storage/v1/object/public/images/doctors/doctor_reone2.png",
//       "https://tqyarvckzieoraneohvv.supabase.co/storage/v1/object/public/images/doctors/doctor_reone3.png",
//     ],
//     etc: "",
//   });

//   const { error } = await supabase
//     .from("hospital_details")
//     .insert([hospitalDetailDefaultValue(insertHospital.data[0].id_unique)]);
  
//   if (error) {
//     console.log("uploadActions error 3 : ", error);
//     removeStorageImg();

//     return {
//       ...prevState,
//       message: error.message,
//       status: "error",
//     };
//   }

//   revalidatePath("/", "layout");
//   console.log("uploadActions No error uploadActions ");
//   return {
//     ...prevState,
//     message: "success upload!",
//     status: "success",
//   };
// };
