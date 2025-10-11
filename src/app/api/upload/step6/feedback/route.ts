import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { TABLE_FEEDBACKS } from '@/constants/tables';
import "@/utils/logger";

// CORS 헤더 정의
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// 최신 피드백 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_uuid_hospital = searchParams.get('id_uuid_hospital');

    if (!id_uuid_hospital) {
      return NextResponse.json({
        message: 'id_uuid_hospital is required',
        status: 'error',
      }, { status: 400, headers: corsHeaders });
    }

    log.info("Feedback GET API - id_uuid_hospital:", id_uuid_hospital);

    // type이 'support_treatment'이고 updated_at이 최신인 피드백 조회
    const { data, error } = await supabase
      .from(TABLE_FEEDBACKS)
      .select('*')
      .eq('id_uuid_hospital', id_uuid_hospital)
      .eq('type', 'support_treatment')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // 데이터가 없는 경우는 에러가 아님
      if (error.code === 'PGRST116') {
        log.info("Feedback GET API - No feedback found");
        return NextResponse.json({
          feedback_content: '',
        }, { status: 200, headers: corsHeaders });
      }

      log.error("Feedback GET API - Query error:", error);
      return NextResponse.json({
        message: `Query error: ${error.message}`,
        status: "error",
      }, { status: 500, headers: corsHeaders });
    }

    log.info("Feedback GET API - Result:", data);

    return NextResponse.json({
      feedback_content: data?.feedback_content || '',
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Feedback GET API 오류:', error);
    return NextResponse.json({
      message: "서버 오류가 발생했습니다.",
      status: "error",
    }, { status: 500, headers: corsHeaders });
  }
}

// 피드백 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_uuid_hospital, feedback_content } = body;

    if (!id_uuid_hospital || feedback_content === undefined) {
      return NextResponse.json({
        message: 'id_uuid_hospital and feedback_content are required',
        status: 'error',
      }, { status: 400, headers: corsHeaders });
    }

    log.info("Feedback POST API - id_uuid_hospital:", id_uuid_hospital);
    log.info("Feedback POST API - feedback_content:", feedback_content);

    // 새 피드백 삽입
    const { data, error } = await supabase
      .from(TABLE_FEEDBACKS)
      .insert([{
        id_uuid_hospital,
        feedback_content: feedback_content.trim(),
        type: 'support_treatment',
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      log.error("Feedback POST API - Insert error:", error);
      return NextResponse.json({
        message: `Insert error: ${error.message}`,
        status: "error",
      }, { status: 500, headers: corsHeaders });
    }

    log.info("Feedback POST API - Success:", data);

    return NextResponse.json({
      message: "피드백이 성공적으로 저장되었습니다.",
      status: "success",
      feedback_content: data.feedback_content,
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Feedback POST API 오류:', error);
    return NextResponse.json({
      message: "서버 오류가 발생했습니다.",
      status: "error",
    }, { status: 500, headers: corsHeaders });
  }
}
