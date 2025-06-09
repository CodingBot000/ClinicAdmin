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
 * 영업시간 데이터를 폼 형식으로 변환
 */
export function mapBusinessHoursToForm(businessHours: any[]) {
  const defaultHours = {
    mon: { open: '', close: '', status: 'open' as const },
    tue: { open: '', close: '', status: 'open' as const },
    wed: { open: '', close: '', status: 'open' as const },
    thu: { open: '', close: '', status: 'open' as const },
    fri: { open: '', close: '', status: 'open' as const },
    sat: { open: '', close: '', status: 'open' as const },
    sun: { open: '', close: '', status: 'open' as const },
  };

  const dayMap: { [key: string]: keyof typeof defaultHours } = {
    '월': 'mon', '화': 'tue', '수': 'wed', '목': 'thu',
    '금': 'fri', '토': 'sat', '일': 'sun'
  };

  businessHours.forEach(hour => {
    const day = dayMap[hour.day_of_week];
    if (day) {
      defaultHours[day] = {
        open: hour.open_time || '',
        close: hour.close_time || '',
        status: hour.status || 'open'
      };
    }
  });

  return defaultHours;
}

/**
 * 의사 데이터를 폼 형식으로 변환
 */
export function mapDoctorsToForm(doctors: any[]): DoctorInfo[] {
  return doctors.map((doctor) => ({
    id: doctor.id_uuid || '',
    name: doctor.name || '',
    bio: doctor.bio || '',
    imagePreview: getImageUrlFromData(doctor.image_url), // 이미지 URL 안전 처리
    useDefaultImage: false,
    isChief: doctor.chief === 1
  }));
}

/**
 * 시술 데이터를 폼 형식으로 변환
 */
export function mapTreatmentsToForm(treatments: any[]) {
  const treatmentOptions: { [key: string]: any[] } = {};
  
  treatments.forEach(treatment => {
    const key = treatment.id_uuid_treatment;
    if (!treatmentOptions[key]) {
      treatmentOptions[key] = [];
    }
    
    treatmentOptions[key].push({
      value1: treatment.option_value || '',
      value2: treatment.price || 0,
      discountPrice: treatment.discount_price || 0,
      exposedPrice: treatment.price_expose || 0
    });
  });

  return treatmentOptions;
}

/**
 * 주소 데이터를 폼 형식으로 변환
 */
export function mapAddressToForm(hospital: any) {
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
export function mapFacilitiesToForm(hospitalDetail: any) {
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
      name: data.hospital.name || '',
      directions: data.hospital.directions_to_clinic || '',
      location: data.hospital.location || '',
      images: data.hospital.imageurls || []
    },
    
    // 주소 정보
    address: mapAddressToForm(data.hospital),
    
    // 병원 상세 정보
    hospitalDetail: {
      tel: data.hospitalDetail?.tel || '',
      kakaotalk: data.hospitalDetail?.kakaotalk || '',
      homepage: data.hospitalDetail?.homepage || '',
      instagram: data.hospitalDetail?.instagram || '',
      facebook: data.hospitalDetail?.facebook || '',
      blog: data.hospitalDetail?.blog || '',
      youtube: data.hospitalDetail?.youtube || '',
      ticktok: data.hospitalDetail?.ticktok || '',
      snapchat: data.hospitalDetail?.snapchat || '',
      map: data.hospitalDetail?.map || '',
      desc_address: data.hospitalDetail?.desc_address || '',
      desc_openninghour: data.hospitalDetail?.desc_openninghour || '',
      desc_facilities: data.hospitalDetail?.desc_facilities || '',
      etc: data.hospitalDetail?.etc || ''
    },
    
    // 편의시설
    facilities: mapFacilitiesToForm(data.hospitalDetail),
    
    // 영업시간
    businessHours: mapBusinessHoursToForm(data.businessHours),
    
    // 의사 정보
    doctors: mapDoctorsToForm(data.doctors),
    
    // 시술 정보
    treatments: mapTreatmentsToForm(data.treatments)
  };
  
  console.log(' 데이터 변환 완료:', {
    병원정보: '변환됨',
    주소정보: '변환됨',
    영업시간: `${data.businessHours.length}건 변환`,
    의사정보: `${data.doctors.length}명 변환`,
    시술정보: `${data.treatments.length}건 변환`
  });
  
  return mapped;
} 