테이블 스키마 consultation_submissions

Table name : consultation_submissions



[
  {
    "column_name": "id_uuid",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "form_version",
    "data_type": "integer"
  },
  {
    "column_name": "private_first_name",
    "data_type": "text"
  },
  {
    "column_name": "private_last_name",
    "data_type": "text"
  },
  {
    "column_name": "private_email",
    "data_type": "text"
  },
  {
    "column_name": "private_age_range",
    "data_type": "text"
  },
  {
    "column_name": "private_gender",
    "data_type": "text"
  },
  {
    "column_name": "skin_types",
    "data_type": "text"
  },
  {
    "column_name": "budget_ranges",
    "data_type": "text"
  },
  {
    "column_name": "skin_concerns",
    "data_type": "ARRAY"
  },
  {
    "column_name": "skin_concerns_other",
    "data_type": "text"
  },
  {
    "column_name": "treatment_areas",
    "data_type": "ARRAY"
  },
  {
    "column_name": "treatment_areas_other",
    "data_type": "text"
  },
  {
    "column_name": "medical_conditions",
    "data_type": "ARRAY"
  },
  {
    "column_name": "medical_conditions_other",
    "data_type": "text"
  },
  {
    "column_name": "priorities",
    "data_type": "ARRAY"
  },
  {
    "column_name": "treatment_goals",
    "data_type": "ARRAY"
  },
  {
    "column_name": "past_treatments",
    "data_type": "ARRAY"
  },
  {
    "column_name": "past_treatments_side_effect_desc",
    "data_type": "text"
  },
  {
    "column_name": "anything_else",
    "data_type": "text"
  },
  {
    "column_name": "visit_path",
    "data_type": "text"
  },
  {
    "column_name": "visit_path_other",
    "data_type": "text"
  },
  {
    "column_name": "image_paths",
    "data_type": "ARRAY"
  },
  {
    "column_name": "country",
    "data_type": "text"
  },
  {
    "column_name": "korean_phone_number",
    "data_type": "numeric"
  },
  {
    "column_name": "messengers",
    "data_type": "jsonb"
  },
  {
    "column_name": “status”,
    "data_type": “text”
  },
  {
    "column_name": “updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": “doctor_notes”,
    "data_type": “text”
  },


]



##여기있는 데이터를 조회해서 보여주는 화면만들기


조회가능한자는 아이디가 mimotokadmin 인  경우만이야
조회화면 진입할때 현재 아이디가  mimotokadmin인지 확인후에 아니면 다시 이전화면으로 리다이렉트 시키도록해


## 위의 테이블을 조회하고 그리드 형태로 보여줄꺼야.
 기본값은 created_at 순서로 sorting하고 
다음조건으로 status 순으로 sorting 해줘 ,.
Status 는  다음의 조건이 존재해.
신규입력 New. (null인 경우 New 취급)
처리완료. Done
재처리필요 Retry

Status sorting  순서 
New -> Retry -> Done

컬럼중에 아래 두개를 빼곤 모두 모두 조회만 가능해. 
1. doctor_notes 에 한해서만 입력/ 편집 가능해.
2. Status 는 위에 열거한 New, Done, Retry 중에서 선택가능해.


조회테이블은 화면을 가로를 넘어갈것이기때문에 가로 스크롤이 가능해야해 
조희테이블의 가장 왼쪽에 sticky하게 버튼이있어 (스크롤해도 이건 항상 고정이야)

# 가장왼쪽의 sticky하게 존재하는 적용/보기 버튼.
가장왼쪽의 버튼은 보기, 적용 두가지 상태가 존재해
보기 상태는 그냥 아무동작도 안해 눌리지도않어
위의 1번과 2번중 하나만  변경사항이 발생해도 이 버튼은 적용으로 변해.
적용버튼을 누르면 해당 컬럼을 supabase table에 업데이트해
업데이트 항목은 doctor_notes와 status, updated_at만 업데이트해
update_at은 update하는 순간의 날짜시간으로 업데이트해줘

