'use client';

import { TextArea } from '@/components/InputField';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

import useModal from '@/hooks/useModal';

import PreviewClinicInfoModal from '@/components/modal/PreviewClinicInfoModal';
import { loadExistingHospitalData } from '@/lib/hospitalDataLoader';
import { ExistingHospitalData } from '@/types/hospital';
import { mapExistingDataToFormValues } from '@/lib/hospitalDataMapper';

import Divider from '@/components/Divider';
import AvailableLanguageSection from '@/components/AvailableLanguageSection';
import { uploadAPI, formatApiError, isApiSuccess } from '@/lib/api-client';
import PageBottom from '@/components/PageBottom';
import { toast } from "sonner";

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
    log.info(' Step6LanguagesFeedback id_uuid_hospital', id_uuid_hospital);

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

  // 변경사항 감지 상태변수 추가
  const [hasChanges, setHasChanges] = useState(false);
  // 변경사항 확인 모달 상태 추가
  const [showChangesConfirmModal, setShowChangesConfirmModal] = useState(false);

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
    log.info(
      `Step5 - isEditMode: ${isEditMode}, currentUserUid: ${currentUserUid}`,
    );
    if (isEditMode && currentUserUid) {
      loadExistingDataForEdit();
    }
  }, [isEditMode, currentUserUid]);

  // 기존 데이터가 로딩되었을 때 각 필드 상태 업데이트
  useEffect(() => {
    if (existingData) {
      log.info('Step5 - existingData 변경 감지:', existingData);
      
      // 피드백 정보 설정
      if (existingData.feedback && !feedback) {
        setFeedback(existingData.feedback);
        log.info('Step5 - 피드백 정보 설정 완료:', existingData.feedback);
      }

      // 가능 언어 정보 설정
      if (existingData.hospitalDetail?.available_languages && selectedLanguages.length === 0) {
        log.info('Step5 - 언어 정보 원본:', existingData.hospitalDetail.available_languages);
        
        let languages: string[] = [];
        
        // JSON 문자열인 경우 파싱
        if (typeof existingData.hospitalDetail.available_languages === 'string') {
          try {
            languages = JSON.parse(existingData.hospitalDetail.available_languages);
            log.info('Step5 - JSON 파싱된 언어 정보:', languages);
          } catch (error) {
            console.error('Step5 - JSON 파싱 실패:', error);
            // 파싱 실패 시 원본 문자열을 배열로 처리
            languages = [existingData.hospitalDetail.available_languages];
          }
        } else if (Array.isArray(existingData.hospitalDetail.available_languages)) {
          // 이미 배열인 경우
          languages = existingData.hospitalDetail.available_languages;
        } else {
          log.info('Step5 - 지원되지 않는 언어 정보 타입:', typeof existingData.hospitalDetail.available_languages);
        }
        
        setSelectedLanguages(languages);
        log.info('Step5 - 가능 언어 정보 설정 완료:', languages);
      }
    }
  }, [existingData, feedback, selectedLanguages.length]);

  
  const loadExistingDataForEdit = async () => {
    try {
      setIsLoadingExistingData(true);
      log.info('Step5 - 편집 모드 - 기존 데이터 로딩 시작');

      // 마지막 단계로 모든 데이터를 다 불러온다 
      // preview 화면에서 보여주기 위해서이다 
      const data =
        await loadExistingHospitalData(currentUserUid, id_uuid_hospital, 100);
      
      log.info('Step5 - 로딩된 데이터:', data);
      
      if (data) {
        setExistingData(data);
        populateFormWithExistingData(data);
        log.info('Step5 - 편집 모드 - 기존 데이터 로딩 완료');
      } else {
        log.info('Step5 - 편집 모드 - 기존 데이터가 없습니다');
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
    log.info('Step5 - 폼에 기존 데이터 적용 시작');
    log.info('Step5 - 받은 데이터:', {
      hospitalDetail: existingData.hospitalDetail,
      feedback: existingData.feedback,
      availableLanguages: existingData.hospitalDetail?.available_languages
    });

    try {
      // 1. 데이터를 폼 형식으로 변환
      const formData = mapExistingDataToFormValues(existingData);
      log.info('Step5 - 변환된 폼 데이터:', formData);

      // 피드백 정보 설정
      if (existingData.feedback) {
        setFeedback(existingData.feedback);
        log.info('Step5 - 피드백 정보 설정 완료:', existingData.feedback);
      } else {
        log.info('Step5 - 피드백 정보가 없습니다');
      }

      log.info('Step5 - 폼 상태 업데이트 완료:', {
        feedback: existingData.feedback,
        selectedLanguages: existingData.hospitalDetail?.available_languages
      });
    
    } catch (error) {
      console.error('Step5 - 기존 데이터 적용 중 오류:', error);
    }
  };


  const handleComplete = () => {
    document.body.style.overflow = '';
    
    // 변경사항이 있으면 확인 모달 띄우기
    if (hasChanges) {
      setShowChangesConfirmModal(true);
    } else {
      // 변경사항이 없으면 바로 홈으로 이동
      onComplete();
    }
  };

  const handlePreview = async () => {
    log.info('Preview 버튼 클릭 - 모달 열기');
    setShowPreviewModal(true);
  };

 
  const handleSave = async () => {
    log.info('Step5 handleSave 시작');
    
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
      
      log.info('Step5 - 전송할 데이터:', {
        id_uuid_hospital,
        isEditMode,
        feedback: feedback.trim(),
        selectedLanguages,
        currentUserUid
      });

      log.info('Step5 API 호출 시작');
      
      // 새로운 API Route 호출
      const result = await uploadAPI.step6(formData);
      log.info('Step5 API 응답:', result);

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
        log.info('Step5 데이터 저장 성공');
        setFormState({
          message: result.message || '언어 설정과 피드백이 성공적으로 저장되었습니다.',
          status: 'success',
          errorType: 'success',
        });
        setShowFinalResult(true);
        
        // 저장 성공 시 변경사항 상태를 false로 설정
        setHasChanges(false);
        toast.success(result.message);
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
      log.info('Step5 - 지원되지 않는 언어 정보 타입:', typeof languagesData);
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
            log.info('선택된 언어:', selectedLanguages);
            setSelectedLanguages(selectedLanguages);
            // 언어 선택 변경 시 변경사항 감지
            setHasChanges(true);
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
            onChange={(value) => {
              setFeedback(value);
              // 피드백 입력 변경 시 변경사항 감지
              setHasChanges(true);
            }}
            value={feedback}
          />
        </div>
      <Divider />
      <div className='w-full'>
        <h2 className="font-semibold mb-2 text-red-500">아래 Preview 버튼을 눌러 최종결과를 재검토 부탁드립니다.</h2>
        <h2 className="font-semibold mb-2 text-red-500">Draft Save 임시저장을 눌러야 본 화면내용도 저장됩니다.</h2>
      </div>
      </div>

      <PageBottom step={6} 
      onDraftSave={handleSave}
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

    {/* 변경사항 확인 모달 */}
    {showChangesConfirmModal && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">변경사항 확인</h3>
          <p className="text-sm text-gray-800 mb-6 whitespace-pre-line">
            변경하신사항이 있는것 같은데 저장하지않으셨습니다. 이대로 홈으로 이동하시겠습니까?{'\n'}
            저장하시려면 창을 닫으시고 하단 저장버튼을 눌러주세요
          </p>
          <div className="flex justify-end gap-2">
            <Button 
              type="button"
              onClick={() => setShowChangesConfirmModal(false)}
              className="btn btn-secondary bg-gray-500 hover:bg-gray-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  저장 중
                </>
              ) : (
                '닫기'
              )}
            </Button>
            <Button 
              type="button"
              onClick={() => {
                setShowChangesConfirmModal(false);
                onComplete();
              }}
              className="btn btn-secondary bg-red-500 hover:bg-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  저장 중
                </>
              ) : (
                '변경사항을 적용하지않고 홈으로 이동'
              )}
            </Button>
          </div>
        </div>
      </div>
    )}

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
