'use client';

import { useEffect, useState } from 'react';
import { useSendbird } from '@/contexts/SendbirdContext';

/**
 * Sendbird 미확인 메시지 수를 가져오는 훅
 * @returns totalUnreadCount - 전체 미확인 메시지 수
 * @returns unreadChannelCount - 미확인 메시지가 있는 채널 수
 * @returns isLoading - 로딩 상태
 */
export function useSendbirdUnreadCount() {
  const { sb, userId } = useSendbird();
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);
  const [unreadChannelCount, setUnreadChannelCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!sb || !userId) {
      setIsLoading(false);
      return;
    }

    const fetchUnreadCounts = async () => {
      try {
        setIsLoading(true);

        // 전체 미확인 메시지 수
        const totalUnread = await sb.groupChannel.getTotalUnreadMessageCount();
        setTotalUnreadCount(totalUnread);

        // 미확인 메시지가 있는 채널 수
        const unreadChans = await sb.groupChannel.getTotalUnreadChannelCount();
        setUnreadChannelCount(unreadChans);

        log.info('Unread counts fetched:', { totalUnread, unreadChans });
      } catch (error) {
        console.error('Failed to fetch unread counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnreadCounts();

    // 주기적으로 업데이트 (10초마다)
    // 실시간 핸들러 대신 폴링 방식 사용 (더 안정적)
    const intervalId = setInterval(() => {
      fetchUnreadCounts();
    }, 10000);

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, [sb, userId]);

  return {
    totalUnreadCount,
    unreadChannelCount,
    isLoading,
  };
}
