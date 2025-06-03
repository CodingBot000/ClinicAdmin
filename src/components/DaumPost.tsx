"use client";

import React from "react";
import { useDaumPostcodePopup } from "react-daum-postcode";


interface DaumPostProps {
  setAddress: (address: string) => void;
  setCoordinates?: (coordinates: { latitude: number; longitude: number }) => void;
}

const DaumPost: React.FC<DaumPostProps> = ({ setAddress, setCoordinates }) => {
  const postcodeScriptUrl =
    "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  const open = useDaumPostcodePopup(postcodeScriptUrl);

  // 카카오 API를 사용해서 주소를 좌표로 변환하는 함수
  const getCoordinatesFromAddress = async (address: string) => {
    // console.log('address:', address);
    // console.log('address:', encodeURIComponent(address));
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
    // console.log('🏠 원본 주소 데이터:', data);
    
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
    
    // console.log('📋 DaumAddressData 매핑 결과:', daumAddressData);

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

    setAddress(fullAddress);
    
    // 주소로부터 좌표 정보 가져오기
    const coordinates = await getCoordinatesFromAddress(data.address);
    
    // mapDaumDataToHospitalAddress 함수를 사용하여 HospitalAddress 객체 생성
    const hospitalAddress = mapDaumDataToHospitalAddress(daumAddressData, coordinates);
    
    // console.log('🏥 HospitalAddress 변환 결과:', hospitalAddress);
    // console.log('📍 좌표 정보 포함 여부:', !!hospitalAddress.latitude && !!hospitalAddress.longitude);
    
    // 여기서 수파베이스 전송 전 최종 데이터 확인
    console.log('🚀 수파베이스 전송 준비 완료 - HospitalAddress:', JSON.stringify(hospitalAddress, null, 2));
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



