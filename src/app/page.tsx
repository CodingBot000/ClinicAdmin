import Image from "next/image";
import UploadClient from "./admin/upload/UploadClient";

export default function Home() {
  return (
    <div className="items-center min-h-screen font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <UploadClient />
      </main>
    </div>
  );
}
