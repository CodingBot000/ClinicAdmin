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


export const uploadActions = async (prevState: any, formData: FormData) => {
  // const startTime = Date.now();
  // console.log("uploadActions 시작:", new Date().toISOString());
  
  // 편집 모드 여부와 기존 데이터 확인
  const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
  const existingDataRaw = formData.get("existing_data")?.toString();
  const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : null;

  // 트랜잭션 및 롤백을 위한 변수들
  let newlyUploadedImages: string[] = []; // 새로 업로드된 이미지 URL
  let newlyUploadedDoctorImages: string[] = []; // 새로 업로드된 의사 이미지 URL
  let existingImages: string[] = []; // 기존 이미지 URL
  let existingDoctorImages: string[] = []; // 기존 의사 이미지 URL
  let insertedHospitalId: string | null = null;
  let insertedDoctorId: string | null = null;
  
  // 에러 발생 시 모든 작업을 롤백하는 함수
  const rollbackAll = async (errorMessage: string) => {
    console.log("롤백 시작:", errorMessage);
    
    // 1. 새로 업로드된 병원 이미지만 삭제
    if (newlyUploadedImages.length > 0) {
      try {
        // 스토리지에서 이미지 파일 삭제
        const imagePaths = newlyUploadedImages.map(url => {
          const path = url.replace(`${process.env.NEXT_PUBLIC_IMG_URL}`, '');
          return path;
        });
        
        console.log("삭제할 병원 이미지:", imagePaths);
        const { error: removeError } = await supabase.storage
          .from(STORAGE_IMAGES)
          .remove(imagePaths);

        if (removeError) {
          console.error("병원 이미지 삭제 실패:", removeError);
        }

        // 편집 모드인 경우 hospital 테이블의 imageurls 복원
        if (isEditMode) {
          const { error: updateError } = await supabase
            .from(TABLE_HOSPITAL)
            .update({ imageurls: existingImages })
            .eq('id_uuid', id_uuid_hospital);
          
          if (updateError) {
            console.error("병원 이미지 URL 복원 실패:", updateError);
          }
        }
      } catch (e) {
        console.error("병원 이미지 롤백 실패:", e);
      }
    }
    
    // 2. 새로 업로드된 의사 이미지만 삭제
    if (newlyUploadedDoctorImages.length > 0) {
      try {
        // 스토리지에서 이미지 파일 삭제
        const imagePaths = newlyUploadedDoctorImages.map(url => {
          const path = url.replace(`${process.env.NEXT_PUBLIC_IMG_URL}`, '');
          return path;
        });
        
        console.log("삭제할 의사 이미지:", imagePaths);
        const { error: removeError } = await supabase.storage
          .from(STORAGE_IMAGES)
          .remove(imagePaths);

        if (removeError) {
          console.error("의사 이미지 삭제 실패:", removeError);
        }

        // 편집 모드인 경우 doctor 테이블의 image_url 복원
        if (isEditMode && initial_doctors_parsed) {
          for (const doctor of initial_doctors_parsed) {
            if (doctor.id_uuid) {
              const { error: updateError } = await supabase
                .from(TABLE_DOCTOR)
                .update({ image_url: doctor.image_url })
                .eq('id_uuid', doctor.id_uuid);
              
              if (updateError) {
                console.error(`의사 ${doctor.name}의 이미지 URL 복원 실패:`, updateError);
              }
            }
          }
        }
      } catch (e) {
        console.error("의사 이미지 롤백 실패:", e);
      }
    }
    
    // 3. 삽입된 데이터베이스 레코드들 삭제
    if (id_uuid_hospital) {
      try {
        // 편집 모드가 아닐 때만 전체 삭제 수행
        if (!isEditMode) {
          await supabase
            .from(TABLE_HOSPITAL_TREATMENT)
            .delete()
            .eq('id_uuid_hospital', id_uuid_hospital);
          
          await supabase
            .from(TABLE_HOSPITAL_DETAIL)
            .delete()
            .eq('id_uuid_hospital', id_uuid_hospital);
            
          await supabase
            .from(TABLE_HOSPITAL_BUSINESS_HOUR)
            .delete()
            .eq('id_uuid_hospital', id_uuid_hospital);
            
          await supabase
            .from(TABLE_DOCTOR)
            .delete()
            .eq('id_uuid_hospital', id_uuid_hospital);
            
          await supabase
            .from(TABLE_HOSPITAL)
            .delete()
            .eq('id_uuid', id_uuid_hospital);
        } else {
          // 편집 모드일 때는 원래 데이터로 복원
          if (existingData) {
            // hospital 테이블 복원
            await supabase
              .from(TABLE_HOSPITAL)
              .update(existingData.hospital)
              .eq('id_uuid', id_uuid_hospital);

            // doctor 테이블 복원
            if (existingData.doctors) {
              for (const doctor of existingData.doctors) {
                if (doctor.id_uuid) {
                  await supabase
                    .from(TABLE_DOCTOR)
                    .update(doctor)
                    .eq('id_uuid', doctor.id_uuid);
                }
              }
            }
          }
        }
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
  const latitude = latitudeRaw ? Number(latitudeRaw) : 0;
  const longitude = longitudeRaw ? Number(longitudeRaw) : 0;


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
    specialist_count: parseInt(extra_options_parsed.specialist_count) || 0,
  };

  console.log("변환된 opening_hours (배열):", opening_hours_parsed);
  console.log("변환된 extra_options:", extra_options);
  
  // 클라이언트에서 이미 업로드된 이미지 URL들 받기
  const clinic_image_urls_raw = formData.get("clinic_image_urls") as string;
  const doctor_image_urls_raw = formData.get("doctor_image_urls") as string;
  const doctors_raw = formData.get("doctors") as string; // 의사 정보
  const initial_doctors_raw = formData.get("initial_doctors") as string; // 초기 의사 정보
  const id_uuid_hospital = formData.get("id_uuid") as string; // 클라이언트에서 생성한 UUID 사용
  const current_user_uid = formData.get("current_user_uid") as string; // 현재 로그인한 사용자 UID

  // 이미지 URL 및 의사 정보 파싱
  let clinic_image_urls: string[] = [];
  let doctor_image_urls: string[] = [];
  let doctors_parsed: any[] = [];
  let initial_doctors_parsed: any[] = [];
  
  try {
    if (clinic_image_urls_raw) {
      clinic_image_urls = JSON.parse(clinic_image_urls_raw);
      // 편집 모드에서 기존 이미지와 새 이미지 구분
      if (isEditMode) {
        const existingUrls = existingData?.hospital.imageurls || [];
        existingImages = existingUrls;
        newlyUploadedImages = clinic_image_urls.filter(url => !existingUrls.includes(url));
      } else {
        newlyUploadedImages = clinic_image_urls;
      }
    }
    if (doctor_image_urls_raw) {
      doctor_image_urls = JSON.parse(doctor_image_urls_raw);
      // 편집 모드에서 기존 의사 이미지와 새 이미지 구분
      if (isEditMode) {
        // 기존 의사들의 이미지 URL 추출 (image_url 필드 사용)
        const existingDoctorUrls = initial_doctors_parsed
          .map(d => d.image_url)
          .filter(Boolean)
          .map(url => url.split('/').pop()); // URL에서 파일명만 추출

        existingDoctorImages = existingDoctorUrls;
        
        // 새로 업로드된 이미지 식별 (파일명 기준으로 비교)
        newlyUploadedDoctorImages = doctor_image_urls.filter(url => {
          const fileName = url.split('/').pop();
          return !existingDoctorUrls.includes(fileName);
        });
      } else {
        newlyUploadedDoctorImages = doctor_image_urls;
      }
    }
    
    if (doctors_raw) {
      doctors_parsed = JSON.parse(doctors_raw);
      console.log("최종 의사 정보 파싱 완료:", doctors_parsed);
    }
    
    if (initial_doctors_raw) {
      initial_doctors_parsed = JSON.parse(initial_doctors_raw);
      console.log("초기 의사 정보 파싱 완료:", initial_doctors_parsed);
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
  console.log("  - 병원 UUID:", id_uuid_hospital);

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
  existingImages.push(...clinic_image_urls);
  existingDoctorImages.push(...doctor_image_urls);

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

  // admin uuid 가져오기
  const { data: adminData, error: adminError } = await supabase
    .from(TABLE_ADMIN)
    .select('id')
    .eq('id_auth_user', current_user_uid)
    .single();

  if (adminError) {
    console.error('Admin UUID 조회 실패:', adminError);
    return await rollbackAll('관리자 정보를 찾을 수 없습니다.');
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
    imageurls: hospitalFileNames,
  };

  // 편집 모드인 경우 update, 신규인 경우 insert
  let hospitalOperation;
  if (isEditMode) {
    console.log("병원 정보 업데이트 시도:", id_uuid_hospital);
    hospitalOperation = await supabase
      .from(TABLE_HOSPITAL)
      .update(form_hospital)
      .eq('id_uuid', id_uuid_hospital)
      .select("*");
  } else {
    console.log("새로운 병원 정보 등록 시도");
    hospitalOperation = await supabase
      .from(TABLE_HOSPITAL)
      .insert(form_hospital)
      .select("*");
  }

  if (hospitalOperation.error) {
    console.log("uploadActions hospital operation error:", hospitalOperation.error);
    return await rollbackAll(hospitalOperation.error.message);
  }

  console.log("병원 정보 처리 완료:", isEditMode ? "업데이트" : "신규 등록");

  ///////////////////////////////
  // doctor 테이블 입력 

  console.log("Doctor 정보 처리 시작");
  console.log("  - doctor 이미지 URL 개수:", doctor_image_urls.length);
  console.log("  - 의사 정보 개수:", doctors_parsed.length);

  // 삭제할 의사 정보 찾기
  const doctorsToDelete = initial_doctors_parsed.filter(initialDoc => 
    !doctors_parsed.some(finalDoc => finalDoc.id_uuid === initialDoc.id_uuid)
  );

  // 삭제 처리
  for (const doctorToDelete of doctorsToDelete) {
    try {
      // 이미지 삭제
      if (doctorToDelete.image_url) {
        const imagePath = doctorToDelete.image_url.replace(`${process.env.NEXT_PUBLIC_IMG_URL}`, '');
        const { error: removeError } = await supabase.storage
          .from(STORAGE_IMAGES)
          .remove([imagePath]);
          
        if (removeError) throw removeError;
      }
      
      // DB에서 의사 정보 삭제
      const { error: deleteError } = await supabase
        .from(TABLE_DOCTOR)
        .delete()
        .eq('id_uuid', doctorToDelete.id_uuid);
        
      if (deleteError) throw deleteError;
    } catch (error) {
      console.error("의사 정보 삭제 실패:", error);
      return await rollbackAll("의사 정보 삭제 중 오류가 발생했습니다.");
    }
  }

  // 최종 의사 정보 처리
  for (const doctor of doctors_parsed) {
    try {
      // 기존 의사 정보 찾기 (id_uuid로 매칭)
      const existingDoctor = initial_doctors_parsed.find(d => d.id_uuid === doctor.id_uuid);
      
      // 의사 데이터 기본 구조
      const doctorData: {
        id_uuid?: string;
        id_uuid_hospital: string;
        name: string;
        bio: string;
        image_url: string;
        chief: number;
      } = {
        id_uuid_hospital,
        name: doctor.name || "",
        bio: doctor.bio || "",
        image_url: doctor.image_url || doctor.imageUrl || "", // 두 가지 필드명 모두 확인
        chief: doctor.isChief || doctor.chief ? 1 : 0
      };

      // 이미지 URL이 변경된 경우에만 이미지 처리
      if (existingDoctor && existingDoctor.image_url !== doctorData.image_url) {
        // 기존 이미지가 있고 기본 이미지가 아닌 경우에만 삭제
        if (existingDoctor.image_url && !existingDoctor.image_url.includes('/default/')) {
          const oldImagePath = existingDoctor.image_url.replace(`${process.env.NEXT_PUBLIC_IMG_URL}`, '');
          await supabase.storage
            .from(STORAGE_IMAGES)
            .remove([oldImagePath]);
        }
      }

      if (existingDoctor) {
        // id_uuid가 있으면 업데이트
        console.log(`의사 정보 업데이트: ${doctor.name} (${doctor.id_uuid})`);
        const { error: updateError } = await supabase
          .from(TABLE_DOCTOR)
          .update(doctorData)
          .eq('id_uuid', doctor.id_uuid);
          
        if (updateError) throw updateError;
      } else {
        // 새로운 의사 추가
        doctorData.id_uuid = doctor.id_uuid || uuidv4(); // 기존 id_uuid 유지 또는 새로 생성
        console.log(`새 의사 정보 추가: ${doctor.name} (${doctorData.id_uuid})`);
        const { error: insertError } = await supabase
          .from(TABLE_DOCTOR)
          .insert([doctorData]);
          
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("의사 정보 처리 실패:", error);
      return await rollbackAll("의사 정보 처리 중 오류가 발생했습니다.");
    }
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
      id_uuid_hospital: id_uuid_hospital,
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
        id_uuid_hospital: id_uuid_hospital,
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
        id_uuid_hospital: id_uuid_hospital,
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

  const sns_content_agreement_raw = formData.get("sns_content_agreement") as string;
  const sns_content_agreement = sns_content_agreement_raw === 'null' ? null : Number(sns_content_agreement_raw) as 1 | 0;

  // hospital_details 데이터 생성 함수
  const createHospitalDetailData = (formData: FormData, id_uuid: string) => {
    const available_languages_raw = formData.get('available_languages') as string;
    const available_languages = available_languages_raw ? JSON.parse(available_languages_raw) : [];

    return {
      id_uuid_hospital: id_uuid,
      has_private_recovery_room: extra_options.has_private_recovery_room,
      has_parking: extra_options.has_parking,
      has_cctv: extra_options.has_cctv,
      has_night_counseling: extra_options.has_night_counseling,
      has_female_doctor: extra_options.has_female_doctor,
      has_anesthesiologist: extra_options.has_anesthesiologist,
      specialist_count: extra_options.specialist_count,
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
      available_languages: available_languages,
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
    return await rollbackAll(checkError.message);
  }

  let detailOperation;
  if (isEditMode && existingDetail) {
    // 편집 모드이고 기존 데이터가 있으면 UPDATE
    console.log("hospital_details 업데이트 시도:", id_uuid_hospital);
    detailOperation = await supabase
      .from(TABLE_HOSPITAL_DETAIL)
      .update(createHospitalDetailData(formData, id_uuid_hospital))
      .eq('id_uuid_hospital', id_uuid_hospital);
  } else {
    // 신규 등록이거나 기존 데이터가 없으면 INSERT
    console.log("hospital_details 신규 등록 시도");
    detailOperation = await supabase
      .from(TABLE_HOSPITAL_DETAIL)
      .insert([createHospitalDetailData(formData, id_uuid_hospital)]);
  }

  if (detailOperation.error) {
    console.log("uploadActions hospital_details error:", detailOperation.error);
    return await rollbackAll(detailOperation.error.message);
  }

  console.log("hospital_details 처리 완료:", isEditMode && existingDetail ? "업데이트" : "신규 등록");

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
      console.log("Admin 테이블 업데이트 - 병원 UUID 연결:", id_uuid_hospital);
      
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

  revalidatePath("/", "layout");
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
};

