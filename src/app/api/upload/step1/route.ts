import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { 
  TABLE_HOSPITAL, 
  TABLE_HOSPITAL_DETAIL, 
  TABLE_ADMIN,
  TABLE_CONTACTS,
  TABLE_FEEDBACKS
} from '@/constants/tables';
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
    const id_uuid_hospital = formData.get("id_uuid") as string;
    const current_user_uid = formData.get("current_user_uid") as string;
  
    const name = formData.get("name") as string;
    const surgeries = formData.get("surgeries") as string;
    const searchkey = formData.get("searchkey") as string;
    const search_key = formData.get("search_key") as string;
  
    const address = formData.get("address") as string;
    const addressData = address ? JSON.parse(address) : null;
    const address_full_road = addressData?.address_full_road || '';
    const address_full_road_en = addressData?.address_full_road_en || '';
    const address_full_jibun = addressData?.address_full_jibun || '';
    const address_full_jibun_en = addressData?.address_full_jibun_en || '';
    const address_si = addressData?.address_si || '';
    const address_si_en = addressData?.address_si_en || '';
    const address_gu = addressData?.address_gu || '';
    const address_gu_en = addressData?.address_gu_en || '';
    const address_dong = addressData?.address_dong || '';
    const address_dong_en = addressData?.address_dong_en || '';
    const bname = addressData?.bname || '';
    const bname_en = addressData?.bname_en || '';
    const building_name = addressData?.building_name || '';
    const building_name_en = addressData?.building_name_en || '';
    const zipcode = addressData?.zipcode || '';
    const latitude = addressData?.latitude ? Number(addressData.latitude) : null;
    const longitude = addressData?.longitude ? Number(addressData.longitude) : null;
    const address_detail = addressData?.address_detail || '';
    const address_detail_en = addressData?.address_detail_en || '';
    const directions_to_clinic = addressData?.directions_to_clinic || '';
    const directions_to_clinic_en = addressData?.directions_to_clinic_en || '';

    const location = formData.get("location") as string;

    const lastUnique = await supabase
      .from(TABLE_HOSPITAL)
      .select("id_unique")
      .order("id_unique", { ascending: false })
      .limit(1);
  
    if (!lastUnique.data || lastUnique.error) {
      return NextResponse.json({
        message: lastUnique.error?.code || lastUnique.error?.message || "ID 조회 실패",
        status: "error",
      }, { status: 500 });
    }
  
    const nextIdUnique = (lastUnique.data && lastUnique.data.length > 0)
      ? lastUnique.data[0].id_unique + 1
      : 0;
  
    // admin uuid 가져오기
    const { data: adminData, error: adminError } = await supabase
      .from(TABLE_ADMIN)
      .select('id')
      .eq('id_auth_user', current_user_uid)
      .single();
  
    if (adminError) {
      return NextResponse.json({
        message: adminError.code || adminError.message,
        status: "error",
      }, { status: 500 });
    }
  
    const form_hospital = {
      id_unique: nextIdUnique,
      id_uuid: id_uuid_hospital,
      id_uuid_admin: adminData.id,
      name,
      searchkey,
      search_key,
      address_full_road,
      address_full_road_en,
      address_full_jibun,
      address_full_jibun_en,
      address_si,
      address_si_en,
      address_gu,
      address_gu_en,
      address_dong,
      address_dong_en,
      bname,
      bname_en,
      building_name,
      building_name_en,
      zipcode,
      latitude,
      longitude,
      address_detail,
      address_detail_en,
      directions_to_clinic,
      directions_to_clinic_en,
      location,
    };

    let hospitalOperation;
    if (isEditMode) {
      hospitalOperation = await supabase
        .from(TABLE_HOSPITAL)
        .update(form_hospital)
        .eq('id_uuid', id_uuid_hospital)
        .select("*");
    } else {
      hospitalOperation = await supabase
        .from(TABLE_HOSPITAL)
        .insert(form_hospital)
        .select("*");
    }
  
    if (hospitalOperation.error) {
      return NextResponse.json({
        message: hospitalOperation.error.code || hospitalOperation.error.message,
        status: "error",
      }, { status: 500 });
    }
  
    // hospital_details 테이블 입력
    const sns_content_agreement_raw = formData.get("sns_content_agreement") as string;
    const sns_content_agreement = sns_content_agreement_raw === 'null' ? null : Number(sns_content_agreement_raw) as 1 | 0;
  
    const createHospitalDetailData = (formData: FormData, id_uuid: string, id_hospital: number) => {
      const introduction = formData.get("introduction") as string || '';
      const introduction_en = formData.get("introduction_en") as string || '';
      return {
        id_hospital: id_hospital,
        id_uuid_hospital: id_uuid,
        email: formData.get("email") as string || '',
        tel: formData.get("tel") as string || '',
        kakao_talk: formData.get("kakao_talk") as string || '',
        line: formData.get("line") as string || '',
        we_chat: formData.get("we_chat") as string || '',
        whats_app: formData.get("whats_app") as string || '',
        telegram: formData.get("telegram") as string || '',
        facebook_messenger: formData.get("facebook_messenger") as string || '',
        instagram: formData.get("instagram") as string || '',
        tiktok: formData.get("tiktok") as string || '',
        youtube: formData.get("youtube") as string || '',
        other_channel: formData.get("other_channel") as string || '',
        map: '',
        etc: '',
        sns_content_agreement: sns_content_agreement,
        introduction: introduction,
        introduction_en: introduction_en,
      };
    };
  
    // 먼저 기존 데이터가 있는지 확인
    const { data: existingDetail, error: checkError } = await supabase
      .from(TABLE_HOSPITAL_DETAIL)
      .select('*')
      .eq('id_uuid_hospital', id_uuid_hospital)
      .maybeSingle();
  
    if (checkError) {
      return NextResponse.json({
        message: checkError.code || checkError.message,
        status: "error",
      }, { status: 500 });
    }
  
    const { data: hospitalData, error: hospitalError } = await supabase
      .from(TABLE_HOSPITAL)
      .select("id_unique")
      .eq('id_uuid', id_uuid_hospital)
      .single();

    if (hospitalError) {
      return NextResponse.json({
        message: hospitalError.code || hospitalError.message,
        status: "error",
      }, { status: 500 });
    }
  
    const id_hospital = hospitalData.id_unique;

    let detailOperation;
    if (isEditMode && existingDetail) {
      const updateData = createHospitalDetailData(formData, id_uuid_hospital, id_hospital);
      
      detailOperation = await supabase
        .from(TABLE_HOSPITAL_DETAIL)
        .update(updateData)
        .eq('id_uuid_hospital', id_uuid_hospital);
    } else {
      const insertData = createHospitalDetailData(formData, id_uuid_hospital, id_hospital);

      detailOperation = await supabase
        .from(TABLE_HOSPITAL_DETAIL)
        .insert([insertData]);
    }
  
    if (detailOperation.error) {
      let userMessage = "병원 정보 저장 중 오류가 발생했습니다.";
      
      if (detailOperation.error.code === '23505') {
        userMessage = "이미 등록된 병원 정보입니다. 중복된 데이터가 있는지 확인해주세요.";
      } else if (detailOperation.error.code === '23503') {
        userMessage = "연결된 데이터에 문제가 있습니다. 관리자에게 문의해주세요.";
      } else if (detailOperation.error.code === '22P02') {
        userMessage = "입력된 데이터 형식이 올바르지 않습니다. 숫자 필드를 확인해주세요.";
      } else if (detailOperation.error.message.includes('latitude') || detailOperation.error.message.includes('longitude')) {
        userMessage = "위치 정보(위도/경도) 형식이 올바르지 않습니다. 주소를 다시 검색해주세요.";
      } else if (detailOperation.error.message.includes('double precision')) {
        userMessage = "숫자 형식 데이터에 오류가 있습니다. 입력값을 확인해주세요.";
      }
      
      return NextResponse.json({
        message: userMessage,
        status: "error",
        errorDetails: {
          code: detailOperation.error.code,
          message: detailOperation.error.message,
          operation: isEditMode && existingDetail ? "업데이트" : "신규 등록"
        }
      }, { status: 500 });
    }
  
    // admin 테이블의 id_uuid_hospital 업데이트
    if (current_user_uid) {
      const { data: currentAdmin, error: adminSelectError } = await supabase
        .from(TABLE_ADMIN)
        .select("id, id_uuid_hospital")
        .eq("id_auth_user", current_user_uid)
        .maybeSingle();
      
      if (adminSelectError) {
        console.error("Admin 정보 조회 실패:", adminSelectError);
      } else if (currentAdmin && !currentAdmin.id_uuid_hospital) {
        const { error: adminUpdateError } = await supabase
          .from(TABLE_ADMIN)
          .update({ id_uuid_hospital: id_uuid_hospital })
          .eq("id_auth_user", current_user_uid);
        
        if (adminUpdateError) {
          console.error("Admin 테이블 업데이트 실패:", adminUpdateError);
        }
      }
    }
  
    // // 피드백이 있는 경우 저장
    // const feedback = formData.get('feedback');
    // if (feedback) {
    //   const { error: feedbackError } = await supabase
    //     .from(TABLE_FEEDBACKS)
    //     .insert([
    //       {
    //         feedback_content: feedback,
    //         id_uuid_hospital: id_uuid_hospital,
    //       },
    //     ]);
    
    //   if (feedbackError) {
    //     console.error('피드백 저장 실패:', feedbackError);
    //   }
    // }

    // 연락처 정보 저장
    // const contactsInfoRaw = formData.get('contacts_info') as string;
    // if (contactsInfoRaw) {
    //   try {
    //     const contactsInfo = JSON.parse(contactsInfoRaw);

    //     // 기존 연락처 정보 삭제 (편집 모드인 경우)
    //     if (isEditMode) {
    //       await supabase
    //         .from(TABLE_CONTACTS)
    //         .delete()
    //         .eq('id_uuid_hospital', id_uuid_hospital);
    //     }

    //     const contactsToInsert: any[] = [];

    //     // 진료문의 전화 번호 
    //     if (contactsInfo.consultationPhone && contactsInfo.consultationPhone.trim() !== '') {
    //       contactsToInsert.push({
    //         id_uuid_hospital: id_uuid_hospital,
    //         type: 'consultation_phone',
    //         value: contactsInfo.consultationPhone.trim(),
    //         sequence: 1
    //       });
    //     }

    //     // 상담 관리자 전화번호 (배열)
    //     if (contactsInfo.consultationManagerPhones && Array.isArray(contactsInfo.consultationManagerPhones)) {
    //       contactsInfo.consultationManagerPhones.forEach((phone: string, index: number) => {
    //         if (phone && phone.trim() !== '') {
    //           contactsToInsert.push({
    //             id_uuid_hospital: id_uuid_hospital,
    //             type: 'consult_manager_phone',
    //             value: phone.trim(),
    //             sequence: index
    //           });
    //         }
    //       });
    //     }
        
    //     // SMS 발신 번호
    //     if (contactsInfo.smsPhone && contactsInfo.smsPhone.trim() !== '') {
    //       contactsToInsert.push({
    //         id_uuid_hospital: id_uuid_hospital,
    //         type: 'sms_phone',
    //         value: contactsInfo.smsPhone.trim(),
    //         sequence: 1
    //       });
    //     }

    //     // 이벤트 관리자 번호
    //     if (contactsInfo.eventManagerPhone && contactsInfo.eventManagerPhone.trim() !== '') {
    //       contactsToInsert.push({
    //         id_uuid_hospital: id_uuid_hospital,
    //         type: 'event_manager_phone',
    //         value: contactsInfo.eventManagerPhone.trim(),
    //         sequence: 1
    //       });
    //     }

    //     // 마케팅 이메일 (배열)
    //     if (contactsInfo.marketingEmails && Array.isArray(contactsInfo.marketingEmails)) {
    //       contactsInfo.marketingEmails.forEach((email: string, index: number) => {
    //         if (email && email.trim() !== '') {
    //           contactsToInsert.push({
    //             id_uuid_hospital: id_uuid_hospital,
    //             type: 'marketing_email',
    //             value: email.trim(),
    //             sequence: index
    //           });
    //         }
    //       });
    //     }

    //     // 연락처 정보 저장
    //     if (contactsToInsert.length > 0) {
    //       const { error: contactsError } = await supabase
    //         .from(TABLE_CONTACTS)
    //         .insert(contactsToInsert);

    //       if (contactsError) {
    //         console.error('연락처 정보 저장 실패:', contactsError);
    //       }
    //     }
    //   } catch (error) {
    //     console.error('연락처 정보 파싱 실패:', error);
    //   }
    // }
  
    return NextResponse.json({
      message: "성공적으로 등록되었습니다.",
      status: "success",
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Step1 API 오류:', error);
    return NextResponse.json({
      message: "서버 오류가 발생했습니다.",
      status: "error",
    }, { status: 500, headers: corsHeaders });
  }
} 