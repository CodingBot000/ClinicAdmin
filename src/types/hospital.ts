export interface HospitalData {
  id_uuid: string;
  name: string;
  address_full_road: string;
  address_full_road_en: string;
  address_full_jibun: string;
  address_full_jibun_en: string;
  address_si: string;
  address_si_en: string;
  address_gu: string;
  address_gu_en: string;
  address_dong: string;
  address_dong_en: string;
  zipcode: string;
  latitude: number;
  longitude: number;
  address_detail: string;
  address_detail_en: string;
  directions_to_clinic: string;
  directions_to_clinic_en: string;
  location: string;
  imageurls: string[];
}

export interface HospitalDetailData {
  tel: string;
  // kakaotalk: string;
  // homepage: string;
  // instagram: string;
  // facebook: string;
  // blog: string;
  // youtube: string;
  // ticktok: string;
  // snapchat: string;
  map: string;
  // desc_address: string;
  // desc_openninghour: string;
  // desc_facilities: string;
  etc: string;
  has_private_recovery_room: boolean;
  has_parking: boolean;
  has_cctv: boolean;
  has_night_counseling: boolean;
  has_female_doctor: boolean;
  has_anesthesiologist: boolean;
  specialist_count: number;
}

export interface BusinessHourData {
  day_of_week: string;
  open_time: string | null;
  close_time: string | null;
  status: 'open' | 'closed' | 'ask';
}

export interface DoctorData {
  name: string;
  bio: string;
  image_url: string[];
  chief: number;
}

export interface TreatmentData {
  id_uuid_treatment: string;
  option_value: string;
  price: number;
  discount_price: number;
  price_expose: number;
  etc?: string;
}

export interface ExistingHospitalData {
  hospital: HospitalData;
  hospitalDetail: HospitalDetailData;
  businessHours: BusinessHourData[];
  doctors: DoctorData[];
  treatments: TreatmentData[];
} 