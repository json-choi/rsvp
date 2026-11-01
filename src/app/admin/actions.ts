'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSession, destroySession, requireAdmin, verifyPassword } from '@/lib/auth';
import { deleteRsvp, listRsvps, saveRsvpOpen, saveTexts } from '@/lib/db';
import { TEXT_KEYS, TEXT_MAX_LENGTH, type TextKey } from '@/lib/settings';

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  if (!password) return { error: '비밀번호를 입력해 주세요.' };

  let ok = false;
  try {
    ok = await verifyPassword(password);
  } catch (error) {
    console.error(error);
    return { error: '관리자 비밀번호가 서버에 설정되지 않았어요.' };
  }
  if (!ok) {
    // 무차별 대입을 조금이라도 늦춘다.
    await new Promise((r) => setTimeout(r, 600));
    return { error: '비밀번호가 맞지 않아요.' };
  }

  await createSession();
  redirect('/admin');
}

export async function logoutAction() {
  await destroySession();
  redirect('/admin/login');
}

type ActionResult = { ok: true } | { ok: false; error: string };

async function guarded(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: '로그인이 만료됐어요. 다시 로그인해 주세요.' };
  }
  try {
    await fn();
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' };
  }
}

export async function saveTextsAction(input: Record<string, string>): Promise<ActionResult> {
  const texts: Partial<Record<TextKey, string>> = {};
  for (const key of TEXT_KEYS) {
    if (typeof input[key] !== 'string') continue;
    const value = input[key].trim();
    if (value.length > TEXT_MAX_LENGTH) {
      return { ok: false, error: `${TEXT_MAX_LENGTH}자 이내로 입력해 주세요.` };
    }
    if (key === 'event_map_url' && value && !/^https?:\/\//i.test(value)) {
      return { ok: false, error: '지도 링크는 http:// 또는 https://로 시작해야 해요.' };
    }
    texts[key] = value;
  }
  return guarded(async () => {
    await saveTexts(texts);
    revalidatePath('/');
  });
}

export async function setRsvpOpenAction(open: boolean): Promise<ActionResult> {
  return guarded(async () => {
    await saveRsvpOpen(open);
    revalidatePath('/');
  });
}

export async function deleteRsvpAction(id: number): Promise<ActionResult> {
  if (!Number.isInteger(id)) return { ok: false, error: '잘못된 요청이에요.' };
  return guarded(async () => {
    await deleteRsvp(id);
    revalidatePath('/admin');
  });
}

export async function refreshRsvpsAction() {
  await requireAdmin();
  return listRsvps();
}
