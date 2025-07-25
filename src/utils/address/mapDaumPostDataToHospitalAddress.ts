import { HospitalAddress } from "@/types/address";

export type DaumAddressData = {
    address: string;
    addressEnglish: string;
    addressType: string;
    roadAddress: string;
    roadAddressEnglish: string;
    jibunAddress: string;
    jibunAddressEnglish: string;
    sido: string;
    sidoEnglish: string;
    sigungu: string;
    sigunguEnglish: string;
    bname: string;
    bnameEnglish: string;
    buildingName: string;
    buildingNameEnglish: string;
    zonecode: string;
  };
  
  export const mapDaumPostDataToHospitalAddress = (
    data: DaumAddressData,
    coordinates?: { latitude: number; longitude: number },
  ): HospitalAddress => {
    log.info('mapDaumPostDataToHospitalAddress data: ', data);
    return {
      address_full_road: data.roadAddress,
      address_full_road_en: data.roadAddressEnglish,
      address_full_jibun: data.jibunAddress,
      address_full_jibun_en: data.jibunAddressEnglish,
      address_si: data.sido,
      address_si_en: data.sidoEnglish,
      address_gu: data.sigungu,
      address_gu_en: data.sigunguEnglish,
      address_dong: data.bname,
      address_dong_en: data.bnameEnglish,
      bname: data.bname,
      bname_en: data.bnameEnglish,
      building_name: data.buildingName,
      building_name_en: data.buildingNameEnglish,
      zipcode: data.zonecode,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
   
    };
  }
  