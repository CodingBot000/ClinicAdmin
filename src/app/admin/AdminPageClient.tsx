'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

interface AdminPageClientProps {
  hasClinicInfo: boolean;
}

export default function AdminPageClient({
  hasClinicInfo,
}: AdminPageClientProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const username = user.email.split('@')[0];
        console.log('username:', username);
        setCurrentUser(username);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const handleNavigateToUpload = () => {
    const url = hasClinicInfo
      ? '/admin/upload?mode=edit'
      : '/admin/upload';
    router.push(url);
  };

  const handleReservationDashBoard = () => {
    router.push('/admin/reservation');
  };

  const handleConsultationSubmissions = () => {
    router.push('/admin/consultation');
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <div className='flex flex-col gap-4'>
      <button
        onClick={handleNavigateToUpload}
        className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-white ${
          hasClinicInfo
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {hasClinicInfo
          ? '병원정보보기'
          : '병원정보입력하기'}
      </button>

      <button
        onClick={handleReservationDashBoard}
         className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 bg-yellow-500 text-white`}
      >
        예약정보 보기
{/* /Users/switch/Documents/웹개발요청/complete/beauty-main/src/app/hospital/[id]/reservation/ReservationClient.tsx */}
      </button>

      {currentUser === process.env.NEXT_PUBLIC_SUPER_ADMIN! && (
        <button
          onClick={handleConsultationSubmissions}
          className="w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 bg-purple-600 hover:bg-purple-700 text-white"
        >
          문진표 요청 조회하기
        </button>
      )}

      <button
        onClick={handleLogout}
        className='w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200'
      >
        로그아웃
      </button>
    </div>
  );
}
