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
import { findRegionByKey, REGIONS } from '@/app/contents/location';

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

interface Step1BasicInfoProps {
  id_uuid_hospital: string;
  setIdUUIDHospital: (id_uuid_hospital: string) => void;
  currentUserUid: string;
  isEditMode?: boolean; // 편집 모드 여부
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

const Step1BasicInfo = ({
  id_uuid_hospital,
  setIdUUIDHospital,
  onNext,
  currentUserUid,
  isEditMode = false,
}: Step1BasicInfoProps) => {
  const pageStartTime = Date.now();
  // console.log(
  //   'UploadClient 페이지 시작:',
  //   new Date().toISOString(),
  // );

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useTreatmentCategories();

  // categories 디버깅
  // console.log('UploadClient - categories 상태:', {
  //   categoriesLoading,
  //   categoriesError,
  //   categoriesLength: categories?.length || 0,
  //   categories,
  // });

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
      specialist_count: 1,
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

  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: hospitalName,
    email: '',
    tel: '',
    kakao_talk: '',
    line: '',
    we_chat: '',
    whats_app: '',
    telegram: '',
    facebook_messenger: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    other_channel: '',
    sns_content_agreement: null,
  });

  const [feedback, setFeedback] = useState<string>('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const { data: surgeryList = [], isPending } = useQuery<
    Surgery[]
  >({
    queryKey: ['surgery_info'],
    queryFn: async () => {
      const queryStartTime = Date.now();
      // console.log(
      //   'surgeryList 쿼리 시작:',
      //   new Date().toISOString(),
      // );

      const { data, error } = await supabase
        .from('surgery_info')
        .select('*');

      const queryEndTime = Date.now();
      const queryTime = queryEndTime - queryStartTime;
    
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

  // 편집 모드일 때 기존 데이터 로딩
  useEffect(() => {
    console.log(
      `isEditMode: ${isEditMode}, currentUserUid: ${currentUserUid}`,
    );
    if (isEditMode && currentUserUid) {
      loadExistingDataForEdit();
    }
  }, [isEditMode, currentUserUid]);

  // hospitalName 상태를 basicInfo.name과 동기화
  useEffect(() => {
    setHospitalName(basicInfo.name);
  }, [basicInfo.name]);

  const loadExistingDataForEdit = async () => {
    try {
      setIsLoadingExistingData(true);
      console.log(' 편집 모드 - 기존 데이터 로딩 시작');

      const data =
        await loadExistingHospitalData(currentUserUid, id_uuid_hospital, 1);
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

      // 2. 병원 기본 정보 설정
      setHospitalName(formData.hospital.name);
      setHospitalDirections(formData.hospital.directions);
      setHospitalLocation(formData.hospital.location);
      
      // SNS 채널 정보와 기본 정보 설정
      if (existingData.hospitalDetail) {
        setBasicInfo({
          name: formData.hospital.name || '',
          email: existingData.hospitalDetail.email || '',
          tel: existingData.hospitalDetail.tel || '',
          kakao_talk: existingData.hospitalDetail.kakao_talk || '',
          line: existingData.hospitalDetail.line || '',
          we_chat: existingData.hospitalDetail.we_chat || '',
          whats_app: existingData.hospitalDetail.whats_app || '',
          telegram: existingData.hospitalDetail.telegram || '',
          facebook_messenger: existingData.hospitalDetail.facebook_messenger || '',
          instagram: existingData.hospitalDetail.instagram || '',
          tiktok: existingData.hospitalDetail.tiktok || '',
          youtube: existingData.hospitalDetail.youtube || '',
          other_channel: existingData.hospitalDetail.other_channel || '',
          sns_content_agreement: existingData.hospitalDetail.sns_content_agreement === null ? null : (existingData.hospitalDetail.sns_content_agreement as 1 | 0),
        });
        console.log('기본 정보 및 SNS 채널 정보 설정 완료');
      }

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

      // 피드백 정보 설정
      if (existingData.feedback) {
        setFeedback(existingData.feedback);
        console.log('피드백 정보 설정 완료:', existingData.feedback);
      }

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
          address_detail: existingData.hospital?.address_detail,
          address_detail_en: existingData.hospital?.address_detail_en,
          directions_to_clinic: existingData.hospital?.directions_to_clinic,
          directions_to_clinic_en: existingData.hospital?.directions_to_clinic_en,
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
          specialist_count:
          formData.facilities.specialist_count,
      });
      console.log('편의시설 설정 완료');

      // 6. 위치 정보 설정
      if (existingData.hospital?.location) {
        try {
            const locKey = existingData.hospital?.location;
            console.log('위치 정보 조회 시작 key :', locKey);
            // if (locKey) {
              // key는 string -> number 변환
              const locationKey = parseInt(locKey, 10);
              const region = findRegionByKey(REGIONS, locationKey);
        
              if (region) {
                setSelectedLocation(region);
                console.log('위치 정보 설정 완료:', region);
              } else {
                console.warn('위치 정보 해당 key에 맞는 REGION을 찾지 못했습니다.', locationKey);
              }
            // }
          } catch (error) {
            console.error('위치 정보 파싱 실패:', existingData.hospital.location, error);
          }
        // try {
        //   const locationData = JSON.parse(
        //     existingData.hospital.location,
        //   );
        //   if (
        //     locationData.key &&
        //     locationData.label &&
        //     locationData.name
        //   ) {
        //     setSelectedLocation(locationData);
        //     console.log(
        //       '위치 정보 설정 완료:',
        //       locationData,
        //     );
        //   }
        // } catch (error) {
        //   console.error(
        //     '위치 정보 파싱 실패:',
        //     existingData.hospital.location,
        //     error,
        //   );
        // }
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
      console.error('기존 데이터 적용 중 오류:', error);
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

  const emptyFormDataSummary: FormDataSummary = {
    basicInfo: {
      name: '',
      email: '',
      tel: '',
      kakao_talk: '',
      line: '',
      we_chat: '',
      whats_app: '',
      telegram: '',
      facebook_messenger: '',
      instagram: '',
      tiktok: '',
      youtube: '',
      other_channel: '',
      sns_content_agreement: null,
    },
    address: {
      road: '',
      jibun: '',
      detail: '',
      detail_en: '',
      directions_to_clinic: '',
      directions_to_clinic_en: '',
      coordinates: '',
    },
    location: '',
    treatments: {
      count: 0,
      items: [],
    },
    treatmentOptions: {
      count: 0,
      items: [],
    },
    treatmentEtc: '',
    openingHours: {
      count: 0,
      items: [],
    },
    extraOptions: {
      facilities: [],
      specialist_count: 0,
    },
    images: {
      clinicImages: 0,
      doctorImages: 0,
      clinicImageUrls: [],
    },
    doctors: undefined,
    availableLanguages: [],
    feedback: '',
  };
  
  // FormData에서 데이터를 요약 정보로 변환하는 함수
  const prepareFormDataSummary = (formData: FormData | null): FormDataSummary => {
    if (!formData) {
      return emptyFormDataSummary;
    }
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
        const department = departmentMap.get(
          option.treatmentKey,
        );

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
          key !== 'specialist_count' && value === true,
      )
      .map(([key]) => {
        switch (key) {
          case HAS_PRIVATE_RECOVERY_ROOM:
            return '전담회복실';
          case HAS_PARKING:
            return '주차가능';
          case HAS_CCTV:
            return 'CCTV';
          case HAS_NIGHT_COUNSELING:
            return '야간상담';
          case HAS_FEMALE_DOCTOR:
            return '여의사진료';
          case HAS_ANESTHESIOLOGIST:
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
      console.error('이미지 URL 파싱 실패:', e);
    }

    return {
      basicInfo: {
        name: basicInfo.name || '',
        email: basicInfo.email || '',
        tel: basicInfo.tel || '',
        kakao_talk: basicInfo.kakao_talk || '',
        line: basicInfo.line || '',
        we_chat: basicInfo.we_chat || '',
        whats_app: basicInfo.whats_app || '',
        telegram: basicInfo.telegram || '',
        facebook_messenger: basicInfo.facebook_messenger || '',
        instagram: basicInfo.instagram || '',
        tiktok: basicInfo.tiktok || '',
        youtube: basicInfo.youtube || '',
        other_channel: basicInfo.other_channel || '',
        sns_content_agreement: basicInfo.sns_content_agreement,
      },
      address: {
        road: addressForSendForm?.address_full_road || '',
        jibun: addressForSendForm?.address_full_jibun || '',
        detail: addressForSendForm?.address_detail || '',
        detail_en: addressForSendForm?.address_detail_en || '',
        directions_to_clinic: addressForSendForm?.directions_to_clinic || '',
        directions_to_clinic_en: addressForSendForm?.directions_to_clinic_en || '',
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
        specialist_count: optionState.specialist_count,
      },
      images: {
        clinicImages: clinicImageCount,
        doctorImages: doctors.length,
        clinicImageUrls: clinicImageUrls,
      },
      doctors: doctors.length > 0
        ? {
            count: doctors.length,
            items: doctors.map((doctor) => ({
              name: doctor.name,
              bio: doctor.bio || '',
              isChief: doctor.isChief ? '대표원장' : '의사',
              hasImage: doctor.useDefaultImage ? '기본 이미지' : '업로드 이미지',
              imageUrl: doctor.useDefaultImage
                ? doctor.defaultImageType === 'woman'
                  ? '/default/doctor_default_woman.png'
                  : '/default/doctor_default_man.png'
                : doctor.imagePreview || undefined, // 업로드된 이미지 미리보기 URL
            })),
          }
        : undefined,
      availableLanguages: selectedLanguages,
      feedback: feedback.trim(),
    };
  };

  const [previewValidationMessages, setPreviewValidationMessages] = useState<string[]>([]);

  const validateFormDataAndUpdateUI = (returnMessage = false) => {
    const clinicNameInput = document.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    const clinicName = clinicNameInput?.value || '';

    const validationResult = validateFormData({
      basicInfo,
      clinicName,
      addressForSendForm,
      selectedLocation,
      selectedTreatments,
      clinicImages,
      existingImageUrls: existingData?.hospital?.imageurls,
      doctors,
    });

    if (!validationResult.isValid && validationResult.messages && validationResult.messages.length > 0) {
      if (!returnMessage) {
        setFormState({
          message: validationResult.messages.join('\n'),
          status: 'error',
          errorType: 'validation',
        });
        setShowFinalResult(true);
      }
      return { isValid: false, messages: validationResult.messages };
    }
    return { isValid: true, messages: [] };
  };



  const handlePreview = async () => {
    // const validationResult = validateFormDataAndUpdateUI(true);

    // if (!validationResult.isValid) {
 
    //   setPreviewValidationMessages(validationResult.messages || []);
    //   setIsSubmitting(false);
    //   setShowConfirmModal(true);
    //   return;
    // }
  
    // setPreviewValidationMessages([]);

    try {
      console.log('handlePreview 3');
      const clinicNameInput = document.querySelector(
        'input[name="name"]',
      ) as HTMLInputElement;
      const clinicName = clinicNameInput?.value || '';
      const existingUrls = existingData?.hospital?.imageurls || [];
      const newImageUrls = clinicImages.map(img => URL.createObjectURL(img));
      const allClinicImageUrls = [...existingUrls, ...newImageUrls];
      const formData = prepareFormData({
        id_uuid: id_uuid_hospital,
        clinicName,
        email: basicInfo.email,
        tel: basicInfo.tel,
        addressForSendForm,
        selectedLocation: selectedLocation?.name || '',
        selectedTreatments,
        treatmentOptions,
        priceExpose,
        treatmentEtc,
        openingHours,
        optionState,
        clinicImageUrls: allClinicImageUrls,
        doctorImageUrls: [],
        doctors,
        feedback,
        selectedLanguages,
        snsData: {
          kakao_talk: basicInfo.kakao_talk,
          line: basicInfo.line,
          we_chat: basicInfo.we_chat,
          whats_app: basicInfo.whats_app,
          telegram: basicInfo.telegram,
          facebook_messenger: basicInfo.facebook_messenger,
          instagram: basicInfo.instagram,
          tiktok: basicInfo.tiktok,
          youtube: basicInfo.youtube,
          other_channel: basicInfo.other_channel,
        }
      });
      setPreparedFormData(formData);
      // setShowConfirmModal(true);

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

  // 최종 제출 함수 (PreviewModal에서 호출)
  const handleFinalSubmit = async () => {
    if (!preparedFormData) return;

    setIsSubmitting(true);

    try {
      console.log('최종 제출 시작...');

      // 편집 모드와 기존 데이터 정보 추가
      preparedFormData.append('is_edit_mode', isEditMode ? 'true' : 'false');
      if (isEditMode && existingData) {
        preparedFormData.append('existing_data', JSON.stringify(existingData));
      }

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

    const handleNext = async () => {
        console.log('handleNext');
        const result = await handleSave();
        console.log('handleNext result', result);
        if (result?.status === 'success') {
            onNext();
        }
    }
 
  const handleSave = async () => {
    console.log('handleSave');
    const clinicNameInput = document.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    const clinicName = clinicNameInput?.value || '';
 

    const formData = new FormData();
    formData.append('current_user_uid', currentUserUid);
     // 기본 정보
  formData.append('id_uuid', id_uuid_hospital);
  formData.append('name', clinicName);
  formData.append('email', basicInfo.email);
  formData.append('tel', basicInfo.tel);

  formData.append(
  'sns_content_agreement',
  basicInfo.sns_content_agreement !== null ? String(basicInfo.sns_content_agreement) : ''
);

  const  snsData = {
    kakao_talk: basicInfo.kakao_talk,
    line: basicInfo.line,
    we_chat: basicInfo.we_chat,
    whats_app: basicInfo.whats_app,
    telegram: basicInfo.telegram,
    facebook_messenger: basicInfo.facebook_messenger,
    instagram: basicInfo.instagram,
    tiktok: basicInfo.tiktok,
    youtube: basicInfo.youtube,
    other_channel: basicInfo.other_channel,
  }
  // SNS 정보
  Object.entries(snsData).forEach(([key, value]) => {
    if (value) {
      formData.append(key, value);
    }
  });

  // 주소 정보
  if (addressForSendForm) {
    formData.append('address', JSON.stringify(addressForSendForm));
  }

  // 위치 정보
  if (selectedLocation) {
    formData.append('location', selectedLocation.key.toString() || '');
  }

    // setPreparedFormData(formData);

    console.log('qqqqqqqqq preparedFormData', preparedFormData);
    console.log('qqqqqqqqq formData', formData);
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

      const result = await uploadActionsStep1(
        null,
        formData,
      );

    //   console.log('uploadActionsStep1 응답:', result);
    //   setFormState(result);
    //   setShowFinalResult(true); // 최종 제출 결과만 얼러트 표시
    if (result?.status === 'error') {
        setFormState({
            message: `uploadActionsStep1 처리 오류: ${result?.message}`,
            status: 'error',
            errorType: 'server',
          });
        setShowFinalResult(true);
      }
    //   setShowConfirmModal(false);
    //   setPreparedFormData(null);
      return {
        status: 'success',
    }
  } catch (error) {
    console.error('uploadActionsStep1 호출 에러:', error);

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
    return {
        status: 'error',
    }
  } finally {
    setIsSubmitting(false);
  }
        return {
            status: 'success',
        }
  };

  return (
    <main>
      {/* <PageHeader name='병원 정보를 입력하세요' onPreview={handlePreview} onSave={handleSave} /> */}
      <div
        className='my-8 mx-auto px-6'
        style={{ width: '100vw', maxWidth: '1024px' }}
      >
        <div className='space-y-4 w-full'>
          <BasicInfoSection
            onInfoChange={setBasicInfo}
            initialInfo={basicInfo}
          />
          <Divider />
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

          <Divider />
          <div className='w-full mt-4'>
          {/* <ExtraOptions
            onSelectOptionState={handleExtraOptionsChange}
            initialOptions={optionState}
          /> */}
        </div>
        <Divider />

      
        </div>
               {/* 하단 고정 버튼 영역 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">

          <Button onClick={handleNext}>Save And Next</Button>
        </div>
      </div>
      </div>
    </main>
  );
};

export default Step1BasicInfo;
