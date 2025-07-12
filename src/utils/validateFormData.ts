import { DoctorInfo } from "@/components/DoctorInfoForm";
import { HospitalAddress } from "@/types/address";
import { BasicInfo } from "@/types/basicinfo";

export interface ValidationResult {
  isValid: boolean;
  messages?: string[];
}

interface ValidateFormDataProps {
  basicInfo: BasicInfo;
  clinicName: string;
  addressForSendForm: HospitalAddress | null;
  selectedLocation: { key: number; label: string; name: string } | null;
  selectedTreatments: number[];
  clinicImages: File[];
  existingImageUrls?: string[];
  doctors: DoctorInfo[];
}


export const validateFormData = ({
  basicInfo,
  clinicName,
  addressForSendForm,
  selectedLocation,
  selectedTreatments,
  clinicImages,
  existingImageUrls = [],
  doctors,
}: ValidateFormDataProps): ValidationResult => {

  var messages: string[] = [];

  if (basicInfo.name === '') {
    messages.push('병원명을 입력해주세요.');
  }

  if (basicInfo.email === '') {
    messages.push('이메일을 입력해주세요.');
  }

  if (basicInfo.tel === '') {
    messages.push('전화번호를 입력해주세요.');
  }

  // SNS 컨텐츠 이용 동의 검증
  if (basicInfo.sns_content_agreement === null) {
    messages.push('SNS 홍보 채널의 컨텐츠 이용 동의 여부를 선택해주세요.');
  }
  
  // 1. 병원명 검증 (필수)
  if (!clinicName || clinicName.trim() === '') {
    messages.push('병원명을 입력해주세요.');
  }
  
  // 2. 주소 검증 (필수)
  if (!addressForSendForm || !addressForSendForm.address_full_road) {
    messages.push('주소를 선택해주세요.');
  }
  
  // 3. 지역 검증 (필수)
  if (!selectedLocation) {
    messages.push('지역을 선택해주세요.');
  }
  
  // 4. 시술 선택 검증 (필수)
  if (selectedTreatments.length === 0) {
    messages.push('가능시술을 최소 1개 이상 선택해주세요.');
  }
  
  // 5. 병원 이미지 검증 (필수) - 편집 모드에서는 기존 이미지도 고려
  const totalImageCount = clinicImages.length + existingImageUrls.length;
  if (totalImageCount < 3) {
    messages.push('병원 이미지를 3장 이상 등록해주세요.');
  }
  
  // 6. 의사 정보 검증
  if (doctors.length < 1) {
    messages.push('의사 정보를 최소 1개 이상 입력해주세요.');
  }
  
  // 대표원장 체크 검증
  const hasChiefDoctor = doctors.some(doctor => doctor.isChief);
  if (!hasChiefDoctor) {
    messages.push('대표 원장을 한명 이상 체크해주세요.');
  }
  
  // 의사별 상세 정보 검증
  for (const doctor of doctors) {
    if (!doctor.name || doctor.name.trim() === '') {
      messages.push('의사 이름을 입력해주세요.');
    }
  
    if (!doctor.useDefaultImage && !doctor.imageFile && !doctor.imagePreview) {
      messages.push(`${doctor.name || '의사'} 의사의 이미지를 업로드하거나 기본 이미지를 선택해주세요.`);
    }
  }
  
  return {
    isValid: messages.length === 0,
    messages: messages,
  };
  // 모든 검증 통과
  return {
    isValid: true
  };
}; 

// export const validateFormData = ({
//   basicInfo,
//   clinicName,
//   addressForSendForm,
//   selectedLocation,
//   selectedTreatments,
//   clinicImages,
//   existingImageUrls = [],
//   doctors,
// }: ValidateFormDataProps): ValidationResult => {
//   // SNS 컨텐츠 이용 동의 검증
//   if (basicInfo.sns_content_agreement === null) {
//     return {
//       isValid: false,
//       message: 'SNS 홍보 채널의 컨텐츠 이용 동의 여부를 선택해주세요.',
//     };
//   }

//   // 1. 병원명 검증 (필수)
//   if (!clinicName || clinicName.trim() === '') {
//     return {
//       isValid: false,
//       message: '병원명을 입력해주세요.',
//     };
//   }

//   // 2. 주소 검증 (필수)
//   if (!addressForSendForm || !addressForSendForm.address_full_road) {
//     return {
//       isValid: false,
//       message: '주소를 선택해주세요.',
//     };
//   }

//   // 3. 지역 검증 (필수)
//   if (!selectedLocation) {
//     return {
//       isValid: false,
//       message: '지역을 선택해주세요.',
//     };
//   }

//   // 4. 시술 선택 검증 (필수)
//   if (selectedTreatments.length === 0) {
//     return {
//       isValid: false,
//       message: '가능시술을 최소 1개 이상 선택해주세요.',
//     };
//   }

//   // 5. 병원 이미지 검증 (필수) - 편집 모드에서는 기존 이미지도 고려
//   const totalImageCount = clinicImages.length + existingImageUrls.length;
//   if (totalImageCount < 3) {
//     return {
//       isValid: false,
//       message: '병원 이미지를 3장 이상 등록해주세요.',
//     };
//   }

//   // 6. 의사 정보 검증
//   if (doctors.length < 1) {
//     return {
//       isValid: false,
//       message: '의사 정보를 최소 1개이상 입력해주세요.',
//     };
//   }

//   // 대표원장 체크 검증
//   const hasChiefDoctor = doctors.some(doctor => doctor.isChief);
//   if (!hasChiefDoctor) {
//     return {
//       isValid: false,
//       message: '대표 원장을 한명 이상 체크해주세요.',
//     };
//   }

//   // 의사별 상세 정보 검증
//   for (const doctor of doctors) {
//     if (!doctor.name || doctor.name.trim() === '') {
//       return {
//         isValid: false,
//         message: '의사 이름을 입력해주세요.',
//       };
//     }

//     // 이미지가 없고 기본 이미지도 선택하지 않은 경우
//     if (!doctor.useDefaultImage && !doctor.imageFile && !doctor.imagePreview) {
//       return {
//         isValid: false,
//         message: `${doctor.name} 의사의 이미지를 업로드하거나 기본 이미지를 선택해주세요.`,
//       };
//     }
//   }

//   // 모든 검증 통과
//   return {
//     isValid: true
//   };
// }; 