import React, { useState } from "react";
import DaumPost from "@/components/DaumPost";
import InputField from "@/components/InputField";
import { HospitalAddress } from "@/types/address";

interface AddressSectionProps {
    onSelectAddress?: (address: HospitalAddress) => void;
    onSelectCoordinates?: (coordinates: { latitude: number; longitude: number }) => void;
}

export default function AddressSection({ onSelectAddress, onSelectCoordinates } : AddressSectionProps) {
  const [showingAddress, setShowingAddress] = useState("");
  const [addressForSendForm, setAddressForSendForm] = useState<HospitalAddress | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [addressDetail, setAddressDetail] = useState("");
  const [addressDetailEn, setAddressDetailEn] = useState("");
  const [directionsToClinic, setDirectionsToClinic] = useState("");
  const [directionsToClinicEn, setDirectionsToClinicEn] = useState("");

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

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex gap-2 w-full">
        <input
          type="text"
          value={showingAddress}
          readOnly
          className="flex-1 min-w-0 px-3 py-2 border rounded bg-gray-100 text-gray-800 outline-none"
          placeholder="주소를 검색하세요"
        />
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
          value={addressDetail}
          onChange={(e) => handleAddressDetailChange(e.target.value)}
        />
        <InputField
          label="상세주소 영문"
          name="address_detail_en"
          placeholder="위에 입력한 상세주소를 영문으로 입력해주세요 (선택)"
          value={addressDetailEn}
          onChange={(e) => handleAddressDetailEnChange(e.target.value)}
          disabled={!addressDetail}
        />
      </div>
      
      <div className="space-y-2">
        <InputField
          label="찾아오는 방법 상세안내"
          name="directions_to_clinic"
          placeholder="찾아오는 방법을 더 쉽게 설명해주세요 예시) xx지하철역 3번출구로 나와서 직진후 yy건물에서 우회전"
          value={directionsToClinic}
          onChange={(e) => handleDirectionsToClinicChange(e.target.value)}
        />
        <InputField
          label="찾아오는 방법 상세안내 영문"
          name="directions_to_clinic_en"
          placeholder="위에 입력한 찾아오는 방법을 영문으로 입력해주세요 (선택)"
          value={directionsToClinicEn}
          onChange={(e) => handleDirectionsToClinicEnChange(e.target.value)}
          disabled={!directionsToClinic}
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
      
      {/* 숨겨진 input으로 좌표 정보를 form에 포함 */}
      {/* {coordinates && (
        <>
          <input type="hidden" name="latitude" value={coordinates.latitude} />
          <input type="hidden" name="longitude" value={coordinates.longitude} />
        </>
      )} */}
    </div>
  );
}
