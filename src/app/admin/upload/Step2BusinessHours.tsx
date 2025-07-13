'use client';


import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import useModal from '@/hooks/useModal';
import OpeningHoursForm, {
  OpeningHour,
} from '@/components/OpeningHoursForm';
import ExtraOptions, {
  ExtraOptionState,
} from '@/components/ExtraOptions';
import { loadExistingHospitalData } from '@/lib/hospitalDataLoader';
import { ExistingHospitalData } from '@/types/hospital';
import { mapExistingDataToFormValues } from '@/lib/hospitalDataMapper';
import { uploadAPI, formatApiError, isApiSuccess } from '@/lib/api-client';
import Divider from '@/components/Divider';

interface Surgery {
  created_at: string;
  description: string;
  id: number;
  id_unique: number;
  imageurls: string[];
  name: string;
  type: string;
}

interface Step2BusinessHoursProps {
  id_uuid_hospital: string;
  currentUserUid: string;
  isEditMode?: boolean; // 편집 모드 여부
  onPrev: () => void;
  onNext: () => void;
}


const Step2BusinessHours = ({
  id_uuid_hospital,
  currentUserUid,
  isEditMode = false,
  onPrev,
  onNext,
}: Step2BusinessHoursProps) => {
    console.log('Step2BusinessHours id_uuid_hospital', id_uuid_hospital);

  const [openingHours, setOpeningHours] = useState<
    OpeningHour[]
  >([]);
  const [optionState, setOptionState] =
    useState<ExtraOptionState>({
      has_private_recovery_room: false,
      has_parking: false,
      has_cctv: false,
      has_night_counseling: false,
      has_female_doctor: false,
      has_anesthesiologist: false,
      specialist_count: 1,
    });

  const [formState, setFormState] = useState<{
    message?: string;
    status?: string;
    errorType?: 'validation' | 'server' | 'success';
  } | null>(null);
  const [showFinalResult, setShowFinalResult] =
    useState(false);

  const [isLoadingExistingData, setIsLoadingExistingData] =
    useState(false);
  const [existingData, setExistingData] =
    useState<ExistingHospitalData | null>(null);
  const [initialBusinessHours, setInitialBusinessHours] =
    useState<OpeningHour[]>([]);


  const { handleOpenModal, open } = useModal();

  useEffect(() => {
    if (formState?.message && showFinalResult) {
      handleOpenModal();
    }
  }, [formState, showFinalResult]);


//   // 편집 모드일 때 기존 데이터 로딩
  useEffect(() => {
    console.log(
      `isEditMode: ${isEditMode}, currentUserUid: ${currentUserUid}`,
    );
    if (isEditMode && currentUserUid) {
      loadExistingDataForEdit();
    }
  }, [isEditMode, currentUserUid]);

  useEffect(() => {
    console.log('Step2 - initialBusinessHours 변경됨:', initialBusinessHours);
    if (initialBusinessHours.length > 0) {
      setOpeningHours(initialBusinessHours);
      console.log('Step2 - openingHours 업데이트됨:', initialBusinessHours);
    }
  }, [initialBusinessHours]);

  useEffect(() => {
    console.log('Step2 - optionState 변경됨:', optionState);
  }, [optionState]);

  const loadExistingDataForEdit = async () => {
    try {
      setIsLoadingExistingData(true);
      console.log(' 편집 모드 - 기존 데이터 로딩 시작');

      const data =
        await loadExistingHospitalData(currentUserUid, id_uuid_hospital, 2);
      if (data) {
        console.log('steep2 BusinessHours data data.businessHours?.length: ', data.businessHours?.length);
        console.log('steep2 BusinessHours data data.hospital: ', data.hospital);
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
    
    try {
        console.log('폼에 기존 데이터 적용 시작');

        console.log('폼에 기존데이터  적용 전 기존데이터 화인 :', existingData);
      // 1. 데이터를 폼 형식으로 변환
      const formData = mapExistingDataToFormValues(existingData);
      console.log('변환된 폼 데이터 적용 종료 결과 formData:', formData);

      // 4. 영업시간 설정
      console.log('영업시간 설정 시작');
      console.log(
        '변환된 영업시간 데이터:',
        formData.businessHours,
      );
      setInitialBusinessHours(formData.businessHours);
      console.log(
        'initialBusinessHours 상태 업데이트 완료',
      );

      // 5. 편의시설 설정
      setOptionState({
        has_private_recovery_room:
          formData.facilities.has_private_recovery_room,
        has_parking: formData.facilities.has_parking,
        has_cctv: formData.facilities.has_cctv,
        has_night_counseling:
          formData.facilities.has_night_counseling,
        has_female_doctor:
          formData.facilities.has_female_doctor,
        has_anesthesiologist:
          formData.facilities.has_anesthesiologist,
        specialist_count:
          formData.facilities.specialist_count,
      });
      console.log('편의시설 설정 완료');

    } catch (error) {
      console.error('기존 데이터 적용 중 오류:', error);
    }
  };

  // 부가시설 옵션 변경 처리하는 함수
  const handleExtraOptionsChange = (
    data: ExtraOptionState,
  ) => {
    console.log(
      'UploadClient - 부가시설 옵션 업데이트:',
      data,
    );
    setOptionState(data);
  };

  if (
    // isPending ||
    // categoriesLoading ||
    isLoadingExistingData
  )
    return <LoadingSpinner backdrop />;

 
const handleNext = async () => {
    console.log('handleNext');
    const result = await handleSave();
    console.log('handleNext result', result);
    if (result?.status === 'success') {
        onNext();
    }
}

  const handleSave = async () => {
    console.log('Step2 handleSave 시작');
    
    try {
      // FormData 구성
      const formData = new FormData();
      formData.append('is_edit_mode', isEditMode ? 'true' : 'false');
      formData.append('current_user_uid', currentUserUid);
      formData.append('id_uuid_hospital', id_uuid_hospital);
      
      // 시설 정보
      formData.append('extra_options', JSON.stringify(optionState));
      // 영업 시간
      formData.append('opening_hours', JSON.stringify(openingHours));
      
      console.log('Step2 - 전송할 데이터:');
      console.log('openingHours:', openingHours);
      console.log('openingHours 길이:', openingHours.length);
      console.log('optionState:', optionState);
      console.log('optionState JSON:', JSON.stringify(optionState));

      console.log('Step2 API 호출 시작');
      
      // 새로운 API Route 호출
      const result = await uploadAPI.step2(formData);

      console.log('Step2 API 응답:', result);

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
        console.log('Step2 데이터 저장 성공');
        setFormState({
          message: result.message || '성공적으로 저장되었습니다.',
          status: 'success',
          errorType: undefined,
        });
        
        return {
          status: 'success',
          message: result.message
        };
      }
      
    } catch (error) {
      console.error('Step2 API 호출 에러:', error);

      const errorMessage = formatApiError(error);

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
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* <PageHeader name='병원 정보를 입력하세요' onPreview={handlePreview} onSave={handleSave} /> */}
      <div
        className='my-8 mx-auto px-6 pb-24'
        style={{ width: '100vw', maxWidth: '1024px' }}
      >
        <div className='space-y-4 w-full'>
        <div className='w-full mt-4'>
          <ExtraOptions
            onSelectOptionState={handleExtraOptionsChange}
            initialOptions={optionState}
          />
        </div>

        <Divider />
        <OpeningHoursForm
          onSelectOpeningHours={setOpeningHours}
          initialHours={initialBusinessHours}
        />


      </div>

      </div>
     {/* 하단 고정 버튼 영역 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
          <Button onClick={onPrev}>Prev</Button>
          <Button onClick={handleNext}>Save And Next</Button>
        </div>
      </div>

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
};

export default Step2BusinessHours;
