"use server";

import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { getTimestamp } from '@/utils/address/getTimeStamp';
import { makeUploadImageFileName } from '@/utils/makeUploadImageFileName';

export const uploadActions = async (prevState: any, formData: FormData) => {
  // const supabase = createClient();
// const TABLE_HOSPITAL = "hospital";
// const TABLE_DOCTOR = "doctor";
// const TABLE_HOSPITAL_DETAIL = "hospital_details";
// const TABLE_HOSPITAL_TREATMENT = "hospital_treatment";
// const TABLE_HOSPITAL_BUSINESS_HOUR = "hospital_business_hour";
const TABLE_HOSPITAL = "hospital_test";
const TABLE_DOCTOR = "doctor_test";
const TABLE_HOSPITAL_DETAIL = "hospital_details_test";
const TABLE_HOSPITAL_TREATMENT = "hospital_treatment_test";
const TABLE_HOSPITAL_BUSINESS_HOUR = "hospital_business_hour_test";
const STORAGE_IMAGES = "images";
const STORAGE_HOSPITAL_IMG = "hospitalimg";
const STORAGE_DOCTOR_IMG = "doctor";


  const name = formData.get("name") as string;
  const surgeries = formData.get("surgeries") as string;
  const searchkey = formData.get("searchkey") as string;
  const search_key = formData.get("search_key") as string;
  // const address = formData.get("address") as string;

  const address_full_road = formData.get("address_full_road") as string;
  const address_full_road_en = formData.get("address_full_road_en") as string;
  const address_full_jibun = formData.get("address_full_jibun") as string;
  const address_full_jibun_en = formData.get("address_full_jibun_en") as string;
  const address_si = formData.get("address_si") as string;
  const address_si_en = formData.get("address_si_en") as string;
  const address_gu = formData.get("address_gu") as string;
  const address_gu_en = formData.get("address_gu_en") as string;
  const address_dong = formData.get("address_dong") as string;
  const address_dong_en = formData.get("address_dong_en") as string;
  const zipcode = formData.get("zipcode") as string;
  const latitudeRaw = formData.get("latitude") as string;
  const longitudeRaw = formData.get("longitude") as string;
  const address_detail = formData.get("address_detail") as string;
  const address_detail_en = formData.get("address_detail_en") as string;

  // 숫자 필드는 파싱해줘야 안전합니다!
  const latitude = latitudeRaw ? Number(latitudeRaw) : undefined;
  const longitude = longitudeRaw ? Number(longitudeRaw) : undefined;


  // const address_detail = formData.get("address_detail") as string; 
  //  const latitude = formData.get("latitude") as string;
  // const longitude = formData.get("longitude") as string;
  const location = formData.get("location") as string;
  // const selected_treatments = formData.get("selected_treatments") as string;
  const selected_treatments = (formData.get("selected_treatments") as string).split(",").map((treatment: string) => treatment.trim());
  const opening_hours_raw = formData.get("opening_hours") as string;
  const extra_options_raw = formData.get("extra_options") as string;
  const treatment_options_raw = formData.get("treatment_options") as string;
  
  // treatment_options JSON 파싱
  let treatment_options_parsed = [];
  if (treatment_options_raw) {
    try {
      treatment_options_parsed = JSON.parse(treatment_options_raw);
      console.log("🔧 파싱된 treatment_options:", treatment_options_parsed);
    } catch (error) {
      console.error("treatment_options 파싱 실패:", error);
      return {
        ...prevState,
        message: "상품옵션 데이터 파싱에 실패했습니다.",
        status: "error",
      };
    }
  }

  // opening_hours JSON 파싱
  let opening_hours_parsed;
  try {
    opening_hours_parsed = JSON.parse(opening_hours_raw);
  } catch (error) {
    console.error("opening_hours 파싱 실패:", error);
    return {
      ...prevState,
      message: "영업시간 데이터 파싱에 실패했습니다.",
      status: "error",
    };
  }

  // opening_hours_parsed가 null이거나 배열이 아닌 경우 기본값 설정
  if (!opening_hours_parsed || !Array.isArray(opening_hours_parsed)) {
    console.warn("⚠️ opening_hours 데이터가 올바르지 않습니다:", opening_hours_parsed);
    opening_hours_parsed = []; // 빈 배열로 초기화
  }

  console.log("🔧 파싱된 opening_hours (배열):", opening_hours_parsed);
  
  // extra_options JSON 파싱 및 boolean 변환
  let extra_options_parsed;
  try {
    extra_options_parsed = JSON.parse(extra_options_raw);
  } catch (error) {
    console.error("extra_options 파싱 실패:", error);
    return {
      ...prevState,
      message: "추가 옵션 데이터 파싱에 실패했습니다.",
      status: "error",
    };
  }

  // string을 boolean으로 변환하는 헬퍼 함수
  const stringToBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
  };

  const extra_options = {
    private_recovery: stringToBoolean(extra_options_parsed.private_recovery),
    parking: stringToBoolean(extra_options_parsed.parking),
    cctv: stringToBoolean(extra_options_parsed.cctv),
    night_consult: stringToBoolean(extra_options_parsed.night_consult),
    female_doctor: stringToBoolean(extra_options_parsed.female_doctor),
    anesthesiologist: stringToBoolean(extra_options_parsed.anesthesiologist),
    specialistCount: parseInt(extra_options_parsed.specialistCount) || 0,
  };

  console.log("🔧 변환된 opening_hours (배열):", opening_hours_parsed);
  console.log("🔧 변환된 extra_options:", extra_options);
  
  const clinicImages = formData.getAll("clinicImages");
  const doctorImages = formData.getAll("doctorImages");

  // const imageurls = formData.getAll("imageurls");
  const id_uuid = uuidv4(); // 병원 고유 id 
  




console.log("uploadActions") 
/// 병원 전경 이미지 업로드 하기 
const hospitalFileNames = await Promise.all(
  clinicImages
    .filter((entry) => entry instanceof File)
    .map(async (e) => {

       // 업로드 경로
       const filename = makeUploadImageFileName(id_uuid, name, e.name);
       const path = `hospitalimg/${id_uuid}/${filename}`;
      const upload = await supabase.storage
        .from(STORAGE_IMAGES)
        .upload(path, e);

      if (upload.error) {
        console.log("uploadActions filenames upload.error: ", upload.error) ;
        return {
          ...prevState,
          message: upload.error.message,
          status: "error",
        };
      }
      console.log("uploadActions filenames return") ;
      return `${process.env.NEXT_PUBLIC_IMG_URL}${upload.data?.path}`;
    })
);

if (hospitalFileNames.find((e) => e.message)) {
  console.log("uploadActions -a hospitalFileNames.find error: ", hospitalFileNames[0].message) ;
  return {
    ...prevState,
    message: hospitalFileNames[0].message,
    status: "error",
  };
}
/// 병원 전경 이미지 업로드 하기  끝



// legacy id . 나중에 id_uuid로 완전전환후 삭제해야됨 
const lastUnique = await supabase
  .from(TABLE_HOSPITAL)
  .select("id_unique")
  .order("id_unique", { ascending: false })
  .limit(1);

if (!lastUnique.data || lastUnique.error) {
  console.log("uploadActions -b") ;
  return {
    ...prevState,
    message: lastUnique.error.code || lastUnique.error.message,
    status: "error",
  };
}
// legacy id . 나중에 id_uuid로 완전전환후 삭제해야됨  끝

const nextIdUnique = (lastUnique.data && lastUnique.data.length > 0)
  ? lastUnique.data[0].id_unique + 1
  : 0;
const id_surgeries = (surgeries && surgeries.length > 0) ? surgeries.split(",") : [1010];
const form_hospital = {
  id_unique: nextIdUnique,  // legacy id  나중에 삭제 
  id_uuid,
  name,
  id_surgeries: id_surgeries,
  searchkey: name,
  search_key: name,

  address_full_road,
  address_full_road_en,
  address_full_jibun,
  address_full_jibun_en,
  address_si,
  address_si_en,
  address_gu,
  address_gu_en,
  address_dong,
  address_dong_en,
  zipcode,
  latitude,
  longitude,
  address_detail,
  address_detail_en,
  location,
  imageurls: hospitalFileNames,
};

const insertHospital = await supabase
  .from(TABLE_HOSPITAL)
  .insert(form_hospital)
  .select("*");

const removeStorageImg = async () => {
  console.log("uploadActions removeStorageImg");
  const filenames = clinicImages.filter((entry) => entry instanceof File);

  const remove = await supabase.storage
    .from(STORAGE_IMAGES)
    .remove(filenames.map((e) => `hospitalimg/${id_uuid}/${e.name}`));

  const error = remove.error || insertHospital.error;

  if (error) {
    console.log("uploadActions removeStorageImg error : ", error);
    return {
      ...prevState,
      message: error.message,
      status: "error",
    };
  }
} 

console.log("uploadActions insertHospital error 1 : ", insertHospital.error);
if (insertHospital.error) {
  // error 발생 시 업로드 했더 이미지 삭제
  removeStorageImg();
  console.log("uploadActions insertHospital error 2 : ", insertHospital.error);
  return {
    ...prevState,
    message: insertHospital.error.message,
    status: "error",
  };
}


///////////////////////////////
// doctor 테이블 입력 

// doctor 테이블
// 컬럼   id_uuid : uuid  doctor테이블의 고유 uuid  자동생성
// hospital_id :int4    비워두기 
// hospital_id_uuid : uuid     병원의 uuid 
// image_url  : text[]  의사 이미지 경로 
const doctorFileNames = await Promise.all(
  doctorImages
    .filter((entry) => entry instanceof File)
    .map(async (e) => {
      
      // const timestamp = getTimestamp();
      //  const fileExt = e.name.split('.').pop();
      //  //병원 이름 가공 (예시: 영문, 숫자, 언더스코어만)
      //  const safeName = name.replace(/[^a-zA-Z0-9_]/g, '');
      //  // 새 파일명
      //  const filename = `${id_uuid}_${safeName}_${timestamp}.${fileExt}`;
       const filename = makeUploadImageFileName(id_uuid, name, e.name);
       // 업로드 경로
       const path = `doctor/${id_uuid}/${filename}`;
      const upload = await supabase.storage
        .from(STORAGE_IMAGES)
        .upload(path, e);

      if (upload.error) {
        console.log("uploadActions doctorFileNames upload.error: ", upload.error) ;
        return {
          ...prevState,
          message: upload.error.message,
          status: "error",
        };
      }
      console.log("uploadActions doctorFileNames return") ;
      return `${process.env.NEXT_PUBLIC_IMG_URL}${upload.data?.path}`;
    })
);

if (doctorFileNames.find((e) => e.message)) {
  console.log("uploadActions -a filenames.find error: ", doctorFileNames[0].message) ;
  return {
    ...prevState,
    message: doctorFileNames[0].message,
    status: "error",
  };
}


const form_doctor = {
  hospital_id: 0,
  id_uuid_hospital: id_uuid,
  image_url: doctorFileNames,
  bio: "약력",
  name: "이름",
  // position: "직책",
  // id_surgeries: surgeries.split(","),
};

const insertDoctor = await supabase
  .from(TABLE_DOCTOR)
  .insert(form_doctor)
  .select("*");

const removeStorageDoctorImg = async () => {
  console.log("uploadActions removeStorageDoctorImg");
  const filenames = doctorImages.filter((entry) => entry instanceof File);

  const remove = await supabase.storage
    .from(STORAGE_IMAGES)
    .remove(filenames.map((e) => `doctor/${id_uuid}/${e.name}`));

  const error = remove.error || insertDoctor.error;

  if (error) {
    console.log("uploadActions removeStorageDoctorImg error : ", error);
    return {
      ...prevState,
      message: error.message,
      status: "error",
    };
  }
} 

console.log("uploadActions insertDoctor error 1 : ", insertDoctor.error);
if (insertDoctor.error) {
  // error 발생 시 업로드 했더 이미지 삭제
  removeStorageDoctorImg();
  console.log("uploadActions insertDoctor error 2 : ", insertDoctor.error);
  return {
    ...prevState,
    message: insertDoctor.error.message,
    status: "error",
  };
}




///////////////////////////////
// openning hour  선택 테이블 입력 

// 각 요일별로 개별 레코드 생성 및 insert
const businessHourInserts = [];

for (let i = 0; i < opening_hours_parsed.length; i++) {
  const hour = opening_hours_parsed[i];
  
  // from과 to를 시간 문자열로 변환 (HH:MM 형식)
  const openTime = hour.from ? `${hour.from.hour.toString().padStart(2, '0')}:${hour.from.minute.toString().padStart(2, '0')}` : null;
  const closeTime = hour.to ? `${hour.to.hour.toString().padStart(2, '0')}:${hour.to.minute.toString().padStart(2, '0')}` : null;
  
  let status = '';
if (hour.open) {
  status = 'open';
} else if (hour.closed) {
  status = 'closed';
} else if (hour.ask) {
  status = 'ask';
}


  const form_business_hour = {
    id_uuid_hospital: id_uuid,
    day_of_week: hour.day || '',
    open_time: openTime,
    close_time: closeTime,
    status: status,
  };
  
  businessHourInserts.push(form_business_hour);
}

console.log("🕒 영업시간 데이터:", businessHourInserts);

// 모든 영업시간 데이터를 한 번에 insert
const insertBusinessHour = await supabase
  .from(TABLE_HOSPITAL_BUSINESS_HOUR)
  .insert(businessHourInserts)
  .select("*");

if (insertBusinessHour.error) {
  console.log("uploadActions error 3 : ", insertBusinessHour.error);
  // removeStorageImg();

  return {
    ...prevState,
    message: insertBusinessHour.error.message,
    status: "error",
  };
}





///////////////////////////////
// treatment 선택 테이블 입력 

// const doctorFileNames = await Promise.all(
//   doctorImages
//     .filter((entry) => entry instanceof File)

//        const filename = makeUploadImageFileName(id_uuid, name, e.name);
//        // 업로드 경로
//        const path = `doctor/${id_uuid}/${filename}`;
//       const upload = await supabase.storage
//         .from("images")
//         .upload(path, e);

//       if (upload.error) {
//         console.log("uploadActions doctorFileNames upload.error: ", upload.error) ;
//         return {
//           ...prevState,
//           message: upload.error.message,
//           status: "error",
//         };
//       }
//       console.log("uploadActions doctorFileNames return") ;
//       return `${process.env.NEXT_PUBLIC_IMG_URL}${upload.data?.path}`;
//     })
// // );

// if (doctorFileNames.find((e) => e.message)) {
//   console.log("uploadActions -a filenames.find error: ", doctorFileNames[0].message) ;
//   return {
//     ...prevState,
//     message: doctorFileNames[0].message,
//     status: "error",
//   };
// }


// const form_doctor = {
//   0,
//   id_uuid,
//   image_url: doctorFileNames,
//   bio: "약력",
//   name: "이름",
//   // position: "직책",
//   // id_surgeries: surgeries.split(","),
  
// };

// const insertDoctor = await supabase
//   .from("doctor")
//   .insert(form_doctor)
//   .select("*");

// const removeStorageDoctorImg = async () => {
//   console.log("uploadActions removeStorageDoctorImg");
//   const filenames = doctorImages.filter((entry) => entry instanceof File);

//   const remove = await supabase.storage
//     .from("images")
//     .remove(filenames.map((e) => `doctor/${id_uuid}/${e.name}`));

//   const error = remove.error || insertDoctor.error;

//   if (error) {
//     console.log("uploadActions removeStorageDoctorImg error : ", error);
//     return {
//       ...prevState,
//       message: error.message,
//       status: "error",
//     };
//   }
// } 

// console.log("uploadActions insertDoctor error 1 : ", insertDoctor.error);
// if (insertDoctor.error) {
//   // error 발생 시 업로드 했더 이미지 삭제
//   removeStorageDoctorImg();
//   console.log("uploadActions insertDoctor error 2 : ", insertDoctor.error);
//   return {
//     ...prevState,
//     message: insertDoctor.error.message,
//     status: "error",
//   };
// }









///////////////////////////////
// hospital_details 테이블 입력 
// extra options 포함
 


const hospitalDetailDefaultValue = (id_unique: string) => ({
  id_hospital: id_unique,
  id_uuid_hospital: id_uuid,
  tel: "0507-1433-0210",
  kakaotalk: "",
  homepage: "http://www.reoneskin.com",
  instagram: "https://www.instagram.com/reone__clinic/",
  facebook: "",
  blog: "https://blog.naver.com/reone21",
  youtube: "https://www.youtube.com/watch?v=Yaa1HZJXIJY",
  ticktok:
    "https://www.tiktok.com/@vslineclinicglobal/video/7255963489192168711?is_from_webapp=1&sender_device=pc&web_id=7373256937738012176",
  snapchat: "",
  map: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.348038374547!2d127.02511807637043!3d37.52329227204984!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca39ea4618cdb%3A0xd0ad0677746be4c7!2z7Jyg7KeE7Iqk7J2Y7JuQ!5e0!3m2!1sko!2skr!4v1716566609639!5m2!1sko!2skr",
  desc_address: "327, Dosan-daero, Gangnam-gu, Seoul, Republic of Korea",
  desc_openninghour: `
    MON
    10:00 - 19:00
    13:00 - 14:00 BreakTime
    TUE
    10:00 - 19:00
    13:00 - 14:00 BreakTime
    WED
    10:00 - 19:00
    13:00 - 14:00 BreakTime
    THU
    10:00 - 19:00
    13:00 - 14:00 BreakTime
    FRI
    10:00 - 19:00
    13:00 - 14:00 BreakTime
    SAT
    10:00 - 16:00
    SUN
    Regular holiday (Event Week SunDay)
  `,
  desc_facilities:
    "Separate Male/Female Restrooms, Wireless Internet, Parking, Valet Parking",
  desc_doctors_imgurls: [
    // "https://tqyarvckzieoraneohvv.supabase.co/storage/v1/object/public/images/doctors/doctor_reone1.png",
    // "https://tqyarvckzieoraneohvv.supabase.co/storage/v1/object/public/images/doctors/doctor_reone2.png",
    // "https://tqyarvckzieoraneohvv.supabase.co/storage/v1/object/public/images/doctors/doctor_reone3.png",
  ],
  etc: "",
  has_private_recovery_room: extra_options.private_recovery,
  has_parking: extra_options.parking,
  has_cctv: extra_options.cctv, 
  has_night_counseling: extra_options.night_consult,
  has_female_doctor: extra_options.female_doctor,
  has_anesthesiologist: extra_options.anesthesiologist,
  specialist_count: extra_options.specialistCount,
});


const { error } = await supabase
  .from(TABLE_HOSPITAL_DETAIL)
  // .insert([hospitalDetailDefaultValue(id_uuid)]);
  .insert([hospitalDetailDefaultValue(insertHospital.data[0].id_unique)]);

if (error) {
  console.log("uploadActions error 3 : ", error);
  removeStorageImg();

  return {
    ...prevState,
    message: error.message,
    status: "error",
  };
}

///////////////////////////////
// hospital_treatment 테이블 입력 (상품옵션)

if (treatment_options_parsed.length > 0) {
  console.log("💊 시술 상품옵션 데이터 처리 시작");
  
  // treatment 테이블에서 code와 id_uuid 매핑 데이터 가져오기
  const { data: treatmentData, error: treatmentError } = await supabase
    .from('treatment')
    .select('code, id_uuid');
  
  if (treatmentError) {
    console.error("treatment 테이블 조회 실패:", treatmentError);
    removeStorageImg();
    return {
      ...prevState,
      message: "시술 데이터 조회에 실패했습니다.",
      status: "error",
    };
  }
  
  // code를 키로 하는 매핑 맵 생성
  const codeToUuidMap = new Map();
  treatmentData?.forEach((treatment: any) => {
    codeToUuidMap.set(treatment.code, treatment.id_uuid);
  });
  
  console.log("🗂️ 시술 코드 매핑 맵:", Object.fromEntries(codeToUuidMap));
  
  // hospital_treatment 테이블에 insert할 데이터 준비
  const hospitalTreatmentInserts = [];
  
  for (const option of treatment_options_parsed) {
    const treatmentUuid = codeToUuidMap.get(option.treatmentKey);
    
    if (!treatmentUuid) {
      console.warn(`⚠️ 시술 코드 ${option.treatmentKey}에 해당하는 UUID를 찾을 수 없습니다.`);
      continue;
    }
    
    const hospitalTreatmentData = {
      id_uuid_hospital: id_uuid,
      id_uuid_treatment: treatmentUuid,
      option_value: option.value1 || "", // 상품명
      price: parseInt(option.value2) || 0, // 가격
      discount_price: 0, // 디폴트 0
      price_expose: 0, // 디폴트 0
    };
    
    hospitalTreatmentInserts.push(hospitalTreatmentData);
  }
  
  console.log("📋 hospital_treatment insert 데이터:", hospitalTreatmentInserts);
  
  if (hospitalTreatmentInserts.length > 0) {
    const { error: hospitalTreatmentError } = await supabase
      .from(TABLE_HOSPITAL_TREATMENT)
      .insert(hospitalTreatmentInserts);
    
    if (hospitalTreatmentError) {
      console.log("uploadActions hospital_treatment error:", hospitalTreatmentError);
      removeStorageImg();
      
      return {
        ...prevState,
        message: hospitalTreatmentError.message,
        status: "error",
      };
    }
    
    console.log("✅ hospital_treatment 데이터 insert 완료");
  }
}

revalidatePath("/", "layout");
console.log("uploadActions No error uploadActions ");
return {
  ...prevState,
  message: "success upload!",
  status: "success",
};
};


  

// console.log("uploadActions") 
//   const filenames = await Promise.all(
//     imageurls
//       .filter((entry) => entry instanceof File)
//       .map(async (e) => {
//         const upload = await supabase.storage
//           .from("images")
//           .upload(`hospitalimg/${e.name}`, e);

//         if (upload.error) {
//           console.log("uploadActions filenames upload.error: ", upload.error) ;
//           return {
//             ...prevState,
//             message: upload.error.message,
//             status: "error",
//           };
//         }
//         console.log("uploadActions filenames return") ;
//         return `${process.env.NEXT_PUBLIC_IMG_URL}${upload.data?.path}`;
//       })
//   );

//   if (filenames.find((e) => e.message)) {
//     console.log("uploadActions -a filenames.find error: ", filenames[0].message) ;
//     return {
//       ...prevState,
//       message: filenames[0].message,
//       status: "error",
//     };
//   }

//   const lastUnique = await supabase
//     .from("hospital")
//     .select("id_unique")
//     .order("id_unique", { ascending: false })
//     .limit(1);

//   if (!lastUnique.data || lastUnique.error) {
//     console.log("uploadActions -b") ;
//     return {
//       ...prevState,
//       message: lastUnique.error.code || lastUnique.error.message,
//       status: "error",
//     };
//   }

//   const form = {
//     id_unique: lastUnique.data[0].id_unique + 1,
//     name,
//     id_surgeries: surgeries.split(","),
//     searchkey,
//     search_key,
//     address,
//     address_detail,
//     latitude,
//     longitude,
//     location,
//     imageurls: filenames,
//   };

//   const insertHospital = await supabase
//     .from("hospital")
//     .insert(form)
//     .select("*");

//   const removeStorageImg = async () => {
//     console.log("uploadActions removeStorageImg");
//     const filenames = imageurls.filter((entry) => entry instanceof File);

//     const remove = await supabase.storage
//       .from("images")
//       .remove(filenames.map((e) => `hospitalimg/${e.name}`));

//     const error = remove.error || insertHospital.error;

//     if (error) {
//       console.log("uploadActions removeStorageImg error : ", error);
//       return {
//         ...prevState,
//         message: error.message,
//         status: "error",
//       };
//     }
//   } 

//   console.log("uploadActions insertHospital error 1 : ", insertHospital.error);
//   if (insertHospital.error) {
//     // error 발생 시 업로드 했더 이미지 삭제
//     removeStorageImg();
//     console.log("uploadActions insertHospital error 2 : ", insertHospital.error);
//     return {
//       ...prevState,
//       message: insertHospital.error.message,
//       status: "error",
//     };
//   }

//   const hospitalDetailDefaultValue = (id_hospital: string) => ({
//     id_hospital,
//     tel: "0507-1433-0210",
//     kakaotalk: "",
//     homepage: "http://www.reoneskin.com",
//     instagram: "https://www.instagram.com/reone__clinic/",
//     facebook: "",
//     blog: "https://blog.naver.com/reone21",
//     youtube: "https://www.youtube.com/watch?v=Yaa1HZJXIJY",
//     ticktok:
//       "https://www.tiktok.com/@vslineclinicglobal/video/7255963489192168711?is_from_webapp=1&sender_device=pc&web_id=7373256937738012176",
//     snapchat: "",
//     map: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.348038374547!2d127.02511807637043!3d37.52329227204984!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca39ea4618cdb%3A0xd0ad0677746be4c7!2z7Jyg7KeE7Iqk7J2Y7JuQ!5e0!3m2!1sko!2skr!4v1716566609639!5m2!1sko!2skr",
//     desc_address: "327, Dosan-daero, Gangnam-gu, Seoul, Republic of Korea",
//     desc_openninghour: `
//       MON
//       10:00 - 19:00
//       13:00 - 14:00 BreakTime
//       TUE
//       10:00 - 19:00
//       13:00 - 14:00 BreakTime
//       WED
//       10:00 - 19:00
//       13:00 - 14:00 BreakTime
//       THU
//       10:00 - 19:00
//       13:00 - 14:00 BreakTime
//       FRI
//       10:00 - 19:00
//       13:00 - 14:00 BreakTime
//       SAT
//       10:00 - 16:00
//       SUN
//       Regular holiday (Event Week SunDay)
//     `,
//     desc_facilities:
//       "Separate Male/Female Restrooms, Wireless Internet, Parking, Valet Parking",
//     desc_doctors_imgurls: [
//       "https://tqyarvckzieoraneohvv.supabase.co/storage/v1/object/public/images/doctors/doctor_reone1.png",
//       "https://tqyarvckzieoraneohvv.supabase.co/storage/v1/object/public/images/doctors/doctor_reone2.png",
//       "https://tqyarvckzieoraneohvv.supabase.co/storage/v1/object/public/images/doctors/doctor_reone3.png",
//     ],
//     etc: "",
//   });

//   const { error } = await supabase
//     .from("hospital_details")
//     .insert([hospitalDetailDefaultValue(insertHospital.data[0].id_unique)]);
  
//   if (error) {
//     console.log("uploadActions error 3 : ", error);
//     removeStorageImg();

//     return {
//       ...prevState,
//       message: error.message,
//       status: "error",
//     };
//   }

//   revalidatePath("/", "layout");
//   console.log("uploadActions No error uploadActions ");
//   return {
//     ...prevState,
//     message: "success upload!",
//     status: "success",
//   };
// };
