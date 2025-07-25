import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { 
  TABLE_HOSPITAL_DETAIL,
  TABLE_FEEDBACKS
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
    const available_languages_raw = formData.get("available_languages") as string;
    const feedback = formData.get("feedback") as string;
    
    const available_languages = JSON.parse(available_languages_raw);

    log.info("uploadActionsStep5 available_languages_raw:", available_languages_raw);
    log.info("uploadActionsStep5 feedback: ", feedback);
    log.info("uploadActionsStep5 id_uuid_hospital: ", id_uuid_hospital);
  
    // 1. 가능 언어 정보 업데이트
    const { data: dataAvailableLanguages, error: availableLanguagesError } = await supabase
      .from(TABLE_HOSPITAL_DETAIL)
      .update({
        available_languages: available_languages,
      })
      .eq('id_uuid_hospital', id_uuid_hospital);
  
    if (availableLanguagesError) {
      log.info("uploadActions5 available_languages error:", availableLanguagesError);
      return NextResponse.json({
        message: `availableLanguagesError:${availableLanguagesError.code || availableLanguagesError.message}`,
        status: "error",
      }, { status: 500 });
    }
  
    // 2. 피드백 정보 저장 (피드백이 있을 때만)
    if (feedback && feedback.trim()) {
      log.info("피드백 저장 시작:", feedback);
      
      // 피드백은 항상 새로운 레코드로 insert (id_uuid_hospital 중복 허용)
      const { data: dataFeedback, error: feedbackError } = await supabase
        .from(TABLE_FEEDBACKS)
        .insert([{
          id_uuid_hospital: id_uuid_hospital,
          feedback_content: feedback.trim()
        }]);
      
      if (feedbackError) {
        log.info("uploadActions5 feedback insert error:", feedbackError);
        return NextResponse.json({
          message: `feedbackInsertError:${feedbackError.code || feedbackError.message}`,
          status: "error",
        }, { status: 500 });
      }
      
      log.info("피드백 저장 완료:", dataFeedback);
    } else {
      log.info("피드백이 없어서 저장하지 않음");
    }

    log.info("가능 언어 및 피드백 저장 완료 ");
   
    return NextResponse.json({
      message: "성공적으로 등록되었습니다.",
      status: "success",
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Step5 API 오류:', error);
    return NextResponse.json({
      message: "서버 오류가 발생했습니다.",
      status: "error",
    }, { status: 500, headers: corsHeaders });
  }
} 