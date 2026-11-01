import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getSiteSettings, listRsvps } from '@/lib/db';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect('/admin/login');
  const [settings, rsvps] = await Promise.all([getSiteSettings(), listRsvps()]);
  return <AdminDashboard initialSettings={settings} initialRsvps={rsvps} />;
}
