import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import "@/utils/logger";

// CORS 헤더 정의
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

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

    log.info("Step6 GET API - id_uuid_hospital:", id_uuid_hospital);

    // hospital_treatment_selection 테이블에서 데이터 조회
    const { data, error } = await supabase
      .from('hospital_treatment_selection')
      .select('category, ids, device_ids')
      .eq('id_uuid_hospital', id_uuid_hospital);

    if (error) {
      log.error("Step6 GET API - Query error:", error);
      return NextResponse.json({
        message: `Query error: ${error.message}`,
        status: "error",
      }, { status: 500, headers: corsHeaders });
    }

    // 카테고리별로 데이터 분리
    const skinData = data?.find(row => row.category === 'skin');
    const plasticData = data?.find(row => row.category === 'plastic');

    const result = {
      skinTreatmentIds: skinData?.ids || [],
      plasticTreatmentIds: plasticData?.ids || [],
      skinDeviceIds: skinData?.device_ids || [],
      plasticDeviceIds: plasticData?.device_ids || [],
      // 모든 device_ids 합치기 (중복 제거)
      deviceIds: Array.from(new Set([
        ...(skinData?.device_ids || []),
        ...(plasticData?.device_ids || [])
      ])),
    };

    log.info("Step6 GET API - Result:", result);

    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Step6 GET API 오류:', error);
    return NextResponse.json({
      message: "서버 오류가 발생했습니다.",
      status: "error",
    }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { id_uuid_hospital, skinTreatmentIds, plasticTreatmentIds, deviceIds } = body;

    log.info("Step6 API - id_uuid_hospital:", id_uuid_hospital);
    log.info("Step6 API - skinTreatmentIds:", skinTreatmentIds);
    log.info("Step6 API - plasticTreatmentIds:", plasticTreatmentIds);
    log.info("Step6 API - deviceIds:", deviceIds);

    // Skin 카테고리 데이터 준비
    const skinData = {
      id_uuid_hospital,
      category: 'skin',
      ids: skinTreatmentIds || [],
      device_ids: deviceIds.filter((id: string) => {
        // Device가 skin 또는 both인지 확인 필요 - 일단 전체 포함
        return true;
      }),
      updated_at: new Date().toISOString(),
    };

    // Plastic 카테고리 데이터 준비
    const plasticData = {
      id_uuid_hospital,
      category: 'plastic',
      ids: plasticTreatmentIds || [],
      device_ids: deviceIds.filter((id: string) => {
        // Device가 plastic 또는 both인지 확인 필요 - 일단 전체 포함
        return true;
      }),
      updated_at: new Date().toISOString(),
    };

    // Upsert skin category
    const { error: skinError } = await supabase
      .from('hospital_treatment_selection')
      .upsert(skinData, {
        onConflict: 'id_uuid_hospital,category'
      });

    if (skinError) {
      log.error("Step6 API - Skin upsert error:", skinError);
      return NextResponse.json({
        message: `Skin upsert error: ${skinError.message}`,
        status: "error",
      }, { status: 500, headers: corsHeaders });
    }

    // Upsert plastic category
    const { error: plasticError } = await supabase
      .from('hospital_treatment_selection')
      .upsert(plasticData, {
        onConflict: 'id_uuid_hospital,category'
      });

    if (plasticError) {
      log.error("Step6 API - Plastic upsert error:", plasticError);
      return NextResponse.json({
        message: `Plastic upsert error: ${plasticError.message}`,
        status: "error",
      }, { status: 500, headers: corsHeaders });
    }

    log.info("Step6 API - Treatment and device selections saved successfully");

    return NextResponse.json({
      message: "선택 항목이 성공적으로 저장되었습니다.",
      status: "success",
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Step6 API 오류:', error);
    return NextResponse.json({
      message: "서버 오류가 발생했습니다.",
      status: "error",
    }, { status: 500, headers: corsHeaders });
  }
} 