export const dynamic = "force-dynamic";

// import SuspenseWrapper from "@/components/atoms/SuspenseWrapper";
import dynamicImport from "next/dynamic";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import AdminPageClient from "./AdminPageClient";

// const UploadClient = dynamicImport(() => import("./UploadClient"), {
//   ssr: false,
// });

// export default function UploadPageWrapper() {

export default async function AdminHomePage() {
  console.log('AdminHomePage start');
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  console.log('user?.user_metadata', user?.user_metadata);
  
  if (!user) redirect("/admin/login");

  const { id: uid, email } = user;

  // admin 테이블에 이미 있는지 확인하고 id_uuid_hospital도 가져오기
  const { data: admin, error } = await supabase
    .from("admin")
    .select("id, id_uuid_hospital")
    .eq("id_auth_user", uid)
    .maybeSingle();

  console.log('admin 조회 결과:', admin, error);

  let hasClinicInfo = false;

  // admin이 없으면 생성
  if (!admin) {
    console.log('Admin 정보가 없어서 생성합니다.');
    const { error: insertError } = await supabase
      .from('admin')
      .insert({
        id_auth_user: uid,
        email: email || '',
        is_active: true,
        password_hash: null,
        id_uuid_hospital: null,
      });

    if (insertError) {
      console.error('Admin 생성 오류:', insertError);
    } else {
      console.log('Admin 생성 완료');
    }
    hasClinicInfo = false;
  } else {
    // admin이 있으면 병원 정보 확인
    const id_uuid_hospital = admin?.id_uuid_hospital;
    
    if (!id_uuid_hospital) {
      // id_uuid_hospital이 비어있으면 병원정보 없음
      hasClinicInfo = false;
    } else {
      // hospital 테이블에서 해당 id가 존재하는지 확인
      const { data: hospital, error: hospitalError } = await supabase
        .from("hospital")
        .select("id_uuid")
        .eq("id_uuid", id_uuid_hospital)
        .maybeSingle();

      console.log('hospital 조회 결과:', hospital, hospitalError);
      hasClinicInfo = !!hospital;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          관리자 페이지
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-2">안녕하세요!</p>
          <p className="text-sm text-gray-500">{email}</p>
        </div>

        <AdminPageClient hasClinicInfo={hasClinicInfo} />
      </div>
    </div>
  );
}
