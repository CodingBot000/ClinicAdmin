import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { 
  TABLE_CONTACTS,
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
    // 연락처 정보 저장
    const contactsInfoRaw = formData.get('contacts_info') as string;

    if (!contactsInfoRaw) {
      return NextResponse.json({
        message: "연락처 정보에 오류가 있습니다.",
        status: "error",
      }, { status: 400, headers: corsHeaders });
    } else {
      try {
        const contactsInfo = JSON.parse(contactsInfoRaw);

        // 기존 연락처 정보 삭제 (편집 모드인 경우)
        if (isEditMode) {
          await supabase
            .from(TABLE_CONTACTS)
            .delete()
            .eq('id_uuid_hospital', id_uuid_hospital);
        }

        const contactsToInsert: any[] = [];

        // 진료문의 전화 번호 
        if (contactsInfo.consultationPhone && contactsInfo.consultationPhone.trim() !== '') {
          contactsToInsert.push({
            id_uuid_hospital: id_uuid_hospital,
            type: 'consultation_phone',
            value: contactsInfo.consultationPhone.trim(),
            sequence: 1
          });
        }

        // 상담 관리자 전화번호 (배열)
        if (contactsInfo.consultationManagerPhones && Array.isArray(contactsInfo.consultationManagerPhones)) {
          contactsInfo.consultationManagerPhones.forEach((phone: string, index: number) => {
            if (phone && phone.trim() !== '') {
              contactsToInsert.push({
                id_uuid_hospital: id_uuid_hospital,
                type: 'consult_manager_phone',
                value: phone.trim(),
                sequence: index
              });
            }
          });
        }
        
        // SMS 발신 번호
        if (contactsInfo.smsPhone && contactsInfo.smsPhone.trim() !== '') {
          contactsToInsert.push({
            id_uuid_hospital: id_uuid_hospital,
            type: 'sms_phone',
            value: contactsInfo.smsPhone.trim(),
            sequence: 1
          });
        }

        // 이벤트 관리자 번호
        if (contactsInfo.eventManagerPhone && contactsInfo.eventManagerPhone.trim() !== '') {
          contactsToInsert.push({
            id_uuid_hospital: id_uuid_hospital,
            type: 'event_manager_phone',
            value: contactsInfo.eventManagerPhone.trim(),
            sequence: 1
          });
        }

        // 마케팅 이메일 (배열)
        if (contactsInfo.marketingEmails && Array.isArray(contactsInfo.marketingEmails)) {
          contactsInfo.marketingEmails.forEach((email: string, index: number) => {
            if (email && email.trim() !== '') {
              contactsToInsert.push({
                id_uuid_hospital: id_uuid_hospital,
                type: 'marketing_email',
                value: email.trim(),
                sequence: index
              });
            }
          });
        }

        // 연락처 정보 저장
        if (contactsToInsert.length > 0) {
          const { error: contactsError } = await supabase
            .from(TABLE_CONTACTS)
            .insert(contactsToInsert);

          if (contactsError) {
            console.error('연락처 정보 저장 실패:', contactsError);
          }
        }
      } catch (error) {
        console.error('연락처 정보 파싱 실패:', error);
      }
    }
  
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