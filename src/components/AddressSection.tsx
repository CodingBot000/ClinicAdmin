import React, { useState } from "react";
import DaumPost from "@/components/DaumPost";
import InputField from "@/components/InputField";

interface AddressSectionProps {
    onSelectAddress?: (address: string) => void;
    onSelectCoordinates?: (coordinates: { latitude: number; longitude: number }) => void;
}

export default function AddressSection({ onSelectAddress, onSelectCoordinates } : AddressSectionProps) {
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleSelectAddress = (address: string) => {
    setAddress(address);
    onSelectAddress?.(address);
  };

  const handleSelectCoordinates = (coords: { latitude: number; longitude: number }) => {
    setCoordinates(coords);
    onSelectCoordinates?.(coords);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex gap-2 w-full">
        <input
          type="text"
          value={address}
          readOnly
          className="flex-1 min-w-0 px-3 py-2 border rounded bg-gray-100 text-gray-800 outline-none"
          placeholder="주소를 검색하세요"
        />
        <DaumPost 
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
      
      <InputField
        label="상세주소"
        name="address_detail"
        required
        placeholder="상세 주소를 입력하세요"
      />
      
      {/* 숨겨진 input으로 좌표 정보를 form에 포함 */}
      {coordinates && (
        <>
          <input type="hidden" name="latitude" value={coordinates.latitude} />
          <input type="hidden" name="longitude" value={coordinates.longitude} />
        </>
      )}
    </div>
  );
}
