// "use server";

// import { v4 as uuidv4 } from 'uuid';
// import { supabase } from "@/lib/supabaseClient";
// import { revalidatePath } from "next/cache";
// import { getTimestamp } from '@/utils/address/getTimeStamp';
// import { makeUploadImageFileName } from '@/utils/makeUploadImageFileName';
// import {
//   TABLE_HOSPITAL_DETAIL,
//   TABLE_FEEDBACKS
// } from '@/constants/tables';
// import { createClient } from '@supabase/supabase-js';
// import { HospitalDetailData } from '@/types/hospital';
// import { Hospital } from 'lucide-react';


// export const uploadActionsStep5 = async (prevState: any, formData: FormData) => {
//     const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
//     const id_uuid_hospital = formData.get("id_uuid_hospital") as string; // 클라이언트에서 생성한 UUID 사용
//     const current_user_uid = formData.get("current_user_uid") as string; // 현재 로그인한 사용자 UID
//     const available_languages_raw = formData.get("available_languages") as string;
//     const feedback = formData.get("feedback") as string;
    
//     const available_languages = JSON.parse(available_languages_raw);

//     console.log("uploadActionsStep5 available_languages_raw:", available_languages_raw);
//     console.log("uploadActionsStep5 feedback: ", feedback);
//     console.log("uploadActionsStep5 id_uuid_hospital: ", id_uuid_hospital);
  
//     // 1. 가능 언어 정보 업데이트
//     const { data: dataAvailableLanguages, error: availableLanguagesError } = await supabase
//     .from(TABLE_HOSPITAL_DETAIL)
//     .update({
//       available_languages: available_languages,
//     })
//     .eq('id_uuid_hospital', id_uuid_hospital);
  
//     if (availableLanguagesError) {
//       console.log("uploadActions5 available_languages error:", availableLanguagesError);
//       return {
//         ...prevState,
//         message: `availableLanguagesError:${availableLanguagesError.code || availableLanguagesError.message}`,
//         status: "error",
//       };
//     }
  
//     // 2. 피드백 정보 저장 (피드백이 있을 때만)
//     if (feedback && feedback.trim()) {
//       console.log("피드백 저장 시작:", feedback);
      
//       // 피드백은 항상 새로운 레코드로 insert (id_uuid_hospital 중복 허용)
//       const { data: dataFeedback, error: feedbackError } = await supabase
//         .from(TABLE_FEEDBACKS)
//         .insert([{
//           id_uuid_hospital: id_uuid_hospital,
//           feedback_content: feedback.trim()
//         }]);
      
//       if (feedbackError) {
//         console.log("uploadActions5 feedback insert error:", feedbackError);
//         return {
//           ...prevState,
//           message: `feedbackInsertError:${feedbackError.code || feedbackError.message}`,
//           status: "error",
//         };
//       }
      
//       console.log("피드백 저장 완료:", dataFeedback);
//     } else {
//       console.log("피드백이 없어서 저장하지 않음");
//     }

//     console.log("가능 언어 및 피드백 저장 완료 ");
   
//     return {
//       ...prevState,
//       message: "성공적으로 등록되었습니다.",
//       status: "success",
//     };
//   }