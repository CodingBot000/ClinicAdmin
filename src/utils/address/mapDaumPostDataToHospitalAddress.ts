import { HospitalAddress } from "@/types/address";

type DaumAddressData = {
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
    zonecode: string;
  };
  
  function mapDaumDataToHospitalAddress(
    data: DaumAddressData,
    coordinates?: { latitude: number; longitude: number },
    // address_detail?: string,
    // address_detail_en?: string,
  ): HospitalAddress {
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
      zipcode: data.zonecode,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      // address_detail: address_detail,
      // address_detail_en: address_detail_en,
    };
  }
  