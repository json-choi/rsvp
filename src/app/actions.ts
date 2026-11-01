'use server';

import { getSiteSettings, upsertRsvp } from '@/lib/db';
import { digitsOnly, formatPhone, isValidPhone } from '@/lib/phone';

export type RsvpResult =
  | { ok: true; attending: boolean; updated: boolean; name: string; phone: string }
  | { ok: false; error: string; field?: 'name' | 'phone' };

export async function submitRsvp(input: {
  name: string;
  phone: string;
  attending: boolean;
}): Promise<RsvpResult> {
  const name = String(input.name ?? '').trim().replace(/\s+/g, ' ');
  const phoneDigits = digitsOnly(String(input.phone ?? ''));
  const attending = input.attending !== false;

  if (!name) return { ok: false, error: '이름을 입력해 주세요.', field: 'name' };
  if (name.length > 30) return { ok: false, error: '이름은 30자 이내로 입력해 주세요.', field: 'name' };
  if (!isValidPhone(phoneDigits)) {
    return { ok: false, error: '연락처를 정확히 입력해 주세요. (예: 010-1234-5678)', field: 'phone' };
  }

  try {
    const { rsvpOpen } = await getSiteSettings();
    if (!rsvpOpen) return { ok: false, error: '응답이 마감되었어요.' };

    const phone = formatPhone(phoneDigits);
    const { isNew } = await upsertRsvp({ name, phone, attending });
    return { ok: true, attending, updated: !isNew, name, phone };
  } catch (error) {
    console.error('RSVP 저장 실패', error);
    return { ok: false, error: '잠시 후 다시 시도해 주세요. 문제가 계속되면 담당자에게 알려 주세요.' };
  }
}
