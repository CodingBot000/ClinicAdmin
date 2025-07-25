'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ClinicInfoInsertClient from './ClinicInfoInsertClient';

export default function ClinicInfoUploadClientWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserUid, setCurrentUserUid] =
    useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    checkAuthAndSetup();
  }, []);

  const checkAuthAndSetup = async () => {
    try {
      log.info('UploadAuthWrapper - 인증 확인 시작');

      // 1. 사용자 인증 확인
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        log.info(
          '인증되지 않은 사용자 - 로그인 페이지로 이동',
        );
        router.push('/admin/login');
        return;
      }

      log.info('인증된 사용자:', user.email);
      setCurrentUserUid(user.id);

      // 2. 편집 모드 확인
      const mode = searchParams.get('mode');
      const editMode = mode === 'edit';
      setIsEditMode(editMode);
      log.info(
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
    <ClinicInfoInsertClient
      currentUserUid={currentUserUid as string}
      isEditMode={isEditMode}
    />
  );


}
