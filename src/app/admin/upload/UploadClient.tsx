'use client';

import PageHeader from '@/components/PageHeader';
import InputField from '@/components/InputField';
import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import { uploadActions } from './actions';
import { SurgeriesModal } from './modal';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '@/components/LoadingSpinner';
import useModal from '@/hooks/useModal';
import { AlertModal } from '@/components/modal';
import { useRouter } from 'next/navigation';
import DaumPost from '@/components/DaumPost';
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
import { useCategories } from '@/hooks/useCategories';
import { PreviewModal } from '@/components/modal/PreviewModal';
import { CategoryNode } from '@/types/category';
import DoctorInfoSection from '@/components/DoctorInfoSection';
import { DoctorInfo } from '@/components/DoctorInfoForm';
import { HospitalAddress } from '@/types/address';
import { loadExistingHospitalData } from '@/lib/hospitalDataLoader';
import { ExistingHospitalData } from '@/types/hospital';
import { mapExistingDataToFormValues } from '@/lib/hospitalDataMapper';
import { STORAGE_IMAGES } from '@/constants/tables';

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

interface UploadClientProps {
  currentUserUid: string;
  isEditMode?: boolean; // 편집 모드 여부
}

const UploadClient = ({
  currentUserUid,
  isEditMode = false,
}: UploadClientProps) => {
  const pageStartTime = Date.now();
  console.log(
    'UploadClient 페이지 시작:',
    new Date().toISOString(),
  );

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  // categories 디버깅
  console.log('UploadClient - categories 상태:', {
    categoriesLoading,
    categoriesError,
    categoriesLength: categories?.length || 0,
    categories,
  });

  const router = useRouter();
  const [address, setAddress] = useState('');
  const [addressForSendForm, setAddressForSendForm] =
    useState<HospitalAddress | null>(null);
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    key: number;
    label: string;
    name: string;
  } | null>(null);
  const [selectedTreatments, setSelectedTreatments] =
    useState<number[]>([]);
  const [treatmentOptions, setTreatmentOptions] = useState<
    any[]
  >([]);
  const [priceExpose, setPriceExpose] =
    useState<boolean>(true);
  const [treatmentEtc, setTreatmentEtc] =
    useState<string>('');
  const [initialTreatmentData, setInitialTreatmentData] =
    useState<{
      selectedKeys: number[];
      productOptions: any[];
      priceExpose: boolean;
      etc: string;
    } | null>(null);
  const [clinicImages, setClinicImages] = useState<File[]>(
    [],
  );
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
      specialistCount: 1,
    });
  const [searchkey, setSearchKey] = useState<string>('');
  const [search_key, setSearch_Key] = useState<string>('');
  // const supabase = createClient();
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
  const [initialBusinessHours, setInitialBusinessHours] =
    useState<OpeningHour[]>([]);

  // 편집 모드를 위한 폼 초기값 상태들
  const [hospitalName, setHospitalName] =
    useState<string>('');
  const [hospitalDirections, setHospitalDirections] =
    useState<string>('');
  const [hospitalLocation, setHospitalLocation] =
    useState<string>('');

  // 확인 모달 상태 추가
  const [showConfirmModal, setShowConfirmModal] =
    useState(false);
  const [preparedFormData, setPreparedFormData] =
    useState<FormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: surgeryList = [], isPending } = useQuery<
    Surgery[]
  >({
    queryKey: ['surgery_info'],
    queryFn: async () => {
      const queryStartTime = Date.now();
      console.log(
        'surgeryList 쿼리 시작:',
        new Date().toISOString(),
      );

      const { data, error } = await supabase
        .from('surgery_info')
        .select('*');

      const queryEndTime = Date.now();
      const queryTime = queryEndTime - queryStartTime;
      console.log(`surgeryList 쿼리 완료: ${queryTime}ms`, {
        dataLength: data?.length || 0,
        error: error?.message || null,
      });

      if (error) throw Error('surgery_info error');
      return data;
    },
  });

  const { handleOpenModal, open } = useModal();

  useEffect(() => {
    if (formState?.message && showFinalResult) {
      handleOpenModal();
    }
  }, [formState, showFinalResult]);

  // 페이지 로딩 완료 시간 측정
  useEffect(() => {
    if (!categoriesLoading && !isPending && categories) {
      const pageEndTime = Date.now();
      const totalLoadTime = pageEndTime - pageStartTime;
      console.log(
        'UploadClient 페이지 로딩 완료:',
        new Date().toISOString(),
      );
      console.log(
        `총 페이지 로딩 시간: ${totalLoadTime}ms (${(totalLoadTime / 1000).toFixed(2)}초)`,
      );
      console.log('로딩 완료 상태:', {
        categoriesCount: categories?.length || 0,
        surgeryListCount: surgeryList?.length || 0,
        categoriesLoading,
        isPending,
      });
    }
  }, [
    categoriesLoading,
    isPending,
    categories,
    surgeryList,
    pageStartTime,
  ]);

  // 편집 모드일 때 기존 데이터 로딩
  useEffect(() => {
    console.log(
      `isEditMode: ${isEditMode}, currentUserUid: ${currentUserUid}`,
    );
    if (isEditMode && currentUserUid) {
      loadExistingDataForEdit();
    }
  }, [isEditMode, currentUserUid]);

  // 기존 데이터가 로딩되었을 때 각 필드 상태 업데이트
  useEffect(() => {
    if (existingData && !hospitalName) {
      // 한 번만 실행되도록 조건 추가
      console.log('기존 데이터 상태 반영 시작');
      const formData =
        mapExistingDataToFormValues(existingData);

      // 병원 기본 정보 상태 업데이트
      if (formData.hospital.name !== hospitalName) {
        setHospitalName(formData.hospital.name);
      }
      if (
        formData.hospital.directions !== hospitalDirections
      ) {
        setHospitalDirections(formData.hospital.directions);
      }
      if (formData.hospital.location !== hospitalLocation) {
        setHospitalLocation(formData.hospital.location);
      }

      console.log('UploadClient 상태 업데이트 완료:', {
        hospitalName: formData.hospital.name,
        hasAddress: !!formData.address.roadAddress,
        doctorsCount: formData.doctors.length,
      });
    }
  }, [existingData]);

  const loadExistingDataForEdit = async () => {
    try {
      setIsLoadingExistingData(true);
      console.log(' 편집 모드 - 기존 데이터 로딩 시작');

      const data =
        await loadExistingHospitalData(currentUserUid);
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
    data: ExistingHospitalData,
  ) => {
    console.log('폼에 기존 데이터 적용 시작');

    try {
      // 1. 데이터를 폼 형식으로 변환
      const formData = mapExistingDataToFormValues(data);
      console.log('변환된 폼 데이터:', formData);

      // 2. 병원 기본 정보 설정
      setHospitalName(formData.hospital.name);
      setHospitalDirections(formData.hospital.directions);
      setHospitalLocation(formData.hospital.location);
      console.log(
        '병원 기본 정보 설정 완료:',
        formData.hospital.name,
      );

      // 3. 의사 정보 설정
      setDoctors(formData.doctors);
      console.log(
        '의사 정보 설정 완료:',
        formData.doctors.length,
        '명',
      );

      // 3. 주소 정보 설정
      if (formData.address.roadAddress) {
        setAddress(formData.address.roadAddress);
        setAddressForSendForm({
          address_full_road: formData.address.roadAddress,
          address_full_jibun: formData.address.jibunAddress,
          zipcode: formData.address.zonecode,
          address_si: formData.address.sido,
          address_gu: formData.address.sigungu,
          address_dong: formData.address.bname,
          address_detail: data.hospital.address_detail,
          address_detail_en:
            data.hospital.address_detail_en,
          directions_to_clinic:
            data.hospital.directions_to_clinic,
          directions_to_clinic_en:
            data.hospital.directions_to_clinic_en,
        });

        if (
          formData.address.coordinates.lat &&
          formData.address.coordinates.lng
        ) {
          setCoordinates({
            latitude: formData.address.coordinates.lat,
            longitude: formData.address.coordinates.lng,
          });
        }
        console.log('주소 정보 설정 완료');
      }

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
        specialistCount:
          formData.facilities.specialist_count,
      });
      console.log('편의시설 설정 완료');

      // 6. 위치 정보 설정
      if (data.hospital.location) {
        try {
          const locationData = JSON.parse(
            data.hospital.location,
          );
          if (
            locationData.key &&
            locationData.label &&
            locationData.name
          ) {
            setSelectedLocation(locationData);
            console.log(
              '위치 정보 설정 완료:',
              locationData,
            );
          }
        } catch (error) {
          console.error(
            '위치 정보 파싱 실패:',
            data.hospital.location,
            error,
          );
        }
      }

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
        병원명: formData.hospital.name,
        의사수: formData.doctors.length,
        영업시간: Object.keys(formData.businessHours)
          .length,
        시술정보: Object.keys(formData.treatments).length,
      });
    } catch (error) {
      console.error('❌ 폼 데이터 적용 중 오류:', error);
      setFormState({
        message: '기존 데이터 적용 중 오류가 발생했습니다.',
        status: 'error',
        errorType: 'server',
      });
      setShowFinalResult(true);
    }
  };

  const handleModal = () => {
    if (formState?.status === 'success') {
      router.refresh();
    }
    setShowFinalResult(false); // 결과 모달을 닫을 때 showFinalResult 초기화
    handleOpenModal();
  };

  // 선택된 치료 항목들과 상품옵션을 처리하는 함수
  const handleTreatmentSelectionChange = (data: {
    selectedKeys: number[];
    productOptions: any[];
    priceExpose: boolean;
    etc: string;
  }) => {
    setSelectedTreatments(data.selectedKeys);
    setTreatmentOptions(data.productOptions);
    setPriceExpose(data.priceExpose);
    setTreatmentEtc(data.etc);

    console.log('UploadClient - 시술 데이터 업데이트:', {
      selectedTreatments: data.selectedKeys,
      productOptions: data.productOptions,
      priceExpose: data.priceExpose,
      etc: data.etc,
    });
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

  // FormData에서 데이터를 요약 정보로 변환하는 함수
  const prepareFormDataSummary = (formData: FormData) => {
    // 시술 이름 매핑 생성 - 중첩된 구조를 재귀적으로 탐색
    const treatmentMap = new Map<number, string>();
    const departmentMap = new Map<number, string>(); // department 매핑 추가

    const flattenCategories = (nodes: CategoryNode[]) => {
      nodes.forEach((node) => {
        // key가 -1이 아닌 것만 매핑 (실제 시술)
        if (node.key !== -1) {
          treatmentMap.set(node.key, node.label);
          // department 정보도 매핑
          if (node.department) {
            departmentMap.set(node.key, node.department);
          }
        }
        if (node.children) {
          flattenCategories(node.children);
        }
      });
    };

    if (categories) {
      flattenCategories(categories);
    }

    const getStatusText = (openingHour: OpeningHour) => {
      if (openingHour.open) return '영업';
      if (openingHour.closed) return '휴무';
      if (openingHour.ask) return '진료시간 문의 필요';
      return '미설정';
    };

    const formatTime = (hour: number, minute: number) => {
      if (hour === 0 && minute === 0) return '00:00';
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    // 영업시간 요약
    const openingHoursSummary = openingHours.map(
      (hour) => ({
        day: hour.day,
        status: getStatusText(hour),
        time: hour.open
          ? `${formatTime(hour.from.hour, hour.from.minute)} - ${formatTime(hour.to.hour, hour.to.minute)}`
          : '',
      }),
    );

    // 선택된 시술 이름들 가져오기
    const selectedTreatmentNames = selectedTreatments.map(
      (id) => {
        const name = treatmentMap.get(id);
        const department = departmentMap.get(id);
        return {
          name: name || `알 수 없는 시술 (ID: ${id})`,
          department: department || null,
        };
      },
    );

    // 좌표 정보 문자열로 변환
    const coordinatesText = coordinates
      ? `위도: ${coordinates.latitude}, 경도: ${coordinates.longitude}`
      : '설정되지 않음';

    // 치료옵션 요약 - 실제 데이터 구조에 맞게 수정
    const treatmentOptionsSummary = treatmentOptions.map(
      (option) => {
        // 시술 이름 찾기
        const treatmentName =
          treatmentMap.get(option.treatmentKey) ||
          `시술 ${option.treatmentKey}`;
        
        // department 정보 찾기
        const department = departmentMap.get(option.treatmentKey);

        // 옵션명 생성
        const optionName =
          option.value1 && Number(option.value1) >= 1
            ? `[${treatmentName}] ${option.value1}`
            : `[${treatmentName}] 옵션없음`;

        return {
          treatmentKey: option.treatmentKey,
          optionName: optionName,
          price: Number(option.value2) || 0,
          department: department || null,
        };
      },
    );

    // 부가옵션 요약 - 배열 형태로 변환
    const facilities = Object.entries(optionState)
      .filter(
        ([key, value]) =>
          key !== 'specialistCount' && value === true,
      )
      .map(([key]) => {
        switch (key) {
          case 'has_private_recovery_room':
            return '전담회복실';
          case 'has_parking':
            return '주차가능';
          case 'has_cctv':
            return 'CCTV';
          case 'has_night_counseling':
            return '야간상담';
          case 'has_female_doctor':
            return '여의사진료';
          case 'has_anesthesiologist':
            return '마취전문의';
          default:
            return key;
        }
      });

    // 이미지 URL 개수 계산
    let clinicImageCount = 0;
    let clinicImageUrls: string[] = [];

    try {
      const clinicUrls = formData.get(
        'clinic_image_urls',
      ) as string;

      if (clinicUrls) {
        const parsedClinicUrls = JSON.parse(clinicUrls);
        if (Array.isArray(parsedClinicUrls)) {
          clinicImageCount = parsedClinicUrls.length;
          clinicImageUrls = parsedClinicUrls;
        }
      }
    } catch (e) {
      // 파싱 실패 시 기본값 유지
    }

    // 기존 이미지 URL도 포함 (편집 모드인 경우)
    if (existingData?.hospital.imageurls) {
      clinicImageUrls = [...clinicImageUrls, ...existingData.hospital.imageurls];
      clinicImageCount = clinicImageUrls.length;
    }

    return {
      basicInfo: {
        name: (formData.get('name') as string) || '',
        searchkey: searchkey,
        search_key: search_key,
      },
      address: {
        road: addressForSendForm?.address_full_road || '',
        jibun: addressForSendForm?.address_full_jibun || '',
        detail: addressForSendForm?.address_detail || '',
        coordinates: coordinatesText,
      },
      location: selectedLocation?.label || '선택되지 않음',
      treatments: {
        count: selectedTreatments.length,
        items: selectedTreatmentNames,
      },
      treatmentOptions: {
        count: treatmentOptionsSummary.length,
        items: treatmentOptionsSummary,
      },
      treatmentEtc: treatmentEtc.trim(),
      openingHours: {
        count: openingHours.length,
        items: openingHoursSummary,
      },
      extraOptions: {
        facilities,
        specialistCount: optionState.specialistCount,
      },
      images: {
        clinicImages: clinicImageCount,
        doctorImages: doctors.length,
        clinicImageUrls: clinicImageUrls,
      },
      doctors:
        doctors.length > 0
          ? {
              count: doctors.length,
              items: doctors.map((doctor) => ({
                name: doctor.name,
                bio: doctor.bio || '',
                isChief: doctor.isChief
                  ? '대표원장'
                  : '의사',
                hasImage: doctor.useDefaultImage
                  ? '기본 이미지'
                  : '업로드 이미지',
                imageUrl: doctor.useDefaultImage 
                  ? (doctor.defaultImageType === 'woman' 
                      ? '/default/doctor_default_woman.png' 
                      : '/default/doctor_default_man.png')
                  : doctor.imagePreview || undefined, // 업로드된 이미지 미리보기 URL
              })),
            }
          : undefined,
    };
  };

  // Validation 체크 함수 - 테스트를 위해 주석처리/해제 가능
  const validateFormData = () => {
    // ====== VALIDATION 체크 시작 ======
    // 테스트 시 이 전체 블록을 주석처리하면 validation 건너뜀

    // 1. 병원명 검증 (필수)
    const clinicNameInput = document.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    const clinicName = clinicNameInput?.value || '';

    if (!clinicName || clinicName.trim() === '') {
      console.log('validateFormData 1');
      setFormState({
        message: '병원명을 입력해주세요.',
        status: 'error',
        errorType: 'validation',
      });
      setShowFinalResult(true);
      return false;
    }

    // 2. 주소 검증 (필수)
    if (
      !addressForSendForm ||
      !addressForSendForm.address_full_road
    ) {
      console.log('validateFormData 2');
      setFormState({
        message: '주소를 선택해주세요.',
        status: 'error',
        errorType: 'validation',
      });
      setShowFinalResult(true);
      return false;
    }

    // 3. 지역 검증 (필수)
    if (!selectedLocation) {
      console.log('validateFormData 3');
      setFormState({
        message: '지역을 선택해주세요.',
        status: 'error',
        errorType: 'validation',
      });
      setShowFinalResult(true);
      return false;
    }

    // 4. 시술 선택 검증 (필수)
    if (selectedTreatments.length === 0) {
      console.log('validateFormData 4');
      setFormState({
        message: '가능시술을 최소 1개 이상 선택해주세요.',
        status: 'error',
        errorType: 'validation',
      });
      setShowFinalResult(true);
      return false;
    }

    // 일정저장 눌렀는지 여부 체크 

    // 5. 병원 이미지 검증 (필수) - 편집 모드에서는 기존 이미지도 고려
    const existingImageCount =
      existingData?.hospital.imageurls?.length || 0;
    const totalImageCount =
      clinicImages.length + existingImageCount;

    if (totalImageCount < 3) {
      console.log('validateFormData 5 - 이미지 없음');
      setFormState({
        message:
          '병원 이미지를 최소 3개 이상 업로드해주세요.',
        status: 'error',
        errorType: 'validation',
      });
      setShowFinalResult(true);
      return false;
    }

    console.log(
      `validateFormData 5 통과 - 새 이미지: ${clinicImages.length}개, 기존 이미지: ${existingImageCount}개, 총: ${totalImageCount}개`,
    );

    // 6. 의사 이미지 검증 (선택사항 - 빈값 허용)
    // doctorImages는 검증하지 않음

    // 6-1. 의사 정보 검증 
    if (doctors.length < 1) {
      setFormState({
        message:
          '의사 정보를 최소 1개이상 입력해주세요.',
        status: 'error',
        errorType: 'validation',
      });
      setShowFinalResult(true);
      return false;
    }
 //입력된 경우 입력된 내용 검증
    if (doctors.length > 0) {
      for (const doctor of doctors) {
        if (!doctor.name || doctor.name.trim() === '') {
          setFormState({
            message: '의사 이름을 입력해주세요.',
            status: 'error',
            errorType: 'validation',
          });
          setShowFinalResult(true);
          console.log('validateFormData 6');
          return false;
        }

        // 이미지가 없고 기본 이미지도 선택하지 않은 경우
        if (
          !doctor.useDefaultImage &&
          !doctor.imageFile &&
          !doctor.imagePreview
        ) {
          setFormState({
            message: `${doctor.name} 의사의 이미지를 업로드하거나 기본 이미지를 선택해주세요.`,
            status: 'error',
            errorType: 'validation',
          });
          setShowFinalResult(true);
          console.log('validateFormData 7');
          return false;
        }
      }
    }

    // 7. 부가시설 옵션 검증 (선택사항 - 빈값 허용)
    // optionState는 검증하지 않음

    // ====== VALIDATION 체크 끝 ======
    console.log('validateFormData final return true');
    return true; // 모든 검증 통과
  };

  // 미리보기 모달 표시를 위한 데이터 준비
  const handlePreview = async () => {
    console.log('handlePreview 1');
    try {
      // 파일명을 안전하게 변환하는 함수
      const sanitizeFileName = (
        originalName: string,
        uuid: string,
      ): string => {
        // 확장자 추출
        const lastDotIndex = originalName.lastIndexOf('.');
        const extension =
          lastDotIndex !== -1
            ? originalName.substring(lastDotIndex)
            : '';
        const nameWithoutExt =
          lastDotIndex !== -1
            ? originalName.substring(0, lastDotIndex)
            : originalName;

        // 파일명에서 한글, 공백, 특수문자 제거/치환
        const sanitizedName = nameWithoutExt
          .replace(/[^\w\-_.]/g, '_') // 영문, 숫자, _, -, . 외의 모든 문자를 _로 치환
          .replace(/_{2,}/g, '_') // 연속된 언더스코어를 하나로 통합
          .replace(/^_+|_+$/g, '') // 앞뒤 언더스코어 제거
          .substring(0, 20); // 길이 제한 (20자)

        // 타임스탬프 + UUID 부분 + 정제된 이름 + 확장자
        const timestamp = Date.now();
        const uuidShort = uuid.split('-')[0]; // UUID의 첫 번째 부분만 사용

        // 정제된 이름이 비어있으면 기본명 사용
        const finalName = sanitizedName || 'image';

        return `${timestamp}_${uuidShort}_${finalName}${extension}`;
      };
      console.log('handlePreview 2');
      // Validation 체크
      if (!validateFormData()) {
        return; // validation 실패 시 중단
      }
      console.log('handlePreview 3');
      // validation 통과 후 병원명 다시 가져오기
      const clinicNameInput = document.querySelector(
        'input[name="name"]',
      ) as HTMLInputElement;
      const clinicName = clinicNameInput?.value || '';

      // 이미지 업로드 상태 추가
      setIsSubmitting(true);

      // 병원 고유 UUID 생성 (이미지 업로드 경로용)
      const id_uuid = crypto.randomUUID();

      console.log('이미지 업로드 시작...');
      console.log('병원 UUID:', id_uuid);

      // 업로드된 이미지 URL 추적 (실패 시 삭제용)
      const uploadedImageUrls: string[] = [];

      try {
        // 1. 병원 이미지 업로드
        const clinicImageUrls: string[] = [];
        if (clinicImages.length > 0) {
          console.log(
            `병원 이미지 업로드 중... (${clinicImages.length}개)`,
          );

          for (let i = 0; i < clinicImages.length; i++) {
            const file = clinicImages[i];
            console.log(
              `  업로드 중 ${i + 1}/${clinicImages.length}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
            );

            // 안전한 파일명 생성
            const safeFileName = sanitizeFileName(
              file.name,
              id_uuid,
            );
            const filePath = `hospitalimg/${id_uuid}/${safeFileName}`;

            console.log(`    원본 파일명: ${file.name}`);
            console.log(
              `    안전한 파일명: ${safeFileName}`,
            );
            console.log(`    업로드 경로: ${filePath}`);

            const { data, error } = await supabase.storage
              .from(STORAGE_IMAGES)
              .upload(filePath, file);

            if (error) {
              console.error(
                `병원 이미지 업로드 실패: ${file.name}`,
                error,
              );
              throw new Error(
                `병원 이미지 업로드 실패: ${error.message}`,
              );
            }

            const imageUrl = `${process.env.NEXT_PUBLIC_IMG_URL}${data.path}`;
            clinicImageUrls.push(imageUrl);
            uploadedImageUrls.push(imageUrl);

            console.log(
              `  업로드 완료: ${safeFileName} → ${imageUrl}`,
            );
          }
        }

        // 2. 의사 이미지 업로드
        const doctorImageUrls: string[] = [];
        if (doctors.length > 0) {
          console.log(
            `의사 이미지 업로드 중... (${doctors.length}개)`,
          );

          for (let i = 0; i < doctors.length; i++) {
            const doctor = doctors[i];

            // 기본 이미지를 사용하는 경우 업로드하지 않고 기본 이미지 URL 사용
            if (doctor.useDefaultImage) {
              const defaultImageUrl =
                doctor.defaultImageType === 'woman'
                  ? '/default/doctor_default_woman.png'
                  : '/default/doctor_default_man.png';
              doctorImageUrls.push(defaultImageUrl);
              console.log(
                `  기본 이미지 사용: ${doctor.name} → ${defaultImageUrl}`,
              );
              continue;
            }

            // 업로드할 이미지 파일이 있는 경우
            if (doctor.imageFile) {
              console.log(
                `  업로드 중 ${i + 1}/${doctors.length}: ${doctor.name} (${(doctor.imageFile.size / 1024).toFixed(2)} KB)`,
              );

              // 안전한 파일명 생성
              const safeFileName = sanitizeFileName(
                doctor.imageFile.name,
                id_uuid,
              );
              const filePath = `doctors/${id_uuid}/${safeFileName}`;

              console.log(
                `    원본 파일명: ${doctor.imageFile.name}`,
              );
              console.log(
                `    안전한 파일명: ${safeFileName}`,
              );
              console.log(`    업로드 경로: ${filePath}`);

              const { data, error } = await supabase.storage
                .from(STORAGE_IMAGES)
                .upload(filePath, doctor.imageFile);

              if (error) {
                console.error(
                  `의사 이미지 업로드 실패: ${doctor.name}`,
                  error,
                );
                throw new Error(
                  `의사 이미지 업로드 실패: ${error.message}`,
                );
              }

              const imageUrl = `${process.env.NEXT_PUBLIC_IMG_URL}${data.path}`;
              doctorImageUrls.push(imageUrl);
              uploadedImageUrls.push(imageUrl);

              console.log(
                `  업로드 완료: ${safeFileName} → ${imageUrl}`,
              );
            } else {
              console.log(
                `  이미지 파일 없음: ${doctor.name}`,
              );
              doctorImageUrls.push(''); // 빈 URL로 처리
            }
          }
        }

        console.log('모든 이미지 업로드 완료!');
        console.log(
          `병원 이미지: ${clinicImageUrls.length}개`,
        );
        console.log(
          `의사 이미지: ${doctorImageUrls.length}개`,
        );

        // FormData 구성 (이미지 URL만 포함, 파일 객체 제외)
        const formData = new FormData();

        // 기본 정보
        formData.append('id_uuid', id_uuid);
        formData.append('current_user_uid', currentUserUid);
        formData.append('name', clinicName);
        formData.append('searchkey', clinicName);
        formData.append('search_key', clinicName);

        // 이미지 URL들 (파일 객체가 아닌 URL 문자열)
        formData.append(
          'clinic_image_urls',
          JSON.stringify(clinicImageUrls),
        );
        formData.append(
          'doctor_image_urls',
          JSON.stringify(doctorImageUrls),
        );

        // 주소 latitude, longitude, 주소상세 포함
        if (addressForSendForm) {
          formData.append(
            'address_full_road',
            addressForSendForm.address_full_road ?? '',
          );
          formData.append(
            'address_full_road_en',
            addressForSendForm.address_full_road_en ?? '',
          );
          formData.append(
            'address_full_jibun',
            addressForSendForm.address_full_jibun ?? '',
          );
          formData.append(
            'address_full_jibun_en',
            addressForSendForm.address_full_jibun_en ?? '',
          );
          formData.append(
            'address_si',
            addressForSendForm.address_si ?? '',
          );
          formData.append(
            'address_si_en',
            addressForSendForm.address_si_en ?? '',
          );
          formData.append(
            'address_gu',
            addressForSendForm.address_gu ?? '',
          );
          formData.append(
            'address_gu_en',
            addressForSendForm.address_gu_en ?? '',
          );
          formData.append(
            'address_dong',
            addressForSendForm.address_dong ?? '',
          );
          formData.append(
            'address_dong_en',
            addressForSendForm.address_dong_en ?? '',
          );
          formData.append(
            'zipcode',
            addressForSendForm.zipcode ?? '',
          );
          formData.append(
            'latitude',
            addressForSendForm.latitude !== undefined
              ? String(addressForSendForm.latitude)
              : '',
          );
          formData.append(
            'longitude',
            addressForSendForm.longitude !== undefined
              ? String(addressForSendForm.longitude)
              : '',
          );
          formData.append(
            'address_detail',
            addressForSendForm.address_detail ?? '',
          );
          formData.append(
            'address_detail_en',
            addressForSendForm.address_detail_en ?? '',
          );
          formData.append(
            'directions_to_clinic',
            addressForSendForm.directions_to_clinic ?? '',
          );
          formData.append(
            'directions_to_clinic_en',
            addressForSendForm.directions_to_clinic_en ??
              '',
          );
        }

        // 지역
        if (selectedLocation) {
          formData.append(
            'location',
            JSON.stringify(selectedLocation),
          );
        }

        // 선택된 치료 항목들을 formData에 추가
        if (selectedTreatments.length > 0) {
          formData.append(
            'selected_treatments',
            JSON.stringify(selectedTreatments),
          );
        }

        // 상품옵션 데이터를 formData에 추가
        if (treatmentOptions.length > 0) {
          formData.append(
            'treatment_options',
            JSON.stringify(treatmentOptions),
          );
          console.log('상품옵션 formData 추가:', {
            length: treatmentOptions.length,
            data: treatmentOptions,
            jsonString: JSON.stringify(treatmentOptions),
          });
        } else {
          console.log('상품옵션이 없습니다.');
        }

        // 가격노출 설정 추가
        formData.append(
          'price_expose',
          priceExpose.toString(),
        );
        console.log('가격노출 설정:', priceExpose);

        // 시설정보
        formData.append(
          'extra_options',
          JSON.stringify(optionState),
        );

        // opening hour schedules info
        formData.append(
          'opening_hours',
          JSON.stringify(openingHours),
        );

        // 기타 시술 정보 추가
        formData.append('etc', treatmentEtc);
        console.log('기타 시술 정보:', treatmentEtc);

        // 의사 정보 추가
        if (doctors.length > 0) {
          const doctorsData = doctors.map(
            (doctor, index) => ({
              name: doctor.name,
              bio: doctor.bio || '',
              imageUrl: doctorImageUrls[index] || '',
              chief: doctor.isChief ? 1 : 0, // chief 컬럼은 int 타입이므로 1 또는 0
              useDefaultImage: doctor.useDefaultImage,
              defaultImageType: doctor.defaultImageType,
            }),
          );

          formData.append(
            'doctors',
            JSON.stringify(doctorsData),
          );
          console.log('의사 정보 formData 추가:', {
            length: doctors.length,
            data: doctorsData,
            jsonString: JSON.stringify(doctorsData),
          });
        } else {
          console.log('등록된 의사가 없습니다.');
        }

        // 미리보기용 데이터 전체 로그 출력
        console.log(
          '===== 미리보기용 데이터 전체 목록 =====',
        );
        console.log('미리보기 데이터:');
        console.log('- 병원 UUID:', id_uuid);
        console.log('- 병원명:', formData.get('name'));
        console.log('- 검색키:', searchkey);
        console.log('- 검색키2:', search_key);
        console.log('- 주소 정보:', addressForSendForm);
        console.log('- 선택된 위치:', selectedLocation);
        console.log(
          '- 선택된 치료 항목들:',
          selectedTreatments,
        );
        console.log('- 상품옵션:', treatmentOptions);
        console.log('- 가격노출 설정:', priceExpose);
        console.log('- 기타 시술 정보:', treatmentEtc);
        console.log('- 영업시간:', openingHours);
        console.log('- 부가 시설 옵션:', optionState);
        console.log('- 병원 이미지 URL:', clinicImageUrls);
        console.log('- 의사 이미지 URL:', doctorImageUrls);
        console.log('- 의사 정보:', doctors);
        console.log('================================');

        // FormData를 저장하고 미리보기 모달 표시
        setPreparedFormData(formData);
        setShowConfirmModal(true);
      } catch (imageUploadError) {
        console.error(
          '이미지 업로드 중 오류:',
          imageUploadError,
        );

        // 업로드된 이미지들 삭제 (롤백)
        if (uploadedImageUrls.length > 0) {
          console.log('업로드된 이미지 삭제 중...');

          for (const imageUrl of uploadedImageUrls) {
            try {
              // URL에서 경로 추출 (images/ 이후 부분)
              const urlPath = imageUrl.replace(
                process.env.NEXT_PUBLIC_IMG_URL || '',
                '',
              );

              const { error: deleteError } =
                await supabase.storage
                  .from(STORAGE_IMAGES)
                  .remove([urlPath]);

              if (deleteError) {
                console.error(
                  `이미지 삭제 실패: ${imageUrl}`,
                  deleteError,
                );
              } else {
                console.log(
                  `이미지 삭제 완료: ${imageUrl}`,
                );
              }
            } catch (deleteErr) {
              console.error(
                `이미지 삭제 중 오류: ${imageUrl}`,
                deleteErr,
              );
            }
          }
        }

        // 에러 메시지 표시
        let errorMessage =
          '이미지 업로드 중 오류가 발생했습니다.';
        if (imageUploadError instanceof Error) {
          errorMessage = imageUploadError.message;
        }

        setFormState({
          message: errorMessage,
          status: 'error',
          errorType: 'server',
        });
      }
    } catch (error) {
      console.error('미리보기 데이터 준비 중 오류:', error);
      setFormState({
        message:
          '미리보기 데이터 준비 중 오류가 발생했습니다.',
        status: 'error',
        errorType: 'server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 최종 제출 함수 (PreviewModal에서 호출)
  const handleFinalSubmit = async () => {
    if (!preparedFormData) return;

    setIsSubmitting(true);

    try {
      console.log('최종 제출 시작...');

      // FormData 크기 측정 함수
      const calculateFormDataSize = (
        formData: FormData,
      ) => {
        let totalSize = 0;
        let textDataSize = 0;
        const details: any[] = [];

        for (const [key, value] of formData.entries()) {
          // 모든 데이터가 텍스트 데이터 (이미지는 URL 문자열)
          const textBytes = new TextEncoder().encode(
            value.toString(),
          ).length;
          textDataSize += textBytes;
          totalSize += textBytes;

          details.push({
            key,
            type: 'TextData',
            value:
              value.toString().substring(0, 100) +
              (value.toString().length > 100 ? '...' : ''),
            size: textBytes,
            sizeKB: (textBytes / 1024).toFixed(4),
            category: getCategoryForKey(key),
          });
        }

        return {
          totalSize,
          textDataSize,
          totalSizeKB: (totalSize / 1024).toFixed(2),
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(
            4,
          ),
          textDataSizeKB: (textDataSize / 1024).toFixed(4),
          details,
        };
      };

      // 키에 따른 카테고리 분류 함수
      const getCategoryForKey = (key: string) => {
        if (key.includes('image_urls')) return 'Image URLs';
        if (key.includes('address')) return 'Address Info';
        if (
          key.includes('treatment') ||
          key.includes('selected_treatments')
        )
          return 'Treatment Info';
        if (key.includes('opening_hours'))
          return 'Business Hours';
        if (key.includes('extra_options'))
          return 'Facility Options';
        if (key.includes('location')) return 'Location';
        if (
          key === 'name' ||
          key === 'searchkey' ||
          key === 'search_key' ||
          key === 'id_uuid'
        )
          return 'Basic Info';
        return 'Other';
      };

      // FormData 크기 분석
      const sizeInfo = calculateFormDataSize(
        preparedFormData,
      );

      console.log(
        '===== FormData 크기 분석 (개선된 구조) =====',
      );
      console.log(
        `전체 크기 (Server Actions로 전송): ${sizeInfo.totalSizeMB} MB (${sizeInfo.totalSizeKB} KB)`,
      );
      console.log(
        `텍스트 데이터 크기: ${sizeInfo.textDataSizeKB} KB (이미지 URL 포함)`,
      );
      console.log('');
      console.log(
        '이미지 파일은 이미 Supabase Storage에 업로드 완료!',
      );
      console.log(
        'Server Actions에는 이미지 URL만 전송되므로 크기 제한 해결!',
      );
      console.log('상세 내역:');

      // 카테고리별로 그룹화
      const groupedByCategory = sizeInfo.details.reduce(
        (acc: any, item) => {
          const category = item.category || item.type;
          if (!acc[category]) acc[category] = [];
          acc[category].push(item);
          return acc;
        },
        {},
      );

      Object.entries(groupedByCategory).forEach(
        ([category, items]: [string, any]) => {
          console.log(`\n  ${category}:`);
          items.forEach((item: any) => {
            console.log(
              `    ${item.key}: ${item.sizeKB} KB - "${item.value}"`,
            );
          });
        },
      );

      // 1MB 제한과 비교 (이제는 통과할 것)
      const limitMB = 1;
      const limitBytes = limitMB * 1024 * 1024;
      const isOverLimit = sizeInfo.totalSize > limitBytes;

      if (isOverLimit) {
        console.warn(
          `여전히 Server Actions 크기 제한 초과 (예상되지 않음)`,
        );
        console.warn(
          `현재: ${sizeInfo.totalSizeMB} MB, 제한: ${limitMB} MB`,
        );

        setFormState({
          message: `데이터 크기가 여전히 큽니다: ${sizeInfo.totalSizeMB} MB`,
          status: 'error',
          errorType: 'server',
        });

        setShowConfirmModal(false);
        setPreparedFormData(null);
        return;
      } else {
        console.log(
          `Server Actions 크기 제한 통과: ${sizeInfo.totalSizeMB} MB < ${limitMB} MB`,
        );
        console.log(
          `모든 데이터가 텍스트: ${sizeInfo.textDataSizeKB} KB`,
        );
      }

      console.log('FormData 내용 확인:');

      // FormData 내용을 간단히 로그로 출력
      for (const [
        key,
        value,
      ] of preparedFormData.entries()) {
        if (value instanceof File) {
          console.log(
            `  - ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(2)} KB)`,
          );
        } else {
          const preview =
            value.toString().length > 50
              ? value.toString().substring(0, 50) + '...'
              : value.toString();
          console.log(`  - ${key}: "${preview}"`);
        }
      }

      // 직접 uploadActions 호출
      const result = await uploadActions(
        null,
        preparedFormData,
      );

      console.log('uploadActions 응답:', result);
      setFormState(result);
      setShowFinalResult(true); // 최종 제출 결과만 얼러트 표시

      setShowConfirmModal(false);
      setPreparedFormData(null);
    } catch (error) {
      console.error('uploadActions 호출 에러:', error);

      let errorMessage = '업로드 중 오류가 발생했습니다.';

      if (error instanceof Error && error.message) {
        errorMessage = `업로드 오류: ${error.message}`;
      }

      setFormState({
        message: errorMessage,
        status: 'error',
        errorType: 'server',
      });
      setShowFinalResult(true); // 에러도 최종 결과로 표시
      setShowConfirmModal(false);
      setPreparedFormData(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 취소 처리
  const handleModalCancel = () => {
    setShowConfirmModal(false);
    setPreparedFormData(null);
  };

  // 렌더링 시점 디버깅
  console.log('UploadClient 렌더링:', {
    isEditMode,
    hospitalName,
    address,
    addressForSendForm,
    coordinates,
    selectedLocation,
    doctorsCount: doctors.length,
    hasExistingData: !!existingData,
    isLoadingExistingData,
    optionState,
    전달할주소props: {
      initialAddress: address,
      initialAddressDetail:
        addressForSendForm?.address_detail,
      initialAddressDetailEn:
        addressForSendForm?.address_detail_en,
      initialDirections:
        addressForSendForm?.directions_to_clinic,
      initialDirectionsEn:
        addressForSendForm?.directions_to_clinic_en,
    },
  });

  if (
    isPending ||
    categoriesLoading ||
    isLoadingExistingData
  )
    return <LoadingSpinner backdrop />;

  return (
    <main>
      <PageHeader name='병원 정보를 입력하세요' />
      <div
        className='my-8 mx-auto px-6'
        style={{ width: '100vw', maxWidth: '1024px' }}
      >
        <div className='space-y-4 w-full'>
          <InputField
            label='병원명'
            name='name'
            required
            value={hospitalName}
            onChange={(e) =>
              setHospitalName(e.target.value)
            }
          />
          {/* <InputField label="searchkey" name="searchkey" required />
        <InputField label="search_key" name="search_key" required /> */}
          <div className='w-full'>
            <AddressSection
              onSelectAddress={setAddressForSendForm}
              onSelectCoordinates={setCoordinates}
              initialAddress={address}
              initialAddressForSendForm={
                addressForSendForm ?? undefined
              }
              initialCoordinates={coordinates ?? undefined}
              initialAddressDetail={
                addressForSendForm?.address_detail
              }
              initialAddressDetailEn={
                addressForSendForm?.address_detail_en
              }
              initialDirections={
                addressForSendForm?.directions_to_clinic
              }
              initialDirectionsEn={
                addressForSendForm?.directions_to_clinic_en
              }
            />
          </div>
          <LocationSelect
            onSelect={setSelectedLocation}
            selectedLocation={selectedLocation}
          />
          <div className='w-full'>
            {/* <SurgeriesModal itemList={surgeryList} /> */}
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

          {/* 디버깅 정보 표시 */}
          {(selectedTreatments.length > 0 ||
            coordinates ||
            selectedLocation ||
            treatmentEtc.trim() !== '') && (
            <div className='mt-4 p-4 bg-gray-100 rounded border'>
              <h3 className='font-semibold mb-2'>
                선택된 정보:
              </h3>
              {selectedLocation && (
                <p className='text-sm'>
                  <strong>위치:</strong>{' '}
                  {selectedLocation.label}
                </p>
              )}
              {coordinates && (
                <p className='text-sm'>
                  <strong>좌표:</strong> 위도{' '}
                  {coordinates.latitude}, 경도{' '}
                  {coordinates.longitude}
                </p>
              )}
              {selectedTreatments.length > 0 && (
                <p className='text-sm'>
                  <strong>선택된 치료 개수:</strong>{' '}
                  {selectedTreatments.length}개
                </p>
              )}
              {treatmentEtc.trim() !== '' && (
                <p className='text-sm'>
                  <strong>기타 시술 정보:</strong>{' '}
                  {treatmentEtc}
                </p>
              )}
              {}
            </div>
          )}
        </div>
        {/* 영업시간 등록  */}
        {/* <div className="w-full">
        <h3 className="font-semibold mb-2">영업시간 날짜 시간 등록</h3> */}
        <OpeningHoursForm
          onSelectOpeningHours={setOpeningHours}
          initialHours={initialBusinessHours}
        />
        {/* </div> */}
        <div className='w-full mt-4'>
          <ExtraOptions
            onSelectOptionState={handleExtraOptionsChange}
            initialOptions={optionState}
          />
        </div>
        {/* 병원 이미지 업로드 */}
        <ClinicImageUploadSection
          maxImages={clinicImageUploadLength}
          title='병원 이미지 등록'
          description={`- 병원 메인 이미지는 가로로 긴 직사각형(권장 비율: 16:9 또는 3:1)으로 업로드해 주세요.
  · 예시: 1600x900px(16:9) 또는 1800x600px(3:1)
  · 알림: 주어진 사진을 중앙을 기준으로 16:9 혹은 3:1 비율로 넘치는 부분이 자동으로 잘라집니다.
      사진이 비율보다 작으면 가로기준으로 비율을 맞춰서 자동으로 확대해서 화면에 맞춰줍니다.
      * File 한개당 50MB 이하로 업로드 해주세요.
      * 최소(3개이상) - 최대(권장) 7개까지 업로드 가능합니다. 추가 업로드 원하시면 문의 부탁드립니다.`}
          onFilesChange={setClinicImages}
          name='clinic_images'
          type='Banner'
          initialImages={
            existingData?.hospital.imageurls || []
          }
        />

        {/* 의사 정보 등록 */}
        <DoctorInfoSection
          title='의사 정보 등록'
          description={`- 의사 프로필 정보를 입력하고 이미지를 등록하세요.
- 이미지는 정사각형(1:1) 비율로 자동 조정됩니다.
- 기본 이미지를 사용하거나 직접 업로드할 수 있습니다.`}
          onDoctorsChange={setDoctors}
          initialDoctors={doctors}
        />

        <div className='flex justify-center mt-8 gap-8'>
          <Button
            color='red'
            onClick={() => router.push('/admin')}
          >
            cancel
          </Button>
          <Button
            color='blue'
            disabled={isSubmitting}
            onClick={handlePreview}
          >
            {isSubmitting ? '...submit' : 'preview'}
          </Button>
        </div>
      </div>

      <AlertModal onCancel={handleModal} open={open}>
        {formState?.status === 'success'
          ? '등록 성공'
          : formState?.errorType === 'validation'
          ? formState?.message || '입력 정보를 확인해주세요.'
          : `등록 실패\n(본 메시지를 스크린샷을 찍거나 복사해서 알려주세요):\n\n ${Array.isArray(formState?.message) ? formState.message[0] : formState?.message}`}
      </AlertModal>

      {/* 제출 확인 모달 안에서는 제출할 내용만 출력할뿐 안에서 POST관련 처리는 없음  */}
      {showConfirmModal && preparedFormData && (
        <PreviewModal
          open={showConfirmModal}
          formData={prepareFormDataSummary(
            preparedFormData,
          )}
          onConfirm={handleFinalSubmit}
          onCancel={handleModalCancel}
          isSubmitting={isSubmitting}
        />
      )}
    </main>
  );
};

export default UploadClient;
