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
import OpeningHoursForm from "@/components/OpeningHoursForm";
import ExtraOptions from "@/components/ExtraOptions";

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
  const state = useFormStatus();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ key: number;  label: string, name: string } | null>(null);
  const [selectedTreatments, setSelectedTreatments] = useState<number[]>([]);
  const [clinicImages, setClinicImages] = useState<File[]>([]);
  const [doctorImages, setDoctorImages] = useState<File[]>([]);
  // const supabase = createClient();
  const [formState, setFormState] = useState<{ message?: string; status?: string } | null>(null);

  const { data: surgeryList = [], isPending } = useQuery<Surgery[]>({
    queryKey: ["surgery_info"],
    queryFn: async () => {
      const { data, error } = await supabase.from("surgery_info").select("*");
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

  const handleModal = () => {
    if (formState?.status === "success") {
      router.refresh();
    }
    handleOpenModal();
  };

  // 선택된 치료 항목들을 surgeryList와 연결하는 함수
  const handleTreatmentSelectionChange = (selectedKeys: number[]) => {
    setSelectedTreatments(selectedKeys);
    console.log('선택된 치료 항목들:', selectedKeys);
    // 필요시 여기서 surgeryList 필터링이나 추가 처리 가능
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      // 선택된 치료 항목들을 formData에 추가
      if (selectedTreatments.length > 0) {
        formData.append('selected_treatments', JSON.stringify(selectedTreatments));
      }
      
      // 병원 이미지들을 formData에 추가
      clinicImages.forEach((file, index) => {
        formData.append(`clinic_image_${index}`, file);
      });
      
      // 의사 이미지들을 formData에 추가
      doctorImages.forEach((file, index) => {
        formData.append(`doctor_image_${index}`, file);
      });
      
      console.log('Form 제출 데이터:');
      console.log('- 선택된 치료 항목들:', selectedTreatments);
      console.log('- 좌표:', coordinates);
      console.log('- 위치:', selectedLocation);
      console.log('- 병원 이미지 개수:', clinicImages.length);
      console.log('- 의사 이미지 개수:', doctorImages.length);
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
  
      const result = await res.json();
      setFormState(result);
    } catch (error) {
      console.log("upload error", error);
      setFormState({ message: "업로드 중 오류가 발생했습니다.", status: "error" });
    }
  };

  if (isPending) return <LoadingSpinner backdrop />;

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
        <InputField label="searchkey" name="searchkey" required />
        <InputField label="search_key" name="search_key" required />
        <div className="w-full">
          <AddressSection 
            onSelectAddress={setAddress} 
            onSelectCoordinates={setCoordinates}
          />
        </div>
        <LocationSelect 
          onSelect={setSelectedLocation}
          selectedLocation={selectedLocation}
        />
        <div className="w-full">
          {/* <SurgeriesModal itemList={surgeryList} /> */}
          <TreatmentSelectBox 
            onSelectionChange={handleTreatmentSelectionChange}
            initialSelectedKeys={selectedTreatments}
          />
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
          </div>
        )}
      </div>
       {/* 영업시간 등록  */}
        {/* <div className="w-full">
        <h3 className="font-semibold mb-2">영업시간 날짜 시간 등록</h3> */}
        <OpeningHoursForm />
        {/* </div> */}
        <div className="w-full mt-4">
           <ExtraOptions/>
        </div>
      {/* 병원 이미지 업로드 */}
      <ImageUploadSection
        maxImages={clinicImageUploadLength}
        title="병원 이미지 등록"
        description={`- 병원 메인 이미지는 가로로 긴 직사각형(권장 비율: 16:9 또는 3:1)으로 업로드해 주세요.
  · 예시: 1600x900px(16:9) 또는 1800x600px(3:1)
  · 알림: 주어진 사진을 중앙을 기준으로 16:9 혹은 3:1 비율로 넘치는 부분이 자동으로 잘라집니다.
      사진이 비율보다 작으면 가로기준으로 비율을 맞춰서 자동으로 확대해서 화면에 맞춰줍니다.`}
        onFilesChange={setClinicImages}
        name="clinic_images"
        type="Banner"
      />

      {/* 의사 이미지 업로드 */}
      <ImageUploadSection
        maxImages={doctorImageUploadLength}
        title="의사 프로필 이미지 등록"
        description={`- 의사 프로필 이미지는 정사각형(1:1)으로 업로드해 주세요.
  · 예시: 권장해상도 500x500px
  · 알림: 주어진 사진을 중앙을 기준으로 1:1 비율로 넘치는 부분이 자동으로 잘라집니다.`}
        onFilesChange={setDoctorImages}
        name="doctor_images"
        type="Avatar"
      />

      
      <div className="flex justify-center mt-8 gap-8">
        <Button type="reset" color="red">cancel</Button>
        <Button color="blue" disabled={state.pending}>
          {state.pending ? "...submit" : "register"}
        </Button>
      </div>

      </form>

      <AlertModal onCancel={handleModal} open={open}>
        Upload Client Test error: {Array.isArray(formState?.message) ? formState?.message[0] : formState?.message}
      </AlertModal>
    </main>
  );
};

export default UploadClient;
