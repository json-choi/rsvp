export const TEXT_SETTING_KEYS = [
  'subtitle',
  'title',
  'event_date',
  'event_time',
  'event_venue',
  'success_title',
  'success_sub',
] as const;

export const TEXT_SETTING_DEFAULTS: Record<string, string> = {
  subtitle: 'First Annual',
  title: '강림 축복 파티',
  event_date: '2026 · 05 · 10 · SAT',
  event_time: '18 : 00',
  event_venue: '더 그랜드 호텔 발룸',
  success_title: 'See you there.',
  success_sub: '2026 · 05 · 10',
};

export const TEXT_SETTING_LABELS: Record<string, string> = {
  subtitle: '서브타이틀',
  title: '메인 타이틀',
  event_date: '날짜',
  event_time: '시간',
  event_venue: '장소',
  success_title: '참석 확인 메시지',
  success_sub: '참석 확인 날짜',
};
