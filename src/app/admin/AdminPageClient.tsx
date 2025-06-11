'use client';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface AdminPageClientProps {
  hasClinicInfo: boolean;
}

export default function AdminPageClient({ hasClinicInfo }: AdminPageClientProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleNavigateToUpload = () => {
    const url = hasClinicInfo ? '/admin/upload?mode=edit' : '/admin/upload';
    router.push(url);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleNavigateToUpload}
        className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-white ${
          hasClinicInfo 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {hasClinicInfo ? '병원정보보기' : '병원정보입력하기'}
      </button>

      <button
        onClick={handleLogout}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
      >
        로그아웃
      </button>
    </div>
  );
} 