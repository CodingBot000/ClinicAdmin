"use client";

import PageHeader from "@/components/PageHeader";
import InputField from "@/components/InputField";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import { uploadActions } from "./actions";
import { SurgeriesModal } from "./modal";
import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";
import useModal from "@/hooks/useModal";
import { AlertModal } from "@/components/modal";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import DaumPost from "@/components/DaumPost";
import AddressSection from "@/components/AddressSection";
import LocationSelect from "@/components/LocationSelect";
import { TreatmentSelectBox } from "@/components/TreatmentSelectBox";
import ImageUploadSection from "@/components/ImageUploadSection";
import OpeningHoursForm, { OpeningHour } from "@/components/OpeningHoursForm";
import ExtraOptions, { ExtraOptionState } from "@/components/ExtraOptions";
import { useCategories } from "@/hooks/useCategories";
import { SubmitConfirmationModal } from "@/components/modal/SubmitConfirmationModal";
import { CategoryNode } from "@/types/category";

// HospitalAddress 타입 정의
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

interface Surgery {
  created_at: string;
  description: string;
  id: number;
  id_unique: number;
  imageurls: string[];
  name: string;
  type: string;
}

const doctorImageUploadLength = 3;
const clinicImageUploadLength = 7;

const UploadClient = () => {
  const pageStartTime = Date.now();
  console.log("📄 UploadClient 페이지 시작:", new Date().toISOString());
  
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  
  // categories 디버깅
  console.log("🏥 UploadClient - categories 상태:", {
    categoriesLoading,
    categoriesError,
    categoriesLength: categories?.length || 0,
    categories
  });

  const state = useFormStatus();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [addressForSendForm, setAddressForSendForm] = useState<HospitalAddress | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ key: number;  label: string, name: string } | null>(null);
  const [selectedTreatments, setSelectedTreatments] = useState<number[]>([]);
  const [treatmentOptions, setTreatmentOptions] = useState<any[]>([]);
  const [priceExpose, setPriceExpose] = useState<boolean>(true);
  const [clinicImages, setClinicImages] = useState<File[]>([]);
  const [doctorImages, setDoctorImages] = useState<File[]>([]);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  const [optionState, setOptionState] = useState<ExtraOptionState>({
    has_private_recovery_room: false,
    has_parking: false,
    has_cctv: false,
    has_night_counseling: false,
    has_female_doctor: false,
    has_anesthesiologist: false,
    specialistCount: 0,
  });
  const [searchkey, setSearchKey] = useState<string>("");
  const [search_key, setSearch_Key] = useState<string>("");
  // const supabase = createClient();
  const [formState, setFormState] = useState<{ message?: string; status?: string } | null>(null);
  
  // 확인 모달 상태 추가
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [preparedFormData, setPreparedFormData] = useState<FormData | null>(null);

  const { data: surgeryList = [], isPending } = useQuery<Surgery[]>({
    queryKey: ["surgery_info"],
    queryFn: async () => {
      const queryStartTime = Date.now();
      console.log("🔍 surgeryList 쿼리 시작:", new Date().toISOString());
      
      const { data, error } = await supabase.from("surgery_info").select("*");
      
      const queryEndTime = Date.now();
      const queryTime = queryEndTime - queryStartTime;
      console.log(`🔍 surgeryList 쿼리 완료: ${queryTime}ms`, {
        dataLength: data?.length || 0,
        error: error?.message || null
      });
      
      if (error) throw Error("surgery_info error");
      return data;
    },
  });

  const { handleOpenModal, open } = useModal();

  useEffect(() => {
    if (formState?.message) {
      handleOpenModal();
    }
  }, [formState]);

  // 페이지 로딩 완료 시간 측정
  useEffect(() => {
    if (!categoriesLoading && !isPending && categories) {
      const pageEndTime = Date.now();
      const totalLoadTime = pageEndTime - pageStartTime;
      console.log("✅ UploadClient 페이지 로딩 완료:", new Date().toISOString());
      console.log(`⏱️ 총 페이지 로딩 시간: ${totalLoadTime}ms (${(totalLoadTime / 1000).toFixed(2)}초)`);
      console.log("📊 로딩 완료 상태:", {
        categoriesCount: categories?.length || 0,
        surgeryListCount: surgeryList?.length || 0,
        categoriesLoading,
        isPending
      });
    }
  }, [categoriesLoading, isPending, categories, surgeryList, pageStartTime]);

  const handleModal = () => {
    if (formState?.status === "success") {
      router.refresh();
    }
    handleOpenModal();
  };

  // 선택된 치료 항목들과 상품옵션을 처리하는 함수
  const handleTreatmentSelectionChange = (data: { selectedKeys: number[], productOptions: any[], priceExpose: boolean }) => {
    setSelectedTreatments(data.selectedKeys);
    setTreatmentOptions(data.productOptions);
    setPriceExpose(data.priceExpose);
    
    console.log('💊 UploadClient - 시술 데이터 업데이트:', {
      selectedTreatments: data.selectedKeys,
      productOptions: data.productOptions,
      priceExpose: data.priceExpose
    });
  };

  // FormData에서 데이터를 요약 정보로 변환하는 함수
  const prepareFormDataSummary = (formData: FormData) => {
    // 시술 이름 매핑 생성 - 중첩된 구조를 재귀적으로 탐색
    const treatmentMap = new Map<number, string>();
    
    const flattenCategories = (nodes: CategoryNode[]) => {
      nodes.forEach(node => {
        // key가 -1이 아닌 것만 매핑 (실제 시술)
        if (node.key !== -1) {
          treatmentMap.set(node.key, node.label);
        }
        if (node.children) {
          flattenCategories(node.children);
        }
      });
    };
    
    if (categories) {
      flattenCategories(categories);
    }

    const getStatusText = (openingHour: OpeningHour) => {
      if (openingHour.open) return '영업';
      if (openingHour.closed) return '휴무';
      if (openingHour.ask) return '진료시간 문의 필요';
      return '미설정';
    };

    const formatTime = (hour: number, minute: number) => {
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    const facilities = Object.entries(optionState)
      .filter(([key, value]) => key !== 'specialistCount' && value === true)
      .map(([key]) => {
        switch (key) {
          case 'has_private_recovery_room': return '개인회복실';
          case 'has_parking': return '주차가능';
          case 'has_cctv': return 'CCTV';
          case 'has_night_counseling': return '야간상담';
          case 'has_female_doctor': return '여의사';
          case 'has_anesthesiologist': return '마취통증의학과 전문의';
          default: return key;
        }
      });

    return {
      basicInfo: {
        name: (formData.get('name') as string) || '',
        searchkey: searchkey || '',
        search_key: search_key || '',
      },
      address: {
        road: addressForSendForm?.address_full_road || '',
        jibun: addressForSendForm?.address_full_jibun || '',
        detail: `${addressForSendForm?.address_detail || ''} ${addressForSendForm?.address_detail_en || ''}`.trim(),
        coordinates: addressForSendForm?.latitude && addressForSendForm?.longitude 
          ? `위도: ${addressForSendForm.latitude}, 경도: ${addressForSendForm.longitude}` 
          : '좌표 없음',
      },
      location: selectedLocation?.label || '선택 안됨',
      treatments: {
        count: selectedTreatments.length,
        items: selectedTreatments.map(code => treatmentMap.get(code) || `코드 ${code}`)
      },
      treatmentOptions: {
        count: treatmentOptions.length,
        items: treatmentOptions.map(option => ({
          treatmentKey: option.treatmentKey,
          optionName: option.value1.toString(),
          price: option.value2
        }))
      },
      openingHours: {
        count: openingHours.length,
        items: openingHours.map(hour => ({
          day: hour.day,
          time: (hour.closed || hour.ask) 
            ? '시간 설정 없음'
            : `${formatTime(hour.from.hour, hour.from.minute)} ~ ${formatTime(hour.to.hour, hour.to.minute)}`,
          status: getStatusText(hour)
        }))
      },
      extraOptions: {
        facilities,
        specialistCount: optionState.specialistCount
      },
      images: {
        clinicImages: clinicImages.length,
        doctorImages: doctorImages.length
      }
    };
  };

  // 제출 전 데이터 준비 및 모달 표시
  const handleSubmit = async (formData: FormData) => {
    try {
      // 주소 latitude, longitude, 주소상세 포함 
      if (addressForSendForm) {
        formData.append('address_full_road', addressForSendForm.address_full_road ?? "");
        formData.append('address_full_road_en', addressForSendForm.address_full_road_en ?? "");
        formData.append('address_full_jibun', addressForSendForm.address_full_jibun ?? "");
        formData.append('address_full_jibun_en', addressForSendForm.address_full_jibun_en ?? "");
        formData.append('address_si', addressForSendForm.address_si ?? "");
        formData.append('address_si_en', addressForSendForm.address_si_en ?? "");
        formData.append('address_gu', addressForSendForm.address_gu ?? "");
        formData.append('address_gu_en', addressForSendForm.address_gu_en ?? "");
        formData.append('address_dong', addressForSendForm.address_dong ?? "");
        formData.append('address_dong_en', addressForSendForm.address_dong_en ?? "");
        formData.append('zipcode', addressForSendForm.zipcode ?? "");
        formData.append('latitude', addressForSendForm.latitude !== undefined ? String(addressForSendForm.latitude) : "");
        formData.append('longitude', addressForSendForm.longitude !== undefined ? String(addressForSendForm.longitude) : "");
        formData.append('address_detail', addressForSendForm.address_detail ?? "");
        formData.append('address_detail_en', addressForSendForm.address_detail_en ?? "");
      }
      
      // 지역
      if (selectedLocation) {
        formData.append('location', JSON.stringify(selectedLocation));
      }

      // 선택된 치료 항목들을 formData에 추가
      if (selectedTreatments.length > 0) {
        formData.append('selected_treatments', JSON.stringify(selectedTreatments));
      }
      
      // 상품옵션 데이터를 formData에 추가
      if (treatmentOptions.length > 0) {
        formData.append('treatment_options', JSON.stringify(treatmentOptions));
        console.log('💊 상품옵션 formData 추가:', {
          length: treatmentOptions.length,
          data: treatmentOptions,
          jsonString: JSON.stringify(treatmentOptions)
        });
      } else {
        console.log('⚠️ 상품옵션이 없습니다.');
      }
      
      // 가격노출 설정 추가
      formData.append('price_expose', priceExpose.toString());
      console.log('💰 가격노출 설정:', priceExpose);
      
      // 시설정보
      formData.append('extra_options', JSON.stringify(optionState));

      // opening hour schedules info 
      formData.append('opening_hours', JSON.stringify(openingHours));
      
      // 병원 이미지들을 formData에 추가
      if (clinicImages.length > 0) {
        clinicImages.forEach((file) => {
          formData.append('clinicImages', file);
        })
      }
      
      // 의사 이미지들을 formData에 추가
      if (doctorImages.length > 0) {
        doctorImages.forEach((file) => {
          formData.append('doctorImages', file);
        })
      }
      
      // 제출할 데이터 전체 로그 출력
      console.log('🚀 ===== 제출할 데이터 전체 목록 =====');
      console.log('📋 Form 제출 데이터:');
      console.log('- 병원명:', formData.get('name'));
      console.log('- 검색키:', searchkey);
      console.log('- 검색키2:', search_key);
      console.log('- 주소 정보:', addressForSendForm);
      console.log('- 선택된 위치:', selectedLocation);
      console.log('- 선택된 치료 항목들:', selectedTreatments);
      console.log('- 상품옵션:', treatmentOptions);
      console.log('- 영업시간:', openingHours);
      console.log('- 부가 시설 옵션:', optionState);
      console.log('- 병원 이미지 개수:', clinicImages.length);
      console.log('- 의사 이미지 개수:', doctorImages.length);
      console.log('🚀 ================================');

      // FormData를 저장하고 모달 표시
      setPreparedFormData(formData);
      setShowConfirmModal(true);
      
    } catch (error) {
      console.log("데이터 준비 중 오류:", error);
      setFormState({ message: "데이터 준비 중 오류가 발생했습니다.", status: "error" });
    }
  };

  // 실제 제출 함수
  const handleActualSubmit = async () => {
    if (!preparedFormData) return;
    
    try {
      console.log('🔥 실제 제출 시작...');
      console.log('📤 POST 요청 URL:', "/api/upload");
      console.log('📦 FormData 내용 확인:');
      
      // FormData 내용을 로그로 출력
      for (const [key, value] of preparedFormData.entries()) {
        if (value instanceof File) {
          console.log(`  - ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  - ${key}:`, value);
        }
      }
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: preparedFormData,
      });
      
      console.log('📡 응답 상태:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries())
      });
      
      // 응답이 성공이 아닌 경우 상세 정보 출력
      if (!res.ok) {
        console.error('❌ HTTP 응답 에러:');
        console.error('  - Status:', res.status);
        console.error('  - Status Text:', res.statusText);
        
        try {
          const errorText = await res.text();
          console.error('  - 응답 본문:', errorText);
          
          // JSON 파싱 시도
          try {
            const errorJson = JSON.parse(errorText);
            console.error('  - 파싱된 에러 JSON:', errorJson);
          } catch (jsonError) {
            console.error('  - JSON 파싱 실패, 원본 텍스트:', errorText);
          }
        } catch (textError) {
          console.error('  - 응답 본문 읽기 실패:', textError);
        }
        
        setFormState({ 
          message: `서버 응답 에러: ${res.status} ${res.statusText}`, 
          status: "error" 
        });
        setShowConfirmModal(false);
        setPreparedFormData(null);
        return;
      }
      
      // 성공 응답 처리
      try {
        const result = await res.json();
        console.log('✅ 서버 응답 성공:', result);
        setFormState(result);
      } catch (jsonError) {
        console.error('❌ 응답 JSON 파싱 에러:', jsonError);
        console.error('응답이 JSON 형식이 아닙니다.');
        
        // 응답 텍스트 확인
        try {
          const responseText = await res.text();
          console.error('응답 텍스트:', responseText);
        } catch (textError) {
          console.error('응답 텍스트 읽기 실패:', textError);
        }
        
        setFormState({ 
          message: "서버 응답 형식 오류 (JSON 파싱 실패)", 
          status: "error" 
        });
      }
      
      setShowConfirmModal(false);
      setPreparedFormData(null);
      
    } catch (error) {
      console.error('🚨 네트워크 또는 요청 에러:');
      console.error('  - Error Type:', error?.constructor?.name || 'Unknown');
      console.error('  - Error Message:', error instanceof Error ? error.message : String(error));
      console.error('  - Error Stack:', error instanceof Error ? error.stack : 'No stack available');
      console.error('  - Full Error Object:', error);
      
      let errorMessage = "업로드 중 오류가 발생했습니다.";
      
      if (error instanceof TypeError) {
        errorMessage = "네트워크 연결 오류가 발생했습니다.";
      } else if (error instanceof Error && error.message) {
        errorMessage = `요청 오류: ${error.message}`;
      }
      
      setFormState({ message: errorMessage, status: "error" });
      setShowConfirmModal(false);
      setPreparedFormData(null);
    }
  };

  // 모달 취소 처리
  const handleModalCancel = () => {
    setShowConfirmModal(false);
    setPreparedFormData(null);
  };

  if (isPending || categoriesLoading) return <LoadingSpinner backdrop />;

  return (
    <main>
      <PageHeader name="병원 정보를 입력하세요" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmit(formData);
        }}
        className="my-8 mx-auto px-6"
        style={{ width: '100vw', maxWidth: '1024px' }}
      >
      <div className="space-y-4 w-full">
        <InputField label="clinic name" name="name" required />
        {/* <InputField label="searchkey" name="searchkey" required />
        <InputField label="search_key" name="search_key" required /> */}
        <div className="w-full">
          <AddressSection 
            onSelectAddress={setAddressForSendForm} 
            onSelectCoordinates={setCoordinates}
          />
        </div>
        <LocationSelect 
          onSelect={setSelectedLocation}
          selectedLocation={selectedLocation}
        />
        <div className="w-full">
          {/* <SurgeriesModal itemList={surgeryList} /> */}
          {categories && (
            <TreatmentSelectBox 
              onSelectionChange={handleTreatmentSelectionChange}
              initialSelectedKeys={selectedTreatments}
              categories={categories}
            />
          )}
        </div>
        
        {/* 디버깅 정보 표시 */}
        {(selectedTreatments.length > 0 || coordinates || selectedLocation) && (
          <div className="mt-4 p-4 bg-gray-100 rounded border">
            <h3 className="font-semibold mb-2">선택된 정보:</h3>
            {selectedLocation && (
              <p className="text-sm"><strong>위치:</strong> {selectedLocation.label}</p>
            )}
            {coordinates && (
              <p className="text-sm"><strong>좌표:</strong> 위도 {coordinates.latitude}, 경도 {coordinates.longitude}</p>
            )}
            {selectedTreatments.length > 0 && (
              <p className="text-sm"><strong>선택된 치료 개수:</strong> {selectedTreatments.length}개</p>
            )}
            {

            }
          </div>
        )}
      </div>
       {/* 영업시간 등록  */}
        {/* <div className="w-full">
        <h3 className="font-semibold mb-2">영업시간 날짜 시간 등록</h3> */}
        <OpeningHoursForm onSelectOpeningHours={setOpeningHours}/>
        {/* </div> */}
        <div className="w-full mt-4">
           <ExtraOptions onSelectOptionState={setOptionState}/>
        </div>
      {/* 병원 이미지 업로드 */}
      <ImageUploadSection
        maxImages={clinicImageUploadLength}
        title="병원 이미지 등록"
        description={`- 병원 메인 이미지는 가로로 긴 직사각형(권장 비율: 16:9 또는 3:1)으로 업로드해 주세요.
  · 예시: 1600x900px(16:9) 또는 1800x600px(3:1)
  · 알림: 주어진 사진을 중앙을 기준으로 16:9 혹은 3:1 비율로 넘치는 부분이 자동으로 잘라집니다.
      사진이 비율보다 작으면 가로기준으로 비율을 맞춰서 자동으로 확대해서 화면에 맞춰줍니다.
      * File 한개당 50MB 이하로 업로드 해주세요.
      * 최대(권장) 7개까지 업로드 가능합니다. 추가 업로드 원하시면 문의 부탁드립니다.`}
        onFilesChange={setClinicImages}
        name="clinic_images"
        type="Banner"
      />

      {/* 의사 이미지 업로드 */}
      <ImageUploadSection
        maxImages={doctorImageUploadLength}
        title="의사 프로필 이미지 등록"
        description={`- 의사 프로필 이미지는 정사각형(1:1)으로 업로드해 주세요.
          * File 한개당 50MB 이하로 업로드 해주세요.
  · 예시: 권장해상도 500x500px
  · 알림: 주어진 사진을 중앙을 기준으로 1:1 비율로 넘치는 부분이 자동으로 잘라집니다.`}
        onFilesChange={setDoctorImages}
        name="doctor_images"
        type="Avatar"
      />

      
      <div className="flex justify-center mt-8 gap-8">
        <Button type="reset" color="red">cancel</Button>
        <Button color="blue" disabled={state.pending}>
          {state.pending ? "...submit" : "preview"}
        </Button>
      </div>

      </form>

      <AlertModal onCancel={handleModal} open={open}>
        Upload Client Test error: {Array.isArray(formState?.message) ? formState?.message[0] : formState?.message}
      </AlertModal>

      {/* 제출 확인 모달 */}
      {showConfirmModal && preparedFormData && (
        <SubmitConfirmationModal
          open={showConfirmModal}
          formData={prepareFormDataSummary(preparedFormData)}
          onConfirm={handleActualSubmit}
          onCancel={handleModalCancel}
        />
      )}
    </main>
  );
};

export default UploadClient;
