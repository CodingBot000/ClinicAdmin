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

import { uploadActionsStep4 } from './actions/uploadStep4';
import { 
  getLabelByKey, 
  getUnitByKey, 
  getDepartmentByKey,
  getDepartmentDisplayName,
  getDepartmentStyleClass,
  createCategoryLabelMap,
  createCategoryDepartmentMap
} from '@/utils/categoryUtils';
import { TreatmentSelectedOptionInfo } from '@/components/TreatmentSelectedOptionInfo';

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

interface Step4TreatmentsProps {
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

const Step4Treatments = ({
  id_uuid_hospital,
  currentUserUid,
  isEditMode = false,
  onPrev,
  onNext,
}: Step4TreatmentsProps) => {
    console.log('qqqqqqqqq Step4Treatments id_uuid_hospital', id_uuid_hospital);

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

//   // 확인 모달 상태 추가
//   const [showConfirmModal, setShowConfirmModal] =
//     useState(false);
  const [preparedFormData, setPreparedFormData] =
    useState<FormData | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const [basicInfo, setBasicInfo] = useState<BasicInfo>({
//     name: hospitalName,
//     email: '',
//     tel: '',
//     kakao_talk: '',
//     line: '',
//     we_chat: '',
//     whats_app: '',
//     telegram: '',
//     facebook_messenger: '',
//     instagram: '',
//     tiktok: '',
//     youtube: '',
//     other_channel: '',
//     sns_content_agreement: null,
//   });

//   const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

//   const { data: surgeryList = [], isPending } = useQuery<
//     Surgery[]
//   >({
//     queryKey: ['surgery_info'],
//     queryFn: async () => {
//       const queryStartTime = Date.now();
//       // console.log(
//       //   'surgeryList 쿼리 시작:',
//       //   new Date().toISOString(),
//       // );

//       const { data, error } = await supabase
//         .from('surgery_info')
//         .select('*');

//       const queryEndTime = Date.now();
//       const queryTime = queryEndTime - queryStartTime;
//       // console.log(`surgeryList 쿼리 완료: ${queryTime}ms`, {
//       //   dataLength: data?.length || 0,
//       //   error: error?.message || null,
//       // });

//       if (error) throw Error('surgery_info error');
//       return data;
//     },
//   });

  const { handleOpenModal, open } = useModal();

  useEffect(() => {
    if (formState?.message && showFinalResult) {
      handleOpenModal();
    }
  }, [formState, showFinalResult]);

  // 페이지 로딩 완료 시간 측정
//   useEffect(() => {
    // if (!categoriesLoading && !isPending && categories) {
    //   const pageEndTime = Date.now();
    //   const totalLoadTime = pageEndTime - pageStartTime;
      // console.log(
      //   'UploadClient 페이지 로딩 완료:',
      //   new Date().toISOString(),
      // );
      // console.log(
      //   `총 페이지 로딩 시간: ${totalLoadTime}ms (${(totalLoadTime / 1000).toFixed(2)}초)`,
      // );
      // console.log('로딩 완료 상태:', {
      //   categoriesCount: categories?.length || 0,
      //   surgeryListCount: surgeryList?.length || 0,
      //   categoriesLoading,
      //   isPending,
      // });
    // }
//   }, [
//     categoriesLoading,
//     isPending,
//     categories,
    // surgeryList,
    // pageStartTime,
//   ]);

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
//   useEffect(() => {
//     if (existingData && !basicInfo.name) {
//       // 한 번만 실행되도록 조건 추가
//       console.log('기존 데이터 상태 반영 시작');
//       console.log('sns_content_agreement 값:', existingData.hospitalDetail?.sns_content_agreement);
//       const formData = mapExistingDataToFormValues(existingData);

//       // SNS 채널 정보와 기본 정보 설정
//       if (existingData.hospitalDetail) {
//         setBasicInfo({
//           name: formData.hospital.name || '',
//           email: existingData.hospitalDetail.email || '',
//           tel: existingData.hospitalDetail.tel || '',
//           kakao_talk: existingData.hospitalDetail.kakao_talk || '',
//           line: existingData.hospitalDetail.line || '',
//           we_chat: existingData.hospitalDetail.we_chat || '',
//           whats_app: existingData.hospitalDetail.whats_app || '',
//           telegram: existingData.hospitalDetail.telegram || '',
//           facebook_messenger: existingData.hospitalDetail.facebook_messenger || '',
//           instagram: existingData.hospitalDetail.instagram || '',
//           tiktok: existingData.hospitalDetail.tiktok || '',
//           youtube: existingData.hospitalDetail.youtube || '',
//           other_channel: existingData.hospitalDetail.other_channel || '',
//           sns_content_agreement: existingData.hospitalDetail.sns_content_agreement === null ? null : (existingData.hospitalDetail.sns_content_agreement as 1 | 0),
//         });
//         console.log('기본 정보 및 SNS 채널 정보 설정 완료');
//       }

//       console.log('UploadClient 상태 업데이트 완료:', {
//         hospitalName: formData.hospital.name,
//         hasAddress: !!formData.address.roadAddress,
//         doctorsCount: formData.doctors.length,
//         sns_content_agreement: existingData.hospitalDetail?.sns_content_agreement
//       });

//       // 피드백 정보 설정
//       if (existingData.feedback) {
//         setFeedback(existingData.feedback);
//         console.log('피드백 정보 설정 완료:', existingData.feedback);
//       }
//     }
//   }, [existingData]);

//   // hospitalName 상태를 basicInfo.name과 동기화
//   useEffect(() => {
//     setHospitalName(basicInfo.name);
//   }, [basicInfo.name]);

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



  const handleTreatmentSelectionChange = (data: {
    selectedKeys: number[];
    productOptions: any[];
    priceExpose: boolean;
    etc: string;
    selectedDepartment?: 'skin' | 'surgery';
  }) => {
    console.log('Step4Treatments - 시술 데이터 업데이트:', {
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

    console.log('Step4Treatments - 상태 업데이트 완료:', {
      selectedTreatments: data.selectedKeys,
      treatmentOptions: data.productOptions,
      priceExpose: data.priceExpose,
      treatmentEtc: data.etc,
    });
  };

//   // 부가시설 옵션 변경 처리하는 함수
//   const handleExtraOptionsChange = (
//     data: ExtraOptionState,
//   ) => {
//     console.log(
//       'UploadClient - 부가시설 옵션 업데이트:',
//       data,
//     );
//     setOptionState(data);
//   };

//   const emptyFormDataSummary: FormDataSummary = {
//     basicInfo: {
//       name: '',
//       email: '',
//       tel: '',
//       kakao_talk: '',
//       line: '',
//       we_chat: '',
//       whats_app: '',
//       telegram: '',
//       facebook_messenger: '',
//       instagram: '',
//       tiktok: '',
//       youtube: '',
//       other_channel: '',
//       sns_content_agreement: null,
//     },
//     address: {
//       road: '',
//       jibun: '',
//       detail: '',
//       detail_en: '',
//       directions_to_clinic: '',
//       directions_to_clinic_en: '',
//       coordinates: '',
//     },
//     location: '',
//     treatments: {
//       count: 0,
//       items: [],
//     },
//     treatmentOptions: {
//       count: 0,
//       items: [],
//     },
//     treatmentEtc: '',
//     openingHours: {
//       count: 0,
//       items: [],
//     },
//     extraOptions: {
//       facilities: [],
//       specialist_count: 0,
//     },
//     images: {
//       clinicImages: 0,
//       doctorImages: 0,
//       clinicImageUrls: [],
//     },
//     doctors: undefined,
//     availableLanguages: [],
//     feedback: '',
//   };
  
//   // FormData에서 데이터를 요약 정보로 변환하는 함수
//   const prepareFormDataSummary = (formData: FormData | null): FormDataSummary => {
//     if (!formData) {
//       return emptyFormDataSummary;
//     }
//     // 시술 이름 매핑 생성 - 중첩된 구조를 재귀적으로 탐색
//     const treatmentMap = new Map<number, string>();
//     const departmentMap = new Map<number, string>(); // department 매핑 추가

//     const flattenCategories = (nodes: CategoryNode[]) => {
//       nodes.forEach((node) => {
//         // key가 -1이 아닌 것만 매핑 (실제 시술)
//         if (node.key !== -1) {
//           treatmentMap.set(node.key, node.label);
//           // department 정보도 매핑
//           if (node.department) {
//             departmentMap.set(node.key, node.department);
//           }
//         }
//         if (node.children) {
//           flattenCategories(node.children);
//         }
//       });
//     };

//     if (categories) {
//       flattenCategories(categories);
//     }

//     const getStatusText = (openingHour: OpeningHour) => {
//       if (openingHour.open) return '영업';
//       if (openingHour.closed) return '휴무';
//       if (openingHour.ask) return '진료시간 문의 필요';
//       return '미설정';
//     };

//     const formatTime = (hour: number, minute: number) => {
//       if (hour === 0 && minute === 0) return '00:00';
//       return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
//     };

//     // 영업시간 요약
//     const openingHoursSummary = openingHours.map(
//       (hour) => ({
//         day: hour.day,
//         status: getStatusText(hour),
//         time: hour.open
//           ? `${formatTime(hour.from.hour, hour.from.minute)} - ${formatTime(hour.to.hour, hour.to.minute)}`
//           : '',
//       }),
//     );

//     // 선택된 시술 이름들 가져오기
//     const selectedTreatmentNames = selectedTreatments.map(
//       (id) => {
//         const name = treatmentMap.get(id);
//         const department = departmentMap.get(id);
//         return {
//           name: name || `알 수 없는 시술 (ID: ${id})`,
//           department: department || null,
//         };
//       },
//     );

//     // 좌표 정보 문자열로 변환
//     const coordinatesText = coordinates
//       ? `위도: ${coordinates.latitude}, 경도: ${coordinates.longitude}`
//       : '설정되지 않음';

//     // 치료옵션 요약 - 실제 데이터 구조에 맞게 수정
//     const treatmentOptionsSummary = treatmentOptions.map(
//       (option) => {
//         // 시술 이름 찾기
//         const treatmentName =
//           treatmentMap.get(option.treatmentKey) ||
//           `시술 ${option.treatmentKey}`;

//         // department 정보 찾기
//         const department = departmentMap.get(
//           option.treatmentKey,
//         );

//         // 옵션명 생성
//         const optionName =
//           option.value1 && Number(option.value1) >= 1
//             ? `[${treatmentName}] ${option.value1}`
//             : `[${treatmentName}] 옵션없음`;

//         return {
//           treatmentKey: option.treatmentKey,
//           optionName: optionName,
//           price: Number(option.value2) || 0,
//           department: department || null,
//         };
//       },
//     );

//     // 부가옵션 요약 - 배열 형태로 변환
//     const facilities = Object.entries(optionState)
//       .filter(
//         ([key, value]) =>
//           key !== 'specialist_count' && value === true,
//       )
//       .map(([key]) => {
//         switch (key) {
//           case HAS_PRIVATE_RECOVERY_ROOM:
//             return '전담회복실';
//           case HAS_PARKING:
//             return '주차가능';
//           case HAS_CCTV:
//             return 'CCTV';
//           case HAS_NIGHT_COUNSELING:
//             return '야간상담';
//           case HAS_FEMALE_DOCTOR:
//             return '여의사진료';
//           case HAS_ANESTHESIOLOGIST:
//             return '마취전문의';
//           default:
//             return key;
//         }
//       });

//     // 이미지 URL 개수 계산
//     let clinicImageCount = 0;
//     let clinicImageUrls: string[] = [];

//     try {
//       const clinicUrls = formData.get(
//         'clinic_image_urls',
//       ) as string;

//       if (clinicUrls) {
//         const parsedClinicUrls = JSON.parse(clinicUrls);
//         if (Array.isArray(parsedClinicUrls)) {
//           clinicImageCount = parsedClinicUrls.length;
//           clinicImageUrls = parsedClinicUrls;
//         }
//       }
//     } catch (e) {
//       console.error('이미지 URL 파싱 실패:', e);
//     }

//     return {
//       basicInfo: {
//         name: basicInfo.name || '',
//         email: basicInfo.email || '',
//         tel: basicInfo.tel || '',
//         kakao_talk: basicInfo.kakao_talk || '',
//         line: basicInfo.line || '',
//         we_chat: basicInfo.we_chat || '',
//         whats_app: basicInfo.whats_app || '',
//         telegram: basicInfo.telegram || '',
//         facebook_messenger: basicInfo.facebook_messenger || '',
//         instagram: basicInfo.instagram || '',
//         tiktok: basicInfo.tiktok || '',
//         youtube: basicInfo.youtube || '',
//         other_channel: basicInfo.other_channel || '',
//         sns_content_agreement: basicInfo.sns_content_agreement,
//       },
//       address: {
//         road: addressForSendForm?.address_full_road || '',
//         jibun: addressForSendForm?.address_full_jibun || '',
//         detail: addressForSendForm?.address_detail || '',
//         detail_en: addressForSendForm?.address_detail_en || '',
//         directions_to_clinic: addressForSendForm?.directions_to_clinic || '',
//         directions_to_clinic_en: addressForSendForm?.directions_to_clinic_en || '',
//         coordinates: coordinatesText,
//       },
//       location: selectedLocation?.label || '선택되지 않음',
//       treatments: {
//         count: selectedTreatments.length,
//         items: selectedTreatmentNames,
//       },
//       treatmentOptions: {
//         count: treatmentOptionsSummary.length,
//         items: treatmentOptionsSummary,
//       },
//       treatmentEtc: treatmentEtc.trim(),
//       openingHours: {
//         count: openingHours.length,
//         items: openingHoursSummary,
//       },
//       extraOptions: {
//         facilities,
//         specialist_count: optionState.specialist_count,
//       },
//       images: {
//         clinicImages: clinicImageCount,
//         doctorImages: doctors.length,
//         clinicImageUrls: clinicImageUrls,
//       },
//       doctors: doctors.length > 0
//         ? {
//             count: doctors.length,
//             items: doctors.map((doctor) => ({
//               name: doctor.name,
//               bio: doctor.bio || '',
//               isChief: doctor.isChief ? '대표원장' : '의사',
//               hasImage: doctor.useDefaultImage ? '기본 이미지' : '업로드 이미지',
//               imageUrl: doctor.useDefaultImage
//                 ? doctor.defaultImageType === 'woman'
//                   ? '/default/doctor_default_woman.png'
//                   : '/default/doctor_default_man.png'
//                 : doctor.imagePreview || undefined, // 업로드된 이미지 미리보기 URL
//             })),
//           }
//         : undefined,
//       availableLanguages: selectedLanguages,
//       feedback: feedback.trim(),
//     };
//   };

//   const [previewValidationMessages, setPreviewValidationMessages] = useState<string[]>([]);

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
//   const handlePreview = async () => {
//     // const validationResult = validateFormDataAndUpdateUI(true);

//     // if (!validationResult.isValid) {
 
//     //   setPreviewValidationMessages(validationResult.messages || []);
//     //   setIsSubmitting(false);
//     //   setShowConfirmModal(true);
//     //   return;
//     // }
  
//     // setPreviewValidationMessages([]);

//     try {
//       console.log('handlePreview 3');
//       const clinicNameInput = document.querySelector(
//         'input[name="name"]',
//       ) as HTMLInputElement;
//       const clinicName = clinicNameInput?.value || '';
//       const existingUrls = existingData?.hospital.imageurls || [];
//       const newImageUrls = clinicImages.map(img => URL.createObjectURL(img));
//       const allClinicImageUrls = [...existingUrls, ...newImageUrls];
//       const formData = prepareFormData({
//         id_uuid: id_uuid_generate,
//         clinicName,
//         email: basicInfo.email,
//         tel: basicInfo.tel,
//         addressForSendForm,
//         selectedLocation: selectedLocation?.name || '',
//         selectedTreatments,
//         treatmentOptions,
//         priceExpose,
//         treatmentEtc,
//         openingHours,
//         optionState,
//         clinicImageUrls: allClinicImageUrls,
//         doctorImageUrls: [],
//         doctors,
//         feedback,
//         selectedLanguages,
//         snsData: {
//           kakao_talk: basicInfo.kakao_talk,
//           line: basicInfo.line,
//           we_chat: basicInfo.we_chat,
//           whats_app: basicInfo.whats_app,
//           telegram: basicInfo.telegram,
//           facebook_messenger: basicInfo.facebook_messenger,
//           instagram: basicInfo.instagram,
//           tiktok: basicInfo.tiktok,
//           youtube: basicInfo.youtube,
//           other_channel: basicInfo.other_channel,
//         }
//       });
//       setPreparedFormData(formData);
//       // setShowConfirmModal(true);

//       const validationResult = validateFormDataAndUpdateUI(true);
//       if (!validationResult.isValid) {
//         setPreviewValidationMessages(validationResult.messages || []);
//         setIsSubmitting(false);
//         setShowConfirmModal(true);
//         return;
//       }
    
//       setPreviewValidationMessages([]);
//     } catch (error) {
//       console.error('미리보기 데이터 준비 중 오류:', error);
//       setFormState({
//         message: '미리보기 데이터 준비 중 오류가 발생했습니다.',
//         status: 'error',
//         errorType: 'server',
//       });
//       setShowFinalResult(true);
//     }
//   };

//   // 최종 제출 함수 (PreviewModal에서 호출)
//   const handleFinalSubmit = async () => {
//     if (!preparedFormData) return;

//     setIsSubmitting(true);

//     try {
//       console.log('최종 제출 시작...');

//       // 편집 모드와 기존 데이터 정보 추가
//       preparedFormData.append('is_edit_mode', isEditMode ? 'true' : 'false');
//       if (isEditMode && existingData) {
//         preparedFormData.append('existing_data', JSON.stringify(existingData));
//       }

//       // FormData 크기 측정 함수
//       const calculateFormDataSize = (
//         formData: FormData,
//       ) => {
//         let totalSize = 0;
//         let textDataSize = 0;
//         const details: any[] = [];

//         for (const [key, value] of formData.entries()) {
//           // 모든 데이터가 텍스트 데이터 (이미지는 URL 문자열)
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

//       // 키에 따른 카테고리 분류 함수
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

//       // FormData 크기 분석
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

//       // 카테고리별로 그룹화
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

//       // 1MB 제한과 비교 (이제는 통과할 것)
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

//       // FormData 내용을 간단히 로그로 출력
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

//       // 직접 uploadActions 호출
//       const result = await uploadActions(
//         null,
//         preparedFormData,
//       );

//       console.log('uploadActions 응답:', result);
//       setFormState(result);
//       setShowFinalResult(true); // 최종 제출 결과만 얼러트 표시

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
//       setShowFinalResult(true); // 에러도 최종 결과로 표시
//       setShowConfirmModal(false);
//       setPreparedFormData(null);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // 모달 취소 처리
//   const handleModalCancel = () => {
//     setShowConfirmModal(false);
//     setPreparedFormData(null);
//   };

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

  if (
    // isPending ||
    categoriesLoading ||
    isLoadingExistingData
  )
    return <LoadingSpinner backdrop />;


const handleNext = async () => {
    console.log('handleNext');
    const result = await handleSave();
    if (result?.status === 'success') {
        console.log('handleNext Step4 handlSave success');
        onNext();
    } else {
        console.log('handleNext Step4 handlSave what? :', result);
    }
  };

 
  const handleSave = async () => {
    console.log('handleSave');
    
    const formData = new FormData();
    formData.append('id_uuid_hospital', id_uuid_hospital);
    formData.append('current_user_uid', currentUserUid);
    formData.append('is_edit_mode', isEditMode.toString());
    
    // 시술 정보 - 서버에서 selected_treatments로 받으므로 키 이름 맞춤
    if (selectedTreatments.length > 0) {
      formData.append('selected_treatments', selectedTreatments.join(','));
    }

    // 시술 옵션
    if (treatmentOptions.length > 0) {
      formData.append('treatment_options', JSON.stringify(treatmentOptions));
    }

    // 가격 노출 설정
    formData.append('price_expose', priceExpose ? 'true' : 'false');
    
    // 기타 시술 정보 추가
    if (treatmentEtc.trim() !== '') {
      formData.append('etc', treatmentEtc.trim());
    }

    console.log('FormData 내용:', {
      id_uuid_hospital,
      selectedTreatments,
      treatmentOptions,
      priceExpose,
      treatmentEtc
    });

    try {
      const result = await uploadActionsStep4(
        null,
        formData,
      );

      console.log('uploadActionsStep4 응답:', result);
      
      if (result?.status === 'error') {
        setFormState({
          message: `시술 정보 저장 오류: ${result?.message}`,
          status: 'error',
          errorType: 'server',
        });
        setShowFinalResult(true);
        return {
          status: 'error',
        };
      }
      
      setFormState({
        message: '시술 정보가 성공적으로 저장되었습니다.',
        status: 'success',
      });
      
      return {
        status: 'success',
      };
      
    } catch (error) {
      console.error('uploadActionsStep4 호출 에러:', error);

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
      
      return {
        status: 'error',
      };
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* 컨텐츠 영역 */}
      <div className="flex-1 my-8 mx-auto px-6 pb-24" style={{ width: '100vw', maxWidth: '1024px' }}>
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
        
        {/* 저장 상태 표시 */}
        <div className='mt-4 pt-3 border-t border-gray-300'>
          <p className='text-xs text-gray-500'>
            *주의* 💾 저장 버튼을 눌러야만 정보가 데이터베이스에 저장됩니다. \n나중에 다시 수정하더라도 꼭 저장 버튼을 눌러주세요.\n저장버튼을 누르지않고 새로고침하거나 뒤로가거나 창을 나가면 입력/편집한 정보가 소실됩니다.
          </p>
        </div>
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
};

export default Step4Treatments;
