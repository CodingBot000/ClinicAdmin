'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { loadExistingHospitalData } from '@/lib/hospitalDataLoader';
// import { uploadHospitalImages, uploadDoctorImages } from '@/lib/clinicUploadApi';
import { prepareFormData } from '@/lib/formDataHelper';
import { uploadActionsStep3 } from './actions/uploadStep3';
import { DoctorInfo } from '@/components/DoctorInfoForm';
import Button from '@/components/Button';
import PageHeader from '@/components/PageHeader';
import ClinicImageUploadSection from '@/components/ClinicImageUploadSection';
import DoctorInfoSection from '@/components/DoctorInfoSection';
import LoadingSpinner from '@/components/LoadingSpinner';
import useModal from '@/hooks/useModal';
// import { Modal } from '@/components/modal/Modal';
import { useTimer } from '@/hooks/useTimer';
import { useFormAction } from '@/hooks/useFormAction';
import InputField, { TextArea } from '@/components/InputField';
import { useTreatmentCategories } from '@/hooks/useTreatmentCategories';
import { PreviewModal, FormDataSummary } from '@/components/modal/PreviewModal';
import type { CategoryNode } from '@/types/category';
import AddressSection from '@/components/AddressSection';
import LocationSelect from '@/components/LocationSelect';
import { TreatmentSelectBox } from '@/components/TreatmentSelectBox';
import OpeningHoursForm, {
  OpeningHour,
} from '@/components/OpeningHoursForm';
import ExtraOptions, {
  ExtraOptionState,
} from '@/components/ExtraOptions';
import { HAS_ANESTHESIOLOGIST, HAS_CCTV, HAS_FEMALE_DOCTOR, HAS_NIGHT_COUNSELING, HAS_PARKING, HAS_PRIVATE_RECOVERY_ROOM } from '@/constants/extraoptions';
import { validateFormData } from '@/utils/validateFormData';
import BasicInfoSection from '@/components/BasicInfoSection';
import Divider from '@/components/Divider';
import AvailableLanguageSection from '@/components/AvailableLanguageSection';
import { HospitalAddress } from '@/types/address';
import { mapExistingDataToFormValues } from '@/lib/hospitalDataMapper';
import { STORAGE_IMAGES } from '@/constants/tables';
import { supabase } from '@/lib/supabaseClient';
import { ExistingHospitalData } from '@/types/hospital';

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

interface Step3ClinicImagesDoctorsInfoProps {
  id_uuid_hospital: string;
  currentUserUid: string;
  isEditMode?: boolean; // 편집 모드 여부
  onPrev: () => void;
  onNext: () => void;
}

export interface BasicInfo {
  name: string;
  email: string;
  tel: string;
  kakao_talk: string;
  line: string;
  we_chat: string;
  whats_app: string;
  telegram: string;
  facebook_messenger: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  other_channel: string;
  sns_content_agreement: 1 | 0 | null;
}

const Step3ClinicImagesDoctorsInfo = ({
  id_uuid_hospital,
  currentUserUid,
  isEditMode = false,
  onPrev,
  onNext,
}: Step3ClinicImagesDoctorsInfoProps) => {
    console.log('qqqqqqqqq Step3ClinicImagesDoctorsInfo oooㄹㄹ id_uuid_hospital', id_uuid_hospital);
  const router = useRouter();
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

  const { handleOpenModal, open } = useModal();

  useEffect(() => {
    if (formState?.message && showFinalResult) {
      handleOpenModal();
    }
  }, [formState, showFinalResult]);

  useEffect(() => {
    console.log(
      `isEditMode: ${isEditMode}, currentUserUid: ${currentUserUid}`,
    );
    if (isEditMode && currentUserUid) {
      console.log('Step3 뒤로가기 감지 - 기존 데이터 다시 로드');
      loadExistingData();
    }
  }, [isEditMode, currentUserUid]);

  useEffect(() => {
  }, [existingData]);

  const loadExistingDataForEdit = async () => {
    try {
      setIsLoadingExistingData(true);
      console.log(' 편집 모드 - 기존 데이터 로딩 시작');

      const data =
        await loadExistingHospitalData(currentUserUid, id_uuid_hospital, 3);
      if (data) {
        setExistingData(data);
        populateFormWithExistingData(data);
        console.log(' 편집 모드 - 기존 데이터 로딩 완료');
      } else {
        console.log(' 편집 모드 - 기존 데이터가 없습니다');
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
    console.log('폼에 기존 데이터 적용 시작');

    try {
      const formData = mapExistingDataToFormValues(existingData);
      console.log('변환된 폼 데이터:', formData);

      setDoctors(formData.doctors);
      console.log(
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

  const [previewValidationMessages, setPreviewValidationMessages] = useState<string[]>([]);

  const validateFormDataAndUpdateUI = (returnMessage = false) => {
    const clinicNameInput = document.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    const clinicName = clinicNameInput?.value || '';

    return { isValid: true, messages: [] };
  };

  const handlePreview = async () => {
    try {
      console.log('handlePreview 3');

      const validationResult = validateFormDataAndUpdateUI(true);
      if (!validationResult.isValid) {
        setPreviewValidationMessages(validationResult.messages || []);
        setIsSubmitting(false);
        setShowConfirmModal(true);
        return;
      }
    
      setPreviewValidationMessages([]);
    } catch (error) {
      console.error('미리보기 데이터 준비 중 오류:', error);
      setFormState({
        message: '미리보기 데이터 준비 중 오류가 발생했습니다.',
        status: 'error',
        errorType: 'server',
      });
      setShowFinalResult(true);
    }
  };

  const [showConfirmModal, setShowConfirmModal] =
    useState(false);
  const [preparedFormData, setPreparedFormData] =
    useState<FormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleFinalSubmit = async () => {
//     if (!preparedFormData) return;

//     setIsSubmitting(true);

//     try {
//       console.log('최종 제출 시작...');

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

//       console.log(
//         '===== FormData 크기 분석 (개선된 구조) =====',
//       );
//       console.log(
//         `전체 크기 (Server Actions로 전송): ${sizeInfo.totalSizeMB} MB (${sizeInfo.totalSizeKB} KB)`,
//       );
//       console.log(
//         `텍스트 데이터 크기: ${sizeInfo.textDataSizeKB} KB (이미지 URL 포함)`,
//       );
//       console.log('');
//       console.log(
//         '이미지 파일은 이미 Supabase Storage에 업로드 완료!',
//       );
//       console.log(
//         'Server Actions에는 이미지 URL만 전송되므로 크기 제한 해결!',
//       );
//       console.log('상세 내역:');

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
//           console.log(`\n  ${category}:`);
//           items.forEach((item: any) => {
//             console.log(
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
//         console.log(
//           `Server Actions 크기 제한 통과: ${sizeInfo.totalSizeMB} MB < ${limitMB} MB`,
//         );
//         console.log(
//           `모든 데이터가 텍스트: ${sizeInfo.textDataSizeKB} KB`,
//         );
//       }

//       console.log('FormData 내용 확인:');

//       for (const [
//         key,
//         value,
//       ] of preparedFormData.entries()) {
//         if (value instanceof File) {
//           console.log(
//             `  - ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(2)} KB)`,
//           );
//         } else {
//           const preview =
//             value.toString().length > 50
//               ? value.toString().substring(0, 50) + '...'
//               : value.toString();
//           console.log(`  - ${key}: "${preview}"`);
//         }
//       }

//       const result = await uploadActions(
//         null,
//         preparedFormData,
//       );

//       console.log('uploadActions 응답:', result);
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

  const handleModalCancel = () => {
    setShowConfirmModal(false);
    setPreparedFormData(null);
  };

  if (
    isLoadingExistingData
  )
    return <LoadingSpinner backdrop />;

  const handleNext = async () => {
    console.log('handleNext Step3');
    const result = await handleSave();
    console.log('handleNext Step3 handlSave after result', result);
    if (result?.status === 'success') {
        console.log('handleNext Step3 handlSave success');
        onNext();
    } else {
        console.log('handleNext Step3 handlSave what? :', result);
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
    console.log('handleSave Step3');
    
    try {
      const newClinicImageUrls: string[] = [];
      const newClinicImages = clinicImages.filter(img => img instanceof File);
      
      console.log('병원 이미지 업로드 시작:', newClinicImages.length, '개');
      
      for (const file of newClinicImages) {
        try {
          const fileName = `hospital_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${file.name.split('.').pop()}`;
          const filePath = `images/hospitalimg/${id_uuid_hospital}/${fileName}`;
          
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
          console.log('병원 이미지 업로드 성공:', fileName);
        } catch (error) {
          console.error('병원 이미지 업로드 실패:', error);
          throw error;
        }
      }

      const doctorImageUrls: string[] = [];
      const doctorsWithImages = doctors.filter(doctor => 
        doctor.imageFile && doctor.imageFile instanceof File
      );

      console.log('의사 이미지 업로드 시작:', doctorsWithImages.length, '개');
      
      for (const doctor of doctorsWithImages) {
        try {
          const fileName = `doctor_${doctor.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${doctor.imageFile!.name.split('.').pop()}`;
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
          console.log('의사 이미지 업로드 성공:', fileName);
        } catch (error) {
          console.error('의사 이미지 업로드 실패:', error);
          throw error;
        }
      }

      const formData = new FormData();
      formData.append('id_uuid_hospital', id_uuid_hospital);
      formData.append('current_user_uid', currentUserUid);
      formData.append('is_edit_mode', isEditMode ? 'true' : 'false');

      if (existingData) {
        formData.append('existing_data', JSON.stringify(existingData));
      }

      const existingClinicUrls = existingData?.hospital?.imageurls || [];
      formData.append('existing_clinic_urls', JSON.stringify(existingClinicUrls));
      
      formData.append('new_clinic_image_urls', JSON.stringify(newClinicImageUrls));

      if (doctors.length > 0) {
        console.log('=== 의사 데이터 준비 시작 ===');
        console.log('doctors 배열:', doctors);
        console.log('doctors 배열 길이:', doctors.length);
        
        const doctorsData = doctors.map((doctor, index) => {
          console.log(`의사 ${index + 1} 처리:`, doctor);
          
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
          
          console.log(`의사 ${index + 1} 최종 데이터:`, doctorData);
          return doctorData;
        });

        console.log('=== 최종 의사 데이터 ===');
        console.log('doctorsData:', doctorsData);
        console.log('doctorsData JSON:', JSON.stringify(doctorsData));
        
        formData.append('doctors', JSON.stringify(doctorsData));
        console.log('FormData에 의사 데이터 추가 완료');
      } else {
        console.log('의사 데이터가 없습니다.');
      }

      console.log('Step3 uploadActionStep3 before formData:', formData);
      
      const result = await uploadActionsStep3(null, formData);
      console.log('uploadActionsStep3 응답:', result);
      
      if (result?.status === 'error') {
        setFormState({
          message: `uploadActionsStep3 처리 오류: ${result?.message}`,
          status: 'error',
          errorType: 'server',
        });
        setShowFinalResult(true);
        return { status: 'error' };
      }

      return { status: 'success' };
    } catch (error) {
      console.error('handleSave Step3 오류:', error);
      setFormState({
        message: `업로드 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        status: 'error',
        errorType: 'server',
      });
      setShowFinalResult(true);
      return { status: 'error' };
    }
  };

  const loadExistingData = async () => {
    try {
      console.log('기존 데이터 다시 로드 시작');
      const data = await loadExistingHospitalData(currentUserUid, id_uuid_hospital, 3);
      if (data) {
        setExistingData(data);
        
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
          console.log('기존 의사 데이터 로드 완료:', existingDoctors);
        }
        
        console.log('기존 데이터 다시 로드 완료');
      }
    } catch (error) {
      console.error('기존 데이터 로드 실패:', error);
    }
  };

  return (
    <main>
      <div
        className='my-8 mx-auto px-6'
        style={{ width: '100vw', maxWidth: '1024px' }}
      >
        <ClinicImageUploadSection
          maxImages={clinicImageUploadLength}
          title='병원 이미지 등록'
          description={`- 병원 메인 이미지는 가로로 긴 직사각형(권장 비율: 16:9 또는 3:1)으로 업로드해 주세요.
  · 예시: 1600x900px(16:9) 또는 1800x600px(3:1)
  · 알림: 주어진 사진을 중앙을 기준으로 16:9 혹은 3:1 비율로 넘치는 부분이 자동으로 잘라집니다.
      사진이 비율보다 작으면 가로기준으로 비율을 맞춰서 자동으로 확대해서 화면에 맞춰줍니다.
      * File 한개당 50MB 이하로 업로드 해주세요.
      * 최소(3개이상) - 최대(권장) 7개까지 업로드 가능합니다. 추가 업로드 원하시면 문의 부탁드립니다.
      * (대표이미지) 추가 된 순서대로 보여지며 첫번째 이미지가 대표 이미지가 됩니다.`}
          onFilesChange={setClinicImages}
          name='clinic_images'
          type='Banner'
          initialImages={existingData?.hospital?.imageurls || []}
          onExistingDataChange={setExistingData}
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
       {/* 하단 고정 버튼 영역 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
          <Button onClick={onPrev}>Prev</Button>
          <Button onClick={handleNext}>Save And Next</Button>
        </div>
      </div>
    </main>
  );
}

export default Step3ClinicImagesDoctorsInfo;
