admin/chat 에 채팅기능이 구현되어있어 

src/app/admin/chat/ChatListClient.tsx에서보면
                const otherMember = channel.members.find(m => m.userId !== userId);
                const lastMessage = channel.lastMessage;
                const unreadCount = channel.unreadMessageCount;

                이런식으로 안읽은 메시지를 확인할수있어 지금 채팅리스트에서 표기해주고있지

    
src/app/admin/AdminPageClient.tsx

이화면에 들어왔을때
      <button
        onClick={handleChatMessages}
        className="w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 bg-teal-600 hover:bg-teal-700 text-white"
      >
        환자 문의 채팅
      </button>

이 버튼 안에 안읽은 메시지가 있을 경우 표기를 해주고 싶어
숫자까지 표기할수있다면 더 좋을것같애

버튼안에   '환자 문의 채팅' 글자 오른쪽에 그냥 표기하면돼

아래는 예시니깐 구현하는데 참고하고
구현할때 저 페이지에 다 구현하지말고 독립된 파일로 구현해서 결과를 보여주는 식으로 해줘

가능해요. “채팅방에 들어가기 전”에도 **병원 계정(hospital.id_uuid) 기준으로 새 문의/미확인 여부**를 바로 확인할 수 있습니다. Sendbird가 **미확인 메시지/채널 카운트 API와 SDK 메서드**를 제공하거든요.

## 무엇을 쓸까 (요약)

* **전체 미확인 메시지 수**: `sb.groupChannel.getTotalUnreadMessageCount()` (JS SDK). ([Sendbird][1])
* **미확인 메시지가 있는 채널 수**: `sb.groupChannel.getTotalUnreadChannelCount()` (JS SDK). ([Sendbird][2])
* **내가 속한 채널 리스트 + 각 채널별 미확인 수**: `getMyGroupChannels()` 호출 후 `channel.unreadMessageCount` 활용. ([Sendbird][3])
* (서버에서 필요 시) **Platform API로 사용자 기준 미확인 합계/채널 수**:

  * `GET /v3/users/{user_id}/unread_message_count` (합계), `.../unread_channel_count` (채널 수). ([Sendbird][4])
  * 특정 채널의 멤버별 미확인 수: `GET /v3/group_channels/{channel_url}/messages/unread_count`. ([Sendbird][5])

## 최소 구현 예 (어드민 프로젝트, 병원 로그인 직후)

```ts
// 병원 로그인 완료 후 (userId = hospital.id_uuid)
const sb = await SendbirdChat.init({ appId, modules: [new GroupChannelModule()] });
await sb.connect(hospitalIdUUID);

// 1) 전체 미확인 메시지/채널 수 뱃지
const totalUnreadMsgs   = await sb.groupChannel.getTotalUnreadMessageCount();   // 숫자
const totalUnreadChans  = await sb.groupChannel.getTotalUnreadChannelCount();   // 숫자

// 2) 채널 리스트와 채널별 미확인 수
const channels = await sb.groupChannel.getMyGroupChannels({
  limit: 30, order: "latest_last_message",
});

// 예시: 리스트 렌더 시 ch.unreadMessageCount로 뱃지 표시
channels.forEach(ch => {
  console.log(ch.url, ch.unreadMessageCount); // 채널별 미확인 개수
});
```

미확인 카운트 표시는 SDK가 **읽음 처리 이벤트**와 함께 갱신됩니다(`markAsReadAll()` 호출 시 서버가 카운트를 업데이트). ([Sendbird][6])

## 실시간 갱신(선택)

리스트가 열린 상태에서 새 메시지를 바로 반영하려면 **채널 이벤트 핸들러**를 붙이세요(예: JS/Flutter 등에서 `onMessageReceived`, `onChannelChanged`, `onReadReceiptUpdated`). 이렇게 하면 들어오지 않은 방의 미확인 카운트도 갱신됩니다. ([Sendbird][7])

## 서버에서 숫자만 빠르게 확인하고 싶다면

백엔드에서 주기적으로 병원 계정의 **미확인 합계/채널 수**를 폴링하여 어드민 상단 뱃지로 노출할 수도 있습니다:

* `GET /v3/users/{user_id}/unread_message_count`
* `GET /v3/users/{user_id}/unread_channel_count` ([Sendbird][4])

---

### 한줄 정리

어드민 페이지에서 병원 계정으로 로그인만 되어 있으면, **채팅방에 들어가기 전**에도 **“새 채팅(미확인)”**을 **합계/채널 수/채널별 개수** 단위로 확인하고 뱃지 표시가 가능합니다. (위 SDK/REST를 그대로 쓰면 끝!)

[1]: https://sendbird.com/docs/chat/sdk/v4/javascript/message/retrieving-unread-counts-in-a-group-channel/unread-messages-in-all-channels?utm_source=chatgpt.com "Retrieve number of unread messages in all channels - Sendbird"
[2]: https://sendbird.com/docs/chat/sdk/v4/javascript/message/retrieving-unread-counts-in-a-group-channel/unread-channels?utm_source=chatgpt.com "Retrieve number of channels with unread messages - Sendbird"
[3]: https://sendbird.com/docs/chat/sdk/v4/javascript/message/retrieving-unread-counts-in-a-group-channel/unread-messages?utm_source=chatgpt.com "Retrieve number of unread messages in a channel - Sendbird"
[4]: https://sendbird.com/docs/chat/platform-api/v3/user/managing-unread-count/get-number-of-unread-messages?utm_source=chatgpt.com "Get number of unread messages | Chat Platform API | Sendbird Docs"
[5]: https://sendbird.com/docs/chat/platform-api/v3/message/read-receipts/get-number-of-unread-messages-per-member?utm_source=chatgpt.com "Get number of unread messages per member | Chat Platform API"
[6]: https://sendbird.com/docs/chat/sdk/v4/javascript/message/managing-read-status-in-a-group-channel/mark-messages-as-read?utm_source=chatgpt.com "Mark messages as read | Chat JavaScript SDK"
[7]: https://sendbird.com/docs/chat/sdk/v3/flutter/ref/handlers_channel_event_handler/ChannelEventHandler/onReadReceiptUpdated.html?utm_source=chatgpt.com "onReadReceiptUpdated method - ChannelEventHandler class"
