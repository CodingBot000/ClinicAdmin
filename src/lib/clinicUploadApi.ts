// import { supabase } from "./supabaseClient";
// import { WizardFormData } from "@/types/clinicUpload";
// import { TABLE_HOSPITAL, TABLE_HOSPITAL_DETAIL, TABLE_DOCTOR, TABLE_HOSPITAL_BUSINESS_HOUR, TABLE_HOSPITAL_TREATMENT, STORAGE_HOSPITAL_IMG, STORAGE_DOCTOR_IMG } from "@/constants/tables";
// import { DoctorInfo } from "@/components/DoctorInfoForm";

// export async function saveBasicInfo(data: Partial<WizardFormData>) {
//   const { basicInfo, address, location, id_uuid } = data;
  
//   if (!id_uuid) throw new Error("Hospital UUID is required");

//   const hospitalData = {
//     id_uuid,
//     name: basicInfo?.name,
//     email: basicInfo?.email,
//     tel: basicInfo?.tel,
//     ...address,
//     location: location?.key,
//   };

//   if (data.isEditMode) {
//     return await supabase
//       .from(TABLE_HOSPITAL)
//       .update(hospitalData)
//       .eq('id_uuid', id_uuid);
//   } else {
//     return await supabase
//       .from(TABLE_HOSPITAL)
//       .insert([hospitalData]);
//   }
// }

// export async function saveOpeningHours(data: Partial<WizardFormData>) {
//   const { businessHours, id_uuid } = data;
  
//   if (!id_uuid || !businessHours) throw new Error("Required data missing");

//   // 기존 데이터 삭제
//   await supabase
//     .from(TABLE_HOSPITAL_BUSINESS_HOUR)
//     .delete()
//     .eq('id_uuid_hospital', id_uuid);

//   // 영업시간 데이터 생성
//   const businessHourInserts = businessHours.openingHours.map(hour => ({
//     id_uuid_hospital: id_uuid,
//     day_of_week: hour.day,
//     open_time: hour.from ? `${hour.from.hour}:${hour.from.minute}` : null,
//     close_time: hour.to ? `${hour.to.hour}:${hour.to.minute}` : null,
//     status: hour.open ? 'open' : hour.closed ? 'closed' : 'ask'
//   }));

//   return await supabase
//     .from(TABLE_HOSPITAL_BUSINESS_HOUR)
//     .insert(businessHourInserts);
// }

// export async function saveImagesAndDoctors(data: Partial<WizardFormData>) {
//   const { imagesAndDoctors, id_uuid } = data;
  
//   if (!id_uuid || !imagesAndDoctors) throw new Error("Required data missing");

//   // 병원 이미지 업로드
//   const clinicImageUrls: string[] = [];
//   for (const image of imagesAndDoctors.clinicImages) {
//     const fileName = `${id_uuid}/${Date.now()}-${image.name}`;
//     const { data: uploadData, error: uploadError } = await supabase.storage
//       .from(STORAGE_HOSPITAL_IMG)
//       .upload(fileName, image);

//     if (uploadError) {
//       console.error('병원 이미지 업로드 실패:', uploadError);
//       throw uploadError;
//     }

//     const { data: { publicUrl } } = supabase.storage
//       .from(STORAGE_HOSPITAL_IMG)
//       .getPublicUrl(fileName);

//     clinicImageUrls.push(publicUrl);
//   }

//   // 병원 이미지 URL 업데이트
//   if (clinicImageUrls.length > 0) {
//     const { error: updateError } = await supabase
//       .from(TABLE_HOSPITAL)
//       .update({ imageurls: clinicImageUrls })
//       .eq('id_uuid', id_uuid);

//     if (updateError) {
//       console.error('병원 이미지 URL 업데이트 실패:', updateError);
//       throw updateError;
//     }
//   }

//   // 기존 의사 정보 삭제
//   await supabase
//     .from(TABLE_DOCTOR)
//     .delete()
//     .eq('id_uuid_hospital', id_uuid);

//   // 의사 정보 및 이미지 저장
//   for (const doctor of imagesAndDoctors.doctors) {
//     let imageUrl = '';

//     // 의사 이미지 업로드 (새로운 이미지가 있는 경우)
//     if (doctor.imageFile) {
//       const fileName = `${id_uuid}/${Date.now()}-${doctor.imageFile.name}`;
//       const { data: uploadData, error: uploadError } = await supabase.storage
//         .from(STORAGE_DOCTOR_IMG)
//         .upload(fileName, doctor.imageFile);

//       if (uploadError) {
//         console.error('의사 이미지 업로드 실패:', uploadError);
//         throw uploadError;
//       }

//       const { data: { publicUrl } } = supabase.storage
//         .from(STORAGE_DOCTOR_IMG)
//         .getPublicUrl(fileName);

//       imageUrl = publicUrl;
//     } else if (doctor.useDefaultImage && doctor.defaultImageType) {
//       // 기본 이미지 사용
//       imageUrl = `/default/doctor_default_${doctor.defaultImageType}.png`;
//     } else if (doctor.originalImageUrl) {
//       // 기존 이미지 URL 유지
//       imageUrl = doctor.originalImageUrl;
//     }

//     // 의사 정보 저장
//     const { error: insertError } = await supabase
//       .from(TABLE_DOCTOR)
//       .insert([{
//         id_uuid_hospital: id_uuid,
//         name: doctor.name,
//         bio: doctor.bio,
//         image_url: imageUrl,
//         chief: doctor.isChief ? 1 : 0,
//         specialties: doctor.specialties
//       }]);

//     if (insertError) {
//       console.error('의사 정보 저장 실패:', insertError);
//       throw insertError;
//     }
//   }

//   return { data: { clinicImageUrls }, error: null };
// }

// export async function saveTreatments(data: Partial<WizardFormData>) {
//   const { treatments, id_uuid } = data;
  
//   if (!id_uuid || !treatments) throw new Error("Required data missing");

//   // 기존 데이터 삭제
//   await supabase
//     .from(TABLE_HOSPITAL_TREATMENT)
//     .delete()
//     .eq('id_uuid_hospital', id_uuid);

//   // 시술 데이터 생성
//   const treatmentInserts = treatments.selectedTreatments.map(treatmentId => ({
//     id_uuid_hospital: id_uuid,
//     id_treatment: treatmentId
//   }));

//   return await supabase
//     .from(TABLE_HOSPITAL_TREATMENT)
//     .insert(treatmentInserts);
// }

// export async function saveLanguagesAndFeedback(data: Partial<WizardFormData>) {
//   const { languagesAndFeedback, id_uuid } = data;
  
//   if (!id_uuid || !languagesAndFeedback) throw new Error("Required data missing");

//   const updateData = {
//     available_languages: languagesAndFeedback.availableLanguages,
//     feedback: languagesAndFeedback.feedback
//   };

//   return await supabase
//     .from(TABLE_HOSPITAL_DETAIL)
//     .upsert({
//       id_uuid_hospital: id_uuid,
//       ...updateData
//     });
// }