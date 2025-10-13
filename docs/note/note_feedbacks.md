src/components/modal/SupportTreatmentFeedbackModal.tsx

여기서 전송버튼 handleSubmit
을 누르면  FeedBack 테이블에 저장할건데 , 
src/app/api/upload/step6
아래에 폴더를 추가해서 route 파일을 또  만들어도 될까?

가능하면 그렇게해서 피드백내용을 저장하고 type은 'support_treatment'로 저장해줘.



feedbacks 테이블스키마야
테이블명 접근할때는 
상수값 TABLE_FEEDBACKS 사용해.


create table public.feedbacks (
  id serial not null,
  feedback_content text null,
  id_uuid_hospital uuid not null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  type text null,
  constraint feedbacks_pkey primary key (id)
) TABLESPACE pg_default;



피드백정보는 이 화면에 
src/app/admin/upload/Step6SupportTreatments.tsx
들어올때 최초에 조회해서 갖고와서 
(id_uuid_hospital로 조회해서 type = 'support_treatment'이면서  updated_at이 최신인걸로 갖고와야해)

feetbackModal을 열때 보여주고, 사용자가 피드백내용을 변경해서 전송버튼을 누르면 해당내용을 다시 메모리에  들고있는 객체값을 업데이트해줘서 다시 피드백을 열었을때 변경된내용으로 나오게 해줘


