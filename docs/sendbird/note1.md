
## 🎯 구현 목표

두 개의 **별도 Next.js 프로젝트**가 존재한다:

| 구분               | 프로젝트 목적                    | 로그인 구조                                 | Sendbird user_id                   |
| ---------------- | -------------------------- | -------------------------------------- | ---------------------------------- |
| **환자 프로젝트**      | 환자가 병원에 상담을 요청하고 채팅을 시작    | Supabase Auth (`auth.users.id`)        | `members.uuid` (= `auth.users.id`) |
| **병원(어드민) 프로젝트** | 병원 관리자가 환자 문의를 실시간으로 받고 응답 | 별도 로그인 테이블 (`hospital` 테이블의 `id_uuid`) | `hospital.id_uuid`                 |

두 프로젝트는 **동일한 Supabase 데이터베이스**와 **동일한 Sendbird Application**을 바라본다.
단, 각자 클라이언트가 다르므로 Sendbird SDK 초기화와 로그인은 별도로 이루어진다.

---
> 참고 문서: [https://sendbird.com/docs/chat](https://sendbird.com/docs/chat)

## 🧱 아키텍처 요약

```
환자 프로젝트
  ↓ 상담 폼 제출
    /api/chat/create-channel  (Server API)
      → Sendbird Platform API 호출
        - upsertUser(members.uuid)
        - upsertUser(hospital.id_uuid)
        - 1:1 채널 생성 (is_distinct=true)
      ← channel_url 반환
  ↓
  채팅 페이지 열기 (UIKit) 
    → userId = members.uuid
    → channelUrl = 반환된 URL

병원(어드민) 프로젝트
  ↓ 로그인 (hospital.id_uuid 확보)
  ↓ Sendbird SDK 로그인 (sb.connect(hospital.id_uuid))
  ↓ getMyGroupChannels() 호출
      → 환자들이 생성한 모든 채널 불러오기
  ↓ 채널 선택 → UIKit 단일 채널 뷰 렌더링
```
src/app/admin/upload/ClinicInfoInsertClient.tsx 에서
 아래부분 참고 (hospital.id_uuid 가져오는법)
  useEffect(() => {
    log.info('ClinicInfoInsertClient isEditMode: ', isEditMode);
    
    const initializeHospitalUuid = async () => {
      // 시작하자마자 제일먼저 병원 UUID가 있는지 확인
      const hospitalUuid = await getUserHospitalUuid(currentUserUid);
      log.info('ClinicInfoInsertClient hospitalUuid: ', hospitalUuid);
     
      if (!isEditMode) {
        if (hospitalUuid) {
          // case 2
          // hospitalUuid가 있으면 기존 것을 사용
          setIdUuidHospital(hospitalUuid);
          log.info('ClinicInfoInsertClient exist hospitaluuid: ', hospitalUuid);
        } else {
          // case 1
          const id_uuid_generate = uuidv4();
          setIdUuidHospital(id_uuid_generate);
          log.info('ClinicInfoInsertClient id_uuid_generate: ', id_uuid_generate);
        }        
        
      } else {
        // case 3
        const loadHospitalUuid = async () => {
          const hospitalUuid = await getUserHospitalUuid(currentUserUid);
          setIdUuidHospital(hospitalUuid ?? '');
          log.info('ClinicInfoInsertClient hospitalUuid: ', hospitalUuid);
  
          if (!hospitalUuid) {
           const hospitalName = await loadHospitalData(hospitalUuid!);
           setHospitalName(hospitalName);
          }
        };
        loadHospitalUuid();
      }
    };
    
    initializeHospitalUuid();
  }, []);

---

## ⚙️ 환자 프로젝트 (요약만 — 이미 구현됨)

* 채널 생성 및 채팅 송신이 정상 작동 중
* 서버에서 Platform API를 사용 (`upsertUser`, `createDistinct1to1Channel`)
* Sendbird App ID와 API Token은 `.env.local`에 설정되어 있음

---

## 🏥 병원(어드민) 프로젝트 — 신규 구현 지시사항

> 이 프로젝트는 환자 프로젝트와 완전히 별개의 Next.js 앱으로 구성한다.

### 1️⃣ 환경 설정

`.env.local`

```env
NEXT_PUBLIC_SENDBIRD_APP_ID=YOUR_SENDBIRD_APP_ID
```
Application ID:
7FE17A5E-B2D3-436D-813F-FC68A60F23BD

API Token : 
d34ed80207dc9e25c4a06fcce1f85d5829830bbd

### 2️⃣ 패키지 설치

```bash
npm i @sendbird/chat @sendbird/uikit-react @sendbird/chat/groupChannel
```

---

### 3️⃣ 로그인 구조

* Supabase Auth 대신 병원용 테이블(`hospital`)을 참조하여 로그인 처리한다.
* 로그인 후 `hospital.id_uuid` 값을 세션 또는 쿠키에 저장한다.
* Sendbird SDK 연결 시 `hospital.id_uuid`를 그대로 userId로 사용한다.

---

### 4️⃣ Sendbird SDK 연결

```ts
import SendbirdChat, { GroupChannelModule } from "@sendbird/chat/groupChannel";

const sb = await SendbirdChat.init({
  appId: process.env.NEXT_PUBLIC_SENDBIRD_APP_ID!,
  modules: [new GroupChannelModule()],
});

await sb.connect(hospitalIdUUID);
```

---

### 5️⃣ 병원 어드민: 채널 목록 조회 페이지

```tsx
"use client";
import { useEffect, useState } from "react";
import SendbirdChat, { GroupChannelModule } from "@sendbird/chat/groupChannel";

export default function AdminChatList({ hospitalIdUUID }: { hospitalIdUUID: string }) {
  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const sb = await SendbirdChat.init({
        appId: process.env.NEXT_PUBLIC_SENDBIRD_APP_ID!,
        modules: [new GroupChannelModule()],
      });
      await sb.connect(hospitalIdUUID);

      const list = await sb.groupChannel.getMyGroupChannels({
        limit: 30,
        order: "latest_last_message",
      });
      setChannels(list);
    })();
  }, [hospitalIdUUID]);

  function openChannel(url: string) {
    window.location.href = `/admin/chat/${encodeURIComponent(url)}`;
  }

  return (
    <div className="p-4">
      <h2 className="font-semibold text-lg mb-4">📬 환자 문의 목록</h2>
      <ul className="divide-y">
        {channels.map((ch) => {
          const data = ch.data ? JSON.parse(ch.data) : {};
          const patientUUID =
            data.member_uuid ??
            ch.members.find((m: any) => m.userId !== hospitalIdUUID)?.userId;
          return (
            <li
              key={ch.url}
              className="py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => openChannel(ch.url)}
            >
              <div className="font-medium">
                {ch.name || "상담 채널"} — {patientUUID?.slice(0, 8)}…
              </div>
              <div className="text-sm text-gray-600">
                {ch.lastMessage?.message || "(메시지 없음)"}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

---

### 6️⃣ 단일 채널 페이지 (채팅 UI)

```tsx
"use client";
import { useEffect, useState } from "react";
import { SendbirdUIKitProvider } from "@sendbird/uikit-react";
import "@sendbird/uikit-react/dist/index.css";
import { GroupChannel as GroupChannelComponent } from "@sendbird/uikit-react/GroupChannel";
import SendbirdChat, { GroupChannelModule } from "@sendbird/chat/groupChannel";

export default function AdminChatRoom({ params }: any) {
  const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID!;
  const channelUrl = decodeURIComponent(params.channelUrl);
  const hospitalIdUUID = /* 세션에서 가져오기 */ "";

  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = await SendbirdChat.init({
        appId,
        modules: [new GroupChannelModule()],
      });
      await sb.connect(hospitalIdUUID);
      await sb.groupChannel.getChannel(channelUrl); // 존재 확인
      setReady(true);
    })();
  }, [appId, channelUrl, hospitalIdUUID]);

  if (!hospitalIdUUID) return <div>로그인이 필요합니다.</div>;
  if (!ready) return <div>로딩중...</div>;

  return (
    <SendbirdUIKitProvider appId={appId} userId={hospitalIdUUID}>
      <div className="h-[80vh] border rounded overflow-hidden">
        <GroupChannelComponent channelUrl={channelUrl} />
      </div>
    </SendbirdUIKitProvider>
  );
}
```

---

### 7️⃣ 병원에서 환자 UUID 알아내기

* 채널 메타데이터(JSON.parse(ch.data))에서 `member_uuid`를 읽는다.
* 또는 멤버 목록에서 `hospital.id_uuid`가 아닌 쪽의 `userId`를 찾는다.

```ts
const meta = ch.data ? JSON.parse(ch.data) : null;
const patientUUID =
  meta?.member_uuid ??
  ch.members.find((m: any) => m.userId !== hospitalIdUUID)?.userId;
```

필요 시 `patientUUID`로 Supabase에서 환자 프로필(`members` 테이블) 조회 가능.

---

### 8️⃣ 테스트 시나리오

1. 환자 프로젝트에서 상담 요청 → 채널 생성 성공 확인 (`channel_url` 반환)
2. 병원 프로젝트에서 로그인 (`hospital.id_uuid` 세션 확보)
3. 채널 목록 페이지에서 새 채널이 나타나는지 확인
4. 채널 클릭 → UIKit 화면에서 환자 메시지 확인 및 응답 테스트
5. 환자 쪽에서도 동일 채널 실시간 응답 확인

---

### ✅ 완료 조건

* [ ] 병원(admin) 프로젝트가 별도 앱으로 정상 실행
* [ ] 병원 UUID로 Sendbird 연결 후 채널 목록 조회 가능
* [ ] 각 채널 클릭 시 환자와 실시간 송수신 가능
* [ ] 환자 UUID를 채널 데이터에서 파싱 가능
* [ ] 환자와 병원 모두 같은 `App ID`를 사용하며 Developer 플랜(무료)에서 동작

---

이렇게 보강된 버전은 **클로드코드가 명확히 구분해서 이해**합니다:

* 두 프로젝트(환자/병원)가 완전히 분리되어 있다는 점
* 각각이 Sendbird의 같은 App ID를 쓰지만 다른 user_id 체계를 쓴다는 점
* Supabase Auth는 환자에게만 적용, 병원은 별도 테이블 기반이라는 점

즉, 클로드가 이 파일을 그대로 읽으면
✅ 병원용 프로젝트를 별도 코드베이스로 생성하고
✅ Sendbird SDK 초기화, 로그인, 채널 목록, UIKit 단일 채널 뷰까지 전부 자동으로 구현할 수 있습니다.
