'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminPageClient from './AdminPageClient';
import { TABLE_ADMIN, TABLE_HOSPITAL } from '@/constants/tables';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export default function AdminAuthWrapper() {
  const router = useRouter();
  const [hasClinicInfo, setHasClinicInfo] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  
  const { session, isLoading: sessionLoading, error: sessionError, supabase } = useSupabaseSession();

  useEffect(() => {
    let mounted = true;

    const checkAdminStatus = async () => {
      if (!session?.user) {
        if (mounted) {
          router.push('/admin/login');
        }
        return;
      }

      try {
        const { id: uid, email } = session.user;
        setUserEmail(email || '');

        // admin 테이블 확인
        const { data: admin, error: adminError } = await supabase
          .from(TABLE_ADMIN)
          .select('id, id_uuid_hospital')
          .eq('id_auth_user', uid)
          .maybeSingle();

        if (adminError) {
          throw adminError;
        }

        let clinicInfo = false;

        if (!admin) {
          // admin이 없으면 생성
          const { error: insertError } = await supabase
            .from(TABLE_ADMIN)
            .insert({
              id_auth_user: uid,
              email: email || '',
              is_active: true,
              password_hash: null,
              id_uuid_hospital: null,
            });

          if (insertError) {
            throw insertError;
          }
        } else if (admin.id_uuid_hospital) {
          // hospital 테이블에서 확인
          const { data: hospital, error: hospitalError } = await supabase
            .from(TABLE_HOSPITAL)
            .select('id_uuid')
            .eq('id_uuid', admin.id_uuid_hospital)
            .maybeSingle();

          if (hospitalError) {
            throw hospitalError;
          }

          clinicInfo = !!hospital;
        }

        if (mounted) {
          setHasClinicInfo(clinicInfo);
        }
      } catch (error) {
        console.error('Admin 상태 확인 중 에러:', error);
        if (mounted) {
          router.push('/admin/login');
        }
      }
    };

    if (!sessionLoading) {
      checkAdminStatus();
    }

    return () => {
      mounted = false;
    };
  }, [session, sessionLoading, router, supabase]);

  if (sessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (sessionError || !session) {
    router.push('/admin/login');
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          관리자 페이지
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-2">안녕하세요!</p>
          <p className="text-sm text-gray-500">{userEmail}</p>
        </div>

        <AdminPageClient hasClinicInfo={hasClinicInfo} />
      </div>
    </div>
  );
} 