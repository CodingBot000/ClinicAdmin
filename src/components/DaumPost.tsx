"use client";

import React from "react";
import { useDaumPostcodePopup } from "react-daum-postcode";

// 타입 정의
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

type HospitalAddress = {
  address_full_road: string;
  address_full_road_en?: string;
  address_full_jibun: string;
  address_full_jibun_en?: string;
  address_si: string;
  address_si_en?: string;
  address_gu: string;
  address_gu_en?: string;
  address_dong: string;
  address_dong_en?: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
  address_detail?: string;
  address_detail_en?: string;
};

function mapDaumDataToHospitalAddress(
  data: DaumAddressData,
  coordinates?: { latitude: number; longitude: number }
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
  };
}

interface DaumPostProps {
  setShowingAddress: (address: string) => void;
  setAddress: (address: HospitalAddress) => void;
  setCoordinates?: (coordinates: { latitude: number; longitude: number }) => void;
}

const DaumPost: React.FC<DaumPostProps> = ({ setShowingAddress, setAddress, setCoordinates }) => {
  const postcodeScriptUrl =
    "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  const open = useDaumPostcodePopup(postcodeScriptUrl);

  // 카카오 API를 사용해서 주소를 좌표로 변환하는 함수
  const getCoordinatesFromAddress = async (address: string) => {
    try {
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('주소 변환 실패:', errorData);
        throw new Error(errorData.error || '주소 변환 실패');
      }

      const data = await response.json();
      
      if (data.coordinates) {
        console.log('좌표 정보:', data.coordinates);
        
        if (setCoordinates) {
          setCoordinates(data.coordinates);
        }
        
        return data.coordinates;
      } else {
        console.warn('좌표를 찾을 수 없습니다:', address);
        return null;
      }
    } catch (error) {
      console.error('주소 -> 좌표 변환 오류:', error);
      return null;
    }
  };

  const handleComplete = async (data: any) => {
    // 다음 주소 API 응답을 DaumAddressData 타입으로 매핑
    const daumAddressData: DaumAddressData = {
      address: data.address || '',
      addressEnglish: data.addressEnglish || '',
      addressType: data.addressType || '',
      roadAddress: data.roadAddress || '',
      roadAddressEnglish: data.roadAddressEnglish || '',
      jibunAddress: data.jibunAddress || '',
      jibunAddressEnglish: data.jibunAddressEnglish || '',
      sido: data.sido || '',
      sidoEnglish: data.sidoEnglish || '',
      sigungu: data.sigungu || '',
      sigunguEnglish: data.sigunguEnglish || '',
      bname: data.bname || '',
      bnameEnglish: data.bnameEnglish || '',
      zonecode: data.zonecode || '',
    };

    // 기존 주소 설정 로직
    let fullAddress = data.address;
    let extraAddress = "";
    let localAddress = data.sido + " " + data.sigungu;

    if (data.addressType === "R") {
      if (data.bname !== "") {
        extraAddress += data.bname;
      }
      if (data.buildingName !== "") {
        extraAddress +=
          extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress = fullAddress.replace(localAddress, "");
      fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
    }

    setShowingAddress(fullAddress);
    
    // 주소로부터 좌표 정보 가져오기
    const coordinates = await getCoordinatesFromAddress(data.address);
    
    // mapDaumDataToHospitalAddress 함수를 사용하여 HospitalAddress 객체 생성
    const hospitalAddress = mapDaumDataToHospitalAddress(daumAddressData, coordinates);
    
    // 수파베이스 전송 전 최종 데이터 확인
    console.log('🚀 수파베이스 전송 준비 완료 - HospitalAddress:', JSON.stringify(hospitalAddress, null, 2));
    setAddress(hospitalAddress);
  };

  const handleClick = () => {
    open({ onComplete: handleComplete });
  };

  return (
    <button
      type="button"
      className="w-24 h-10 text-white bg-[#333] hover:bg-[#5593ff] border-none rounded cursor-pointer transition-colors flex items-center justify-center"
      onClick={handleClick}
    >
      주소검색
    </button>
  );
};

export default DaumPost;