-- =============================================
-- 테이블 생성
-- =============================================

create table if not exists rsvps (
  id serial primary key,
  name text not null,
  phone text not null,
  attending boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists settings (
  id serial primary key,
  key text not null unique,
  value text not null,
  updated_at timestamp with time zone default now()
);

-- =============================================
-- RLS 활성화
-- =============================================

alter table rsvps enable row level security;
alter table settings enable row level security;

-- =============================================
-- rsvps 정책
-- 누구나 참석 등록 가능 (INSERT)
-- 조회/수정/삭제는 service role만 (어드민)
-- =============================================

create policy "누구나 rsvp 등록 가능"
  on rsvps for insert
  to anon
  with check (true);

-- =============================================
-- settings 정책
-- 누구나 읽기 가능 (랜딩 이미지, 문구 표시용)
-- 수정은 service role만 (어드민)
-- =============================================

create policy "누구나 settings 읽기 가능"
  on settings for select
  to anon
  using (true);
