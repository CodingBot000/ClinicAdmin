'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminPageClient from './AdminPageClient';
import { TABLE_ADMIN, TABLE_HOSPITAL } from '@/constants/tables';

export default function AdminAuthWrapper() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasClinicInfo, setHasClinicInfo] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('인증 상태 변화:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // 로그인 성공 또는 토큰 갱신시
          await checkAuthAndAdminStatus();
        } else if (event === 'SIGNED_OUT') {
          // 로그아웃시 로그인 페이지로
          router.push('/admin/login');
        }
      }
    );

    // 초기 로드시에도 확인
    checkAuthAndAdminStatus();

    // 컴포넌트 언마운트시 구독 해제
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuthAndAdminStatus = async () => {
    try {
      console.log('클라이언트에서 인증 상태 확인 시작');
      
      // 1. 세션 확인 (더 정확한 방법)
      console.log(' 세션 확인 중...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log(' 세션 결과:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        error: sessionError
      });
      
      if (sessionError || !session || !session.user) {
        console.log(' 세션이 없거나 만료됨 - 로그인 페이지로 이동');
        setIsLoading(false);
        router.push('/admin/login');
        return;
      }
      
      const user = session.user;
      const { id: uid, email } = user;
      setUserEmail(email || '');
      console.log('인증된 사용자:', email, 'UID:', uid);

      // 2. admin 테이블 확인/생성
      console.log('in 테이블 조회 중...');
      console.log(' 사용할 테이블명:', TABLE_ADMIN);
      console.log(' 검색할 UID:', uid);
      
      const { data: admin, error: adminError } = await supabase
        .from(TABLE_ADMIN)
        .select('id, id_uuid_hospital')
        .eq('id_auth_user', uid)
        .maybeSingle();

      console.log(' admin 조회 결과:', {
        admin,
        error: adminError,
        hasAdmin: !!admin,
        hospitalUuid: admin?.id_uuid_hospital
      });

      let clinicInfo = false;

      // admin이 없으면 생성
      if (!admin) {
        console.log(' Admin 정보가 없어서 생성합니다.');
        const insertData = {
          id_auth_user: uid,
          email: email || '',
          is_active: true,
          password_hash: null,
          id_uuid_hospital: null,
        };
        console.log(' 삽입할 데이터:', insertData);
        
        const { error: insertError } = await supabase
          .from(TABLE_ADMIN)
          .insert(insertData);

        if (insertError) {
          console.error(' Admin 생성 오류:', insertError);
        } else {
          console.log(' Admin 생성 완료');
        }
        clinicInfo = false;
      } else {
        // admin이 있으면 병원 정보 확인
        console.log(' 기존 Admin 정보 발견');
        const id_uuid_hospital = admin?.id_uuid_hospital;
        console.log(' 연결된 병원 UUID:', id_uuid_hospital);
        
        if (!id_uuid_hospital) {
          console.log(' 병원 연결 정보 없음');
          clinicInfo = false;
        } else {
          // hospital 테이블에서 해당 id가 존재하는지 확인
          console.log(' 병원 테이블에서 확인 중...');
          const { data: hospital, error: hospitalError } = await supabase
            .from(TABLE_HOSPITAL)
            .select('id_uuid')
            .eq('id_uuid', id_uuid_hospital)
            .maybeSingle();

          console.log(' hospital 조회 결과:', {
            hospital,
            error: hospitalError,
            hasHospital: !!hospital
          });
          clinicInfo = !!hospital;
        }
      }

      setHasClinicInfo(clinicInfo);
      console.log(' 최종 병원 정보 존재 여부:', clinicInfo);
      console.log(' 인증 확인 완료 - 로딩 상태 해제 예정');

    } catch (error) {
      console.error(' 인증 확인 중 오류:', error);
      if (error instanceof Error) {
        console.error(' 오류 상세:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      router.push('/admin/login');
    } finally {
      console.log(' finally 블록 실행 - 로딩 상태 false로 설정');
      setIsLoading(false);
    }
  };

  if (isLoading) {
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