import React, { useState, useEffect } from "react";
import DaumPost from "@/components/DaumPost";
import InputField from "@/components/InputField";
import { HospitalAddress } from "@/types/address";
import { Card, CardContent } from "./ui/card";
import { Divide } from "lucide-react";
import Divider from "./Divider";

interface AddressSectionProps {
    onSelectAddress?: (address: HospitalAddress) => void;
    // onSelectCoordinates?: (coordinates: { latitude: number; longitude: number }) => void;
    initialAddress?: string;
    initialAddressForSendForm?: HospitalAddress;
    // initialCoordinates?: { latitude: number; longitude: number }; // coordinates prop 제거
    initialAddressDetail?: string;
    initialAddressDetailEn?: string;
    initialDirections?: string;
    initialDirectionsEn?: string;
}

export default function AddressSection({ 
  onSelectAddress, 
  // onSelectCoordinates,
  initialAddress,
  initialAddressForSendForm,
  // initialCoordinates, // coordinates prop 제거
  initialAddressDetail,
  initialAddressDetailEn,
  initialDirections,
  initialDirectionsEn
} : AddressSectionProps) {
  const [showingAddress, setShowingAddress] = useState(initialAddress || "");
  const [addressForSendForm, setAddressForSendForm] = useState<HospitalAddress | null>(initialAddressForSendForm || null);
  // coordinates 상태 완전 제거
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
      // hasInitialCoordinates: !!initialCoordinates // coordinates prop 제거
    },
    현재상태: {
      showingAddress,
      addressDetail,
      addressDetailEn,
      directionsToClinic,
      directionsToClinicEn,
      hasAddressForSendForm: !!addressForSendForm,
      // hasCoordinates: !!coordinates // coordinates 상태 제거
    }
  });

  // props 변경 시 상태 업데이트 (한 번만 실행)
  useEffect(() => {
    console.log('AddressSection useEffect 시작');
    let hasUpdates = false;
    
    if (initialAddress !== undefined && initialAddress !== showingAddress) {
      setShowingAddress(initialAddress);
      hasUpdates = true;
    }
    
    if (initialAddressForSendForm && JSON.stringify(initialAddressForSendForm) !== JSON.stringify(addressForSendForm)) {
      setAddressForSendForm(initialAddressForSendForm);
      hasUpdates = true;
    }
    
    // coordinates 관련 코드 완전 제거
    
    if (initialAddressDetail !== undefined && initialAddressDetail !== addressDetail) {
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
    // initialCoordinates, // coordinates prop 제거
    initialAddressDetail,
    initialAddressDetailEn,
    initialDirections,
    initialDirectionsEn
  ]);

  // 주소 검색 시 호출되는 핸들러
  const emptyAddress: HospitalAddress = {
    address_full_road: '',
    address_full_road_en: '',
    address_full_jibun: '',
    address_full_jibun_en: '',
    address_si: '',
    address_si_en: '',
    address_gu: '',
    address_gu_en: '',
    address_dong: '',
    address_dong_en: '',
    zipcode: '',
    latitude: undefined,
    longitude: undefined,
    address_detail: '',
    address_detail_en: '',
    directions_to_clinic: '',
    directions_to_clinic_en: '',
  };

  const handleSelectAddress = (apiAddress: HospitalAddress) => {
    setAddressForSendForm(prev => ({
      ...emptyAddress,
      ...(prev || {}),
      ...apiAddress,
      latitude: apiAddress.latitude !== undefined ? Number(apiAddress.latitude) : undefined,
      longitude: apiAddress.longitude !== undefined ? Number(apiAddress.longitude) : undefined,
    }));
    setShowingAddress(apiAddress.address_full_road || '');
    onSelectAddress?.({
      ...emptyAddress,
      ...(addressForSendForm || {}),
      ...apiAddress,
      latitude: apiAddress.latitude !== undefined ? Number(apiAddress.latitude) : undefined,
      longitude: apiAddress.longitude !== undefined ? Number(apiAddress.longitude) : undefined,
    });
    console.log('주소 검색 후 addressForSendForm:', JSON.stringify({
      ...emptyAddress,
      ...(addressForSendForm || {}),
      ...apiAddress,
      latitude: apiAddress.latitude !== undefined ? Number(apiAddress.latitude) : undefined,
      longitude: apiAddress.longitude !== undefined ? Number(apiAddress.longitude) : undefined,
    }, null, 2));
  };

  // 상세주소 등 부가 정보 입력 시
  const handleAddressDetailChange = (value: string) => {
    setAddressDetail(value);
    setAddressForSendForm(prev => ({
      ...emptyAddress,
      ...(prev || {}),
      address_detail: value,
    }));
    onSelectAddress?.({
      ...emptyAddress,
      ...(addressForSendForm || {}),
      address_detail: value,
    });
  };
  const handleAddressDetailEnChange = (value: string) => {
    setAddressDetailEn(value);
    setAddressForSendForm(prev => ({
      ...emptyAddress,
      ...(prev || {}),
      address_detail_en: value,
    }));
    onSelectAddress?.({
      ...emptyAddress,
      ...(addressForSendForm || {}),
      address_detail_en: value,
    });
  };
  const handleDirectionsToClinicChange = (value: string) => {
    setDirectionsToClinic(value);
    setAddressForSendForm(prev => ({
      ...emptyAddress,
      ...(prev || {}),
      directions_to_clinic: value,
    }));
    onSelectAddress?.({
      ...emptyAddress,
      ...(addressForSendForm || {}),
      directions_to_clinic: value,
    });
  };
  const handleDirectionsToClinicEnChange = (value: string) => {
    setDirectionsToClinicEn(value);
    setAddressForSendForm(prev => ({
      ...emptyAddress,
      ...(prev || {}),
      directions_to_clinic_en: value,
    }));
    onSelectAddress?.({
      ...emptyAddress,
      ...(addressForSendForm || {}),
      directions_to_clinic_en: value,
    });
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
            <div className="flex flex-col gap-6 w-full">
              {/* 주소 검색 + 주소 정보 박스 */}
              {/* <div className="flex flex-col md:flex-row gap-6 w-full"> */}
                {/* 주소 검색 버튼 */}
                <div className="md:w-1/2 w-full">
                         {/* <input
            type="text"
            value={showingAddress}
            readOnly
            className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-800 outline-none mb-2"
            placeholder="주소를 검색하세요"
          /> */}
                  <DaumPost 
                    setShowingAddress={setShowingAddress}
                    setAddress={handleSelectAddress} 
                    // setCoordinates prop 제거
                  />
                </div>
          
                {/* 주소 정보 박스 */}
                <Card className="w-full bg-gray-50 rounded-xl shadow-sm">
                  <CardContent className="py-4 px-6 space-y-4">
                    {addressForSendForm ? (
                      <>
                        <div>
                          <div className="text-base font-semibold text-gray-800">도로명</div>
                          <div className="text-sm text-gray-600">{addressForSendForm.address_full_road}</div>
                        </div>
                        <div>
                          <div className="text-base font-semibold text-gray-800">도로명(영문)</div>
                          <div className="text-sm text-gray-600">{addressForSendForm.address_full_road_en}</div>
                        </div>
                        <div>
                          <div className="text-base font-semibold text-gray-800">지번</div>
                          <div className="text-sm text-gray-600">{addressForSendForm.address_full_jibun}</div>
                        </div>
                        <div>
                          <div className="text-base font-semibold text-gray-800">지번(영문)</div>
                          <div className="text-sm text-gray-600">{addressForSendForm.address_full_jibun_en}</div>
                        </div>

                        <Divider />
                        {/* coordinates 대신 addressForSendForm의 위도/경도만 사용 */}
                        {addressForSendForm.latitude && addressForSendForm.longitude && (
                          <div>
                            <div className="text-base font-semibold text-gray-800">좌표</div>
                            <div className="text-sm text-gray-600">{addressForSendForm.latitude}, {addressForSendForm.longitude}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">주소를 먼저 검색해주세요.</div>
                    )}
                  </CardContent>
                </Card>
              {/* </div> */}
          
              {/* 상세 주소 필드들 */}
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
                  placeholder="예: xx지하철역 3번출구로 나와서 직진후 yy건물에서 우회전"
                  value={localDirectionsToClinic}
                  onChange={(e) => handleLocalDirectionsToClinicChange(e.target.value)}
                  onBlur={handleDirectionsToClinicBlur}
                />
                <InputField
                  label="찾아오는 방법 상세안내 영문"
                  name="directions_to_clinic_en"
                  placeholder="입력하지 않으면 국문 입력을 기반으로 자동번역됩니다."
                  value={localDirectionsToClinicEn}
                  onChange={(e) => handleLocalDirectionsToClinicEnChange(e.target.value)}
                  onBlur={handleDirectionsToClinicEnBlur}
                />
              </div>
          
              {/* 최종 주소 정보 디버깅 */}
              {addressForSendForm && (
                <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-300 text-sm">
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
