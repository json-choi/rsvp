'use server';

import { cookies } from 'next/headers';
import { db } from '@/db';
import { rsvps, settings } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
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
  return await db.select().from(rsvps).orderBy(desc(rsvps.createdAt));
}

export async function updateLandingImage(url: string) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'true') {
    throw new Error('Unauthorized');
  }

  // Check if image setting exists
  const existingSetting = await db.select().from(settings).where(eq(settings.key, 'landing_image')).limit(1);
  
  if (existingSetting.length > 0) {
    await db.update(settings).set({ value: url }).where(eq(settings.key, 'landing_image'));
  } else {
    await db.insert(settings).values({ key: 'landing_image', value: url });
  }
  
  revalidatePath('/');
  return { success: true };
}

export async function getLandingImage() {
  const setting = await db.select().from(settings).where(eq(settings.key, 'landing_image')).limit(1);
  return setting.length > 0 ? setting[0].value : '/rending.png';
}
