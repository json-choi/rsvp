'use server';

import { db } from '@/db';
import { rsvps } from '@/db/schema';

export async function submitRSVP(formData: FormData) {
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;

  if (!name || !phone) {
    return { success: false, error: 'Name and phone are required' };
  }

  try {
    await db.insert(rsvps).values({
      name,
      phone,
      attending: true,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to submit RSVP:', error);
    return { success: false, error: 'Failed to submit. Please try again later.' };
  }
}
