'use server';

import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function login(password: string) {
  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'true', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    return { success: true };
  }
  return { success: false, error: 'Invalid password' };
}

export async function getRSVPs() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'true') {
    throw new Error('Unauthorized');
  }
  const { data, error } = await supabaseAdmin.from('rsvps').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateLandingImage(url: string) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'true') {
    throw new Error('Unauthorized');
  }

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
