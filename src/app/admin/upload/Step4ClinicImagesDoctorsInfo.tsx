'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { loadExistingHospitalData } from '@/lib/hospitalDataLoader';
// import { uploadHospitalImages, uploadDoctorImages } from '@/lib/clinicUploadApi';
import { prepareFormData } from '@/lib/formDataHelper';
import { uploadAPI, formatApiError, isApiSuccess } from '@/lib/api-client';
import { DoctorInfo } from '@/components/DoctorInfoForm';
import Button from '@/components/Button';
import PageHeader from '@/components/PageHeader';
import ClinicImageUploadSection from '@/components/ClinicImageUploadSection';
import DoctorInfoSection from '@/components/DoctorInfoSection';
import LoadingSpinner from '@/components/LoadingSpinner';
import useModal from '@/hooks/useModal';

import Divider from '@/components/Divider';

import { mapExistingDataToFormValues } from '@/lib/hospitalDataMapper';
import { STORAGE_IMAGES } from '@/constants/tables';
import { supabase } from '@/lib/supabaseClient';
import { ExistingHospitalData } from '@/types/hospital';
import ClinicImageThumbnailUploadSection from '@/components/ClinicImageThumbnailUploadSection';
import PageBottom from '@/components/PageBottom';

interface Surgery {
  created_at: string;
  description: string;
  id: number;
  id_unique: number;
  imageurls: string[];
  name: string;
  type: string;
}

const doctorImageUploadLength = 3;
const clinicImageUploadLength = 7;

interface Step4ClinicImagesDoctorsInfoProps {
  id_uuid_hospital: string;
  currentUserUid: string;
  isEditMode?: boolean; // 편집 모드 여부
  onPrev: () => void;
  onNext: () => void;
}

const Step4ClinicImagesDoctorsInfo = ({
  id_uuid_hospital,
  currentUserUid,
  isEditMode = false,
  onPrev,
  onNext,
}: Step4ClinicImagesDoctorsInfoProps) => {
    log.info('qqqqqqqqq Step4ClinicImagesDoctorsInfo oooㄹㄹ id_uuid_hospital', id_uuid_hospital);
  const router = useRouter();
  const [clinicThumbnail, setClinicThumbnail] = useState<File | string | null>(null);
  const [clinicImages, setClinicImages] = useState<File[]>(
    [],
  );
  
  const [formState, setFormState] = useState<{
    message?: string;
    status?: string;
    errorType?: 'validation' | 'server' | 'success';
  } | null>(null);
  const [showFinalResult, setShowFinalResult] =
    useState(false);
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [isLoadingExistingData, setIsLoadingExistingData] =
    useState(false);

  const [existingData, setExistingData] =
    useState<ExistingHospitalData | null>(null);
  // 원본 썸네일 URL 보관 (삭제 비교용)
  const [originalThumbnailUrl, setOriginalThumbnailUrl] = useState<string | null>(null);
  // 삭제된 이미지 URL 추적
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  // 현재 표시되고 있는 이미지 URL들 추적
  const [currentDisplayedUrls, setCurrentDisplayedUrls] = useState<string[]>([]);

  const [previewValidationMessages, setPreviewValidationMessages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const { handleOpenModal, open } = useModal();

  useEffect(() => {
    if (formState?.message && showFinalResult) {
      handleOpenModal();
    }
  }, [formState, showFinalResult]);

  useEffect(() => {
    log.info(
      `isEditMode: ${isEditMode}, currentUserUid: ${currentUserUid}`,
    );
    if (isEditMode && currentUserUid) {
      log.info('Step3 편집 모드 - 기존 데이터 로드');
      loadExistingDataForEdit();
    }
  }, [isEditMode, currentUserUid]);

  useEffect(() => {
    log.info('Step3 - existingData 변경됨:', existingData);
    log.info('Step3 - hospital imageurls:', existingData?.hospital?.imageurls);
    log.info('Step3 - hospital thumbnail_url:', existingData?.hospital?.thumbnail_url);
    log.info('Step3 - doctors:', existingData?.doctors);
  }, [existingData]);

  useEffect(() => {
    log.info('Step3 - doctors 상태 변경됨:', doctors);
  }, [doctors]);

  const loadExistingDataForEdit = async () => {
    try {
      setIsLoadingExistingData(true);
      log.info(' 편집 모드 - 기존 데이터 로딩 시작');

      const data =
        await loadExistingHospitalData(currentUserUid, id_uuid_hospital, 3);
      if (data) {
        log.info('Step3 - 로드된 데이터:', data);
        log.info('Step3 - hospital 데이터:', data.hospital);
        log.info('Step3 - doctors 데이터:', data.doctors);
        
        setExistingData(data);
        
        // 썸네일 이미지 상태 초기화
        if (data.hospital?.thumbnail_url) {
          log.info('기존 썸네일 이미지 발견:', data.hospital.thumbnail_url);
          setClinicThumbnail(data.hospital.thumbnail_url);
          setOriginalThumbnailUrl(data.hospital.thumbnail_url);
        } else {
          log.info('썸네일 이미지가 없습니다');
          setClinicThumbnail(null);
          setOriginalThumbnailUrl(null);
        }
        
        // 의사 데이터 설정
        if (data.doctors && data.doctors.length > 0) {
          const existingDoctors = data.doctors.map((doctor: any) => ({
            id: doctor.id_uuid || uuidv4(),
            name: doctor.name,
            bio: doctor.bio || '',
            isChief: doctor.chief === 1,
            useDefaultImage: doctor.image_url?.includes('/default/') || false,
            defaultImageType: (doctor.image_url?.includes('woman') ? 'woman' : 'man') as 'man' | 'woman',
            imageFile: undefined,
            imagePreview: doctor.image_url,
            isExistingImage: true,
            originalImageUrl: doctor.image_url,
          }));
          
          setDoctors(existingDoctors);
          log.info('기존 의사 데이터 로드 완료:', existingDoctors);
        }
        
        populateFormWithExistingData(data);
        log.info(' 편집 모드 - 기존 데이터 로딩 완료');
      } else {
        log.info(' 편집 모드 - 기존 데이터가 없습니다');
      }
    } catch (error) {
      console.error(
        ' 편집 모드 - 데이터 로딩 실패:',
        error,
      );
      setFormState({
        message: '기존 데이터를 불러오는데 실패했습니다.',
        status: 'error',
        errorType: 'server',
      });
      setShowFinalResult(true);
    } finally {
      setIsLoadingExistingData(false);
    }
  };

  const populateFormWithExistingData = (
    existingData: ExistingHospitalData,
  ) => {
    log.info('폼에 기존 데이터 적용 시작');

    try {
      const formData = mapExistingDataToFormValues(existingData);
      log.info('변환된 폼 데이터:', formData);

      setDoctors(formData.doctors);
      log.info(
        '의사 정보 설정 완료:',
        formData.doctors.length,
        '명',
      );
    } catch (error) {
      console.error('기존 데이터 적용 중 오류:', error);
    }
  };

  const handleModal = () => {
    setShowFinalResult(false);
    handleOpenModal();
  };

  const validateFormDataAndUpdateUI = (returnMessage = false) => {
    const clinicNameInput = document.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    const clinicName = clinicNameInput?.value || '';

    return { isValid: true, messages: [] };
  };

  // const handlePreview = async () => {
  //   try {
  //     log.info('handlePreview 3');

  //     const validationResult = validateFormDataAndUpdateUI(true);
  //     if (!validationResult.isValid) {
  //       setPreviewValidationMessages(validationResult.messages || []);
  //       setIsSubmitting(false);
  //       setShowConfirmModal(true);
  //       return;
  //     }
    
  //     setPreviewValidationMessages([]);
  //   } catch (error) {
  //     console.error('미리보기 데이터 준비 중 오류:', error);
  //     setFormState({
  //       message: '미리보기 데이터 준비 중 오류가 발생했습니다.',
  //       status: 'error',
  //       errorType: 'server',
  //     });
  //     setShowFinalResult(true);
  //   }
  // };

  const [showConfirmModal, setShowConfirmModal] =
    useState(false);
  const [preparedFormData, setPreparedFormData] =
    useState<FormData | null>(null);
  

//   const handleFinalSubmit = async () => {
//     if (!preparedFormData) return;

//     setIsSubmitting(true);

//     try {
//       log.info('최종 제출 시작...');

//       preparedFormData.append('is_edit_mode', isEditMode ? 'true' : 'false');
//       if (isEditMode && existingData) {
//         preparedFormData.append('existing_data', JSON.stringify(existingData));
//       }

//       const calculateFormDataSize = (
//         formData: FormData,
//       ) => {
//         let totalSize = 0;
//         let textDataSize = 0;
//         const details: any[] = [];

//         for (const [key, value] of formData.entries()) {
//           const textBytes = new TextEncoder().encode(
//             value.toString(),
//           ).length;
//           textDataSize += textBytes;
//           totalSize += textBytes;

//           details.push({
//             key,
//             type: 'TextData',
//             value:
//               value.toString().substring(0, 100) +
//               (value.toString().length > 100 ? '...' : ''),
//             size: textBytes,
//             sizeKB: (textBytes / 1024).toFixed(4),
//             category: getCategoryForKey(key),
//           });
//         }

//         return {
//           totalSize,
//           textDataSize,
//           totalSizeKB: (totalSize / 1024).toFixed(2),
//           totalSizeMB: (totalSize / (1024 * 1024)).toFixed(
//             4,
//           ),
//           textDataSizeKB: (textDataSize / 1024).toFixed(4),
//           details,
//         };
//       };

//       const getCategoryForKey = (key: string) => {
//         if (key.includes('image_urls')) return 'Image URLs';
//         if (key.includes('address')) return 'Address Info';
//         if (
//           key.includes('treatment') ||
//           key.includes('selected_treatments')
//         )
//           return 'Treatment Info';
//         if (key.includes('opening_hours'))
//           return 'Business Hours';
//         if (key.includes('extra_options'))
//           return 'Facility Options';
//         if (key.includes('location')) return 'Location';
//         if (
//           key === 'name' ||
//           key === 'searchkey' ||
//           key === 'search_key' ||
//           key === 'id_uuid'
//         )
//           return 'Basic Info';
//         return 'Other';
//       };

//       const sizeInfo = calculateFormDataSize(
//         preparedFormData,
//       );

//       log.info(
//         '===== FormData 크기 분석 (개선된 구조) =====',
//       );
//       log.info(
//         `전체 크기 (Server Actions로 전송): ${sizeInfo.totalSizeMB} MB (${sizeInfo.totalSizeKB} KB)`,
//       );
//       log.info(
//         `텍스트 데이터 크기: ${sizeInfo.textDataSizeKB} KB (이미지 URL 포함)`,
//       );
//       log.info('');
//       log.info(
//         '이미지 파일은 이미 Supabase Storage에 업로드 완료!',
//       );
//       log.info(
//         'Server Actions에는 이미지 URL만 전송되므로 크기 제한 해결!',
//       );
//       log.info('상세 내역:');

//       const groupedByCategory = sizeInfo.details.reduce(
//         (acc: any, item) => {
//           const category = item.category || item.type;
//           if (!acc[category]) acc[category] = [];
//           acc[category].push(item);
//           return acc;
//         },
//         {},
//       );

//       Object.entries(groupedByCategory).forEach(
//         ([category, items]: [string, any]) => {
//           log.info(`\n  ${category}:`);
//           items.forEach((item: any) => {
//             log.info(
//               `    ${item.key}: ${item.sizeKB} KB - "${item.value}"`,
//             );
//           });
//         },
//       );

//       const limitMB = 1;
//       const limitBytes = limitMB * 1024 * 1024;
//       const isOverLimit = sizeInfo.totalSize > limitBytes;

//       if (isOverLimit) {
//         console.warn(
//           `여전히 Server Actions 크기 제한 초과 (예상되지 않음)`,
//         );
//         console.warn(
//           `현재: ${sizeInfo.totalSizeMB} MB, 제한: ${limitMB} MB`,
//         );

//         setFormState({
//           message: `데이터 크기가 여전히 큽니다: ${sizeInfo.totalSizeMB} MB`,
//           status: 'error',
//           errorType: 'server',
//         });

//         setShowConfirmModal(false);
//         setPreparedFormData(null);
//         return;
//       } else {
//         log.info(
//           `Server Actions 크기 제한 통과: ${sizeInfo.totalSizeMB} MB < ${limitMB} MB`,
//         );
//         log.info(
//           `모든 데이터가 텍스트: ${sizeInfo.textDataSizeKB} KB`,
//         );
//       }

//       log.info('FormData 내용 확인:');

//       for (const [
//         key,
//         value,
//       ] of preparedFormData.entries()) {
//         if (value instanceof File) {
//           log.info(
//             `  - ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(2)} KB)`,
//           );
//         } else {
//           const preview =
//             value.toString().length > 50
//               ? value.toString().substring(0, 50) + '...'
//               : value.toString();
//           log.info(`  - ${key}: "${preview}"`);
//         }
//       }

//       const result = await uploadActions(
//         null,
//         preparedFormData,
//       );

//       log.info('uploadActions 응답:', result);
//       setFormState(result);
//       setShowFinalResult(true);

//       setShowConfirmModal(false);
//       setPreparedFormData(null);
//     } catch (error) {
//       console.error('uploadActions 호출 에러:', error);

//       let errorMessage = '업로드 중 오류가 발생했습니다.';

//       if (error instanceof Error && error.message) {
//         errorMessage = `업로드 오류: ${error.message}`;
//       }

//       setFormState({
//         message: errorMessage,
//         status: 'error',
//         errorType: 'server',
//       });
//       setShowFinalResult(true);
//       setShowConfirmModal(false);
//       setPreparedFormData(null);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

  // const handleModalCancel = () => {
  //   setShowConfirmModal(false);
  //   setPreparedFormData(null);
  // };

  if (
    isLoadingExistingData
  )
    return <LoadingSpinner backdrop />;

  const handleNext = async () => {
    log.info('handleNext Step3');
    setIsSubmitting(true);
    const result = await handleSave();
    log.info('handleNext Step3 handlSave after result', result);
    document.body.style.overflow = '';
    setIsSubmitting(false);
    if (result?.status === 'success') {
        log.info('handleNext Step3 handlSave success');
        
        onNext();
    } else {
        log.info('handleNext Step3 handlSave what? :', result);
    }
  };
 
  const generateFileName = (originalName: string, prefix: string = '') => {
    const timestamp = Date.now();
    const uuid = crypto.randomUUID().split('-')[0];
    const extension = originalName.split('.').pop() || 'jpg';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    
    return `${prefix}${sanitizedName}_${uuid}_${timestamp}.${extension}`;
  };

  const generateHospitalImageFileName = (originalName: string) => {
    return generateFileName(originalName, 'hospital_');
  };

  const generateDoctorImageFileName = (originalName: string, doctorName: string) => {
    const nameSlug = doctorName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return generateFileName(originalName, `doctor_${nameSlug}_`);
  };

  const uploadImageToStorage = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(STORAGE_IMAGES)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_IMAGES)
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  const handleSave = async () => {
    log.info('handleSave Step3');
    
    try {
      // 기존 병원 썸네일 이미지 (원본 데이터에서 가져옴)
      const existingClinicThumbnailUrl = originalThumbnailUrl;
      log.info('기존 병원 썸네일 이미지 (원본):', existingClinicThumbnailUrl);

      // 새로 업로드된 썸네일 이미지 URL
      let newThumbnailImageUrl: string | null = null;
      
      // 1. 썸네일 이미지 업로드
      if (clinicThumbnail && clinicThumbnail instanceof File) {
        log.info('썸네일 이미지 업로드 시작:', clinicThumbnail.name);
        
        try {
          // 고유한 파일명 생성
          const timestamp = Date.now();
          const uuid = crypto.randomUUID().split('-')[0];
          const extension = clinicThumbnail.name.split('.').pop() || 'jpg';
          const fileName = `thumbnail_${id_uuid_hospital}_${uuid}_${timestamp}.${extension}`;
          
          const filePath = `images/hospitalimg/${id_uuid_hospital}/thumbnail/${fileName}`;
          
          const { data, error } = await supabase.storage
            .from(STORAGE_IMAGES)
            .upload(filePath, clinicThumbnail, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from(STORAGE_IMAGES)
            .getPublicUrl(filePath);

          newThumbnailImageUrl = urlData.publicUrl;
          log.info('썸네일 이미지 업로드 성공:', fileName);
        } catch (error) {
          console.error('썸네일 이미지 업로드 실패:', error);
          throw error;
        }
      }

      // 2. 썸네일 이미지 상태 결정
      // exist: 로딩된 기존 이미지 (existingClinicThumbnailUrl)
      // cur: 현재 설정된 이미지 (finalThumbnailImageUrl)
      const existThumbnail = existingClinicThumbnailUrl;
      const curThumbnail = newThumbnailImageUrl || 
        (clinicThumbnail && typeof clinicThumbnail === 'string' ? clinicThumbnail : null);
      
      log.info('썸네일 이미지 상태 비교:');
      log.info('- exist (기존):', existThumbnail);
      log.info('- cur (현재):', curThumbnail);
      log.info('- 변경사항 있음:', existThumbnail !== curThumbnail);
      
      // 3. 변경사항이 있으면 기존 이미지 삭제 예약
      let shouldDeleteExistingThumbnail = false;
      if (existThumbnail && existThumbnail !== curThumbnail && !existThumbnail.includes('/default/')) {
        shouldDeleteExistingThumbnail = true;
        log.info('기존 썸네일 이미지 삭제 예약:', existThumbnail);
      }
      
      // 4. 최종 썸네일 URL 결정
      const finalThumbnailImageUrl = curThumbnail;

      // 기존 이미지 URL 배열
      const existingClinicUrls = existingData?.hospital?.imageurls || [];
      log.info('기존 이미지 URLs:', existingClinicUrls);
      
      // 새로 업로드할 이미지들 (File 객체만 필터링)
      const newClinicImages = clinicImages.filter(img => img instanceof File);
      log.info('새로 업로드할 이미지 개수:', newClinicImages.length);
      
      // 새로 업로드된 이미지 URL 배열
      const newClinicImageUrls: string[] = [];
      
      // 4. 새 이미지 업로드
      if (newClinicImages.length > 0) {
        log.info('병원 이미지 업로드 시작:', newClinicImages.length, '개');
        
        for (const file of newClinicImages) {
          try {
            // 고유한 파일명 생성 (타임스탬프 + UUID + 원본 확장자)
            const timestamp = Date.now();
            const uuid = crypto.randomUUID().split('-')[0];
            const extension = file.name.split('.').pop() || 'jpg';
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
            const fileName = `hospital_${sanitizedName}_${uuid}_${timestamp}.${extension}`;
            
            const filePath = `images/hospitalimg/${id_uuid_hospital}/hospitals/${fileName}`;
            
            const { data, error } = await supabase.storage
              .from(STORAGE_IMAGES)
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) throw error;

            const { data: urlData } = supabase.storage
              .from(STORAGE_IMAGES)
              .getPublicUrl(filePath);

            newClinicImageUrls.push(urlData.publicUrl);
            log.info('병원 이미지 업로드 성공:', fileName);
          } catch (error) {
            console.error('병원 이미지 업로드 실패:', error);
            throw error;
          }
        }
      }

      // 5. 기존 이미지와 새 이미지 비교하여 삭제할 이미지 찾기
      // ClinicImageUploadSection에서 현재 표시되고 있는 이미지들의 URL을 가져와야 함
      // 최종 이미지 URL 배열 (기존 URL + 새로 업로드된 URL)
      const finalClinicImageUrls = [...currentDisplayedUrls, ...newClinicImageUrls];
      
      log.info('현재 표시된 이미지 URLs:', currentDisplayedUrls);
      log.info('새로 업로드된 이미지 URLs:', newClinicImageUrls);
      log.info('최종 이미지 URLs:', finalClinicImageUrls);
      
      const toDelete = existingClinicUrls.filter((url: string) => !finalClinicImageUrls.includes(url));
      
      log.info('삭제할 이미지 URLs:', toDelete);
      
      // 6. 스토리지에서 삭제할 이미지들 제거
      if (toDelete.length > 0) {
        log.info('스토리지에서 이미지 삭제 시작:', toDelete.length, '개');
        
        for (const url of toDelete) {
          try {
            // URL에서 파일 경로 추출
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `images/hospitalimg/${id_uuid_hospital}/hospitals/${fileName}`;
            
            const { error } = await supabase.storage
              .from(STORAGE_IMAGES)
              .remove([filePath]);
              
            if (error) {
              console.error('스토리지 이미지 삭제 실패:', error);
            } else {
              log.info('스토리지 이미지 삭제 성공:', fileName);
            }
          } catch (error) {
            console.error('스토리지 이미지 삭제 중 오류:', error);
          }
        }
      }

      // 7. 의사 이미지 업로드 (기존 로직 유지하되 파일명 개선)
      const doctorImageUrls: string[] = [];
      const doctorsWithImages = doctors.filter(doctor => 
        doctor.imageFile && doctor.imageFile instanceof File
      );

      log.info('의사 이미지 업로드 시작:', doctorsWithImages.length, '개');
      
      for (const doctor of doctorsWithImages) {
        try {
          // 고유한 파일명 생성
          const timestamp = Date.now();
          const uuid = crypto.randomUUID().split('-')[0];
          const extension = doctor.imageFile!.name.split('.').pop() || 'jpg';
          const sanitizedDoctorName = doctor.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
          const fileName = `doctor_${sanitizedDoctorName}_${uuid}_${timestamp}.${extension}`;
          
          const filePath = `images/doctors/${id_uuid_hospital}/${fileName}`;
          
          const { data, error } = await supabase.storage
            .from(STORAGE_IMAGES)
            .upload(filePath, doctor.imageFile!, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from(STORAGE_IMAGES)
            .getPublicUrl(filePath);

          doctorImageUrls.push(urlData.publicUrl);
          log.info('의사 이미지 업로드 성공:', fileName);
        } catch (error) {
          console.error('의사 이미지 업로드 실패:', error);
          throw error;
        }
      }

      // 8. FormData 준비
      const formData = new FormData();
      formData.append('id_uuid_hospital', id_uuid_hospital);
      formData.append('current_user_uid', currentUserUid);
      formData.append('is_edit_mode', isEditMode ? 'true' : 'false');

      if (existingData) {
        formData.append('existing_data', JSON.stringify(existingData));
      }

      // 썸네일 이미지 관련 데이터
      formData.append('existing_thumbnail_url', existingClinicThumbnailUrl || '');
      formData.append('new_thumbnail_url', newThumbnailImageUrl || '');
      formData.append('final_thumbnail_url', finalThumbnailImageUrl || '');
      
      // 삭제된 썸네일 이미지 URL 전달
      // if (deletedImageUrlThumbnail) { // 이 부분은 사용하지 않음
      //   formData.append('deleted_thumbnail_url', deletedImageUrlThumbnail);
      //   log.info('삭제된 썸네일 이미지 URL 전달:', deletedImageUrlThumbnail);
      // }

      // 기존 이미지 URL과 새 이미지 URL 모두 전달
      formData.append('existing_clinic_urls', JSON.stringify(existingClinicUrls));
      formData.append('new_clinic_image_urls', JSON.stringify(newClinicImageUrls));
      formData.append('final_clinic_image_urls', JSON.stringify(finalClinicImageUrls));
      
      // 삭제된 이미지 URL 전달
      if (deletedImageUrls.length > 0) {
        formData.append('deleted_clinic_urls', JSON.stringify(deletedImageUrls));
        log.info('삭제된 이미지 URLs 전달:', deletedImageUrls);
      }

      // 9. 의사 데이터 처리 (기존 로직 유지)
      if (doctors.length > 0) {
        log.info('=== 의사 데이터 준비 시작 ===');
        log.info('doctors 배열:', doctors);
        log.info('doctors 배열 길이:', doctors.length);
        
        const doctorsData = doctors.map((doctor, index) => {
          log.info(`의사 ${index + 1} 처리:`, doctor);
          
          let imageUrl = '';
          
          if (doctor.useDefaultImage) {
            imageUrl = doctor.defaultImageType === 'woman' 
              ? '/default/doctor_default_woman.png'
              : '/default/doctor_default_man.png';
          } else if (doctor.imageFile && doctor.imageFile instanceof File) {
            const uploadedIndex = doctorsWithImages.findIndex(d => d === doctor);
            imageUrl = uploadedIndex >= 0 ? doctorImageUrls[uploadedIndex] : '';
          } else if (doctor.originalImageUrl) {
            imageUrl = doctor.originalImageUrl;
          }

          const doctorData = {
            id_uuid: doctor.id || null,
            name: doctor.name,
            bio: doctor.bio || '',
            image_url: imageUrl,
            chief: doctor.isChief ? 1 : 0,
            useDefaultImage: doctor.useDefaultImage,
            defaultImageType: doctor.defaultImageType,
          };
          
          log.info(`의사 ${index + 1} 최종 데이터:`, doctorData);
          return doctorData;
        });

        log.info('=== 최종 의사 데이터 ===');
        log.info('doctorsData:', doctorsData);
        log.info('doctorsData JSON:', JSON.stringify(doctorsData));
        
        formData.append('doctors', JSON.stringify(doctorsData));
        log.info('FormData에 의사 데이터 추가 완료');
      } else {
        log.info('의사 데이터가 없습니다.');
      }

      log.info('Step3 uploadActionStep3 before formData:', formData);
      
      log.info('Step3 API 호출 시작');
      
      // 새로운 API Route 호출
      const result = await uploadAPI.step4(formData);
      log.info('Step3 API 응답:', result);
      
      if (!isApiSuccess(result)) {
        // 에러 발생 시 처리
        const errorMessage = formatApiError(result.error);
        
        setFormState({
          message: errorMessage,
          status: 'error',
          errorType: 'server',
        });
        setShowFinalResult(true);
        return { status: 'error' };
      }

      log.info('Step3 데이터 저장 성공');
      return { status: 'success' };
      
    } catch (error) {
      console.error('Step3 API 호출 에러:', error);
      
      const errorMessage = formatApiError(error);
      
      setFormState({
        message: errorMessage,
        status: 'error',
        errorType: 'server',
      });
      setShowFinalResult(true);
      return { status: 'error' };
    }
  };



  return (
    <main>
      <div
        className='my-8 mx-auto px-6'
        style={{ width: '100vw', maxWidth: '1024px' }}
      >
        
          <ClinicImageThumbnailUploadSection
            title='병원 썸네일 이미지'
            description={`-   병원들 리스트에서 다른 병원들과 함께 리스트로 나올 '썸네일' 이미지 입니다.
              검색화면, 지역별 병원 등 다양한 곳에서 다른병원들과 함께 나옵니다.
              1개만 등록해주세요.
              * 450 * 300 px  권장입니다. 
             * 1.5:1 비율로 권장합니다. 비율이 다를 경우 중앙기준으로 알아서 외곽은 잘립니다.
              * File 한개 500KB 이하(권장)로 업로드 해주세요.  `}
            onFileChange={setClinicThumbnail}
            name='clinic_images'
            initialImage={clinicThumbnail && typeof clinicThumbnail === 'string' ? clinicThumbnail : null}
            onCurrentImageChange={(currentUrl) => {
              log.info('현재 썸네일 이미지:', currentUrl);
            }}
          />
        
        <Divider />
        <ClinicImageUploadSection
          maxImages={clinicImageUploadLength}
          title='병원 상세페이지 슬라이드형 소개 이미지'
          description={`- 병원 메인 이미지는 가로로 긴 직사각형(권장 비율: 16:9 또는 3:1)으로 업로드해 주세요.
   · 예시: 권장: 해상도 640 x 240 px 이상 (8:3) 2MB이하 권장 
  · 알림: 주어진 사진을 중앙을 기준으로 8:3  비율로 넘치는 부분이 자동으로 잘라집니다.
      사진이 비율보다 작으면 가로기준으로 비율을 맞춰서 자동으로 확대해서 화면에 맞춰줍니다.
      * File 한개당 20MB 이하(권장)로 업로드 해주세요.
      * 최소(3개이상) - 최대(권장) 7개까지 업로드 가능합니다. 추가 업로드 원하시면 문의 부탁드립니다.
      * (대표이미지) 추가 된 순서대로 보여지며 첫번째 이미지가 대표 이미지가 됩니다.`}
          onFilesChange={setClinicImages}
          name='clinic_images'
          type='Banner'
          initialImages={existingData?.hospital?.imageurls || []}
          onExistingDataChange={setExistingData}
          onDeletedImagesChange={setDeletedImageUrls}
          onCurrentImagesChange={setCurrentDisplayedUrls}
        />
        <Divider />
        <DoctorInfoSection
          title='의사 정보 등록'
          description={`- 의사 프로필 정보를 입력하고 이미지를 등록하세요.
- 이미지는 정사각형(1:1) 비율로 자동 조정됩니다.
- 기본 이미지를 사용하거나 직접 업로드할 수 있습니다.`}
          onDoctorsChange={setDoctors}
          initialDoctors={doctors}
        />
        <Divider />
       </div>

      <PageBottom step={4} isSubmitting={isSubmitting} onNext={handleNext} onPrev={onPrev} />
      {/* 기본 모달 */}
      {formState?.message && showFinalResult && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">{formState.status === 'success' ? '성공' : '오류'}</h3>
            <p className="text-sm text-gray-800 mb-4 whitespace-pre-line">{formState.message}</p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowFinalResult(false)}>확인</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Step4ClinicImagesDoctorsInfo;
