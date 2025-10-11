export const dynamic = "force-dynamic";

import ChatRoomClient from "./ChatRoomClient";

interface ChatRoomPageProps {
  params: Promise<{
    channelUrl: string;
  }>;
}

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { channelUrl } = await params;
  return <ChatRoomClient channelUrl={decodeURIComponent(channelUrl)} />;
}
