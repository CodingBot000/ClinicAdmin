export const dynamic = "force-dynamic";

// import SuspenseWrapper from "@/components/atoms/SuspenseWrapper";
import dynamicImport from "next/dynamic";
import UploadSkeleton from "./UploadSkeleton";
import UploadClient from "./UploadClient";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// const UploadClient = dynamicImport(() => import("./UploadClient"), {
//   ssr: false,
// });

// export default function UploadPageWrapper() {

export default async function UploadPageWrapper() {
  console.log('UploadPageWrapper  start ' );
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  console.log('user?.user_metadata', user?.user_metadata);
  if (!user) redirect("/admin/login"); 
  return (
    // <SuspenseWrapper fallback={<UploadSkeleton />}>
      <UploadClient currentUserUid={user.id} />
    // </SuspenseWrapper>
  );
}
