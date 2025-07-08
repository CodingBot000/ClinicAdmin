import { ExistingHospitalData } from '@/types/hospital';
import { DoctorInfo } from '@/components/DoctorInfoForm';

/**
 * 이미지 URL 데이터를 안전하게 처리 (배열과 문자열 모두 대응)
 */
function getImageUrlFromData(imageData: any): string {
  if (!imageData) return '';
  
  // 문자열인 경우
  if (typeof imageData === 'string') {
    return imageData;
  }
  
  // 배열인 경우 (기존 데이터)
  if (Array.isArray(imageData) && imageData.length > 0) {
    return imageData[0];
  }
  
  return '';
}

/**
 * 영업시간 데이터를 OpeningHoursForm 형식으로 변환
 */
// ✅ 함수 밖에 상수 선언
export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export const DEFAULT_BUSINESS_HOURS = DAYS.map(day => ({
  day,
  from: { hour: 10, minute: 0 },
  to: { hour: 19, minute: 0 },
  open: day !== 'SUN',
  closed: day === 'SUN',
  ask: false,
}));

// ✅ 안전한 복사본 + 조기 return 구조
export function mapBusinessHoursToForm(businessHours: any[] | null | undefined) {
  console.log(
    'mapBusinessHoursToForm 시작 - 입력 데이터:',
    JSON.stringify(businessHours, null, 2)
  );

  // ✅ 항상 새로운 복사본 사용 (깊은 복사)
  const result = DEFAULT_BUSINESS_HOURS.map(d => ({
    day: d.day,
    from: { ...d.from },
    to: { ...d.to },
    open: d.open,
    closed: d.closed,
    ask: d.ask,
  }));

  console.log('기본값 복제 완료:', result);

  // ✅ 데이터 없으면 기본값만 반환
  if (!Array.isArray(businessHours) || businessHours.length === 0) {
    console.log('영업시간 데이터 없음 — 기본값 반환');
    return result;
  }

  // ✅ DB 데이터 덮어쓰기
  businessHours.forEach((hour, index) => {
    console.log(`처리 중인 영업시간 [${index}]:`, {
      day_of_week: hour.day_of_week,
      open_time: hour.open_time,
      close_time: hour.close_time,
      status: hour.status,
    });

    const dayIndex = DAYS.indexOf(hour.day_of_week);
    if (dayIndex === -1) {
      console.warn(`인덱스를 찾을 수 없는 요일: ${hour.day_of_week}`);
      return;
    }

    // ✅ 시간 파싱 헬퍼
    const parseTime = (timeString: string) => {
      if (!timeString) return { hour: 0, minute: 0 };
      const [hourStr, minuteStr] = timeString.split(':');
      return {
        hour: parseInt(hourStr, 10) || 0,
        minute: parseInt(minuteStr, 10) || 0,
      };
    };

    const newHourData = {
      day: hour.day_of_week,
      from: parseTime(hour.open_time),
      to: parseTime(hour.close_time),
      open: hour.status === 'open',
      closed: hour.status === 'closed',
      ask: hour.status === 'ask',
    };

    console.log(`요일 ${hour.day_of_week} (인덱스 ${dayIndex}) 업데이트:`, newHourData);
    result[dayIndex] = newHourData;
  });

  console.log(
    'mapBusinessHoursToForm 완료 - 최종 결과:',
    JSON.stringify(result, null, 2)
  );

  return result;
}
// export function mapBusinessHoursToForm(businessHours: any[]) {
//   console.log('mapBusinessHoursToForm 시작 - 입력 데이터:', JSON.stringify(businessHours, null, 2));
  
//   // OpeningHoursForm에서 사용하는 요일 형식
//   const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

//   // 기본값으로 모든 요일 초기화
//   const result = days.map(day => ({
//     day,
//     from: { hour: 10, minute: 0 },
//     to: { hour: 19, minute: 0 },
//     open: day !== 'SUN',
//     closed: day === 'SUN',
//     ask: false,
//   }));
  
//   console.log('기본값 초기화 완료:', result);

//   // DB 데이터로 덮어쓰기
//   businessHours.forEach((hour, index) => {
//     console.log(`처리 중인 영업시간 [${index}]:`, {
//       day_of_week: hour.day_of_week,
//       open_time: hour.open_time,
//       close_time: hour.close_time,
//       status: hour.status
//     });
    
//     const dayIndex = days.indexOf(hour.day_of_week);
//     if (dayIndex === -1) {
//       console.warn(`인덱스를 찾을 수 없는 요일: ${hour.day_of_week}`);
//       return;
//     }

//     // 시간 문자열을 시:분으로 파싱
//     const parseTime = (timeString: string) => {
//       if (!timeString) return { hour: 0, minute: 0 };
//       const [hourStr, minuteStr] = timeString.split(':');
//       return {
//         hour: parseInt(hourStr, 10) || 0,
//         minute: parseInt(minuteStr, 10) || 0
//       };
//     };

//     const newHourData = {
//       day: hour.day_of_week,
//       from: parseTime(hour.open_time),
//       to: parseTime(hour.close_time),
//       open: hour.status === 'open',
//       closed: hour.status === 'closed',
//       ask: hour.status === 'ask',
//     };
    
//     console.log(`요일 ${hour.day_of_week} (인덱스 ${dayIndex}) 업데이트:`, newHourData);
//     result[dayIndex] = newHourData;
//   });

//   console.log('mapBusinessHoursToForm 완료 - 최종 결과:', JSON.stringify(result, null, 2));
//   return result;
// }

/**
 * 의사 데이터를 폼 형식으로 변환
 */
export function mapDoctorsToForm(doctors: any[]): DoctorInfo[] {
  if (!Array.isArray(doctors) || doctors.length === 0) {
    return [];
  }
  return doctors.map((doctor) => ({
    id: doctor.id_uuid || '',
    name: doctor.name || '',
    bio: doctor.bio || '',
    imagePreview: getImageUrlFromData(doctor.image_url), // 이미지 URL 안전 처리
    useDefaultImage: false,
    isChief: doctor.chief === 1,
    isExistingImage: true,
    originalImageUrl: doctor.image_url
  }));
}

/**
 * 시술 데이터를 TreatmentSelectBox 형식으로 변환
 */
export function mapTreatmentsToForm(treatments: any[] | null | undefined) {
  console.log('mapTreatmentsToForm 시작 - 입력 데이터:', treatments);

  if (!Array.isArray(treatments) || treatments.length === 0) {
    const emptyResult = {
      selectedKeys: [],
      productOptions: [],
      priceExpose: false, 
      etc: ''
    };
    console.log('시술 데이터 없음 — 빈 결과 반환:', emptyResult);
    return emptyResult;
  }
  
  // 중복되지 않는 selectedKeys 추출 (treatment code들)
  const selectedKeysSet = new Set<number>();
  const productOptions: any[] = [];
  
  treatments.forEach((treatment, index) => {
    console.log(`처리 중인 시술 [${index}]:`, {
      id_uuid_treatment: treatment.id_uuid_treatment,
      option_value: treatment.option_value,
      price: treatment.price,
      price_expose: treatment.price_expose,
      etc: treatment.etc,
      treatment_info: treatment.treatment
    });
    
    // treatment 테이블에서 가져온 code 사용
    const treatmentCode = treatment.treatment?.code;
    if (treatmentCode) {
      selectedKeysSet.add(Number(treatmentCode));
      
      // 상품옵션 생성
      const productOption = {
        id: `${treatment.id_uuid_treatment}_${index}`,
        treatmentKey: Number(treatmentCode),
        value1: treatment.option_value || '',
        value2: Number(treatment.price) || 0
      };
      
      productOptions.push(productOption);
      console.log(`시술 코드 ${treatmentCode} 추가:`, productOption);
    } else {
      console.warn(`시술 코드를 찾을 수 없음:`, treatment);
    }
  });
  
  const result = {
    selectedKeys: Array.from(selectedKeysSet),
    productOptions: productOptions,
    priceExpose: treatments.length > 0 ? Boolean(treatments[0].price_expose) : true,
    etc: treatments.find(t => t.etc)?.etc || ''
  };
  
  console.log('mapTreatmentsToForm 완료 - 결과:', result);
  return result;
}

/**
 * 주소 데이터를 폼 형식으로 변환
 */
export function mapAddressToForm(hospital: any | null | undefined) {
  if (!hospital) {
    return {
      roadAddress: '',
      jibunAddress: '',
      zonecode: '',
      buildingName: '',
      sido: '',
      sigungu: '',
      bname: '',
      detailAddress: '',
      detailAddressEn: '',
      extraAddress: '',
      coordinates: {
        lat: 0,
        lng: 0
      }
    };
  }

  return {
    roadAddress: hospital.address_full_road || '',
    jibunAddress: hospital.address_full_jibun || '',
    zonecode: hospital.zipcode || '',
    buildingName: '',
    sido: hospital.address_si || '',
    sigungu: hospital.address_gu || '',
    bname: hospital.address_dong || '',
    detailAddress: hospital.address_detail || '',
    detailAddressEn: hospital.address_detail_en || '',
    extraAddress: '',
    coordinates: {
      lat: hospital.latitude || 0,
      lng: hospital.longitude || 0
    }
  };
}

/**
 * 편의시설 데이터를 폼 형식으로 변환
 */
export function mapFacilitiesToForm(hospitalDetail: any | null | undefined) {
  if (!hospitalDetail) {
    return {
      has_private_recovery_room: false,
      has_parking: false,
      has_cctv: false,
      has_night_counseling: false,
      has_female_doctor: false,
      has_anesthesiologist: false,
      specialist_count: 0
    };
  }

  return {
    has_private_recovery_room: hospitalDetail.has_private_recovery_room || false,
    has_parking: hospitalDetail.has_parking || false,
    has_cctv: hospitalDetail.has_cctv || false,
    has_night_counseling: hospitalDetail.has_night_counseling || false,
    has_female_doctor: hospitalDetail.has_female_doctor || false,
    has_anesthesiologist: hospitalDetail.has_anesthesiologist || false,
    specialist_count: hospitalDetail.specialist_count || 0
  };
}

/**
 * 모든 데이터를 통합해서 폼 초기값으로 변환
 */
export function mapExistingDataToFormValues(data: ExistingHospitalData) {
  console.log(' 기존 데이터를 폼 형식으로 변환 시작');
  
  const mapped = {
    // 병원 기본 정보
    hospital: {
      name: data.hospital?.name || '',
      directions: data.hospital?.directions_to_clinic || '',
      location: data.hospital?.location || '',
      images: data.hospital?.imageurls || [],
      kakao_talk: data.hospitalDetail?.kakao_talk || '',
      line: data.hospitalDetail?.line || '',
      we_chat: data.hospitalDetail?.we_chat || '',
      whats_app: data.hospitalDetail?.whats_app || '',
      telegram: data.hospitalDetail?.telegram || '',
      facebook_messenger: data.hospitalDetail?.facebook_messenger || '',
      instagram: data.hospitalDetail?.instagram || '',
      tiktok: data.hospitalDetail?.tiktok || '',
      youtube: data.hospitalDetail?.youtube || '',
      other_channel: data.hospitalDetail?.other_channel || '',
    
    },
    
    // 주소 정보
    address: mapAddressToForm(data.hospital),
    
    // 병원 상세 정보
    hospitalDetail: {
      tel: data.hospitalDetail?.tel || '',
      email: data.hospitalDetail?.email || '',
      map: data.hospitalDetail?.map || '',
      etc: data.hospitalDetail?.etc || '',
      sns_content_agreement: data.hospitalDetail?.sns_content_agreement || null,
      available_languages: data.hospitalDetail?.available_languages || []
    },
    
    // 편의시설
    facilities: mapFacilitiesToForm(data.hospitalDetail),
    
    // 영업시간
    businessHours: mapBusinessHoursToForm(data.businessHours),
    
    // 의사 정보
    doctors: mapDoctorsToForm(data.doctors),
    
    // 시술 정보
    treatments: mapTreatmentsToForm(data.treatments),
    
    // 병원 이미지 URL 배열 (기존 이미지 표시용)
    hospitalImages: data.hospital?.imageurls || []
  };
  
  console.log(' 데이터 변환 완료:', {
    병원정보: '변환됨',
    주소정보: '변환됨',
    영업시간: `${data.businessHours?.length}건 변환`,
    의사정보: `${data.doctors?.length}명 변환`,
    시술정보: `${data.treatments?.length}건 변환`
  });
  
  return mapped;
} 