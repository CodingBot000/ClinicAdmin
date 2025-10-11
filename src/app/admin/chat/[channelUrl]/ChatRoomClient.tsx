'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSendbird } from '@/contexts/SendbirdContext';
import { supabase } from '@/lib/supabaseClient';
import { TABLE_HOSPITAL } from '@/constants/tables';
import '@sendbird/uikit-react/dist/index.css';

// Dynamic import to avoid SSR issues
import dynamic from 'next/dynamic';

const Channel = dynamic(
  () => import('@sendbird/uikit-react/Channel').then((mod) => mod.default),
  { ssr: false }
);

const SendbirdProvider = dynamic(
  () => import('@sendbird/uikit-react/SendbirdProvider').then((mod) => mod.default),
  { ssr: false }
);

interface ChatRoomClientProps {
  channelUrl: string;
}

export default function ChatRoomClient({ channelUrl }: ChatRoomClientProps) {
  const router = useRouter();
  const { sb, userId, isConnecting, error } = useSendbird();
  const [mounted, setMounted] = useState(false);
  const [hospitalName, setHospitalName] = useState<string>('Clinic Manager');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch hospital name using userId (which is hospital UUID)
  useEffect(() => {
    const fetchHospitalName = async () => {
      if (!userId) return;

      try {
        const { data, error: fetchError } = await supabase
          .from(TABLE_HOSPITAL)
          .select('name_en')
          .eq('id_uuid', userId)
          .maybeSingle();

        if (fetchError) {
          console.error('Failed to fetch hospital name:', fetchError);
          return;
        }

        if (data?.name_en) {
          setHospitalName(data.name_en);
        }
      } catch (err) {
        console.error('Error fetching hospital name:', err);
      }
    };

    fetchHospitalName();
  }, [userId]);

  const handleBackToList = () => {
    router.push('/admin/chat');
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">연결 오류</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={handleBackToList}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            채팅 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting || !mounted || !sb || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">채팅방을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID;
  if (!appId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">설정 오류</h2>
          <p className="text-gray-700 mb-4">Sendbird App ID가 설정되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-md p-4">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            채팅 목록으로 돌아가기
          </button>
        </div>

        {/* Chat Room */}
        <div className="flex-1 bg-white">
          <SendbirdProvider
            appId={appId}
            userId={userId}
            nickname={hospitalName}
          >
            <div className="h-full">
              <Channel
                channelUrl={channelUrl}
                onBackClick={handleBackToList}
                showSearchIcon={true}
              />
            </div>
          </SendbirdProvider>
        </div>
      </div>
    </div>
  );
}
