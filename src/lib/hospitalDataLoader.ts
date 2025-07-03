import { createBrowserClient } from '@supabase/ssr';
import { ExistingHospitalData } from '@/types/hospital';
import {
  TABLE_HOSPITAL,
  TABLE_DOCTOR,
  TABLE_HOSPITAL_DETAIL,
  TABLE_HOSPITAL_TREATMENT,
  TABLE_HOSPITAL_BUSINESS_HOUR,
  TABLE_ADMIN,
  TABLE_TREATMENT,
  TABLE_FEEDBACKS
} from '@/constants/tables';

import { supabase } from "@/lib/supabaseClient";
/**
 * 현재 사용자의 병원 UUID를 가져옵니다
 */
export async function getUserHospitalUuid(userUid: string): Promise<string | null> {
  console.log(' 사용자 병원 UUID 조회 시작:', userUid);
  
  const { data: admin, error } = await supabase
    .from(TABLE_ADMIN)
    .select('id_uuid_hospital')
    .eq('id_auth_user', userUid)
    .maybeSingle();

  if (error) {
    console.error(' Admin 정보 조회 실패:', error);
    return null;
  }

  if (!admin?.id_uuid_hospital) {
    console.log(' 연결된 병원이 없습니다');
    return null;
  }

  console.log(' 병원 UUID 찾음:', admin.id_uuid_hospital);
  return admin.id_uuid_hospital;
}

/**
 * 병원 기본 정보를 가져옵니다
 */
async function loadHospitalData(hospitalUuid: string) {
  console.log(' 병원 기본 정보 로딩:', hospitalUuid);
  
  const { data, error } = await supabase
    .from(TABLE_HOSPITAL)
    .select('*')
    .eq('id_uuid', hospitalUuid)
    .maybeSingle();

  if (error) {
    console.error(' 병원 정보 로딩 실패:', error);
    throw new Error(`병원 정보 로딩 실패: ${error.message}`);
  }

  if (!data) {
    throw new Error('병원 정보를 찾을 수 없습니다');
  }

  console.log(' 병원 정보 로딩 완료');
  return data;
}

/**
 * 병원 상세 정보를 가져옵니다
 */
async function loadHospitalDetailData(hospitalUuid: string) {
  console.log(' 병원 상세 정보 로딩:', hospitalUuid);
  
  const { data, error } = await supabase
    .from(TABLE_HOSPITAL_DETAIL)
    .select('*')
    .eq('id_uuid_hospital', hospitalUuid)
    .maybeSingle();

  if (error) {
    console.error('병원 상세 정보 로딩 실패:', error);
    throw new Error(`병원 상세 정보 로딩 실패: ${error.message}`);
  }

  console.log(' 병원 상세 정보 로딩 완료');
  return data;
}

/**
 * 영업시간 정보를 가져옵니다
 */
async function loadBusinessHours(hospitalUuid: string) {
  console.log(' 영업시간 정보 로딩:', hospitalUuid);
  
  const { data, error } = await supabase
    .from(TABLE_HOSPITAL_BUSINESS_HOUR)
    .select('*')
    .eq('id_uuid_hospital', hospitalUuid)
    .order('day_of_week');

  if (error) {
    console.error('영업시간 정보 로딩 실패:', error);
    throw new Error(`영업시간 정보 로딩 실패: ${error.message}`);
  }

  console.log(' 영업시간 정보 로딩 완료:', data?.length || 0, '건');
  return data || [];
}

/**
 * 의사 정보를 가져옵니다
 */
async function loadDoctors(hospitalUuid: string) {
  console.log(' 의사 정보 로딩:', hospitalUuid);
  
  const { data, error } = await supabase
    .from(TABLE_DOCTOR)
    .select('*')
    .eq('id_uuid_hospital', hospitalUuid);

  if (error) {
    console.error(' 의사 정보 로딩 실패:', error);
    throw new Error(`의사 정보 로딩 실패: ${error.message}`);
  }

  console.log(' 의사 정보 로딩 완료:', data?.length || 0, '명');
  return data || [];
}

/**
 * 시술 정보를 가져옵니다 - hospital_treatment 먼저 가져오고 별도로 treatment 정보 매칭
 */
async function loadTreatments(hospitalUuid: string) {
  console.log(' 시술 정보 로딩:', hospitalUuid);
  
  // 1. hospital_treatment 데이터 먼저 가져오기
  const { data: hospitalTreatments, error: hospitalTreatmentError } = await supabase
    .from(TABLE_HOSPITAL_TREATMENT)
    .select('*')
    .eq('id_uuid_hospital', hospitalUuid);

  if (hospitalTreatmentError) {
    console.error(' 병원 시술 정보 로딩 실패:', hospitalTreatmentError);
    throw new Error(`병원 시술 정보 로딩 실패: ${hospitalTreatmentError.message}`);
  }

  if (!hospitalTreatments || hospitalTreatments.length === 0) {
    console.log(' 시술 정보가 없습니다');
    return [];
  }

  console.log(' 병원 시술 정보 로딩 완료:', hospitalTreatments.length, '건');

  // 2. NULL이 아닌 id_uuid_treatment들만 추출
  const treatmentUuids = hospitalTreatments
    .filter(ht => ht.id_uuid_treatment !== null)
    .map(ht => ht.id_uuid_treatment);

  console.log(' 매칭할 시술 UUID들:', treatmentUuids);

  // 3. treatment 정보 가져오기 (UUID가 있는 경우만)
  let treatments: any[] = [];
  if (treatmentUuids.length > 0) {
    const { data: treatmentData, error: treatmentError } = await supabase
      .from(TABLE_TREATMENT)
      .select('id_uuid, code, name')
      .in('id_uuid', treatmentUuids);

    if (treatmentError) {
      console.error(' 시술 정보 로딩 실패:', treatmentError);
      throw new Error(`시술 정보 로딩 실패: ${treatmentError.message}`);
    }

    treatments = treatmentData || [];
  }

  console.log(' 시술 마스터 정보 로딩 완료:', treatments.length, '건');

  // 4. hospital_treatment와 treatment 매칭
  const result = hospitalTreatments.map(hospitalTreatment => {
    if (hospitalTreatment.id_uuid_treatment === null) {
      // 기타 항목인 경우
      return {
        ...hospitalTreatment,
        treatment: null // 기타 항목이므로 treatment 정보 없음
      };
    } else {
      // 일반 시술인 경우 treatment 정보 매칭
      const matchedTreatment = treatments.find(t => t.id_uuid === hospitalTreatment.id_uuid_treatment);
      return {
        ...hospitalTreatment,
        treatment: matchedTreatment || null
      };
    }
  });

  console.log(' 시술 정보 매칭 완료:', result.length, '건');
  console.log(' 시술 정보 상세:', result);
  return result;
}

async function loadFeedback(hospitalUuid: string) {
  console.log(' 피드백 정보 로딩:', hospitalUuid);
  
  const { data, error } = await supabase
    .from(TABLE_FEEDBACKS)
    .select('feedback_content')
    .eq('id_uuid_hospital', hospitalUuid)
    .maybeSingle();

  if (error) {
    console.error('피드백 정보 로딩 실패:', error);
    return null;
  }

  console.log(' 피드백 정보 로딩 완료');
  return data?.feedback_content || '';
}

/**
 * 모든 병원 관련 데이터를 통합해서 가져옵니다
 */
export async function loadExistingHospitalData(userUid: string): Promise<ExistingHospitalData | null> {
  try {
    console.log(' 기존 병원 데이터 로딩 시작');
    
    // 1. 사용자의 병원 UUID 가져오기
    const hospitalUuid = await getUserHospitalUuid(userUid);
    if (!hospitalUuid) {
      console.log(' 병원 UUID가 없어서 로딩 중단');
      return null;
    }

    // 2. 병렬로 모든 데이터 로딩
    console.log(' 모든 데이터 병렬 로딩 시작...');
    const [hospital, hospitalDetail, businessHours, doctors, treatments, feedback] = await Promise.all([
      loadHospitalData(hospitalUuid),
      loadHospitalDetailData(hospitalUuid),
      loadBusinessHours(hospitalUuid),
      loadDoctors(hospitalUuid),
      loadTreatments(hospitalUuid),
      loadFeedback(hospitalUuid)
    ]);

    const result: ExistingHospitalData = {
      hospital,
      hospitalDetail,
      businessHours,
      doctors,
      treatments,
      feedback
    };

    console.log('모든 병원 데이터 로딩 완료!');
    console.log('로딩된 데이터 요약:', {
      병원정보: '1건',
      상세정보: hospitalDetail ? '1건' : '0건',
      영업시간: `${businessHours.length}건`,
      의사정보: `${doctors.length}명`,
      시술정보: `${treatments.length}건`
    });
    
    console.log('=== 실제 로딩된 데이터 ===');
    console.log('병원 기본 정보:', hospital);
    console.log('병원 상세 정보:', hospitalDetail);
    console.log('영업시간 정보:', businessHours);
    console.log('의사 정보:', doctors);
    console.log('시술 정보:', treatments);

    return result;

  } catch (error) {
    console.error(' 병원 데이터 로딩 중 오류:', error);
    throw error;
  }
} 