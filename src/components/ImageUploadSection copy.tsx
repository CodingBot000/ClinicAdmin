// 'use client';

// import React, { ChangeEvent, MouseEvent, useRef, useState, useEffect } from "react";
// import Image from "next/image";
// import { XCircleIcon } from "lucide-react";

// interface ImageUploadSectionProps {
//   maxImages: number;
//   title: string;
//   description?: string;
//   onFilesChange: (files: File[]) => void;
//   name: string;
//   type: 'Avatar' | 'Banner';
// }

// const DEFAULT_IMAGES = [
//   { label: "디폴트 남자", src: "/default/doctor_default_man.png", key: "man" },
//   { label: "디폴트 여자", src: "/default/doctor_default_woman.png", key: "woman" },
// ];

// const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
//   maxImages,
//   title,
//   description,
//   onFilesChange,
//   name,
//   type,
// }) => {
//   const ref = useRef<HTMLInputElement>(null);
//   const [preview, setPreview] = useState<Array<string | undefined>>([]);
//   const [files, setFiles] = useState<Array<File>>([]);

//   // Avatar용 default 이미지 체크 상태
//   const [defaultChecked, setDefaultChecked] = useState<{ man: boolean; woman: boolean }>({
//     man: false,
//     woman: false,
//   });

//   // Avatar 타입은 추가 버튼을 통해 동적으로 업로드 영역 추가
//   const [avatarCount, setAvatarCount] = useState(1);

//   // Avatar 추가 버튼, Banner는 maxImages
//   const slots = type === "Avatar" ? avatarCount : maxImages;

//   // default 이미지 체크 시 업로드/추가 버튼 비활성화
//   const disableUpload = type === "Avatar" && (defaultChecked.man || defaultChecked.woman);

//   // Banner는 미리보기 개수로 제한, Avatar는 무제한
//   useEffect(() => {
//     onFilesChange(files);
//   }, [files, onFilesChange]);

//   // 파일 업로드 처리
//   const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
//     const { files: selectedFiles } = e.target;
//     if (!selectedFiles || disableUpload) return;

//     // Avatar는 개수 제한 없이 추가, Banner는 maxImages - preview.length
//     const allowedCount =
//       type === "Avatar"
//         ? selectedFiles.length // Avatar는 한번에 여러장도 허용 (필요시 1장으로 고정 가능)
//         : maxImages - preview.length;

//     const fileList = Array.from(selectedFiles).slice(0, allowedCount);
//     setFiles((prev) => [...prev, ...fileList]);

//     fileList.forEach((file) => {
//       const fileReader = new FileReader();
//       fileReader.onload = () => {
//         const result = fileReader.result as string;
//         setPreview((prev) => prev.concat(result));
//       };
//       fileReader.readAsDataURL(file);
//     });
//   };

//   // 미리보기/파일 삭제
//   const handleDeletePreview = (e: MouseEvent<HTMLDivElement>, i: number) => {
//     e.preventDefault();

//     // input 파일에서도 삭제
//     if (ref.current && ref.current.files) {
//       const dataTransfer = new DataTransfer();
//       const fileList = ref.current.files;
//       const fileId = (e.target as HTMLDivElement).id;
//       Array.from(fileList)
//         .filter((file) => file.lastModified !== +fileId)
//         .forEach((file) => {
//           dataTransfer.items.add(file);
//         });
//       ref.current.files = dataTransfer.files;
//     }

//     setPreview((prev) => prev.filter((_, idx) => i !== idx));
//     setFiles((prev) => prev.filter((_, idx) => i !== idx));
//     if (type === "Avatar") setAvatarCount((c) => Math.max(1, c - 1));
//   };

//   // Avatar에서 추가 버튼
//   const handleAddAvatar = () => {
//     if (disableUpload) return;
//     setAvatarCount((c) => c + 1);
//   };

//   // Default 이미지 체크박스 핸들러
//   const handleDefaultChange = (key: "man" | "woman") => (
//     e: ChangeEvent<HTMLInputElement>
//   ) => {
//     const checked = e.target.checked;
//     setDefaultChecked((prev) => ({ ...prev, [key]: checked }));

//     if (checked) {
//       // 선택시 미리보기/파일/슬롯 모두 리셋
//       setPreview([DEFAULT_IMAGES.find((img) => img.key === key)!.src]);
//       setFiles([]);
//       setAvatarCount(1);
//     } else {
//       // 체크 해제시 모두 리셋
//       setPreview([]);
//       setFiles([]);
//       setAvatarCount(1);
//     }
//   };

//   // Banner grid, Avatar flex
//   const gridClass =
//     type === "Banner"
//       ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 w-full"
//       : "flex flex-row gap-4 flex-wrap";

//   return (
//     <div className="w-full">
//       <div className="flex justify-between my-4">
//         <div>
//           <h2 className="font-semibold text-lg mb-2">{title}</h2>
//           {description && (
//             <div className="text-sm text-gray-600 whitespace-pre-line">
//               {description}
//             </div>
//           )}
//         </div>
//         {type === "Banner" && (
//           <p className="text-sm">등록 {preview.length}/{maxImages}</p>
//         )}
//         {type === "Avatar" && (
//           <p className="text-sm">등록 {preview.length}</p>
//         )}
//       </div>

//       {/* Avatar 타입일 때만 default 체크박스 + 이미지 */}
//       {type === "Avatar" && (
//         <div className="flex flex-row items-center gap-6 mb-3">
//           {DEFAULT_IMAGES.map((img) => (
//             <label key={img.key} className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={defaultChecked[img.key as "man" | "woman"]}
//                 onChange={handleDefaultChange(img.key as "man" | "woman")}
//                 disabled={disableUpload && !defaultChecked[img.key as "man" | "woman"]}
//               />
//               <Image src={img.src} alt={img.label} width={36} height={36} className="rounded-full border" />
//               <span className="text-xs">{img.label}</span>
//             </label>
//           ))}
//         </div>
//       )}

//       <div className={gridClass}>
//         {Array.from({ length: slots }, (_, i) => (
//           <div
//             key={i}
//             className={
//               type === "Avatar"
//                 ? "relative w-[100px] h-[100px] bg-gray-100 flex items-center justify-center rounded-full overflow-hidden"
//                 : "relative w-full aspect-[16/9] bg-gray-100 flex items-center justify-center rounded-fulloverflow-hidden"
//             }
//           >
       
//             {preview[i] ? (
//        !(defaultChecked.man || defaultChecked.woman) && (
//         <button
//           type="button"
//           onClick={(e) => handleDeletePreview(e as any, i)}
//           className="
//             absolute top-1 right-1 z-20 
//             opacity-60 hover:opacity-100 
//             transition-opacity
//             cursor-pointer
//             rounded-full
//             p-0.5
//           "
//           style={disableUpload ? { pointerEvents: "none", opacity: 0.5 } : {}}
//           tabIndex={-1}
//         >
//           <XCircleIcon color="black" size={24} strokeWidth={2.5} className="drop-shadow" />
//         </button>
//       )
//             ) : !disableUpload ? (
//               <label
//                 htmlFor={`${name}-upload`}
//                 className="flex items-center justify-center w-full h-full cursor-pointer"
//               >
//                 <span className="text-gray-500">이미지 업로드</span>
//               </label>
//             ) : (
//               // default이미지 표시
//               <></>
//             )}
//             {preview[i] && (
//               <Image
//                 src={preview[i]}
//                 alt={`preview-${i}`}
//                 fill={type === "Banner" ? true : false}
//                 width={type === "Avatar" ? 100 : undefined}
//                 height={type === "Avatar" ? 100 : undefined}
//                 className="object-cover rounded-full"
//                 style={type === "Avatar" ? { width: 100, height: 100 } : undefined}
//               />
//             )}
//           </div>
//         ))}

//         {/* Avatar일 때만 추가 버튼(디폴트 이미지 선택시 비활성) */}
//         {type === "Avatar" && !disableUpload && (
//           <button
//             type="button"
//             onClick={handleAddAvatar}
//             className="w-[100px] h-[100px] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center rounded-full text-4xl text-gray-400 hover:border-blue-500 transition"
//           >
//             +
//             {/* <span className="text-base mt-2">추가</span> */}
//           </button>
//         )}

//         <input
//           ref={ref}
//           id={`${name}-upload`}
//           multiple
//           name={name}
//           accept="image/*"
//           type="file"
//           className="hidden"
//           onChange={handleUpload}
//           disabled={disableUpload}
//         />
//       </div>
//     </div>
//   );
// };

// export default ImageUploadSection;
