'use server';

import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function requireAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'true') {
    throw new Error('Unauthorized');
  }
}

export async function login(password: string) {
  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'true', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    return { success: true };
  }
  return { success: false, error: 'Invalid password' };
}

export async function getRSVPs() {
  await requireAuth();
  const { data, error } = await supabaseAdmin.from('rsvps').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateLandingImage(url: string) {
  await requireAuth();
  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({ key: 'landing_image', value: url }, { onConflict: 'key' });
  if (error) throw error;
  revalidatePath('/');
  return { success: true };
}

export async function getLandingImage() {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'landing_image')
    .single();
  return data?.value ?? '/rending.png';
}

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

export async function getTextSettings(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', [...TEXT_SETTING_KEYS]);
  const map: Record<string, string> = { ...TEXT_SETTING_DEFAULTS };
  data?.forEach(row => { map[row.key] = row.value; });
  return map;
}

export async function updateTextSettings(settings: Record<string, string>) {
  await requireAuth();
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
  const { error } = await supabaseAdmin.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
  revalidatePath('/');
  return { success: true };
}
