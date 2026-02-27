'use server';

import { supabase } from '@/lib/supabase';

export async function submitRSVP(formData: FormData) {
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;

  if (!name || !phone) {
    return { success: false, error: 'Name and phone are required' };
  }

  try {
    const { error } = await supabase.from('rsvps').insert({ name, phone, attending: true });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to submit RSVP:', error);
    return { success: false, error: 'Failed to submit. Please try again later.' };
  }
}
