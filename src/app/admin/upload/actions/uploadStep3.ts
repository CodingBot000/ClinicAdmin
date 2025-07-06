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

// 파일명 생성 함수
const generateFileName = (originalName: string, prefix: string = '', suffix: string = '') => {
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0];
  const extension = originalName.split('.').pop() || 'jpg';
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  
  return `${prefix}${sanitizedName}_${uuid}_${timestamp}.${extension}`;
};

// 병원 이미지 파일명 생성
const generateHospitalImageFileName = (originalName: string) => {
  return generateFileName(originalName, 'hospital_');
};

// 의사 이미지 파일명 생성
const generateDoctorImageFileName = (originalName: string, doctorName: string) => {
  const nameSlug = doctorName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return generateFileName(originalName, `doctor_${nameSlug}_`);
};

export const uploadActionsStep3 = async (prevState: any, formData: FormData) => {
  console.log('=== uploadStep3 START ===');

  // 에러 발생 시 모든 작업을 롤백하는 함수
  const rollbackAll = async (errorMessage: string) => {
    console.error('롤백 실행:', errorMessage);
    return {
      ...prevState,
      message: errorMessage,
      status: "error",
    };
  };

  try {
    // FormData에서 기본 정보 추출
    const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
    const id_uuid_hospital = formData.get("id_uuid_hospital") as string;
    const current_user_uid = formData.get("current_user_uid") as string;
    
    // 기존 데이터 파싱 (편집 모드용)
    const existingDataRaw = formData.get("existing_data")?.toString();
    const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : null;
    
    // 기존 병원 이미지 URL들
    const existingClinicUrlsRaw = formData.get("existing_clinic_urls") as string;
    const existingClinicUrls = existingClinicUrlsRaw ? JSON.parse(existingClinicUrlsRaw) : [];
    
    // 새로 업로드된 병원 이미지 URL들
    const newClinicImageUrlsRaw = formData.get("new_clinic_image_urls") as string;
    const newClinicImageUrls = newClinicImageUrlsRaw ? JSON.parse(newClinicImageUrlsRaw) : [];
    
    // 의사 정보 파싱
    const doctorsRaw = formData.get("doctors") as string;
    console.log('=== 의사 데이터 원본 ===');
    console.log('doctorsRaw:', doctorsRaw);
    console.log('doctorsRaw type:', typeof doctorsRaw);
    console.log('doctorsRaw length:', doctorsRaw?.length || 0);
    
    const doctors = doctorsRaw ? JSON.parse(doctorsRaw) : [];
    console.log('=== 파싱된 의사 데이터 ===');
    console.log('doctors:', doctors);
    console.log('doctors length:', doctors.length);
    console.log('doctors type:', Array.isArray(doctors) ? 'array' : typeof doctors);

    console.log('uploadStep3 디버그 정보:');
    console.log('- isEditMode:', isEditMode);
    console.log('- id_uuid_hospital:', id_uuid_hospital);
    console.log('- existingClinicUrls:', existingClinicUrls);
    console.log('- newClinicImageUrls:', newClinicImageUrls);
    console.log('- doctors count:', doctors.length);

    // 최종 병원 이미지 URL 배열 (기존 + 신규)
    const finalClinicImageUrls = [...existingClinicUrls, ...newClinicImageUrls];
    console.log('- 최종 병원 이미지 URL 개수:', finalClinicImageUrls.length);

    // 병원 테이블 업데이트 (이미지 URL 배열)
    console.log('병원 테이블 업데이트 시작:', {
      id_uuid_hospital,
      finalClinicImageUrls
    });
    
    const { data: hospitalUpdateData, error: hospitalUpdateError } = await supabase
      .from(TABLE_HOSPITAL)
      .update({ imageurls: finalClinicImageUrls })
      .eq('id_uuid', id_uuid_hospital)
      .select();

    if (hospitalUpdateError) {
      console.error('병원 이미지 URL 업데이트 실패:', hospitalUpdateError);
      return await rollbackAll(`병원 이미지 URL 업데이트 실패: ${hospitalUpdateError.message}`);
    }

    console.log('병원 테이블 업데이트 성공:', hospitalUpdateData);

    // 각 의사 정보 처리
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      
      console.log(`의사 ${i + 1} 처리:`, {
        id_uuid: doctor.id_uuid,
        name: doctor.name,
        image_url: doctor.image_url,
        isExisting: !!doctor.id_uuid,
        imageUrlLength: doctor.image_url?.length || 0
      });
      
      // 의사 데이터 준비 (이미지 URL은 이미 클라이언트에서 업로드 완료)
      const doctorData = {
        id_uuid_hospital,
        name: doctor.name,
        bio: doctor.bio || '',
        image_url: doctor.image_url || '',
        chief: doctor.chief,
      };

      if (doctor.id_uuid) {
        // 기존 의사 정보 업데이트
        console.log(`- 의사 정보 업데이트: ${doctor.name} (${doctor.id_uuid})`);
        console.log(`  업데이트할 이미지 URL: ${doctorData.image_url}`);
        
        // 먼저 해당 의사가 존재하는지 확인
        const { data: existingDoctor, error: checkError } = await supabase
          .from(TABLE_DOCTOR)
          .select('*')
          .eq('id_uuid', doctor.id_uuid)
          .single();

        if (checkError) {
          console.log(`- 의사 ${doctor.name} (${doctor.id_uuid}) 존재하지 않음, 새로 추가`);
          
          // 존재하지 않으면 새로 추가
          const { data: insertData, error: insertError } = await supabase
            .from(TABLE_DOCTOR)
            .insert([{ ...doctorData, id_uuid: doctor.id_uuid }])
            .select();

          if (insertError) {
            console.error('의사 정보 추가 실패:', insertError);
            return await rollbackAll(`의사 정보 추가 실패: ${insertError.message}`);
          }
          
          console.log(`- 새 의사 정보 추가 성공: ${doctor.name}`, insertData);
        } else {
          console.log(`- 의사 ${doctor.name} (${doctor.id_uuid}) 존재함, 업데이트 진행`);
          
          // 존재하면 업데이트
          const { data: updateData, error: updateError } = await supabase
            .from(TABLE_DOCTOR)
            .update(doctorData)
            .eq('id_uuid', doctor.id_uuid)
            .select();

          if (updateError) {
            console.error('의사 정보 업데이트 실패:', updateError);
            return await rollbackAll(`의사 정보 업데이트 실패: ${updateError.message}`);
          }
          
          console.log(`- 의사 정보 업데이트 성공: ${doctor.name}`, updateData);
        }
      } else {
        // 새 의사 정보 추가
        console.log(`- 새 의사 정보 추가: ${doctor.name}`);
        const { data: insertData, error: insertError } = await supabase
          .from(TABLE_DOCTOR)
          .insert([{ ...doctorData, id_uuid: uuidv4() }])
          .select();

        if (insertError) {
          console.error('의사 정보 추가 실패:', insertError);
          return await rollbackAll(`의사 정보 추가 실패: ${insertError.message}`);
        }
        
        console.log(`- 새 의사 정보 추가 성공: ${doctor.name}`, insertData);
      }
    }

    // 편집 모드에서 삭제된 의사들 처리
    if (isEditMode && existingData?.doctors) {
      const existingDoctorIds = existingData.doctors.map((d: any) => d.id_uuid);
      const currentDoctorIds = doctors.map((d: any) => d.id_uuid).filter(Boolean);
      const deletedDoctorIds = existingDoctorIds.filter((id: string) => !currentDoctorIds.includes(id));

      for (const deletedId of deletedDoctorIds) {
        console.log(`- 삭제된 의사 처리: ${deletedId}`);
        
        // 의사 정보 삭제
        const { error: deleteError } = await supabase
          .from(TABLE_DOCTOR)
          .delete()
          .eq('id_uuid', deletedId);

        if (deleteError) {
          console.error('의사 정보 삭제 실패:', deleteError);
          return await rollbackAll(`의사 정보 삭제 실패: ${deleteError.message}`);
        }
      }
    }

    console.log('=== uploadStep3 성공 완료 ===');
    
    return {
      ...prevState,
      message: "이미지 및 의사 정보가 성공적으로 저장되었습니다.",
      status: "success",
    };

  } catch (error) {
    console.error('uploadStep3 전체 오류:', error);
    return await rollbackAll(`처리 중 오류가 발생했습니다: ${error}`);
  }
};