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
  TABLE_HOSPITAL_TREATMENT,
  TABLE_TREATMENT
} from '@/constants/tables';

export async function POST(request: NextRequest) {
  try {
    logRequest(request, { step: 'step4' });

    const formData = await request.formData();
    
    // Rate limiting 체크
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP, 5, 60000)) {
      return createErrorResponse('너무 많은 요청입니다. 잠시 후 다시 시도해주세요.', 429);
    }

    // 사용자 인증 및 데이터 추출
    const userValidation = await extractAndValidateUser(formData);
    if (!userValidation.isValid) {
      return createErrorResponse(userValidation.error || 'Unauthorized', 401);
    }

    const id_uuid_hospital = formData.get("id_uuid_hospital") as string;
    if (!id_uuid_hospital) {
      return createErrorResponse('병원 ID가 필요합니다.', 400);
    }

    // FormData에서 필요한 정보 추출
    const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
    const treatment_options = formData.get("treatment_options") as string;
    const price_expose_raw = formData.get("price_expose") as string;
    const etc = formData.get("etc") as string;
    
    // selected_treatments 파싱 개선
    const selected_treatments_raw = formData.get("selected_treatments") as string;
    const selected_treatments = selected_treatments_raw && selected_treatments_raw.trim() !== '' 
      ? selected_treatments_raw.split(",").map((treatment: string) => treatment.trim()).filter(t => t !== '')
      : [];

    console.log("API - selected_treatments:", {
      raw: selected_treatments_raw,
      parsed: selected_treatments,
      length: selected_treatments.length
    });

    // 가격노출 설정 파싱 (string을 boolean으로 변환)
    const price_expose = price_expose_raw === 'true';
    console.log("API - price_expose:", {
      raw: price_expose_raw,
      parsed: price_expose,
      type: typeof price_expose
    });
    
    console.log("API - etc 정보:", etc);
    
    // 상품옵션 데이터 파싱
    let treatment_options_parsed = [];
    
    console.log("API - treatment_options 원본:", treatment_options);
    console.log("API - treatment_options 타입:", typeof treatment_options);
    
    if (treatment_options) {
      try {
        treatment_options_parsed = JSON.parse(treatment_options);
        console.log("API - treatment_options 파싱 성공:", treatment_options_parsed);
        console.log("API - 파싱된 배열 길이:", treatment_options_parsed.length);
      } catch (error) {
        console.error("API - treatment_options 파싱 에러:", error);
        treatment_options_parsed = [];
      }
    } else {
      console.log("API - treatment_options가 없습니다.");
    }

    // 편집 모드인 경우 기존 데이터 삭제
    if (isEditMode) {
      console.log("편집 모드: 기존 hospital_treatment 데이터 삭제 중...");
      
      const { error: deleteError } = await supabase
        .from(TABLE_HOSPITAL_TREATMENT)
        .delete()
        .eq('id_uuid_hospital', id_uuid_hospital);
      
      if (deleteError) {
        console.error("기존 hospital_treatment 데이터 삭제 실패:", deleteError);
        return handleApiError(deleteError);
      }
      
      console.log("기존 hospital_treatment 데이터 삭제 완료");
    }

    if (treatment_options_parsed.length > 0) {
      console.log("시술 상품옵션 데이터 처리 시작");
      
      // treatment 테이블에서 code와 id_uuid 매핑 데이터 가져오기
      const { data: treatmentData, error: treatmentError } = await supabase
        .from(TABLE_TREATMENT)
        .select('code, id_uuid');
      
      if (treatmentError) {
        console.error("treatment 테이블 조회 실패:", treatmentError);
        return handleApiError(treatmentError);
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
          console.log("API hospital_treatment error:", hospitalTreatmentError);
          return handleApiError(hospitalTreatmentError);
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
          console.log("API hospital_treatment (기타) error:", etcTreatmentError);
          return handleApiError(etcTreatmentError);
        }
        
        console.log("기타 시술 정보 저장 완료");
      }
    }

    return createSuccessResponse({
      message: '치료 옵션이 성공적으로 저장되었습니다.',
      id_uuid_hospital
    });

  } catch (error) {
    console.error('Step4 API 에러:', error);
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