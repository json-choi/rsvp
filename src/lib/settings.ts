// 클라이언트·서버 공용 설정 정의 (서버 전용 코드를 import하지 않는다)

export const TEXT_FIELDS = [
  { key: 'subtitle', label: '서브타이틀', placeholder: 'Welcome Party', group: 'header' },
  { key: 'title', label: '메인 타이틀', placeholder: '새가족 환영 잔치', group: 'header' },
  { key: 'event_date', label: '날짜', placeholder: '2026 · 05 · 10 · SAT', group: 'event' },
  { key: 'event_time', label: '시간', placeholder: '18 : 00', group: 'event' },
  { key: 'event_venue', label: '장소', placeholder: '본당 2층 친교실', group: 'event' },
  {
    key: 'event_map_url',
    label: '지도 링크 (선택)',
    placeholder: 'https://naver.me/...',
    group: 'event',
    hint: '입력하면 장소를 눌러 지도를 열 수 있어요.',
  },
  { key: 'success_title', label: '참석 응답 후 제목', placeholder: 'See you there.', group: 'result' },
  { key: 'success_sub', label: '참석 응답 후 문구', placeholder: '2026 · 05 · 10', group: 'result' },
  {
    key: 'decline_title',
    label: '불참 응답 후 제목',
    placeholder: '아쉽지만 다음에 꼭 만나요',
    group: 'result',
  },
  {
    key: 'closed_message',
    label: '응답 마감 안내',
    placeholder: '응답이 마감되었어요. 감사합니다.',
    group: 'result',
  },
] as const;

export type TextKey = (typeof TEXT_FIELDS)[number]['key'];
export type TextSettings = Record<TextKey, string>;

export const TEXT_KEYS = TEXT_FIELDS.map((f) => f.key) as TextKey[];

export const TEXT_DEFAULTS: TextSettings = {
  subtitle: 'Welcome Party',
  title: '새가족 환영 잔치',
  event_date: '2026 · 05 · 10 · SAT',
  event_time: '18 : 00',
  event_venue: '본당 2층 친교실',
  event_map_url: '',
  success_title: 'See you there.',
  success_sub: '참석 응답이 전달됐어요',
  decline_title: '아쉽지만 다음에 꼭 만나요',
  closed_message: '응답이 마감되었어요. 감사합니다.',
};

export const TEXT_GROUPS = [
  { id: 'header', title: '제목' },
  { id: 'event', title: '행사 정보' },
  { id: 'result', title: '응답 후 안내' },
] as const;

export const DEFAULT_LANDING_IMAGE = '/landing.jpg';

export type SiteSettings = {
  texts: TextSettings;
  landingImage: string;
  rsvpOpen: boolean;
};

export const TEXT_MAX_LENGTH = 200;
