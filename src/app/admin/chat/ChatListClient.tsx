'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSendbird } from '@/contexts/SendbirdContext';
import type { GroupChannel } from '@sendbird/chat/groupChannel';

export default function ChatListClient() {
  const router = useRouter();
  const { sb, userId, isConnecting, error } = useSendbird();
  const [channels, setChannels] = useState<GroupChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sb || !userId) {
      setLoading(false);
      return;
    }

    const loadChannels = async () => {
      try {
        setLoading(true);
        const channelListQuery = sb.groupChannel.createMyGroupChannelListQuery({
          includeEmpty: true,
          limit: 100,
        });

        if (channelListQuery.hasNext) {
          const channelList = await channelListQuery.next();
          setChannels(channelList);
        }
      } catch (err) {
        console.error('Failed to load channels:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [sb, userId]);

  const handleChannelClick = (channelUrl: string) => {
    router.push(`/admin/chat/${encodeURIComponent(channelUrl)}`);
  };

  const handleBackToAdmin = () => {
    router.push('/admin');
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">연결 오류</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={handleBackToAdmin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            관리자 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">채팅 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">환자 문의 채팅</h1>
            <button
              onClick={handleBackToAdmin}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              돌아가기
            </button>
          </div>
          <p className="text-gray-600 mt-2">총 {channels.length}개의 채팅방</p>
        </div>

        {/* Channel List */}
        <div className="bg-white rounded-lg shadow-md">
          {channels.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">아직 문의가 없습니다</p>
              <p className="text-sm mt-2">환자가 문의를 시작하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {channels.map((channel) => {
                const otherMember = channel.members.find(m => m.userId !== userId);
                const lastMessage = channel.lastMessage;
                const unreadCount = channel.unreadMessageCount;

                return (
                  <div
                    key={channel.url}
                    onClick={() => handleChannelClick(channel.url)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">
                            {channel.name || otherMember?.nickname || '알 수 없는 사용자'}
                          </h3>
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </div>

                        {lastMessage && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {lastMessage.message || '(미디어 메시지)'}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-1">
                          {lastMessage
                            ? new Date(lastMessage.createdAt).toLocaleString('ko-KR')
                            : '메시지 없음'}
                        </p>
                      </div>

                      <div className="ml-4">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
