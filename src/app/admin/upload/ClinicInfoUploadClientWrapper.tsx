'use client';

import { createBrowserClient } from '@supabase/ssr';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useEffect, useState } from 'react';
import ClinicInfoUploadClient from './ClinicInfoUploadClient';

export default function ClinicInfoUploadClientWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserUid, setCurrentUserUid] =
    useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    checkAuthAndSetup();
  }, []);

  const checkAuthAndSetup = async () => {
    try {
      console.log('UploadAuthWrapper - 인증 확인 시작');

      // 1. 사용자 인증 확인
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log(
          '인증되지 않은 사용자 - 로그인 페이지로 이동',
        );
        router.push('/admin/login');
        return;
      }

      console.log('인증된 사용자:', user.email);
      setCurrentUserUid(user.id);

      // 2. 편집 모드 확인
      const mode = searchParams.get('mode');
      const editMode = mode === 'edit';
      setIsEditMode(editMode);
      console.log(
        'Upload 페이지 모드:',
        editMode ? '편집' : '신규등록',
      );
    } catch (error) {
      console.error('인증 확인 중 오류:', error);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600'></div>
      </div>
    );
  }

  return (
    <ClinicInfoUploadClient
      currentUserUid={currentUserUid}
      isEditMode={isEditMode}
    />
  );
}
