// "use client";

// import PageHeader from "@/components/PageHeader";
// import InputField from "@/components/InputField";
// import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";
// import Image from "next/image";
// import Button from "@/components/Button";
// import { uploadActions } from "./actions";
// import { SurgeriesModal } from "./modal";
// import { supabase } from "@/lib/supabaseClient";
// import { useQuery } from "@tanstack/react-query";
// import LoadingSpinner from "@/components/LoadingSpinner";
// import useModal from "@/hooks/useModal";
// import { AlertModal } from "@/components/modal";
// import { useRouter } from "next/navigation";
// import { useFormStatus } from "react-dom";
// import DaumPost from "@/components/DaumPost";
// import AddressSection from "@/components/AddressSection";
// import LocationSelect from "@/components/LocationSelect";
// import { TreatmentSelectBox } from "@/components/TreatmentSelectBox";

// interface Surgery {
//   created_at: string;
//   description: string;
//   id: number;
//   id_unique: number;
//   imageurls: string[];
//   name: string;
//   type: string;
// }

// const imageUploadLength = 6;

// const UploadClientLegacy = () => {
//   const state = useFormStatus();
//   const router = useRouter();
//   const ref = useRef<HTMLInputElement>(null);
//   const [address, setAddress] = useState("");
//   const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [selectedLocation, setSelectedLocation] = useState<{ key: string; label: string } | null>(null);
//   const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
//   // const supabase = createClient();
//   const [formState, setFormState] = useState<{ message?: string; status?: string } | null>(null);

//   const { data: surgeryList = [], isPending } = useQuery<Surgery[]>({
//     queryKey: ["surgery_info"],
//     queryFn: async () => {
//       const { data, error } = await supabase.from("surgery_info").select("*");
//       if (error) throw Error("surgery_info error");
//       return data;
//     },
//   });

//   const { handleOpenModal, open } = useModal();

//   useEffect(() => {
//     if (formState?.message) {
//       handleOpenModal();
//     }
//   }, [formState]);

//   const handleModal = () => {
//     if (formState?.status === "success") {
//       router.refresh();
//     }
//     handleOpenModal();
//   };

//   const [preview, setPreview] = useState<Array<string | undefined>>([]);
//   const [file, setFile] = useState<Array<File>>([]);

//   // const handleSubmit = async (formData: FormData) => {
//   //   try {
//   //     const result = await uploadActions(null, formData);
//   //     setFormState(result);
//   //   } catch (error) {
//   //     setFormState({ message: "업로드 중 오류가 발생했습니다.", status: "error" });
//   //   }
//   // };
//   const handleSubmit = async (formData: FormData) => {
//     try {
//       // 선택된 치료 항목들을 formData에 추가
//       if (selectedTreatments.length > 0) {
//         formData.append('selected_treatments', JSON.stringify(selectedTreatments));
//       }
      
//       console.log('Form 제출 데이터:');
//       console.log('- 선택된 치료 항목들:', selectedTreatments);
//       console.log('- 좌표:', coordinates);
//       console.log('- 위치:', selectedLocation);
      
//       const res = await fetch("/api/upload", {
//         method: "POST",
//         body: formData,
//       });
  
//       const result = await res.json();
//       setFormState(result);
//     } catch (error) {
//       console.log("upload error", error);
//       setFormState({ message: "업로드 중 오류가 발생했습니다.", status: "error" });
//     }
//   };

  
//   const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
//     const { files } = e.target;
//     if (!files) return;

//     const fileList = Array.from(files).slice(0, 6 - preview.length);
//     setFile(fileList);

//     fileList.forEach((file) => {
//       const fileReader = new FileReader();
//       fileReader.onload = () => {
//         const result = fileReader.result as string;
//         setPreview((prev) => prev.concat(result));
//       };
//       fileReader.readAsDataURL(file);
//     });
//   };

//   const handleDeletePreview = (e: MouseEvent<HTMLDivElement>, i: number) => {
//     e.preventDefault();
//     if (ref.current && ref.current.files) {
//       const dataTransfer = new DataTransfer();
//       const file = ref.current.files;
//       const fileId = (e.target as HTMLDivElement).id;
//       Array.from(file)
//         .filter((file) => file.lastModified !== +fileId)
//         .forEach((file) => {
//           dataTransfer.items.add(file);
//         });
//       ref.current.files = dataTransfer.files;
//     }
//     setPreview((prev) => prev.filter((e, idx) => i !== idx));
//   };

//   // 선택된 치료 항목들을 surgeryList와 연결하는 함수
//   const handleTreatmentSelectionChange = (selectedKeys: string[]) => {
//     setSelectedTreatments(selectedKeys);
//     console.log('선택된 치료 항목들:', selectedKeys);
//     // 필요시 여기서 surgeryList 필터링이나 추가 처리 가능
//   };

//   if (isPending) return <LoadingSpinner backdrop />;

//   return (
//     <main>
//       <PageHeader name="병원 정보를 입력하세요" />
//       {/* <form 
//         className={styles.form} 
//         action={handleSubmit}
//       > */}
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           const formData = new FormData(e.currentTarget);
//           handleSubmit(formData);
//         }}
//         className="my-8 mx-auto px-6"
//         style={{ width: '100vw', maxWidth: '1024px' }}
//       >
//       <div className="space-y-4 w-full">
//         <InputField label="clinic name" name="name" required />
//         <InputField label="searchkey" name="searchkey" required />
//         <InputField label="search_key" name="search_key" required />
//         <div className="w-full">
//           <AddressSection 
//             onSelectAddress={setAddress} 
//             onSelectCoordinates={setCoordinates}
//           />
//         </div>
//         <LocationSelect 
//           onSelect={setSelectedLocation}
//           selectedLocation={selectedLocation}
//         />
//         <div className="w-full">
//           <SurgeriesModal itemList={surgeryList} />
//           <TreatmentSelectBox 
//             onSelectionChange={handleTreatmentSelectionChange}
//             initialSelectedKeys={selectedTreatments}
//           />
//         </div>
        
//         {/* 디버깅 정보 표시 */}
//         {(selectedTreatments.length > 0 || coordinates || selectedLocation) && (
//           <div className="mt-4 p-4 bg-gray-100 rounded border">
//             <h3 className="font-semibold mb-2">선택된 정보:</h3>
//             {selectedLocation && (
//               <p className="text-sm"><strong>위치:</strong> {selectedLocation.label}</p>
//             )}
//             {coordinates && (
//               <p className="text-sm"><strong>좌표:</strong> 위도 {coordinates.latitude}, 경도 {coordinates.longitude}</p>
//             )}
//             {selectedTreatments.length > 0 && (
//               <p className="text-sm"><strong>선택된 치료 개수:</strong> {selectedTreatments.length}개</p>
//             )}
//           </div>
//         )}
//       </div>
//        {/* tune face
//         liposuction  */}
//       <div className="flex justify-between my-4">
//         <h2>- 병원 메인 이미지는 가로로 긴 직사각형(권장 비율: 16:9 또는 3:1)으로 업로드해 주세요.
//   · 예시: 1600x900px(16:9) 또는 1800x600px(3:1)
// - 의사 프로필 이미지는 정사각형(1:1)으로 업로드해 주세요.
//   · 예시: 500x500px</h2>
//         <p>등록 {preview.length}/{imageUploadLength}</p>
//       </div>


//       <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 w-full aspect-[1/1]">
//         {Array.from({ length: imageUploadLength }, (_, i) => (
//           <div className="relative mx-auto w-full" key={i}>
//             {preview[i] ? (
//               <div
//                 id={file[i]?.lastModified.toString()}
//                 className="absolute top-4 right-4 z-20 px-2 py-1 bg-black text-white cursor-pointer"
//                 onClick={(e) => handleDeletePreview(e, i)}
//               >
//                 삭제
//               </div>
//             ) : (
//               <label
//                 htmlFor="imageurls"
//                 className="flex items-center justify-center w-full h-full border border-black"
//               >
//                 이미지 업로드
//               </label>
//             )}
//             {preview[i] && (
//               <Image
//                 src={preview[i]}
//                 alt={`preview-${i}`}
//                 fill
//                 className=""
//               />
//             )}
//           </div>
//         ))}
//         <input
//           ref={ref}
//           id="imageurls"
//           multiple
//           name="imageurls"
//           accept="image/*"
//           type="file"
//           className="hidden"
//           onChange={handleUpload}
//         />
//       </div>

//       <div className="flex justify-center mt-8 gap-8">
//         <Button type="reset" color="red">cancel</Button>
//         <Button color="blue" disabled={state.pending}>
//           {state.pending ? "...submit" : "register"}
//         </Button>
//       </div>

//       </form>

//       <AlertModal onCancel={handleModal} open={open}>
//         Upload Client Test error: {Array.isArray(formState?.message) ? formState?.message[0] : formState?.message}
//       </AlertModal>
//     </main>
//   );
// };

// export default UploadClient;
