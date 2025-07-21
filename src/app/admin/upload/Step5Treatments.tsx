'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import useModal from '@/hooks/useModal';

import { TreatmentSelectBox } from '@/components/TreatmentSelectBox';
import { useTreatmentCategories } from '@/hooks/useTreatmentCategories';
import { loadExistingHospitalData } from '@/lib/hospitalDataLoader';
import { ExistingHospitalData } from '@/types/hospital';
import { mapExistingDataToFormValues } from '@/lib/hospitalDataMapper';

import { uploadAPI, formatApiError, isApiSuccess } from '@/lib/api-client';

import { TreatmentSelectedOptionInfo } from '@/components/TreatmentSelectedOptionInfo';
import PageBottom from '@/components/PageBottom';
import { toast } from "sonner";
interface Step5TreatmentsProps {
  id_uuid_hospital: string;
  currentUserUid: string;
  isEditMode?: boolean; // 편집 모드 여부
  onPrev: () => void;
  onNext: () => void;
}

const Step5Treatments = ({
  id_uuid_hospital,
  currentUserUid,
  isEditMode = false,
  onPrev,
  onNext,
}: Step5TreatmentsProps) => {
    console.log('qqqqqqqqq Step5Treatments id_uuid_hospital', id_uuid_hospital);

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useTreatmentCategories();


  // 1. 상태 선언부
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [treatmentOptions, setTreatmentOptions] = useState<
    any[]
  >([]);
  const [priceExpose, setPriceExpose] =
    useState<boolean>(true);
  const [treatmentEtc, setTreatmentEtc] =
    useState<string>('');
  // 2. initialTreatmentData 등도 string[]으로 맞추기
  const [initialTreatmentData, setInitialTreatmentData] =
    useState<{
      selectedKeys: string[];
      productOptions: any[];
      priceExpose: boolean;
      etc: string;
    } | null>(null);

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


  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleOpenModal, open } = useModal();

  useEffect(() => {
    if (formState?.message && showFinalResult) {
      handleOpenModal();
    }
  }, [formState, showFinalResult]);


  // 편집 모드일 때 기존 데이터 로딩
  useEffect(() => {
    console.log(
      `isEditMode: ${isEditMode}, currentUserUid: ${currentUserUid}`,
    );
    if (isEditMode && currentUserUid) {
      loadExistingDataForEdit();
    }
  }, [isEditMode, currentUserUid]);

  const loadExistingDataForEdit = async () => {
    try {
      setIsLoadingExistingData(true);
      console.log(' 편집 모드 - 기존 데이터 로딩 시작');

      const data =
        await loadExistingHospitalData(currentUserUid, id_uuid_hospital, 4);
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
      // 1. 데이터를 폼 형식으로 변환
      const formData = mapExistingDataToFormValues(existingData);
      console.log('변환된 폼 데이터:', formData);

      // 6. 시술 정보 설정
      console.log('시술 정보 설정 시작');
      console.log(
        '변환된 시술 데이터:',
        formData.treatments,
      );
      setInitialTreatmentData(formData.treatments);
      console.log(
        'initialTreatmentData 상태 업데이트 완료',
      );

      console.log('기존 데이터 적용 완료!');
      console.log('적용된 데이터:', {
        // 병원명: formData.hospital.name,
        // 의사수: formData.doctors.length,
        // 영업시간: Object.keys(formData.businessHours)
        //   .length,
        시술정보: Object.keys(formData.treatments).length,
      });
    } catch (error) {
      console.error('기존 데이터 적용 중 오류:', error);
    }
  };

  const handleModal = () => {
    setShowFinalResult(false); // 결과 모달을 닫을 때 showFinalResult 초기화
    handleOpenModal();
  };



  // 3. handleTreatmentSelectionChange 등에서 string[]로만 처리
  const handleTreatmentSelectionChange = (data: {
    selectedKeys: string[];
    productOptions: any[];
    priceExpose: boolean;
    etc: string;
    selectedDepartment?: 'skin' | 'surgery';
  }) => {
    console.log('Step5Treatments - 시술 데이터 업데이트:', {
      selectedKeys: data.selectedKeys,
      productOptions: data.productOptions,
      priceExpose: data.priceExpose,
      etc: data.etc,
      selectedDepartment: data.selectedDepartment
    });
    
    setSelectedTreatments(data.selectedKeys);
    setTreatmentOptions(data.productOptions);
    setPriceExpose(data.priceExpose);
    setTreatmentEtc(data.etc);

    console.log('Step5Treatments - 상태 업데이트 완료:', {
      selectedTreatments: data.selectedKeys,
      treatmentOptions: data.productOptions,
      priceExpose: data.priceExpose,
      treatmentEtc: data.etc,
    });
  };

  if (
    // isPending ||
    categoriesLoading ||
    isLoadingExistingData
  )
    return <LoadingSpinner backdrop />;


const handleNext = async () => {
    console.log('handleNext');
    setIsSubmitting(true);
    const result = await handleSave();
    setIsSubmitting(false);
    document.body.style.overflow = '';
    if (result?.status === 'success') {
        console.log('handleNext Step4 handlSave success');
        onNext();
    } else {
        console.log('handleNext Step4 handlSave what? :', result);
    }
  };

 
  const handleSave = async () => {
    console.log('Step4 handleSave 시작');
    
    try {
      // FormData 구성
      const formData = new FormData();
      formData.append('is_edit_mode', isEditMode ? 'true' : 'false');
      formData.append('current_user_uid', currentUserUid);
      formData.append('id_uuid_hospital', id_uuid_hospital);
      
      // 치료 옵션과 가격 정보
      formData.append('treatment_options', JSON.stringify(treatmentOptions));
      formData.append('price_expose', priceExpose.toString());
      formData.append('etc', treatmentEtc);
      
      // 선택된 치료 항목들
      formData.append('selected_treatments', selectedTreatments.join(','));

      console.log('Step4 API 호출 시작');
      
      // 새로운 API Route 호출
      const result = await uploadAPI.step5(formData);
      console.log('Step4 API 응답:', result);

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
        console.log('Step4 데이터 저장 성공');
        setFormState({
          message: result.message || '성공적으로 저장되었습니다.',
          status: 'success',
          errorType: undefined,
        });
        toast.success(result.message);
        return {
          status: 'success',
          message: result.message
        };
      }
      
    } catch (error) {
      console.error('Step4 API 호출 에러:', error);

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
      {/* 컨텐츠 영역 */}
      <div className="flex-1 my-8 mx-auto px-6 pb-24" 
      style={{ width: '100vw', maxWidth: '1024px' }}>
        <div className='w-full'>
          {/* 가능시술 선택하기  선택 모달 */}
          {categories && (
            <TreatmentSelectBox
              onSelectionChange={
                handleTreatmentSelectionChange
              }
              initialSelectedKeys={
                initialTreatmentData?.selectedKeys ||
                selectedTreatments
              }
              initialProductOptions={
                initialTreatmentData?.productOptions ||
                treatmentOptions
              }
              initialPriceExpose={
                initialTreatmentData?.priceExpose ??
                priceExpose
              }
              initialEtc={
                initialTreatmentData?.etc || treatmentEtc
              }
              categories={categories}
            />
          )}
        </div>

        {/* 선택된 시술 정보 표시 */}
        <TreatmentSelectedOptionInfo
          selectedKeys={selectedTreatments}
          productOptions={treatmentOptions}
          etc={treatmentEtc}
          categories={categories || []}
          showTitle={false}
          className="mt-4"
        />
        

      <PageBottom step={5} isSubmitting={isSubmitting}  onNext={handleNext} onPrev={onPrev} onDraftSave={handleSave}>
        <div className="text-xs text-gray-500 whitespace-pre-line">
          <p>
            <span className="text-red-500 font-semibold">
              *주의* 저장 버튼을 눌러야만 정보가 데이터베이스에 저장됩니다.
            </span>
            {'\n'}
            나중에 다시 수정하더라도 꼭 저장 버튼을 눌러주세요.
            {'\n'}
            <span className="text-red-500 font-semibold">
              저장버튼을 누르지 않고 새로고침하거나 뒤로가거나 창을 나가면 입력/편집한 정보가 소실됩니다.
            </span>
          </p>
        </div>
      </PageBottom>
      </div>

      {/* 기본 모달 */}
      {formState?.message && showFinalResult && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">{formState.status === 'success' ? '성공' : '오류'}</h3>
            <p className="text-sm text-gray-800 mb-4 whitespace-pre-line">{formState.message}</p>
            <div className="flex justify-end gap-2">
              <Button onClick={handleModal}>확인</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Step5Treatments;
