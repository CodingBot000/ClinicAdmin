export const dynamic = "force-dynamic";

import { Suspense } from "react";
import UploadAuthWrapper from "./UploadAuthWrapper";
import UploadSkeleton from "./UploadSkeleton";

export default function UploadPageWrapper() {
  return (
    <Suspense fallback={<UploadSkeleton />}>
      <UploadAuthWrapper />
    </Suspense>
  );
}
