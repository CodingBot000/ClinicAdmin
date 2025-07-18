'use client';

import { TextArea } from '@/components/InputField';
import { useEffect, useState } from 'react';
import Button from '@/components/Button';

import useModal from '@/hooks/useModal';
// AlertModal 제거
import { useRouter } from 'next/navigation';

import PreviewClinicInfoModal from '@/components/modal/PreviewClinicInfoModal';
import { loadExistingHospitalData } from '@/lib/hospitalDataLoader';
import { ExistingHospitalData } from '@/types/hospital';
import { mapExistingDataToFormValues } from '@/lib/hospitalDataMapper';

import Divider from '@/components/Divider';
import AvailableLanguageSection from '@/components/AvailableLanguageSection';
import { uploadAPI, formatApiError, isApiSuccess } from '@/lib/api-client';
import PageBottom from '@/components/PageBottom';
// 기존 Server Actions는 API Routes로 대체됨

interface Step6LanguagesFeedbackProps {
  id_uuid_hospital: string;
  currentUserUid: string;
  isEditMode?: boolean; // 편집 모드 여부
  onPrev: () => void;
  onComplete: () => void;
  onStepChange?: (step: number) => void;
}


const Step6LanguagesFeedback = ({
  id_uuid_hospital,
  currentUserUid,
  isEditMode = false,
  onPrev,
  onComplete,
  onStepChange,
}: Step6LanguagesFeedbackProps) => {
    console.log(' Step6LanguagesFeedback id_uuid_hospital', id_uuid_hospital);

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

  const handleComplete = () => {
    document.body.style.overflow = '';
    onComplete();
  };

  const handlePreview = async () => {
    console.log('Preview 버튼 클릭 - 모달 열기');
    setShowPreviewModal(true);
  };

 
  const handleSave = async () => {
    console.log('Step5 handleSave 시작');
    
    try {
      // FormData 구성
      const formData = new FormData();
      formData.append('id_uuid_hospital', id_uuid_hospital);
      formData.append('is_edit_mode', isEditMode ? 'true' : 'false');
      formData.append('current_user_uid', currentUserUid);
      
      // 피드백
      if (feedback.trim()) {
        formData.append('feedback', feedback.trim());
      }

      // 가능 언어
      formData.append('available_languages', JSON.stringify(selectedLanguages));
      
      console.log('Step5 - 전송할 데이터:', {
        id_uuid_hospital,
        isEditMode,
        feedback: feedback.trim(),
        selectedLanguages,
        currentUserUid
      });

      console.log('Step5 API 호출 시작');
      
      // 새로운 API Route 호출
      const result = await uploadAPI.step6(formData);
      console.log('Step5 API 응답:', result);

      if (!isApiSuccess(result)) {
        // 에러 발생 시 처리
        const errorMessage = formatApiError(result.error);
        
        setFormState({
          message: errorMessage,
          status: 'error',
          errorType: 'server',
        });
        setShowFinalResult(true);
        
        return {
          status: 'error',
          message: errorMessage
        };
      } else {
        // 성공 시 처리
        console.log('Step5 데이터 저장 성공');
        setFormState({
          message: result.message || '언어 설정과 피드백이 성공적으로 저장되었습니다.',
          status: 'success',
          errorType: 'success',
        });
        setShowFinalResult(true);
        
        return {
          status: 'success',
          message: result.message
        };
      }
      
    } catch (error) {
      console.error('Step5 API 호출 에러:', error);

      const errorMessage = formatApiError(error);

      setFormState({
        message: errorMessage,
        status: 'error',
        errorType: 'server',
      });
      setShowFinalResult(true);
      setShowConfirmModal(false);
      setPreparedFormData(null);
      
      return {
        status: 'error',
        message: errorMessage
      };
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
      <div className='w-full'>
        <h2 className="font-semibold mb-2 text-red-500">아래 Preview 버튼을 눌러 최종결과를 재검토 부탁드립니다.</h2>
      </div>
      </div>

      <PageBottom step={5} 
      onNext={handleSave}
       onPrev={onPrev}
       onPreview={handlePreview}
       onHome={handleComplete}
       isSubmitting={isSubmitting}
       />

    </div>

    {/* Preview 모달 */}
    <PreviewClinicInfoModal
      isOpen={showPreviewModal}
      onClose={() => setShowPreviewModal(false)}
      id_uuid_hospital={id_uuid_hospital}
      currentStep={5}
      onStepChange={onStepChange}
    />

    {/* 기존 Alert 모달 */}
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
};

export default Step6LanguagesFeedback;
