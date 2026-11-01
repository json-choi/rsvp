import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getSiteSettings } from '@/lib/db';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { texts, landingImage } = await getSiteSettings();
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const base = host ? `${proto}://${host}` : undefined;
  const description = [texts.event_date, texts.event_time, texts.event_venue].filter(Boolean).join(' · ');

  return {
    metadataBase: base ? new URL(base) : undefined,
    title: texts.title,
    description,
    openGraph: {
      title: texts.title,
      description,
      locale: 'ko_KR',
      type: 'website',
      images: [{ url: landingImage }],
    },
  };
}

export default async function Home() {
  const settings = await getSiteSettings();
  return <HomeClient {...settings} />;
}
