'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminPageClient from './AdminPageClient';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useAlarmStore } from '@/stores/useHospitalUUIDStore';
import { api } from '@/lib/api-client';

export default function AdminAuthWrapper() {
  const router = useRouter();
  const [hasClinicInfo, setHasClinicInfo] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  const { session, isLoading: sessionLoading, error: sessionError } = useSupabaseSession();

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

        // Use API endpoint instead of direct Supabase access
        const authResult = await api.admin.verifyAuth(uid);

        if (!authResult.success || !authResult.data) {
          throw new Error(authResult.error || 'Failed to verify admin');
        }

        const { adminExists, hasClinicInfo: hasClinic, admin } = authResult.data;

        let clinicInfo = false;

        if (!adminExists) {
          // Create admin using API endpoint instead of direct INSERT
          const createResult = await api.admin.createAdmin(uid, email || '');

          if (!createResult.success) {
            throw new Error(createResult.error || 'Failed to create admin');
          }
        } else if (admin && admin.id_uuid_hospital) {
          clinicInfo = hasClinic;
          // Subscribe to reservation updates
          useAlarmStore.setState(admin.id_uuid_hospital);
        }

        if (mounted) {
          setHasClinicInfo(clinicInfo);
        }
      } catch (error) {
        console.error('Admin status check error:', error);
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
  }, [session, sessionLoading, router]);

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
          <p className="text-sm text-gray-500">{userEmail.split('@')[0]} 님</p>
        </div>

        <AdminPageClient hasClinicInfo={hasClinicInfo} />
      </div>
    </div>
  );
} 