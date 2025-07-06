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


export const uploadActionsStep3 = async (prevState: any, formData: FormData) => {
  console.log('=== uploadStep3 START    ');

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
            .from(TABLE_DOCTOR)
            .delete()
            .eq('id_uuid_hospital', id_uuid_hospital);
         
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
    





    const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
    const id_uuid_hospital = formData.get("id_uuid_hospital") as string; // 클라이언트에서 생성한 UUID 사용
    const current_user_uid = formData.get("current_user_uid") as string; // 현재 로그인한 사용자 UID
    const clinic_image_urls_raw = formData.get("clinic_image_urls") as string;
    const doctor_image_urls_raw = formData.get("doctor_image_urls") as string;
    const doctors_raw = formData.get("doctors") as string; // 의사 정보
    const initial_doctors_raw = formData.get("initial_doctors") as string; // 초기 의사 정보

    let clinic_image_urls: string[] = [];
    let doctor_image_urls: string[] = [];
    let doctors_parsed: any[] = [];
    let initial_doctors_parsed: any[] = [];

  const existingDataRaw = formData.get("existing_data")?.toString();
  const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : null;

  // 디버그 로그 출력
  console.log('=== uploadStep3 디버그 로그 ===');
  console.log('uploadStep3 isEditMode:', isEditMode);
  console.log('uploadStep3 id_uuid_hospital:', id_uuid_hospital);
  console.log('uploadStep3 current_user_uid:', current_user_uid);
  console.log('uploadStep3 clinic_image_urls_raw:', clinic_image_urls_raw);
  console.log('uploadStep3 doctor_image_urls_raw:', doctor_image_urls_raw);
  console.log('uploadStep3 doctors_raw:', doctors_raw);
  console.log('uploadStep3 initial_doctors_raw:', initial_doctors_raw);
  console.log('uploadStep3 existingDataRaw:', existingDataRaw);
  console.log('uploadStep3 existingData:', existingData);
  console.log('=== 디버그 로그 끝 ===');



  
  // 트랜잭션 및 롤백을 위한 변수들
  let newlyUploadedImages: string[] = []; // 새로 업로드된 이미지 URL
  let newlyUploadedDoctorImages: string[] = []; // 새로 업로드된 의사 이미지 URL
  let existingImages: string[] = []; // 기존 이미지 URL
  let existingDoctorImages: string[] = []; // 기존 의사 이미지 URL
  let insertedHospitalId: string | null = null;
  let insertedDoctorId: string | null = null;
  

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
  // {"handle":{},"path":"./Screenshot 2025-06-28 at 2.29.14 AM.png","relativePath":"./Screenshot 2025-06-28 at 2.29.14 AM.png"}
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
  };



  
  return {
    ...prevState,
    message: "성공적으로 등록되었습니다.",
    status: "success",
  };
  }