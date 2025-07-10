'use client';

import PageHeader from '@/components/PageHeader';
import InputField, { TextArea } from '@/components/InputField';
import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import { uploadActions } from './actions';

import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '@/components/LoadingSpinner';
import useModal from '@/hooks/useModal';
import { AlertModal } from '@/components/modal';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import AddressSection from '@/components/AddressSection';
import LocationSelect from '@/components/LocationSelect';
import { TreatmentSelectBox } from '@/components/TreatmentSelectBox';
import ClinicImageUploadSection from '@/components/ClinicImageUploadSection';
import OpeningHoursForm, {
  OpeningHour,
} from '@/components/OpeningHoursForm';
import ExtraOptions, {
  ExtraOptionState,
} from '@/components/ExtraOptions';
import { useTreatmentCategories } from '@/hooks/useTreatmentCategories';
import { PreviewModal, FormDataSummary } from '@/components/modal/PreviewModal';
import PreviewClinicInfoModal from '@/components/modal/PreviewClinicInfoModal';
import type { CategoryNode } from '@/types/category';
import DoctorInfoSection from '@/components/DoctorInfoSection';
import { DoctorInfo } from '@/components/DoctorInfoForm';
import { HospitalAddress } from '@/types/address';
import { loadExistingHospitalData } from '@/lib/hospitalDataLoader';
import { ExistingHospitalData } from '@/types/hospital';
import { mapExistingDataToFormValues } from '@/lib/hospitalDataMapper';
import { STORAGE_IMAGES } from '@/constants/tables';
import BasicInfoSection from '@/components/BasicInfoSection';
import Divider from '@/components/Divider';
import AvailableLanguageSection from '@/components/AvailableLanguageSection';
import { HAS_ANESTHESIOLOGIST, HAS_CCTV, HAS_FEMALE_DOCTOR, HAS_NIGHT_COUNSELING, HAS_PARKING, HAS_PRIVATE_RECOVERY_ROOM } from '@/constants/extraoptions';
import { validateFormData } from '@/utils/validateFormData';
import { prepareFormData } from '@/lib/formDataHelper';
import { uploadActionsStep1 } from './actions/uploadStep1';
import { uploadActionsStep5 } from './actions/uploadStep5';

interface Step5LanguagesFeedbackProps {
  id_uuid_hospital: string;
  currentUserUid: string;
  isEditMode?: boolean; // 편집 모드 여부
  onPrev: () => void;
  onSubmit: () => void;
}


const Step5LanguagesFeedback = ({
  id_uuid_hospital,
  currentUserUid,
  isEditMode = false,
  onPrev,
  onSubmit,
}: Step5LanguagesFeedbackProps) => {
    console.log(' Step5LanguagesFeedback id_uuid_hospital', id_uuid_hospital);

  const router = useRouter();

  const [formState, setFormState] = useState<{
    message?: string;
    status?: string;
    errorType?: 'validation' | 'server' | 'success';
  } | null>(null);
  const [showFinalResult, setShowFinalResult] =
    useState(false);
//   const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [isLoadingExistingData, setIsLoadingExistingData] =
    useState(false);
  const [existingData, setExistingData] =
    useState<ExistingHospitalData | null>(null);

  // 확인 모달 상태 추가
  const [showConfirmModal, setShowConfirmModal] =
    useState(false);
  const [preparedFormData, setPreparedFormData] =
    useState<FormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [feedback, setFeedback] = useState<string>('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Preview 모달 상태 추가
  const [showPreviewModal, setShowPreviewModal] = useState(false);


  const { handleOpenModal, open } = useModal();

  useEffect(() => {
    if (formState?.message && showFinalResult) {
      handleOpenModal();
    }
  }, [formState, showFinalResult]);


  // 편집 모드일 때 기존 데이터 로딩
  useEffect(() => {
    console.log(
      `Step5 - isEditMode: ${isEditMode}, currentUserUid: ${currentUserUid}`,
    );
    if (isEditMode && currentUserUid) {
      loadExistingDataForEdit();
    }
  }, [isEditMode, currentUserUid]);

  // 기존 데이터가 로딩되었을 때 각 필드 상태 업데이트
  useEffect(() => {
    if (existingData) {
      console.log('Step5 - existingData 변경 감지:', existingData);
      
      // 피드백 정보 설정
      if (existingData.feedback && !feedback) {
        setFeedback(existingData.feedback);
        console.log('Step5 - 피드백 정보 설정 완료:', existingData.feedback);
      }

      // 가능 언어 정보 설정
      if (existingData.hospitalDetail?.available_languages && selectedLanguages.length === 0) {
        console.log('Step5 - 언어 정보 원본:', existingData.hospitalDetail.available_languages);
        
        let languages: string[] = [];
        
        // JSON 문자열인 경우 파싱
        if (typeof existingData.hospitalDetail.available_languages === 'string') {
          try {
            languages = JSON.parse(existingData.hospitalDetail.available_languages);
            console.log('Step5 - JSON 파싱된 언어 정보:', languages);
          } catch (error) {
            console.error('Step5 - JSON 파싱 실패:', error);
            // 파싱 실패 시 원본 문자열을 배열로 처리
            languages = [existingData.hospitalDetail.available_languages];
          }
        } else if (Array.isArray(existingData.hospitalDetail.available_languages)) {
          // 이미 배열인 경우
          languages = existingData.hospitalDetail.available_languages;
        } else {
          console.log('Step5 - 지원되지 않는 언어 정보 타입:', typeof existingData.hospitalDetail.available_languages);
        }
        
        setSelectedLanguages(languages);
        console.log('Step5 - 가능 언어 정보 설정 완료:', languages);
      }
    }
  }, [existingData, feedback, selectedLanguages.length]);

  
  const loadExistingDataForEdit = async () => {
    try {
      setIsLoadingExistingData(true);
      console.log('Step5 - 편집 모드 - 기존 데이터 로딩 시작');

      // 마지막 단계로 모든 데이터를 다 불러온다 
      // preview 화면에서 보여주기 위해서이다 
      const data =
        await loadExistingHospitalData(currentUserUid, id_uuid_hospital, 100);
      
      console.log('Step5 - 로딩된 데이터:', data);
      
      if (data) {
        setExistingData(data);
        populateFormWithExistingData(data);
        console.log('Step5 - 편집 모드 - 기존 데이터 로딩 완료');
      } else {
        console.log('Step5 - 편집 모드 - 기존 데이터가 없습니다');
      }
    } catch (error) {
      console.error(
        'Step5 - 편집 모드 - 데이터 로딩 실패:',
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
    console.log('Step5 - 폼에 기존 데이터 적용 시작');
    console.log('Step5 - 받은 데이터:', {
      hospitalDetail: existingData.hospitalDetail,
      feedback: existingData.feedback,
      availableLanguages: existingData.hospitalDetail?.available_languages
    });

    try {
      // 1. 데이터를 폼 형식으로 변환
      const formData = mapExistingDataToFormValues(existingData);
      console.log('Step5 - 변환된 폼 데이터:', formData);

      // 피드백 정보 설정
      if (existingData.feedback) {
        setFeedback(existingData.feedback);
        console.log('Step5 - 피드백 정보 설정 완료:', existingData.feedback);
      } else {
        console.log('Step5 - 피드백 정보가 없습니다');
      }

      console.log('Step5 - 폼 상태 업데이트 완료:', {
        feedback: existingData.feedback,
        selectedLanguages: existingData.hospitalDetail?.available_languages
      });
    
    } catch (error) {
      console.error('Step5 - 기존 데이터 적용 중 오류:', error);
    }
  };

  const handleModal = () => {
    setShowFinalResult(false); // 결과 모달을 닫을 때 showFinalResult 초기화
    handleOpenModal();
  };

  // 성공 시 관리자 페이지로 이동하는 함수
  const handleConfirm = () => {
    if (formState?.status === 'success') {
      router.replace('/admin');
      router.refresh();
    } else {
      handleModal();
    }
  };

  const [previewValidationMessages, setPreviewValidationMessages] = useState<string[]>([]);

//   const validateFormDataAndUpdateUI = (returnMessage = false) => {
//     const clinicNameInput = document.querySelector(
//       'input[name="name"]',
//     ) as HTMLInputElement;
//     const clinicName = clinicNameInput?.value || '';

//     const validationResult = validateFormData({
//       basicInfo,
//       clinicName,
//       addressForSendForm,
//       selectedLocation,
//       selectedTreatments,
//       clinicImages,
//       existingImageUrls: existingData?.hospital.imageurls,
//       doctors,
//     });

//     if (!validationResult.isValid && validationResult.messages && validationResult.messages.length > 0) {
//       if (!returnMessage) {
//         setFormState({
//           message: validationResult.messages.join('\n'),
//           status: 'error',
//           errorType: 'validation',
//         });
//         setShowFinalResult(true);
//       }
//       return { isValid: false, messages: validationResult.messages };
//     }
//     return { isValid: true, messages: [] };
//   };


//   const id_uuid_generate = uuidv4();
  const handlePreview = async () => {
    console.log('Preview 버튼 클릭 - 모달 열기');
    setShowPreviewModal(true);
  };

  // 최종 제출 함수 (PreviewModal에서 호출)
  // const handleFinalSubmit = async () => {
  //   if (!preparedFormData) return;

  //   setIsSubmitting(true);

  //   try {
  //     console.log('최종 제출 시작...');

  //     // 편집 모드와 기존 데이터 정보 추가
  //     preparedFormData.append('is_edit_mode', isEditMode ? 'true' : 'false');
  //     if (isEditMode && existingData) {
  //       preparedFormData.append('existing_data', JSON.stringify(existingData));
  //     }

  //     // FormData 크기 측정 함수
  //     const calculateFormDataSize = (
  //       formData: FormData,
  //     ) => {
  //       let totalSize = 0;
  //       let textDataSize = 0;
  //       const details: any[] = [];

  //       for (const [key, value] of formData.entries()) {
  //         // 모든 데이터가 텍스트 데이터 (이미지는 URL 문자열)
  //         const textBytes = new TextEncoder().encode(
  //           value.toString(),
  //         ).length;
  //         textDataSize += textBytes;
  //         totalSize += textBytes;

  //         details.push({
  //           key,
  //           type: 'TextData',
  //           value:
  //             value.toString().substring(0, 100) +
  //             (value.toString().length > 100 ? '...' : ''),
  //           size: textBytes,
  //           sizeKB: (textBytes / 1024).toFixed(4),
  //           category: getCategoryForKey(key),
  //         });
  //       }

  //       return {
  //         totalSize,
  //         textDataSize,
  //         totalSizeKB: (totalSize / 1024).toFixed(2),
  //         totalSizeMB: (totalSize / (1024 * 1024)).toFixed(
  //           4,
  //         ),
  //         textDataSizeKB: (textDataSize / 1024).toFixed(4),
  //         details,
  //       };
  //     };

  //     // 키에 따른 카테고리 분류 함수
  //     const getCategoryForKey = (key: string) => {
  //       if (key.includes('image_urls')) return 'Image URLs';
  //       if (key.includes('address')) return 'Address Info';
  //       if (
  //         key.includes('treatment') ||
  //         key.includes('selected_treatments')
  //       )
  //         return 'Treatment Info';
  //       if (key.includes('opening_hours'))
  //         return 'Business Hours';
  //       if (key.includes('extra_options'))
  //         return 'Facility Options';
  //       if (key.includes('location')) return 'Location';
  //       if (
  //         key === 'name' ||
  //         key === 'searchkey' ||
  //         key === 'search_key' ||
  //         key === 'id_uuid'
  //       )
  //         return 'Basic Info';
  //       return 'Other';
  //     };

  //     // FormData 크기 분석
  //     const sizeInfo = calculateFormDataSize(
  //       preparedFormData,
  //     );

  //     console.log(
  //       '===== FormData 크기 분석 (개선된 구조) =====',
  //     );
  //     console.log(
  //       `전체 크기 (Server Actions로 전송): ${sizeInfo.totalSizeMB} MB (${sizeInfo.totalSizeKB} KB)`,
  //     );
  //     console.log(
  //       `텍스트 데이터 크기: ${sizeInfo.textDataSizeKB} KB (이미지 URL 포함)`,
  //     );
  //     console.log('');
  //     console.log(
  //       '이미지 파일은 이미 Supabase Storage에 업로드 완료!',
  //     );
  //     console.log(
  //       'Server Actions에는 이미지 URL만 전송되므로 크기 제한 해결!',
  //     );
  //     console.log('상세 내역:');

  //     // 카테고리별로 그룹화
  //     const groupedByCategory = sizeInfo.details.reduce(
  //       (acc: any, item) => {
  //         const category = item.category || item.type;
  //         if (!acc[category]) acc[category] = [];
  //         acc[category].push(item);
  //         return acc;
  //       },
  //       {},
  //     );

  //     Object.entries(groupedByCategory).forEach(
  //       ([category, items]: [string, any]) => {
  //         console.log(`\n  ${category}:`);
  //         items.forEach((item: any) => {
  //           console.log(
  //             `    ${item.key}: ${item.sizeKB} KB - "${item.value}"`,
  //           );
  //         });
  //       },
  //     );

  //     // 1MB 제한과 비교 (이제는 통과할 것)
  //     const limitMB = 1;
  //     const limitBytes = limitMB * 1024 * 1024;
  //     const isOverLimit = sizeInfo.totalSize > limitBytes;

  //     if (isOverLimit) {
  //       console.warn(
  //         `여전히 Server Actions 크기 제한 초과 (예상되지 않음)`,
  //       );
  //       console.warn(
  //         `현재: ${sizeInfo.totalSizeMB} MB, 제한: ${limitMB} MB`,
  //       );

  //       setFormState({
  //         message: `데이터 크기가 여전히 큽니다: ${sizeInfo.totalSizeMB} MB`,
  //         status: 'error',
  //         errorType: 'server',
  //       });

  //       setShowConfirmModal(false);
  //       setPreparedFormData(null);
  //       return;
  //     } else {
  //       console.log(
  //         `Server Actions 크기 제한 통과: ${sizeInfo.totalSizeMB} MB < ${limitMB} MB`,
  //       );
  //       console.log(
  //         `모든 데이터가 텍스트: ${sizeInfo.textDataSizeKB} KB`,
  //       );
  //     }

  //     console.log('FormData 내용 확인:');

  //     // FormData 내용을 간단히 로그로 출력
  //     for (const [
  //       key,
  //       value,
  //     ] of preparedFormData.entries()) {
  //       if (value instanceof File) {
  //         console.log(
  //           `  - ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(2)} KB)`,
  //         );
  //       } else {
  //         const preview =
  //           value.toString().length > 50
  //             ? value.toString().substring(0, 50) + '...'
  //             : value.toString();
  //         console.log(`  - ${key}: "${preview}"`);
  //       }
  //     }

  //     // 직접 uploadActions 호출
  //     const result = await uploadActions(
  //       null,
  //       preparedFormData,
  //     );

  //     console.log('uploadActions 응답:', result);
  //     setFormState(result);
  //     setShowFinalResult(true); // 최종 제출 결과만 얼러트 표시

  //     setShowConfirmModal(false);
  //     setPreparedFormData(null);
  //   } catch (error) {
  //     console.error('uploadActions 호출 에러:', error);

  //     let errorMessage = '업로드 중 오류가 발생했습니다.';

  //     if (error instanceof Error && error.message) {
  //       errorMessage = `업로드 오류: ${error.message}`;
  //     }

  //     setFormState({
  //       message: errorMessage,
  //       status: 'error',
  //       errorType: 'server',
  //     });
  //     setShowFinalResult(true); // 에러도 최종 결과로 표시
  //     setShowConfirmModal(false);
  //     setPreparedFormData(null);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  // // 모달 취소 처리
  // const handleModalCancel = () => {
  //   setShowConfirmModal(false);
  //   setPreparedFormData(null);
  // };

//   // 렌더링 시점 디버깅
//   console.log('UploadClient 렌더링:', {
//     isEditMode,
//     hospitalName,
//     address,
//     addressForSendForm,
//     coordinates,
//     selectedLocation,
//     doctorsCount: doctors.length,
//     hasExistingData: !!existingData,
//     isLoadingExistingData,
//     optionState,
//     전달할주소props: {
//       initialAddress: address,
//       initialAddressDetail:
//         addressForSendForm?.address_detail,
//       initialAddressDetailEn:
//         addressForSendForm?.address_detail_en,
//       initialDirections:
//         addressForSendForm?.directions_to_clinic,
//       initialDirectionsEn:
//         addressForSendForm?.directions_to_clinic_en,
//     },
//   });

//   if (
//     isPending ||
//     categoriesLoading ||
//     isLoadingExistingData
//   )
//     return <LoadingSpinner backdrop />;

 
  const handleSave = async () => {
    console.log('handleSave');

    const formData = new FormData();
    formData.append('id_uuid_hospital', id_uuid_hospital);
    
    // 편집 모드 플래그 추가
    formData.append('is_edit_mode', isEditMode ? 'true' : 'false');
    
    // 피드백
    if (feedback.trim()) {
        formData.append('feedback', feedback.trim());
    }

    // 가능 언어
    formData.append('available_languages', JSON.stringify(selectedLanguages));

    formData.append('current_user_uid', currentUserUid);
    
    console.log('Step5 - 전송할 데이터:', {
      id_uuid_hospital,
      isEditMode,
      feedback: feedback.trim(),
      selectedLanguages,
      currentUserUid
    });

    try {
      if (!formData) {
        setFormState({
          message: '데이터가 준비되지 않았습니다.',
          status: 'error',
          errorType: 'validation',
        });
        setShowFinalResult(true);
        return;
      }

      const result = await uploadActionsStep5(
        null,
        formData,
      );

      console.log('uploadActionsStep5 응답:', result);
      setFormState(result);
      
      if (result?.status === 'error') {
        setFormState({
          message: `uploadActionsStep5 처리 오류: ${result?.message}`,
          status: 'error',
          errorType: 'server',
        });
        setShowFinalResult(true);
      } else if (result?.status === 'success') {
        setFormState({
          message: result.message || '저장이 완료되었습니다.',
          status: 'success',
          errorType: 'success',
        });
        setShowFinalResult(true);
      }
      
      setPreparedFormData(null);
  } catch (error) {
    console.error('uploadActionsStep5 호출 에러:', error);

    let errorMessage = '업로드 중 오류가 발생했습니다.';

    if (error instanceof Error && error.message) {
      errorMessage = `업로드 오류: ${error.message}`;
    }

    setFormState({
      message: errorMessage,
      status: 'error',
      errorType: 'server',
    });
    setShowFinalResult(true);
    setShowConfirmModal(false);
    setPreparedFormData(null);
  } finally {
    setIsSubmitting(false);
  }
  };

  // 언어 정보 파싱 함수
  const parseLanguages = (languagesData: any): string[] => {
    if (!languagesData) return [];
    
    // JSON 문자열인 경우 파싱
    if (typeof languagesData === 'string') {
      try {
        return JSON.parse(languagesData);
      } catch (error) {
        console.error('Step5 - JSON 파싱 실패:', error);
        // 파싱 실패 시 원본 문자열을 배열로 처리
        return [languagesData];
      }
    } else if (Array.isArray(languagesData)) {
      // 이미 배열인 경우
      return languagesData;
    } else {
      console.log('Step5 - 지원되지 않는 언어 정보 타입:', typeof languagesData);
      return [];
    }
  };

  // 기존 데이터에서 언어 정보 가져오기
  const getInitialLanguages = (): string[] => {
    if (existingData?.hospitalDetail?.available_languages) {
      return parseLanguages(existingData.hospitalDetail.available_languages);
    }
    return selectedLanguages;
  };

  return (
    <main className="min-h-screen flex flex-col">
     <div>
       
      <div
        className='my-8 mx-auto px-6'
        style={{ width: '100vw', maxWidth: '1024px' }}
      >
      
        { /* 가능언어 선택  */ }
        <AvailableLanguageSection
          onLanguagesChange={(selectedLanguages: string[]) => {
            console.log('선택된 언어:', selectedLanguages);
            setSelectedLanguages(selectedLanguages);
          }}
          initialLanguages={getInitialLanguages()}
        />
        { /* 폼 작성관련해서 피드백 주실  내용이 있다면 자유롭게 의견 부탁드립니다. (선택) ) */ }

       <Divider />
       <div className='w-full'>
          <h3 className="font-semibold mb-2">피드백</h3>
          <p className="text-sm text-gray-600 mb-4">폼 작성 관련해서 피드백 주실 내용이 있다면 자유롭게 의견 부탁드립니다. (선택)</p>
          <TextArea
            placeholder='자유롭게 피드백을 남겨주세요.'
            onChange={setFeedback}
            value={feedback}
          />
        </div>
      <Divider />

      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
          <Button onClick={onPrev}>Prev</Button>
          <Button onClick={handlePreview}>Preview</Button>
          <Button onClick={handleSave}>Save</Button>
          <Button onClick={onSubmit}>Submit</Button>
        </div>
      </div>

    </div>

    {/* Preview 모달 */}
    <PreviewClinicInfoModal
      isOpen={showPreviewModal}
      onClose={() => setShowPreviewModal(false)}
      id_uuid_hospital={id_uuid_hospital}
    />

    {/* 기존 Alert 모달 */}
    <AlertModal
      open={open}
      onClose={handleModal}
      title={formState?.status === 'success' ? '성공' : '오류'}
      message={formState?.message || ''}
      onConfirm={handleConfirm}
      confirmText={formState?.status === 'success' ? '확인' : '닫기'}
    />
    </main>
  );
};

export default Step5LanguagesFeedback;
