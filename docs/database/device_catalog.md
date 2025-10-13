device_catalog 테이블 스키마.

create table if not exists device_catalog ( id text primary key, -- 예: 'ulthera', 'thermage_flx' ko text not null, en text not null, type text not null, -- 예: 'device' "group" text, -- 예: 'Lifting · HIFU' dept text not null -- 'skin' | 'plastic' | 'both' );






아래 테이블에는 선택된 시술 id가 들어감. ids에 들어감.
category 기준으로 skin과 plastic을 구분함.
device_ids  에는 선택된 장비가 들어감. 마찬가지로 
category 기준으로 skin과 plastic을 구분함.



category는 'skin' 혹은 'plastic'
-- 병원 × 카테고리(최대 2행)로 id 배열만 저장
create table if not exists hospital_treatment_selection (
  id_uuid_hospital uuid not null,
  category text not null,                                                    -- skin / plastic
  ids text[] not null default '{}',                                                        -- 선택 id 배열 (S*, P*)
  updated_at timestamptz not null default now(),
  device_ids text[] not null default '{}';
  primary key (id_uuid_hospital, category)
);

comment on table hospital_treatment_selection is '병원별 시술 선택 id(배열)를 카테고리별로 저장 (병원당 최대 2행)';
comment on column hospital_treatment_selection.ids is '선택된 시술 id 배열 (예: S1A, S2AB, S3ABC / P1A, P2AB, P3ABC)';

-- 배열 검색 가속
create index if not exists hts_ids_gin on hospital_treatment_selection using gin (ids);