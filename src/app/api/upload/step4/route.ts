import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { 
  TABLE_HOSPITAL,
  TABLE_DOCTOR,
  STORAGE_IMAGES
} from '@/constants/tables';
import { v4 as uuidv4 } from 'uuid';
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
  log.info('=== uploadStep3 START ===');

  try {
    const formData = await request.formData();
    
    // FormData에서 기본 정보 추출
    const isEditMode = formData.get("is_edit_mode")?.toString() === "true";
    const id_uuid_hospital = formData.get("id_uuid_hospital") as string;
    const current_user_uid = formData.get("current_user_uid") as string;
    
    // 기존 데이터 파싱 (편집 모드용)
    const existingDataRaw = formData.get("existing_data")?.toString();
    const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : null;

    // 썸네일 이미지 관련 데이터
    const existingThumbnailUrl = formData.get("existing_thumbnail_url")?.toString() || null;
    const newThumbnailUrl = formData.get("new_thumbnail_url")?.toString() || null;
    const finalThumbnailUrl = formData.get("final_thumbnail_url")?.toString() || null;
    const deletedThumbnailUrl = formData.get("deleted_thumbnail_url")?.toString() || null;

    // 기존 병원 이미지 URL들
    const existingClinicUrlsRaw = formData.get("existing_clinic_urls") as string;
    const existingClinicUrls = existingClinicUrlsRaw ? JSON.parse(existingClinicUrlsRaw) : [];
    
    // 새로 업로드된 병원 이미지 URL들
    const newClinicImageUrlsRaw = formData.get("new_clinic_image_urls") as string;
    const newClinicImageUrls = newClinicImageUrlsRaw ? JSON.parse(newClinicImageUrlsRaw) : [];
    
    // 최종 병원 이미지 URL들 (클라이언트에서 전달받은 순서)
    const finalClinicImageUrlsRaw = formData.get("final_clinic_image_urls") as string;
    const finalClinicImageUrls = finalClinicImageUrlsRaw ? JSON.parse(finalClinicImageUrlsRaw) : [];
    
    // 삭제된 병원 이미지 URL들
    const deletedClinicUrlsRaw = formData.get("deleted_clinic_urls") as string;
    const deletedClinicUrls = deletedClinicUrlsRaw ? JSON.parse(deletedClinicUrlsRaw) : [];
    
    // 의사 정보 파싱
    const doctorsRaw = formData.get("doctors") as string;
    log.info('=== 의사 데이터 원본 ===');
    log.info('doctorsRaw:', doctorsRaw);
    log.info('doctorsRaw type:', typeof doctorsRaw);
    log.info('doctorsRaw length:', doctorsRaw?.length || 0);
    
    const doctors = doctorsRaw ? JSON.parse(doctorsRaw) : [];
    log.info('=== 파싱된 의사 데이터 ===');
    log.info('doctors:', doctors);
    log.info('doctors length:', doctors.length);
    log.info('doctors type:', Array.isArray(doctors) ? 'array' : typeof doctors);

    log.info('uploadStep3 디버그 정보:');
    log.info('- isEditMode:', isEditMode);
    log.info('- id_uuid_hospital:', id_uuid_hospital);
    log.info('- existingThumbnailUrl:', existingThumbnailUrl);
    log.info('- newThumbnailUrl:', newThumbnailUrl);
    log.info('- finalThumbnailUrl:', finalThumbnailUrl);
    log.info('- deletedThumbnailUrl:', deletedThumbnailUrl);
    log.info('- existingClinicUrls:', existingClinicUrls);
    log.info('- newClinicImageUrls:', newClinicImageUrls);
    log.info('- finalClinicImageUrls:', finalClinicImageUrls);
    log.info('- deletedClinicUrls:', deletedClinicUrls);
    log.info('- doctors count:', doctors.length);

    // 1. 썸네일 이미지 처리 (exist vs cur 비교)
    const existThumbnail = existingThumbnailUrl;
    const curThumbnail = finalThumbnailUrl;
    
    log.info('썸네일 이미지 비교:');
    log.info('- exist (기존):', existThumbnail);
    log.info('- cur (현재):', curThumbnail);
    log.info('- 변경사항 있음:', existThumbnail !== curThumbnail);
    
    // 변경사항이 있으면 기존 썸네일 이미지 삭제
    if (existThumbnail && existThumbnail !== curThumbnail && !existThumbnail.includes('/default/')) {
      log.info('기존 썸네일 이미지 삭제 시작:', existThumbnail);
      
      try {
        // Storage에서 파일 경로 추출
        const urlParts = existThumbnail.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `images/hospitalimg/${id_uuid_hospital}/thumbnail/${fileName}`;
        
        log.info(`썸네일 이미지 파일 삭제: ${filePath}`);
        
        const { error: storageError } = await supabase.storage
          .from(STORAGE_IMAGES)
          .remove([filePath]);

        if (storageError) {
          console.error('썸네일 이미지 파일 삭제 실패:', storageError);
        } else {
          log.info(`썸네일 이미지 파일 삭제 성공: ${filePath}`);
        }
      } catch (error) {
        console.error('썸네일 이미지 파일 삭제 중 오류:', error);
      }
    }

    // 2. 클라이언트에서 명시적으로 삭제된 썸네일 이미지 처리
    if (deletedThumbnailUrl && deletedThumbnailUrl !== existThumbnail) {
      log.info('- 추가로 삭제할 썸네일 이미지 URL:', deletedThumbnailUrl);
      
      try {
        // Storage에서 파일 경로 추출
        const urlParts = deletedThumbnailUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `images/hospitalimg/${id_uuid_hospital}/thumbnail/${fileName}`;
        
        log.info(`- 추가 썸네일 이미지 파일 제거: ${filePath}`);
        
        const { error: storageError } = await supabase.storage
          .from(STORAGE_IMAGES)
          .remove([filePath]);

        if (storageError) {
          console.error('추가 썸네일 이미지 파일 제거 실패:', storageError);
        } else {
          log.info(`- 추가 썸네일 이미지 파일 제거 성공: ${filePath}`);
        }
      } catch (error) {
        console.error('추가 썸네일 이미지 파일 제거 중 오류:', error);
      }
    }

    // 3. 클라이언트에서 명시적으로 삭제된 병원 이미지 파일들 처리
    if (deletedClinicUrls.length > 0) {
      log.info('- 클라이언트에서 삭제된 병원 이미지 URL들:', deletedClinicUrls);
      
      for (const deletedUrl of deletedClinicUrls) {
        try {
          // Storage에서 파일 경로 추출
          const urlParts = deletedUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `images/hospitalimg/${id_uuid_hospital}/hospitals/${fileName}`;
          
          log.info(`- 삭제된 병원 이미지 파일 제거: ${filePath}`);
          
          const { error: storageError } = await supabase.storage
            .from(STORAGE_IMAGES)
            .remove([filePath]);

          if (storageError) {
            console.error('삭제된 병원 이미지 파일 제거 실패:', storageError);
          } else {
            log.info(`- 삭제된 병원 이미지 파일 제거 성공: ${filePath}`);
          }
        } catch (error) {
          console.error('삭제된 병원 이미지 파일 제거 중 오류:', error);
        }
      }
    }

    // 4. 기존 이미지와 최종 이미지 비교하여 추가로 삭제할 이미지들 처리
    if (isEditMode && existingClinicUrls.length > 0) {
      const additionalDeletedImageUrls = existingClinicUrls.filter(
        (url: string) => !finalClinicImageUrls.includes(url) && !deletedClinicUrls.includes(url)
      );
      
      if (additionalDeletedImageUrls.length > 0) {
        log.info('- 추가로 삭제할 병원 이미지 URL들:', additionalDeletedImageUrls);
        
        for (const deletedUrl of additionalDeletedImageUrls) {
          try {
            // Storage에서 파일 경로 추출
            const urlParts = deletedUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `images/hospitalimg/${id_uuid_hospital}/hospitals/${fileName}`;
            
            log.info(`- 추가 병원 이미지 파일 삭제: ${filePath}`);
            
            const { error: storageError } = await supabase.storage
              .from(STORAGE_IMAGES)
              .remove([filePath]);

            if (storageError) {
              console.error('추가 병원 이미지 파일 삭제 실패:', storageError);
            } else {
              log.info(`- 추가 병원 이미지 파일 삭제 성공: ${filePath}`);
            }
          } catch (error) {
            console.error('추가 병원 이미지 파일 삭제 중 오류:', error);
          }
        }
      }
    }

    // 5. 병원 테이블 업데이트 (썸네일 이미지 URL과 최종 이미지 URL 배열)
    log.info('병원 테이블 업데이트 시작:', {
      id_uuid_hospital,
      thumbnail_url: finalThumbnailUrl,
      imageurls: finalClinicImageUrls
    });
    
    const { data: hospitalUpdateData, error: hospitalUpdateError } = await supabase
      .from(TABLE_HOSPITAL)
      .update({ 
        thumbnail_url: finalThumbnailUrl,
        imageurls: finalClinicImageUrls 
      })
      .eq('id_uuid', id_uuid_hospital)
      .select();

    if (hospitalUpdateError) {
      console.error('병원 테이블 업데이트 실패:', hospitalUpdateError);
      return NextResponse.json({
        message: `병원 테이블 업데이트 실패: ${hospitalUpdateError.message}`,
        status: "error",
      }, { status: 500 });
    }

    log.info('병원 테이블 업데이트 성공:', hospitalUpdateData);

    // 각 의사 정보 처리
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      
      log.info(`의사 ${i + 1} 처리:`, {
        id_uuid: doctor.id_uuid,
        name: doctor.name,
        image_url: doctor.image_url,
        isExisting: !!doctor.id_uuid,
        imageUrlLength: doctor.image_url?.length || 0
      });
      
      // 의사 데이터 준비 (이미지 URL은 이미 클라이언트에서 업로드 완료)
      const doctorData = {
        id_uuid_hospital,
        name: doctor.name,
        bio: doctor.bio || '',
        image_url: doctor.image_url || '',
        chief: doctor.chief,
      };

      if (doctor.id_uuid) {
        // 기존 의사 정보 업데이트
        log.info(`- 의사 정보 업데이트: ${doctor.name} (${doctor.id_uuid})`);
        log.info(`  업데이트할 이미지 URL: ${doctorData.image_url}`);

        // 먼저 해당 의사가 존재하는지 확인
        const { data: existingDoctor, error: checkError } = await supabase
          .from(TABLE_DOCTOR)
          .select('*')
          .eq('id_uuid', doctor.id_uuid)
          .single();

        if (checkError) {
          log.info(`- 의사 ${doctor.name} (${doctor.id_uuid}) 존재하지 않음, 새로 추가`);
          
          // 존재하지 않으면 새로 추가
          const { data: insertData, error: insertError } = await supabase
            .from(TABLE_DOCTOR)
            .insert([{ ...doctorData, id_uuid: doctor.id_uuid }])
            .select();

          if (insertError) {
            console.error('의사 정보 추가 실패:', insertError);
            return NextResponse.json({
              message: `의사 정보 추가 실패: ${insertError.message}`,
              status: "error",
            }, { status: 500 });
          }
          
          log.info(`- 새 의사 정보 추가 성공: ${doctor.name}`, insertData);
        } else {
          log.info(`- 의사 ${doctor.name} (${doctor.id_uuid}) 존재함, 업데이트 진행`);

          // 기존 이미지 URL 확인
          const existingImageUrl = existingDoctor.image_url;
          const newImageUrl = doctorData.image_url;

          // 이미지가 변경되었고, 기존 이미지가 기본 이미지가 아닌 경우 삭제
          if (existingImageUrl !== newImageUrl && 
              existingImageUrl && 
              !existingImageUrl.includes('/default/')) {
            try {
              // Storage에서 파일 경로 추출
              const urlParts = existingImageUrl.split('/');
              const filePath = urlParts.slice(urlParts.indexOf('images') + 1).join('/');
              
              log.info(`- 의사 이전 이미지 파일 삭제: ${filePath}`);
              
              const { error: storageError } = await supabase.storage
                .from(STORAGE_IMAGES)
                .remove([filePath]);
          
              if (storageError) {
                console.error('의사 이전 이미지 파일 삭제 실패:', storageError);
              } else {
                log.info(`- 의사 이전 이미지 파일 삭제 성공: ${filePath}`);
              }
            } catch (error) {
              console.error('의사 이전 이미지 파일 삭제 중 오류:', error);
            }
          }
          
          // 존재하면 업데이트
          const { data: updateData, error: updateError } = await supabase
            .from(TABLE_DOCTOR)
            .update(doctorData)
            .eq('id_uuid', doctor.id_uuid)
            .select();

          if (updateError) {
            console.error('의사 정보 업데이트 실패:', updateError);
            return NextResponse.json({
              message: `의사 정보 업데이트 실패: ${updateError.message}`,
              status: "error",
            }, { status: 500 });
          }
          
          log.info(`- 의사 정보 업데이트 성공: ${doctor.name}`, updateData);
        }
      } else {
        // 새 의사 정보 추가
        log.info(`- 새 의사 정보 추가: ${doctor.name}`);
        const { data: insertData, error: insertError } = await supabase
          .from(TABLE_DOCTOR)
          .insert([{ ...doctorData, id_uuid: uuidv4() }])
          .select();

        if (insertError) {
          console.error('의사 정보 추가 실패:', insertError);
          return NextResponse.json({
            message: `의사 정보 추가 실패: ${insertError.message}`,
            status: "error",
          }, { status: 500 });
        }
        
        log.info(`- 새 의사 정보 추가 성공: ${doctor.name}`, insertData);
      }
    }

    // 편집 모드에서 삭제된 의사들 처리
    if (isEditMode && existingData?.doctors) {
      const existingDoctorIds = existingData.doctors.map((d: any) => d.id_uuid);
      const currentDoctorIds = doctors.map((d: any) => d.id_uuid).filter(Boolean);
      const deletedDoctorIds = existingDoctorIds.filter((id: string) => !currentDoctorIds.includes(id));

      for (const deletedId of deletedDoctorIds) {
        log.info(`- 삭제된 의사 처리: ${deletedId}`);

        // 삭제할 의사의 이미지 URL 찾기
        const deletedDoctor = existingData.doctors.find((d: any) => d.id_uuid === deletedId);
        if (deletedDoctor?.image_url && !deletedDoctor.image_url.includes('/default/')) {
          try {
            // Storage에서 파일 경로 추출
            const urlParts = deletedDoctor.image_url.split('/');
            const filePath = urlParts.slice(urlParts.indexOf('images') + 1).join('/');
            
            log.info(`- 의사 이미지 파일 삭제: ${filePath}`);
            
            const { error: storageError } = await supabase.storage
              .from(STORAGE_IMAGES)
              .remove([filePath]);

            if (storageError) {
              console.error('의사 이미지 파일 삭제 실패:', storageError);
            } else {
              log.info(`- 의사 이미지 파일 삭제 성공: ${filePath}`);
            }
          } catch (error) {
            console.error('의사 이미지 파일 삭제 중 오류:', error);
          }
        }
        
        // 의사 정보 삭제
        const { error: deleteError } = await supabase
          .from(TABLE_DOCTOR)
          .delete()
          .eq('id_uuid', deletedId);
          
        if (deleteError) {
          console.error('의사 정보 삭제 실패:', deleteError);
          return NextResponse.json({
            message: `의사 정보 삭제 실패: ${deleteError.message}`,
            status: "error",
          }, { status: 500 });
        }
        
        log.info(`- 의사 정보 삭제 성공: ${deletedId}`);
      }
    }

    log.info('=== uploadStep3 성공 완료 ===');
  
    return NextResponse.json({
      message: "썸네일 이미지, 병원 이미지 및 의사 정보가 성공적으로 저장되었습니다.",
      status: "success",
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('uploadStep3 전체 오류:', error);
    return NextResponse.json({
      message: `처리 중 오류가 발생했습니다: ${error}`,
      status: "error",
    }, { status: 500, headers: corsHeaders });
  }
} 