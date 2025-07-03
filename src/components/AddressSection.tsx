import React, { useState, useEffect } from "react";
import DaumPost from "@/components/DaumPost";
import InputField from "@/components/InputField";
import { HospitalAddress } from "@/types/address";

interface AddressSectionProps {
    onSelectAddress?: (address: HospitalAddress) => void;
    onSelectCoordinates?: (coordinates: { latitude: number; longitude: number }) => void;
    initialAddress?: string;
    initialAddressForSendForm?: HospitalAddress;
    initialCoordinates?: { latitude: number; longitude: number };
    initialAddressDetail?: string;
    initialAddressDetailEn?: string;
    initialDirections?: string;
    initialDirectionsEn?: string;
}

export default function AddressSection({ 
  onSelectAddress, 
  onSelectCoordinates,
  initialAddress,
  initialAddressForSendForm,
  initialCoordinates,
  initialAddressDetail,
  initialAddressDetailEn,
  initialDirections,
  initialDirectionsEn
} : AddressSectionProps) {
  const [showingAddress, setShowingAddress] = useState(initialAddress || "");
  const [addressForSendForm, setAddressForSendForm] = useState<HospitalAddress | null>(initialAddressForSendForm || null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(initialCoordinates || null);
  const [addressDetail, setAddressDetail] = useState(initialAddressDetail || "");
  const [addressDetailEn, setAddressDetailEn] = useState(initialAddressDetailEn || "");
  const [directionsToClinic, setDirectionsToClinic] = useState(initialDirections || "");
  const [directionsToClinicEn, setDirectionsToClinicEn] = useState(initialDirectionsEn || "");

  // 렌더링 시점 디버깅
  console.log('AddressSection 렌더링:', {
    받은props: {
      initialAddress,
      initialAddressDetail,
      initialAddressDetailEn,
      initialDirections,
      initialDirectionsEn,
      hasInitialAddressForSendForm: !!initialAddressForSendForm,
      hasInitialCoordinates: !!initialCoordinates
    },
    현재상태: {
      showingAddress,
      addressDetail,
      addressDetailEn,
      directionsToClinic,
      directionsToClinicEn,
      hasAddressForSendForm: !!addressForSendForm,
      hasCoordinates: !!coordinates
    }
  });

  // props 변경 시 상태 업데이트 (한 번만 실행)
  useEffect(() => {
    console.log('AddressSection useEffect 시작');
    let hasUpdates = false;
    
    if (initialAddress !== undefined && initialAddress !== showingAddress) {
      console.log('주소 업데이트:', initialAddress, '→', showingAddress);
      setShowingAddress(initialAddress);
      hasUpdates = true;
    }
    
    if (initialAddressForSendForm && JSON.stringify(initialAddressForSendForm) !== JSON.stringify(addressForSendForm)) {
      setAddressForSendForm(initialAddressForSendForm);
      hasUpdates = true;
    }
    
    if (initialCoordinates && JSON.stringify(initialCoordinates) !== JSON.stringify(coordinates)) {
      setCoordinates(initialCoordinates);
      hasUpdates = true;
    }
    
    if (initialAddressDetail !== undefined && initialAddressDetail !== addressDetail) {
      console.log('상세주소 업데이트:', initialAddressDetail, '→', addressDetail);
      setAddressDetail(initialAddressDetail);
      hasUpdates = true;
    }
    
    if (initialAddressDetailEn !== undefined && initialAddressDetailEn !== addressDetailEn) {
      setAddressDetailEn(initialAddressDetailEn);
      hasUpdates = true;
    }
    
    if (initialDirections !== undefined && initialDirections !== directionsToClinic) {
      setDirectionsToClinic(initialDirections || '');
      hasUpdates = true;
    }
    
    if (initialDirectionsEn !== undefined && initialDirectionsEn !== directionsToClinicEn) {
      setDirectionsToClinicEn(initialDirectionsEn || '');
      hasUpdates = true;
    }
    
    if (hasUpdates) {
      console.log('AddressSection 초기값 설정 완료');
    } else {
      console.log('AddressSection useEffect 실행됨 - 업데이트 없음:', {
        initialAddress,
        현재showingAddress: showingAddress,
        initialAddressDetail,
        현재addressDetail: addressDetail
      });
    }
  }, [
    initialAddress,
    initialAddressForSendForm,
    initialCoordinates,
    initialAddressDetail,
    initialAddressDetailEn,
    initialDirections,
    initialDirectionsEn
  ]);

  const handleSelectShowingAddress = (showingAddress: string) => {
    setShowingAddress(showingAddress);
  };

  const handleSelectAddress = (address: HospitalAddress) => {
    // 기본 주소 정보 설정
    const updatedAddress = {
      ...address,
      address_detail: addressDetail || undefined,
      address_detail_en: addressDetailEn || undefined,
      directions_to_clinic: directionsToClinic || undefined,
      directions_to_clinic_en: directionsToClinicEn || undefined,
    };
    
    setAddressForSendForm(updatedAddress);
    onSelectAddress?.(updatedAddress);
    
    console.log(' 기본주소 설정 완료:', JSON.stringify(updatedAddress, null, 2));
  };

  const handleSelectCoordinates = (coords: { latitude: number; longitude: number }) => {
    setCoordinates(coords);
    onSelectCoordinates?.(coords);
  };

  // 상세주소가 변경될 때 addressForSendForm 업데이트
  const updateAddressDetail = (detail: string, detailEn?: string, directions?: string, directionsEn?: string) => {
    if (addressForSendForm) {
      const updatedAddress = {
        ...addressForSendForm,
        address_detail: detail || undefined,
        address_detail_en: detailEn !== undefined ? detailEn : addressForSendForm.address_detail_en,
        directions_to_clinic: directions !== undefined ? directions : addressForSendForm.directions_to_clinic,
        directions_to_clinic_en: directionsEn !== undefined ? directionsEn : addressForSendForm.directions_to_clinic_en,
      };
      
      setAddressForSendForm(updatedAddress);
      onSelectAddress?.(updatedAddress);
      
      console.log('🏠 주소 정보 업데이트:', JSON.stringify(updatedAddress, null, 2));
    }
  };

  const handleAddressDetailChange = (value: string) => {
    setAddressDetail(value);
    updateAddressDetail(value, addressDetailEn, directionsToClinic, directionsToClinicEn);
  };

  const handleAddressDetailEnChange = (value: string) => {
    setAddressDetailEn(value);
    updateAddressDetail(addressDetail, value, directionsToClinic, directionsToClinicEn);
  };

  const handleDirectionsToClinicChange = (value: string) => {
    setDirectionsToClinic(value);
    updateAddressDetail(addressDetail, addressDetailEn, value, directionsToClinicEn);
  };

  const handleDirectionsToClinicEnChange = (value: string) => {
    setDirectionsToClinicEn(value);
    updateAddressDetail(addressDetail, addressDetailEn, directionsToClinic, value);
  };

  // 로컬 상태 추가
  const [localAddressDetail, setLocalAddressDetail] = useState(initialAddressDetail || '');
  const [localAddressDetailEn, setLocalAddressDetailEn] = useState(initialAddressDetailEn || '');
  const [localDirectionsToClinic, setLocalDirectionsToClinic] = useState(initialDirections || '');
  const [localDirectionsToClinicEn, setLocalDirectionsToClinicEn] = useState(initialDirectionsEn || '');

  // initialAddress가 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    setLocalAddressDetail(initialAddressDetail || '');
    setLocalAddressDetailEn(initialAddressDetailEn || '');
    setLocalDirectionsToClinic(initialDirections || '');
    setLocalDirectionsToClinicEn(initialDirectionsEn || '');
  }, [initialAddressDetail, initialAddressDetailEn, initialDirections, initialDirectionsEn]);

  // 로컬 상태 변경 핸들러
  const handleLocalAddressDetailChange = (value: string) => {
    setLocalAddressDetail(value);
  };

  const handleLocalAddressDetailEnChange = (value: string) => {
    setLocalAddressDetailEn(value);
  };

  const handleLocalDirectionsToClinicChange = (value: string) => {
    setLocalDirectionsToClinic(value);
  };

  const handleLocalDirectionsToClinicEnChange = (value: string) => {
    setLocalDirectionsToClinicEn(value);
  };

  // blur 이벤트 핸들러
  const handleAddressDetailBlur = () => {
    handleAddressDetailChange(localAddressDetail);
  };

  const handleAddressDetailEnBlur = () => {
    handleAddressDetailEnChange(localAddressDetailEn);
  };

  const handleDirectionsToClinicBlur = () => {
    handleDirectionsToClinicChange(localDirectionsToClinic);
  };

  const handleDirectionsToClinicEnBlur = () => {
    handleDirectionsToClinicEnChange(localDirectionsToClinicEn);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex gap-2 w-full">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={showingAddress}
            readOnly
            className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-800 outline-none mb-2"
            placeholder="주소를 검색하세요"
          />
          {addressForSendForm && (
            <div className="text-sm text-gray-600 space-y-1 px-3">
              <div><span className="font-medium">도로명:</span> {addressForSendForm.address_full_road}</div>
              <div><span className="font-medium">지번:</span> {addressForSendForm.address_full_jibun}</div>
            </div>
          )}
        </div>
        <DaumPost 
          setShowingAddress={handleSelectShowingAddress}
          setAddress={handleSelectAddress} 
          setCoordinates={handleSelectCoordinates}
        />
      </div>
      
      {/* 좌표 정보 표시 (디버깅용, 필요시 제거) */}
      {coordinates && (
        <div className="text-sm text-gray-600">
          위도: {coordinates.latitude}, 경도: {coordinates.longitude}
        </div>
      )}
      
      <div className="space-y-2">
        <InputField
          label="상세주소"
          name="address_detail"
          placeholder="필요시 최대한 상세한 추가 주소를 입력하세요 (선택)"
          value={localAddressDetail}
          onChange={(e) => handleLocalAddressDetailChange(e.target.value)}
          onBlur={handleAddressDetailBlur}
        />
        <InputField
          label="상세주소 영문"
          name="address_detail_en"
          placeholder="위에 입력한 상세주소를 영문으로 입력해주세요 (선택)"
          value={localAddressDetailEn}
          onChange={(e) => handleLocalAddressDetailEnChange(e.target.value)}
          onBlur={handleAddressDetailEnBlur}
        />
      </div>
      
      <div className="space-y-2">
        <InputField
          label="찾아오는 방법 상세안내"
          name="directions_to_clinic"
          placeholder="찾아오는 방법을 더 쉽게 설명해주세요 예시) xx지하철역 3번출구로 나와서 직진후 yy건물에서 우회전"
          value={localDirectionsToClinic}
          onChange={(e) => handleLocalDirectionsToClinicChange(e.target.value)}
          onBlur={handleDirectionsToClinicBlur}
        />
        <InputField
          label="찾아오는 방법 상세안내 영문"
          name="directions_to_clinic_en"
          placeholder="위에 입력한 찾아오는 방법을 영문으로 입력해주세요 (선택)"
          value={localDirectionsToClinicEn}
          onChange={(e) => handleLocalDirectionsToClinicEnChange(e.target.value)}
          onBlur={handleDirectionsToClinicEnBlur}
        />
      </div>
      
      {/* 최종 주소 정보 표시 (디버깅용) */}
      {addressForSendForm && (
        <div className="mt-4 p-3 bg-blue-50 rounded border text-sm">
          <div className="font-semibold text-blue-800 mb-2">📍 완성된 주소 정보:</div>
          <div className="space-y-1 text-blue-700">
            <div><strong>도로명:</strong> {addressForSendForm.address_full_road}</div>
            <div><strong>지번:</strong> {addressForSendForm.address_full_jibun}</div>
            {addressForSendForm.address_detail && (
              <div><strong>상세주소:</strong> {addressForSendForm.address_detail}</div>
            )}
            {addressForSendForm.address_detail_en && (
              <div><strong>상세주소(영문):</strong> {addressForSendForm.address_detail_en}</div>
            )}
            {addressForSendForm.directions_to_clinic && (
              <div><strong>찾아오는 방법:</strong> {addressForSendForm.directions_to_clinic}</div>
            )}
            {addressForSendForm.directions_to_clinic_en && (
              <div><strong>찾아오는 방법(영문):</strong> {addressForSendForm.directions_to_clinic_en}</div>
            )}
            {addressForSendForm.latitude && addressForSendForm.longitude && (
              <div><strong>좌표:</strong> {addressForSendForm.latitude}, {addressForSendForm.longitude}</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
