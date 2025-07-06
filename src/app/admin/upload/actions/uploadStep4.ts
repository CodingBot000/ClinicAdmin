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


export const uploadActionsStep4 = async (prevState: any, formData: FormData) => {
    const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
    const id_uuid_hospital = formData.get("id_uuid_hospital") as string; // 클라이언트에서 생성한 UUID 사용
    const current_user_uid = formData.get("current_user_uid") as string; // 현재 로그인한 사용자 UID



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

  const available_languages_raw = formData.get('available_languages') as string;
    const available_languages = available_languages_raw ? JSON.parse(available_languages_raw) : [];

    const { data, error } = await supabase
    .from(TABLE_HOSPITAL_BUSINESS_HOUR)
    .upsert({
      available_languages: available_languages,
    })
    .eq('id_uuid_hospital', id_uuid_hospital)

    
    
    if (error) {
      console.error("available_languages upsert fail :", error);
      // return await rollbackAll("시술 데이터 조회에 실패했습니다.");
      return {
        ...prevState,
        message: error.code || error.message,
        status: "error",
      };
    }
    
      console.log("Step5 저장  완료");
    

  return {
    ...prevState,
    message: "성공적으로 등록되었습니다.",
    status: "success",
  };
  }