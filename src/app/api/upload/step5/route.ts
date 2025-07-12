import { NextRequest } from 'next/server';
import { supabase } from "@/lib/supabaseClient";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  extractAndValidateUser,
  handleApiError,
  checkRateLimit,
  logRequest
} from '@/lib/api-utils';
import {
  TABLE_HOSPITAL_DETAIL,
  TABLE_FEEDBACKS
} from '@/constants/tables';

export async function POST(request: NextRequest) {
  try {
    logRequest(request, { step: 'step5' });

    const formData = await request.formData();
    
    // Rate limiting 체크
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP, 5, 60000)) {
      return createErrorResponse('너무 많은 요청입니다. 잠시 후 다시 시도해주세요.', 429);
    }

    // 사용자 인증 및 검증
    const userValidation = await extractAndValidateUser(formData);
    if (!userValidation.isValid) {
      return createErrorResponse(userValidation.error || 'Unauthorized', 401);
    }

    const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
    const id_uuid_hospital = formData.get("id_uuid_hospital") as string;
    const current_user_uid = formData.get("current_user_uid") as string;
    const available_languages_raw = formData.get("available_languages") as string;
    const feedback = formData.get("feedback") as string;
    
    if (!id_uuid_hospital) {
      return createErrorResponse('병원 ID가 필요합니다.', 400);
    }

    // 언어 설정 파싱 (기존 코드와 동일)
    const available_languages = JSON.parse(available_languages_raw);

    console.log("uploadActionsStep5 available_languages_raw:", available_languages_raw);
    console.log("uploadActionsStep5 feedback: ", feedback);
    console.log("uploadActionsStep5 id_uuid_hospital: ", id_uuid_hospital);

    // 1. 가능 언어 정보 업데이트 (기존 코드와 동일)
    const { data: dataAvailableLanguages, error: availableLanguagesError } = await supabase
      .from(TABLE_HOSPITAL_DETAIL)
      .update({
        available_languages: available_languages,
      })
      .eq('id_uuid_hospital', id_uuid_hospital);

    if (availableLanguagesError) {
      console.log("uploadActions5 available_languages error:", availableLanguagesError);
      return createErrorResponse(`availableLanguagesError:${availableLanguagesError.code || availableLanguagesError.message}`, 500);
    }

    // 2. 피드백 정보 저장 (피드백이 있을 때만) - 기존 코드와 동일
    if (feedback && feedback.trim()) {
      console.log("피드백 저장 시작:", feedback);
      
      // 피드백은 항상 새로운 레코드로 insert (id_uuid_hospital 중복 허용)
      const { data: dataFeedback, error: feedbackError } = await supabase
        .from(TABLE_FEEDBACKS)
        .insert([{
          id_uuid_hospital: id_uuid_hospital,
          feedback_content: feedback.trim()
        }]);
      
      if (feedbackError) {
        console.log("uploadActions5 feedback insert error:", feedbackError);
        return createErrorResponse(`feedbackInsertError:${feedbackError.code || feedbackError.message}`, 500);
      }
      
      console.log("피드백 저장 완료:", dataFeedback);
    } else {
      console.log("피드백이 없어서 저장하지 않음");
    }

    console.log("가능 언어 및 피드백 저장 완료 ");

    return createSuccessResponse({
      message: "성공적으로 등록되었습니다.",
      id_uuid_hospital
    });

  } catch (error) {
    console.error('Step5 API 에러:', error);
    return createErrorResponse('서버 오류가 발생했습니다.', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 